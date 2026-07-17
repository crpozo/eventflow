/* Tests del árbol de permisos Campus -> Área -> Evento
 * (src/views/admin/permisos/components/PermissionTree.jsx).
 *
 * Cubre: árbol vacío, expandir/colapsar niveles, conceder y quitar eventos
 * individuales (onChange con los ids correctos) y la herencia campus/área
 * (checkboxes marcados + deshabilitados con "(heredado)").
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PermissionTree from "../PermissionTree";

const TREE = [
  {
    id: "c1",
    title: "Cumbayá",
    areas: [
      {
        id: "a1",
        title: "Ingeniería",
        events: [
          { id: "e1", title: "Feria" },
          { id: "e2", title: "" }, // sin título -> se muestra "Evento"
        ],
      },
      { id: "a2", title: "Medicina", events: [] },
    ],
  },
];

// Wrapper controlado: refleja los cambios igual que lo hace UserFormModal.
function Controlled({ initial }) {
  const [value, setValue] = React.useState(
    initial || { campusIDs: [], areaIDs: [], eventIDs: [] }
  );
  return <PermissionTree tree={TREE} value={value} onChange={setValue} />;
}

// Botones "expandir" en orden de render (campus primero, luego áreas).
const expandir = (n) =>
  fireEvent.click(screen.getAllByRole("button", { name: "expandir" })[n]);

describe("PermissionTree", () => {
  test("árbol vacío: muestra el aviso y tolera value nulo", () => {
    render(<PermissionTree tree={[]} value={null} onChange={jest.fn()} />);
    expect(
      screen.getByText("No hay campus/áreas/eventos.")
    ).toBeInTheDocument();
  });

  test("expande niveles, muestra conteos, títulos y 'Sin eventos'", () => {
    render(<Controlled />);
    expect(screen.getByText("(2 áreas)")).toBeInTheDocument();
    expect(screen.queryByText("Ingeniería")).toBeNull();

    expandir(0); // campus
    expect(screen.getByText("Ingeniería")).toBeInTheDocument();
    expect(screen.getByText("(2 eventos)")).toBeInTheDocument();
    expect(screen.getByText("(0 eventos)")).toBeInTheDocument();

    expandir(1); // área Ingeniería
    expect(screen.getByText("Feria")).toBeInTheDocument();
    expect(screen.getByText("Evento")).toBeInTheDocument(); // título vacío

    expandir(2); // área Medicina, sin eventos
    expect(screen.getByText("Sin eventos")).toBeInTheDocument();

    expandir(0); // colapsa el campus
    expect(screen.queryByText("Ingeniería")).toBeNull();
  });

  test("conceder y quitar eventos individuales actualiza eventIDs", () => {
    const onChange = jest.fn();
    render(
      <PermissionTree
        tree={TREE}
        value={{ campusIDs: [], areaIDs: [], eventIDs: ["e2"] }}
        onChange={onChange}
      />
    );
    expandir(0);
    expandir(1);

    // e2 ("Evento") viene marcado; e1 ("Feria") no.
    expect(screen.getByRole("checkbox", { name: "Feria" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Evento" })).toBeChecked();

    // Marcar e1 lo agrega; desmarcar e2 lo quita.
    fireEvent.click(screen.getByRole("checkbox", { name: "Feria" }));
    expect(onChange).toHaveBeenCalledWith({
      campusIDs: [],
      areaIDs: [],
      eventIDs: ["e2", "e1"],
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Evento" }));
    expect(onChange).toHaveBeenLastCalledWith({
      campusIDs: [],
      areaIDs: [],
      eventIDs: [],
    });
  });

  test("conceder el área hereda sus eventos (marcados y deshabilitados)", () => {
    render(<Controlled />);
    expandir(0);
    expandir(1);

    fireEvent.click(screen.getByRole("checkbox", { name: /Ingeniería/ }));

    const evFeria = screen.getByRole("checkbox", { name: /Feria/ });
    expect(evFeria).toBeChecked();
    expect(evFeria).toBeDisabled();
    expect(screen.getAllByText("(heredado)").length).toBe(2); // ambos eventos

    // El área se puede des-conceder (no está heredada del campus).
    fireEvent.click(screen.getByRole("checkbox", { name: /Ingeniería/ }));
    expect(screen.getByRole("checkbox", { name: /Feria/ })).not.toBeChecked();
    expect(screen.queryByText("(heredado)")).toBeNull();
  });

  test("conceder el campus hereda áreas y eventos completos", () => {
    render(<Controlled />);
    expandir(0);
    expandir(1);

    fireEvent.click(screen.getByRole("checkbox", { name: /Cumbayá/ }));

    const area = screen.getByRole("checkbox", { name: /Ingeniería/ });
    expect(area).toBeChecked();
    expect(area).toBeDisabled();
    const evento = screen.getByRole("checkbox", { name: /Feria/ });
    expect(evento).toBeChecked();
    expect(evento).toBeDisabled();
    // 2 áreas + 2 eventos de Ingeniería visibles como heredados
    expect(screen.getAllByText("(heredado)").length).toBe(4);

    // Quitar el campus libera áreas y eventos.
    fireEvent.click(screen.getByRole("checkbox", { name: /Cumbayá/ }));
    expect(screen.getByRole("checkbox", { name: /Ingeniería/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Feria/ })).not.toBeChecked();
  });
});
