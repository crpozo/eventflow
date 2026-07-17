/* Tests de los COMPONENTES de participantes:
 *   - UploadExcelButton     (import Excel → saves + ticket PDF + email)
 *   - DownloadBadgeButton   (badge PDF con getUrl/pdf-lib mockeados)
 *   - DownloadAllBadgesButton (ZIP con un badge por participante)
 *   - DeleteParticipantButton (confirm + deletes en cascada)
 *
 * Todo lo pesado va mockeado en la frontera: xlsx, qrcode, html2pdf, pdf-lib,
 * jszip, storage, api y DataStore. File#arrayBuffer se stubbea con un buffer
 * fijo (jsdom 16 no lo implementa) y los sleeps de 15s/1s van con fake timers.
 */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

jest.mock("models", () => {
  let seq = 0;
  const mk = (name) => {
    function Model(init = {}) {
      Object.assign(this, init);
      if (!this.id) this.id = `${name.toLowerCase()}-${++seq}`;
    }
    Object.defineProperty(Model, "name", { value: name });
    Model.copyOf = (base, mutate) => {
      const draft = { ...base };
      mutate(draft);
      Object.defineProperty(draft, "__model", { value: name, enumerable: false });
      return draft;
    };
    return Model;
  };
  return {
    __esModule: true,
    Event: mk("Event"),
    EventAttendee: mk("EventAttendee"),
    Attendee: mk("Attendee"),
    Form: mk("Form"),
  };
});

jest.mock("aws-amplify/datastore", () => {
  const fixtures = {};
  const capture = (pred) => {
    let got = null;
    const node = (path) =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (prop === "eq") {
              return (v) => {
                got = { path, value: v };
                return true;
              };
            }
            return node([...path, prop]);
          },
        }
      );
    try {
      pred(node([]));
    } catch {
      got = null;
    }
    return got;
  };
  const deepGet = (obj, path) =>
    path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  const queryImpl = async (Model, pred) => {
    const rows = fixtures[Model?.name] || [];
    if (pred === undefined) return rows;
    if (typeof pred === "string") return rows.find((r) => r.id === pred);
    const cond = capture(pred);
    if (!cond) return rows;
    return rows.filter((r) => deepGet(r, cond.path) === cond.value);
  };
  const saveImpl = async (m) => {
    const name =
      m.__model ||
      (m.constructor && m.constructor.name !== "Object" && m.constructor.name);
    if (name) {
      const arr = (fixtures[name] = fixtures[name] || []);
      const i = arr.findIndex((r) => r.id === m.id);
      if (i >= 0) arr[i] = m;
      else arr.push(m);
    }
    return m;
  };
  const DataStore = {
    __fixtures: fixtures,
    __impls: { queryImpl, saveImpl },
    query: jest.fn(queryImpl),
    save: jest.fn(saveImpl),
    delete: jest.fn(async (m) => m),
  };
  return { DataStore };
});

jest.mock("aws-amplify/storage", () => ({
  uploadData: jest.fn(),
  getUrl: jest.fn(),
}));

jest.mock("aws-amplify/api", () => {
  const graphql = jest.fn();
  return { __graphql: graphql, generateClient: () => ({ graphql }) };
});

jest.mock("xlsx", () => ({ read: jest.fn(), utils: { sheet_to_json: jest.fn() } }));
jest.mock("qrcode", () => ({ __esModule: true, default: { toDataURL: jest.fn() } }));

jest.mock("html2pdf.js", () => {
  const chain = {};
  chain.set = () => chain;
  chain.from = () => chain;
  chain.toPdf = () => chain;
  chain.get = async () => ({
    output: () => new Uint8Array([37, 80, 68, 70]).buffer,
  });
  return { __esModule: true, default: () => chain };
});

// pdf-lib con estado inspeccionable (campos, rotaciones) — import dinámico
jest.mock("pdf-lib", () => {
  const state = { fields: [], setRotation: null, savedDocs: 0 };
  const mkPage = () => ({
    getRotation: () => ({ angle: 0 }),
    setRotation: (...args) => state.setRotation && state.setRotation(...args),
  });
  const PDFDocument = {
    create: async () => ({
      copyPages: async () => [mkPage()],
      addPage: () => {},
      save: async () => {
        state.savedDocs += 1;
        return new Uint8Array([1, 2, 3]);
      },
    }),
    load: async () => ({
      getForm: () => ({ getFields: () => state.fields, flatten: () => {} }),
    }),
  };
  return {
    __esModule: true,
    __state: state,
    PDFDocument,
    degrees: (angle) => ({ angle }),
    PDFName: { of: (s) => s },
    PDFString: { of: (s) => s },
  };
});

