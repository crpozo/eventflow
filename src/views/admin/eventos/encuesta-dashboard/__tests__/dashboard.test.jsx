/* Tests del dashboard de resultados de encuesta
 * (src/views/admin/eventos/encuesta-dashboard/index.jsx).
 *
 * Cubre: loader y redirect, métricas (respuestas / check-ins / tasa capada a
 * 100%), QuestionBody por tipo (radio con values→labels y valores fuera de
 * catálogo, date ordenado, number con stats, texto con muestras), fallback de
 * preguntas derivadas de las respuestas, tabla de detalle, Analizar con IA
 * (post + render de insights y por-pregunta, errores y sin respuestas),
 * insights precargados por GraphQL (AWSJSON doble-encodeado), descarga del
 * PDF (import dinámico mockeado) y exportación a Excel (XLSX mockeado).
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => ({
  Survey: { name: "Survey" },
  SurveyResponse: { name: "SurveyResponse" },
  EventAttendee: { name: "EventAttendee" },
}));

jest.mock("aws-amplify/datastore", () => {
  const state = { fixtures: {}, surveyItems: [] };
  const impls = {
    query: async (Model) => state.fixtures[Model?.name] || [],
    observe: () => ({
      subscribe: (cb) => {
        cb({ items: state.surveyItems, isSynced: true });
        return { unsubscribe: () => {} };
      },
    }),
  };
  return {
    DataStore: {
      __state: state,
      __impls: impls,
      query: jest.fn(impls.query),
      observeQuery: jest.fn(impls.observe),
    },
  };
});

jest.mock("aws-amplify/api", () => {
  const graphql = jest.fn();
  const post = jest.fn();
  return {
    __mocks: { graphql, post },
    generateClient: () => ({ graphql }),
    post,
  };
});

jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Import dinámico del generador de PDF (@react-pdf se carga bajo demanda).
jest.mock("../AnalysisPdf", () => ({ downloadAnalysisPdf: jest.fn() }));

const { DataStore } = require("aws-amplify/datastore");
const api = require("aws-amplify/api");
const XLSX = require("xlsx");
const { downloadAnalysisPdf } = require("../AnalysisPdf");
const Dashboard = require("views/admin/eventos/encuesta-dashboard").default;

/* ── Fixtures ──────────────────────────────────────────────────────────── */

// Survey.questions: shape real de formBuilder; el label del radio trae HTML
// para cubrir stripHtml.
const QUESTIONS = [
  { type: "header", label: "Bienvenido", name: "h-1" },
  {
    type: "radio-group",
    label: "Satisfacción <b>general</b>",
    name: "sat",
    values: [
      { label: "Buena", value: "option-1" },
      { label: "Mala", value: "option-2" },
    ],
  },
  { type: "date", label: "Día de visita", name: "fecha" },
  { type: "number", label: "Calificación", name: "cal" },
  { type: "textarea", label: "Comentarios", name: "com" },
];

// userData SIEMPRE es array (shape real de las respuestas guardadas).
const RESPONSES = [
  {
    id: "r1",
    eventID: "ev-1",
    createdAt: "2026-07-03T12:00:00.000Z",
    answers: [
      {
        name: "sat",
        type: "radio-group",
        label: "Satisfacción general",
        userData: ["option-1"],
      },
      { name: "fecha", type: "date", label: "Día de visita", userData: ["2026-07-02"] },
      { name: "cal", type: "number", label: "Calificación", userData: ["8"] },
      {
        name: "com",
        type: "textarea",
        label: "Comentarios",
        userData: ["Todo excelente, gran evento"],
      },
    ],
  },
  {
    id: "r2",
    eventID: "ev-1",
    createdAt: "2026-07-03T13:00:00.000Z",
    answers: [
      // valor duplicado en el userData → debe contar UNA vez por respuesta
      { name: "sat", userData: ["option-1", "option-1"] },
      { name: "fecha", userData: ["2026-07-01"] },
      { name: "cal", userData: ["5"] },
      { name: "com", userData: ["Faltó comida"] },
    ],
  },
  {
    id: "r3",
    eventID: "ev-1",
    createdAt: "2026-07-03T14:00:00.000Z",
    answers: [
      { name: "sat", userData: ["otro-valor"] }, // fuera del catálogo de values
      { name: "cal", userData: ["   "] }, // solo espacios → no cuenta
      { name: "com", userData: [""] }, // vacía → no cuenta
    ],
  },
];

