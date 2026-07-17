/* Tests de PermissionsProvider: resolución de roles, capacidades por evento
 * y acceso jerárquico Campus->Área->Evento (src/providers/PermissionsProvider.jsx). */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(),
}));

jest.mock("aws-amplify/api", () => {
  // generateClient() se llama al cargar el módulo: exponemos el mismo
  // jest.fn de graphql para configurarlo por test (__graphql).
  const graphql = jest.fn();
  return {
    generateClient: () => ({ graphql, cancel: jest.fn() }),
    __graphql: graphql,
  };
});

jest.mock("aws-amplify/datastore", () => ({
  DataStore: { query: jest.fn() },
}));

jest.mock("models", () => ({
  EventPermission: function EventPermission() {},
}));

import { fetchUserAttributes } from "aws-amplify/auth";
import { __graphql as mockGraphql } from "aws-amplify/api";
import { DataStore } from "aws-amplify/datastore";
import { EventPermission } from "models";
import { PermissionsProvider, usePermissions } from "./PermissionsProvider";

// Enruta cada query de GraphQL a su fixture correspondiente.
const gqlFixtures = ({ users = [], grants = {}, grantsError, areas = [], careers = [], events = [] } = {}) =>
  async ({ query }) => {
    if (query.includes("listUsers")) return { data: { listUsers: { items: users } } };
    if (query.includes("getUser")) {
      if (grantsError) throw new Error(grantsError);
      return { data: { getUser: grants } };
    }
    if (query.includes("listAreas")) return { data: { listAreas: { items: areas } } };
    if (query.includes("listCareers")) return { data: { listCareers: { items: careers } } };
    if (query.includes("listEvents")) return { data: { listEvents: { items: events } } };
    throw new Error(`query no esperada: ${query}`);
  };

// Captura el valor del contexto para afirmar sobre él tras la carga.
let ctx;
const Sonda = () => {
  ctx = usePermissions();
  return <span data-testid="estado">{ctx.loading ? "cargando" : "listo"}</span>;
};

const renderProvider = async () => {
  render(
    <PermissionsProvider>
      <Sonda />
    </PermissionsProvider>
  );
  await waitFor(() => expect(screen.getByTestId("estado")).toHaveTextContent("listo"));
  return ctx;
};

beforeEach(() => {
  ctx = undefined;
  jest.clearAllMocks();
  fetchUserAttributes.mockResolvedValue({ email: "carlos@usfq.edu.ec" });
  DataStore.query.mockResolvedValue([]);
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
});

describe("usePermissions fuera del provider (valor por defecto)", () => {
  test("expone loading=true y permisos abiertos", () => {
    render(<Sonda />);
    expect(screen.getByTestId("estado")).toHaveTextContent("cargando");
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.can("ev-x", "landing", "edit")).toBe(true);
    expect(ctx.canSeeArea("a-x")).toBe(true);
    expect(ctx.canSeeCampus("c-x")).toBe(true);
    expect(ctx.canSeeEvent("ev-x")).toBe(true);
    expect(ctx.areaIDsAllowed).toBeNull();
  });
});

describe("PermissionsProvider — Admin", () => {
  test("consulta listUsers con el email del usuario autenticado", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({ users: [{ id: "u1", email: "carlos@usfq.edu.ec", role: { id: "r1", name: "Admin", areas: [] } }] })
    );
    await renderProvider();
    expect(fetchUserAttributes).toHaveBeenCalledTimes(1);
    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { filter: { email: { eq: "carlos@usfq.edu.ec" }, _deleted: { ne: true } } },
      })
    );
  });

  test("un Admin tiene acceso total y NO consulta permisos por evento ni grants", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({ users: [{ id: "u1", email: "carlos@usfq.edu.ec", role: { id: "r1", name: "Admin", areas: [] } }] })
    );
    const perms = await renderProvider();

    expect(perms.isAdmin).toBe(true);
    expect(perms.isReportesOnly).toBe(false);
    expect(perms.roleName).toBe("Admin");
    expect(perms.isManaged).toBe(false);
    expect(perms.areaIDsAllowed).toBeNull();
    expect(perms.can("cualquier-evento", "form", "edit")).toBe(true);
    expect(perms.canSeeArea("a-99")).toBe(true);
    expect(perms.canSeeCampus("c-99")).toBe(true);
    expect(perms.canSeeEvent("ev-99")).toBe(true);
    expect(DataStore.query).not.toHaveBeenCalled();
    // Solo la query de listUsers: nada de getUser/listAreas para admins.
    expect(mockGraphql).toHaveBeenCalledTimes(1);
  });
});

