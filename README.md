<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/knock-logo-dark.svg">
    <img alt="Knock" src="assets/knock-logo.svg" width="160">
  </picture>
</p>

<p align="center"><strong>knockai</strong> — the Knock AI SDK for your website and your logged-in app</p>

<p align="center">
  <a href="https://www.npmjs.com/package/knockai"><img alt="npm: knockai" src="https://img.shields.io/badge/npm-knockai-cb3837"></a>
  <a href="#compatibility"><img alt="core size" src="https://img.shields.io/badge/core-%E2%89%A41.7%20kB%20gzip-506bff"></a>
  <a href="#compatibility"><img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-506bff"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
</p>

---

`knockai` lets your code tell Knock who a person is, record what they do, and open your Knock
scheduling modal, on your marketing site or in your logged-in app. It loads your Knock tag for you
and queues your calls until it's ready, so you never have to wait for it. It's typed, has zero
dependencies, and the core is ≤ 1.7 KB gzip.

## Install

### npm

```bash
npm install knockai
```

```ts
import { knock } from 'knockai';

knock.init({ tagId: 'YOUR_TAG_ID' });

knock.identify({ email: user.email, firstName: user.firstName });
```

### CDN (no build step)

Paste this once in `<head>`. It works the same as the npm package: the code after it can call
`knock.identify()`, `knock.track()` or `knock.modal.open()` right away.

<!-- knockai-snippet:start -->
```html
<script>
(function(){'use strict';function w(i){return !!i&&Array.isArray(i.q)}function u(i){return !i||w(i)||i.__knockai===true}var f="https://cdn.jsdelivr.net/npm/knockai@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var d,k,l;if(typeof window=="undefined"||window.knockai)return;let r=u(window.knock),s=[],t={q:s,ready:false};for(let c of S){let[n,e]=c.split("."),o=(...p)=>{s.push([c,p]);};e?((d=t[n])!=null?d:t[n]={})[e]=o:t[n]=o;}t.on=(...c)=>{let n,e=["on",c,o=>n=o];return s.push(e),()=>n?n():void(e[0]="")},t.scheduling={load(...c){let n;s.push(["scheduling.load",c,o=>n=o]);let e=o=>()=>n?n[o]():s.push([()=>n[o](),[]]);return {open:e("open"),close:e("close"),get status(){return n?n.status:"loading"}}}},window.knockai=t,r?window.knock=t:console.warn("[knockai] window.knock is taken by this page \u2014 use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(l=(k=document.currentScript)==null?void 0:k.dataset.knockaiSrc)!=null?l:f,document.head.appendChild(a);})();
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

## React

```tsx
import { KnockProvider, KnockButton } from 'knockai/react';

function App() {
  return (
    <KnockProvider tagId="YOUR_TAG_ID">
      <KnockButton magicLinkId="a1b2c3">Book a demo</KnockButton>
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
| [Frameworks](docs/frameworks/) | React, Vue, Angular, plain JavaScript |
| [Platforms](docs/platforms.md) | Shopify, Wix, Webflow, Framer, WordPress, AI app builders |
| [CSP](docs/csp.md) | Content-Security-Policy |
| [FAQ](docs/faq.md) | Common questions |

## License

[MIT](LICENSE) © 2026 Knock AI Ltd.
