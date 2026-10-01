# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

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

[0.1.0]: https://github.com/knock-org/knock-sdk/releases/tag/v0.1.0
