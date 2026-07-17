// Tests de los helpers puros del Lambda surveyManager (via exports._test):
// parseJson, surveyLink, inviteHtml, extractJson, buildDigest,
// normalizeQuestions, questionsDigest y userPrompt. Sin red: solo funciones
// puras. Cobertura para SonarQube vía `npm run test:coverage`.
//
// OJO — BUG REAL EN EL LAMBDA (pendiente de fix en el código de la app):
// index.js asigna `exports._test = { ..., normalizeQuestions, questionsDigest,
// userPrompt }` ANTES de que esas `const` se inicialicen (TDZ), así que el
// require directo revienta con "Cannot access 'normalizeQuestions' before
// initialization" — el Lambda entero falla al cargar en producción. Mientras
// no se corrija, este archivo carga el módulo con un shim: mueve esa línea al
// final del source y lo evalúa instrumentado con istanbul (para que la
// cobertura cuente igual) usando el require nativo del propio lambda (sus
// node_modules viven junto a él). Cuando el bug se arregle, el require directo
// del `try` vuelve a mandar y el shim queda muerto.
const fs = require("fs");
const path = require("path");
const Module = require("module");
const util = require("util");

// El SDK de AWS necesita TextEncoder/TextDecoder, que el sandbox jsdom no trae.
if (typeof global.TextEncoder === "undefined") global.TextEncoder = util.TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = util.TextDecoder;

// Con slash final a propósito: surveyLink debe recortarlo (replace /\/$/).
process.env.APP_URL = "https://test.eventflow.ec/";
// Tablas/remitente/backend de IA: el módulo los lee al cargarse.
process.env.API_EVENTFLOW_EVENTTABLE_NAME = "Event-test";
process.env.API_EVENTFLOW_EVENTATTENDEETABLE_NAME = "EventAttendee-test";
process.env.API_EVENTFLOW_SURVEYTABLE_NAME = "Survey-test";
process.env.API_EVENTFLOW_SURVEYRESPONSETABLE_NAME = "SurveyResponse-test";
process.env.SES_FROM = "encuestas@test.ec";
process.env.BEDROCK_MODEL_ID = "us.test.claude-v9"; // con esto gana Bedrock

const LAMBDA = path.resolve(
  __dirname,
  "../../amplify/backend/function/surveyManager/src/index.js"
);

/* ── Mocks de frontera para el HANDLER ───────────────────────────────────────
 * El lambda trae sus PROPIOS node_modules: jest mockea por módulo RESUELTO,
 * así que cada paquete se registra por la ruta absoluta que resuelve el
 * require DEL LAMBDA. Los jest.fn compartidos se reconfiguran por test
 * (resetMocks:true de CRA los limpia antes de cada uno). */
const fromLambda = (id) =>
  require.resolve(id, { paths: [path.dirname(LAMBDA)] });

const ddbSend = jest.fn();
const sesSend = jest.fn();
const sendMail = jest.fn();
const bedrockSend = jest.fn();

// Clase fake CON NOMBRE real: guarda el input y marca el tipo de comando.
const cmdClass = (type) =>
  ({
    [type]: class {
      constructor(input) {
        this.input = input;
        this.__type = type;
      }
    },
  }[type]);

jest.doMock(fromLambda("@aws-sdk/client-dynamodb"), () => ({
  DynamoDBClient: class {},
}));
jest.doMock(fromLambda("@aws-sdk/lib-dynamodb"), () => ({
  DynamoDBDocumentClient: { from: () => ({ send: (cmd) => ddbSend(cmd) }) },
  ScanCommand: cmdClass("ScanCommand"),
  QueryCommand: cmdClass("QueryCommand"),
  GetCommand: cmdClass("GetCommand"),
  UpdateCommand: cmdClass("UpdateCommand"),
}));
jest.doMock(fromLambda("@aws-sdk/client-ses"), () => ({
  SESClient: class {
    send(cmd) {
      return sesSend(cmd);
    }
  },
  SendRawEmailCommand: cmdClass("SendRawEmailCommand"),
}));
jest.doMock(fromLambda("nodemailer"), () => ({
  createTransport: () => ({ sendMail: (opts) => sendMail(opts) }),
}));
// analyzeBedrock lo requiere de forma perezosa dentro de la función.
jest.doMock(fromLambda("@aws-sdk/client-bedrock-runtime"), () => ({
  BedrockRuntimeClient: class {
    send(cmd) {
      return bedrockSend(cmd);
    }
  },
  ConverseCommand: cmdClass("ConverseCommand"),
}));

