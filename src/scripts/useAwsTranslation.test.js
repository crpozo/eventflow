/* Tests de src/scripts/useAwsTranslation.js — hook que traduce diccionarios
 * al vuelo con Amazon Translate (Amplify Predictions). Se mockea la red en la
 * frontera de módulo (@aws-amplify/predictions) y se cubren: camino ES sin
 * red, traducción EN, overrides manuales, preprocesado, caché a nivel módulo,
 * valores vacíos/no-string, errores de la API y respuestas obsoletas.
 *
 * OJO: la caché del hook vive a nivel de módulo y persiste entre tests, por
 * eso cada test usa textos en español ÚNICOS (salvo los tests de caché, que
 * la reutilizan a propósito). */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useAwsTranslation } from "./useAwsTranslation";
import { Predictions } from "@aws-amplify/predictions";

jest.mock("@aws-amplify/predictions", () => ({
  Predictions: { convert: jest.fn() },
}));

// Deja correr la cadena de promesas del hook (convert -> caché -> finally).
const flushPromises = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

beforeEach(() => {
  jest.clearAllMocks();
  // Traducción determinista: "EN:<texto fuente enviado a Translate>".
  Predictions.convert.mockImplementation(async ({ translateText }) => ({
    text: `EN:${translateText.source.text}`,
  }));
});

