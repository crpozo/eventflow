/* Tests de EventUpdateForm: hidratación desde la nube (GetEventForForm pisa la
 * copia local de DataStore), panel de certificados (sliders, tamaño, color,
 * fecha de envío con ciclo de 5 minutos), auto-guardado con merge por claves
 * dirty y _version fresco, aviso "Certificados enviados" + Volver a enviar
 * (mutación ClearCertSent) y el submit del formulario completo. */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

jest.mock("aws-amplify/datastore", () => ({
  DataStore: {
    query: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    // Plain function (no jest.fn): sobrevive al resetMocks de CRA.
    observeQuery: () => ({
      subscribe: (cb) => {
        cb({ items: [], isSynced: true });
        return { unsubscribe: () => {} };
      },
    }),
  },
}));

jest.mock("aws-amplify/api", () => {
  const graphql = jest.fn();
  return {
    generateClient: () => ({ graphql, cancel: () => {} }),
    post: jest.fn(),
    __mockGraphql: graphql,
  };
});

jest.mock("aws-amplify/auth", () => ({
  fetchUserAttributes: () => Promise.resolve({}),
  signOut: () => Promise.resolve(),
}));

jest.mock("aws-amplify/utils", () => ({
  Hub: { listen: () => () => {}, dispatch: () => {} },
  I18n: { putVocabularies: () => {}, setLanguage: () => {} },
}));

jest.mock("models", () => ({
  Event: {
    name: "Event",
    copyOf: (base, mutator) => {
      const draft = { ...base };
      mutator(draft);
      return draft;
    },
  },
  Badge: { name: "Badge" },
}));

jest.mock("@aws-amplify/ui-react", () => {
  const React = require("react");
  const Box = ({ children }) => <div>{children}</div>;
  const asLabel = (label) => (typeof label === "string" ? label : undefined);
  return {
    Badge: ({ children, onClick }) => <div onClick={onClick}>{children}</div>,
    Button: ({ children, onClick, type = "button", isDisabled }) => (
      <button type={type} onClick={onClick} disabled={!!isDisabled}>
        {children}
      </button>
    ),
    Divider: () => <hr />,
    Flex: Box,
    Grid: ({ as: As = "div", children, onSubmit, onChangeCapture }) => (
      <As
        data-testid="event-update-form"
        onSubmit={onSubmit}
        onChangeCapture={onChangeCapture}
      >
        {children}
      </As>
    ),
    Heading: ({ children }) => <h5>{children}</h5>,
    Icon: ({ onClick }) => <span onClick={onClick} />,
    ScrollView: Box,
    SelectField: ({ label, value, onChange, children }) => (
      <div>
        <span>{label}</span>
        <select aria-label={asLabel(label)} value={value} onChange={onChange}>
          {children}
        </select>
      </div>
    ),
    SwitchField: ({ label, isChecked, onChange }) => (
      <div>
        <span>{label}</span>
        <input
          type="checkbox"
          aria-label={asLabel(label)}
          checked={!!isChecked}
          onChange={onChange}
        />
      </div>
    ),
    Text: ({ children }) => <span>{children}</span>,
    TextAreaField: ({
      label,
      value,
      onChange,
      onBlur,
      placeholder,
      hasError,
      errorMessage,
    }) => (
      <div>
        <span>{label}</span>
        <textarea
          aria-label={asLabel(label)}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
        />
        {hasError ? <span>{errorMessage}</span> : null}
      </div>
    ),
    TextField: ({
      label,
      value,
      onChange,
      onBlur,
      placeholder,
      hasError,
      errorMessage,
    }) => (
      <div>
        <span>{label}</span>
        <input
          aria-label={asLabel(label)}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
        />
        {hasError ? <span>{errorMessage}</span> : null}
      </div>
    ),
    // El componente real recibe un ref (BadgeRef): forwardRef evita el warning.
    Autocomplete: React.forwardRef(
      ({ value, onChange, onBlur, placeholder }, ref) => (
        <input
          ref={ref}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
        />
      )
    ),
    useTheme: () => ({
      tokens: {
        components: {
          fieldmessages: { error: { color: "red", fontSize: "12px" } },
        },
      },
    }),
  };
});

