// KeycloakProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import Keycloak from 'keycloak-js';
import { KeycloakService } from './keycloakService';
import { default as LoadingScreenSample } from './Loading';

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  failed?: boolean; // true if server offline / timeout
}

interface KeycloakProviderProps {
  config: string | KeycloakConfig; // required
  initOptions?: KeycloakInitOptions;
  children: React.ReactNode;
   disabled?: boolean; // new prop
   timeout?: number; 
}

// Timeout in milliseconds for Keycloak server to respond
const KEYCLOAK_READY_TIMEOUT_MS = 12000;

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  failed: false,
});

export const useKeycloak = (): KeycloakContextType => {
  return useContext(KeycloakContext);
};

export const KeycloakProvider = ({
  config,
  initOptions = {},
  children,
   disabled = false,
   timeout=KEYCLOAK_READY_TIMEOUT_MS
}: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);


  
  useEffect(() => {
    if (disabled) {
      // If disabled, consider ready immediately and skip initialization
      setReady(true);
      setAuthenticated(false);
      setTimedOut(false);
      return;
    }

    const keycloakService = KeycloakService.getInstance({ config, initOptions });

    const onReady = () => {
      const instance = keycloakService.getKeycloakInstance();
      if (instance) {
        setKeycloak(instance);
        setReady(true);
      }
    };

    const onAuthSuccess = () => setAuthenticated(true);
    const onAuthError = () => setAuthenticated(false);

    // Register listeners
    keycloakService.on('keycloak-ready', onReady);
    keycloakService.on('auth-success', onAuthSuccess);
    keycloakService.on('auth-error', onAuthError);

    // Timeout fallback in case server is offline
    const _timeout = setTimeout(() => {
      if (!ready) {
        console.warn('KeycloakService did not become ready within timeout');
        setTimedOut(true);
      }
    }, timeout);

    // Cleanup on unmount
    return () => {
      clearTimeout(_timeout);
      keycloakService.off('keycloak-ready', onReady);
      keycloakService.off('auth-success', onAuthSuccess);
      keycloakService.off('auth-error', onAuthError);
    };
  }, [config, initOptions, ready]);

  // Show loading until ready or timed out
  if (!ready && !timedOut) {
    return <LoadingScreenSample />;
  }

  // Provide safe context even if server is offline
  return (
    <KeycloakContext value={{

      keycloak: disabled ? null : keycloak,
      authenticated: disabled ? false : authenticated,
      failed: disabled ? false : timedOut

     }}>
      {children}
    </KeycloakContext>
  );
};
