import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(),
}));

jest.mock("aws-amplify/api", () => {
  const graphql = jest.fn();
  return {
    generateClient: () => ({ graphql }),
    post: jest.fn(),
    del: jest.fn(),
  };
});

jest.mock("aws-amplify/datastore", () => ({
  DataStore: {
    query: jest.fn(),
    save: jest.fn(async (m) => m),
    delete: jest.fn(async (m) => m),
  },
}));

jest.mock("models", () => {
  class User {
    constructor(data) {
      Object.assign(this, data);
    }
    static copyOf(base, mutator) {
      const draft = { ...base };
      mutator(draft);
      return draft;
    }
  }
  return { User };
});

// Tiene sus propias consultas a DataStore: fuera del alcance de esta vista.
jest.mock("../components/EventPermissionsManager", () => () => {
  const React = require("react");
  return React.createElement("div", {
    "data-testid": "event-permissions-manager",
  });
});

import AdminUserManager from "../index";

const { fetchUserAttributes } = require("aws-amplify/auth");
const { generateClient, post, del } = require("aws-amplify/api");
const { DataStore } = require("aws-amplify/datastore");
const gql = generateClient().graphql; // misma instancia que usa la vista

// ── Fixtures ───────────────────────────────────────────────────────────────
const roles = [
  { id: "r-admin", name: "Admin" },
  { id: "r-editor", name: "Editor" },
];
const campuses = [
  { id: "c1", title: "Cumbayá" },
  { id: "c2", title: "Quito" }, // sin áreas
];
const areas = [
  { id: "a1", title: "Ingeniería", campusID: "c1" },
  { id: "a2", title: "Arquitectura", campusID: "c1" }, // sin eventos
];
const careers = [
  { id: "k1", areaID: "a1" },
  { id: "k2", areaID: "a2" },
];
const eventos = [
  { id: "e1", title: "Feria", careerID: "k1" },
  { id: "e3", title: "", careerID: "k1" }, // sin título: igual se ordena
  { id: "e4", title: "", careerID: "k1" }, // otro sin título (empatan)
  // Carrera desconocida: el árbol lo descarta porque no resuelve a un área.
  { id: "e-huerfano", title: "Huérfano", careerID: "k-fantasma" },
];

const dsUsers = [
  { id: "u-admin", email: "admin@usfq.edu.ec", name: "Admin USFQ", roleID: "r-admin" },
  {
    id: "u-editor", email: "editor@usfq.edu.ec", name: "Edi Tor",
    roleID: "r-editor", campusIDs: ["c1"], eventIDs: ["e1", "e2"],
  },
  { id: "u-nada", email: "nadie@usfq.edu.ec", roleID: "r-inexistente" },
];

let currentUserItems;

const defaultGraphql = async ({ query }) => {
  const q = String(query);
  if (q.includes("listUsers")) return { data: { listUsers: { items: currentUserItems } } };
  if (q.includes("listRoles")) return { data: { listRoles: { items: roles } } };
  if (q.includes("listCampuses")) return { data: { listCampuses: { items: campuses } } };
  if (q.includes("listAreas")) return { data: { listAreas: { items: areas } } };
  if (q.includes("listCareers")) return { data: { listCareers: { items: careers } } };
  if (q.includes("listEvents")) return { data: { listEvents: { items: eventos } } };
  return { data: {} };
};

let alertSpy;
let confirmSpy;

beforeEach(() => {
  currentUserItems = [
    { id: "u-admin", email: "admin@usfq.edu.ec", role: { id: "r-admin", name: "Admin" } },
  ];
  fetchUserAttributes.mockReset();
  fetchUserAttributes.mockResolvedValue({ email: "admin@usfq.edu.ec" });
  gql.mockReset();
  gql.mockImplementation(defaultGraphql);
  DataStore.query.mockReset();
  DataStore.query.mockImplementation(async (_Model, id) =>
    id ? dsUsers.find((u) => u.id === id) : dsUsers
  );
  DataStore.save.mockClear();
  DataStore.delete.mockClear();
  post.mockReset();
  post.mockImplementation(() => ({
    response: Promise.resolve({ body: { json: async () => ({}) } }),
  }));
  del.mockReset();
  del.mockImplementation(() => ({ response: Promise.resolve({}) }));
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  confirmSpy = jest.spyOn(window, "confirm").mockImplementation(() => true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderVista = async () => {
  render(<AdminUserManager />);
  await screen.findByText("admin@usfq.edu.ec");
};

const abrirModalCrear = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Crear usuario/ }));
  const heading = await screen.findByRole("heading", { name: "Crear usuario" });
  return within(heading.closest("div.fixed"));
};

