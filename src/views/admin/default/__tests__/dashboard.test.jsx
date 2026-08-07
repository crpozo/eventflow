import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

// Mediodía local de hace N días: inmune a saltos de horario, así el punto
// siempre cae en el día natural esperado del eje (que es local, no UTC).
const diaLocal = (n) => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate() - n, 12, 0, 0);
};
const isoDia = (n) => diaLocal(n).toISOString();

// Día 15 (mediodía) de hace N meses calendario: cae siempre dentro del mes,
// que es el grano de las ventanas de 6 meses y de año.
const isoMes = (n) => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth() - n, 15, 12, 0, 0).toISOString();
};

// Mismos formateadores que el componente, para poder predecir las etiquetas.
const diaCorto = (d) =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" })
    .format(d)
    .replaceAll(".", "");

// 3 próximos (hoy / mañana / legacy `date` en 3 días) + 1 finalizado.
const buildEvents = () => [
  { id: "ev-hoy", title: "Feria de Bienvenida", startDate: iso(60e3) },
  { id: "ev-man", title: "Congreso Medicina", startDate: iso(DAY) },
  { id: "ev-3d", title: "Taller Robotica", date: iso(3 * DAY) },
  { id: "ev-past", title: "Hackathon 2025", startDate: iso(-2 * DAY) },
];

