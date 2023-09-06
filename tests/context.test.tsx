import * as React from 'react'
import { render } from '@testing-library/react'

import 'jest-canvas-mock'

import  { KeycloakProvider, useKeycloakContext } from '../src'


const MyComponent = ()=>{

  const keycloak = useKeycloakContext()

  React.useEffect(()=>{
    console.log("[MyComponent.useEffect called]", keycloak)
  },[])
  return (<div>Hello</div>)
}


describe('Common render', () => {
  it('renders without crashing', () => {
    render(
          <KeycloakProvider
         // config={window.location.origin + '/kclocal.json'}
          config={{
            url: 'http://localhost:8282/',
            realm: 'demo',
            clientId: 'react-client'
          }}

          initOptions={{
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          }}
        >
        <MyComponent />
      </KeycloakProvider>
      
    )
  })
})