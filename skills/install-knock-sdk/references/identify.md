# Identify

`knock.identify(traits)` takes one object:

- `email`: a string, required.
- `firstName`, `lastName`, `company` (the company's name): optional strings.
- Other fields can be strings, numbers, booleans, dates, lists of strings or `null`. Don't add any
  unless the user asks.

## When to call it

| Tag | Call it | What it does |
|---|---|---|
| Product tag (logged-in app) | When the signed-in user is known: right after sign-in, and on load when they're already signed in. | Tells Knock which signed-in customer this is. Knock doesn't start its website lead research for them. |
| Website tag (marketing site) | Only when a visitor submits their email, in that form's submit handler. | Captures a lead. Knock may research the lead's company to help the sales team. |

- **No email, no call.** Only call it once you have a non-empty email.
- **Not on every render.** React's `KnockProvider` `user` prop and `useKnockIdentify()` only send
  again when the traits change. The Vue, Angular and plain JavaScript APIs send every call, so call
  them from a sign-in event or a watcher on the email.
- **Sign-out needs nothing.** There's no reset call. When someone else signs in, identifying them
  is enough.
- **No user ids.** `userId` is a reserved name. Don't use any of these as trait names: `userId`,
  `sessionId`, `vendorId`, `tagId`, `tagVersion`, `clientId`, `version`, `uidSource`, `timestamp`,
  `pageVisit`, `pageNumber`, `tabPageNumber`, `revisionNumber`, `referrerUrl`, `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `hubspotutk`, `gclid`, `__khsc`,
  `elementCopy`.
- **`null` names.** Auth libraries often give `null` for a missing first or last name. `firstName`,
  `lastName` and `company` take a string or nothing, so pass `value ?? undefined`.
- **Don't guess names.** If the auth library only has a full name, don't split it: send the email
  alone, or ask.
- `identify()` remembers the email, so `knock.modal.open({ magicLinkId })` pre-fills it later.

## Where the signed-in user comes from

Reuse what the app already does: its auth hook, session, store or current-user request. These are
starting points; check them against the installed library's types.

| Library | Signed-in user | Email | Name |
|---|---|---|---|
| Clerk (`@clerk/clerk-react`, `@clerk/nextjs`, `@clerk/vue`) | `useUser()` | `user.primaryEmailAddress?.emailAddress` | `user.firstName`, `user.lastName` |
| Auth0 (`@auth0/auth0-react`, `@auth0/auth0-vue`) | `useAuth0()` | `user.email` | `user.given_name`, `user.family_name` |
| Auth0 (`@auth0/auth0-angular`) | `inject(AuthService).user$` | `user.email` | `user.given_name`, `user.family_name` |
| Auth0 (`@auth0/nextjs-auth0`) | `useUser()` (its import path depends on the version) | `user.email` | `user.given_name`, `user.family_name` |
| Clerk, on the server (`@clerk/nextjs/server`) | `await currentUser()` | `user?.primaryEmailAddress?.emailAddress` | `user.firstName`, `user.lastName` |
| Auth.js / NextAuth (`next-auth`) | `useSession()`, inside its `SessionProvider` | `session.user.email` | `session.user.name` is a full name |
| Auth.js v5, on the server | `await auth()`, from the app's own `auth.ts` | `session?.user?.email` | `session.user.name` is a full name |
| Supabase (`@supabase/supabase-js`) | `supabase.auth.onAuthStateChange((event, session) => ...)` | `session?.user.email` | app-specific, in `user_metadata` |
| Firebase (`firebase/auth`) | `onAuthStateChanged(auth, (user) => ...)` | `user?.email`, can be `null` | `user.displayName` is a full name |
| Anything else | The app's own hook, context, store, `/me` request or server-side session read | | |

Call the user function where the recipe says, and leave the app's pages as they are: never
convert, rename or restyle a page to reach the user. In Next.js, when only a server function has
the user and the page is a client component, see
[the user is read on the server](nextjs-app.md#the-user-is-read-on-the-server).

## React

A component that renders nothing, placed inside both `KnockProvider` (so it only runs when Knock
is on) and the auth provider. `useKnockIdentify()` sends again only when the traits change, also
under React's StrictMode. It needs an email on every render, so the inner component renders only
once there is one:

```tsx
import { useKnockIdentify } from 'knockai/react';
import { useUser } from '@clerk/clerk-react'; // the app's own auth hook

export function KnockIdentify() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) return null;
  return <Identify email={email} firstName={user?.firstName ?? undefined} lastName={user?.lastName ?? undefined} />;
}

function Identify(traits: { email: string; firstName?: string; lastName?: string }) {
  useKnockIdentify(traits);
  return null;
}
```

Name the new file the way the app names its components, for example `src/KnockIdentify.tsx`. Don't
call `knock.identify()` from a plain `useEffect` here: StrictMode runs effects twice in
development, so it would send twice.

If the user is already known where `KnockProvider` renders, pass it there instead. `user` is
nested under `traits`, and `null` sends nothing:

```tsx
<KnockProvider tagId={knockTagId} user={email ? { traits: { email, firstName } } : null}>
```

**Marketing forms.** In the component that owns the form, `const knock = useKnock();`. Then, in
the existing submit handler, as soon as it has a non-empty email and before any `await` or
navigation:

```tsx
const email = String(new FormData(event.currentTarget).get('email') ?? '');
if (email) knock.identify({ email });
```

With a controlled form, use the state that holds the email instead. Don't change how the form
submits. `identify()` reaches Knock once the Knock tag has loaded, so if submitting loads a new
page (a full page load, not a client-side route change), a visitor who submits right after the page
opens may not be identified.

## Vue

In the component where the user is known (often `App.vue`), inside `<script setup>`:

```ts
import { watch } from 'vue';
import { useKnock } from 'knockai/vue';

const knock = useKnock();
const auth = useAuthStore(); // the app's own store or composable

watch(
  () => auth.user?.email,
  (email) => {
    if (email) knock.identify({ email, firstName: auth.user?.firstName ?? undefined });
  },
  { immediate: true },
);
```

`useKnock()` only works inside `setup()`. Elsewhere (a Pinia store, a router guard), use
`import { knock } from 'knockai'`. It's the same object.

## Angular

```ts
import { inject } from '@angular/core';
import { KNOCK } from 'knockai/angular';

private readonly knock = inject(KNOCK);
```

Then, where sign-in resolves (the auth service's user stream, or the root component's
`ngOnInit`), once per sign-in or session load:

```ts
if (user?.email) this.knock.identify({ email: user.email, firstName: user.firstName ?? undefined });
```

Not from a getter, a template expression, or anything else that runs on every change detection.

## Plain JavaScript and HTML pages

Call `knock.identify({ email })` (npm) or `knockai.identify({ email })` (CDN) in the sign-in
callback, or in the form's submit handler.
