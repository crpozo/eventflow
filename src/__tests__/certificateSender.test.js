// Tests del Lambda certificateSender: helpers puros (via exports._test) y el
// HANDLER completo (POST /certificate-test, reenvío sendAll y el flujo
// scheduled Scan→claim→Query→send). Los paquetes @aws-sdk/* y nodemailer se
// mockean por RUTA ABSOLUTA resuelta desde el node_modules DEL LAMBDA (tiene
// copias propias — jest mockea por módulo RESUELTO, así el require interno del
// lambda cae en los fakes sin tocar red). CRA usa resetMocks:true: las
// implementaciones de los jest.fn se reinstalan en beforeEach.
const path = require("path");

const LAMBDA_DIR = path.resolve(
  __dirname,
  "../../amplify/backend/function/certificateSender/src"
);
const LAMBDA = path.join(LAMBDA_DIR, "index.js");
const fromLambda = (id) => require.resolve(id, { paths: [LAMBDA_DIR] });

// El módulo lee tablas/bucket/remitente al cargarse.
process.env.EVENT_TABLE = "Event-test";
process.env.EVENTATTENDEE_TABLE = "EventAttendee-test";
process.env.STORAGE_BUCKET = "bucket-test";
process.env.SES_FROM = "certificados@test.ec";