const loadTestExports = () => {
  try {
    // Camino feliz (post-fix del TDZ): jest instrumenta y cachea normal.
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(LAMBDA)._test;
  } catch (e) {
    if (!(e instanceof ReferenceError)) throw e;
    const src = fs.readFileSync(LAMBDA, "utf8");
    const exportLine = src.match(/^exports\._test\s*=.*$/m);
    if (!exportLine) throw new Error("No encontré exports._test en el lambda");
    const fixed = src.replace(/^exports\._test\s*=.*$/m, "") + "\n" + exportLine[0] + "\n";
    // eslint-disable-next-line global-require
    const babel = require("@babel/core");
    const { code } = babel.transformSync(fixed, {
      filename: LAMBDA,
      babelrc: false,
      configFile: false,
      sourceType: "script",
      compact: false,
      plugins: [require.resolve("babel-plugin-istanbul")],
    });
    const mod = { exports: {} };
    const nativeRequire = Module.createRequire(LAMBDA);
    // eslint-disable-next-line no-new-func
    const wrapper = new Function(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      code
    );
    wrapper(mod.exports, nativeRequire, mod, LAMBDA, path.dirname(LAMBDA));
    return mod.exports._test;
  }
};

const {
  parseJson,
  surveyLink,
  inviteHtml,
  extractJson,
  buildDigest,
  normalizeQuestions,
  questionsDigest,
  userPrompt,
} = loadTestExports();

// El handler sale del MISMO módulo (ya cacheado con los mocks aplicados).
// eslint-disable-next-line import/no-dynamic-require, global-require
const { handler } = require(LAMBDA);

// resetMocks:true limpia implementaciones antes de CADA test — reinstalar.
beforeEach(() => {
  ddbSend.mockImplementation(async () => ({}));
  sesSend.mockImplementation(async () => ({}));
  sendMail.mockImplementation(async () => ({
    message: Buffer.from("RAW-MIME"),
  }));
  bedrockSend.mockImplementation(async () => ({
    output: { message: { content: [{ text: '{"executiveSummary":"ok"}' }] } },
  }));
});

/* ─────────────────────────── parseJson ─────────────────────────── */

describe("parseJson — AWSJSON tolerante", () => {
  it("null/undefined devuelven el fallback", () => {
    expect(parseJson(null, "fb")).toBe("fb");
    expect(parseJson(undefined, [])).toEqual([]);
  });

  it("valores no-string pasan directo sin parsear (incluye false y 0)", () => {
    const arr = [{ a: 1 }];
    const obj = { b: 2 };
    expect(parseJson(arr, null)).toBe(arr);
    expect(parseJson(obj, null)).toBe(obj);
    expect(parseJson(0, "fb")).toBe(0);
    expect(parseJson(false, "fb")).toBe(false);
  });

  it("string JSON válido se parsea", () => {
    expect(parseJson('{"a":1}', null)).toEqual({ a: 1 });
    expect(parseJson('[{"b":2},3]', null)).toEqual([{ b: 2 }, 3]);
  });

  it("string inválido o vacío cae al fallback", () => {
    expect(parseJson("no-json", "fb")).toBe("fb");
    expect(parseJson("", [])).toEqual([]);
    expect(parseJson("{roto", { x: 1 })).toEqual({ x: 1 });
  });
});

/* ─────────────────────────── surveyLink ─────────────────────────── */

describe("surveyLink — link público de la encuesta", () => {
  it("sin token: link limpio y sin doble slash (APP_URL traía / final)", () => {
    expect(surveyLink("ev123", null)).toBe(
      "https://test.eventflow.ec/landing/ev123/encuesta"
    );
  });

  it("con token: lo codifica en ?a=", () => {
    expect(surveyLink("ev123", "att 1+2@x")).toBe(
      "https://test.eventflow.ec/landing/ev123/encuesta?a=att%201%2B2%40x"
    );
  });

  it("token vacío no agrega query", () => {
    expect(surveyLink("ev123", "")).toBe(
      "https://test.eventflow.ec/landing/ev123/encuesta"
    );
  });
});

/* ─────────────────────────── inviteHtml ─────────────────────────── */

describe("inviteHtml — correo de invitación", () => {
  it("incrusta título, intro y el link dos veces (botón + fallback de copia)", () => {
    const link = "https://test.eventflow.ec/landing/ev1/encuesta?a=t1";
    const html = inviteHtml("Congreso USFQ 2026", "Hola, cuéntanos qué tal.", link);
    expect(html).toContain('<h2 style="color:#0b1f3a">Congreso USFQ 2026</h2>');
    expect(html).toContain("Hola, cuéntanos qué tal.");
    expect(html).toContain("Responder la encuesta");
    expect(html).toContain(`<a href="${link}"`);
    expect(html.split(link).length - 1).toBe(2);
  });

  it("sin intro usa el texto por defecto (anónima, 2 minutos)", () => {
    const html = inviteHtml("Evento", null, "https://x");
    expect(html).toContain("Gracias por asistir. Tu opinión nos ayuda a mejorar");
    expect(html).toContain("toma menos de 2 minutos y es anónima");
  });

  it("intro vacía también cae al default", () => {
    expect(inviteHtml("E", "", "https://x")).toContain("Gracias por asistir.");
  });
});

