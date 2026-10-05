# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - Unreleased

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

[0.1.2]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.2
[0.1.1]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.1
[0.1.0]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.0
