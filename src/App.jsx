import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import PageLayout from "layouts/page";
import LandingLayout from "layouts/landing";
import demo from "assets/img/auth/demo.png";

import { I18n } from 'aws-amplify';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
I18n.putVocabularies(translations);
I18n.setLanguage('es');

function App() {

  const { route } = useAuthenticator(context => [context.route]);
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const location = useLocation();
  const isLandingRoute = location.pathname.includes('/landing');

  if(!route || authStatus === 'configuring' && 'Loading...'){
    return(
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-lightPrimary opacity-75 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 mb-4"></div>
        <h2 className="text-center text-black text-xl font-semibold mb-2">Cargando...</h2>
        <p className="w-1/3 text-center text-black">Esto puede tardar unos segundos, por favor no cierre esta página.</p>
      </div>
    );
  }

  // Use the value of route to decide which page to render
  return route === 'authenticated' 
    ? (
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="rtl/*" element={<RtlLayout />} />
        <Route path="page/*" element={<PageLayout />} />
        <Route path="landing/*" element={<LandingLayout />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
      )
    :
      <>
      {isLandingRoute ? (
        <Routes>
          <Route path="landing/*" element={<LandingLayout />} />
        </Routes>
      ) : (
        <div className="bg-lightPrimary">
          <div className="container grid h-screen xl:grid-cols-2 xl:px-0 xl:py-5">
            <div className="flex flex-col justify-center items-center xl:items-start bg-purplePrimary px-3 xl:!px-[60px] pt-5 pb-4 rounded-lg xl:rounded-l-lg">
              <h1 className="font-bold text-2xl mb-2">La forma más fácil de gestionar tus eventos</h1>
              <p className="xl:mb-[50px]">Ingresa los credenciales para acceder a tu cuenta</p>
              <img className="hidden xl:block max-w-[450px] mt-0 mb-[30px] mx-auto" src={demo}/>
              <h2 className="font-black text-3xl hidden xl:block">Bienvenido a Eventflow</h2>
            </div>
            <div className="flex flex-col justify-center items-center bg-white p-2 sm:p-5 rounded-lg xl:rounded-r-lg">
              <div className="mt-3 xl:!mt-0 mb-[40px] xl:mb-[80px]">
                <h1 className="text-4xl font-black text-center">Eventflow</h1>
              </div>
              <div className="w-[80%]">
                <h2 className="font-bold text-2xl mb-2">Autenticación</h2>
                <p className="text-gray-500">Ingresa los credenciales para acceder a tu cuenta</p>
                <Authenticator hideSignUp={true}/> 
              </div>
            </div>
          </div>
        </div>
      )}
      </>
}

export default App;