/* ─────────────────────────── extractJson ─────────────────────────── */

describe("extractJson — robusto a prosa, fences y llaves anidadas", () => {
  it("JSON limpio se parsea directo", () => {
    expect(extractJson('{"a":1,"b":[2,3]}')).toEqual({ a: 1, b: [2, 3] });
  });

  it("con fences ```json ... ```", () => {
    const text = '```json\n{"executiveSummary":"Todo bien","themes":[]}\n```';
    expect(extractJson(text)).toEqual({ executiveSummary: "Todo bien", themes: [] });
  });

  it("con prosa alrededor y objetos anidados toma el primer objeto balanceado", () => {
    const text =
      'Aquí tienes el análisis:\n{"a":{"b":{"c":1}},"d":2}\nEspero que sirva.';
    expect(extractJson(text)).toEqual({ a: { b: { c: 1 } }, d: 2 });
  });

  it("llaves dentro de strings no rompen el balanceo", () => {
    const text = '{"quote":"dijo { esto } y {aquello}","n":1} basura {"otro":true}';
    expect(extractJson(text)).toEqual({ quote: "dijo { esto } y {aquello}", n: 1 });
  });

  it("comillas y llaves escapadas dentro de strings", () => {
    const text = '{"q":"cita: \\"llave {\\" fin"}';
    expect(extractJson(text)).toEqual({ q: 'cita: "llave {" fin' });
  });

  it("sin ninguna llave → 'La IA no devolvió JSON'", () => {
    expect(() => extractJson("la IA se puso poética y no mandó nada")).toThrow(
      "La IA no devolvió JSON"
    );
  });

  it("objeto sin cerrar → 'JSON incompleto de la IA'", () => {
    expect(() => extractJson('{"a": {"b": 1}')).toThrow("JSON incompleto de la IA");
  });

  it("balanceado pero inválido revienta en JSON.parse", () => {
    expect(() => extractJson("{a:1}")).toThrow(SyntaxError);
  });
});

/* ─────────────────────────── buildDigest ─────────────────────────── */

describe("buildDigest — respuestas → texto para el prompt", () => {
  const resp = (answers) => ({ answers });

  it("agrupa por respuesta numerada con 'label: valor'", () => {
    const r1 = resp(
      JSON.stringify([
        { type: "text", name: "q1", label: "¿Qué te gustó?", userData: ["Los ponentes"] },
        { type: "textarea", name: "q2", label: "Sugerencias", userData: ["Más café"] },
      ])
    );
    const r2 = resp([
      { type: "text", name: "q1", label: "¿Qué te gustó?", userData: ["El networking"] },
    ]);
    expect(buildDigest([r1, r2])).toBe(
      "Respuesta 1:\n  - ¿Qué te gustó?: Los ponentes\n  - Sugerencias: Más café" +
        "\n\nRespuesta 2:\n  - ¿Qué te gustó?: El networking"
    );
  });

  it("headers y paragraphs se excluyen del digest", () => {
    const r = resp([
      { type: "header", label: "Sección 1" },
      { type: "paragraph", label: "Gracias por venir" },
      { type: "text", name: "q1", label: "Comentario", userData: ["Excelente"] },
    ]);
    expect(buildDigest([r])).toBe("Respuesta 1:\n  - Comentario: Excelente");
  });

  it("limpia HTML del label y usa name como fallback", () => {
    const r = resp([
      { type: "text", name: "q1", label: "<strong>¿Volverías?</strong>", userData: ["Sí"] },
      { type: "text", name: "q9", userData: ["sin label"] },
    ]);
    expect(buildDigest([r])).toBe(
      "Respuesta 1:\n  - ¿Volverías?: Sí\n  - q9: sin label"
    );
  });

  it("userData array se une con coma y filtra vacíos", () => {
    const r = resp([
      { type: "checkbox-group", name: "q1", label: "Temas", userData: ["IA", "", null, "Robótica"] },
    ]);
    expect(buildDigest([r])).toBe("Respuesta 1:\n  - Temas: IA, Robótica");
  });

  it("campos sin valor (null, [''] o solo espacios) se omiten", () => {
    const r = resp([
      { type: "text", name: "q1", label: "Vacío", userData: [""] },
      { type: "text", name: "q2", label: "Nulo", userData: null },
      { type: "text", name: "q3", label: "Espacios", userData: "   " },
      { type: "text", name: "q4", label: "Real", userData: ["ok"] },
    ]);
    expect(buildDigest([r])).toBe("Respuesta 1:\n  - Real: ok");
  });

  it("un 0 escalar sí cuenta como valor", () => {
    const r = resp([{ type: "number", name: "nota", label: "Nota", userData: 0 }]);
    expect(buildDigest([r])).toBe("Respuesta 1:\n  - Nota: 0");
  });

  it("answers no-array (basura u objeto) omite la fila pero respeta la numeración", () => {
    const rows = [
      resp("garbage"),
      resp({ no: "array" }),
      resp(JSON.stringify([{ type: "text", label: "L", userData: ["v"] }])),
    ];
    expect(buildDigest(rows)).toBe("Respuesta 3:\n  - L: v");
  });

  it("sin respuestas devuelve cadena vacía", () => {
    expect(buildDigest([])).toBe("");
  });
});

