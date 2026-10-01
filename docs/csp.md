# Content-Security-Policy

If your site sends a Content-Security-Policy, add these sources:

```
script-src 'self' https://storage.googleapis.com/knock-tag-build/ https://js.knock-ai.com https://cdn.jsdelivr.net;
connect-src 'self' https://ca.knock-ai.com https://js.knock-ai.com;
frame-src https://login.start-chat.com https://start-chat.com;
style-src 'self' 'unsafe-inline';
img-src 'self' https://js.knock-ai.com;
font-src 'self' https://js.knock-ai.com https://fonts.cdnfonts.com;
```

- In `img-src`, also add the hosts of your widget's logo and agent photos.
- `https://cdn.jsdelivr.net` is only needed for the CDN install.
- The CDN install uses an inline `<script>`. Allow it in `script-src` with a nonce
  (`<script nonce="...">`) or its hash, or with `'unsafe-inline'`.
- If your `script-src` allows scripts by nonce only, add `'strict-dynamic'` so the scripts the SDK
  adds to the page can load.
