import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKnock } from './index.js';
import type { KnockRuntime, KnockSDK } from './types.js';

const URL_IN = 'https://start-chat.com/slack/acme/sales';
const URL_OUT = `${URL_IN}?UID=visitor-1`;

function fakeRuntime(overrides: Partial<KnockRuntime> = {}): KnockRuntime {
  return { identify: vi.fn(), scheduling: { load: vi.fn() }, ...overrides };
}

function ready(runtime: KnockRuntime): void {
  window.Knock = runtime;
  window.dispatchEvent(new Event('knock:ready'));
}

describe('wrapLink', () => {
  let sdk: KnockSDK;

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

  it('returns the url unchanged before init', () => {
    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);
  });

  it('returns the url unchanged before the tag is ready, and never queues the call', () => {
    const wrapLink = vi.fn(() => URL_OUT);
    sdk.init({ tagId: 'tag_1' });

    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);

    ready(fakeRuntime({ wrapLink }));
    expect(wrapLink).not.toHaveBeenCalled();
  });

  it("returns the tag's wrapped url once it is ready", () => {
    const wrapLink = vi.fn(() => URL_OUT);
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime({ wrapLink }));

    expect(sdk.wrapLink(URL_IN)).toBe(URL_OUT);
    expect(wrapLink).toHaveBeenCalledWith(URL_IN);
  });

  it('works on a tag that was already on the page at init', () => {
    window.Knock = fakeRuntime({ wrapLink: () => URL_OUT });
    sdk.init({ tagId: 'tag_1' });
    expect(sdk.wrapLink(URL_IN)).toBe(URL_OUT);
  });

  it('returns the url unchanged on a tag that predates wrapLink, warning only in debug mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime());
    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);
    expect(warn).not.toHaveBeenCalled();

    const debugSdk = createKnock();
    debugSdk.init({ tagId: 'tag_1', debug: true });
    expect(debugSdk.wrapLink(URL_IN)).toBe(URL_IN);
    expect(warn).toHaveBeenCalledWith('[knockai]', expect.stringContaining('wrapLink'));
  });

  it('returns the url unchanged on the server', () => {
    vi.stubGlobal('window', undefined);
    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);
  });

  it('never throws: a failing tag gives back the url unchanged', () => {
    sdk.init({ tagId: 'tag_1' });
    ready(
      fakeRuntime({
        wrapLink: () => {
          throw new Error('boom');
        },
      }),
    );
    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);
  });

  it.each([undefined, ''])('falls back to the url when the tag returns %j', (returned) => {
    sdk.init({ tagId: 'tag_1' });
    ready(fakeRuntime({ wrapLink: () => returned as unknown as string }));
    expect(sdk.wrapLink(URL_IN)).toBe(URL_IN);
  });
});