const buildAttendees = () => [
  {
    id: "a1", eventID: "ev-hoy", createdAt: isoDia(1),
    email: "a1@usfq.edu.ec", authorized: true, checkIn: false,
    ticket: "General", quantity: 2,
  },
  { id: "a2", eventID: "ev-hoy", createdAt: isoDia(2), email: "a2@usfq.edu.ec" },
  // Ventana anterior (30-60 días atrás): cuenta para el delta, no para "cur".
  { id: "a3", eventID: "ev-hoy", createdAt: isoDia(40), email: "a3@usfq.edu.ec" },
  { id: "a4", eventID: "ev-man", createdAt: isoDia(3), email: "a4@usfq.edu.ec" },
  // Evento fuera del alcance: debe quedar excluido de todas las métricas.
  { id: "ghost", eventID: "ev-fantasma", createdAt: isoDia(1), email: "x@x.com" },
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

/* ── Helpers de lectura ───────────────────────────────────────────────────
   Las tarjetas de métrica son "número grande + etiqueta de dos líneas"
   (separadas por <br>), así que la etiqueta se localiza por su <span> con
   salto de línea y el valor es su hermano anterior. */
const etiquetaMetrica = (l1, l2) =>
  screen.getByText(
    (_, el) =>
      el.tagName === "SPAN" &&
      !!el.querySelector("br") &&
      el.textContent === `${l1}${l2}`
  );

const valorMetrica = (l1, l2) =>
  etiquetaMetrica(l1, l2).previousElementSibling.textContent;

const tarjetaMetrica = (l1, l2) => etiquetaMetrica(l1, l2).closest("section");

const tarjetaRegistros = () => screen.getByText("Registros").closest("section");

// Total del periodo: el número grande junto a la píldora del delta.
const totalRegistros = () =>
  screen.getByText("Registros").nextElementSibling.firstElementChild.textContent;

// "8 jul – 6 ago 2026 · por día"
const rangoRegistros = () =>
  screen.getByText("Registros").nextElementSibling.nextElementSibling.textContent;

// Puntos reales de la polilínea del gráfico de área+línea.
const puntosGrafico = () =>
  tarjetaRegistros()
    .querySelector("polyline")
    .getAttribute("points")
    .trim()
    .split(/\s+/);

// Etiquetas del eje X: el div que sigue al CONTENEDOR del gráfico (el SVG va
// envuelto para poder fijarle alto y superponer el punto del pico).
const etiquetasEje = () =>
  Array.from(
    tarjetaRegistros().querySelector("svg").closest("div").nextElementSibling
      .children
  ).map((n) => n.textContent);

// Espías de descarga: nombre de archivo y contenido del blob generado.
const espiarDescargas = () => {
  const descargas = [];
  const contenidos = [];
  const RealBlob = global.Blob;
  const createObjectURL = jest.fn(() => "blob:fake");
  const revokeObjectURL = jest.fn();
  global.URL.createObjectURL = createObjectURL;
  global.URL.revokeObjectURL = revokeObjectURL;
  global.Blob = function EspiaBlob(parts, opts) {
    contenidos.push(parts.join(""));
    return new RealBlob(parts, opts);
  };
  const clickSpy = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function registrarDescarga() {
      descargas.push(this.download);
    });
  return {
    descargas,
    contenidos,
    createObjectURL,
    revokeObjectURL,
    restaurar: () => {
      clickSpy.mockRestore();
      global.Blob = RealBlob;
    },
  };
};

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
  describe("carga y estados vacíos", () => {
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
      expect(screen.queryByText("Registros")).not.toBeInTheDocument();
    });
  });

  describe("cabecera", () => {
    test("solo lleva título, subtítulo y el botón de crear evento", () => {
      seedAll();
      renderDashboard();

      expect(
        screen.getByRole("heading", { name: "Dashboard" })
      ).toBeInTheDocument();
      expect(screen.getByText("Resumen general de tus eventos.")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Crear evento/ })
      ).toBeInTheDocument();

      // Controles del diseño anterior: ya no existen en ninguna parte.
      expect(
        screen.queryByRole("button", { name: /Ver todos los eventos/ })
      ).toBeNull();
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.queryByText(/Mostrando/)).toBeNull();
      expect(screen.queryByText(/Ver todos \(/)).toBeNull();
    });

    test("navega a crear evento desde el botón primario", () => {
      seedAll();
      renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /Crear evento/ }));
      expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/crear");
    });
  });

  describe("fila de métricas", () => {
    test("calcula totales, próximos, inscritos al próximo y finalizados", () => {
      seedAll();
      renderDashboard();

      expect(valorMetrica("Total", "eventos")).toBe("4");
      expect(valorMetrica("Próximos", "el más cercano hoy")).toBe("3");
      expect(valorMetrica("Inscritos", "al próximo")).toBe("3");
      expect(valorMetrica("Eventos", "finalizados")).toBe("1/4");
    });

    test("los eventos sin fecha parseable no entran en el denominador", () => {
      ds.__fixtures.Event = [
        ...buildEvents(),
        { id: "ev-sin", title: "Sin fecha" },
        { id: "ev-mala", title: "Fecha rota", startDate: "no-es-fecha" },
      ];
      renderDashboard();

      // 6 eventos en total, pero solo 4 con fecha válida (1 finalizado).
      expect(valorMetrica("Total", "eventos")).toBe("6");
      expect(valorMetrica("Eventos", "finalizados")).toBe("1/4");
    });

    test("un evento en curso (endDate futuro) sigue contando como próximo", () => {
      ds.__fixtures.Event = [
        {
          id: "ev-curso",
          title: "Semana de Ingenieria",
          startDate: iso(-1 * DAY),
          endDate: iso(2 * DAY),
        },
      ];
      renderDashboard();

      expect(valorMetrica("Próximo", "hoy")).toBe("1");
      expect(valorMetrica("Eventos", "finalizados")).toBe("0/1");
      expect(screen.getByText("Semana de Ingenieria")).toBeInTheDocument();
    });

    test.each([
      [5, "en 5 días"],
      [430, "en 14 meses"],
    ])("la métrica de próximo describe la distancia en %p días", (dias, texto) => {
      ds.__fixtures.Event = [
        { id: "ev-lejos", title: "Simposio Ecuador", startDate: isoDia(-dias) },
      ];
      renderDashboard();
      expect(valorMetrica("Próximo", texto)).toBe("1");
    });

    test("la tarjeta de total es clickeable y navega a la lista de eventos", () => {
      seedAll();
      renderDashboard();

      const card = tarjetaMetrica("Total", "eventos");
      expect(card).toHaveAttribute("role", "button");
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
    });

    test("la tarjeta de total se activa con Enter (accesible por teclado)", () => {
      seedAll();
      renderDashboard();

      const card = tarjetaMetrica("Total", "eventos");
      fireEvent.keyDown(card, { key: "Enter" });
      expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");

      // Una tecla cualquiera no dispara la navegación.
      mockNavigate.mockClear();
      fireEvent.keyDown(card, { key: "a" });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("sin próximos: la métrica queda en 0 y muestra 'sin agendar'", () => {
      ds.__fixtures.Event = [
        { id: "ev-past", title: "Hackathon 2025", startDate: iso(-2 * DAY) },
      ];
      renderDashboard();

      expect(valorMetrica("Próximos", "sin agendar")).toBe("0");
      expect(valorMetrica("Inscritos", "al próximo")).toBe("0");
    });
  });

  describe("tarjeta de registros", () => {
    test("dibuja una serie diaria de 30 puntos agrupada por día", () => {
      // 3 registros el mismo día (-5) + 1 el día -10: el pico vale 3.
      ds.__fixtures.Event = buildEvents();
      ds.__fixtures.EventAttendee = [
        { id: "p1", eventID: "ev-hoy", createdAt: diaLocal(5).toISOString() },
        { id: "p2", eventID: "ev-hoy", createdAt: new Date(diaLocal(5).getTime() + 36e5).toISOString() },
        { id: "p3", eventID: "ev-hoy", createdAt: new Date(diaLocal(5).getTime() + 72e5).toISOString() },
        { id: "p4", eventID: "ev-man", createdAt: isoDia(10) },
      ];
      renderDashboard();

      expect(puntosGrafico()).toHaveLength(30);
      expect(totalRegistros()).toBe("4");
      expect(rangoRegistros()).toMatch(/ · por día$/);
      expect(rangoRegistros()).toContain(diaCorto(diaLocal(29)));

      // El eje reparte exactamente 5 marcas, la última es hoy.
      const eje = etiquetasEje();
      expect(eje).toHaveLength(5);
      expect(eje[0]).toBe(diaCorto(diaLocal(29)));
      expect(eje[4]).toBe(diaCorto(diaLocal(0)));

      // Punto en el pico + texto de contexto con el día del pico.
      expect(screen.getByTestId("chart-peak")).toBeInTheDocument();
      expect(
        screen.getByText(`Pico: 3 registros el ${diaCorto(diaLocal(5))} · 5 días sin registros nuevos`)
      ).toBeInTheDocument();
    });

    test("el gráfico se expone como imagen con etiqueta accesible", () => {
      seedAll();
      renderDashboard();
      expect(
        screen.getByRole("img", { name: /Registros, 30 días: 3 en total\./ })
      ).toBeInTheDocument();
    });

    test("delta positivo: píldora verde con signo +", () => {
      seedAll();
      renderDashboard();

      // 3 en la ventana actual vs 1 en la anterior -> +200%
      expect(totalRegistros()).toBe("3");
      const pildora = screen.getByText("+200% vs. mes anterior");
      expect(pildora).toBeInTheDocument();
      expect(pildora.className).toMatch(/teal/);
    });

    test("delta negativo: píldora ámbar con signo menos", () => {
      ds.__fixtures.Event = buildEvents();
      ds.__fixtures.EventAttendee = [
        { id: "b1", eventID: "ev-hoy", createdAt: isoDia(1) },
        { id: "b2", eventID: "ev-hoy", createdAt: isoDia(35) },
        { id: "b3", eventID: "ev-hoy", createdAt: isoDia(45) },
        { id: "b4", eventID: "ev-man", createdAt: isoDia(50) },
      ];
      renderDashboard();

      // 1 actual vs 3 previos -> Math.round(-66.6) = -67%
      const pildora = screen.getByText("−67% vs. mes anterior");
      expect(pildora).toBeInTheDocument();
      expect(pildora.className).toMatch(/amber/);
    });

    test("sin ventana anterior comparable: 'Sin base previa'", () => {
      ds.__fixtures.Event = buildEvents();
      ds.__fixtures.EventAttendee = [
        { id: "c1", eventID: "ev-hoy", createdAt: isoDia(1) },
      ];
      renderDashboard();

      const pildora = screen.getByText("Sin base previa");
      expect(pildora).toBeInTheDocument();
      expect(pildora.className).toMatch(/gray|navy/);
      expect(screen.queryByText(/vs\. mes anterior/)).toBeNull();
    });

    test("periodo sin registros: píldora gris, sin punto de pico", () => {
      ds.__fixtures.Event = buildEvents();
      renderDashboard();

      expect(totalRegistros()).toBe("0");
      const pildora = screen.getByText("Sin registros en este periodo.");
      expect(pildora.className).toMatch(/gray|navy/);
      expect(tarjetaRegistros().querySelector("circle")).toBeNull();
      expect(puntosGrafico()).toHaveLength(30);
    });

    test("cambia la ventana con el selector de periodo (30d / 6m / año)", () => {
      // Registros repartidos en 14 meses: cada ventana ve un total distinto y
      // tiene además una ventana anterior con la que compararse.
      ds.__fixtures.Event = buildEvents();
      ds.__fixtures.EventAttendee = [
        { id: "r1", eventID: "ev-hoy", createdAt: isoDia(1) },   // ventana 30d
        { id: "r2", eventID: "ev-hoy", createdAt: isoMes(2) },   // ventana 6m
        { id: "r3", eventID: "ev-hoy", createdAt: isoMes(4) },   // ventana 6m
        { id: "r4", eventID: "ev-man", createdAt: isoMes(7) },   // previo 6m / actual 1a
        { id: "r5", eventID: "ev-man", createdAt: isoMes(9) },   // previo 6m / actual 1a
        { id: "r6", eventID: "ev-man", createdAt: isoMes(14) },  // previo 1a
      ];
      renderDashboard();

      expect(screen.getByRole("button", { name: "30 días" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(puntosGrafico()).toHaveLength(30);
      expect(totalRegistros()).toBe("1");

      fireEvent.click(screen.getByRole("button", { name: "6 meses" }));
      expect(puntosGrafico()).toHaveLength(6);
      expect(etiquetasEje()).toHaveLength(5);
      expect(rangoRegistros()).toMatch(/ · por mes$/);
      // 3 en la ventana (r1, r2, r3) vs 2 en la anterior (r4, r5) -> +50%
      expect(totalRegistros()).toBe("3");
      expect(screen.getByText("+50% vs. semestre anterior")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "6 meses" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      // El pico mensual lleva el año, porque dos julios son indistinguibles.
      expect(
        screen.getByText(/^Pico: \d+ registros? en \S+ \d{4}$/)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Año" }));
      expect(puntosGrafico()).toHaveLength(12);
      expect(etiquetasEje()).toHaveLength(5);
      expect(rangoRegistros()).toMatch(/\d{4} · por mes$/);
      // 5 en la ventana (r1..r5) vs 1 en la anterior (r6) -> +400%
      expect(totalRegistros()).toBe("5");
      expect(screen.getByText("+400% vs. año anterior")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "30 días" }));
      expect(puntosGrafico()).toHaveLength(30);
      expect(rangoRegistros()).toMatch(/ · por día$/);
      expect(totalRegistros()).toBe("1");
    });

    test("ignora registros con fecha de creación inválida o futura", () => {
      seedAll();
      ds.__fixtures.EventAttendee.push(
        { id: "bad", eventID: "ev-hoy", createdAt: "no-es-fecha", email: "bad@usfq.edu.ec" },
        { id: "sin", eventID: "ev-hoy", email: "sin@usfq.edu.ec" },
        { id: "fut", eventID: "ev-hoy", createdAt: iso(5 * DAY), email: "fut@usfq.edu.ec" }
      );
      renderDashboard();

      // Sigue en 3: ni el inválido ni el futuro entran en la ventana diaria.
      expect(totalRegistros()).toBe("3");

      // Mensual: 4 válidos en 6 meses, los inválidos quedan fuera.
      fireEvent.click(screen.getByRole("button", { name: "6 meses" }));
      expect(totalRegistros()).toBe("4");
    });
  });

  describe("fila inferior: próximo evento y siguiente paso", () => {
    test("muestra el próximo evento en una fila con avatar, chip y fecha", () => {
      seedAll();
      renderDashboard();

      const fila = screen.getByText("Feria de Bienvenida").closest("section");
      // Iniciales del avatar (se salta la palabra vacía "de").
      expect(within(fila).getByText("FB")).toBeInTheDocument();
      expect(within(fila).getByText("Publicado")).toBeInTheDocument();
      expect(within(fila).getByText(/· 3 inscritos$/)).toBeInTheDocument();
      expect(
        within(fila).getByRole("button", { name: "Ver reporte" })
      ).toBeInTheDocument();
      expect(
        within(fila).getByRole("button", { name: "Exportar CSV" })
      ).toBeInTheDocument();

      // Solo se muestra el más próximo: los demás no aparecen en la fila.
      expect(screen.queryByText("Congreso Medicina")).toBeNull();
      expect(screen.queryByText("Hackathon 2025")).toBeNull();
    });

    test.each([
      ["Feria de Bienvenida", "FB"],
      ["Robotica", "RO"],
      ["2026 Feria Anual", "FA"],
      ["", "EV"],
    ])("iniciales del avatar para %p", (title, iniciales) => {
      ds.__fixtures.Event = [{ id: "ev-av", title, startDate: iso(DAY) }];
      renderDashboard();
      expect(screen.getByText(iniciales)).toBeInTheDocument();
    });

    test("el chip refleja el estado de la landing (oculta / sin landing)", () => {
      ds.__fixtures.Event = [
        { id: "ev-man", title: "Congreso Medicina", startDate: iso(DAY) },
      ];
      ds.__fixtures.Landing = buildLandings();
      renderDashboard();
      expect(screen.getByText("Oculto")).toBeInTheDocument();

      ds.__fixtures.Landing = [];
      DataStore.observeQuery.mockClear();
      renderDashboard();
      expect(screen.getAllByText("Borrador").length).toBeGreaterThan(0);
    });

    test("Ver reporte navega a reportes con el evento preseleccionado", () => {
      seedAll();
      renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: "Ver reporte" }));
      expect(mockNavigate).toHaveBeenCalledWith("/admin/reportes", {
        state: { eventId: "ev-hoy" },
      });
    });

    test("con varios próximos: el siguiente paso lleva a la lista de eventos", () => {
      seedAll();
      renderDashboard();

      // 3 próximos -> quedan 2 además del destacado.
      expect(screen.getByText("2 eventos próximos más")).toBeInTheDocument();
      expect(screen.getByText("Revisa el calendario completo.")).toBeInTheDocument();

      fireEvent.click(
        screen.getByText("2 eventos próximos más").closest('[role="button"]')
      );
      expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
    });

    test("con un solo próximo: estado vacío que invita a crear el siguiente", () => {
      ds.__fixtures.Event = [
        { id: "ev-uno", title: "Congreso Medicina", startDate: iso(DAY) },
      ];
      renderDashboard();

      expect(screen.getByText("Sin más eventos próximos")).toBeInTheDocument();
      expect(
        screen.getByText("Programa el siguiente para mantener el ritmo.")
      ).toBeInTheDocument();

      const card = screen.getByText("Sin más eventos próximos").closest('[role="button"]');
      fireEvent.keyDown(card, { key: " " });
      expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos/crear");
    });

    test("sin próximos: mensaje de calendario vacío, sin acciones de reporte", () => {
      ds.__fixtures.Event = [
        { id: "ev-past", title: "Hackathon 2025", startDate: iso(-2 * DAY) },
      ];
      renderDashboard();

      expect(
        screen.getByText("No hay eventos próximos en el calendario.")
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Exportar CSV" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Ver reporte" })).toBeNull();
      expect(screen.getByText("Sin más eventos próximos")).toBeInTheDocument();
    });
  });

  describe("exportación CSV", () => {
    test("descarga el CSV del próximo evento con cabecera y filas escapadas", async () => {
      seedAll();
      const spy = espiarDescargas();
      renderDashboard();

      fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

      expect(spy.createObjectURL).toHaveBeenCalledTimes(1);
      expect(spy.descargas).toEqual(["reporte-feria-de-bienvenida.csv"]);

      // El blob se escribe con BOM para que Excel respete los acentos.
      expect(spy.contenidos[0].startsWith("\uFEFF")).toBe(true);
      const csv = spy.contenidos[0].slice(1);
      const lineas = csv.split("\n");
      expect(lineas[0]).toBe(
        '"Email","Autorizado","Check-in","Ticket","Cantidad","Fecha de registro"'
      );
      // Solo los inscritos de ev-hoy (a1, a2, a3); a4 y el fantasma quedan fuera.
      expect(lineas).toHaveLength(4);
      expect(lineas[1]).toMatch(/^"a1@usfq\.edu\.ec","Sí","No","General","2","/);
      expect(lineas[2]).toMatch(/^"a2@usfq\.edu\.ec","No","No","","","/);
      expect(csv).not.toContain("a4@usfq.edu.ec");

      // El blob se libera fuera del tick para no cancelar la descarga.
      await waitFor(
        () => expect(spy.revokeObjectURL).toHaveBeenCalledWith("blob:fake"),
        { timeout: 3000 }
      );
      spy.restaurar();
    });

    test("neutraliza el prefijo de fórmula y las comillas en las celdas", () => {
      ds.__fixtures.Event = [
        { id: "ev-inj", title: "Charla Segura", startDate: iso(DAY) },
      ];
      ds.__fixtures.EventAttendee = [
        {
          id: "i1", eventID: "ev-inj", createdAt: isoDia(1),
          email: "=SUM(1+1)", ticket: 'VIP "oro"',
        },
      ];
      const spy = espiarDescargas();
      renderDashboard();

      fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
      expect(spy.contenidos[0]).toContain('"\'=SUM(1+1)"');
      expect(spy.contenidos[0]).toContain('"VIP ""oro"""');
      spy.restaurar();
    });

    test("el nombre del archivo limpia acentos, símbolos y guiones extremos", () => {
      ds.__fixtures.Event = [
        { id: "ev-slug", title: "  ¡Música! & Fiesta 2026  ", startDate: iso(DAY) },
      ];
      ds.__fixtures.EventAttendee = [
        { id: "s1", eventID: "ev-slug", createdAt: isoDia(1), email: "s@x.com" },
        // Sin email ni fecha: csvCell debe emitir celdas vacías sin romper.
        { id: "s2", eventID: "ev-slug" },
      ];
      const spy = espiarDescargas();
      renderDashboard();

      fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
      expect(spy.descargas).toEqual(["reporte-musica-fiesta-2026.csv"]);
      expect(spy.contenidos[0]).toContain('"","No","No","","",""');
      spy.restaurar();
    });

    test("un título sin caracteres válidos cae al slug 'evento'", () => {
      ds.__fixtures.Event = [{ id: "ev-junk", title: "★★★", startDate: iso(DAY) }];
      ds.__fixtures.EventAttendee = [
        { id: "j1", eventID: "ev-junk", createdAt: isoDia(1), email: "j@x.com" },
      ];
      const spy = espiarDescargas();
      renderDashboard();

      fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
      expect(spy.descargas).toEqual(["reporte-evento.csv"]);
      spy.restaurar();
    });
  });

  describe("robustez y permisos", () => {
    test("timezone inválida: registra el error y no rompe la vista", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      ds.__fixtures.Event = [
        { id: "ev-tz", title: "Charla Marciana", startDate: iso(DAY), timezone: "Marte/Base" },
      ];
      renderDashboard();

      // La vista sigue en pie: el evento se muestra en la fila inferior.
      expect(screen.getByText("Charla Marciana")).toBeInTheDocument();
      const etiquetas = errorSpy.mock.calls.map((c) => c[0]);
      expect(etiquetas).toContain("relativeWhen: ");
      expect(etiquetas).toContain("compactDate: ");
      errorSpy.mockRestore();
    });

    test("subárea corrupta en localStorage: registra el error y redirige", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockPerms = { loading: false, isAdmin: false };
      localStorage.setItem("EVENTFLOW.subarea", "{no-es-json");
      renderDashboard();

      expect(errorSpy.mock.calls.map((c) => c[0])).toContain(
        "subarea inválida en localStorage: "
      );
      expect(mockNavigate).toHaveBeenCalledWith("/page/campus", expect.anything());
      errorSpy.mockRestore();
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
      seedAll();
      renderDashboard();

      expect(mockNavigate).not.toHaveBeenCalledWith("/page/campus", expect.anything());
      expect(valorMetrica("Total", "eventos")).toBe("4");

      // El predicado enviado a DataStore filtra por la subárea guardada.
      const llamadaEvent = DataStore.observeQuery.mock.calls.find(
        (c) => c[0].name === "Event"
      );
      const eq = jest.fn();
      llamadaEvent[1]({ careerID: { eq } });
      expect(eq).toHaveBeenCalledWith("sub-1");
    });
  });
});
