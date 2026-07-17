/* Tests de regenMissingTickets: la utilidad de consola que regenera tickets
 * para attendees que quedaron sin ticket (búsqueda, confirmación, dryRun y el
 * pipeline QR -> HTML -> PDF -> S3 -> DataStore -> verificación -> email).
 * Todo lo pesado va mockeado en la frontera (DataStore, storage, qrcode,
 * html2pdf.js, fetch). CRA usa resetMocks:true — las implementaciones se
 * reinstalan en beforeEach; los spies (confirm/alert/console/setTimeout) se
 * restauran en afterEach. Cobertura para SonarQube vía `npm run test:coverage`.
 */

jest.mock("aws-amplify/datastore", () => ({
  DataStore: { query: jest.fn(), save: jest.fn() },
}));

jest.mock("aws-amplify/storage", () => ({
  uploadData: jest.fn(),
  getUrl: jest.fn(),
}));

jest.mock("models", () => ({
  EventAttendee: {
    // copyOf fiel al real: clona el original y aplica el mutador.
    copyOf: (orig, mutate) => {
      const draft = { ...orig };
      mutate(draft);
      return draft;
    },
  },
}));

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: jest.fn() },
}));

// Cadena html2pdf().set().from().toPdf().get("pdf") con estado inspeccionable:
// captura el elemento del ticket y deja fijar los bytes del PDF por test.
jest.mock("html2pdf.js", () => {
  const state = { element: null, buffer: null };
  const chain = {
    set: () => chain,
    from: (el) => {
      state.element = el;
      return chain;
    },
    toPdf: () => chain,
    get: async () => ({ output: () => state.buffer }),
  };
  return { __esModule: true, __state: state, default: () => chain };
});

const { DataStore } = require("aws-amplify/datastore");
const { uploadData, getUrl } = require("aws-amplify/storage");
const QRCode = require("qrcode").default;
const pdfState = require("html2pdf.js").__state;
const { regenMissingTickets } = require("services/regenMissingTickets");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const eventFixture = {
  id: "ev-1",
  title: "Congreso USFQ",
  location: "Quito",
  date: "2026-08-01T15:00:00.000Z",
};

const mkAttendee = (over = {}) => ({
  id: "ea-1",
  eventID: "ev-1",
  email: "ana@x.com",
  ticket: "",
  createdAt: "2026-07-01T00:00:00.000Z",
  formAnswers: JSON.stringify([
    { name: "nombres", label: "Nombre", type: "text", userData: ["Ana María"] },
  ]),
  ...over,
});

/* ── Estado por test ───────────────────────────────────────────────────── */

let store; // id -> EventAttendee "en la nube"
let predicateEventIds; // eventIDs consultados por findMissing
let confirmSpy;
let alertSpy;

const seed = (...rows) => rows.forEach((r) => store.set(r.id, r));

beforeAll(() => {
  // jsdom (jest 27) no implementa HTMLImageElement.decode; sin esto la espera
  // de imágenes de generatePDFBase64 se cuelga para siempre.
  Object.defineProperty(window.HTMLImageElement.prototype, "decode", {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(),
  });
});

