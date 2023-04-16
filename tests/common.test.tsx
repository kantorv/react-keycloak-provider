import * as React from 'react'
import { render } from '@testing-library/react'

import 'jest-canvas-mock'

import { KeycloakProvider } from '../src'
import { KeycloakInitOptions } from 'keycloak-js'

describe('Common render', () => {
  it('renders without crashing', () => {
    const initOptions: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    }
    render(
      <KeycloakProvider config={'1111'} initOptions={initOptions}>
        <div></div>
      </KeycloakProvider>,
    )
  })

  it('renders without arguments', () => {
    render(
      <KeycloakProvider>
        <div></div>
      </KeycloakProvider>,
    )
  })

  it('receives success callback', () => {
    const _cb = (val: boolean) => {
      console.log('success callback executed', val)
    }
    render(
      <KeycloakProvider successFn={_cb}>
        <div></div>
      </KeycloakProvider>,
    )
  })

  it('receives error callback', async () => {
    const _cb = () => {
      // console.log('error callback executed')
      return
    }
    render(
      <KeycloakProvider errorFn={_cb}>
        <div></div>
      </KeycloakProvider>,
    )
  })
})
