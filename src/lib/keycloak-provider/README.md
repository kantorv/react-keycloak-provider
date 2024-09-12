### React Keycloak Provider


##### usage
```tsx

// index.tsx
import { KeycloakProvider } from './lib/keycloak-provider/KeycloakProvider';

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

// App.tsx
import { useKeycloakContext } from './lib/keycloak-provider/useKeycloakContext';
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