import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKnock } from './index.js';
import type { KnockRuntime, KnockSDK } from './types.js';

function fakeRuntime(): KnockRuntime {
  return { identify: vi.fn(), track: vi.fn(), scheduling: { load: vi.fn() }, on: vi.fn(() => () => {}) };
}
const runtimeScripts = () => [...document.scripts].filter((s) => /knock/.test(s.src) || s.id === 'knockai-runtime');
function pasteTag(src = 'https://js.knock-ai.com/tag_marketing.js') {
  const s = document.createElement('script');
  s.src = src;
  document.head.appendChild(s);
}

describe('duplicate runtime handling', () => {
  let sdk: KnockSDK;
  beforeEach(() => {
    sdk = createKnock();
    document.head.innerHTML = '';
  });
  afterEach(() => {
    delete window.Knock;
    delete window.__knockTagInstances;
    delete window.__KNOCK_SDK__;
    vi.restoreAllMocks();
  });

  it('adopts a tag that booted before init — ready immediately, no second script, queued calls flush', () => {
    pasteTag();
    const runtime = fakeRuntime();
    window.Knock = runtime;
    window.__knockTagInstances = new Map([['tag_1:v1', { tagId: 'tag_1', vendorId: 'v1' }]]);
    window.dispatchEvent(new Event('knock:ready')); // fired before the SDK existed — must not matter

    sdk.identify({ email: 'dana@acme.com' });
    sdk.init({ tagId: 'tag_1', environment: 'production' });

    expect(sdk.ready).toBe(true);
    expect(runtime.identify).toHaveBeenCalledWith({ email: 'dana@acme.com' });
    expect(runtimeScripts()).toHaveLength(1);
  });

  it('waits for a pasted tag that is still loading instead of injecting another', () => {
    pasteTag();
    sdk.init({ tagId: 'tag_1', environment: 'production' });
    sdk.track('Signed up');
    expect(runtimeScripts()).toHaveLength(1);
    expect(sdk.ready).toBe(false);

    const runtime = fakeRuntime();
    window.Knock = runtime;
    window.dispatchEvent(new Event('knock:ready'));
    expect(sdk.ready).toBe(true);
    expect(runtime.track).toHaveBeenCalledWith('Signed up', undefined);
  });

  it('injects the runtime when no tag is on the page', () => {
    sdk.init({ tagId: 'tag_1', environment: 'production' });
    const scripts = runtimeScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.id).toBe('knockai-runtime');
  });

  it('recognises a tag loaded from the Knock CDN build path as an existing tag', () => {
    pasteTag('https://storage.googleapis.com/knock-tag-build/prod/tag_1/latest/index.js');
    sdk.init({ tagId: 'tag_1' });
    expect(runtimeScripts()).toHaveLength(1);
  });

  it('warns once when the page already runs a different Knock tag, and uses it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.Knock = fakeRuntime();
    window.__knockTagInstances = new Map([['tag_marketing:v1', { tagId: 'tag_marketing', vendorId: 'v1' }]]);
    sdk.init({ tagId: 'tag_product' });
    expect(warn).toHaveBeenCalledWith('[knockai]', expect.stringContaining('using Knock tag tag_marketing'));
    expect(sdk.ready).toBe(true);
    expect(runtimeScripts()).toHaveLength(0);
  });

  it('stays silent when the adopted tag is the same one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.Knock = fakeRuntime();
    window.__knockTagInstances = new Map([['tag_1:v1', { tagId: 'tag_1', vendorId: 'v1' }]]);
    sdk.init({ tagId: 'tag_1' });
    expect(warn).not.toHaveBeenCalled();
  });
});
