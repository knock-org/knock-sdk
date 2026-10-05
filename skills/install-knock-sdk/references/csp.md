# Content-Security-Policy

## What Knock needs

Add these sources to the site's policy, keeping everything already there:

```text
script-src   https://storage.googleapis.com/knock-tag-build/ https://js.knock-ai.com
connect-src  https://ca.knock-ai.com https://js.knock-ai.com
frame-src    https://login.start-chat.com https://start-chat.com
style-src    'unsafe-inline'
img-src      https://js.knock-ai.com
font-src     https://js.knock-ai.com https://fonts.cdnfonts.com
```

For the CDN install (HTML pages), also:

- `https://cdn.jsdelivr.net` in `script-src`.
- A way for the inline snippet, and any inline identify script you add, to run: the site's nonce
  on each (`<script nonce="...">`, the same way the site's other inline scripts get theirs), or
  their hashes, or `'unsafe-inline'` if the policy already allows it.

`img-src` also needs the hosts of the widget's logo and agent photos. You can't see those from the
code, so add a "Before you merge" item asking the user to add them.

## Where policies live

| Where | Look for |
|---|---|
| Next.js | `headers()` in `next.config.*`, or `middleware.ts` / `proxy.ts` building the header |
| Node servers | `helmet({ contentSecurityPolicy: ... })`, or a `Content-Security-Policy` header set by hand |
| HTML | `<meta http-equiv="Content-Security-Policy" content="...">` |
| Hosting config | `vercel.json`, `netlify.toml`, `_headers`, `firebase.json`, `staticwebapp.config.json` |
| Web servers | `nginx.conf`, `.htaccess`, Caddyfile |

Update every place the policy is defined (development and production, a
`Content-Security-Policy-Report-Only` copy, several header blocks).

## How to merge

1. **Add only what's missing.** Keep every source and directive that's there, in its order and
   format (one string, an array per directive, a joined list).
2. **Missing directive.** The browser falls back to `default-src` for each directive above. If
   there's a `default-src`, add the missing directive with `default-src`'s sources plus Knock's, so
   nothing else the site loads breaks. If there's no `default-src` either, that type isn't
   restricted: don't add the directive.
3. **Nonce-only `script-src`** (scripts allowed by `'nonce-...'` and no host list): add
   `'strict-dynamic'` so the script that the SDK adds to the page can load. Show it in the plan:
   it changes how that directive treats host lists.
4. **`style-src` with a nonce or a hash:** browsers ignore `'unsafe-inline'` there, so Knock's
   inline styles would be blocked. Don't weaken the policy yourself. Flag it in the report.
5. **A policy built in code** (a Next.js middleware, a server): edit the source list it builds, and
   keep its nonce logic as it is.

## In the browser

A missing source shows up in the Console as a Content-Security-Policy error naming the blocked URL
and directive.
