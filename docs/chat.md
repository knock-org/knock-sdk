# Knock chat

`knock.chat` controls the Knock chat on your page: open and close it, set its look, show it inside
an element of your page, draw it with your own UI, and set it up.

The chat is always your Knock tag's chat. The SDK has no chat of its own. It passes each `knock.chat`
call to your tag. When your tag's config has no chat, the tag loads one at your first call. See
[When your tag's config has no chat](#when-your-tags-config-has-no-chat).

## Before you start

A live chat needs these four things:

- **Your tag id**, for `tagId` in `init()`.
- **A magic link ID.** The chat runs on a magic link. Use the link's ID, not its URL. An ID has
  only letters, digits, `_` and `-`, up to 64 characters. Your Knock tag can hold it. When your
  tag's config has no chat, set it in code. See [Magic link](#magic-link).
- **The chat switched on.** Knock switches it on for your workspace. Ask your Knock contact.
- **Your origins allowed.** Knock adds each origin your pages load from. An origin is exact: the
  scheme, the host and the port, with no path and no wildcard. `https://acme.com` and
  `https://www.acme.com` are two origins. Send Knock your local one (`http://localhost:3000`, with
  the port you use), your staging site and each preview URL too. Knock allows up to 20.

[Test mode](#test-mode) needs none of the last three: no magic link, no switch and no origin. Use
it to build your page while you wait for Knock.

## Set it up in `init()`

```ts
knock.init({
  tagId: 'YOUR_TAG_ID',
  chat: {
    launcher: 'bubble',
    brandName: 'Acme',
    starters: ['How much does it cost?', 'Can I see a demo?'],
  },
});
```

`chat` in `init()` is the same as calling `knock.chat.configure()` with it, except that it goes to
the chat first, ahead of every other call, including calls you made before `init()`. So the chat is
set up before anything opens it.

## Methods

| Method | What it does |
|---|---|
| `knock.chat.open(options?)` | Opens the chat. |
| `knock.chat.close()` | Closes the chat. |
| `knock.chat.setSkin(skin)` | Replaces the look you set from code. |
| `knock.chat.resetSkin()` | Drops the look you set from code, back to your Knock tag's. |
| `knock.chat.configure(options)` | Sets up the chat (the options below). |

You can call them before your Knock tag is ready. The calls wait and go to the chat in the order you
made them. On the server they do nothing.

An [inline](#inline) chat is always shown. There `open()` starts the conversation and `close()` does
nothing.

`open()` takes:

| Option | |
|---|---|
| `screen` | Opens this screen of the chat. |
| `message` | Pre-fills the message box. |
| `send` | Sends this message for the visitor, once per conversation. |
| `magicLinkId` | Opens the chat for this magic link. See [Magic link](#magic-link). |

```ts
knock.chat.open({ screen: 'pricing' });
knock.chat.open({ send: 'I would like a demo' });
```

You can pass `open` straight to a click handler. The chat ignores the click event and opens as
`open()` does:

```tsx
<button onClick={knock.chat.open}>Chat with us</button>
```

## Options

```ts
knock.chat.configure({
  skin: { preset: 'harbor', mode: 'dark' },
  launcher: 'both',
  agentName: 'Ava',
});
```

| Option | |
|---|---|
| `skin` | The look: `preset`, `mode` (`'light'`, `'dark'` or `'auto'`), `colors`, `colorsDark` (see [Colors](#colors)), `typography`, `shape`, `layout` (see also [Sidebar](#sidebar)), `bubble`, `motion`, `direction` (`'ltr'` or `'rtl'`), `responsive`, `assets` (`{ bubble, wall, header }`: your pictures, see [Pictures](#pictures)). `null` clears it. |
| `launcher` | What opens the chat: `'bubble'`, `'buttons'` (your own page's buttons) or `'both'`. |
| `screens` | `{ start?, nav?, items? }`: the screen the chat starts on, how the visitor moves between screens (`'none'`, `'menu'` or `'tabs'`), and the screens. |
| `starters` | Up to 4 suggested first messages. |
| `brandName`, `agentName` | The names the chat shows. |
| `agentImageUrl` | The AI agent's picture. See [Pictures](#pictures). |
| `magicLinkId` | The magic link the chat runs on. See [Magic link](#magic-link). |
| `container` | An element of your page, or a CSS selector for it: the chat shows inside it. `null` goes back to the floating chat. See [Inline](#inline). |
| `headless` | Your function. Knock shows no chat UI and gives your function the conversation to draw. See [Headless](#headless). |
| `test` | Test mode, below. |

Each key you pass replaces that key, and `skin: null` clears the look set from code. Keys you leave
out stay as they are.

The presets for `skin.preset` are `harbor`, `nightshift`, `fieldbook`, `signal`, `terminal` and
`pixel`. You can change the look at any time with `setSkin()`:

```ts
knock.chat.setSkin({ preset: 'terminal' });
```

## Colors

`skin.colors` sets the chat's colours, one key per part (the `KnockChatColors` type).
`skin.colorsDark` takes the same keys for dark mode.

| Group | Keys |
|---|---|
| Background | `bg` (the chat), `surface` (menus, cards, chips), `surfaceRaised` (hovered items), `headerBg`, `launcherBg`, `agentBubble`, `userBubble` |
| Text | `text`, `textMuted` (times, hints), `headerFg`, `launcherFg`, `agentBubbleText`, `userBubbleText`, `onBrand` (on `brand`), `onAccent` (on `accent`), `brandInk` (links) |
| Border | `border` (borders and dividers), and its width `shape.borderWidth`: 0 to 3 pixels, default 1 |
| Brand | `brand` (buttons), `accent` (unread badges), `positive` (success marks), `focusRing` (keyboard focus) |

```ts
knock.chat.setSkin({
  colors: { bg: '#FFFFFF', text: '#14161C', border: '#D0D5DD' },
  shape: { borderWidth: 2 },
});
```

With your Knock tag only, use `whenKnock` from [`knockq` commands](#knockq-commands):

```js
whenKnock((Knock) => {
  Knock.chat.setSkin({ colors: { bg: '#FFFFFF', text: '#14161C', border: '#D0D5DD' } });
});
```

- A value is a hex colour, `#RGB` or `#RRGGBB`. Any key but `brand`, `bg` and `text` can also
  name another colour: `'$brand'`, `'$onBrand'`, `'$text'`, `'$surface'` or `'$bg'`. `'auto'` lets
  the chat choose `onBrand`, `onAccent`, `headerBg` (it takes `bg`) and `headerFg`.
- Any other value prints a console warning, and that key keeps the look's colour. A name or
  `'auto'` on `brand`, `bg` or `text` makes the chat drop all of `colors` and use the look's.
- A key you leave out keeps the look's colour. Unless the look sets them, `userBubble`,
  `launcherBg`, `focusRing` and `brandInk` follow `brand`, `userBubbleText` and `launcherFg` follow `onBrand`,
  `headerBg` follows `bg`, and `agentBubbleText` and `headerFg` follow `text`.
- In dark mode the chat uses `colorsDark`, not `colors`. Most looks have their own dark colours,
  and `harbor` follows the visitor's system (`mode: 'auto'`). So set `colorsDark` as well, or
  `colorsDark: null` to make the chat derive dark colours from your `brand`, or `mode: 'light'`.
- When `onBrand` on `brand` or `headerFg` on `headerBg` is below a 4.5:1 contrast, the chat uses
  white or a dark ink instead. It makes `brandInk` lighter or darker until it reaches 4.5:1 on
  `surface`. It uses the other text colours as you give them, so check their contrast.
- The `terminal` look takes its colours from its scheme (`skin.terminal`): of `colors` it reads only
  `brand`, which some schemes use as their accent. The `pixel` look starts from its palette
  (`skin.pixel.palette`), and your `colors` keys still replace it.

## Pictures

The agent's picture is an option. The skin's `assets` group gives a picture to three places of the
chat: `bubble`, `wall` and `header`.

```ts
knock.chat.configure({
  agentImageUrl: 'https://cdn.example.com/ava.png',
  skin: {
    assets: {
      bubble: '/images/bubble.png',
      wall: '/images/pattern.png',
      header: 'https://cdn.example.com/logo.svg',
    },
  },
});
```

| Picture | What it shows | Without it, or when it fails to load |
|---|---|---|
| `agentImageUrl` | The AI agent's picture, in the header, beside its messages and on its message over the bubble. Your reps keep their own photos. | The first letter of `brandName` on your brand colour, or the spark icon when there is no `brandName`. |
| `assets.bubble` | The bubble's picture, in place of its icon, with or without a label. | The bubble's icon (`skin.bubble.icon`). |
| `assets.wall` | The background of the conversation, as a soft pattern (below). It replaces the look's own wall, if the look has one. | The look's own background. |
| `assets.header` | Your logo, in the header in place of the agent's picture. It keeps its own shape: as tall as the agent's picture, and up to four times as wide. The agent's picture beside its messages stays. When a rep joins, the header shows the rep. | The agent's picture. |

- Each one takes an `https://` or `http://` URL, or a path on your site (such as `/images/logo.png`),
  which is resolved against the page. The chat ignores anything else, such as a `data:`, `blob:` or
  `javascript:` URL, and shows what it shows with no picture. `null` clears a picture.
- The chat asks for each picture with no referrer, so the picture's host does not see the page's
  address.
- No look has a picture of its own in these places. The `terminal` look shows the agent as a name,
  its bubble as a prompt and no picture in its header, so it shows only the wall. In the `pixel`
  look, the picture covers the agent's sprite and the bubble's.
- With a Content Security Policy, add the pictures' host to `img-src`, and `data:` for the wall
  (see [CSP](csp.md#chat)).

The wall is never drawn as your picture's colours. The chat takes the picture's shape, the parts
that are not transparent, and draws that shape as a soft tone of the chat's text colour over the
look's background. So the messages stay easy to read on any look, in light and dark mode.

- Use a PNG or SVG pattern on a transparent background. A picture with no transparent parts gives
  an even tint.
- The chat repeats the picture as a tile. A picture larger than 512 pixels on its long side is made
  smaller to 512 pixels.
- The chat downloads the wall when the visitor first opens the chat, not at page load.
- A wall from another origin needs CORS: its host must send `Access-Control-Allow-Origin` (`*`, or
  your page's origin). Without it the chat shows the look's own background. A wall on your own site
  needs nothing.

## Magic link

The chat runs on a magic link. By default it is the one set in your Knock tag. To use another one,
pass `magicLinkId` to `configure()` (or `chat` in `init()`), or to `open()`:

```ts
knock.init({ tagId: 'YOUR_TAG_ID', chat: { magicLinkId: 'YOUR_MAGIC_LINK_ID' } });

knock.chat.open({ magicLinkId: 'YOUR_PRICING_LINK_ID' });

knock.chat.configure({ magicLinkId: 'YOUR_MAGIC_LINK_ID' }); // back to this link
knock.chat.configure({ magicLinkId: null }); // back to your Knock tag's link
```

- A link you pass from code wins over the one in your Knock tag.
- A link set by `open()` or `configure()` stays until you set another one. Later `open()` calls
  without `magicLinkId` stay on it. `configure({ magicLinkId })` moves the chat to that link, even
  when it is the link you configured before. `configure({ magicLinkId: null })` moves it back to your
  Knock tag's link.
- Each link has its own conversation. When the chat moves to another link, it starts that link's
  conversation, or goes back to it: the session, the history and the messages `send` already sent
  are kept per link.
- You set the link from code only. The chat ignores a `data-knock-magic-link` attribute on your
  page.
- The link must belong to your workspace. A link from another workspace is refused unless that
  workspace allows your domain.
- In test mode the link only names the scripted conversation. Nothing goes to Knock.
- When your tag's config has no chat, there is no default link. Set one in `init({ chat })` or `configure()`. A
  link passed only to `open()` does not start that chat.
- When your tag's config has no chat, `configure({ magicLinkId: null })` turns a live chat off, because there
  is no tag link to go back to. The chat closes, leaves the page and sends nothing more. A later
  `configure({ magicLinkId })` brings it back on that link. With [`headless`](#headless), your
  function is then called again with a new client, and the old client's `send()` returns `false`.

## Inline

The chat floats over your page by default: a bubble, and a panel that opens from it. With
`container`, the chat shows inside an element of your page.

```html
<div id="support-chat" style="height: 600px"></div>
```

```ts
knock.init({
  tagId: 'YOUR_TAG_ID',
  chat: { magicLinkId: 'YOUR_MAGIC_LINK_ID', container: '#support-chat' },
});
```

`container` is the element, or a CSS selector for it. Set it in `init({ chat })`, or later with
`knock.chat.configure({ container })`.

- The chat fills the element and is always shown. It has no bubble and no close button.
- Give the element a height, and leave it empty. An element with no height shows no chat, and the
  console says so once.
- Your skin styles the chat. The parts of a skin that place, size or open the floating chat have no
  effect: `layout`, `bubble`, `responsive`, and the open and close motion.
- The conversation starts at the visitor's first action: a click in the message box, a starter, a
  message, or a click on a `data-knock-chat` element. A page view alone never starts it. To start it
  at page load, so every visitor gets the welcome message, call `knock.chat.open()`. A returning
  visitor sees their conversation at once.
- `open(options)` starts the conversation and applies its options. It does not scroll the page and
  does not move the focus. `close()` does nothing, before the chat has loaded too.
- A click on a `data-knock-chat` element scrolls the chat into view and moves the focus to it. A
  click made before the chat has loaded does the same when it has.
- `chat:open` fires when the chat shows in the element. That is when the chat loads, not at a
  click. `chat:close` fires when it stops showing: the element left the page or is hidden, or
  `container` became `null`.
- It works the same when your tag's config has the chat and when the tag loads it at your first call.

To move the chat, or to go back to the floating chat, set `container` again:

| `configure({ container })` with | What happens |
|---|---|
| Another element | The chat moves there. The conversation stays. |
| The element the chat is in | Nothing. |
| `null` | The floating chat comes back, closed. The conversation stays; a message the visitor was typing does not. |
| A selector that matches no element | No chat shows, and the console says so once. Set `container` again when the element is on the page. |
| Anything else (a jQuery object, for example) | The chat floats, and the console says so once. |

A selector is looked up once: when the chat loads, or when you set it after that. In a single-page
app the element may not be on the page yet, so pass the element from the component that renders it.
In React:

```tsx
function SupportChat() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    knock.chat.configure({ container: ref.current });
    return () => knock.chat.configure({ container: null });
  }, []);
  return <div ref={ref} style={{ height: 600 }} />;
}
```

This page shows the chat inline, and your other pages show the floating chat. For a site with no
bubble at all, add `launcher: 'buttons'` to `chat` in `init()`.

When one page with the chat follows another, the two calls come together: the chat moves to the new
element as it is, and `chat:close` fires, then `chat:open`.

When the element leaves the page and you don't set `container` again, the chat leaves with it: no
chat shows, not even a bubble, and the conversation goes on. The next `configure({ container })`
shows the same conversation.

## Sidebar

In sidebar mode the chat docks to one side of the page, at the full height of the window. Use it
where the visitor keeps reading while they chat, such as documentation or your product. Turn it on
in the skin, with `layout.mode` and `layout.position`:

```ts
knock.chat.configure({
  skin: {
    layout: {
      mode: 'sidebar',
      position: 'right', // or 'left'
      sidebar: { width: 420, behavior: 'push', trigger: 'tab' },
    },
  },
});
```

`layout.sidebar` takes these keys. Each one is optional.

| Key | Default | What it does |
|---|---|---|
| `width` | `400` | The width in pixels. It stays between `minWidth` (default `320`) and `maxWidth` (default `640`), and the page keeps at least 320 pixels. |
| `resizable` | `true` | The visitor can drag the sidebar's edge to change its width. |
| `behavior` | `'auto'` | `'push'` moves the page aside. `'overlay'` covers the page. `'auto'` pushes when at least 960 pixels of the page stay beside the sidebar, and covers it otherwise. |
| `pushTarget` | `'body'` | A CSS selector for the element that moves aside: the chat sets its margin on that side. |
| `trigger` | `'bubble'` | `'tab'` shows a tab on the edge of the page in place of the bubble. The tab shows its own mark, not `assets.bubble`. |
| `shortcut` | `'mod+i'` | The key that opens and closes the chat. `mod` is Cmd on a Mac and Ctrl elsewhere. It does nothing while the visitor types in a field of your page. `null` turns it off. |
| `persist` | `true` | A sidebar the visitor left open stays open on the next page of the same tab, and keeps the width they chose. |
| `defaultOpen` | `false` | Opens the sidebar on the first page a visitor sees in a tab, when it docks. |
| `breakpoint` | `768` | Below this window width, the chat does not dock (below). |

While the sidebar pushes the page, the chat sets two things on `<html>`, so you can move your own
fixed elements, such as a fixed header or a cookie banner:

- the CSS variable `--knock-chat-inset-right` (or `--knock-chat-inset-left`): the sidebar's width in
  pixels;
- the attribute `data-knock-chat-sidebar="right"` (or `"left"`).

```css
.site-header { position: fixed; left: 0; right: var(--knock-chat-inset-right, 0px); }
```

Both go away when the sidebar closes or covers the page.

The sidebar is for a desktop window. On a phone, below `breakpoint`, or in a window too small for
it, the chat does not dock. It opens as it does on a phone, in the presentation of
`responsive.mobilePresentation` (full screen by default). On a phone and below `breakpoint`, the
bubble shows in place of the tab. An [inline](#inline) chat ignores `layout.mode` and the
`layout.sidebar` keys.

## Headless

With `headless`, Knock draws nothing. Your function gets the page's conversation as a client, and
your own UI draws it. No Knock UI, no React and no styles are downloaded: only the conversation.

```ts
import { knock } from '@knock-ai/sdk';
import type { KnockChatClient } from '@knock-ai/sdk';

knock.init({
  tagId: 'YOUR_TAG_ID',
  chat: {
    magicLinkId: 'YOUR_MAGIC_LINK_ID',
    headless(chat: KnockChatClient) {
      chat.subscribe(() => render(chat.getState()));
      render(chat.getState());
    },
  },
});

knock.on('chat:open', showMyPanel); // a data-knock-chat element or another caller asked for the chat
myLauncher.onclick = () => { showMyPanel(); knock.chat.open(); };
myCloseButton.onclick = () => { hideMyPanel(); knock.chat.close(); };
```

Set `headless` before the chat loads: in `init({ chat })`, at app start. Do not set it from a
component's effect: on a page whose Knock tag already has the chat, the chat can load first, and a
`headless` function that comes after Knock's chat has loaded is ignored (the console says so once).

The client has five methods:

| Method | What it does |
|---|---|
| `getState()` | The conversation now. The same object until something in it changes, so it works with `useSyncExternalStore`. |
| `subscribe(listener)` | Calls `listener` once after each change. Returns a function that stops it. |
| `send(text)` | Sends a visitor message, and starts the conversation when needed. `false`, and nothing sent, when the text is empty after trimming, longer than 4,000 characters, or the status is `'unavailable'`. |
| `retry(messageId)` | Sends a `'failed'` visitor message again. |
| `resolveAction(actionId)` | Runs an action of an `actions` part (book a meeting opens Knock's booking page in a new tab). Call it inside the visitor's click. |

`getState()` gives a `KnockChatConversation`:

- `status`: `'connecting'` while the history loads, `'reconnecting'` while the live stream is down
  (messages still go and come), `'unavailable'` when the chat is off or blocked on this site, else
  `'ready'`.
- `messages`: each one is a run of parts from one author, with `id`, `author`, `at` (ms since
  epoch), `parts`, `status` (`'sending'`, `'sent'` or `'failed'`) and `edited`. A long reply can come
  as more than one message, so group by author: within one snapshot the same person is the same
  object, so compare authors with `===`.
- `typing`: the agent or the rep who is typing, or `null`.
- `starters`: suggested first messages, empty after the visitor's first message.
- `unread`: messages that came while your UI was not open: before your first `open()`, and after a
  `close()` until the next `open()`.

A person (`KnockChatPerson`) has `kind` (`'visitor'`, `'agent'` or `'rep'`), `name` (`null` for the
visitor) and `imageUrl`. The agent's `imageUrl` is your `agentImageUrl` as a full URL, or `null`
without one that the chat accepts (see [Pictures](#pictures)). A part (`KnockChatPart`) is one of four types:

| `type` | Fields |
|---|---|
| `'text'` | `text`: Markdown for the agent and reps, plain text for the visitor. Never insert it as raw HTML. |
| `'image'` | `url` (http or https) and `alt`. |
| `'actions'` | `actions`: each one has `id`, `label`, `primary` and `kind` (`'book-a-meeting'` today). Draw a `kind` you do not know as a plain button. |
| `'joined'` | None: the author, a rep, joined the conversation here. |

Later versions can add part types, in a minor release. Draw the types you know and skip any other:

```ts
function renderPart(part: KnockChatPart) {
  switch (part.type) {
    case 'text': return renderMarkdown(part.text);
    case 'image': return renderImage(part.url, part.alt);
    case 'actions': return renderButtons(part.actions);
    case 'joined': return null;
    default: return null; // a part type this code does not know yet
  }
}
```

In React, keep the client in module scope and read it with `useSyncExternalStore`:

```tsx
let client: KnockChatClient | null = null;
const waiting = new Set<() => void>();
knock.init({
  tagId: 'YOUR_TAG_ID',
  chat: { magicLinkId: 'YOUR_MAGIC_LINK_ID', headless: (c) => { client = c; waiting.forEach((l) => l()); } },
});

const noop = () => () => {};
function useChat(): KnockChatConversation | null {
  const chat = useSyncExternalStore((l) => { waiting.add(l); return () => waiting.delete(l); }, () => client, () => null);
  return useSyncExternalStore(chat ? chat.subscribe : noop, () => (chat ? chat.getState() : null), () => null);
}
```

What the other calls do with `headless`:

| | Headless |
|---|---|
| `open(options?)` | Marks your UI as shown, starts the conversation and applies `send` and `magicLinkId`. `screen` and `message` have no effect (one warning). |
| `close()` | Marks your UI as hidden. Replies then count as unread. |
| `configure()` | `starters`, `brandName`, `agentName`, `agentImageUrl`, `magicLinkId` and `test` work. `skin`, `launcher`, `screens` and `container` have no effect. A `configure()` call that sets one of them after the chat has loaded gives one warning for each key. The same keys in `init({ chat })`, or set before the chat loads, give no warning. A new `headless` function is called with the same client. |
| `setSkin()`, `resetSkin()` | Do nothing. |
| `chat:open`, `chat:close` | Fire when `open()` or `close()` changes whether your UI is shown. |
| `error` | As without `headless`. A booking page that does not open is an `error` too, because there is no Knock toast to say so. |
| A click on a `data-knock-chat` element | The same as `open()` with the element's options. |

Test mode works with `headless`: your UI draws the scripted conversation.

## Test mode

```ts
knock.init({ tagId: 'YOUR_TAG_ID', chat: { test: true } });

knock.chat.configure({ test: 'booking' }); // a named scenario
```

In test mode the chat runs a scripted conversation instead of your live chat. `true` runs the
`'default'` scenario; the others are `returning`, `rep`, `booking`, `media`, `edited`, `send-fails`,
`rate-limited`, `session-expired`, `offline`, `no-stream`, `disabled`, `origin-blocked` and
`captcha`. Once on, test mode stays on for the page: `test: false` doesn't turn it off.

`chat` in `init()` needs `@knock-ai/sdk` 0.1.4 or later. An older SDK drops it without a warning,
so your live chat would run while you think it's in test mode. Check `knock.version` if in doubt.

## When your tag's config has no chat

A Knock tag turns the chat on in its config. When yours does, `window.Knock.chat` exists once the
tag is ready, and the SDK passes it every `knock.chat` call.

When the config has no chat, a tag from knock-tag 0.10.1 and later has `window.Knock.loadChat()`
instead. The SDK calls it once, at the first `knock.chat` call (`chat` in `init()` counts). The tag
then downloads its own chat:

- The chat chunk, about 3 kB gzipped, at once.
- The widget, about 168 kB gzipped plus the look's CSS, when the page is idle and only when the chat
  can show: with `magicLinkId` or test mode.
- With [`headless`](#headless), its headless chunk instead of the widget, about 16 kB gzipped.

All of it comes from Knock's CDN (`js.knock-ai.com`), the same place as your tag. A page that never
uses the chat downloads none of it. A call made before or during the load reaches the tag's chat in
order.

```ts
knock.init({
  tagId: 'YOUR_TAG_ID',
  chat: {
    magicLinkId: 'YOUR_MAGIC_LINK_ID',
    brandName: 'Acme',
    skin: { preset: 'harbor' },
  },
});
```

- **Your code is the chat's only setup.** The link, the look, the names and the launcher saved for
  the chat in Knock live in the tag's config, which has no chat here, so the chat doesn't see them.
- **A live chat needs `magicLinkId`** in `init({ chat })` or `configure()`. Without it the chat stays
  hidden. Test mode needs no link, and it is the tag's test mode.
- **Your tag needs to be knock-tag 0.10.1 or later.** A tag from 0.10.0 or earlier, with no chat in
  its config, can't load one. The SDK fires one `error` event, `'chat failed to load'`, and then
  `knock.chat` does nothing. It never throws.
- **A failed download does the same.** When the tag's script or the chat's file does not download
  (an ad blocker, your CSP or the network), you get the same one `error` event.
- **A slow tag is waited for.** The SDK starts nothing of its own after a timeout.
- Every look, the inline chat, headless, test mode and the booking screens work, as they do when
  your tag's config has the chat.
- The HTML hooks work too, once your code has used the chat (`chat` in `init()` is enough). A click
  on an element with `data-knock-chat` opens the chat.
- `knock.ready` and the `ready` event mean your Knock tag. After the chat loads, `window.Knock` is a
  new object, and the SDK subscribes its `chat:open` and `chat:close` events to it again. You don't
  need to do anything.
- There is nothing extra to host. With npm the chat is not in your bundle, and the CDN install has
  no chat files. The SDK's core loads no file of its own.
- The chat talks to `https://app.knock-ai.com`. See [CSP](csp.md#chat).

## Events

```ts
const off = knock.on('chat:open', ({ test }) => {
  console.log('Knock chat opened', test ? '(test mode)' : '');
});
```

| Event | Payload |
|---|---|
| `chat:open`, `chat:close` | `{ test }`: `true` while the chat runs in test mode |
| `error` | `{ message, cause }`. `message` says what failed (below). For a chat error, `cause` has `code` and `status` when there are any, and `test`. |

An [inline](#inline) chat fires `chat:open` when it shows in its element and `chat:close` when it
stops showing.

The chat's `error` messages:

| `message` | What it means |
|---|---|
| `'chat failed to load'` | The chat's code did not download: an ad blocker, your CSP or the network stopped it, or an open waited 15 seconds for it. It also fires when your tag's config has no chat and the tag is knock-tag 0.10.0 or earlier, or its script did not load. The chat stays off until the page reloads, `knock.chat` does nothing, and `data-knock-chat` elements keep their own behaviour. |
| `'chat failed to mount'` | The chat's code downloaded but could not start on the page. The chat stays off until the page reloads. |
| `'chat unavailable'` | Knock refused the chat. `cause.code` says why: `'external-api.chat.origin-not-allowed'` when this origin is not allowed, `'external-api.chat.not-found'` when the chat is switched off or the magic link is unknown, `'chat-unavailable'` when the chat was switched off while the visitor was connected, and `'external-api.chat.captcha-invalid'` when Knock asks for a verification step this site can't complete. For the first three, the console also says why (see [If the chat does not show](#if-the-chat-does-not-show)). The chat checks again from time to time and comes back by itself. It fires once each time the chat becomes unavailable. |
| `'chat could not start'` | The chat could not start the conversation, for example on a network error. `cause.status` is the HTTP status, `0` when the request did not reach Knock. The visitor sees “Couldn’t start the chat. Try again in a moment.” |
| `'message not sent'` | A visitor message could not be sent. The chat marks it “Not sent”, with a Retry button. |
| `'chat session ended; the next message starts a new one'` | The visitor's session is no longer valid. `cause.code` is `'session-invalid'`. The next message starts a new session. |
| `'booking page could not open'` | With [`headless`](#headless) only: the booking page of an action did not open. |

In test mode `cause.test` is `true`. The `disabled` and `origin-blocked` scenarios fire
`'chat unavailable'` as a live chat would.

## React, Vue and Angular

`KnockProvider` (React), `KnockPlugin` (Vue) and `provideKnock()` (Angular) take `chat` with the
rest of the `init()` options. `init()` runs once, so to change the look later, call `setSkin()`:

```tsx
useEffect(() => knock.chat.setSkin(skin), [skin]);
```

For an [inline](#inline) chat, pass `container` the element from the component that renders it, as
the React example there does. In Vue, do it in `onMounted` with a template ref; in Angular, in
`ngAfterViewInit` with an `ElementRef`'s `nativeElement`.

## HTML pages (CDN)

The current snippet has `knockai.chat`. A snippet you pasted before still works with
`knockai.init({ chat })`, but `knockai.chat` is only there once the SDK has loaded: paste the new
snippet to call it any time.

## With your Knock tag only

A page with your Knock tag and no SDK can use the chat too, when the chat is on in your tag. Knock
sets it up in your tag: the magic link, the look, the names and the launcher. Your page then uses
HTML attributes and `window.knockq`.

### HTML attributes

A click on an element with `data-knock-chat` opens the chat:

```html
<button data-knock-chat>Chat with us</button>
<button data-knock-chat="pricing">Ask about pricing</button>
<a href="/contact" data-knock-chat data-knock-send="I would like a demo">Book a demo</a>
```

| Attribute | |
|---|---|
| `data-knock-chat` | Opens the chat. A value opens that screen. |
| `data-knock-screen` | The screen to open, when `data-knock-chat` has no value. |
| `data-knock-send` | Sends this message for the visitor, once per conversation. |
| `data-knock-message` | Pre-fills the message box. |

- The chat ignores `data-knock-magic-link`.
- A middle click, or a click with a modifier key, on a link still opens the link.
- A click made before the chat has loaded opens the chat when it has. A link that opens in the
  same tab waits 2.5 seconds at most, then the browser follows it.
- When the chat can't show, the element keeps its own behaviour.
- With `launcher: 'bubble'`, only the elements on the page when the chat loads open it. Use
  `'both'` to pick up elements added later too.

These attributes work with the SDK too, once your code has used the chat.

### `knockq` commands

`window.knockq` takes two chat commands:

| Command | Does the same as |
|---|---|
| `['chat.configure', options]` | `knock.chat.configure(options)`, with every option in [Options](#options) |
| `['chat.open', options]` | `knock.chat.open(options)` |

```html
<div id="support-chat" style="height: 600px"></div>
<script>
  (window.knockq = window.knockq || []).push(['chat.configure', { container: '#support-chat' }]);
</script>
```

- You can push a command before your Knock tag loads or after. Before, it waits for the tag.
- Push `headless` before your tag's script, so it is there when the tag starts the chat.
- `knockq` has no command for `close`, `setSkin` or `resetSkin`. Call `window.Knock.chat` for
  them, once your tag is ready:

```js
function whenKnock(run) {
  if (window.Knock) run(window.Knock);
  else window.addEventListener('knock:ready', () => run(window.Knock), { once: true });
}
whenKnock((Knock) => {
  Knock.chat.setSkin({ preset: 'terminal' });
  Knock.on('chat:open', ({ test }) => console.log('chat opened', test));
});
```

`Knock.on()` takes `chat:open`, `chat:close` and `error`, with the payloads in [Events](#events).
A tag without the chat ignores the chat commands, and the console says nothing.

## If the chat does not show

Each case below says what the console prints, and when. A warning prints once per page and starts
with `Vendor chat:`. Start from the list below.

**No magic link, or a URL in place of the ID.** The visitor sees no chat: no bubble. A click on a
`data-knock-chat` element does what the element does without the chat. The chat ignores a value
that is not an ID, so with a URL in code it uses your tag's link, or shows nothing. When it shows
nothing and your code used the chat, the console says:
`Vendor chat: no magic link, so the chat stays hidden. Set magicLinkId to the link's ID, not its URL.`
It says it only when the chat would load and still has no link: once the page is idle after your
Knock tag is ready (or after the first chat call, when your tag's config has no chat), at an `open()`, or at
a click on a `data-knock-chat` element. So you can call the chat first and set `magicLinkId` a
moment later, in the same task or before the page is idle, with no warning. `chat` in `init()`
counts as using the chat, and so does a `knockq` command. A page with your Knock tag only, whose
code never uses the chat, prints nothing. Pass the ID (see [Before you start](#before-you-start)).

**Your origin is not allowed.** The bubble shows. When the visitor opens the chat, it says “This
chat isn’t available on this site.” The console says, with your page's origin:
`Vendor chat: the chat API does not allow this site's origin, https://acme.com. Ask Knock to add https://acme.com to your allowed origins.`
The browser also prints its own line for the refused request. The `error` event fires
`'chat unavailable'` with `cause.code` `'external-api.chat.origin-not-allowed'`. Ask Knock to add
this exact origin.

**The chat is switched off, or the magic link is unknown.** The bubble shows. When the visitor opens
the chat, it says “This chat isn’t available right now. We’ll reconnect when it’s back.” The two
cases look the same. The console says:
`Vendor chat: the chat API says this magic link is unknown or its chat is off. Check magicLinkId, and that the chat is on for this link in Knock.`
The `error` event fires `'chat unavailable'` with `cause.code` `'external-api.chat.not-found'`.
Check the magic link ID, then ask Knock to switch the chat on.

These two warnings come from Knock's answer, so they print when the chat first asks Knock, most
often when the visitor opens it. Test mode never prints them: its `disabled` and `origin-blocked`
scenarios fire the `error` event only.

**An inline element with no height, or a selector that matches nothing.** The visitor sees no chat.
The console says, once:

- `Vendor chat: container "#support-chat" is not on the page; the chat shows when configure({ container }) names an element.`
  (with your selector)
- `Vendor chat: the chat's container has no height: give it one, for example height: 600px.`
  (2 seconds after the chat shows in the element)

Give the element a height, or set `container` again when the element is on the page. See
[Inline](#inline).

**The page is inside an iframe.** The chat runs only in the top page. The visitor sees no chat, and
`data-knock-chat` elements keep their own behaviour. When code in that frame used the chat, the
console of the frame says:
`Vendor chat: the chat does not show inside an iframe. Put it on the top page.`
A frame whose code never uses the chat prints nothing, even when your Knock tag has the chat on.
Site builders often show your page inside an iframe while you edit it: check the chat on the
published page.

**`headless` set too late.** Knock's chat stays, and your function is not called. The console says,
once: `Vendor chat: headless must be set before the chat loads: put it in init({ chat }). Knock's chat stays.`
Set `headless` in `init({ chat })`. With your Knock tag only, push it with `knockq` before your
tag's script.

## Tests

`createKnockMock()` from `@knock-ai/sdk/testing` records the five calls as `chat.open`,
`chat.close`, `chat.setSkin`, `chat.resetSkin` and `chat.configure`, and
`mock.emit('chat:open', { test: true })` fires your handlers. The mock never loads the chat.
