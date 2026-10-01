import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KnockSchedulingHandle, KnockSchedulingLoadOptions } from './types.js';

type Stub = {
  q: unknown[];
  init: (o: object) => void;
  identify: (t: object) => void;
  track: (n: string) => void;
  modal: { open: (o: object) => void };
  on: (event: string, handler: () => void) => () => void;
  scheduling: { load: (o: KnockSchedulingLoadOptions) => KnockSchedulingHandle };
};

function fakeHandle(log: string[] = []) {
  return {
    open: vi.fn(() => void log.push('open')),
    close: vi.fn(() => void log.push('close')),
    status: 'slots_found' as const,
  };
}

function knockReady(runtime: NonNullable<Window['Knock']>): void {
  window.Knock = runtime;
  window.dispatchEvent(new Event('knock:ready'));
}

afterEach(() => {
  delete window.knock;
  delete window.knockai;
  delete window.Knock;
  delete window.__KNOCK_SDK__;
  document.head.innerHTML = '';
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('CDN stub + IIFE facade', () => {
  it('installs window.knock (and the knockai alias), queues calls and injects the facade', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    expect(window.knockai).toBe(stub);
    stub.identify({ email: 'dana@acme.com' });
    stub.modal.open({ magicLinkId: 'm1' });
    expect(stub.q).toEqual([
      ['identify', [{ email: 'dana@acme.com' }]],
      ['modal.open', [{ magicLinkId: 'm1' }]],
    ]);
    expect(document.head.querySelector('script')?.src).toContain('knockai.iife.js');
  });

  it('facade replays the stub queue in order and replaces both globals', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    stub.init({ tagId: 'tag_1', environment: 'production' });
    stub.track('before_facade');

    const { default: knock } = await import('./iife.js');
    expect(window.knock).toBe(knock);
    expect(window.knockai).toBe(knock);
    expect(window.__KNOCK_SDK__).toMatchObject({ tagId: 'tag_1' });

    const track = vi.fn();
    window.Knock = { identify: vi.fn(), track, scheduling: { load: vi.fn() } };
    window.dispatchEvent(new Event('knock:ready'));
    expect(track).toHaveBeenCalledWith('before_facade', undefined);

    knock.track('after_ready');
    expect(track).toHaveBeenLastCalledWith('after_ready', undefined);
  });

  it('on() unsubscribed before the facade loads never fires', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    const kept = vi.fn();
    const dropped = vi.fn();
    stub.on('ready', kept);
    stub.on('ready', dropped)();
    stub.init({ tagId: 'tag_1' });

    await import('./iife.js');
    knockReady({ identify: vi.fn(), scheduling: { load: vi.fn() } });

    expect(kept).toHaveBeenCalledOnce();
    expect(dropped).not.toHaveBeenCalled();
  });

  it('on() unsubscribed after the facade loads removes the real subscription', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    const kept = vi.fn();
    const dropped = vi.fn();
    stub.on('ready', kept);
    const off = stub.on('ready', dropped);
    stub.init({ tagId: 'tag_1' });

    await import('./iife.js');
    off();
    knockReady({ identify: vi.fn(), scheduling: { load: vi.fn() } });

    expect(kept).toHaveBeenCalledOnce();
    expect(dropped).not.toHaveBeenCalled();
  });

  it('replays a scheduling.load handle against the real one, in call order', async () => {
    const log: string[] = [];
    const real = fakeHandle(log);
    const load = vi.fn(() => (log.push('load'), real));
    window.Knock = { identify: vi.fn(), track: (name: string) => void log.push(name), scheduling: { load } };

    await import('./snippet.js');
    const stub = window.knock as Stub;
    const onStatusChange = vi.fn();
    stub.init({ tagId: 'tag_1' });
    stub.track('a');
    const handle = stub.scheduling.load({ magicLinkId: 'm1', onStatusChange });
    stub.track('b');
    handle.open();
    stub.track('c');
    expect(handle.status).toBe('loading');
    expect(log).toEqual([]);

    await import('./iife.js');

    expect(log).toEqual(['a', 'load', 'b', 'open', 'c']);
    expect(load).toHaveBeenCalledWith({ magicLinkId: 'm1', onStatusChange });
    expect(real.open).toHaveBeenCalledOnce();
    expect(handle.status).toBe('slots_found');

    handle.close();
    expect(real.close).toHaveBeenCalledOnce();
  });

  it('carries a handle opened before the facade loads through to a runtime that loads later', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    stub.init({ tagId: 'tag_1' });
    const handle = stub.scheduling.load({ magicLinkId: 'm1' });
    handle.open();

    await import('./iife.js');
    expect(handle.status).toBe('loading');

    const real = fakeHandle();
    const load = vi.fn(() => real);
    knockReady({ identify: vi.fn(), scheduling: { load } });

    expect(load).toHaveBeenCalledOnce();
    expect(real.open).toHaveBeenCalledOnce();
    expect(handle.status).toBe('slots_found');
  });

  it('fires a ready handler once when the Knock tag was already on the page', async () => {
    window.Knock = { identify: vi.fn(), scheduling: { load: vi.fn() } };
    await import('./snippet.js');
    const stub = window.knock as Stub;
    const onReady = vi.fn();
    stub.init({ tagId: 'tag_1' });
    stub.on('ready', onReady);

    await import('./iife.js');
    await Promise.resolve();

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('keeps replaying the stub queue after a call that throws', async () => {
    const identify = vi.fn();
    window.Knock = {
      identify,
      track: () => {
        throw new Error('boom');
      },
      scheduling: { load: vi.fn() },
    };
    await import('./snippet.js');
    const stub = window.knock as Stub;
    stub.init({ tagId: 'tag_1' });
    stub.track('throws');
    stub.identify({ email: 'dana@acme.com' });

    await import('./iife.js');

    expect(identify).toHaveBeenCalledWith({ email: 'dana@acme.com' });
  });

  it('loaded twice, keeps the SDK that is already live', async () => {
    await import('./snippet.js');
    (window.knock as Stub).init({ tagId: 'tag_1' });
    const { default: first } = await import('./iife.js');
    knockReady({ identify: vi.fn(), scheduling: { load: vi.fn() } });

    vi.resetModules();
    await import('./iife.js');

    expect(window.knockai).toBe(first);
    expect(window.knock).toBe(first);
    expect(first.ready).toBe(true);
  });

  it('never overwrites a window.knock the host page already owns', async () => {
    const hostKnock = { theirs: true };
    window.knock = hostKnock;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('./snippet.js');
    expect(window.knock).toBe(hostKnock);
    expect((window.knockai as Stub).q).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('window.knockai'));

    const { default: knock } = await import('./iife.js');
    expect(window.knock).toBe(hostKnock);
    expect(window.knockai).toBe(knock);
  });
});
