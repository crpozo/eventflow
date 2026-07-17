/* Tests de los componentes de src/views/admin/reportes/components/.
 * Librerías de charts mockeadas en la frontera (react-apexcharts /
 * echarts-for-react); se afirma el contenido y props que cada card renderiza.
 */
import React from "react";
import { render, screen, within } from "@testing-library/react";

jest.mock("react-apexcharts", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="apexchart" data-type={props.type || ""} />
  ),
}));

jest.mock("echarts-for-react", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="echart" style={props.style}>
      {props.option?.title?.text || ""}
    </div>
  ),
}));

import Banner from "views/admin/reportes/components/Banner";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import CheckTable from "views/admin/reportes/components/CheckTable";
import ComplexTable from "views/admin/reportes/components/ComplexTable";
import TaskCard from "views/admin/reportes/components/TaskCard";
import WeeklyRevenue from "views/admin/reportes/components/WeeklyRevenue";
import TotalSpent from "views/admin/reportes/components/TotalSpent";
import PieChartCard from "views/admin/reportes/components/PieChartCard";
import {
  columnsDataCheck,
  columnsDataComplex,
} from "views/admin/reportes/variables/columnsData";
import tableDataCheck from "views/admin/reportes/variables/tableDataCheck.json";
import tableDataComplex from "views/admin/reportes/variables/tableDataComplex.json";

describe("Banner", () => {
  test("renderiza el título de la sección Reportes", () => {
    render(<Banner />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Reportes" })
    ).toBeInTheDocument();
  });
});

describe("PieChartApache", () => {
  test("pasa la opción y la altura al chart de echarts", () => {
    render(
      <PieChartApache
        option={{ title: { text: "Distribución de asistentes" } }}
        height="450px"
      />
    );
    const chart = screen.getByTestId("echart");
    expect(chart).toHaveTextContent("Distribución de asistentes");
    expect(chart).toHaveStyle({ height: "450px", width: "100%" });
  });
});

describe("CheckTable", () => {
  test("la tabla no arrastra props ajenas al DOM (variant/mb/color)", () => {
    const { container } = render(
      <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
    );
    const table = container.querySelector("table");
    expect(table).not.toHaveAttribute("variant");
    expect(table).not.toHaveAttribute("mb");
    expect(table).not.toHaveAttribute("color");
  });

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

  test("una columna no contemplada renderiza la celda vacía", () => {
    render(
      <CheckTable
        columnsData={[
          ...columnsDataCheck,
          { Header: "EXTRA", accessor: "extra" },
        ]}
        tableData={[
          {
            name: ["Marketplace", false],
            quantity: 1,
            date: "Apr 26, 2022",
            progress: 10,
            extra: "no-renderizado",
          },
        ]}
      />
    );
    expect(screen.getByText("EXTRA")).toBeInTheDocument();
    expect(screen.queryByText("no-renderizado")).not.toBeInTheDocument();
  });
});

describe("ComplexTable", () => {
  test("renderiza los estados Approved/Disable/Error y las filas", () => {
    render(
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
  });

  test("un estado desconocido se muestra sin icono", () => {
    render(
      <ComplexTable
        columnsData={columnsDataComplex}
        tableData={[
          {
            name: "Marketplace",
            status: "Pendiente",
            date: "01.Feb.2021",
            progress: 10,
          },
        ]}
      />
    );
    const celda = screen.getByText("Pendiente").closest("td");
    expect(celda.querySelector("svg")).toBeNull();
  });

  test("una columna no contemplada renderiza la celda vacía", () => {
    render(
      <ComplexTable
        columnsData={[
          ...columnsDataComplex,
          { Header: "EXTRA", accessor: "extra" },
        ]}
        tableData={[
          {
            name: "Marketplace",
            status: "Approved",
            date: "24.Jan.2021",
            progress: 30,
            extra: "no-renderizado",
          },
        ]}
      />
    );
    expect(screen.getByText("EXTRA")).toBeInTheDocument();
    expect(screen.queryByText("no-renderizado")).not.toBeInTheDocument();
  });
});

describe("TaskCard", () => {
  test("renderiza el título Tasks y las tareas con sus checkboxes", () => {
    render(<TaskCard />);
    expect(
      screen.getByRole("heading", { name: "Tasks" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Landing Page Design").length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });
});

describe("WeeklyRevenue", () => {
  test("renderiza el encabezado y el bar chart", () => {
    render(<WeeklyRevenue />);
    expect(screen.getByText("Weekly Revenue")).toBeInTheDocument();
    expect(screen.getByTestId("apexchart")).toHaveAttribute(
      "data-type",
      "bar"
    );
  });

  test("el botón del card declara type=button", () => {
    render(<WeeklyRevenue />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("TotalSpent", () => {
  test("renderiza el monto, la variación y el line chart", () => {
    render(<TotalSpent />);
    expect(screen.getByText("$37.5K")).toBeInTheDocument();
    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("+2.45%")).toBeInTheDocument();
    expect(screen.getByTestId("apexchart")).toHaveAttribute(
      "data-type",
      "line"
    );
  });

  test("los botones del card declaran type=button", () => {
    render(<TotalSpent />);
    const botones = screen.getAllByRole("button");
    expect(botones).toHaveLength(2);
    botones.forEach((b) => expect(b).toHaveAttribute("type", "button"));
  });
});

describe("PieChartCard", () => {
  test("renderiza título, leyendas con porcentajes y el pie chart", () => {
    render(<PieChartCard />);
    expect(screen.getByText("Your Pie Chart")).toBeInTheDocument();
    expect(screen.getByText("Your Files")).toBeInTheDocument();
    expect(screen.getByText("63%")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByTestId("apexchart")).toHaveAttribute(
      "data-type",
      "pie"
    );
  });
});
