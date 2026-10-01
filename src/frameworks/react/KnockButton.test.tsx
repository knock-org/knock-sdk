import { fireEvent, render, screen } from '@testing-library/react';
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

import { KnockButton } from './KnockButton.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KnockButton', () => {
  it('opens the modal on click', () => {
    render(<KnockButton magicLinkId="ml_1">Book a demo</KnockButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Book a demo' }));
    expect(knock.modal.open).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: undefined });
  });

  it('passes email through to modal.open', () => {
    render(
      <KnockButton magicLinkId="ml_1" email="a@b.com">
        Book
      </KnockButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    expect(knock.modal.open).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: 'a@b.com' });
  });

  it('forwards a11y props and calls a passed onClick handler', () => {
    const onClick = vi.fn();
    render(
      <KnockButton magicLinkId="ml_1" aria-label="Open scheduler" onClick={onClick}>
        Book
      </KnockButton>,
    );
    const button = screen.getByRole('button', { name: 'Open scheduler' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(knock.modal.open).toHaveBeenCalledTimes(1);
  });

  it('loads the scheduling modal on hover and focus, so the click opens it warm', () => {
    render(<KnockButton magicLinkId="ml_1" email="a@b.com">Book</KnockButton>);
    const button = screen.getByRole('button', { name: 'Book' });
    fireEvent.pointerOver(button);
    fireEvent.focus(button);
    expect(knock.scheduling.load).toHaveBeenCalledTimes(2);
    expect(knock.scheduling.load).toHaveBeenCalledWith({ magicLinkId: 'ml_1', email: 'a@b.com' });
  });

  it('opens the default Knock modal without a magic link, and never prewarms', () => {
    render(<KnockButton>Chat</KnockButton>);
    const button = screen.getByRole('button', { name: 'Chat' });
    fireEvent.pointerOver(button);
    fireEvent.click(button);
    expect(knock.scheduling.load).not.toHaveBeenCalled();
    expect(knock.modal.open).toHaveBeenCalledWith({ magicLinkId: undefined, email: undefined });
  });

  it('defaults to type="button"', () => {
    render(<KnockButton magicLinkId="ml_1">Book</KnockButton>);
    const button = screen.getByRole('button', { name: 'Book' }) as HTMLButtonElement;
    expect(button.type).toBe('button');
  });

  it('allows the type to be overridden', () => {
    render(
      <KnockButton magicLinkId="ml_1" type="submit">
        Book
      </KnockButton>,
    );
    const button = screen.getByRole('button', { name: 'Book' }) as HTMLButtonElement;
    expect(button.type).toBe('submit');
  });
});
