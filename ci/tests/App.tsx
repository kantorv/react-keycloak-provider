import React, { useEffect } from 'react';

//@ts-expect-error
import logo from './logo.svg';
import './App.css';

//@ts-expect-error
import { useKeycloakContext } from 'react-keycloak-provider'

function App() {
  const { keycloak, authenticated } = useKeycloakContext();



  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        {authenticated ?
         <a
          className="App-link"
          href="#"
          onClick={() => keycloak.logout()}
        >
          Logout
        </a> :
          <a
            className="App-link"
            href="#"
            onClick={() => keycloak.login()}
          >
            Login
          </a>
        }
      </header>
    </div>
  );
}

export default App;
