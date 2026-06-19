/**
 * certificateSender — scheduled Lambda (EventBridge, e.g. hourly).
 *
 * For every Event with sendCertificates = true whose end date has passed and
 * that has not been sent yet (certificatesSentAt empty), it:
 *   1. loads the certificate template image from S3,
 *   2. for each attendee, renders a personalized PDF with the attendee name at
 *      the position configured in certificatePosition,
 *   3. emails it via SES with the message "Gracias por participar…",
 *   4. stamps certificatesSentAt so it never re-sends.
 *
 * ── IMPORTANT (untested reference; wire it up before relying on it) ──
 * Create the function with the Amplify CLI so the CloudFormation + IAM are
 * generated, then paste this handler. See README.md in this folder for the
 * full runbook (schedule, table/bucket access, SES sender verification, env vars).
 *
 * Expected environment variables (set when wiring the function):
 *   EVENT_TABLE          DynamoDB table name for Event
 *   EVENTATTENDEE_TABLE  DynamoDB table name for EventAttendee
 *   BYEVENT_INDEX        GSI name on EventAttendee for eventID (default "byEvent")
 *   STORAGE_BUCKET       S3 bucket of the Amplify storage category
 *   SES_FROM             Verified SES sender, e.g. "eventos@usfq.edu.ec"
 */
const {
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const nodemailer = require("nodemailer");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const ses = new SESClient({});

const {
  EVENT_TABLE,
  EVENTATTENDEE_TABLE,
  BYEVENT_INDEX = "byEvent",
  STORAGE_BUCKET,
  SES_FROM,
} = process.env;

// Files uploaded from the app with the default ("guest") access level live
// under the "public/" prefix in the bucket.
const s3KeyFor = (key) =>
  /^public\//.test(key) ? key : `public/${key}`;

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

// Best-effort: pull the attendee name out of the stored form answers.
const extractName = (eventAttendee) => {
  try {
    const answers = JSON.parse(eventAttendee.formAnswers || "[]");
    const field = answers.find((a) =>
      /nombre|name/i.test(a?.name || a?.label || "")
    );
    const val = field && (Array.isArray(field.userData) ? field.userData[0] : field.userData);
    if (val) return String(val).trim();
  } catch (e) {
    /* ignore */
  }
  return eventAttendee.name || "";
};

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#1a1a1a");
  if (!m) return rgb(0.1, 0.1, 0.1);
  return rgb(
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255
  );
};

// Build a one-page PDF: template image as the page, name drawn on top.
const buildCertificatePdf = async (templateBytes, contentType, name, pos) => {
  const pdf = await PDFDocument.create();
  const img = /png/i.test(contentType)
    ? await pdf.embedPng(templateBytes)
    : await pdf.embedJpg(templateBytes);

  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = (img.width * (pos.fontPct || 6)) / 100;
  const textWidth = font.widthOfTextAtSize(name, fontSize);

  // certificatePosition uses top-left % ; pdf-lib origin is bottom-left.
  const cx = (img.width * (pos.xPct ?? 50)) / 100;
  const cy = img.height - (img.height * (pos.yPct ?? 50)) / 100;

  let x = cx;
  if ((pos.align || "center") === "center") x = cx - textWidth / 2;
  else if (pos.align === "right") x = cx - textWidth;

  page.drawText(name, {
    x,
    y: cy - fontSize / 2,
    size: fontSize,
    font,
    color: hexToRgb(pos.color),
  });

  return Buffer.from(await pdf.save());
};

const sendEmail = async (to, eventTitle, pdfBuffer) => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const message = await transport.sendMail({
    from: SES_FROM,
    to,
    subject: `Tu certificado — ${eventTitle}`,
    text: `Gracias por participar en ${eventTitle}. Adjunto encontrarás tu certificado.`,
    html: `<p>Gracias por participar en <strong>${eventTitle}</strong>.</p><p>Aquí tienes tu certificado.</p>`,
    attachments: [
      { filename: "certificado.pdf", content: pdfBuffer, contentType: "application/pdf" },
    ],
  });
  await ses.send(
    new SendRawEmailCommand({ RawMessage: { Data: message.message } })
  );
};

exports.handler = async () => {
  const now = Date.now();

  // Events that opted in and have not been processed yet.
  const events = await ddb.send(
    new ScanCommand({
      TableName: EVENT_TABLE,
      FilterExpression:
        "sendCertificates = :t AND attribute_not_exists(certificatesSentAt)",
      ExpressionAttributeValues: { ":t": true },
    })
  );

  for (const event of events.Items || []) {
    const endIso = event.endDate || event.date;
    if (!endIso || new Date(endIso).getTime() > now) continue; // not finished yet
    if (!event.certificate) continue;

    let pos = {};
    try {
      pos = JSON.parse(event.certificatePosition || "{}");
    } catch (e) {
      pos = {};
    }

    // Load template once per event.
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: s3KeyFor(event.certificate),
      })
    );
    const templateBytes = await streamToBuffer(obj.Body);
    const contentType = obj.ContentType || "image/png";

    // All attendees of this event.
    let lastKey;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: EVENTATTENDEE_TABLE,
          IndexName: BYEVENT_INDEX,
          KeyConditionExpression: "eventID = :e",
          ExpressionAttributeValues: { ":e": event.id },
          ExclusiveStartKey: lastKey,
        })
      );
      for (const att of page.Items || []) {
        if (!att.email) continue;
        const name = extractName(att) || "Participante";
        try {
          const pdf = await buildCertificatePdf(templateBytes, contentType, name, pos);
          await sendEmail(att.email, event.title, pdf);
        } catch (e) {
          console.error(`certificate failed for ${att.email}`, e);
        }
      }
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    // Mark as sent so we never re-send.
    await ddb.send(
      new UpdateCommand({
        TableName: EVENT_TABLE,
        Key: { id: event.id },
        UpdateExpression: "SET certificatesSentAt = :now",
        ExpressionAttributeValues: { ":now": new Date().toISOString() },
      })
    );
    console.log(`Certificates sent for event ${event.id} (${event.title})`);
  }

  return { statusCode: 200 };
};
