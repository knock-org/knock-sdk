# FAQ

**Is `knockai` the same as the Knock tag on our website?**
No. `knockai` is the SDK. It loads one of your two Knock tags (your website tag or your product tag)
and gives your code one typed API for it. See [One SDK, two tags](../README.md#one-sdk-two-tags).

**Do I need both tags?**
Only if you use Knock on both your marketing site and your logged-in app. Use your website tag's
id on the site and your product tag's id in the app.

**How big is it?**
The core is ≤ 1.7 KB gzip, with zero dependencies. Your Knock tag loads separately, once `init()`
runs.

**Does it work with Next.js, Nuxt and other server rendering?**
Yes. On the server every call does nothing. See [server rendering](frameworks/vanilla.md#server-rendering)
and [Next.js](frameworks/react.md#nextjs).

**What if I call `identify()`, `track()` or `modal.open()` before the SDK is ready?**
The call is queued (up to 1,000 calls) and sent in order once it's ready. You don't need to check
`knock.ready` first.

**What if I call `init()` twice?**
The second call is ignored.

**Does it capture page views or clicks on its own?**
On your product tag, not by default: only your `track()` and `identify()` calls are sent, plus
clicks on Knock's widget if you show it. Your website tag captures what it's set up to capture. See
[Track events](events.md).

**Does `on('ready', ...)` work after the SDK is already ready?**
Yes. `ready` fires once, and a handler you add after that still runs, once. See
[Listening for events](widget-and-modals.md#listening-for-events).

**How do I test components that call Knock?**
Use `knockai/testing`. See [Testing](frameworks/react.md#testing).

**I'm using an AI app builder (Base44, Lovable, Bolt, …). Is there a prompt I can give it?**
Yes, see [AI app builders](platforms.md#ai-app-builders). For AI coding agents in your repo, point
them at [`llms.txt`](../llms.txt).
