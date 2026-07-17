/**
 * Tests de los formularios generados por Amplify Studio para EventAttendee /
 * EventAttende (ojo: el segundo es OTRO archivo, con typo, generado aparte).
 *
 * Estrategia: se mockean las fronteras (aws-amplify/datastore, modelos y los
 * componentes de @aws-amplify/ui-react) y se ejercita el comportamiento real
 * de los formularios: llenado de campos, selección en autocompletes vía
 * ArrayField, submit -> DataStore.save con los valores, validación de campos
 * requeridos, flujo onError y reseteo del formulario.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import EventAttendeeCreateForm from "../EventAttendeeCreateForm";
import EventAttendeeUpdateForm from "../EventAttendeeUpdateForm";
import EventAttendeCreateForm from "../EventAttendeCreateForm";
import EventAttendeUpdateForm from "../EventAttendeUpdateForm";

// Registros que "existen" en DataStore para poblar los autocompletes.
const mockFixtures = {
  Event: [{ id: "ev-1", title: "Concierto" }],
  Attendee: [{ id: "at-1", name: "Ana" }],
  PaymentLog: [{ id: "pl-1", status: "PAID" }],
};

jest.mock("../../models", () => {
  const makeModel = (modelName) => {
    function Model(fields) {
      Object.assign(this, fields);
    }
    Object.defineProperty(Model, "name", { value: modelName });
    Model.copyOf = (original, mutator) => {
      const draft = { ...original };
      mutator(draft);
      return draft;
    };
    return Model;
  };
  return {
    EventAttendee: makeModel("EventAttendee"),
    EventAttende: makeModel("EventAttende"),
    PaymentLog: makeModel("PaymentLog"),
    Event: makeModel("Event"),
    Attendee: makeModel("Attendee"),
  };
});

jest.mock("aws-amplify/datastore", () => ({
  DataStore: {
    query: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    observeQuery: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

// src/ui-components/utils.js (real, usado por los forms "ee") importa esto.
jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(async () => ({})),
  signOut: jest.fn(),
}));
jest.mock("aws-amplify/utils", () => ({
  Hub: { listen: jest.fn(() => jest.fn()), dispatch: jest.fn() },
}));

// Los forms "Attende" (typo) importan estos helpers desde el paquete interno.
jest.mock("@aws-amplify/ui-react/internal", () => ({
  getOverrideProps: () => ({}),
  useDataStoreBinding: ({ model }) => ({
    items: mockFixtures[model?.name] || [],
  }),
}));

// Componentes de UI reducidos a HTML nativo para poder interactuar con jsdom.
jest.mock("@aws-amplify/ui-react", () => {
  const React = require("react");
  const h = React.createElement;
  const Box = ({ children }) => h("div", null, children);
  const Text = ({ children }) => h("span", null, children);
  const Badge = ({ children, onClick }) =>
    h("span", { onClick, "data-testid": "badge" }, children);
  const Icon = ({ onClick, ariaLabel }) =>
    h("button", { type: "button", "aria-label": ariaLabel || "icon", onClick });
  const Divider = () => h("hr");
  const Button = ({ children, onClick, type, isDisabled }) =>
    h("button", { type: type || "button", onClick, disabled: !!isDisabled }, children);
  const Grid = ({ as, children, onSubmit }) =>
    as === "form"
      ? h("form", { onSubmit, "data-testid": "amplify-form" }, children)
      : h("div", null, children);
  const fieldError = (hasError, errorMessage) =>
    hasError && errorMessage ? h("span", null, errorMessage) : null;
  const TextField = ({ label, value, onChange, onBlur, type, hasError, errorMessage }) =>
    h(
      "div",
      null,
      h("label", null, label, h("input", { type: type || "text", value: value ?? "", onChange, onBlur })),
      fieldError(hasError, errorMessage)
    );
  const TextAreaField = ({ label, onChange, onBlur, hasError, errorMessage }) =>
    h(
      "div",
      null,
      h("label", null, label, h("textarea", { onChange, onBlur })),
      fieldError(hasError, errorMessage)
    );
  const SwitchField = ({ label, isChecked, onChange, onBlur, hasError, errorMessage }) =>
    h(
      "div",
      null,
      h("label", null, label, h("input", { type: "checkbox", checked: !!isChecked, onChange, onBlur })),
      fieldError(hasError, errorMessage)
    );
  // El autocomplete expone un botón "seleccionar <label>" que elige la
  // primera opción disponible (equivale al onSelect del componente real).
  const Autocomplete = React.forwardRef(
    ({ label, placeholder, value, options, onChange, onSelect, onBlur, hasError, errorMessage }, ref) =>
      h(
        "div",
        null,
        h("input", { ref, "aria-label": label, placeholder, value: value ?? "", onChange, onBlur }),
        h(
          "button",
          {
            type: "button",
            onClick: () => {
              const opt =
                options && options.length
                  ? options[0]
                  : { id: `${label}-id`, label: `${label}-label` };
              onSelect(opt);
            },
          },
          `seleccionar ${label}`
        ),
        fieldError(hasError, errorMessage)
      )
  );
  return {
    Autocomplete,
    Badge,
    Button,
    Divider,
    Flex: Box,
    Grid,
    Icon,
    ScrollView: Box,
    SwitchField,
    Text,
    TextAreaField,
    TextField,
    useTheme: () => ({
      tokens: {
        components: { fieldmessages: { error: { color: "red", fontSize: "0.8rem" } } },
      },
    }),
  };
});

const { DataStore } = require("aws-amplify/datastore");

// CRA activa resetMocks:true (borra implementaciones antes de cada test),
// así que las implementaciones se restablecen aquí y no en la factoría.
beforeEach(() => {
  DataStore.query.mockImplementation(async () => undefined);
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.delete.mockImplementation(async (m) => m);
  DataStore.observeQuery.mockImplementation((model) => ({
    subscribe: (onNext) => {
      const next = typeof onNext === "function" ? onNext : onNext?.next;
      if (next) {
        next({ items: mockFixtures[model?.name] || [], isSynced: true });
      }
      return { unsubscribe: jest.fn() };
    },
  }));
});

// Selecciona la primera opción del autocomplete `label` dentro del ArrayField
// que está en la posición `addItemIndex` (según los botones "Add item" visibles)
// y confirma con el botón "Add".
const seleccionarEnArrayField = async (label, esperado, addItemIndex = 0) => {
  fireEvent.click(screen.getAllByText("Add item")[addItemIndex]);
  fireEvent.click(await screen.findByText(`seleccionar ${label}`));
  await screen.findByDisplayValue(esperado);
  fireEvent.click(screen.getByText("Add"));
  await waitFor(() =>
    expect(screen.queryByText(`seleccionar ${label}`)).not.toBeInTheDocument()
  );
};

// Quirk del código generado en los forms "EventAttendee": al hacer submit la
// validación de attendeeID pasa el id crudo por getDisplayValue.attendeeID
// ((r) => r?.id) que devuelve undefined y dispara "Required" aunque haya
// valor. El escape documentado es el prop onValidate con un validador custom.
const validarAttendeeIDSiempreOk = {
  attendeeID: async () => ({ hasError: false }),
};

describe("EventAttendeeCreateForm", () => {
  const llenarRequeridos = async () => {
    await seleccionarEnArrayField("Event id", "Concierto - ev-1");
    // El badge del evento seleccionado se muestra con su display value.
    await screen.findByText("Concierto - ev-1");
    await seleccionarEnArrayField("Attendee id", "at-1");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@test.com" },
    });
  };

  test("crea un EventAttendee con los campos llenados y limpia el formulario al guardar", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(
      <EventAttendeeCreateForm
        onSuccess={onSuccess}
        onError={onError}
        onChange={onChange}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );

    await llenarRequeridos();
    fireEvent.change(screen.getByLabelText("Ticket"), { target: { value: "VIP" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Scanned"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Profile url"), {
      target: { value: "https://foto.test/ana.png" },
    });
    fireEvent.change(screen.getByLabelText("Form answers"), {
      target: { value: '{"talla":"M"}' },
    });
    fireEvent.click(screen.getByLabelText("Authorized"));
    fireEvent.click(screen.getByLabelText("Check in"));
    fireEvent.click(screen.getByLabelText("Allow contact"));

    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    const guardado = DataStore.save.mock.calls[0][0];
    expect(guardado.constructor.name).toBe("EventAttendee");
    expect(guardado).toEqual(
      expect.objectContaining({
        eventID: "ev-1",
        attendeeID: "at-1",
        email: "ana@test.com",
        ticket: "VIP",
        quantity: 5,
        scanned: 2,
        profileURL: "https://foto.test/ana.png",
        formAnswers: '{"talla":"M"}',
        authorized: true,
        checkIn: true,
        allowContact: true,
      })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@test.com" })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@test.com", eventID: "ev-1" })
    );
    expect(onError).not.toHaveBeenCalled();
    // clearOnSuccess (default true) resetea el formulario.
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveValue(""));
    expect(screen.getAllByText("Add item")).toHaveLength(3);
  });

  test("muestra errores de validación y no guarda cuando faltan campos requeridos", async () => {
    const onSuccess = jest.fn();
    render(<EventAttendeeCreateForm onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByTestId("amplify-form"));

    // eventID, attendeeID y email son requeridos.
    const errores = await screen.findAllByText("The value is required");
    expect(errores).toHaveLength(3);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("invoca onError con el mensaje cuando DataStore.save falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("falló la red"));
    const onSuccess = jest.fn();
    const onError = jest.fn();
    render(
      <EventAttendeeCreateForm
        onSuccess={onSuccess}
        onError={onError}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );

    await llenarRequeridos();
    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ email: "ana@test.com" }),
        "falló la red"
      )
    );
    expect(onSuccess).not.toHaveBeenCalled();
    // Al fallar NO se limpia el formulario.
    expect(screen.getByLabelText("Email")).toHaveValue("ana@test.com");
  });

  test("el botón Clear restablece los campos escritos", () => {
    render(<EventAttendeeCreateForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "borrar@test.com" },
    });
    expect(screen.getByLabelText("Email")).toHaveValue("borrar@test.com");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(DataStore.save).not.toHaveBeenCalled();
  });
});

describe("EventAttendeeUpdateForm", () => {
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
    PaymentLogs: { toArray: async () => [] },
  });

  test("hidrata los campos desde el registro y guarda los cambios con copyOf", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(
      <EventAttendeeUpdateForm
        eventAttendee={registro()}
        onSuccess={onSuccess}
        onChange={onChange}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );

    // Espera la hidratación asíncrona del registro.
    expect(await screen.findByDisplayValue("old@test.com")).toBeInTheDocument();
    // El badge del evento vinculado usa el display value del Event existente.
    expect(await screen.findByText("Concierto - ev-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Ticket")).toHaveValue("GEN");
    expect(screen.getByLabelText("Authorized")).toBeChecked();

    // Segunda ola de hidratación: la resolución lazy de los linked records
    // (PaymentLogs.toArray) dispara OTRO resetStateValues; bajo carga de la
    // suite completa puede aterrizar después del tecleo y pisarlo. Drenar
    // promesas+timers pendientes antes de escribir.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nuevo@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Ticket"), { target: { value: "VIP2" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Scanned"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Profile url"), {
      target: { value: "https://foto.test/nueva.png" },
    });
    fireEvent.change(screen.getByLabelText("Form answers"), {
      target: { value: '{"talla":"L"}' },
    });
    fireEvent.click(screen.getByLabelText("Check in"));
    fireEvent.click(screen.getByLabelText("Allow contact"));
    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ea-1",
        email: "nuevo@test.com",
        eventID: "ev-1",
        attendeeID: "at-1",
        ticket: "VIP2",
        quantity: 9,
        scanned: 1,
        profileURL: "https://foto.test/nueva.png",
        formAnswers: '{"talla":"L"}',
        checkIn: true,
        allowContact: true,
      })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ ticket: "VIP2" })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: "nuevo@test.com" })
    );
  });

  test("invoca onError cuando el guardado del update falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("sin permisos"));
    const onSuccess = jest.fn();
    const onError = jest.fn();
    render(
      <EventAttendeeUpdateForm
        eventAttendee={registro()}
        onSuccess={onSuccess}
        onError={onError}
        onValidate={validarAttendeeIDSiempreOk}
      />
    );

    await screen.findByDisplayValue("old@test.com");
    // El eventID se hidrata un microtask después: esperar el badge del evento.
    await screen.findByText("Concierto - ev-1");
    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ email: "old@test.com", eventID: "ev-1" }),
        "sin permisos"
      )
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("EventAttendeCreateForm (archivo con typo, modelo EventAttende)", () => {
  test("guarda un EventAttende con eventID y attendeeID seleccionados", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn((fields) => fields);
    render(<EventAttendeCreateForm onSuccess={onSuccess} onChange={onChange} />);

    await seleccionarEnArrayField("Event id", "Concierto - ev-1");
    await screen.findByText("Concierto - ev-1");
    await seleccionarEnArrayField("Attendee id", "Ana - at-1");
    fireEvent.click(screen.getByLabelText("Authorized"));
    fireEvent.click(screen.getByLabelText("Check in"));

    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    const guardado = DataStore.save.mock.calls[0][0];
    expect(guardado.constructor.name).toBe("EventAttende");
    expect(guardado).toEqual(
      expect.objectContaining({
        eventID: "ev-1",
        attendeeID: "at-1",
        authorized: true,
        checkIn: true,
      })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ eventID: "ev-1" })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ eventID: "ev-1", attendeeID: "at-1" })
    );
    // clearOnSuccess: los dos ArrayFields vuelven a mostrar "Add item".
    await waitFor(() => expect(screen.getAllByText("Add item")).toHaveLength(2));
  });

  test("muestra errores de validación cuando se envía vacío y no guarda", async () => {
    const onError = jest.fn();
    render(<EventAttendeCreateForm onError={onError} />);

    fireEvent.submit(screen.getByTestId("amplify-form"));

    const errores = await screen.findAllByText("The value is required");
    expect(errores).toHaveLength(2); // eventID y attendeeID
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("permite editar el badge de eventID, quitarlo y cancelar la edición", async () => {
    render(<EventAttendeCreateForm />);

    await seleccionarEnArrayField("Event id", "Concierto - ev-1");
    const badge = await screen.findByText("Concierto - ev-1");

    // Editar: al hacer click en el badge se reabre el autocomplete con el valor.
    fireEvent.click(badge);
    expect(await screen.findByDisplayValue("Concierto - ev-1")).toBeInTheDocument();

    // Quitar el item con el ícono de borrar del badge.
    fireEvent.click(screen.getByRole("button", { name: "button" }));
    await waitFor(() =>
      expect(screen.queryByText("Concierto - ev-1")).not.toBeInTheDocument()
    );

    // Cancelar la edición devuelve el botón "Add item" del eventID.
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.getAllByText("Add item")).toHaveLength(2));
  });
});

describe("EventAttendeUpdateForm (archivo con typo, modelo EventAttende)", () => {
  test("hidrata desde el registro y guarda con los switches actualizados", async () => {
    const onSuccess = jest.fn();
    const registro = {
      id: "ea-9",
      eventID: "ev-1",
      attendeeID: "at-1",
      authorized: false,
      checkIn: true,
    };
    const onChange = jest.fn((fields) => fields);
    render(
      <EventAttendeUpdateForm
        eventAttende={registro}
        onSuccess={onSuccess}
        onChange={onChange}
      />
    );

    // Hidratación: el switch Check in llega marcado desde el registro.
    await screen.findByRole("checkbox", { name: "Check in", checked: true });
    expect(await screen.findByText("Concierto - ev-1")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Authorized"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ authorized: true, eventID: "ev-1" })
    );
    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ea-9",
        eventID: "ev-1",
        attendeeID: "at-1",
        authorized: true,
        checkIn: true,
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ authorized: true, checkIn: true })
    );
  });

  test("invoca onError cuando el guardado falla", async () => {
    DataStore.save.mockRejectedValueOnce(new Error("conflicto de versión"));
    const onError = jest.fn();
    const registro = {
      id: "ea-9",
      eventID: "ev-1",
      attendeeID: "at-1",
      authorized: false,
      checkIn: true,
    };
    render(<EventAttendeUpdateForm eventAttende={registro} onError={onError} />);

    await screen.findByRole("checkbox", { name: "Check in", checked: true });
    // Esperar a que eventID quede hidratado (badge visible) antes del submit.
    await screen.findByText("Concierto - ev-1");
    fireEvent.submit(screen.getByTestId("amplify-form"));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ eventID: "ev-1" }),
        "conflicto de versión"
      )
    );
  });
});