// 4 asistentes, 2 con check-in → 3 respuestas / 2 check-ins = 150% → capada a 100%
const ATTENDEES = [
  { id: "a1", eventID: "ev-1", checkIn: true },
  { id: "a2", eventID: "ev-1", checkIn: true },
  { id: "a3", eventID: "ev-1", checkIn: false },
  { id: "a4", eventID: "ev-1" },
];

const INSIGHTS = {
  executiveSummary: "Resumen ejecutivo del evento.",
  overallSentiment: { label: "Positivo", score: 72 },
  themes: [
    {
      title: "Comida",
      sentiment: "negativo",
      mentions: 2,
      summary: "Faltó variedad de comida",
      sampleQuotes: ["Más opciones vegetarianas"],
    },
  ],
  strengths: ["Organización impecable"],
  concerns: ["Catering insuficiente"],
  recommendations: ["Contratar más catering"],
  perQuestion: [
    { name: "com", insight: "Comentarios mayormente positivos", sentiment: "neutral" },
  ],
};

const postResponds = (data) =>
  api.__mocks.post.mockReturnValue({
    response: Promise.resolve({ body: { json: async () => data } }),
  });

const renderDash = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

// El label de métrica y su valor son <p> hermanos dentro de la Card.
const metricValue = (label) =>
  screen.getByText(label).nextElementSibling.textContent;

let alertSpy;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "EVENTFLOW.event",
    JSON.stringify({ id: "ev-1", title: "Evento Test" })
  );
  // resetMocks:true (CRA): reponer implementaciones y fixtures.
  DataStore.query.mockImplementation(DataStore.__impls.query);
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observe);
  DataStore.__state.fixtures = {
    SurveyResponse: RESPONSES,
    EventAttendee: ATTENDEES,
  };
  DataStore.__state.surveyItems = [
    { id: "sv-1", surveyEventId: "ev-1", questions: QUESTIONS },
  ];
  api.__mocks.graphql.mockResolvedValue({ data: { listSurveys: { items: [] } } });
  postResponds({});
  // resetMocks también borra las implementaciones del mock de xlsx
  XLSX.utils.json_to_sheet.mockImplementation(() => ({}));
  XLSX.utils.book_new.mockImplementation(() => ({}));
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
});

/* ── Carga y métricas ──────────────────────────────────────────────────── */

