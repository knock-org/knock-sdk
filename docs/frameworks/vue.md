# Vue

```bash
npm install @knock-ai/sdk
```

```ts
// main.ts
import { createApp } from 'vue';
import { KnockPlugin } from '@knock-ai/sdk/vue';
import App from './App.vue';

createApp(App)
  .use(KnockPlugin, { tagId: 'YOUR_TAG_ID' })
  .mount('#app');
```

`KnockPlugin` calls `knock.init()` once with the options you give it (`tagId`, `debug`,
`scriptUrl`; see [Quickstart](../quickstart.md#2-pick-your-tag-id)).

## `useKnock()`

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useKnock } from '@knock-ai/sdk/vue';

const knock = useKnock();
const props = defineProps<{ user: { email: string; firstName: string } }>();

onMounted(() => {
  knock.identify({ email: props.user.email, firstName: props.user.firstName });
});
</script>

<template>
  <button @click="knock.track('upgrade_clicked')">Upgrade</button>
</template>
```

`useKnock()` returns the same `knock` you'd get from `import { knock } from '@knock-ai/sdk'`. You don't
need to wait for the SDK to be ready. Calls made before then are queued.

## `KnockButton`

```vue
<script setup lang="ts">
import { KnockButton } from '@knock-ai/sdk/vue';
</script>

<template>
  <KnockButton magic-link-id="a1b2c3" :email="user.email">Book a demo</KnockButton>
</template>
```

Renders a `<button>` that opens the scheduling modal on click. With a `magic-link-id`, it starts
loading the modal on hover or focus. Leave it out to open your default Knock modal. See
[Scheduling modal and widget](../widget-and-modals.md).

## Nuxt and server rendering

On the server every SDK call does nothing, so `KnockPlugin` and `useKnock()` are safe during server
rendering.
