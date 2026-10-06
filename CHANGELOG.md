# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.3]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.3
[0.1.2]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.2
[0.1.1]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.1
[0.1.0]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.0
