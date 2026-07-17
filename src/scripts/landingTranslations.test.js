/* Tests de src/scripts/landingTranslations.js — diccionario estático ES/EN
 * de la landing pública y su helper getLandingUI. */

import { LANDING_UI, getLandingUI } from "./landingTranslations";

describe("getLandingUI", () => {
  test("devuelve el diccionario EN para 'EN' (y es case-insensitive)", () => {
    expect(getLandingUI("EN")).toBe(LANDING_UI.EN);
    expect(getLandingUI("en")).toBe(LANDING_UI.EN);
    expect(getLandingUI("En")).toBe(LANDING_UI.EN);
    expect(getLandingUI("EN").eventDetails).toBe("Event details");
  });

  test("devuelve el diccionario ES para 'ES' en cualquier casing", () => {
    expect(getLandingUI("ES")).toBe(LANDING_UI.ES);
    expect(getLandingUI("es")).toBe(LANDING_UI.ES);
    expect(getLandingUI("es").eventDetails).toBe("Detalles del evento");
  });

  test("cae a ES cuando no se pasa idioma", () => {
    expect(getLandingUI()).toBe(LANDING_UI.ES);
    expect(getLandingUI(null)).toBe(LANDING_UI.ES);
    expect(getLandingUI("")).toBe(LANDING_UI.ES);
  });

  test("cae a ES ante idiomas desconocidos", () => {
    expect(getLandingUI("fr")).toBe(LANDING_UI.ES);
    expect(getLandingUI("pt-BR")).toBe(LANDING_UI.ES);
    expect(getLandingUI("xx")).toBe(LANDING_UI.ES);
  });
});

describe("LANDING_UI", () => {
  test("ES y EN exponen exactamente las mismas claves (paridad del diccionario)", () => {
    const esKeys = Object.keys(LANDING_UI.ES).sort();
    const enKeys = Object.keys(LANDING_UI.EN).sort();
    expect(enKeys).toEqual(esKeys);
  });

  test("todas las entradas son strings no vacíos en ambos idiomas", () => {
    ["ES", "EN"].forEach((lang) => {
      Object.entries(LANDING_UI[lang]).forEach(([key, value]) => {
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test("textos clave del flujo de registro en cada idioma", () => {
    expect(LANDING_UI.ES.registrationForm).toBe("Formulario de Registro");
    expect(LANDING_UI.EN.registrationForm).toBe("Registration Form");
    expect(LANDING_UI.ES.successTitle).toBe("¡Registro exitoso!");
    expect(LANDING_UI.EN.successTitle).toBe("Registration successful!");
    expect(LANDING_UI.ES.soldOut).toBe("Entradas Agotadas");
    expect(LANDING_UI.EN.soldOut).toBe("Sold Out");
  });
});