jest.mock("jszip", () => {
  const state = { files: [] };
  function JSZip() {
    this.file = (name, data) => state.files.push({ name, data });
    this.generateAsync = async () => new Blob(["zip"]);
  }
  JSZip.__state = state;
  return { __esModule: true, default: JSZip };
});

jest.mock("@chakra-ui/button", () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

/* ── Sujetos y helpers ─────────────────────────────────────────────────── */

const { DataStore } = require("aws-amplify/datastore");
const { uploadData, getUrl } = require("aws-amplify/storage");
const { __graphql: graphqlMock } = require("aws-amplify/api");
const XLSX = require("xlsx");
const QRCode = require("qrcode").default;
const pdfLibState = require("pdf-lib").__state;
const zipState = require("jszip").default.__state;
const models = require("models");

const UploadExcelButton =
  require("views/admin/eventos/participantes/components/UploadExcelButton").default;
const DownloadBadgeButton =
  require("views/admin/eventos/participantes/components/DownloadBadgeButton").default;
const DownloadAllBadgesButton =
  require("views/admin/eventos/participantes/components/DownloadAllBadgesButton").default;
const DeleteParticipantButton =
  require("views/admin/eventos/participantes/components/DeleteParticipantButton").default;

const eventFixture = {
  id: "ev-1",
  title: "Evento Test",
  eventBadgeId: "badge-1",
  location: "Quito",
  date: "2026-08-01T15:00:00.000Z",
};

const badgeFixture = { id: "badge-1", frontDesign: "front.pdf", backDesign: null };

const attendeeAna = {
  id: "ea-1",
  attendeeID: "att-1",
  email: "ana@x.com",
  formAnswers: [
    { name: "nombres", label: "Nombres", userData: ["Ana García"] },
    { name: "universidad", label: "Universidad", userData: ["USFQ"] },
    { name: "cargo", label: "Cargo", userData: ["Estudiante"] },
  ],
};

const mkField = (name) => ({ getName: () => name, setText: jest.fn() });

// Ancla capturada para inspeccionar descargas (download/href).
// El createElement REAL se captura una sola vez: volver a bindearlo en cada
// beforeEach re-bindearía el propio spy y recursa infinito.
let anchors = [];
const realCreateElement = document.createElement.bind(document);

// jsdom 16 no implementa File#arrayBuffer: se stubbea con un buffer fijo
const realFileArrayBuffer = File.prototype.arrayBuffer;
const stubFileArrayBuffer = (impl) => {
  File.prototype.arrayBuffer =
    impl || (async () => new Uint8Array([1, 2, 3]).buffer);
};

const flushWithTimers = async (steps = 40, ms = 500) => {
  await act(async () => {
    for (let i = 0; i < steps; i++) {
      jest.advanceTimersByTime(ms);
      // varios ticks de microtasks por paso para drenar cadenas de awaits
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }
  });
};

beforeAll(() => {
  window.HTMLImageElement.prototype.decode = () => Promise.resolve();
});

beforeEach(() => {
  // resetMocks:true (CRA) — se re-priman las implementaciones.
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  DataStore.save.mockImplementation(DataStore.__impls.saveImpl);
  DataStore.delete.mockImplementation(async (m) => m);
  uploadData.mockImplementation(() => ({ result: Promise.resolve({}) }));
  getUrl.mockImplementation(async ({ key }) => ({
    url: new URL(`https://cdn.test/${key}`),
  }));
  graphqlMock.mockImplementation(async () => ({
    data: { getBadge: badgeFixture },
  }));
  XLSX.read.mockReturnValue({ SheetNames: ["Hoja1"], Sheets: { Hoja1: {} } });
  XLSX.utils.sheet_to_json.mockReturnValue([
    { Email: "ana@x.com", Nombres: "Ana García", Universidad: "USFQ" },
  ]);
  QRCode.toDataURL.mockResolvedValue("data:image/png;base64,QR");

  const f = DataStore.__fixtures;
  Object.keys(f).forEach((k) => delete f[k]);
  pdfLibState.fields = [];
  pdfLibState.setRotation = jest.fn();
  pdfLibState.savedDocs = 0;
  zipState.files.length = 0;

  anchors = [];
  jest.spyOn(document, "createElement").mockImplementation((tag, opts) => {
    const el = realCreateElement(tag, opts);
    if (String(tag).toLowerCase() === "a") anchors.push(el);
    return el;
  });
  jest
    .spyOn(window.HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  window.URL.createObjectURL = jest.fn(() => "blob:mock");
  window.URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
    arrayBuffer: async () => new Uint8Array([9, 9]).buffer,
  }));
  jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  File.prototype.arrayBuffer = realFileArrayBuffer;
});

