import React from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import PageLayout from "layouts/page";
import LandingLayout from "layouts/landing";
import LegalLayout from "layouts/privacidad";
import UserLayout from "layouts/usuario";
import logo from "assets/img/usfq/logo_usfq.svg";
import Hotjar from '@hotjar/browser';
import { Player } from '@lottiefiles/react-lottie-player';
import { I18n, Hub } from 'aws-amplify/utils';
import { DataStore } from 'aws-amplify/datastore';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
I18n.putVocabularies(translations);
I18n.setLanguage('es');

function App() { 

  const { route } = useAuthenticator(context => [context.route]);
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingRoute = location.pathname.includes('/landing');
  const isLegalRoute = location.pathname.includes('/privacidad');
  const isUserRoute = location.pathname.includes('/usuario');
  const [onReady, setOnReady] = React.useState(Promise.resolve());
  const [isReady, setIsReady] = React.useState(true);

  // Hotjar init
  const siteId = 123;
  const hotjarVersion = 6;
  Hotjar.init(siteId, hotjarVersion);

  React.useEffect(() => {
    // Cookiebot
    const cookiebotScript = document.createElement('script');
    cookiebotScript.id = 'Cookiebot';
    cookiebotScript.src = 'https://consent.cookiebot.com/uc.js';
    cookiebotScript.setAttribute('data-cbid', '7f732229-5a1e-49cc-9a04-cbd43a1eb610');
    document.head.appendChild(cookiebotScript);

    const cookieDeclarationScript = document.createElement('script');
    cookieDeclarationScript.id = 'CookieDeclaration';
    cookieDeclarationScript.src = 'https://consent.cookiebot.com/7f732229-5a1e-49cc-9a04-cbd43a1eb610/cd.js';
    cookieDeclarationScript.async = true;
    document.head.appendChild(cookieDeclarationScript);

    // Live chat Tidio
    const tidioScript = document.createElement('script');
    tidioScript.src = '//code.tidio.co/l5o4hcityjxdcqyhycvrptlv0uyzs9r6.js';
    tidioScript.async = true;
    document.body.appendChild(tidioScript);

    return () => {
      // Limpiar scripts al desmontar el componente
      document.head.removeChild(cookiebotScript);
      document.head.removeChild(cookieDeclarationScript);
      document.body.removeChild(tidioScript);
    };
  }, []);

  // If datastore is cleared and the browser is refreshed variables reset and we to reinit datastore
  React.useEffect( () => {
    async function startData() {
      if(authStatus == 'unauthenticated'){
        await DataStore.start();
        console.log("START executed")
      }
    }
    startData();
  }, [authStatus]);
 

  const clearDataStore = async () => {
    try {
      await DataStore?.clear();
      // setOnReady(DataStore.clear());
      // await onReady;
    } catch (error) {
      console.error("Error clearing DataStore", error);
    } finally {
      setIsReady(true);
      console.log("DataStore cleared successfully");
      // setTimeout(() => {
      //    console.log("DataStore cleared successfully");
      //    setIsReady(true);
      //  }, 2000);
    }
  };

  Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signedIn':
        setIsReady(false);
        clearDataStore();
        console.log('user have been signedIn successfully.');
        break;
      case 'signedOut':
        navigate(`/page/campus`);
        // clearDataStore();
        console.log('user have been signedOut successfully.');
        break;
      case 'tokenRefresh':
        console.log('auth tokens have been refreshed.');
        break;
      case 'tokenRefresh_failure':
        console.log('failure while refreshing auth tokens.');
        break;
      case 'signInWithRedirect':
        console.log('signInWithRedirect API has successfully been resolved.');
        break;
      case 'signInWithRedirect_failure':
        console.log('failure while trying to resolve signInWithRedirect API.');
        break;
      case 'customOAuthState':
        console.log('custom state returned from CognitoHosted UI');
        break;
    }
  });
  
  if(!route || authStatus === 'configuring' && 'Loading...' || authStatus !=='unauthenticated' && !isReady){
    return(
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-lightPrimary opacity-80 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 mb-4"></div>
        <h2 className="text-center text-black text-xl font-semibold mb-2">Cargando...</h2>
        <p className="w-1/3 text-center text-black"> Esto puede tardar unos segundos, por favor no cierre esta página.</p>
      </div>
    );
  }

  // Use the value of route to decide which page to render
  return isReady && route === 'authenticated'
  ? (
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
    )
  :
    <>
    {isLandingRoute ? (
      <Routes>
        <Route path="landing/*" element={<LandingLayout />} />
      </Routes>
    ) : isLegalRoute ? (
      <Routes>
        <Route path="privacidad" element={<LegalLayout />} />
      </Routes>
    ) : 
    isUserRoute ? (
      <Routes>
        <Route path="usuario/*" element={<UserLayout />} />
      </Routes>
    ) :(
      <div className="bg-lightPrimary">
        <div className="container grid h-screen xl:grid-cols-2 xl:px-1 xl:py-[40px]">
          <div className="hidden xl:flex flex-col justify-center items-center xl:items-start bg-usfqPrimary px-3 login-container xl:!px-[60px] pt-4 pb-3 rounded-t-xl xl:rounded-none xl:rounded-l-2xl">

            <h1 className="font-bold text-2xl mb-2">Gestión de eventos simplificada</h1>
              <p className="xl:mb-[40px]">Con nuestro software, podrás organizar, crear y disfrutar de eventos de manera más eficiente que nunca.</p>
            {/* <img className="hidden xl:block max-w-[420px] mt-0 mb-[30px] mx-auto" src={demo}/> */}
            <div className="relative">
              <Player
                src='https://lottie.host/49238ac7-8a4c-41d3-baa2-db045be586c3/lb9k5cAVsT.json'
                className="player mb-5"
                loop
                autoplay
              />
            </div>
            <h2 className="font-black text-3xl hidden xl:block">Hola y Bienvenido/a!</h2> 

          </div>
          <div className="flex flex-col justify-center items-center bg-white px-2 py-[24px] pt-5 sm:p-5 xl:shadow-2xl rounded-b-xl xl:rounded-none xl:rounded-r-2xl">
            <div className="mt-3 xl:!mt-0 mb-[30px]">
              <img className="max-w-[190px]" src={logo} />
              {/* <h1 className="text-4xl font-black text-center">EventFlow</h1> */}
            </div>
            <div className="w-[80%] mb-[20px]">
              <h2 className="font-bold text-2xl mb-2">Autenticación</h2>
              <p className="text-gray-500">Le damos la bienvenida a una plataforma diseñada para hacer que la planificación de eventos sea accesible y rápida.</p>
              <Authenticator hideSignUp={true}/> 
            </div>
          </div>
        </div>
      </div>
    )}
    </>

}

export default App;


