# React

```bash
npm install @knock-ai/sdk
```

```tsx
import { KnockProvider } from '@knock-ai/sdk/react';

function App() {
  return (
    <KnockProvider tagId="YOUR_TAG_ID">
      <Dashboard />
    </KnockProvider>
  );
}
```

`KnockProvider` calls `knock.init()` once, when it mounts, with the props you give it (`tagId`,
`debug`, `scriptUrl`; see [Quickstart](../quickstart.md#2-pick-your-tag-id)). Changing those props
later does nothing.

Pass `user` to identify the signed-in person. It calls `identify()` again whenever `user` changes:

```tsx
<KnockProvider tagId="YOUR_TAG_ID" user={{ traits: { email: user.email, firstName: user.firstName } }}>
```

## Hooks

```tsx
import { useEffect } from 'react';
import { useKnock, useKnockEvent, useKnockIdentify } from '@knock-ai/sdk/react';

function Dashboard({ user }) {
  const knock = useKnock();

  useEffect(() => {
    knock.identify({ email: user.email, firstName: user.firstName });
  }, [knock, user]);

  useKnockEvent('modal:close', () => console.log('Knock modal closed'));

  return <button onClick={() => knock.track('upgrade_clicked')}>Upgrade</button>;
}
```

- `useKnock()` returns the same `knock` you'd get from `import { knock } from '@knock-ai/sdk'`. It works
  outside a `KnockProvider` too.
- `useKnockIdentify(traits)` calls `identify()` on mount and again whenever the traits change.
- `useKnockEvent(event, handler)` listens to a Knock event while the component is mounted. See
  [events](../widget-and-modals.md#listening-for-events).

You don't need to wait for the SDK to be ready. Calls made before then are queued.

## `KnockButton`

```tsx
import { KnockButton } from '@knock-ai/sdk/react';

<KnockButton magicLinkId="a1b2c3" email={user.email}>
  Book a demo
</KnockButton>
```

Renders a `<button>` that opens the scheduling modal on click. With a `magicLinkId`, it starts
loading the modal on hover or focus. Leave `magicLinkId` out to open your default Knock modal. It
accepts any other `<button>` props. See [Scheduling modal and widget](../widget-and-modals.md).

## `KnockLink`

```tsx
import { KnockLink } from '@knock-ai/sdk/react';

<KnockLink href="https://start-chat.com/slack/acme/sales" target="_blank" rel="noopener">
  Chat with sales
</KnockLink>
```

Renders a plain `<a>` for a link to Knock chat, and adds the visitor's Knock identity when they use
it, so Knock can connect the chat to them. The `href` is rendered as it is: server rendering gives
the same HTML and nothing re-renders when Knock loads. The link goes back to your `href` once it
is opened, and a right-click or a long-press always shows your `href`, so a copied link stays
clean. It accepts any other `<a>` props and a `ref`, and runs your own handlers first. See
[Links to Knock](../links.md).

## Next.js

`@knock-ai/sdk/react` is marked `'use client'`, so you can render `KnockProvider` from an App Router
server component, such as your root layout:

```tsx
// app/layout.tsx
import { KnockProvider } from '@knock-ai/sdk/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <KnockProvider tagId="YOUR_TAG_ID">{children}</KnockProvider>
      </body>
    </html>
  );
}
```

Call the hooks (`useKnock`, `useKnockEvent`, `useKnockIdentify`) only from client components. On
the server every SDK call does nothing. `KnockLink` can render from a server component too, with
the props a server component can pass (no event handlers).

## Testing

`@knock-ai/sdk/testing` gives you an in-memory stand-in that records every call instead of loading
anything:

```tsx
import { createKnockMock, installKnockMock, uninstallKnockMock, type KnockMock } from '@knock-ai/sdk/testing';

let knock: KnockMock;

beforeEach(() => {
  knock = createKnockMock();
  installKnockMock(knock);
});

afterEach(() => uninstallKnockMock());

it('identifies the signed-in user', () => {
  render(<Account user={user} />);
  expect(knock.lastIdentify()?.traits.email).toBe(user.email);
});
```

While it's installed, `knock` from `@knock-ai/sdk` and every framework binding use the mock. It also
has `calls`, `eventsNamed(name)`, `emit(event, payload)` and `clearCalls()`. It works the same with
Vue, Angular and plain JavaScript, in Vitest or Jest.

A fuller example: [`examples/react/App.tsx`](../../examples/react/App.tsx).
