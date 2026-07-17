/* Tests de la tabla de eventos (DevelopmentTable).
 *
 * Cubre: restauración de la página guardada en sessionStorage (rama
 * Number.parseInt), paginación Anterior/Siguiente con persistencia del
 * pageIndex, limpieza de la paginación al ir a crear evento, celdas
 * TITULO/FECHA (rama unificada), el botón EDITAR (click y teclado) y el
 * botón Duplicar (normal, in-flight y stopPropagation).
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DevelopmentTable from "../DevelopmentTable";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const PAGINATION_KEY = "EVENTFLOW.events.pagination";

const COLUMNS = [
  { Header: "TITULO", accessor: "title" },
  { Header: "FECHA DEL EVENTO", accessor: "update_date" },
  { Header: "EDITAR", accessor: "action" },
  { Header: "ACCIONES", accessor: "duplicate" },
];

// n filas con fechas crecientes: orden desc => "Evento n" queda primero
const makeRows = (n) =>
  Array.from({ length: n }, (_, i) => ({
    title: `Evento ${String(i + 1).padStart(2, "0")}`,
    update_date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    action: `ev-${i + 1}`,
    duplicate: `ev-${i + 1}`,
    model: { id: `ev-${i + 1}`, title: `Evento ${String(i + 1).padStart(2, "0")}` },
  }));

const renderTabla = (props = {}) =>
  render(
    <MemoryRouter>
      <DevelopmentTable
        columnsData={COLUMNS}
        tableData={makeRows(12)}
        {...props}
      />
    </MemoryRouter>
  );

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("DevelopmentTable — paginación persistida", () => {
  test("restaura la página guardada en sessionStorage al montar", () => {
    sessionStorage.setItem(PAGINATION_KEY, "1");
    renderTabla();

    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    // en la página 2 quedan las filas más antiguas (orden desc por fecha)
    expect(screen.getByText("Evento 01")).toBeInTheDocument();
    expect(screen.queryByText("Evento 12")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });

  test("Siguiente y Anterior cambian de página y guardan el pageIndex", () => {
    renderTabla();

    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(sessionStorage.getItem(PAGINATION_KEY)).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    expect(sessionStorage.getItem(PAGINATION_KEY)).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
    expect(sessionStorage.getItem(PAGINATION_KEY)).toBe("0");
  });

  test("el botón Crear Evento limpia la paginación guardada", () => {
    sessionStorage.setItem(PAGINATION_KEY, "1");
    renderTabla();

    fireEvent.click(screen.getByRole("button", { name: /crear evento/i }));
    expect(sessionStorage.getItem(PAGINATION_KEY)).toBeNull();
  });
});

describe("DevelopmentTable — celdas y botones", () => {
  test("muestra título y fecha en la misma rama y los encabezados", () => {
    renderTabla();

    expect(screen.getByText("Tabla de Eventos")).toBeInTheDocument();
    expect(screen.getByText("TITULO")).toBeInTheDocument();
    expect(screen.getByText("FECHA DEL EVENTO")).toBeInTheDocument();
    expect(screen.getByText("Evento 12")).toBeInTheDocument();
    expect(screen.getByText("2026-01-12")).toBeInTheDocument();
  });

  test("EDITAR es un botón real que navega con click y con teclado", () => {
    renderTabla();

    const fila = screen.getByText("Evento 12").closest("tr");
    const ingresar = within(fila).getByRole("button", { name: /ingresar/i });
    expect(ingresar.tagName).toBe("BUTTON");
    expect(ingresar).toHaveAttribute("type", "button");
    expect(ingresar).toHaveAttribute("tabindex", "0");

    fireEvent.click(ingresar);
    expect(mockNavigate).toHaveBeenCalledWith("ev-12/detalle/");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).id).toBe(
      "ev-12"
    );

    mockNavigate.mockClear();
    fireEvent.keyDown(ingresar, { key: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("ev-12/detalle/");

    mockNavigate.mockClear();
    fireEvent.keyDown(ingresar, { key: "Escape" });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("Duplicar llama a onDuplicate sin disparar la navegación de la fila", () => {
    const onDuplicate = jest.fn();
    renderTabla({ onDuplicate, duplicating: null });

    const fila = screen.getByText("Evento 12").closest("tr");
    const duplicar = within(fila).getByRole("button", { name: /duplicar/i });
    expect(duplicar).toHaveAttribute("type", "button");

    fireEvent.click(duplicar);
    expect(onDuplicate).toHaveBeenCalledWith("ev-12");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("mientras duplica muestra el estado in-flight y no vuelve a llamar", () => {
    const onDuplicate = jest.fn();
    renderTabla({ onDuplicate, duplicating: "ev-12" });

    const fila = screen.getByText("Evento 12").closest("tr");
    const duplicando = within(fila).getByRole("button", {
      name: /duplicando/i,
    });
    expect(duplicando).toBeDisabled();

    fireEvent.click(duplicando);
    expect(onDuplicate).not.toHaveBeenCalled();
  });
});
