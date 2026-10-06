<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/knock-logo-dark.svg">
    <img alt="Knock" src="assets/knock-logo.svg" width="160">
  </picture>
</p>

<p align="center"><strong>@knock-ai/sdk</strong> — the Knock AI SDK for your website and your logged-in app</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@knock-ai/sdk"><img alt="npm: @knock-ai/sdk" src="https://img.shields.io/badge/npm-%40knock--ai%2Fsdk-cb3837"></a>
  <a href="#compatibility"><img alt="core size" src="https://img.shields.io/badge/core-%E2%89%A41.74%20kB%20gzip-506bff"></a>
  <a href="#compatibility"><img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-506bff"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
</p>

---

`@knock-ai/sdk` lets your code tell Knock who a person is, record what they do, and open your Knock
scheduling modal, on your marketing site or in your logged-in app. It loads your Knock tag for you
and queues your calls until it's ready, so you never have to wait for it. It's typed, has zero
dependencies, and the core is ≤ 1.74 KB gzip.

## Install with your AI agent

1. Add the install skill to your coding agent:

   ```bash
   npx skills add knock-org/knock-sdk
   ```

   It installs the skill for the agents it detects (Claude Code, Codex, Cursor, GitHub Copilot,
   Gemini CLI, Windsurf, OpenCode and others). To choose, add `-a <agent>`, for example `-a cursor`.
2. Ask your agent to install the Knock SDK. In Claude Code you can type `/install-knock-sdk`, and
   in Codex `$install-knock-sdk`.

It tells you what it will do and asks before it starts. Then it looks through your project, suggests
events to track, asks for your tag id, shows you a plan, and installs `@knock-ai/sdk`.

If your agent doesn't support skills, paste this into it:

```text
Install the Knock SDK by following https://raw.githubusercontent.com/knock-org/knock-sdk/main/skills/install-knock-sdk/SKILL.md
```

## Install

### npm

```bash
npm install @knock-ai/sdk
```

```ts
import { knock } from '@knock-ai/sdk';

knock.init({ tagId: 'YOUR_TAG_ID' });

knock.identify({ email: user.email, firstName: user.firstName });
```

### CDN (no build step)

Paste this once in `<head>`. It works the same as the npm package: the code after it can call
`knock.identify()`, `knock.track()` or `knock.modal.open()` right away.

<!-- knockai-snippet:start -->
```html
<script>
(function(){'use strict';function w(c){return !!c&&Array.isArray(c.q)}function l(c){return !c||w(c)||c.__knockai===true}var f="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var k,d,u;if(typeof window=="undefined"||window.knockai)return;let r=l(window.knock),s=[],o={q:s,ready:false};for(let e of S){let[n,i]=e.split("."),t=(...p)=>{s.push([e,p]);};i?((k=o[n])!=null?k:o[n]={})[i]=t:o[n]=t;}o.on=(...e)=>{let n,i=["on",e,t=>n=t];return s.push(i),()=>n?n():void(i[0]="")},o.wrapLink=e=>e,o.scheduling={load(...e){let n;s.push(["scheduling.load",e,t=>n=t]);let i=t=>()=>n?n[t]():s.push([()=>n[t](),[]]);return {open:i("open"),close:i("close"),get status(){return n?n.status:"loading"}}}},window.knockai=o,r?window.knock=o:console.warn("[knockai] window.knock is taken by this page \u2014 use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(u=(d=document.currentScript)==null?void 0:d.dataset.knockaiSrc)!=null?u:f,document.head.appendChild(a);})();
})();
knockai.init({ tagId: 'YOUR_TAG_ID' });
</script>
```
<!-- knockai-snippet:end -->

The snippet defines `window.knock`, plus `window.knockai` for pages that already use the name
`knock`. A full page: [`examples/vanilla/index.html`](examples/vanilla/index.html).

## One SDK, two tags

Your Knock workspace has two tags. Pass the right one's id to `init()`. The API is the same on both.

