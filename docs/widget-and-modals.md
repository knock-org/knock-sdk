# Scheduling modal and widget

## Open the modal

```ts
knock.modal.open({ magicLinkId: 'a1b2c3', email: user.email });

knock.modal.open(); // your default Knock modal

knock.modal.close();
```

- `magicLinkId` opens the scheduling modal for that magic link. Leave it out to open your default
  Knock modal.
- `email` pre-fills the modal so it starts finding times right away. It's only used together with
  `magicLinkId`. If you leave it out, the email from your last `identify()` call is used.

## Load first, open later

`scheduling.load()` starts loading the modal without showing it, so times are ready when you open
it. Use it when you want to open the modal after your own step, like a form submit.

```ts
const scheduling = knock.scheduling.load({
  magicLinkId: 'a1b2c3',
  email: user.email, // optional
  onStatusChange: ({ status, meeting }) => {
    if (status === 'no_slots_found') showFallback();
    if (status === 'booked') trackConversion(meeting!.startDateTime);
  },
});

// later, for example after your form submits:
scheduling.open();
```

It returns `{ open(), close(), status }`. You can call it before the SDK is ready: `status` is
`'loading'` until then, and `open()` waits for it.

| `status` | Meaning |
|---|---|
| `loading` | Still loading. |
| `email_submitted` | An email was submitted. |
| `slots_found` | Times are available. `slots` has `count` and the `first` time. |
| `no_slots_found` | No times to offer. `reason` is `disqualified` or `no_slots`. |
| `booked` | A meeting was booked. `meeting` has `startDateTime` and `endDateTime`. |
| `pending_confirmation` | The person asked for a time that isn't confirmed yet. Not a booking. |
| `error` | Something went wrong. `message` says what. |
| `closed` | The modal was closed. |

## Buttons

React and Vue have a button that opens the modal on click; in Angular, call `knock.modal.open()`:

- React and Vue: `KnockButton` ([React](frameworks/react.md), [Vue](frameworks/vue.md))
- Angular: call `knock.modal.open()` from your own button ([Angular](frameworks/angular.md))

With a `magicLinkId`, the button also starts loading the modal when the pointer moves over it or it
gets focus, so times can be ready by the time it's clicked. Without one, it opens your default
Knock modal.

## Links on your website

Your website tag also opens the modal from plain links: any link to `#_km` opens your Knock
scheduling modal, and links to your Knock modal URLs (`https://login.start-chat.com/modal/...`)
open in the modal instead of leaving the page. Your product tag doesn't do this. In your app, use a
button or `knock.modal.open()`.

## The widget

If you show Knock's floating widget, you can control it:

```ts
knock.widget.hide(); // for example, on a page where it covers your own UI
knock.widget.show();
knock.widget.open();
knock.widget.close();
```

## Listening for events

```ts
const off = knock.on('modal:open', ({ magicLinkId }) => {
  console.log('Knock modal opened', magicLinkId); // null for your default modal
});

off(); // stop listening
```

| Event | Payload |
|---|---|
| `ready` | none |
| `modal:open`, `modal:close` | `{ magicLinkId }` (`null` for your default modal) |
| `widget:open`, `widget:close` | none |
| `error` | `{ message, cause? }` |

You can call `on()` before or after the SDK is ready. It returns a function that stops listening.

`ready` fires once. A `ready` handler you add after that still runs, once.
