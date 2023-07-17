import { Routes, Route, Navigate } from "react-router-dom";
import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import PageLayout from "layouts/page";

import { I18n } from 'aws-amplify';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
I18n.putVocabularies(translations);
I18n.setLanguage('es');

function App() {

  const { route } = useAuthenticator(context => [context.route]);

  if(!route){
    return <p>Loading...</p>
  }

  // Use the value of route to decide which page to render
  return route === 'authenticated' 
    ? (
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="rtl/*" element={<RtlLayout />} />
        <Route path="page/*" element={<PageLayout />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
      )
    :
      <div>
        <div className="container">
          <div className="login-left">
            <h1>La forma más fácil de gestionar tus eventos</h1>
          </div>
          <div className="login-right">
            <h1>Eventflow</h1>
          </div>
        </div>
        <Authenticator hideSignUp={true}/> 
      </div>;
}

export default App;


