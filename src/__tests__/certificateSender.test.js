// Tests de los helpers puros del Lambda certificateSender (via exports._test):
// extracción del nombre, filtro de la pregunta de certificado, afirmativos y
// sanitización WinAnsi. Importa el módulo REAL del Lambda — sus node_modules
// viven junto a él, y requerirlo no toca red (los clients AWS solo se
// instancian). Cobertura para SonarQube vía `npm run test:coverage`.
const {
  parseAnswers,
  extractName,
  wantsCertificate,
  isAffirmative,
  isCertAdmin,
  toWinAnsiSafe,
} = require("../../amplify/backend/function/certificateSender/src/index.js")._test;

const f = (name, label, val, extra = {}) => ({
  name,
  label,
  type: "text",
  userData: [val],
  ...extra,
});
const sel = (name, label, val, values) => ({
  name,
  label,
  type: "select",
  userData: [val],
  values,
});
const par = (label) => ({ type: "paragraph", label });
const YN = [
  { label: "Si", value: "Siquiero", selected: true },
  { label: "No", value: "Noquiero" },
];
const YN2 = [
  { label: "Sí", value: "Si", selected: true },
  { label: "No", value: "No" },
];
const att = (answers) => ({ formAnswers: answers });

describe("parseAnswers — AWSJSON tolerante", () => {
  it("array nativo pasa directo", () => {
    const a = [f("x", "X", "1")];
    expect(parseAnswers(a)).toBe(a);
  });
  it("string JSON se parsea", () => {
    expect(parseAnswers('[{"name":"x"}]')).toEqual([{ name: "x" }]);
  });
  it("basura devuelve []", () => {
    expect(parseAnswers("no-json")).toEqual([]);
    expect(parseAnswers(null)).toEqual([]);
    expect(parseAnswers({})).toEqual([]);
  });
});

describe("extractName — prioridad y fuentes", () => {
  it("cert_nombre manda sobre nombres/apellidos", () => {
    const a = att([
      f("nombres", "Nombre", "María José"),
      f("apellidos", "Apellidos", "Pérez García"),
      f("cert_nombre", "Nombre para el certificado", "María J. Pérez"),
    ]);
    expect(extractName(a)).toBe("María J. Pérez");
  });

  it("cert_nombre vacío cae al nombre del registro", () => {
    const a = att([
      f("nombres", "Nombre", "Luis"),
      f("apellidos", "Apellidos", "Guerra"),
      f("cert_nombre", "Nombre para el certificado", ""),
    ]);
    expect(extractName(a)).toBe("Luis Guerra");
  });

  it("clamp a 60 caracteres", () => {
    const a = att([f("cert_nombre", "Nombre para el certificado", "A".repeat(80))]);
    expect(extractName(a)).toBe("A".repeat(60));
  });

  it("campo combinado 'Nombre y apellido'", () => {
    const a = att([f("nombres", "Nombre y apellido", "Paula Romero")]);
    expect(extractName(a)).toBe("Paula Romero");
  });

  it("un SELECT nunca es fuente de nombre (imprimía 'Noquiero')", () => {
    const a = att([
      sel("q1", "¿Desea que su nombre aparezca en el certificado?", "Noquiero", YN),
      f("nombres", "Nombre", "Maria"),
      f("apellidos", "Apellidos", "Perez"),
    ]);
    expect(extractName(a)).toBe("Maria Perez");
  });

  it("headers/paragraphs se ignoran", () => {
    const a = att([
      par("Bienvenido, escribe tu nombre abajo"),
      f("nombres", "Nombre", "Ana"),
      f("apellidos", "Apellidos", "Lu"),
    ]);
    expect(extractName(a)).toBe("Ana Lu");
  });
});

