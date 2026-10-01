import { describe, expect, it, vi } from 'vitest';
import { applyCommand, createDeferredSchedulingHandle } from './bridge.js';
import type { KnockRuntime, KnockSchedulingHandle } from './types.js';

function createRuntime(overrides: Partial<KnockRuntime> = {}): KnockRuntime {
  return {
    identify: vi.fn(),
    scheduling: { load: vi.fn(() => fakeHandle()) },
    ...overrides,
  };
}

function fakeHandle(): KnockSchedulingHandle {
  return { open: vi.fn(), close: vi.fn(), status: 'slots_found' };
}

describe('applyCommand', () => {
  it('identify calls runtime.identify with traits and options', () => {
    const runtime = createRuntime();
    applyCommand(runtime, { path: 'identify', args: [{ email: 'a@b.com' }, { token: 't' }] }, false);
    expect(runtime.identify).toHaveBeenCalledWith({ email: 'a@b.com' }, { token: 't' });
  });

  it('track calls runtime.track when present', () => {
    const track = vi.fn();
    const runtime = createRuntime({ track });
    applyCommand(runtime, { path: 'track', args: ['clicked', { x: 1 }] }, false);
    expect(track).toHaveBeenCalledWith('clicked', { x: 1 });
  });

  it('track warns in debug mode when the runtime has no track method', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyCommand(createRuntime(), { path: 'track', args: ['clicked'] }, true);
    expect(warn).toHaveBeenCalledWith('[knockai]', expect.stringContaining('track'));
    warn.mockRestore();
  });

  it('track stays silent when debug is off and the method is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyCommand(createRuntime(), { path: 'track', args: ['clicked'] }, false);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('modal.open calls runtime.modal.open when the runtime has a modal', () => {
    const open = vi.fn();
    const runtime = createRuntime({ modal: { open, close: vi.fn() } });
    applyCommand(runtime, { path: 'modal.open', args: [{ magicLinkId: 'm1' }] }, false);
    expect(open).toHaveBeenCalledWith({ magicLinkId: 'm1' });
  });

  it('modal.open falls back to scheduling.load(...).open() when there is no modal', () => {
    const handleOpen = vi.fn();
    const load = vi.fn(() => ({ open: handleOpen, close: vi.fn(), status: 'slots_found' as const }));
    const runtime = createRuntime({ scheduling: { load } });
    applyCommand(runtime, { path: 'modal.open', args: [{ magicLinkId: 'm1' }] }, false);
    expect(load).toHaveBeenCalledWith({ magicLinkId: 'm1' });
    expect(handleOpen).toHaveBeenCalled();
  });

  it('modal.close calls runtime.modal.close when present', () => {
    const close = vi.fn();
    const runtime = createRuntime({ modal: { open: vi.fn(), close } });
    applyCommand(runtime, { path: 'modal.close', args: [] }, false);
    expect(close).toHaveBeenCalled();
  });

  it('scheduling.load attaches the real handle to the deferred handle', () => {
    const real = fakeHandle();
    const load = vi.fn(() => real);
    const runtime = createRuntime({ scheduling: { load } });
    const deferred = createDeferredSchedulingHandle();
    const attach = vi.spyOn(deferred, 'attach');

    applyCommand(runtime, { path: 'scheduling.load', args: [{ magicLinkId: 'm1' }], handle: deferred }, false);

    expect(load).toHaveBeenCalledWith({ magicLinkId: 'm1' });
    expect(attach).toHaveBeenCalledWith(real);
  });

  it('widget.show calls runtime.widget.show when present', () => {
    const show = vi.fn();
    const runtime = createRuntime({ widget: { show, hide: vi.fn(), open: vi.fn(), close: vi.fn() } });
    applyCommand(runtime, { path: 'widget.show', args: [] }, false);
    expect(show).toHaveBeenCalled();
  });

  it('widget.hide calls runtime.widget.hide when present', () => {
    const hide = vi.fn();
    const runtime = createRuntime({ widget: { show: vi.fn(), hide, open: vi.fn(), close: vi.fn() } });
    applyCommand(runtime, { path: 'widget.hide', args: [] }, false);
    expect(hide).toHaveBeenCalled();
  });

  it('widget.open calls runtime.widget.open when present', () => {
    const open = vi.fn();
    const runtime = createRuntime({ widget: { show: vi.fn(), hide: vi.fn(), open, close: vi.fn() } });
    applyCommand(runtime, { path: 'widget.open', args: [] }, false);
    expect(open).toHaveBeenCalled();
  });

  it('widget.close calls runtime.widget.close when present', () => {
    const close = vi.fn();
    const runtime = createRuntime({ widget: { show: vi.fn(), hide: vi.fn(), open: vi.fn(), close } });
    applyCommand(runtime, { path: 'widget.close', args: [] }, false);
    expect(close).toHaveBeenCalled();
  });

  it('widget.show warns in debug mode when the runtime has no widget', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyCommand(createRuntime(), { path: 'widget.show', args: [] }, true);
    expect(warn).toHaveBeenCalledWith('[knockai]', expect.stringContaining('widget.show'));
    warn.mockRestore();
  });
});

describe('createDeferredSchedulingHandle', () => {
  it('reports status "loading" until attached', () => {
    const handle = createDeferredSchedulingHandle();
    expect(handle.status).toBe('loading');
  });

  it('reflects the real handle once attached', () => {
    const handle = createDeferredSchedulingHandle();
    handle.attach({ open: vi.fn(), close: vi.fn(), status: 'slots_found' });
    expect(handle.status).toBe('slots_found');
  });

  it('buffers open()/close() calls made before attach and replays them on attach', () => {
    const handle = createDeferredSchedulingHandle();
    handle.open();
    const real = { open: vi.fn(), close: vi.fn(), status: 'slots_found' as const };
    handle.attach(real);
    expect(real.open).toHaveBeenCalledTimes(1);
  });

  it('forwards calls made after attach directly to the real handle', () => {
    const handle = createDeferredSchedulingHandle();
    const real = { open: vi.fn(), close: vi.fn(), status: 'slots_found' as const };
    handle.attach(real);
    handle.open();
    handle.close();
    expect(real.open).toHaveBeenCalledTimes(1);
    expect(real.close).toHaveBeenCalledTimes(1);
  });
});
