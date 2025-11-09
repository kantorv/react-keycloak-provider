// KeycloakProvider.tsx
import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { KeycloakService } from "./keycloakService";
import type { KeycloakConfig, KeycloakInitOptions } from "keycloak-js";
import type Keycloak from "keycloak-js";
import { LoadingScreenSample } from "./Loading";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
}

interface KeycloakProviderProps {
  config: string | KeycloakConfig;
  initOptions?: KeycloakInitOptions;
  children: ReactNode;
}

/**
 * Note: We store `KeycloakContext` initial value as `null`.
 * Consumers should call `useKeycloak()` (below) which will
 * throw when there is no provider — a deliberate safety choice.
 */
const KeycloakContext = createContext<KeycloakContextType | null>(null);

/**
 * React 19: use(KeycloakContext) reads the context value.
 * This throws when there's no provider, to avoid silent runtime bugs.
 *
 * Verified: `use(resource)` in React 19 supports reading context values.
 * See React 19 docs: "use(resource) - Reading context with use".
 * (No fallback used because using the hook outside provider is a programming error.)
 */
export function useKeycloak(): KeycloakContextType {
  const ctx = use(KeycloakContext);
  if (!ctx) {
    // explicit runtime guard — safe and helpful for debugging
    throw new Error("useKeycloak must be called inside a KeycloakProvider");
  }
  return ctx;
}

/**
 * Provider component (React 19). We render `<KeycloakContext value={...}>`
 * per React 19 docs (Context can be rendered directly as a provider).
 *
 * Implementation notes:
 * - keycloak: Keycloak | null — set when KeycloakService provides instance
 * - authenticated: boolean — updated on auth-success / auth-error events
 * - ready: boolean — internal render gating. We render LoadingScreenSample until ready.
 *
 * Important: we DO NOT mutate KeycloakService here. We only subscribe to its events.
 */
export function KeycloakProvider({
  config,
  initOptions,
  children,
}: KeycloakProviderProps) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    // Get (or create) singleton KeycloakService instance (no changes to service file)
    const svc = KeycloakService.getInstance({ config, initOptions });

    const onReady = () => {
      const instance = svc.getKeycloakInstance();
      if (instance) {
        setKeycloak(instance);
        setReady(true);
      }
    };

    const onAuthSuccess = () => setAuthenticated(true);
    const onAuthError = () => setAuthenticated(false);

    svc.on("keycloak-ready", onReady);
    svc.on("auth-success", onAuthSuccess);
    svc.on("auth-error", onAuthError);

    // NOTE: keycloakService currently has no `off`/remove listener API.
    // Because getInstance() returns a singleton and service persists for app lifetime,
    // we do not attempt to remove listeners here. If you later add `off` to the service,
    // add cleanup logic here to avoid duplicated listeners in tests/hot-reload.
  }, [config, initOptions]);

  // Show loading until Keycloak instance is ready.
  if (!ready) {
    return <LoadingScreenSample />;
  }

  // React 19 provider shorthand: render the Context object as a provider
  // per React 19 docs: <Context value={...}>children</Context>
  return (
    <KeycloakContext value={{ keycloak, authenticated }}>
      {children}
    </KeycloakContext>
  );
}

export default KeycloakProvider;
