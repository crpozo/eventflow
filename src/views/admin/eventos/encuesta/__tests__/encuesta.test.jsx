/* Tests del builder de encuestas (builder.jsx) y de la vista admin de
 * Encuesta (index.jsx).
 *
 * Builder: contrato de datos formBuilder (hydrate/export/newField), paleta
 * (clic + teclado Enter/Espacio), edición de tarjetas (label, opciones,
 * obligatoria), duplicar/eliminar, drag & drop (paleta→lienzo, reordenar),
 * modo solo-lectura y el modal de vista previa.
 *
 * Index: loader pre-sync, redirect sin evento, hidratación desde la Survey,
 * guardar (copyOf / crear nueva / reusar fila encontrada por query / error),
 * pestaña de envío (config + envío manual con confirm), compartir y prueba
 * (post userApi) y permisos de solo lectura.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Mocks de frontera ─────────────────────────────────────────────────── */

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Survey es constructor (new Survey) con copyOf estático (DataStore.save).
// copyOf/constructor son funciones planas para sobrevivir a resetMocks.
jest.mock("models", () => {
  function Survey(init) {
    Object.assign(this, init);
    if (!this.id) this.id = `sv-nuevo-${++Survey.__seq}`;
  }
  Survey.__seq = 0;
  Survey.copyOf = (base, mutate) => {
    const draft = { ...base };
    mutate(draft);
    return draft;
  };
  return { Survey };
});

