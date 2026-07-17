import React from "react";
import { render, screen } from "@testing-library/react";
import { pdf } from "@react-pdf/renderer";
import { AnalysisPdfDoc, downloadAnalysisPdf } from "../AnalysisPdf";

// @react-pdf/renderer no funciona en jsdom: lo reemplazamos por componentes
// fake que renderizan DOM normal y exponen los estilos relevantes (color,
// backgroundColor, width) como data-attributes para poder afirmarlos.
jest.mock("@react-pdf/renderer", () => {
  const ReactLib = require("react");
  const flatten = (s) =>
    Array.isArray(s) ? Object.assign({}, ...s.map(flatten)) : s || {};
  const styleAttrs = (style) => {
    const f = flatten(style);
    const attrs = {};
    if (f.color) attrs["data-color"] = f.color;
    if (f.backgroundColor) attrs["data-bg"] = f.backgroundColor;
    if (f.width != null) attrs["data-width"] = String(f.width);
    return attrs;
  };
  const Document = ({ children, title, author }) =>
    ReactLib.createElement(
      "div",
      { "data-testid": "pdf-document", "data-title": title, "data-author": author },
      children
    );
  const Page = ({ children, size }) =>
    ReactLib.createElement(
      "div",
      { "data-testid": "pdf-page", "data-size": size },
      children
    );
  const View = ({ children, style }) =>
    ReactLib.createElement("div", { "data-pdf": "view", ...styleAttrs(style) }, children);
  const Text = ({ children, style, render: renderProp }) =>
    ReactLib.createElement(
      "span",
      { "data-pdf": "text", ...styleAttrs(style) },
      renderProp ? renderProp({ pageNumber: 1, totalPages: 2 }) : children
    );
  return {
    Document,
    Page,
    View,
    Text,
    StyleSheet: { create: (x) => x },
    pdf: jest.fn(),
  };
});

const insightsFixture = {
  executiveSummary: "Los asistentes valoraron muy bien la organización general.",
  overallSentiment: { label: "Muy positivo", score: 92 },
  themes: [
    {
      title: "Logística",
      sentiment: "positivo",
      mentions: 12,
      summary: "El registro fue ágil y sin filas.",
      sampleQuotes: ["q1", "q2", "q3", "q4", "q5"],
    },
    {
      title: "Comida",
      sentiment: "negativo",
      sampleQuotes: ["faltó café"],
    },
    {
      // sin título ni mentions: cubre los fallbacks "—" y tag ámbar
      sentiment: "neutral",
    },
  ],
  strengths: ["Buen networking", "Puntualidad"],
  concerns: ["Poca señalización"],
  recommendations: ["Añadir más letreros", "Repetir el formato de charlas"],
};

