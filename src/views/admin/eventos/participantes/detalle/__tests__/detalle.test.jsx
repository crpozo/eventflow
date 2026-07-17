/**
 * Tests del perfil público del participante (ruta /usuario/:id, componente
 * src/views/admin/eventos/participantes/detalle/index.jsx).
 *
 * Mocks en frontera de módulo:
 *  - aws-amplify/datastore: helper compartido (query/start/stop re-primados en
 *    beforeEach porque CRA activa resetMocks).
 *  - aws-amplify/utils: Hub.listen captura los callbacks para emitir el evento
 *    "ready" de datastore manualmente.
 *  - models: objetos con name (la query mock despacha por Model.name).
 *  - react-router-dom: useNavigate espiado, MemoryRouter real para useParams.
 */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Profile from "views/admin/eventos/participantes/detalle";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("aws-amplify/datastore", () =>
  require("testUtils/amplifyMocks").dataStoreMock()
);

jest.mock("aws-amplify/utils", () => ({
  Hub: { listen: jest.fn() },
}));

jest.mock("models", () => ({
  Attendee: { name: "Attendee" },
  EventAttendee: { name: "EventAttendee" },
}));

const { DataStore } = require("aws-amplify/datastore");
const { Hub } = require("aws-amplify/utils");

// Callbacks registrados con Hub.listen('datastore', cb) por el componente.
let hubCallbacks = [];
// Fixtures por modelo que DataStore.query devuelve en cada test.
let fixtures = {};

const emitHub = async (event) => {
  await act(async () => {
    hubCallbacks.forEach((cb) => cb({ payload: { event } }));
  });
};

const formAnswersFixture = () => [
  { name: "nombres", label: "Nombres completos", userData: ["María Prueba"] },
  { name: "email", label: "Correo electrónico", userData: ["maria@test.com"] },
  {
    name: "cert_enviar",
    label: "¿Deseas recibir tu certificado de participación?",
    userData: ["Si"],
  },
  { name: "telefono", label: "Teléfono", userData: [""] }, // vacío: no se imprime
  { name: "sin_datos", label: "Sin userData" }, // sin userData: no se imprime
];

const renderProfile = (route = "/usuario/att-1", path = "/usuario/:id") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  hubCallbacks = [];
  fixtures = {};
  Hub.listen.mockImplementation((channel, cb) => {
    hubCallbacks.push(cb);
    return jest.fn();
  });
  DataStore.query.mockImplementation(async (Model) => {
    return fixtures[Model?.name] || [];
  });
  DataStore.start.mockImplementation(async () => {});
  DataStore.stop.mockImplementation(async () => {});
  delete DataStore.state;
});

describe("Perfil público del participante (/usuario/:id)", () => {
  test("muestra el loader hasta que DataStore emite 'ready' (otros eventos se ignoran)", async () => {
    fixtures = { Attendee: [{ id: "att-1" }], EventAttendee: [] };
    renderProfile();

    // Loader inicial (PageLoader) mientras sincroniza.
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(Hub.listen).toHaveBeenCalledWith("datastore", expect.any(Function));

    // Un evento distinto de "ready" no dispara la query ni quita el loader.
    await emitHub("networkStatus");
    expect(DataStore.query).not.toHaveBeenCalled();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();

    await emitHub("ready");
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  test("renderiza el perfil con formAnswers: nombre, campos con valor y cert_enviar legible ('Si')", async () => {
    fixtures = {
      Attendee: [{ id: "att-1" }],
      EventAttendee: [
        { id: "ea-1", attendeeID: "att-1", formAnswers: formAnswersFixture() },
      ],
    };
    renderProfile();
    await emitHub("ready");

    // Nombre en el encabezado (y una sola vez: el loop excluye "nombres").
    expect(await screen.findByText("María Prueba")).toBeInTheDocument();
    expect(screen.getAllByText("María Prueba")).toHaveLength(1);

    // Campos con valor: label + respuesta.
    expect(screen.getByText("Correo electrónico:")).toBeInTheDocument();
    expect(screen.getByText("maria@test.com")).toBeInTheDocument();

    // cert_enviar imprime "Si" legible (values legibles de certFields, no el
    // token viejo "Siquiero").
    expect(
      screen.getByText("¿Deseas recibir tu certificado de participación?:")
    ).toBeInTheDocument();
    expect(screen.getByText("Si")).toBeInTheDocument();
    expect(screen.queryByText("Siquiero")).not.toBeInTheDocument();

    // Los campos vacíos o sin userData no se imprimen.
    expect(screen.queryByText("Teléfono:")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin userData:")).not.toBeInTheDocument();

    // Link a LinkedIn armado con el nombre del participante.
    const linkedin = screen.getByText("Seguir en LinkedIn");
    expect(linkedin.getAttribute("href")).toContain(
      "linkedin.com/search/results/all/?keywords=María Prueba"
    );

    // Las queries usaron los modelos correctos.
    const modelsQueried = DataStore.query.mock.calls.map(([m]) => m.name);
    expect(modelsQueried).toEqual(["Attendee", "EventAttendee"]);
  });

  test("muestra 'No existe un participante' cuando el id no tiene Attendee", async () => {
    fixtures = { Attendee: [], EventAttendee: [] };
    renderProfile("/usuario/att-404");
    await emitHub("ready");

    expect(
      await screen.findByText("No existe un participante con ID:")
    ).toBeInTheDocument();
    expect(screen.getByText("att-404")).toBeInTheDocument();
    // No se intentó buscar EventAttendee sin Attendee.
    expect(
      DataStore.query.mock.calls.map(([m]) => m.name)
    ).toEqual(["Attendee"]);
  });

  test("attendee sin EventAttendee: no muestra la tarjeta y reinicia DataStore si estaba 'Starting'", async () => {
    DataStore.state = "Starting"; // fuerza la rama stop() + start()
    fixtures = { Attendee: [{ id: "att-1" }], EventAttendee: [] };
    const { container } = renderProfile();

    await act(async () => {}); // deja correr startData()
    expect(DataStore.stop).toHaveBeenCalled();
    expect(DataStore.start).toHaveBeenCalled();

    await emitHub("ready");
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
    // Sin EventAttendee no hay tarjeta ni link de LinkedIn.
    expect(container.querySelector(".profile-page")).toBeInTheDocument();
    expect(screen.queryByText("Seguir en LinkedIn")).not.toBeInTheDocument();
  });

  test("sin id en la ruta redirige a '/'", async () => {
    renderProfile("/usuario", "/usuario");
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
