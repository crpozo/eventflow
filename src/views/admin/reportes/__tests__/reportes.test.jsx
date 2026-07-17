/* Tests de la vista de Reportes (src/views/admin/reportes/index.jsx).
 *
 * Cubre: guardas de permisos (redirect / Reportes-only / subárea legacy),
 * modo resumen (métricas agregadas, chips, búsqueda, filtros de área/subárea
 * y fechas, grilla de tarjetas con estados), modo detalle (métricas propias,
 * charts derivados de groupEventData — incluido el select `cert_enviar` SIN
 * mapeo de chart que antes reventaba en options.series — distribuciones
 * OptionBars y stats numéricos), y exportación a Excel (evento + base).
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("echarts", () => ({
  graphic: { LinearGradient: function LinearGradient() {} },
}));

// echarts-for-react → div con el título del chart (para afirmar qué se grafica)
jest.mock("echarts-for-react", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="echart">{props.option?.title?.text || "chart"}</div>
  ),
}));

jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

jest.mock("models", () => ({
  Campus: { name: "Campus" },
  Area: { name: "Area" },
  Career: { name: "Career" },
  Event: { name: "Event" },
  Attendee: { name: "Attendee" },
  EventAttendee: { name: "EventAttendee" },
  Form: { name: "Form" },
  Landing: { name: "Landing" },
}));

// DataStore con fixtures por modelo y evaluación ingenua de predicados
// (soporta cadenas tipo (e) => e.eventID.eq(x) y (f) => f.Event.id.eq(x)).
// OJO: CRA corre Jest con resetMocks:true — las implementaciones se pierden
// antes de cada test, por eso van en __impls y se reponen en beforeEach.
jest.mock("aws-amplify/datastore", () => {
  const fixtures = {};
  const capture = (pred) => {
    let got = null;
    const node = (path) =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (prop === "eq") {
              return (v) => {
                got = { path, value: v };
                return true;
              };
            }
            return node([...path, prop]);
          },
        }
      );
    try {
      pred(node([]));
    } catch {
      got = null;
    }
    return got;
  };
  const deepGet = (obj, path) =>
    path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  const queryImpl = async (Model, pred) => {
    const rows = fixtures[Model?.name] || [];
    if (typeof pred !== "function") return rows;
    const cond = capture(pred);
    if (!cond) return rows;
    return rows.filter((r) => deepGet(r, cond.path) === cond.value);
  };
  const observeImpl = (Model) => ({
    subscribe: (cb) => {
      cb({ items: fixtures[Model?.name] || [], isSynced: true });
      return { unsubscribe: () => {} };
    },
  });
  const DataStore = {
    __fixtures: fixtures,
    __impls: { queryImpl, observeImpl },
    query: jest.fn(queryImpl),
    observeQuery: jest.fn(observeImpl),
    save: jest.fn(async (m) => m),
    delete: jest.fn(async (m) => m),
  };
  return { DataStore };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const { DataStore } = require("aws-amplify/datastore");
const XLSX = require("xlsx");
const Reportes = require("views/admin/reportes").default;

const PAST = "2020-05-10T10:00:00.000Z";
const FUTURE_A = "2050-06-01T10:00:00.000Z";
const FUTURE_B = "2051-03-15T10:00:00.000Z";

// Respuestas del evento e1: incluye select con pie-chart, number con bar-chart
// y el select cert_enviar SIN mapeo de chart (className form-control).
const answersAna = [
  { name: "encabezado", type: "header", label: "Datos" },
  { name: "nombre", type: "text", label: "Nombre", userData: ["Ana"] },
  { name: "email", type: "text", label: "Email", userData: ["ana@x.com"] },
  {
    name: "color",
    type: "select",
    label: "Color favorito",
    userData: ["Rojo"],
    values: [
      { label: "Rojo", value: "Rojo" },
      { label: "Azul", value: "Azul" },
    ],
  },
  { name: "edad", type: "number", label: "Edad", userData: ["25"] },
  {
    name: "cert_enviar",
    type: "select",
    label: "¿Enviar certificado?",
    userData: ["Sí"],
    values: [
      { label: "Sí", value: "Sí" },
      { label: "No", value: "No" },
    ],
  },
  {
    name: "acompanantes",
    type: "number",
    label: "Acompañantes",
    className: "form-control",
    userData: ["2"],
  },
  {
    name: "intereses",
    type: "checkbox-group",
    label: "Intereses",
    userData: ["Deporte", "Música"],
    values: [
      { label: "Deporte", value: "Deporte" },
      { label: "Música", value: "Música" },
      { label: "Arte", value: "Arte" },
    ],
  },
];

const answersLuis = [
  { name: "nombre", type: "text", label: "Nombre", userData: ["Luis"] },
  { name: "email", type: "text", label: "Email", userData: ["luis@x.com"] },
  {
    name: "color",
    type: "select",
    label: "Color favorito",
    userData: ["Rojo"], // repite valor → cubre la rama de incremento/finalize
    values: [
      { label: "Rojo", value: "Rojo" },
      { label: "Azul", value: "Azul" },
    ],
  },
  { name: "edad", type: "number", label: "Edad", userData: ["35"] },
  {
    name: "cert_enviar",
    type: "select",
    label: "¿Enviar certificado?",
    userData: ["Tal vez"], // valor fuera de `values` → fila extra en OptionBars
    values: [
      { label: "Sí", value: "Sí" },
      { label: "No", value: "No" },
    ],
  },
  {
    name: "acompanantes",
    type: "number",
    label: "Acompañantes",
    className: "form-control",
    userData: ["4"],
  },
  {
    name: "intereses",
    type: "checkbox-group",
    label: "Intereses",
    userData: ["Deporte"],
    values: [
      { label: "Deporte", value: "Deporte" },
      { label: "Música", value: "Música" },
      { label: "Arte", value: "Arte" },
    ],
  },
];

// e2: solo campos de texto → sin nada graficable (estado vacío del detalle)
const answersEva = [
  { name: "nombre", type: "text", label: "Nombre", userData: ["Eva"] },
  { name: "email", type: "text", label: "Email", userData: ["eva@x.com"] },
];

function seedFixtures() {
  const f = DataStore.__fixtures;
  Object.keys(f).forEach((k) => delete f[k]);
  Object.assign(f, {
    Campus: [{ id: "c1", title: "Campus Quito" }],
    Area: [{ id: "a1", title: "Área Médica", campusID: "c1" }],
    Career: [{ id: "s1", title: "Subárea Cardio", areaID: "a1" }],
    Event: [
      { id: "e1", title: "Congreso Cardio", careerID: "s1", startDate: PAST },
      { id: "e2", title: "Feria Salud", careerID: "s1", startDate: FUTURE_A },
      {
        id: "e3",
        title: "Taller Nutrición",
        careerID: "s1",
        startDate: FUTURE_B,
      },
    ],
    EventAttendee: [
      {
        id: "ea1",
        eventID: "e1",
        email: "ana@x.com",
        checkIn: true,
        createdAt: "2020-05-01T00:00:00.000Z",
        formAnswers: answersAna,
      },
      {
        id: "ea2",
        eventID: "e1",
        email: "luis@x.com",
        checkIn: false,
        createdAt: "2020-05-02T00:00:00.000Z",
        formAnswers: answersLuis,
      },
      {
        id: "ea3",
        eventID: "e2",
        email: "eva@x.com",
        checkIn: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        formAnswers: answersEva,
      },
    ],
    Landing: [{ id: "l1", landingEventId: "e2", active: true }],
    Form: [
      {
        id: "f1",
        Event: { id: "e1" },
        questions: [
          { name: "color", className: "pie-chart", label: "Color favorito" },
          { name: "edad", className: "bar-chart", label: "Edad" },
          {
            name: "cert_enviar",
            className: "form-control", // sin "-chart" → NO debe graficarse ni reventar
            label: "¿Enviar certificado?",
          },
        ],
      },
    ],
    Attendee: [
      {
        id: "at1",
        position: "Doctor",
        age: "30",
        type: "Interno",
        EventAttendees: { eventID: "e1" },
      },
      {
        id: "at2",
        position: "Doctor",
        age: "45",
        type: "Externo",
        EventAttendees: { eventID: "e1" },
      },
    ],
  });
}

const adminPerms = {
  loading: false,
  isAdmin: true,
  isReportesOnly: false,
  eventIDsAllowed: null,
  canSeeCampus: () => true,
  canSeeArea: () => true,
  canSeeEvent: () => true,
};

const renderReportes = () =>
  render(
    <MemoryRouter>
      <Reportes />
    </MemoryRouter>
  );

// El label de métrica y su valor son <p> hermanos dentro de la Card.
const metricValue = (label) =>
  screen.getByText(label).nextElementSibling.textContent;

beforeAll(() => {
  // jsdom no implementa scrollIntoView (usado al abrir el detalle).
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  // resetMocks:true (CRA) borra las implementaciones: reponerlas aquí.
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observeImpl);
  XLSX.utils.json_to_sheet.mockReturnValue({});
  XLSX.utils.book_new.mockReturnValue({});
  localStorage.clear();
  seedFixtures();
  mockUsePermissions.mockReturnValue(adminPerms);
});

/* ── Permisos y guardas ────────────────────────────────────────────────── */

