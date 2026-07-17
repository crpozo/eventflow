/* Gaps de cobertura de layouts (complementa layouts.test.jsx, que tiene su
 * propia suite — aquí solo lo que faltaba):
 *  - admin: callbacks del sidebar/navbar (onClose y onOpenSidenav) y la rama
 *    de getActiveNavbar que devuelve `secondary` cuando el href coincide.
 *  - page: getActiveRoute setea el brandText según la ruta y getActiveNavbar
 *    devuelve `secondary` (ramas de los for sobre window.location.href).
 * Navbar y Sidebar se stubbean con botones que disparan los callbacks.
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
      // secondary:true para poder asertar que getActiveNavbar lo devuelve
      { name: "Dashboard", layout: "/admin", path: "dashboard", component: v("Vista Dashboard"), secondary: true },
      { name: "Campus Central", layout: "/page", path: "campus", component: v("Vista Campus"), secondary: true },
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
          "data-secondary": String(props.secondary),
        },
        React.createElement(
          "button",
          { onClick: props.onOpenSidenav },
          "abrir sidebar"
        ),
        props.brandText || ""
      ),
  };
});

jest.mock("components/sidebar", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props) =>
      React.createElement(
        "div",
        { "data-testid": "sidebar", "data-open": String(props.open) },
        React.createElement(
          "button",
          { onClick: props.onClose },
          "cerrar sidebar"
        )
      ),
  };
});

jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: jest.fn(),
}));

import { usePermissions } from "providers/PermissionsProvider";
import Admin from "layouts/admin";
import PageLayout from "layouts/page";

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

afterEach(() => {
  // getActiveNavbar/getActiveRoute leen window.location.href (jsdom): se
  // restaura la URL para no contaminar otros tests.
  window.history.pushState({}, "", "/");
});

describe("Layout admin — callbacks y navbar secundario", () => {
  test("cerrar desde el sidebar y reabrir desde el navbar alternan open", async () => {
    renderLayout(<Admin />, "admin/*", "/admin/dashboard");

    expect(await screen.findByText("Vista Dashboard")).toBeInTheDocument();
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "cerrar sidebar" }));
    expect(sidebar).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByRole("button", { name: "abrir sidebar" }));
    expect(sidebar).toHaveAttribute("data-open", "true");
  });

  test("getActiveNavbar devuelve secondary cuando el href contiene layout+path", async () => {
    // getActiveNavbar concatena layout+path SIN slash: "/admindashboard"
    window.history.pushState({}, "", "/admindashboard");
    renderLayout(<Admin />, "admin/*", "/admin/dashboard");

    expect(await screen.findByText("Vista Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toHaveAttribute(
      "data-secondary",
      "true"
    );
  });

  test("sin coincidencia en el href, secondary queda en false", async () => {
    renderLayout(<Admin />, "admin/*", "/admin/dashboard");

    expect(await screen.findByText("Vista Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toHaveAttribute(
      "data-secondary",
      "false"
    );
  });
});

describe("Layout page — brandText y navbar secundario por URL", () => {
  test("setea el brandText con el nombre de la ruta activa y secondary=true", () => {
    // El href debe contener "/page/campus" (getActiveRoute, layout+"/"+path)
    // y "/pagecampus" (getActiveNavbar, layout+path) a la vez.
    window.history.pushState({}, "", "/pagecampus/page/campus");
    renderLayout(<PageLayout />, "page/*", "/page/campus");

    expect(screen.getByText("Vista Campus")).toBeInTheDocument();
    const navbar = screen.getByTestId("navbar");
    expect(navbar).toHaveTextContent("Campus Central");
    expect(navbar).toHaveAttribute("data-secondary", "true");
  });

  test("sin coincidencia mantiene el brandText por defecto (Campus) y secondary=false", () => {
    renderLayout(<PageLayout />, "page/*", "/page/campus");

    const navbar = screen.getByTestId("navbar");
    expect(navbar).toHaveTextContent("Campus");
    expect(navbar).toHaveAttribute("data-secondary", "false");
  });
});
