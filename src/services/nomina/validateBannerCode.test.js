/* Tests de src/services/nomina/validateBannerCode.js — validación del código
 * Banner contra la API de Nómina USFQ. Se mockea global.fetch y se cubren:
 * empleado activo (true y "true"), inactivo/mismatch, campos faltantes o
 * vacíos (skip), errores HTTP del token y de Nómina, token sin access_token,
 * caída de red, encoding/trim de parámetros y overrides por opciones. */

import { validateBannerCode } from "./validateBannerCode";

const TOKEN_URL =
  "https://xjmntgc4yroqwjqzep3oqu653a0mohcv.lambda-url.sa-east-1.on.aws/";
const NOMINA_URL =
  "https://gpapis.usfq.edu.ec/APISNominaGP-TEST/api/NominaGP" +
  "/PersonaNomina/EsEmpleadoActivo";

// Respuesta estilo fetch con json() configurable.
const jsonRes = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => body,
});

// userData con el formato de formRender: [{ name, userData: [valor] }].
const buildUserData = (banner, id) => [
  { name: "otro_campo", userData: ["irrelevante"] },
  { name: "codigo_banner", userData: banner === undefined ? [] : [banner] },
  { name: "identificacion", userData: id === undefined ? [] : [id] },
];

let errSpy;

beforeEach(() => {
  global.fetch = jest.fn();
  errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errSpy.mockRestore();
});

describe("validateBannerCode — empleado activo (camino feliz)", () => {
  test("devuelve {ok:true} cuando Nómina responde true, con token y URLs correctos", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-123" }))
      .mockResolvedValueOnce(jsonRes(true));

    const result = await validateBannerCode(
      buildUserData("00123", "1712345678")
    );

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, TOKEN_URL, {
      method: "GET",
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `${NOMINA_URL}?banner_id=00123&identificacion=1712345678`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer tok-123",
          Accept: "application/json",
        },
      }
    );
  });

  test("acepta el string \"true\" de Nómina como empleado activo", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-abc" }))
      .mockResolvedValueOnce(jsonRes("true"));

    await expect(
      validateBannerCode(buildUserData("00987", "0912345678"))
    ).resolves.toEqual({ ok: true });
  });

  test("recorta espacios, convierte números a string y codifica caracteres especiales en la URL", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-enc" }))
      .mockResolvedValueOnce(jsonRes(true));

    await validateBannerCode(buildUserData("  A&B 01  ", 1712345678));

    const [urlNomina] = global.fetch.mock.calls[1];
    expect(urlNomina).toBe(
      `${NOMINA_URL}?banner_id=A%26B%2001&identificacion=1712345678`
    );
  });
});

describe("validateBannerCode — empleado inactivo o datos que no coinciden", () => {
  test("devuelve {ok:false, reason:'inactive_or_mismatch'} cuando Nómina responde false", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-123" }))
      .mockResolvedValueOnce(jsonRes(false));

    await expect(
      validateBannerCode(buildUserData("00123", "1712345678"))
    ).resolves.toEqual({ ok: false, reason: "inactive_or_mismatch" });
  });

  test("cualquier respuesta que no sea true/\"true\" (p.ej. \"false\" o null) se trata como inactivo", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "t1" }))
      .mockResolvedValueOnce(jsonRes("false"))
      .mockResolvedValueOnce(jsonRes({ access_token: "t2" }))
      .mockResolvedValueOnce(jsonRes(null));

    await expect(
      validateBannerCode(buildUserData("11111", "1700000001"))
    ).resolves.toEqual({ ok: false, reason: "inactive_or_mismatch" });
    await expect(
      validateBannerCode(buildUserData("22222", "1700000002"))
    ).resolves.toEqual({ ok: false, reason: "inactive_or_mismatch" });
  });
});

describe("validateBannerCode — campos faltantes (se omite la validación)", () => {
  test("sin código banner devuelve {ok:true, skipped:true} y no toca la red", async () => {
    const userData = [
      { name: "identificacion", userData: ["1712345678"] },
      { name: "otro_campo", userData: ["x"] },
    ];

    await expect(validateBannerCode(userData)).resolves.toEqual({
      ok: true,
      skipped: true,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("con identificación vacía o solo espacios también se omite", async () => {
    await expect(
      validateBannerCode(buildUserData("00123", undefined))
    ).resolves.toEqual({ ok: true, skipped: true });
    await expect(
      validateBannerCode(buildUserData("00123", "    "))
    ).resolves.toEqual({ ok: true, skipped: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("userData malformado (null o sin .find) se omite en vez de explotar", async () => {
    await expect(validateBannerCode(null)).resolves.toEqual({
      ok: true,
      skipped: true,
    });
    await expect(validateBannerCode({ no: "es array" })).resolves.toEqual({
      ok: true,
      skipped: true,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("validateBannerCode — errores de la API", () => {
  test("fallo HTTP al pedir el token: {ok:false, reason:'api_error'} sin llamar a Nómina", async () => {
    global.fetch.mockResolvedValueOnce(jsonRes({}, { ok: false, status: 500 }));

    await expect(
      validateBannerCode(buildUserData("00123", "1712345678"))
    ).resolves.toEqual({ ok: false, reason: "api_error" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledWith(
      "validateBannerCode error:",
      expect.any(Error)
    );
  });

  test("token sin access_token en el body: {ok:false, reason:'api_error'}", async () => {
    global.fetch.mockResolvedValueOnce(jsonRes({ mensaje: "sin token" }));

    await expect(
      validateBannerCode(buildUserData("00123", "1712345678"))
    ).resolves.toEqual({ ok: false, reason: "api_error" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("fallo HTTP en el chequeo de Nómina (403): {ok:false, reason:'api_error'}", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-123" }))
      .mockResolvedValueOnce(jsonRes({}, { ok: false, status: 403 }));

    await expect(
      validateBannerCode(buildUserData("00123", "1712345678"))
    ).resolves.toEqual({ ok: false, reason: "api_error" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("caída de red (fetch rechaza): {ok:false, reason:'api_error'} y se registra el error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network unreachable"));

    await expect(
      validateBannerCode(buildUserData("00123", "1712345678"))
    ).resolves.toEqual({ ok: false, reason: "api_error" });
    expect(errSpy).toHaveBeenCalledWith(
      "validateBannerCode error:",
      expect.any(Error)
    );
  });
});

describe("validateBannerCode — opciones personalizadas", () => {
  test("respeta nombres de campo y URLs alternativos pasados en opts", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: "tok-custom" }))
      .mockResolvedValueOnce(jsonRes(true));

    const userData = [
      { name: "banner_alt", userData: ["B-777"] },
      { name: "ci_alt", userData: ["0102030405"] },
    ];

    const result = await validateBannerCode(userData, {
      bannerFieldName: "banner_alt",
      idFieldName: "ci_alt",
      tokenUrl: "https://token.example.test/",
      nominaBaseUrl: "https://nomina.example.test/api",
    });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://token.example.test/",
      { method: "GET" }
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://nomina.example.test/api/PersonaNomina/EsEmpleadoActivo?banner_id=B-777&identificacion=0102030405",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer tok-custom",
          Accept: "application/json",
        },
      }
    );
  });
});