describe("Reportes — permisos", () => {
  test("redirige a /page/campus cuando el usuario no tiene ningún permiso", async () => {
    mockUsePermissions.mockReturnValue({
      ...adminPerms,
      isAdmin: false,
      isReportesOnly: false,
    });
    renderReportes();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/page/campus")
    );
  });

  test("mientras los permisos cargan no consulta campus ni redirige", () => {
    mockUsePermissions.mockReturnValue({ ...adminPerms, loading: true });
    renderReportes();
    expect(DataStore.observeQuery).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    // shell del resumen sin datos
    expect(
      screen.getByText("No hay eventos para los filtros actuales.")
    ).toBeInTheDocument();
  });

  test("usuario legacy con subárea (sin rol) NO es redirigido y ve la grilla", async () => {
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ id: "s1" }));
    mockUsePermissions.mockReturnValue({
      ...adminPerms,
      isAdmin: false,
      isReportesOnly: false,
    });
    renderReportes();
    expect(await screen.findByText("Congreso Cardio")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("usuario Reportes solo ve sus eventos permitidos y sus métricas", async () => {
    mockUsePermissions.mockReturnValue({
      ...adminPerms,
      isAdmin: false,
      isReportesOnly: true,
      eventIDsAllowed: ["e1"],
      canSeeEvent: (id) => id === "e1",
    });
    renderReportes();
    expect(await screen.findByText("Congreso Cardio")).toBeInTheDocument();
    expect(screen.queryByText("Feria Salud")).not.toBeInTheDocument();
    expect(screen.queryByText("Taller Nutrición")).not.toBeInTheDocument();
    expect(screen.getByText(/1 en Campus Quito/)).toBeInTheDocument();
    await waitFor(() => expect(metricValue("Total Registros")).toBe("2"));
    expect(metricValue("Total Check-in")).toBe("1");
  });
});