| Where | `tagId` | What `identify()` does | Captured automatically |
|---|---|---|---|
| Your marketing site | Your website tag's id | Captures a lead. Knock may research the lead's company to help your sales team. | What your website tag is set up to capture (page views, clicks, forms) |
| Your logged-in app | Your product tag's id | Tells Knock which signed-in customer this is. Knock doesn't start its website lead research for them. | Nothing by default: only your `track()` and `identify()` calls, plus clicks on Knock's widget if you show it |

Once the SDK is ready, `knock.surface` is `'website'` or `'product'`. It's `undefined` before that,
and on older Knock tags.

## Identify

```ts
knock.identify({
  email: 'jane@acme.com', // required
  firstName: 'Jane',
  company: 'Acme',
});
```

More in [`docs/identify.md`](docs/identify.md).

## Track events

```ts
knock.track('trial_started', { plan: 'pro' });
```

Names and limits: [`docs/events.md`](docs/events.md).

## Open the scheduling modal

```ts
knock.modal.open({ magicLinkId: 'a1b2c3', email: user.email });

knock.modal.open(); // your default Knock modal
```

To start loading times before you open it, use `knock.scheduling.load()`. See
[`docs/widget-and-modals.md`](docs/widget-and-modals.md).

## Links to Knock chat

A Knock chat link that carries the visitor's identity lets Knock connect the chat to that visitor.
Your Knock modal and widget already do this. For your own links, add it when the visitor opens one:

```ts
const url = 'https://start-chat.com/slack/acme/sales';
function openChat(event: MouseEvent) {
  if (event.button > 1) return; // not on a right-click
  link.href = knock.wrapLink(url);
  setTimeout(() => (link.href = url)); // plain again, so a later copy is clean
}
link.addEventListener('click', openChat);
link.addEventListener('auxclick', openChat); // middle-click
```

Before your Knock tag has loaded, and on the server, `knock.wrapLink(url)` returns `url` unchanged.
In React, `<KnockLink>` does it for you. See [`docs/links.md`](docs/links.md).

## React

```tsx
import { KnockProvider, KnockButton, KnockLink } from '@knock-ai/sdk/react';

function App() {
  return (
    <KnockProvider tagId="YOUR_TAG_ID">
      <KnockButton magicLinkId="a1b2c3">Book a demo</KnockButton>
      <KnockLink href="https://start-chat.com/slack/acme/sales">Chat with sales</KnockLink>
    </KnockProvider>
  );
}
```

Vue and Angular too: [`docs/frameworks/`](docs/frameworks/).

## Compatibility

| | Declared support |
|---|---|
| React | 17+ (optional) |
| Vue | 3+ (optional) |
| Angular | 17+ (optional) |

Install only the framework you use. The package ships ES modules and CommonJS with TypeScript
types, compiled to ES2019. On the server every call does nothing, so it's safe to import from
server-rendered code.

## Docs

| | |
|---|---|
| [Quickstart](docs/quickstart.md) | Install, `init()`, your first `identify()` and `track()` |
| [Identify](docs/identify.md) | What `identify()` does on each tag, and what to send |
| [Events](docs/events.md) | `track()`: names, properties, limits |
| [Scheduling modal and widget](docs/widget-and-modals.md) | `modal.open()`, `scheduling.load()`, buttons, `on()` |
| [Links to Knock](docs/links.md) | `KnockLink`, `wrapLink()`: keep the visitor's identity on your links to Knock chat |
| [Frameworks](docs/frameworks/) | React, Vue, Angular, plain JavaScript |
| [Platforms](docs/platforms.md) | Shopify, Wix, Webflow, Framer, WordPress, AI app builders |
| [CSP](docs/csp.md) | Content-Security-Policy |
| [FAQ](docs/faq.md) | Common questions |

## License

[MIT](LICENSE) © 2026 Knock AI Ltd.
