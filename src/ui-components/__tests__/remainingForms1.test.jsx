/* Ola 3 — gaps de cobertura en formularios generados por Amplify Studio:
 * AttendeeCreateForm, AttendeeUpdateForm, UserCreateForm,
 * EventPermissionCreateForm y EventPermissionUpdateForm.
 * Mismo esquema de mocks de frontera que otherForms*.test.jsx.
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
  const Autocomplete = React.forwardRef(function Autocomplete(
    { label, value, options = [], onSelect, onChange, onBlur, placeholder },
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
        <ul>
          {options.map((opt) => (
            <li key={opt.id}>
              <button type="button" onClick={() => onSelect && onSelect(opt)}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
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
    return as === "form" ? <form onSubmit={onSubmit}>{children}</form> : <div>{children}</div>;
  }
  const Flex = ({ children }) => <div>{children}</div>;
  const ScrollView = ({ children }) => <div>{children}</div>;
  const Divider = () => <hr />;
  const Text = ({ children }) => <span>{children}</span>;
  const Badge = ({ children, onClick }) => <span onClick={onClick}>{children}</span>;
  const Icon = ({ ariaLabel, onClick }) => <i aria-label={ariaLabel} onClick={onClick} />;
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
    Text,
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
  };
});

// ./utils (real) importa estos módulos de Amplify:
jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(async () => ({})),
  signOut: jest.fn(async () => {}),
}));
jest.mock("aws-amplify/utils", () => ({
  Hub: { dispatch: jest.fn(), listen: jest.fn(() => jest.fn()) },
}));

import AttendeeCreateForm from "../AttendeeCreateForm";
import AttendeeUpdateForm from "../AttendeeUpdateForm";
import UserCreateForm from "../UserCreateForm";
import EventPermissionCreateForm from "../EventPermissionCreateForm";
import EventPermissionUpdateForm from "../EventPermissionUpdateForm";

const {
  DataStore,
  __prime,
  __setCollection,
  __resetCollections,
} = require("aws-amplify/datastore");

const savedModels = () => DataStore.save.mock.calls.map((c) => c[0]);

// Hidratación de update-forms en DOS olas (queryData + linked records lazy):
// drenar la cola de micro/macrotareas antes de interactuar.
const drain = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });
};

beforeEach(() => {
  __resetCollections();
  __prime();
});

describe("AttendeeCreateForm", () => {
  test("guarda el asistente (onChange/onSubmit incluidos) y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    const onSubmit = jest.fn((fields) => ({ ...fields, type: "vip" }));
    render(
      <AttendeeCreateForm onSuccess={onSuccess} onChange={onChange} onSubmit={onSubmit} />
    );
    const nombre = screen.getByLabelText("Nombre");
    fireEvent.change(nombre, { target: { value: "Ana" } });
    fireEvent.blur(nombre);
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "VIP" } });
    fireEvent.blur(screen.getByLabelText("Tipo"));
    fireEvent.change(screen.getByLabelText("Edad"), { target: { value: "30" } });
    fireEvent.blur(screen.getByLabelText("Edad"));
    fireEvent.change(screen.getByLabelText("Posición"), { target: { value: "Chair" } });
    fireEvent.blur(screen.getByLabelText("Posición"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "Ana" }));

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    // onSubmit transforma los campos antes de guardarse/reportarse
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ana", type: "VIP", age: "30", position: "Chair" })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ana", type: "vip", age: "30", position: "Chair" })
    );
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    // clearOnSuccess (default) limpia los campos
    await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue(""));
    expect(screen.getByLabelText("Posición")).toHaveValue("");
  });

  test("clearOnSuccess=false conserva los valores tras guardar", async () => {
    const onSuccess = jest.fn();
    render(<AttendeeCreateForm clearOnSuccess={false} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Luis" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    // los campos vacíos se normalizan a null en modelFields
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Luis", type: null, age: null, position: null })
    );
    expect(screen.getByLabelText("Nombre")).toHaveValue("Luis");
  });

  test("onError recibe el mensaje si falla; Cancelar dispara onCancel", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("boom"));
    const onError = jest.fn();
    const onCancel = jest.fn();
    render(<AttendeeCreateForm onError={onError} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ name: "Ana" }), "boom");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("UserCreateForm", () => {
  test("email es requerido: submit no guarda y el error se limpia al teclear", async () => {
    render(<UserCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@usfq.edu.ec" },
    });
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("crea el usuario con el rol elegido y limpia el formulario", async () => {
    __setCollection("Role", [{ id: "r1", name: "Admin" }]);
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(<UserCreateForm onSuccess={onSuccess} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@usfq.edu.ec" },
    });
    fireEvent.blur(screen.getByLabelText("Email"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ana" } });

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Admin - r1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Admin - r1")).toBeInTheDocument();
    // lengthLimit=1: ya no se ofrece "Add item"
    expect(screen.queryByRole("button", { name: "Add item" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@usfq.edu.ec",
        name: "Ana",
        role: expect.objectContaining({ id: "r1" }),
      })
    );
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue(""));
    expect(screen.queryByText("Admin - r1")).not.toBeInTheDocument();
  });

  test("editar/cancelar y quitar el rol; Clear limpia los campos", async () => {
    __setCollection("Role", [{ id: "r1", name: "Admin" }]);
    render(<UserCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    // teclear en el autocomplete y salir cubre onChange/onBlur del campo
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Adm" } });
    fireEvent.blur(screen.getByLabelText("Role"));
    fireEvent.click(screen.getByRole("button", { name: "Admin - r1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Admin - r1")).toBeInTheDocument();

    // click en el badge entra en modo edición y Cancel lo abandona
    fireEvent.click(screen.getByText("Admin - r1"));
    expect(screen.getByLabelText("Role")).toHaveValue("Admin - r1");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Admin - r1")).toBeInTheDocument();

    // el ícono elimina el rol y reaparece "Add item"
    fireEvent.click(screen.getByLabelText("button"));
    await waitFor(() =>
      expect(screen.queryByText("Admin - r1")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "x@y.z" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("onError recibe el mensaje si el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin permisos"));
    const onError = jest.fn();
    render(<UserCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.c" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.c" }),
      "sin permisos"
    );
  });
});

describe("EventPermissionCreateForm", () => {
  test("userID y eventID son requeridos: muestra errores y no guarda", async () => {
    render(<EventPermissionCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findAllByText("The value is required")).toHaveLength(2);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("crea el permiso con capabilities y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(<EventPermissionCreateForm onSuccess={onSuccess} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("User id"), { target: { value: "u1" } });
    fireEvent.blur(screen.getByLabelText("User id"));
    fireEvent.change(screen.getByLabelText("Event id"), { target: { value: "e1" } });

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "scan" },
    });
    fireEvent.blur(screen.getByLabelText("Capabilities"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("scan")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ userID: "u1", eventID: "e1", capabilities: ["scan"] })
    );
    await waitFor(() => expect(screen.getByLabelText("User id")).toHaveValue(""));
    expect(screen.queryByText("scan")).not.toBeInTheDocument();
  });

  test("Clear limpia lo tecleado y onError recibe el mensaje si falla", async () => {
    const onError = jest.fn();
    render(<EventPermissionCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("User id"), { target: { value: "u9" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("User id")).toHaveValue("");

    DataStore.save.mockRejectedValueOnce(new Error("rechazado"));
    fireEvent.change(screen.getByLabelText("User id"), { target: { value: "u1" } });
    fireEvent.change(screen.getByLabelText("Event id"), { target: { value: "e1" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("rechazado");
  });
});

describe("EventPermissionUpdateForm", () => {
  const permiso = {
    id: "p1",
    userID: "u1",
    eventID: "e1",
    capabilities: ["scan"],
  };

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<EventPermissionUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata desde el modelo, edita una capability existente y guarda", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(
      <EventPermissionUpdateForm
        eventPermission={permiso}
        onSuccess={onSuccess}
        onChange={onChange}
      />
    );
    await drain();
    expect(screen.getByLabelText("User id")).toHaveValue("u1");
    expect(screen.getByText("scan")).toBeInTheDocument();

    // click en el badge entra a editar esa capability y "Save" la reemplaza
    fireEvent.click(screen.getByText("scan"));
    expect(screen.getByLabelText("Capabilities")).toHaveValue("scan");
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "scan-badges" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("scan-badges")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("User id"), { target: { value: "u2" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        userID: "u2",
        eventID: "e1",
        capabilities: ["scan-badges"],
      })
    );
  });

  test("hidrata por id vía DataStore.query y Reset restaura los valores", async () => {
    __setCollection("EventPermission", [
      { id: "p2", userID: "user-x", eventID: "event-y", capabilities: ["scan"] },
    ]);
    render(<EventPermissionUpdateForm id="p2" />);
    await drain();
    expect(screen.getByLabelText("User id")).toHaveValue("user-x");
    expect(DataStore.query).toHaveBeenCalledWith(expect.anything(), "p2");

    fireEvent.change(screen.getByLabelText("User id"), { target: { value: "zz" } });
    // el ícono elimina la capability
    fireEvent.click(screen.getByLabelText("button"));
    await waitFor(() => expect(screen.queryByText("scan")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("User id")).toHaveValue("user-x");
    expect(screen.getByText("scan")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("userID vacío bloquea el submit con error requerido", async () => {
    render(
      <EventPermissionUpdateForm
        eventPermission={{ id: "p3", userID: "", eventID: "e1", capabilities: [] }}
      />
    );
    await drain();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("onError recibe el mensaje si el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("offline"));
    const onError = jest.fn();
    render(<EventPermissionUpdateForm eventPermission={permiso} onError={onError} />);
    await drain();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ userID: "u1", eventID: "e1" }),
      "offline"
    );
  });
});

describe("AttendeeUpdateForm", () => {
  const ea1 = { id: "ea1", email: "linked@x.com" };
  const ea2 = { id: "ea2", email: "nuevo@x.com" };
  const attendee = (linked = [ea1]) => ({
    id: "a1",
    EventAttendees: { toArray: async () => linked },
  });

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<AttendeeUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata los vinculados y enlaza un asistente nuevo al guardar", async () => {
    __setCollection("EventAttendee", [ea1, ea2]);
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(
      <AttendeeUpdateForm attendee={attendee()} onSuccess={onSuccess} onChange={onChange} />
    );
    expect(await screen.findByText("linked@x.com - ea1")).toBeInTheDocument();
    await drain();

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    // las opciones excluyen a los ya vinculados: solo aparece ea2
    expect(
      screen.queryByRole("button", { name: "linked@x.com - ea1" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "nuevo@x.com - ea2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("nuevo@x.com - ea2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    // enlaza el nuevo EventAttendee al attendee y re-guarda el Attendee
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ea2", attendeeID: "a1" }),
        expect.objectContaining({ id: "a1" }),
      ])
    );
    expect(saved.some((s) => s.id === "ea1" && s.attendeeID === "a1")).toBe(false);
  });

  test("quitar un vinculado dispara onError: no se puede desvincular", async () => {
    __setCollection("EventAttendee", [ea1]);
    const onError = jest.fn();
    render(<AttendeeUpdateForm attendee={attendee()} onError={onError} />);
    expect(await screen.findByText("linked@x.com - ea1")).toBeInTheDocument();
    await drain();

    fireEvent.click(screen.getByLabelText("button"));
    await waitFor(() =>
      expect(screen.queryByText("linked@x.com - ea1")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toMatch(/cannot be unlinked from Attendee/);
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("editar el badge, cancelar y Reset restaura el estado", async () => {
    __setCollection("EventAttendee", [ea1, ea2]);
    render(<AttendeeUpdateForm attendee={attendee()} />);
    expect(await screen.findByText("linked@x.com - ea1")).toBeInTheDocument();
    await drain();

    // click en el badge entra a edición con el display value cargado
    fireEvent.click(screen.getByText("linked@x.com - ea1"));
    expect(screen.getByLabelText("Event attendees")).toHaveValue("linked@x.com - ea1");
    // teclear invalida la selección actual y blur re-valida sin error
    fireEvent.change(screen.getByLabelText("Event attendees"), {
      target: { value: "otro" },
    });
    fireEvent.blur(screen.getByLabelText("Event attendees"));
    // "Save" sin selección concreta no altera los items
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("linked@x.com - ea1")).toBeInTheDocument();

    // quitar el badge y Reset lo restaura desde los linked records
    fireEvent.click(screen.getByLabelText("button"));
    await waitFor(() =>
      expect(screen.queryByText("linked@x.com - ea1")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(await screen.findByText("linked@x.com - ea1")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});
