import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import App from './App';

//import reportWebVitals from './reportWebVitals';
import { KeycloakProvider } from  '../../src/lib/keycloak-provider/KeycloakProvider'


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <KeycloakProvider
      disabled={false}

      config={{
        url: 'http://localhost:8282/',
        realm: 'demo',
        clientId: 'react-client'
      }}

      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      }}
    >
      <App />
    </KeycloakProvider>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
