/**
 * Tests del render en servidor de la landing estática (src/landing-app/server.jsx):
 * el mismo árbol que hidrata el navegador, renderizado a HTML con los datos del
 * build. Corre en jsdom, pero renderLanding no toca window/document.
 */
import { renderLanding } from "landing-app/server";
import { translationCache } from "scripts/translationCache";

jest.mock("aws-amplify/api", () => ({ generateClient: () => ({ graphql: jest.fn() }) }));

const data = (over = {}) => ({
  eventId: "ev-1",
  event: {
    id: "ev-1",
    title: "Congreso",
    date: "2026-11-05T14:00:00.000Z",
    startDate: "2026-11-05T14:00:00.000Z",
    endDate: "2026-11-05T18:00:00.000Z",
    timezone: "America/Guayaquil",
    maxRegs: null,
    updatedAt: "t1",
  },
  landing: {
    id: "l-1",
    active: true,
    title: "Lazos del Dragón",
    description: "Encuentro de vecinos",
    location: "Hall Principal (Campus Cumbayá)",
    cost: "Gratuito",
    ticketTitle: [],
    ticketPrice: [],
    extraInfo: "Primera oración. Segunda.",
    mainBanner: "banners/lazos.jpg",
    updatedAt: "t1",
  },
  form: { id: "f-1", questions: "[]", updatedAt: "t1" },
  images: {
    "banners/lazos.jpg": {
      avif: "/landing-img/abc-480.avif 480w, /landing-img/abc-800.avif 800w",
      webp: "/landing-img/abc-480.webp 480w, /landing-img/abc-800.webp 800w",
    },
  },
  translations: { en: {} },
  ...over,
});

afterEach(() => {
  Object.keys(translationCache).forEach((k) => delete translationCache[k]);
});

describe("renderLanding (SSR)", () => {
  test("pinta la landing completa en español con fecha en la zona del evento", () => {
    const html = renderLanding("/landing/ev-1", data());
    expect(html).toContain("Lazos del Dragón");
    expect(html).toContain("Encuentro de vecinos");
    // 14:00 UTC = 09:00 en Quito (GMT-5), mismo día: rango 09:00 – 13:00.
    expect(html).toMatch(/Jueves, 5 de noviembre de 2026/);
    expect(html).toContain("09:00 – 13:00");
    expect(html).toContain("Hall Principal");
    expect(html).toContain("Reservar ticket");
    // El registro no se renderiza en el HTML estático (se carga al reservar).
    expect(html).not.toContain("Formulario de Registro");
  });

  test("el banner sale con las variantes AVIF/WebP del build y el original de respaldo", () => {
    const html = renderLanding("/landing/ev-1", data());
    expect(html).toContain('type="image/avif"');
    expect(html).toContain("/landing-img/abc-800.avif 800w");
    expect(html).toContain('type="image/webp"');
    expect(html).toContain("https://dnuc5lxyun5b.cloudfront.net/public/banners/lazos.jpg");
  });

  test("sin variantes para el banner usa solo la imagen original", () => {
    const html = renderLanding("/landing/ev-1", data({ images: {} }));
    expect(html).not.toContain("<source");
    expect(html).toContain("banners/lazos.jpg");
  });

  test("/en usa las traducciones calculadas en el build (sin Amazon Translate)", () => {
    const html = renderLanding(
      "/landing/ev-1/en",
      data({ translations: { en: { "Lazos del Dragón": "Dragon Ties", "Encuentro de vecinos": "Neighbors meeting" } } })
    );
    expect(html).toContain("Dragon Ties");
    expect(html).toContain("Neighbors meeting");
    expect(html).toMatch(/Thursday, November 5, 2026/);
    expect(html).toContain("Book ticket");
    expect(html).not.toContain("Lazos del Dragón");
  });

  test("con cupo máximo el CTA espera la validación del cupo (spinner)", () => {
    const d = data();
    d.event.maxRegs = 100;
    const html = renderLanding("/landing/ev-1", d);
    expect(html).toContain("loader-small");
    expect(html).not.toContain("Reservar ticket</button>");
  });
});
