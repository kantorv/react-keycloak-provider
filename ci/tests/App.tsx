import React, { useEffect } from 'react';
import logo from './logo.svg';
//import './App.css';
import { useKeycloak } from 'react-keycloak-provider'

function App() {
  const { keycloak, authenticated } = useKeycloak();



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
          onClick={() =>keycloak &&  keycloak.logout()}
        >
          Logout
        </a> :
          <a
            className="App-link"
            href="#"
            onClick={() => keycloak &&  keycloak.login()}
          >
            Login
          </a>
        }
      </header>
    </div>
  );
}

export default App;
