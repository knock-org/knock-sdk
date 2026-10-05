# Platform install guides

On site builders, use the [CDN snippet](quickstart.md#cdn-no-build-step). Paste it once into the
site-wide `<head>` code. It works the same as the npm package.

## Shopify

Paste the snippet into your theme's `theme.liquid`, just before `</head>`. Don't use a Custom
Pixel: Shopify runs pixels in a sandbox, so the scheduling modal and the widget can't show.

## Wix

**Settings → Custom Code → Add Custom Code.** Paste the snippet, choose **All pages**, and place it in
the **Head**.

## Webflow

**Site settings → Custom code → Head code.** Paste the snippet, then publish. Custom code only runs on
the published site.

## Framer

**Site Settings → General → Custom Code**, at the start of `<head>`.

## WordPress

Add the snippet to every page's `<head>` with a header-scripts plugin, or in your theme's
`header.php`.

## Google Tag Manager

Not recommended. Ad blockers often block scripts loaded through Google Tag Manager. Paste the snippet
straight into your site's `<head>` instead.

## AI app builders

Most AI app builders (Base44, Lovable, Bolt, v0 and similar) can add the snippet if you paste this
into their chat:

```
Add the Knock AI SDK (knockai) to this app. Paste the CDN snippet from
https://github.com/knock-org/knock-sdk (README.md, "CDN (no build step)" section) into the
document <head>, once. Once the signed-in user is known, call:

  knock.identify({ email: user.email, firstName: user.firstName })

Replace YOUR_TAG_ID in the snippet with the tag id I give you. Don't change the snippet's code.
```

For AI coding agents working in your repo (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI,
Windsurf and others), run `npx skills add knock-org/knock-sdk`. It installs the install skill for
the agents it detects; add `-a <agent>` to choose. Then ask your agent to install the Knock SDK. In
Claude Code you can type `/install-knock-sdk`, and in Codex `$install-knock-sdk`.

If your agent doesn't support skills, paste this into it:

```text
Install the Knock SDK by following https://raw.githubusercontent.com/knock-org/knock-sdk/main/skills/install-knock-sdk/SKILL.md
```

Or point it at [`llms.txt`](../llms.txt).
