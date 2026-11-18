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

## Chat

The chat (`init({ chat })`) talks to the Knock chat API and shows images from Knock's hosts. Add
these sources to the directives above:

```
connect-src https://app.knock-ai.com;
img-src https://assets.start-chat.com https://avatars.slack-edge.com https://a.slack-edge.com https://secure.gravatar.com;
style-src https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
```

- `https://app.knock-ai.com` is the chat API. Without it in `connect-src`, the widget loads but the
  chat can't start.
- The `img-src` hosts serve your reps' photos and the files your reps send in the chat.
  `https://assets.start-chat.com` holds the photos and files uploaded to Knock. The other three
  serve the Slack profile photos of reps whose photo comes from Slack.
- In `img-src`, also add the hosts of any images your AI agent sends, such as images in your
  knowledge library.
- In `img-src`, also add the hosts of the chat's pictures, `agentImageUrl` and the skin's
  `assets.bubble`, `assets.wall` and `assets.header`, when they are not on your own site.
- A wall needs `data:` in `img-src` too. The chat draws three kinds of wall as `data:` images: the
  WhatsApp-style look's doodles, the Telegram-style look's pattern, and your own wall
  (`assets.wall`). Without `data:` the wall stays flat, in the look's plain background, and the chat
  still works. Your own wall also needs its host in `img-src` (the item above), and CORS on that host
  when it is not your site (see [Pictures](chat.md#pictures)):

  ```
  img-src 'self' data: https://cdn.example.com;
  ```
- The chat loads its skin's web fonts from Google Fonts, so it needs the `style-src` and `font-src`
  sources only when its skin loads web fonts. With `typography: { loadFonts: false }` in the skin,
  the chat loads no fonts, so you need neither source. The chat then uses the font faces your page
  serves, or the fallbacks in its font stack.
- The chat's code comes from your Knock tag's hosts, which are already in `script-src` above.
- When your Knock tag's config has no chat, the tag downloads one (see
  [Knock chat](chat.md#when-your-tags-config-has-no-chat)). Its files come from the tag's own host,
  so the CSP needs nothing more than the tag already needs, and the chat talks to the same
  `connect-src` host.
- The SDK's core loads no file of its own with `import()`, so there is nothing to allow for it.
