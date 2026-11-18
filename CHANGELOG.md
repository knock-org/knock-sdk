# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-11-18

### Added

- `knock.chat`: `open()`, `close()`, `setSkin()`, `resetSkin()` and `configure()` control the Knock
  chat. They never throw. Calls made before your Knock tag is ready wait and go to the chat in
  order. See `docs/chat.md`.
- `knock.chat` works when your tag's config has no chat. The SDK has no chat of its own: the chat is
  always your Knock tag's. When the tag's config has the chat, the SDK passes every `knock.chat`
  call to `window.Knock.chat`. When it has none, a tag from knock-tag 0.10.1 and later has
  `window.Knock.loadChat()`, and the SDK calls it once, at the first `knock.chat` call (`chat` in
  `init()` counts). The tag then downloads its own chat from Knock's CDN (`js.knock-ai.com`), the
  same place as the tag: a chunk of about 3 kB gzipped, and, when the page is idle and the chat can
  show, the widget (about 168 kB gzipped, plus the look's CSS) or, for `headless`, its headless
  chunk (about 16 kB gzipped). Calls made before or during the load reach the tag's chat in order.
  `window.Knock` is a new object after the load, and the SDK subscribes its events to it again.
  Your code is that chat's only setup, so a live chat needs `magicLinkId` in `init({ chat })` or
  `configure()`. A tag from knock-tag 0.10.0 or earlier with no chat in its config can't load one:
  you get one `error` event, then `knock.chat` does nothing. See `docs/chat.md`, "When your tag's
  config has no chat".
- `init({ chat })` sets up the chat: it is sent to the chat as `chat.configure()`, ahead of every
  other call, including calls made before `init()`. `KnockProvider`, `KnockPlugin` and
  `provideKnock()` pass it through with the other options.
- `KnockChatPreset` names the chat's presets: `harbor`, `nightshift`, `fieldbook`, `signal`,
  `terminal` and `pixel`.
- `error` fires with `'chat failed to load'` when the chat can't load: a tag from knock-tag 0.10.0 or
  earlier with no chat in its config, a chat file that does not download, or a tag script that
  does not load. Then `knock.chat` does nothing and never throws.
- A picture in a chat message opens full screen on a click, or with Enter or Space. Escape, the
  close button and a click beside the picture close it.
- Types for the chat: `KnockChat`, `KnockChatOptions`, `KnockChatOpenOptions`, `KnockChatSkin`,
  `KnockChatPreset`, `KnockChatScreens` and `KnockChatTestScenario` (test mode), also in
  `@knock-ai/sdk/contract`.
- `magicLinkId` in `chat.configure()` (and `init({ chat })`) and in `chat.open()`: the chat runs on
  this magic link instead of the one set in your Knock tag. Each link has its own conversation. A
  link stays until another is set; `configure({ magicLinkId: null })` goes back to the tag's link.
- `container` in `chat.configure()` (and `init({ chat })`): the chat shows inline, inside that
  element of your page (an element, or a CSS selector), instead of floating over it. It fills the
  element, which needs a height, and has no bubble and no close button. The conversation starts at
  the visitor's first action or at `open()`, not on a page view. `configure({ container: null })`
  goes back to the floating chat. See `docs/chat.md`, "Inline".
- `headless` in `chat.configure()` (and `init({ chat })`): your function gets the chat as a client
  (`getState()`, `subscribe()`, `send()`, `retry()`, `resolveAction()`) and your own UI draws it.
  Knock renders nothing and downloads no UI: when your tag's config has no chat, the tag loads its
  headless chunk (about 16 kB gzipped, no React) in place of the widget. Set it
  before the chat loads; `null` clears it, as for the other keys. See `docs/chat.md`, "Headless".
- Types for headless: `KnockChatClient`, `KnockChatConversation`, `KnockChatMessage`,
  `KnockChatPart`, `KnockChatAction` and `KnockChatPerson`. An action carries `kind`
  (`'book-a-meeting'` today), typed as a string: draw a kind you do not know as a plain button.
  A new part type comes in a minor release, with a line here: skip the types you don't know.
- The public declarations are checked in CI: `api/core.d.ts` in the source repository is a snapshot
  of the types a vendor compiles against, and a vendor's headless code is compiled against the
  built package under `strict`. A change to a public type now shows as a readable diff.
- `agentImageUrl` in `chat.configure()` (and `init({ chat })`), and `assets.bubble` in the skin:
  the AI agent's picture and the bubble's, each an `https://` or `http://` URL or a path on your
  site. Without one, the agent shows the first letter of `brandName` (else the spark icon) and the
  bubble its icon. The headless agent's `imageUrl` carries the agent's picture. See `docs/chat.md`,
  "Pictures".
- `assets.wall` and `assets.header` in the skin: the conversation's background, drawn as a soft
  pattern from the picture's shape (a wall from another origin needs CORS, and a strict CSP needs
  `data:` in `img-src`), and your logo in the header in place of the agent's picture.
