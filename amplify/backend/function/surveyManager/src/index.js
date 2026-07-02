/**
 * surveyManager — event feedback surveys (scheduled sender + REST endpoints).
 *
 * Mirrors certificateSender's shape (DynamoDB direct + SES via nodemailer). The
 * AI analysis runs on Claude through EITHER of two backends, chosen by env vars:
 *   • Amazon Bedrock (all-AWS, no key) — set BEDROCK_MODEL_ID. Auth is the
 *     Lambda's IAM role; nothing external.
 *   • Anthropic API (first-party) — set ANTHROPIC_API_KEY (plain env var or an
 *     Amplify secret stored in SSM). ANALYSIS_MODEL picks the model.
 * If BEDROCK_MODEL_ID is set it wins; otherwise it falls back to the API key.
 *
 * Modes:
 *   • Scheduled (EventBridge, hourly): for every active Survey whose event has
 *     ended and that hasn't been sent, email the survey link to every CHECKED-IN
 *     attendee, then stamp sentAt.
 *   • POST /survey-test  { eventId, email }   → send ONE invite to `email`.
 *   • POST /survey-analyze { eventId }         → analyze responses, store insights.
 *
 * Env vars:
 *   API_EVENTFLOW_EVENTTABLE_NAME / _EVENTATTENDEETABLE_NAME /
 *   _SURVEYTABLE_NAME / _SURVEYRESPONSETABLE_NAME
 *   SES_FROM           verified SES sender, e.g. "tickets@eventflow.ec"
 *   APP_URL            public origin for links, default "https://eventflow.ec"
 *   -- Bedrock backend:
 *   BEDROCK_REGION     region where Claude is enabled, default "us-east-1"
 *   BEDROCK_MODEL_ID   enabled model / inference-profile id (setting this selects Bedrock)
 *   -- Anthropic backend:
 *   ANTHROPIC_API_KEY  plain value OR Amplify-secret SSM path (starts with "/")
 *   ANALYSIS_MODEL     model id, default "claude-opus-4-8"
 * rev 2026-07-02b (insights se guarda como Map nativo, no string — evita doble encoding AWSJSON)
 */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const nodemailer = require("nodemailer");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

const EVENT_TABLE = process.env.API_EVENTFLOW_EVENTTABLE_NAME;
const EVENTATTENDEE_TABLE = process.env.API_EVENTFLOW_EVENTATTENDEETABLE_NAME;
const SURVEY_TABLE = process.env.API_EVENTFLOW_SURVEYTABLE_NAME;
const SURVEYRESPONSE_TABLE = process.env.API_EVENTFLOW_SURVEYRESPONSETABLE_NAME;
const BYEVENT_ATT_INDEX = "byEvent";
const BYEVENT_RESP_INDEX = "byEventResponse";
const SES_FROM = process.env.SES_FROM;
const APP_URL = (process.env.APP_URL || "https://eventflow.ec").replace(/\/$/, "");
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID;
const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || "claude-opus-4-8";

/* ─────────────────────────── helpers ─────────────────────────── */

const parseJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch (e) {
    return fallback;
  }
};

const surveyLink = (eventId, token) =>
  `${APP_URL}/landing/${eventId}/encuesta${token ? `?a=${encodeURIComponent(token)}` : ""}`;

const inviteHtml = (eventTitle, intro, link) => `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
    <h2 style="color:#0b1f3a">${eventTitle}</h2>
    <p>${intro || "Gracias por asistir. Tu opinión nos ayuda a mejorar los próximos eventos; toma menos de 2 minutos y es anónima."}</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#e11d48;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">
        Responder la encuesta
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280">Si el botón no funciona, copia este enlace:<br>${link}</p>
  </div>`;

const sendInvite = async (to, eventTitle, subject, intro, link) => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const message = await transport.sendMail({
    from: SES_FROM,
    to,
    subject: subject || "Cuéntanos tu experiencia — Evento USFQ",
    text: `${intro || "Gracias por asistir."}\n\nResponde la encuesta: ${link}`,
    html: inviteHtml(eventTitle, intro, link),
  });
  await ses.send(new SendRawEmailCommand({ RawMessage: { Data: message.message } }));
};

const getEvent = async (eventId) => {
  const res = await ddb.send(
    new GetCommand({ TableName: EVENT_TABLE, Key: { id: eventId } })
  );
  return res.Item;
};

const getSurveyByEvent = async (eventId) => {
  const res = await ddb.send(
    new ScanCommand({
      TableName: SURVEY_TABLE,
      FilterExpression: "surveyEventId = :e",
      ExpressionAttributeValues: { ":e": eventId },
    })
  );
  return (res.Items || [])[0];
};

const getResponses = async (eventId) => {
  const items = [];
  let lastKey;
  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: SURVEYRESPONSE_TABLE,
        IndexName: BYEVENT_RESP_INDEX,
        KeyConditionExpression: "eventID = :e",
        ExpressionAttributeValues: { ":e": eventId },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);
  return items;
};

