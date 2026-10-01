import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import knockDefault, { __setKnockForTesting, createKnock, knock } from './index.js';
import type { KnockRuntime, KnockSDK } from './types.js';

function fakeRuntime(): KnockRuntime {
  const handle = { open: vi.fn(), close: vi.fn(), status: 'slots_found' as const };
  return {
    identify: vi.fn(),
    track: vi.fn(),
    scheduling: { load: vi.fn(() => handle) },
    on: vi.fn(() => () => {}),
  };
}

function ready(runtime: KnockRuntime): void {
  window.Knock = runtime;
  window.dispatchEvent(new Event('knock:ready'));
}

describe('createKnock', () => {
  let sdk: KnockSDK;

  beforeEach(() => {
    sdk = createKnock();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    delete window.Knock;
    delete window.__KNOCK_SDK__;
    vi.restoreAllMocks();
  });

  it('queues calls before ready and drains them in order', () => {
    const runtime = fakeRuntime();
    sdk.init({ tagId: 'tag_1', environment: 'production' });
    sdk.identify({ email: 'jane@acme.com' });
    sdk.track('trial_started', { plan: 'pro' });
    expect(runtime.identify).not.toHaveBeenCalled();

    ready(runtime);

    expect(runtime.identify).toHaveBeenCalledWith({ email: 'jane@acme.com' });
    expect(runtime.track).toHaveBeenCalledWith('trial_started', { plan: 'pro' });
    expect(sdk.ready).toBe(true);
  });

  it('writes the boot config before injecting the script', () => {
    sdk.init({ tagId: 'tag_1', environment: 'staging', debug: false });
    expect(window.__KNOCK_SDK__).toEqual({
      protocolVersion: 1,
      sdkVersion: sdk.version,
      tagId: 'tag_1',
      environment: 'staging',
      debug: false,
    });
    const script = document.head.querySelector('script');
    expect(script?.src).toBe('https://storage.googleapis.com/knock-tag-build-stg/prod/tag_1/latest/index.js');
  });

  it('loads the production tag on localhost when no environment is passed', () => {
    expect(window.location.hostname).toBe('localhost');
    sdk.init({ tagId: 'tag_1' });
    expect(window.__KNOCK_SDK__?.environment).toBe('production');
    expect(document.head.querySelector('script')?.src).toBe(
      'https://storage.googleapis.com/knock-tag-build/prod/tag_1/latest/index.js',
    );
  });

  it('warns and ignores a second init', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk.init({ tagId: 'tag_1' });
    sdk.init({ tagId: 'tag_2' });
    expect(warn).toHaveBeenCalledOnce();
    expect(document.head.querySelectorAll('script')).toHaveLength(1);
  });

  it('fills modal email from the last identify unless the caller passes one', () => {
    const runtime = fakeRuntime();
    sdk.init({ tagId: 'tag_1' });
    ready(runtime);
    sdk.identify({ email: 'jane@acme.com' });
    sdk.modal.open({ magicLinkId: 'm1' });
    expect(runtime.scheduling.load).toHaveBeenLastCalledWith({ magicLinkId: 'm1', email: 'jane@acme.com' });

    sdk.modal.open({ magicLinkId: 'm2', email: 'other@acme.com' });
    expect(runtime.scheduling.load).toHaveBeenLastCalledWith({ magicLinkId: 'm2', email: 'other@acme.com' });
  });

  it('holds at most 1000 calls before the runtime is ready and warns in debug mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const runtime = fakeRuntime();
    sdk.init({ tagId: 'tag_1', debug: true });
    for (let i = 0; i < 1001; i++) sdk.track('queued', { i });
    expect(warn).toHaveBeenCalledWith('[knockai]', expect.stringContaining('track dropped'));

    ready(runtime);

    expect(runtime.track).toHaveBeenCalledTimes(1000);
    expect(runtime.track).toHaveBeenLastCalledWith('queued', { i: 999 });
  });

  it('drops calls past the cap silently when debug is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk.init({ tagId: 'tag_1' });
    for (let i = 0; i < 1001; i++) sdk.track('queued');
    expect(warn).not.toHaveBeenCalled();
  });

  it('emits ready to handlers subscribed before the runtime loaded', () => {
    const handler = vi.fn();
    sdk.on('ready', handler);
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime());
    expect(handler).toHaveBeenCalledOnce();
  });

  it('runs a ready handler added after ready, once, on the next microtask', async () => {
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime());
    const handler = vi.fn();
    sdk.on('ready', handler);
    expect(handler).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('never runs a late ready handler unsubscribed before its microtask', async () => {
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime());
    const handler = vi.fn();
    sdk.on('ready', handler)();

    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps draining the queue when one queued call throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const runtime = fakeRuntime();
    vi.mocked(runtime.identify).mockImplementation(() => {
      throw new Error('boom');
    });
    const onReady = vi.fn();
    sdk.on('ready', onReady);
    sdk.init({ tagId: 'tag_1', debug: true });
    sdk.identify({ email: 'jane@acme.com' });
    sdk.track('after_the_throw');

    ready(runtime);

    expect(runtime.track).toHaveBeenCalledWith('after_the_throw', undefined);
    expect(onReady).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('[knockai]', 'identify', expect.any(Error));
  });

  it.each(['website', 'product'] as const)('exposes the %s surface once the runtime is ready', (surface) => {
    sdk.init({ tagId: 'tag_1' });
    expect(sdk.surface).toBeUndefined();

    ready({ ...fakeRuntime(), surface });

    expect(sdk.surface).toBe(surface);
  });

  it('leaves surface undefined on a tag that predates it', () => {
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime());
    expect(sdk.ready).toBe(true);
    expect(sdk.surface).toBeUndefined();
  });

  it.each(['app', 42, null])('ignores an unknown surface %s from the runtime', (surface) => {
    sdk.init({ tagId: 'tag_1' });
    ready({ ...fakeRuntime(), surface } as unknown as KnockRuntime);
    expect(sdk.ready).toBe(true);
    expect(sdk.surface).toBeUndefined();
  });
});

describe('knock singleton', () => {
  afterEach(() => __setKnockForTesting(undefined));

  it('is also the default export', () => {
    expect(knockDefault).toBe(knock);
  });

  it('redirects to a test double via __setKnockForTesting', () => {
    const double = createKnock();
    __setKnockForTesting(double);
    expect(knock.version).toBe(double.version);
    expect(knock.modal.open).toBe(double.modal.open);
  });
});
