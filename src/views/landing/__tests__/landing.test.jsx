/**
 * Tests de la landing pública (src/views/landing/index.jsx).
 *
 * Mocks en frontera de módulo:
 *  - aws-amplify/api: generateClient().graphql despacha por texto de query
 *    (getEventAttendee / eventAttendeesByEventID / listLandings / getEvent),
 *    con paginación configurable para el chequeo de sold-out.
 *  - @aws-amplify/ui-react: useAuthenticator con authStatus configurable.
 *  - scripts/useAwsTranslation: identidad (sin Amazon Translate).
 *  - views/landing/registro: stub que expone props clave como data-attributes.
 *  - react-router-dom: useNavigate espiado; MemoryRouter real para useParams.
 *
 * OJO: el componente lee window.location.href/search directamente (detección
 * de subevento y ?EventAttendee=), así que cada test sincroniza la URL real
 * del jsdom con history.pushState.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Landing from "views/landing";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuth = { status: "unauthenticated" };
jest.mock("@aws-amplify/ui-react", () => ({
  useAuthenticator: () => ({ authStatus: mockAuth.status }),
}));

const mockGraphql = jest.fn();
jest.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    graphql: (...args) => mockGraphql(...args),
    cancel: jest.fn(),
  }),
}));

// Traducción dinámica: identidad (la estática getLandingUI se usa REAL).
jest.mock("scripts/useAwsTranslation", () => ({
  useAwsTranslation: (texts) => texts,
}));

jest.mock("views/landing/registro/index", () => ({
  __esModule: true,
  default: (props) => {
    const React = require("react");
    return React.createElement("div", {
      "data-testid": "registro-mock",
      "data-lang": props.lang,
      "data-event-attendee": props.eventAttendeeProp
        ? props.eventAttendeeProp.id
        : "",
    });
  },
}));

const FUTURE = "2027-03-10T15:00:00.000Z";

const eventFixture = (over = {}) => ({
  id: "ev-1",
  title: "Congreso EventFlow",
  date: FUTURE,
  startDate: FUTURE,
  endDate: null,
  timezone: "America/Guayaquil",
  sendCertificates: false,
  maxRegs: null, // typeof null !== "number": sin cupo => nunca sold-out
  ...over,
});

const landingFixture = (over = {}) => ({
  id: "l-1",
  title: "Congreso EventFlow",
  description: "<p>El mejor evento del año</p>",
  location: "Teatro Calderón",
  extraInfo: "",
  customHtml: "",
  active: true,
  cost: "$10",
  ticketTitle: ["General", "VIP"],
  ticketPrice: [10, 25],
  mainBanner: null,
  ...over,
});

// Despachador GraphQL configurable por test. attendeePages alimenta la
// paginación del conteo de sold-out (una página por llamada).
const primeGraphql = ({
  event = eventFixture(),
  landing = landingFixture(),
  attendeePages = [],
  attendeesError = false,
  eventAttendee = null,
} = {}) => {
  let pageIdx = 0;
  mockGraphql.mockImplementation(async ({ query, variables }) => {
    if (query.includes("getEventAttendee")) {
      return { data: { getEventAttendee: eventAttendee } };
    }
    if (query.includes("eventAttendeesByEventID")) {
      if (attendeesError) throw new Error("throttled");
      const page = attendeePages[pageIdx] || { items: [], nextToken: null };
      pageIdx += 1;
      return { data: { eventAttendeesByEventID: page } };
    }
    if (query.includes("listLandings")) {
      return { data: { listLandings: { items: landing ? [landing] : [] } } };
    }
    if (query.includes("getEvent")) {
      return { data: { getEvent: event } };
    }
    return { data: {} };
  });
};

const renderLanding = (path = "/landing/ev-1") => {
  // El componente detecta el subevento y ?EventAttendee= desde window.location.
  window.history.pushState({}, "", path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/landing/:id" element={<Landing />} />
        <Route path="/landing/:id/:lang" element={<Landing />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  mockAuth.status = "unauthenticated";
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("Landing pública: carga y estados", () => {
  test("muestra el loader mientras el GraphQL no responde", () => {
    mockGraphql.mockImplementation(() => new Promise(() => {}));
    renderLanding();
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(screen.queryByText("Detalles del evento")).not.toBeInTheDocument();
  });

  test("renderiza los detalles del evento con tickets, precio y zona horaria", async () => {
    primeGraphql();
    renderLanding();

    expect(await screen.findByText("Detalles del evento")).toBeInTheDocument();
    // Título traducible (identidad en el mock) en el hero.
    expect(
      screen.getByRole("heading", { name: "Congreso EventFlow" })
    ).toBeInTheDocument();
    expect(screen.getByText("Teatro Calderón")).toBeInTheDocument();
    expect(screen.getByText("El mejor evento del año")).toBeInTheDocument();
    // Pill de zona horaria del EVENTO.
    expect(screen.getByText("Quito · GMT-5")).toBeInTheDocument();

    // Tickets con su costo formateado (evento pagado => selector visible).
    const select = screen.getByRole("combobox");
    expect(screen.getByRole("option", { name: "General" })).toHaveValue("10.00");
    expect(screen.getByRole("option", { name: "VIP" })).toHaveValue("25.00");

    // Precio inicial: primer ticket x 1.
    expect(
      screen.getByText((c, el) => el.tagName === "P" && el.textContent.startsWith("$10.00"))
    ).toBeInTheDocument();

    // Cambiar de ticket recalcula el precio.
    fireEvent.change(select, { target: { value: "25.00" } });
    expect(
      screen.getByText((c, el) => el.tagName === "P" && el.textContent.startsWith("$25.00"))
    ).toBeInTheDocument();

    // Sin maxRegs el botón de reserva aparece (no sold-out).
    expect(await screen.findByText("Reservar ticket")).toBeInTheDocument();
  });

  test("los botones +/- ajustan la cantidad (mínimo 1) y multiplican el precio", async () => {
    primeGraphql();
    renderLanding();
    await screen.findByText("Detalles del evento");

    const qty = screen.getByText("1");
    const minusBtn = qty.previousElementSibling;
    const plusBtn = qty.nextElementSibling;

    fireEvent.click(plusBtn);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText((c, el) => el.tagName === "P" && el.textContent.startsWith("$20.00"))
    ).toBeInTheDocument();

    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
    // En 1 el decremento no baja más.
    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText((c, el) => el.tagName === "P" && el.textContent.startsWith("$10.00"))
    ).toBeInTheDocument();
  });

  test("'Reservar ticket' abre el registro (stub) con el idioma vigente", async () => {
    primeGraphql();
    renderLanding();

    const reservar = await screen.findByText("Reservar ticket");
    const registro = screen.getByTestId("registro-mock");
    // Oculto hasta reservar.
    expect(registro.parentElement.className).toContain("hidden");

    fireEvent.click(reservar);
    expect(registro.parentElement.className).toContain("block");
    expect(registro).toHaveAttribute("data-lang", "ES");
    // Los detalles quedan ocultos.
    expect(
      screen.getByText("Detalles del evento").closest("div.hidden")
    ).not.toBeNull();
  });

  test("banner: usa la imagen del admin vía CloudFront o el placeholder local", async () => {
    primeGraphql({
      landing: landingFixture({ mainBanner: "banners/foto.jpg" }),
    });
    const { unmount } = renderLanding();
    await screen.findByText("Detalles del evento");
    expect(screen.getByAltText("Banner")).toHaveAttribute(
      "src",
      "https://dnuc5lxyun5b.cloudfront.net/public/banners/foto.jpg"
    );
    unmount();

    // Sin mainBanner cae al placeholder empaquetado.
    primeGraphql();
    renderLanding();
    await screen.findByText("Detalles del evento");
    expect(screen.getByAltText("Banner").getAttribute("src")).toContain(
      "bg-placeholder"
    );
  });

  test("landing desactivada + visitante anónimo => 'evento no activo'", async () => {
    primeGraphql({ landing: landingFixture({ active: false }) });
    renderLanding();
    expect(
      await screen.findByText("El evento no se encuentra activo")
    ).toBeInTheDocument();
    expect(screen.queryByText("Detalles del evento")).not.toBeInTheDocument();
  });

  test("?EventAttendee= inválido se limpia de la URL; uno válido llega al registro", async () => {
    // Inválido: getEventAttendee devuelve null => se borra el query param.
    primeGraphql({ eventAttendee: null });
    const { unmount } = renderLanding("/landing/ev-1?EventAttendee=missing");
    await screen.findByText("Detalles del evento");
    await waitFor(() => expect(window.location.search).toBe(""));
    unmount();

    // Válido: el stub de registro recibe el eventAttendee.
    primeGraphql({ eventAttendee: { id: "ea-77", authorized: true } });
    renderLanding("/landing/ev-1?EventAttendee=ea-77");
    await screen.findByText("Detalles del evento");
    await waitFor(() =>
      expect(screen.getByTestId("registro-mock")).toHaveAttribute(
        "data-event-attendee",
        "ea-77"
      )
    );
  });
});

describe("Landing pública: sold-out con paginación", () => {
  test("pagina eventAttendeesByEventID hasta el cupo y muestra 'Entradas Agotadas'", async () => {
    primeGraphql({
      event: eventFixture({ maxRegs: 3 }),
      attendeePages: [
        { items: [{ id: "a1" }, { id: "a2" }], nextToken: "tok-2" },
        { items: [{ id: "a3" }, { id: "a4" }], nextToken: null },
      ],
    });
    renderLanding();

    expect(await screen.findByText("Entradas Agotadas")).toBeInTheDocument();
    expect(screen.queryByText("Reservar ticket")).not.toBeInTheDocument();

    // Dos páginas: la primera sin nextToken, la segunda con el token devuelto,
    // ambas con proyección limitada y sin registros borrados.
    const pageCalls = mockGraphql.mock.calls.filter(([arg]) =>
      arg.query.includes("eventAttendeesByEventID")
    );
    expect(pageCalls).toHaveLength(2);
    expect(pageCalls[0][0].variables).toEqual({
      eventID: "ev-1",
      filter: { _deleted: { ne: true } },
      limit: 1000,
      nextToken: null,
    });
    expect(pageCalls[1][0].variables.nextToken).toBe("tok-2");
  });

  test("mientras se valida el cupo muestra el spinner del CTA (sin botón ni agotado)", async () => {
    primeGraphql({ event: eventFixture({ maxRegs: 5 }) });
    // El conteo de asistentes queda pendiente => isSoldOut sigue en null.
    const base = mockGraphql.getMockImplementation();
    mockGraphql.mockImplementation((args) =>
      args.query.includes("eventAttendeesByEventID")
        ? new Promise(() => {})
        : base(args)
    );
    const { container } = renderLanding();

    await screen.findByText("Detalles del evento");
    expect(container.querySelector(".loader-small")).toBeInTheDocument();
    expect(screen.queryByText("Reservar ticket")).not.toBeInTheDocument();
    expect(screen.queryByText("Entradas Agotadas")).not.toBeInTheDocument();
  });

  test("con cupo disponible (count < maxRegs) permite reservar", async () => {
    primeGraphql({
      event: eventFixture({ maxRegs: 100 }),
      attendeePages: [{ items: [{ id: "a1" }], nextToken: null }],
    });
    renderLanding();
    expect(await screen.findByText("Reservar ticket")).toBeInTheDocument();
    expect(screen.queryByText("Entradas Agotadas")).not.toBeInTheDocument();
  });

  test("si el conteo falla asume NO sold-out y loguea el error", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    primeGraphql({ event: eventFixture({ maxRegs: 5 }), attendeesError: true });
    renderLanding();

    expect(await screen.findByText("Reservar ticket")).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalledWith(
      "Error validating maxRegs:",
      expect.any(Error)
    );
  });
});

describe("Landing pública: popup de evento expirado", () => {
  test("muestra el popup cuando la fecha de fin pasó hace más de 24h", async () => {
    primeGraphql({
      event: eventFixture({
        startDate: "2026-01-10T15:00:00.000Z",
        endDate: "2026-01-11T20:00:00.000Z",
        date: "2026-01-10T15:00:00.000Z",
      }),
    });
    renderLanding();

    expect(await screen.findByText("Evento finalizado!")).toBeInTheDocument();
    expect(
      screen.getByText("Esta fecha ya no está disponible.")
    ).toBeInTheDocument();
  });

  test("no muestra el popup para eventos futuros", async () => {
    primeGraphql();
    renderLanding();
    await screen.findByText("Detalles del evento");
    expect(screen.queryByText("Evento finalizado!")).not.toBeInTheDocument();
  });
});

describe("Landing pública: idioma ES/EN", () => {
  test("cambiar a EN persiste en localStorage, refleja la URL y traduce la UI estática", async () => {
    primeGraphql();
    renderLanding();
    await screen.findByText("Detalles del evento");

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByText("Event details")).toBeInTheDocument();
    expect(localStorage.getItem("landingLang")).toBe("EN");
    expect(mockNavigate).toHaveBeenCalledWith("/landing/ev-1/en", {
      replace: true,
    });
    expect(screen.getByText("Book ticket")).toBeInTheDocument();

    // De regreso a ES: URL sin segmento de idioma y labels en español.
    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    expect(await screen.findByText("Detalles del evento")).toBeInTheDocument();
    expect(localStorage.getItem("landingLang")).toBe("ES");
    expect(mockNavigate).toHaveBeenCalledWith("/landing/ev-1", {
      replace: true,
    });
  });

  test("arranca en inglés cuando la URL trae /en (link compartido)", async () => {
    primeGraphql();
    renderLanding("/landing/ev-1/en");
    expect(await screen.findByText("Event details")).toBeInTheDocument();
    expect(screen.getByText("Book ticket")).toBeInTheDocument();
  });

  test("sin idioma en la URL respeta la preferencia guardada en localStorage", async () => {
    localStorage.setItem("landingLang", "EN");
    primeGraphql();
    renderLanding();
    expect(await screen.findByText("Event details")).toBeInTheDocument();
  });
});

describe("Landing pública: subeventos", () => {
  const SUBEVENT_URL = "/landing/bb85f39d-8300-4ada-ab70-c2b70cfc4b0b";

  test("la landing madre lista las actividades y 'Ver actividades' hace scroll a las cards", async () => {
    primeGraphql({ landing: landingFixture({ cost: "Gratuito" }) });
    renderLanding(SUBEVENT_URL);

    expect(
      await screen.findByText("Regístrate en una actividad")
    ).toBeInTheDocument();
    // Encabezado de selección en vez del de asistencia.
    expect(screen.getByText("Selecciona una actividad")).toBeInTheDocument();

    // Las 4 actividades enlazan a su propia landing.
    const card = screen.getByText("Cardio en Clave Tropical").closest("a");
    expect(card).toHaveAttribute(
      "href",
      "/landing/939722b8-9169-47c7-9cfc-64f8a40e0bd4"
    );
    expect(screen.getByText("Crêpe Diem")).toBeInTheDocument();
    expect(screen.getAllByText("Haz clic para más detalles")).toHaveLength(4);

    // El CTA hace scroll a las cards en lugar de abrir el registro.
    const cta = await screen.findByText("Ver actividades");
    fireEvent.click(cta);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(screen.getByTestId("registro-mock").parentElement.className).toContain(
      "hidden"
    );
  });

  test("una landing normal no muestra la sección de actividades", async () => {
    primeGraphql();
    renderLanding();
    await screen.findByText("Detalles del evento");
    expect(
      screen.queryByText("Regístrate en una actividad")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ver actividades")).not.toBeInTheDocument();
  });
});
