import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import PageLayout from "layouts/page";
import LandingLayout from "layouts/landing";
import LegalLayout from "layouts/privacidad";
import UserLayout from "layouts/usuario";
import demo from "assets/img/auth/demo.png";
import Hotjar from '@hotjar/browser'
import { I18n, DataStore, Logger} from 'aws-amplify';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { Hub } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
I18n.putVocabularies(translations);
I18n.setLanguage('es');

function App() { 

  const { route } = useAuthenticator(context => [context.route]);
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const location = useLocation();
  const isLandingRoute = location.pathname.includes('/landing');
  const isLegalRoute = location.pathname.includes('/privacidad');
  const isUserRoute = location.pathname.includes('/usuario');
  const [dataCleared, setDataCleared] = React.useState(true);
  const [onReady, setOnReady] = React.useState(Promise.resolve());
  const [isReady, setIsReady] = React.useState(true);
  // Hotjar init
  const siteId = 123;
  const hotjarVersion = 6;
  Hotjar.init(siteId, hotjarVersion);

  // Live chat Tidio
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = '//code.tidio.co/l5o4hcityjxdcqyhycvrptlv0uyzs9r6.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };

  }, []);

  // Log errors Amplify
  // Logger.LOG_LEVEL = 'DEBUG'

  const clearDataStore = async () => {
    setIsReady(false);
    setOnReady(DataStore.clear());
    await onReady; // Wait for the clear operation to complete
    setIsReady(true);
  };


  const listener = async (data) => {

    switch (data?.payload?.event) {
      case 'configured':
        console.log('the Auth module is configured');
        break;
      case 'signIn':
        console.log('user signed in'); 
        // setDataCleared(false)
        // await DataStore.stop();
        clearDataStore();
        // await new Promise(resolve => setTimeout(resolve, 2000));  
        // await DataStore.clear();
        // await new Promise(resolve => setTimeout(resolve, 1000));  
        // await DataStore.start();
        // setDataCleared(true)
        break;
      case 'signIn_failure':
        console.log('user sign in failed');
        break;
      case 'signUp':
        console.log('user signed up');
        break;
      case 'signUp_failure':
        console.log('user sign up failed');
        break;
      case 'confirmSignUp':
        console.log('user confirmation successful');
        break;
      case 'completeNewPassword_failure':
        console.log('user did not complete new password flow');
        break;
      case 'autoSignIn':
        console.log('auto sign in successful');
        break;
      case 'autoSignIn_failure':
        console.log('auto sign in failed');
        break;
      case 'forgotPassword':
        console.log('password recovery initiated');
        break;
      case 'forgotPassword_failure':
        console.log('password recovery failed');
        break;
      case 'forgotPasswordSubmit':
        console.log('password confirmation successful');
        break;
      case 'forgotPasswordSubmit_failure':
        console.log('password confirmation failed');
        break;
      case 'verify':
        console.log('TOTP token verification successful');
        break;
      case 'tokenRefresh':
        console.log('token refresh succeeded');
        break;
      case 'tokenRefresh_failure':
        console.log('token refresh failed');
        break;
      case 'cognitoHostedUI':
        console.log('Cognito Hosted UI sign in successful');
        break;
      case 'cognitoHostedUI_failure':
        console.log('Cognito Hosted UI sign in failed');
        break;
      case 'customOAuthState':
        console.log('custom state returned from CognitoHosted UI');
        break;
      case 'customState_failure':
        console.log('custom state failure');
        break;
      case 'parsingCallbackUrl':
        console.log('Cognito Hosted UI OAuth url parsing initiated');
        break;
      case 'userDeleted':
        console.log('user deletion successful');
        break;
      case 'updateUserAttributes':
        console.log('user attributes update successful');
        break;
      case 'updateUserAttributes_failure':
        console.log('user attributes update failed');
        break;
      case 'signOut':
        console.log('user signed out');
        // setDataCleared(false)
        // await DataStore.stop();
        // await new Promise(resolve => setTimeout(resolve, 1000));  
        // await DataStore.clear();
        // await new Promise(resolve => setTimeout(resolve, 1000));  
        // await DataStore.start();
        // setDataCleared(true)
        break;
      default:
        console.log('unknown event type');
        break;
    }
  };

  Hub.listen('auth', listener)
  
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
  return route === 'authenticated'
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
          <div className="flex flex-col justify-center items-center xl:items-start bg-purplePrimary px-3 xl:shadow-2xl xl:!px-[60px] pt-4 pb-3 rounded-xl xl:rounded-none xl:rounded-l-2xl">
            <h1 className="font-bold text-2xl mb-2">La forma más fácil de gestionar tus eventos</h1>
            <p className="xl:mb-[40px]">Ingresa los credenciales para acceder a tu cuenta</p>
            <img className="hidden xl:block max-w-[420px] mt-0 mb-[30px] mx-auto" src={demo}/>
            <h2 className="font-black text-3xl hidden xl:block">Bienvenido a EventFlow</h2>
          </div>
          <div className="flex flex-col justify-center items-center bg-white p-2 sm:p-5 xl:shadow-2xl rounded-xl xl:rounded-none xl:rounded-r-2xl">
            <div className="mt-3 xl:!mt-0 mb-[40px] xl:mb-[80px]">
              <h1 className="text-4xl font-black text-center">EventFlow</h1>
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


