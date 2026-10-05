# "Book a demo" button

The button opens the Knock scheduling modal: for a magic link, that link's modal; without one, the
workspace's default Knock modal. Use only a magic link id the user pasted.

Wire the button the user picked, keeping its text, classes and layout. Add a new one only where
they asked. If the existing element is a link (`<a href>`), turning it into a button changes where
it goes: ask first.

A new button gets the classes of the app's own buttons nearby, or none: the examples below have
none. Check that those styles apply to a `<button>`: CSS such as `a.secondary` or `.ctas a` only
styles links. While Knock is off (no tag id set), the button does nothing: say so in the report.

After `identify()`, the modal for a magic link starts with that email already filled in, so you
don't need to pass `email`.

## React

```tsx
import { KnockButton } from '@knock-ai/sdk/react';

<KnockButton magicLinkId="the-pasted-magic-link-id">Book a demo</KnockButton>
```

- It renders a `<button type="button">` (pass `type` to change that) and passes any other
  `<button>` props through.
- Its `onClick` runs first, then the modal opens.
- With a `magicLinkId`, hovering or focusing it starts loading the modal, so it opens with times
  already there.
- Leave out `magicLinkId` for the default modal.

## Vue

```vue
<script setup lang="ts">
import { KnockButton } from '@knock-ai/sdk/vue';
</script>

<template>
  <KnockButton magic-link-id="the-pasted-magic-link-id">Book a demo</KnockButton>
</template>
```

Attributes pass through to the `<button>`. It emits `click`, then opens the modal. Hover and focus
load it early when there's a magic link id. Leave out `magic-link-id` for the default modal.

## Angular

On the existing button, with `readonly knock = inject(KNOCK);` in its component:

```html
<button
  type="button"
  (pointerenter)="knock.scheduling.load({ magicLinkId: 'the-pasted-magic-link-id' })"
  (click)="knock.modal.open({ magicLinkId: 'the-pasted-magic-link-id' })"
>
  Book a demo
</button>
```

For the default modal: `(click)="knock.modal.open()"`, and no `pointerenter`.

## Plain JavaScript and HTML pages

```js
document.getElementById('book-demo').addEventListener('click', function () {
  knockai.modal.open({ magicLinkId: 'the-pasted-magic-link-id' });
});
```

`knockai.modal.open()` with no arguments opens the default modal. With the npm package, use
`knock.modal.open(...)` from `import { knock } from '@knock-ai/sdk'`.

## Links on a marketing site

With the website tag, a plain link to `#_km` opens the default Knock modal, with no code:
`<a href="#_km">Book a demo</a>`. The product tag doesn't do this.
