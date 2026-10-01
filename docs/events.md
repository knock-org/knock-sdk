# Track events

```ts
knock.track(name, properties?)
```

`track()` records that something happened. It works on your website tag and your product tag. Call
it next to the code that already handles the action.

```ts
knock.track('trial_started', { plan: 'pro' });
knock.track('invoice_paid', { amount: 4900, currency: 'usd' });
knock.track('feature_used'); // properties are optional
```

## What's captured without `track()`

- **Website tag:** what your website tag is set up to capture (page views, clicks, forms).
- **Product tag:** nothing by default. Only your `track()` and `identify()` calls are sent, plus
  clicks on Knock's widget if you show it.

## Names

Knock lowercases event names and turns spaces, dashes and other symbols into `_`. So
`Trial Started`, `trial-started` and `trial_started` are the same event: `trial_started`.

- Names are cut to 64 characters.
- A name has to start with a letter. One that doesn't (like `2fa_enabled`) is dropped.

Tip: write names as `object_action` in the past tense (`trial_started`, `invoice_paid`,
`demo_booked`), and put details in properties instead of the name (`invoice_paid` with
`{ currency: 'usd' }`, not `invoice_paid_usd`).

## Properties

Values can be strings, numbers, booleans, dates, lists of strings or `null`. Dates are sent as ISO
strings.

Keep them small:

| Limit | |
|---|---|
| Total size | about 8 KB |
| Keys | 100 |
| List length | 50 items |
| String length | 1 KB |

An event that breaks a rule is dropped without an error.
