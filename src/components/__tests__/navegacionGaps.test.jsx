/* Gaps de navegación (complementa navegacion.test.jsx, suite ajena):
 *  - Navbar: activación del hamburger con la tecla espacio y teclas ignoradas.
 *  - Sidebar: cache EVENTFLOW.event corrupto o "undefined" (ramas del
 *    try/parse), fechas del header (compactDate: sin fecha, fecha inválida,
 *    timezone inválida → catch, y el fallback startDate || date) e iniciales
 *    del avatar cuando no hay loginId ni username.
 *  - SidebarCard (FreeCard): contenido y link de upgrade.
 * Amplify (DataStore/Auth UI) y models se mockean en la frontera de módulo.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("@aws-amplify/ui-react", () => {
  const signOut = jest.fn();
  return {
    __esModule: true,
    __signOut: signOut,
    useAuthenticator: jest.fn(),
  };
});

jest.mock("aws-amplify/datastore", () => ({
  __esModule: true,
  DataStore: {
    query: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    observeQuery: jest.fn(),
  },
}));

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
import { DataStore } from "aws-amplify/datastore";
import { Event } from "models";
import Sidebar from "components/sidebar";
import Navbar from "components/navbar";
import FreeCard from "components/sidebar/components/SidebarCard";

beforeEach(() => {
  localStorage.clear();
  // resetMocks:true (CRA) borra las implementaciones antes de cada test.
  useAuthenticator.mockImplementation(() => ({
    user: {
      signInDetails: { loginId: "carlos@usfq.edu.ec" },
      username: "carlos",
    },
    signOut: __signOut,
  }));
  usePermissions.mockImplementation(() => ({ loading: false, isAdmin: true }));
  DataStore.query.mockImplementation(async () => null);
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.observeQuery.mockImplementation(() => ({
    subscribe: (cb) => {
      cb({ items: [], isSynced: true });
      return { unsubscribe: jest.fn() };
    },
  }));
});

const renderSidebar = ({
  route = "/admin/eventos/ev-1/landing",
  activePath = "eventos/:id/landing",
} = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar open={true} onClose={jest.fn()} activePath={activePath} />
    </MemoryRouter>
  );

// El <p> de fecha del header siempre termina en "(GMT-5)" / "(GMT-6)".
const fechaHeader = () => screen.getByText(/\(GMT-[56]\)/);

describe("Navbar — hamburger por teclado", () => {
  const renderNavbar = (onOpenSidenav) =>
    render(
      <MemoryRouter>
        <Navbar onOpenSidenav={onOpenSidenav} />
      </MemoryRouter>
    );

  test("la tecla espacio abre el sidenav", () => {
    const onOpenSidenav = jest.fn();
    renderNavbar(onOpenSidenav);

    fireEvent.keyDown(screen.getByRole("button", { name: "Open sidenav" }), {
      key: " ",
    });
    expect(onOpenSidenav).toHaveBeenCalledTimes(1);
  });

  test("otras teclas no abren el sidenav", () => {
    const onOpenSidenav = jest.fn();
    renderNavbar(onOpenSidenav);

    fireEvent.keyDown(screen.getByRole("button", { name: "Open sidenav" }), {
      key: "Escape",
    });
    expect(onOpenSidenav).not.toHaveBeenCalled();
  });
});

describe("Sidebar — cache EVENTFLOW.event dañado", () => {
  test("JSON inválido: ignora el cache, consulta por el id de la URL y lo sana", async () => {
    localStorage.setItem("EVENTFLOW.event", "{esto no es json");
    DataStore.query.mockImplementation(async () => ({
      id: "ev-7",
      title: "Evento Siete",
      startDate: "2026-08-01T15:00:00Z",
      timezone: "America/Guayaquil",
    }));

    renderSidebar({ route: "/admin/eventos/ev-7/landing" });

    expect(
      await screen.findByRole("heading", { name: "Evento Siete" })
    ).toBeInTheDocument();
    expect(DataStore.query).toHaveBeenCalledWith(Event, "ev-7");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event")).id).toBe("ev-7");
  });

  test("cache literal \"undefined\" sin id en la URL: ni parsea ni consulta", () => {
    localStorage.setItem("EVENTFLOW.event", "undefined");

    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    expect(screen.queryByText("Gestión del evento")).not.toBeInTheDocument();
    expect(DataStore.query).not.toHaveBeenCalled();
    // el cache no se toca (sigue el literal)
    expect(localStorage.getItem("EVENTFLOW.event")).toBe("undefined");
  });

  test("en /eventos/crear no consulta DataStore aunque el cache no coincida", () => {
    localStorage.setItem(
      "EVENTFLOW.event",
      JSON.stringify({ id: "ev-1", title: "Evento Uno" })
    );

    renderSidebar({ route: "/admin/eventos/crear/detalle", activePath: "" });

    expect(DataStore.query).not.toHaveBeenCalled();
  });
});

describe("Sidebar — fecha del header (compactDate)", () => {
  const seed = (extra) =>
    localStorage.setItem(
      "EVENTFLOW.event",
      JSON.stringify({ id: "ev-1", title: "Evento Uno", ...extra })
    );

  test("sin startDate ni date muestra solo la zona horaria", () => {
    seed({ timezone: "America/Guayaquil" });
    renderSidebar();

    expect(fechaHeader().textContent).not.toMatch(/·/);
    expect(fechaHeader()).toHaveTextContent("(GMT-5)");
  });

  test("fecha inválida no revienta y omite la fecha", () => {
    seed({ startDate: "fecha-mala", timezone: "America/Guayaquil" });
    renderSidebar();

    expect(fechaHeader().textContent).not.toMatch(/·/);
  });

  test("timezone inválida cae al catch, la registra en consola y omite la fecha", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    seed({ startDate: "2026-07-10T14:00:00Z", timezone: "Zona/Invalida" });
    renderSidebar();

    // tzLabel trata cualquier zona distinta de Galápagos como GMT-5
    expect(fechaHeader()).toHaveTextContent("(GMT-5)");
    expect(fechaHeader().textContent).not.toMatch(/·/);
    // El catch registra el RangeError de Intl con el prefijo de la función.
    expect(errorSpy).toHaveBeenCalledWith("compactDate: ", expect.any(RangeError));
    errorSpy.mockRestore();
  });

  test("sin startDate usa el campo date (fallback legado)", () => {
    seed({ date: "2026-07-10T14:00:00Z", timezone: "America/Guayaquil" });
    renderSidebar();

    // fecha + " · " + hora en la zona del evento
    expect(fechaHeader().textContent).toMatch(/10\/07\/2026 · 09:00/);
  });
});

describe("Sidebar — iniciales del avatar", () => {
  test("sin loginId usa el username", () => {
    useAuthenticator.mockImplementation(() => ({
      user: { username: "maria" },
      signOut: __signOut,
    }));

    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    expect(
      screen.getByRole("button", { name: "Menú de usuario" })
    ).toHaveTextContent("MA");
  });

  test("sin usuario cae al placeholder US", () => {
    useAuthenticator.mockImplementation(() => ({
      user: undefined,
      signOut: __signOut,
    }));

    renderSidebar({ route: "/admin/dashboard", activePath: "" });

    expect(
      screen.getByRole("button", { name: "Menú de usuario" })
    ).toHaveTextContent("US");
  });
});

describe("SidebarCard (FreeCard)", () => {
  test("muestra la promo PRO con el link externo de upgrade", () => {
    render(<FreeCard />);

    // "Upgrade to PRO" aparece como título (<p>) y como botón (<a>)
    expect(
      screen.getByText("Upgrade to PRO", { selector: "p" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Improve your development process/)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade to PRO" })).toHaveAttribute(
      "href",
      "https://horizon-ui.com/pro?ref=live-free-tailwind-react"
    );
  });
});
