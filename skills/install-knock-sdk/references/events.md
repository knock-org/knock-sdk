# Events

`knock.track(name, properties?)` records that something happened. It works on the website tag and
the product tag alike, and returns nothing.

```ts
knock.track('plan_upgraded', { plan: 'pro', interval: 'yearly' });
knock.track('logged_out'); // properties are optional
```

## What's worth tracking

- **Logged-in app (product tag).** The product tag captures nothing by default: `track()` is how
  Knock learns what customers do. Recommend the moments that show progress or buying intent:
  signing up, finishing onboarding, inviting a teammate, upgrading, and the app's core actions.
- **Marketing site (website tag).** The website tag already captures what it's set up for (page
  views, clicks, forms). Recommend outcomes it can't see, such as a sign-up or trial that succeeded.
  List plain clicks and form submits too, but don't recommend them: they may already be captured.

## Finding them

Search the app's own code, with [the exclude set](../SKILL.md#the-exclude-set). Each row is a
starting point: confirm the code really does that, and find where it succeeds.

| Action | Look for | Name | Properties |
|---|---|---|---|
| Sign up | `signUp(`, `register(`, `createUser`, `createUserWithEmailAndPassword`, a `/signup` or `/register` form | `signed_up` | `method` |
| Log in | `signIn(`, `login(`, `signInWithPassword`, `signInWithPopup` | `logged_in` | `method` |
| Log out | `signOut(`, `logout(` | `logged_out` | |
| Onboarding | onboarding, welcome or setup steps; `completeOnboarding` | `onboarding_step_completed`, `onboarding_completed` | `step` |
| Invite | `invite`, `sendInvitation`, `addMember` | `invite_sent` | `role`, `count` |
| Upgrade, checkout, purchase | `checkout`, `createCheckoutSession`, `redirectToCheckout`, `upgrade`, `subscribe`, the pricing page | `checkout_started`, `plan_upgraded`, `purchase_completed` | `plan`, `interval` |
| Main call to action | the hero or header button ("Get started", "Start free trial", "Upgrade") | `get_started_clicked`, `upgrade_clicked` | `location` |
| Important form | contact, demo request, feedback | `contact_form_submitted`, `demo_requested` | |
| Core action | creating the app's main object, export, share, connecting an integration, upload | `project_created`, `report_exported`, `integration_connected` | `template`, `format`, `integration` |

`method` is how they did it (`'email'`, `'google'`), from a fixed set in the code.

**Where it succeeds.** The line that runs once the action worked: after the `await` that confirms
it, in an `onSuccess` or `.then(...)`, or after the app's own success check. Not at the top of the
click handler, before the request: that counts attempts as successes. For a click with no request
behind it (a call to action), the click handler is the place.

## Names

The server keeps a name only if it matches `^[a-z][a-z0-9_]{0,63}$`: it starts with a letter, has
at most 64 characters, and holds lowercase letters, digits and `_`. Knock lowercases a name and
turns spaces, dashes and other symbols into `_` (`Signed up` becomes `signed_up`), cuts it to 64
characters, and drops one that doesn't start with a letter (`2fa_enabled`). Write names already in
that form, so the name in the code is the one in Knock.

- Lowercase snake_case, with the verb in the past tense, after the object when there is one:
  `signed_up`, `invite_sent`, `plan_upgraded`, `report_exported`.
- A fixed string. Never build a name from user input or a variable (`clicked_${id}`): put the
  variable in a property.
- Details go in properties: `plan_upgraded` with `{ plan: 'pro' }`, not `plan_upgraded_pro`.
- One name per action. A sign-up form on two pages is `signed_up` twice, with a `location`
  property to tell them apart.

## Properties

- **Values**: a string, number, boolean, `Date` (sent as an ISO string), list of strings, or
  `null`. Flat: no nested objects. A value that can be `undefined` takes `?? null`.
- **Limits**: at most 100 keys, 50 items in a list, 1 KB per string, and about 8 KB in all. An
  event that breaks a rule is dropped without an error.
- **0 to 3 per event**, from values already in scope where the call goes: a plan, a method, a
  role, a count, a step. Keys in lowercase snake_case, like the names.
- **Never**: emails, names, phone numbers, addresses or other personal data (`identify()` already
  says who the person is); passwords, tokens or keys; free text people typed (messages, search
  terms, notes, form answers); URLs with query strings. Properties are stored as sent.

## Where the call goes

Inside the existing handler, at the success point, after the app's own work. The app must never
depend on it: don't `await` it or branch on it. The ways below to get `knock` all work while Knock
is off (no tag id set, so no `init()`): the call is held and never sent, and never throws. So don't
wrap calls in a tag-id check.

**React** (and Next.js, in files that start with `'use client'`): `useKnock()` at the top of the
component, the call in the handler.

```tsx
import { useKnock } from 'knockai/react';

export function UpgradeButton({ plan }: { plan: string }) {
  const knock = useKnock();

  async function handleUpgrade() {
    await upgradePlan(plan); // the app's existing code
    knock.track('plan_upgraded', { plan });
  }

  return <button onClick={handleUpgrade}>Upgrade</button>;
}
```

Not in the render body, and not in a `useEffect` that runs on mount: StrictMode runs effects twice
in development. `useKnock()` works outside `KnockProvider` too. In code that isn't a component (a
store, a thunk, an API client), use `import { knock } from 'knockai'`: it's the same object.

**Next.js server code.** On the server `track()` does nothing. For a server action or an API route,
track in the client component that called it, once the result says it worked.

**Vue**: `const knock = useKnock()` in `<script setup>`, then the call in the handler. An event
binding is fine too: `@click="knock.track('upgrade_clicked')"`. Not in a computed value or a watcher
that runs on load. In a Pinia store or a router guard, use `import { knock } from 'knockai'`.

**Angular**: `inject(KNOCK)` (with `KNOCK` from `knockai/angular`) in the component or service.
Call it in the handler method, or in the success callback of the existing request:

```ts
readonly knock = inject(KNOCK);

// inside the existing success callback
this.knock.track('project_created', { template: template.id });
```

An event binding such as `(click)="knock.track('upgrade_clicked')"` is fine. A getter or template
expression that runs on every change detection is not.

**Plain JavaScript (npm)**: `import { knock } from 'knockai'`, then `knock.track(...)` in the
handler.

**HTML pages (CDN)**: `knockai.track(...)` in the handler, in a script after the element it
listens to. The snippet in the shared `<head>` defines `knockai` on every page that has it. In a
script that may also run on a page without the snippet, guard it: `if (window.knockai) ...`.

## What not to track

- Page views and route changes: the website tag captures page views when it's set up to. On the
  product tag, add one only if the user asks.
- Renders, keystrokes, scrolls, hovers, polling: anything that fires many times a second or on its
  own.
- An attempt reported as a success (the click before the request).
- The same action twice: one call per action, not one per component that shows it.

## In the report

- List each event added: name, `file:line`, properties.
- If a call runs right before a full page load (a form that posts and reloads, a redirect to a
  payment or sign-in page), say it may be lost when that happens before Knock has loaded.
- If an event was named but you found no place for it, say so instead of guessing.
- To see the SDK's own warnings while testing (a dropped call, or a call the loaded Knock tag
  doesn't support), the user can add `debug: true` to the init options (the `debug` prop on
  `KnockProvider`) on their machine. Say not to commit it.
