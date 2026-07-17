/* Tests del wrapper del form builder (src/views/admin/eventos/formulario).
 *
 * jQuery formBuilder se mockea en la frontera: $(el).formBuilder(config)
 * registra la config (para inspeccionar formData/defaultFields y disparar su
 * onSave) y $(el).formBuilder('getData','json') devuelve el JSON fixture.
 *
 * Cubre: loader pre-emisión, redirect sin evento, hidratación única del
 * builder (sin remount con emisiones posteriores), guardar (update copyOf /
 * crear / reusar fila re-consultada / doble clic / json nulo) y permisos.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("jquery", () => {
  const state = { configs: [], json: null };
  const jq = () => ({
    formBuilder: (arg) => {
      if (arg === "getData") return state.json;
      state.configs.push(arg); // init: guarda la config completa
      return undefined;
    },
  });
  jq.__state = state;
  return { __esModule: true, default: jq };
});
jest.mock("jquery-ui-sortable", () => ({}));
jest.mock("formBuilder", () => ({}));

jest.mock("models", () => {
  function Form(init = {}) {
    Object.assign(this, init);
    if (!this.id) this.id = "form-nuevo";
  }
  Form.copyOf = (base, mutate) => {
    const draft = { ...base };
    mutate(draft);
    return draft;
  };
  return { Form };
});

jest.mock("aws-amplify/datastore", () => {
  const state = { emissions: [], subs: [], queryRows: [] };
  const impls = {
    observe: () => ({
      subscribe: (cb) => {
        state.subs.push(cb);
        state.emissions.forEach((e) => cb(e));
        return { unsubscribe: jest.fn() };
      },
    }),
    query: async () => state.queryRows,
    save: async (m) => m,
  };
  return {
    DataStore: {
      __state: state,
      __impls: impls,
      observeQuery: jest.fn(impls.observe),
      query: jest.fn(impls.query),
      save: jest.fn(impls.save),
    },
  };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

import Formulario from "../index";

const { DataStore } = require("aws-amplify/datastore");
const jqState = require("jquery").default.__state;

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const FORM_ROW = {
  id: "f-1",
  formEventId: "ev-1",
  questions: [{ type: "text", name: "nombres", label: "Nombre" }],
};
const EDITED = [{ type: "text", name: "q1", label: "P1" }];

let alertSpy;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "EVENTFLOW.event",
    JSON.stringify({ id: "ev-1", title: "Evento Test" })
  );
  mockUsePermissions.mockReturnValue({ loading: false, can: () => true });
  DataStore.__state.emissions = [];
  DataStore.__state.subs = [];
  DataStore.__state.queryRows = [];
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observe);
  DataStore.query.mockImplementation(DataStore.__impls.query);
  DataStore.save.mockImplementation(DataStore.__impls.save);
  jqState.configs.length = 0;
  jqState.json = JSON.stringify(EDITED);
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderFormulario = () =>
  render(
    <MemoryRouter>
      <Formulario />
    </MemoryRouter>
  );

// Dispara el onSave que la vista le pasó al plugin (el botón "Guardar" real
// vive dentro del DOM que posee jQuery).
const guardarDesdeElBuilder = async () => {
  await act(async () => {
    jqState.configs[0].onSave();
  });
};

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Formulario — carga", () => {
  test("mantiene el loader hasta la primera emisión del store", () => {
    renderFormulario(); // sin emisiones
    expect(screen.getByText("Cargando formulario...")).toBeInTheDocument();
    expect(screen.queryByText("Formulario de registro")).toBeNull();
    expect(jqState.configs).toHaveLength(0); // el builder no se montó
  });

  test("sin evento cacheado redirige a /admin sin suscribirse", () => {
    localStorage.removeItem("EVENTFLOW.event");
    renderFormulario();
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
    expect(DataStore.observeQuery).not.toHaveBeenCalled();
  });

  test("hidrata el builder UNA sola vez con la config completa de formBuilder", () => {
    DataStore.__state.emissions = [{ items: [FORM_ROW], isSynced: true }];
    renderFormulario();

    expect(screen.getByText("Formulario de registro")).toBeInTheDocument();
    expect(
      screen.getByText("Preguntas que responden los asistentes al inscribirse.")
    ).toBeInTheDocument();

    expect(jqState.configs).toHaveLength(1);
    const cfg = jqState.configs[0];
    expect(cfg.formData).toEqual(FORM_ROW.questions);
    expect(cfg.i18n.override["en-US"].save).toBe("Guardar");
    expect(cfg.disableFields).toEqual(
      expect.arrayContaining(["autocomplete", "button", "radio-group"])
    );
    expect(cfg.persistDefaultFields).toBe(true);
    expect(cfg.defaultFields.map((f) => f.name)).toEqual([
      "tipo_identificacion",
      "identificacion",
      "codigo_banner",
      "email",
      "nombres",
      "direccion",
      "telefono",
    ]);
    expect(cfg.typeUserAttrs.select.className.options).toHaveProperty(
      "pie-chart form-control"
    );

    // El eco de un guardado (nueva emisión, mismo id) NO remonta el builder.
    act(() => {
      DataStore.__state.subs.forEach((cb) =>
        cb({ items: [{ ...FORM_ROW, questions: [] }], isSynced: true })
      );
    });
    expect(jqState.configs).toHaveLength(1);
  });

  test("sin Form tras el sync monta el builder vacío (defaultFields del plugin)", () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    renderFormulario();
    expect(jqState.configs).toHaveLength(1);
    expect(jqState.configs[0].formData).toEqual([]);
  });
});

describe("Formulario — guardar", () => {
  test("con Form existente actualiza vía copyOf y alerta", async () => {
    DataStore.__state.emissions = [{ items: [FORM_ROW], isSynced: true }];
    renderFormulario();

    await guardarDesdeElBuilder();

    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "f-1",
        formEventId: "ev-1",
        questions: EDITED, // el JSON del plugin, parseado
      })
    );
    expect(alertSpy).toHaveBeenCalledWith("Form actualizado con éxito");
    // No hubo re-consulta: el camino de update no re-verifica el store.
    expect(DataStore.query).not.toHaveBeenCalled();
  });

  test("dos clics rápidos en Guardar no duplican el guardado", async () => {
    DataStore.__state.emissions = [{ items: [FORM_ROW], isSynced: true }];
    renderFormulario();

    await act(async () => {
      jqState.configs[0].onSave();
      jqState.configs[0].onSave(); // el guard savingRef corta el segundo
    });

    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  test("sin Form crea uno nuevo tras re-verificar el store", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    renderFormulario();

    await guardarDesdeElBuilder();

    expect(DataStore.query).toHaveBeenCalledTimes(1); // re-check anti-duplicado
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "form-nuevo", // pasó por el constructor
      formEventId: "ev-1",
      questions: EDITED,
    });
    expect(alertSpy).toHaveBeenCalledWith("Form creado con éxito");
  });

  test("si la re-verificación encuentra una fila la actualiza en vez de duplicar", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    DataStore.__state.queryRows = [FORM_ROW]; // sincronizó después de cargar
    renderFormulario();

    await guardarDesdeElBuilder();

    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "f-1",
      questions: EDITED,
    });
    expect(alertSpy).toHaveBeenCalledWith("Form actualizado con éxito");
  });

  test("sin permiso de edición muestra el banner y Guardar no hace nada", async () => {
    mockUsePermissions.mockReturnValue({ loading: false, can: () => false });
    DataStore.__state.emissions = [{ items: [FORM_ROW], isSynced: true }];
    renderFormulario();

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    await guardarDesdeElBuilder();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test("si el plugin devuelve un JSON nulo no se guarda nada", async () => {
    DataStore.__state.emissions = [{ items: [FORM_ROW], isSynced: true }];
    jqState.json = null;
    renderFormulario();

    await guardarDesdeElBuilder();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
