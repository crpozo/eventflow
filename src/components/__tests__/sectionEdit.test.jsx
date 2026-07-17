/* Tests de la lógica de permisos por sección:
 *  - useCanEditSection / ReadOnlyBanner / EditableSection (components/sectionEdit.jsx)
 *  - EventSectionGuard (components/EventSectionGuard.jsx)
 * PermissionsProvider se mockea en la frontera de módulo; el id del evento se
 * inyecta vía MemoryRouter + Route (useParams) o vía localStorage.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: jest.fn(),
}));

import { usePermissions } from "providers/PermissionsProvider";
import {
  useCanEditSection,
  ReadOnlyBanner,
  EditableSection,
} from "components/sectionEdit";
import EventSectionGuard from "components/EventSectionGuard";
import { withCertFields } from "scripts/certFields";

// Sonda que expone el resultado del hook como texto.
const Sonda = ({ section }) => {
  const puede = useCanEditSection(section);
  return <div data-testid="puede">{String(puede)}</div>;
};

// Render bajo una ruta con :id (como el admin real) o sin él.
const renderConRuta = (
  ui,
  {
    route = "/admin/eventos/ev-1/detalle",
    path = "/admin/eventos/:id/detalle",
  } = {}
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("useCanEditSection", () => {
  test("con permiso de edición devuelve true y consulta can(id, section, 'edit')", () => {
    const can = jest.fn(() => true);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(<Sonda section="detalle" />);

    expect(screen.getByTestId("puede")).toHaveTextContent("true");
    expect(can).toHaveBeenCalledWith("ev-1", "detalle", "edit");
  });

  test("sin permiso devuelve false", () => {
    usePermissions.mockReturnValue({ loading: false, can: () => false });

    renderConRuta(<Sonda section="landing" />);

    expect(screen.getByTestId("puede")).toHaveTextContent("false");
  });

  test("mientras carga no bloquea la UI (true) y no consulta can", () => {
    const can = jest.fn(() => false);
    usePermissions.mockReturnValue({ loading: true, can });

    renderConRuta(<Sonda section="detalle" />);

    expect(screen.getByTestId("puede")).toHaveTextContent("true");
    expect(can).not.toHaveBeenCalled();
  });

  test("sin :id en la ruta usa el evento cacheado en localStorage", () => {
    localStorage.setItem(
      "EVENTFLOW.event",
      JSON.stringify({ id: "ev-cache", title: "Cacheado" })
    );
    const can = jest.fn(() => false);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(<Sonda section="formulario" />, {
      route: "/otra",
      path: "/otra",
    });

    expect(can).toHaveBeenCalledWith("ev-cache", "formulario", "edit");
    expect(screen.getByTestId("puede")).toHaveTextContent("false");
  });

  test("sin id resoluble (ni ruta ni cache) devuelve true sin consultar can", () => {
    const can = jest.fn(() => false);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(<Sonda section="detalle" />, { route: "/otra", path: "/otra" });

    expect(screen.getByTestId("puede")).toHaveTextContent("true");
    expect(can).not.toHaveBeenCalled();
  });

  test("un JSON corrupto en localStorage no rompe: devuelve true", () => {
    localStorage.setItem("EVENTFLOW.event", "{esto-no-es-json");
    const can = jest.fn(() => false);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(<Sonda section="detalle" />, { route: "/otra", path: "/otra" });

    expect(screen.getByTestId("puede")).toHaveTextContent("true");
    expect(can).not.toHaveBeenCalled();
  });
});

describe("ReadOnlyBanner", () => {
  test("muestra el mensaje de solo lectura", () => {
    render(<ReadOnlyBanner />);
    expect(
      screen.getByText(
        /Modo solo lectura: puedes ver esta sección pero no editarla\./
      )
    ).toBeInTheDocument();
  });
});

describe("EditableSection", () => {
  const contenido = (
    <>
      <input aria-label="titulo" defaultValue="Mi evento" />
      <button>Guardar</button>
    </>
  );

  test("con permiso: sin banner y controles habilitados", () => {
    usePermissions.mockReturnValue({ loading: false, can: () => true });

    renderConRuta(
      <EditableSection section="detalle">{contenido}</EditableSection>
    );

    expect(screen.queryByText(/Modo solo lectura/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("titulo")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  test("sin permiso: muestra banner y deshabilita inputs y botones vía fieldset", () => {
    usePermissions.mockReturnValue({ loading: false, can: () => false });

    renderConRuta(
      <EditableSection section="detalle">{contenido}</EditableSection>
    );

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    expect(screen.getByLabelText("titulo")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});

describe("EventSectionGuard", () => {
  const hijo = <div>Contenido protegido</div>;

  test("mientras cargan permisos no renderiza nada", () => {
    usePermissions.mockReturnValue({ loading: true, can: jest.fn() });

    renderConRuta(
      <EventSectionGuard section="landing">{hijo}</EventSectionGuard>
    );

    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.queryByText("Acceso denegado")).not.toBeInTheDocument();
  });

  test("con permiso de vista renderiza los hijos y consulta can(id, section, 'view')", () => {
    const can = jest.fn(() => true);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(
      <EventSectionGuard section="landing">{hijo}</EventSectionGuard>
    );

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    expect(can).toHaveBeenCalledWith("ev-1", "landing", "view");
  });

  test("sin permiso muestra 'Acceso denegado' y oculta los hijos", () => {
    usePermissions.mockReturnValue({ loading: false, can: () => false });

    renderConRuta(
      <EventSectionGuard section="participantes">{hijo}</EventSectionGuard>
    );

    expect(
      screen.getByRole("heading", { name: "Acceso denegado" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No tienes permiso para ver esta sección/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  test("sin :id en la ruta deja pasar (no hay evento que proteger)", () => {
    const can = jest.fn(() => false);
    usePermissions.mockReturnValue({ loading: false, can });

    renderConRuta(
      <EventSectionGuard section="detalle">{hijo}</EventSectionGuard>,
      { route: "/otra", path: "/otra" }
    );

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    expect(can).not.toHaveBeenCalled();
  });
});

/* Huecos de cobertura de scripts/certFields.js que el test existente no toca
 * (elementos string con JSON roto, campos sin label/name y el caso en que no
 * hay nada que inyectar). Complementa scripts/certFields.test.js sin tocarlo. */
describe("withCertFields — ramas restantes", () => {
  const nombres = (qs) => qs.map((q) => (q && q.name) || null);

  test("un elemento string con JSON roto no rompe la detección y se inyectan ambos campos", () => {
    const qs = [
      "{esto-no-es-json",
      JSON.stringify({ name: "email", label: "Email", type: "text" }),
    ];
    const out = withCertFields(qs, true);

    expect(Array.isArray(out)).toBe(true);
    // originales intactos al inicio, inyectados al final
    expect(out.slice(0, 2)).toEqual(qs);
    expect(nombres(out.slice(2))).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
  });

  test("si el admin ya agregó ambos campos, devuelve el MISMO array sin inyectar", () => {
    const qs = [
      { name: "cert_nombre", label: "Nombre para el certificado", type: "text" },
      {
        name: "cert_enviar",
        label: "¿Deseas certificado?",
        type: "select",
        values: [{ label: "Sí", value: "Si" }],
      },
    ];

    expect(withCertFields(qs, true)).toBe(qs);
  });

  test("un campo sin label ni name no rompe y no suprime la inyección", () => {
    const out = withCertFields([{ type: "text" }], true);

    expect(nombres(out)).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
    expect(out).toHaveLength(3);
  });
});
