# React Keycloak Provider
[![tests](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml/badge.svg)](https://github.com/kantorv/react-keycloak-provider/actions/workflows/tests.yml)
[![npm](https://img.shields.io/npm/v/react-keycloak-provider.svg)](https://www.npmjs.com/package/react-keycloak-provider)

###

Based on `keycloak-js` package, wraps it with React Context Provider

> **Changed in 2.2.0 — the provider no longer withholds your app while Keycloak initializes.**
> Earlier versions rendered `loader` *instead of* `children` until init finished or
> `timeout` elapsed, so nothing rendered — public routes included — during a slow or
> failing init. `children` now render immediately and you decide what to gate, using the
> new `initializing` context value. If you were relying on the old global gate, reproduce
> it in one line at the top of your app:
>
> ```tsx
> const { initializing, loader } = useKeycloak();
> if (initializing) return <>{loader}</>;
> ```
>
> The provider also settles as soon as `keycloak.init()` rejects (unreachable server, or a
> browser that blocks the third-party-cookie probe) instead of waiting out the full
> `timeout` — `timeout` is now only a backstop for an init that hangs.

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
      disabled={false}              // optional - (default = false) disable keycloak auth ("keycloak" instance returned from hook would be null)
      timeout={12000}               // optional - backstop for an init that never settles
                                    // (default = 12000). Not the failure path: a rejected
                                    // init settles immediately.
      loader={<MyCustomProgress />} // optional - handed back through the hook so you can
                                    // gate your own subtree on `initializing`
                                    // (default = <>Loading...</>). No longer applied globally.

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
    const {keycloak, authenticated, initializing, loader} = useKeycloak();

    // `initializing` means "we don't know yet whether there is a session" —
    // it is not the same as "anonymous". Gate on it so you don't render the
    // signed-out UI first and swap it out when the token lands.
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

##### what `useKeycloak()` returns

| field | type | meaning |
| --- | --- | --- |
| `keycloak` | `Keycloak \| null` | the adapter instance; `null` while initializing, when `disabled`, and when init failed |
| `authenticated` | `boolean` | there is a session. Only meaningful once `initializing` is false |
| `initializing` | `boolean` | `keycloak.init()` is still in flight. False in **both** settled outcomes |
| `failed` | `boolean` | init rejected, or the `timeout` backstop fired |
| `loader` | `React.ReactNode` | the provider's `loader` prop, for gating your own subtree |


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

## Contributing & releases

`development` is the default branch and the integration target; `main` is the
publish target. Merging a `feature/*` PR into `development` **does not** publish
anything to npm. A release is cut explicitly (`cut-release.yml`) onto a
`release/X.Y.Z` branch, QA'd there, and published when that branch's PR is
merged into `main`.

- [docs/RELEASING.md](docs/RELEASING.md) — how to cut, QA and ship a release, and the hotfix path
- [docs/SDLC.md](docs/SDLC.md) — branching strategy and versioning policy

## References
- [Keycloak JavaScript adapter](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter)

