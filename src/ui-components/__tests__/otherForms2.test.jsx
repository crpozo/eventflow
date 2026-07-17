/* Tests de formularios generados por Amplify Studio (parte 2):
 * AreaUpdateForm, CampusCreateForm, CampusUpdateForm y CareerCreateForm.
 * Mismo esquema de mocks de frontera que otherForms.test.jsx.
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

import AreaCreateForm from "../AreaCreateForm";
import AreaUpdateForm from "../AreaUpdateForm";
import CampusCreateForm from "../CampusCreateForm";
import CampusUpdateForm from "../CampusUpdateForm";
import CareerCreateForm from "../CareerCreateForm";
import CareerUpdateForm from "../CareerUpdateForm";
import FormCreateForm from "../FormCreateForm";
import FormUpdateForm from "../FormUpdateForm";
import PaymentLogCreateForm from "../PaymentLogCreateForm";
import PaymentLogUpdateForm from "../PaymentLogUpdateForm";

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

describe("AreaUpdateForm", () => {
  const baseArea = {
    id: "a1",
    title: "Deportes",
    description: "Área deportiva",
    costCenter: "CC1",
    campusID: "c1",
  };

  test("sin id ni modelo deshabilita Actualizar", () => {
    render(<AreaUpdateForm />);
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
  });

  test("hidrata los campos (con badge del campus) y guarda los cambios", async () => {
    __setCollection("Campus", [{ id: "c1", title: "USFQ" }]);
    const onSuccess = jest.fn();
    render(<AreaUpdateForm area={baseArea} onSuccess={onSuccess} />);

    expect(await screen.findByDisplayValue("Deportes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Área deportiva")).toBeInTheDocument();
    // el badge del campus resuelve el título desde los registros de Campus
    expect(await screen.findByText("USFQ - c1")).toBeInTheDocument();

    // Segunda ola de hidratación (linked records lazy → nuevo reset): bajo
    // carga de la suite completa puede aterrizar después del tecleo y
    // pisarlo. Drenar promesas/timers pendientes antes de escribir.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    fireEvent.change(
      screen.getByLabelText("Indica a los usuarios que área organiza los eventos"),
      { target: { value: "Deportes UIO" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", title: "Deportes UIO", campusID: "c1" })
    );
  });

  test("vincula una nueva subárea (Career) al guardar", async () => {
    __setCollection("Campus", [{ id: "c1", title: "USFQ" }]);
    __setCollection("Career", [{ id: "car1", title: "Medicina" }]);
    const onSuccess = jest.fn();
    render(<AreaUpdateForm area={baseArea} onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue("Deportes")).toBeInTheDocument();
    // espera a que el campus quede hidratado: con lengthLimit 1 lleno, su
    // ArrayField deja de ofrecer "Add item" y el único botón es el de Subareas
    expect(await screen.findByText("USFQ - c1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Medicina - car1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Medicina - car1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "car1", areaID: "a1" }),
        expect.objectContaining({ id: "a1", title: "Deportes" }),
      ])
    );
  });

  test("desvincular una subárea existente dispara onError (regla areaID requerido)", async () => {
    const carrera = { id: "car2", title: "Vieja" };
    __setCollection("Campus", [{ id: "c1", title: "USFQ" }]);
    __setCollection("Career", [carrera]);
    const onError = jest.fn();
    render(
      <AreaUpdateForm
        area={{ ...baseArea, Carreras: { toArray: async () => [carrera] } }}
        onError={onError}
      />
    );
    expect(await screen.findByText("Vieja - car2")).toBeInTheDocument();

    // los íconos de eliminar: [0] badge del campus, [1] badge de la subárea
    fireEvent.click(screen.getAllByLabelText("button")[1]);
    await waitFor(() =>
      expect(screen.queryByText("Vieja - car2")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toMatch(/cannot be unlinked from Area/);
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("el botón Cancelar dispara onCancel sin guardar", async () => {
    const onCancel = jest.fn();
    render(<AreaUpdateForm area={baseArea} onCancel={onCancel} />);
    expect(await screen.findByDisplayValue("Deportes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

describe("CampusCreateForm", () => {
  test("valida formato de teléfono y de email en blur", async () => {
    render(<CampusCreateForm />);
    const phone = screen.getByLabelText("Información de contacto télefono");
    fireEvent.change(phone, { target: { value: "abc" } });
    fireEvent.blur(phone);
    expect(
      await screen.findByText("The value must be a valid phone number")
    ).toBeInTheDocument();

    const email = screen.getByLabelText("Información de contacto email");
    fireEvent.change(email, { target: { value: "noesemail" } });
    fireEvent.blur(email);
    expect(
      await screen.findByText("The value must be a valid email address")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("guarda un campus nuevo y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    render(<CampusCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre campus"), {
      target: { value: "Cumbayá" },
    });
    fireEvent.change(screen.getByLabelText("Descripción del campus"), {
      target: { value: "Campus principal" },
    });
    fireEvent.change(screen.getByLabelText("Información de contacto télefono"), {
      target: { value: "+593 99 123 4567" },
    });
    fireEvent.change(screen.getByLabelText("Información de contacto email"), {
      target: { value: "info@usfq.edu.ec" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Cumbayá",
        description: "Campus principal",
        phone: "+593 99 123 4567",
        email: "info@usfq.edu.ec",
      })
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre campus")).toHaveValue("")
    );
  });

  test("onError recibe el mensaje si el guardado falla; Cancelar dispara onCancel", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("boom"));
    const onError = jest.fn();
    const onCancel = jest.fn();
    render(<CampusCreateForm onError={onError} onCancel={onCancel} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre campus"), {
      target: { value: "Norte" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Norte" }),
      "boom"
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("CampusUpdateForm", () => {
  const campus = {
    id: "c1",
    title: "Cumbayá",
    description: "Principal",
    phone: "+593 22971700",
    email: "info@usfq.edu.ec",
  };

  test("sin id ni modelo deshabilita Actualizar", () => {
    render(<CampusUpdateForm />);
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
  });

  test("hidrata el modelo y guarda todos los campos editados", async () => {
    const onSuccess = jest.fn();
    render(<CampusUpdateForm campus={campus} onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue("Cumbayá")).toBeInTheDocument();
    expect(screen.getByDisplayValue("info@usfq.edu.ec")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Nombre Campus"), {
      target: { value: "Cumbayá Norte" },
    });
    fireEvent.change(screen.getByLabelText("Descripción del campus"), {
      target: { value: "Sede norte" },
    });
    fireEvent.change(screen.getByLabelText("Información de contacto télefono"), {
      target: { value: "+593 99 000 1111" },
    });
    fireEvent.change(screen.getByLabelText("Información de contacto email"), {
      target: { value: "norte@usfq.edu.ec" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "c1",
        title: "Cumbayá Norte",
        description: "Sede norte",
        phone: "+593 99 000 1111",
        email: "norte@usfq.edu.ec",
      })
    );
  });

  test("onError recibe el mensaje si el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("offline"));
    const onError = jest.fn();
    render(<CampusUpdateForm campus={campus} onError={onError} />);
    expect(await screen.findByDisplayValue("Cumbayá")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("offline");
  });
});

describe("CareerCreateForm", () => {
  test("guarda una subárea nueva y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    render(<CareerCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre subárea"), {
      target: { value: "Medicina" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Ciencias de la salud" },
    });
    fireEvent.change(screen.getByLabelText("Centro de costos"), {
      target: { value: "CC9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Medicina",
        description: "Ciencias de la salud",
        costCenter: "CC9",
      })
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre subárea")).toHaveValue("")
    );
  });

  test("onError recibe el mensaje si falla; Cancelar dispara onCancel", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin red"));
    const onError = jest.fn();
    const onCancel = jest.fn();
    render(<CareerCreateForm onError={onError} onCancel={onCancel} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre subárea"), {
      target: { value: "Derecho" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Derecho" }),
      "sin red"
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("AreaCreateForm", () => {
  test("guarda un área nueva y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    render(<AreaCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre área"), {
      target: { value: "Cultura" },
    });
    fireEvent.change(screen.getByLabelText("Descripción del área"), {
      target: { value: "Eventos culturales" },
    });
    fireEvent.change(screen.getByLabelText("Centro de costos"), {
      target: { value: "CC5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Cultura",
        description: "Eventos culturales",
        costCenter: "CC5",
      })
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Nombre área")).toHaveValue("")
    );
  });

  test("onError recibe el mensaje si falla el guardado", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("error de red"));
    const onError = jest.fn();
    render(<AreaCreateForm onError={onError} />);
    fireEvent.change(screen.getByPlaceholderText("Nombre área"), {
      target: { value: "Cultura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("error de red");
  });
});

describe("CareerUpdateForm", () => {
  const career = {
    id: "car1",
    title: "Medicina",
    description: "Salud",
    costCenter: "CC9",
    areaID: "a1",
  };

  test("hidrata (badge del área) y guarda el título editado", async () => {
    __setCollection("Area", [{ id: "a1", title: "Deportes" }]);
    const onSuccess = jest.fn();
    render(<CareerUpdateForm career={career} onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue("Medicina")).toBeInTheDocument();
    expect(await screen.findByText("Deportes - a1")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Nombre subárea"), {
      target: { value: "Medicina Veterinaria" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "car1",
        title: "Medicina Veterinaria",
        areaID: "a1",
      })
    );
  });

  test("sin id ni modelo deshabilita Actualizar; Cancelar dispara onCancel", () => {
    const onCancel = jest.fn();
    render(<CareerUpdateForm onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("PaymentLogCreateForm", () => {
  test("eventattendeeID es requerido: muestra error y no guarda", async () => {
    render(<PaymentLogCreateForm />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("The value is required")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("crea el registro de pago con el asistente elegido y limpia", async () => {
    __setCollection("EventAttendee", [{ id: "ea1", email: "pago@x.com" }]);
    const onSuccess = jest.fn();
    render(<PaymentLogCreateForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "pago@x.com - ea1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("pago@x.com - ea1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "paid" },
    });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "card" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        eventattendeeID: "ea1",
        status: "paid",
        type: "card",
      })
    );
    await waitFor(() => expect(screen.getByLabelText("Status")).toHaveValue(""));
  });
});

describe("PaymentLogUpdateForm", () => {
  test("hidrata el registro y guarda el estado editado", async () => {
    __setCollection("EventAttendee", [{ id: "ea1", email: "pago@x.com" }]);
    const paymentLog = {
      id: "p1",
      eventattendeeID: "ea1",
      status: "pending",
      type: "cash",
    };
    const onSuccess = jest.fn();
    render(<PaymentLogUpdateForm paymentLog={paymentLog} onSuccess={onSuccess} />);
    expect(await screen.findByDisplayValue("pending")).toBeInTheDocument();
    expect(await screen.findByText("pago@x.com - ea1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "paid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", status: "paid", eventattendeeID: "ea1" })
    );
  });

  test("llama onError con el mensaje si el guardado falla", async () => {
    __setCollection("EventAttendee", [{ id: "ea1", email: "pago@x.com" }]);
    DataStore.save.mockRejectedValueOnce(new Error("rechazado"));
    const onError = jest.fn();
    render(
      <PaymentLogUpdateForm
        paymentLog={{ id: "p1", eventattendeeID: "ea1", status: "pending", type: "cash" }}
        onError={onError}
      />
    );
    expect(await screen.findByText("pago@x.com - ea1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("rechazado");
  });
});

describe("FormCreateForm", () => {
  test("rechaza JSON inválido en Questions y no guarda", async () => {
    render(<FormCreateForm />);
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: "no json" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(
      await screen.findByText("The value must be in a correct JSON format")
    ).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("crea el formulario y lo enlaza al evento elegido", async () => {
    __setCollection("Event", [{ id: "e1", title: "Expo" }]);
    const onSuccess = jest.fn();
    render(<FormCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: '{"campo":"nombre"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Expo - e1" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Expo - e1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    expect(saved[0]).toEqual(
      expect.objectContaining({ questions: '{"campo":"nombre"}' })
    );
    expect(saved[1]).toEqual(
      expect.objectContaining({
        id: "e1",
        Form: expect.objectContaining({ questions: '{"campo":"nombre"}' }),
      })
    );
    await waitFor(() => expect(screen.getByLabelText("Questions")).toHaveValue(""));
  });
});

describe("FormUpdateForm", () => {
  test("hidrata el modelo con su evento y guarda re-enlazando", async () => {
    const oldEvent = { id: "e0", title: "Expo" };
    __setCollection("Event", [oldEvent]);
    const onSuccess = jest.fn();
    render(
      <FormUpdateForm
        form={{ id: "f1", questions: '{"x":1}', Event: oldEvent }}
        onSuccess={onSuccess}
      />
    );
    expect(await screen.findByDisplayValue('{"x":1}')).toBeInTheDocument();
    expect(await screen.findByText("Expo - e0")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Questions"), {
      target: { value: '{"x":2}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const saved = savedModels();
    expect(saved).toHaveLength(3);
    // desvincula y vuelve a vincular el evento
    expect(saved.some((s) => s.id === "e0" && s.Form === undefined)).toBe(true);
    expect(saved.find((s) => s.id === "e0" && s.Form)).toBeTruthy();
    // guarda el formulario con las preguntas editadas
    expect(saved.find((s) => s.id === "f1")).toEqual(
      expect.objectContaining({ questions: '{"x":2}' })
    );
  });

  test("sin id ni modelo deshabilita Submit y Reset", () => {
    render(<FormUpdateForm />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });
});