- The chat says in the console why it does not show, once per page: no magic link (or a URL in its
  place), a page inside an iframe, an origin Knock does not allow, and a link that is unknown or
  switched off. The first two print only when the page's code used the chat, and the no-link one
  only once the chat would load (idle, an open or a click), so a link set a moment after the first
  call prints nothing. See `docs/chat.md`, "If the chat does not show".
- When your tag's config has no chat, `configure({ magicLinkId: null })` turns a live chat off, since
  there is no tag link to go back to; a later link brings it back.
- `chat.open` can be passed straight to a click handler (`onClick={knock.chat.open}`): it also takes
  a click event (`KnockChatOpenEvent`), which the chat ignores.
- `on('chat:open')` and `on('chat:close')`, with `{ test }`.
- `@knock-ai/sdk/testing`: the mock records the five chat calls.
- `docs/csp.md` lists the sources the chat needs: the chat API (`connect-src`), the hosts of rep
  photos and files (`img-src`) and, when the skin loads web fonts, Google Fonts.

### Changed

- The CDN snippet defines `knockai.chat`. A snippet you pasted before still works, and
  `knockai.init({ chat })` works with it; paste the new snippet to call `knockai.chat` before the
  SDK has loaded.
- `knock.widget.*` passes its arguments on to your Knock tag, like `knock.chat.*`. The tag's widget
  methods take none, so nothing changes.
- The core is about 2.1 kB gzipped. It loads no file of its own with `import()`, so the CDN install
  has no extra chat files to host, and CSP needs nothing beyond what your tag already needs: the
  chat's files come from the tag's own host.
- The core passes `chat:open` and `chat:close` events only once your tag's runtime has a chat.

## [0.1.3] - 2026-10-05

### Fixed

- The Knock tag now loads on sites served from a `knock-ai.com` domain. The check for a Knock tag already on the page matched any script from such a site, so the SDK never loaded its tag there.

### Added

- `knock.wrapLink(url)` returns `url` with the visitor's Knock identity added, so a Knock chat
  opened from one of your own links knows who the visitor is. Call it when the link is opened, for
  example in its click handler or around a `window.open()` URL. Before your Knock tag has loaded,
  and on the server, it returns `url` unchanged. It never throws. Also on `useKnock()` in Vue,
  `inject(KNOCK)` in Angular and `knockai` on HTML pages. See `docs/links.md`.
- React: `<KnockLink href="...">`, a plain `<a>` that does this for you when the visitor opens the
  link (click, Cmd/Ctrl-click, middle-click or Enter). It renders your `href` as it is, so server
  rendering stays the same, and puts it back once the link is opened, so a link copied with a
  right-click or a long-press never carries the identity. It takes any `<a>` prop and a `ref`.
- `@knock-ai/sdk/testing`: the mock's `wrapLink(url)` returns `url` and records the call.
- The install skill also finds links to Knock chat in your code, and offers to keep the visitor's
  identity on them.

### Changed

- The CDN snippet defines `knockai.wrapLink()`. A snippet you pasted before still works, and has
  `knockai.wrapLink()` once the SDK has loaded; paste the new snippet to call it any time.
- Core is ≤ 1.74 KB gzip (was ≤ 1.7 KB): `wrapLink()` adds 39 bytes and the stricter Knock tag check 8.

## [0.1.2] - 2026-10-05

### Changed

- Renamed from `knockai` to `@knock-ai/sdk`. Same API: replace `knockai` with `@knock-ai/sdk` in
  your imports (`knockai/react` → `@knock-ai/sdk/react`, …). The CDN global is still
  `window.knockai`.
- The CDN snippet now loads from `https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/`. A snippet you
  pasted before keeps working; paste the new one to get updates.

## [0.1.1] - 2026-10-05

### Added

- Install with your AI agent. `npx skills add knock-org/knock-sdk` adds an install skill to the
  coding agents it detects (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Windsurf,
  OpenCode and others; `-a <agent>` to choose). Then ask your agent to install the Knock SDK, or
  type `/install-knock-sdk` in Claude Code or `$install-knock-sdk` in Codex. It says what it will
  do and asks before it starts, suggests events to track, and adds `track()` calls for the ones you
  pick. An agent without skills support can follow
  https://raw.githubusercontent.com/knock-org/knock-sdk/main/skills/install-knock-sdk/SKILL.md.

## [0.1.0] - 2026-10-01

First public release.

### Added

- `knock.init()`, `identify()`, `track()`, `on()`, `modal.open()` / `modal.close()`,
  `scheduling.load()`, and `widget.show()` / `hide()` / `open()` / `close()`.
- Works with your website tag and your product tag. `knock.surface` says which one loaded.
- Calls made before the SDK is ready are queued (up to 1,000) and sent in order once it is.
- Safe to use with server rendering: on the server every call does nothing.
- CDN install: a small snippet that loads the SDK from jsDelivr, which then loads your Knock tag.
- React, Vue and Angular bindings: `knockai/react`, `knockai/vue`, `knockai/angular`.
- `knockai/testing`: an in-memory mock for your tests.
- Core is about 1.7 KB gzip, with zero dependencies.

[0.1.4]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.4
[0.1.3]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.3
[0.1.2]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.2
[0.1.1]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.1
[0.1.0]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.0
