import React from 'react';
import { render } from '@testing-library/react';

// amplifyconfiguration.json no se commitea al repo (.gitignore), pero
// App.jsx la importa. En CI el archivo no existe; le damos un stub vacío.
jest.mock('./amplifyconfiguration.json', () => ({}), { virtual: true });

// Mock all external dependencies that App relies on
jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

jest.mock('aws-amplify/utils', () => ({
  I18n: { putVocabularies: jest.fn(), setLanguage: jest.fn() },
  Hub: { listen: jest.fn(() => jest.fn()) },
}));

jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: Object.assign(
    (props) => <div data-testid="authenticator">{props.children}</div>,
    { Provider: ({ children }) => <div>{children}</div> }
  ),
  useAuthenticator: () => ({
    route: 'idle',
    authStatus: 'unauthenticated',
  }),
  translations: {},
}));

jest.mock('@hotjar/browser', () => ({
  __esModule: true,
  default: { init: jest.fn() },
}));

jest.mock('./providers/PermissionsProvider', () => ({
  PermissionsProvider: ({ children }) => <div>{children}</div>,
  usePermissions: () => ({ loading: false, isReportesOnly: false, isAdmin: true }),
}));

// Mock all layout components
jest.mock('layouts/admin', () => () => <div data-testid="admin-layout" />);
jest.mock('layouts/auth', () => () => <div data-testid="auth-layout" />);
jest.mock('layouts/page', () => () => <div data-testid="page-layout" />);
jest.mock('layouts/landing', () => () => <div data-testid="landing-layout" />);
jest.mock('layouts/privacidad', () => () => <div data-testid="legal-layout" />);
jest.mock('layouts/usuario', () => () => <div data-testid="user-layout" />);
jest.mock('layouts/rtl', () => () => <div data-testid="rtl-layout" />);

// Use moduleNameMapper-style approach: mock the CSS import at the module level
// CRA already handles CSS mocking via its jest config, so we don't need to mock it here.

describe('App', () => {
  it('renders without crashing for unauthenticated users', () => {
    // Dynamic require after mocks are set up
    const App = require('./App').default;
    const { BrowserRouter } = require('react-router-dom');

    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Should render the login form for unauthenticated users
    expect(container).toBeTruthy();
  });
});