// jest.fn compartidos: los factories crean clases fake cuyo send delega aquí;
// cada test configura la implementación por comando.
const ddbSend = jest.fn();
const s3Send = jest.fn();
const sesSend = jest.fn();
const sendMail = jest.fn();

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
jest.doMock(fromLambda("@aws-sdk/client-s3"), () => ({
  S3Client: class {
    send(cmd) {
      return s3Send(cmd);
    }
  },
  GetObjectCommand: cmdClass("GetObjectCommand"),
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

// Instancia A — pdf-lib REAL (la copia del lambda): helpers puros y los tests
// de render de buildCertificatePdf de más abajo.
const {
  parseAnswers,
  extractName,
  wantsCertificate,
  isAffirmative,
  isCertAdmin,
  toWinAnsiSafe,
  resolvePosition,
  hexToRgb,
  buildCertificatePdf,
} = require(LAMBDA)._test;

const zlib = require("zlib");
// Misma versión (1.17.1) que la copia del Lambda: solo intercambiamos bytes.
const { PDFDocument } = require("pdf-lib");

// Instancia B — pdf-lib FAKE solo para el HANDLER: streamToBuffer convierte la
// plantilla de S3 con Buffer.concat (Buffer del realm core de Node) y el
// `instanceof Uint8Array` del pdf-lib del sandbox lo rechazaría (misma nota de
// makePdfTemplate). El render real ya queda cubierto por la instancia A; aquí
// solo importa el FLUJO (filtros, claim, lotes, correos).
jest.doMock(fromLambda("pdf-lib"), () => {
  const fakeFont = {
    widthOfTextAtSize: (text, size) => text.length * size * 0.6,
  };
  const fakePage = (width, height) => ({
    getWidth: () => width,
    getHeight: () => height,
    drawImage: () => {},
    drawText: () => {},
  });
  const fakeDoc = () => ({
    embedPng: async () => ({ width: 600, height: 400 }),
    embedJpg: async () => ({ width: 600, height: 400 }),
    addPage: ([w, h]) => fakePage(w, h),
    embedFont: async () => fakeFont,
    getPages: () => [fakePage(600, 400)],
    save: async () => Uint8Array.from("%PDF-fake", (c) => c.charCodeAt(0)),
  });
  return {
    PDFDocument: { create: async () => fakeDoc(), load: async () => fakeDoc() },
    rgb: (red, green, blue) => ({ type: "RGB", red, green, blue }),
    StandardFonts: { HelveticaBold: "Helvetica-Bold" },
  };
});
let handler;
jest.isolateModules(() => {
  ({ handler } = require(LAMBDA));
});

// resetMocks:true limpia implementaciones antes de CADA test — reinstalar.
beforeEach(() => {
  ddbSend.mockImplementation(async () => ({}));
  s3Send.mockImplementation(async () => ({
    Body: [Buffer.from(PNG_1X1)],
    ContentType: "image/png",
  }));
  sesSend.mockImplementation(async () => ({}));
  sendMail.mockImplementation(async () => ({
    message: Buffer.from("RAW-MIME"),
  }));
});

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

describe("resolvePosition — presets y overrides del admin", () => {
  const CENTRO = { xPct: 50, yPct: 50, align: "center", fontPct: 6 };

  it("preset como string CRUDO (sin comillas JSON)", () => {
    expect(resolvePosition("inferior-izquierda")).toEqual({
      xPct: 28,
      yPct: 85,
      align: "center",
      fontPct: 5,
    });
  });

  it("preset como string JSON entre comillas", () => {
    expect(resolvePosition('"centro-arriba"')).toEqual({
      xPct: 50,
      yPct: 30,
      align: "center",
      fontPct: 6,
    });
  });

  it("preset desconocido cae al centro", () => {
    expect(resolvePosition('"diagonal"')).toEqual(CENTRO);
  });

  it("vacío/null/undefined → centro por defecto", () => {
    expect(resolvePosition(undefined)).toEqual(CENTRO);
    expect(resolvePosition(null)).toEqual(CENTRO);
    expect(resolvePosition("")).toEqual(CENTRO);
    expect(resolvePosition("null")).toEqual(CENTRO);
  });

  it("{preset, fontPct, color}: coordenadas del preset + overrides", () => {
    expect(
      resolvePosition('{"preset":"centro-abajo","fontPct":"8","color":"#ff0000"}')
    ).toEqual({
      xPct: 50,
      yPct: 70,
      align: "center",
      fontPct: 8,
      color: "#ff0000",
    });
  });

  it("fontPct no numérico se ignora (queda el del preset)", () => {
    expect(resolvePosition('{"preset":"inferior-derecha","fontPct":"grande"}'))
      .toEqual({ xPct: 72, yPct: 85, align: "center", fontPct: 5 });
  });

  it("preset desconocido dentro del objeto también cae al centro", () => {
    expect(resolvePosition('{"preset":"esquina-magica"}')).toEqual(CENTRO);
  });

  it("objeto NATIVO del DocumentClient (AWSJSON sin stringificar)", () => {
    expect(resolvePosition({ preset: "inferior-derecha" })).toEqual({
      xPct: 72,
      yPct: 85,
      align: "center",
      fontPct: 5,
    });
  });

  it("objeto legacy con xPct/yPct pasa intacto", () => {
    const legacy = { xPct: 10, yPct: 20, align: "left" };
    expect(resolvePosition(JSON.stringify(legacy))).toEqual(legacy);
  });
});

describe("hexToRgb — color del nombre en el PDF", () => {
  const canal = (v) => Math.round(v * 255);

  it("colores válidos de 6 dígitos, con y sin #", () => {
    const blanco = hexToRgb("#ffffff");
    expect([blanco.red, blanco.green, blanco.blue]).toEqual([1, 1, 1]);
    const rojo = hexToRgb("ff0000");
    expect([rojo.red, rojo.green, rojo.blue]).toEqual([1, 0, 0]);
  });

  it("mayúsculas se aceptan (case-insensitive)", () => {
    const c = hexToRgb("#1A2B3C");
    expect([canal(c.red), canal(c.green), canal(c.blue)]).toEqual([26, 43, 60]);
  });

  it("#fff (3 dígitos) es inválido → gris oscuro de fallback", () => {
    const c = hexToRgb("#fff");
    expect(c.red).toBeCloseTo(0.1, 10);
    expect(c.green).toBeCloseTo(0.1, 10);
    expect(c.blue).toBeCloseTo(0.1, 10);
  });

  it("basura → fallback; vacío/undefined → default #1a1a1a", () => {
    const basura = hexToRgb("no-color");
    expect(basura.red).toBeCloseTo(0.1, 10);
    const porDefecto = hexToRgb(undefined);
    expect(canal(porDefecto.red)).toBe(26);
    expect(canal(porDefecto.green)).toBe(26);
    expect(canal(porDefecto.blue)).toBe(26);
  });
});

// ── buildCertificatePdf ──────────────────────────────────────────────────────
// pdf-lib comprime los content streams con Flate: para AFIRMAR comportamiento
// (tamaño de fuente Tf, posición Tm, texto Tj) inflamos todos los streams del
// buffer y leemos los operadores de texto reales del PDF producido.
const inflateStreams = (buf) => {
  const START = Buffer.from("stream");
  const END = Buffer.from("endstream");
  const parts = [];
  let i = 0;
  while ((i = buf.indexOf(START, i)) !== -1) {
    let s = i + START.length;
    if (buf[s] === 0x0d) s += 1;
    if (buf[s] === 0x0a) s += 1;
    const e = buf.indexOf(END, s);
    if (e === -1) break;
    try {
      parts.push(zlib.inflateSync(buf.slice(s, e)).toString("latin1"));
    } catch (err) {
      /* stream sin Flate (p.ej. la imagen) — no aporta operadores */
    }
    i = e + END.length;
  }
  return parts.join("\n");
};

// Primer (único) texto dibujado: { size, x, y, text } desde Tf / Tm / Tj.
const drawnText = (buf) => {
  const c = inflateStreams(buf);
  const tf = /\/\S+\s+([\d.]+)\s+Tf/.exec(c);
  const tm = /1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/.exec(c);
  const tj = /<([0-9A-Fa-f]+)>\s*Tj/.exec(c);
  return {
    size: tf ? Number(tf[1]) : null,
    x: tm ? Number(tm[1]) : null,
    y: tm ? Number(tm[2]) : null,
    text: tj ? Buffer.from(tj[1], "hex").toString("latin1") : null,
    content: c,
  };
};

// Plantilla PDF REAL de 600×400 generada con pdf-lib (como las que sube el
// admin). OJO: pdf-lib valida los bytes con `instanceof Uint8Array` del realm
// del sandbox de jest — un Buffer de Node (realm core) no pasa, así que los
// bytes viajan siempre como Uint8Array del sandbox.
const makePdfTemplate = async () => {
  const tpl = await PDFDocument.create();
  tpl.addPage([600, 400]);
  return tpl.save(); // Uint8Array del propio pdf-lib
};

// PNG 1×1 (un píxel negro) — plantilla de imagen mínima.
const PNG_1X1 = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  )
);

// Cargar el PDF producido (Buffer de Node) con el pdf-lib del test.
const loadPdf = (out) => PDFDocument.load(new Uint8Array(out));

const POS_CENTRO = { xPct: 50, yPct: 50, align: "center", fontPct: 6 };

describe("buildCertificatePdf — render sobre plantilla PDF real", () => {
  // Con página de 600 de ancho y fontPct 6: tamaño máximo = 36pt y la caja
  // segura simétrica mide 2·min(300,300)·0.9 = 540pt.
  const MAX_FONT = 36;
  const CAJA = 540;

  it("nombre corto: Buffer %PDF válido, misma página, fuente al máximo y texto exacto", async () => {
    const tpl = await makePdfTemplate();
    const out = await buildCertificatePdf(tpl, "application/pdf", "Ana Paz", POS_CENTRO);

    expect(Buffer.isBuffer(out)).toBe(true);
    expect(out.slice(0, 5).toString()).toBe("%PDF-");

    const doc = await loadPdf(out);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPages()[0].getWidth()).toBe(600);
    expect(doc.getPages()[0].getHeight()).toBe(400);

    const t = drawnText(out);
    expect(t.text).toBe("Ana Paz"); // el nombre se dibuja tal cual
    expect(t.size).toBeCloseTo(MAX_FONT, 5); // corto → NO encoge
    // yPct 50 en origen top-left → cy = 200; baseline = cy - fontSize/2.
    expect(t.y).toBeCloseTo(200 - MAX_FONT / 2, 3);
    // centrado: arranca a la izquierda del centro pero dentro de la página
    expect(t.x).toBeLessThan(300);
    expect(t.x).toBeGreaterThan(0);
  });

  it("nombre larguísimo: encoge hasta ocupar exactamente la caja segura", async () => {
    const tpl = await makePdfTemplate();
    const nombre = "María Fernanda de los Ángeles Rodríguez Betancourt";
    const out = await buildCertificatePdf(tpl, "application/pdf", nombre, POS_CENTRO);

    expect(out.slice(0, 5).toString()).toBe("%PDF-");
    const t = drawnText(out);
    expect(t.size).toBeLessThan(MAX_FONT); // encogió
    expect(t.size).toBeGreaterThan(MAX_FONT * 0.4); // sin llegar al piso
    // Al encoger a escala, el texto queda EXACTO del ancho de la caja segura:
    // centrado ⇒ x = 300 - 540/2 = 30.
    expect(t.x).toBeCloseTo(300 - CAJA / 2, 1);
    expect(t.text).toBe(nombre);
  });

  it("nombre extremo: el piso del 40% evita que quede ilegible", async () => {
    const tpl = await makePdfTemplate();
    const out = await buildCertificatePdf(
      tpl,
      "application/pdf",
      "M".repeat(60),
      POS_CENTRO
    );
    const t = drawnText(out);
    expect(t.size).toBeCloseTo(MAX_FONT * 0.4, 5); // clamp exacto en 14.4
    expect(out.slice(0, 5).toString()).toBe("%PDF-");
  });

  it("align right/left desplazan respecto del centro (right = 2× el corrimiento)", async () => {
    const tpl = await makePdfTemplate();
    const nombre = "Ana Paz";
    const [centro, derecha, izquierda] = await Promise.all([
      buildCertificatePdf(tpl, "application/pdf", nombre, POS_CENTRO),
      buildCertificatePdf(tpl, "application/pdf", nombre, { ...POS_CENTRO, align: "right" }),
      buildCertificatePdf(tpl, "application/pdf", nombre, { ...POS_CENTRO, align: "left" }),
    ]);
    const xc = drawnText(centro).x;
    const xr = drawnText(derecha).x;
    const xl = drawnText(izquierda).x;
    expect(xl).toBe(300); // sin ajuste: el ancla es el punto mismo
    expect(xr).toBeLessThan(xc);
    // right corre el texto el ancho completo; center, la mitad.
    expect(xl - xr).toBeCloseTo(2 * (xl - xc), 3);
  });

  it("nombre con emoji se sanitiza antes de dibujar (no lanza) y el color llega al PDF", async () => {
    const tpl = await makePdfTemplate();
    const out = await buildCertificatePdf(tpl, "application/pdf", "María ❤ López", {
      ...POS_CENTRO,
      color: "#ff0000",
    });
    const t = drawnText(out);
    expect(t.text).toBe("María López"); // sin emoji, espacios colapsados
    expect(t.content).toMatch(/1 0 0 rg/); // rojo puro en el operador de color
  });

  it("plantilla PNG 1×1: página del tamaño de la imagen y posición por defecto", async () => {
    const out = await buildCertificatePdf(PNG_1X1, "image/png", "Zoe", {});
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(out.slice(0, 5).toString()).toBe("%PDF-");

    const doc = await loadPdf(out);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPages()[0].getWidth()).toBe(1);
    expect(doc.getPages()[0].getHeight()).toBe(1);

    const t = drawnText(out);
    expect(t.text).toBe("Zoe");
    // pos vacío → fontPct 6 del default: 1px de ancho ⇒ fuente 0.06.
    expect(t.size).toBeCloseTo(0.06, 5);
    // y la imagen quedó incrustada como XObject de fondo
    expect(t.content).toMatch(/Do/);
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

/* ═══════════ exports.handler — HTTP y scheduled (instancia B) ═══════════ */

const httpPost = (body) => ({
  httpMethod: "POST",
  path: "/certificate-test",
  body: JSON.stringify(body),
});
const bodyOf = (res) => JSON.parse(res.body);

// Enruta ddb.send por tipo de comando: valor fijo o función (cmd) => result.
const ddbRoute = (routes) => {
  ddbSend.mockImplementation(async (cmd) => {
    const r = routes[cmd.__type];
    if (r === undefined) throw new Error(`ddb inesperado: ${cmd.__type}`);
    return typeof r === "function" ? r(cmd) : r;
  });
};

const EVENTO = {
  id: "ev1",
  title: "Congreso USFQ",
  certificate: "certs/plantilla.png",
  certificatePosition: '"centro"',
};

const asistente = (email, checkIn, answers) => ({
  id: `att-${email || "sin-email"}`,
  email,
  checkIn,
  formAnswers: answers,
});
const RESP_SI = [
  f("nombres", "Nombre", "Ana"),
  f("apellidos", "Apellidos", "Paz"),
  sel("cert_enviar", "¿Deseas recibir tu certificado de participación?", "Si", YN2),
];
const RESP_NO = [
  f("nombres", "Nombre", "Beto"),
  sel("cert_enviar", "¿Deseas recibir tu certificado de participación?", "No", YN2),
];
// Mezcla que ejercita TODOS los filtros del envío masivo.
const MIX_ASISTENTES = [
  asistente("", true, RESP_SI), // sin email → fuera
  asistente("no-fue@x.com", false, RESP_SI), // sin check-in → fuera
  asistente("dijo-no@x.com", true, RESP_NO), // respondió No → fuera
  asistente("carlos@mindfultech.ec", false, RESP_NO), // admin: exento de todo
  asistente("ana@x.com", true, RESP_SI),
  asistente("sin-form@x.com", true, null), // sin pregunta en el form → recibe
];
const ELEGIBLES = ["ana@x.com", "carlos@mindfultech.ec", "sin-form@x.com"];

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
    const res = await handler({ requestContext: { http: { method: "GET" } } });
    expect(res.statusCode).toBe(405);
    expect(bodyOf(res).error).toBe("Method GET not allowed");
  });

  it("body que no es JSON → 400 'Cuerpo inválido' sin tocar DynamoDB", async () => {
    const res = await handler({ httpMethod: "POST", body: "{roto" });
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("Cuerpo inválido");
    expect(ddbSend).not.toHaveBeenCalled();
  });
});