const baseProps = {
  eventTitle: "Demo Summit",
  insights: insightsFixture,
  insightsAt: "2026-07-01T12:00:00Z",
  metrics: { responses: 120, checkedIn: 80, responseRate: 66 },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AnalysisPdfDoc", () => {
  test("arma el documento completo con el fixture de insights", () => {
    render(<AnalysisPdfDoc {...baseProps} />);

    // Título del documento y encabezado
    const doc = screen.getByTestId("pdf-document");
    expect(doc).toHaveAttribute("data-title", "Análisis con IA — Demo Summit");
    expect(doc).toHaveAttribute("data-author", "EventFlow");
    expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
    expect(screen.getByText("Análisis con IA")).toBeInTheDocument();
    const subtitle = screen.getByText(/Demo Summit/);
    expect(subtitle.textContent).toMatch(/Analizado el/);

    // Métricas
    expect(screen.getByText("Respuestas")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Check-ins")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Tasa de respuesta")).toBeInTheDocument();
    expect(screen.getByText("66%")).toBeInTheDocument();

    // Resumen ejecutivo
    expect(
      screen.getByText("Los asistentes valoraron muy bien la organización general.")
    ).toBeInTheDocument();

    // Sentimiento general: barra al 92% en verde y etiqueta con score
    expect(screen.getByText("Sentimiento general")).toBeInTheDocument();
    const fill = document.querySelector('[data-width="92%"]');
    expect(fill).not.toBeNull();
    expect(fill).toHaveAttribute("data-bg", "#16a34a");
    expect(screen.getByText(/Muy positivo \(92\/100\)/)).toBeInTheDocument();

    // Temas: título, tag con color por sentimiento y conteo de menciones
    expect(screen.getByText("Temas principales")).toBeInTheDocument();
    expect(screen.getByText("Logística")).toBeInTheDocument();
    const positiveTag = screen.getByText(/positivo · 12/);
    expect(positiveTag).toHaveAttribute("data-color", "#15803d");
    expect(screen.getByText("El registro fue ágil y sin filas.")).toBeInTheDocument();
    const negativeTag = screen.getByText("negativo");
    expect(negativeTag).toHaveAttribute("data-color", "#e41b23");
    const neutralTag = screen.getByText("neutral");
    expect(neutralTag).toHaveAttribute("data-color", "#b45309");
    expect(screen.getByText("—")).toBeInTheDocument(); // título fallback del tema sin title

    // Citas: clamp a 3 por tema
    expect(screen.getByText("“q1”")).toBeInTheDocument();
    expect(screen.getByText("“q2”")).toBeInTheDocument();
    expect(screen.getByText("“q3”")).toBeInTheDocument();
    expect(screen.queryByText("“q4”")).not.toBeInTheDocument();
    expect(screen.queryByText("“q5”")).not.toBeInTheDocument();
    expect(screen.getByText("“faltó café”")).toBeInTheDocument();

    // Fortalezas / preocupaciones con sus colores de título
    expect(screen.getByText("Fortalezas")).toHaveAttribute("data-color", "#15803d");
    expect(screen.getByText("Buen networking")).toBeInTheDocument();
    expect(screen.getByText("Puntualidad")).toBeInTheDocument();
    expect(screen.getByText("Preocupaciones")).toHaveAttribute("data-color", "#e41b23");
    expect(screen.getByText("Poca señalización")).toBeInTheDocument();

    // Recomendaciones
    expect(screen.getByText("Recomendaciones accionables")).toBeInTheDocument();
    expect(screen.getByText("Añadir más letreros")).toBeInTheDocument();
    expect(screen.getByText("Repetir el formato de charlas")).toBeInTheDocument();

    // Footer con paginación vía render-prop
    expect(screen.getByText("Generado con EventFlow")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
  });

  test("score 50 pinta la barra ámbar", () => {
    render(
      <AnalysisPdfDoc
        eventTitle="Demo Summit"
        insights={{ overallSentiment: { label: "Mixto", score: 50 } }}
      />
    );
    const fill = document.querySelector('[data-width="50%"]');
    expect(fill).not.toBeNull();
    expect(fill).toHaveAttribute("data-bg", "#f59e0b");
    expect(screen.getByText(/Mixto \(50\/100\)/)).toBeInTheDocument();
  });

  test("score 20 pinta la barra roja y clampa scores inválidos", () => {
    const { unmount } = render(
      <AnalysisPdfDoc
        eventTitle="Demo Summit"
        insights={{ overallSentiment: { label: "Negativo", score: 20 } }}
      />
    );
    const fill = document.querySelector('[data-width="20%"]');
    expect(fill).not.toBeNull();
    expect(fill).toHaveAttribute("data-bg", "#e41b23");
    unmount();

    // score no numérico cae a 0 (rojo) y >100 se clampa a 100 (verde)
    const { unmount: unmount2 } = render(
      <AnalysisPdfDoc insights={{ overallSentiment: { label: "Raro", score: "abc" } }} />
    );
    const zeroFill = document.querySelector('[data-width="0%"]');
    expect(zeroFill).toHaveAttribute("data-bg", "#e41b23");
    expect(screen.getByText(/Raro \(0\/100\)/)).toBeInTheDocument();
    unmount2();

    render(
      <AnalysisPdfDoc insights={{ overallSentiment: { label: "Top", score: 250 } }} />
    );
    const cappedFill = document.querySelector('[data-width="100%"]');
    expect(cappedFill).toHaveAttribute("data-bg", "#16a34a");
    expect(screen.getByText(/Top \(100\/100\)/)).toBeInTheDocument();
  });

  test("sin insights ni métricas muestra placeholders y omite secciones", () => {
    render(<AnalysisPdfDoc />);

    expect(screen.getByTestId("pdf-document")).toHaveAttribute(
      "data-title",
      "Análisis con IA — Encuesta"
    );
    // Subtítulo cae a "Encuesta" y sin fecha de análisis
    const subtitle = screen.getByText("Encuesta");
    expect(subtitle.textContent).not.toMatch(/Analizado el/);

    // Las tres métricas muestran el guion largo
    expect(screen.getAllByText("—")).toHaveLength(3);

    // Ninguna sección opcional se renderiza
    expect(screen.queryByText("Sentimiento general")).not.toBeInTheDocument();
    expect(screen.queryByText("Temas principales")).not.toBeInTheDocument();
    expect(screen.queryByText("Fortalezas")).not.toBeInTheDocument();
    expect(screen.queryByText("Preocupaciones")).not.toBeInTheDocument();
    expect(screen.queryByText("Recomendaciones accionables")).not.toBeInTheDocument();

    // El footer fijo sí está siempre
    expect(screen.getByText("Generado con EventFlow")).toBeInTheDocument();
  });

  test("bullets, temas y citas duplicados se renderizan completos (claves estables)", () => {
    render(
      <AnalysisPdfDoc
        eventTitle="Demo Summit"
        insights={{
          themes: [
            {
              title: "Comida",
              sentiment: "positivo",
              sampleQuotes: ["igual", "igual"],
            },
            { title: "Comida", sentiment: "negativo" },
            { summary: "Tema sin título ni sentimiento" },
          ],
          strengths: ["Networking", "Networking"],
        }}
      />
    );

    // Claves derivadas del contenido numerando duplicados: nada se pierde
    expect(screen.getAllByText("Networking")).toHaveLength(2);
    expect(screen.getAllByText("Comida")).toHaveLength(2);
    expect(screen.getAllByText("“igual”")).toHaveLength(2);
    // El tema sin título/sentimiento cae a "—" y tag ámbar vacío
    expect(screen.getByText("Tema sin título ni sentimiento")).toBeInTheDocument();
  });
});

