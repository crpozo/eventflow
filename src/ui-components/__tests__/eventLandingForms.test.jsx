/* Tests de los formularios generados por Amplify Studio:
 * EventCreateForm, LandingCreateForm y LandingUpdateForm.
 *
 * Harness: se mockean las fronteras de módulo (DataStore, modelos,
 * @aws-amplify/ui-react, StorageManager) y se afirma comportamiento:
 * validaciones, guardado con args, onSuccess/onError, persistMedia, etc.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  within,
  waitFor,
} from "@testing-library/react";

jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: jest.fn(async () => ({})),
  signOut: jest.fn(async () => {}),
}));

jest.mock("aws-amplify/utils", () => ({
  Hub: { dispatch: jest.fn(), listen: jest.fn(() => jest.fn()) },
}));

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

jest.mock("../../models", () => {
  function Event(fields) {
    Object.assign(this, fields);
  }
  function Landing(fields) {
    Object.assign(this, fields);
  }
  Landing.copyOf = (base, updater) => {
    const draft = { ...base };
    updater(draft);
    return draft;
  };
  function Career() {}
  function Badge() {}
  return { Event, Landing, Career, Badge };
});

jest.mock("@aws-amplify/ui-react", () => {
  const React = require("react");
  let seq = 0;
  const useFieldId = () => React.useState(() => `campo-${++seq}`)[0];
  const FieldError = ({ hasError, errorMessage }) =>
    hasError && errorMessage ? (
      <span role="alert">{errorMessage}</span>
    ) : null;

  const TextField = React.forwardRef((props, ref) => {
    const id = useFieldId();
    const inputProps = {
      id,
      ref,
      type: props.type || "text",
      placeholder: props.placeholder,
      onChange: props.onChange,
      onBlur: props.onBlur,
    };
    if (props.value !== undefined) inputProps.value = props.value ?? "";
    return (
      <div>
        <label htmlFor={id}>{props.label}</label>
        <input {...inputProps} />
        <FieldError hasError={props.hasError} errorMessage={props.errorMessage} />
      </div>
    );
  });

  const TextAreaField = React.forwardRef((props, ref) => {
    const id = useFieldId();
    const taProps = {
      id,
      ref,
      placeholder: props.placeholder,
      onChange: props.onChange,
      onBlur: props.onBlur,
    };
    if (props.value !== undefined) taProps.value = props.value ?? "";
    return (
      <div>
        <label htmlFor={id}>{props.label}</label>
        <textarea {...taProps} />
        <FieldError hasError={props.hasError} errorMessage={props.errorMessage} />
      </div>
    );
  });

  const SelectField = (props) => {
    const id = useFieldId();
    return (
      <div>
        <label htmlFor={id}>{props.label}</label>
        <select
          id={id}
          value={props.value ?? ""}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={!!props.isDisabled}
        >
          {props.placeholder ? <option value="">{props.placeholder}</option> : null}
          {props.children}
        </select>
        <FieldError hasError={props.hasError} errorMessage={props.errorMessage} />
      </div>
    );
  };

  const SwitchField = (props) => {
    const id = useFieldId();
    return (
      <div>
        <label htmlFor={id}>{props.label}</label>
        <input
          id={id}
          type="checkbox"
          checked={!!props.isChecked}
          onChange={props.onChange}
          onBlur={props.onBlur}
        />
      </div>
    );
  };

  const Button = (props) => (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={!!props.isDisabled}
    >
      {props.children}
    </button>
  );

  const Grid = (props) =>
    props.as === "form" ? (
      <form onSubmit={props.onSubmit}>{props.children}</form>
    ) : (
      <div>{props.children}</div>
    );

  const Autocomplete = React.forwardRef((props, ref) => {
    const id = useFieldId();
    return (
      <div>
        <input
          id={id}
          ref={ref}
          aria-label={typeof props.label === "string" ? props.label : "autocomplete"}
          placeholder={props.placeholder}
          value={props.value ?? ""}
          onChange={props.onChange}
          onBlur={props.onBlur}
        />
        {(props.options || []).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => props.onSelect(opt)}
          >{`opcion:${opt.label}`}</button>
        ))}
      </div>
    );
  });

  const Wrapper = ({ children }) => <div>{children}</div>;
  const Badge = (props) => <span onClick={props.onClick}>{props.children}</span>;
  const Icon = (props) => (
    <span
      role="button"
      aria-label={props.ariaLabel || "icon"}
      onClick={props.onClick}
    >
      x
    </span>
  );

  return {
    Autocomplete,
    Badge,
    Button,
    Divider: () => <hr />,
    Flex: Wrapper,
    Grid,
    Heading: ({ children }) => <h5>{children}</h5>,
    Icon,
    ScrollView: Wrapper,
    SelectField,
    SwitchField,
    Text: ({ children }) => <p>{children}</p>,
    TextAreaField,
    TextField,
    useTheme: () => ({
      tokens: {
        components: {
          fieldmessages: { error: { color: "red", fontSize: "0.75rem" } },
        },
      },
    }),
  };
});

jest.mock("@aws-amplify/ui-react/internal", () => {
  const React = require("react");
  return {
    Field: (props) => (
      <div>
        <span>{props.label}</span>
        {props.children}
      </div>
    ),
  };
});

jest.mock("@aws-amplify/ui-react-storage", () => {
  const React = require("react");
  return {
    StorageManager: ({ onUploadSuccess, onFileRemove, defaultFiles }) => (
      <div data-testid="storage-manager">
        <span data-testid="archivos-actuales">
          {(defaultFiles || [])
            .map((f) => f && f.key)
            .filter(Boolean)
            .join(",")}
        </span>
        <button
          type="button"
          onClick={() => onUploadSuccess && onUploadSuccess({ key: "uploaded-file.png" })}
        >
          subir-archivo
        </button>
        <button
          type="button"
          onClick={() => onFileRemove && onFileRemove({ key: "uploaded-file.png" })}
        >
          quitar-archivo
        </button>
      </div>
    ),
  };
});

jest.mock("components/CertificatePreview", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props) => (
      <div data-testid="certificate-preview">
        <span>{`cert:${props.certificate || "sin-plantilla"}`}</span>
        <span>{`pos:${props.xPct},${props.yPct}`}</span>
        <button type="button" onClick={() => props.onPositionChange(25, 75)}>
          mover-nombre
        </button>
      </div>
    ),
  };
});

jest.mock("components/storage/ImageFileList", () => ({
  ImageFileList: () => null,
}));

import EventCreateForm from "../EventCreateForm";
import LandingCreateForm from "../LandingCreateForm";
import LandingUpdateForm from "../LandingUpdateForm";
import { DataStore } from "aws-amplify/datastore";

const clickAsync = async (el) =>
  act(async () => {
    fireEvent.click(el);
  });

const submitForm = async () =>
  clickAsync(screen.getByRole("button", { name: "Guardar" }));

const changeAndBlur = (el, value) => {
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
};

// Llena los campos requeridos de EventCreateForm (título, términos y subárea).
const fillEventRequired = async () => {
  changeAndBlur(screen.getByLabelText(/Indica a los participantes/), "Mi Evento");
  changeAndBlur(screen.getByLabelText(/Términos y condiciones/), "Acepto todo");
  await clickAsync(screen.getAllByRole("button", { name: "Add item" })[0]);
  await clickAsync(
    screen.getByRole("button", { name: "opcion:Ingenieria - career-1" })
  );
  await clickAsync(screen.getByRole("button", { name: "Add" }));
};

const landingFixture = () => ({
  id: "landing-1",
  active: true,
  title: "Landing Original",
  description: "Descripcion original",
  mainBanner: "banner.jpg",
  location: "Campus Cumbaya",
  cost: "Pago",
  extraInfo: "",
  userConsentCheck: "",
  ticketTitle: ["General"],
  ticketPrice: [10],
  galleryPhotos: ["foto1.jpg"],
  partnerLogos: [],
  customHtml: "",
});

// CRA usa resetMocks:true, así que las implementaciones se re-instalan por test.
beforeEach(() => {
  const fixtures = {
    Career: [{ id: "career-1", title: "Ingenieria" }],
    Badge: [{ id: "badge-1", frontDesign: "gafete-azul" }],
    Landing: [landingFixture()],
  };
  DataStore.query.mockImplementation(async (Model, id) => {
    const rows = fixtures[Model?.name] || [];
    if (id !== undefined) return rows.find((r) => r.id === id) || rows[0];
    return rows;
  });
  DataStore.save.mockImplementation(async (m) => m);
  DataStore.delete.mockImplementation(async (m) => m);
  DataStore.observeQuery.mockImplementation((Model) => ({
    subscribe: (cb) => {
      cb({ items: fixtures[Model?.name] || [], isSynced: true });
      return { unsubscribe: jest.fn() };
    },
  }));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("EventCreateForm", () => {
  test("muestra errores de validación, no guarda y deshabilita Guardar cuando faltan requeridos", async () => {
    const onSuccess = jest.fn();
    render(<EventCreateForm onSuccess={onSuccess} />);

    await submitForm();

    // title, termsCondition y careerID son requeridos
    expect(screen.getAllByText("The value is required")).toHaveLength(3);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    // al escribir el título se re-valida ese campo y desaparece su error
    fireEvent.change(screen.getByLabelText(/Indica a los participantes/), {
      target: { value: "Ya tengo nombre" },
    });
    await waitFor(() =>
      expect(screen.getAllByText("The value is required")).toHaveLength(2)
    );
  });

  test("crea el evento con los campos llenos, llama onSuccess y limpia el formulario", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn();
    render(<EventCreateForm onSuccess={onSuccess} onChange={onChange} />);

    await fillEventRequired();
    // chip de la subárea agregada
    expect(screen.getByText("Ingenieria - career-1")).toBeInTheDocument();

    changeAndBlur(
      screen.getByLabelText(/Descripción del evento/),
      "Un evento de prueba"
    );
    changeAndBlur(screen.getByLabelText("Límite máximo de registros"), "50");
    changeAndBlur(screen.getByLabelText("Total de escaneos del ticket"), "3");
    changeAndBlur(
      screen.getByLabelText("Plantilla de email de contacto"),
      "Hola {nombre}"
    );
    changeAndBlur(screen.getByLabelText("Usuario USFQ"), "carlos");
    changeAndBlur(screen.getByLabelText("Periodo USFQ"), "2026-2");
    changeAndBlur(screen.getByLabelText("ID Evento USFQ"), "EV-77");

    // gafete opcional vía autocomplete
    await clickAsync(screen.getByRole("button", { name: "Add item" }));
    await clickAsync(
      screen.getByRole("button", { name: "opcion:gafete-azul - badge-1" })
    );
    await clickAsync(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("gafete-azul - badge-1")).toBeInTheDocument();

    await submitForm();

    expect(DataStore.save).toHaveBeenCalledTimes(1);
    const guardado = DataStore.save.mock.calls[0][0];
    expect(guardado).toEqual(
      expect.objectContaining({
        title: "Mi Evento",
        termsCondition: "Acepto todo",
        description: "Un evento de prueba",
        maxRegs: 50,
        totalScannedTicket: 3,
        contactTemplate: "Hola {nombre}",
        careerID: "career-1",
        usuarioUSFQ: "carlos",
        periodoUSFQ: "2026-2",
        eventIdUSFQ: "EV-77",
        timezone: "America/Guayaquil",
        sendCertificates: false,
        // strings vacíos convertidos a null antes de guardar
        date: null,
        startDate: null,
        endDate: null,
        certificate: null,
        certificatePosition: null,
      })
    );
    expect(guardado.Badge).toEqual(expect.objectContaining({ id: "badge-1" }));
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mi Evento", careerID: "career-1" })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mi Evento" })
    );
    // clearOnSuccess resetea el formulario
    expect(screen.getByLabelText(/Indica a los participantes/)).toHaveValue("");
  });

  test("gestiona el panel de certificados: plantilla, posición, tamaño, color y fecha de envío", async () => {
    const onSuccess = jest.fn();
    const { container } = render(<EventCreateForm onSuccess={onSuccess} />);

    // sin activar el switch no existe el panel
    expect(screen.queryByTestId("certificate-preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Certificados"));
    expect(screen.getByTestId("certificate-preview")).toBeInTheDocument();

    // subir la plantilla vía StorageManager stub
    await clickAsync(screen.getByRole("button", { name: "subir-archivo" }));
    expect(screen.getByText("cert:uploaded-file.png")).toBeInTheDocument();

    // sliders de posición (inputs range crudos del componente)
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(2);
    fireEvent.change(sliders[0], { target: { value: "60" } });
    expect(screen.getByText("60%")).toBeInTheDocument();
    fireEvent.change(sliders[1], { target: { value: "70" } });
    expect(screen.getByText("70%")).toBeInTheDocument();

    // arrastrar el nombre en la vista previa actualiza ambos porcentajes
    await clickAsync(screen.getByRole("button", { name: "mover-nombre" }));
    expect(screen.getByText("pos:25,75")).toBeInTheDocument();

    // color por swatch y tamaño del nombre
    fireEvent.click(container.querySelector('button[title="#1e3a8a"]'));
    expect(screen.getByText("#1e3a8a")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tamaño del nombre"), {
      target: { value: "9" },
    });

    // fecha de envío (input datetime crudo, sin id en el stub)
    const sendAtInput = container.querySelector(
      'input[type="datetime-local"]:not([id])'
    );
    fireEvent.change(sendAtInput, { target: { value: "2026-09-01T08:30" } });
    const sendAtEsperado = new Date("2026-09-01T08:30").toISOString();

    await fillEventRequired();
    await submitForm();

    const guardado = DataStore.save.mock.calls[0][0];
    expect(guardado.sendCertificates).toBe(true);
    expect(guardado.certificate).toBe("uploaded-file.png");
    expect(JSON.parse(guardado.certificatePosition)).toEqual({
      xPct: 25,
      yPct: 75,
      fontPct: 9,
      color: "#1e3a8a",
      sendAt: sendAtEsperado,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  test("convierte fechas a la zona horaria del evento (Quito y Galápagos)", () => {
    render(<EventCreateForm />);

    const inicio = screen.getByLabelText("Fecha y hora de inicio");
    fireEvent.change(inicio, { target: { value: "2026-08-01T10:00" } });
    // round-trip en America/Guayaquil (GMT-5)
    expect(inicio).toHaveValue("2026-08-01T10:00");

    // al cambiar a Galápagos (GMT-6) la misma hora UTC se muestra una hora antes
    fireEvent.change(screen.getByLabelText("Zona horaria del evento"), {
      target: { value: "Pacific/Galapagos" },
    });
    expect(inicio).toHaveValue("2026-08-01T09:00");

    const fin = screen.getByLabelText("Fecha y hora de fin");
    fireEvent.change(fin, { target: { value: "2026-08-02T20:00" } });
    expect(fin).toHaveValue("2026-08-02T20:00");
  });

  test("notifica onError cuando DataStore.save falla y no limpia el formulario", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    DataStore.save.mockRejectedValueOnce(new Error("sin conexion"));
    render(<EventCreateForm onSuccess={onSuccess} onError={onError} />);

    await fillEventRequired();
    await submitForm();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mi Evento" }),
      "sin conexion"
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Indica a los participantes/)).toHaveValue(
      "Mi Evento"
    );
  });

  test("permite quitar el gafete agregado y dispara onCancel", async () => {
    const onCancel = jest.fn();
    render(<EventCreateForm onCancel={onCancel} />);

    // el segundo ArrayField es el del gafete
    await clickAsync(screen.getAllByRole("button", { name: "Add item" })[1]);
    await clickAsync(
      screen.getByRole("button", { name: "opcion:gafete-azul - badge-1" })
    );
    await clickAsync(screen.getByRole("button", { name: "Add" }));

    const chip = screen.getByText("gafete-azul - badge-1");
    await clickAsync(within(chip).getByRole("button", { name: "button" }));
    expect(screen.queryByText("gafete-azul - badge-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("LandingCreateForm", () => {
  test("valida requeridos al enviar y no guarda", async () => {
    const onSuccess = jest.fn();
    render(<LandingCreateForm onSuccess={onSuccess} />);

    await submitForm();

    // title, description y location requeridos
    expect(screen.getAllByText("The value is required")).toHaveLength(3);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("crea la landing con media, tickets (incluye edición de chip) y switch activo", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn();
    const onSubmit = jest.fn((mf) => mf);
    const validaTitulo = jest.fn(async (value, resp) => resp);
    render(
      <LandingCreateForm
        onSuccess={onSuccess}
        onChange={onChange}
        onSubmit={onSubmit}
        onValidate={{ title: validaTitulo }}
      />
    );

    fireEvent.click(screen.getByLabelText("Publicar landing"));
    changeAndBlur(screen.getByLabelText(/Titulo principal/), "Landing de prueba");
    changeAndBlur(screen.getByLabelText(/Descripción corta/), "Resumen corto");
    changeAndBlur(screen.getByLabelText(/Ubicación del evento/), "Campus");
    changeAndBlur(screen.getByLabelText(/Información adicional/), "Politica");
    changeAndBlur(
      screen.getByLabelText("Checkbox de consentimiento del usuario"),
      "Acepto"
    );
    changeAndBlur(
      screen.getByLabelText("Bloque HTML personalizado"),
      "<b>hola</b>"
    );
    fireEvent.change(screen.getByLabelText("Tarifa del evento"), {
      target: { value: "Gratuito" },
    });

    // banner, galería y logos (en ese orden en el DOM)
    const subir = screen.getAllByRole("button", { name: "subir-archivo" });
    expect(subir).toHaveLength(3);
    await clickAsync(subir[0]);
    await clickAsync(subir[1]);
    await clickAsync(subir[2]);

    // ticket label: agregar y luego editar el chip
    await clickAsync(screen.getAllByRole("button", { name: "Add item" })[0]);
    fireEvent.change(screen.getByLabelText("Label tickets"), {
      target: { value: "VIP" },
    });
    await clickAsync(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("VIP")).toBeInTheDocument();

    await clickAsync(screen.getByText("VIP")); // edita el chip
    fireEvent.change(screen.getByLabelText("Label tickets"), {
      target: { value: "VIP Premium" },
    });
    await clickAsync(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("VIP Premium")).toBeInTheDocument();

    // precio del ticket (parseFloat)
    await clickAsync(screen.getAllByRole("button", { name: "Add item" })[1]);
    fireEvent.change(screen.getByLabelText("Precio tickets"), {
      target: { value: "15.5" },
    });
    await clickAsync(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("15.5")).toBeInTheDocument();

    await submitForm();

    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        active: true,
        title: "Landing de prueba",
        description: "Resumen corto",
        location: "Campus",
        cost: "Gratuito",
        extraInfo: "Politica",
        userConsentCheck: "Acepto",
        customHtml: "<b>hola</b>",
        mainBanner: "uploaded-file.png",
        galleryPhotos: ["uploaded-file.png"],
        partnerLogos: ["uploaded-file.png"],
        ticketTitle: ["VIP Premium"],
        ticketPrice: [15.5],
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing de prueba" })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(validaTitulo).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing de prueba" })
    );
    // clearOnSuccess resetea
    expect(screen.getByLabelText(/Titulo principal/)).toHaveValue("");
  });

  test("quita los archivos subidos, envía listas vacías y dispara onCancel", async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    render(<LandingCreateForm onSuccess={onSuccess} onCancel={onCancel} />);

    const subir = screen.getAllByRole("button", { name: "subir-archivo" });
    await clickAsync(subir[0]);
    await clickAsync(subir[1]);
    await clickAsync(subir[2]);
    // la galería refleja el archivo subido en defaultFiles
    expect(screen.getAllByTestId("archivos-actuales")[1]).toHaveTextContent(
      "uploaded-file.png"
    );

    const quitar = screen.getAllByRole("button", { name: "quitar-archivo" });
    await clickAsync(quitar[0]);
    await clickAsync(quitar[1]);
    await clickAsync(quitar[2]);
    expect(screen.getAllByTestId("archivos-actuales")[1]).toHaveTextContent("");

    changeAndBlur(screen.getByLabelText(/Titulo principal/), "Solo requeridos");
    changeAndBlur(screen.getByLabelText(/Descripción corta/), "Desc");
    changeAndBlur(screen.getByLabelText(/Ubicación del evento/), "Quito");
    await submitForm();

    const guardado = DataStore.save.mock.calls[0][0];
    expect(guardado.galleryPhotos).toEqual([]);
    expect(guardado.partnerLogos).toEqual([]);
    expect(guardado.mainBanner).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("notifica onError cuando el guardado falla", async () => {
    const onError = jest.fn();
    DataStore.save.mockRejectedValueOnce(new Error("dynamo caido"));
    render(<LandingCreateForm onError={onError} />);

    changeAndBlur(screen.getByLabelText(/Titulo principal/), "Landing X");
    changeAndBlur(screen.getByLabelText(/Descripción corta/), "Desc");
    changeAndBlur(screen.getByLabelText(/Ubicación del evento/), "Quito");
    await submitForm();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing X" }),
      "dynamo caido"
    );
  });
});

describe("LandingUpdateForm", () => {
  test("hidrata el formulario desde la prop landing y guarda cambios con copyOf", async () => {
    const onSuccess = jest.fn();
    const onChange = jest.fn();
    const onSubmit = jest.fn((mf) => mf);
    const validaTitulo = jest.fn(async (value, resp) => resp);
    render(
      <LandingUpdateForm
        landing={landingFixture()}
        onSuccess={onSuccess}
        onChange={onChange}
        onSubmit={onSubmit}
        onValidate={{ title: validaTitulo }}
      />
    );

    expect(screen.getByDisplayValue("Landing Original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descripcion original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Campus Cumbaya")).toBeInTheDocument();
    expect(screen.getByLabelText("Publicar landing")).toBeChecked();
    // chips de tickets existentes
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    // defaultFiles: banner, galería y logos
    const archivos = screen.getAllByTestId("archivos-actuales");
    expect(archivos[0]).toHaveTextContent("banner.jpg");
    expect(archivos[1]).toHaveTextContent("foto1.jpg");

    changeAndBlur(screen.getByLabelText(/Titulo principal/), "Landing Nueva");
    changeAndBlur(screen.getByLabelText(/Descripción corta/), "Nueva descripcion");
    changeAndBlur(screen.getByLabelText(/Ubicación del evento/), "Nueva ubicacion");
    changeAndBlur(screen.getByLabelText(/Información adicional/), "Mas info");
    changeAndBlur(
      screen.getByLabelText("Checkbox de consentimiento del usuario"),
      "Consiento"
    );
    fireEvent.change(screen.getByLabelText("Tarifa del evento"), {
      target: { value: "Gratuito" },
    });
    fireEvent.blur(screen.getByLabelText("Tarifa del evento"));
    fireEvent.click(screen.getByLabelText("Publicar landing")); // active -> false

    // reemplazar el banner principal (solo estado local, sin persistMedia)
    await clickAsync(screen.getAllByRole("button", { name: "quitar-archivo" })[0]);
    await clickAsync(screen.getAllByRole("button", { name: "subir-archivo" })[0]);

    // tickets: agregar un label nuevo, quitar el existente y editar el precio
    await clickAsync(screen.getAllByRole("button", { name: "Add item" })[0]);
    changeAndBlur(screen.getByLabelText("Label tickets"), "VIP");
    await clickAsync(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("VIP")).toBeInTheDocument();

    const chipGeneral = screen.getByText("General");
    await clickAsync(within(chipGeneral).getByRole("button", { name: "button" }));
    expect(screen.queryByText("General")).not.toBeInTheDocument();

    await clickAsync(screen.getByText("10")); // edita el chip de precio
    changeAndBlur(screen.getByLabelText("Precio tickets"), "12.5");
    await clickAsync(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("12.5")).toBeInTheDocument();

    await submitForm();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(validaTitulo).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing Nueva" })
    );
    expect(DataStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "landing-1",
        title: "Landing Nueva",
        description: "Nueva descripcion",
        location: "Nueva ubicacion",
        extraInfo: "Mas info",
        userConsentCheck: "Consiento",
        cost: "Gratuito",
        active: false,
        mainBanner: "uploaded-file.png",
        ticketTitle: ["VIP"],
        ticketPrice: [12.5],
        customHtml: null, // string vacío convertido a null
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing Nueva", active: false })
    );
  });

  test("hidrata consultando por id, habilita Guardar y muestra los StorageManagers", async () => {
    render(<LandingUpdateForm id="landing-1" />);

    expect(await screen.findByDisplayValue("Landing Original")).toBeInTheDocument();
    expect(DataStore.query).toHaveBeenCalledWith(expect.anything(), "landing-1");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
    expect(screen.getAllByTestId("storage-manager")).toHaveLength(3);
  });

  test("sin id ni landing: Guardar deshabilitado y sin StorageManagers", () => {
    render(<LandingUpdateForm />);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(screen.queryAllByTestId("storage-manager")).toHaveLength(0);
  });

  test("persiste galería y logos inmediatamente (persistMedia) sin duplicados", async () => {
    render(<LandingUpdateForm landing={landingFixture()} />);

    // subir a la galería (índice 1) persiste sin enviar el formulario
    await clickAsync(screen.getAllByRole("button", { name: "subir-archivo" })[1]);
    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({
          galleryPhotos: ["foto1.jpg", "uploaded-file.png"],
        })
      )
    );
    // el registro actualizado rehidrata los defaultFiles
    expect(
      await screen.findByText("foto1.jpg,uploaded-file.png")
    ).toBeInTheDocument();

    // subir de nuevo el mismo archivo no duplica la key
    await clickAsync(screen.getAllByRole("button", { name: "subir-archivo" })[1]);
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    expect(DataStore.save.mock.calls[1][0].galleryPhotos).toEqual([
      "foto1.jpg",
      "uploaded-file.png",
    ]);

    // quitar el archivo persiste la lista filtrada
    await clickAsync(screen.getAllByRole("button", { name: "quitar-archivo" })[1]);
    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ galleryPhotos: ["foto1.jpg"] })
      )
    );

    // logos de aliados (índice 2)
    await clickAsync(screen.getAllByRole("button", { name: "subir-archivo" })[2]);
    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ partnerLogos: ["uploaded-file.png"] })
      )
    );
  });

  test("auto-guarda customHtml 700ms después de dejar de escribir (fake timers)", async () => {
    jest.useFakeTimers();
    render(<LandingUpdateForm landing={landingFixture()} />);

    fireEvent.change(screen.getByLabelText("Bloque HTML personalizado"), {
      target: { value: "<b>promo</b>" },
    });
    expect(DataStore.save).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ customHtml: "<b>promo</b>" })
      )
    );
  });

  test("persiste customHtml al hacer blur sin esperar el timer", async () => {
    render(<LandingUpdateForm landing={landingFixture()} />);

    const campo = screen.getByLabelText("Bloque HTML personalizado");
    await act(async () => {
      changeAndBlur(campo, "<a>link</a>");
    });

    await waitFor(() =>
      expect(DataStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ customHtml: "<a>link</a>" })
      )
    );
  });

  test("registra el error en consola cuando persistMedia falla", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.save.mockRejectedValueOnce(new Error("s3 caido"));
    render(<LandingUpdateForm landing={landingFixture()} />);

    await clickAsync(screen.getAllByRole("button", { name: "subir-archivo" })[1]);

    await waitFor(() =>
      expect(errSpy).toHaveBeenCalledWith(
        "No se pudo guardar el contenido extra:",
        expect.any(Error)
      )
    );
    errSpy.mockRestore();
  });

  test("no guarda si se vacía un campo requerido", async () => {
    const onSuccess = jest.fn();
    render(<LandingUpdateForm landing={landingFixture()} onSuccess={onSuccess} />);

    changeAndBlur(screen.getByLabelText(/Titulo principal/), "");
    await submitForm();

    expect(screen.getAllByText("The value is required").length).toBeGreaterThan(0);
    expect(DataStore.save).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("notifica onError cuando el guardado del formulario falla", async () => {
    const onError = jest.fn();
    DataStore.save.mockRejectedValueOnce(new Error("conflicto de version"));
    render(<LandingUpdateForm landing={landingFixture()} onError={onError} />);

    await submitForm();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Landing Original" }),
      "conflicto de version"
    );
  });
});