jest.mock("@aws-amplify/ui-react/internal", () => ({
  Field: ({ label, children, hasError, errorMessage }) => (
    <div>
      <span>{label}</span>
      {children}
      {hasError ? <span>{errorMessage}</span> : null}
    </div>
  ),
}));

jest.mock("@aws-amplify/ui-react-storage", () => ({
  StorageManager: (props) => (
    <div data-testid="storage-manager">
      <button
        type="button"
        data-testid="upload-ok"
        onClick={() => props.onUploadSuccess({ key: "certs/nueva.png" })}
      >
        subir
      </button>
      <button
        type="button"
        data-testid="remove-file"
        onClick={() => props.onFileRemove()}
      >
        quitar
      </button>
    </div>
  ),
}));

jest.mock("components/TestCertificate", () => (props) => (
  <div
    data-testid="test-certificate"
    data-event-id={props.eventId || ""}
    data-certificate={props.certificate || ""}
    data-position={props.certificatePosition || ""}
  />
));

jest.mock("components/CertificatePreview", () => (props) => (
  <div
    data-testid="certificate-preview"
    data-xpct={String(props.xPct)}
    data-ypct={String(props.yPct)}
    data-fontpct={String(props.fontPct)}
    data-color={props.color}
  >
    <button
      type="button"
      data-testid="preview-drag-commit"
      onClick={() => {
        props.onPositionChange(12, 34);
        props.onPositionCommit();
      }}
    >
      drag
    </button>
  </div>
));

import { DataStore } from "aws-amplify/datastore";
import EventUpdateForm from "../EventUpdateForm";

const { __mockGraphql: mockGraphql } = jest.requireMock("aws-amplify/api");

const POS_NUBE = { xPct: 40, yPct: 60, fontPct: 6, color: "#1a1a1a", sendAt: "" };

const eventoLocal = () => ({
  id: "ev-1",
  title: "Título Local",
  description: "Desc local",
  timezone: "America/Guayaquil",
  sendCertificates: true,
  certificate: "certs/plantilla.png",
  certificatePosition: JSON.stringify({
    xPct: 10,
    yPct: 20,
    fontPct: 4,
    color: "#1a1a1a",
    sendAt: "",
  }),
  termsCondition: "Términos locales",
  maxRegs: 50,
  _version: 5,
});

const eventoNube = () => ({
  id: "ev-1",
  title: "Título Nube",
  description: "Desc nube",
  date: null,
  startDate: null,
  endDate: null,
  timezone: "America/Guayaquil",
  sendCertificates: true,
  certificate: "certs/plantilla.png",
  certificatePosition: JSON.stringify(POS_NUBE),
  certificatesSentAt: null,
  termsCondition: "Términos nube",
  maxRegs: 100,
  totalScannedTicket: 2,
  contactTemplate: null,
  usuarioUSFQ: "",
  eventIdUSFQ: null,
  periodoUSFQ: null,
  _version: 7,
  _deleted: null,
  _lastChangedAt: 1,
});

let cloud;