// DataStore con estado configurable: `emissions` alimenta observeQuery (vacío
// → nunca emite, para el loader) y `queryRows` la re-consulta de persistSurvey.
jest.mock("aws-amplify/datastore", () => {
  const state = { queryRows: [], emissions: [] };
  const impls = {
    query: async () => state.queryRows,
    save: async (m) => m,
    observe: () => ({
      subscribe: (cb) => {
        state.emissions.forEach((e) => cb(e));
        return { unsubscribe: () => {} };
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

jest.mock("aws-amplify/api", () => {
  const graphql = jest.fn();
  const post = jest.fn();
  return {
    __mocks: { graphql, post },
    generateClient: () => ({ graphql }),
    post,
  };
});

const mockUsePermissions = jest.fn();
jest.mock("providers/PermissionsProvider", () => ({
  usePermissions: () => mockUsePermissions(),
}));

const { DataStore } = require("aws-amplify/datastore");
const api = require("aws-amplify/api");
const {
  QuestionsTab,
  PreviewModal,
  hydrateQuestions,
  exportQuestions,
  newField,
} = require("views/admin/eventos/encuesta/builder");
const Encuesta = require("views/admin/eventos/encuesta").default;

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const RAW_QUESTIONS = [
  { type: "header", subtype: "h2", label: "Sección 1", name: "header-1" },
  {
    type: "text",
    label: "¿Tu nombre?",
    name: "text-1",
    className: "form-control",
    placeholder: "Nombre",
  },
  {
    type: "radio-group",
    label: "Satisfacción",
    name: "radio-1",
    required: true,
    values: [
      { label: "Buena", value: "option-1" },
      { label: "Mala", value: "option-2" },
    ],
  },
  { type: "textarea", label: "Comentarios", name: "textarea-1" },
  { type: "autocomplete", label: "Campo legado", name: "auto-1", subtype: "x" },
];

const SURVEY_ROW = {
  id: "sv-1",
  surveyEventId: "ev-1",
  questions: JSON.stringify(RAW_QUESTIONS),
  active: false,
  emailSubject: "Asunto guardado",
  emailIntro: "Intro guardada",
  sendAt: "2026-07-02T23:00:00.000Z",
};

const postResponds = (data) =>
  api.__mocks.post.mockReturnValue({
    response: Promise.resolve({ body: { json: async () => data } }),
  });

// La paleta se renderiza DESPUÉS del lienzo: la última coincidencia del label
// con ancestro role=button es siempre el item de la paleta (los chips de
// tarjeta usan el mismo texto y el tip del pie no es clicable).
const paletteItem = (label) =>
  screen
    .getAllByText(label)
    .map((el) => el.closest('[role="button"]'))
    .filter(Boolean)
    .pop();

const cardOf = (label) => screen.getByText(label).closest('[role="button"]');

const makeDT = (data) => ({
  types: Object.keys(data),
  getData: (k) => (k in data ? data[k] : ""),
  setData: (k, v) => {
    data[k] = String(v);
  },
  effectAllowed: "",
});

let alertSpy;
let confirmSpy;

beforeAll(() => {
  // jsdom no implementa scrollIntoView (se usa al añadir preguntas).
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "EVENTFLOW.event",
    JSON.stringify({ id: "ev-1", title: "Evento Test" })
  );
  mockUsePermissions.mockReturnValue({ loading: false, can: () => true });
  // resetMocks:true (CRA) borra implementaciones antes de cada test.
  DataStore.query.mockImplementation(DataStore.__impls.query);
  DataStore.save.mockImplementation(DataStore.__impls.save);
  DataStore.observeQuery.mockImplementation(DataStore.__impls.observe);
  DataStore.__state.queryRows = [];
  DataStore.__state.emissions = [];
  api.__mocks.graphql.mockResolvedValue({ data: { listSurveys: { items: [] } } });
  postResponds({});
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  confirmSpy = jest.spyOn(window, "confirm").mockImplementation(() => true);
});

/* ── Builder: contrato de datos formBuilder ────────────────────────────── */

describe("Builder — contrato de datos (hydrate/export/newField)", () => {
  test("hydrateQuestions tolera JSON inválido, no-arrays y campos malformados", () => {
    expect(hydrateQuestions("esto no es json")).toEqual([]);
    expect(hydrateQuestions(JSON.stringify({ solo: "objeto" }))).toEqual([]);
    expect(hydrateQuestions(null)).toEqual([]);
    // filtra elementos basura del array
    expect(
      hydrateQuestions([null, "texto", { type: "text", name: "t1" }])
    ).toHaveLength(1);
    // campo de opciones sin values: el editor las reconstruye ([]), label null → ""
    const [q] = hydrateQuestions(
      JSON.stringify([{ type: "select", label: null, name: "s1" }])
    );
    expect(q.values).toEqual([]);
    expect(q.label).toBe("");
    expect(q.name).toBe("s1");
  });

  test("exportQuestions preserva props desconocidas y limpia required/placeholder", () => {
    const fields = hydrateQuestions([
      {
        type: "text",
        label: "A",
        name: "t1",
        required: true,
        placeholder: "ayuda",
        subtype: "email",
        extra: { keep: true },
      },
      {
        type: "radio-group",
        label: "B",
        name: "r1",
        values: [{ label: "X", value: "v1", selected: true }],
        other: true,
        inline: true,
      },
    ]);
    // el usuario desmarca obligatoria y borra el placeholder
    fields[0] = { ...fields[0], required: false, placeholder: "" };
    // renombra la opción sin tocar su value
    fields[1] = { ...fields[1], values: [{ label: "Y", value: "v1" }] };
    const out = exportQuestions(fields);
    expect(out[0]).toEqual({
      type: "text",
      label: "A",
      name: "t1",
      subtype: "email",
      extra: { keep: true },
    });
    expect(out[1]).toMatchObject({
      other: true,
      inline: true,
      name: "r1",
      values: [{ label: "Y", value: "v1" }],
    });
    expect(out[1].required).toBeUndefined();
  });

  test("newField genera nombres únicos y respeta className/subtype por tipo", () => {
    const radio = newField("radio-group");
    const texto = newField("text");
    const header = newField("header");
    const parrafo = newField("paragraph");
    expect(radio.name).not.toBe(texto.name);
    expect(texto.name).toMatch(/^text-\d+-\d+$/);
    // los grupos de opciones NO llevan form-control (formRender lo copia a cada input)
    expect(radio.raw.className).toBeUndefined();
    expect(radio.values).toHaveLength(3);
    expect(radio.raw.values).toEqual(radio.values);
    expect(texto.raw.className).toBe("form-control");
    expect(header.raw.subtype).toBe("h2");
    expect(parrafo.raw.subtype).toBe("p");
  });
});

/* ── Builder: QuestionsTab (lienzo + paleta) ───────────────────────────── */

function Harness({ initial = [], canEdit = true, fieldsRef = { current: null } }) {
  const [fields, setFields] = React.useState(initial);
  const [selectedUid, setSelectedUid] = React.useState(null);
  fieldsRef.current = fields;
  return (
    <MemoryRouter>
      <QuestionsTab
        fields={fields}
        setFields={setFields}
        selectedUid={selectedUid}
        setSelectedUid={setSelectedUid}
        canEdit={canEdit}
        eventId="ev-1"
      />
    </MemoryRouter>
  );
}

describe("Builder — paleta y tarjetas", () => {
  test("añade preguntas con clic, Enter y Espacio; muestra el preview por tipo", () => {
    render(<Harness />);
    expect(
      screen.getByText("Añade tu primera pregunta desde la paleta")
    ).toBeInTheDocument();

    // clic → se añade seleccionada (input con el label por defecto)
    fireEvent.click(paletteItem("Selección"));
    expect(screen.getByDisplayValue("Pregunta de selección")).toBeInTheDocument();

    // Enter en la paleta (role=button accesible)
    fireEvent.keyDown(paletteItem("Casillas"), { key: "Enter" });
    // la anterior quedó deseleccionada → preview del select
    expect(screen.getByText("Selecciona una opción…")).toBeInTheDocument();

    // Espacio en la paleta
    fireEvent.keyDown(paletteItem("Número"), { key: " " });
    // preview de casillas: sus opciones por defecto son visibles
    expect(screen.getAllByText("Opción 1").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(paletteItem("Fecha"));
    expect(screen.getByText("0")).toBeInTheDocument(); // preview number

    fireEvent.click(screen.getByText("Listo")); // deselecciona la fecha
    expect(screen.getByText("dd/mm/aaaa")).toBeInTheDocument(); // preview date
    expect(
      screen.getByText(
        "Arrastra un tipo aquí o haz clic en la paleta para añadir una pregunta"
      )
    ).toBeInTheDocument();
  });

  test("edita opciones: añadir con value secuencial, renombrar sin tocar value y quitar", () => {
    const ref = { current: null };
    render(<Harness fieldsRef={ref} />);
    fireEvent.click(paletteItem("Opción única"));
    expect(screen.getByDisplayValue("Opción 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Opción 3")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+ Añadir opción"));
    expect(screen.getByDisplayValue("Opción 4")).toBeInTheDocument();
    expect(ref.current[0].values.map((v) => v.value)).toEqual([
      "option-1",
      "option-2",
      "option-3",
      "option-4",
    ]);

    // renombrar la primera opción no reescribe su value
    fireEvent.change(screen.getByDisplayValue("Opción 1"), {
      target: { value: "Excelente" },
    });
    expect(ref.current[0].values[0]).toEqual({
      label: "Excelente",
      value: "option-1",
    });

    // quitar hasta dejar una sola → el botón queda deshabilitado
    fireEvent.click(screen.getAllByTitle("Quitar opción")[3]);
    fireEvent.click(screen.getAllByTitle("Quitar opción")[2]);
    fireEvent.click(screen.getAllByTitle("Quitar opción")[1]);
    expect(ref.current[0].values).toHaveLength(1);
    expect(screen.getAllByTitle("Quitar opción")[0]).toBeDisabled();

    fireEvent.click(screen.getByText("Listo"));
    expect(screen.getByText("Excelente")).toBeInTheDocument();
  });

  test("selección por teclado en la tarjeta, label editable y toggle Obligatoria", () => {
    const ref = { current: null };
    render(
      <Harness
        initial={hydrateQuestions([{ type: "text", label: "PA", name: "n-a" }])}
        fieldsRef={ref}
      />
    );
    // Enter sobre la tarjeta (role=button) la selecciona
    fireEvent.keyDown(cardOf("PA"), { key: "Enter" });
    const input = screen.getByDisplayValue("PA");
    fireEvent.change(input, { target: { value: "PA editada" } });
    // Enter DENTRO del input no roba el foco ni cierra la edición
    fireEvent.keyDown(screen.getByDisplayValue("PA editada"), { key: "Enter" });
    expect(screen.getByDisplayValue("PA editada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch")); // Obligatoria ON
    fireEvent.click(screen.getByText("Listo"));
    expect(screen.getByText("PA editada")).toBeInTheDocument();
    expect(screen.getByText("Obligatoria")).toBeInTheDocument();
    // el name NUNCA cambia al editar
    expect(ref.current[0].name).toBe("n-a");
    expect(exportQuestions(ref.current)[0].required).toBe(true);
  });

  test("duplicar crea una copia con name nuevo y eliminar la quita", () => {
    const ref = { current: null };
    render(
      <Harness
        initial={hydrateQuestions([
          { type: "text", label: "PA", name: "n-a" },
          { type: "text", label: "PB", name: "n-b" },
        ])}
        fieldsRef={ref}
      />
    );
    fireEvent.click(within(cardOf("PA")).getByTitle("Duplicar"));
    expect(screen.getAllByText("PA")).toHaveLength(2);
    expect(ref.current).toHaveLength(3);
    // la copia va justo después y con name NUEVO (las respuestas no se mezclan)
    expect(ref.current[1].label).toBe("PA");
    expect(ref.current[1].name).not.toBe("n-a");
    expect(ref.current[1].raw.name).toBe(ref.current[1].name);

    const dupCard = screen.getAllByText("PA")[1].closest('[role="button"]');
    fireEvent.click(within(dupCard).getByTitle("Eliminar"));
    expect(screen.getAllByText("PA")).toHaveLength(1);
    expect(ref.current.map((f) => f.label)).toEqual(["PA", "PB"]);
  });

  test("estructurales: sin toggle Obligatoria y placeholders de texto vacío", () => {
    render(<Harness />);
    fireEvent.click(paletteItem("Título"));
    expect(screen.queryByRole("switch")).not.toBeInTheDocument(); // estructural
    fireEvent.change(screen.getByDisplayValue("Título de sección"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Listo"));
    expect(screen.getByText("Título sin texto")).toBeInTheDocument();

    fireEvent.click(paletteItem("Descripción"));
    fireEvent.click(screen.getByText("Listo"));
    expect(screen.getByText("Texto descriptivo")).toBeInTheDocument();
  });

  test("drag & drop: paleta→dropzone añade, mover reordena y paleta→tarjeta inserta antes", () => {
    const ref = { current: null };
    render(
      <Harness
        initial={hydrateQuestions([
          { type: "text", label: "PA", name: "n-a" },
          { type: "text", label: "PB", name: "n-b" },
        ])}
        fieldsRef={ref}
      />
    );
    // soltar un tipo de la paleta en la dropzone → al final
    fireEvent.drop(screen.getByText(/Arrastra un tipo aquí/), {
      dataTransfer: makeDT({ "eventflow/palette": "date" }),
    });
    expect(ref.current.map((f) => f.type)).toEqual(["text", "text", "date"]);

    // mover PB (índice 1) soltándola sobre PA (índice 0)
    fireEvent.drop(cardOf("PA"), {
      dataTransfer: makeDT({ "eventflow/move": "1" }),
    });
    expect(ref.current.map((f) => f.label)).toEqual([
      "PB",
      "PA",
      "Pregunta de fecha",
    ]);

    // soltar un tipo de la paleta sobre una tarjeta → se inserta ANTES de ella
    fireEvent.drop(cardOf("PA"), {
      dataTransfer: makeDT({ "eventflow/palette": "number" }),
    });
    expect(ref.current.map((f) => f.label)).toEqual([
      "PB",
      "Pregunta numérica",
      "PA",
      "Pregunta de fecha",
    ]);
  });

  test("canEdit=false bloquea añadir y seleccionar", () => {
    render(
      <Harness
        canEdit={false}
        initial={hydrateQuestions([{ type: "text", label: "PA", name: "n-a" }])}
      />
    );
    fireEvent.click(paletteItem("Texto corto"));
    expect(screen.queryByText("Pregunta de texto corto")).not.toBeInTheDocument();
    fireEvent.click(cardOf("PA"));
    expect(screen.queryByDisplayValue("PA")).not.toBeInTheDocument();
  });
});

/* ── Builder: modal de vista previa ────────────────────────────────────── */

describe("Builder — PreviewModal", () => {
  const previewFields = hydrateQuestions([
    { type: "header", label: "Encabezado H", name: "h1" },
    { type: "paragraph", label: "Párrafo P", name: "p1" },
    {
      type: "radio-group",
      label: "Radio Q",
      name: "r1",
      required: true,
      values: [
        { label: "Sí", value: "si" },
        { label: "No", value: "no" },
      ],
    },
    {
      type: "checkbox-group",
      label: "Check Q",
      name: "c1",
      values: [{ label: "CasillaA", value: "a" }],
    },
    {
      type: "select",
      label: "Select Q",
      name: "s1",
      values: [{ label: "Uno", value: "1" }],
    },
    { type: "text", label: "Texto Q", name: "t1", placeholder: "escribe aquí" },
    { type: "textarea", label: "Area Q", name: "ta1" },
    { type: "number", label: "Num Q", name: "nu1" },
    { type: "date", label: "Date Q", name: "d1" },
    { type: "custom-widget", label: "Legacy Q", name: "x1" },
  ]);

  test("renderiza cada tipo como control real y cierra por botón, fondo y teclado", () => {
    const onClose = jest.fn();
    const { container } = render(
      <PreviewModal fields={previewFields} onClose={onClose} />
    );
    expect(screen.getByText("Vista previa")).toBeInTheDocument();
    expect(screen.getByText("Encabezado H")).toBeInTheDocument();
    expect(screen.getByText("Párrafo P")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByText("*")).toBeInTheDocument(); // obligatoria
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      within(screen.getByRole("combobox")).getByText("Uno")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("escribe aquí")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument(); // number
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    // tipo desconocido → control deshabilitado, nunca crashea
    expect(screen.getByPlaceholderText("Campo custom-widget")).toBeDisabled();

    // clic dentro del contenido NO cierra
    fireEvent.click(screen.getByText("Vista previa"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Cerrar"));
    fireEvent.click(container.firstChild); // fondo
    fireEvent.keyDown(container.firstChild, { key: "Enter" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  test("sin preguntas muestra el estado vacío", () => {
    render(<PreviewModal fields={[]} onClose={jest.fn()} />);
    expect(screen.getByText("Aún no hay preguntas.")).toBeInTheDocument();
  });
});

/* ── Vista admin de Encuesta (index.jsx) ───────────────────────────────── */

const renderEncuesta = () =>
  render(
    <MemoryRouter>
      <Encuesta />
    </MemoryRouter>
  );

describe("Encuesta admin — carga e hidratación", () => {
  test("muestra el loader mientras el store no emite (pre-sync)", () => {
    DataStore.__state.emissions = []; // nunca emite
    renderEncuesta();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByText("Encuesta del evento")).not.toBeInTheDocument();
  });

  test("sin evento cacheado redirige a /admin", () => {
    localStorage.removeItem("EVENTFLOW.event");
    renderEncuesta();
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
  });

  test("hidrata la Survey existente: badge, tarjetas, obligatoria, IA y tipo legado", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    expect(await screen.findByText("Encuesta del evento")).toBeInTheDocument();
    // badge con el número de preguntas en la pestaña
    expect(
      screen.getByRole("button", { name: "Preguntas 5" })
    ).toBeInTheDocument();
    expect(screen.getByText("Sección 1")).toBeInTheDocument();
    expect(screen.getByText("¿Tu nombre?")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument(); // preview placeholder
    expect(screen.getByText("Satisfacción")).toBeInTheDocument();
    expect(screen.getByText("Obligatoria")).toBeInTheDocument();
    expect(screen.getByText("Buena")).toBeInTheDocument(); // opción del radio
    expect(screen.getByText("Comentarios")).toBeInTheDocument();
    expect(screen.getByText("Análisis IA")).toBeInTheDocument(); // chip textarea
    // tipo desconocido: se muestra genérico, no se pierde ni crashea
    expect(screen.getByText('Campo "autocomplete"')).toBeInTheDocument();
  });
});

describe("Encuesta admin — guardar", () => {
  test("editar el label y guardar exporta JSON compatible (name intacto, raw preservado)", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(screen.getByText("¿Tu nombre?")); // selecciona la tarjeta
    fireEvent.change(screen.getByDisplayValue("¿Tu nombre?"), {
      target: { value: "¿Cómo te llamas?" },
    });
    fireEvent.click(screen.getByText("Listo"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar encuesta" }));

    expect(await screen.findByText(/Guardado hace un momento/)).toBeInTheDocument();
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    const saved = DataStore.save.mock.calls[0][0];
    expect(saved.id).toBe("sv-1"); // copyOf sobre la fila existente
    expect(saved.questions[1]).toEqual({
      type: "text",
      label: "¿Cómo te llamas?",
      name: "text-1", // el name NUNCA se reescribe
      className: "form-control",
      placeholder: "Nombre",
    });
    expect(saved.questions[2]).toEqual(RAW_QUESTIONS[2]); // required:true se conserva
    expect(saved.questions[4]).toEqual(RAW_QUESTIONS[4]); // raw legado intacto
  });

  test("sin Survey previa crea una nueva con active por defecto y la pregunta añadida", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(paletteItem("Texto corto"));
    expect(screen.getByDisplayValue("Pregunta de texto corto")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar encuesta" }));

    expect(await screen.findByText(/Guardado hace un momento/)).toBeInTheDocument();
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    const saved = DataStore.save.mock.calls[0][0];
    expect(saved).toMatchObject({ surveyEventId: "ev-1", active: true });
    expect(saved.questions).toHaveLength(1);
    expect(saved.questions[0]).toMatchObject({
      type: "text",
      label: "Pregunta de texto corto",
      className: "form-control",
    });
    expect(saved.questions[0].name).toMatch(/^text-/);
  });

  test("antes de crear re-consulta el store y reusa la fila existente (no duplica)", async () => {
    DataStore.__state.emissions = [{ items: [], isSynced: true }];
    DataStore.__state.queryRows = [SURVEY_ROW]; // aparece en la re-consulta
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(screen.getByRole("button", { name: "Guardar encuesta" }));
    expect(await screen.findByText(/Guardado hace un momento/)).toBeInTheDocument();
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "sv-1",
      questions: [],
    });
  });

  test("si el guardado falla alerta y no revienta", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    DataStore.save.mockRejectedValue(new Error("red caída"));
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(screen.getByRole("button", { name: "Guardar encuesta" }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("No se pudo guardar la encuesta")
    );
    // el botón vuelve a quedar habilitado (saving=false)
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar encuesta" })
      ).toBeEnabled()
    );
    errSpy.mockRestore();
  });
});

describe("Encuesta admin — envío e invitación", () => {
  test("hidrata la config, guarda cambios y convierte sendAt de vuelta a UTC", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(screen.getByRole("button", { name: "Envío e invitación" }));
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false"); // active:false guardado
    fireEvent.click(toggle);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByDisplayValue("Asunto guardado"), {
      target: { value: "Nuevo asunto" },
    });
    expect(screen.getByDisplayValue("Intro guardada")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar configuración" })
    );
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Configuración guardada")
    );
    // el botón sale de "Guardando..." (savingCfg=false)
    expect(
      await screen.findByRole("button", { name: "Guardar configuración" })
    ).toBeEnabled();
    expect(DataStore.save).toHaveBeenCalledTimes(1);
    // datetime-local (hora local) debe volver EXACTO al instante UTC original
    expect(DataStore.save.mock.calls[0][0]).toMatchObject({
      id: "sv-1",
      active: true,
      emailSubject: "Nuevo asunto",
      emailIntro: "Intro guardada",
      sendAt: "2026-07-02T23:00:00.000Z",
    });
    expect(alertSpy).toHaveBeenCalledWith("Configuración guardada");
  });

  test("envío manual: cancelar no envía; confirmar postea sendAll y estampa sentAt", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    postResponds({ sent: 4, sentAt: "2026-07-10T15:00:00.000Z" });
    renderEncuesta();
    await screen.findByText("Encuesta del evento");
    fireEvent.click(screen.getByRole("button", { name: "Envío e invitación" }));

    const btn = screen.getByRole("button", { name: /Enviar encuesta ahora/ });
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(btn);
    expect(api.__mocks.post).not.toHaveBeenCalled();

    fireEvent.click(btn);
    // con envío automático desactivado el confirm lo aclara
    expect(confirmSpy).toHaveBeenLastCalledWith(
      expect.stringContaining("desactivado")
    );
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Encuesta enviada a 4 asistente(s)")
    );
    expect(api.__mocks.post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/survey-test",
      options: { body: { eventId: "ev-1", sendAll: true } },
    });
    expect(await screen.findByText(/Enviada el/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reenviar encuesta/ })
    ).toBeInTheDocument();
  });

  test("el sentAt estampado por la Lambda llega por GraphQL (no por DataStore)", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    api.__mocks.graphql.mockResolvedValue({
      data: {
        listSurveys: {
          items: [{ id: "sv-1", sentAt: "2026-06-01T10:00:00.000Z" }],
        },
      },
    });
    renderEncuesta();
    await screen.findByText("Encuesta del evento");
    fireEvent.click(screen.getByRole("button", { name: "Envío e invitación" }));

    expect(
      await screen.findByRole("button", { name: /Reenviar encuesta/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Enviada el/)).toBeInTheDocument();
    expect(api.__mocks.graphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { filter: { surveyEventId: { eq: "ev-1" } } },
      })
    );
  });
});

describe("Encuesta admin — compartir y probar", () => {
  test("muestra el enlace público y envía la prueba solo con correo", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");
    fireEvent.click(screen.getByRole("button", { name: "Compartir y probar" }));

    expect(
      screen.getByText(`${window.location.origin}/landing/ev-1/encuesta`)
    ).toBeInTheDocument();

    // sin correo: alerta y NO postea
    fireEvent.click(screen.getByRole("button", { name: /Enviar prueba/ }));
    expect(alertSpy).toHaveBeenCalledWith("Escribe un correo para la prueba");
    expect(api.__mocks.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("tucorreo@usfq.edu.ec"), {
      target: { value: "carlos@usfq.edu.ec" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar prueba/ }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Correo de prueba enviado a carlos@usfq.edu.ec"
      )
    );
    expect(api.__mocks.post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/survey-test",
      options: { body: { eventId: "ev-1", email: "carlos@usfq.edu.ec" } },
    });
  });

  test("un error del backend muestra el HTTP y el detalle en la alerta", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    api.__mocks.post.mockImplementation(() => {
      const err = new Error("boom");
      err.response = {
        statusCode: 500,
        body: JSON.stringify({ error: "sin plantilla" }),
      };
      throw err;
    });
    renderEncuesta();
    await screen.findByText("Encuesta del evento");
    fireEvent.click(screen.getByRole("button", { name: "Compartir y probar" }));
    fireEvent.change(screen.getByPlaceholderText("tucorreo@usfq.edu.ec"), {
      target: { value: "x@y.z" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar prueba/ }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "No se pudo enviar la prueba (HTTP 500): sin plantilla"
      )
    );
    errSpy.mockRestore();
  });
});

