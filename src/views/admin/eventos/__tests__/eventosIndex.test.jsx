/* Tests de la lista de eventos (src/views/admin/eventos/index.jsx).
 *
 * Cubre: loader de permisos, estado vacío, tabla con fechas formateadas,
 * el span EDITAR accesible (click Y teclado Enter/Espacio), filtro por área,
 * buscador global, duplicación de evento (evento + badge + landing + form,
 * estado "Duplicando..." y recarga) con su rama de error, y las ramas de
 * usuario no-admin (redirect a campus / filtrado por subárea).
 *
 * OJO: CRA corre Jest con resetMocks:true — las implementaciones de los
 * jest.fn de las factorías se pierden antes de cada test; se reponen en
 * beforeEach desde __impls.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Eventos from "../index";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Modelos como clases: la vista hace `new Event(...)` y `Event.copyOf(...)`.
jest.mock("models", () => {
  class Event {
    constructor(d) {
      Object.assign(this, d);
    }
  }
  Event.copyOf = (base, updater) => {
    const draft = { ...base };
    updater(draft);
    return draft;
  };
  class Landing {
    constructor(d) {
      Object.assign(this, d);
    }
  }
  class Form {
    constructor(d) {
      Object.assign(this, d);
    }
  }
  class Badge {
    constructor(d) {
      Object.assign(this, d);
    }
  }
  class Area {}
  class Career {}
  return { Event, Landing, Form, Badge, Area, Career };
});

// DataStore con fixtures por modelo. Soporta query(Model), query(Model, "id")
// y query(Model, (m) => m.campo.eq(valor)).
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
    } catch (e) {
      got = null;
    }
    return got;
  };
  const deepGet = (obj, path) =>
    path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  const queryImpl = async (Model, pred) => {
    const rows = fixtures[Model?.name] || [];
    if (pred == null) return rows;
    if (typeof pred === "string") return rows.find((r) => r.id === pred);
    const cond = capture(pred);
    if (!cond) return rows;
    return rows.filter((r) => deepGet(r, cond.path) === cond.value);
  };
  const DataStore = {
    __fixtures: fixtures,
    __impls: { queryImpl },
    query: jest.fn(queryImpl),
    save: jest.fn(),
    delete: jest.fn(),
  };
  return { DataStore };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures y helpers ────────────────────────────────────────────────── */

const EV1 = {
  id: "ev-1",
  title: "Evento Uno",
  date: "2026-01-15T12:00:00.000Z",
  careerID: "c1",
  description: "desc uno",
};
const EV2 = {
  id: "ev-2",
  title: "Evento Dos",
  date: "2026-03-20T12:00:00.000Z",
  careerID: "c2",
};
const AREAS = [
  { id: "a1", title: "Área Uno" },
  { id: "a2", title: "Área Dos" },
];
const CAREERS = [
  { id: "c1", areaID: "a1" },
  { id: "c2", areaID: "a2" },
];

const seed = (fixtures) => Object.assign(DataStore.__fixtures, fixtures);

const renderEventos = () =>
  render(
    <MemoryRouter initialEntries={["/admin/eventos"]}>
      <Eventos />
    </MemoryRouter>
  );

let alertSpy;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.keys(DataStore.__fixtures).forEach(
    (k) => delete DataStore.__fixtures[k]
  );
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.delete.mockImplementation(async (m) => m);
  mockUsePermissions.mockReturnValue({
    loading: false,
    isAdmin: true,
    can: () => true,
  });
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Lista de eventos — carga y estados", () => {
  test("muestra el loader mientras cargan los permisos", () => {
    mockUsePermissions.mockReturnValue({ loading: true, isAdmin: false });
    renderEventos();
    expect(screen.getByText(/Cargando/)).toBeInTheDocument();
    expect(DataStore.query).not.toHaveBeenCalled();
  });

  test("sin eventos muestra el estado vacío con el botón de crear", async () => {
    renderEventos();
    // dejar que load() termine (Event + Area + Career) dentro de act: un
    // macrotask drena toda la cadena de microtareas del Promise.all
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(
      screen.getByText(/No existen eventos en la base de datos/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /crear evento/i })
    ).toBeInTheDocument();
    expect(DataStore.query).toHaveBeenCalledTimes(3);
  });

  test("lista los eventos con título y fecha formateada", async () => {
    seed({ Event: [EV1, EV2], Area: AREAS, Career: CAREERS });
    renderEventos();
    expect(await screen.findByText("Evento Uno")).toBeInTheDocument();
    expect(screen.getByText("Evento Dos")).toBeInTheDocument();
    expect(screen.getByText("15/01/2026")).toBeInTheDocument();
    expect(screen.getByText("20/03/2026")).toBeInTheDocument();
    expect(screen.getByText("Tabla de Eventos")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Eventos" })
    ).toBeInTheDocument();
  });
});

