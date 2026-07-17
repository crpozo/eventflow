import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();
let mockPerms = { loading: false, isAdmin: true };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockPerms,
}));

jest.mock("models", () => ({
  Event: { name: "Event" },
  EventAttendee: { name: "EventAttendee" },
  Landing: { name: "Landing" },
}));

// DataStore.observeQuery emite fixtures configurables por modelo. El flag
// __unsynced permite simular la espera del primer sync (isSynced: false).
jest.mock("aws-amplify/datastore", () => {
  const fixtures = { Event: [], EventAttendee: [], Landing: [] };
  const unsynced = {};
  return {
    __fixtures: fixtures,
    __unsynced: unsynced,
    DataStore: {
      observeQuery: jest.fn((Model) => ({
        subscribe: (cb) => {
          const name = (Model && Model.name) || "";
          cb({ items: fixtures[name] || [], isSynced: !unsynced[name] });
          return { unsubscribe: jest.fn() };
        },
      })),
    },
  };
});

import Dashboard from "../index";

const ds = require("aws-amplify/datastore");
const { DataStore } = ds;

const DAY = 864e5;
const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

// 3 próximos (hoy / mañana / legacy `date` en 3 días) + 1 finalizado.
const buildEvents = () => [
  { id: "ev-hoy", title: "Feria de Bienvenida", startDate: iso(60e3) },
  { id: "ev-man", title: "Congreso Medicina", startDate: iso(DAY) },
  { id: "ev-3d", title: "Taller Robotica", date: iso(3 * DAY) },
  { id: "ev-past", title: "Hackathon 2025", startDate: iso(-2 * DAY) },
];

const buildAttendees = () => [
  {
    id: "a1", eventID: "ev-hoy", createdAt: iso(-1 * DAY),
    email: "a1@usfq.edu.ec", authorized: true, checkIn: false,
    ticket: "General", quantity: 2,
  },
  { id: "a2", eventID: "ev-hoy", createdAt: iso(-2 * DAY), email: "a2@usfq.edu.ec" },
  // Ventana anterior (30-60 días atrás): cuenta para el delta, no para "cur".
  { id: "a3", eventID: "ev-hoy", createdAt: iso(-40 * DAY), email: "a3@usfq.edu.ec" },
  { id: "a4", eventID: "ev-man", createdAt: iso(-3 * DAY), email: "a4@usfq.edu.ec" },
  // Evento fuera del alcance: debe quedar excluido de todas las métricas.
  { id: "ghost", eventID: "ev-fantasma", createdAt: iso(-1 * DAY), email: "x@x.com" },
];

const buildLandings = () => [
  { id: "l1", landingEventId: "ev-hoy", active: true },
  { id: "l2", landingEventId: "ev-man", active: false },
  { id: "l3", active: true }, // sin landingEventId: se ignora
];

const seedAll = () => {
  ds.__fixtures.Event = buildEvents();
  ds.__fixtures.EventAttendee = buildAttendees();
  ds.__fixtures.Landing = buildLandings();
};

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

// <p> cuyo texto completo (valor + sufijo) coincide, para métricas.
const metricValue = (txt) =>
  screen.getByText(
    (_, el) =>
      el.tagName === "P" && el.textContent.replace(/\s+/g, " ").trim() === txt
  );

beforeEach(() => {
  ds.__fixtures.Event = [];
  ds.__fixtures.EventAttendee = [];
  ds.__fixtures.Landing = [];
  Object.keys(ds.__unsynced).forEach((k) => delete ds.__unsynced[k]);
  mockPerms = { loading: false, isAdmin: true };
  mockNavigate.mockClear();
  // CRA corre jest con resetMocks: true — la implementación del factory se
  // pierde antes de cada test, así que se restablece aquí.
  DataStore.observeQuery.mockImplementation((Model) => ({
    subscribe: (cb) => {
      const name = (Model && Model.name) || "";
      cb({ items: ds.__fixtures[name] || [], isSynced: !ds.__unsynced[name] });
      return { unsubscribe: jest.fn() };
    },
  }));
  localStorage.clear();
});

