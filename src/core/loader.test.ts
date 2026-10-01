import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildScriptUrl, injectRuntimeScript, writeBootConfig } from './loader.js';
import type { KnockSdkBootConfig } from './types.js';

const bootConfig: KnockSdkBootConfig = {
  protocolVersion: 1,
  sdkVersion: '0.1.0',
  tagId: 'tag_123',
  environment: 'production',
  debug: false,
};

describe('buildScriptUrl', () => {
  it('builds the production CDN url for a tagId', () => {
    expect(buildScriptUrl('production', 'tag_123')).toBe(
      'https://storage.googleapis.com/knock-tag-build/prod/tag_123/latest/index.js',
    );
  });

  it('builds the staging CDN url', () => {
    expect(buildScriptUrl('staging', 'tag_123')).toBe(
      'https://storage.googleapis.com/knock-tag-build-stg/prod/tag_123/latest/index.js',
    );
  });

  it('builds the development CDN url', () => {
    expect(buildScriptUrl('development', 'tag_123')).toBe(
      'https://storage.googleapis.com/knock-tag-build/dev/tag_123/latest/index.js',
    );
  });

  it('lets an explicit scriptUrl override the CDN template entirely', () => {
    expect(buildScriptUrl('production', 'tag_123', 'https://example.com/custom.js')).toBe(
      'https://example.com/custom.js',
    );
  });
});

describe('writeBootConfig', () => {
  afterEach(() => {
    delete window.__KNOCK_SDK__;
  });

  it('writes the config onto window.__KNOCK_SDK__', () => {
    writeBootConfig(bootConfig);
    expect(window.__KNOCK_SDK__).toEqual(bootConfig);
  });

  it('is a no-op without a window', () => {
    vi.stubGlobal('window', undefined);
    expect(() => writeBootConfig(bootConfig)).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('injectRuntimeScript', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('appends an async script tag pointing at the given url', () => {
    injectRuntimeScript('https://example.com/runtime.js');
    const script = document.getElementById('knockai-runtime') as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toBe('https://example.com/runtime.js');
    expect(script?.async).toBe(true);
  });

  it('never injects a second script tag', () => {
    injectRuntimeScript('https://example.com/runtime.js');
    injectRuntimeScript('https://example.com/runtime.js');
    expect(document.querySelectorAll('script').length).toBe(1);
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);
    expect(() => injectRuntimeScript('https://example.com/runtime.js')).not.toThrow();
    vi.unstubAllGlobals();
  });
});
