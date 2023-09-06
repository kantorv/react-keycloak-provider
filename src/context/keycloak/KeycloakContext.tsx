import React, { useState, createContext } from 'react'
import { useEffectOnce } from '../../helpers/UseEffectOnce'
import Keycloak from 'keycloak-js'
import type { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js'

//type AnyFunction = (...args: any[]) => any

interface KeycloakProviderProps {
  initOptions?: KeycloakInitOptions
  config?: string | KeycloakConfig | undefined
  successFn?: (authenticated: boolean) => void
  errorFn?: () => void
  children: React.ReactNode
}

type KeycloakContextType = {
  keycloak: Keycloak 
}

export const KeycloakContext = createContext<KeycloakContextType>({ keycloak: {} as Keycloak })

export const KeycloakProvider = ({
  config = undefined,
  initOptions = {},
  successFn = undefined,
  errorFn = undefined,
  children,
}: KeycloakProviderProps) => {

  const [keycloak, setKeycloak] = useState<Keycloak>(null!)

  const initKeycloak = () => {
    const _keycloak = new Keycloak(config)

    _keycloak
      .init(initOptions)
      .then(function (authenticated) {
        if (successFn) successFn(authenticated)
      })
      .catch(function () {
        if (errorFn) errorFn()
        //console.log('[initKeycloak] failed to initialize')
        // setAuthenticated(false)
      })

    // keycloak.onReady = (authenticated) => {
    //   console.log('[keycloak.onReady]', authenticated)
    //   // setLoginInProgress(false)
    // }

    // keycloak.onAuthSuccess = () => {
    //   console.log('[keycloak.onAuthSuccess]')
    // }

    // keycloak.onAuthError = () => {
    //   console.log('[keycloak.onAuthError]')
    // }

    // keycloak.onAuthRefreshSuccess = () => {
    //   console.log('[keycloak.onAuthRefreshSuccess]')
    // }

    // keycloak.onAuthRefreshError = () => {
    //   console.log('[keycloak.onAuthRefreshError]')
    // }
    // keycloak.onAuthLogout = () => {
    //   console.log('[keycloak.onAuthLogout]')
    // }
    // keycloak.onTokenExpired = () => {
    //   console.log('[keycloak.onTokenExpired]')
    // }

    setKeycloak(_keycloak)
  }

  // original useEffect is being reloaded twice in dev. environment, and it causes an infinite loop,
  // so using this hotfix.
  useEffectOnce(() => {
    initKeycloak()
  })

  return <KeycloakContext.Provider value={{ keycloak }}>{children}</KeycloakContext.Provider>
}
