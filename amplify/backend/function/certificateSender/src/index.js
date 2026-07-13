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
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const nodemailer = require("nodemailer");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const ses = new SESClient({});

// Amplify injects table/bucket names with its own naming. Prefer those, but
// fall back to generic names so the handler also works if you set them manually.
const EVENT_TABLE =
  process.env.EVENT_TABLE || process.env.API_EVENTFLOW_EVENTTABLE_NAME;
const EVENTATTENDEE_TABLE =
  process.env.EVENTATTENDEE_TABLE ||
  process.env.API_EVENTFLOW_EVENTATTENDEETABLE_NAME;
const STORAGE_BUCKET =
  process.env.STORAGE_BUCKET ||
  process.env.STORAGE_S3EVENTFLOWSTORAGEA71837FD_BUCKETNAME;
const BYEVENT_INDEX = process.env.BYEVENT_INDEX || "byEvent";
const SES_FROM = process.env.SES_FROM;
// rev 2026-07-13c: "Probar certificado" usa el NOMBRE REAL del registro cuando
// el email de destino está inscrito en el evento (mismo extractName del envío
// masivo) — la prueba valida el pipeline completo; responde {name, nameSource}.
// rev 2026-07-13b: formAnswers AWSJSON tolerante (llega como array NATIVO del
// DocumentClient; JSON.parse lanzaba y todos los certificados salían como
// "Participante" e ignorando la pregunta de certificado). extractName detecta
// campo combinado O Nombre+Apellido(s) separados y concatena; isAffirmative
// reconoce valores de opción tipo "Siquiero"/"Noquiero" por prefijo.
// rev 2026-07-10: CLAIM de certificatesSentAt ANTES de enviar (condicional,
// mismo fix anti-duplicados que surveyManager: un timeout tras enviar pero
// antes de estampar hacía que los reintentos async duplicaran certificados);
// envío en lotes concurrentes de 10 (antes serial: cientos de PDFs no cabían
// en ningún timeout); Timeout CFN 25→900s.
// rev 2026-06-24: on-demand test-mode handler (POST /certificate-test) + CORS.
// Batch send now honors an optional certificatePosition.sendAt (scheduled time).
// Test accepts certificateKey/position overrides (probe before saving). Whole
// body wrapped in try/catch so failures return 500+CORS, not an opaque 502.
// MemorySize 1024MB (CFN) so embedPng on big templates doesn't OOM.
// resolvePosition merges { preset, fontPct, color } -> custom name size/color.
// (touch this string to bust the deploy hash if Amplify reports "No Change".)

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
// AWSJSON tolerante (fix 2026-07-13): el DocumentClient devuelve formAnswers
// como ARRAY NATIVO (AppSync guarda AWSJSON nativo en DynamoDB); JSON.parse de
// un array lanza y el catch silencioso hacía que TODOS los certificados
// salieran como "Participante" y que el filtro de la pregunta de certificado
// nunca aplicara (se enviaba también a quienes respondieron que no).
const parseAnswers = (raw) => {
  if (raw == null) return [];
  if (typeof raw !== "string") return Array.isArray(raw) ? raw : [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
};

const normTxt = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const answerValue = (f) => {
  const v = Array.isArray(f?.userData) ? f.userData[0] : f?.userData;
  return v == null ? "" : String(v).trim();
};

// Nombre a incrustar en el certificado. Los formularios varían: algunos usan
// UN campo combinado ("Nombre y apellido" / "Nombre completo"), otros campos
// SEPARADOS "Nombre" + "Apellido(s)" — se detectan ambos y se concatenan.
const extractName = (eventAttendee) => {
  const answers = parseAnswers(eventAttendee.formAnswers).filter(
    (a) => a && a.type !== "header" && a.type !== "paragraph"
  );
  const labelOf = (a) => normTxt(a.label) || normTxt(a.name);

  // 1) Campo combinado.
  const combined = answers.find((a) => {
    const l = labelOf(a);
    return (
      (l.includes("nombre") && l.includes("apellido")) ||
      l.includes("nombre completo") ||
      l.includes("full name")
    );
  });
  if (combined && answerValue(combined)) return answerValue(combined);

  // 2) Campos separados Nombre + Apellido(s) → concatenar.
  const first = answers.find((a) => {
    const l = labelOf(a);
    return (
      (l.includes("nombre") || l.includes("first name")) &&
      !l.includes("apellido") &&
      !l.includes("usuario") &&
      !l.includes("empresa")
    );
  });
  const last = answers.find((a) => {
    const l = labelOf(a);
    return (
      l.includes("apellido") || l.includes("last name") || l.includes("surname")
    );
  });
  const full = [first && answerValue(first), last && answerValue(last)]
    .filter(Boolean)
    .join(" ");
  if (full) return full;

  // 3) Último recurso: cualquier campo que mencione nombre/name.
  const any = answers.find((a) =>
    /nombre|name/i.test(`${a?.label || ""} ${a?.name || ""}`)
  );
  if (any && answerValue(any)) return answerValue(any);

  return eventAttendee.name || "";
};

// Matches the certificate question by label OR field name (real forms use
// name="certificado" with label "Desea recibir certificado de participación").
const CERT_QUESTION = /certificad|certificate/i;
// Option VALUES arrive squashed ("Siquiero"/"Noquiero") or as labels
// ("Sí quiero") — decide by normalized prefix, negatives win.
const isAffirmative = (v) => {
  const n = normTxt(v).replace(/[^a-z0-9]/g, "");
  if (!n || n.startsWith("no")) return false;
  return /^(si|yes|true|1)/.test(n);
};

// Whether this attendee should receive a certificate:
//   - the form HAS the certificate question -> only if they answered "Sí…"
//   - the form does NOT have it             -> send to everyone
const wantsCertificate = (eventAttendee) => {
  const answers = parseAnswers(eventAttendee.formAnswers);
  if (answers.length === 0) return true; // unreadable/absent -> don't block
  const field = answers.find((a) =>
    CERT_QUESTION.test(`${a?.label || ""} ${a?.name || ""}`)
  );
  if (!field) return true; // question not in the form -> send to everyone
  const selected = answerValue(field);
  // The answer may be stored as the option value or its label; resolve a label.
  let answer = selected;
  if (Array.isArray(field.values)) {
    const opt = field.values.find((v) => String(v?.value) === String(selected));
    if (opt && opt.label) answer = String(opt.label);
  }
  return isAffirmative(answer);
};

// Exposed only for offline verification of the pure helpers (no side effects).
exports._test = { parseAnswers, extractName, wantsCertificate, isAffirmative };

// certificatePosition is stored from the admin form as a JSON string holding a
// preset key (e.g. '"centro"'). Map each preset to drawing coordinates
// (top-left %, since the form offers preset positions, not raw coordinates).
const PRESET_POSITIONS = {
  "centro": { xPct: 50, yPct: 50, align: "center", fontPct: 6 },
  "centro-arriba": { xPct: 50, yPct: 30, align: "center", fontPct: 6 },
  "centro-abajo": { xPct: 50, yPct: 70, align: "center", fontPct: 6 },
  "inferior-izquierda": { xPct: 28, yPct: 85, align: "center", fontPct: 5 },
  "inferior-derecha": { xPct: 72, yPct: 85, align: "center", fontPct: 5 },
};

// Resolve the stored certificatePosition into drawing coordinates. Accepts a
// preset key string, an object (legacy/manual), or empty -> centered default.
const resolvePosition = (stored) => {
  let raw = stored;
  try {
    raw = JSON.parse(stored || '""');
  } catch (e) {
    /* keep raw */
  }
  if (typeof raw === "string") {
    return PRESET_POSITIONS[raw] || PRESET_POSITIONS["centro"];
  }
  if (raw && typeof raw === "object") {
    // New shape from the admin: { preset, fontPct?, color? }. Start from the
    // preset's coordinates and apply the optional size/color overrides. Legacy
    // hand-authored objects (with xPct/yPct) just pass through.
    if (raw.preset) {
      const base = PRESET_POSITIONS[raw.preset] || PRESET_POSITIONS["centro"];
      const merged = { ...base };
      if (raw.fontPct != null && !isNaN(Number(raw.fontPct)))
        merged.fontPct = Number(raw.fontPct);
      if (raw.color) merged.color = raw.color;
      return merged;
    }
    return raw;
  }
  return PRESET_POSITIONS["centro"];
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

// Build a one-page PDF with the attendee name drawn on top of the template.
// The template can be an image (PNG/JPG) or an existing PDF.
const buildCertificatePdf = async (templateBytes, contentType, name, pos) => {
  let pdf;
  let page;
  let pageWidth;
  let pageHeight;

  if (/pdf/i.test(contentType)) {
    pdf = await PDFDocument.load(templateBytes);
    page = pdf.getPages()[0];
    pageWidth = page.getWidth();
    pageHeight = page.getHeight();
  } else {
    pdf = await PDFDocument.create();
    const img = /png/i.test(contentType)
      ? await pdf.embedPng(templateBytes)
      : await pdf.embedJpg(templateBytes);
    pageWidth = img.width;
    pageHeight = img.height;
    page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = (pageWidth * (pos.fontPct || 6)) / 100;
  const textWidth = font.widthOfTextAtSize(name, fontSize);

  // certificatePosition uses top-left % ; pdf-lib origin is bottom-left.
  const cx = (pageWidth * (pos.xPct ?? 50)) / 100;
  const cy = pageHeight - (pageHeight * (pos.yPct ?? 50)) / 100;

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

const sendEmail = async (to, eventTitle, pdfBuffer, subject) => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const message = await transport.sendMail({
    from: SES_FROM,
    to,
    subject: subject || "Certificado Evento USFQ",
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

// HTTP response shape for the on-demand test endpoint (API Gateway).
const json = (statusCode, data) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  },
  body: JSON.stringify(data),
});

// On-demand test: generate ONE certificate from the event's template and email
// it to `email` (with a sample/given name). Does NOT touch attendees or mark the
// event as sent — it only proves the template/position/SES work.
const handleTest = async (body) => {
  const eventId = body.eventId;
  const email = String(body.email || "").trim();
  const subjectOverride = body.subject ? String(body.subject).trim() : undefined;
  if (!eventId || !email)
    return json(400, { error: "eventId y email son requeridos" });

  // If the destination email is REGISTERED in the event, use the real name
  // extraction (same code path as the batch send) so the test proves the
  // name pipeline end-to-end; otherwise fall back to body.name / sample.
  let name = String(body.name || "").trim();
  let nameSource = name ? "param" : "sample";
  try {
    let lastKey;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: EVENTATTENDEE_TABLE,
          IndexName: BYEVENT_INDEX,
          KeyConditionExpression: "eventID = :e",
          ExpressionAttributeValues: { ":e": eventId },
          ExclusiveStartKey: lastKey,
        })
      );
      const match = (page.Items || []).find(
        (a) => String(a.email || "").toLowerCase() === email.toLowerCase()
      );
      if (match) {
        const extracted = extractName(match);
        if (extracted) {
          name = extracted;
          nameSource = "registro";
        }
        break;
      }
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);
  } catch (e) {
    console.error("test: attendee name lookup failed", e);
  }
  if (!name) name = "Nombre de Prueba";

  // Everything below is wrapped so ANY failure (DynamoDB, S3, PDF render, SES)
  // returns a clean 500 WITH CORS headers instead of an uncaught crash that
  // API Gateway surfaces as an opaque 502 with no Access-Control header.
  try {
    const res = await ddb.send(
      new GetCommand({ TableName: EVENT_TABLE, Key: { id: eventId } })
    );
    const ev = res.Item;
    if (!ev) return json(404, { error: "Evento no encontrado" });

    // Let the admin test the template/position currently in the form (already
    // uploaded to S3) WITHOUT saving the event first; fall back to saved values.
    const certKey = body.certificateKey || ev.certificate;
    const positionRaw = body.position || ev.certificatePosition;
    if (!certKey)
      return json(400, {
        error: "Sube una plantilla de certificado antes de probar",
      });

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: s3KeyFor(certKey),
      })
    );
    const templateBytes = await streamToBuffer(obj.Body);
    const contentType = obj.ContentType || "image/png";
    const pos = resolvePosition(positionRaw);
    const pdf = await buildCertificatePdf(templateBytes, contentType, name, pos);
    await sendEmail(email, ev.title || "Evento", pdf, subjectOverride);
    return json(200, { ok: true, sentTo: email, name, nameSource });
  } catch (e) {
    console.error("test certificate failed:", e);
    return json(500, { error: e?.message || String(e) });
  }
};

