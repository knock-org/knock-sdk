# Links to Knock chat

A link to Knock chat (`start-chat.com`, `login.start-chat.com`, or their `stg.` variants) that a
visitor opens from the app should carry their Knock identity, so Knock connects the chat to them.
Knock's modal, widget and `scheduling.load()` already add it. For the app's own links, add it when
the visitor opens the link, never when it renders, and put the plain URL back right after: the
page's HTML stays as it is, and a link copied with a right-click or a long-press never carries it.
Only the logged-in app's links need this: on a marketing site, the website tag adds it to links to
Knock by itself.

Change only the links the user picked, and nothing else about them: keep the URL, the text, the
classes and every other prop. `KnockLink` and `wrapLink()` are in `@knock-ai/sdk` 0.1.3 and later.

## React and Next.js: `KnockLink`

Swap the `<a>` for `KnockLink`, with the same props:

```tsx
import { KnockLink } from '@knock-ai/sdk/react';

<KnockLink href="https://start-chat.com/slack/acme/sales" className="cta" target="_blank">
  Chat with sales
</KnockLink>
```

- It renders the same `<a>`, takes every `<a>` prop and a `ref`, and runs the link's own `onClick`
  and other handlers first. It covers click, Cmd/Ctrl-click, middle-click and Enter, and puts the
  plain URL back after.
- A `next/link` `<Link>` to a Knock URL becomes `KnockLink` too: drop the props only `Link` has
  (`prefetch`, `replace`, `scroll`, `shallow`, `locale`, `passHref`, `legacyBehavior`). With
  `legacyBehavior`, the text and the `<a>` props are on its child `<a>`: put those props on
  `KnockLink` and drop that `<a>`, since a link inside a link breaks the page. An `href` object
  (`{ pathname, query }`) becomes the URL string it stands for.
- In the App Router it can render from a server component, as long as you pass it no event
  handlers. No `'use client'` needed.
- A link rendered by another component (a design-system `<Button href>`): leave the component as it
  is, and use `openChat` below as its `onClick` (and `onAuxClick`, if it passes that on), with
  `const knock = useKnock()`.

## Any other code: `knock.wrapLink(url)`

Set the link's URL as the visitor opens it, in its `click` handler (click, Cmd/Ctrl-click, Enter)
and its `auxclick` handler (middle-click), then put the plain URL back. If the link already has a
click handler, call `openChat(event)` at its start.

```ts
const url = 'https://start-chat.com/slack/acme/sales';

function openChat(event: MouseEvent) {
  if (event.button > 1) return; // not on a right-click
  const link = event.currentTarget as HTMLAnchorElement;
  link.href = knock.wrapLink(url);
  setTimeout(() => (link.href = url)); // plain again, so a later copy is clean
}
link.addEventListener('click', openChat);
link.addEventListener('auxclick', openChat);
```

- **`window.open`:** wrap the URL: `window.open(knock.wrapLink(url), '_blank')`.
- **Vue:** `const knock = useKnock()` and `openChat` in `<script setup>`, and
  `@click="openChat" @auxclick="openChat"` on the link.
- **Angular:** `readonly knock = inject(KNOCK);` in the component, `openChat` as a method (with
  `this.knock`), and `(click)="openChat($event)" (auxclick)="openChat($event)"` on the link.
- When the URL differs per link (a list), give `openChat` the URL as a second argument:
  `openChat($event, item.url)`.
- **HTML pages:** the same function and listeners in a `<script>` after the link, with
  `knockai.wrapLink(url)`.
  An inline script needs the same Content-Security-Policy treatment as the snippet
  ([csp.md](csp.md)). If the page has the snippet's code inline and there's no `wrapLink` in it,
  it's an older copy: replace it with the one in [cdn.md](cdn.md), keeping its tag id, and say so
  in the plan.

Never call `wrapLink()` while rendering: not in a JSX `href={...}`, a `:href` or `[href]` binding,
or a computed value. The link would carry the identity in the page's HTML, and in what visitors
copy.

## In the report

One line per changed link under Changed:
`app/pricing/page.tsx:42   link to Knock chat keeps the visitor's identity (KnockLink)`. Links the
user didn't pick go under Skipped, with their `path:line`.