const completarYEnviar = (modal, { email, name, roleID } = {}) => {
  if (email !== undefined) {
    fireEvent.change(modal.getByPlaceholderText("persona@usfq.edu.ec"), {
      target: { value: email },
    });
  }
  if (name !== undefined) {
    fireEvent.change(modal.getByPlaceholderText("Nombre y apellido"), {
      target: { value: name },
    });
  }
  if (roleID !== undefined) {
    fireEvent.change(modal.getByRole("combobox"), { target: { value: roleID } });
  }
  fireEvent.click(modal.getByRole("button", { name: "Crear usuario" }));
};

describe("Permisos (views/admin/permisos)", () => {
  test("muestra el loader mientras identifica al usuario", async () => {
    render(<AdminUserManager />);
    expect(screen.getByText("Cargando permisos…")).toBeInTheDocument();
    await screen.findByText("admin@usfq.edu.ec");
    expect(screen.queryByText("Cargando permisos…")).not.toBeInTheDocument();
  });

  test("niega el acceso a usuarios que no son Admin", async () => {
    currentUserItems = [
      { id: "u-editor", email: "editor@usfq.edu.ec", role: { id: "r-editor", name: "Editor" } },
    ];
    render(<AdminUserManager />);
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText("No tienes permisos para acceder a esta sección.")
    ).toBeInTheDocument();
    // No dispara la carga de datos de administración
    const consultas = gql.mock.calls.map((c) => String(c[0].query));
    expect(consultas.some((q) => q.includes("listRoles"))).toBe(false);
  });

  test("niega el acceso cuando falla la identificación (auth)", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchUserAttributes.mockRejectedValueOnce(new Error("sin sesión"));
    render(<AdminUserManager />);
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalledWith(
      "Error obteniendo usuario:",
      expect.any(Error)
    );
  });

  test("lista usuarios con rol y resumen de permisos, Admin primero", async () => {
    await renderVista();

    const filas = screen.getAllByRole("row");
    // fila 0 = encabezado; el Admin siempre va primero
    expect(within(filas[1]).getByText("admin@usfq.edu.ec")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Acceso completo")).toBeInTheDocument();

    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    expect(within(filaEditor).getByText("Edi Tor")).toBeInTheDocument();
    expect(within(filaEditor).getByText("Editor")).toBeInTheDocument();
    expect(within(filaEditor).getByText("1 campus · 2 eventos")).toBeInTheDocument();

    const filaNadie = screen.getByText("nadie@usfq.edu.ec").closest("tr");
    expect(within(filaNadie).getByText("—")).toBeInTheDocument(); // sin nombre
    expect(within(filaNadie).getByText("Sin rol")).toBeInTheDocument();
    expect(within(filaNadie).getByText("Sin permisos")).toBeInTheDocument();

    // No puede eliminarse a sí mismo
    expect(
      within(filas[1]).getByRole("button", { name: /Eliminar/ })
    ).toBeDisabled();
    expect(
      within(filaEditor).getByRole("button", { name: /Eliminar/ })
    ).toBeEnabled();

    expect(screen.getByTestId("event-permissions-manager")).toBeInTheDocument();
  });

  test("filtra por búsqueda y muestra vacío sin coincidencias", async () => {
    await renderVista();
    const buscador = screen.getByPlaceholderText("Buscar por email, nombre o rol…");

    fireEvent.change(buscador, { target: { value: "nadie" } });
    expect(screen.getByText("nadie@usfq.edu.ec")).toBeInTheDocument();
    expect(screen.queryByText("editor@usfq.edu.ec")).not.toBeInTheDocument();
    expect(screen.queryByText("admin@usfq.edu.ec")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "zzz-nada" } });
    expect(screen.getByText("No hay usuarios que coincidan.")).toBeInTheDocument();
  });

  test("valida email y rol antes de crear un usuario", async () => {
    await renderVista();
    const modal = await abrirModalCrear();

    completarYEnviar(modal, {}); // sin email
    expect(alertSpy).toHaveBeenCalledWith("Ingresa un email válido.");

    completarYEnviar(modal, { email: "nuevo@usfq.edu.ec" }); // sin rol
    expect(alertSpy).toHaveBeenCalledWith("Selecciona un rol.");
    expect(post).not.toHaveBeenCalled();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("crea un usuario: invita por Cognito (userApi) y guarda el registro", async () => {
    await renderVista();
    const modal = await abrirModalCrear();

    // Concede el campus completo desde el árbol de permisos
    fireEvent.click(modal.getByRole("checkbox", { name: /Cumbayá/ }));
    completarYEnviar(modal, {
      email: "  Nuevo@USFQ.edu.ec  ",
      name: "Nuevo Usuario",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Usuario creado e invitado por correo.")
    );
    expect(post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/users",
      options: { body: { email: "nuevo@usfq.edu.ec", name: "Nuevo Usuario" } },
    });
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "nuevo@usfq.edu.ec",
        name: "Nuevo Usuario",
        roleID: "r-editor",
        campusIDs: ["c1"],
        areaIDs: [],
        eventIDs: [],
      })
    );
    // Cierra el modal y recarga la lista
    expect(screen.queryByRole("heading", { name: "Crear usuario" })).toBeNull();
    const consultasRoles = gql.mock.calls.filter((c) =>
      String(c[0].query).includes("listRoles")
    );
    expect(consultasRoles.length).toBe(2);
  });

  test("crear con invitación fallida: muestra la contraseña temporal", async () => {
    post.mockImplementationOnce(() => ({
      response: Promise.resolve({
        body: { json: async () => ({ emailSent: false, tempPassword: "Temp#123" }) },
      }),
    }));
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("NO se pudo enviar el correo")
      )
    );
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Temp#123"));
    expect(DataStore.save).toHaveBeenCalled();
  });

  test("crear cuando el login ya existe (409): reutiliza la cuenta", async () => {
    post.mockImplementationOnce(() => {
      throw Object.assign(new Error("UsernameExistsException"), {
        response: { statusCode: 409 },
      });
    });
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("se reutilizó"))
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: "nuevo@usfq.edu.ec" })
    );
  });

  test("crear cuando Cognito avisa 'ya existe' sin código de estado: también reutiliza", async () => {
    post.mockImplementationOnce(() => {
      throw new Error("ya existe una cuenta con ese correo");
    });
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("se reutilizó"))
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: "nuevo@usfq.edu.ec" })
    );
  });

  test("crear con invitación fallida y sin contraseña temporal: '(no disponible)'", async () => {
    post.mockImplementationOnce(() => ({
      response: Promise.resolve({
        body: { json: async () => ({ emailSent: false }) },
      }),
    }));
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("(no disponible)")
      )
    );
  });

  test("crear con la API sin desplegar: guarda el registro y avisa (rol Admin sin árbol)", async () => {
    post.mockImplementationOnce(() => {
      throw new Error("API name is invalid");
    });
    await renderVista();
    const modal = await abrirModalCrear();

    // Con rol Admin el árbol se reemplaza por la nota de acceso completo
    fireEvent.change(modal.getByRole("combobox"), { target: { value: "r-admin" } });
    expect(
      modal.getByText("El rol Admin tiene acceso completo; no requiere asignación.")
    ).toBeInTheDocument();

    completarYEnviar(modal, { email: "nuevo@usfq.edu.ec", name: "Nuevo" });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("userManager"))
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "nuevo@usfq.edu.ec",
        roleID: "r-admin",
        campusIDs: [],
        areaIDs: [],
        eventIDs: [],
      })
    );
  });

  test("crear con error real: alerta y no guarda el registro", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw new Error("boom explosivo");
    });
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("No se pudo guardar: boom explosivo")
    );
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    // El modal permanece abierto para corregir
    expect(screen.getByRole("heading", { name: "Crear usuario" })).toBeInTheDocument();
  });

  test("crear con un error sin mensaje ni nombre: alerta genérica y no guarda", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Rechaza con un objeto plano: no es 'ya existe' ni 'API sin desplegar'.
    post.mockImplementationOnce(() => ({
      response: Promise.reject({ codigo: "desconocido" }),
    }));
    await renderVista();
    const modal = await abrirModalCrear();
    completarYEnviar(modal, {
      email: "nuevo@usfq.edu.ec",
      name: "Nuevo",
      roleID: "r-editor",
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("No se pudo guardar:")
      )
    );
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });

  test("edita un usuario existente vía DataStore.copyOf", async () => {
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Editar/ }));

    const heading = await screen.findByRole("heading", { name: "Editar usuario" });
    const modal = within(heading.closest("div.fixed"));
    expect(modal.getByDisplayValue("editor@usfq.edu.ec")).toBeDisabled();

    fireEvent.change(modal.getByPlaceholderText("Nombre y apellido"), {
      target: { value: "Editora Nueva" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Usuario actualizado.")
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u-editor",
        name: "Editora Nueva",
        roleID: "r-editor",
        campusIDs: ["c1"],
      })
    );
  });

  test("elimina un usuario tras confirmar (Cognito + registro)", async () => {
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");

    // Si cancela la confirmación no pasa nada
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Eliminar/ }));
    expect(del).not.toHaveBeenCalled();

    fireEvent.click(within(filaEditor).getByRole("button", { name: /Eliminar/ }));
    expect(confirmSpy).toHaveBeenCalledWith("¿Eliminar al usuario editor@usfq.edu.ec?");

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Usuario eliminado."));
    expect(del).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/users/editor%40usfq.edu.ec",
    });
    expect(DataStore.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u-editor" })
    );
  });

  test("reenvía las instrucciones de acceso por correo", async () => {
    post.mockImplementationOnce(() => ({
      response: Promise.resolve({ body: { json: async () => ({ emailSent: true }) } }),
    }));
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Instrucciones de acceso reenviadas a editor@usfq.edu.ec."
      )
    );
    expect(post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/users",
      options: {
        body: { email: "editor@usfq.edu.ec", name: "Edi Tor", resend: true },
      },
    });
  });

  test("reenviar sin correo disponible: comparte la contraseña temporal", async () => {
    post.mockImplementationOnce(() => ({
      response: Promise.resolve({
        body: {
          json: async () => ({ withTempPassword: true, tempPassword: "Nueva#456" }),
        },
      }),
    }));
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Nueva#456"))
    );
  });

  test("reenviar sin éxito ni contraseña: muestra el emailError del backend", async () => {
    post.mockImplementationOnce(() => ({
      response: Promise.resolve({
        body: { json: async () => ({ emailSent: false, emailError: "SES caído" }) },
      }),
    }));
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo reenviar el correo.\n\nSES caído"
      )
    );
  });

  test("reenviar con respuesta vacía del backend: alerta genérica", async () => {
    // El mock por defecto de post responde {} (ni emailSent ni contraseña).
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("No se pudo reenviar el correo.")
    );
  });

  test("reenviar cuando el error lanzado es un texto plano: detecta la API faltante", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Rechaza con un texto plano (sin .message), como algunos SDK antiguos.
    post.mockImplementationOnce(() => ({
      response: Promise.reject("API name is invalid"),
    }));
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("aún no está desplegada")
      )
    );
  });

  test("reenviar con error: usa el detalle del cuerpo de la respuesta", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw Object.assign(new Error("Request failed"), {
        response: {
          statusCode: 500,
          body: { json: async () => ({ error: "SES no configurado" }) },
        },
      });
    });
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo reenviar el correo.\n\nSES no configurado"
      )
    );
    expect(errSpy).toHaveBeenCalledWith("resend error:", expect.any(Error));
  });

  test("reenviar con 404: sugiere desplegar el endpoint /users", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw Object.assign(new Error("Not Found"), {
        response: { statusCode: 404 },
      });
    });
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("El endpoint /users no está desplegado")
      )
    );
  });

  test("reenviar con cuerpo ilegible y 'unknown error': diagnostica el API Gateway", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw Object.assign(new Error("unknown error"), {
        response: {
          body: {
            json: async () => {
              throw new Error("json roto");
            },
          },
        },
      });
    });
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("El endpoint /users no está desplegado")
      )
    );
    expect(errSpy).toHaveBeenCalledWith(
      "No se pudo leer el cuerpo del error:",
      expect.any(Error)
    );
  });

  test("reenviar con la función sin desplegar: avisa de userManager", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw new Error("API name is invalid");
    });
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("aún no está desplegada")
      )
    );
  });

  test("reenviar con error desconocido: alerta genérica sin detalle", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    post.mockImplementationOnce(() => {
      throw new Error("otra cosa");
    });
    await renderVista();
    const filaEditor = screen.getByText("editor@usfq.edu.ec").closest("tr");
    fireEvent.click(within(filaEditor).getByRole("button", { name: /Reenviar/ }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("No se pudo reenviar el correo.")
    );
  });

  test("error cargando datos: alerta sugiriendo amplify push", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    gql.mockImplementation(async ({ query }) => {
      const q = String(query);
      if (q.includes("listUsers")) return { data: { listUsers: { items: currentUserItems } } };
      throw new Error("backend caído");
    });
    render(<AdminUserManager />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error cargando datos")
      )
    );
    expect(errSpy).toHaveBeenCalledWith("Error fetching data:", expect.any(Error));
    // Se sale del loader y muestra la tabla vacía
    expect(await screen.findByText("No hay usuarios que coincidan.")).toBeInTheDocument();
  });
});