/* ── UploadExcelButton ─────────────────────────────────────────────────── */

describe("UploadExcelButton", () => {
  const seedForm = () => {
    DataStore.__fixtures.Form = [
      {
        id: "form-1",
        formEventId: "ev-1",
        questions: [
          { name: "nombres", label: "Nombres", type: "text" },
          { name: "email", label: "Email", type: "text" },
          { name: "universidad", label: "Universidad", type: "text" },
        ],
      },
    ];
  };

  const changeExcelFile = (name = "participantes.xlsx") => {
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [new File(["xlsx"], name)] },
    });
  };

  test("alerta si el evento aún no está cargado", () => {
    render(<UploadExcelButton event={null} />);
    fireEvent.click(screen.getByText("Importar Usuarios"));
    expect(window.alert).toHaveBeenCalledWith(
      "Error: No se ha cargado la información del evento. Por favor recarga la página."
    );
  });

  test("importa el Excel: guarda Attendee/EventAttendee, sube el ticket y envía el email", async () => {
    stubFileArrayBuffer();
    seedForm();

    render(<UploadExcelButton event={eventFixture} />);
    const input = document.querySelector('input[type="file"]');

    jest.useFakeTimers();
    fireEvent.change(input, {
      target: { files: [new File(["xlsx"], "participantes.xlsx")] },
    });

    // Mientras procesa muestra el estado pendiente
    expect(
      screen.getByText("Importando y Generando Tickets...")
    ).toBeInTheDocument();

    // Drena la espera de 15s de sincronización + 1s entre emails
    await flushWithTimers();

    expect(window.alert).toHaveBeenCalledWith(
      "Importación completada. Los tickets han sido generados y enviados por email."
    );

    const saved = DataStore.save.mock.calls.map((c) => c[0]);
    const attendee = saved.find((m) => m instanceof models.Attendee);
    expect(attendee).toBeTruthy();

    const ea = saved.find((m) => m instanceof models.EventAttendee);
    expect(ea).toEqual(
      expect.objectContaining({
        eventID: "ev-1",
        attendeeID: attendee.id,
        email: "ana@x.com",
        checkIn: false,
        quantity: 1,
      })
    );
    expect(ea.profileURL).toContain(`/usuario/${attendee.id}`);

    // Las respuestas del formulario se mapean desde las columnas del Excel
    const answers = JSON.parse(ea.formAnswers);
    expect(answers.find((a) => a.name === "nombres").userData).toEqual([
      "Ana García",
    ]);
    expect(answers.find((a) => a.name === "universidad").userData).toEqual([
      "USFQ",
    ]);

    // El PDF se sube a storage con la key attendee_evento
    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({ key: `${ea.id}_ev-1_ticket.txt` })
    );

    // El EventAttendee queda autorizado y con el ticket apuntando al archivo
    const updated = saved.find((m) => m.__model === "EventAttendee" && m.ticket);
    expect(updated).toEqual(
      expect.objectContaining({
        authorized: true,
        ticket: `${ea.id}_ev-1_ticket.txt`,
      })
    );

    // Email disparado al API con el id del EventAttendee
    const emailCall = global.fetch.mock.calls.find(([url]) =>
      String(url).includes("trigger-email")
    );
    expect(emailCall).toBeTruthy();
    expect(JSON.parse(emailCall[1].body)).toEqual(
      expect.objectContaining({
        eventAttendeeId: ea.id,
        statusPayment: "SUCCESSFUL",
      })
    );

    // Vuelve al estado normal
    expect(screen.getByText("Importar Usuarios")).toBeInTheDocument();
  });

  test("si el Excel no se puede procesar alerta y sale del estado pendiente", async () => {
    stubFileArrayBuffer();
    XLSX.read.mockImplementation(() => {
      throw new Error("archivo corrupto");
    });

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile("malo.xlsx");

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Hubo un error procesando el archivo."
      )
    );
    expect(screen.getByText("Importar Usuarios")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("si la lectura del archivo falla se resetea sin alertar", async () => {
    stubFileArrayBuffer(async () => {
      throw new Error("lectura fallida");
    });

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile("roto.xlsx");

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "❌ Error leyendo el archivo:",
        expect.any(Error)
      )
    );
    expect(screen.getByText("Importar Usuarios")).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("si un participante falla lo registra y completa la importación", async () => {
    stubFileArrayBuffer();
    seedForm();
    // El primer save (createAttendee) revienta: el loop sigue con el resto
    DataStore.save.mockRejectedValueOnce(new Error("save roto"));

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile();

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Importación completada. Los tickets han sido generados y enviados por email."
      )
    );
    expect(console.error).toHaveBeenCalledWith(
      "❌ Error procesando participante del Excel:",
      expect.any(Error)
    );
    expect(uploadData).not.toHaveBeenCalled();
  });

  test("si el QR falla no genera ticket pero completa la importación", async () => {
    stubFileArrayBuffer();
    seedForm();
    QRCode.toDataURL.mockRejectedValue(new Error("qr roto"));

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile();

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Importación completada. Los tickets han sido generados y enviados por email."
      )
    );
    expect(uploadData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerta si el ticket queda vacío y no envía el email", async () => {
    stubFileArrayBuffer();
    seedForm();
    // getUrl devuelve la raíz: el pathname queda vacío y el ticket también
    getUrl.mockImplementation(async () => ({
      url: new URL("https://cdn.test/"),
    }));

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile();

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "ERROR: No se pudo generar el ticket para ana@x.com. Email no enviado."
      )
    );
    expect(window.alert).toHaveBeenCalledWith(
      "Importación completada. Los tickets han sido generados y enviados por email."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerta si el ticket no se sincroniza tras la espera de 15s", async () => {
    stubFileArrayBuffer();
    seedForm();
    // La verificación por id nunca encuentra el registro sincronizado
    DataStore.query.mockImplementation(async (Model, pred) => {
      if (typeof pred === "string") return undefined;
      return DataStore.__impls.queryImpl(Model, pred);
    });

    render(<UploadExcelButton event={eventFixture} />);
    jest.useFakeTimers();
    changeExcelFile();

    await flushWithTimers();

    expect(window.alert).toHaveBeenCalledWith(
      "ERROR: El ticket no se sincronizó para ana@x.com. Email no enviado."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("si el envío del email falla lo registra y completa la importación", async () => {
    stubFileArrayBuffer();
    seedForm();
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    render(<UploadExcelButton event={eventFixture} />);
    jest.useFakeTimers();
    changeExcelFile();

    await flushWithTimers();

    expect(console.error).toHaveBeenCalledWith(
      "❌ Error enviando email a ana@x.com:",
      expect.any(Error)
    );
    expect(window.alert).toHaveBeenCalledWith(
      "Importación completada. Los tickets han sido generados y enviados por email."
    );
  });

  test("el botón abre el selector de archivos cuando el evento está cargado", () => {
    render(<UploadExcelButton event={eventFixture} />);
    const input = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByText("Importar Usuarios"));

    expect(clickSpy).toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("alerta si el evento se pierde antes de procesar el archivo", async () => {
    stubFileArrayBuffer();

    render(<UploadExcelButton event={null} />);
    changeExcelFile();

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Error: El evento no se ha cargado correctamente. Por favor recarga la página."
      )
    );
    expect(screen.getByText("Importar Usuarios")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("alerta si la subida del archivo no se puede manejar", async () => {
    render(<UploadExcelButton event={eventFixture} />);
    // files nulo: el handler revienta antes de leer y cae al catch externo
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: null },
    });

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Error manejando la subida del archivo."
      )
    );
    expect(console.error).toHaveBeenCalledWith(
      "❌ Error manejando la subida del archivo:",
      expect.any(Error)
    );
  });

  test("mapea columnas del Excel por coincidencia parcial de nombre", async () => {
    stubFileArrayBuffer();
    seedForm();
    // Sin QR el flujo corta tras guardar el EventAttendee: no hacen falta timers
    QRCode.toDataURL.mockRejectedValue(new Error("sin qr"));
    XLSX.utils.sheet_to_json.mockReturnValue([
      {
        Email: "ana@x.com",
        "Nombre completo": "Ana García",
        "Universidad de origen": "USFQ",
      },
    ]);

    render(<UploadExcelButton event={eventFixture} />);
    changeExcelFile();

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Importación completada. Los tickets han sido generados y enviados por email."
      )
    );

    const ea = DataStore.save.mock.calls
      .map((c) => c[0])
      .find((m) => m instanceof models.EventAttendee);
    const answers = JSON.parse(ea.formAnswers);
    expect(answers.find((a) => a.name === "nombres").userData).toEqual([
      "Ana García",
    ]);
    expect(answers.find((a) => a.name === "universidad").userData).toEqual([
      "USFQ",
    ]);
    expect(answers.find((a) => a.name === "email").userData).toEqual([
      "ana@x.com",
    ]);
  });
});

