import React, { useState, createContext } from 'react'
import { useEffectOnce } from '../../helpers/UseEffectOnce'
import Keycloak from 'keycloak-js'

interface KeycloakProviderProps {
  children: React.ReactNode
}

type KeycloakContextType = {
  keycloak: Keycloak | undefined
}

export const KeycloakContext = createContext<KeycloakContextType>({ keycloak: undefined })

export const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
  const [keycloak, setKeycloak] = useState<Keycloak | undefined>(undefined)
  //const [authenticated, setAuthenticated] = useState(false)

  const initKeycloak = () => {
    const keycloak = new Keycloak()

    keycloak
      .init({
        // onLoad: 'login-required',
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        // redirectUri: process.env.BASE_URL
      })
      .then(function (authenticated) {
        console.log('[initKeycloak] authenticate', authenticated)
        //   setAuthenticated(authenticated
      })
      .catch(function () {
        console.log('[initKeycloak] failed to initialize')
        // setAuthenticated(false)
      })

    keycloak.onReady = (authenticated) => {
      console.log('[keycloak.onReady]', authenticated)
      // setLoginInProgress(false)
    }

    keycloak.onAuthSuccess = () => {
      console.log('[keycloak.onAuthSuccess]')
    }

    keycloak.onAuthError = () => {
      console.log('[keycloak.onAuthError]')
    }

    keycloak.onAuthRefreshSuccess = () => {
      console.log('[keycloak.onAuthRefreshSuccess]')
    }

    keycloak.onAuthRefreshError = () => {
      console.log('[keycloak.onAuthRefreshError]')
    }
    keycloak.onAuthLogout = () => {
      console.log('[keycloak.onAuthLogout]')
    }
    keycloak.onTokenExpired = () => {
      console.log('[keycloak.onTokenExpired]')
    }

    setKeycloak(keycloak)
  }

  useEffectOnce(() => {
    console.log('[AuthProvider.useEffectOnce]my effect is running')
    initKeycloak()

    return () => console.log('[AuthProvider.useEffectOnce]my effect is destroying')
  })

  return <KeycloakContext.Provider value={{ keycloak }}>{children}</KeycloakContext.Provider>
}
