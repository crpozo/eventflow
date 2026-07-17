/* Ola 3 — formularios generados por Amplify Studio que seguían a 0%:
 * BadgeCreateForm, BadgeUpdateForm, SurveyResponseCreateForm,
 * SurveyResponseUpdateForm, AttendeeCreateForm, AttendeeUpdateForm,
 * EventPermissionCreateForm, EventPermissionUpdateForm y UserCreateForm.
 * Mismo esquema de mocks de frontera que otherForms2.test.jsx.
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

import BadgeCreateForm from "../BadgeCreateForm";
import BadgeUpdateForm from "../BadgeUpdateForm";
import SurveyResponseCreateForm from "../SurveyResponseCreateForm";
import SurveyResponseUpdateForm from "../SurveyResponseUpdateForm";
import AttendeeCreateForm from "../AttendeeCreateForm";
import AttendeeUpdateForm from "../AttendeeUpdateForm";
import EventPermissionCreateForm from "../EventPermissionCreateForm";
import EventPermissionUpdateForm from "../EventPermissionUpdateForm";
import UserCreateForm from "../UserCreateForm";

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

describe("BadgeCreateForm", () => {
  test("guarda los diseños tecleados y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    render(<BadgeCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Front design"), {
      target: { value: "front.png" },
    });
    fireEvent.change(screen.getByLabelText("Back design"), {
      target: { value: "back.png" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ frontDesign: "front.png", backDesign: "back.png" })
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Front design")).toHaveValue("")
    );
  });

  test("convierte cadenas vacías en null al guardar", async () => {
    const onSuccess = jest.fn();
    render(<BadgeCreateForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith({ frontDesign: null, backDesign: null });
    expect(DataStore.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({ frontDesign: null, backDesign: null })
    );
  });

  test("onChange puede interceptar el valor y onSubmit transformar los campos", async () => {
    const onChange = jest.fn((fields) => ({
      ...fields,
      frontDesign: fields.frontDesign.toUpperCase(),
    }));
    const onSubmit = jest.fn((fields) => ({ ...fields, backDesign: "fijo.png" }));
    render(<BadgeCreateForm onChange={onChange} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Front design"), {
      target: { value: "abc" },
    });
    expect(screen.getByLabelText("Front design")).toHaveValue("ABC");
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ frontDesign: "ABC", backDesign: "fijo.png" })
    );
  });

  test("onError recibe el mensaje si falla; Clear resetea lo tecleado", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("boom"));
    const onError = jest.fn();
    render(<BadgeCreateForm onError={onError} />);
    const front = screen.getByLabelText("Front design");
    fireEvent.change(front, { target: { value: "x.png" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ frontDesign: "x.png" }),
      "boom"
    );
    // el formulario NO se limpia tras el error
    expect(front).toHaveValue("x.png");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(front).toHaveValue("");
  });
});

describe("BadgeUpdateForm", () => {
  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<BadgeUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata por idProp consultando DataStore y guarda con copyOf", async () => {
    __setCollection("Badge", [
      { id: "b1", frontDesign: "front-v1.png", backDesign: "back-v1.png" },
    ]);
    const onSuccess = jest.fn();
    render(<BadgeUpdateForm id="b1" onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue("front-v1.png")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Front design"), {
      target: { value: "front-v2.png" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "b1",
        frontDesign: "front-v2.png",
        backDesign: "back-v1.png",
      })
    );
  });

  test("hidrata por modelo, Reset restaura lo editado y onError reporta fallos", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin permisos"));
    const onError = jest.fn();
    render(
      <BadgeUpdateForm
        badge={{ id: "b2", frontDesign: "original.png", backDesign: "" }}
        onError={onError}
      />
    );
    const front = await screen.findByDisplayValue("original.png");
    fireEvent.change(front, { target: { value: "editado.png" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Front design")).toHaveValue("original.png");

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("sin permisos");
  });
});

describe("SurveyResponseCreateForm", () => {
  test("surveyID y eventID son requeridos: dos errores y no guarda", async () => {
    render(<SurveyResponseCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findAllByText("The value is required")).toHaveLength(2);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("valida JSON en answers y guarda cuando todo es válido", async () => {
    const onSuccess = jest.fn();
    render(<SurveyResponseCreateForm onSuccess={onSuccess} />);
    const answers = screen.getByLabelText("Answers");
    fireEvent.change(answers, { target: { value: "no json" } });
    fireEvent.blur(answers);
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(DataStore.save).not.toHaveBeenCalled();

    fireEvent.change(answers, { target: { value: '{"p1":"si"}' } });
    fireEvent.blur(answers);
    await waitFor(() =>
      expect(
        screen.queryByText("The value must be in a correct JSON format")
      ).not.toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText("Survey id"), {
      target: { value: "s1" },
    });
    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        surveyID: "s1",
        eventID: "e1",
        token: null,
        answers: '{"p1":"si"}',
      })
    );
    // clearOnSuccess limpia el formulario
    await waitFor(() => expect(screen.getByLabelText("Survey id")).toHaveValue(""));
  });

  test("onError recibe el mensaje si el guardado falla; Clear resetea", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("offline"));
    const onError = jest.fn();
    render(<SurveyResponseCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("Survey id"), {
      target: { value: "s9" },
    });
    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e9" },
    });
    fireEvent.change(screen.getByLabelText("Token"), {
      target: { value: "tok-9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ surveyID: "s9", token: "tok-9" }),
      "offline"
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Survey id")).toHaveValue("");
  });
});

describe("SurveyResponseUpdateForm", () => {
  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<SurveyResponseUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata (answers objeto se serializa a JSON) y guarda el token editado", async () => {
    const onSuccess = jest.fn();
    render(
      <SurveyResponseUpdateForm
        surveyResponse={{
          id: "sr1",
          surveyID: "s1",
          eventID: "e1",
          token: "tok-1",
          answers: { q1: "a" },
        }}
        onSuccess={onSuccess}
      />
    );
    expect(await screen.findByDisplayValue('{"q1":"a"}')).toBeInTheDocument();
    expect(screen.getByLabelText("Survey id")).toHaveValue("s1");
    fireEvent.change(screen.getByLabelText("Token"), {
      target: { value: "tok-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sr1",
        surveyID: "s1",
        eventID: "e1",
        token: "tok-2",
        answers: '{"q1":"a"}',
      })
    );
  });

  test("onChange intercepta cada campo y las validaciones se re-ejecutan al teclear", async () => {
    const onChange = jest.fn((fields) => fields);
    const onSuccess = jest.fn();
    render(
      <SurveyResponseUpdateForm
        surveyResponse={{
          id: "sr3",
          surveyID: "s1",
          eventID: "e1",
          token: "",
          answers: "{}",
        }}
        onChange={onChange}
        onSuccess={onSuccess}
      />
    );
    const surveyId = await screen.findByDisplayValue("s1");

    // fuerza el error Required y verifica que teclear lo re-valida y lo limpia
    fireEvent.change(surveyId, { target: { value: "" } });
    fireEvent.blur(surveyId);
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    fireEvent.change(surveyId, { target: { value: "s1b" } });
    await waitFor(() =>
      expect(screen.queryByText("The value is required")).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e1b" },
    });
    fireEvent.change(screen.getByLabelText("Token"), {
      target: { value: "tok-b" },
    });
    fireEvent.change(screen.getByLabelText("Answers"), {
      target: { value: '{"ok":1}' },
    });
    // onChange vio pasar los cuatro campos
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ answers: '{"ok":1}' })
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sr3",
        surveyID: "s1b",
        eventID: "e1b",
        token: "tok-b",
        answers: '{"ok":1}',
      })
    );
  });

  test("Reset restaura los valores hidratados tras editar", async () => {
    render(
      <SurveyResponseUpdateForm
        surveyResponse={{
          id: "sr4",
          surveyID: "s4",
          eventID: "e4",
          token: "t4",
          answers: "{}",
        }}
      />
    );
    const token = await screen.findByDisplayValue("t4");
    fireEvent.change(token, { target: { value: "otro" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Token")).toHaveValue("t4");
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("hidrata por idProp y reporta onError si el guardado falla", async () => {
    __setCollection("SurveyResponse", [
      { id: "sr2", surveyID: "s2", eventID: "e2", token: "t", answers: "{}" },
    ]);
    DataStore.save.mockRejectedValueOnce(new Error("conflicto"));
    const onError = jest.fn();
    render(<SurveyResponseUpdateForm id="sr2" onError={onError} />);
    expect(await screen.findByDisplayValue("s2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("conflicto");
  });
});

describe("AttendeeCreateForm", () => {
  test("entrega los campos tecleados a onSuccess y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    render(<AttendeeCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "estudiante" },
    });
    fireEvent.change(screen.getByLabelText("Edad"), {
      target: { value: "21" },
    });
    fireEvent.change(screen.getByLabelText("Posición"), {
      target: { value: "delantera" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith({
      name: "Ana",
      type: "estudiante",
      age: "21",
      position: "delantera",
    });
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue(""));
  });

  test("onError recibe los campos si falla; Cancelar dispara onCancel", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("rechazado"));
    const onError = jest.fn();
    const onCancel = jest.fn();
    render(<AttendeeCreateForm onError={onError} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Luis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Luis" }),
      "rechazado"
    );
    // no limpia tras el error
    expect(screen.getByLabelText("Nombre")).toHaveValue("Luis");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("AttendeeUpdateForm", () => {
  const attendee = {
    id: "at1",
    name: "Ana",
    EventAttendees: { toArray: async () => [{ id: "ea1", email: "viejo@x.com" }] },
  };

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<AttendeeUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata los vinculados y enlaza un EventAttendee nuevo al guardar", async () => {
    __setCollection("EventAttendee", [
      { id: "ea1", email: "viejo@x.com" },
      { id: "ea2", email: "nuevo@x.com" },
    ]);
    const onSuccess = jest.fn();
    render(<AttendeeUpdateForm attendee={attendee} onSuccess={onSuccess} />);
    // hidratación en dos olas: registro + linked records lazy
    expect(await screen.findByText("viejo@x.com - ea1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    // el ya vinculado no se ofrece como opción
    expect(
      screen.queryByRole("button", { name: "viejo@x.com - ea1" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "nuevo@x.com - ea2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("nuevo@x.com - ea2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ea2", attendeeID: "at1" }),
        expect.objectContaining({ id: "at1" }),
      ])
    );
    // el ya vinculado no se vuelve a guardar
    expect(saved.find((s) => s.id === "ea1")).toBeUndefined();
  });

  test("quitar un vinculado dispara onError (attendeeID es requerido) y no guarda", async () => {
    __setCollection("EventAttendee", [{ id: "ea1", email: "viejo@x.com" }]);
    const onError = jest.fn();
    render(<AttendeeUpdateForm attendee={attendee} onError={onError} />);
    expect(await screen.findByText("viejo@x.com - ea1")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("button"));
    await waitFor(() =>
      expect(screen.queryByText("viejo@x.com - ea1")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toMatch(/cannot be unlinked from Attendee/);
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

describe("EventPermissionCreateForm", () => {
  test("userID y eventID requeridos: dos errores y no guarda", async () => {
    render(<EventPermissionCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findAllByText("The value is required")).toHaveLength(2);
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("agrega, edita y guarda capabilities con el ArrayField", async () => {
    const onSuccess = jest.fn();
    render(<EventPermissionCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("User id"), {
      target: { value: "u1" },
    });
    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e1" },
    });

    // agrega "read"
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "read" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("read")).toBeInTheDocument();

    // edita el badge "read" -> "admin" (botón pasa a Save)
    fireEvent.click(screen.getByText("read"));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.queryByText("read")).not.toBeInTheDocument();

    // Cancel descarta lo tecleado sin agregarlo (espera a que ArrayField salga
    // del modo edición: setIsEditing(false) ocurre tras un await interno)
    fireEvent.click(await screen.findByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "temporal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("temporal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userID: "u1",
        eventID: "e1",
        capabilities: ["admin"],
      })
    );
    // clearOnSuccess limpia campos y badges
    await waitFor(() => expect(screen.getByLabelText("User id")).toHaveValue(""));
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  test("onError recibe el mensaje si el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("denegado"));
    const onError = jest.fn();
    render(<EventPermissionCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("User id"), {
      target: { value: "u2" },
    });
    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ userID: "u2", eventID: "e2" }),
      "denegado"
    );
  });
});

describe("EventPermissionUpdateForm", () => {
  const permiso = {
    id: "p1",
    userID: "u1",
    eventID: "e1",
    capabilities: ["read", "write"],
  };

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<EventPermissionUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  test("hidrata badges de capabilities, quita una y guarda con copyOf", async () => {
    const onSuccess = jest.fn();
    render(
      <EventPermissionUpdateForm eventPermission={permiso} onSuccess={onSuccess} />
    );
    expect(await screen.findByDisplayValue("u1")).toBeInTheDocument();
    expect(screen.getByText("read")).toBeInTheDocument();
    expect(screen.getByText("write")).toBeInTheDocument();

    // quita "read" (primer ícono de borrar)
    fireEvent.click(screen.getAllByLabelText("button")[0]);
    await waitFor(() => expect(screen.queryByText("read")).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("User id"), {
      target: { value: "u2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        userID: "u2",
        eventID: "e1",
        capabilities: ["write"],
      })
    );
  });

  test("agrega y edita capabilities en el update con onChange interceptando", async () => {
    const onChange = jest.fn((fields) => fields);
    const onSuccess = jest.fn();
    render(
      <EventPermissionUpdateForm
        eventPermission={{ id: "p2", userID: "u1", eventID: "e1", capabilities: [] }}
        onChange={onChange}
        onSuccess={onSuccess}
      />
    );
    expect(await screen.findByDisplayValue("u1")).toBeInTheDocument();

    // agrega "read"
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "read" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("read")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ capabilities: ["read"] })
    );

    // edita el badge -> "write"
    fireEvent.click(screen.getByText("read"));
    fireEvent.change(screen.getByLabelText("Capabilities"), {
      target: { value: "write" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("write")).toBeInTheDocument();
    expect(screen.queryByText("read")).not.toBeInTheDocument();

    // edita también los IDs pasando por el interceptor onChange
    fireEvent.change(screen.getByLabelText("Event id"), {
      target: { value: "e9" },
    });
    fireEvent.change(screen.getByLabelText("User id"), {
      target: { value: "u9" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p2",
        userID: "u9",
        eventID: "e9",
        capabilities: ["write"],
      })
    );
  });

  test("hidrata por idProp y Reset restaura; onError reporta fallos", async () => {
    __setCollection("EventPermission", [permiso]);
    DataStore.save.mockRejectedValueOnce(new Error("no autorizado"));
    const onError = jest.fn();
    render(<EventPermissionUpdateForm id="p1" onError={onError} />);
    expect(await screen.findByDisplayValue("u1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("User id"), {
      target: { value: "hackeado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("User id")).toHaveValue("u1");

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("no autorizado");
  });
});

describe("UserCreateForm", () => {
  test("email es requerido: error visible y no guarda", async () => {
    render(<UserCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("crea el usuario con el rol elegido en el Autocomplete y limpia", async () => {
    __setCollection("Role", [{ id: "r1", name: "Admin" }]);
    const onSuccess = jest.fn();
    render(<UserCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@usfq.edu.ec" },
    });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Admin - r1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Admin - r1")).toBeInTheDocument();
    // con lengthLimit=1 lleno ya no se ofrece "Add item"
    expect(
      screen.queryByRole("button", { name: "Add item" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@usfq.edu.ec",
        name: "Ana",
        role: expect.objectContaining({ id: "r1", name: "Admin" }),
      })
    );
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue(""));
    expect(screen.queryByText("Admin - r1")).not.toBeInTheDocument();
  });

  test("onError recibe el mensaje si el guardado falla; Clear resetea", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("duplicado"));
    const onError = jest.fn();
    render(<UserCreateForm onError={onError} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "rep@x.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ email: "rep@x.com" }),
      "duplicado"
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});
