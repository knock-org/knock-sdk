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
  wrapLink: (url: string) => string;
  chat: Record<'open' | 'close' | 'setSkin' | 'resetSkin' | 'configure', (...args: unknown[]) => void>;
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

// The CDN stub README.md carried before knockai.chat existed (up to 0.1.3), verbatim: vendors still have it pasted.
// It has no chat paths, so knockai.chat is undefined until the facade loads.
const PRE_CHAT_SNIPPET = String.raw`(function(){'use strict';function w(c){return !!c&&Array.isArray(c.q)}function l(c){return !c||w(c)||c.__knockai===true}var f="https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js",S=["init","identify","track","modal.open","modal.close","widget.show","widget.hide","widget.open","widget.close"];(function(){var k,d,u;if(typeof window=="undefined"||window.knockai)return;let r=l(window.knock),s=[],o={q:s,ready:false};for(let e of S){let[n,i]=e.split("."),t=(...p)=>{s.push([e,p]);};i?((k=o[n])!=null?k:o[n]={})[i]=t:o[n]=t;}o.on=(...e)=>{let n,i=["on",e,t=>n=t];return s.push(i),()=>n?n():void(i[0]="")},o.wrapLink=e=>e,o.scheduling={load(...e){let n;s.push(["scheduling.load",e,t=>n=t]);let i=t=>()=>n?n[t]():s.push([()=>n[t](),[]]);return {open:i("open"),close:i("close"),get status(){return n?n.status:"loading"}}}},window.knockai=o,r?window.knock=o:console.warn("[knockai] window.knock is taken by this page — use window.knockai instead");let a=document.createElement("script");a.async=true,a.src=(u=(d=document.currentScript)==null?void 0:d.dataset.knockaiSrc)!=null?u:f,document.head.appendChild(a);})();
})();`;

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

  it('wrapLink returns the url unchanged before the facade loads, and queues nothing', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    const url = 'https://start-chat.com/slack/acme/sales';
    expect(stub.wrapLink(url)).toBe(url);
    expect(stub.q).toEqual([]);
  });

  it("wrapLink is the facade's once it loads, and wraps once the Knock tag is ready", async () => {
    await import('./snippet.js');
    (window.knock as Stub).init({ tagId: 'tag_1' });
    const url = 'https://start-chat.com/slack/acme/sales';

    const { default: knock } = await import('./iife.js');
    expect((window.knockai as Stub).wrapLink(url)).toBe(url);

    knockReady({ identify: vi.fn(), scheduling: { load: vi.fn() }, wrapLink: (u) => `${u}?UID=visitor-1` });
    expect((window.knockai as Stub).wrapLink(url)).toBe(`${url}?UID=visitor-1`);
    expect(knock.wrapLink(url)).toBe(`${url}?UID=visitor-1`);
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

  it('queues chat calls in the stub and replays them through the facade, init({ chat }) first', async () => {
    const log: string[] = [];
    const entry =
      (name: string) =>
      (...args: unknown[]) =>
        void log.push(`${name} ${JSON.stringify(args)}`);
    await import('./snippet.js');
    const stub = window.knock as Stub;
    stub.chat.open({ screen: 'pricing' });
    stub.init({ tagId: 'tag_1', chat: { launcher: 'bubble' } });
    stub.chat.setSkin({ preset: 'harbor' });
    stub.chat.resetSkin();
    stub.chat.close();
    stub.chat.configure({ brandName: 'Acme' });
    expect(stub.q.map((call) => (call as [string])[0])).toEqual([
      'chat.open',
      'init',
      'chat.setSkin',
      'chat.resetSkin',
      'chat.close',
      'chat.configure',
    ]);

    await import('./iife.js');
    knockReady({
      identify: vi.fn(),
      scheduling: { load: vi.fn() },
      chat: {
        open: entry('open'),
        close: entry('close'),
        setSkin: entry('setSkin'),
        resetSkin: entry('resetSkin'),
        configure: entry('configure'),
      },
    });

    expect(log).toEqual([
      'configure [{"launcher":"bubble"}]',
      'open [{"screen":"pricing"}]',
      'setSkin [{"preset":"harbor"}]',
      'resetSkin []',
      'close []',
      'configure [{"brandName":"Acme"}]',
    ]);
  });

  it('hands a container element from the stub, through the facade, to the tag as the same object', async () => {
    await import('./snippet.js');
    const stub = window.knock as Stub;
    const slot = document.createElement('div');
    stub.init({ tagId: 'tag_1' });
    stub.chat.configure({ container: slot });

    await import('./iife.js');
    const configure = vi.fn();
    knockReady({
      identify: vi.fn(),
      scheduling: { load: vi.fn() },
      chat: { open: vi.fn(), close: vi.fn(), setSkin: vi.fn(), resetSkin: vi.fn(), configure },
    });

    expect(configure).toHaveBeenCalledOnce();
    expect(configure.mock.calls[0]![0].container).toBe(slot);
  });

  it('a snippet pasted before the chat passes init({ chat }) to the tag first, and knockai.chat works once the facade loads', async () => {
    new Function(PRE_CHAT_SNIPPET)();
    const stub = window.knockai as Stub;
    expect(stub.chat).toBeUndefined();
    stub.init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1', launcher: 'bubble' } });
    stub.track('before_facade');

    await import('./iife.js');
    const log: string[] = [];
    const entry =
      (name: string) =>
      (...args: unknown[]) =>
        void log.push(`${name} ${JSON.stringify(args)}`);
    knockReady({
      identify: vi.fn(),
      track: entry('track'),
      scheduling: { load: vi.fn() },
      chat: {
        open: entry('chat.open'),
        close: entry('chat.close'),
        setSkin: entry('chat.setSkin'),
        resetSkin: entry('chat.resetSkin'),
        configure: entry('chat.configure'),
      },
    });
    (window.knockai as Stub).chat.open({ screen: 'pricing' });

    expect(log).toEqual([
      'chat.configure [{"magicLinkId":"ml_1","launcher":"bubble"}]',
      'track ["before_facade",null]',
      'chat.open [{"screen":"pricing"}]',
    ]);
  });

  it("a snippet pasted before the chat asks a tag without the chat for it, with init({ chat })'s function and element as they are", async () => {
    const configure = vi.fn();
    const open = vi.fn();
    const chat = { open, close: vi.fn(), setSkin: vi.fn(), resetSkin: vi.fn(), configure };
    const loadChat = vi.fn(() => {
      window.Knock = { identify: vi.fn(), scheduling: { load: vi.fn() }, chat };
      return Promise.resolve(chat);
    });
    const headless = vi.fn();
    const slot = document.createElement('div');
    new Function(PRE_CHAT_SNIPPET)();
    (window.knockai as Stub).init({ tagId: 'tag_1', chat: { magicLinkId: 'ml_1', headless, container: slot } });

    await import('./iife.js');
    (window.knockai as Stub).chat.open({ send: 'Hi' });
    knockReady({ identify: vi.fn(), scheduling: { load: vi.fn() }, loadChat });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(loadChat).toHaveBeenCalledOnce();
    expect(configure).toHaveBeenCalledOnce();
    const [options] = configure.mock.calls[0]! as [{ headless: unknown; container: unknown }];
    expect(options.headless).toBe(headless);
    expect(options.container).toBe(slot);
    expect(open).toHaveBeenCalledExactlyOnceWith({ send: 'Hi' });
    expect(configure.mock.invocationCallOrder[0]!).toBeLessThan(open.mock.invocationCallOrder[0]!);
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

// The stub loads the facade from its own script tag's data-knockai-src, else from jsDelivr. A page that shows user HTML can
// carry elements named "currentScript", which the browser then returns for document.currentScript (the element itself for
// one, an HTMLCollection for several). jsdom has no named access on document, so each test hands the stub what the browser would.
describe('CDN stub: where the facade loads from', () => {
  async function facadeSrcWhile(current: unknown): Promise<string | undefined> {
    vi.spyOn(document, 'currentScript', 'get').mockReturnValue(current as HTMLOrSVGScriptElement | null);
    await import('./snippet.js');
    return document.head.querySelector('script')?.src;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('a real script tag with data-knockai-src loads the facade from there', async () => {
    const tag = document.createElement('script');
    tag.dataset['knockaiSrc'] = 'https://www.acme.com/vendor/knock/knockai.iife.js';
    expect(await facadeSrcWhile(tag)).toBe('https://www.acme.com/vendor/knock/knockai.iife.js');
  });

  it.each([
    ['one <img name="currentScript">', '<img name="currentScript" data-knockai-src="https://evil.example/x.js">'],
    [
      'two of them (an HTMLCollection)',
      '<img name="currentScript" data-knockai-src="https://evil.example/x.js"><img name="currentScript" data-knockai-src="https://evil.example/y.js">',
    ],
  ])('%s with data-knockai-src still loads the facade from jsDelivr', async (_case, html) => {
    document.body.innerHTML = html;
    const named = document.images;
    expect(await facadeSrcWhile(named.length === 1 ? named[0] : named)).toMatch(
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/@knock-ai\/sdk@[^/]+\/dist\/knockai\.iife\.js$/,
    );
  });
});