/* ────────────── limpieza de HTML en labels (regex S8786) ──────────────
 * Caracterización: fija la conducta del strip de etiquetas ANTES y DESPUÉS
 * de reescribir el regex a una forma lineal (sin backtracking super-lineal).
 * Cubre labels reales de formBuilder y entradas sin cerrar/adversarias. */

describe("strip de HTML en labels — misma conducta con el regex lineal", () => {
  const digestOf = (label) =>
    buildDigest([
      { answers: [{ type: "text", name: "qx", label, userData: ["v"] }] },
    ]);

  it.each([
    ["<strong>¿Volverías?</strong>", "¿Volverías?"],
    ['<span style="color:red">Calificación</span>', "Calificación"],
    ["Línea<br>corte", "Líneacorte"],
    ["<em>mezcla</em> de <b>varias</b>", "mezcla de varias"],
    ["sin etiquetas", "sin etiquetas"],
    ["a < b sin cerrar", "a < b sin cerrar"],
    ["5 > 3 suelto", "5 > 3 suelto"],
    ["texto<b atributo=raro>con tag</b>", "textocon tag"],
  ])("buildDigest limpia %j → %j", (label, expected) => {
    expect(digestOf(label)).toBe(`Respuesta 1:\n  - ${expected}: v`);
  });

  it.each([
    ["<strong>¿Qué mejorarías?</strong>", "¿Qué mejorarías?"],
    ['<span style="font-size:12px">Nota</span>', "Nota"],
    ["a < b sin cerrar", "a < b sin cerrar"],
  ])("questionsDigest limpia %j → %j", (label, expected) => {
    expect(questionsDigest([{ type: "text", name: "qx", label }])).toBe(
      `  - name: qx | tipo: text | pregunta: ${expected}`
    );
  });

  it("una avalancha de '<' sin cerrar no se toca y termina rápido (sin super-lineal)", () => {
    const adversarial = "<".repeat(5000);
    expect(digestOf(adversarial)).toBe(`Respuesta 1:\n  - ${adversarial}: v`);
  });
});

/* ─────────────────────────── normalizeQuestions ─────────────────────────── */

describe("normalizeQuestions — defensa contra doble encode y filas legacy", () => {
  const qs = [
    { type: "text", name: "q1", label: "Uno" },
    { type: "select", name: "q2", label: "Dos" },
  ];

  it("array nativo pasa directo", () => {
    expect(normalizeQuestions(qs)).toEqual(qs);
  });

  it("string JSON de array se parsea", () => {
    expect(normalizeQuestions(JSON.stringify(qs))).toEqual(qs);
  });

  it("elementos que son strings JSON (filas legacy) se parsean uno a uno", () => {
    const raw = JSON.stringify(qs.map((q) => JSON.stringify(q)));
    expect(normalizeQuestions(raw)).toEqual(qs);
  });

  it("mezcla de objetos, strings JSON y basura → solo objetos válidos", () => {
    const raw = [qs[0], JSON.stringify(qs[1]), "no-json", 42, null, true];
    expect(normalizeQuestions(raw)).toEqual(qs);
  });

  it("entradas no-array devuelven [] (objeto, basura, null, doble encode total)", () => {
    expect(normalizeQuestions({ a: 1 })).toEqual([]);
    expect(normalizeQuestions("basura")).toEqual([]);
    expect(normalizeQuestions(null)).toEqual([]);
    // Doble stringify DEL ARRAY entero no se salva: la primera pasada da un
    // string y ahí se corta — la defensa es a nivel de elemento.
    expect(normalizeQuestions(JSON.stringify(JSON.stringify(qs)))).toEqual([]);
  });
});

/* ─────────────────────────── questionsDigest ─────────────────────────── */

describe("questionsDigest — una línea por pregunta real", () => {
  it("formatea name | tipo | pregunta y excluye header/paragraph", () => {
    const qs = [
      { type: "header", label: "Sección" },
      { type: "text", name: "q1", label: "<strong>¿Qué mejorarías?</strong>" },
      { type: "paragraph", label: "bla bla" },
      { type: "select", name: "q2", label: "Calificación general" },
    ];
    expect(questionsDigest(qs)).toBe(
      "  - name: q1 | tipo: text | pregunta: ¿Qué mejorarías?\n" +
        "  - name: q2 | tipo: select | pregunta: Calificación general"
    );
  });

  it("acepta questions como string JSON (pasa por normalizeQuestions)", () => {
    const raw = JSON.stringify([{ type: "text", name: "q1", label: "Único" }]);
    expect(questionsDigest(raw)).toBe("  - name: q1 | tipo: text | pregunta: Único");
  });

  it("label ausente cae al name", () => {
    expect(questionsDigest([{ type: "text", name: "q3" }])).toBe(
      "  - name: q3 | tipo: text | pregunta: q3"
    );
  });

  it("sin preguntas útiles devuelve ''", () => {
    expect(questionsDigest(null)).toBe("");
    expect(questionsDigest([{ type: "header", label: "Solo decoración" }])).toBe("");
  });
});

