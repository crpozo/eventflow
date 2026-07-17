/* Tests del diseño de gafete (src/views/admin/eventos/diseno-gafete/index.jsx).
 *
 * Cubre: redirect con id inválido, formulario vacío, carga de un Badge
 * existente (getBadge + getUrl → "Diseño cargado" y previews), validación de
 * tipo de archivo (input y drag&drop), quitar archivo, submit sin archivos,
 * creación de badge nuevo (uploadData + createBadge + updateEvent), update de
 * badge existente (remove de keys viejas + updateBadge con _version), la rama
 * de error al subir y la rama sin permiso de edición.
 *
 * OJO: CRA corre Jest con resetMocks:true — implementaciones repuestas en
 * beforeEach. El submit exitoso duerme 1s (setTimeout) → fake timers +
 * waitFor (que los avanza solo).
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
import { createBadge, updateBadge, updateEvent } from "graphql/mutations";
import { getBadge } from "graphql/queries";
import DisenoGafete from "../index";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("models", () => ({
  Event: { name: "Event" },
  Badge: { name: "Badge" },
}));

jest.mock("aws-amplify/datastore", () => {
  const fixtures = {};
  const capture = (pred) => {
    let got = null;
    const node = (path) =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (prop === "eq") {
              return (v) => {
                got = { path, value: v };
                return true;
              };
            }
            return node([...path, prop]);
          },
        }
      );
    try {
      pred(node([]));
    } catch (e) {
      got = null;
    }
    return got;
  };
  const deepGet = (obj, path) =>
    path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  const queryImpl = async (Model, pred) => {
    const rows = fixtures[Model?.name] || [];
    if (pred == null) return rows;
    if (typeof pred === "string") return rows.find((r) => r.id === pred);
    const cond = capture(pred);
    if (!cond) return rows;
    return rows.filter((r) => deepGet(r, cond.path) === cond.value);
  };
  const DataStore = {
    __fixtures: fixtures,
    __impls: { queryImpl },
    query: jest.fn(queryImpl),
    save: jest.fn(),
    delete: jest.fn(),
  };
  return { DataStore };
});

// generateClient se llama al importar la vista: delega en mockGraphql para
// poder configurar la implementación por test.
const mockGraphql = jest.fn();
jest.mock("aws-amplify/api", () => ({
  generateClient: () => ({ graphql: (...args) => mockGraphql(...args) }),
}));

jest.mock("aws-amplify/storage", () => ({
  uploadData: jest.fn(),
  remove: jest.fn(),
  getUrl: jest.fn(),
}));

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

const { DataStore } = require("aws-amplify/datastore");
const { uploadData, remove, getUrl } = require("aws-amplify/storage");

/* ── Helpers ───────────────────────────────────────────────────────────── */

const seed = (fixtures) => Object.assign(DataStore.__fixtures, fixtures);

const renderGafete = (id = "ev-1") =>
  render(
    <MemoryRouter initialEntries={[`/admin/eventos/${id}/diseno-gafete`]}>
      <Routes>
        <Route
          path="/admin/eventos/:id/diseno-gafete"
          element={<DisenoGafete />}
        />
      </Routes>
    </MemoryRouter>
  );

const pdf = (name) => new File(["%PDF-1.4"], name, { type: "application/pdf" });

const setFile = (inputId, file) => {
  fireEvent.change(document.getElementById(inputId), {
    target: { files: [file] },
  });
};

const submitForm = () => fireEvent.submit(document.querySelector("form"));

// El submit exitoso duerme 1s (setTimeout) en medio de una cadena de awaits:
// se intercalan avances de fake timers con flushes de microtareas hasta que
// toda la cadena (uploads → graphql → sleep → recarga) termina dentro de act.
const flushSubmit = async () => {
  await act(async () => {
    for (let i = 0; i < 60; i++) {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    }
  });
};

const llamadasGraphql = () => mockGraphql.mock.calls.map(([arg]) => arg);

let alertSpy;

beforeEach(() => {
  localStorage.clear();
  Object.keys(DataStore.__fixtures).forEach(
    (k) => delete DataStore.__fixtures[k]
  );
  DataStore.query.mockImplementation(DataStore.__impls.queryImpl);
  mockGraphql.mockResolvedValue({ data: {} });
  uploadData.mockImplementation(({ key }) => ({
    result: Promise.resolve({ key }),
  }));
  remove.mockResolvedValue(undefined);
  getUrl.mockImplementation(async ({ key }) => ({
    url: `https://s3.mock/${key}`,
  }));
  mockUsePermissions.mockReturnValue({
    loading: false,
    isAdmin: true,
    can: () => true,
  });
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  window.URL.createObjectURL = jest.fn(() => "blob:preview");
});

