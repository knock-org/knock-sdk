import { render } from '@testing-library/react';
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

import { KnockProvider } from './KnockProvider.js';
import { useKnock } from './useKnock.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useKnock', () => {
  it('returns the knock singleton inside a provider', () => {
    let received: unknown;
    function Probe() {
      received = useKnock();
      return null;
    }
    render(
      <KnockProvider tagId="tag_1">
        <Probe />
      </KnockProvider>,
    );
    expect(received).toBe(knock);
  });

  it('returns the knock singleton without a provider', () => {
    let received: unknown;
    function Probe() {
      received = useKnock();
      return null;
    }
    render(<Probe />);
    expect(received).toBe(knock);
  });
});
