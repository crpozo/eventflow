/* Tests de la lista de áreas (src/views/area): redirección sin campus,
 * espera de permisos, orden por updatedAt desc SIN mutar el estado,
 * filtrado por rol y los estados vacío/error.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => ({ Area: { name: "Area" } }));

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

import Areas from "../index";

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const AREAS = [
  { id: "a1", title: "Ingeniería", updatedAt: "2026-01-05T00:00:00Z" },
  { id: "a2", title: "Artes", updatedAt: "2026-02-01T00:00:00Z" },
];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "EVENTFLOW.campus",
    JSON.stringify({ id: "c1", title: "Cumbayá" })
  );
  mockUsePermissions.mockReturnValue({
    loading: false,
    isAdmin: true,
    areaIDsAllowed: null,
  });
  DataStore.__state.fixtures = { Area: AREAS };
  DataStore.query.mockImplementation(DataStore.__impls.query);
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderAreas = () =>
  render(
    <MemoryRouter>
      <Areas />
    </MemoryRouter>
  );

const antesDe = (a, b) =>
  !!(
    screen.getByText(a).compareDocumentPosition(screen.getByText(b)) &
    Node.DOCUMENT_POSITION_FOLLOWING
  );

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Áreas — guardas de entrada", () => {
  test("sin campus seleccionado redirige a /page/campus sin consultar", () => {
    localStorage.removeItem("EVENTFLOW.campus");
    renderAreas();
    expect(mockNavigate).toHaveBeenCalledWith("/page/campus");
    expect(DataStore.query).not.toHaveBeenCalled();
  });

  test("muestra el loader y no consulta mientras se resuelven los permisos", () => {
    mockUsePermissions.mockReturnValue({
      loading: true,
      isAdmin: false,
      areaIDsAllowed: null,
    });
    renderAreas();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(DataStore.query).not.toHaveBeenCalled();
  });
});

describe("Áreas — lista y permisos", () => {
  test("consulta las áreas filtrando por el campus seleccionado", async () => {
    renderAreas();
    await screen.findByText("Artes");
    const predicado = DataStore.query.mock.calls[0][1];
    const eq = jest.fn();
    predicado({ campusID: { eq } });
    expect(eq).toHaveBeenCalledWith("c1");
  });

  test("ordena por updatedAt desc sin mutar el arreglo en estado", async () => {
    const originales = AREAS.map((a) => ({ ...a }));
    DataStore.__state.fixtures = { Area: originales };
    renderAreas();
    // Artes (febrero) va antes que Ingeniería (enero).
    await screen.findByText("Artes");
    expect(antesDe("Artes", "Ingeniería")).toBe(true);
    // El arreglo guardado en estado conserva su orden original (sin sort in-place).
    expect(originales.map((a) => a.id)).toEqual(["a1", "a2"]);
    // Solo los admins ven el botón de crear.
    expect(screen.getByText(/Crear área/)).toBeInTheDocument();
  });

  test("un no-admin solo ve las áreas permitidas y no puede crear", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      areaIDsAllowed: ["a2"],
    });
    renderAreas();
    expect(await screen.findByText("Artes")).toBeInTheDocument();
    expect(screen.queryByText("Ingeniería")).toBeNull();
    expect(screen.queryByText(/Crear área/)).toBeNull();
  });

  test("sin restricción (areaIDsAllowed null) un no-admin ve todas", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      areaIDsAllowed: null,
    });
    renderAreas();
    expect(await screen.findByText("Artes")).toBeInTheDocument();
    expect(screen.getByText("Ingeniería")).toBeInTheDocument();
  });

  test("sin áreas muestra el estado vacío", async () => {
    DataStore.__state.fixtures = { Area: [] };
    renderAreas();
    expect(
      await screen.findByText(/No existen áreas disponibles/)
    ).toBeInTheDocument();
  });

  test("si la consulta falla loguea el error y muestra el estado vacío", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.query.mockRejectedValue(new Error("db caída"));
    renderAreas();
    expect(
      await screen.findByText(/No existen áreas disponibles/)
    ).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalledWith(
      "Error cargando áreas:",
      expect.any(Error)
    );
    errSpy.mockRestore();
  });
});
