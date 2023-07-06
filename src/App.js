import Home from './pages/home/home'
import { I18n } from 'aws-amplify';
import { Authenticator, translations } from '@aws-amplify/ui-react'
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
I18n.putVocabularies(translations);
I18n.setLanguage('es');

function App() {

  const { route } = useAuthenticator(context => [context.route]);
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // Use the value of route to decide which page to render
  return route === 'authenticated' 
    ? <Home user={user} signOut={signOut} /> 
    : <div>
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