// Manual corrected re-send (POST /certificate-test { eventId, sendAll: true,
// subject? }): sends to EVERY registered attendee that asked for a certificate,
// with real names, RE-SENDING even if certificatesSentAt exists — the admin
// decides (used to correct a bad batch). Stamps certificatesSentAt at the end.
const handleSendAll = async (body) => {
  const eventId = body.eventId;
  const subject = body.subject ? String(body.subject).trim() : undefined;
  if (!eventId) return json(400, { error: "eventId es requerido" });
  try {
    const res = await ddb.send(
      new GetCommand({ TableName: EVENT_TABLE, Key: { id: eventId } })
    );
    const ev = res.Item;
    if (!ev) return json(404, { error: "Evento no encontrado" });
    if (!ev.certificate)
      return json(400, { error: "El evento no tiene plantilla de certificado" });

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: s3KeyFor(ev.certificate),
      })
    );
    const templateBytes = await streamToBuffer(obj.Body);
    const contentType = obj.ContentType || "image/png";
    const pos = resolvePosition(ev.certificatePosition);

    const recipients = [];
    let lastKey;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: EVENTATTENDEE_TABLE,
          IndexName: BYEVENT_INDEX,
          KeyConditionExpression: "eventID = :e",
          ExpressionAttributeValues: { ":e": eventId },
          ExclusiveStartKey: lastKey,
        })
      );
      for (const att of page.Items || []) {
        if (!att.email) continue;
        if (!wantsCertificate(att)) continue;
        recipients.push(att);
      }
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    if (recipients.length === 0)
      return json(400, {
        error: "No hay inscritos que hayan pedido certificado",
      });

    const CERT_BATCH = 10;
    let sent = 0;
    for (let i = 0; i < recipients.length; i += CERT_BATCH) {
      const batch = recipients.slice(i, i + CERT_BATCH);
      const results = await Promise.allSettled(
        batch.map(async (att) => {
          const name = extractName(att) || "Participante";
          const pdf = await buildCertificatePdf(
            templateBytes,
            contentType,
            name,
            pos
          );
          await sendEmail(att.email, ev.title || "Evento", pdf, subject);
        })
      );
      results.forEach((r, j) => {
        if (r.status === "fulfilled") sent += 1;
        else
          console.error(
            `manual certificate failed for ${batch[j].email}`,
            r.reason
          );
      });
    }

    await ddb.send(
      new UpdateCommand({
        TableName: EVENT_TABLE,
        Key: { id: eventId },
        UpdateExpression: "SET certificatesSentAt = :now",
        ExpressionAttributeValues: { ":now": new Date().toISOString() },
      })
    );
    console.log(
      `Manual certificates sent for event ${eventId} (${ev.title}): ${sent}/${recipients.length}`
    );
    return json(200, { ok: true, sent, eligible: recipients.length });
  } catch (e) {
    console.error("manual certificate send failed:", e);
    return json(500, { error: e?.message || String(e) });
  }
};