beforeEach(() => {
  cloud = eventoNube();
  DataStore.query.mockImplementation(async () => eventoLocal());
  DataStore.save.mockImplementation(async (m) => m);
  mockGraphql.mockImplementation(async ({ query, variables }) => {
    if (query.includes("GetEventForForm")) {
      return { data: { getEvent: cloud ? { ...cloud } : null } };
    }
    if (query.includes("ClearCertSent")) {
      return {
        data: {
          updateEvent: {
            id: variables.input.id,
            certificatesSentAt: null,
            _version: variables.input._version + 1,
          },
        },
      };
    }
    return { data: {} };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderYEsperarNube = async (props = {}) => {
  const utils = render(<EventUpdateForm id="ev-1" {...props} />);
  await screen.findByDisplayValue("Título Nube");
  return utils;
};

const llamadasClearCertSent = () =>
  mockGraphql.mock.calls.filter(([arg]) => arg.query.includes("ClearCertSent"));

describe("EventUpdateForm: hidratación desde la nube", () => {
  test("los valores de getEvent pisan la copia local y llenan el panel de certificados", async () => {
    render(<EventUpdateForm id="ev-1" />);

    // Título/términos vienen de la NUBE, no de la copia local de DataStore.
    expect(await screen.findByDisplayValue("Título Nube")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Términos nube")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Título Local")).toBeNull();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();

    // getEvent se consultó con el id del evento.
    const getCall = mockGraphql.mock.calls.find(([arg]) =>
      arg.query.includes("GetEventForForm")
    );
    expect(getCall[0].variables).toEqual({ id: "ev-1" });

    // Panel de certificados visible (sendCertificates=true) con la posición de la nube.
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0].value).toBe("40");
    expect(sliders[1].value).toBe("60");
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByTestId("storage-manager")).toBeInTheDocument();
    expect(screen.getByTestId("test-certificate")).toHaveAttribute(
      "data-event-id",
      "ev-1"
    );
    expect(screen.getByTestId("test-certificate")).toHaveAttribute(
      "data-certificate",
      "certs/plantilla.png"
    );
    expect(screen.getByTestId("certificate-preview")).toHaveAttribute(
      "data-xpct",
      "40"
    );

    // Sin certificatesSentAt no hay aviso, y la hidratación NO auto-guarda.
    expect(screen.queryByText("✓ Certificados enviados")).toBeNull();
    expect(DataStore.save).not.toHaveBeenCalled();
  });

  test("si getEvent falla usa la copia local y persiste sin merge de nube ni _version ajeno", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockGraphql.mockImplementation(async () => {
      throw new Error("Network error");
    });
    render(<EventUpdateForm id="ev-1" />);

    expect(await screen.findByDisplayValue("Título Local")).toBeInTheDocument();
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0].value).toBe("10");

    fireEvent.change(sliders[0], { target: { value: "33" } });
    fireEvent.mouseUp(sliders[0]);
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));

    const guardado = DataStore.save.mock.calls[0][0];
    expect(JSON.parse(guardado.certificatePosition)).toEqual({
      xPct: 33,
      yPct: 20,
      fontPct: 4,
      color: "#1a1a1a",
      sendAt: "",
    });
    expect(guardado._version).toBe(5); // sin nube no hay _version fresco que imponer
    expect(warn).toHaveBeenCalled();
  });

  test("la hidratación tardía no pisa lo que el admin ya empezó a editar", async () => {
    let resolveCloud;
    mockGraphql.mockImplementation(({ query }) => {
      if (query.includes("GetEventForForm")) {
        return new Promise((res) => {
          resolveCloud = res;
        });
      }
      return Promise.resolve({ data: {} });
    });
    render(<EventUpdateForm id="ev-1" />);

    const titulo = await screen.findByDisplayValue("Título Local");
    fireEvent.change(titulo, { target: { value: "Editado en vivo" } });

    await act(async () => {
      resolveCloud({ data: { getEvent: { ...cloud } } });
    });

    expect(screen.getByDisplayValue("Editado en vivo")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Título Nube")).toBeNull();
  });

  test("soporta presets viejos: string crudo y objeto {preset}", async () => {
    cloud.certificatePosition = "inferior-derecha";
    const { unmount } = await renderYEsperarNube();
    let sliders = screen.getAllByRole("slider");
    expect(sliders[0].value).toBe("72");
    expect(sliders[1].value).toBe("85");
    unmount();

    cloud = eventoNube();
    cloud.certificatePosition = JSON.stringify({
      preset: "centro-arriba",
      color: "#123456",
    });
    await renderYEsperarNube();
    sliders = screen.getAllByRole("slider");
    expect(sliders[0].value).toBe("50");
    expect(sliders[1].value).toBe("30");
    expect(screen.getByText("#123456")).toBeInTheDocument();
  });
});

