import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useKeycloak } from 'react-keycloak-provider'

function App() {
  const { keycloak, authenticated, initializing, loader } = useKeycloak();

  // children now render while init is still in flight, so only the part that
  // actually depends on the session waits for it.
  const authControls = initializing ? loader : (
    authenticated ?
      <a
        className="App-link"
        href="#"
        onClick={() => keycloak?.logout()}
      >
        Logout
      </a> :
      <a
        className="App-link"
        href="#"
        onClick={() => keycloak?.login()}
      >
        Login
      </a>
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        {authControls}
      </header>
    </div>
  );
}

export default App;
