/* Tests del editor de landing del admin (src/views/admin/eventos/landing).
 *
 * Cubre: redirect sin evento, loader pre-sync, hidratación del editor y de la
 * vista previa (incluida la fecha real del evento y el dedupe de galería),
 * dirty-tracking del botón Guardar, validaciones (obligatorios y filas de
 * ticket incompletas), guardar (copyOf / crear / reusar la fila re-consultada
 * / error), que las emisiones posteriores no pisen los cambios sin guardar,
 * los uploaders (subir/quitar con dedupe), el selector de dispositivo y el
 * modo solo lectura.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => {
  function Landing(init = {}) {
    Object.assign(this, init);
    if (!this.id) this.id = "ld-nuevo";
  }
  Landing.copyOf = (base, mutate) => {
    const draft = { ...base };
    mutate(draft);
    return draft;
  };
  return { Event: { name: "Event" }, Landing };
});

jest.mock("aws-amplify/datastore", () => {
  const state = { emissions: [], subs: [], eventRows: [], landingRows: [] };
  const impls = {
    query: async (Model) =>
      Model && Model.name === "Event" ? state.eventRows : state.landingRows,
    save: async (m) => m,
    observe: () => ({
      subscribe: (cb) => {
        state.subs.push(cb);
        state.emissions.forEach((e) => cb(e));
        return { unsubscribe: jest.fn() };
      },
    }),
  };
  return {
    DataStore: {
      __state: state,
      __impls: impls,
      query: jest.fn(impls.query),
      save: jest.fn(impls.save),
      observeQuery: jest.fn(impls.observe),
    },
  };
});

// StorageManager de Amplify → stub que expone los defaultFiles y dispara los
// callbacks de subida/borrado con una key fija (para probar el dedupe).
jest.mock("@aws-amplify/ui-react-storage", () => {
  const React = require("react");
  return {
    StorageManager: ({ defaultFiles = [], onUploadSuccess, onFileRemove }) => (
      <div data-testid="storage-manager">
        <span>
          archivos:
          {defaultFiles
            .map((f) => f.key)
            .filter(Boolean)
            .join(",")}
        </span>
        <button type="button" onClick={() => onUploadSuccess({ key: "nuevo-key" })}>
          subir
        </button>
        <button
          type="button"
          onClick={() =>
            onFileRemove({
              key: defaultFiles.map((f) => f.key).filter(Boolean)[0],
            })
          }
        >
          quitar
        </button>
      </div>
    ),
  };
});

// utils generado por Amplify Studio (processFile): arrastra auth/datastore.
jest.mock("ui-components/utils", () => ({ processFile: jest.fn() }));

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

import LandingEditor from "../index";

const { DataStore } = require("aws-amplify/datastore");

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const EVENT_ROW = {
  id: "ev-1",
  title: "Mi Evento",
  startDate: "2026-07-01T15:00:00.000Z", // 10:00 en GMT-5
};

const LANDING_ROW = {
  id: "ld-1",
  landingEventId: "ev-1",
  active: true,
  title: "Feria de Clubes",
  description: "La feria anual de clubes",
  mainBanner: "banner-key.jpg",
  location: "Auditorio Principal",
  cost: "Gratuito",
  ticketTitle: ["General", null],
  ticketPrice: [10, null],
  extraInfo: "Trae tu carnet",
  userConsentCheck: "Acepto términos",
  customHtml: "<b>hola</b>",
  metaScripts: "<!-- pixel -->",
  galleryPhotos: ["g1", "g1", null, "g2"], // duplicados y nulls legados
  partnerLogos: ["p1"],
  updatedAt: new Date(Date.now() - 5000).toISOString(),
};

let alertSpy;
let openSpy;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "EVENTFLOW.event",
    JSON.stringify({ id: "ev-1", title: "Evento Test" })
  );
  mockUsePermissions.mockReturnValue({ loading: false, can: () => true });
  DataStore.__state.emissions = [];
  DataStore.__state.subs = [];
  DataStore.__state.eventRows = [EVENT_ROW];
  DataStore.__state.landingRows = [];
  DataStore.query.mockImplementation(DataStore.__impls.query);
  DataStore.save.mockImplementation(DataStore.__impls.save);
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observe);
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const renderEditor = () =>
  render(
    <MemoryRouter>
      <LandingEditor />
    </MemoryRouter>
  );

const cargarConRegistro = () => {
  DataStore.__state.emissions = [{ items: [LANDING_ROW], isSynced: true }];
  renderEditor();
};

const botonGuardar = () =>
  screen.getByRole("button", { name: /Guardar cambios|Guardando…/ });

// Control (input/textarea) de un Field localizado por su label.
const controlDe = (labelRe) =>
  screen
    .getByText(labelRe, { selector: "label" })
    .closest("div")
    .parentElement.querySelector("input, textarea");

// El hero de la vista previa (caja con la imagen de fondo y el título).
const heroPreview = (titulo) =>
  screen.getByText(titulo).parentElement.parentElement;

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Landing admin — carga", () => {
  test("sin evento cacheado redirige a la lista sin suscribirse", () => {
    localStorage.removeItem("EVENTFLOW.event");
    renderEditor();
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
    expect(DataStore.observeQuery).not.toHaveBeenCalled();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  test("la emisión vacía pre-sync mantiene el loader (no renderiza modo-crear)", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: false }];
    renderEditor();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Landing page" })).toBeNull();
    await act(async () => {}); // drena la query async del evento
  });

  test("hidrata el editor y la vista previa desde la Landing existente", async () => {
    cargarConRegistro();

    // Formulario hidratado
    expect(screen.getByDisplayValue("Feria de Clubes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("La feria anual de clubes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Auditorio Principal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gratuito")).toBeInTheDocument();
    expect(screen.getByDisplayValue("General")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Trae tu carnet")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Acepto términos")).toBeInTheDocument();
    expect(screen.getByDisplayValue("<b>hola</b>")).toBeInTheDocument();
    expect(screen.getByDisplayValue("<!-- pixel -->")).toBeInTheDocument();

    // Publicación activa: chip, toggle y URL pública
    expect(screen.getByText("En vivo")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText("Tu página está visible para el público.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/landing/ev-1`)
    ).toBeInTheDocument();

    // defaultFiles de los 3 uploaders: banner, galería (dedupe + sin nulls) y logos
    const managers = screen.getAllByTestId("storage-manager");
    expect(managers).toHaveLength(3);
    expect(within(managers[0]).getByText("archivos:banner-key.jpg")).toBeInTheDocument();
    expect(within(managers[1]).getByText("archivos:g1,g2")).toBeInTheDocument();
    expect(within(managers[2]).getByText("archivos:p1")).toBeInTheDocument();

    // Vista previa: título sobre el banner real, descripción, fecha y ubicación
    expect(heroPreview("Feria de Clubes").style.backgroundImage).toContain(
      "banner-key.jpg"
    );
    // (selector p: el mismo texto vive también en el textarea del editor)
    expect(
      screen.getByText("La feria anual de clubes", { selector: "p" })
    ).toBeInTheDocument();
    expect(await screen.findByText(/01\/07\/2026/)).toBeInTheDocument(); // fecha real
    expect(screen.getByText(/10:00/)).toBeInTheDocument(); // hora en GMT-5
    expect(screen.getByText("(GMT-5)")).toBeInTheDocument();
    expect(screen.getByText("Auditorio Principal")).toBeInTheDocument();

    // Breadcrumb con el título del evento (query async a DataStore)
    expect(screen.getByText("Mi Evento")).toBeInTheDocument();

    // Sin cambios: guardado previo visible y Guardar deshabilitado
    expect(screen.getByText(/Guardado hace un momento/)).toBeInTheDocument();
    expect(botonGuardar()).toBeDisabled();

    // "Ver página" abre la landing pública
    fireEvent.click(screen.getByRole("button", { name: /Ver página/ }));
    expect(openSpy).toHaveBeenCalledWith(
      `${window.location.origin}/landing/ev-1`,
      "_blank"
    );
  });
});

describe("Landing admin — guardar", () => {
  test("editar habilita Guardar y guarda vía copyOf con los tickets normalizados", async () => {
    cargarConRegistro();
    expect(botonGuardar()).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("Feria de Clubes"), {
      target: { value: "  Nueva Feria  " },
    });
    // la vista previa se actualiza mientras escribe
    expect(screen.getByText("Nueva Feria")).toBeInTheDocument();
    expect(botonGuardar()).toBeEnabled();

    // Agrega una entrada completa (la fila vacía del registro se descarta)
    fireEvent.click(screen.getByRole("button", { name: /Agregar entrada/ }));
    fireEvent.change(screen.getAllByPlaceholderText("Nombre (ej. General)")[2], {
      target: { value: "VIP" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Precio")[2], {
      target: { value: "25.5" },
    });

    fireEvent.click(botonGuardar());
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "ld-1", // copyOf sobre el registro existente
      title: "Nueva Feria", // trim aplicado
      ticketTitle: ["General", "VIP"],
      ticketPrice: [10, 25.5], // números, no strings
      galleryPhotos: ["g1", "g2"],
      partnerLogos: ["p1"],
      cost: "Gratuito",
    });

    // snapshot === draft: vuelve a quedar deshabilitado y estampa el guardado
    expect(
      await screen.findByText(/Guardado hace un momento/)
    ).toBeInTheDocument();
    expect(botonGuardar()).toBeDisabled();
  });

  test("valida obligatorios y filas de ticket incompletas antes de guardar", async () => {
    cargarConRegistro();

    // Título vacío (queda dirty, el botón se habilita)
    fireEvent.change(screen.getByDisplayValue("Feria de Clubes"), {
      target: { value: "   " },
    });
    fireEvent.click(botonGuardar());
    expect(alertSpy).toHaveBeenCalledWith(
      "Título, descripción y ubicación son obligatorios."
    );
    expect(DataStore.save).not.toHaveBeenCalled();

    // Fila de ticket con nombre pero sin precio
    fireEvent.change(screen.getByPlaceholderText("Nombre del evento"), {
      target: { value: "Feria" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Nombre (ej. General)")[1], {
      target: { value: "Niños" },
    });
    fireEvent.click(botonGuardar());
    expect(alertSpy).toHaveBeenCalledWith(
      "Completa nombre y precio en todas las entradas (o elimina la fila incompleta)."
    );
    expect(DataStore.save).not.toHaveBeenCalled();

    // Quitar la fila incompleta desbloquea el guardado
    fireEvent.click(screen.getAllByTitle("Quitar entrada")[1]);
    fireEvent.click(botonGuardar());
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      title: "Feria",
      ticketTitle: ["General"],
      ticketPrice: [10],
    });
  });

  test("modo crear: editor vacío y guardado como Landing nueva", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    DataStore.__state.eventRows = []; // el evento aún no cargó
    renderEditor();

    // Estado vacío del modo crear
    expect(screen.getByText("Sin entradas configuradas.")).toBeInTheDocument();
    expect(screen.getByText("Oculta")).toBeInTheDocument();
    expect(screen.getByText(/Tu página está oculta/)).toBeInTheDocument();
    expect(screen.getByText("Título del evento")).toBeInTheDocument(); // placeholder preview
    expect(
      screen.getByText("La descripción corta aparecerá aquí.")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Nombre del evento"), {
      target: { value: "Expo" },
    });
    fireEvent.change(controlDe(/Descripción corta/), {
      target: { value: "Una expo" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Campus Cumbayá, Auditorio…"),
      { target: { value: "Hall" } }
    );
    fireEvent.click(screen.getByRole("switch")); // publica

    fireEvent.click(botonGuardar());
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "ld-nuevo", // pasó por el constructor
      landingEventId: "ev-1",
      active: true,
      title: "Expo",
      description: "Una expo",
      location: "Hall",
      cost: null, // los opcionales vacíos viajan como null
      extraInfo: null,
      ticketTitle: [],
      ticketPrice: [],
      mainBanner: null,
    });
  });

  test("antes de crear re-consulta el store y reusa la fila existente (no duplica)", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    DataStore.__state.landingRows = [LANDING_ROW]; // sincronizó después de cargar
    renderEditor();

    fireEvent.change(screen.getByPlaceholderText("Nombre del evento"), {
      target: { value: "Expo" },
    });
    fireEvent.change(controlDe(/Descripción corta/), {
      target: { value: "Una expo" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Campus Cumbayá, Auditorio…"),
      { target: { value: "Hall" } }
    );
    fireEvent.click(botonGuardar());

    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "ld-1", // copyOf sobre la fila re-consultada, no un registro nuevo
      title: "Expo",
    });
  });

  test("si el guardado falla alerta y el botón queda re-habilitado", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.save.mockRejectedValue(new Error("red caída"));
    cargarConRegistro();

    fireEvent.change(screen.getByDisplayValue("Feria de Clubes"), {
      target: { value: "Editada" },
    });
    fireEvent.click(botonGuardar());

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo guardar. Revisa la consola e intenta de nuevo."
      )
    );
    expect(errSpy).toHaveBeenCalledWith("save landing:", expect.any(Error));
    // sigue dirty y saving=false: se puede reintentar
    expect(
      await screen.findByRole("button", { name: "Guardar cambios" })
    ).toBeEnabled();
    errSpy.mockRestore();
  });

  test("una emisión posterior no pisa los cambios sin guardar pero sí refresca el target", async () => {
    cargarConRegistro();
    fireEvent.change(screen.getByDisplayValue("Feria de Clubes"), {
      target: { value: "Editada" },
    });

    act(() => {
      DataStore.__state.subs.forEach((cb) =>
        cb({
          items: [{ ...LANDING_ROW, id: "ld-2", title: "Del servidor" }],
          isSynced: true,
        })
      );
    });

    // el draft del admin sobrevive al eco del store
    expect(screen.getByDisplayValue("Editada")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Del servidor")).toBeNull();

    // pero el guardado usa el registro más fresco como target del copyOf
    fireEvent.click(botonGuardar());
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "ld-2",
      title: "Editada",
    });
  });
});

describe("Landing admin — imágenes, preview y permisos", () => {
  test("subir/quitar imágenes actualiza banner, galería (con dedupe) y logos", async () => {
    cargarConRegistro();
    const [banner, galeria, logos] = screen.getAllByTestId("storage-manager");

    fireEvent.click(within(banner).getByText("quitar")); // mainBanner → null
    fireEvent.click(within(galeria).getByText("subir"));
    fireEvent.click(within(galeria).getByText("subir")); // repetida: dedupe
    fireEvent.click(within(galeria).getByText("quitar")); // quita g1
    fireEvent.click(within(logos).getByText("subir"));

    fireEvent.click(botonGuardar());
    await waitFor(() => expect(DataStore.save).toHaveBeenCalledTimes(1));
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      mainBanner: null,
      galleryPhotos: ["g2", "nuevo-key"],
      partnerLogos: ["p1", "nuevo-key"],
    });
  });

  test("el selector de dispositivo alterna la vista previa escritorio/móvil", async () => {
    cargarConRegistro();
    await act(async () => {}); // drena la query async del evento
    expect(heroPreview("Feria de Clubes").style.minHeight).toBe("200px");

    fireEvent.click(screen.getByRole("button", { name: /Móvil/ }));
    expect(heroPreview("Feria de Clubes").style.minHeight).toBe("170px");

    fireEvent.click(screen.getByRole("button", { name: /Escritorio/ }));
    expect(heroPreview("Feria de Clubes").style.minHeight).toBe("200px");
  });

  test("modo solo lectura: banner visible, Guardar y Toggle deshabilitados", async () => {
    mockUsePermissions.mockReturnValue({ loading: false, can: () => false });
    cargarConRegistro();
    await act(async () => {}); // drena la query async del evento

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    expect(botonGuardar()).toBeDisabled();
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
