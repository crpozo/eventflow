import logo from './logo.svg';
import './login.css';
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css';

function App() {
  return (
    <div className="login-page">
      <Authenticator hideSignUp={true}>
        {({ signOut, user }) => (
          <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
              Edit <code>src/App.js</code> and save to reload.
            </p>
            <a
              className="App-link"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </a>
            <h1>Hello {user.username}</h1>
            <button onClick={signOut}>Sign out</button>
          </header>
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default App;