describe("handler POST — prueba individual (handleTest)", () => {
  it("sin eventId o sin email → 400 antes de tocar DynamoDB", async () => {
    expect((await handler(httpPost({ email: "x@y.z" }))).statusCode).toBe(400);
    expect((await handler(httpPost({ eventId: "ev1" }))).statusCode).toBe(400);
    expect(ddbSend).not.toHaveBeenCalled();
  });

  it("evento inexistente → 404", async () => {
    ddbRoute({ QueryCommand: { Items: [] }, GetCommand: { Item: undefined } });
    const res = await handler(httpPost({ eventId: "ev1", email: "a@b.c" }));
    expect(res.statusCode).toBe(404);
    expect(bodyOf(res).error).toBe("Evento no encontrado");
  });

  it("evento sin plantilla → 400 pidiendo subirla primero", async () => {
    ddbRoute({
      QueryCommand: { Items: [] },
      GetCommand: { Item: { id: "ev1", title: "Sin plantilla" } },
    });
    const res = await handler(httpPost({ eventId: "ev1", email: "a@b.c" }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe(
      "Sube una plantilla de certificado antes de probar"
    );
    expect(s3Send).not.toHaveBeenCalled();
  });

  it("email inscrito: usa el nombre REAL del registro y envía el PDF por SES", async () => {
    ddbRoute({
      QueryCommand: { Items: [asistente("ana@x.com", true, RESP_SI)] },
      GetCommand: { Item: EVENTO },
    });
    const res = await handler(httpPost({ eventId: "ev1", email: "ANA@x.com" }));
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({
      ok: true,
      sentTo: "ANA@x.com",
      name: "Ana Paz",
      nameSource: "registro",
    });
    // plantilla desde S3 con el prefijo public/ del storage de Amplify
    expect(s3Send.mock.calls[0][0].input).toEqual({
      Bucket: "bucket-test",
      Key: "public/certs/plantilla.png",
    });
    // correo por el transporte stream de nodemailer…
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.from).toBe("certificados@test.ec");
    expect(mail.to).toBe("ANA@x.com");
    expect(mail.subject).toBe("Certificado Evento USFQ");
    expect(mail.text).toContain("Congreso USFQ");
    expect(mail.attachments[0].filename).toBe("certificado.pdf");
    expect(mail.attachments[0].content.slice(0, 5).toString()).toBe("%PDF-");
    // …y el MIME crudo sale por SES
    expect(sesSend).toHaveBeenCalledTimes(1);
    expect(sesSend.mock.calls[0][0].__type).toBe("SendRawEmailCommand");
    expect(sesSend.mock.calls[0][0].input.RawMessage.Data.toString()).toBe(
      "RAW-MIME"
    );
  });

  it("la búsqueda del inscrito PAGINA con ExclusiveStartKey hasta encontrarlo", async () => {
    const pages = [
      {
        Items: [asistente("otra@x.com", true, RESP_SI)],
        LastEvaluatedKey: { id: "p2" },
      },
      { Items: [asistente("ana@x.com", true, RESP_SI)] },
    ];
    let q = 0;
    ddbRoute({ QueryCommand: () => pages[q++], GetCommand: { Item: EVENTO } });
    const res = await handler(httpPost({ eventId: "ev1", email: "ana@x.com" }));
    expect(bodyOf(res).nameSource).toBe("registro");
    const queries = ddbSend.mock.calls.filter(
      ([c]) => c.__type === "QueryCommand"
    );
    expect(queries).toHaveLength(2);
    expect(queries[0][0].input).toMatchObject({
      TableName: "EventAttendee-test",
      IndexName: "byEvent",
      KeyConditionExpression: "eventID = :e",
      ExpressionAttributeValues: { ":e": "ev1" },
    });
    expect(queries[0][0].input.ExclusiveStartKey).toBeUndefined();
    expect(queries[1][0].input.ExclusiveStartKey).toEqual({ id: "p2" });
  });

  it("overrides del admin: certificateKey/subject/name sin registro → nameSource param", async () => {
    ddbRoute({
      QueryCommand: { Items: [] },
      GetCommand: { Item: { id: "ev1", title: "E", certificate: "certs/vieja.png" } },
    });
    const res = await handler(
      httpPost({
        eventId: "ev1",
        email: "x@y.z",
        name: "Invitado QA",
        certificateKey: "certs/nueva.png",
        subject: "Asunto custom",
      })
    );
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toMatchObject({ name: "Invitado QA", nameSource: "param" });
    // prueba la plantilla RECIÉN subida, no la guardada
    expect(s3Send.mock.calls[0][0].input.Key).toBe("public/certs/nueva.png");
    expect(sendMail.mock.calls[0][0].subject).toBe("Asunto custom");
  });

  it("si la búsqueda del registro falla, cae al nombre de muestra sin reventar", async () => {
    ddbRoute({
      QueryCommand: () => {
        throw new Error("boom dynamo");
      },
      GetCommand: { Item: EVENTO },
    });
    const res = await handler(httpPost({ eventId: "ev1", email: "x@y.z" }));
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toMatchObject({
      name: "Nombre de Prueba",
      nameSource: "sample",
    });
  });

  it("fallo de S3 → 500 con mensaje y CORS (nunca un 502 opaco)", async () => {
    ddbRoute({ QueryCommand: { Items: [] }, GetCommand: { Item: EVENTO } });
    s3Send.mockImplementation(async () => {
      throw new Error("NoSuchKey");
    });
    const res = await handler(httpPost({ eventId: "ev1", email: "x@y.z" }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).error).toBe("NoSuchKey");
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("handler POST sendAll — reenvío manual corregido", () => {
  it("sin eventId → 400", async () => {
    const res = await handler(httpPost({ sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("eventId es requerido");
  });

  it("evento sin plantilla guardada → 400", async () => {
    ddbRoute({ GetCommand: { Item: { id: "ev1", title: "E" } } });
    const res = await handler(httpPost({ eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("El evento no tiene plantilla de certificado");
  });

  it("filtra email/check-in/respuesta-No, exime al admin y estampa SIN condición", async () => {
    ddbRoute({
      GetCommand: { Item: EVENTO },
      QueryCommand: { Items: MIX_ASISTENTES },
      UpdateCommand: {},
    });
    const res = await handler(
      httpPost({ eventId: "ev1", sendAll: true, subject: "Reenvío corregido" })
    );
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true, sent: 3, eligible: 3 });
    expect(sendMail.mock.calls.map(([m]) => m.to).sort()).toEqual(ELEGIBLES);
    sendMail.mock.calls.forEach(([m]) => {
      expect(m.subject).toBe("Reenvío corregido");
      expect(m.attachments[0].content.slice(0, 5).toString()).toBe("%PDF-");
    });
    expect(sesSend).toHaveBeenCalledTimes(3);
    // el reenvío manual RE-estampa aunque ya exista: sin ConditionExpression
    const updates = ddbSend.mock.calls.filter(
      ([c]) => c.__type === "UpdateCommand"
    );
    expect(updates).toHaveLength(1);
    expect(updates[0][0].input).toMatchObject({
      TableName: "Event-test",
      Key: { id: "ev1" },
      UpdateExpression: "SET certificatesSentAt = :now",
    });
    expect(updates[0][0].input.ConditionExpression).toBeUndefined();
  });

  it("un fallo individual no tumba el lote: sent cuenta solo los exitosos", async () => {
    ddbRoute({
      GetCommand: { Item: EVENTO },
      QueryCommand: { Items: MIX_ASISTENTES },
      UpdateCommand: {},
    });
    sendMail.mockImplementation(async (opts) => {
      if (opts.to === "ana@x.com") throw new Error("SES throttled");
      return { message: Buffer.from("RAW-MIME") };
    });
    const res = await handler(httpPost({ eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true, sent: 2, eligible: 3 });
  });

  it("sin elegibles → 400 y NO estampa certificatesSentAt", async () => {
    ddbRoute({
      GetCommand: { Item: EVENTO },
      QueryCommand: { Items: [asistente("no-fue@x.com", false, RESP_SI)] },
      UpdateCommand: {},
    });
    const res = await handler(httpPost({ eventId: "ev1", sendAll: true }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe(
      "No hay inscritos que hayan pedido certificado"
    );
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("handler scheduled — Scan→claim→Query→send", () => {
  const past = new Date(Date.now() - 3600e3).toISOString();
  const future = new Date(Date.now() + 3600e3).toISOString();

  it("sin eventos pendientes: 200 sin side effects", async () => {
    ddbRoute({ ScanCommand: { Items: [] } });
    expect(await handler({})).toEqual({ statusCode: 200 });
    expect(s3Send).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("evento terminado: claim condicional ANTES de enviar y filtros aplicados", async () => {
    ddbRoute({
      ScanCommand: { Items: [{ ...EVENTO, endDate: past }] },
      UpdateCommand: {},
      QueryCommand: { Items: MIX_ASISTENTES },
    });
    const res = await handler({});
    expect(res).toEqual({ statusCode: 200 });
    // scan de eventos que optaron y no se han procesado
    const scan = ddbSend.mock.calls[0][0];
    expect(scan.__type).toBe("ScanCommand");
    expect(scan.input).toMatchObject({
      TableName: "Event-test",
      FilterExpression:
        "sendCertificates = :t AND attribute_not_exists(certificatesSentAt)",
      ExpressionAttributeValues: { ":t": true },
    });
    // claim atómico (anti-duplicados)
    const updIdx = ddbSend.mock.calls.findIndex(
      ([c]) => c.__type === "UpdateCommand"
    );
    const upd = ddbSend.mock.calls[updIdx][0];
    expect(upd.input.ConditionExpression).toBe(
      "attribute_not_exists(certificatesSentAt)"
    );
    // …y ANTES del primer correo
    expect(ddbSend.mock.invocationCallOrder[updIdx]).toBeLessThan(
      sendMail.mock.invocationCallOrder[0]
    );
    expect(sendMail.mock.calls.map(([m]) => m.to).sort()).toEqual(ELEGIBLES);
    // el flujo automático usa el asunto por defecto
    expect(sendMail.mock.calls[0][0].subject).toBe("Certificado Evento USFQ");
  });

  it("se salta: sin terminar, sin plantilla, sendAt futuro (objeto nativo) o sin fechas", async () => {
    ddbRoute({
      ScanCommand: {
        Items: [
          { ...EVENTO, id: "e-futuro", endDate: future },
          { ...EVENTO, id: "e-sin-tpl", endDate: past, certificate: undefined },
          {
            ...EVENTO,
            id: "e-sendat",
            endDate: past,
            certificatePosition: { preset: "centro", sendAt: future },
          },
          { id: "e-sin-fecha", certificate: "c.png" },
        ],
      },
    });
    expect(await handler({})).toEqual({ statusCode: 200 });
    expect(s3Send).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(
      ddbSend.mock.calls.filter(([c]) => c.__type === "UpdateCommand")
    ).toHaveLength(0);
  });

  it("sendAt pasado (JSON string) dispara aunque el evento no tenga fecha", async () => {
    ddbRoute({
      ScanCommand: {
        Items: [
          {
            id: "ev9",
            title: "Taller",
            certificate: "c.png",
            certificatePosition: JSON.stringify({ preset: "centro", sendAt: past }),
          },
        ],
      },
      UpdateCommand: {},
      QueryCommand: { Items: [asistente("uno@x.com", true, RESP_SI)] },
    });
    await handler({});
    expect(sendMail.mock.calls.map(([m]) => m.to)).toEqual(["uno@x.com"]);
  });

  it("claim perdido (ConditionalCheckFailed) → salta ese evento y sigue con el resto", async () => {
    ddbRoute({
      ScanCommand: {
        Items: [
          { ...EVENTO, id: "ev1", endDate: past },
          { ...EVENTO, id: "ev2", endDate: past },
        ],
      },
      UpdateCommand: (cmd) => {
        if (cmd.input.Key.id === "ev1") {
          const e = new Error("ya reclamado");
          e.name = "ConditionalCheckFailedException";
          throw e;
        }
        return {};
      },
      QueryCommand: (cmd) => ({
        Items:
          cmd.input.ExpressionAttributeValues[":e"] === "ev2"
            ? [asistente("solo-ev2@x.com", true, RESP_SI)]
            : [asistente("nunca@x.com", true, RESP_SI)],
      }),
    });
    expect(await handler({})).toEqual({ statusCode: 200 });
    expect(sendMail.mock.calls.map(([m]) => m.to)).toEqual(["solo-ev2@x.com"]);
  });

  it("un error inesperado del claim revienta el handler (deja el retry a Lambda)", async () => {
    ddbRoute({
      ScanCommand: { Items: [{ ...EVENTO, endDate: past }] },
      UpdateCommand: () => {
        throw new Error("dynamo caído");
      },
    });
    await expect(handler({})).rejects.toThrow("dynamo caído");
    expect(sendMail).not.toHaveBeenCalled();
  });
});