describe("Lista de eventos — span EDITAR accesible", () => {
  test("con click navega al detalle y cachea el evento", async () => {
    seed({ Event: [EV1, EV2], Area: AREAS, Career: CAREERS });
    renderEventos();
    await screen.findByText("Evento Uno");

    const fila = screen.getByText("Evento Uno").closest("tr");
    const ingresar = within(fila).getByRole("button", { name: /ingresar/i });
    fireEvent.click(ingresar);

    expect(mockNavigate).toHaveBeenCalledWith("ev-1/detalle/");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).id).toBe(
      "ev-1"
    );
  });

  test("es operable por teclado con Enter y Espacio (y no con otras teclas)", async () => {
    seed({ Event: [EV1, EV2], Area: AREAS, Career: CAREERS });
    renderEventos();
    await screen.findByText("Evento Uno");

    const fila = screen.getByText("Evento Uno").closest("tr");
    const ingresar = within(fila).getByRole("button", { name: /ingresar/i });
    expect(ingresar).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(ingresar, { key: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("ev-1/detalle/");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).title).toBe(
      "Evento Uno"
    );

    mockNavigate.mockClear();
    fireEvent.keyDown(ingresar, { key: " " });
    expect(mockNavigate).toHaveBeenCalledWith("ev-1/detalle/");

    mockNavigate.mockClear();
    fireEvent.keyDown(ingresar, { key: "Escape" });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Lista de eventos — filtros", () => {
  test("el filtro de área muestra solo los eventos del área seleccionada", async () => {
    seed({ Event: [EV1, EV2], Area: AREAS, Career: CAREERS });
    renderEventos();
    await screen.findByText("Evento Uno");

    const select = screen.getByRole("combobox");
    expect(within(select).getByText("Área Uno")).toBeInTheDocument();
    expect(within(select).getByText("Todas las áreas")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "a2" } });
    expect(screen.getByText("Evento Dos")).toBeInTheDocument();
    expect(screen.queryByText("Evento Uno")).not.toBeInTheDocument();

    // Volver a "Todas las áreas" restaura la lista completa
    fireEvent.change(select, { target: { value: "" } });
    expect(screen.getByText("Evento Uno")).toBeInTheDocument();
  });

  test("el buscador filtra las filas por texto", async () => {
    seed({ Event: [EV1, EV2], Area: AREAS, Career: CAREERS });
    renderEventos();
    await screen.findByText("Evento Uno");

    const buscador = screen.getByPlaceholderText("Buscar evento...");
    fireEvent.change(buscador, { target: { value: "dos" } });
    expect(screen.getByText("Evento Dos")).toBeInTheDocument();
    expect(screen.queryByText("Evento Uno")).not.toBeInTheDocument();
  });
});

describe("Lista de eventos — duplicación", () => {
  test("duplica evento con badge, landing y form, avisa y recarga", async () => {
    seed({
      Event: [{ ...EV1, eventBadgeId: "b1" }],
      Badge: [{ id: "b1", frontDesign: "front.pdf", backDesign: "back.pdf" }],
      Landing: [
        { id: "l1", landingEventId: "ev-1", title: "Landing Uno", active: true },
      ],
      Form: [{ id: "f1", formEventId: "ev-1", questions: "[]" }],
      Area: [],
      Career: [],
    });
    renderEventos();
    await screen.findByText("Evento Uno");

    fireEvent.click(screen.getByRole("button", { name: /duplicar/i }));
    // estado in-flight
    expect(screen.getByText("Duplicando...")).toBeInTheDocument();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Evento duplicado exitosamente: Evento Uno (Copia)"
      )
    );

    const guardados = DataStore.save.mock.calls.map((c) => c[0]);
    // evento copiado
    expect(guardados[0]).toEqual(
      expect.objectContaining({
        title: "Evento Uno (Copia)",
        description: "desc uno",
        careerID: "c1",
      })
    );
    // badge copiado
    expect(
      guardados.some(
        (g) => g.frontDesign === "front.pdf" && g.backDesign === "back.pdf"
      )
    ).toBe(true);
    // landing y form copiados apuntando al evento nuevo
    const landingCopiada = guardados.find((g) => g.title === "Landing Uno");
    expect(landingCopiada.Event.title).toBe("Evento Uno (Copia)");
    expect(guardados.some((g) => g.questions === "[]")).toBe(true);

    // al terminar se recargan los eventos y desaparece el estado in-flight
    await waitFor(() =>
      expect(screen.queryByText("Duplicando...")).not.toBeInTheDocument()
    );
  });

  test("si la duplicación falla muestra la alerta de error", async () => {
    seed({ Event: [EV1], Area: [], Career: [] });
    renderEventos();
    await screen.findByText("Evento Uno");

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.save.mockRejectedValueOnce(new Error("boom"));
    fireEvent.click(screen.getByRole("button", { name: /duplicar/i }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Error al duplicar el evento. Por favor, intenta de nuevo."
      )
    );
    expect(errSpy).toHaveBeenCalled();
  });
});

describe("Lista de eventos — usuario no admin", () => {
  test("sin subárea seleccionada redirige a campus", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can: () => true,
    });
    renderEventos();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/page/campus")
    );
  });

  test("con subárea ve solo los eventos de su carrera y sin filtro de área", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can: () => true,
    });
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ id: "c1" }));
    seed({ Event: [EV1, EV2] });
    renderEventos();

    expect(await screen.findByText("Evento Uno")).toBeInTheDocument();
    expect(screen.queryByText("Evento Dos")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("/page/campus");
  });
});
