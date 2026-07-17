/* Tests de los componentes de src/views/admin/default/components/.
 * Librerías de charts mockeadas en la frontera (react-apexcharts); se afirma
 * el contenido que cada card renderiza y los atributos saneados por Sonar
 * (sin props desconocidas en <table>, botones con type explícito, íconos de
 * estado resueltos por obtenerIconoEstado en lugar de ternarios anidados).
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("react-apexcharts", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="apexchart" data-type={props.type || ""} />
  ),
}));

import CheckTable from "views/admin/default/components/CheckTable";
import ComplexTable from "views/admin/default/components/ComplexTable";
import TotalSpent from "views/admin/default/components/TotalSpent";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import {
  columnsDataCheck,
  columnsDataComplex,
} from "views/admin/default/variables/columnsData";
import tableDataCheck from "views/admin/default/variables/tableDataCheck.json";
import tableDataComplex from "views/admin/default/variables/tableDataComplex.json";

describe("CheckTable (admin/default)", () => {
  test("renderiza cabeceras y filas con nombre, progreso, cantidad y fecha", () => {
    render(
      <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
    );
    expect(screen.getByText("Check Table")).toBeInTheDocument();

    // Cabeceras
    ["NAME", "PROGRESS", "QUANTITY", "DATE"].forEach((h) =>
      expect(screen.getByText(h)).toBeInTheDocument()
    );

    // Primera fila del fixture (nombre y progreso se repiten en el dataset)
    expect(screen.getAllByText("Marketplace").length).toBeGreaterThan(0);
    expect(screen.getAllByText("75.5%").length).toBeGreaterThan(0);
    expect(screen.getByText("2458")).toBeInTheDocument();
    expect(screen.getByText("Apr 26, 2022")).toBeInTheDocument();

    // Un checkbox por fila (columna NAME)
    expect(screen.getAllByRole("checkbox")).toHaveLength(tableDataCheck.length);
  });

  test("la tabla no arrastra props desconocidas al DOM (variant/mb)", () => {
    render(
      <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
    );
    const tabla = screen.getByRole("table");
    expect(tabla).not.toHaveAttribute("variant");
    expect(tabla).not.toHaveAttribute("mb");
  });

  test("una columna sin renderizador conocido deja la celda vacía", () => {
    const { container } = render(
      <CheckTable
        columnsData={[...columnsDataCheck, { Header: "EXTRA", accessor: "extra" }]}
        tableData={[tableDataCheck[0]].map((r) => ({ ...r, extra: "x" }))}
      />
    );
    const celdas = container.querySelectorAll("tbody td");
    expect(celdas).toHaveLength(columnsDataCheck.length + 1);
    expect(celdas[celdas.length - 1]).toBeEmptyDOMElement();
  });
});

describe("ComplexTable (admin/default)", () => {
  test("renderiza los estados Approved/Disable/Error con su ícono y las filas", () => {
    const { container } = render(
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={tableDataComplex}
      />
    );
    expect(screen.getByText("Complex Table")).toBeInTheDocument();

    // 4 filas del fixture: 2 Approved, 1 Disable, 1 Error
    expect(screen.getAllByText("Approved")).toHaveLength(2);
    expect(screen.getByText("Disable")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getAllByText("Marketplace").length).toBeGreaterThan(0);
    expect(screen.getByText("24.Jan.2021")).toBeInTheDocument();

    // Un ícono de estado por fila (los react-icons son los únicos svg del tbody)
    expect(container.querySelector("tbody").querySelectorAll("svg")).toHaveLength(
      tableDataComplex.length
    );
  });

  test("un estado desconocido se muestra sin ícono", () => {
    const { container } = render(
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={[
          {
            name: "Feria USFQ",
            status: "Pendiente",
            date: "01.Feb.2022",
            progress: 50,
          },
        ]}
      />
    );
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("01.Feb.2022")).toBeInTheDocument();
    expect(
      container.querySelector("tbody").querySelectorAll("svg")
    ).toHaveLength(0);
  });

  test("una columna sin renderizador conocido deja la celda vacía", () => {
    const { container } = render(
      <ComplexTable
        columnsData={[
          ...columnsDataComplex,
          { Header: "EXTRA", accessor: "extra" },
        ]}
        tableData={[{ ...tableDataComplex[0], extra: "x" }]}
      />
    );
    const celdas = container.querySelectorAll("tbody td");
    expect(celdas).toHaveLength(columnsDataComplex.length + 1);
    expect(celdas[celdas.length - 1]).toBeEmptyDOMElement();
  });
});

describe("TotalSpent (admin/default)", () => {
  test("renderiza el monto, la variación y el line chart", () => {
    render(<TotalSpent />);
    expect(screen.getByText("$37.5K")).toBeInTheDocument();
    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("+2.45%")).toBeInTheDocument();
    expect(screen.getByTestId("apexchart")).toHaveAttribute("data-type", "line");
  });

  test("los botones declaran type=button (no envían formularios)", () => {
    render(<TotalSpent />);
    screen
      .getAllByRole("button")
      .forEach((btn) => expect(btn).toHaveAttribute("type", "button"));
  });
});

describe("WeeklyRevenue (admin/default)", () => {
  test("renderiza el encabezado, el bar chart y el botón con type=button", () => {
    render(<WeeklyRevenue />);
    expect(screen.getByText("Weekly Revenue")).toBeInTheDocument();
    expect(screen.getByTestId("apexchart")).toHaveAttribute("data-type", "bar");
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
