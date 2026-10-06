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
(function(){'use strict';function w(c){return !!c&&Array.isArray(c.q)}function l(c){return !c||w(c)||c.__knockai===true}var f="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var k,d,u;if(typeof window=="undefined"||window.knockai)return;let r=l(window.knock),s=[],o={q:s,ready:false};for(let e of S){let[n,i]=e.split("."),t=(...p)=>{s.push([e,p]);};i?((k=o[n])!=null?k:o[n]={})[i]=t:o[n]=t;}o.on=(...e)=>{let n,i=["on",e,t=>n=t];return s.push(i),()=>n?n():void(i[0]="")},o.wrapLink=e=>e,o.scheduling={load(...e){let n;s.push(["scheduling.load",e,t=>n=t]);let i=t=>()=>n?n[t]():s.push([()=>n[t](),[]]);return {open:i("open"),close:i("close"),get status(){return n?n.status:"loading"}}}},window.knockai=o,r?window.knock=o:console.warn("[knockai] window.knock is taken by this page \u2014 use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(u=(d=document.currentScript)==null?void 0:d.dataset.knockaiSrc)!=null?u:f,document.head.appendChild(a);})();
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
