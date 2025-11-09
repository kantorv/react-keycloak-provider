import * as React from 'react';
import type { Meta, StoryObj } from "@storybook/react";
//import {  ErrorAlert } from "..";

 
import  { KeycloakProvider, useKeycloak } from '..'

const MyComponent = ()=>{

  const {keycloak, authenticated} = useKeycloak()

  React.useEffect(()=>{
    console.log("[MyComponent.useEffect called]", keycloak)
  },[])
  return (<div>Hello</div>)
}




const meta: Meta<typeof MyComponent> = {
	component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */



export const Single: Story = {
	render: () =>
		<KeycloakProvider
         // config={window.location.origin + '/kclocal.json'}
          disabled={false}

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

};
