/* Tests del modal de crear/editar usuario
 * (src/views/admin/permisos/components/UserFormModal.jsx).
 *
 * Cubre en especial la validación de email: el regex se reescribió con clases
 * negadas y con '@' excluido del tramo previo al punto para que corra en
 * tiempo LINEAL (sin backtracking super-lineal). Aquí se prueba que
 * acepta/rechaza lo mismo que el patrón original /.+@.+\..+/ en emails
 * representativos, y que las cadenas patológicas se rechazan al instante.
 * También: normalización al enviar, rol Admin (permisos vacíos), estado
 * "Guardando…", asociación label/control y cierre sin enviar.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserFormModal from "../UserFormModal";

const ROLES = [
  { id: "r-admin", name: "Admin" },
  { id: "r-editor", name: "Editor" },
];

let alertSpy;

beforeEach(() => {
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderModal = (props = {}) => {
  const onSubmit = jest.fn(async () => {});
  const onClose = jest.fn();
  render(
    <UserFormModal
      mode="create"
      user={null}
      roles={ROLES}
      tree={[]}
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />
  );
  return { onSubmit, onClose };
};

describe("UserFormModal — validación de email", () => {
  // Envía sin rol: un email inválido alerta "Ingresa un email válido." y uno
  // válido avanza hasta "Selecciona un rol.". Así distinguimos qué acepta el
  // regex sin completar el resto del formulario.
  const validarEmail = (valor) => {
    alertSpy.mockClear();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: valor },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));
    return alertSpy.mock.calls[0][0];
  };

  test("acepta y rechaza los mismos emails que el patrón original", () => {
    const { onSubmit } = renderModal();
    const aceptados = [
      "a@b.co",
      "persona@usfq.edu.ec",
      "a@b.c",
      "con espacios@dominio x.com", // el patrón original también lo aceptaba
      "a@@b..c",
      "texto a@b.c alrededor",
      "Nombre <a@b.c>", // pegado dentro de otro texto
      "a@..b", // punto doble tras el @ (rareza que el original también aceptaba)
      "a@" + "x".repeat(1000) + ".c", // dominio larguísimo con punto
    ];
    const rechazados = [
      "",
      "sin-arroba.com",
      "@usfq.edu.ec", // nada antes del @
      "a@b", // sin punto después del @
      "a@b.", // nada después del punto
      "a@.b", // nada entre el @ y el punto
      "punto.antes@arroba",
      "a b c", // sin @ ni punto
      "a@b@", // arrobas sin punto posterior
    ];
    aceptados.forEach((email) =>
      expect(validarEmail(email)).toBe("Selecciona un rol.")
    );
    rechazados.forEach((email) =>
      expect(validarEmail(email)).toBe("Ingresa un email válido.")
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("cadenas patológicas del backtracking se rechazan y en tiempo lineal", () => {
    renderModal();
    const inicio = Date.now();
    [
      "@".repeat(40000), // solo arrobas: cada candidato muere en O(1)
      "a@" + "x".repeat(40000), // tramo larguísimo sin punto tras el @
      ".a@".repeat(10000), // '@' pegado al punto: basura que ya no se acepta
    ].forEach((cadena) =>
      expect(validarEmail(cadena)).toBe("Ingresa un email válido.")
    );
    // Con el patrón cuadrático anterior solo el primer caso tardaba varios
    // segundos; el patrón lineal resuelve los tres al instante (margen
    // holgado para máquinas de CI lentas).
    expect(Date.now() - inicio).toBeLessThan(3000);
  });
});

describe("UserFormModal — envío y estados", () => {
  test("crea: normaliza email/nombre y conserva el rol elegido", async () => {
    const { onSubmit } = renderModal();
    expect(
      screen.getByText("Permisos (campus → área → evento)")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  Nueva@USFQ.edu.ec " },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: " Persona Nueva " },
    });
    fireEvent.change(screen.getByLabelText("Rol"), {
      target: { value: "r-editor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        id: undefined,
        email: "nueva@usfq.edu.ec",
        name: "Persona Nueva",
        roleID: "r-editor",
        campusIDs: [],
        areaIDs: [],
        eventIDs: [],
      })
    );
  });

  test("rol Admin oculta el árbol y envía permisos vacíos", async () => {
    const { onSubmit } = renderModal({
      user: {
        email: "a@b.co",
        campusIDs: ["c1"],
        areaIDs: ["a1"],
        eventIDs: ["e1"],
      },
    });
    fireEvent.change(screen.getByLabelText("Rol"), {
      target: { value: "r-admin" },
    });
    expect(
      screen.getByText(
        "El rol Admin tiene acceso completo; no requiere asignación."
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          roleID: "r-admin",
          campusIDs: [],
          areaIDs: [],
          eventIDs: [],
        })
      )
    );
  });

  test("editar: no revalida el email y muestra 'Guardando…' mientras envía", async () => {
    let release;
    const onSubmit = jest.fn(
      () =>
        new Promise((res) => {
          release = res;
        })
    );
    render(
      <UserFormModal
        mode="edit"
        user={{
          id: "u1",
          email: "no-es-un-email",
          roleID: "r-editor",
          campusIDs: [null, "c1"],
        }}
        roles={ROLES}
        tree={[]}
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );
    // En edición el email queda deshabilitado y no se revalida.
    expect(screen.getByLabelText("Email")).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const busy = await screen.findByRole("button", { name: "Guardando…" });
    expect(busy).toBeDisabled();

    release();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar cambios" })
      ).toBeEnabled()
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        email: "no-es-un-email",
        campusIDs: ["c1"], // los null del registro se filtran
      })
    );
  });

  test("Cancelar y la X cierran sin enviar; todos los botones son type=button", () => {
    const { onSubmit, onClose } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    const botones = screen.getAllByRole("button");
    fireEvent.click(botones[0]); // la X del encabezado
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
    botones.forEach((b) => expect(b).toHaveAttribute("type", "button"));
  });
});