exports.handler = async (event) => {
  // On-demand REST via API Gateway: single test send { eventId, email, name?,
  // subject? } or manual batch { eventId, sendAll: true, subject? }.
  const method = event?.httpMethod || event?.requestContext?.http?.method;
  if (method) {
    if (method === "OPTIONS") return json(200, { ok: true });
    if (method !== "POST")
      return json(405, { error: `Method ${method} not allowed` });
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { error: "Cuerpo inválido" });
    }
    return body.sendAll === true ? handleSendAll(body) : handleTest(body);
  }

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
    // Optional scheduled send time, stored in the certificatePosition JSON as
    // `sendAt` (ISO). If set, certificates go out at/after that moment; if not,
    // they go out once the event has ended (legacy behavior).
    let scheduledAt;
    try {
      const cfg = JSON.parse(event.certificatePosition || "null");
      if (cfg && typeof cfg === "object" && cfg.sendAt) scheduledAt = cfg.sendAt;
    } catch (e) {
      /* not JSON / no schedule */
    }
    const triggerIso = scheduledAt || event.endDate || event.date;
    if (!triggerIso || new Date(triggerIso).getTime() > now) continue; // not yet
    if (!event.certificate) continue;

    const pos = resolvePosition(event.certificatePosition);

    // Load template once per event.
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: s3KeyFor(event.certificate),
      })
    );
    const templateBytes = await streamToBuffer(obj.Body);
    const contentType = obj.ContentType || "image/png";

    // CLAIM FIRST (fix 2026-07-10, mismo bug que surveyManager): estampar
    // certificatesSentAt de forma atómica ANTES de enviar. Si la función se
    // queda sin tiempo a mitad del lote, los reintentos async de Lambda y las
    // corridas horarias siguientes quedan en no-op en vez de duplicar los
    // certificados de todos. El claim va DESPUÉS de validar que la plantilla
    // carga, para no bloquear eventos que aún no pueden enviar.
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: EVENT_TABLE,
          Key: { id: event.id },
          UpdateExpression: "SET certificatesSentAt = :now",
          ConditionExpression: "attribute_not_exists(certificatesSentAt)",
          ExpressionAttributeValues: { ":now": new Date().toISOString() },
        })
      );
    } catch (e) {
      if (e?.name === "ConditionalCheckFailedException") continue; // ya reclamado
      throw e;
    }

    // All attendees of this event (collected first, then sent in concurrent
    // batches — serial PDF+email for hundreds of attendees outlives any
    // timeout).
    const recipients = [];
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
        // Honor the "¿Desea recibir certificado de participación?" answer.
        if (!wantsCertificate(att)) continue;
        recipients.push(att);
      }
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    const CERT_BATCH = 10;
    let sentCount = 0;
    for (let i = 0; i < recipients.length; i += CERT_BATCH) {
      const batch = recipients.slice(i, i + CERT_BATCH);
      const results = await Promise.allSettled(
        batch.map(async (att) => {
          const name = extractName(att) || "Participante";
          const pdf = await buildCertificatePdf(templateBytes, contentType, name, pos);
          await sendEmail(att.email, event.title, pdf);
        })
      );
      results.forEach((r, j) => {
        if (r.status === "fulfilled") sentCount += 1;
        else console.error(`certificate failed for ${batch[j].email}`, r.reason);
      });
    }

    console.log(
      `Certificates sent for event ${event.id} (${event.title}): ${sentCount}/${recipients.length}`
    );
  }

  return { statusCode: 200 };
};
