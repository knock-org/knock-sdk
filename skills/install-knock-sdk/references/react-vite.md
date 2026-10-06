# React (Vite, Create React App, React Router)

Import from `@knock-ai/sdk/react`: `KnockProvider`, `useKnock`, `useKnockIdentify`, `useKnockEvent`,
`KnockButton`, `KnockLink`.

## Initialize: wrap the app once

**Vite.** The entry is the module script in `index.html`, usually `src/main.tsx`. Wrap what it
renders:

```tsx
import { KnockProvider } from '@knock-ai/sdk/react';

const knockTagId = import.meta.env.VITE_KNOCK_PRODUCT_TAG_ID;
if (!knockTagId && import.meta.env.DEV) console.warn('VITE_KNOCK_PRODUCT_TAG_ID is not set, so Knock is off');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {knockTagId ? <KnockProvider tagId={knockTagId}><App /></KnockProvider> : <App />}
  </StrictMode>,
);
```

- On a marketing site the variable is `VITE_KNOCK_WEBSITE_TAG_ID`: change the name everywhere it
  appears (the read, the warning and the type declaration below).
- Vite only exposes variables that start with its prefix (`VITE_`, or the `envPrefix` set in
  `vite.config`), and reads env files from the project root (or the `envDir` set there).
- If `src/vite-env.d.ts` declares `interface ImportMetaEnv`, add
  `readonly VITE_KNOCK_PRODUCT_TAG_ID?: string` to it. If no file declares it, don't create one.
- `KnockProvider` calls `init()` once, when it mounts. Changing `tagId` later does nothing.
- Keep the existing wrappers (router, store, auth providers). `KnockProvider` can go inside or
  outside them.

**With sign-in.** When the entry already wraps `<App />` in an auth provider, put `KnockProvider`
inside it, and the [identify component](identify.md#react) inside `KnockProvider`, so it only runs
when Knock is on:

```tsx
<StrictMode>
  <AuthProvider>
    {knockTagId ? (
      <KnockProvider tagId={knockTagId}>
        <KnockIdentify />
        <App />
      </KnockProvider>
    ) : (
      <App />
    )}
  </AuthProvider>
</StrictMode>
```

`AuthProvider` stands for the app's own (`ClerkProvider`, `Auth0Provider`, ...). Name the new file
the way the app names components, for example `src/KnockIdentify.tsx`. If the auth provider is
rendered inside `<App />` instead, render `<KnockIdentify />` inside it there.

**Create React App.** The entry is `src/index.js` (or `.tsx`). Read
`process.env.REACT_APP_KNOCK_PRODUCT_TAG_ID`, and warn when `process.env.NODE_ENV === 'development'`.

**React Router (framework mode) or Remix on Vite.** Wrap the `<Outlet />` in the default-exported
`App` component of `app/root.tsx`. Variables are Vite's: `import.meta.env.VITE_...`.

**Anything else.** Wrap the root component that every page renders through. If you can't confirm
how the setup exposes public env vars to the browser, put the id in a constant next to the provider
instead. It's public.

## Identify

See [identify.md](identify.md). Either:

- a `KnockIdentify` component, rendered inside `KnockProvider` and the auth provider, as above, or
- the `user` prop on `KnockProvider`, if the signed-in user is known where it renders.

`useKnockIdentify(traits)` needs an email on every render, since `email` is required. Use it only
in a component that renders while someone is signed in.

## Book a demo

See [demo-button.md](demo-button.md).
