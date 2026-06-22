import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import logo from "assets/img/usfq/logo_usfq.svg";
import campus from "assets/img/usfq/USFQ_campus.webp";
import Hotjar from '@hotjar/browser';
import { PermissionsProvider, usePermissions } from "./providers/PermissionsProvider";
import { I18n, Hub } from 'aws-amplify/utils';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import config from './amplifyconfiguration.json';
import '@aws-amplify/ui-react/styles.css';

// Layouts are code-split so a public landing visitor never downloads the admin
// layout shell (Sidebar -> DataStore/models) or the other layouts they can't see.
// Every usage below is already wrapped in a <React.Suspense> boundary.
const RtlLayout = React.lazy(() => import("layouts/rtl"));
const AdminLayout = React.lazy(() => import("layouts/admin"));
const AuthLayout = React.lazy(() => import("layouts/auth"));
const PageLayout = React.lazy(() => import("layouts/page"));
const LandingLayout = React.lazy(() => import("layouts/landing"));
const LegalLayout = React.lazy(() => import("layouts/privacidad"));
const UserLayout = React.lazy(() => import("layouts/usuario"));

I18n.putVocabularies(translations);
I18n.setLanguage('es');
Amplify.configure(config);

// Shared loading fallback for Suspense boundaries
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center bg-lightPrimary p-3">
      <span className="loader"></span>
      <h2 className="mb-2 text-center text-xl text-black">Cargando...</h2>
    </div>
  );
}

// Component to handle routes based on user role
function ReportesRouteHandler() {
  const { loading, isReportesOnly } = usePermissions();
  const location = useLocation();

  // While permissions are loading, show nothing (PermissionsProvider handles loading state)
  if (loading) return null;

  // If user has "Reportes" role, only allow access to reportes page
  if (isReportesOnly) {
    // Redirect to reportes if trying to access any other page
    if (!location.pathname.includes('/admin/reportes')) {
      return <Navigate to="/admin/reportes" replace />;
    }

    // Only render admin layout with reportes route
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="admin/*" element={<AdminLayout reportesOnly={true} />} />
          <Route path="*" element={<Navigate to="/admin/reportes" replace />} />
        </Routes>
      </React.Suspense>
    );
  }

  // For all other users, render normal routes
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="rtl/*" element={<RtlLayout />} />
        <Route path="page/*" element={<PageLayout />} />
        <Route path="landing/*" element={<LandingLayout />} />
        <Route path="privacidad" element={<LegalLayout />} />
        <Route path="usuario/*" element={<UserLayout />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </React.Suspense>
  );
}

function App() {
  const { route } = useAuthenticator(context => [context.route]);
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const location = useLocation();
  const isLandingRoute = location.pathname.includes('/landing');
  const isLegalRoute = location.pathname.includes('/privacidad');
  const isUserRoute = location.pathname.includes('/usuario');
  const [isReady] = React.useState(true);

  // Hotjar init — inside effect so it runs once, not on every render
  React.useEffect(() => {
    const siteId = 123;
    const hotjarVersion = 6;
    // Defer Hotjar init so it doesn't block initial render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => Hotjar.init(siteId, hotjarVersion));
    } else {
      setTimeout(() => Hotjar.init(siteId, hotjarVersion), 3000);
    }
  }, []);

  React.useEffect(() => {
    // Cookie scripts
    const cookieDeclarationScript = document.createElement('script');
    cookieDeclarationScript.id = 'CookieDeclaration';
    cookieDeclarationScript.src = 'https://consent.cookiebot.com/7f732229-5a1e-49cc-9a04-cbd43a1eb610/cd.js';
    cookieDeclarationScript.async = true;
    document.head.appendChild(cookieDeclarationScript);

    // Live chat Tidio
    if(window.location.href.includes('eventflow')){
      const tidioScript = document.createElement('script');
      tidioScript.src = '//code.tidio.co/l5o4hcityjxdcqyhycvrptlv0uyzs9r6.js';
      tidioScript.async = true;
      document.body.appendChild(tidioScript);
    }

    return () => {
      document.head.removeChild(cookieDeclarationScript);
    };
  }, []);

  React.useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedOut') {
        localStorage.removeItem("EVENTFLOW.area");
        localStorage.removeItem("EVENTFLOW.campus");
        localStorage.removeItem("EVENTFLOW.subarea");
        window.location.pathname = "/page/campus";
      }
    });
  
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Loading state
  if(!route || (authStatus === 'configuring' && 'Loading...') || (authStatus !== 'unauthenticated' && !isReady)){
    return(
      <div className="bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          Cargando...
        </h2>
      </div>
    );
  }

  // For anonymous users - render routes directly without PermissionsProvider
  if (route !== 'authenticated') {
    return (
      <>
        {isLandingRoute ? (
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="landing/*" element={<LandingLayout />} />
            </Routes>
          </React.Suspense>
        ) : isLegalRoute ? (
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="privacidad" element={<LegalLayout />} />
            </Routes>
          </React.Suspense>
        ) : isUserRoute ? (
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="usuario/*" element={<UserLayout />} />
            </Routes>
          </React.Suspense>
        ) : ( 
          <div className="bg-usfqPrimary flex min-h-screen items-center justify-center bg-lightPrimary px-0 py-0 lg:px-4 lg:py-6">
            <div className="flex flex-col-reverse justify-center lg:flex-row overflow-hidden rounded-3xl shadow-lg w-full max-w-6xl h-screen lg:h-[670px]">
              
              {/* Imagen lado izquierdo */}
              <div
                className="relative hidden lg:block w-1/2 bg-cover bg-center"
                style={{ backgroundImage: `url(${campus})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex justify-center px-8 items-start mt-[70px]">
                  <div className="backdrop-blur-xl bg-white/30 p-8 rounded-xl max-w-md text-center shadow-lg">
                    <h2 className="text-xl font-semibold text-white">
                      Gestiona, diseña y analiza tus eventos<br />en un solo lugar.
                    </h2>
                    <p className="mt-4 text-sm text-white">
                      Crea eventos, diseña páginas web personalizadas, construye formularios, accede a reportes en tiempo real y escanea tickets con dispositivos móviles — todo desde una sola plataforma.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario lado derecho */}
              <div className="flex flex-1 flex-col justify-center bg-white px-6 py-10 lg:w-1/2">
                <div className="text-center mb-6">
                  <img src={logo} alt="Logo USFQ" className="mx-auto max-w-[130px] mb-4" />
                  <p className="mt-2 text-gray-500">
                    Inicia sesión para acceder a tu panel de gestión de eventos.
                  </p>
                </div>

                <div className="w-full max-w-[400px] mx-auto">
                  <Authenticator hideSignUp={true} />
                </div>
              </div>

            </div>
          </div>
        )}
      </>
    );
  }

  // For authenticated users - wrap with PermissionsProvider
  return isReady && route === 'authenticated' ? (
    <PermissionsProvider>
      <ReportesRouteHandler />
    </PermissionsProvider>
  ) : null;
}

export default App;