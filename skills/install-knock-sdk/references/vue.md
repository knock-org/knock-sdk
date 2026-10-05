# Vue 3 (and Nuxt)

Import from `knockai/vue`: `KnockPlugin`, `useKnock`, `KnockButton`, `KNOCK`.

## Initialize: Vue with Vite

In `src/main.ts` (or `.js`):

```ts
import { KnockPlugin } from 'knockai/vue';

const knockTagId = import.meta.env.VITE_KNOCK_PRODUCT_TAG_ID;
const app = createApp(App);
if (knockTagId) app.use(KnockPlugin, { tagId: knockTagId });
else if (import.meta.env.DEV) console.warn('VITE_KNOCK_PRODUCT_TAG_ID is not set, so Knock is off');
app.mount('#app');
```

- On a marketing site the variable is `VITE_KNOCK_WEBSITE_TAG_ID`: change the name everywhere it
  appears (the read, the warning and the type declaration below).
- If `main.ts` chains `createApp(App).use(router).mount('#app')`, split out
  `const app = createApp(App)` only as far as the guard needs, and keep the other `.use()` calls in
  their order.
- `KnockPlugin` calls `init()` once, when the app installs it.
- Vite only exposes variables that start with its prefix (`VITE_`, or the `envPrefix` in
  `vite.config`). If `src/env.d.ts` or `src/vite-env.d.ts` declares `interface ImportMetaEnv`, add
  `readonly VITE_KNOCK_PRODUCT_TAG_ID?: string` to it. If neither file does, don't create one.

## Initialize: Nuxt

A client-only plugin, in the app's `plugins/` directory (`app/plugins/` in Nuxt 4):

```ts
// plugins/knock.client.ts
import { KnockPlugin } from 'knockai/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const tagId = useRuntimeConfig().public.knockProductTagId;
  if (tagId) nuxtApp.vueApp.use(KnockPlugin, { tagId });
});
```

And in the existing `nuxt.config.ts`, declare the key:

```ts
runtimeConfig: { public: { knockProductTagId: '' } },
```

Nuxt fills it from `NUXT_PUBLIC_KNOCK_PRODUCT_TAG_ID`: put that in `.env` for development, and set
it wherever the app is built and run in production. On a marketing site use `knockWebsiteTagId` and
`NUXT_PUBLIC_KNOCK_WEBSITE_TAG_ID`. During server rendering, `useKnock()` returns the shared SDK,
whose calls do nothing on the server.

## Identify

Use the Vue pattern in [identify.md](identify.md): a `watch` on the signed-in user's email, with
`immediate: true`. Vue sends every `identify()` call, so don't call it from a template or a
computed value.

## Book a demo

See [demo-button.md](demo-button.md).
