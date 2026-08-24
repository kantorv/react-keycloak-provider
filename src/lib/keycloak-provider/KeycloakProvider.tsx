// KeycloakProvider.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import type { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import Keycloak from 'keycloak-js';
import { KeycloakService } from './keycloakService';


interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  /**
   * true while `keycloak.init()` is still in flight — i.e. whether there is a
   * session is not known yet. false in both settled outcomes, so it is never a
   * synonym for "anonymous". Gate role-dependent UI on this, not on
   * `authenticated`, to avoid rendering an anonymous tree and remounting it
   * when the token lands.
   */
  initializing: boolean;
  /** true if init rejected (server offline / blocked 3rd-party cookies) or the timeout backstop fired */
  failed?: boolean;
  /** the provider's `loader` prop, so a consumer can gate its own subtree on `initializing` */
  loader?: React.ReactNode;
}

interface KeycloakProviderProps {
  config: string | KeycloakConfig; // required
  initOptions?: KeycloakInitOptions;
  children: React.ReactNode;
  disabled?: boolean; // new prop
  timeout?: number;
  loader?:React.ReactNode;
}

// Timeout in milliseconds for Keycloak server to respond
const KEYCLOAK_READY_TIMEOUT_MS = 12000;

// Module-level so the default does not change identity on every render
const DEFAULT_LOADER = <>Loading...</>;

type InitStatus = 'initializing' | 'ready' | 'failed';

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  initializing: false,
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
   timeout = KEYCLOAK_READY_TIMEOUT_MS,
   loader = DEFAULT_LOADER
}: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState<InitStatus>(disabled ? 'ready' : 'initializing');

  // Consumers pass `config` / `initOptions` as inline object literals (that is what
  // the README shows), so they are fresh references on every render. Reading them
  // through a ref keeps the init effect from tearing down its listeners and arming
  // a new timeout on each one, without asking consumers to memoize anything.
  const propsRef = useRef({ config, initOptions, timeout });
  propsRef.current = { config, initOptions, timeout };

  useEffect(() => {
    if (disabled) {
      // If disabled, consider it settled immediately and skip initialization
      setKeycloak(null);
      setAuthenticated(false);
      setStatus('ready');
      return;
    }

    const { config, initOptions, timeout } = propsRef.current;
    const keycloakService = KeycloakService.getInstance({ config, initOptions });

    let settled = false;

    const onReady = () => {
      settled = true;
      setKeycloak(keycloakService.getKeycloakInstance());
      setStatus('ready');
    };

    const onInitError = () => {
      settled = true;
      setStatus('failed');
    };

    const onAuthSuccess = () => setAuthenticated(true);
    const onAuthError = () => setAuthenticated(false);

    // Register listeners
    keycloakService.on('keycloak-ready', onReady);
    keycloakService.on('init-error', onInitError);
    keycloakService.on('auth-success', onAuthSuccess);
    keycloakService.on('auth-error', onAuthError);

    // The service is a page-lifetime singleton, so init may already have settled
    // before this provider mounted (a remount, StrictMode's second pass, a second
    // provider). Those listeners will never fire — replay what was missed.
    const initState = keycloakService.getInitState();
    if (initState === 'ready') {
      setAuthenticated(keycloakService.isAuthenticated());
      onReady();
    } else if (initState === 'failed') {
      setAuthenticated(false);
      onInitError();
    }

    // Backstop for an init that never settles either way. The failure path is
    // handled by 'init-error' above, so this should only fire on a genuine hang.
    const _timeout = setTimeout(() => {
      if (settled) return;
      console.warn('KeycloakService did not become ready within timeout');
      setStatus('failed');
    }, timeout);

    // Cleanup on unmount
    return () => {
      clearTimeout(_timeout);
      keycloakService.off('keycloak-ready', onReady);
      keycloakService.off('init-error', onInitError);
      keycloakService.off('auth-success', onAuthSuccess);
      keycloakService.off('auth-error', onAuthError);
    };
  }, [disabled]);

  const value = useMemo<KeycloakContextType>(() => ({
    keycloak: disabled ? null : keycloak,
    authenticated: disabled ? false : authenticated,
    initializing: disabled ? false : status === 'initializing',
    failed: disabled ? false : status === 'failed',
    loader,
  }), [disabled, keycloak, authenticated, status, loader]);

  // children render immediately — including while init is in flight. Consumers
  // gate whatever actually depends on identity on `initializing`.
  return (
    <KeycloakContext value={value}>
      {children}
    </KeycloakContext>
  );
};
