import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import knockDefault, { __setKnockForTesting, createKnock, knock } from './index.js';
import type { KnockChat, KnockChatSkin, KnockRuntime, KnockSDK } from './types.js';

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

describe('chat', () => {
  let sdk: KnockSDK;

  function chatRuntime(log: string[] = []): KnockRuntime {
    const entry = (name: string) => vi.fn((...args: unknown[]) => void log.push(`${name} ${JSON.stringify(args)}`));
    return {
      ...fakeRuntime(),
      identify: entry('identify'),
      chat: {
        open: entry('chat.open'),
        close: entry('chat.close'),
        setSkin: entry('chat.setSkin'),
        resetSkin: entry('chat.resetSkin'),
        configure: entry('chat.configure'),
      },
    };
  }

  beforeEach(() => {
    sdk = createKnock();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.Knock;
    delete window.__KNOCK_SDK__;
    vi.restoreAllMocks();
  });

  it('queues all five calls before ready and drains them in call order, with their arguments', () => {
    const log: string[] = [];
    sdk.init({ tagId: 'tag_1' });
    sdk.chat.configure({ launcher: 'bubble' });
    sdk.chat.setSkin({ preset: 'harbor', mode: 'dark' });
    sdk.identify({ email: 'jane@acme.com' });
    sdk.chat.open({ screen: 'pricing', send: 'Hi' });
    sdk.chat.close();
    sdk.chat.resetSkin();
    expect(log).toEqual([]);

    ready(chatRuntime(log));

    expect(log).toEqual([
      'chat.configure [{"launcher":"bubble"}]',
      'chat.setSkin [{"preset":"harbor","mode":"dark"}]',
      'identify [{"email":"jane@acme.com"}]',
      'chat.open [{"screen":"pricing","send":"Hi"}]',
      'chat.close []',
      'chat.resetSkin []',
    ]);
  });

  it('init({ chat }) forwards the options as chat.configure, ahead of calls made before init', () => {
    const log: string[] = [];
    sdk.chat.open();
    sdk.identify({ email: 'jane@acme.com' });
    sdk.init({ tagId: 'tag_1', chat: { test: 'returning', starters: ['Pricing?'] } });
    sdk.chat.setSkin({ preset: 'signal' });

    ready(chatRuntime(log));

    expect(log).toEqual([
      'chat.configure [{"test":"returning","starters":["Pricing?"]}]',
      'chat.open []',
      'identify [{"email":"jane@acme.com"}]',
      'chat.setSkin [{"preset":"signal"}]',
    ]);
  });

  it.each(['slack', 'whatsapp', 'telegram', 'linkedin', 'claude', 'chatgpt'])(
    'passes the preset name %s, which KnockChatPreset does not list, to the chat as the string it is',
    (preset) => {
      const log: string[] = [];
      const skin: KnockChatSkin = { preset };
      sdk.init({ tagId: 'tag_1', chat: { skin } });
      sdk.chat.setSkin({ preset, mode: 'dark' });

      ready(chatRuntime(log));

      expect(log).toEqual([`chat.configure [{"skin":{"preset":"${preset}"}}]`, `chat.setSkin [{"preset":"${preset}","mode":"dark"}]`]);
    },
  );

  it('init({ chat: { magicLinkId } }) forwards the link inside chat.configure, and open({ magicLinkId }) forwards it', () => {
    const log: string[] = [];
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_default' } });
    sdk.chat.open({ magicLinkId: 'ml_pricing', send: 'Hi' });

    ready(chatRuntime(log));

    expect(log).toEqual([
      'chat.configure [{"magicLinkId":"ml_default"}]',
      'chat.open [{"magicLinkId":"ml_pricing","send":"Hi"}]',
    ]);
  });

  it('configure({ magicLinkId: null }) passes the null through: back to the tag link', () => {
    const log: string[] = [];
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: null } });
    sdk.chat.configure({ magicLinkId: null });

    ready(chatRuntime(log));

    expect(log).toEqual([
      'chat.configure [{"magicLinkId":null}]',
      'chat.configure [{"magicLinkId":null}]',
    ]);
  });

  it('hands a container element to the tag as the same object: queued before ready in init({ chat }) and configure(), and after ready', () => {
    const runtime = chatRuntime();
    const slot = document.createElement('div');
    const other = document.createElement('div');
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1', container: slot } });
    sdk.chat.configure({ container: other });
    sdk.chat.configure({ container: '#support-chat' });
    sdk.chat.configure({ container: null });

    ready(runtime);
    sdk.chat.configure({ container: slot });

    const sent = vi.mocked(runtime.chat!.configure).mock.calls.map(([options]) => options.container);
    expect(sent).toHaveLength(5);
    expect(sent[0]).toBe(slot);
    expect(sent[1]).toBe(other);
    expect(sent.slice(2, 4)).toEqual(['#support-chat', null]);
    expect(sent[4]).toBe(slot);
  });

  it('init without chat sends no chat.configure', () => {
    const runtime = chatRuntime();
    sdk.init({ tagId: 'tag_1' });
    ready(runtime);
    expect(runtime.chat!.configure).not.toHaveBeenCalled();
  });

  it('calls the tag directly once it is ready, passing every argument through', () => {
    const runtime = chatRuntime();
    sdk.init({ tagId: 'tag_1' });
    ready(runtime);
    const click = new MouseEvent('click');

    sdk.chat.open(click as never);
    sdk.chat.configure({ skin: null, brandName: 'Acme' });

    expect(runtime.chat!.open).toHaveBeenCalledWith(click);
    expect(runtime.chat!.configure).toHaveBeenCalledWith({ skin: null, brandName: 'Acme' });
  });

  it('bridges chat:open and chat:close from the tag', () => {
    const handlers = new Map<string, (payload: unknown) => void>();
    const runtime: KnockRuntime = {
      ...chatRuntime(), // a tag without the chat is not asked for its events
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        handlers.set(event, handler);
        return () => {};
      }) as KnockRuntime['on'],
    };
    const opened = vi.fn();
    const closed = vi.fn();
    sdk.on('chat:open', opened);
    sdk.on('chat:close', closed);
    sdk.init({ tagId: 'tag_1' });
    ready(runtime);

    handlers.get('chat:open')!({ test: true });
    handlers.get('chat:close')!({ test: false });

    expect(opened).toHaveBeenCalledWith({ test: true });
    expect(closed).toHaveBeenCalledWith({ test: false });
  });

  it('delivers an event the tag emits while applying a queued call', () => {
    const handlers = new Map<string, (payload: unknown) => void>();
    const runtime = chatRuntime();
    runtime.on = vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, handler);
      return () => {};
    }) as KnockRuntime['on'];
    runtime.chat!.open = vi.fn(() => handlers.get('chat:open')?.({ test: true }));
    const opened = vi.fn();
    sdk.on('chat:open', opened);
    sdk.init({ tagId: 'tag_1' });
    sdk.chat.open();

    ready(runtime);

    expect(runtime.chat!.open).toHaveBeenCalledOnce();
    expect(opened).toHaveBeenCalledWith({ test: true });
  });

  it('is a no-op on the server', () => {
    vi.stubGlobal('window', undefined);
    expect(() => {
      sdk.init({ tagId: 'tag_1', chat: { test: true } });
      sdk.chat.open({ screen: 'pricing' });
      sdk.chat.close();
      sdk.chat.setSkin({ preset: 'harbor' });
      sdk.chat.resetSkin();
      sdk.chat.configure({ launcher: 'bubble' });
    }).not.toThrow();
  });
});

