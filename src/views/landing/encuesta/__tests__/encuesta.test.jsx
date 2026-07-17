/**
 * Tests de la encuesta pública (src/views/landing/encuesta/index.jsx).
 *
 * Mocks en frontera de módulo:
 *  - jquery / formBuilder (imports dinámicos): jq(el).formRender registra la
 *    definición renderizada; formRender("userData") devuelve las respuestas
 *    fixture.
 *  - aws-amplify/api: generateClient().graphql despacha por texto de query
 *    (listSurveys / getEvent / listSurveyResponses / createSurveyResponse).
 *  - scripts/translateFormData: traducción marcada con prefijo para verificar
 *    el re-render en EN y el restoreOriginalLabels del submit.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SurveyPublic from "views/landing/encuesta";

jest.mock("jquery", () => {
  const state = { userData: [], renderedConfigs: [] };
  const jq = (el) => ({
    empty: () => {
      if (el && typeof el.innerHTML === "string") el.innerHTML = "";
    },
    formRender: (arg) => {
      if (arg === "userData") return state.userData;
      state.renderedConfigs.push(arg);
      return undefined;
    },
  });
  jq.__state = state;
  return { __esModule: true, default: jq };
});
jest.mock("jquery-ui-sortable", () => ({}));
jest.mock("formBuilder", () => ({}));
jest.mock("formBuilder/dist/form-render.min.js", () => ({}));

const mockGraphql = jest.fn();
jest.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    graphql: (...args) => mockGraphql(...args),
    cancel: jest.fn(),
  }),
}));

jest.mock("scripts/translateFormData", () => ({
  translateFormData: jest.fn(),
  restoreOriginalLabels: jest.fn(),
}));

const jqState = require("jquery").default.__state;
const {
  translateFormData,
  restoreOriginalLabels,
} = require("scripts/translateFormData");

const questionsFixture = () => [
  { type: "text", name: "q1", label: "¿Qué te pareció el evento?" },
  { type: "select", name: "q2", label: "¿Volverías?" },
];

// Survey.questions llega como AWSJSON doble-codificado con elementos string:
// exercita el normalizeQuestions tolerante.
const surveyItemFixture = () => ({
  id: "s-1",
  questions: JSON.stringify(
    JSON.stringify(questionsFixture().map((q) => JSON.stringify(q)))
  ),
});

const answersFixture = () => [
  { name: "q1", label: "¿Qué te pareció el evento?", userData: ["Excelente"] },
  { name: "q2", label: "¿Volverías?", userData: ["Sí"] },
];

// Despachador GraphQL configurable por test.
const primeGraphql = ({
  surveys = [surveyItemFixture()],
  eventTitle = "Congreso EventFlow",
  prevResponses = [],
  createImpl,
} = {}) => {
  mockGraphql.mockImplementation(async ({ query, variables }) => {
    if (query.includes("listSurveys")) {
      return { data: { listSurveys: { items: surveys } } };
    }
    if (query.includes("listSurveyResponses")) {
      return { data: { listSurveyResponses: { items: prevResponses } } };
    }
    if (query.includes("createSurveyResponse")) {
      if (createImpl) return createImpl(variables);
      return { data: { createSurveyResponse: { id: "sr-1" } } };
    }
    if (query.includes("getEvent")) {
      return { data: { getEvent: { id: "ev-1", title: eventTitle } } };
    }
    return { data: {} };
  });
};

const renderSurvey = (route = "/landing/ev-1/encuesta?a=tok-9") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/landing/:id/encuesta" element={<SurveyPublic />} />
      </Routes>
    </MemoryRouter>
  );

// Espera al formulario listo (botón de envío ES visible).
const waitForReady = async () => await screen.findByText("Enviar respuesta");

beforeEach(() => {
  localStorage.clear();
  jqState.userData = [];
  jqState.renderedConfigs.length = 0;
  translateFormData.mockImplementation(async (data) =>
    data.map((q) => ({ ...q, label: `EN:${q.label}` }))
  );
  restoreOriginalLabels.mockImplementation((captured) => captured);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

describe("Encuesta pública: estados de carga", () => {
  test("renderiza título del evento, subtítulo y el formulario normalizado; consulta previas por token", async () => {
    primeGraphql();
    renderSurvey();

    // Loading primero.
    expect(screen.getByText("Cargando encuesta…")).toBeInTheDocument();

    await waitForReady();
    expect(screen.getByText("Congreso EventFlow")).toBeInTheDocument();
    expect(
      screen.getByText("Tu respuesta es anónima. Toma menos de 2 minutos.")
    ).toBeInTheDocument();

    // El formRender recibió las preguntas ya normalizadas (AWSJSON doble).
    await waitFor(() => expect(jqState.renderedConfigs.length).toBeGreaterThan(0));
    const cfg = jqState.renderedConfigs[jqState.renderedConfigs.length - 1];
    expect(cfg.dataType).toBe("json");
    expect(cfg.formData.map((q) => q.name)).toEqual(["q1", "q2"]);

    // De-duplicación: se consultaron respuestas previas con el token de ?a=.
    const prevCall = mockGraphql.mock.calls.find(([arg]) =>
      arg.query.includes("listSurveyResponses")
    );
    expect(prevCall[0].variables.filter).toEqual({
      surveyID: { eq: "s-1" },
      token: { eq: "tok-9" },
    });
    // En ES no se dispara traducción.
    expect(translateFormData).not.toHaveBeenCalled();
  });

  test("sin token (?a=) no consulta respuestas previas", async () => {
    primeGraphql();
    renderSurvey("/landing/ev-1/encuesta");
    await waitForReady();
    expect(
      mockGraphql.mock.calls.some(([arg]) =>
        arg.query.includes("listSurveyResponses")
      )
    ).toBe(false);
  });

  test("muestra 'Encuesta no disponible' cuando el evento no tiene encuesta", async () => {
    primeGraphql({ surveys: [] });
    renderSurvey();
    expect(
      await screen.findByText("Encuesta no disponible")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Este evento aún no tiene una encuesta publicada.")
    ).toBeInTheDocument();
  });

  test("questions corruptas (no JSON) también caen en 'Encuesta no disponible' y se registra el error", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    primeGraphql({ surveys: [{ id: "s-1", questions: "esto-no-es-json" }] });
    renderSurvey();
    expect(
      await screen.findByText("Encuesta no disponible")
    ).toBeInTheDocument();
    // El parse tolerante no es silencioso: deja rastro en consola.
    expect(errorSpy).toHaveBeenCalledWith(
      "survey questions parse:",
      expect.any(Error)
    );
  });

  test("si getEvent falla, la encuesta carga igual con el título de respaldo", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    primeGraphql();
    mockGraphql.mockImplementation(async ({ query }) => {
      if (query.includes("listSurveys")) {
        return { data: { listSurveys: { items: [surveyItemFixture()] } } };
      }
      if (query.includes("listSurveyResponses")) {
        return { data: { listSurveyResponses: { items: [] } } };
      }
      if (query.includes("getEvent")) {
        throw new Error("getEvent down");
      }
      return { data: {} };
    });
    renderSurvey();
    await waitForReady();
    // El título es cosmético: cae al fallback sin bloquear el formulario.
    expect(screen.getByText("Encuesta del evento")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "survey event title:",
      expect.any(Error)
    );
  });

  test("muestra '¡Ya respondiste!' cuando el token ya tiene una respuesta", async () => {
    primeGraphql({ prevResponses: [{ id: "resp-1" }] });
    renderSurvey();
    expect(await screen.findByText("¡Ya respondiste! 🎉")).toBeInTheDocument();
    expect(screen.queryByText("Enviar respuesta")).not.toBeInTheDocument();
  });

  test("muestra el estado de error cuando la carga de la encuesta falla", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockGraphql.mockImplementation(async () => {
      throw new Error("AppSync down");
    });
    renderSurvey();
    expect(await screen.findByText("Ups…")).toBeInTheDocument();
    expect(
      screen.getByText("No pudimos cargar la encuesta. Vuelve a intentar más tarde.")
    ).toBeInTheDocument();
  });
});

describe("Encuesta pública: envío de respuestas", () => {
  test("submit feliz: guarda SurveyResponse con surveyID, eventID, token y answers", async () => {
    primeGraphql();
    renderSurvey();
    await waitForReady();

    jqState.userData = answersFixture();
    fireEvent.click(screen.getByText("Enviar respuesta"));

    expect(
      await screen.findByText("¡Gracias por tu opinión! 🙌")
    ).toBeInTheDocument();

    const createCall = mockGraphql.mock.calls.find(([arg]) =>
      arg.query.includes("createSurveyResponse")
    );
    expect(createCall[0].variables.input).toEqual({
      surveyID: "s-1",
      eventID: "ev-1",
      token: "tok-9",
      answers: JSON.stringify(answersFixture()),
    });
    // En ES no se restauran labels (el form ya está en español).
    expect(restoreOriginalLabels).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test("bloquea el envío sin ninguna respuesta con la alerta correspondiente", async () => {
    primeGraphql();
    renderSurvey();
    await waitForReady();

    jqState.userData = [{ name: "q1", label: "¿Qué te pareció el evento?", userData: ["  "] }];
    fireEvent.click(screen.getByText("Enviar respuesta"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Por favor responde al menos una pregunta."
      )
    );
    // Sigue en el formulario, sin mutación.
    expect(screen.getByText("Enviar respuesta")).toBeInTheDocument();
    expect(
      mockGraphql.mock.calls.some(([arg]) =>
        arg.query.includes("createSurveyResponse")
      )
    ).toBe(false);
  });

  test("si la mutación falla alerta y re-habilita el botón", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    primeGraphql({
      createImpl: () => {
        throw new Error("mutation failed");
      },
    });
    renderSurvey();
    await waitForReady();

    jqState.userData = answersFixture();
    fireEvent.click(screen.getByText("Enviar respuesta"));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "No se pudo enviar tu respuesta. Intenta de nuevo."
      )
    );
    const button = screen.getByText("Enviar respuesta").closest("button");
    expect(button).not.toBeDisabled();
  });
});

describe("Encuesta pública: idioma ES/EN", () => {
  test("el toggle EN persiste en localStorage, traduce el formulario y restaura labels al enviar", async () => {
    primeGraphql();
    renderSurvey();
    await waitForReady();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    // UI en inglés + persistencia de la elección.
    expect(await screen.findByText("Submit response")).toBeInTheDocument();
    expect(localStorage.getItem("landingLang")).toBe("EN");
    expect(
      screen.getByText("Your answer is anonymous. It takes less than 2 minutes.")
    ).toBeInTheDocument();

    // Se tradujo la definición y el formRender pintó la copia traducida.
    expect(translateFormData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "q1" })]),
      "en"
    );
    await waitFor(() => {
      const cfg = jqState.renderedConfigs[jqState.renderedConfigs.length - 1];
      expect(cfg.formData[0].label).toBe("EN:¿Qué te pareció el evento?");
    });

    // Submit en EN: las respuestas pasan por restoreOriginalLabels con la
    // definición ORIGINAL (labels en español).
    jqState.userData = answersFixture();
    fireEvent.click(screen.getByText("Submit response"));

    expect(await screen.findByText("Thanks for your feedback! 🙌")).toBeInTheDocument();
    expect(restoreOriginalLabels).toHaveBeenCalledWith(
      answersFixture(),
      expect.arrayContaining([
        expect.objectContaining({ label: "¿Qué te pareció el evento?" }),
      ])
    );

    // Volver a ES restaura la UI en español.
    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    expect(localStorage.getItem("landingLang")).toBe("ES");
  });

  test("arranca en EN cuando localStorage ya tiene la preferencia guardada", async () => {
    localStorage.setItem("landingLang", "EN");
    primeGraphql();
    renderSurvey();
    expect(await screen.findByText("Submit response")).toBeInTheDocument();
    expect(
      screen.getByText("Your answer is anonymous. It takes less than 2 minutes.")
    ).toBeInTheDocument();
  });
});