afterEach(() => {
  jest.useRealTimers();
});

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("Diseño de gafete — guardas y carga", () => {
  test("con id 'no-id' redirige a la lista sin consultar", () => {
    renderGafete("no-id");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/eventos");
    expect(DataStore.query).not.toHaveBeenCalled();
    expect(screen.getByText("Diseño Gafete")).toBeInTheDocument();
  });

  test("evento sin badge muestra el formulario de subida vacío", async () => {
    seed({ Event: [{ id: "ev-1", title: "Mi Evento", _version: 1 }] });
    renderGafete();

    expect(await screen.findByText("Front Design (PDF)")).toBeInTheDocument();
    expect(screen.getByText("Back Design (PDF)")).toBeInTheDocument();
    expect(screen.getAllByText("Sube un archivo")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    // sin eventBadgeId no se consulta el badge
    expect(mockGraphql).not.toHaveBeenCalled();
  });

  test("evento con badge existente carga previews firmados desde S3", async () => {
    seed({ Event: [{ id: "ev-1", eventBadgeId: "b1", _version: 2 }] });
    mockGraphql.mockImplementation(async ({ query }) => {
      if (query === getBadge) {
        return {
          data: {
            getBadge: {
              id: "b1",
              frontDesign: "front-key.pdf",
              backDesign: "back-key.pdf",
              _version: 5,
            },
          },
        };
      }
      return { data: {} };
    });
    renderGafete();

    expect(await screen.findAllByText("Diseño cargado")).toHaveLength(2);
    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: "b1" } })
    );
    expect(getUrl).toHaveBeenCalledWith({ key: "front-key.pdf" });
    expect(getUrl).toHaveBeenCalledWith({ key: "back-key.pdf" });
    expect(screen.getByTitle("Front Design Preview")).toHaveAttribute(
      "src",
      "https://s3.mock/front-key.pdf"
    );
    expect(screen.getByTitle("Back Design Preview")).toHaveAttribute(
      "src",
      "https://s3.mock/back-key.pdf"
    );
  });
});

describe("Diseño de gafete — selección de archivos", () => {
  test("rechaza archivos que no son PDF (input y drop)", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    setFile(
      "front-file-upload",
      new File(["x"], "malo.txt", { type: "text/plain" })
    );
    expect(alertSpy).toHaveBeenCalledWith("Solo se permiten archivos PDF.");
    expect(screen.queryByText("malo.txt")).not.toBeInTheDocument();

    alertSpy.mockClear();
    const zona = screen.getByText("Back Design (PDF)").nextElementSibling;
    fireEvent.drop(zona, {
      dataTransfer: {
        files: [new File(["x"], "malo.png", { type: "image/png" })],
      },
    });
    expect(alertSpy).toHaveBeenCalledWith("Solo se permiten archivos PDF.");
  });

  test("acepta un PDF por drag&drop y marca la zona al arrastrar", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    const zona = screen.getByText("Front Design (PDF)").nextElementSibling;
    fireEvent.dragOver(zona);
    expect(zona.className).toContain("border-indigo-500");
    fireEvent.dragLeave(zona);
    expect(zona.className).toContain("border-gray-300");

    fireEvent.drop(zona, { dataTransfer: { files: [pdf("front.pdf")] } });
    expect(screen.getByText("front.pdf")).toBeInTheDocument();
    expect(screen.getByTitle("Front Design Preview")).toBeInTheDocument();
  });

  test("permite quitar el archivo elegido con el botón de cambiar", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    setFile("front-file-upload", pdf("front.pdf"));
    expect(screen.getByText("front.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Cambiar archivo"));
    expect(screen.queryByText("front.pdf")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sube un archivo")).toHaveLength(2);
  });
});

