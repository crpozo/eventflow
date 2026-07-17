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
  resolvePosition,
  hexToRgb,
  buildCertificatePdf,
} = require("../../amplify/backend/function/certificateSender/src/index.js")._test;

const zlib = require("zlib");
// Misma versión (1.17.1) que la copia del Lambda: solo intercambiamos bytes.
const { PDFDocument } = require("pdf-lib");

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
