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

import { useKnockEvent } from './useKnockEvent.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function Probe({ handler }: { handler: () => void }) {
  useKnockEvent('ready', handler);
  return null;
}

describe('useKnockEvent', () => {
  it('subscribes on mount and unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    knock.on.mockReturnValue(unsubscribe);
    const handler = vi.fn();

    const { unmount } = render(<Probe handler={handler} />);
    expect(knock.on).toHaveBeenCalledWith('ready', expect.any(Function));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('dispatches to the latest handler without resubscribing', () => {
    let captured: ((payload: unknown) => void) | undefined;
    knock.on.mockImplementation((_event: string, handler: (payload: unknown) => void) => {
      captured = handler;
      return vi.fn();
    });

    const handlerA = vi.fn();
    const handlerB = vi.fn();
    const { rerender } = render(<Probe handler={handlerA} />);
    rerender(<Probe handler={handlerB} />);

    expect(knock.on).toHaveBeenCalledTimes(1);
    captured?.(undefined);
    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });
});