describe("the chat: the Knock tag's, asked for when the tag's config has none", () => {
  let sdk: KnockSDK;
  /** Lets the tag's load and the replayed calls run. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };

  function chatApi(log: string[], who = 'tag'): KnockChat {
    const entry = (name: string) => vi.fn((...args: unknown[]) => void log.push(`${who} ${name} ${JSON.stringify(args)}`));
    return { open: entry('chat.open'), close: entry('chat.close'), setSkin: entry('chat.setSkin'), resetSkin: entry('chat.resetSkin'), configure: entry('chat.configure') };
  }

  /** A runtime whose `on()` keeps its handlers, so a test can emit. */
  function listening(base: KnockRuntime) {
    const handlers = new Map<string, Set<(payload: unknown) => void>>();
    const on = vi.fn((event: string, handler: (payload: unknown) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => void handlers.get(event)!.delete(handler);
    });
    const emit = (event: string, payload: unknown) => handlers.get(event)?.forEach((h) => h(payload));
    return { runtime: { ...base, on } as KnockRuntime, emit, handlers };
  }

  /** A tag (0.10.1 and later) whose config has no chat: `loadChat()` puts `chat` on a new `window.Knock`, as the tag does. */
  function tagWithoutChat(log: string[], result: 'chat' | 'none' = 'chat') {
    const after = listening({ ...fakeRuntime(), chat: chatApi(log) });
    // Async, as the tag's: the chunk loads first.
    const loadChat = vi.fn(() =>
      Promise.resolve().then(() => {
        if (result === 'none') return undefined;
        window.Knock = after.runtime;
        return after.runtime.chat;
      }),
    );
    const before = listening({ ...fakeRuntime(), loadChat });
    return { runtime: before.runtime, loadChat, after, before };
  }

  const tagScript = () => document.getElementById('knockai-runtime') as HTMLScriptElement;

  beforeEach(() => {
    sdk = createKnock();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.Knock;
    delete window.__KNOCK_SDK__;
    vi.restoreAllMocks();
  });

  it("a tag whose config has the chat gets every chat call, and is never asked to load it", async () => {
    const log: string[] = [];
    const loadChat = vi.fn();
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1' } });
    sdk.chat.open();
    ready({ ...fakeRuntime(), chat: chatApi(log), loadChat });
    sdk.chat.close();
    await settle();

    expect(log).toEqual(['tag chat.configure [{"magicLinkId":"ml_1"}]', 'tag chat.open []', 'tag chat.close []']);
    expect(loadChat).not.toHaveBeenCalled();
  });

  it('a tag without the chat: the queued chat calls ask it once, and reach its chat in order; the rest go to the tag at once', async () => {
    const log: string[] = [];
    const tag = tagWithoutChat(log);
    sdk.init({ tagId: 'tag_1', chat: { test: true } });
    sdk.chat.setSkin({ preset: 'pixel' });
    sdk.identify({ email: 'jane@acme.com' });
    sdk.chat.open({ send: 'Hi' });

    ready(tag.runtime);
    expect(tag.runtime.identify).toHaveBeenCalledWith({ email: 'jane@acme.com' });
    expect(log).toEqual([]);
    await settle();

    expect(tag.loadChat).toHaveBeenCalledOnce();
    expect(log).toEqual(['tag chat.configure [{"test":true}]', 'tag chat.setSkin [{"preset":"pixel"}]', 'tag chat.open [{"send":"Hi"}]']);

    sdk.chat.close();
    await settle();
    expect(log[log.length - 1]).toBe('tag chat.close []');
    expect(tag.loadChat).toHaveBeenCalledOnce();
    expect(sdk.ready).toBe(true);
  });

  it('a tag without the chat is asked for nothing until the first chat call', async () => {
    const log: string[] = [];
    const tag = tagWithoutChat(log);
    sdk.init({ tagId: 'tag_1' });
    ready(tag.runtime);
    await settle();
    expect(tag.loadChat).not.toHaveBeenCalled();

    sdk.chat.open({ screen: 'pricing' });
    sdk.chat.configure({ brandName: 'Acme' }); // while the tag loads it: after the open
    await settle();
    expect(tag.loadChat).toHaveBeenCalledOnce();
    expect(log).toEqual(['tag chat.open [{"screen":"pricing"}]', 'tag chat.configure [{"brandName":"Acme"}]']);
  });

  it("hands a container element to the tag's chat as the same object: in init({ chat }) before ready, and in configure() after", async () => {
    const log: string[] = [];
    const tag = tagWithoutChat(log);
    const slot = document.createElement('div');
    const other = document.createElement('div');
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1', container: slot } });

    ready(tag.runtime);
    await settle();
    sdk.chat.configure({ container: other });
    await settle();

    const sent = vi.mocked(tag.after.runtime.chat!.configure).mock.calls.map(([options]) => options.container);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toBe(slot);
    expect(sent[1]).toBe(other);
  });

  it("bridges the chat's events from the window.Knock the tag puts its chat on, once", async () => {
    const tag = tagWithoutChat([]);
    const opened = vi.fn();
    const failed = vi.fn();
    sdk.on('chat:open', opened);
    sdk.on('error', failed);
    sdk.init({ tagId: 'tag_1' });
    ready(tag.runtime);
    expect(tag.before.handlers.has('chat:open')).toBe(false); // a tag without the chat does not know its events
    sdk.chat.open();
    await settle();

    tag.after.emit('chat:open', { test: false });
    expect(opened).toHaveBeenCalledOnce();
    expect(opened).toHaveBeenCalledWith({ test: false });
    tag.before.emit('error', { message: 'old' }); // the runtime it replaced: unsubscribed
    tag.after.emit('error', { message: 'chat failed to mount' });
    expect(failed).toHaveBeenCalledOnce();
    expect(failed).toHaveBeenCalledWith({ message: 'chat failed to mount' });
  });

  it("follows a window.Knock that other code gave the chat: the next call moves the event bridge to it", async () => {
    const log: string[] = [];
    const tag = tagWithoutChat(log);
    const opened = vi.fn();
    sdk.on('chat:open', opened);
    sdk.init({ tagId: 'tag_1' });
    ready(tag.runtime);
    await tag.runtime.loadChat!(); // the page's own code, before any SDK chat call

    sdk.chat.open();
    expect(log).toEqual(['tag chat.open []']);
    expect(tag.loadChat).toHaveBeenCalledOnce();
    tag.after.emit('chat:open', { test: false });
    expect(opened).toHaveBeenCalledOnce();
  });

  it.each([
    ['a tag that predates the chat (0.10.0)', () => ({ ...fakeRuntime() }), 'this Knock tag predates the chat'],
    ['a tag whose chat file did not load', () => tagWithoutChat([], 'none').runtime, 'the Knock tag could not load its chat'],
  ])('%s: one error event, then every chat call does nothing and never throws', async (_, runtime, message) => {
    const errors = vi.fn();
    sdk.on('error', errors);
    sdk.init({ tagId: 'tag_1' });
    ready(runtime());
    sdk.chat.open();
    await settle();
    expect(() => sdk.chat.close()).not.toThrow();
    await settle();
    expect(errors).toHaveBeenCalledOnce();
    expect(errors).toHaveBeenCalledWith({ message: 'chat failed to load', cause: new Error(message) });
  });

  it('a tag script that fails: the chat calls end in one error event; the other calls keep waiting for a tag', async () => {
    const errors = vi.fn();
    sdk.on('error', errors);
    sdk.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1' } });
    sdk.identify({ email: 'jane@acme.com' });

    tagScript().dispatchEvent(new Event('error'));
    sdk.chat.open();
    await settle();
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0]![0]).toMatchObject({ message: 'chat failed to load' });

    const runtime = fakeRuntime();
    ready(runtime);
    expect(runtime.identify).toHaveBeenCalledWith({ email: 'jane@acme.com' });
  });

  it('hears a tag the page pasted fail, too', async () => {
    const errors = vi.fn();
    sdk.on('error', errors);
    const pasted = document.createElement('script');
    pasted.src = 'https://js.knock-ai.com/tag_1.js';
    document.head.appendChild(pasted);
    sdk.init({ tagId: 'tag_1' });
    sdk.chat.open();

    pasted.dispatchEvent(new Event('error'));
    await settle();
    expect(errors).toHaveBeenCalledOnce();
    expect(document.scripts).toHaveLength(1);
  });

  it('a slow tag is waited for: no timer gives the chat calls up', async () => {
    vi.useFakeTimers();
    const log: string[] = [];
    sdk.init({ tagId: 'tag_1', chat: { launcher: 'bubble' } });
    sdk.chat.open({ magicLinkId: 'ml_pricing' });

    await vi.advanceTimersByTimeAsync(60_000);
    ready({ ...fakeRuntime(), chat: chatApi(log) });
    expect(log).toEqual(['tag chat.configure [{"launcher":"bubble"}]', 'tag chat.open [{"magicLinkId":"ml_pricing"}]']);
    vi.useRealTimers();
  });

  it('does nothing on the server', () => {
    vi.stubGlobal('window', undefined);
    sdk.init({ tagId: 'tag_1', chat: { test: true } });
    expect(() => sdk.chat.open()).not.toThrow();
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
