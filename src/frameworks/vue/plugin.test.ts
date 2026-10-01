import { createApp, defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { knock } = vi.hoisted(() => ({
  knock: {
    init: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
    modal: { open: vi.fn(), close: vi.fn() },
    scheduling: { load: vi.fn() },
    widget: { show: vi.fn(), hide: vi.fn(), open: vi.fn(), close: vi.fn() },
    on: vi.fn(),
    ready: false,
    version: '0.0.0-test',
  },
}));

vi.mock('../../core', () => ({ knock }));

import { KnockPlugin } from './plugin.js';
import { useKnock } from './use-knock.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function mountWithPlugin(component: ReturnType<typeof defineComponent>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const app = createApp(component);
  app.use(KnockPlugin, { tagId: 'tag_1' });
  app.mount(container);
  return { app, container };
}

describe('KnockPlugin', () => {
  it('initializes the runtime with the given options on install', () => {
    const App = defineComponent({ render: () => h('div') });
    const { app, container } = mountWithPlugin(App);
    expect(knock.init).toHaveBeenCalledWith({ tagId: 'tag_1' });
    app.unmount();
    container.remove();
  });

  it('provides the knock singleton to descendants', () => {
    let received: unknown;
    const Probe = defineComponent({
      setup() {
        received = useKnock();
        return () => h('div');
      },
    });
    const { app, container } = mountWithPlugin(Probe);
    expect(received).toBe(knock);
    app.unmount();
    container.remove();
  });
});
