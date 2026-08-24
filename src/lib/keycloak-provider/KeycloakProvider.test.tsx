import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { KeycloakProvider, useKeycloak } from './KeycloakProvider';
import { KeycloakService } from './keycloakService';

/**
 * A stand-in for the keycloak-js adapter whose `init()` outcome each test drives.
 * `mock`-prefixed so jest's hoisted factory is allowed to reference it.
 */
const mockAdapter: {
  instances: MockKeycloak[];
  init: (kc: MockKeycloak) => Promise<boolean>;
} = {
  instances: [],
  init: () => new Promise<boolean>(() => {}), // never settles unless a test says otherwise
};

interface MockKeycloak {
  onReady?: (authenticated?: boolean) => void;
  init: () => Promise<boolean>;
}

jest.mock('keycloak-js', () => ({
  __esModule: true,
  default: class {
    onReady?: (authenticated?: boolean) => void;

    constructor() {
      mockAdapter.instances.push(this as unknown as MockKeycloak);
    }

    init() {
      return mockAdapter.init(this as unknown as MockKeycloak);
    }
  },
}));

/** Resolves after init(), mimicking keycloak-js calling onReady just before it resolves. */
const initResolves = (authenticated: boolean) => (kc: MockKeycloak) => {
  kc.onReady?.(authenticated);
  return Promise.resolve(authenticated);
};

/** Rejects the way init() does when the 3rd-party-cookie probe cannot complete. */
const initRejects = () => () =>
  Promise.reject(new Error('Timeout when waiting for 3rd party check iframe message.'));

const Probe = () => {
  const { keycloak, authenticated, initializing, failed, loader } = useKeycloak();
  return (
    <div>
      <span data-testid="app">app</span>
      <span data-testid="initializing">{String(initializing)}</span>
      <span data-testid="authenticated">{String(authenticated)}</span>
      <span data-testid="failed">{String(failed)}</span>
      <span data-testid="keycloak">{keycloak ? 'instance' : 'null'}</span>
      {initializing ? <span data-testid="gate">{loader}</span> : null}
    </div>
  );
};

const renderProvider = (props: Partial<React.ComponentProps<typeof KeycloakProvider>> = {}) =>
  render(
    <KeycloakProvider
      config={{ url: 'http://localhost:8282/', realm: 'demo', clientId: 'react-client' }}
      initOptions={{ onLoad: 'check-sso' }}
      timeout={100000}
      {...props}
    >
      <Probe />
    </KeycloakProvider>
  );

const text = (testId: string) => screen.getByTestId(testId).textContent;

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(() => {
  KeycloakService.resetInstance();
  mockAdapter.instances = [];
  mockAdapter.init = () => new Promise<boolean>(() => {});
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

test('renders children immediately while init is still in flight', () => {
  renderProvider();

  expect(text('app')).toBe('app');
  expect(text('initializing')).toBe('true');
  expect(text('authenticated')).toBe('false');
  expect(text('failed')).toBe('false');
  expect(text('keycloak')).toBe('null');
});

test('exposes the loader prop so a consumer can gate its own subtree', () => {
  renderProvider({ loader: <>custom loading</> });

  expect(screen.getByTestId('gate').textContent).toBe('custom loading');
});

test('settles as failed when init rejects, without waiting out the timeout', async () => {
  mockAdapter.init = initRejects();

  // timeout is 100s: only the rejection path can settle this within the test.
  renderProvider();

  await waitFor(() => expect(text('failed')).toBe('true'));
  expect(text('initializing')).toBe('false');
  expect(text('authenticated')).toBe('false');
  expect(text('app')).toBe('app');
  expect(consoleWarn).not.toHaveBeenCalled();
});

test('reports an authenticated session on the success path', async () => {
  mockAdapter.init = initResolves(true);

  renderProvider();

  await waitFor(() => expect(text('authenticated')).toBe('true'));
  expect(text('initializing')).toBe('false');
  expect(text('failed')).toBe('false');
  expect(text('keycloak')).toBe('instance');
});

test('a settled anonymous check-sso is not a failure', async () => {
  mockAdapter.init = initResolves(false);

  renderProvider();

  await waitFor(() => expect(text('initializing')).toBe('false'));
  expect(text('authenticated')).toBe('false');
  expect(text('failed')).toBe('false');
  expect(text('keycloak')).toBe('instance');
});

test('the timeout backstop still settles an init that never resolves or rejects', async () => {
  renderProvider({ timeout: 50 });

  expect(text('initializing')).toBe('true');
  await waitFor(() => expect(text('failed')).toBe('true'));
  expect(text('initializing')).toBe('false');
  expect(consoleWarn).toHaveBeenCalled();
});

test('the init effect runs once per mount when initOptions is an inline object literal', () => {
  const onSpy = jest.spyOn(KeycloakService.prototype, 'on');
  const offSpy = jest.spyOn(KeycloakService.prototype, 'off');

  // fresh `config` / `initOptions` references on every render, as a consumer writes it
  const tree = () => (
    <KeycloakProvider
      config={{ url: 'http://localhost:8282/', realm: 'demo', clientId: 'react-client' }}
      initOptions={{ onLoad: 'check-sso' }}
      timeout={100000}
    >
      <Probe />
    </KeycloakProvider>
  );

  const { rerender } = render(tree());
  rerender(tree());
  rerender(tree());

  // four events subscribed, exactly once — no teardown/re-arm on the re-renders
  expect(onSpy).toHaveBeenCalledTimes(4);
  expect(offSpy).not.toHaveBeenCalled();

  onSpy.mockRestore();
  offSpy.mockRestore();
});

test('a provider mounted after init already settled picks up the settled state', async () => {
  mockAdapter.init = initResolves(true);

  const first = renderProvider();
  await waitFor(() => expect(text('authenticated')).toBe('true'));
  first.unmount();

  // The singleton has already fired 'keycloak-ready'; a fresh mount must not hang.
  renderProvider();

  expect(text('initializing')).toBe('false');
  expect(text('authenticated')).toBe('true');
  expect(text('keycloak')).toBe('instance');
});

test('disabled skips Keycloak entirely and never gates children', () => {
  renderProvider({ disabled: true });

  expect(text('app')).toBe('app');
  expect(text('initializing')).toBe('false');
  expect(text('authenticated')).toBe('false');
  expect(text('failed')).toBe('false');
  expect(text('keycloak')).toBe('null');
  expect(mockAdapter.instances).toHaveLength(0);
});

test('an init that rejects long after mount still settles the provider', async () => {
  let rejectInit: (error: Error) => void = () => {};
  mockAdapter.init = () => new Promise<boolean>((_resolve, reject) => { rejectInit = reject; });

  renderProvider();
  expect(text('initializing')).toBe('true');

  await act(async () => {
    rejectInit(new Error('Timeout when waiting for 3rd party check iframe message.'));
  });

  expect(text('initializing')).toBe('false');
  expect(text('failed')).toBe('true');
});
