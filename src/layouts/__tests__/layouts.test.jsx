/* Tests de los 6 layouts (admin, auth, landing, usuario, page, privacidad):
 * estructura (sidebar/navbar presentes), enrutado interno por layout y
 * redirecciones por defecto. Las vistas pesadas se sustituyen mockeando
 * routes.js con componentes livianos; Navbar y Sidebar se stubbean (tienen
 * suite propia en components/__tests__/navegacion.test.jsx).
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

jest.mock("routes.js", () => {
  const React = require("react");
  const v = (texto) => React.createElement("div", null, texto);
  return {
    __esModule: true,
    default: [
      { name: "Dashboard", layout: "/admin", path: "dashboard", component: v("Vista Dashboard"), secondary: false },
      { name: "Reportes", layout: "/admin", path: "reportes", component: v("Vista Reportes"), secondary: false },
      { name: "Evento landing", layout: "/admin", path: "eventos/:id/landing", component: v("Vista Evento Landing") },
      { name: "Sign In", layout: "/auth", path: "sign-in", component: v("Vista SignIn") },
      { name: "Landing pública", layout: "/landing", path: ":id", component: v("Vista Landing Publica") },
      { name: "Usuario", layout: "/usuario", path: ":id", component: v("Vista Usuario") },
      { name: "Campus", layout: "/page", path: "campus", component: v("Vista Campus") },
      { name: "Privacidad", layout: "/privacidad", path: "", component: v("Vista Privacidad") },
    ],
  };
});

jest.mock("components/navbar", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props) =>
      React.createElement(
        "div",
        {
          "data-testid": "navbar",
          "data-signout": String(props.signOut),
        },
        props.brandText || ""
      ),
  };
});

jest.mock("components/sidebar", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props) =>
      React.createElement("div", {
        "data-testid": "sidebar",
        "data-open": String(props.open),
        "data-activepath": props.activePath,
      }),
  };
});

jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: jest.fn(),
}));

import { usePermissions } from "providers/PermissionsProvider";
import Admin from "layouts/admin";
import Auth from "layouts/auth";
import LandingLayout from "layouts/landing";
import UsuarioLayout from "layouts/usuario";
import PageLayout from "layouts/page";
import PrivacidadLayout from "layouts/privacidad";

// Igual que App.jsx: cada layout vive montado bajo su prefijo con comodín.
const renderLayout = (element, path, route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  // resetMocks:true (CRA) limpia la implementación antes de cada test.
  usePermissions.mockReturnValue({
    loading: false,
    isAdmin: true,
    isReportesOnly: false,
  });
});

describe("Layout admin", () => {
  test("en /admin redirige al dashboard y arma sidebar + navbar", async () => {
    renderLayout(<Admin />, "admin/*", "/admin");

    expect(await screen.findByText("Vista Dashboard")).toBeInTheDocument();
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-open", "true");
    expect(sidebar).toHaveAttribute("data-activepath", "");
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  test("en una sección de evento pasa el activePath al sidebar (panel secundario)", async () => {
    renderLayout(<Admin />, "admin/*", "/admin/eventos/ev-1/landing");

    expect(await screen.findByText("Vista Evento Landing")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-activepath",
      "eventos/:id/landing"
    );
  });

  test("el resize bajo 1200px cierra el sidebar y sobre 1200px lo reabre", async () => {
    const anchoOriginal = window.innerWidth;
    renderLayout(<Admin />, "admin/*", "/admin/dashboard");
    expect(await screen.findByText("Vista Dashboard")).toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 800,
    });
    fireEvent(window, new Event("resize"));
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", "false");

    window.innerWidth = 1400;
    fireEvent(window, new Event("resize"));
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", "true");

    window.innerWidth = anchoOriginal;
  });

  test("rol Reportes: sin sidebar, navbar 'Reportes' y redirección a /admin/reportes", async () => {
    usePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      isReportesOnly: true,
    });

    renderLayout(<Admin />, "admin/*", "/admin");

    expect(await screen.findByText("Vista Reportes")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toHaveTextContent("Reportes");
  });

  test("la prop reportesOnly fuerza el layout simplificado aunque el rol no lo sea", async () => {
    renderLayout(<Admin reportesOnly />, "admin/*", "/admin");

    expect(await screen.findByText("Vista Reportes")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
  });
});

describe("Layout auth", () => {
  test("en /auth redirige a sign-in y muestra el link de regreso y el toggle de tema", async () => {
    renderLayout(<Auth />, "auth/*", "/auth");

    expect(await screen.findByText("Vista SignIn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Dashboard/ })
    ).toHaveAttribute("href", "/admin");
    // FixedPlugin (toggle dark) es el único botón del layout
    expect(screen.getByRole("button")).toBeInTheDocument();
    // Footer de auth
    expect(
      screen.getByText(/Eventflow\. Todos los derechos reservados\./)
    ).toBeInTheDocument();
  });
});

describe("Layout landing (público)", () => {
  test("renderiza la vista del evento por :id y el footer institucional", () => {
    renderLayout(<LandingLayout />, "landing/*", "/landing/ev-123");

    expect(screen.getByText("Vista Landing Publica")).toBeInTheDocument();
    expect(
      screen.getByText("Copyright © 2025 Universidad San Francisco de Quito")
    ).toBeInTheDocument();
    // layout público: sin sidebar ni navbar del admin
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("navbar")).not.toBeInTheDocument();
  });
});

describe("Layout usuario (público)", () => {
  test("muestra cabecera USFQ con link oficial, la vista y el footer", () => {
    renderLayout(<UsuarioLayout />, "usuario/*", "/usuario/participante-1");

    expect(screen.getByText("Vista Usuario")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a página oficial USFQ/ })
    ).toHaveAttribute("href", "https://www.usfq.edu.ec/es");
    expect(
      screen.getByText("Copyright © 2025 Universidad San Francisco de Quito")
    ).toBeInTheDocument();
  });
});

describe("Layout page (estructura)", () => {
  test("renderiza navbar con la ruta actual, la vista y el footer", () => {
    renderLayout(<PageLayout />, "page/*", "/page/campus");

    expect(screen.getByText("Vista Campus")).toBeInTheDocument();
    // brandText por defecto del estado: "Campus"
    expect(screen.getByTestId("navbar")).toHaveTextContent("Campus");
    expect(
      screen.getByText(/Eventflow\. Todos los derechos reservados\./)
    ).toBeInTheDocument();
  });
});

describe("Layout privacidad", () => {
  test("renderiza la vista legal con navbar sin sesión (signOut=false)", () => {
    renderLayout(<PrivacidadLayout />, "privacidad/*", "/privacidad");

    expect(screen.getByText("Vista Privacidad")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toHaveAttribute(
      "data-signout",
      "false"
    );
  });
});
