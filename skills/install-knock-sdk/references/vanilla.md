# Plain JavaScript with a bundler

Use the core package: `import { knock } from '@knock-ai/sdk'` (the default export is the same object;
CommonJS: `const { knock } = require('@knock-ai/sdk')`).

## Initialize: the entry module

At the top of the module every page loads:

```ts
import { knock } from '@knock-ai/sdk';

const knockTagId = import.meta.env.VITE_KNOCK_WEBSITE_TAG_ID;
if (knockTagId) knock.init({ tagId: knockTagId });
else if (import.meta.env.DEV) console.warn('VITE_KNOCK_WEBSITE_TAG_ID is not set, so Knock is off');
```

- In a logged-in app the variable is `VITE_KNOCK_PRODUCT_TAG_ID`.
- That's Vite. With webpack, esbuild, Rollup or Parcel, read the id the way the project already
  passes public values to the browser. If it has no such setup, put the id in a constant next to
  `init()` rather than adding env tooling. It's public.

## Frameworks without their own binding

Same core API, initialized once in the layout every page uses.

**Astro**, in the base layout (for example `src/layouts/Layout.astro`). Astro bundles the script
and runs it once per page:

```astro
<script>
  import { knock } from '@knock-ai/sdk';

  const knockTagId = import.meta.env.PUBLIC_KNOCK_WEBSITE_TAG_ID;
  if (knockTagId) knock.init({ tagId: knockTagId });
</script>
```

**SvelteKit**, in `src/routes/+layout.svelte`, added to its existing `<script>` block:

```svelte
<script>
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import { knock } from '@knock-ai/sdk';

  onMount(() => {
    if (env.PUBLIC_KNOCK_WEBSITE_TAG_ID) knock.init({ tagId: env.PUBLIC_KNOCK_WEBSITE_TAG_ID });
  });
</script>
```

**Others** (Solid, Svelte without SvelteKit, Preact, Lit, ...): the app's entry module, as above.

## Identify

Call `knock.identify({ email })` in the sign-in callback, or in the form's submit handler. Every
call is sent, so call it on those events, not on every render. Rules: [identify.md](identify.md).

## Book a demo

See [demo-button.md](demo-button.md).
