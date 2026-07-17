/* Tests de App.jsx: enrutado raíz por estado de sesión.
 *  - Anónimo: pantalla de login (Authenticator) y rutas públicas
 *    (/landing, /privacidad, /usuario) sin PermissionsProvider.
 *  - Autenticado: ReportesRouteHandler en sus dos ramas (rol Reportes con
 *    redirección forzada a /admin/reportes vs. usuario normal con todas
 *    las rutas) y el gate de permisos cargando.
 *  - Efectos: Hub signedOut (limpia localStorage y redirige), init de
 *    Hotjar (requestIdleCallback vs setTimeout) y script de Cookiebot.
 * Amplify, Hotjar, PermissionsProvider y los 6 layouts se mockean en la
 * frontera; los layouts exponen data-testid para asertar el montaje.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// amplifyconfiguration.json no se commitea al repo (.gitignore), pero
// App.jsx la importa. En CI el archivo no existe; le damos un stub vacío.
jest.mock('./amplifyconfiguration.json', () => ({}), { virtual: true });

jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

// OJO: CRA corre jest con resetMocks:true — las implementaciones de los
// jest.fn() se reinstalan en el beforeEach, no aquí.
jest.mock('aws-amplify/utils', () => ({
  I18n: { putVocabularies: jest.fn(), setLanguage: jest.fn() },
  Hub: { listen: jest.fn() },
}));

jest.mock('@aws-amplify/ui-react', () => {
  const React = require('react');
  return {
    Authenticator: Object.assign(
      (props) => React.createElement('div', { 'data-testid': 'authenticator' }, props.children),
      { Provider: ({ children }) => React.createElement('div', null, children) }
    ),
    useAuthenticator: jest.fn(),
    translations: {},
  };
});

jest.mock('@hotjar/browser', () => ({
  __esModule: true,
  default: { init: jest.fn() },
}));

jest.mock('./providers/PermissionsProvider', () => {
  const React = require('react');
  return {
    PermissionsProvider: ({ children }) =>
      React.createElement('div', { 'data-testid': 'permissions-provider' }, children),
    usePermissions: jest.fn(),
  };
});

// Layouts mockeados con data-testid. __esModule + default para que el
// interop de React.lazy(() => import(...)) encuentre siempre el default.
jest.mock('layouts/admin', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) =>
      React.createElement('div', {
        'data-testid': 'admin-layout',
        'data-reportesonly': String(props.reportesOnly === true),
      }),
  };
});
jest.mock('layouts/auth', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'auth-layout' }) };
});
jest.mock('layouts/page', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'page-layout' }) };
});
jest.mock('layouts/landing', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'landing-layout' }) };
});
jest.mock('layouts/privacidad', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'legal-layout' }) };
});
jest.mock('layouts/usuario', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'user-layout' }) };
});

import { Hub } from 'aws-amplify/utils';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { usePermissions } from './providers/PermissionsProvider';
import Hotjar from '@hotjar/browser';
import App from './App';

let hubCallback;
let hubUnsubscribe;

beforeEach(() => {
  localStorage.clear();
  hubCallback = null;
  hubUnsubscribe = jest.fn();
  // resetMocks:true (CRA) limpia las implementaciones antes de cada test.
  Hub.listen.mockImplementation((channel, cb) => {
    hubCallback = cb;
    return hubUnsubscribe;
  });
  useAuthenticator.mockReturnValue({ route: 'signIn', authStatus: 'unauthenticated' });
  usePermissions.mockReturnValue({ loading: false, isReportesOnly: false });
});

const renderApp = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );

const asAuthenticated = () =>
  useAuthenticator.mockReturnValue({ route: 'authenticated', authStatus: 'authenticated' });

describe('App — estado de carga', () => {
  test('sin route todavía muestra el loader de pantalla completa', () => {
    useAuthenticator.mockReturnValue({ route: undefined, authStatus: 'unauthenticated' });
    renderApp('/');

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticator')).not.toBeInTheDocument();
  });

  test('con authStatus configuring muestra el loader aunque haya route', () => {
    useAuthenticator.mockReturnValue({ route: 'signIn', authStatus: 'configuring' });
    renderApp('/');

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticator')).not.toBeInTheDocument();
  });
});

describe('App — usuario anónimo', () => {
  test('en la raíz muestra la pantalla de login con el Authenticator', () => {
    renderApp('/');

    expect(screen.getByTestId('authenticator')).toBeInTheDocument();
    expect(screen.getByAltText('Logo USFQ')).toBeInTheDocument();
    expect(
      screen.getByText(/Inicia sesión para acceder a tu panel/)
    ).toBeInTheDocument();
    // Nada del árbol autenticado
    expect(screen.queryByTestId('permissions-provider')).not.toBeInTheDocument();
  });

  test('puede ver la landing pública sin login', async () => {
    renderApp('/landing/ev-1');

    expect(await screen.findByTestId('landing-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticator')).not.toBeInTheDocument();
  });

  test('puede ver la página legal (/privacidad) sin login', async () => {
    renderApp('/privacidad');

    expect(await screen.findByTestId('legal-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticator')).not.toBeInTheDocument();
  });

  test('puede ver el perfil público de usuario sin login', async () => {
    renderApp('/usuario/participante-1');

    expect(await screen.findByTestId('user-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticator')).not.toBeInTheDocument();
  });
});

describe('App — usuario autenticado (ReportesRouteHandler)', () => {
  test('mientras cargan los permisos no monta ninguna ruta', () => {
    asAuthenticated();
    usePermissions.mockReturnValue({ loading: true, isReportesOnly: false });
    renderApp('/admin');

    expect(screen.getByTestId('permissions-provider')).toBeEmptyDOMElement();
  });

  test('usuario normal en /admin monta el layout admin completo', async () => {
    asAuthenticated();
    renderApp('/admin');

    const admin = await screen.findByTestId('admin-layout');
    expect(admin).toHaveAttribute('data-reportesonly', 'false');
    expect(screen.getByTestId('permissions-provider')).toBeInTheDocument();
  });

  test('usuario normal en la raíz es redirigido a /admin', async () => {
    asAuthenticated();
    renderApp('/');

    expect(await screen.findByTestId('admin-layout')).toBeInTheDocument();
  });

  test.each([
    ['/auth/sign-in', 'auth-layout'],
    ['/page/campus', 'page-layout'],
    ['/landing/ev-1', 'landing-layout'],
    ['/privacidad', 'legal-layout'],
    ['/usuario/participante-1', 'user-layout'],
  ])('usuario normal en %s monta %s', async (ruta, testid) => {
    asAuthenticated();
    renderApp(ruta);

    expect(await screen.findByTestId(testid)).toBeInTheDocument();
  });

  test('rol Reportes fuera de /admin/reportes es redirigido al admin reportesOnly', async () => {
    asAuthenticated();
    usePermissions.mockReturnValue({ loading: false, isReportesOnly: true });
    renderApp('/admin/dashboard');

    const admin = await screen.findByTestId('admin-layout');
    expect(admin).toHaveAttribute('data-reportesonly', 'true');
    // No debe quedar montado ningún otro layout
    expect(screen.queryByTestId('page-layout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-layout')).not.toBeInTheDocument();
  });

  test('rol Reportes entrando directo a /admin/reportes no redirige y monta reportesOnly', async () => {
    asAuthenticated();
    usePermissions.mockReturnValue({ loading: false, isReportesOnly: true });
    renderApp('/admin/reportes');

    const admin = await screen.findByTestId('admin-layout');
    expect(admin).toHaveAttribute('data-reportesonly', 'true');
  });
});

describe('App — Hub de auth (signedOut)', () => {
  const seedUbicacion = () => {
    localStorage.setItem('EVENTFLOW.campus', JSON.stringify({ title: 'Cumbayá' }));
    localStorage.setItem('EVENTFLOW.area', JSON.stringify({ title: 'Ingeniería' }));
    localStorage.setItem('EVENTFLOW.subarea', JSON.stringify({ title: 'Software' }));
  };

  test('signedOut limpia la ubicación cacheada y redirige a /page/campus', () => {
    const realLocation = window.location;
    delete window.location;
    window.location = { pathname: '/admin/dashboard' };
    try {
      seedUbicacion();
      renderApp('/');

      expect(Hub.listen).toHaveBeenCalledWith('auth', expect.any(Function));
      act(() => {
        hubCallback({ payload: { event: 'signedOut' } });
      });

      expect(localStorage.getItem('EVENTFLOW.campus')).toBeNull();
      expect(localStorage.getItem('EVENTFLOW.area')).toBeNull();
      expect(localStorage.getItem('EVENTFLOW.subarea')).toBeNull();
      expect(window.location.pathname).toBe('/page/campus');
    } finally {
      window.location = realLocation;
    }
  });

  test('otros eventos de auth no tocan el localStorage', () => {
    seedUbicacion();
    renderApp('/');

    act(() => {
      hubCallback({ payload: { event: 'tokenRefresh' } });
    });

    expect(localStorage.getItem('EVENTFLOW.campus')).not.toBeNull();
    expect(localStorage.getItem('EVENTFLOW.area')).not.toBeNull();
    expect(localStorage.getItem('EVENTFLOW.subarea')).not.toBeNull();
  });

  test('al desmontar se desuscribe del Hub', () => {
    const { unmount } = renderApp('/');
    unmount();

    expect(hubUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('App — efectos de arranque', () => {
  test('con requestIdleCallback disponible inicializa Hotjar en idle', () => {
    window.requestIdleCallback = jest.fn((cb) => cb());
    try {
      renderApp('/');
      expect(window.requestIdleCallback).toHaveBeenCalled();
      expect(Hotjar.init).toHaveBeenCalledWith(123, 6);
    } finally {
      delete window.requestIdleCallback;
    }
  });

  test('sin requestIdleCallback difiere Hotjar 3s con setTimeout', () => {
    jest.useFakeTimers();
    try {
      renderApp('/');
      expect(Hotjar.init).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(Hotjar.init).toHaveBeenCalledWith(123, 6);
    } finally {
      jest.useRealTimers();
    }
  });

  test('inyecta el script de Cookiebot al montar y lo retira al desmontar', () => {
    const { unmount } = renderApp('/');

    const script = document.getElementById('CookieDeclaration');
    expect(script).not.toBeNull();
    expect(script.src).toContain('consent.cookiebot.com');

    unmount();
    expect(document.getElementById('CookieDeclaration')).toBeNull();
  });
});