describe("Dashboard admin (views/admin/default)", () => {
  test("muestra el loader mientras cargan los permisos y no consulta eventos", () => {
    mockPerms = { loading: true, isAdmin: false };
    renderDashboard();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    const modelosConsultados = DataStore.observeQuery.mock.calls.map(
      (c) => c[0].name
    );
    expect(modelosConsultados).not.toContain("Event");
  });

  test("mantiene el loader hasta el primer sync de DataStore", () => {
    ds.__unsynced.Event = true; // [] local sin isSynced: aún no se sabe si hay eventos
    renderDashboard();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByText(/No existen eventos/)).not.toBeInTheDocument();
  });

  test("muestra el estado vacío cuando no hay eventos tras el sync", () => {
    renderDashboard();
    expect(
      screen.getByText(/No existen eventos en la base de datos/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Total eventos")).not.toBeInTheDocument();
  });

  test("calcula métricas: totales, próximos, registros con delta y finalizados", () => {
    seedAll();
    renderDashboard();

    expect(screen.getByText("Total eventos")).toBeInTheDocument();
    expect(metricValue("4 eventos")).toBeInTheDocument(); // total
    expect(metricValue("3 eventos")).toBeInTheDocument(); // próximos
    expect(metricValue("1 de 4")).toBeInTheDocument(); // finalizados

    // Registros 30d: 3 en ventana actual vs 1 en la anterior -> +200%
    expect(screen.getByText("Registros · 30 días")).toBeInTheDocument();
    expect(metricValue("3")).toBeInTheDocument();
    expect(screen.getByText("↗ +200%")).toBeInTheDocument();

    // Gráfico semanal con el mismo delta y total
    expect(screen.getByText("Registros por semana")).toBeInTheDocument();
    expect(screen.getByText(/3 en total/)).toBeInTheDocument();
    expect(screen.getByText(/\+200% vs\. mes anterior/)).toBeInTheDocument();
    ["S1", "S2", "S3", "S4"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  test("lista los próximos eventos con fecha relativa, estado de landing e inscritos", () => {
    seedAll();
    renderDashboard();

    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Feria de Bienvenida")).toBeInTheDocument();
    expect(within(tabla).getByText("Hoy")).toBeInTheDocument();
    expect(within(tabla).getByText("Mañana")).toBeInTheDocument();
    expect(within(tabla).getByText("En 3 días")).toBeInTheDocument();

    // Estado según la landing: activa, oculta o inexistente
    expect(within(tabla).getByText("Publicado")).toBeInTheDocument();
    expect(within(tabla).getByText("Oculto")).toBeInTheDocument();
    expect(within(tabla).getByText("Borrador")).toBeInTheDocument();

    // Inscritos: ev-hoy = 3 (histórico), ev-3d sin registros = "—"
    expect(within(tabla).getByText("3")).toBeInTheDocument();
    expect(within(tabla).getByText("—")).toBeInTheDocument();

    // El finalizado no aparece como próximo
    expect(within(tabla).queryByText("Hackathon 2025")).not.toBeInTheDocument();
    expect(screen.getByText(/Mostrando 3 de 3 próximos/)).toBeInTheDocument();
  });

  test("muestra delta negativo con flecha hacia abajo", () => {
    ds.__fixtures.Event = buildEvents();
    ds.__fixtures.EventAttendee = [
      { id: "b1", eventID: "ev-hoy", createdAt: iso(-1 * DAY) },
      { id: "b2", eventID: "ev-hoy", createdAt: iso(-35 * DAY) },
      { id: "b3", eventID: "ev-hoy", createdAt: iso(-45 * DAY) },
      { id: "b4", eventID: "ev-man", createdAt: iso(-50 * DAY) },
    ];
    renderDashboard();
    // 1 actual vs 3 previos -> Math.round(-66.6) = -67%
    expect(screen.getByText("↘ -67%")).toBeInTheDocument();
    expect(screen.getByText(/↘ -67% vs\. mes anterior/)).toBeInTheDocument();
  });

  test("cambia la ventana de tiempo con el control segmentado", () => {
    seedAll();
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: "6 meses" }));
    expect(screen.getByText("Registros · 6 meses")).toBeInTheDocument();
    expect(screen.getByText("Registros por mes")).toBeInTheDocument();
    expect(screen.getByText("últimos 6 meses")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Año" }));
    expect(screen.getByText("Registros · año")).toBeInTheDocument();
    expect(screen.getByText("último año")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "30 días" }));
    expect(screen.getByText("Registros · 30 días")).toBeInTheDocument();
  });

  test("navega a crear evento, a la lista y al detalle desde la tabla", () => {
    seedAll();
    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: /Crear evento/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/crear");

    fireEvent.click(screen.getByRole("button", { name: /Ver todos los eventos/ }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");

    // Click en una fila: guarda el evento para el sidebar y navega al detalle
    fireEvent.click(within(screen.getByRole("table")).getByText("Feria de Bienvenida"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/ev-hoy/detalle/");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event"))).toMatchObject({
      id: "ev-hoy",
      title: "Feria de Bienvenida",
    });
  });

  test("la tarjeta Total eventos navega con Enter (accesible por teclado)", () => {
    seedAll();
    renderDashboard();
    const card = screen.getByText("Total eventos").closest('[role="button"]');
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
  });

  test("tarjeta de reporte: destaca el evento de hoy, navega y exporta CSV", () => {
    seedAll();
    const createObjectURL = jest.fn(() => "blob:fake");
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    const descargas = [];
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function () {
        descargas.push(this.download);
      });

    renderDashboard();

    // ev-hoy es el primer próximo con registros -> "Evento de hoy"
    expect(screen.getByText(/Evento de hoy/)).toBeInTheDocument();
    expect(screen.getByText(/3 inscritos hasta hoy/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver reporte" }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/reportes");

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(descargas).toEqual(["reporte-feria-de-bienvenida.csv"]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");

    clickSpy.mockRestore();
  });

  test("sin próximos: mensaje de calendario vacío y sin tarjeta de reporte", () => {
    ds.__fixtures.Event = [
      { id: "ev-past", title: "Hackathon 2025", startDate: iso(-2 * DAY) },
    ];
    renderDashboard();
    expect(
      screen.getByText("No hay eventos próximos en el calendario.")
    ).toBeInTheDocument();
    expect(metricValue("0 eventos")).toBeInTheDocument(); // próximos
    expect(screen.queryByRole("button", { name: "Exportar CSV" })).toBeNull();
    expect(screen.getByText(/0 en total/)).toBeInTheDocument();
  });

  test("no-admin sin subárea seleccionada: redirige a escoger campus", () => {
    mockPerms = { loading: false, isAdmin: false };
    renderDashboard();
    expect(mockNavigate).toHaveBeenCalledWith("/page/campus", {
      state: {
        error: "Escoge un campus, area y subarea para acceder a tus eventos",
      },
    });
  });

  test("no-admin con subárea: consulta eventos filtrados por careerID", () => {
    mockPerms = { loading: false, isAdmin: false };
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ id: "sub-1" }));
    ds.__fixtures.Event = buildEvents();
    renderDashboard();

    expect(mockNavigate).not.toHaveBeenCalledWith("/page/campus", expect.anything());
    expect(screen.getByText("Total eventos")).toBeInTheDocument();

    // El predicado enviado a DataStore filtra por la subárea guardada
    const llamadaEvent = DataStore.observeQuery.mock.calls.find(
      (c) => c[0].name === "Event"
    );
    const eq = jest.fn();
    llamadaEvent[1]({ careerID: { eq } });
    expect(eq).toHaveBeenCalledWith("sub-1");
  });
});
