/* Tests de formularios generados por Amplify Studio (parte 1):
 * SurveyCreateForm, SurveyUpdateForm, RoleCreateForm, RoleUpdateForm y
 * UserUpdateForm. Se mockean las fronteras de módulo (@aws-amplify/ui-react,
 * aws-amplify/datastore, aws-amplify/auth, aws-amplify/utils y models) y se
 * afirma el comportamiento real: hidratación, validaciones, guardado con
 * DataStore.save, enlaces/desenlaces de relaciones, onSuccess y onError.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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
  function SwitchField({ label, isChecked, onChange, onBlur }) {
    return (
      <label>
        {label}
        <input type="checkbox" checked={!!isChecked} onChange={onChange} onBlur={onBlur} />
      </label>
    );
  }
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
// OJO: CRA activa resetMocks, así que las implementaciones se re-aplican
// en cada beforeEach vía __prime().
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

import SurveyCreateForm from "../SurveyCreateForm";
import SurveyUpdateForm from "../SurveyUpdateForm";
import RoleCreateForm from "../RoleCreateForm";
import RoleUpdateForm from "../RoleUpdateForm";
import UserUpdateForm from "../UserUpdateForm";

const {
  DataStore,
  __prime,
  __setCollection,
  __resetCollections,
} = require("aws-amplify/datastore");

const savedModels = () => DataStore.save.mock.calls.map((c) => c[0]);

beforeEach(() => {
  __resetCollections();
  __prime();
});

describe("SurveyCreateForm", () => {
  test("rechaza JSON inválido en Questions: no guarda y deshabilita Submit", async () => {
    const onSuccess = jest.fn();
    render(<SurveyCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: "esto no es json" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    // al corregir el valor, el error se limpia en el onChange
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: '{"q1":"ok"}' },
    });
    await waitFor(() =>
      expect(
        screen.queryByText("The value must be in a correct JSON format")
      ).not.toBeInTheDocument()
    );
  });

  test("crea la encuesta, enlaza el Event elegido y limpia el formulario", async () => {
    __setCollection("Event", [{ id: "e1", title: "Expo" }]);
    const onSuccess = jest.fn();
    render(<SurveyCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: '{"q1":"¿Le gustó?"}' },
    });
    fireEvent.click(screen.getByLabelText("Active"));
    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "Encuesta post evento" },
    });
    fireEvent.change(screen.getByLabelText("Send at"), {
      target: { value: "2026-01-15T10:30" },
    });
    // vincular el evento vía ArrayField + Autocomplete
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Expo - e1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Expo - e1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const saved = savedModels();
    // primero guarda la Survey nueva (strings vacíos convertidos a null)
    expect(saved[0]).toEqual(
      expect.objectContaining({
        questions: '{"q1":"¿Le gustó?"}',
        active: true,
        emailSubject: "Encuesta post evento",
        emailIntro: null,
      })
    );
    expect(saved[0].sendAt).toEqual(expect.any(String));
    // luego enlaza el evento con la encuesta creada
    expect(saved[1]).toEqual(
      expect.objectContaining({
        id: "e1",
        Survey: expect.objectContaining({ emailSubject: "Encuesta post evento" }),
      })
    );
    // clearOnSuccess restablece los campos
    await waitFor(() => expect(screen.getByLabelText("Questions")).toHaveValue(""));
    expect(screen.getByLabelText("Active")).not.toBeChecked();
  });

  test("el botón Clear restablece los campos sin guardar", () => {
    render(<SurveyCreateForm />);
    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "Borrador" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Email subject")).toHaveValue("");
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("llama onError con el mensaje cuando DataStore.save falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("falló la red"));
    const onError = jest.fn();
    const onSuccess = jest.fn();
    render(<SurveyCreateForm onError={onError} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "X" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ emailSubject: "X" }),
      "falló la red"
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("SurveyUpdateForm", () => {
  const baseSurvey = {
    id: "s1",
    questions: '{"a":1}',
    active: true,
    emailSubject: "Hola",
    emailIntro: "",
    sendAt: "",
    sentAt: "",
    insights: "",
    insightsAt: "",
  };

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<SurveyUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata campos desde el modelo y al guardar re-enlaza el evento", async () => {
    const oldEvent = { id: "e0", title: "Viejo" };
    const survey = { ...baseSurvey, Event: oldEvent };
    __setCollection("Event", [oldEvent, { id: "e9", title: "Nuevo" }]);
    const onSuccess = jest.fn();
    render(<SurveyUpdateForm survey={survey} onSuccess={onSuccess} />);

    expect(await screen.findByDisplayValue('{"a":1}')).toBeInTheDocument();
    expect(screen.getByLabelText("Active")).toBeChecked();
    expect(await screen.findByText("Viejo - e0")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "Hola v2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const saved = savedModels();
    expect(saved).toHaveLength(3);
    // desvincula el evento anterior
    expect(saved.some((s) => s.id === "e0" && s.Survey === undefined)).toBe(true);
    // vuelve a vincular el evento con la encuesta
    const linkSave = saved.find((s) => s.id === "e0" && s.Survey);
    expect(linkSave.Survey).toEqual(expect.objectContaining({ id: "s1" }));
    // guarda la encuesta con el campo editado
    expect(saved.find((s) => s.id === "s1")).toEqual(
      expect.objectContaining({ emailSubject: "Hola v2", questions: '{"a":1}' })
    );
  });

  test("edita todos los campos con interceptor onChange y reemplaza el evento desde el badge", async () => {
    const oldEvent = { id: "e0", title: "Viejo" };
    const newEvent = { id: "e9", title: "Nuevo" };
    __setCollection("Event", [oldEvent, newEvent]);
    const onChange = jest.fn((fields) => fields);
    render(
      <SurveyUpdateForm
        survey={{ ...baseSurvey, Event: oldEvent }}
        onChange={onChange}
      />
    );
    expect(await screen.findByText("Viejo - e0")).toBeInTheDocument();

    // cada handler pasa por el interceptor onChange
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: '{"b":2}' },
    });
    fireEvent.click(screen.getByLabelText("Active")); // desactiva el switch
    fireEvent.change(screen.getByLabelText("Email intro"), {
      target: { value: "Gracias por asistir" },
    });
    fireEvent.change(screen.getByLabelText("Send at"), {
      target: { value: "2026-02-01T09:00" },
    });
    fireEvent.change(screen.getByLabelText("Sent at"), {
      target: { value: "2026-02-02T09:00" },
    });
    fireEvent.change(screen.getByLabelText("Insights"), {
      target: { value: '{"i":1}' },
    });
    fireEvent.change(screen.getByLabelText("Insights at"), {
      target: { value: "2026-02-03T09:00" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ emailIntro: "Gracias por asistir" })
    );
    expect(screen.getByLabelText("Active")).not.toBeChecked();

    // click en el badge del evento abre el editor del ArrayField
    fireEvent.click(screen.getByText("Viejo - e0"));
    const eventInput = await screen.findByLabelText("Event");
    fireEvent.change(eventInput, { target: { value: "Nue" } });
    fireEvent.blur(eventInput);
    // selecciona el otro evento y guarda la edición del badge
    fireEvent.click(screen.getByRole("button", { name: "Nuevo - e9" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Nuevo - e9")).toBeInTheDocument();
    expect(screen.queryByText("Viejo - e0")).not.toBeInTheDocument();
  });

  test("el botón Cancel del editor del evento restaura el estado sin cambios", async () => {
    const oldEvent = { id: "e0", title: "Viejo" };
    __setCollection("Event", [oldEvent]);
    render(<SurveyUpdateForm survey={{ ...baseSurvey, Event: oldEvent }} />);
    expect(await screen.findByText("Viejo - e0")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Viejo - e0"));
    expect(await screen.findByLabelText("Event")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Event")).not.toBeInTheDocument()
    );
    // el badge sigue intacto
    expect(screen.getByText("Viejo - e0")).toBeInTheDocument();
  });

  test("Reset restaura los valores hidratados del modelo", async () => {
    render(<SurveyUpdateForm survey={{ ...baseSurvey }} />);
    expect(await screen.findByDisplayValue("Hola")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email subject"), {
      target: { value: "Otro" },
    });
    expect(screen.getByLabelText("Email subject")).toHaveValue("Otro");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Email subject")).toHaveValue("Hola");
  });

  test("llama onError si el guardado del update falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin conexión"));
    const onError = jest.fn();
    render(<SurveyUpdateForm survey={{ ...baseSurvey }} onError={onError} />);
    expect(await screen.findByDisplayValue("Hola")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("sin conexión");
  });
});

describe("RoleCreateForm", () => {
  test("Name es requerido: muestra error, no guarda y deshabilita Submit", async () => {
    const onSuccess = jest.fn();
    render(<RoleCreateForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    // al escribir un nombre el error desaparece
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Admin" } });
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );
  });

  test("crea el rol con áreas y usuarios enlazados y limpia el formulario", async () => {
    __setCollection("User", [{ id: "u1", email: "ana@usfq.edu.ec" }]);
    const onSuccess = jest.fn();
    render(<RoleCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Admin" } });

    // agrega un área (texto libre)
    fireEvent.click(screen.getAllByRole("button", { name: "Add item" })[0]);
    fireEvent.change(screen.getByLabelText("Areas"), {
      target: { value: "Marketing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Marketing")).toBeInTheDocument();

    // agrega un usuario existente vía Autocomplete
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Add item" })).toHaveLength(2)
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Add item" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "ana@usfq.edu.ec - u1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("ana@usfq.edu.ec - u1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Admin", areas: ["Marketing"] })
      )
    );
    const saved = savedModels();
    expect(saved[0]).toEqual(
      expect.objectContaining({ name: "Admin", areas: ["Marketing"] })
    );
    // el usuario queda enlazado al rol creado
    expect(saved[1]).toEqual(
      expect.objectContaining({
        id: "u1",
        role: expect.objectContaining({ name: "Admin" }),
      })
    );
    // clearOnSuccess
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
  });

  test("llama onError con el mensaje si falla el guardado", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("permiso denegado"));
    const onError = jest.fn();
    render(<RoleCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Admin" }),
      "permiso denegado"
    );
  });
});

describe("RoleUpdateForm", () => {
  test("hidrata nombre, áreas y usuarios; al quitar un usuario lo desvincula al guardar", async () => {
    const user1 = { id: "u1", email: "ana@x.com" };
    const role = {
      id: "r1",
      name: "Editor",
      areas: ["Ventas"],
      users: { toArray: async () => [user1] },
    };
    const onSuccess = jest.fn();
    render(<RoleUpdateForm role={role} onSuccess={onSuccess} />);

    expect(await screen.findByDisplayValue("Editor")).toBeInTheDocument();
    expect(screen.getByText("Ventas")).toBeInTheDocument();
    expect(await screen.findByText("ana@x.com - u1")).toBeInTheDocument();

    // quita el usuario con el ícono de eliminar de su badge
    fireEvent.click(screen.getAllByLabelText("button")[1]);
    await waitFor(() =>
      expect(screen.queryByText("ana@x.com - u1")).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Editor Senior" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const saved = savedModels();
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "u1", role: null }),
        expect.objectContaining({ id: "r1", name: "Editor Senior" }),
      ])
    );
  });

  test("sin id ni modelo deshabilita Submit", () => {
    render(<RoleUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});

describe("UserUpdateForm", () => {
  test("con idProp consulta el registro en DataStore y lo hidrata", async () => {
    __setCollection("User", [{ id: "u7", email: "leo@x.com", name: "Leo" }]);
    render(<UserUpdateForm id="u7" />);
    expect(await screen.findByDisplayValue("leo@x.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Leo");
    expect(DataStore.query).toHaveBeenCalledWith(expect.anything(), "u7");
  });

  test("Email requerido: error en blur y Submit deshabilitado", async () => {
    render(<UserUpdateForm user={{ id: "u1", email: "a@x.com", name: "Ana" }} />);
    expect(await screen.findByDisplayValue("a@x.com")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Email"));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("asigna un rol desde el Autocomplete y guarda los cambios", async () => {
    __setCollection("Role", [{ id: "r1", name: "Admin" }]);
    const onSuccess = jest.fn();
    render(
      <UserUpdateForm
        user={{ id: "u1", email: "a@x.com", name: "Ana" }}
        onSuccess={onSuccess}
      />
    );
    expect(await screen.findByDisplayValue("a@x.com")).toBeInTheDocument();
    // primero el rol: al cambiar `role` el efecto resetStateValues vuelve a
    // hidratar los campos, así que el nombre se edita después
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Admin - r1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Admin - r1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ana María" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        name: "Ana María",
        role: expect.objectContaining({ id: "r1" }),
      })
    );
  });

  test("llama onError con el mensaje si el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin permisos"));
    const onError = jest.fn();
    render(
      <UserUpdateForm
        user={{ id: "u1", email: "a@x.com", name: "Ana" }}
        onError={onError}
      />
    );
    expect(await screen.findByDisplayValue("a@x.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("sin permisos");
  });
});