describe("PermissionsProvider — rol Reportes", () => {
  test("marca isReportesOnly y no es admin", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({ users: [{ id: "u2", email: "carlos@usfq.edu.ec", role: { id: "r2", name: "Reportes", areas: ["a1"] } }] })
    );
    const perms = await renderProvider();
    expect(perms.isReportesOnly).toBe(true);
    expect(perms.isAdmin).toBe(false);
    expect(perms.roleName).toBe("Reportes");
  });
});

describe("PermissionsProvider — usuario gestionado (EventPermission)", () => {
  const usuario = { id: "u3", email: "carlos@usfq.edu.ec", role: { id: "r3", name: "Editor", areas: ["a1", null] } };

  test("aplica capacidades por evento: solo lo otorgado en `seccion:accion`", async () => {
    mockGraphql.mockImplementation(gqlFixtures({ users: [usuario], grants: {} }));
    DataStore.query.mockResolvedValue([
      { eventID: "ev-1", capabilities: ["landing:view", "landing:edit", null] },
      { eventID: "ev-2", capabilities: null },
    ]);
    const perms = await renderProvider();

    expect(perms.isManaged).toBe(true);
    expect(perms.eventCapsByEvent).toEqual({ "ev-1": ["landing:view", "landing:edit"], "ev-2": [] });
    expect(perms.can("ev-1", "landing", "edit")).toBe(true);
    expect(perms.can("ev-1", "landing")).toBe(true); // acción por defecto = view
    expect(perms.can("ev-1", "form", "edit")).toBe(false);
    expect(perms.can("ev-2", "landing", "view")).toBe(false);
    expect(perms.can("ev-desconocido", "landing")).toBe(false);
  });

  test("consulta EventPermission filtrando por el id del usuario", async () => {
    mockGraphql.mockImplementation(gqlFixtures({ users: [usuario], grants: {} }));
    await renderProvider();

    expect(DataStore.query).toHaveBeenCalledWith(EventPermission, expect.any(Function));
    const predicado = DataStore.query.mock.calls[0][1];
    const eq = jest.fn();
    predicado({ userID: { eq } });
    expect(eq).toHaveBeenCalledWith("u3");
  });

  test("sin registros EventPermission el usuario NO es gestionado y can() es permisivo (legado)", async () => {
    mockGraphql.mockImplementation(gqlFixtures({ users: [usuario], grants: {} }));
    DataStore.query.mockResolvedValue([]);
    const perms = await renderProvider();

    expect(perms.isManaged).toBe(false);
    expect(perms.can("ev-1", "form", "edit")).toBe(true);
  });

  test("si EventPermission aún no existe (query falla) degrada sin romper", async () => {
    mockGraphql.mockImplementation(gqlFixtures({ users: [usuario], grants: {} }));
    DataStore.query.mockRejectedValue(new Error("schema sin desplegar"));
    const perms = await renderProvider();

    expect(perms.isManaged).toBe(false);
    expect(perms.eventCapsByEvent).toEqual({});
    expect(perms.can("ev-1", "landing", "edit")).toBe(true);
    expect(console.warn).toHaveBeenCalledWith("EventPermission not available yet:", "schema sin desplegar");
  });
});

