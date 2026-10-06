# Next.js (App Router)

`@knock-ai/sdk/react` is a client module: it's marked `'use client'`. So `KnockProvider` can be rendered
from the root layout, which stays a server component.

## Initialize: the root layout

In `app/layout.tsx` (or `src/app/layout.tsx`), add the import, the two lines above the component,
and the wrapper around `children`. Keep everything else as it is, including `metadata`, fonts, the
component's name and its props type: the example below only shows where the Knock lines go.

```tsx
import { KnockProvider } from '@knock-ai/sdk/react';

const knockTagId = process.env.NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID;
if (!knockTagId && process.env.NODE_ENV === 'development') console.warn('NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID is not set, so Knock is off');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {knockTagId ? <KnockProvider tagId={knockTagId}>{children}</KnockProvider> : children}
      </body>
    </html>
  );
}
```

- On a marketing site the variable is `NEXT_PUBLIC_KNOCK_WEBSITE_TAG_ID`.
- The `NEXT_PUBLIC_` prefix is required. Next.js writes those variables into the browser code at
  build time, so the build has to see them: in production, set the variable where the build runs.
- If the layout already wraps `children` in a client `Providers` component, `KnockProvider` can go
  inside that instead.
- `useKnock`, `useKnockIdentify` and `useKnockEvent` only work in files that start with
  `'use client'`. `KnockButton` and `KnockLink` can be rendered from a server component, as long as
  you pass them no event handlers.

## Identify

### The user is known in the browser

A client component (its file starts with `'use client'`), using the React pattern in
[identify.md](identify.md). Render it next to `children` inside `KnockProvider`, with
`KnockProvider` inside the auth provider: for example inside `<ClerkProvider>` in the layout. If the
auth provider is in a client providers file (such as next-auth's `<SessionProvider>`), put
`KnockProvider` and the component in that file, inside it. Follow the app's convention for where
components live.

### The user is read on the server

If the app reads the session on the server (`await auth()`, Clerk's `await currentUser()`, or its
own `getSession()` or `getUser()`), use that read, imported the way the app imports its own
modules (its path alias, such as `@/lib/session`, if it has one). Render a small client component
with the user's email, and names when the app has them as separate fields, as props:

```tsx
'use client';

import { useKnockIdentify } from '@knock-ai/sdk/react';

export function KnockIdentify(traits: { email: string; firstName?: string; lastName?: string }) {
  useKnockIdentify(traits);
  return null;
}
```

```tsx
{user?.email ? <KnockIdentify email={user.email} /> : null}
```

Where to render it:

- **A server layout or page already calls it:** render `<KnockIdentify>` there. Layouts and pages
  render inside the root layout, so this is inside `KnockProvider`.
- **Nothing on the server calls it yet, and the page is a client component** (its file starts with
  `'use client'`): call it in the app's group layout (after a split) or in the root layout (when
  the whole app is the logged-in app), and render `<KnockIdentify>` there, inside `KnockProvider`,
  before `children`. Make the layout `async` only if the call needs `await`. If the call reads
  cookies or headers, every page under that layout renders dynamically: fine for a logged-in app,
  so never do it in a layout that also renders marketing pages, and say it in the report.

```tsx
const user = getUser(); // the first line of the layout function

{knockTagId ? (
  <KnockProvider tagId={knockTagId}>
    {user?.email ? <KnockIdentify email={user.email} /> : null}
    {children}
  </KnockProvider>
) : (
  children
)}
```

To reach the user, never convert, rename or restyle a page, wrap it in a new server page, or move
its code into another file.

## Marketing pages and an app in one Next.js app

A page load runs one tag, and client-side navigation keeps it. So the two can use different tags
only with separate root layouts. Never pick the tag id from the URL inside one root layout:
navigating from the marketing pages into the app would keep the first tag.

**Already split** into route groups such as `app/(marketing)/layout.tsx` and
`app/(app)/layout.tsx`, each rendering `<html>`: put `KnockProvider` with
`NEXT_PUBLIC_KNOCK_WEBSITE_TAG_ID` in the first and with `NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID` in the
second.

**One shared root layout:** ask the user to choose: one tag for the whole app (which one?), or a
split into two root layouts. The split moves files, so do it only if they pick it, or if a request
you can't answer back says which routes are which
([One codebase, both tags](../SKILL.md#one-codebase-both-tags)). List every move in the plan.

1. Create the two route groups, for example `mkdir -p 'app/(marketing)' 'app/(app)'`, and move
   each top-level route into one of them with `mv`, unchanged: its folder, or `app/page.tsx` (`/`)
   with the files next to it that only it imports (such as `page.module.css`). With no
   `app/layout.tsx`, every page needs a group layout above it. Route groups don't change URLs.
   Leave shared files (`globals.css`, `favicon.ico`) where they are.
2. Copy the old root layout byte for byte into each group:
   `cp app/layout.tsx 'app/(marketing)/layout.tsx'`, and the same for the other group.
3. In each copy, add only the Knock import, the two tag-id lines and the wrapper around `children`,
   and in the app's layout the identify lines ([above](#the-user-is-read-on-the-server)). Keep
   everything else as it is: `metadata`, fonts, the component's name, its props type and its
   signature.
4. Fix relative imports with line edits, in the copies and in the moved files: `./globals.css`
   becomes `../globals.css`.
5. Diff each copy against the old root: `diff app/layout.tsx 'app/(marketing)/layout.tsx'`, and the
   same for the other. Only the lines from steps 3 and 4 may differ: put back anything else. Then
   delete `app/layout.tsx`.
6. In the report, list each move under Moved, and say under Before you merge that a URL matching
   no page now shows Next.js's default 404 page, without either layout.

## Both routers

If the app also has `pages/`, add `KnockProvider` to `pages/_app` too
([nextjs-pages.md](nextjs-pages.md)). A page load goes through one or the other, never both.

## Book a demo

See [demo-button.md](demo-button.md).
