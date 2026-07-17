/* Tests del selector guiado Campus → Área → Subárea (src/views/navegar).
 *
 * Cubre: loader, error de carga, orden/filtrado por permisos, el flujo
 * completo con su contrato de localStorage (EVENTFLOW.*), el auto-skip de
 * niveles con una sola opción, el breadcrumb que resetea la selección, los
 * botones de admin (crear/editar con stopPropagation), la selección por
 * teclado y el estado vacío.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => ({
  Campus: { name: "Campus" },
  Area: { name: "Area" },
  Career: { name: "Career" },
}));

jest.mock("aws-amplify/datastore", () => {
  const state = { fixtures: {} };
  const impls = { query: async (Model) => state.fixtures[Model?.name] || [] };
  return {
    DataStore: {
      __state: state,
      __impls: impls,
      query: jest.fn(impls.query),
    },
  };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

import Navegar from "../index";

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const CAMPUSES = [
  { id: "c2", title: "Quito" },
  { id: "c1", title: "Cumbayá" },
];
const AREAS = [
  { id: "a1", title: "Ingeniería", campusID: "c1" },
  { id: "a2", title: "Artes", campusID: "c1" },
  { id: "a3", title: "Medicina", campusID: "c2" },
];
const CAREERS = [
  { id: "k1", title: "Sistemas", areaID: "a1" },
  { id: "k2", title: "Civil", areaID: "a1" },
];

const permisosTotales = {
  loading: false,
  isAdmin: true,
  canSeeCampus: () => true,
  canSeeArea: () => true,
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("EVENTFLOW.event", JSON.stringify({ id: "ev-1" }));
  mockUsePermissions.mockReturnValue({ ...permisosTotales });
  DataStore.__state.fixtures = {
    Campus: CAMPUSES,
    Area: AREAS,
    Career: CAREERS,
  };
  DataStore.query.mockImplementation(DataStore.__impls.query);
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderNavegar = () =>
  render(
    <MemoryRouter>
      <Navegar />
    </MemoryRouter>
  );

// Tarjeta de opción (el div clickable completo, no el breadcrumb <button>).
const card = (title) => screen.getByText(title).closest('[role="button"]');

const antesDe = (a, b) =>
  !!(
    screen.getByText(a).compareDocumentPosition(screen.getByText(b)) &
    Node.DOCUMENT_POSITION_FOLLOWING
  );

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Navegar — carga", () => {
  test("muestra el loader mientras cargan los datos o los permisos", () => {
    DataStore.query.mockImplementation(() => new Promise(() => {})); // nunca resuelve
    renderNavegar();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByText("Selecciona un campus")).toBeNull();
  });

  test("si la carga falla loguea el error y muestra el estado vacío", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.query.mockRejectedValue(new Error("db caída"));
    renderNavegar();
    expect(
      await screen.findByText("No hay campus disponibles.")
    ).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalledWith(
      "Navegar: error cargando datos",
      expect.any(Error)
    );
    errSpy.mockRestore();
  });

  test("lista los campus ordenados por título con las acciones de admin", async () => {
    renderNavegar();
    expect(await screen.findByText("Selecciona un campus")).toBeInTheDocument();
    expect(screen.getByText("Cumbayá")).toBeInTheDocument();
    expect(screen.getByText("Quito")).toBeInTheDocument();
    expect(antesDe("Cumbayá", "Quito")).toBe(true); // orden alfabético
    expect(
      screen.getByRole("button", { name: /Crear Campus/ })
    ).toBeInTheDocument();
  });
});

describe("Navegar — flujo de selección", () => {
  test("campus → área → subárea guarda la selección en localStorage y navega a eventos", async () => {
    renderNavegar();
    await screen.findByText("Selecciona un campus");

    fireEvent.click(card("Cumbayá"));
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id).toBe("c1");
    expect(localStorage.getItem("EVENTFLOW.event")).toBeNull(); // se limpia
    expect(screen.getByText("Selecciona un área")).toBeInTheDocument();
    // Solo las áreas del campus elegido, ordenadas.
    expect(screen.queryByText("Medicina")).toBeNull();
    expect(antesDe("Artes", "Ingeniería")).toBe(true);

    fireEvent.click(card("Ingeniería"));
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.area")).id).toBe("a1");
    expect(screen.getByText("Selecciona una subárea")).toBeInTheDocument();
    expect(antesDe("Civil", "Sistemas")).toBe(true);
    // breadcrumb completo: Campus / Cumbayá / Ingeniería
    expect(screen.getByRole("button", { name: "Campus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cumbayá" })).toBeInTheDocument();

    fireEvent.click(card("Sistemas"));
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.subarea")).id).toBe("k1");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("el breadcrumb resetea la selección al nivel elegido", async () => {
    renderNavegar();
    await screen.findByText("Selecciona un campus");
    fireEvent.click(card("Cumbayá"));
    fireEvent.click(card("Ingeniería"));
    expect(screen.getByText("Selecciona una subárea")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cumbayá" }));
    expect(screen.getByText("Selecciona un área")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Campus" }));
    expect(screen.getByText("Selecciona un campus")).toBeInTheDocument();
  });

  test("auto-salta campus y área cuando hay una sola opción visible", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      canSeeCampus: (id) => id === "c1",
      canSeeArea: (id) => id === "a1",
    });
    renderNavegar();

    // Aterriza directo en subáreas con ambos niveles ya seleccionados.
    expect(
      await screen.findByText("Selecciona una subárea")
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id).toBe("c1");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.area")).id).toBe("a1");
    expect(screen.getByRole("button", { name: "Cumbayá" })).toBeInTheDocument();
    expect(screen.getByText("Ingeniería")).toBeInTheDocument(); // breadcrumb
    expect(screen.getByText("Sistemas")).toBeInTheDocument();
    expect(screen.getByText("Civil")).toBeInTheDocument();
  });

  test("selección por teclado: Enter y Espacio activan la tarjeta", async () => {
    renderNavegar();
    await screen.findByText("Selecciona un campus");

    fireEvent.keyDown(card("Cumbayá"), { key: "Enter" });
    expect(screen.getByText("Selecciona un área")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Campus" }));
    fireEvent.keyDown(card("Quito"), { key: " " });
    expect(screen.getByText("Medicina")).toBeInTheDocument();
  });

  test("un área sin subáreas visibles muestra el estado vacío", async () => {
    renderNavegar();
    await screen.findByText("Selecciona un campus");
    fireEvent.click(card("Cumbayá"));
    fireEvent.click(card("Artes")); // sin careers asociadas
    expect(screen.getByText("No hay subáreas disponibles.")).toBeInTheDocument();
  });
});

describe("Navegar — acciones de admin y permisos", () => {
  test("crear navega a la ruta del nivel actual y editar no selecciona la tarjeta", async () => {
    renderNavegar();
    await screen.findByText("Selecciona un campus");

    fireEvent.click(screen.getByRole("button", { name: /Crear Campus/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/page/campus/crear");

    fireEvent.click(within(card("Cumbayá")).getByRole("button", { name: "Editar" }));
    expect(mockNavigate).toHaveBeenCalledWith("/page/campus/editar", {
      state: { id: "c1" },
    });
    // stopPropagation: seguimos en el nivel campus, sin selección guardada.
    expect(screen.getByText("Selecciona un campus")).toBeInTheDocument();
    expect(localStorage.getItem("EVENTFLOW.campus")).toBeNull();

    // En el nivel área el botón de crear cambia de destino.
    fireEvent.click(card("Cumbayá"));
    fireEvent.click(screen.getByRole("button", { name: /Crear Área/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/page/campus/area/crear");
  });

  test("sin rol admin no hay botones de crear ni de editar", async () => {
    mockUsePermissions.mockReturnValue({ ...permisosTotales, isAdmin: false });
    renderNavegar();
    await screen.findByText("Selecciona un campus");
    expect(screen.queryByRole("button", { name: /Crear Campus/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  });

  test("los permisos de campus filtran las tarjetas visibles", async () => {
    mockUsePermissions.mockReturnValue({
      ...permisosTotales,
      isAdmin: false,
      canSeeCampus: (id) => id === "c2",
      canSeeArea: () => false,
    });
    renderNavegar();
    // Con un solo campus visible se auto-selecciona, pero sin áreas visibles
    // queda el estado vacío del nivel área.
    expect(
      await screen.findByText("No hay áreas disponibles.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Cumbayá")).toBeNull();
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id).toBe("c2");
  });
});