beforeEach(() => {
  store = new Map();
  predicateEventIds = [];

  // query(Model, id) -> registro; query(Model, predicado) -> todos (y se
  // ejecuta el predicado con un stub para cubrir la lambda eventID.eq).
  DataStore.query.mockImplementation(async (Model, criteria) => {
    if (typeof criteria === "string") return store.get(criteria);
    if (typeof criteria === "function")
      criteria({
        eventID: {
          eq: (v) => {
            predicateEventIds.push(v);
            return true;
          },
        },
      });
    return [...store.values()];
  });
  DataStore.save.mockImplementation(async (m) => {
    store.set(m.id, m); // simula el sync DataStore -> nube
    return m;
  });

  uploadData.mockImplementation(() => ({
    result: Promise.resolve({ key: "subido" }),
  }));
  getUrl.mockImplementation(async ({ key }) => ({
    url: { pathname: `/public/${key}` },
  }));

  QRCode.toDataURL.mockResolvedValue("data:image/png;base64,QRDATA");
  pdfState.buffer = Uint8Array.from([37, 80, 68, 70]).buffer; // "%PDF"
  pdfState.element = null;

  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  }));

  confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "table").mockImplementation(() => {});

  // Las esperas reales (15s de sync + 1s de throttle) corren al instante.
  jest.spyOn(global, "setTimeout").mockImplementation((cb) => {
    cb();
    return 0;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

/* ── Guardas previas al pipeline ───────────────────────────────────────── */

describe("regenMissingTickets — guardas", () => {
  it("sin evento (o sin id) no consulta nada y loguea el error", async () => {
    expect(await regenMissingTickets(null)).toBeUndefined();
    expect(await regenMissingTickets({ title: "sin id" })).toBeUndefined();
    expect(DataStore.query).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[regen] No event provided.");
  });

  it("si todos tienen ticket: alerta 'nada que hacer' y no pide confirmación", async () => {
    seed(mkAttendee({ ticket: "public/ya-tiene.pdf" }));
    const res = await regenMissingTickets(eventFixture);
    expect(res).toBeUndefined();
    expect(alertSpy).toHaveBeenCalledWith(
      "No hay attendees sin ticket. Nada que hacer."
    );
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(predicateEventIds).toContain("ev-1");
  });

  it("confirm cancelado: lista los emails (con placeholder) y no hace nada", async () => {
    confirmSpy.mockReturnValue(false);
    seed(mkAttendee(), mkAttendee({ id: "ea-2", email: null }));
    const res = await regenMissingTickets(eventFixture);
    expect(res).toBeUndefined();
    const msg = confirmSpy.mock.calls[0][0];
    expect(msg).toContain('evento "Congreso USFQ"');
    expect(msg).toContain("2 attendees");
    expect(msg).toContain("ana@x.com");
    expect(msg).toContain("(sin email)");
    expect(uploadData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("dryRun devuelve SOLO los faltantes (ticket null o vacío) sin efectos", async () => {
    seed(
      mkAttendee({ id: "ea-0", ticket: "public/ya.pdf" }),
      mkAttendee({ id: "ea-1", ticket: null }),
      mkAttendee({ id: "ea-2", ticket: "", email: "b@x.com" })
    );
    const res = await regenMissingTickets(eventFixture, { dryRun: true });
    expect(res.map((r) => r.id).sort()).toEqual(["ea-1", "ea-2"]);
    expect(confirmSpy).toHaveBeenCalled(); // dryRun igual confirma la lista
    expect(uploadData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

/* ── Camino feliz ──────────────────────────────────────────────────────── */

describe("regenMissingTickets — camino feliz", () => {
  it("genera QR, sube el PDF, guarda ticket+authorized, verifica y dispara el email", async () => {
    seed(mkAttendee());
    const res = await regenMissingTickets(eventFixture);

    expect(res).toEqual({ sent: ["ana@x.com"], failed: [] });

    // QR con el id del attendee y el tamaño del ticket.
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      "ea-1",
      expect.objectContaining({ width: 170 })
    );

    // Subida a S3: key attendee_evento y el base64 del PDF mockeado ("%PDF").
    expect(uploadData).toHaveBeenCalledWith({
      key: "ea-1_ev-1_ticket.txt",
      data: btoa("%PDF"),
      options: { accessLevel: "guest", metadata: { key: "ev-1" } },
    });
    expect(getUrl).toHaveBeenCalledWith({
      key: "ea-1_ev-1_ticket.txt",
      options: { accessLevel: "guest" },
    });

    // Guarda sobre el registro original: ticket con el path decodificado y
    // authorized=true (via EventAttendee.copyOf).
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ea-1",
        ticket: "public/ea-1_ev-1_ticket.txt",
        authorized: true,
      })
    );

    // Email transaccional con el payload de pago exitoso.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain("trigger-email");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      eventAttendeeId: "ea-1",
      typePayment: "CARD",
      statusPayment: "SUCCESSFUL",
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Enviados: 1")
    );
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Fallidos: 0")
    );
  });

  it("el HTML del ticket lleva nombre, título, ubicación, fecha es-ES y el QR", async () => {
    seed(mkAttendee());
    await regenMissingTickets(eventFixture);

    const el = pdfState.element;
    expect(el).not.toBeNull();
    expect(el.textContent).toContain("Ana María");
    expect(el.textContent).toContain("Congreso USFQ");
    expect(el.textContent).toContain("Quito");
    // Fecha real formateada, no el placeholder.
    expect(el.textContent).not.toContain("Fecha del evento");
    expect(el.textContent).toContain("2026");
    expect(el.innerHTML).toContain("data:image/png;base64,QRDATA");
    // El div temporal se limpia del documento al terminar.
    expect(document.body.contains(el)).toBe(false);
  });

  it("usa los fallbacks cuando faltan título/ubicación/fecha y nombre", async () => {
    seed(mkAttendee({ formAnswers: "[]" }));
    await regenMissingTickets({ id: "ev-2" });

    const el = pdfState.element;
    expect(el.textContent).toContain("Participante");
    expect(el.textContent).toContain("Evento USFQ");
    expect(el.textContent).toContain("Ubicación del evento");
    expect(el.textContent).toContain("Fecha del evento");
  });

  it("formAnswers corrupto no rompe: cae a 'Participante' y envía igual", async () => {
    seed(mkAttendee({ formAnswers: "{no-es-json" }));
    const res = await regenMissingTickets(eventFixture);
    expect(res.sent).toEqual(["ana@x.com"]);
    expect(res.failed).toEqual([]);
    expect(pdfState.element.textContent).toContain("Participante");
  });
});

/* ── Fallos por attendee (el lote continúa) ────────────────────────────── */

describe("regenMissingTickets — fallos por attendee", () => {
  it("attendee sin email falla y el resto del lote continúa", async () => {
    seed(
      mkAttendee({ id: "ea-1", email: null }),
      mkAttendee({ id: "ea-2", email: "b@x.com" })
    );
    const res = await regenMissingTickets(eventFixture);
    expect(res.sent).toEqual(["b@x.com"]);
    expect(res.failed).toEqual([
      { email: null, id: "ea-1", error: "EventAttendee sin email" },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1); // solo el que sí tenía email
    // console.table: listado inicial + tabla de fallidos.
    expect(console.table).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Enviados: 1")
    );
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Fallidos: 1")
    );
  });

  it("QR vacío se reporta como fallo y no sube nada", async () => {
    QRCode.toDataURL.mockResolvedValue("");
    seed(mkAttendee());
    const res = await regenMissingTickets(eventFixture);
    expect(res.sent).toEqual([]);
    expect(res.failed[0]).toEqual(
      expect.objectContaining({ id: "ea-1", error: "Fallo al generar QR" })
    );
    expect(uploadData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("PDF vacío se reporta como fallo y no sube nada", async () => {
    pdfState.buffer = new ArrayBuffer(0); // btoa("") -> "" -> 'PDF vacío'
    seed(mkAttendee());
    const res = await regenMissingTickets(eventFixture);
    expect(res.failed[0]).toEqual(
      expect.objectContaining({ id: "ea-1", error: "PDF vacío" })
    );
    expect(uploadData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("si el ticket no aparece sincronizado tras la espera NO dispara el email", async () => {
    // save que no persiste: la verificación relee el registro viejo (ticket "").
    DataStore.save.mockImplementation(async (m) => m);
    seed(mkAttendee());
    const res = await regenMissingTickets(eventFixture);
    expect(res.sent).toEqual([]);
    expect(res.failed[0].error).toMatch(/no sincronizado/);
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("respuesta !ok del API de email marca el fallo con el status HTTP", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    seed(mkAttendee());
    const res = await regenMissingTickets(eventFixture);
    expect(res.sent).toEqual([]);
    expect(res.failed[0]).toEqual(
      expect.objectContaining({
        email: "ana@x.com",
        error: "Email API HTTP 500",
      })
    );
    // El ticket sí llegó a subirse y guardarse; solo falló el correo.
    expect(uploadData).toHaveBeenCalledTimes(1);
    expect(DataStore.save).toHaveBeenCalledTimes(1);
  });
});
