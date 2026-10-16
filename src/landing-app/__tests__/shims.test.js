/**
 * Tests de los shims de la landing liviana (src/landing-app/shims): cliente
 * GraphQL con fetch + API key y configuración perezosa de Amplify.
 */
jest.mock(
  "../../amplifyconfiguration.json",
  () => ({
    aws_appsync_graphqlEndpoint: "https://api.test/graphql",
    aws_appsync_apiKey: "da2-test",
  }),
  { virtual: true }
);

const mockConfigure = jest.fn();
jest.mock("aws-amplify", () => ({ Amplify: { configure: (...a) => mockConfigure(...a) } }));
jest.mock("aws-amplify/storage", () => ({ uploadData: jest.fn(), getUrl: jest.fn() }));
jest.mock("aws-amplify/auth", () => ({ fetchAuthSession: jest.fn() }));
jest.mock("@aws-amplify/predictions", () => ({ Predictions: { convert: jest.fn() } }));

describe("shims/api: generateClient", () => {
  const { generateClient } = require("landing-app/shims/api");

  afterEach(() => {
    delete global.fetch;
  });

  test("envía la consulta a AppSync con la API key y devuelve la respuesta", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: { getEvent: { id: "e" } } }) }));
    const res = await generateClient().graphql({ query: "query Q { x }", variables: { a: 1 } });
    expect(res).toEqual({ data: { getEvent: { id: "e" } } });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.test/graphql");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("da2-test");
    expect(JSON.parse(init.body)).toEqual({ query: "query Q { x }", variables: { a: 1 } });
  });

  test("con errores GraphQL rechaza con la respuesta completa (como Amplify)", async () => {
    const body = { data: null, errors: [{ message: "boom" }] };
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => body }));
    await expect(generateClient().graphql({ query: "q" })).rejects.toBe(body);
  });

  test("con HTTP no-OK también rechaza", async () => {
    const body = { message: "Unauthorized" };
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => body }));
    await expect(generateClient().graphql({ query: "q" })).rejects.toBe(body);
  });
});

describe("shims de Amplify (storage/auth/predictions)", () => {
  test("configuran Amplify una sola vez antes de exponer cada servicio", () => {
    const storage = require("landing-app/shims/storage");
    const auth = require("landing-app/shims/auth");
    const predictions = require("landing-app/shims/predictions");
    expect(typeof storage.uploadData).toBe("function");
    expect(typeof storage.getUrl).toBe("function");
    expect(typeof auth.fetchAuthSession).toBe("function");
    expect(predictions.Predictions).toBeDefined();
    expect(mockConfigure).toHaveBeenCalledTimes(1);
    expect(mockConfigure).toHaveBeenCalledWith(
      expect.objectContaining({ aws_appsync_apiKey: "da2-test" })
    );
  });
});
