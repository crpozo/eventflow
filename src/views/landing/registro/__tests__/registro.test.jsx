/**
 * Tests de la vista pública de registro (src/views/landing/registro/index.jsx).
 *
 * Mocks en frontera de módulo:
 *  - jquery / formBuilder / jquery-ui-sortable (imports dinámicos): jq(el)
 *    devuelve { empty, formRender }. formRender(config) registra la definición
 *    renderizada e inyecta `.rendered-form` (para el validateForm real);
 *    formRender("userData") devuelve las respuestas fixture.
 *  - aws-amplify/datastore: observeQuery captura los subscribers para emitir
 *    manualmente; query/save configurables por test.
 *  - models: constructores fake con ids estables (Attendee -> attendee-1,
 *    EventAttendee -> ea-new).
 *  - scripts/translateFormData: espía para verificar el guard de identidad.
 *  - services/nomina/validateBannerCode: ok:true por defecto.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Registro from "views/landing/registro";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("jquery", () => {
  const state = { userData: [], renderedConfigs: [] };
  const jq = (el) => ({
    empty: () => {
      if (el && typeof el.innerHTML === "string") el.innerHTML = "";
    },
    formRender: (arg) => {
      if (arg === "userData") return state.userData;
      state.renderedConfigs.push(arg);
      if (el && typeof el.innerHTML === "string") {
        el.innerHTML = '<div class="rendered-form"></div>';
      }
      return undefined;
    },
  });
  jq.__state = state;
  return { __esModule: true, default: jq };
});
jest.mock("jquery-ui-sortable", () => ({}));
jest.mock("formBuilder", () => ({}));
jest.mock("formBuilder/dist/form-render.min.js", () => ({}));
jest.mock("html2pdf.js", () => ({
  __esModule: true,
  // set() devuelve undefined: toda la cadena from().toCanvas()... se corta con
  // optional chaining en handleExport sin generar PDF real.
  default: jest.fn(() => ({ set: jest.fn(() => undefined) })),
}));

jest.mock("aws-amplify/datastore", () => {
  const subs = [];
  return {
    __subs: subs,
    DataStore: {
      observeQuery: jest.fn(() => ({
        subscribe: (cb) => {
          subs.push(cb);
          return { unsubscribe: jest.fn() };
        },
      })),
      query: jest.fn(async () => []),
      save: jest.fn(async (m) => m),
      delete: jest.fn(async (m) => m),
    },
  };
});

jest.mock("aws-amplify/storage", () => ({
  uploadData: jest.fn(() => ({ result: Promise.resolve({ key: "k" }) })),
  getUrl: jest.fn(async () => ({ url: { pathname: "/public/ticket.txt" } })),
}));

jest.mock("aws-amplify/api", () => ({
  generateClient: () => ({
    graphql: jest.fn(async () => ({ data: {} })),
    cancel: jest.fn(),
  }),
  post: jest.fn(async () => ({ body: { json: async () => ({}) } })),
}));

jest.mock("models", () => {
  function Attendee(init = {}) {
    Object.assign(this, init);
    this.id = "attendee-1";
  }
  function EventAttendee(init = {}) {
    Object.assign(this, init);
    this.id = "ea-new";
  }
  EventAttendee.copyOf = (orig, mutator) => {
    const copy = { ...orig };
    mutator(copy);
    return copy;
  };
  return { __esModule: true, Form: { name: "Form" }, Attendee, EventAttendee };
});

jest.mock("scripts/translateFormData", () => ({
  translateFormData: jest.fn(async (data) => data),
  restoreOriginalLabels: jest.fn((captured) => captured),
  translateString: jest.fn(async (s) => s),
}));

jest.mock("services/nomina/validateBannerCode", () => ({
  validateBannerCode: jest.fn(async () => ({ ok: true })),
}));

const { DataStore, __subs } = require("aws-amplify/datastore");
const { uploadData, getUrl } = require("aws-amplify/storage");
const jqState = require("jquery").default.__state;
const {
  translateFormData,
  restoreOriginalLabels,
  translateString,
} = require("scripts/translateFormData");
const { validateBannerCode } = require("services/nomina/validateBannerCode");
const html2pdfMock = require("html2pdf.js").default;

const questionsFixture = () => [
  {
    type: "text",
    name: "nombres",
    label: "Nombres completos",
    className: "form-control",
  },
  {
    type: "text",
    subtype: "email",
    name: "email",
    label: "Correo electrónico",
    className: "form-control",
  },
];

const userDataFixture = () => [
  { name: "nombres", label: "Nombres completos", userData: ["Juan Pérez"] },
  { name: "email", label: "Correo electrónico", userData: ["Juan@Test.com"] },
  { name: "identificacion", label: "Identificación", userData: ["1712345678"] },
];

const paidUserDataFixture = () => [
  ...userDataFixture(),
  { name: "direccion", label: "Dirección", userData: ["Calle Falsa 123"] },
  { name: "telefono", label: "Teléfono", userData: ["0999999999"] },
];

const baseProps = (overrides = {}) => ({
  userData: [],
  setUserData: jest.fn(),
  quantityProp: 1,
  price: "$10",
  eventID: "event-1",
  showRegister: true,
  setShowRegister: jest.fn(),
  event: {
    id: "event-1",
    date: "2026-08-01T15:00:00.000Z",
    location: "Quito",
    sendCertificates: false,
  },
  eventAttendeeProp: null,
  lang: "ES",
  landing: { cost: "Gratuito", title: "Evento Test", userConsentCheck: null },
  ...overrides,
});

const renderRegistro = (overrides) => {
  const props = baseProps(overrides);
  const utils = render(
    <MemoryRouter initialEntries={["/landing/event-1"]}>
      <Routes>
        <Route path="/landing/:id" element={<Registro {...props} />} />
      </Routes>
    </MemoryRouter>
  );
  return { props, ...utils };
};

// Emula un emit de DataStore.observeQuery(Form, ...)
const emitForm = (payload) => {
  act(() => {
    __subs.forEach((cb) => cb(payload));
  });
};

// Espera a que el formRender mock haya recibido una definición NO vacía y la devuelve.
const waitForFormRendered = async () => {
  await waitFor(() => {
    const cfgs = jqState.renderedConfigs;
    expect(cfgs.length).toBeGreaterThan(0);
    const last = cfgs[cfgs.length - 1];
    expect(Array.isArray(last.formData) && last.formData.length > 0).toBe(true);
  });
  return jqState.renderedConfigs[jqState.renderedConfigs.length - 1];
};

beforeEach(() => {
  // CRA activa resetMocks: las implementaciones de los jest.fn definidos en
  // las factorías de jest.mock se BORRAN antes de cada test — se re-priman aquí.
  DataStore.observeQuery.mockImplementation((_model, predicate) => {
    // Ejercita el predicado como lo haría el DataStore real.
    if (typeof predicate === "function") {
      predicate({ formEventId: { eq: jest.fn() } });
    }
    return {
      subscribe: (cb) => {
        __subs.push(cb);
        return { unsubscribe: jest.fn() };
      },
    };
  });
  DataStore.query.mockImplementation(async (_model, predicate) => {
    // Ejercita el predicado como lo haría el DataStore real (cuando lo hay).
    if (typeof predicate === "function") {
      predicate({ email: { eq: jest.fn() }, formEventId: { eq: jest.fn() } });
    }
    return [];
  });
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.delete.mockImplementation(async (m) => m);
  uploadData.mockImplementation(() => ({
    result: Promise.resolve({ key: "k" }),
  }));
  getUrl.mockImplementation(async () => ({
    url: { pathname: "/public/ticket.txt" },
  }));
  translateFormData.mockImplementation(async (data) => data);
  restoreOriginalLabels.mockImplementation((captured) => captured);
  translateString.mockImplementation(async (s) => s);
  validateBannerCode.mockImplementation(async () => ({ ok: true }));
  html2pdfMock.mockImplementation(() => ({ set: jest.fn(() => undefined) }));

  __subs.length = 0;
  jqState.userData = [];
  jqState.renderedConfigs.length = 0;
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  // fetch por ruta: token financiero, registro financiero y trigger-email.
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () => {
      const u = String(url);
      if (u.includes("lambda-url")) return { access_token: "tok-1" };
      if (u.includes("PostRegistroExternos")) return [{ valor: "TRS-1" }];
      return {};
    },
  }));
});

afterEach(() => {
  jest.useRealTimers();
  window.history.replaceState({}, "", "/");
});

describe("Registro (landing): carga del formulario", () => {
  test("muestra el loader del formulario y renderiza las preguntas al llegar el Form", async () => {
    const { props } = renderRegistro();

    expect(screen.getByText("Formulario de Registro")).toBeInTheDocument();
    expect(screen.getByText("Cargando formulario...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrarse" })
    ).toBeInTheDocument();

    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });

    await waitFor(() =>
      expect(
        screen.queryByText("Cargando formulario...")
      ).not.toBeInTheDocument()
    );

    const cfg = await waitForFormRendered();
    expect(cfg.dataType).toBe("json");
    // Sin certificados activos, la definición renderizada es la original tal cual.
    expect(cfg.formData.map((q) => q.name)).toEqual(["nombres", "email"]);
    // En español no se dispara la traducción.
    expect(translateFormData).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Regresar"));
    expect(props.setShowRegister).toHaveBeenCalledWith(false);
  });

  test("muestra error cuando no existe un formulario asociado al evento", async () => {
    renderRegistro();
    emitForm({ items: [], isSynced: true });

    expect(
      screen.getByText("No se encontró un formulario asociado a este evento.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Cargando formulario...")
    ).not.toBeInTheDocument();
  });

  test("muestra error cuando el formulario no contiene preguntas", async () => {
    renderRegistro();
    emitForm({ items: [{ questions: [] }], isSynced: false });

    expect(
      screen.getByText("El formulario no contiene preguntas para mostrar.")
    ).toBeInTheDocument();
  });

  test("inyecta los campos de certificado cuando el evento tiene sendCertificates", async () => {
    renderRegistro({
      event: {
        id: "event-1",
        date: "2026-08-01T15:00:00.000Z",
        location: "Quito",
        sendCertificates: true,
      },
    });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });

    const cfg = await waitForFormRendered();
    const names = cfg.formData.map((q) => q.name);
    expect(names).toEqual(
      expect.arrayContaining(["nombres", "email", "cert_enviar", "cert_nombre"])
    );
    const certAsk = cfg.formData.find((q) => q.name === "cert_enviar");
    expect(certAsk.values.map((v) => v.value)).toEqual(["Si", "No"]);
  });

  test("guard de identidad: dos emits con las mismas preguntas disparan UNA sola traducción", async () => {
    renderRegistro({ lang: "EN" });

    // observeQuery emite dos veces (pre-sync y synced) con arrays de identidad
    // distinta pero contenido idéntico: el guard debe absorber el segundo emit.
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: false });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });

    await waitForFormRendered();

    expect(translateFormData).toHaveBeenCalledTimes(1);
    expect(translateFormData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "email" })]),
      "en"
    );
  });
});

describe("Registro (landing): flujo de registro gratuito", () => {
  test("submit feliz: crea Attendee y EventAttendee, dispara el email y navega al ticket", async () => {
    const { props } = renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));

    // Respuestas capturadas del formRender suben al estado del padre.
    expect(props.setUserData).toHaveBeenCalledWith(jqState.userData);
    expect(validateBannerCode).toHaveBeenCalledWith(jqState.userData);

    // Se consultó duplicados de EventAttendee antes de guardar.
    expect(DataStore.query).toHaveBeenCalledTimes(1);

    const savedEventAttendee = DataStore.save.mock.calls[1][0];
    expect(savedEventAttendee).toEqual(
      expect.objectContaining({
        eventID: "event-1",
        attendeeID: "attendee-1",
        authorized: true, // gratuito => autorizado directo
        checkIn: false,
        quantity: 1,
        scanned: 0,
        formAnswers: jqState.userData,
        email: "Juan@Test.com", // email crudo del form (sin lowercasing)
        profileURL: "http://localhost/usuario/attendee-1",
      })
    );

    // Email server-side inmediato con keepalive.
    expect(global.fetch).toHaveBeenCalledWith(
      "https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        body: JSON.stringify({
          eventAttendeeId: "ea-new",
          typePayment: "CARD",
          statusPayment: "SUCCESSFUL",
        }),
      })
    );

    // Redirección diferida al ticket (2s).
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("?EventAttendee=ea-new");
  });

  test("bloquea el registro duplicado por email para el mismo evento", async () => {
    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();
    // Ya existe un registro con ese correo en ESTE evento.
    DataStore.query.mockResolvedValueOnce([
      { eventID: "event-1", email: "juan@test.com" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Ya existe un registro con este correo para este evento."
      )
    );
    // Solo se guardó el Attendee: el EventAttendee nunca se creó.
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("muestra alerta y no guarda nada cuando el código banner es inválido", async () => {
    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();
    validateBannerCode.mockResolvedValueOnce({
      ok: false,
      reason: "inactive_or_mismatch",
    });

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "El código banner o identificación CI no es válido"
      )
    );
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Registro (landing): flujo de registro pagado", () => {
  test("submit pagado: popup de términos, EventAttendee sin autorizar y pasarela USFQ", async () => {
    renderRegistro({
      landing: { cost: "$10", title: "Evento Test", userConsentCheck: null },
    });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = paidUserDataFixture();

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    // Popup de transferencia/privacidad montado directo en el body.
    expect(
      screen.getByText("En caso de transferencia o depósito:")
    ).toBeInTheDocument();
    const confirmCheckbox = document.getElementById("confirmationCheckbox");
    const acceptButton = document.getElementById("redirectButton");
    expect(acceptButton.disabled).toBe(true);

    fireEvent.click(confirmCheckbox); // marca la casilla => habilita Aceptar
    expect(acceptButton.disabled).toBe(false);
    fireEvent.click(acceptButton);

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    const savedEventAttendee = DataStore.save.mock.calls[1][0];
    expect(savedEventAttendee).toEqual(
      expect.objectContaining({
        eventID: "event-1",
        authorized: false, // pagado => queda pendiente de pago
        email: "Juan@Test.com",
      })
    );

    // Overlay de redirección a la pasarela (evento pagado, sin autorizar).
    expect(
      await screen.findByText("Redirigiendo a la pasarela de pagos USFQ")
    ).toBeInTheDocument();

    // Token financiero + registro externo con el token obtenido.
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "https://bvq7tg35iuv6lbgndbqbwwhgim0mpnum.lambda-url.sa-east-1.on.aws/"
      )
    );
    const postCall = global.fetch.mock.calls.find(([u]) =>
      String(u).includes("PostRegistroExternos")
    );
    expect(postCall).toBeTruthy();
    expect(postCall[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tok-1" }),
      })
    );
    const body = JSON.parse(postCall[1].body);
    expect(body[0]).toEqual(
      expect.objectContaining({
        identificacion: 1712345678,
        correo: "Juan@Test.com",
        valor: 10,
        reg_id_externo: "ea-new",
      })
    );
    // No se avanza el timer de 3s: no debe navegar fuera durante el test.
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Registro (landing): consentimiento y facturación", () => {
  test("el consentimiento bloquea el botón hasta marcar la casilla y alterna Leer más/menos", () => {
    renderRegistro({
      landing: {
        cost: "Gratuito",
        title: "Evento Test",
        userConsentCheck: "<p>Acepto el tratamiento de mis datos personales</p>",
      },
    });

    const submit = screen.getByRole("button", { name: "Registrarse" });
    expect(submit).toBeDisabled();
    expect(
      screen.getByText("Acepto el tratamiento de mis datos personales")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Leer más" }));
    expect(
      screen.getByRole("button", { name: "Leer menos" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Leer menos" }));
    expect(screen.getByRole("button", { name: "Leer más" })).toBeInTheDocument();
  });

  test("muestra y oculta los campos de facturación solo en eventos pagados", () => {
    // El select de facturación usa `selected` en <option> (código de la app):
    // React lo reporta via console.error — esperado en este flujo.
    jest.spyOn(console, "error").mockImplementation(() => {});
    renderRegistro({
      landing: { cost: "$25", title: "Evento Test", userConsentCheck: null },
    });

    expect(
      screen.queryByText("Tipo de identificación")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Cambiar datos de facturación"));
    expect(screen.getByText("Tipo de identificación")).toBeInTheDocument();
    expect(
      screen.getByText("Nombre completo o razón social")
    ).toBeInTheDocument();
    expect(screen.getByText("Dirección")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cambiar datos de facturación"));
    expect(
      screen.queryByText("Tipo de identificación")
    ).not.toBeInTheDocument();
  });

  test("en eventos gratuitos no aparece el toggle de facturación", () => {
    renderRegistro();
    expect(
      screen.queryByText("Cambiar datos de facturación")
    ).not.toBeInTheDocument();
  });
});

describe("Registro (landing): estados post-registro", () => {
  test("muestra el ticket con QR cuando llega un eventAttendee autorizado", async () => {
    const answers = userDataFixture();
    renderRegistro({
      userData: answers,
      eventAttendeeProp: {
        id: "ea-99",
        authorized: true,
        formAnswers: JSON.stringify(answers),
        quantity: 1,
        ticket: "public/tickets/ea-99.pdf",
      },
    });

    expect(await screen.findByText("¡Registro exitoso!")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("Descargar PDF")).toBeInTheDocument();
    expect(screen.getByText("Evento Test")).toBeInTheDocument();
    // La ubicación aparece en la lista informativa y en el ticket.
    expect(screen.getAllByText("Quito").length).toBeGreaterThanOrEqual(2);
    // El formulario ya no se muestra.
    expect(
      screen.queryByText("Formulario de Registro")
    ).not.toBeInTheDocument();
    // El QR del ticket codifica el id del EventAttendee.
    expect(document.querySelector("#pdf-content-0")).toBeInTheDocument();

    // Descargar de nuevo no debe romper (html2pdf mockeado corta la cadena).
    fireEvent.click(screen.getByText("Descargar PDF"));
    await act(async () => {});
  });

  test("muestra la pantalla de pago en proceso cuando la URL trae EventAttendee sin autorizar", () => {
    window.history.pushState({}, "", "/?EventAttendee=ea-55");
    renderRegistro();

    expect(
      screen.getByText("Su pago está siendo procesado actualmente")
    ).toBeInTheDocument();
    // El loader full-screen sigue activo mientras se verifica el pago.
    expect(
      screen.getByText("Cargando… No cerrar la página.")
    ).toBeInTheDocument();
  });
});

describe("Registro (landing): validaciones del submit", () => {
  test("no guarda nada cuando el formulario es inválido y limpia errores previos", async () => {
    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    // Un campo requerido vacío dentro del form renderizado hace fallar
    // el validateForm real.
    const rendered = document.querySelector("#fb-editor .rendered-form");
    const inputRequerido = document.createElement("input");
    inputRequerido.type = "text";
    inputRequerido.required = true;
    rendered.appendChild(inputRequerido);

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    expect(
      await screen.findByText("El campo no se ha rellenado correctamente")
    ).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled();

    // Un segundo intento limpia el mensaje anterior antes de re-validar:
    // nunca se acumulan mensajes duplicados.
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    await waitFor(() =>
      expect(document.querySelectorAll(".error-message")).toHaveLength(1)
    );
  });

  test("restaura las etiquetas originales cuando el idioma no es español", async () => {
    renderRegistro({ lang: "EN" });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    expect(restoreOriginalLabels).toHaveBeenCalledWith(
      jqState.userData,
      expect.arrayContaining([expect.objectContaining({ name: "email" })])
    );
  });

  test("bloquea la inscripción a un segundo subevento del grupo", async () => {
    renderRegistro({ eventID: "364f6cfb-16a6-4f10-839f-e606df7b5537" });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();
    // Ya inscrito con ese correo en OTRO subevento del grupo.
    DataStore.query.mockResolvedValueOnce([
      { eventID: "5eef9fae-24f6-49a5-871c-b84f381ce975", email: "juan@test.com" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Ya estás registrado en otra actividad. Solo se permite la inscripción a una única actividad."
      )
    );
    // Solo se guardó el Attendee: el EventAttendee nunca se creó.
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("no continúa cuando no se pudo crear el Attendee", async () => {
    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();
    DataStore.save.mockResolvedValueOnce(null);

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    await act(async () => {});
    // Sin Attendee no se consulta duplicados ni se registra nada más.
    expect(DataStore.query).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("reemplaza las respuestas con los datos de facturación al enviar", async () => {
    // El select de facturación usa `selected` en <option> (código de la app):
    // React lo reporta via console.error — esperado en este flujo.
    jest.spyOn(console, "error").mockImplementation(() => {});
    renderRegistro({
      landing: { cost: "$10", title: "Evento Test", userConsentCheck: null },
    });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    fireEvent.click(screen.getByText("Cambiar datos de facturación"));

    const setValor = (id, valor) =>
      fireEvent.change(document.getElementById(id), {
        target: { value: valor },
      });
    setValor("identificacion_facturacion", "1799999999001");
    setValor("nombres_facturacion", "Empresa Facturas SA");
    setValor("direccion_facturacion", "Av. Siempre Viva 742");
    setValor("telefono_facturacion", "022222222");
    setValor("email_facturacion", "factura@test.com");

    // Una respuesta ajena a la facturación debe pasar intacta.
    jqState.userData = [
      ...paidUserDataFixture(),
      { name: "empresa", label: "Empresa", userData: ["ACME"] },
    ];

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    fireEvent.click(document.getElementById("confirmationCheckbox"));
    fireEvent.click(document.getElementById("redirectButton"));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));

    // Las cinco respuestas de facturación se reemplazan; el resto queda igual.
    expect(validateBannerCode).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "identificacion",
          userData: ["1799999999001"],
        }),
        expect.objectContaining({
          name: "nombres",
          userData: ["Empresa Facturas SA"],
        }),
        expect.objectContaining({
          name: "direccion",
          userData: ["Av. Siempre Viva 742"],
        }),
        expect.objectContaining({ name: "telefono", userData: ["022222222"] }),
        expect.objectContaining({
          name: "email",
          userData: ["factura@test.com"],
        }),
        expect.objectContaining({ name: "empresa", userData: ["ACME"] }),
      ])
    );
    // El EventAttendee usa el email de facturación.
    expect(DataStore.save.mock.calls[1][0].email).toBe("factura@test.com");
  });
});

describe("Registro (landing): errores del flujo pagado", () => {
  test("cerrar el popup con el overlay cancela sin registrar", async () => {
    renderRegistro({
      landing: { cost: "$10", title: "Evento Test", userConsentCheck: null },
    });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = paidUserDataFixture();

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(document.querySelector(".popup-privacy")).toBeTruthy();

    // Marcar y desmarcar la casilla alterna el estado del botón Aceptar.
    const confirmCheckbox = document.getElementById("confirmationCheckbox");
    const acceptButton = document.getElementById("redirectButton");
    fireEvent.click(confirmCheckbox);
    expect(acceptButton.disabled).toBe(false);
    fireEvent.click(confirmCheckbox);
    expect(acceptButton.disabled).toBe(true);

    fireEvent.click(document.querySelector(".popup-privacy-overlay"));
    expect(document.querySelector(".popup-privacy")).toBeNull();
    // La promesa del popup queda pendiente: no se guarda nada.
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("agota los reintentos del registro financiero y desactiva el loader", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    global.fetch = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes("lambda-url"))
        return { ok: true, json: async () => ({ access_token: "tok-1" }) };
      if (u.includes("PostRegistroExternos"))
        return { ok: false, status: 500, json: async () => ({ error: "boom" }) };
      return { ok: true, json: async () => ({}) };
    });

    renderRegistro({
      landing: { cost: "$10", title: "Evento Test", userConsentCheck: null },
    });
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = paidUserDataFixture();

    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));
    fireEvent.click(document.getElementById("confirmationCheckbox"));
    fireEvent.click(document.getElementById("redirectButton"));

    // El error termina en el catch de handleSubmit tras agotar reintentos.
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("HandleSubmit:", expect.any(Error))
    );
    const postCalls = global.fetch.mock.calls.filter(([u]) =>
      String(u).includes("PostRegistroExternos")
    );
    expect(postCalls).toHaveLength(3);
    // El loader de procesamiento se desactiva al fallar.
    await waitFor(() =>
      expect(
        screen.queryByText("Cargando… No cerrar la página.")
      ).not.toBeInTheDocument()
    );
  });
});

describe("Registro (landing): email temprano resiliente", () => {
  test("el registro sigue aunque el fetch del email temprano sea rechazado", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("trigger-email"))
        throw new Error("network down");
      return { ok: true, json: async () => ({}) };
    });

    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(warnSpy).toHaveBeenCalledWith(
        "early trigger-email failed:",
        expect.any(Error)
      )
    );
    // El fallo del email no bloquea la redirección al ticket.
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("?EventAttendee=ea-new");
  });

  test("el registro sigue aunque fetch lance sincrónicamente", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest.fn(() => {
      throw new Error("sin red");
    });

    renderRegistro();
    emitForm({ items: [{ questions: questionsFixture() }], isSynced: true });
    await waitForFormRendered();

    jqState.userData = userDataFixture();

    jest.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    expect(warnSpy).toHaveBeenCalledWith(
      "early trigger-email exception:",
      expect.any(Error)
    );
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("?EventAttendee=ea-new");
  });
});

describe("Registro (landing): subida del ticket PDF", () => {
  // Cadena html2pdf completa: permite que handleExport llegue hasta
  // savePDFStorage con un PDF falso.
  const primePdfChain = () => {
    const chain = {
      from: () => chain,
      toContainer: () => chain,
      toCanvas: () => chain,
      toPdf: () => chain,
      get: () => Promise.resolve({ addPage: jest.fn() }),
      outputPdf: () => Promise.resolve("PDFDATA"),
      save: jest.fn(),
    };
    html2pdfMock.mockImplementation(() => ({ set: () => chain }));
    return chain;
  };

  const propsTicketVacio = () => ({
    userData: userDataFixture(),
    eventAttendeeProp: {
      id: "ea-77",
      authorized: true,
      formAnswers: JSON.stringify(userDataFixture()),
      quantity: 1,
      ticket: "",
    },
  });

  test("genera el PDF, sube el ticket con Storage y dispara el email", async () => {
    primePdfChain();
    // savePDFStorage relee el EventAttendee para detectar el envío server-side.
    DataStore.query.mockResolvedValueOnce({ id: "ea-77", ticket: "" });

    renderRegistro(propsTicketVacio());

    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ea-77", ticket: "public/ticket.txt" })
      )
    );
    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "ea-77_event-1_ticket.txt",
        data: btoa("PDFDATA"),
      })
    );
    expect(getUrl).toHaveBeenCalledWith(
      expect.objectContaining({ key: "ea-77_event-1_ticket.txt" })
    );
    // El servidor aún no envió el correo: se dispara desde el cliente.
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  test("no reenvía el email cuando el servidor ya lo mandó (sent-qr)", async () => {
    primePdfChain();
    DataStore.query.mockResolvedValueOnce({
      id: "ea-77",
      ticket: "sent-qr:abc123",
    });

    renderRegistro(propsTicketVacio());

    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ea-77", ticket: "public/ticket.txt" })
      )
    );
    await act(async () => {});
    // Idempotencia: el correo ya salió del servidor, no se repite.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("registra el error en consola si la subida del ticket falla", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    primePdfChain();
    uploadData.mockImplementation(() => ({
      result: Promise.reject(new Error("S3 caído")),
    }));

    renderRegistro(propsTicketVacio());

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "Error uploading file: ",
        expect.any(Error)
      )
    );
    // Nada que guardar ni email que disparar si la subida falló.
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("Registro (landing): consentimiento en inglés", () => {
  test("alterna Read more/Read less con lang EN", async () => {
    renderRegistro({
      lang: "EN",
      landing: {
        cost: "Gratuito",
        title: "Evento Test",
        userConsentCheck: "<p>I agree to the processing of my data</p>",
      },
    });

    const submit = screen.getByRole("button", { name: "Register" });
    expect(submit).toBeDisabled();

    fireEvent.click(await screen.findByRole("button", { name: "Read more" }));
    expect(
      screen.getByRole("button", { name: "Read less" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read less" }));
    expect(
      screen.getByRole("button", { name: "Read more" })
    ).toBeInTheDocument();
  });
});