describe("wantsCertificate — filtro de la pregunta Sí/No", () => {
  it("cert_enviar=Si (values nuevos) → true", () => {
    const a = att([
      sel("cert_enviar", "¿Deseas recibir tu certificado de participación?", "Si", YN2),
    ]);
    expect(wantsCertificate(a)).toBe(true);
  });

  it("cert_enviar=No → false", () => {
    const a = att([
      sel("cert_enviar", "¿Deseas recibir tu certificado de participación?", "No", YN2),
    ]);
    expect(wantsCertificate(a)).toBe(false);
  });

  it("legacy Siquiero/Noquiero se resuelven por values", () => {
    const q = (v) =>
      att([sel("certificado", "Desea recibir certificado de participación", v, YN)]);
    expect(wantsCertificate(q("Siquiero"))).toBe(true);
    expect(wantsCertificate(q("Noquiero"))).toBe(false);
  });

  it("un paragraph decorativo con 'certificado' NO es la pregunta (excluía a todos)", () => {
    const a = att([
      par("Al finalizar recibirás tu certificado de participación"),
      sel("cert_enviar", "¿Deseas recibir tu certificado de participación?", "Siquiero", YN),
    ]);
    expect(wantsCertificate(a)).toBe(true);
  });

  it("pregunta legacy con 'certificado'+'nombre' en el label SÍ se honra", () => {
    const a = att([
      f("nombres", "Nombre", "Zoe"),
      sel("q2", "¿Desea recibir un certificado a su nombre?", "Noquiero", YN),
    ]);
    expect(wantsCertificate(a)).toBe(false);
  });

  it("'certificado de votación' (cédula) no decide el envío", () => {
    const a = att([
      f("votacion", "Número de certificado de votación", "1710234567"),
      f("nombres", "Nombre", "Bo"),
    ]);
    expect(wantsCertificate(a)).toBe(true);
  });

  it("el campo cert_nombre no envenena el filtro (sin pregunta → true)", () => {
    const a = att([
      f("cert_nombre", "Nombre para el certificado", "Pedro Páramo"),
    ]);
    expect(wantsCertificate(a)).toBe(true);
  });

  it("sin pregunta ni respuestas → true (no bloquear)", () => {
    expect(wantsCertificate(att([f("nombres", "Nombre", "Juan")]))).toBe(true);
    expect(wantsCertificate({ formAnswers: null })).toBe(true);
  });

  it("pregunta de texto libre con respuesta si/no se honra", () => {
    expect(
      wantsCertificate(att([f("certpregunta", "¿Desea certificado?", "si")]))
    ).toBe(true);
    expect(
      wantsCertificate(att([f("certpregunta", "¿Desea certificado?", "no")]))
    ).toBe(false);
  });
});

describe("isAffirmative", () => {
  it.each(["Si", "Sí", "sí quiero", "Siquiero", "yes", "true", "1"])(
    "'%s' → true",
    (v) => expect(isAffirmative(v)).toBe(true)
  );
  it.each(["No", "Noquiero", "no quiero", "", null, undefined])(
    "'%s' → false",
    (v) => expect(isAffirmative(v)).toBe(false)
  );
});

describe("isCertAdmin — excepción de monitoreo", () => {
  it("el admin por defecto siempre matchea (case-insensitive)", () => {
    expect(isCertAdmin({ email: "carlos@mindfultech.ec" })).toBe(true);
    expect(isCertAdmin({ email: "CARLOS@MindfulTech.EC" })).toBe(true);
  });
  it("otros correos no", () => {
    expect(isCertAdmin({ email: "otro@x.com" })).toBe(false);
    expect(isCertAdmin({})).toBe(false);
  });
});

describe("toWinAnsiSafe — el PDF nunca revienta por el nombre", () => {
  it("conserva acentos y ñ (Latin-1)", () => {
    expect(toWinAnsiSafe("José Ángel Muñoz-Pérez")).toBe(
      "José Ángel Muñoz-Pérez"
    );
  });
  it("translitera por NFD lo que tiene base latina", () => {
    expect(toWinAnsiSafe("İpek Şahin")).toBe("Ipek Sahin");
  });
  it("descarta emoji y colapsa espacios", () => {
    expect(toWinAnsiSafe("María ❤ López")).toBe("María López");
  });
  it("si no queda nada, fallback 'Participante'", () => {
    expect(toWinAnsiSafe("🎉🎉")).toBe("Participante");
    expect(toWinAnsiSafe("")).toBe("Participante");
  });
});