/* ─────────────────────────── userPrompt ─────────────────────────── */

describe("userPrompt — prompt completo para la IA", () => {
  it("arma título, total, digest de preguntas, respuestas y el SHAPE", () => {
    const questions = [{ type: "text", name: "q1", label: "¿Qué te gustó?" }];
    const responses = [
      {
        answers: JSON.stringify([
          { type: "text", name: "q1", label: "¿Qué te gustó?", userData: ["Todo"] },
        ]),
      },
      {
        answers: JSON.stringify([
          { type: "text", name: "q1", label: "¿Qué te gustó?", userData: ["Nada"] },
        ]),
      },
    ];
    const p = userPrompt("Feria USFQ", responses, questions);
    expect(p).toContain("Evento: Feria USFQ");
    expect(p).toContain("Total de respuestas: 2");
    expect(p).toContain("  - name: q1 | tipo: text | pregunta: ¿Qué te gustó?");
    expect(p).toContain("Respuesta 1:\n  - ¿Qué te gustó?: Todo");
    expect(p).toContain("Respuesta 2:\n  - ¿Qué te gustó?: Nada");
    // El SHAPE va incrustado al final para que la IA devuelva ese JSON.
    expect(p).toContain("Devuelve SOLO este JSON");
    expect(p).toContain('"executiveSummary"');
    expect(p).toContain('"perQuestion"');
    expect(p).toContain('"overallSentiment"');
  });

  it("sin respuestas ni preguntas sigue siendo un prompt coherente", () => {
    const p = userPrompt("Evento X", [], null);
    expect(p).toContain("Total de respuestas: 0");
    expect(p).toContain("Preguntas de la encuesta (name | tipo | pregunta):\n\n");
    expect(p).toContain("no rellenes");
  });
});

/* ═══════════════ exports.handler — REST + scheduled ═══════════════ */

const post = (urlPath, body) => ({
  httpMethod: "POST",
  path: urlPath,
  body: JSON.stringify(body),
});
const bodyOf = (res) => JSON.parse(res.body);

// Enruta ddb.send por "Tipo:Tabla" (o solo tipo): valor fijo o función.
const ddbRoute = (routes) => {
  ddbSend.mockImplementation(async (cmd) => {
    const key = `${cmd.__type}:${cmd.input.TableName || ""}`;
    const r = routes[key] !== undefined ? routes[key] : routes[cmd.__type];
    if (r === undefined) throw new Error(`ddb inesperado: ${key}`);
    return typeof r === "function" ? r(cmd) : r;
  });
};

const EVENTO = { id: "ev1", title: "Hackathon USFQ" };
const ENCUESTA = {
  id: "sv1",
  surveyEventId: "ev1",
  active: true,
  emailSubject: "¿Qué tal el evento?",
  emailIntro: "Cuéntanos en 2 minutos",
  questions: JSON.stringify([
    { type: "text", name: "q1", label: "Comentarios" },
  ]),
};

