/* Tests del gestor de permisos por evento
 * (src/views/admin/permisos/components/EventPermissionsManager.jsx).
 *
 * Cubre: carga y orden de usuarios/eventos, tabla oculta hasta seleccionar
 * ambos, hidratación del EventPermission existente (con re-consulta al cambiar
 * la selección), las implicaciones view/edit del toggle, guardar (copyOf sobre
 * el registro existente / crear uno nuevo), el estado "Guardando…" y el error.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

jest.mock("models", () => {
  function EventPermission(init = {}) {
    Object.assign(this, init);
    if (!this.id) this.id = "perm-nuevo";
  }
  EventPermission.copyOf = (base, mutate) => {
    const draft = { ...base };
    mutate(draft);
    return draft;
  };
  return {
    User: { name: "User" },
    Event: { name: "Event" },
    EventPermission,
  };
});

// DataStore.query evalúa el predicado p.and([...eq]) contra las fixtures para
// que la vista cargue el permiso correcto según el usuario+evento elegidos.
jest.mock("aws-amplify/datastore", () => {
  const state = { fixtures: {} };
  const impls = {
    query: async (Model, pred) => {
      let rows = state.fixtures[Model?.name] || [];
      if (typeof pred === "function") {
        const conds = [];
        const c = new Proxy(
          {},
          {
            get: (_t, field) => ({
              eq: (v) => {
                conds.push([field, v]);
                return true;
              },
            }),
          }
        );
        pred({
          and: (cb) => {
            cb(c);
            return true;
          },
        });
        rows = rows.filter((r) => conds.every(([f, v]) => r[f] === v));
      }
      return rows;
    },
    save: async (m) => m,
  };
  return {
    DataStore: {
      __state: state,
      __impls: impls,
      query: jest.fn(impls.query),
      save: jest.fn(impls.save),
    },
  };
});

import EventPermissionsManager from "../EventPermissionsManager";

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const USERS = [
  { id: "u2", email: "beto@usfq.edu.ec" },
  { id: "u1", email: "ana@usfq.edu.ec" },
];
const EVENTS = [
  { id: "e1", title: "Feria" },
  { id: "e2", title: "Congreso" },
];
const PERM = {
  id: "perm-1",
  userID: "u1",
  eventID: "e1",
  capabilities: ["landing:view", "landing:edit", null],
};

let alertSpy;

beforeEach(() => {
  DataStore.__state.fixtures = { User: USERS, Event: EVENTS, EventPermission: [PERM] };
  DataStore.query.mockImplementation(DataStore.__impls.query);
  DataStore.save.mockImplementation(DataStore.__impls.save);
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderManager = async () => {
  render(<EventPermissionsManager />);
  // Espera a que la carga inicial llene los selects.
  await screen.findByRole("option", { name: "ana@usfq.edu.ec" });
  const [selUser, selEvent] = screen.getAllByRole("combobox");
  return { selUser, selEvent };
};

const seleccionar = async (selUser, selEvent, uid, eid) => {
  fireEvent.change(selUser, { target: { value: uid } });
  fireEvent.change(selEvent, { target: { value: eid } });
  await screen.findByRole("table");
};

// Checkboxes [Ver, Editar] de la fila de una sección.
const checksDe = (seccion) =>
  within(screen.getByText(seccion).closest("tr")).getAllByRole("checkbox");

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("EventPermissionsManager — carga y selección", () => {
  test("ordena usuarios por email y eventos por título; sin selección no hay tabla", async () => {
    const { selUser, selEvent } = await renderManager();

    expect(
      within(selUser).getAllByRole("option").map((o) => o.textContent)
    ).toEqual(["Selecciona un usuario…", "ana@usfq.edu.ec", "beto@usfq.edu.ec"]);
    expect(
      within(selEvent).getAllByRole("option").map((o) => o.textContent)
    ).toEqual(["Selecciona un evento…", "Congreso", "Feria"]);

    // Solo con usuario elegido la tabla sigue oculta.
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.change(selUser, { target: { value: "u1" } });
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Guardar permisos del evento" })
    ).toBeNull();
  });

  test("hidrata el permiso existente y lo re-consulta al cambiar la selección", async () => {
    const { selUser, selEvent } = await renderManager();
    await seleccionar(selUser, selEvent, "u1", "e1");

    // Las 5 secciones y las columnas Ver/Editar están presentes.
    ["Detalle", "Landing", "Formulario", "Diseño Gafete", "Participantes"].forEach(
      (s) => expect(screen.getByText(s)).toBeInTheDocument()
    );
    expect(screen.getByText("Ver")).toBeInTheDocument();
    expect(screen.getByText("Editar")).toBeInTheDocument();

    // Capacidades guardadas (los null se filtran sin reventar).
    await waitFor(() => expect(checksDe("Landing")[0]).toBeChecked());
    expect(checksDe("Landing")[1]).toBeChecked();
    expect(checksDe("Detalle")[0]).not.toBeChecked();
    expect(checksDe("Formulario")[1]).not.toBeChecked();

    // Cambiar a un evento sin registro limpia las casillas.
    fireEvent.change(selEvent, { target: { value: "e2" } });
    await waitFor(() => expect(checksDe("Landing")[0]).not.toBeChecked());
    expect(checksDe("Landing")[1]).not.toBeChecked();
  });

  test("marcar Editar implica Ver; desmarcar Ver quita también Editar", async () => {
    const { selUser, selEvent } = await renderManager();
    await seleccionar(selUser, selEvent, "u2", "e1"); // sin permiso previo

    // edit ⇒ view
    fireEvent.click(checksDe("Formulario")[1]);
    expect(checksDe("Formulario")[0]).toBeChecked();
    expect(checksDe("Formulario")[1]).toBeChecked();

    // quitar view ⇒ quita edit
    fireEvent.click(checksDe("Formulario")[0]);
    expect(checksDe("Formulario")[0]).not.toBeChecked();
    expect(checksDe("Formulario")[1]).not.toBeChecked();
  });
});

describe("EventPermissionsManager — guardar", () => {
  test("actualiza el registro existente vía copyOf y muestra 'Guardando…' mientras tanto", async () => {
    let release;
    DataStore.save.mockImplementation(
      (m) =>
        new Promise((res) => {
          release = () => res(m);
        })
    );
    const { selUser, selEvent } = await renderManager();
    await seleccionar(selUser, selEvent, "u1", "e1");
    await waitFor(() => expect(checksDe("Landing")[0]).toBeChecked());

    // Cambia las capacidades: fuera landing, entra formulario (edit+view).
    fireEvent.click(checksDe("Landing")[0]);
    fireEvent.click(checksDe("Formulario")[1]);
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar permisos del evento" })
    );

    // busy: el botón muestra Guardando… y queda deshabilitado.
    const busy = await screen.findByRole("button", { name: "Guardando…" });
    expect(busy).toBeDisabled();
    release();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Permisos del evento guardados con éxito"
      )
    );
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    const saved = DataStore.save.mock.calls[0][0];
    expect(saved.id).toBe("perm-1"); // copyOf sobre la fila existente
    expect(saved.capabilities.slice().sort()).toEqual([
      "formulario:edit",
      "formulario:view",
    ]);
    // vuelve del estado busy
    expect(
      screen.getByRole("button", { name: "Guardar permisos del evento" })
    ).toBeEnabled();
  });

  test("sin registro previo crea un EventPermission nuevo", async () => {
    const { selUser, selEvent } = await renderManager();
    await seleccionar(selUser, selEvent, "u2", "e1");

    fireEvent.click(checksDe("Detalle")[0]); // solo Ver
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar permisos del evento" })
    );

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Permisos del evento guardados con éxito"
      )
    );
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "perm-nuevo", // pasó por el constructor (registro nuevo)
      userID: "u2",
      eventID: "e1",
      capabilities: ["detalle:view"],
    });
  });

  test("si el guardado falla alerta el error y el botón se re-habilita", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.save.mockRejectedValue(new Error("red caída"));
    const { selUser, selEvent } = await renderManager();
    await seleccionar(selUser, selEvent, "u1", "e1");

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar permisos del evento" })
    );

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Error guardando los permisos.")
    );
    expect(errSpy).toHaveBeenCalledWith(
      "save event permission error",
      expect.any(Error)
    );
    expect(
      await screen.findByRole("button", { name: "Guardar permisos del evento" })
    ).toBeEnabled();
  });
});
