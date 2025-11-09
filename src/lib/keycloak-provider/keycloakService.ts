import Keycloak from 'keycloak-js';

interface KeycloakServiceProps {
  // ✅ config is now required
  config: string | Keycloak.KeycloakConfig;
  initOptions?: Keycloak.KeycloakInitOptions;
}

type KeycloakEvent = 'auth-success' | 'auth-error' | 'keycloak-ready';

export class KeycloakService {
  private static instance: KeycloakService | null = null;
  private keycloak: Keycloak | null = null;

  private authSuccessListeners: Array<() => void> = [];
  private authErrorListeners: Array<() => void> = [];
  private readyListeners: Array<() => void> = [];

  private authenticated = false;

  private constructor(props: KeycloakServiceProps) {
    this.initKeycloak(props);
  }

  public static getInstance(props: KeycloakServiceProps): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService(props);
    }
    return KeycloakService.instance;
  }

  private initKeycloak(props: KeycloakServiceProps) {
    const { config, initOptions } = props;

    if (!this.keycloak) {
      // ✅ config is guaranteed to be provided, no undefined issues
      this.keycloak = new Keycloak(config);
    }

    this.keycloak.onReady = (authenticated: boolean) => {
      this.authenticated = authenticated;
      this.readyListeners.forEach(listener => listener());
    };

    this.keycloak
      .init(initOptions ?? { onLoad: 'login-required' })
      .then((authenticated: boolean) => {
        this.authenticated = authenticated;
        if (authenticated) {
          this.authSuccessListeners.forEach(listener => listener());
        } else {
          this.authErrorListeners.forEach(listener => listener());
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization error:', error);
        this.authErrorListeners.forEach(listener => listener());
      });
  }

  public getKeycloakInstance(): Keycloak | null {
    return this.keycloak;
  }

  public on(event: KeycloakEvent, listener: () => void): void {
    switch (event) {
      case 'auth-success':
        this.authSuccessListeners.push(listener);
        break;
      case 'auth-error':
        this.authErrorListeners.push(listener);
        break;
      case 'keycloak-ready':
        this.readyListeners.push(listener);
        break;
    }
  }

  // ✅ New .off method for cleanup
  public off(event: KeycloakEvent, listener: () => void): void {
    const list =
      event === 'auth-success'
        ? this.authSuccessListeners
        : event === 'auth-error'
        ? this.authErrorListeners
        : this.readyListeners;

    const index = list.indexOf(listener);
    if (index !== -1) list.splice(index, 1);
  }
}