/* ─────────────────────────── AI analysis ─────────────────────────── */

// Extract the first balanced JSON object from a text blob (robust to prose/fences).
const extractJson = (text) => {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("La IA no devolvió JSON");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("JSON incompleto de la IA");
};

const buildDigest = (responses) => {
  const lines = [];
  responses.forEach((r, i) => {
    const answers = parseJson(r.answers, []);
    if (!Array.isArray(answers)) return;
    const parts = [];
    answers.forEach((f) => {
      if (f.type === "header" || f.type === "paragraph") return;
      const label = String(f.label || f.name || "").replace(/<[^>]*>/g, "").trim();
      const val = Array.isArray(f.userData)
        ? f.userData.filter(Boolean).join(", ")
        : f.userData;
      if (label && val != null && String(val).trim()) {
        parts.push(`  - ${label}: ${val}`);
      }
    });
    if (parts.length) lines.push(`Respuesta ${i + 1}:\n${parts.join("\n")}`);
  });
  return lines.join("\n\n");
};

const SHAPE = `{
  "executiveSummary": "2-3 frases para directivos",
  "overallSentiment": { "score": 0-100, "label": "Muy positivo|Positivo|Neutral|Negativo|Muy negativo" },
  "themes": [ { "title": "tema", "sentiment": "positivo|neutral|negativo", "mentions": entero, "summary": "1-2 frases", "sampleQuotes": ["cita textual corta"] } ],
  "strengths": ["fortaleza"],
  "concerns": ["preocupación"],
  "recommendations": ["recomendación accionable"]
}`;

const SYSTEM =
  "Eres analista de experiencia de eventos de la USFQ. Analizas el feedback " +
  "abierto de asistentes y entregas insights claros y accionables para los " +
  "organizadores (stakeholders). Sé honesto y específico. Responde SIEMPRE en " +
  "español. Devuelve ÚNICAMENTE un objeto JSON válido con la estructura pedida, " +
  "sin texto adicional y sin markdown. REGLA CRÍTICA: tu análisis debe ser " +
  "PROPORCIONAL a la evidencia. Nunca inventes conclusiones que las respuestas " +
  "no sostienen. Si hay muy pocas respuestas o su contenido no es sustantivo " +
  "(texto de prueba como 'test', 'asdf', monosílabos, campos vacíos o simples " +
  "identificadores de opción), el executiveSummary debe decirlo en 1-2 frases " +
  "('Aún no hay suficiente feedback sustantivo para un análisis confiable...') " +
  "y themes, strengths, concerns y recommendations deben quedar VACÍOS ([]) o " +
  "casi vacíos. Es mejor un análisis corto y honesto que uno largo e inventado.";

const userPrompt = (eventTitle, responses) =>
  `Evento: ${eventTitle}\nTotal de respuestas: ${responses.length}\n\n` +
  `Respuestas de la encuesta:\n\n${buildDigest(responses)}\n\n` +
  "Analiza este feedback (resumen ejecutivo, sentimiento general, temas " +
  "principales con cuántas respuestas los mencionan y citas de ejemplo, " +
  "fortalezas, preocupaciones y recomendaciones accionables para el próximo " +
  "evento). Básate SOLO en lo que las respuestas realmente dicen: no rellenes " +
  "ni especules. Si el material no da para una sección, devuélvela vacía. Solo " +
  "cita textualmente frases escritas por asistentes (nunca valores mecánicos " +
  `como 'option-1').\n\nDevuelve SOLO este JSON:\n${SHAPE}`;

// Bedrock backend via the model-agnostic Converse API: works with ANY chat
// model in the catalog (Gemma, Nova, Claude…) — switching models is just the
// BEDROCK_MODEL_ID env var, no code change. Auth is the Lambda's IAM role.
// The system instructions ride inside the user message because some open
// models (e.g. Gemma) reject Converse's dedicated `system` field.
const analyzeBedrock = async (eventTitle, responses) => {
  const {
    BedrockRuntimeClient,
    ConverseCommand,
  } = require("@aws-sdk/client-bedrock-runtime");
  const bedrock = new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
  });
  const res = await bedrock.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            { text: `${SYSTEM}\n\n${userPrompt(eventTitle, responses)}` },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 4000 },
    })
  );
  const parts = res?.output?.message?.content || [];
  const text = parts.map((p) => p.text || "").join("");
  if (!text) throw new Error("La IA no devolvió contenido");
  return extractJson(text);
};

// Resolve the Anthropic key: plain env value, or an Amplify secret (SSM path).
let cachedKey = null;
const getApiKey = async () => {
  if (cachedKey) return cachedKey;
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw) throw new Error("Configura BEDROCK_MODEL_ID (Bedrock) o ANTHROPIC_API_KEY");
  if (!raw.startsWith("/")) {
    cachedKey = raw;
    return raw;
  }
  const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
  const ssm = new SSMClient({});
  const out = await ssm.send(
    new GetParameterCommand({ Name: raw, WithDecryption: true })
  );
  cachedKey = out.Parameter.Value;
  return cachedKey;
};

