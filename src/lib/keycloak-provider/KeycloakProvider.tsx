import React, { useState, useEffect } from 'react';
import { default as KeycloakContext } from './KeycloakContext';
import { KeycloakService } from './keycloakService';
import type { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import Keycloak from 'keycloak-js';
import { useEffectOnce } from '../utils/UseEffectOnce';




interface KeycloakProviderProps {
  config?: string | KeycloakConfig | undefined;
  initOptions?: KeycloakInitOptions;
  children: React.ReactNode;
}

export const KeycloakProvider = ({
  config = undefined,
  initOptions = {},
  children,
}: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak>(null!);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffectOnce(() => {
    console.log("KeycloakProvider.useEffectOnce");

    const keycloakService = KeycloakService.getInstance({
      config: config,
      initOptions: initOptions,
    });


    keycloakService.on('keycloak-ready', () => {
      const _keycloak = keycloakService.getKeycloakInstance();
     // console.log('[KeycloakService]keycloak-ready called', _keycloak)
      if (_keycloak) {
        setKeycloak(_keycloak);
        setReady(true);
      }
    });

 
    keycloakService.on('auth-success', () => {
      console.log('[keycloakService]auth-success called')
      setAuthenticated(true);
    });

    keycloakService.on('auth-error', () => {
      console.log('[keycloakService]auth-error called')
      setAuthenticated(false);
    });


  });

  // useEffect(() => {
  //   console.log("KeycloakProvider.useEffect authenticated updated", authenticated);
  // }, [authenticated]);

  return (
    <KeycloakContext.Provider value={{ keycloak, authenticated }}>
      {ready ? children : <LoadingScreen /> }
    </KeycloakContext.Provider>
  );
}


//TODO: add some css-only loader
//TODO: make it as provided param
const LoadingScreen =  ()=>(
    <div style={{ height:"100vh", width:"100vw",display: 'flex', justifyContent:"center", alignItems:"center" }}>
      <div>{/*progress bar here*/}</div>
    </div>
    // <Box sx={{ height:"100vh", width:"100vw",display: 'flex', justifyContent:"center", alignItems:"center" }}>
    //      <CircularProgress />
    // </Box>
)