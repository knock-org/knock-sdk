# `@knock-ai/sdk/testing`

An in-memory `KnockSDK` test double — zero DOM access, records every call, and swaps
into the framework bindings so component tests never load your Knock tag.

## Vitest

```ts
import { createKnockMock, installKnockMock, uninstallKnockMock, type KnockMock } from '@knock-ai/sdk/testing';

let knock: KnockMock;

beforeEach(() => {
  knock = createKnockMock();
  installKnockMock(knock);
});

afterEach(() => {
  uninstallKnockMock();
});

it('identifies the signed-in user', () => {
  render(<Account user={user} />);
  expect(knock.lastIdentify()?.traits.email).toBe(user.email);
});
```

## Jest

Same API — nothing here is Vitest-specific:

```ts
import { createKnockMock, installKnockMock, uninstallKnockMock } from '@knock-ai/sdk/testing';

let knock;

beforeEach(() => {
  knock = createKnockMock();
  installKnockMock(knock);
});

afterEach(() => {
  uninstallKnockMock();
});

test('tracks the upgrade event', () => {
  clickUpgrade();
  expect(knock.eventsNamed('plan_upgraded')).toHaveLength(1);
});
```

## API

- `createKnockMock()` — a full in-memory `KnockSDK`. Every call lands in `mock.calls`,
  a typed union (`{ method: 'identify', args: [...] }`, etc.).
- `mock.lastIdentify()` — traits from the most recent `identify()` call.
- `mock.eventsNamed(name)` — properties from every `track(name, …)` call, in order.
- `mock.emit(event, payload)` — fire the handlers registered via `mock.on(event, …)`,
  as if the SDK had emitted it (`ready`, `modal:open`, …).
- `mock.clearCalls()` — clears `mock.calls`; subscriptions registered with `mock.on` stay
  active.
- `mock.wrapLink(url)` — returns `url` unchanged and records the call, so a test of a link
  (`KnockLink`, or your own click handler) can assert it was wrapped.
- `installKnockMock(mock)` / `uninstallKnockMock()` — swap the singleton the
  `@knock-ai/sdk/react`, `@knock-ai/sdk/vue` and `@knock-ai/sdk/angular` bindings resolve `knock`
  through, so components under test talk to the mock instead of the real SDK.
