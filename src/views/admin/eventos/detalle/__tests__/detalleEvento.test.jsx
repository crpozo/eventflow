/* Tests del detalle de evento (src/views/admin/eventos/detalle/index.jsx).
 *
 * Cubre: redirect con id inválido, loader cuando el evento no existe,
 * breadcrumbs y encabezado, el EventUpdateForm (stub) con sus callbacks
 * onSuccess/onCancel, el borrado definitivo (DataStore.delete + alerta +
 * navegación) y la rama sin permiso de edición (banner de solo lectura y
 * botón de eliminar deshabilitado).
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Detalle from "../index";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => ({ Event: { name: "Event" } }));

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

// EventUpdateForm de Amplify Studio → stub que expone sus callbacks.
jest.mock("ui-components", () => {
  const React = require("react");
  return {
    EventUpdateForm: ({ event, onSuccess, onCancel }) => (
      <div data-testid="event-update-form">
        <span>form-del-evento:{event?.id}</span>
        <button type="button" onClick={onSuccess}>
          simular éxito
        </button>
        <button type="button" onClick={onCancel}>
          simular cancelar
        </button>
      </div>
    ),
  };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

const { DataStore } = require("aws-amplify/datastore");

/* ── Helpers ───────────────────────────────────────────────────────────── */

const EVENTO = { id: "ev-1", title: "Mi Evento" };

const seed = (fixtures) => Object.assign(DataStore.__fixtures, fixtures);

const renderDetalle = (id = "ev-1") =>
  render(
    <MemoryRouter initialEntries={[`/admin/eventos/${id}/detalle`]}>
      <Routes>
        <Route path="/admin/eventos/:id/detalle" element={<Detalle />} />
      </Routes>
    </MemoryRouter>
  );

let alertSpy;

beforeEach(() => {
  localStorage.clear();
  Object.keys(DataStore.__fixtures).forEach(
    (k) => delete DataStore.__fixtures[k]
  );
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  DataStore.delete.mockImplementation(async (m) => m);
  mockUsePermissions.mockReturnValue({
    loading: false,
    isAdmin: true,
    can: () => true,
  });
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
});

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Detalle de evento — guardas de carga", () => {
  test("con id 'no-id' redirige a la lista sin consultar", () => {
    renderDetalle("no-id");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
    expect(DataStore.query).not.toHaveBeenCalled();
  });

  test("si el evento no existe muestra el loader", async () => {
    seed({ Event: [] });
    renderDetalle("ev-x");
    expect(await screen.findByText(/Cargando/)).toBeInTheDocument();
    expect(localStorage.getItem("EVENTFLOW.event")).toBeNull();
  });
});

describe("Detalle de evento — render con evento cargado", () => {
  test("muestra breadcrumbs, título y el formulario, y cachea el evento", async () => {
    seed({ Event: [EVENTO] });
    renderDetalle();

    expect(await screen.findByTestId("event-update-form")).toBeInTheDocument();
    expect(screen.getByText("form-del-evento:ev-1")).toBeInTheDocument();

    // breadcrumbs: Eventos (link) / Mi Evento / Detalle
    const crumb = screen.getByRole("link", { name: "Eventos" });
    expect(crumb).toHaveAttribute("href", "/admin/eventos");
    expect(screen.getByText("Mi Evento")).toBeInTheDocument();
    expect(screen.getByText("Detalle")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Detalle del evento" })
    ).toBeInTheDocument();

    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).id).toBe(
      "ev-1"
    );
  });

  test("onSuccess del formulario alerta y onCancel navega a la lista", async () => {
    seed({ Event: [EVENTO] });
    renderDetalle();
    await screen.findByTestId("event-update-form");

    fireEvent.click(screen.getByRole("button", { name: "simular éxito" }));
    expect(alertSpy).toHaveBeenCalledWith("Evento actualizado con éxito");

    fireEvent.click(screen.getByRole("button", { name: "simular cancelar" }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
  });
});

describe("Detalle de evento — eliminación", () => {
  test("eliminar borra el evento, alerta y navega a la lista", async () => {
    seed({ Event: [EVENTO] });
    renderDetalle();
    await screen.findByTestId("event-update-form");

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar definitivamente/i })
    );

    await waitFor(() =>
      expect(DataStore.delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ev-1" })
      )
    );
    expect(alertSpy).toHaveBeenCalledWith("Evento eliminado con éxito");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
  });

  test("sin permiso de edición: banner de solo lectura y botón deshabilitado", async () => {
    const can = jest.fn(() => false);
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can,
    });
    seed({ Event: [EVENTO] });
    renderDetalle();
    await screen.findByTestId("event-update-form");

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    expect(can).toHaveBeenCalledWith("ev-1", "detalle", "edit");

    const boton = screen.getByRole("button", {
      name: /eliminar definitivamente/i,
    });
    expect(boton).toBeDisabled();
    fireEvent.click(boton);
    expect(DataStore.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith("/admin/eventos");
  });
});