/* ── Modo resumen ──────────────────────────────────────────────────────── */

describe("Reportes — modo resumen (grilla)", () => {
  test("muestra métricas agregadas, chip de campus, estados y tarjetas", async () => {
    renderReportes();

    // Tarjetas de los 3 eventos
    expect(await screen.findByText("Congreso Cardio")).toBeInTheDocument();
    expect(screen.getByText("Feria Salud")).toBeInTheDocument();
    expect(screen.getByText("Taller Nutrición")).toBeInTheDocument();

    // Chip del filtro principal (campus)
    expect(screen.getByText("Campus Quito")).toBeInTheDocument();
    expect(screen.getByText(/3 en Campus Quito/)).toBeInTheDocument();

    // Métricas agregadas: 3 registros, 1 check-in, 33%
    await waitFor(() => expect(metricValue("Total Registros")).toBe("3"));
    expect(metricValue("Total Check-in")).toBe("1");
    expect(metricValue("Tasa de check-in")).toBe("33%");

    // Estados derivados: pasado / landing activa / próximo
    expect(await screen.findByText("Pasado")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Próximo")).toBeInTheDocument();

    // Conteos por tarjeta + breadcrumb
    const card = screen
      .getByText("Congreso Cardio")
      .closest("[role='button']");
    expect(within(card).getByText("2")).toBeInTheDocument(); // registros
    expect(within(card).getByText("registros")).toBeInTheDocument();
    expect(within(card).getByText("50%")).toBeInTheDocument(); // donut 1/2
    expect(
      within(card).getByText("Campus Quito · Área Médica · Subárea Cardio")
    ).toBeInTheDocument();

    // Sin evento seleccionado NO existe el botón de exportar evento actual
    expect(
      screen.queryByText("Exportar evento actual")
    ).not.toBeInTheDocument();
  });

  test("la búsqueda filtra por título y muestra el estado vacío", async () => {
    renderReportes();
    await screen.findByText("Congreso Cardio");

    const input = screen.getByPlaceholderText("Buscar evento por nombre…");
    fireEvent.change(input, { target: { value: "feria" } });
    expect(screen.getByText("Feria Salud")).toBeInTheDocument();
    expect(screen.queryByText("Congreso Cardio")).not.toBeInTheDocument();
    expect(screen.getByText(/1 en Campus Quito/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(
      screen.getByText("No hay eventos para los filtros actuales.")
    ).toBeInTheDocument();
  });

  test("filtros de Área/Subárea crean chips removibles y el select de Eventos abre el detalle", async () => {
    renderReportes();
    await screen.findByText("Congreso Cardio");

    // Abrir panel de filtros
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(screen.getByText("Fecha inicio")).toBeInTheDocument();

    // [Campus, Área, Subárea, Eventos]
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(4);
    expect(selects[0]).toHaveValue("c1");

    // Seleccionar Área → chip con botón para quitarla
    fireEvent.change(selects[1], { target: { value: "a1" } });
    expect(selects[1]).toHaveValue("a1");
    expect(
      await screen.findByLabelText("Quitar filtro de área")
    ).toBeInTheDocument();

    // Seleccionar Subárea → chip propio
    await waitFor(() =>
      expect(within(selects[2]).getByText("Subárea Cardio")).toBeInTheDocument()
    );
    fireEvent.change(selects[2], { target: { value: "s1" } });
    expect(
      await screen.findByLabelText("Quitar filtro de subárea")
    ).toBeInTheDocument();
    // La grilla sigue mostrando los eventos de esa subárea
    expect(screen.getByText("Congreso Cardio")).toBeInTheDocument();

    // Quitar chips
    fireEvent.click(screen.getByLabelText("Quitar filtro de subárea"));
    expect(
      screen.queryByLabelText("Quitar filtro de subárea")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Quitar filtro de área"));
    expect(
      screen.queryByLabelText("Quitar filtro de área")
    ).not.toBeInTheDocument();

    // Elegir un evento en el select de Eventos → modo detalle
    await waitFor(() =>
      expect(within(selects[3]).getByText("Congreso Cardio")).toBeInTheDocument()
    );
    fireEvent.change(selects[3], { target: { value: "e1" } });
    expect(await screen.findByText("Reporte del evento")).toBeInTheDocument();
  });

  test("el filtro de fechas excluye eventos fuera de rango y su chip lo restablece", async () => {
    renderReportes();
    await screen.findByText("Congreso Cardio");

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);

    fireEvent.change(dateInputs[0], { target: { value: "2050-01-01" } });

    await waitFor(() =>
      expect(screen.queryByText("Congreso Cardio")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Feria Salud")).toBeInTheDocument();
    expect(screen.getByText("Taller Nutrición")).toBeInTheDocument();
    expect(screen.getByText(/2 en Campus Quito/)).toBeInTheDocument();
    expect(screen.getByText(/2050-01-01/)).toBeInTheDocument();

    // Quitar el chip de fechas → vuelve el evento pasado
    fireEvent.click(screen.getByLabelText("Quitar filtro de fechas"));
    expect(await screen.findByText("Congreso Cardio")).toBeInTheDocument();
  });
});

/* ── Modo detalle ──────────────────────────────────────────────────────── */

describe("Reportes — modo detalle de evento", () => {
  test("muestra métricas propias, charts y distribuciones; cert_enviar sin mapeo no revienta", async () => {
    renderReportes();
    fireEvent.click(await screen.findByText("Congreso Cardio"));

    // Header y métricas del evento (2 registros, 1 check-in, 50%)
    expect(await screen.findByText("Reporte del evento")).toBeInTheDocument();
    await waitFor(() => expect(metricValue("Registros")).toBe("2"));
    expect(metricValue("Check-in")).toBe("1");
    expect(metricValue("Tasa de check-in")).toBe("50%");

    // groupEventData: SOLO los 2 charts mapeados (pie color / bar edad);
    // cert_enviar (className sin -chart) no genera chart NI crashea la vista.
    const charts = await screen.findAllByTestId("echart");
    expect(charts).toHaveLength(2);
    expect(screen.getByText("Color favorito")).toBeInTheDocument();
    expect(screen.getByText("Edad")).toBeInTheDocument();

    // cert_enviar aparece como distribución derivada (OptionBars):
    // Sí=1 (50%), Tal vez=1 (valor fuera del catálogo) y No=0.
    expect(screen.getByText("¿Enviar certificado?")).toBeInTheDocument();
    expect(screen.getByText("Lista desplegable")).toBeInTheDocument();
    expect(screen.getByText("Tal vez")).toBeInTheDocument();
    // "No" (cert) y "Arte" (intereses) sin votos
    expect(screen.getAllByText("0 · 0%")).toHaveLength(2);
    expect(screen.getAllByText("1 · 50%").length).toBeGreaterThanOrEqual(2);

    // Pregunta numérica sin chart → Promedio / Mín / Máx
    expect(screen.getByText("Acompañantes")).toBeInTheDocument();
    expect(screen.getByText("Promedio").nextElementSibling).toHaveTextContent(
      "3"
    );
    expect(screen.getByText("Mín").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Máx").nextElementSibling).toHaveTextContent("4");

    // checkbox-group → chip de tipo + barra con 100% para "Deporte"
    expect(screen.getByText("Intereses")).toBeInTheDocument();
    expect(screen.getByText("Selección múltiple")).toBeInTheDocument();
    expect(screen.getByText("2 · 100%")).toBeInTheDocument();

    // Volver al resumen
    fireEvent.click(screen.getByRole("button", { name: /Volver a eventos/ }));
    expect(await screen.findByText("Total Registros")).toBeInTheDocument();
    expect(screen.getByText("Feria Salud")).toBeInTheDocument();
  });

  test("evento sin preguntas graficables muestra el estado vacío del detalle", async () => {
    renderReportes();
    fireEvent.click(await screen.findByText("Feria Salud"));

    expect(
      await screen.findByText(/no tiene preguntas de opción múltiple/)
    ).toBeInTheDocument();
    await waitFor(() => expect(metricValue("Registros")).toBe("1"));
    expect(metricValue("Check-in")).toBe("0");
  });

  test("muestra el estado de carga mientras llegan los asistentes", async () => {
    // EventAttendee nunca resuelve → attendees queda null (cargando)
    DataStore.query.mockImplementation((Model, pred) => {
      if (Model?.name === "EventAttendee") return new Promise(() => {});
      return DataStore.__impls.queryImpl(Model, pred);
    });
    renderReportes();
    fireEvent.click(await screen.findByText("Congreso Cardio"));
    expect(
      await screen.findByText("Cargando datos del evento…")
    ).toBeInTheDocument();
  });
});

/* ── Exportación a Excel ───────────────────────────────────────────────── */

describe("Reportes — exportación a Excel", () => {
  test("'Exportar base completa' aplana todos los registros y escribe el archivo", async () => {
    renderReportes();
    await screen.findByText("Congreso Cardio");

    fireEvent.click(
      screen.getByRole("button", { name: /base completa/i })
    );

    await waitFor(() =>
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        "eventflow_all_event_attendees.xlsx"
      )
    );
    const rows = XLSX.utils.json_to_sheet.mock.calls[0][0];
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      EventTitle: "Congreso Cardio",
      Email: "ana@x.com",
      CheckIn: true,
      Nombre: "Ana",
    });
    expect(rows[2]).toMatchObject({
      EventTitle: "Feria Salud",
      Email: "eva@x.com",
      CheckIn: false,
    });
  });

  test("'Exportar este evento' usa el título del evento y cruza el check-in por email", async () => {
    renderReportes();
    fireEvent.click(await screen.findByText("Congreso Cardio"));
    await screen.findByText("Color favorito"); // asistentes ya cargados

    fireEvent.click(
      screen.getByRole("button", { name: "Exportar este evento" })
    );

    await waitFor(() =>
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        "Congreso Cardio.xlsx"
      )
    );
    expect(XLSX.utils.json_to_sheet).toHaveBeenLastCalledWith([
      expect.objectContaining({
        Nombre: "Ana",
        Email: "ana@x.com",
        CheckIn: true,
      }),
      expect.objectContaining({
        Nombre: "Luis",
        Email: "luis@x.com",
        CheckIn: false,
      }),
    ]);
  });

  test("exportar un evento sin registros alerta y NO escribe archivo", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    renderReportes();
    fireEvent.click(await screen.findByText("Taller Nutrición"));
    await screen.findByText(/no tiene preguntas de opción múltiple/);

    fireEvent.click(
      screen.getByRole("button", { name: "Exportar este evento" })
    );

    expect(alertSpy).toHaveBeenCalledWith(
      "No hay datos para exportar en este evento."
    );
    expect(XLSX.writeFile).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
