# Quickstart

## 1. Install

### npm

```bash
npm install @knock-ai/sdk
```

```ts
import { knock } from '@knock-ai/sdk';

knock.init({ tagId: 'YOUR_TAG_ID' });
```

### CDN (no build step)

Paste this once in `<head>`:

<!-- knockai-snippet:start -->
```html
<script>
(function(){'use strict';function w(i){return !!i&&Array.isArray(i.q)}function u(i){return !i||w(i)||i.__knockai===true}var f="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var d,k,l;if(typeof window=="undefined"||window.knockai)return;let r=u(window.knock),s=[],t={q:s,ready:false};for(let c of S){let[n,e]=c.split("."),o=(...p)=>{s.push([c,p]);};e?((d=t[n])!=null?d:t[n]={})[e]=o:t[n]=o;}t.on=(...c)=>{let n,e=["on",c,o=>n=o];return s.push(e),()=>n?n():void(e[0]="")},t.scheduling={load(...c){let n;s.push(["scheduling.load",c,o=>n=o]);let e=o=>()=>n?n[o]():s.push([()=>n[o](),[]]);return {open:e("open"),close:e("close"),get status(){return n?n.status:"loading"}}}},window.knockai=t,r?window.knock=t:console.warn("[knockai] window.knock is taken by this page \u2014 use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(l=(k=document.currentScript)==null?void 0:k.dataset.knockaiSrc)!=null?l:f,document.head.appendChild(a);})();
})();
knockai.init({ tagId: 'YOUR_TAG_ID' });
</script>
```
<!-- knockai-snippet:end -->

It works the same as the npm package. The snippet loads the SDK from jsDelivr, and the SDK then
loads your Knock tag. It defines `window.knock`, plus `window.knockai` for pages that already use
the name `knock`.

Prefer a script tag over inline code? This does the same thing:

```html
<script src="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/snippet.js"></script>
<script>knockai.init({ tagId: 'YOUR_TAG_ID' });</script>
```

A full page: [`examples/vanilla/index.html`](../examples/vanilla/index.html).

## 2. Pick your tag id

Use your website tag's id on your marketing site, and your product tag's id in your logged-in app.
See [One SDK, two tags](../README.md#one-sdk-two-tags) for what changes between them.

Call `init()` once, as early as you can. A second call is ignored. On the server it does nothing,
so it's safe in server-rendered code.

| Option | |
|---|---|
| `tagId` | Required. Your website tag's id or your product tag's id. |
| `debug` | `true` prints the SDK's own warnings in the browser console. |
| `scriptUrl` | Load your Knock tag from a different URL. |

## 3. Identify and track

```ts
knock.identify({ email: user.email, firstName: user.firstName });

knock.track('trial_started', { plan: 'pro' });
```

You don't need to wait for anything. Calls made before the SDK is ready are queued (up to 1,000)
and sent in order once it is.

## Next

- [`identify.md`](identify.md): what `identify()` does on each tag
- [`events.md`](events.md): event names, properties, limits
- [`widget-and-modals.md`](widget-and-modals.md): open the scheduling modal
- [`frameworks/`](frameworks/): React, Vue, Angular
