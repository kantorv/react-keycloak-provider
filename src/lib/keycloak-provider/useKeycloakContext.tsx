import { useContext } from 'react';
import { default as KeycloakContext } from './KeycloakContext';
import Keycloak from 'keycloak-js';

export const useKeycloakContext = (): { keycloak: Keycloak , authenticated: boolean} => {
  return useContext(KeycloakContext);
};