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

import { KnockButton } from './button.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function mount(component: ReturnType<typeof defineComponent>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const app = createApp(component);
  app.mount(container);
  return { app, container };
}

describe('KnockButton', () => {
  it('loads the scheduling modal on hover and focus', () => {
    const App = defineComponent({ render: () => h(KnockButton, { magicLinkId: 'ml_1' }, () => 'Book') });
    const { app, container } = mount(App);
    const button = container.querySelector('button');
    button?.dispatchEvent(new Event('pointerenter'));
    button?.dispatchEvent(new FocusEvent('focus'));
    expect(knock.scheduling.load).toHaveBeenCalledTimes(2);
    expect(knock.scheduling.load).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: undefined });
    app.unmount();
    container.remove();
  });

  it('opens the modal on click', () => {
    const App = defineComponent({
      render: () => h(KnockButton, { magicLinkId: 'ml_1' }, () => 'Book a demo'),
    });
    const { app, container } = mount(App);
    const button = container.querySelector('button');
    expect(button?.textContent).toBe('Book a demo');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(knock.modal.open).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: undefined });
    app.unmount();
    container.remove();
  });

  it('forwards email, a11y attrs, and the click emit', () => {
    const onClick = vi.fn();
    const App = defineComponent({
      render: () =>
        h(
          KnockButton,
          { magicLinkId: 'ml_1', email: 'a@b.com', 'aria-label': 'Open scheduler', onClick },
          () => 'Book',
        ),
    });
    const { app, container } = mount(App);
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Open scheduler');
    expect(button?.getAttribute('type')).toBe('button');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(knock.modal.open).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: 'a@b.com' });
    app.unmount();
    container.remove();
  });
});
