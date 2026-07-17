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

const LAMBDA = path.resolve(
  __dirname,
  "../../amplify/backend/function/surveyManager/src/index.js"
);

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
