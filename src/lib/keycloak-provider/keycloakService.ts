import Keycloak from 'keycloak-js';

interface KeycloakServiceProps {
  config?: string | Keycloak.KeycloakConfig | undefined;
  initOptions?: Keycloak.KeycloakInitOptions;
}

export class KeycloakService {
  private static instance: KeycloakService | null = null;
  private keycloak: Keycloak | null = null;
  private authSuccessListeners: Array<() => void> = [];
  private authErrorListeners: Array<() => void> = [];
  private readyListeners: Array<() => void> = [];
  private authenticated: boolean = false;



  // Private constructor to prevent direct instantiation
  private constructor(props: KeycloakServiceProps) {
    this.initKeycloak(props);
  }

  /**
   * Returns the singleton instance of KeycloakService.
   * @param props - Properties for initializing Keycloak.
   */
  public static getInstance(props: KeycloakServiceProps): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService(props);
    }
    return KeycloakService.instance;
  }


  /**
   * Initializes the Keycloak instance with the given configuration and options.
   * @param props - Properties for initializing Keycloak.
   */
  private initKeycloak(props: KeycloakServiceProps) {
    const { config, initOptions } = props;

    if (!this.keycloak) {
      this.keycloak = new Keycloak(config);
    }


    this.keycloak.onReady = (authenticated: boolean) => {
      this.authenticated = authenticated;
      console.log('[KeycloakService] onReady event fired with authenticated:', authenticated);
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

  /**
   * Returns the initialized Keycloak instance.
   * @returns The Keycloak instance or null if not initialized.
   */
  public getKeycloakInstance(): Keycloak | null {
    return this.keycloak;
  }


  /**
   * Registers a listener for a specific event.
   * @param event - The event type to listen for ('auth-success' or 'auth-error').
   * @param listener - The callback function to be executed when the event occurs.
   */

  public on(event: 'auth-success' | 'auth-error' | 'keycloak-ready', listener: () => void): void {
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
      default:
        throw new Error('Unknown event type');
    }
  }

}