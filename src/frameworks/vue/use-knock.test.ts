import { createApp, defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

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

import { useKnock } from './use-knock.js';

describe('useKnock', () => {
  it('falls back to the global singleton without the plugin installed', () => {
    let received: unknown;
    const Probe = defineComponent({
      setup() {
        received = useKnock();
        return () => h('div');
      },
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = createApp(Probe);
    app.mount(container);
    expect(received).toBe(knock);
    app.unmount();
    container.remove();
  });
});