describe("EventUpdateForm: panel de certificados y auto-guardado", () => {
  test("el switch Certificados muestra y oculta el panel", async () => {
    await renderYEsperarNube();
    expect(screen.getByText("Posición del nombre")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Certificados"));
    expect(screen.queryByText("Posición del nombre")).toBeNull();
    expect(screen.queryByTestId("storage-manager")).toBeNull();

    fireEvent.click(screen.getByLabelText("Certificados"));
    expect(screen.getByText("Posición del nombre")).toBeInTheDocument();
  });

  test("mover el slider actualiza el % y el mouseup guarda mergeando claves dirty sobre la nube fresca", async () => {
    await renderYEsperarNube();
    const sliders = screen.getAllByRole("slider");

    // Otra pestaña cambió el color en la nube después de la hidratación.
    cloud.certificatePosition = JSON.stringify({
      ...POS_NUBE,
      color: "#ffffff",
    });

    fireEvent.change(sliders[0], { target: { value: "73.5" } });
    expect(screen.getByText("73.5%")).toBeInTheDocument();
    expect(DataStore.save).not.toHaveBeenCalled(); // arrastrar no guarda todavía

    fireEvent.mouseUp(sliders[0]);
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));

    const guardado = DataStore.save.mock.calls[0][0];
    // Solo xPct estaba dirty: adopta el color de la nube y conserva su yPct.
    expect(JSON.parse(guardado.certificatePosition)).toEqual({
      xPct: 73.5,
      yPct: 60,
      fontPct: 6,
      color: "#ffffff",
      sendAt: "",
    });
    expect(guardado.certificate).toBe("certs/plantilla.png");
    expect(guardado.sendCertificates).toBe(true);
    expect(guardado._version).toBe(7); // _version fresco de la nube (7 > 5 local)

    // El merge se refleja en la UI (color adoptado de la nube).
    expect(await screen.findByText("#ffffff")).toBeInTheDocument();

    // Segundo ajuste: yPct también queda dirty y xPct se conserva.
    fireEvent.change(sliders[1], { target: { value: "20" } });
    fireEvent.mouseUp(sliders[1]);
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    const guardado2 = DataStore.save.mock.calls[1][0];
    expect(JSON.parse(guardado2.certificatePosition)).toEqual({
      xPct: 73.5,
      yPct: 20,
      fontPct: 6,
      color: "#ffffff",
      sendAt: "",
    });
  });

  test("cambiar tamaño y color guarda al instante acumulando claves dirty", async () => {
    await renderYEsperarNube();

    fireEvent.change(screen.getByLabelText("Tamaño del nombre"), {
      target: { value: "9" },
    });
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(
      JSON.parse(DataStore.save.mock.calls[0][0].certificatePosition).fontPct
    ).toBe(9);

    fireEvent.click(screen.getByTitle("#1e3a8a"));
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    const cfg = JSON.parse(
      DataStore.save.mock.calls[1][0].certificatePosition
    );
    expect(cfg.color).toBe("#1e3a8a");
    expect(cfg.fontPct).toBe(9); // el dirty anterior se mantiene
    expect(screen.getByText("#1e3a8a")).toBeInTheDocument();
  });

  test("arrastrar el nombre en la vista previa persiste la posición al soltar", async () => {
    await renderYEsperarNube();
    fireEvent.click(screen.getByTestId("preview-drag-commit"));

    expect(screen.getByTestId("certificate-preview")).toHaveAttribute(
      "data-xpct",
      "12"
    );
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    const cfg = JSON.parse(
      DataStore.save.mock.calls[0][0].certificatePosition
    );
    expect(cfg.xPct).toBe(12);
    expect(cfg.yPct).toBe(34);
  });

  test("subir y quitar la plantilla auto-guardan la clave del archivo", async () => {
    await renderYEsperarNube();

    fireEvent.click(screen.getByTestId("upload-ok"));
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0].certificate).toBe(
      "certs/nueva.png"
    );
    await waitFor(() =>
      expect(screen.getByTestId("test-certificate")).toHaveAttribute(
        "data-certificate",
        "certs/nueva.png"
      )
    );

    fireEvent.click(screen.getByTestId("remove-file"));
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(2));
    expect(DataStore.save.mock.calls[1][0].certificate).toBe("");
  });

  test("fecha de envío: muestra el ciclo real de 5 minutos y persiste sendAt en hora del evento", async () => {
    const { container } = await renderYEsperarNube();
    expect(screen.getByText(/Si lo dejas vacío/)).toBeInTheDocument();

    const inputFecha = container.querySelector('input[type="datetime-local"]');
    fireEvent.change(inputFecha, { target: { value: "2026-08-10T10:03" } });

    // 10:03 se redondea al ciclo :05 y se muestra en hora del evento.
    expect(container.textContent).toContain("Se enviará el 2026-08-10, 10:05");
    expect(screen.queryByText(/Si lo dejas vacío/)).toBeNull();

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    const cfg = JSON.parse(
      DataStore.save.mock.calls[0][0].certificatePosition
    );
    // 10:03 Guayaquil (-05:00) = 15:03 UTC.
    expect(cfg.sendAt).toBe("2026-08-10T15:03:00.000Z");
  });
});