/* ── DownloadBadgeButton ───────────────────────────────────────────────── */

describe("DownloadBadgeButton", () => {
  test("alerta si el evento no tiene badge configurado", () => {
    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={{ id: "ev-1" }} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));
    expect(window.alert).toHaveBeenCalledWith(
      "No hay un diseño de badge configurado para este evento"
    );
  });

  test("alerta si el badge no existe en la API", async () => {
    graphqlMock.mockImplementation(async () => ({ data: { getBadge: null } }));
    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "No se encontró el diseño del badge"
      )
    );
  });

  test("arma el PDF: llena los campos con los datos del participante y lo descarga", async () => {
    pdfLibState.fields = [
      mkField("field_one"),
      mkField("field_two"),
      mkField("field_three"),
    ];
    graphqlMock.mockImplementation(async () => ({
      data: {
        getBadge: { id: "badge-1", frontDesign: "front.pdf", backDesign: "back.pdf" },
      },
    }));

    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(anchors.some((a) => a.download && a.download.endsWith(".pdf"))).toBe(
        true
      )
    );

    // Pide el badge del evento por id
    expect(graphqlMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: "badge-1" } })
    );

    // Descarga front y back desde storage con getUrl mockeado
    expect(getUrl).toHaveBeenCalledWith({ key: "front.pdf" });
    expect(getUrl).toHaveBeenCalledWith({ key: "back.pdf" });
    expect(global.fetch).toHaveBeenCalledWith("https://cdn.test/front.pdf");
    expect(global.fetch).toHaveBeenCalledWith("https://cdn.test/back.pdf");

    // Campos llenados desde formAnswers (nombre/universidad/cargo)
    expect(pdfLibState.fields[0].setText).toHaveBeenCalledWith("Ana García");
    expect(pdfLibState.fields[1].setText).toHaveBeenCalledWith("USFQ");
    expect(pdfLibState.fields[2].setText).toHaveBeenCalledWith("Estudiante");

    // La página trasera se rota 180 grados
    expect(pdfLibState.setRotation).toHaveBeenCalledWith({ angle: 180 });

    // Nombre del archivo con el nombre del participante
    const link = anchors.find((a) => a.download && a.download.endsWith(".pdf"));
    expect(link.download).toBe("badge-Ana-García.pdf");

    // Con campos llenados no hay alertas
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("avisa cuando el PDF no tiene campos de formulario", async () => {
    pdfLibState.fields = [];
    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("El PDF no tiene campos de formulario")
      )
    );
  });

  test("llena vía acroField, trunca textos largos y tolera campos sin soporte", async () => {
    const acroSet = jest.fn();
    pdfLibState.fields = [
      { getName: () => "field_one", acroField: { dict: { set: acroSet } } },
      mkField("field_two"),
      { getName: () => "field_three" },
    ];
    const attendeeLargo = {
      id: "ea-9",
      email: "largo@x.com",
      formAnswers: [
        {
          name: "nombres",
          userData: [
            "Nombre Extremadamente Largo Que Supera Los Cuarenta Caracteres",
          ],
        },
        { name: "universidad", userData: ["USFQ"] },
      ],
    };

    render(
      <DownloadBadgeButton eventAttendee={attendeeLargo} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(anchors.some((a) => a.download && a.download.endsWith(".pdf"))).toBe(
        true
      )
    );

    // El campo sin setText se llena vía acroField con el texto truncado (27 + …)
    expect(acroSet).toHaveBeenCalledWith("V", "Nombre Extremadamente Largo...");
    // El campo con setText se llena normalmente
    expect(pdfLibState.fields[1].setText).toHaveBeenCalledWith("USFQ");
    // Con campos llenados (2 de 3) no hay alertas
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("avisa cuando los campos del PDF no coinciden con los datos disponibles", async () => {
    pdfLibState.fields = [mkField("otro_campo")];
    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("ADVERTENCIA")
      )
    );
    expect(pdfLibState.fields[0].setText).not.toHaveBeenCalled();
  });

  test("si falla el diseño posterior lo registra y descarga solo el frente", async () => {
    pdfLibState.fields = [mkField("field_one")];
    graphqlMock.mockImplementation(async () => ({
      data: {
        getBadge: { id: "badge-1", frontDesign: "front.pdf", backDesign: "back.pdf" },
      },
    }));
    getUrl
      .mockImplementationOnce(async ({ key }) => ({
        url: new URL(`https://cdn.test/${key}`),
      }))
      .mockImplementationOnce(async () => {
        throw new Error("S3 caído");
      });

    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(anchors.some((a) => a.download === "badge-Ana-García.pdf")).toBe(true)
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error al cargar el diseño posterior:",
      expect.any(Error)
    );
  });

  test("alerta si la descarga del badge falla", async () => {
    graphqlMock.mockImplementation(async () => {
      throw new Error("sin conexión");
    });
    render(
      <DownloadBadgeButton eventAttendee={attendeeAna} event={eventFixture} />
    );
    fireEvent.click(screen.getByTitle("Descargar Badge"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Error al descargar el badge: sin conexión"
      )
    );
    // El botón vuelve a su estado normal
    expect(screen.getByText("Badge")).toBeInTheDocument();
  });
});

