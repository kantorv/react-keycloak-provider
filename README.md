[![React app tests](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml/badge.svg)](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml)

# react-keycloak-provider


The package provides 2 components: `KeycloakProvider` - context provider, and `useKeycloakContext` hook.
The provided `keycloak` is an original instance from [keycloak-js](https://www.npmjs.com/package/keycloak-js).


### Usage

* install package `yarn add react-keycloak-provider`  or `npm install react-keycloak-provider`



* create `silent-check-sso.html` in `/public` folder with the following content:

```html
<html>
    <body>
        <script>
            parent.postMessage(location.href, location.origin)
        </script>
    </body>
</html>

```

* add adapter `keycloak.json` (exported from realm client) to `/public` folder

```json
{
  "realm": "myrealm",
  "auth-server-url": "http://auth.127-0-0-1.nip.io/",
  "ssl-required": "external",
  "resource": "react-client",
  "public-client": true,
  "confidential-port": 0
}
```


* wrap a component with provider

```typescript

import { KeycloakProvider} from "react-keycloak-provider";


//...


  <KeycloakProvider 
    initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    }}
  >
    <AnotherProvider>
        <App />
    </AnotherProvider>
  </KeycloakProvider>

```

* input arguments
```typescript

//Provider interface
interface KeycloakProviderProps {
    initOptions?: KeycloakInitOptions //
    config?: string | KeycloakConfig | undefined // 
    successFn?: (authenticated: boolean) => void
    errorFn?: () => void
    children: React.ReactNode
}


//Initialization flow
const keycloak = new Keycloak(config)

keycloak
  .init(initOptions)
  .then(function (authenticated) {
    if (successFn) successFn(authenticated)
    //console.log('[initKeycloak] initialized')
  })
  .catch(function () {
    if (errorFn) errorFn()
    //console.log('[initKeycloak] failed to initialize')
  })
`

```



* consume `keycloak` instance in component


```typescript

  //Your component/provider
  import { useKeycloakContext } from 'react-keycloak-provider';



  const [authenticated, setAuthenticated] = useState(false)
  const [loginInProgress, setLoginInProgress] = useState(true)


  const { keycloak } = useKeycloakContext()


  useEffect(()=>{
    console.log("[AuthProvider] keycloak updated", keycloak)
    if(undefined === keycloak) return;

    keycloak.onReady = (authenticated)=>{
      console.log('[keycloak.onReady]', authenticated);
      setLoginInProgress(false)
      if(authenticated !== undefined){
        setAuthenticated(authenticated)
      }
    
    }

    keycloak.onAuthSuccess = ()=>{
      setAuthenticated(true)
    }

    keycloak.onAuthError = ()=>{
      setAuthenticated(false)
    }    
    
    keycloak.onAuthRefreshError = ()=>{
      setAuthenticated(false)
    }

    keycloak.onAuthLogout = ()=>{
      setAuthenticated(false)
    }

  },[keycloak])

```




* Using with react-router-dom (6+)

```typescript

//PrivateRoute.tsx

import { useKeycloakContext } from 'react-keycloak-provider';
import { Navigate, useLocation} from "react-router-dom";


const PrivateRoute = ({children}:{children: JSX.Element }) => {
    const { keycloak:{ authenticated }={} } = useKeycloakContext()
    const location = useLocation();
    console.log("PrivateRoute caled", location.pathname)
  
    if (!authenticated) {
      //keycloak?.login()
      return (<Navigate to='/login' state={{ from: location }}  />)
    }
  
    return children;
  
  }

  
export default PrivateRoute

```


```typescript
import PrivateRoute from "...";
//Router.tsx


    <Routes>
        <Route index element={<Home />} />
        <Route path="login" element={<LoginPage />} />

        <Route path="widget" element={
            <PrivateRoute>
                <MyComponentNeedAuthentification />
            </PrivateRoute>
        } />

    </Routes>

```


### Links

* Keycloak JS adapter [https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)
* Hotfix used [https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e](https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e)
* NPM packaging [https://betterprogramming.pub/how-to-create-and-publish-react-typescript-npm-package-with-demo-and-automated-build-80c40ec28aca](https://betterprogramming.pub/how-to-create-and-publish-react-typescript-npm-package-with-demo-and-automated-build-80c40ec28aca)