describe("EventUpdateForm: aviso de certificados enviados y reenvío", () => {
  test("con confirm aceptado limpia certificatesSentAt vía ClearCertSent con _version fresco", async () => {
    cloud.certificatesSentAt = "2026-07-01T15:00:00.000Z";
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    await renderYEsperarNube();
    expect(
      await screen.findByText("✓ Certificados enviados")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /volver a enviar/i }));
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("¿Volver a habilitarlos?")
    );

    await waitFor(() => expect(llamadasClearCertSent()).toHaveLength(1));
    expect(llamadasClearCertSent()[0][0].variables.input).toEqual({
      id: "ev-1",
      certificatesSentAt: null,
      _version: 7,
    });

    // El aviso desaparece y se informa el próximo ciclo.
    await waitFor(() =>
      expect(screen.queryByText("✓ Certificados enviados")).toBeNull()
    );
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("próximo ciclo")
    );
  });

  test("si el admin cancela el confirm no se toca la nube y el aviso sigue", async () => {
    cloud.certificatesSentAt = "2026-07-01T15:00:00.000Z";
    jest.spyOn(window, "confirm").mockReturnValue(false);

    await renderYEsperarNube();
    fireEvent.click(screen.getByRole("button", { name: /volver a enviar/i }));

    expect(llamadasClearCertSent()).toHaveLength(0);
    expect(screen.getByText("✓ Certificados enviados")).toBeInTheDocument();
  });

  test("si no se puede leer el _version de la nube avisa y no muta", async () => {
    cloud.certificatesSentAt = "2026-07-01T15:00:00.000Z";
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    await renderYEsperarNube();
    await screen.findByText("✓ Certificados enviados");

    // La relectura previa al reenvío ya no encuentra el evento.
    mockGraphql.mockImplementation(async ({ query }) => {
      if (query.includes("GetEventForForm")) return { data: { getEvent: null } };
      return { data: {} };
    });

    fireEvent.click(screen.getByRole("button", { name: /volver a enviar/i }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo leer el evento. Revisa tu conexión e intenta de nuevo."
      )
    );
    expect(llamadasClearCertSent()).toHaveLength(0);
    expect(screen.getByText("✓ Certificados enviados")).toBeInTheDocument();
  });
});

