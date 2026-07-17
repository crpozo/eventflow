/* Tests de la lista de campus (src/views/campus): loader, error de
 * suscripción, estado vacío, orden por updatedAt desc, filtrado por permisos
 * y la lista semántica (<ul aria-label="Campus list">).
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

jest.mock("models", () => ({ Campus: { name: "Campus" } }));

jest.mock("aws-amplify/datastore", () => {
  // El test configura __state.subscribe para controlar cada emisión.
  const state = { subscribe: null };
  return {
    DataStore: {
      __state: state,
      observeQuery: jest.fn(),
    },
  };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

import CampusComponent from "../index";

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const CAMPUSES = [
  { id: "c1", title: "Cumbayá", updatedAt: "2026-01-02T00:00:00Z" },
  { id: "c2", title: "Quito", updatedAt: "2026-03-01T00:00:00Z" },
  { id: "c3", title: "Galápagos", updatedAt: null },
];

// Suscripción que emite una sola vez y devuelve su unsubscribe.
const emite = (payload) => (handlers) => {
  handlers.next(payload);
  return { unsubscribe: jest.fn() };
};

beforeEach(() => {
  mockUsePermissions.mockReturnValue({ isAdmin: true, campusIDsAllowed: null });
  DataStore.__state.subscribe = emite({ items: CAMPUSES, isSynced: true });
  DataStore.observeQuery.mockImplementation(() => ({
    subscribe: (handlers) => DataStore.__state.subscribe(handlers),
  }));
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderCampus = () =>
  render(
    <MemoryRouter>
      <CampusComponent />
    </MemoryRouter>
  );

const antesDe = (a, b) =>
  !!(
    screen.getByText(a).compareDocumentPosition(screen.getByText(b)) &
    Node.DOCUMENT_POSITION_FOLLOWING
  );

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Campus — estados de carga", () => {
  test("muestra el loader mientras no llega la primera emisión", () => {
    DataStore.__state.subscribe = () => ({ unsubscribe: jest.fn() });
    renderCampus();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByText("Campus institucionales")).toBeNull();
  });

  test("si la suscripción falla muestra el mensaje de error", () => {
    DataStore.__state.subscribe = (handlers) => {
      handlers.error(new Error("sin conexión"));
      return { unsubscribe: jest.fn() };
    };
    renderCampus();
    expect(
      screen.getByText(/No se pudieron cargar los campus/)
    ).toBeInTheDocument();
    expect(screen.getByText(/sin conexión/)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Campus list" })).toBeNull();
  });

  test("sin campus muestra el estado vacío con su acción de crear", () => {
    DataStore.__state.subscribe = emite({ items: [], isSynced: true });
    renderCampus();
    expect(screen.getByText("Aún no hay campus.")).toBeInTheDocument();
    expect(screen.getByText("Crear el primer campus")).toBeInTheDocument();
  });

  test("se desuscribe al desmontar", () => {
    const unsubscribe = jest.fn();
    DataStore.__state.subscribe = (handlers) => {
      handlers.next({ items: [], isSynced: true });
      return { unsubscribe };
    };
    const { unmount } = renderCampus();
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("Campus — lista y permisos", () => {
  test("lista los campus en un <ul> accesible ordenados por updatedAt desc", () => {
    renderCampus();
    const lista = screen.getByRole("list", { name: "Campus list" });
    expect(lista.tagName).toBe("UL");
    // Orden: Quito (marzo) > Cumbayá (enero) > Galápagos (sin fecha).
    expect(antesDe("Quito", "Cumbayá")).toBe(true);
    expect(antesDe("Cumbayá", "Galápagos")).toBe(true);
  });

  test("sin restricción (campusIDsAllowed null) un no-admin ve todos", () => {
    mockUsePermissions.mockReturnValue({ isAdmin: false, campusIDsAllowed: null });
    renderCampus();
    expect(screen.getByText("Quito")).toBeInTheDocument();
    expect(screen.getByText("Cumbayá")).toBeInTheDocument();
    expect(screen.getByText("Galápagos")).toBeInTheDocument();
  });

  test("un no-admin solo ve los campus permitidos", () => {
    mockUsePermissions.mockReturnValue({ isAdmin: false, campusIDsAllowed: ["c2"] });
    renderCampus();
    expect(screen.getByText("Quito")).toBeInTheDocument();
    expect(screen.queryByText("Cumbayá")).toBeNull();
    expect(screen.queryByText("Galápagos")).toBeNull();
  });
});
