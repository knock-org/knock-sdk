# Next.js (Pages Router)

## Initialize: `pages/_app`

In `pages/_app.tsx` (or `src/pages/_app.tsx`), wrap what it renders. Keep the existing wrappers,
such as a `SessionProvider`.

```tsx
import type { AppProps } from 'next/app';
import { KnockProvider } from 'knockai/react';

const knockTagId = process.env.NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID;
if (!knockTagId && process.env.NODE_ENV === 'development') console.warn('NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID is not set, so Knock is off');

export default function App({ Component, pageProps }: AppProps) {
  const page = <Component {...pageProps} />;
  return knockTagId ? <KnockProvider tagId={knockTagId}>{page}</KnockProvider> : page;
}
```

- On a marketing site the variable is `NEXT_PUBLIC_KNOCK_WEBSITE_TAG_ID`.
- `NEXT_PUBLIC_` is required, because `_app` runs in the browser. Next.js writes the value into
  the browser code at build time, so in production set it where the build runs.
- `_app` also renders on the server. That's safe: `KnockProvider` initializes in an effect, which
  only runs in the browser, and every call does nothing on the server.
- No `'use client'` needed: the Pages Router doesn't use it.
- No `_app` file yet: create one with just this.

## Identify

Use the React pattern in [identify.md](identify.md). Render the component inside the auth provider
in `_app`.

## Book a demo

See [demo-button.md](demo-button.md).
