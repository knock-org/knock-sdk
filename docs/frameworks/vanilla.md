# Plain JavaScript

No framework needed. `knock` works from any stack.

## npm

```bash
npm install @knock-ai/sdk
```

```ts
import { knock } from '@knock-ai/sdk';

knock.init({ tagId: 'YOUR_TAG_ID' });
knock.identify({ email: user.email });
```

## CDN

No build step: paste the snippet from the [Quickstart](../quickstart.md#cdn-no-build-step), or see
the full page in [`examples/vanilla/index.html`](../../examples/vanilla/index.html).

## Opening the modal

```ts
document.querySelector('#book-demo').addEventListener('click', () => {
  knock.modal.open({ magicLinkId: 'a1b2c3' }); // or knock.modal.open() for your default Knock modal
});
```

On your website tag, a plain `<a href="#_km">` link also opens your Knock scheduling modal. See
[Scheduling modal and widget](../widget-and-modals.md).

## Server rendering

On the server every call (`init`, `identify`, `track`, `modal.open` and the rest) does nothing and
never touches `window` or `document`. So you can import and call the npm package from
server-rendered code without wrapping calls in `typeof window !== 'undefined'`. Call `init()` in the
browser as usual. `knock.ready` stays `false` on the server.
