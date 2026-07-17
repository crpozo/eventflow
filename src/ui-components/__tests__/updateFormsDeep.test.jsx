/* Ola 3 — profundiza la cobertura de los UpdateForm generados por Amplify
 * Studio que quedaron entre 50% y 68%:
 *
 *   CareerUpdateForm, AreaUpdateForm, RoleUpdateForm, FormUpdateForm,
 *   PaymentLogUpdateForm, SurveyCreateForm, EventAttendeUpdateForm (typo)
 *   y EventAttendeeUpdateForm.
 *
 * Gaps que se ejercitan aquí (no cubiertos por olas anteriores):
 *   - Ramas internas de ArrayField: editar un badge (Save), quitarlo con el
 *     ícono, cancelar la edición y Add con valor vacío.
 *   - Interceptor onChange en cada campo + onBlur (runValidationTasks).
 *   - Re-validación al teclear cuando el campo ya tiene error.
 *   - onSubmit (transformación de modelFields), onValidate (validador custom),
 *     onError, conversión de "" -> null y ramas de link/unlink de relaciones.
 *
 * Mismo esquema de mocks de frontera que otherForms*.test.jsx, más
 * @aws-amplify/ui-react/internal (lo usan los forms "Attende" con typo).
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ---- @aws-amplify/ui-react: componentes ligeros equivalentes en semántica ----
jest.mock("@aws-amplify/ui-react", () => {
  const React = require("react");
  const TextField = React.forwardRef(function TextField(
    { label, value, onChange, onBlur, errorMessage, hasError, placeholder, isReadOnly },
    ref
  ) {
    return (
      <div>
        <label>
          {label}
          <input
            ref={ref}
            value={value ?? ""}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            readOnly={isReadOnly}
          />
        </label>
        {hasError && errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </div>
    );
  });
  const TextAreaField = React.forwardRef(function TextAreaField(
    { label, value, onChange, onBlur, errorMessage, hasError, placeholder },
    ref
  ) {
    return (
      <div>
        <label>
          {label}
          <textarea
            ref={ref}
            value={value ?? ""}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
          />
        </label>
        {hasError && errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </div>
    );
  });
  function SwitchField({ label, isChecked, onChange, onBlur, errorMessage, hasError }) {
    return (
      <div>
        <label>
          {label}
          <input type="checkbox" checked={!!isChecked} onChange={onChange} onBlur={onBlur} />
        </label>
        {hasError && errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </div>
    );
  }
  // El autocomplete lista sus opciones como botones (equivale al onSelect
  // real) y expone un botón "limpiar <label>" que dispara onClear.
  const Autocomplete = React.forwardRef(function Autocomplete(
    { label, value, options = [], onSelect, onChange, onBlur, onClear, placeholder, errorMessage, hasError },
    ref
  ) {
    return (
      <div>
        <label>
          {label}
          <input
            ref={ref}
            value={value ?? ""}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
          />
        </label>
        {onClear ? (
          <button type="button" onClick={() => onClear()}>
            {`limpiar ${label}`}
          </button>
        ) : null}
        <ul>
          {options.map((opt) => (
            <li key={opt.id}>
              <button type="button" onClick={() => onSelect && onSelect(opt)}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
        {hasError && errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </div>
    );
  });
  function Button({ children, onClick, type, isDisabled }) {
    return (
      <button type={type || "button"} onClick={onClick} disabled={!!isDisabled}>
        {children}
      </button>
    );
  }
  function Grid({ as, children, onSubmit }) {
    return as === "form" ? (
      <form onSubmit={onSubmit} data-testid="amplify-form">
        {children}
      </form>
    ) : (
      <div>{children}</div>
    );
  }
  const Flex = ({ children }) => <div>{children}</div>;
  const ScrollView = ({ children }) => <div>{children}</div>;
  const Divider = () => <hr />;
  const Text = ({ children }) => <span>{children}</span>;
  const Badge = ({ children, onClick }) => (
    <span data-testid="badge" onClick={onClick}>
      {children}
    </span>
  );
  const Icon = ({ ariaLabel, onClick }) => (
    <button type="button" aria-label={ariaLabel || "icon"} onClick={onClick} />
  );
  const useTheme = () => ({
    tokens: {
      components: { fieldmessages: { error: { color: "red", fontSize: "0.75rem" } } },
    },
  });
  return {
    Autocomplete,
    Badge,
    Button,
    Divider,
    Flex,
    Grid,
    Icon,
    ScrollView,
    SwitchField,
    Text,
    TextAreaField,
    TextField,
    useTheme,
  };
});

// ---- models: clases fake con constructor + copyOf ----
jest.mock("../../models", () => {
  const makeModel = (name) => {
    class M {
      constructor(fields) {
        Object.assign(this, fields);
      }
    }
    Object.defineProperty(M, "name", { value: name });
    M.copyOf = (base, mutator) => {
      const draft = { ...base };
      mutator(draft);
      return draft;
    };
    return M;
  };
  return [
    "Badge",
    "PaymentLog",
    "EventAttendee",
    "EventAttende",
    "Form",
    "Survey",
    "SurveyResponse",
    "Landing",
    "Attendee",
    "Event",
    "Career",
    "Area",
    "Campus",
    "Role",
    "User",
    "EventPermission",
  ].reduce((acc, n) => Object.assign(acc, { [n]: makeModel(n) }), {});
});

// ---- aws-amplify/datastore: colecciones configurables por test ----
// OJO: CRA activa resetMocks, así que las implementaciones se re-aplican en
// cada beforeEach vía __prime().
jest.mock("aws-amplify/datastore", () => {
  const collections = {};
  const DataStore = {
    query: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    observeQuery: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };
  return {
    DataStore,
    __prime: () => {
      DataStore.query.mockImplementation(async (Model, id) => {
        const rows = collections[Model?.name] || [];
        return id === undefined ? rows : rows.find((r) => r.id === id);
      });
      DataStore.save.mockImplementation(async (m) => m);
      DataStore.delete.mockImplementation(async (m) => m);
      DataStore.observeQuery.mockImplementation((Model) => ({
        subscribe: (onNext) => {
          const emit = typeof onNext === "function" ? onNext : onNext.next;
          emit({ items: collections[Model?.name] || [], isSynced: true });
          return { unsubscribe: jest.fn() };
        },
      }));
    },
    __setCollection: (name, rows) => {
      collections[name] = rows;
    },
    __resetCollections: () => {
      Object.keys(collections).forEach((k) => delete collections[k]);
    },
    __getCollection: (name) => collections[name] || [],
  };
});

// Los forms "Attende" (typo) usan los helpers del paquete interno.
jest.mock("@aws-amplify/ui-react/internal", () => ({
  getOverrideProps: () => ({}),
  useDataStoreBinding: ({ model }) => ({
    items: require("aws-amplify/datastore").__getCollection(model?.name),
  }),
}));

// ./utils (real) importa estos módulos de Amplify:
jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(async () => ({})),
  signOut: jest.fn(async () => {}),
}));
jest.mock("aws-amplify/utils", () => ({
  Hub: { dispatch: jest.fn(), listen: jest.fn(() => jest.fn()) },
}));

import CareerUpdateForm from "../CareerUpdateForm";
import AreaUpdateForm from "../AreaUpdateForm";
import RoleUpdateForm from "../RoleUpdateForm";
import FormUpdateForm from "../FormUpdateForm";
import PaymentLogUpdateForm from "../PaymentLogUpdateForm";
import SurveyCreateForm from "../SurveyCreateForm";
import EventAttendeUpdateForm from "../EventAttendeUpdateForm";
import EventAttendeeUpdateForm from "../EventAttendeeUpdateForm";

const {
  DataStore,
  __prime,
  __setCollection,
  __resetCollections,
} = require("aws-amplify/datastore");

const savedModels = () => DataStore.save.mock.calls.map((c) => c[0]);

// Hidratación en DOS olas (queryData + linked records lazy): tras montar con
// un registro existente (o tras cambiar una relación, que re-dispara
// resetStateValues) hay que drenar promesas/timers pendientes ANTES de
// teclear, o el reset pisa lo tecleado.
const drenar = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });
};

// El badge se renderiza como <span>; las opciones del autocomplete comparten
// texto con él mientras el editor está abierto, así que se busca por selector.
const badgeConTexto = (texto) => screen.findByText(texto, { selector: "span" });

beforeEach(() => {
  __resetCollections();
  __prime();
});

describe("CareerUpdateForm (gaps)", () => {
  const career = {
    id: "car1",
    title: "Medicina",
    description: "Salud",
    costCenter: "CC9",
    areaID: "a1",
  };
  beforeEach(() => {
    __setCollection("Area", [
      { id: "a1", title: "Deportes" },
      { id: "a2", title: "Artes" },
    ]);
  });

  test("reemplaza el área desde el badge, edita todos los campos con interceptor y guarda con onSubmit", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarTitle = jest.fn(async (value, resp) => resp);
    render(
      <CareerUpdateForm
        career={career}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ title: validarTitle }}
      />
    );
    expect(await screen.findByDisplayValue("Medicina")).toBeInTheDocument();
    expect(await badgeConTexto("Deportes - a1")).toBeInTheDocument();
    await drenar();

    // Editar el badge del área: abre el autocomplete con el display value.
    fireEvent.click(screen.getByText("Deportes - a1"));
    const areaInput = await screen.findByLabelText("Area");
    expect(areaInput).toHaveValue("Deportes - a1");
    // Teclear invalida la selección; en blur el requerido dispara error...
    fireEvent.change(areaInput, { target: { value: "Ar" } });
    fireEvent.blur(areaInput);
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    // ...onClear limpia el texto y volver a teclear re-ejecuta la validación.
    fireEvent.click(screen.getByRole("button", { name: "limpiar Area" }));
    expect(areaInput).toHaveValue("");
    fireEvent.change(areaInput, { target: { value: "Art" } });
    fireEvent.click(screen.getByRole("button", { name: "Artes - a2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Artes - a2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ areaID: "a2" }));
    await drenar(); // el cambio de areaID re-dispara resetStateValues

    // Editar los TextField DESPUÉS del cambio de relación (el reset los pisa).
    const titulo = screen.getByPlaceholderText("Nombre subárea");
    fireEvent.change(titulo, { target: { value: "Enfermería" } });
    fireEvent.blur(titulo);
    expect(validarTitle).toHaveBeenCalled();
    const descripcion = screen.getByLabelText("Descripción de la carrera");
    fireEvent.change(descripcion, { target: { value: "Cuidado directo" } });
    fireEvent.blur(descripcion);
    const centro = screen.getByLabelText("Centro de costos");
    fireEvent.change(centro, { target: { value: "" } });
    fireEvent.blur(centro);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enfermería" })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Cuidado directo" })
    );

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enfermería", areaID: "a2" })
    );
    // "" se convierte a null antes de guardar.
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "car1",
        title: "Enfermería",
        description: "Cuidado directo",
        costCenter: null,
        areaID: "a2",
      })
    );
  });

  test("quitar el área bloquea el guardado con error requerido; Add vacío no agrega y Cancel cierra el editor", async () => {
    render(<CareerUpdateForm career={career} />);
    expect(await badgeConTexto("Deportes - a1")).toBeInTheDocument();
    await drenar();

    // Quitar el badge con su ícono.
    fireEvent.click(screen.getByRole("button", { name: "button" }));
    await waitFor(() =>
      expect(screen.queryByText("Deportes - a1")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();

    // Add con el campo vacío no agrega nada: el editor sigue abierto.
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();

    // Cancel restaura el botón Add item.
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("button", { name: "Add item" })).toBeInTheDocument();
  });

  test("onError recibe el mensaje cuando DataStore.save falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin red"));
    const onError = jest.fn();
    const onSuccess = jest.fn();
    render(<CareerUpdateForm career={career} onError={onError} onSuccess={onSuccess} />);
    expect(await badgeConTexto("Deportes - a1")).toBeInTheDocument();
    await drenar();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Medicina", areaID: "a1" }),
        "sin red"
      )
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("AreaUpdateForm (gaps)", () => {
  const area = {
    id: "a1",
    title: "Deportes",
    description: "Área deportiva",
    costCenter: "CC1",
    campusID: "c1",
  };
  beforeEach(() => {
    __setCollection("Campus", [
      { id: "c1", title: "USFQ" },
      { id: "c2", title: "Quito" },
    ]);
    __setCollection("Career", [{ id: "car1", title: "Medicina" }]);
  });

  test("reemplaza el campus desde el badge, agrega una subárea y guarda todo con onSubmit", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarDescripcion = jest.fn(async (value, resp) => resp);
    render(
      <AreaUpdateForm
        area={area}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ description: validarDescripcion }}
      />
    );
    expect(await screen.findByDisplayValue("Deportes")).toBeInTheDocument();
    expect(await badgeConTexto("USFQ - c1")).toBeInTheDocument();
    await drenar();

    // Reemplazar el campus vía edición del badge.
    fireEvent.click(screen.getByText("USFQ - c1"));
    const campusInput = await screen.findByLabelText("Campus");
    expect(campusInput).toHaveValue("USFQ - c1");
    fireEvent.change(campusInput, { target: { value: "Qui" } });
    fireEvent.blur(campusInput); // requerido: error mientras no haya selección
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    fireEvent.change(campusInput, { target: { value: "Quit" } }); // re-valida con error activo
    fireEvent.click(screen.getByRole("button", { name: "Quito - c2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Quito - c2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ campusID: "c2" }));
    await drenar(); // cambiar campusID re-dispara resetStateValues

    // Vincular una subárea nueva.
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    const subInput = await screen.findByLabelText("Subareas");
    fireEvent.change(subInput, { target: { value: "Med" } });
    fireEvent.blur(subInput);
    fireEvent.click(screen.getByRole("button", { name: "Medicina - car1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("Medicina - car1")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        Carreras: expect.arrayContaining([expect.objectContaining({ id: "car1" })]),
      })
    );

    // Editar el badge de la subárea y cancelar: no cambia nada.
    fireEvent.click(screen.getByText("Medicina - car1"));
    expect(await screen.findByLabelText("Subareas")).toHaveValue("Medicina - car1");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await badgeConTexto("Medicina - car1")).toBeInTheDocument();

    // Editar los TextField después de los cambios de relaciones.
    const titulo = screen.getByPlaceholderText("Nombre área");
    fireEvent.change(titulo, { target: { value: "Deportes UIO" } });
    fireEvent.blur(titulo);
    const descripcion = screen.getByLabelText("Descripción del área");
    fireEvent.change(descripcion, { target: { value: "Sedes de deporte" } });
    fireEvent.blur(descripcion);
    expect(validarDescripcion).toHaveBeenCalled();
    const centro = screen.getByLabelText("Centro de costos");
    fireEvent.change(centro, { target: { value: "" } });
    fireEvent.blur(centro);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Deportes UIO", campusID: "c2" })
    );
    const saved = savedModels();
    // Vincula la subárea al área y guarda el área con "" -> null.
    expect(saved.find((s) => s.id === "car1")).toEqual(
      expect.objectContaining({ areaID: "a1" })
    );
    expect(saved.find((s) => s.id === "a1")).toEqual(
      expect.objectContaining({
        title: "Deportes UIO",
        description: "Sedes de deporte",
        costCenter: null,
        campusID: "c2",
      })
    );
  });

  test("quitar el campus bloquea el guardado con error requerido", async () => {
    render(<AreaUpdateForm area={area} />);
    expect(await badgeConTexto("USFQ - c1")).toBeInTheDocument();
    await drenar();
    fireEvent.click(screen.getByRole("button", { name: "button" }));
    await waitFor(() =>
      expect(screen.queryByText("USFQ - c1")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

describe("RoleUpdateForm (gaps)", () => {
  const u1 = { id: "u1", email: "ana@x.com" };
  const u2 = { id: "u2", email: "beto@x.com" };
  const role = () => ({
    id: "r1",
    name: "Editor",
    areas: ["Ventas"],
    users: { toArray: async () => [u1] },
  });
  beforeEach(() => {
    __setCollection("User", [u1, u2]);
  });

  test("edita un área desde su badge, agrega otra, vincula un usuario nuevo y guarda con onSubmit", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarName = jest.fn(async (value, resp) => resp);
    render(
      <RoleUpdateForm
        role={role()}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ name: validarName }}
      />
    );
    expect(await screen.findByDisplayValue("Editor")).toBeInTheDocument();
    expect(await badgeConTexto("ana@x.com - u1")).toBeInTheDocument();
    await drenar();

    // Editar el badge del área de texto libre.
    fireEvent.click(screen.getByText("Ventas"));
    const areasInput = await screen.findByLabelText("Areas");
    expect(areasInput).toHaveValue("Ventas");
    fireEvent.change(areasInput, { target: { value: "Ventas Norte" } });
    fireEvent.blur(areasInput);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Ventas Norte")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ areas: ["Ventas Norte"] })
    );
    // El editor se cierra asíncrono: esperar los DOS "Add item" (áreas y usuarios).
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Add item" })).toHaveLength(2)
    );

    // Agregar una segunda área.
    fireEvent.click(screen.getAllByRole("button", { name: "Add item" })[0]);
    const areasInput2 = await screen.findByLabelText("Areas");
    fireEvent.change(areasInput2, { target: { value: "Compras" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("Compras")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Add item" })).toHaveLength(2)
    );

    // Vincular al usuario u2 vía autocomplete (con onClear en el camino).
    fireEvent.click(screen.getAllByRole("button", { name: "Add item" })[1]);
    const usersInput = await screen.findByLabelText("Users");
    fireEvent.change(usersInput, { target: { value: "be" } });
    fireEvent.blur(usersInput);
    fireEvent.click(screen.getByRole("button", { name: "limpiar Users" }));
    expect(usersInput).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "beto@x.com - u2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("beto@x.com - u2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        users: expect.arrayContaining([expect.objectContaining({ id: "u2" })]),
      })
    );

    // Editar el nombre con validador custom en el blur.
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Editor Jefe" },
    });
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(validarName).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Editor Jefe" })
    );
    const saved = savedModels();
    expect(saved).toHaveLength(2);
    // u2 queda enlazado al rol; el rol se guarda con nombre y áreas nuevas.
    expect(saved.find((s) => s.id === "u2").role).toEqual(
      expect.objectContaining({ id: "r1" })
    );
    expect(saved.find((s) => s.id === "r1")).toEqual(
      expect.objectContaining({
        name: "Editor Jefe",
        areas: ["Ventas Norte", "Compras"],
      })
    );
  });

  test("Name vacío bloquea el submit; al teclear se re-valida y Reset restaura lo hidratado", async () => {
    render(<RoleUpdateForm role={role()} />);
    expect(await screen.findByDisplayValue("Editor")).toBeInTheDocument();
    expect(await badgeConTexto("ana@x.com - u1")).toBeInTheDocument();
    await drenar();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    // Teclear con el error activo re-ejecuta la validación y lo limpia.
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "E" } });
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );
    // Vaciar de nuevo y enviar: la validación del submit corta el guardado.
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.submit(screen.getByTestId("amplify-form"));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
    // Reset vuelve a los valores hidratados y limpia el error.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Editor");
    expect(screen.queryByText("The value is required")).not.toBeInTheDocument();
  });

  test("onError recibe el mensaje cuando falla el guardado del rol", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin permisos"));
    const onError = jest.fn();
    render(<RoleUpdateForm role={role()} onError={onError} />);
    expect(await badgeConTexto("ana@x.com - u1")).toBeInTheDocument();
    await drenar();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Editor" }),
        "sin permisos"
      )
    );
  });
});

describe("FormUpdateForm (gaps)", () => {
  const e0 = { id: "e0", title: "Expo" };
  const e9 = { id: "e9", title: "Feria", Form: { id: "f0", questions: "{}" } };
  const form = () => ({ id: "f1", questions: '{"x":1}', Event: e0 });
  beforeEach(() => {
    __setCollection("Event", [e0, e9]);
  });

  test("reemplaza el evento desde el badge y al guardar desvincula el anterior y el Form previo del nuevo", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarQuestions = jest.fn(async (value, resp) => resp);
    render(
      <FormUpdateForm
        form={form()}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ questions: validarQuestions }}
      />
    );
    expect(await screen.findByDisplayValue('{"x":1}')).toBeInTheDocument();
    expect(await badgeConTexto("Expo - e0")).toBeInTheDocument();
    await drenar();

    // Editar el badge del evento: teclear, limpiar, elegir el otro evento.
    fireEvent.click(screen.getByText("Expo - e0"));
    const eventInput = await screen.findByLabelText("Event");
    expect(eventInput).toHaveValue("Expo - e0");
    fireEvent.change(eventInput, { target: { value: "Fer" } });
    fireEvent.blur(eventInput);
    fireEvent.click(screen.getByRole("button", { name: "limpiar Event" }));
    expect(eventInput).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Feria - e9" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Feria - e9")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ Event: expect.objectContaining({ id: "e9" }) })
    );
    await drenar(); // cambiar Event re-dispara resetStateValues

    // JSON inválido -> error; corregirlo re-valida en el onChange.
    const questions = screen.getByLabelText("Questions");
    fireEvent.change(questions, { target: { value: "no json" } });
    fireEvent.blur(questions);
    expect(validarQuestions).toHaveBeenCalled();
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    fireEvent.change(questions, { target: { value: '{"x":2}' } });
    await waitFor(() =>
      expect(
        screen.queryByText("The value must be in a correct JSON format")
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ questions: '{"x":2}' })
    );
    const saved = savedModels();
    expect(saved).toHaveLength(4);
    // Desvincula e0, vincula e9, desvincula el Form previo (f0) y guarda f1.
    expect(saved.find((s) => s.id === "e0").Form).toBeUndefined();
    expect(saved.find((s) => s.id === "e9").Form).toEqual(
      expect.objectContaining({ id: "f1" })
    );
    expect(saved.some((s) => s.id === "f0")).toBe(true);
    expect(saved.find((s) => s.id === "f1")).toEqual(
      expect.objectContaining({ questions: '{"x":2}' })
    );
  });

  test("JSON inválido bloquea; Reset restaura; sin evento guarda questions '' como null", async () => {
    const onSuccess = jest.fn();
    render(<FormUpdateForm form={form()} onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue('{"x":1}')).toBeInTheDocument();
    expect(await badgeConTexto("Expo - e0")).toBeInTheDocument();
    await drenar();

    const questions = screen.getByLabelText("Questions");
    fireEvent.change(questions, { target: { value: "sin json" } });
    fireEvent.blur(questions);
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    fireEvent.submit(screen.getByTestId("amplify-form"));
    await waitFor(() => expect(DataStore.save).not.toHaveBeenCalled());

    // Reset restaura el valor hidratado y limpia el error.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Questions")).toHaveValue('{"x":1}');
    expect(
      screen.queryByText("The value must be in a correct JSON format")
    ).not.toBeInTheDocument();

    // Quitar el evento y guardar con questions vacío.
    fireEvent.click(screen.getByRole("button", { name: "button" }));
    await waitFor(() =>
      expect(screen.queryByText("Expo - e0")).not.toBeInTheDocument()
    );
    await drenar();
    fireEvent.change(screen.getByLabelText("Questions"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    expect(saved).toHaveLength(2);
    // Desvincula el evento anterior y guarda el form con questions null.
    expect(saved.find((s) => s.id === "e0").Form).toBeUndefined();
    expect(saved.find((s) => s.id === "f1")).toEqual(
      expect.objectContaining({ questions: null })
    );
  });
});

describe("PaymentLogUpdateForm (gaps)", () => {
  const ea1 = { id: "ea1", email: "pago@x.com" };
  const ea2 = { id: "ea2", email: "otro@x.com" };
  const paymentLog = () => ({
    id: "p1",
    eventattendeeID: "ea1",
    status: "pending",
    type: "cash",
  });
  beforeEach(() => {
    __setCollection("EventAttendee", [ea1, ea2]);
  });

  test("reemplaza el asistente desde el badge, edita status/type con interceptor y guarda con onSubmit", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarStatus = jest.fn(async (value, resp) => resp);
    render(
      <PaymentLogUpdateForm
        paymentLog={paymentLog()}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ status: validarStatus }}
      />
    );
    expect(await screen.findByDisplayValue("pending")).toBeInTheDocument();
    expect(await badgeConTexto("pago@x.com - ea1")).toBeInTheDocument();
    await drenar();

    // Editar el badge del asistente.
    fireEvent.click(screen.getByText("pago@x.com - ea1"));
    const eaInput = await screen.findByLabelText("Eventattendee id");
    expect(eaInput).toHaveValue("pago@x.com - ea1");
    fireEvent.change(eaInput, { target: { value: "ot" } });
    fireEvent.blur(eaInput); // requerido: error sin selección
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    fireEvent.change(eaInput, { target: { value: "otr" } }); // re-valida
    fireEvent.click(screen.getByRole("button", { name: "otro@x.com - ea2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("otro@x.com - ea2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ eventattendeeID: "ea2" })
    );
    await drenar(); // el cambio re-dispara resetStateValues

    const status = screen.getByLabelText("Status");
    fireEvent.change(status, { target: { value: "" } });
    fireEvent.blur(status);
    expect(validarStatus).toHaveBeenCalled();
    const type = screen.getByLabelText("Type");
    fireEvent.change(type, { target: { value: "card" } });
    fireEvent.blur(type);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "card" }));

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventattendeeID: "ea2", type: "card" })
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        eventattendeeID: "ea2",
        status: null, // "" -> null
        type: "card",
      })
    );
  });

  test("quitar el asistente bloquea con requerido; Cancel cierra el editor y Reset restaura", async () => {
    render(<PaymentLogUpdateForm paymentLog={paymentLog()} />);
    expect(await badgeConTexto("pago@x.com - ea1")).toBeInTheDocument();
    await drenar();

    fireEvent.click(screen.getByRole("button", { name: "button" }));
    await waitFor(() =>
      expect(screen.queryByText("pago@x.com - ea1")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(await screen.findByLabelText("Eventattendee id")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("button", { name: "Add item" })).toBeInTheDocument();

    // Reset restaura status/type hidratados (y limpia errores).
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "cambiado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Status")).toHaveValue("pending");
    expect(screen.queryByText("The value is required")).not.toBeInTheDocument();
  });
});

describe("SurveyCreateForm (gaps)", () => {
  const e1 = {
    id: "e1",
    title: "Expo",
    Survey: { id: "s0", emailSubject: "vieja" },
  };
  beforeEach(() => {
    __setCollection("Event", [e1]);
  });

  test("edita todos los campos con interceptor, corrige JSON inválidos y al crear desvincula la encuesta previa del evento", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarSubject = jest.fn(async (value, resp) => resp);
    render(
      <SurveyCreateForm
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ emailSubject: validarSubject }}
      />
    );

    // Questions: inválido -> error; corregir re-valida en el onChange.
    const questions = screen.getByLabelText("Questions");
    fireEvent.change(questions, { target: { value: "no json" } });
    fireEvent.blur(questions);
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    fireEvent.change(questions, { target: { value: '{"q":1}' } });
    await waitFor(() =>
      expect(
        screen.queryByText("The value must be in a correct JSON format")
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByLabelText("Active"));
    fireEvent.blur(screen.getByLabelText("Active"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ active: true }));

    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "Asunto" },
    });
    fireEvent.blur(screen.getByLabelText("Email subject"));
    expect(validarSubject).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Email intro"), {
      target: { value: "Hola" },
    });
    fireEvent.blur(screen.getByLabelText("Email intro"));
    fireEvent.change(screen.getByLabelText("Send at"), {
      target: { value: "2026-02-01T09:00" },
    });
    fireEvent.blur(screen.getByLabelText("Send at"));
    fireEvent.change(screen.getByLabelText("Sent at"), {
      target: { value: "2026-02-02T10:00" },
    });
    fireEvent.blur(screen.getByLabelText("Sent at"));

    // Insights: inválido -> error; corregir re-valida.
    const insights = screen.getByLabelText("Insights");
    fireEvent.change(insights, { target: { value: "mal" } });
    fireEvent.blur(insights);
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    fireEvent.change(insights, { target: { value: '{"i":1}' } });
    await waitFor(() =>
      expect(
        screen.queryByText("The value must be in a correct JSON format")
      ).not.toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText("Insights at"), {
      target: { value: "2026-02-03T11:00" },
    });
    fireEvent.blur(screen.getByLabelText("Insights at"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ emailIntro: "Hola" })
    );

    // Vincular el evento (teclear, blur, limpiar y elegir la opción).
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    const eventInput = await screen.findByLabelText("Event");
    fireEvent.change(eventInput, { target: { value: "Ex" } });
    fireEvent.blur(eventInput);
    fireEvent.click(screen.getByRole("button", { name: "limpiar Event" }));
    expect(eventInput).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Expo - e1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("Expo - e1")).toBeInTheDocument();
    // Esperar a que el editor se cierre (las opciones comparten el texto).
    await waitFor(() =>
      expect(screen.queryByLabelText("Event")).not.toBeInTheDocument()
    );

    // Editar el badge del evento y cancelar: el badge queda intacto.
    fireEvent.click(screen.getByText("Expo - e1", { selector: "span" }));
    expect(await screen.findByLabelText("Event")).toHaveValue("Expo - e1");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await badgeConTexto("Expo - e1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ emailSubject: "Asunto" })
    );
    const saved = savedModels();
    expect(saved).toHaveLength(3);
    // La encuesta nueva con los campos editados y fechas en ISO.
    expect(saved[0]).toEqual(
      expect.objectContaining({
        questions: '{"q":1}',
        active: true,
        emailSubject: "Asunto",
        emailIntro: "Hola",
        insights: '{"i":1}',
      })
    );
    expect(saved[0].sendAt).toEqual(expect.stringContaining("T"));
    expect(saved[0].sentAt).toEqual(expect.stringContaining("T"));
    expect(saved[0].insightsAt).toEqual(expect.stringContaining("T"));
    // Vincula el evento y desvincula la encuesta previa (s0).
    expect(saved.find((s) => s.id === "e1").Survey).toEqual(
      expect.objectContaining({ emailSubject: "Asunto" })
    );
    expect(saved.some((s) => s.id === "s0")).toBe(true);
    // clearOnSuccess restablece el formulario.
    await waitFor(() => expect(screen.getByLabelText("Questions")).toHaveValue(""));
    expect(screen.queryByText("Expo - e1")).not.toBeInTheDocument();
  });
});

describe("EventAttendeUpdateForm typo (gaps)", () => {
  const registro = () => ({
    id: "ea-9",
    eventID: "ev-1",
    attendeeID: "at-1",
    authorized: false,
    checkIn: true,
  });
  beforeEach(() => {
    __setCollection("Event", [
      { id: "ev-1", title: "Concierto" },
      { id: "ev-2", title: "Feria" },
    ]);
    __setCollection("Attendee", [
      { id: "at-1", name: "Ana" },
      { id: "at-2", name: "Beto" },
    ]);
  });

  test("reemplaza evento y asistente vía ArrayField, alterna los switches y guarda con onSubmit", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    const validarEvento = jest.fn(async (value, resp) => resp);
    render(
      <EventAttendeUpdateForm
        eventAttende={registro()}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={{ eventID: validarEvento }}
      />
    );
    expect(await badgeConTexto("Concierto - ev-1")).toBeInTheDocument();
    expect(await badgeConTexto("Ana - at-1")).toBeInTheDocument();
    await drenar();

    // Reemplazar el evento editando el badge.
    fireEvent.click(screen.getByText("Concierto - ev-1"));
    const eventInput = await screen.findByLabelText("Event id");
    expect(eventInput).toHaveValue("Concierto - ev-1");
    fireEvent.change(eventInput, { target: { value: "Fer" } });
    fireEvent.blur(eventInput); // requerido sin selección -> error
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    fireEvent.change(eventInput, { target: { value: "Feri" } }); // re-valida
    fireEvent.click(screen.getByRole("button", { name: "limpiar Event id" }));
    fireEvent.click(screen.getByRole("button", { name: "Feria - ev-2" }));
    // En esta plantilla el botón Save queda deshabilitado mientras haya error:
    // esperar a que la validación asíncrona del onSelect lo limpie.
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Feria - ev-2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ eventID: "ev-2" }));
    await drenar();

    // Quitar el asistente y agregar otro con "Add item".
    fireEvent.click(screen.getAllByRole("button", { name: "button" })[1]);
    await waitFor(() =>
      expect(screen.queryByText("Ana - at-1")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    const attendeeInput = await screen.findByLabelText("Attendee id");
    fireEvent.change(attendeeInput, { target: { value: "Be" } });
    fireEvent.blur(attendeeInput); // requerido sin selección -> error
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Beto - at-2" }));
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("Beto - at-2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ attendeeID: "at-2" })
    );
    await drenar();

    // Los switches se tocan al final (los resets de relaciones los pisan).
    fireEvent.click(screen.getByLabelText("Authorized"));
    fireEvent.blur(screen.getByLabelText("Authorized"));
    fireEvent.click(screen.getByLabelText("Check in"));
    fireEvent.blur(screen.getByLabelText("Check in"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ authorized: true, checkIn: false })
    );

    fireEvent.submit(screen.getByTestId("amplify-form"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventID: "ev-2", attendeeID: "at-2" })
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ea-9",
        eventID: "ev-2",
        attendeeID: "at-2",
        authorized: true,
        checkIn: false,
      })
    );
  });

  test("Cancel cierra el editor sin cambios, Reset restaura y quitar el evento bloquea el guardado", async () => {
    render(<EventAttendeUpdateForm eventAttende={registro()} />);
    expect(await badgeConTexto("Concierto - ev-1")).toBeInTheDocument();
    expect(await badgeConTexto("Ana - at-1")).toBeInTheDocument();
    await drenar();

    // Cancel en la edición del badge: el editor se cierra y el badge queda.
    fireEvent.click(screen.getByText("Concierto - ev-1"));
    expect(await screen.findByLabelText("Event id")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Event id")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Concierto - ev-1")).toBeInTheDocument();

    // Reset revierte el switch alterado.
    fireEvent.click(screen.getByLabelText("Authorized"));
    expect(screen.getByLabelText("Authorized")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Authorized")).not.toBeChecked();

    // Quitar el evento: el submit se corta por el requerido.
    fireEvent.click(screen.getAllByRole("button", { name: "button" })[0]);
    await waitFor(() =>
      expect(screen.queryByText("Concierto - ev-1")).not.toBeInTheDocument()
    );
    fireEvent.submit(screen.getByTestId("amplify-form"));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

describe("EventAttendeeUpdateForm (gaps)", () => {
  const pl1 = { id: "pl-1", status: "PAID" };
  const pl2 = { id: "pl-2", status: "DUE" };
  const registro = () => ({
    id: "ea-1",
    eventID: "ev-1",
    attendeeID: "at-1",
    email: "old@test.com",
    authorized: true,
    checkIn: false,
    formAnswers: "{}",
    ticket: "GEN",
    allowContact: false,
    quantity: 2,
    scanned: 0,
    profileURL: "",
    PaymentLogs: { toArray: async () => [pl1] },
  });
  // Quirk del generado: la validación de attendeeID pasa el id crudo por
  // getDisplayValue.attendeeID ((r) => r?.id) que da undefined y dispara
  // "Required". El escape documentado es un validador custom vía onValidate.
  const validarAttendeeIDSiempreOk = {
    attendeeID: async () => ({ hasError: false }),
  };
  beforeEach(() => {
    __setCollection("Event", [
      { id: "ev-1", title: "Concierto" },
      { id: "ev-2", title: "Feria" },
    ]);
    __setCollection("Attendee", [{ id: "at-1" }, { id: "at-2" }]);
    __setCollection("PaymentLog", [pl1, pl2]);
  });

  test("reemplaza evento y asistente, agrega un PaymentLog y guarda con todos los campos editados", async () => {
    const onSuccess = jest.fn();
    const onSubmit = jest.fn((fields) => fields);
    const onChange = jest.fn((fields) => fields);
    render(
      <EventAttendeeUpdateForm
        eventAttendee={registro()}
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );
    expect(await screen.findByDisplayValue("old@test.com")).toBeInTheDocument();
    expect(await badgeConTexto("Concierto - ev-1")).toBeInTheDocument();
    expect(await badgeConTexto("PAID - pl-1")).toBeInTheDocument();
    await drenar();

    // Reemplazar el evento editando el badge.
    fireEvent.click(screen.getByText("Concierto - ev-1"));
    const eventInput = await screen.findByLabelText("Event id");
    expect(eventInput).toHaveValue("Concierto - ev-1");
    fireEvent.change(eventInput, { target: { value: "Fer" } });
    fireEvent.blur(eventInput); // requerido sin selección
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    fireEvent.change(eventInput, { target: { value: "Feri" } }); // re-valida
    fireEvent.click(screen.getByRole("button", { name: "limpiar Event id" }));
    fireEvent.click(screen.getByRole("button", { name: "Feria - ev-2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("Feria - ev-2")).toBeInTheDocument();
    await drenar();

    // Reemplazar el asistente editando su badge.
    fireEvent.click(screen.getByText("at-1", { selector: "span" }));
    const attendeeInput = await screen.findByLabelText("Attendee id");
    expect(attendeeInput).toHaveValue("at-1");
    fireEvent.change(attendeeInput, { target: { value: "at" } });
    fireEvent.blur(attendeeInput);
    fireEvent.click(screen.getByRole("button", { name: "limpiar Attendee id" }));
    fireEvent.click(screen.getByRole("button", { name: "at-2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await badgeConTexto("at-2")).toBeInTheDocument();
    await drenar();

    // Agregar un PaymentLog nuevo (los vinculados quedan intactos).
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    const plInput = await screen.findByLabelText("Payment logs");
    fireEvent.change(plInput, { target: { value: "DU" } });
    fireEvent.blur(plInput);
    fireEvent.click(screen.getByRole("button", { name: "limpiar Payment logs" }));
    fireEvent.click(screen.getByRole("button", { name: "DUE - pl-2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await badgeConTexto("DUE - pl-2")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        PaymentLogs: expect.arrayContaining([expect.objectContaining({ id: "pl-2" })]),
      })
    );

    // Editar todos los campos escalares (después de los cambios de relación).
    const editar = (label, value) => {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
      fireEvent.blur(screen.getByLabelText(label));
    };
    editar("Email", "nuevo@test.com");
    editar("Form answers", '{"talla":"L"}');
    editar("Ticket", "VIP");
    editar("Quantity", "7");
    editar("Scanned", "3");
    editar("Profile url", "https://foto.test/n.png");
    fireEvent.click(screen.getByLabelText("Authorized"));
    fireEvent.blur(screen.getByLabelText("Authorized"));
    fireEvent.click(screen.getByLabelText("Check in"));
    fireEvent.blur(screen.getByLabelText("Check in"));
    fireEvent.click(screen.getByLabelText("Allow contact"));
    fireEvent.blur(screen.getByLabelText("Allow contact"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ ticket: "VIP", quantity: 7 })
    );

    fireEvent.submit(screen.getByTestId("amplify-form"));
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventID: "ev-2", attendeeID: "at-2" })
    );
    const saved = savedModels();
    // El PaymentLog nuevo queda enlazado al registro.
    expect(saved.find((s) => s.id === "pl-2")).toEqual(
      expect.objectContaining({ eventattendeeID: "ea-1" })
    );
    expect(saved.find((s) => s.id === "ea-1")).toEqual(
      expect.objectContaining({
        eventID: "ev-2",
        attendeeID: "at-2",
        email: "nuevo@test.com",
        formAnswers: '{"talla":"L"}',
        ticket: "VIP",
        quantity: 7,
        scanned: 3,
        profileURL: "https://foto.test/n.png",
        authorized: false,
        checkIn: true,
        allowContact: true,
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: "nuevo@test.com" })
    );
  });

  test("quitar un PaymentLog vinculado dispara onError: no puede desvincularse", async () => {
    const onError = jest.fn();
    const onSuccess = jest.fn();
    render(
      <EventAttendeeUpdateForm
        eventAttendee={registro()}
        onError={onError}
        onSuccess={onSuccess}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );
    expect(await badgeConTexto("PAID - pl-1")).toBeInTheDocument();
    await drenar();

    // Íconos de borrar: [0] evento, [1] asistente, [2] PaymentLog.
    fireEvent.click(screen.getAllByRole("button", { name: "button" })[2]);
    await waitFor(() =>
      expect(screen.queryByText("PAID - pl-1")).not.toBeInTheDocument()
    );

    fireEvent.submit(screen.getByTestId("amplify-form"));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toMatch(
      /cannot be unlinked from EventAttendee/
    );
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("Reset restaura lo hidratado y sin onValidate el quirk de attendeeID bloquea el submit", async () => {
    render(<EventAttendeeUpdateForm eventAttendee={registro()} />);
    expect(await screen.findByDisplayValue("old@test.com")).toBeInTheDocument();
    expect(await badgeConTexto("PAID - pl-1")).toBeInTheDocument();
    await drenar();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "editado@test.com" },
    });
    expect(screen.getByLabelText("Email")).toHaveValue("editado@test.com");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Email")).toHaveValue("old@test.com");

    // Sin el escape de onValidate, la validación de attendeeID falla y el
    // formulario queda con el Submit deshabilitado sin guardar.
    fireEvent.submit(screen.getByTestId("amplify-form"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled()
    );
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});