/* ── DownloadAllBadgesButton ───────────────────────────────────────────── */

describe("DownloadAllBadgesButton", () => {
  const tableData = [
    { eventAttendee: attendeeAna },
    { eventAttendee: { id: "ea-2", email: "luis@x.com", formAnswers: null } },
  ];

  test("alerta si no hay badge configurado", () => {
    render(<DownloadAllBadgesButton event={{ id: "ev-1" }} tableData={tableData} />);
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));
    expect(window.alert).toHaveBeenCalledWith(
      "No hay un diseño de badge configurado para este evento"
    );
  });

  test("alerta si no hay participantes", () => {
    render(<DownloadAllBadgesButton event={eventFixture} tableData={[]} />);
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));
    expect(window.alert).toHaveBeenCalledWith("No hay participantes para descargar");
  });

  test("genera un ZIP con un badge por participante y lo descarga", async () => {
    pdfLibState.fields = [mkField("field_one")];

    render(
      <DownloadAllBadgesButton event={eventFixture} tableData={tableData} />
    );
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("✓ 2 badges generados")
      )
    );

    // Un PDF por participante dentro del ZIP; el segundo cae al email
    expect(zipState.files.map((f) => f.name)).toEqual([
      "badge-Ana-García.pdf",
      "badge-luis.pdf",
    ]);

    // El ZIP se descarga con el título del evento
    const link = anchors.find((a) => a.download && a.download.endsWith(".zip"));
    expect(link.download).toBe("badges-Evento Test.zip");
  });

  test("alerta si el badge no existe en la API", async () => {
    graphqlMock.mockImplementation(async () => ({ data: { getBadge: null } }));
    render(
      <DownloadAllBadgesButton event={eventFixture} tableData={tableData} />
    );
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "No se encontró el diseño del badge"
      )
    );
  });

  test("agrega la página trasera y llena vía acroField aunque un participante tenga respuestas rotas", async () => {
    const acroSet = jest.fn();
    pdfLibState.fields = [
      { getName: () => "field_one", acroField: { dict: { set: acroSet } } },
    ];
    graphqlMock.mockImplementation(async () => ({
      data: {
        getBadge: { id: "badge-1", frontDesign: "front.pdf", backDesign: "back.pdf" },
      },
    }));
    const attendeeLargo = {
      id: "ea-9",
      email: "largo@x.com",
      formAnswers: [{ name: "nombres", userData: ["a".repeat(35)] }],
    };
    const attendeeRoto = {
      id: "ea-10",
      email: "roto@x.com",
      formAnswers: [
        {
          name: "x",
          get userData() {
            throw new Error("userData rota");
          },
        },
      ],
    };

    render(
      <DownloadAllBadgesButton
        event={eventFixture}
        tableData={[
          { eventAttendee: attendeeLargo },
          { eventAttendee: attendeeRoto },
        ]}
      />
    );
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("✓ 2 badges generados")
      )
    );

    // El texto largo (>30) se trunca a 27 caracteres + … y entra vía acroField
    expect(acroSet).toHaveBeenCalledWith("V", "a".repeat(27) + "...");
    // La página trasera se rota 180 grados
    expect(pdfLibState.setRotation).toHaveBeenCalledWith({ angle: 180 });
    // El participante con formAnswers rotas cae al nombre por email
    expect(zipState.files.map((f) => f.name)).toEqual([
      `badge-${"a".repeat(35)}.pdf`,
      "badge-roto.pdf",
    ]);
    expect(console.error).toHaveBeenCalledWith(
      "Error parseando formAnswers:",
      expect.any(Error)
    );
  });

  test("reporta en el resumen los participantes cuyo badge falló", async () => {
    pdfLibState.fields = [mkField("field_one")];
    getUrl
      .mockImplementationOnce(async ({ key }) => ({
        url: new URL(`https://cdn.test/${key}`),
      }))
      .mockImplementationOnce(async () => {
        throw new Error("S3 caído");
      });

    render(
      <DownloadAllBadgesButton event={eventFixture} tableData={tableData} />
    );
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("✗ 1 errores")
      )
    );
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("✓ 1 badges generados")
    );
    // Solo el badge exitoso queda en el ZIP
    expect(zipState.files.map((f) => f.name)).toEqual(["badge-Ana-García.pdf"]);
  });

  test("alerta si la carga del badge falla", async () => {
    graphqlMock.mockImplementation(async () => {
      throw new Error("sin conexión");
    });
    render(
      <DownloadAllBadgesButton event={eventFixture} tableData={tableData} />
    );
    fireEvent.click(screen.getByTitle("Descargar Todos los Badges"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Error al descargar los badges: sin conexión"
      )
    );
    // El botón vuelve a su estado normal
    expect(screen.getByText("Descargar Todos")).toBeInTheDocument();
  });
});