describe("Dashboard encuesta — carga, métricas y resultados por pregunta", () => {
  test("sin evento cacheado redirige a /admin", () => {
    localStorage.removeItem("EVENTFLOW.event");
    renderDash();
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("muestra el loader mientras cargan las respuestas", () => {
    DataStore.query.mockImplementation(() => new Promise(() => {}));
    renderDash();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(
      screen.queryByText("Resultados de la encuesta")
    ).not.toBeInTheDocument();
  });

  test("métricas con tasa capada a 100% y un card por pregunta con su mini-viz", async () => {
    renderDash();
    expect(
      await screen.findByText("Resultados de la encuesta")
    ).toBeInTheDocument();

    // Métricas: 3 respuestas / 2 check-ins → 150% se capa a 100%
    expect(metricValue("Respuestas")).toBe("3");
    expect(metricValue("Check-ins")).toBe("2");
    expect(metricValue("Tasa de respuesta")).toBe("100%");

    // El header/paragraph NO genera card; numeración desde la primera real,
    // con el HTML del label limpio (stripHtml).
    expect(screen.getByText("1. Satisfacción general")).toBeInTheDocument();
    expect(screen.getByText("Opción única")).toBeInTheDocument();
    expect(screen.getByText("3 respuestas")).toBeInTheDocument();
    // option-1 dos veces (el duplicado de r2 cuenta una), Mala cero,
    // "otro-valor" fuera de catálogo se agrega como fila extra cruda
    expect(screen.getByText("2 · 67%")).toBeInTheDocument();
    expect(screen.getByText("0 · 0%")).toBeInTheDocument();
    expect(screen.getByText("1 · 33%")).toBeInTheDocument();
    expect(screen.getAllByText("otro-valor").length).toBeGreaterThanOrEqual(1);

    // date: distribución ordenada ascendente (las 2 primeras coincidencias
    // son las barras; la tabla se renderiza después)
    expect(screen.getByText("2. Día de visita")).toBeInTheDocument();
    const fechas = screen
      .getAllByText(/^2026-07-0[12]$/)
      .map((el) => el.textContent);
    expect(fechas.slice(0, 2)).toEqual(["2026-07-01", "2026-07-02"]);
    expect(screen.getAllByText("1 · 50%")).toHaveLength(2);

    // number: promedio/mín/máx ("   " de r3 no cuenta)
    expect(screen.getByText("3. Calificación")).toBeInTheDocument();
    expect(screen.getByText("Promedio").nextElementSibling).toHaveTextContent(
      "6.5"
    );
    expect(screen.getByText("Mín").nextElementSibling).toHaveTextContent("5");
    expect(screen.getByText("Máx").nextElementSibling).toHaveTextContent("8");

    // texto largo: muestras en cursiva ("" de r3 no cuenta)
    expect(screen.getByText("4. Comentarios")).toBeInTheDocument();
    expect(screen.getByText("Texto largo")).toBeInTheDocument();
    expect(
      screen.getByText("“Todo excelente, gran evento”")
    ).toBeInTheDocument();
    expect(screen.getByText("“Faltó comida”")).toBeInTheDocument();

    // Sin insights: card de invitación a analizar
    expect(screen.getByText(/Aún no hay análisis de IA/)).toBeInTheDocument();

    // Tabla de detalle: valores crudos por columna y "—" para lo no contestado
    expect(screen.getByText("Satisfacción general")).toBeInTheDocument(); // th
    expect(screen.getByText("option-1, option-1")).toBeInTheDocument(); // r2
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1); // r3 fecha
  });

  test("stripHtml equivale al regex previo: tags anidados, '<' sin cierre y tag vacío", async () => {
    // Entradas representativas del comportamiento de .replace(/<[^>]*>/g, ""):
    // se elimina cada tramo "<...>" hasta el primer ">" y un "<" sin cierre
    // queda intacto (el escaneo lineal debe conservar exactamente eso).
    DataStore.__state.surveyItems = [
      {
        id: "sv-1",
        surveyEventId: "ev-1",
        questions: [
          { type: "text", label: "Nombre <b>del <i>invitado</i></b>", name: "p1" },
          { type: "text", label: "Rota <sin cierre", name: "p2" },
          { type: "text", label: "Mixta <a<b> rara", name: "p3" },
          { type: "text", label: "<>Vacía", name: "p4" },
          { type: "text", label: "Regla 5 > 3 estricta", name: "p5" },
          { type: "text", name: "p6" }, // sin label → cae al name
        ],
      },
    ];
    // Una respuesta sin answers cubre además la normalización a [] en los memos.
    DataStore.__state.fixtures = {
      SurveyResponse: [{ id: "rx", eventID: "ev-1", answers: null }],
      EventAttendee: [],
    };
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    expect(screen.getByText("1. Nombre del invitado")).toBeInTheDocument();
    expect(screen.getByText("2. Rota <sin cierre")).toBeInTheDocument();
    expect(screen.getByText("3. Mixta rara")).toBeInTheDocument();
    expect(screen.getByText("4. Vacía")).toBeInTheDocument();
    // ">" sin "<" previo no se toca (mismo accept/reject que el regex)
    expect(screen.getByText("5. Regla 5 > 3 estricta")).toBeInTheDocument();
    // sin label: stripHtml("") queda vacío y el card usa el name
    expect(screen.getByText("6. p6")).toBeInTheDocument();
    expect(metricValue("Respuestas")).toBe("1");
  });

  test("sin Survey canónica deriva las preguntas de las propias respuestas", async () => {
    DataStore.__state.surveyItems = [];
    renderDash();
    await screen.findByText("Resultados de la encuesta");
    // labels/types tomados de los answers de r1 (unión por name)
    expect(screen.getByText("1. Satisfacción general")).toBeInTheDocument();
    expect(screen.getByText("4. Comentarios")).toBeInTheDocument();
  });

  test("estado vacío: sin respuestas, tasa 0%, placeholders y export bloqueado", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    api.__mocks.graphql.mockRejectedValue(new Error("network")); // rama catch
    DataStore.__state.fixtures = {
      SurveyResponse: [],
      EventAttendee: ATTENDEES,
    };
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    expect(metricValue("Respuestas")).toBe("0");
    expect(metricValue("Tasa de respuesta")).toBe("0%");
    expect(screen.getByText("Todavía no hay respuestas.")).toBeInTheDocument();
    expect(
      screen.getByText("Sin valores numéricos todavía.")
    ).toBeInTheDocument(); // number
    expect(
      screen.getAllByText("Sin respuestas todavía.").length
    ).toBeGreaterThanOrEqual(1); // texto/date

    // exportar sin filas: alerta y NO escribe archivo
    fireEvent.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    expect(alertSpy).toHaveBeenCalledWith("No hay respuestas para exportar.");
    expect(XLSX.writeFile).not.toHaveBeenCalled();

    // analizar sin respuestas: alerta y NO postea
    fireEvent.click(screen.getByRole("button", { name: /Analizar con IA/ }));
    expect(alertSpy).toHaveBeenCalledWith(
      "Aún no hay respuestas para analizar."
    );
    expect(api.__mocks.post).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

/* ── Análisis con IA ───────────────────────────────────────────────────── */

describe("Dashboard encuesta — análisis con IA", () => {
  test("Analizar con IA postea al Lambda y renderiza los insights devueltos", async () => {
    postResponds({
      insights: JSON.stringify(INSIGHTS),
      insightsAt: "2026-07-15T10:00:00.000Z",
    });
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    fireEvent.click(screen.getByRole("button", { name: /Analizar con IA/ }));
    expect(
      await screen.findByText("Resumen ejecutivo del evento.")
    ).toBeInTheDocument();
    expect(api.__mocks.post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/survey-analyze",
      options: { body: { eventId: "ev-1" } },
    });

    // sentimiento, temas con chip y quotes, fortalezas/preocupaciones/recomendaciones
    expect(screen.getByText("Positivo (72/100)")).toBeInTheDocument();
    expect(screen.getByText("Comida")).toBeInTheDocument();
    expect(screen.getByText("negativo · 2")).toBeInTheDocument();
    expect(screen.getByText("“Más opciones vegetarianas”")).toBeInTheDocument();
    expect(screen.getByText("Organización impecable")).toBeInTheDocument();
    expect(screen.getByText("Catering insuficiente")).toBeInTheDocument();
    expect(screen.getByText("Contratar más catering")).toBeInTheDocument();

    // insight por pregunta anclado por name en el card de Comentarios
    expect(
      screen.getByText("Comentarios mayormente positivos")
    ).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();

    // el botón pasa a re-analizar
    expect(
      screen.getByRole("button", { name: /Re-analizar con IA/ })
    ).toBeInTheDocument();
  });

  test("un error del Lambda alerta con HTTP y detalle", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    api.__mocks.post.mockImplementation(() => {
      const err = new Error("boom");
      err.response = {
        statusCode: 502,
        body: JSON.stringify({ error: "Bedrock timeout" }),
      };
      throw err;
    });
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    fireEvent.click(screen.getByRole("button", { name: /Analizar con IA/ }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo analizar (HTTP 502): Bedrock timeout"
      )
    );
    errSpy.mockRestore();
  });

  test("un error sin status ni body parseable alerta el mensaje genérico", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    api.__mocks.post.mockImplementation(() => {
      const err = new Error("boom");
      err.response = { body: "esto no es JSON {" }; // sin statusCode
      throw err;
    });
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    fireEvent.click(screen.getByRole("button", { name: /Analizar con IA/ }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("No se pudo analizar")
    );
    errSpy.mockRestore();
  });

  test("listas con textos duplicados se renderizan completas (claves estables)", async () => {
    postResponds({
      insights: JSON.stringify({
        ...INSIGHTS,
        overallSentiment: { label: "Mixto", score: 50 },
        strengths: ["Networking", "Networking"],
        themes: [
          {
            title: "Comida",
            sentiment: "positivo",
            sampleQuotes: ["igual", "igual"],
          },
          { title: "Comida", sentiment: "negativo" },
          { summary: "Tema sin título ni sentimiento" },
        ],
      }),
      insightsAt: "2026-07-15T10:00:00.000Z",
    });
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    fireEvent.click(screen.getByRole("button", { name: /Analizar con IA/ }));
    expect(
      await screen.findByText("Resumen ejecutivo del evento.")
    ).toBeInTheDocument();

    // Duplicados: cada elemento se pinta igual (clave = contenido numerado)
    expect(screen.getAllByText("Networking")).toHaveLength(2);
    expect(screen.getAllByText("Comida")).toHaveLength(2);
    expect(screen.getAllByText("“igual”")).toHaveLength(2);
    // El tema sin título/sentimiento también se renderiza
    expect(screen.getByText("Tema sin título ni sentimiento")).toBeInTheDocument();

    // Score 50 → termómetro ámbar al 50%
    const track = screen.getByText("Mixto (50/100)").previousElementSibling;
    expect(track.firstElementChild).toHaveStyle({
      width: "50%",
      background: "#f59e0b",
    });
  });

  test("con score bajo el termómetro de sentimiento se pinta rojo", async () => {
    api.__mocks.graphql.mockResolvedValue({
      data: {
        listSurveys: {
          items: [
            {
              id: "sv-1",
              insights: JSON.stringify({
                overallSentiment: { label: "Negativo", score: 12 },
              }),
              insightsAt: "2026-07-14T09:00:00.000Z",
              questions: JSON.stringify(QUESTIONS),
            },
          ],
        },
      },
    });
    renderDash();
    const label = await screen.findByText("Negativo (12/100)");
    const track = label.previousElementSibling;
    expect(track.firstElementChild).toHaveStyle({
      width: "12%",
      background: "#e41b23",
    });
  });

  test("insights precargados por GraphQL (AWSJSON doble-encodeado) + hint sin perQuestion + PDF", async () => {
    const sinPQ = { ...INSIGHTS };
    delete sinPQ.perQuestion;
    api.__mocks.graphql.mockResolvedValue({
      data: {
        listSurveys: {
          items: [
            {
              id: "sv-1",
              // la Lambda vieja guardaba el objeto YA stringificado y AWSJSON
              // lo envuelve otra vez → doble encode
              insights: JSON.stringify(JSON.stringify(sinPQ)),
              insightsAt: "2026-07-14T09:00:00.000Z",
              // elementos string-encodeados (shape legado de questions)
              questions: JSON.stringify(QUESTIONS.map((q) => JSON.stringify(q))),
            },
          ],
        },
      },
    });
    renderDash();
    expect(
      await screen.findByText("Resumen ejecutivo del evento.")
    ).toBeInTheDocument();
    // las preguntas canónicas llegaron del GraphQL string-encodeado
    expect(screen.getByText("1. Satisfacción general")).toBeInTheDocument();
    // análisis viejo sin perQuestion → hint de re-analizar
    expect(
      screen.getByText(/Re-analiza con IA para obtener el resumen por pregunta/)
    ).toBeInTheDocument();

    // descarga del PDF con métricas y los insights parseados
    fireEvent.click(screen.getByRole("button", { name: /Descargar PDF/ }));
    await waitFor(() => expect(downloadAnalysisPdf).toHaveBeenCalledTimes(1));
    expect(downloadAnalysisPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        eventTitle: "Evento Test",
        insightsAt: "2026-07-14T09:00:00.000Z",
        insights: expect.objectContaining({
          executiveSummary: "Resumen ejecutivo del evento.",
        }),
        metrics: { responses: 3, checkedIn: 2, responseRate: 100 },
      })
    );
  });

  test("si el PDF falla alerta sin romper la vista", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    downloadAnalysisPdf.mockRejectedValue(new Error("pdf error"));
    api.__mocks.graphql.mockResolvedValue({
      data: {
        listSurveys: {
          items: [
            {
              id: "sv-1",
              insights: JSON.stringify(INSIGHTS),
              insightsAt: "2026-07-14T09:00:00.000Z",
              questions: JSON.stringify(QUESTIONS),
            },
          ],
        },
      },
    });
    renderDash();
    await screen.findByText("Resumen ejecutivo del evento.");

    fireEvent.click(screen.getByRole("button", { name: /Descargar PDF/ }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo generar el PDF del análisis."
      )
    );
    expect(screen.getByText("Resumen ejecutivo del evento.")).toBeInTheDocument();
    errSpy.mockRestore();
  });
});

/* ── Exportación a Excel ───────────────────────────────────────────────── */

describe("Dashboard encuesta — exportar Excel", () => {
  test("aplana las respuestas por columna (labels limpios) y escribe el archivo", async () => {
    renderDash();
    await screen.findByText("Resultados de la encuesta");

    fireEvent.click(screen.getByRole("button", { name: /Exportar Excel/ }));

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    const data = XLSX.utils.json_to_sheet.mock.calls[0][0];
    expect(data).toHaveLength(3);
    expect(data[0]).toMatchObject({
      "#": 1,
      "Satisfacción general": "option-1",
      "Día de visita": "2026-07-02",
      Calificación: "8",
      Comentarios: "Todo excelente, gran evento",
    });
    expect(data[0]).toHaveProperty("Fecha");
    expect(data[2]["Día de visita"]).toBe(""); // r3 no contestó la fecha
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Respuestas"
    );
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "Evento Test-encuesta.xlsx"
    );
  });
});
