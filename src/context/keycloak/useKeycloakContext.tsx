import { useContext } from 'react'
import { KeycloakContext } from './KeycloakContext'

export const useKeycloakContext = () => {
  return useContext(KeycloakContext)
}