describe("EventUpdateForm: submit del formulario", () => {
  test("guarda con Object.assign, vacíos a null, merge del certificado y _version fresco", async () => {
    const onSubmit = jest.fn((f) => ({ ...f, description: "desc transformada" }));
    const onSuccess = jest.fn();
    await renderYEsperarNube({ onSubmit, onSuccess });

    fireEvent.change(screen.getByPlaceholderText("Nombre evento"), {
      target: { value: "Nuevo título" },
    });
    fireEvent.submit(screen.getByTestId("event-update-form"));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    const guardado = DataStore.save.mock.calls.at(-1)[0];
    expect(guardado.title).toBe("Nuevo título");
    expect(guardado.description).toBe("desc transformada"); // pasó por onSubmit
    expect(guardado.usuarioUSFQ).toBeNull(); // "" se convierte a null
    expect(guardado.termsCondition).toBe("Términos nube");
    expect(guardado._version).toBe(7);
    expect(JSON.parse(guardado.certificatePosition)).toEqual(POS_NUBE);
    expect(guardado).toHaveProperty("eventBadgeId", undefined); // sin Badge asignado
    expect(onSuccess.mock.calls[0][0].title).toBe("Nuevo título");
  });

  test("con el título vacío no guarda y muestra el error de requerido", async () => {
    const onSuccess = jest.fn();
    await renderYEsperarNube({ onSuccess });

    fireEvent.change(screen.getByPlaceholderText("Nombre evento"), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByTestId("event-update-form"));

    expect(
      await screen.findByText("The value is required")
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(DataStore.save).not.toHaveBeenCalled();
    // Con errores el botón Actualizar queda deshabilitado.
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
  });

  test("si DataStore.save falla llama onError con el mensaje", async () => {
    const onError = jest.fn();
    const onSuccess = jest.fn();
    await renderYEsperarNube({ onError, onSuccess });

    DataStore.save.mockRejectedValueOnce(new Error("boom"));
    fireEvent.submit(screen.getByTestId("event-update-form"));

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][1]).toBe("boom");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("EventUpdateForm: campos generales", () => {
  test("cada campo notifica onChange y refleja el valor tecleado", async () => {
    const onChange = jest.fn((f) => f);
    await renderYEsperarNube({ onChange });

    fireEvent.change(screen.getByPlaceholderText("Nombre evento"), {
      target: { value: "Nuevo nombre" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("De que se trata el evento?"),
      { target: { value: "Nueva desc" } }
    );
    fireEvent.change(screen.getByLabelText("Límite máximo de registros"), {
      target: { value: "250" },
    });
    fireEvent.change(screen.getByLabelText("Total de escaneos del ticket"), {
      target: { value: "3" },
    });
    fireEvent.change(
      screen.getByLabelText("Plantilla de email de contacto"),
      { target: { value: "Hola {nombre}" } }
    );
    fireEvent.change(screen.getByLabelText("Usuario USFQ"), {
      target: { value: "usfq1" },
    });
    fireEvent.change(screen.getByLabelText("ID Evento USFQ"), {
      target: { value: "E-9" },
    });
    fireEvent.change(screen.getByLabelText("Periodo USFQ"), {
      target: { value: "202620" },
    });
    fireEvent.change(screen.getByPlaceholderText(/La siguiente información/), {
      target: { value: "Nuevos términos" },
    });

    expect(onChange).toHaveBeenCalledTimes(9);
    // El último onChange (términos) lleva el estado acumulado de la sesión.
    expect(onChange.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({
        title: "Nuevo nombre",
        termsCondition: "Nuevos términos",
        maxRegs: 250,
        usuarioUSFQ: "usfq1",
      })
    );
    expect(screen.getByDisplayValue("Nuevo nombre")).toBeInTheDocument();
    expect(screen.getByDisplayValue("250")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hola {nombre}")).toBeInTheDocument();
  });

  test("las fechas se editan en la zona del evento (ida y vuelta sin corrimiento)", async () => {
    await renderYEsperarNube();

    const inicio = screen.getByLabelText("Fecha y hora de inicio");
    fireEvent.change(inicio, { target: { value: "2026-08-10T09:00" } });
    expect(inicio.value).toBe("2026-08-10T09:00");

    const fin = screen.getByLabelText("Fecha y hora de fin");
    fireEvent.change(fin, { target: { value: "2026-08-11T18:30" } });
    expect(fin.value).toBe("2026-08-11T18:30");

    // Vaciar el campo vuelve a "" (rama del ternario).
    fireEvent.change(inicio, { target: { value: "" } });
    expect(inicio.value).toBe("");

    const tz = screen.getByLabelText("Zona horaria del evento");
    fireEvent.change(tz, { target: { value: "Pacific/Galapagos" } });
    expect(tz.value).toBe("Pacific/Galapagos");
  });

  test("el ArrayField del gafete abre el editor, no agrega sin selección y cancela", async () => {
    await renderYEsperarNube();

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    const auto = screen.getByPlaceholderText("Buscar gafete");
    fireEvent.change(auto, { target: { value: "gafete-x" } });

    // Sin un gafete seleccionado (solo texto libre) Add no agrega nada.
    // fireEvent ya envuelve el click en act; el findBy* (act-aware) espera a
    // que el estado se estabilice sin necesidad de un act() extra.
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(
      await screen.findByPlaceholderText("Buscar gafete")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Buscar gafete")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Add item" })
    ).toBeInTheDocument();
  });
});
