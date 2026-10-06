# Links to Knock

When a visitor opens a Knock chat link (`https://start-chat.com/...` or
`https://login.start-chat.com/...`) from your site or app, Knock can connect the chat to that
visitor instead of treating them as someone new, as long as the link carries their Knock identity.
Your Knock modal, widget and `scheduling.load()` already add it. For links you render yourself, use
`KnockLink` in React or `knock.wrapLink()` anywhere else.

## React: `KnockLink`

```tsx
import { KnockLink } from '@knock-ai/sdk/react';

<KnockLink href="https://start-chat.com/slack/acme/sales" target="_blank" rel="noopener">
  Chat with sales
</KnockLink>
```

- It renders a plain `<a>` with your `href` as it is, so server rendering gives the same HTML as
  before and nothing re-renders when Knock loads.
- The identity is added only while the visitor opens the link: a click (with or without Cmd, Ctrl
  or Shift), a middle-click, Enter, or a mouse press, so a link dragged to a new tab has it too.
  Then the link goes back to your plain `href`.
- A right-click, a long-press on a phone, or a Ctrl-click on a Mac always shows your plain `href`,
  so a copied link never carries the visitor's identity.
- It takes any other `<a>` prop (`target`, `rel`, `className`, `aria-*`, `data-*`, ...) and a
  `ref`. Your own `onClick`, `onAuxClick`, `onKeyDown`, `onPointerDown`, `onContextMenu` and
  `onDragEnd` run first, and see your plain `href`. If your `onClick` calls
  `event.preventDefault()`, the link stays as it is.

## Anywhere else: `knock.wrapLink(url)`

`knock.wrapLink(url)` returns `url` with the visitor's Knock identity added. Call it when the
visitor opens the link, not when you render it, and put the plain URL back right after:

```ts
import { knock } from '@knock-ai/sdk';

const url = 'https://start-chat.com/slack/acme/sales';

function openChat(event: MouseEvent) {
  if (event.button > 1) return; // not on a right-click
  link.href = knock.wrapLink(url); // the browser opens this one
  setTimeout(() => (link.href = url)); // then the link is plain again, for a later copy
}
link.addEventListener('click', openChat); // click, Cmd/Ctrl-click, Enter
link.addEventListener('auxclick', openChat); // middle-click

window.open(knock.wrapLink(url));
```

- Before your Knock tag has loaded, and on the server, it returns `url` unchanged. It never throws
  and never waits.
- Vue: `useKnock().wrapLink(url)`, with `@click` and `@auxclick` on the link. Angular:
  `inject(KNOCK).wrapLink(url)`, with `(click)` and `(auxclick)`. HTML pages with the CDN snippet:
  `knockai.wrapLink(url)`.
- Use it for links to Knock: it adds the visitor's Knock id to whatever URL you give it.

## On your marketing site

Your website tag adds the identity to links to Knock on the page by itself, by default. Your product
tag leaves your app's links alone, so in a logged-in app use `KnockLink` or `knock.wrapLink()`.
Using them on your marketing site too does no harm.
