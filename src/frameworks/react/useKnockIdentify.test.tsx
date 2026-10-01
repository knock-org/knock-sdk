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

import type { KnockIdentifyTraits } from 'knockai';
import { useKnockIdentify } from './useKnockIdentify.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function Probe({ traits }: { traits: KnockIdentifyTraits }) {
  useKnockIdentify(traits);
  return null;
}

describe('useKnockIdentify', () => {
  it('identifies on mount', () => {
    render(<Probe traits={{ email: 'a@b.com' }} />);
    expect(knock.identify).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('does not re-identify for deep-equal traits', () => {
    const { rerender } = render(<Probe traits={{ email: 'a@b.com' }} />);
    rerender(<Probe traits={{ email: 'a@b.com' }} />);
    expect(knock.identify).toHaveBeenCalledTimes(1);
  });

  it('re-identifies when traits change', () => {
    const { rerender } = render(<Probe traits={{ email: 'a@b.com' }} />);
    rerender(<Probe traits={{ email: 'c@d.com' }} />);
    expect(knock.identify).toHaveBeenCalledTimes(2);
    expect(knock.identify).toHaveBeenLastCalledWith({ email: 'c@d.com' });
  });
});
