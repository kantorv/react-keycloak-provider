import React, { createContext, useContext, useState } from 'react';
import Keycloak from 'keycloak-js';

interface KeycloakContextType {
  keycloak: Keycloak ;
  authenticated: boolean;
}

const KeycloakContext = createContext<KeycloakContextType>({ keycloak: {} as Keycloak, authenticated: false  });

export const useKeycloakContext = (): KeycloakContextType => {
  return useContext(KeycloakContext);
};

export default KeycloakContext;