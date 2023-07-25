import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";

/* Amplify */
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
Amplify.configure(awsExports);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Authenticator.Provider>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </Authenticator.Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
