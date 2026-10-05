# HTML pages (CDN, no build step)

Nothing to install. The snippet loads the SDK from jsDelivr, and the SDK then loads the Knock tag.

## Initialize: the shared `<head>`

Paste this once, near the top of the `<head>` every page shares, and replace only `YOUR_TAG_ID`
with the pasted id:

<!-- knockai-snippet:start -->
```html
<script>
(function(){'use strict';function w(i){return !!i&&Array.isArray(i.q)}function u(i){return !i||w(i)||i.__knockai===true}var f="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var d,k,l;if(typeof window=="undefined"||window.knockai)return;let r=u(window.knock),s=[],t={q:s,ready:false};for(let c of S){let[n,e]=c.split("."),o=(...p)=>{s.push([c,p]);};e?((d=t[n])!=null?d:t[n]={})[e]=o:t[n]=o;}t.on=(...c)=>{let n,e=["on",c,o=>n=o];return s.push(e),()=>n?n():void(e[0]="")},t.scheduling={load(...c){let n;s.push(["scheduling.load",c,o=>n=o]);let e=o=>()=>n?n[o]():s.push([()=>n[o](),[]]);return {open:e("open"),close:e("close"),get status(){return n?n.status:"loading"}}}},window.knockai=t,r?window.knock=t:console.warn("[knockai] window.knock is taken by this page \u2014 use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(l=(k=document.currentScript)==null?void 0:k.dataset.knockaiSrc)!=null?l:f,document.head.appendChild(a);})();
})();
knockai.init({ tagId: 'YOUR_TAG_ID' });
</script>
```
<!-- knockai-snippet:end -->

- Copy it exactly: it's the package's own snippet, the same one its README shows. Change only the
  id. It defines `knockai` right away, so the calls after it never fail, even while jsDelivr is
  slow or blocked, and it loads the rest without holding up the page.
- The id goes into the page itself: there's no env var here, and the id is public.
- Find the shared head: a layout or partial such as `_includes/head.html`,
  `layouts/partials/head.html` or `_layouts/default.html`; in a Shopify theme `layout/theme.liquid`,
  just before `</head>`; in a WordPress theme `header.php`. With no shared template, add it to each
  HTML page: list them in the plan, and ask first if there are many.
- Shopify: use `theme.liquid`, not a Custom Pixel. Pixels run in a sandbox, where the scheduling
  modal and the widget can't show.
- Not through Google Tag Manager: ad blockers often block it.
- Use `knockai.` for every call. `window.knock` is the same object, unless the page already uses
  that name.
- Check for an existing copy first (`knockai.init(`, `cdn.jsdelivr.net/npm/@knock-ai/sdk` or
  `cdn.jsdelivr.net/npm/knockai`), and don't add a second one. An existing
  `<script src="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/snippet.js">` followed by
  `knockai.init(...)` is the same SDK: keep it.
- A snippet that loads from `cdn.jsdelivr.net/npm/knockai` is the same SDK under its old name
  (knockai is the old name of @knock-ai/sdk; same API). Replace that snippet with the one above,
  keeping its tag id, and say so in the plan. The `knockai.` calls after it stay as they are. If
  the Content-Security-Policy allows the old snippet by its hash, update the hash ([csp.md](csp.md)).

## Identify

On a marketing site, in the form's submit handler. Put the script on the page that has the form,
after the form (or just before `</body>`), never in the shared `<head>`: the form doesn't exist yet
when the head runs. Use the form's real id and email field, and add to the existing handler if
there is one:

```html
<script>
  (function () {
    var form = document.getElementById('demo-form');
    if (!form) return;
    form.addEventListener('submit', function () {
      var email = form.elements.email.value;
      if (email) knockai.identify({ email: email });
    });
  })();
</script>
```

`if (!form) return` keeps it safe in a template that pages without the form share. Don't change
how the form submits. If submitting loads a new page, note in the report that `identify()` reaches
Knock only once the Knock tag has loaded, so a visitor who submits right after the page opens may
not be identified.

Rules: [identify.md](identify.md).

## Content-Security-Policy

The CDN install also needs `https://cdn.jsdelivr.net` and permission for the inline snippet. See
[csp.md](csp.md).

## Check it in the browser

Open the page through the site's local server or its deployed URL. In the Console, `knockai.ready`
is `true` once the Knock tag has loaded. If it stays `false`, check the Network tab: a 403, or
`(blocked:orb)` in Chrome, on the Knock tag's script
(`.../knock-tag-build/prod/<tag-id>/latest/index.js`) means the tag id is wrong.

## Book a demo

See [demo-button.md](demo-button.md).
