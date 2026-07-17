/* Tests de la navegación del admin:
 *  - Sidebar (rail principal + panel secundario del evento) — components/sidebar
 *  - SidebarLinks — components/sidebar/components/Links (con el routes.js real)
 *  - Navbar — components/navbar
 *  - FixedPlugin (toggle dark mode) — components/fixedPlugin
 *  - routes.js: forma de la tabla de rutas y guardas por sección
 * Amplify (DataStore/Auth UI) y models se mockean en la frontera de módulo.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// OJO: CRA corre jest con resetMocks:true — las implementaciones se ponen en
// el beforeEach (las factorías solo definen jest.fn() "vacíos").
jest.mock("@aws-amplify/ui-react", () => {
  const signOut = jest.fn();
  return {
    __esModule: true,
    __signOut: signOut,
    useAuthenticator: jest.fn(),
  };
});

jest.mock("aws-amplify/datastore", () => {
  const state = { eventById: {}, landings: [] };
  return {
    __esModule: true,
    __state: state,
    DataStore: {
      query: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      observeQuery: jest.fn(),
    },
  };
});

jest.mock("models", () => ({
  Event: { name: "Event" },
  Landing: {
    name: "Landing",
    copyOf: (base, fn) => {
      const draft = { ...base };
      fn(draft);
      return draft;
    },
  },
}));

jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: jest.fn(),
}));

import { useAuthenticator, __signOut } from "@aws-amplify/ui-react";
import { usePermissions } from "providers/PermissionsProvider";
import { DataStore, __state as ds } from "aws-amplify/datastore";
import { Event } from "models";
import Sidebar from "components/sidebar";
import SidebarLinks from "components/sidebar/components/Links";
import Navbar from "components/navbar";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";
import EventSectionGuard from "components/EventSectionGuard";
import routes from "routes.js";
import { seedStoredEvent } from "testUtils/amplifyMocks";

beforeEach(() => {
  localStorage.clear();
  ds.eventById = {};
  ds.landings = [];
  // resetMocks:true (CRA) borra las implementaciones antes de cada test.
  useAuthenticator.mockImplementation(() => ({
    user: {
      signInDetails: { loginId: "carlos@usfq.edu.ec" },
      username: "carlos",
    },
    signOut: __signOut,
  }));
  usePermissions.mockImplementation(() => ({ loading: false, isAdmin: true }));
  DataStore.query.mockImplementation(async (Model, id) => ds.eventById[id] || null);
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.observeQuery.mockImplementation(() => ({
    subscribe: (cb) => {
      cb({ items: ds.landings, isSynced: true });
      return { unsubscribe: jest.fn() };
    },
  }));
});

const renderSidebar = ({
  route = "/admin/eventos/ev-1/landing",
  activePath = "eventos/:id/landing",
  open = true,
  onClose = jest.fn(),
} = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar open={open} onClose={onClose} activePath={activePath} />
    </MemoryRouter>
  );

describe("Sidebar — rail principal", () => {
  test("muestra los 5 accesos del rail con sus destinos", () => {
    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    expect(screen.getByTitle("Dashboard")).toHaveAttribute(
      "href",
      "/admin/dashboard"
    );
    expect(screen.getByTitle("Eventos")).toHaveAttribute(
      "href",
      "/admin/eventos"
    );
    expect(screen.getByTitle("Reportes")).toHaveAttribute(
      "href",
      "/admin/reportes"
    );
    expect(screen.getByTitle("Permisos")).toHaveAttribute(
      "href",
      "/admin/permisos"
    );
    expect(screen.getByTitle("Estructura")).toHaveAttribute(
      "href",
      "/page/campus"
    );
  });

  test("marca activo el ícono cuya sección coincide con la ruta", () => {
    renderSidebar({ route: "/admin/eventos/ev-1/landing", activePath: "" });

    expect(screen.getByTitle("Eventos").className).toContain("bg-brand-500");
    expect(screen.getByTitle("Reportes").className).not.toContain(
      "bg-brand-500"
    );
  });

  test("el avatar muestra las iniciales del login y permite cerrar sesión", () => {
    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    const avatar = screen.getByRole("button", { name: "Menú de usuario" });
    expect(avatar).toHaveTextContent("CA");

    fireEvent.mouseDown(avatar);
    expect(screen.getByText("carlos@usfq.edu.ec")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(__signOut).toHaveBeenCalledTimes(1);
  });

  test("sin activePath NO renderiza el panel secundario del evento", () => {
    seedStoredEvent();
    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    expect(screen.queryByText("Gestión del evento")).not.toBeInTheDocument();
  });
});

describe("Sidebar — panel secundario del evento", () => {
  const evento = {
    id: "ev-1",
    title: "Feria de Ingeniería",
    startDate: "2026-07-10T14:00:00Z",
    timezone: "America/Guayaquil",
  };

  test("muestra título, fecha con zona horaria, link público y las 7 secciones", () => {
    seedStoredEvent(evento);
    renderSidebar();

    expect(
      screen.getByRole("heading", { name: "Feria de Ingeniería" })
    ).toBeInTheDocument();
    expect(screen.getByText(/\(GMT-5\)/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Link del evento/ })
    ).toHaveAttribute("href", "/landing/ev-1");

    // Las 7 secciones de gestión apuntan a eventos/<id>/<sección>/
    const secciones = [
      ["Detalle Evento", "detalle"],
      ["Landing page", "landing"],
      ["Formulario", "formulario"],
      ["Encuesta", "encuesta"],
      ["Resultados encuesta", "encuesta-dashboard"],
      ["Diseño Gafete", "diseno-gafete"],
      ["Participantes", "participantes"],
    ];
    secciones.forEach(([nombre, path]) => {
      expect(screen.getByRole("link", { name: nombre })).toHaveAttribute(
        "href",
        expect.stringContaining(`eventos/ev-1/${path}/`)
      );
    });
  });

  test("resalta la sección activa según activePath", () => {
    seedStoredEvent(evento);
    renderSidebar({ activePath: "eventos/:id/landing" });

    expect(
      screen.getByRole("link", { name: "Landing page" }).className
    ).toContain("bg-red-50");
    expect(
      screen.getByRole("link", { name: "Detalle Evento" }).className
    ).not.toContain("bg-red-50");
  });

  test("sin landing: chip 'Oculto' y selector deshabilitado", () => {
    seedStoredEvent(evento);
    renderSidebar();

    // selector span: "Oculto" también existe como <option> del select
    expect(screen.getByText("Oculto", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("con landing activa: chip 'Publicado' y ocultar guarda active=false", () => {
    seedStoredEvent(evento);
    ds.landings = [{ id: "l1", active: true }];
    renderSidebar();

    expect(screen.getByText("Publicado")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    expect(select).toBeEnabled();
    expect(select).toHaveValue("public");

    fireEvent.change(select, { target: { value: "hidden" } });
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "l1", active: false })
    );
  });

  test("con landing oculta: publicar guarda active=true", () => {
    seedStoredEvent(evento);
    ds.landings = [{ id: "l1", active: false }];
    renderSidebar();

    expect(screen.getByText("Oculto", { selector: "span" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "public" },
    });
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "l1", active: true })
    );
  });

  test("si la URL trae otro evento que el cacheado, consulta DataStore y sana el cache", async () => {
    seedStoredEvent({ id: "ev-1", title: "Evento Viejo" });
    ds.eventById["ev-9"] = {
      id: "ev-9",
      title: "Evento Nueve",
      startDate: "2026-08-01T15:00:00Z",
      timezone: "Pacific/Galapagos",
    };

    renderSidebar({ route: "/admin/eventos/ev-9/landing" });

    expect(
      await screen.findByRole("heading", { name: "Evento Nueve" })
    ).toBeInTheDocument();
    expect(DataStore.query).toHaveBeenCalledWith(Event, "ev-9");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).id).toBe("ev-9");
    expect(screen.getByText(/\(GMT-6\)/)).toBeInTheDocument();
    expect(screen.queryByText("Evento Viejo")).not.toBeInTheDocument();
  });
});

describe("SidebarLinks (con el routes.js real)", () => {
  const renderLinks = ({ route = "/admin/dashboard", activePath = "" } = {}) =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <SidebarLinks routes={routes} activePath={activePath} />
      </MemoryRouter>
    );

  test("muestra las rutas navegables y oculta las internas y las públicas", () => {
    renderLinks();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Reportes")).toBeInTheDocument();
    expect(screen.getByText("Permisos")).toBeInTheDocument();
    expect(screen.getByText("Estructura")).toBeInTheDocument();
    // internas (crear/editar/subrutas de evento) filtradas
    expect(screen.queryByText("Campus Crear")).not.toBeInTheDocument();
    expect(screen.queryByText("Evento crear")).not.toBeInTheDocument();
    expect(screen.queryByText("Evento landing")).not.toBeInTheDocument();
    // layouts públicos (/landing, /usuario, /privacidad) no aparecen
    expect(screen.queryByText("Privacidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Registro")).not.toBeInTheDocument();
  });

  test("resalta la ruta activa con bg-brand-500", () => {
    renderLinks({ route: "/admin/dashboard" });

    // toHaveClass compara tokens exactos: el item inactivo trae
    // hover:bg-brand-500 y un toContain daría falso positivo.
    expect(screen.getByText("Dashboard").closest("li")).toHaveClass(
      "bg-brand-500"
    );
    expect(screen.getByText("Reportes").closest("li")).not.toHaveClass(
      "bg-brand-500"
    );
  });

  test("con activePath seteado (panel secundario abierto) oculta los nombres", () => {
    renderLinks({ activePath: "eventos/:id/landing" });

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/admin/dashboard");
  });
});

describe("routes.js", () => {
  test("toda ruta tiene nombre, layout conocido, path y componente React", () => {
    expect(routes.length).toBeGreaterThan(20);
    routes.forEach((r) => {
      expect(typeof r.name).toBe("string");
      expect(["/admin", "/page", "/landing", "/usuario", "/privacidad"]).toContain(
        r.layout
      );
      expect(typeof r.path).toBe("string");
      expect(React.isValidElement(r.component)).toBe(true);
    });
  });

  test("las secciones de evento del admin van envueltas en EventSectionGuard con su sección", () => {
    const guardadas = {
      "eventos/:id/detalle": "detalle",
      "eventos/:id/landing": "landing",
      "eventos/:id/diseno-gafete": "gafete",
      "eventos/:id/formulario": "formulario",
      "eventos/:id/participantes": "participantes",
      "eventos/:id/encuesta": "formulario",
      "eventos/:id/encuesta-dashboard": "participantes",
    };
    Object.entries(guardadas).forEach(([path, seccion]) => {
      const ruta = routes.find((r) => r.layout === "/admin" && r.path === path);
      expect(ruta).toBeDefined();
      expect(ruta.component.type).toBe(EventSectionGuard);
      expect(ruta.component.props.section).toBe(seccion);
    });
  });

  test("las rutas públicas de landing existen (registro, encuesta e idioma)", () => {
    const publicas = routes
      .filter((r) => r.layout === "/landing")
      .map((r) => r.path);
    expect(publicas).toEqual(
      expect.arrayContaining([":id", ":id/registro", ":id/encuesta", ":id/:lang"])
    );
  });
});

describe("Navbar", () => {
  const renderNavbar = (props = {}) =>
    render(
      <MemoryRouter>
        <Navbar onOpenSidenav={jest.fn()} {...props} />
      </MemoryRouter>
    );

  test("muestra el logo enlazado al home", () => {
    renderNavbar();
    expect(screen.getByAltText("USFQ Logo").closest("a")).toHaveAttribute(
      "href",
      "/"
    );
  });

  test("muestra la miga campus / área / subárea desde localStorage", () => {
    localStorage.setItem("EVENTFLOW.campus", JSON.stringify({ title: "Cumbayá" }));
    localStorage.setItem("EVENTFLOW.area", JSON.stringify({ title: "Ingeniería" }));
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ title: "Software" }));

    renderNavbar();

    expect(
      screen.getByText("Cumbayá / Ingeniería / Software")
    ).toBeInTheDocument();
  });

  test("sin ubicación en localStorage no muestra la miga", () => {
    renderNavbar();
    expect(screen.queryByText(/\//, { selector: "p.hidden" })).toBeNull();
  });

  test("el hamburger llama onOpenSidenav con click y con Enter", () => {
    const onOpenSidenav = jest.fn();
    renderNavbar({ onOpenSidenav });

    const hamburger = screen.getByRole("button", { name: "Open sidenav" });
    fireEvent.click(hamburger);
    fireEvent.keyDown(hamburger, { key: "Enter" });
    expect(onOpenSidenav).toHaveBeenCalledTimes(2);
  });

  test("el menú de usuario permite cerrar sesión", () => {
    renderNavbar();

    fireEvent.mouseDown(screen.getByLabelText("User menu"));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(__signOut).toHaveBeenCalledTimes(1);
  });

  test("con signOut=false oculta el bloque de sesión", () => {
    renderNavbar({ signOut: false });

    expect(screen.queryByLabelText("User menu")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" })
    ).not.toBeInTheDocument();
  });
});

describe("FixedPlugin", () => {
  afterEach(() => document.body.classList.remove("dark"));

  test("alterna la clase dark del body al hacer click", () => {
    render(<FixedPlugin />);
    const boton = screen.getByRole("button");

    expect(document.body.classList.contains("dark")).toBe(false);
    fireEvent.click(boton);
    expect(document.body.classList.contains("dark")).toBe(true);
    fireEvent.click(boton);
    expect(document.body.classList.contains("dark")).toBe(false);
  });

  test("si el body ya está en dark, arranca en dark y lo apaga", () => {
    document.body.classList.add("dark");
    render(<FixedPlugin />);

    fireEvent.click(screen.getByRole("button"));
    expect(document.body.classList.contains("dark")).toBe(false);
  });
});