describe("Encuesta admin — vista previa y permisos", () => {
  test("abre el modal con controles reales y lo cierra", async () => {
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    fireEvent.click(screen.getByRole("button", { name: /Vista previa/ }));
    const modal = screen
      .getByText("Así verán la encuesta los asistentes.")
      .closest("div");
    expect(within(modal).getAllByRole("radio")).toHaveLength(2);
    expect(within(modal).getByPlaceholderText("Nombre")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Cerrar"));
    expect(
      screen.queryByText("Así verán la encuesta los asistentes.")
    ).not.toBeInTheDocument();
  });

  test("sin permiso de edición: banner, guardar deshabilitado y paleta inerte", async () => {
    mockUsePermissions.mockReturnValue({ loading: false, can: () => false });
    DataStore.__state.emissions = [{ items: [SURVEY_ROW], isSynced: true }];
    renderEncuesta();
    await screen.findByText("Encuesta del evento");

    expect(screen.getByText(/Modo solo lectura/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar encuesta" })
    ).toBeDisabled();
    fireEvent.click(paletteItem("Texto corto"));
    expect(
      screen.queryByText("Pregunta de texto corto")
    ).not.toBeInTheDocument();
    // el badge sigue en 5
    expect(
      screen.getByRole("button", { name: "Preguntas 5" })
    ).toBeInTheDocument();
  });
});
