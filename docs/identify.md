# Identify

```ts
knock.identify(traits)
```

Call it as soon as you know who the person is: right after sign-in in your app (or when the app
loads, if they're already signed in), or when a visitor gives you their email on your site. Calling
it more than once is safe.

## What it does

| Tag | `identify()` |
|---|---|
| Website tag | Captures a lead. Knock may research the lead's company to help your sales team. |
| Product tag | Tells Knock which signed-in customer is using your app. Knock doesn't start its website lead research for them. |

The call is the same on both. `knock.surface` tells you which tag loaded, once the SDK is ready.

## Traits

```ts
knock.identify({
  email: 'jane@acme.com', // required
  firstName: 'Jane',
  lastName: 'Doe',
  company: 'Acme',
  plan: 'enterprise',
});
```

- `email` is required. It's what Knock uses to recognize the person.
- `firstName`, `lastName` and `company` (the company's name) are optional.
- You can add other fields. They're sent with the call. Values can be strings, numbers, booleans,
  dates, lists of strings or `null`.
- Don't give your own fields names your website tag already sends. These include `userId`,
  `sessionId`, `vendorId`, `tagId`, `tagVersion`, `clientId`, `version`, `uidSource`, `timestamp`,
  `pageVisit`, `pageNumber`, `tabPageNumber`, `revisionNumber`, `referrerUrl`, `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `hubspotutk`, `gclid`, `__khsc` and
  `elementCopy`.

Knock never treats an email passed to `identify()` as proof of who someone is.

## In a framework

- React: `useKnockIdentify(traits)`, or the `user` prop on `KnockProvider`. See
  [React](frameworks/react.md).
- Vue and Angular: call `identify()` from `useKnock()` or `inject(KNOCK)`. See [Vue](frameworks/vue.md)
  and [Angular](frameworks/angular.md).
