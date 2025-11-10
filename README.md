# React Keycloak Provider
[![tests](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml/badge.svg)](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml)
[![npm](https://img.shields.io/npm/v/react-keycloak-provider.svg)](https://www.npmjs.com/package/react-keycloak-provider)

###

Based on `keycloak-js` package, wraps it with React Context Provider

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
      disabled={false} // disable keycloak auth ("keycloak" instance returned from hook would be null)
      timeout={12000}  // default connection timeout

      // passed to constructor
      // const keycloak = new Keycloak({ ... })  
      config={{
         url: 'http://localhost:8282/',
         realm: 'demo',
         clientId: 'react-client'
      }}
        
      // passed to keycloak.init({ ... }) 
      initOptions={{
        // 'check-sso' or 'login-required'
        onLoad: 'check-sso',    
        // if  'check-sso' copy 'silent-check-sso.html' to /public folder
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
import { useKeycloak } from 'react-keycloak-provider';
import Button from '@mui/material/Button';

const AppBar = ()=> {
    const {keycloak, authenticated} = useKeycloak();
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


```html
<!-- silent-check-sso.html  -->
<html>
    <body>
        <script>
            parent.postMessage(location.href, location.origin)
        </script>
    </body>
</html>

```

## References
- [Keycloak JavaScript adapter](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)

