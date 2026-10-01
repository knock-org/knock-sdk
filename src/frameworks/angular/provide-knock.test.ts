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

import { initKnockRuntime, provideKnock } from './provide-knock.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initKnockRuntime', () => {
  it('initializes the runtime singleton with the given options', () => {
    initKnockRuntime({ tagId: 'tag_1', debug: true });
    expect(knock.init).toHaveBeenCalledWith({ tagId: 'tag_1', debug: true });
  });
});

describe('provideKnock', () => {
  it('builds environment providers without throwing', () => {
    // makeEnvironmentProviders/APP_INITIALIZER are plain data, no Angular compiler needed.
    expect(() => provideKnock({ tagId: 'tag_1' })).not.toThrow();
  });
});
