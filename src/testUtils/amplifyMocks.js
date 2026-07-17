/* Utilidades COMPARTIDAS para tests (excluidas de cobertura).
 *
 * Uso típico en un test de vista/componente:
 *
 *   jest.mock("aws-amplify/datastore", () => require("testUtils/amplifyMocks").dataStoreMock());
 *   jest.mock("aws-amplify/api", () => require("testUtils/amplifyMocks").apiMock());
 *
 * OJO: jest.mock se hoistea — las factorías deben requerir este módulo adentro
 * (como arriba), no cerrar sobre variables del test.
 */
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// DataStore con respuestas configurables por modelo (query/save/observeQuery).
export const dataStoreMock = (fixtures = {}) => ({
  DataStore: {
    query: jest.fn(async (Model) => {
      const name = Model?.name || String(Model);
      const rows = fixtures[name] || [];
      return rows;
    }),
    save: jest.fn(async (m) => m),
    delete: jest.fn(async (m) => m),
    observeQuery: jest.fn(() => ({
      subscribe: (cb) => {
        cb({ items: [], isSynced: true });
        return { unsubscribe: jest.fn() };
      },
    })),
    stop: jest.fn(),
    start: jest.fn(),
  },
});

// aws-amplify/api: generateClient().graphql resolvible por query.
export const apiMock = (graphqlImpl) => ({
  generateClient: () => ({
    graphql: jest.fn(graphqlImpl || (async () => ({ data: {} }))),
    cancel: jest.fn(),
  }),
  post: jest.fn(async () => ({ body: { json: async () => ({}) } })),
});

// Render con router para componentes que usan useNavigate/useParams/Link.
export const renderWithRouter = (ui, { route = "/" } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// Evento por defecto: factoría para entregar SIEMPRE un objeto fresco (evita
// compartir una referencia mutable entre tests).
const defaultStoredEvent = () => ({ id: "ev-1", title: "Evento Test" });

// localStorage con el evento cacheado que muchas vistas admin leen.
export const seedStoredEvent = (event = defaultStoredEvent()) => {
  localStorage.setItem("EVENTFLOW.event", JSON.stringify(event));
  return event;
};
