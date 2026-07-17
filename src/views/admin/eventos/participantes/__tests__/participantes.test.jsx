/* Tests de las VISTAS de participantes:
 *   - listado  (src/views/admin/eventos/participantes/index.jsx + DevelopmentTable)
 *   - crear    (crear/index.jsx: guardas de permiso, save Attendee/EventAttendee, navegación)
 *   - detalle  (detalle/index.jsx: Hub "ready", perfil con formAnswers, participante inexistente)
 *
 * Mocks en frontera: DataStore (fixtures + predicados), Hub, storage, api,
 * models constructibles, PermissionsProvider, ui-components y libs pesadas
 * (xlsx, html2pdf, qrcode, jszip, chakra).
 */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { seedStoredEvent } from "testUtils/amplifyMocks";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

jest.mock("services/regenMissingTickets", () => ({
  regenMissingTickets: jest.fn(),
}));

// Modelos constructibles (new Attendee(...), EventAttendee.copyOf, Model.name)
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

// DataStore con fixtures por modelo: query por id (string) o por predicado
// (captura cadenas tipo (a) => a.id.eq(x)); save hace upsert en las fixtures.
// OJO: CRA corre Jest con resetMocks:true — las implementaciones se reponen
// en beforeEach desde __impls.
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
  const observeImpl = (Model) => ({
    subscribe: (cb) => {
      cb({ items: fixtures[Model?.name] || [], isSynced: true });
      return { unsubscribe: jest.fn() };
    },
  });
  const DataStore = {
    __fixtures: fixtures,
    __impls: { queryImpl, saveImpl, observeImpl },
    state: "Started",
    query: jest.fn(queryImpl),
    save: jest.fn(saveImpl),
    delete: jest.fn(async (m) => m),
    observeQuery: jest.fn(observeImpl),
    start: jest.fn(async () => {}),
    stop: jest.fn(async () => {}),
  };
  return { DataStore };
});

// Hub: registra listeners para dispararlos manualmente (evento "ready")
jest.mock("aws-amplify/utils", () => {
  const listeners = [];
  return {
    __esModule: true,
    __hubListeners: listeners,
    Hub: {
      listen: (_channel, cb) => {
        listeners.push(cb);
        return () => {};
      },
    },
    I18n: { put: () => {}, setLanguage: () => {} },
  };
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
  chain.get = async () => ({ output: () => new Uint8Array([1]).buffer });
  return { __esModule: true, default: () => chain };
});
jest.mock("jszip", () => {
  function JSZip() {
    this.file = () => {};
    this.generateAsync = async () => new Blob(["zip"]);
  }
  return { __esModule: true, default: JSZip };
});
jest.mock("@chakra-ui/button", () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

// AttendeeCreateForm (ui-components) → formulario fake que expone los callbacks
jest.mock("ui-components", () => ({
  AttendeeCreateForm: ({ onSubmit, onSuccess, onCancel }) => (
    <div data-testid="attendee-form">
      <button
        onClick={async () => {
          await onSubmit({
            name: "Ana",
            type: "Estudiante",
            age: 21,
            position: "Tesista",
          });
          onSuccess();
        }}
      >
        guardar-fake
      </button>
      <button onClick={() => onCancel()}>cancelar-fake</button>
    </div>
  ),
}));

/* ── Sujetos y fixtures ────────────────────────────────────────────────── */

const { DataStore } = require("aws-amplify/datastore");
const { __hubListeners } = require("aws-amplify/utils");
const { regenMissingTickets } = require("services/regenMissingTickets");
const models = require("models");
const Listado = require("views/admin/eventos/participantes").default;
const Crear = require("views/admin/eventos/participantes/crear").default;
const Detalle = require("views/admin/eventos/participantes/detalle").default;

const adminPerms = { loading: false, isAdmin: true, can: () => true };

const eventFixture = {
  id: "ev-1",
  title: "Congreso Test",
  eventBadgeId: "badge-1",
  location: "Quito",
  date: "2026-08-01T15:00:00.000Z",
};

const attendeesFixture = () => [
  {
    id: "ea-1",
    eventID: "ev-1",
    attendeeID: "att-1",
    email: "ana@x.com",
    createdAt: "2026-01-10T10:00:00.000Z",
    formAnswers: [{ name: "nombres", label: "Nombres", userData: ["Ana García"] }],
  },
  {
    id: "ea-2",
    eventID: "ev-1",
    attendeeID: "att-2",
    email: "luis@x.com",
    createdAt: "2026-02-20T10:00:00.000Z",
    formAnswers: [{ name: "nombres", label: "Nombres", userData: ["Luis Mora"] }],
  },
];

const seedFixtures = () => {
  const f = DataStore.__fixtures;
  Object.keys(f).forEach((k) => delete f[k]);
  Object.assign(f, {
    Event: [eventFixture],
    EventAttendee: attendeesFixture(),
    Attendee: [{ id: "att-1" }, { id: "att-2" }],
  });
};

const renderListado = (id = "ev-1") =>
  render(
    <MemoryRouter initialEntries={[`/admin/eventos/${id}/participantes`]}>
      <Routes>
        <Route path="/admin/eventos/:id/participantes" element={<Listado />} />
      </Routes>
    </MemoryRouter>
  );

const renderCrear = (route = "/admin/eventos/ev-1/participantes/crear") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/admin/eventos/:id/participantes/crear" element={<Crear />} />
        <Route path="/crear-sin-id" element={<Crear />} />
      </Routes>
    </MemoryRouter>
  );