describe("handler — dispatch HTTP", () => {
  it("OPTIONS responde 200 con CORS completo", async () => {
    const res = await handler({ httpMethod: "OPTIONS" });
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true });
    expect(res.headers).toMatchObject({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    });
  });

  it("métodos distintos de POST → 405 (lee requestContext.http.method)", async () => {
    const res = await handler({ requestContext: { http: { method: "PUT" } } });
    expect(res.statusCode).toBe(405);
    expect(bodyOf(res).error).toBe("Method PUT not allowed");
  });

  it("body que no es JSON → 400 'Cuerpo inválido'", async () => {
    const res = await handler({ httpMethod: "POST", body: "{roto" });
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("Cuerpo inválido");
  });

  it("ruta desconocida → 404 con el path en el error", async () => {
    const res = await handler(post("/otra-cosa", { eventId: "x" }));
    expect(res.statusCode).toBe(404);
    expect(bodyOf(res).error).toContain("/otra-cosa");
  });

  it("una excepción del backend en REST → 500 con mensaje y CORS", async () => {
    ddbRoute({
      "GetCommand:Event-test": () => {
        throw new Error("dynamo caído");
      },
      "ScanCommand:Survey-test": { Items: [] },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", email: "x@y.z" }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).error).toBe("dynamo caído");
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("handler /survey-test — invitación de prueba", () => {
  it("sin eventId o sin email → 400 antes de tocar DynamoDB", async () => {
    expect(
      (await handler(post("/survey-test", { email: "x@y.z" }))).statusCode
    ).toBe(400);
    expect(
      (await handler(post("/survey-test", { eventId: "ev1" }))).statusCode
    ).toBe(400);
    expect(ddbSend).not.toHaveBeenCalled();
  });

  it("evento inexistente → 404", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: undefined },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", email: "a@b.c" }));
    expect(res.statusCode).toBe(404);
    expect(bodyOf(res).error).toBe("Evento no encontrado");
  });

  it("sin encuesta guardada → 400", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [] },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", email: "a@b.c" }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("Guarda la encuesta antes de probar");
  });

  it("envía UNA invitación con el link SIN token y responde sentTo", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", email: "ana@x.com" }));
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true, sentTo: "ana@x.com" });
    // la encuesta se busca por surveyEventId
    const scan = ddbSend.mock.calls.find(([c]) => c.__type === "ScanCommand")[0];
    expect(scan.input).toMatchObject({
      TableName: "Survey-test",
      FilterExpression: "surveyEventId = :e",
      ExpressionAttributeValues: { ":e": "ev1" },
    });
    // correo con asunto/intro de la encuesta y el link público (sin ?a=)
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.from).toBe("encuestas@test.ec");
    expect(mail.to).toBe("ana@x.com");
    expect(mail.subject).toBe("¿Qué tal el evento?");
    expect(mail.html).toContain("Hackathon USFQ");
    expect(mail.html).toContain("Cuéntanos en 2 minutos");
    expect(mail.html).toContain("https://test.eventflow.ec/landing/ev1/encuesta");
    expect(mail.html).not.toContain("?a=");
    // el MIME crudo sale por SES
    expect(sesSend).toHaveBeenCalledTimes(1);
    expect(sesSend.mock.calls[0][0].__type).toBe("SendRawEmailCommand");
    expect(sesSend.mock.calls[0][0].input.RawMessage.Data.toString()).toBe("RAW-MIME");
  });
});

describe("handler /survey-test sendAll — envío manual", () => {
  const ASISTENTES = [
    { id: "a1", email: "ana@x.com", checkIn: true },
    { id: "a2", email: "ana@x.com", checkIn: true }, // duplicada → 1 solo correo
    { id: "a3", email: "beto@x.com", checkIn: false }, // sin check-in → fuera
    { id: "a4", checkIn: true }, // sin email → fuera
    { id: "a5", email: "carla@x.com", checkIn: true },
  ];

  it("sin eventId → 400", async () => {
    const res = await handler(post("/survey-test", { sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("eventId es requerido");
  });

  it("encuesta sin preguntas → 400 sin enviar nada", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [{ ...ENCUESTA, questions: "[]" }] },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("La encuesta no tiene preguntas");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("solo check-ins, dedupe por email, links con token y estampa sentAt", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:EventAttendee-test": { Items: ASISTENTES },
      "UpdateCommand:Survey-test": {},
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(200);
    const b = bodyOf(res);
    expect(b.ok).toBe(true);
    expect(b.sent).toBe(2);
    const mails = sendMail.mock.calls.map(([m]) => m);
    expect(mails.map((m) => m.to).sort()).toEqual(["ana@x.com", "carla@x.com"]);
    // el token del link es el id del EventAttendee
    expect(mails.find((m) => m.to === "ana@x.com").html).toContain(
      "/landing/ev1/encuesta?a=a1"
    );
    expect(mails.find((m) => m.to === "carla@x.com").html).toContain(
      "/landing/ev1/encuesta?a=a5"
    );
    // reenvío manual: estampa sentAt SIN condición (el admin ya confirmó)
    const upds = ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand");
    expect(upds).toHaveLength(1);
    expect(upds[0][0].input).toMatchObject({
      TableName: "Survey-test",
      Key: { id: "sv1" },
      UpdateExpression: "SET sentAt = :now",
      ExpressionAttributeValues: { ":now": b.sentAt },
    });
    expect(upds[0][0].input.ConditionExpression).toBeUndefined();
  });

  it("pagina asistentes con ExclusiveStartKey", async () => {
    let q = 0;
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:EventAttendee-test": () =>
        ++q === 1
          ? {
              Items: [{ id: "a1", email: "uno@x.com", checkIn: true }],
              LastEvaluatedKey: { id: "a1" },
            }
          : { Items: [{ id: "a2", email: "dos@x.com", checkIn: true }] },
      "UpdateCommand:Survey-test": {},
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", sendAll: true }));
    expect(bodyOf(res).sent).toBe(2);
    const queries = ddbSend.mock.calls.filter(([c]) => c.__type === "QueryCommand");
    expect(queries).toHaveLength(2);
    expect(queries[0][0].input.ExclusiveStartKey).toBeUndefined();
    expect(queries[1][0].input.ExclusiveStartKey).toEqual({ id: "a1" });
  });

  it("sin check-ins → 400 y NO estampa sentAt", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:EventAttendee-test": {
        Items: [{ id: "a3", email: "beto@x.com", checkIn: false }],
      },
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe(
      "No hay asistentes con check-in para enviar la encuesta"
    );
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });

  it("elegibles pero TODOS los envíos fallan → 500 sin estampar (reintentable)", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:EventAttendee-test": { Items: ASISTENTES },
    });
    sendMail.mockImplementation(async () => {
      throw new Error("SES down");
    });
    const res = await handler(post("/survey-test", { eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).error).toContain("No se pudo enviar ningún correo");
    expect(bodyOf(res).error).toContain("2 asistente(s)");
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });
});

