# React Keycloak Provider
[![Feature branch updated](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml/badge.svg)](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml)

##### usage
```tsx

// providing
import { KeycloakProvider } from 'react-keycloak-provider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <KeycloakProvider
       config={window.location.origin + '/keycloak.json'}
      // config={{
      //   url: 'http://auth.172.30.11.10.nip.io:8080/',
      //   realm: 'demo',
      //   clientId: 'react-client'
      // }}

      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      }}
    >
      <App />
    </KeycloakProvider>
  </React.StrictMode>
);
```


```tsx

// consuming
import { useKeycloakContext } from 'react-keycloak-provider';
import Button from '@mui/material/Button';

const AppBar = ()=> {
    const {keycloak, authenticated} = useKeycloakContext();
    return (
        <div> 
            {authenticated? 
                <Button onClick={keycloak.logout} label="Logout" /> :  
                <Button onClick={keycloak.login} label="Login" />
            } 
        </div>
    )

};
```


## References
- [Keycloak JavaScript adapter](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)