describe("Diseño de gafete — guardado", () => {
  test("sin ambos archivos pide subirlos y no llama a S3", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    submitForm();
    expect(alertSpy).toHaveBeenCalledWith("Por favor, sube ambos archivos.");
    expect(uploadData).not.toHaveBeenCalled();
  });

  test("crea un badge nuevo: sube a S3, createBadge y updateEvent", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    mockGraphql.mockImplementation(async ({ query, variables }) => {
      if (query === createBadge)
        return {
          data: { createBadge: { id: "badge-new", ...variables.input } },
        };
      if (query === updateEvent)
        return { data: { updateEvent: { id: variables.input.id } } };
      return { data: {} };
    });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    setFile("front-file-upload", pdf("front.pdf"));
    setFile("back-file-upload", pdf("back.pdf"));

    jest.useFakeTimers();
    submitForm();
    expect(
      screen.getByRole("button", { name: /guardando/i })
    ).toBeDisabled();

    await flushSubmit();
    jest.useRealTimers();
    expect(alertSpy).toHaveBeenCalledWith("Gafetes guardados exitosamente");

    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "public/badges/front.pdf",
        data: expect.any(File),
      })
    );
    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({ key: "public/badges/back.pdf" })
    );

    const llamadas = llamadasGraphql();
    const creacion = llamadas.find((c) => c.query === createBadge);
    expect(creacion.variables.input).toEqual({
      frontDesign: "public/badges/front.pdf",
      backDesign: "public/badges/back.pdf",
    });
    const actualizacion = llamadas.find((c) => c.query === updateEvent);
    expect(actualizacion.variables.input).toEqual({
      id: "ev-1",
      eventBadgeId: "badge-new",
      _version: 1,
    });

    // al terminar recarga previews firmados desde S3
    expect(await screen.findAllByText("Diseño cargado")).toHaveLength(2);
  });

  test("actualiza el badge existente: borra keys viejas y updateBadge con _version", async () => {
    seed({ Event: [{ id: "ev-1", eventBadgeId: "b1", _version: 2 }] });
    mockGraphql.mockImplementation(async ({ query, variables }) => {
      if (query === getBadge)
        return {
          data: {
            getBadge: {
              id: "b1",
              frontDesign: "old-front.pdf",
              backDesign: "old-back.pdf",
              _version: 7,
            },
          },
        };
      if (query === updateBadge)
        return { data: { updateBadge: { ...variables.input } } };
      return { data: {} };
    });
    renderGafete();
    await screen.findAllByText("Diseño cargado");

    // quitar los previews para habilitar los inputs de archivo
    screen.getAllByTitle("Cambiar archivo").forEach((btn) => {
      fireEvent.click(btn);
    });
    setFile("front-file-upload", pdf("nuevo-front.pdf"));
    setFile("back-file-upload", pdf("nuevo-back.pdf"));

    jest.useFakeTimers();
    submitForm();
    await flushSubmit();
    jest.useRealTimers();
    expect(alertSpy).toHaveBeenCalledWith("Gafetes guardados exitosamente");

    expect(remove).toHaveBeenCalledWith({ key: "old-front.pdf" });
    expect(remove).toHaveBeenCalledWith({ key: "old-back.pdf" });

    const llamadas = llamadasGraphql();
    const actualizacion = llamadas.find((c) => c.query === updateBadge);
    expect(actualizacion.variables.input).toEqual({
      id: "b1",
      frontDesign: "public/badges/nuevo-front.pdf",
      backDesign: "public/badges/nuevo-back.pdf",
      _version: 7,
    });
    // no crea badge nuevo ni toca el evento
    expect(llamadas.find((c) => c.query === createBadge)).toBeUndefined();
    expect(llamadas.find((c) => c.query === updateEvent)).toBeUndefined();

    expect(await screen.findAllByText("Diseño cargado")).toHaveLength(2);
  });

  test("si la subida a S3 falla muestra la alerta de error", async () => {
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    uploadData.mockImplementation(() => ({
      result: Promise.reject(new Error("s3 caído")),
    }));

    setFile("front-file-upload", pdf("front.pdf"));
    setFile("back-file-upload", pdf("back.pdf"));
    submitForm();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Error al guardar los gafetes: s3 caído"
      )
    );
    expect(errSpy).toHaveBeenCalled();
    expect(mockGraphql).not.toHaveBeenCalled();
  });

  test("sin permiso de edición muestra solo lectura y el submit no hace nada", async () => {
    mockUsePermissions.mockReturnValue({
      loading: false,
      isAdmin: false,
      can: () => false,
    });
    seed({ Event: [{ id: "ev-1", _version: 1 }] });
    renderGafete();
    await screen.findByText("Front Design (PDF)");

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    submitForm();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(uploadData).not.toHaveBeenCalled();
  });
});