describe("PermissionsProvider — acceso jerárquico (grants por usuario)", () => {
  const usuario = { id: "u4", email: "carlos@usfq.edu.ec", role: { id: "r4", name: "Editor", areas: ["a-legacy"] } };
  // Jerarquía: c1->{a1}, c2->{a2}, c3->{a3}; carreras car1->a3, car2->a1;
  // eventos ev1(car2->a1), ev9(car1->a3), ev10(car1->a3), evX(carrera desconocida).
  const jerarquia = {
    areas: [
      { id: "a1", campusID: "c1" },
      { id: "a2", campusID: "c2" },
      { id: "a3", campusID: "c3" },
    ],
    careers: [
      { id: "car1", areaID: "a3" },
      { id: "car2", areaID: "a1" },
    ],
    events: [
      { id: "ev1", careerID: "car2" },
      { id: "ev9", careerID: "car1" },
      { id: "ev10", careerID: "car1" },
      { id: "evX", careerID: "car-fantasma" },
    ],
  };

  test("campus otorgado incluye sus áreas y TODOS sus eventos; evento otorgado NO arrastra hermanos", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({
        users: [usuario],
        grants: { campusIDs: ["c1"], areaIDs: ["a2"], eventIDs: ["ev9"] },
        ...jerarquia,
      })
    );
    const perms = await renderProvider();

    // Áreas efectivas: a1 (por campus c1), a2 (directa), a3 (por el evento ev9).
    expect(perms.areaIDsAllowed.sort()).toEqual(["a1", "a2", "a3"]);
    expect(perms.canSeeArea("a1")).toBe(true);
    expect(perms.canSeeArea("a4")).toBe(false);

    // Campus efectivos: c1 (directo) + c2/c3 (campus de áreas efectivas).
    expect(perms.campusIDsAllowed.sort()).toEqual(["c1", "c2", "c3"]);
    expect(perms.canSeeCampus("c2")).toBe(true);
    expect(perms.canSeeCampus("c4")).toBe(false);

    // Eventos: ev1 entra por el campus c1 (área a1 completa); ev9 es directo;
    // ev10 (hermano de ev9 en a3) queda FUERA.
    expect(perms.eventIDsAllowed.sort()).toEqual(["ev1", "ev9"]);
    expect(perms.canSeeEvent("ev9")).toBe(true);
    expect(perms.canSeeEvent("ev1")).toBe(true);
    expect(perms.canSeeEvent("ev10")).toBe(false);
    expect(perms.canSeeEvent("evX")).toBe(false);
  });

  test("solo grant de área: habilita su campus y sus eventos completos", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({
        users: [usuario],
        grants: { campusIDs: null, areaIDs: ["a1"], eventIDs: [] },
        ...jerarquia,
      })
    );
    const perms = await renderProvider();

    expect(perms.areaIDsAllowed).toEqual(["a1"]);
    expect(perms.campusIDsAllowed).toEqual(["c1"]);
    expect(perms.eventIDsAllowed).toEqual(["ev1"]);
    expect(perms.canSeeEvent("ev9")).toBe(false);
  });

  test("sin grants por usuario cae al legado: áreas del rol y campus sin restricción", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({ users: [usuario], grants: { campusIDs: [], areaIDs: null, eventIDs: [null] } })
    );
    const perms = await renderProvider();

    expect(perms.areaIDsAllowed).toEqual(["a-legacy"]); // filtra el null del rol
    expect(perms.campusIDsAllowed).toBeNull();
    expect(perms.eventIDsAllowed).toBeNull();
    expect(perms.canSeeArea("a-legacy")).toBe(true);
    expect(perms.canSeeArea("a-otra")).toBe(false);
    expect(perms.canSeeCampus("c-cualquiera")).toBe(true);
    expect(perms.canSeeEvent("ev-cualquiera")).toBe(true);
  });

  test("si la query de grants falla, usa las áreas legadas del rol", async () => {
    mockGraphql.mockImplementation(
      gqlFixtures({ users: [usuario], grantsError: "getUser sin desplegar", ...jerarquia })
    );
    const perms = await renderProvider();

    expect(perms.areaIDsAllowed).toEqual(["a-legacy"]);
    expect(perms.campusIDsAllowed).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("Hierarchical access not available yet:", "getUser sin desplegar");
  });
});

describe("PermissionsProvider — bordes y errores", () => {
  test("usuario no encontrado en la tabla Users: termina de cargar sin restricciones", async () => {
    mockGraphql.mockImplementation(gqlFixtures({ users: [] }));
    const perms = await renderProvider();

    expect(perms.loading).toBe(false);
    expect(perms.user).toBeUndefined();
    expect(perms.roleName).toBeUndefined();
    expect(perms.isAdmin).toBe(false);
    expect(perms.areaIDsAllowed).toBeNull();
    expect(perms.can("ev-1", "landing")).toBe(true);
    expect(DataStore.query).not.toHaveBeenCalled();
  });

  test("si falla la autenticación, apaga loading y mantiene el estado por defecto", async () => {
    fetchUserAttributes.mockRejectedValue(new Error("no session"));
    const perms = await renderProvider();

    expect(perms.loading).toBe(false);
    expect(perms.user).toBeUndefined();
    expect(perms.isAdmin).toBe(false);
    expect(perms.canSeeArea("a1")).toBe(true);
    expect(console.error).toHaveBeenCalledWith("PermissionsProvider error:", expect.any(Error));
    expect(mockGraphql).not.toHaveBeenCalled();
  });
});
