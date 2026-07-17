/* Tests de src/scripts/translateFormData.js
 *
 * Se mockea @aws-amplify/predictions (Amazon Translate); el módulo lo carga
 * con import() dinámico, pero jest.mock intercepta igual el require generado.
 * OJO: el módulo cachea traducciones a nivel de módulo, así que cada test que
 * cuenta llamadas a Predictions.convert usa textos ÚNICOS.
 */

import {
  translateString,
  translateFormData,
  restoreOriginalLabels,
} from "./translateFormData";

jest.mock("@aws-amplify/predictions", () => ({
  Predictions: { convert: jest.fn() },
}));

const { Predictions } = require("@aws-amplify/predictions");

// Traducción "identificable": devuelve "[EN] <fuente>" para poder afirmar
// tanto el resultado como los argumentos con los que se llamó al servicio.
const mockTranslateOk = () =>
  Predictions.convert.mockImplementation(async ({ translateText }) => ({
    text: `[EN] ${translateText.source.text}`,
  }));

beforeEach(() => {
  jest.clearAllMocks();
  mockTranslateOk();
});

describe("translateString", () => {
  test("devuelve el texto sin tocar cuando el idioma destino es español", async () => {
    await expect(translateString("Hola mundo", "es")).resolves.toBe(
      "Hola mundo"
    );
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("devuelve entradas no-string o vacías tal cual sin llamar al servicio", async () => {
    await expect(translateString("", "en")).resolves.toBe("");
    await expect(translateString("   ", "en")).resolves.toBe("   ");
    await expect(translateString(null, "en")).resolves.toBe(null);
    await expect(translateString(42, "en")).resolves.toBe(42);
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("aplica overrides manuales sin llamar a Amazon Translate", async () => {
    await expect(translateString("Dirección", "en")).resolves.toBe("Address");
    await expect(translateString("  sí  ", "en")).resolves.toBe("Yes");
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("traduce vía Predictions.convert con fuente es y destino en", async () => {
    const out = await translateString("Ciudad de residencia", "en");
    expect(out).toBe("[EN] Ciudad de residencia");
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
    expect(Predictions.convert).toHaveBeenCalledWith({
      translateText: {
        source: { text: "Ciudad de residencia", language: "es" },
        targetLanguage: "en",
      },
    });
  });

  test("preprocesa la fuente (ponencia -> ponente) antes de enviarla", async () => {
    const out = await translateString("Sala de ponencias magistrales", "en");
    expect(out).toBe("[EN] Sala de ponentes magistrales");
    expect(Predictions.convert).toHaveBeenCalledWith({
      translateText: {
        source: { text: "Sala de ponentes magistrales", language: "es" },
        targetLanguage: "en",
      },
    });
  });

  test("cachea la traducción: dos llamadas iguales = una sola llamada al servicio", async () => {
    const a = await translateString("Auditorio principal", "en");
    const b = await translateString("Auditorio principal", "en");
    expect(a).toBe("[EN] Auditorio principal");
    expect(b).toBe(a);
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
  });

  test("ante un error devuelve el original y NO cachea el fallo (reintenta)", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    Predictions.convert.mockRejectedValueOnce(new Error("AccessDenied"));

    // Primer intento: falla y devuelve el texto original.
    await expect(translateString("Coliseo cerrado", "en")).resolves.toBe(
      "Coliseo cerrado"
    );
    expect(errorSpy).toHaveBeenCalled();

    // Segundo intento: el servicio ya responde y SÍ se vuelve a llamar.
    await expect(translateString("Coliseo cerrado", "en")).resolves.toBe(
      "[EN] Coliseo cerrado"
    );
    expect(Predictions.convert).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });

  test("si el servicio devuelve texto vacío, conserva y cachea el original", async () => {
    Predictions.convert.mockResolvedValue({ text: "" });
    await expect(translateString("Salón azul", "en")).resolves.toBe(
      "Salón azul"
    );
    // La segunda llamada sale del caché (con el original), sin ir al servicio.
    await expect(translateString("Salón azul", "en")).resolves.toBe(
      "Salón azul"
    );
    expect(Predictions.convert).toHaveBeenCalledTimes(1);
  });
});

describe("translateFormData", () => {
  const buildForm = () => [
    {
      type: "text",
      name: "empresa",
      label: "Nombre de la empresa",
      placeholder: "Escribe el nombre",
      description: "Razón social completa",
      value: "no-tocar",
    },
    {
      type: "select",
      name: "sede",
      label: "Sede del evento",
      values: [
        { label: "Campus Cumbayá", value: "cumbaya" },
        { label: "Campus Quito", value: "uio", selected: true },
        null,
        { value: "sin-label" },
      ],
    },
  ];

  test("devuelve la misma referencia cuando el idioma es es (case-insensitive)", async () => {
    const form = buildForm();
    await expect(translateFormData(form, "es")).resolves.toBe(form);
    await expect(translateFormData(form, "ES")).resolves.toBe(form);
    await expect(translateFormData(form, undefined)).resolves.toBe(form);
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("traduce labels, placeholders, descriptions y opciones; nunca name/value", async () => {
    const form = buildForm();
    const out = await translateFormData(form, "EN");

    expect(out[0]).toEqual({
      type: "text",
      name: "empresa",
      label: "[EN] Nombre de la empresa",
      placeholder: "[EN] Escribe el nombre",
      description: "[EN] Razón social completa",
      value: "no-tocar",
    });
    expect(out[1].name).toBe("sede");
    expect(out[1].label).toBe("[EN] Sede del evento");
    expect(out[1].values).toEqual([
      { label: "[EN] Campus Cumbayá", value: "cumbaya" },
      { label: "[EN] Campus Quito", value: "uio", selected: true },
      null,
      { value: "sin-label" },
    ]);
    // No muta el original.
    expect(form[0].label).toBe("Nombre de la empresa");
    expect(form[1].values[0].label).toBe("Campus Cumbayá");
  });

  test("acepta la definición como string JSON (AWSJSON) y devuelve string JSON", async () => {
    const json = JSON.stringify([
      { type: "text", name: "cargo", label: "Cargo actual" },
    ]);
    const out = await translateFormData(json, "en");
    expect(typeof out).toBe("string");
    expect(JSON.parse(out)).toEqual([
      { type: "text", name: "cargo", label: "[EN] Cargo actual" },
    ]);
  });

  test("devuelve el original ante JSON inválido o estructuras no-array", async () => {
    await expect(translateFormData("esto no es json", "en")).resolves.toBe(
      "esto no es json"
    );
    const objJson = JSON.stringify({ no: "array" });
    await expect(translateFormData(objJson, "en")).resolves.toBe(objJson);
    const obj = { no: "array" };
    await expect(translateFormData(obj, "en")).resolves.toBe(obj);
    await expect(translateFormData(null, "en")).resolves.toBe(null);
    expect(Predictions.convert).not.toHaveBeenCalled();
  });

  test("ignora campos de texto ausentes o no-string sin llamar al servicio", async () => {
    const out = await translateFormData(
      [{ type: "header", name: "h1", subtype: "h2", label: 99 }],
      "en"
    );
    expect(out).toEqual([{ type: "header", name: "h1", subtype: "h2", label: 99 }]);
    expect(Predictions.convert).not.toHaveBeenCalled();
  });
});

describe("restoreOriginalLabels", () => {
  const original = [
    {
      type: "text",
      name: "empresa",
      label: "Nombre de la empresa",
      placeholder: "Escribe el nombre",
      description: "Razón social completa",
    },
    {
      type: "select",
      name: "sede",
      label: "Sede del evento",
      values: [
        { label: "Campus Cumbayá", value: "cumbaya" },
        { label: "Campus Quito", value: "uio" },
        { label: "Sin value" },
      ],
    },
    { type: "header", label: "Bloque sin name" },
  ];

  test("round-trip: traducir y luego restaurar recupera el español y conserva respuestas", async () => {
    const translated = await translateFormData(original, "en");
    // Simula el userData que devuelve formRender sobre el form traducido.
    const captured = [
      { ...translated[0], userData: ["ACME S.A."] },
      {
        ...translated[1],
        values: translated[1].values.map((v, i) =>
          i === 1 ? { ...v, selected: true } : v
        ),
        userData: ["uio"],
      },
    ];

    const restored = restoreOriginalLabels(captured, original);

    expect(restored[0].label).toBe("Nombre de la empresa");
    expect(restored[0].placeholder).toBe("Escribe el nombre");
    expect(restored[0].description).toBe("Razón social completa");
    expect(restored[0].userData).toEqual(["ACME S.A."]);

    expect(restored[1].label).toBe("Sede del evento");
    expect(restored[1].values).toEqual([
      { label: "Campus Cumbayá", value: "cumbaya" },
      { label: "Campus Quito", value: "uio", selected: true },
      { label: "[EN] Sin value" },
    ]);
    expect(restored[1].userData).toEqual(["uio"]);
  });

  test("acepta el original como string JSON (AWSJSON)", () => {
    const captured = [{ name: "empresa", label: "Company name", userData: ["X"] }];
    const restored = restoreOriginalLabels(captured, JSON.stringify(original));
    expect(restored[0].label).toBe("Nombre de la empresa");
    expect(restored[0].userData).toEqual(["X"]);
  });

  test("devuelve captured intacto si el original es JSON inválido o no-array", () => {
    const captured = [{ name: "empresa", label: "Company name" }];
    expect(restoreOriginalLabels(captured, "{rota")).toBe(captured);
    expect(restoreOriginalLabels(captured, { no: "array" })).toBe(captured);
  });

  test("devuelve captured intacto si captured no es un array", () => {
    expect(restoreOriginalLabels("no-array", original)).toBe("no-array");
    expect(restoreOriginalLabels(undefined, original)).toBe(undefined);
  });

  test("deja tal cual los items cuyo name no existe en el original", () => {
    const desconocido = { name: "otro", label: "Unknown field", userData: [] };
    const [out] = restoreOriginalLabels([desconocido], original);
    expect(out).toBe(desconocido);
  });

  test("conserva la opción traducida cuando su value no está en el original", () => {
    const captured = [
      {
        name: "sede",
        label: "Event venue",
        values: [
          { label: "Cumbaya Campus", value: "cumbaya" },
          { label: "New Option", value: "nueva" },
        ],
      },
    ];
    const [out] = restoreOriginalLabels(captured, original);
    expect(out.values).toEqual([
      { label: "Campus Cumbayá", value: "cumbaya" },
      { label: "New Option", value: "nueva" },
    ]);
  });
});