// Anthropic first-party backend.
const analyzeAnthropic = async (eventTitle, responses) => {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: await getApiKey() });
  const msg = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(eventTitle, responses) }],
  });
  const textBlock = (msg.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("La IA no devolvió contenido");
  return extractJson(textBlock.text);
};

const analyze = (eventTitle, responses) =>
  BEDROCK_MODEL_ID
    ? analyzeBedrock(eventTitle, responses)
    : analyzeAnthropic(eventTitle, responses);

/* ─────────────────────────── REST ─────────────────────────── */

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

const handleTest = async (body) => {
  const eventId = body.eventId;
  const email = String(body.email || "").trim();
  if (!eventId || !email)
    return json(400, { error: "eventId y email son requeridos" });
  const [ev, survey] = await Promise.all([
    getEvent(eventId),
    getSurveyByEvent(eventId),
  ]);
  if (!ev) return json(404, { error: "Evento no encontrado" });
  if (!survey) return json(400, { error: "Guarda la encuesta antes de probar" });
  await sendInvite(
    email,
    ev.title || "Evento",
    survey.emailSubject,
    survey.emailIntro,
    surveyLink(eventId, null)
  );
  return json(200, { ok: true, sentTo: email });
};

const handleAnalyze = async (body) => {
  const eventId = body.eventId;
  if (!eventId) return json(400, { error: "eventId es requerido" });
  const [ev, survey] = await Promise.all([
    getEvent(eventId),
    getSurveyByEvent(eventId),
  ]);
  if (!survey) return json(404, { error: "No hay encuesta para este evento" });
  const responses = await getResponses(eventId);
  if (responses.length === 0)
    return json(400, { error: "Aún no hay respuestas para analizar" });

  const insights = await analyze(ev?.title || "Evento", responses);
  const nowIso = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: SURVEY_TABLE,
      Key: { id: survey.id },
      UpdateExpression: "SET insights = :i, insightsAt = :t",
      // Objeto nativo (Map), NO JSON.stringify: AWSJSON re-encodea los strings
      // al leerlos por GraphQL y el dashboard recibiría doble-encoded.
      ExpressionAttributeValues: { ":i": insights, ":t": nowIso },
    })
  );
  return json(200, { ok: true, insights, insightsAt: nowIso });
};

/* ─────────────────────────── scheduled ─────────────────────────── */

const runScheduled = async () => {
  const now = Date.now();
  const surveys = await ddb.send(
    new ScanCommand({
      TableName: SURVEY_TABLE,
      FilterExpression: "active = :t AND attribute_not_exists(sentAt)",
      ExpressionAttributeValues: { ":t": true },
    })
  );

  for (const survey of surveys.Items || []) {
    const eventId = survey.surveyEventId;
    if (!eventId) continue;
    const ev = await getEvent(eventId);
    if (!ev) continue;

    const triggerIso = survey.sendAt || ev.endDate || ev.date;
    if (!triggerIso || new Date(triggerIso).getTime() > now) continue;
    const questions = parseJson(survey.questions, []);
    if (!Array.isArray(questions) || questions.length === 0) continue;

    const sentTo = new Set();
    let lastKey;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: EVENTATTENDEE_TABLE,
          IndexName: BYEVENT_ATT_INDEX,
          KeyConditionExpression: "eventID = :e",
          ExpressionAttributeValues: { ":e": eventId },
          ExclusiveStartKey: lastKey,
        })
      );
      for (const att of page.Items || []) {
        if (!att.email || att.checkIn !== true) continue;
        if (sentTo.has(att.email)) continue;
        sentTo.add(att.email);
        try {
          await sendInvite(
            att.email,
            ev.title || "Evento",
            survey.emailSubject,
            survey.emailIntro,
            surveyLink(eventId, att.id)
          );
        } catch (e) {
          console.error(`survey invite failed for ${att.email}`, e);
        }
      }
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    await ddb.send(
      new UpdateCommand({
        TableName: SURVEY_TABLE,
        Key: { id: survey.id },
        UpdateExpression: "SET sentAt = :now",
        ExpressionAttributeValues: { ":now": new Date().toISOString() },
      })
    );
  }
  return { ok: true };
};

/* ─────────────────────────── handler ─────────────────────────── */

exports.handler = async (event) => {
  const method = event?.httpMethod || event?.requestContext?.http?.method;
  if (method) {
    if (method === "OPTIONS") return json(200, { ok: true });
    if (method !== "POST") return json(405, { error: `Method ${method} not allowed` });
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { error: "Cuerpo inválido" });
    }
    const path = event.path || event.rawPath || event.resource || "";
    try {
      if (/survey-analyze/.test(path)) return await handleAnalyze(body);
      if (/survey-test/.test(path)) return await handleTest(body);
      return json(404, { error: `Ruta no encontrada: ${path}` });
    } catch (e) {
      console.error("survey REST failed:", e);
      return json(500, { error: e?.message || String(e) });
    }
  }
  return runScheduled();
};