/* ── DeleteParticipantButton ───────────────────────────────────────────── */

describe("DeleteParticipantButton", () => {
  test("no elimina nada si el usuario cancela el confirm", () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteParticipantButton eventAttendee={attendeeAna} />);

    fireEvent.click(screen.getByTitle("Eliminar Participante"));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("ana@x.com")
    );
    expect(DataStore.delete).not.toHaveBeenCalled();
  });

  test("elimina EventAttendee y Attendee asociado y notifica al padre", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    DataStore.__fixtures.EventAttendee = [{ id: "ea-1", attendeeID: "att-1" }];
    DataStore.__fixtures.Attendee = [{ id: "att-1" }];
    const onDeleted = jest.fn();

    render(
      <DeleteParticipantButton eventAttendee={attendeeAna} onDeleted={onDeleted} />
    );
    fireEvent.click(screen.getByTitle("Eliminar Participante"));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("ea-1"));
    expect(DataStore.delete).toHaveBeenCalledTimes(2);
    expect(DataStore.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ea-1" })
    );
    expect(DataStore.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "att-1" })
    );
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("muestra alerta si la eliminación falla", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    DataStore.query.mockRejectedValue(new Error("sin conexión"));

    render(<DeleteParticipantButton eventAttendee={attendeeAna} />);
    fireEvent.click(screen.getByTitle("Eliminar Participante"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Error al eliminar el participante: sin conexión"
      )
    );
    expect(DataStore.delete).not.toHaveBeenCalled();
  });
});