const renderDetalle = (id = "att-1") =>
  render(
    <MemoryRouter initialEntries={[`/participante/${id}`]}>
      <Routes>
        <Route path="/participante/:id" element={<Detalle />} />
      </Routes>
    </MemoryRouter>
  );

const emitDataStoreReady = async () => {
  await act(async () => {
    __hubListeners.forEach((cb) => cb({ payload: { event: "ready" } }));
  });
};

beforeEach(() => {
  // resetMocks:true (CRA) borra las implementaciones — se reponen aquí.
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  DataStore.save.mockImplementation(DataStore.__impls.saveImpl);
  DataStore.delete.mockImplementation(async (m) => m);
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observeImpl);
  DataStore.start.mockImplementation(async () => {});
  DataStore.stop.mockImplementation(async () => {});
  mockUsePermissions.mockReturnValue(adminPerms);
  __hubListeners.length = 0;
  localStorage.clear();
  seedStoredEvent({ id: "ev-1", title: "Evento Test" });
  seedFixtures();
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  delete window.__regenMissingTickets;
});

/* ── Listado de participantes ──────────────────────────────────────────── */

describe("Participantes — listado", () => {
  test("redirige a /admin/eventos cuando el id es 'no-id'", () => {
    renderListado("no-id");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
  });

  test("muestra el loader mientras no llegan filas", () => {
    DataStore.observeQuery.mockImplementation(() => ({
      subscribe: () => ({ unsubscribe: jest.fn() }),
    }));
    renderListado();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  test("lista participantes con emails, crumbs del evento y acciones", async () => {
    renderListado();

    // Filas con los emails de las fixtures
    expect(screen.getByText("ana@x.com")).toBeInTheDocument();
    expect(screen.getByText("luis@x.com")).toBeInTheDocument();
    expect(
      screen.getByText(/Mostrando 2 de 2 participantes/)
    ).toBeInTheDocument();

    // Encabezados de la tabla
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Creacion")).toBeInTheDocument();
    expect(screen.getByText("Acciones")).toBeInTheDocument();

    // Crumb con el título del evento cargado por id (no el cacheado)
    expect(await screen.findByText("Congreso Test")).toBeInTheDocument();

    // Acciones de edición visibles para admin
    expect(screen.getByText("Importar Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Descargar Todos")).toBeInTheDocument();
    expect(screen.getAllByTitle("Descargar Badge")).toHaveLength(2);
    expect(screen.getAllByTitle("Eliminar Participante")).toHaveLength(2);
  });

  test("expone window.__regenMissingTickets ligado al evento cargado", async () => {
    renderListado();
    await screen.findByText("Congreso Test");
    await waitFor(() =>
      expect(typeof window.__regenMissingTickets).toBe("function")
    );

    window.__regenMissingTickets({ dryRun: true });
    expect(regenMissingTickets).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ev-1" }),
      { dryRun: true }
    );
  });

  test("sin permiso de edición oculta importar y eliminar pero no el ZIP", () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can: () => false,
    });
    renderListado();

    expect(screen.queryByText("Importar Usuarios")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar Participante")).not.toBeInTheDocument();
    expect(screen.getByText("Descargar Todos")).toBeInTheDocument();
    expect(screen.getAllByTitle("Descargar Badge")).toHaveLength(2);
  });

  test("paginación: página única y cambio de tamaño de página", () => {
    renderListado();

    expect(screen.getByText("1 de 1")).toBeInTheDocument();
    // Con una sola página los controles de avance quedan deshabilitados
    expect(screen.getByText(">")).toBeDisabled();
    expect(screen.getByText("<")).toBeDisabled();

    const select = screen.getByRole("combobox");
    expect(select.value).toBe("50");
    fireEvent.change(select, { target: { value: "20" } });
    expect(select.value).toBe("20");
    expect(
      screen.getByText(/Mostrando 2 de 2 participantes/)
    ).toBeInTheDocument();
  });

  test("paginación: avanza y retrocede entre páginas con los controles", () => {
    // 60 participantes → 2 páginas con el tamaño inicial de 50
    DataStore.__fixtures.EventAttendee = Array.from({ length: 60 }, (_, i) => ({
      id: `ea-${i}`,
      eventID: "ev-1",
      attendeeID: `att-${i}`,
      email: `p${i}@x.com`,
      createdAt: "2026-01-10T10:00:00.000Z",
      formAnswers: [{ name: "nombres", label: "Nombres", userData: [`P ${i}`] }],
    }));
    renderListado();

    expect(screen.getByText("1 de 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText(">"));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("<"));
    expect(screen.getByText("1 de 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText(">>"));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("<<"));
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });
});

/* ── Crear participante ────────────────────────────────────────────────── */

describe("Participantes — crear", () => {
  test("renderiza encabezado y formulario", () => {
    renderCrear();
    expect(screen.getByText("Agregar participante")).toBeInTheDocument();
    expect(screen.getByText("Datos del participante")).toBeInTheDocument();
    expect(screen.getByTestId("attendee-form")).toBeInTheDocument();
  });

  test("al enviar guarda Attendee + EventAttendee (checkIn false) y navega", async () => {
    renderCrear();

    fireEvent.click(screen.getByText("guardar-fake"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Participante creado con éxito")
    );

    const saved = DataStore.save.mock.calls.map((c) => c[0]);
    const attendee = saved.find((m) => m instanceof models.Attendee);
    expect(attendee).toEqual(
      expect.objectContaining({
        name: "Ana",
        type: "Estudiante",
        age: 21,
        position: "Tesista",
      })
    );

    await waitFor(() => {
      const ea = DataStore.save.mock.calls
        .map((c) => c[0])
        .find((m) => m instanceof models.EventAttendee);
      expect(ea).toEqual(
        expect.objectContaining({
          eventID: "ev-1",
          attendeeID: attendee.id,
          authorized: false,
          checkIn: false,
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/ev-1/participantes");
  });

  test("cancelar navega de vuelta al listado sin guardar", () => {
    renderCrear();
    fireEvent.click(screen.getByText("cancelar-fake"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/ev-1/participantes");
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("usuario sin permiso de edición es redirigido al listado", () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can: () => false,
    });
    renderCrear();
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/ev-1/participantes");
  });

  test("sin id en la ruta navega a la raíz", () => {
    renderCrear("/crear-sin-id");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

/* ── Detalle (perfil público del participante) ─────────────────────────── */

describe("Participantes — detalle", () => {
  test("muestra loader hasta que DataStore emite ready", () => {
    renderDetalle();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(DataStore.start).toHaveBeenCalled();
  });

  test("renderiza el perfil con nombre, respuestas y link de LinkedIn", async () => {
    DataStore.__fixtures.EventAttendee = [
      {
        id: "ea-1",
        attendeeID: "att-1",
        formAnswers: [
          { name: "nombres", label: "Nombres", userData: ["Juan Pérez"] },
          { name: "universidad", label: "Universidad", userData: ["USFQ"] },
          { name: "telefono", label: "Teléfono", userData: [""] },
        ],
      },
    ];
    renderDetalle("att-1");
    await emitDataStoreReady();

    expect(await screen.findByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("Universidad:")).toBeInTheDocument();
    expect(screen.getByText("USFQ")).toBeInTheDocument();
    // Los campos vacíos y el propio "nombres" no se listan
    expect(screen.queryByText("Teléfono:")).not.toBeInTheDocument();
    expect(screen.queryByText("Nombres:")).not.toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Seguir en LinkedIn" });
    expect(link.getAttribute("href")).toContain("keywords=Juan");
  });

  test("muestra mensaje cuando el participante no existe", async () => {
    DataStore.__fixtures.Attendee = [];
    renderDetalle("att-fantasma");
    await emitDataStoreReady();

    expect(
      await screen.findByText("No existe un participante con ID:")
    ).toBeInTheDocument();
    expect(screen.getByText("att-fantasma")).toBeInTheDocument();
  });
});