describe("useAwsTranslation — español (idioma fuente)", () => {
  test("con targetLang 'ES' devuelve los textos originales sin llamar a Translate", async () => {
    const texts = { titulo: "Congreso de Medicina", lugar: "Quito" };
    const { result } = renderHook(() => useAwsTranslation(texts, "ES"));

    expect(result.current).toBe(texts);
    await flushPromises();
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("sin targetLang (o en minúsculas) cae a español y tampoco llama a la API", async () => {
    const texts = { titulo: "Hola sin idioma" };

    const porDefecto = renderHook(() => useAwsTranslation(texts));
    expect(porDefecto.result.current).toBe(texts);

    const minusculas = renderHook(() => useAwsTranslation(texts, "es"));
    expect(minusculas.result.current).toBe(texts);

    await flushPromises();
    expect(Predictions.convert).not.toHaveBeenCalled();
  });
});

describe("useAwsTranslation — traducción a inglés", () => {
  test("muestra el original de inmediato y luego la traducción, con los argumentos correctos", async () => {
    const texts = { titulo: "Bienvenidos al congreso anual" };
    const { result } = renderHook(() => useAwsTranslation(texts, "EN"));

    // Antes de que resuelva la red se muestra el texto original (sin flash vacío).
    expect(result.current.titulo).toBe("Bienvenidos al congreso anual");

    await waitFor(() =>
      expect(result.current.titulo).toBe("EN:Bienvenidos al congreso anual")
    );
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
    expect(Predictions.convert).toHaveBeenCalledWith({
      translateText: {
        source: { text: "Bienvenidos al congreso anual", language: "es" },
        targetLanguage: "en",
      },
    });
  });

  test("aplica overrides manuales sin pasar por la red y solo traduce el resto", async () => {
    const texts = { campo: "Cédula", detalle: "Detalle traducible del evento" };
    const { result } = renderHook(() => useAwsTranslation(texts, "EN"));

    // El override sale de inmediato, sin esperar a Translate.
    expect(result.current.campo).toBe("ID");

    await waitFor(() =>
      expect(result.current.detalle).toBe("EN:Detalle traducible del evento")
    );
    expect(result.current.campo).toBe("ID");
    // Una sola llamada: la del texto SIN override.
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
    expect(Predictions.convert).toHaveBeenCalledWith({
      translateText: {
        source: { text: "Detalle traducible del evento", language: "es" },
        targetLanguage: "en",
      },
    });
  });

  test("preprocesa la fuente (ponencias -> ponentes) antes de enviarla a Translate", async () => {
    const texts = { agenda: "Agenda de ponencias magistrales" };
    const { result } = renderHook(() => useAwsTranslation(texts, "EN"));

    await waitFor(() =>
      expect(result.current.agenda).toBe("EN:Agenda de ponentes magistrales")
    );
    expect(Predictions.convert).toHaveBeenCalledWith({
      translateText: {
        source: { text: "Agenda de ponentes magistrales", language: "es" },
        targetLanguage: "en",
      },
    });
  });

  test("deja pasar intactos los valores vacíos o no-string sin llamar a la API", async () => {
    const texts = { vacio: "", espacios: "   ", nulo: null, numero: 42 };
    const { result } = renderHook(() => useAwsTranslation(texts, "EN"));

    await flushPromises();
    expect(result.current).toEqual({
      vacio: "",
      espacios: "   ",
      nulo: null,
      numero: 42,
    });
    expect(Predictions.convert).not.toHaveBeenCalled();
  });
});

describe("useAwsTranslation — caché a nivel de módulo", () => {
  test("alternar ES <-> EN reutiliza la caché y no vuelve a llamar a Translate", async () => {
    const texts = { saludo: "Saludo cacheado del toggle" };
    const { result, rerender } = renderHook(
      ({ lang }) => useAwsTranslation(texts, lang),
      { initialProps: { lang: "EN" } }
    );

    await waitFor(() =>
      expect(result.current.saludo).toBe("EN:Saludo cacheado del toggle")
    );
    expect(Predictions.convert).toHaveBeenCalledTimes(1);

    // Vuelta a español: originales, sin red.
    rerender({ lang: "ES" });
    expect(result.current.saludo).toBe("Saludo cacheado del toggle");

    // De nuevo inglés: sale de la caché de forma síncrona, sin nueva llamada.
    rerender({ lang: "EN" });
    expect(result.current.saludo).toBe("EN:Saludo cacheado del toggle");
    await flushPromises();
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
  });

  test("la caché sobrevive al desmontaje: un nuevo montaje no repite la llamada", async () => {
    const texts = { titulo: "Título persistente entre montajes" };

    const primero = renderHook(() => useAwsTranslation(texts, "EN"));
    await waitFor(() =>
      expect(primero.result.current.titulo).toBe(
        "EN:Título persistente entre montajes"
      )
    );
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
    primero.unmount();

    Predictions.convert.mockClear();
    const segundo = renderHook(() => useAwsTranslation(texts, "EN"));
    expect(segundo.result.current.titulo).toBe(
      "EN:Título persistente entre montajes"
    );
    await flushPromises();
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("una respuesta con texto vacío no se cachea y se mantiene el original", async () => {
    Predictions.convert.mockResolvedValue({ text: "" });
    const texts = { titulo: "Texto que Translate devuelve vacío" };
    const { result } = renderHook(() => useAwsTranslation(texts, "EN"));

    await waitFor(() => expect(Predictions.convert).toHaveBeenCalledTimes(1));
    await flushPromises();
    expect(result.current.titulo).toBe("Texto que Translate devuelve vacío");
  });
});

describe("useAwsTranslation — errores y respuestas obsoletas", () => {
  test("si Translate falla se registra el error, se muestra el original y NO se cachea el fallo", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      Predictions.convert.mockRejectedValue(new Error("network down"));
      const texts = { titulo: "Texto cuya traducción falla" };

      const fallido = renderHook(() => useAwsTranslation(texts, "EN"));
      await waitFor(() =>
        expect(errSpy).toHaveBeenCalledWith(
          "Amazon Translate error for:",
          "Texto cuya traducción falla",
          expect.any(Error)
        )
      );
      await flushPromises();
      // Degrada con gracia: se sigue mostrando el español original.
      expect(fallido.result.current.titulo).toBe("Texto cuya traducción falla");
      fallido.unmount();

      // El fallo no quedó cacheado: al remontar se reintenta y ahora sí traduce.
      Predictions.convert.mockClear();
      Predictions.convert.mockImplementation(async ({ translateText }) => ({
        text: `EN:${translateText.source.text}`,
      }));
      const reintento = renderHook(() => useAwsTranslation(texts, "EN"));
      await waitFor(() =>
        expect(reintento.result.current.titulo).toBe(
          "EN:Texto cuya traducción falla"
        )
      );
      expect(Predictions.convert).toHaveBeenCalledTimes(1);
    } finally {
      errSpy.mockRestore();
    }
  });

  test("ignora respuestas obsoletas cuando los textos cambian con una traducción en vuelo", async () => {
    const resolvers = [];
    Predictions.convert.mockImplementation(
      ({ translateText }) =>
        new Promise((resolve) => {
          resolvers.push({ source: translateText.source.text, resolve });
        })
    );

    const textsA = { k: "Texto A en vuelo" };
    const textsB = { k: "Texto B vigente" };
    const { result, rerender } = renderHook(
      ({ texts }) => useAwsTranslation(texts, "EN"),
      { initialProps: { texts: textsA } }
    );
    expect(result.current.k).toBe("Texto A en vuelo");
    // Espera a que el import dinámico dispare la petición de A (sigue colgada).
    await waitFor(() => expect(resolvers).toHaveLength(1));

    // Cambian los textos antes de que resuelva la primera petición.
    rerender({ texts: textsB });
    expect(result.current.k).toBe("Texto B vigente");
    await waitFor(() => expect(resolvers).toHaveLength(2));
    expect(resolvers.map((r) => r.source)).toEqual([
      "Texto A en vuelo",
      "Texto B vigente",
    ]);

    // Resuelve la petición VIEJA: no debe pisar el estado vigente.
    await act(async () => {
      resolvers[0].resolve({ text: "A traducido (obsoleto)" });
    });
    await flushPromises();
    expect(result.current.k).toBe("Texto B vigente");

    // Resuelve la petición vigente: ahora sí se aplica.
    await act(async () => {
      resolvers[1].resolve({ text: "B traducido" });
    });
    await waitFor(() => expect(result.current.k).toBe("B traducido"));
  });
});