describe("handler /survey-analyze — análisis con IA (backend Bedrock)", () => {
  const RESPUESTAS = [
    {
      id: "r1",
      answers: JSON.stringify([
        { type: "text", name: "q1", label: "Comentarios", userData: ["Excelente evento"] },
      ]),
    },
    {
      id: "r2",
      answers: JSON.stringify([
        { type: "text", name: "q1", label: "Comentarios", userData: ["Faltó café"] },
      ]),
    },
  ];
  const INSIGHTS = {
    executiveSummary: "Feedback mayormente positivo",
    overallSentiment: { score: 75, label: "Positivo" },
    themes: [],
    strengths: ["Organización"],
    concerns: ["Café insuficiente"],
    recommendations: ["Más café"],
    perQuestion: [
      { name: "q1", question: "Comentarios", insight: "Buenas impresiones", sentiment: "positivo" },
    ],
  };

  it("sin eventId → 400 / sin encuesta → 404 / sin respuestas → 400", async () => {
    expect((await handler(post("/survey-analyze", {}))).statusCode).toBe(400);

    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [] },
    });
    const sin = await handler(post("/survey-analyze", { eventId: "ev1" }));
    expect(sin.statusCode).toBe(404);
    expect(bodyOf(sin).error).toBe("No hay encuesta para este evento");

    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:SurveyResponse-test": { Items: [] },
    });
    const vacio = await handler(post("/survey-analyze", { eventId: "ev1" }));
    expect(vacio.statusCode).toBe(400);
    expect(bodyOf(vacio).error).toBe("Aún no hay respuestas para analizar");
    expect(bedrockSend).not.toHaveBeenCalled();
  });

  it("manda digest+preguntas a Bedrock y guarda insights como objeto NATIVO", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:SurveyResponse-test": { Items: RESPUESTAS },
      "UpdateCommand:Survey-test": {},
    });
    bedrockSend.mockImplementation(async () => ({
      output: {
        message: {
          content: [
            { text: "Claro, aquí está el análisis:\n" },
            { text: `${JSON.stringify(INSIGHTS)}\nSaludos.` },
          ],
        },
      },
    }));
    const res = await handler(post("/survey-analyze", { eventId: "ev1" }));
    expect(res.statusCode).toBe(200);
    const b = bodyOf(res);
    expect(b.ok).toBe(true);
    expect(b.insights).toEqual(INSIGHTS);
    // las respuestas se leen del GSI byEventResponse
    const q = ddbSend.mock.calls.find(([c]) => c.__type === "QueryCommand")[0];
    expect(q.input).toMatchObject({
      TableName: "SurveyResponse-test",
      IndexName: "byEventResponse",
      KeyConditionExpression: "eventID = :e",
    });
    // prompt completo al modelo configurado por env
    const conv = bedrockSend.mock.calls[0][0];
    expect(conv.__type).toBe("ConverseCommand");
    expect(conv.input.modelId).toBe("us.test.claude-v9");
    expect(conv.input.inferenceConfig).toEqual({ maxTokens: 4000 });
    const prompt = conv.input.messages[0].content[0].text;
    expect(prompt).toContain("Eres analista de experiencia de eventos");
    expect(prompt).toContain("Evento: Hackathon USFQ");
    expect(prompt).toContain("Total de respuestas: 2");
    expect(prompt).toContain("Excelente evento");
    expect(prompt).toContain("Faltó café");
    expect(prompt).toContain("name: q1 | tipo: text | pregunta: Comentarios");
    // insights se guardan NATIVOS (Map), no stringificados
    const upd = ddbSend.mock.calls.find(([c]) => c.__type === "UpdateCommand")[0];
    expect(upd.input.TableName).toBe("Survey-test");
    expect(upd.input.Key).toEqual({ id: "sv1" });
    expect(upd.input.UpdateExpression).toBe("SET insights = :i, insightsAt = :t");
    expect(upd.input.ExpressionAttributeValues[":i"]).toEqual(INSIGHTS);
    expect(upd.input.ExpressionAttributeValues[":t"]).toBe(b.insightsAt);
  });

  it("la IA sin contenido → 500 y NO guarda insights", async () => {
    ddbRoute({
      "GetCommand:Event-test": { Item: EVENTO },
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "QueryCommand:SurveyResponse-test": { Items: RESPUESTAS },
    });
    bedrockSend.mockImplementation(async () => ({
      output: { message: { content: [] } },
    }));
    const res = await handler(post("/survey-analyze", { eventId: "ev1" }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).error).toBe("La IA no devolvió contenido");
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });
});

