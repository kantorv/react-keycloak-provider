import Keycloak from 'keycloak-js';
import type { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

interface KeycloakServiceProps {
  // ✅ config is now required
  config: string | KeycloakConfig;
  initOptions?: KeycloakInitOptions;
}

/**
 * Where `keycloak.init()` currently stands.
 *
 * `initializing` is the only unsettled value: both `ready` and `failed` mean the
 * adapter has finished and the answer will not change without a page load.
 */
export type KeycloakInitState = 'initializing' | 'ready' | 'failed';

type KeycloakEvent = 'auth-success' | 'auth-error' | 'keycloak-ready' | 'init-error';

export class KeycloakService {
  private static instance: KeycloakService | null = null;
  private keycloak: Keycloak | null = null;

  private authSuccessListeners: Array<() => void> = [];
  private authErrorListeners: Array<() => void> = [];
  private readyListeners: Array<() => void> = [];
  private initErrorListeners: Array<() => void> = [];

  private authenticated = false;
  private initState: KeycloakInitState = 'initializing';

  private constructor(props: KeycloakServiceProps) {
    this.initKeycloak(props);
  }

  public static getInstance(props: KeycloakServiceProps): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService(props);
    }
    return KeycloakService.instance;
  }

  /** Drops the singleton so the next `getInstance` re-inits. For tests only. */
  public static resetInstance(): void {
    KeycloakService.instance = null;
  }

  private initKeycloak(props: KeycloakServiceProps) {
    const { config, initOptions } = props;

    if (!this.keycloak) {
      // ✅ config is guaranteed to be provided, no undefined issues
      this.keycloak = new Keycloak(config);
    }

    this.keycloak.onReady = (authenticated?: boolean) => {
      this.authenticated = !!authenticated;
      this.initState = 'ready';
      this.readyListeners.forEach(listener => listener());
    };

    this.keycloak
      .init(initOptions ?? { onLoad: 'login-required' })
      .then((authenticated: boolean) => {
        this.authenticated = authenticated;
        // onReady fires just before init() resolves, so this is normally a no-op —
        // it also settles adapters that never call onReady at all.
        this.initState = 'ready';
        if (authenticated) {
          this.authSuccessListeners.forEach(listener => listener());
        } else {
          this.authErrorListeners.forEach(listener => listener());
        }
      })
      .catch((error) => {
        // init() rejects on an unreachable server, and on any browser that blocks
        // the third-party-cookie probe. That is a settled outcome, not a hang:
        // notify so the provider can stop waiting instead of burning its timeout.
        console.error('Keycloak initialization error:', error);
        this.authenticated = false;
        this.initState = 'failed';
        this.initErrorListeners.forEach(listener => listener());
        this.authErrorListeners.forEach(listener => listener());
      });
  }

  public getKeycloakInstance(): Keycloak | null {
    return this.keycloak;
  }

  /**
   * The current init state. A subscriber that registers after init already settled
   * never receives the event, so it has to read the state it missed.
   */
  public getInitState(): KeycloakInitState {
    return this.initState;
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  private listenersFor(event: KeycloakEvent): Array<() => void> {
    switch (event) {
      case 'auth-success':
        return this.authSuccessListeners;
      case 'auth-error':
        return this.authErrorListeners;
      case 'init-error':
        return this.initErrorListeners;
      case 'keycloak-ready':
        return this.readyListeners;
    }
  }

  public on(event: KeycloakEvent, listener: () => void): void {
    this.listenersFor(event).push(listener);
  }

  // ✅ New .off method for cleanup
  public off(event: KeycloakEvent, listener: () => void): void {
    const list = this.listenersFor(event);
    const index = list.indexOf(listener);
    if (index !== -1) list.splice(index, 1);
  }
}
