### React Keycloak Provider

> **Changed in 2.2.0**: `children` render immediately — the provider no longer replaces
> your whole app with `loader` while `keycloak.init()` is in flight, and it settles as soon
> as init rejects instead of waiting out `timeout`. Gate on the new `initializing` value
> where you actually need the session. See the root `README.md` for the full note.

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
import { useKeycloak } from './lib/keycloak-provider/KeycloakProvider';
import Button from '@mui/material/Button';

const AppBar = ()=> {
    const {keycloak, authenticated, initializing, loader} = useKeycloak();

    // "not known yet" is distinct from "anonymous"
    if (initializing) return <>{loader}</>;

    return (
        <div> 
            {keycloak && authenticated? 
                <Button onClick={keycloak.logout} label="Logout" /> :  
                <Button onClick={keycloak.login} label="Login" />
            } 
        </div>
    )

};
```