describe("handler scheduled — envío automático (claim primero)", () => {
  const H = 3600e3;
  const iso = (deltaMs) => new Date(Date.now() + deltaMs).toISOString();
  const CHECKIN = { id: "a1", email: "ana@x.com", checkIn: true };

  it("encuesta activa de evento terminado hace >1h: claim condicional y envía", async () => {
    ddbRoute({
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "GetCommand:Event-test": { Item: { ...EVENTO, endDate: iso(-2 * H) } },
      "QueryCommand:EventAttendee-test": { Items: [CHECKIN] },
      "UpdateCommand:Survey-test": {},
    });
    const res = await handler({}); // sin httpMethod → scheduled
    expect(res).toEqual({ ok: true });
    // scan de encuestas activas sin enviar
    const scan = ddbSend.mock.calls[0][0];
    expect(scan.__type).toBe("ScanCommand");
    expect(scan.input.FilterExpression).toBe(
      "active = :t AND attribute_not_exists(sentAt)"
    );
    // claim atómico ANTES del primer correo
    const updIdx = ddbSend.mock.calls.findIndex(([c]) => c.__type === "UpdateCommand");
    const upd = ddbSend.mock.calls[updIdx][0];
    expect(upd.input.ConditionExpression).toBe("attribute_not_exists(sentAt)");
    expect(ddbSend.mock.invocationCallOrder[updIdx]).toBeLessThan(
      sendMail.mock.invocationCallOrder[0]
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("ana@x.com");
    expect(sendMail.mock.calls[0][0].html).toContain("?a=a1");
  });

  it("todavía NO envía si el evento terminó hace menos de 1 hora", async () => {
    ddbRoute({
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "GetCommand:Event-test": { Item: { ...EVENTO, endDate: iso(-0.5 * H) } },
    });
    expect(await handler({})).toEqual({ ok: true });
    expect(sendMail).not.toHaveBeenCalled();
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });

  it("sendAt explícito manda a la hora exacta (sin esperar el fin + 1h)", async () => {
    // el evento terminó hace 5 min (sin sendAt aún no tocaría), pero
    // sendAt quedó hace 10 min → dispara ya.
    ddbRoute({
      "ScanCommand:Survey-test": { Items: [{ ...ENCUESTA, sendAt: iso(-10 * 60e3) }] },
      "GetCommand:Event-test": { Item: { ...EVENTO, endDate: iso(-5 * 60e3) } },
      "QueryCommand:EventAttendee-test": { Items: [CHECKIN] },
      "UpdateCommand:Survey-test": {},
    });
    await handler({});
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("se saltan: sendAt futuro, sin surveyEventId, evento borrado, sin preguntas", async () => {
    ddbRoute({
      "ScanCommand:Survey-test": {
        Items: [
          { ...ENCUESTA, id: "s-futuro", sendAt: iso(2 * H) },
          { ...ENCUESTA, id: "s-sin-evento", surveyEventId: null },
          { ...ENCUESTA, id: "s-evento-borrado", surveyEventId: "ev-borrado" },
          { ...ENCUESTA, id: "s-sin-preguntas", questions: "[]" },
        ],
      },
      "GetCommand:Event-test": (cmd) =>
        cmd.input.Key.id === "ev-borrado"
          ? { Item: undefined }
          : { Item: { ...EVENTO, endDate: iso(-2 * H) } },
    });
    expect(await handler({})).toEqual({ ok: true });
    expect(sendMail).not.toHaveBeenCalled();
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });

  it("claim perdido (otra corrida lo tomó) → NO reenvía", async () => {
    ddbRoute({
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "GetCommand:Event-test": { Item: { ...EVENTO, endDate: iso(-2 * H) } },
      "UpdateCommand:Survey-test": () => {
        const e = new Error("ya estampado");
        e.name = "ConditionalCheckFailedException";
        throw e;
      },
    });
    expect(await handler({})).toEqual({ ok: true });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("un error inesperado del claim revienta el scheduled (retry de Lambda)", async () => {
    ddbRoute({
      "ScanCommand:Survey-test": { Items: [ENCUESTA] },
      "GetCommand:Event-test": { Item: { ...EVENTO, endDate: iso(-2 * H) } },
      "UpdateCommand:Survey-test": () => {
        throw new Error("dynamo caído");
      },
    });
    await expect(handler({})).rejects.toThrow("dynamo caído");
    expect(sendMail).not.toHaveBeenCalled();
  });
});