describe("downloadAnalysisPdf", () => {
  let anchors;
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    // CRA usa resetMocks:true -> reinstalar implementación del mock de pdf()
    pdf.mockImplementation(() => ({
      toBlob: async () => new Blob(["pdf"], { type: "application/pdf" }),
    }));

    createObjectURL = jest.fn(() => "blob:mock-url");
    revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    anchors = [];
    const realCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag, ...rest) => {
      const el = realCreateElement(tag, ...rest);
      if (String(tag).toLowerCase() === "a") {
        jest.spyOn(el, "click").mockImplementation(() => {});
        anchors.push(el);
      }
      return el;
    });
  });

  test("genera el blob y dispara la descarga con el nombre del evento", async () => {
    const appendSpy = jest.spyOn(document.body, "appendChild");

    await downloadAnalysisPdf({
      eventTitle: "Demo Summit",
      insights: insightsFixture,
      metrics: { responses: 1 },
    });

    // pdf() recibe el documento con las props tal cual
    expect(pdf).toHaveBeenCalledTimes(1);
    const element = pdf.mock.calls[0][0];
    expect(element.type).toBe(AnalysisPdfDoc);
    expect(element.props.eventTitle).toBe("Demo Summit");
    expect(element.props.insights).toBe(insightsFixture);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    expect(anchors).toHaveLength(1);
    const a = anchors[0];
    expect(a.download).toBe("Demo Summit-analisis-ia.pdf");
    expect(a.href).toBe("blob:mock-url");
    expect(appendSpy).toHaveBeenCalledWith(a);
    expect(a.click).toHaveBeenCalledTimes(1);
    // Se limpia: el anchor sale del DOM y se revoca la URL
    expect(document.body.contains(a)).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  test("sin eventTitle usa el nombre por defecto 'encuesta'", async () => {
    await downloadAnalysisPdf({ insights: null });

    expect(anchors).toHaveLength(1);
    expect(anchors[0].download).toBe("encuesta-analisis-ia.pdf");
    expect(anchors[0].click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
