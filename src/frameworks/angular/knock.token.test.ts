import { describe, expect, it, vi } from 'vitest';

const { knock } = vi.hoisted(() => ({ knock: { init: vi.fn(), identify: vi.fn() } }));

vi.mock('../../core', () => ({ knock }));

import { KNOCK } from './knock.token.js';

describe('KNOCK', () => {
  it('is provided in root and resolves to the shared knockai instance', () => {
    const prov = (KNOCK as any).ɵprov;
    expect(prov.providedIn).toBe('root');
    expect(prov.factory()).toBe(knock);
  });
});
