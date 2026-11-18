import { fireEvent, render, screen } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createKnock } from '../../core/index.js';
import type { KnockChat, KnockRuntime } from '../../core/types.js';

// Type tests: `npm run typecheck` compiles this file.
type Assert<T extends true> = T;
type Handler<E> = (event: E) => void;
export type OpenIsAReactClickHandler = Assert<KnockChat['open'] extends Handler<ReactMouseEvent<HTMLButtonElement>> ? true : false>;
export type OpenIsADomListener = Assert<KnockChat['open'] extends Handler<MouseEvent> ? true : false>;
export function rejectsWhatIsNeitherOptionsNorAnEvent(chat: KnockChat): void {
  // @ts-expect-error a string is not open options
  chat.open('pricing');
  // @ts-expect-error a misspelt option is still caught
  chat.open({ screne: 'pricing' });
  // @ts-expect-error an object with only `type` is not an event
  chat.open({ type: 'click' });
}

afterEach(() => {
  delete window.Knock;
});

describe('knock.chat.open as an event handler', () => {
  it('works as onClick={knock.chat.open}: the click reaches the chat, which ignores the event', () => {
    const open = vi.fn();
    const knock = createKnock();
    window.Knock = { identify: vi.fn(), scheduling: { load: vi.fn() }, chat: { open, close: vi.fn(), setSkin: vi.fn(), resetSkin: vi.fn(), configure: vi.fn() } } as unknown as KnockRuntime;
    knock.init({ tagId: 'tag_1' });

    render(<button onClick={knock.chat.open}>Chat with us</button>);
    fireEvent.click(screen.getByRole('button', { name: 'Chat with us' }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0]?.[0]).toHaveProperty('type', 'click');
  });

  it('works as a DOM listener', () => {
    const open = vi.fn();
    const knock = createKnock();
    window.Knock = { identify: vi.fn(), scheduling: { load: vi.fn() }, chat: { open, close: vi.fn(), setSkin: vi.fn(), resetSkin: vi.fn(), configure: vi.fn() } } as unknown as KnockRuntime;
    knock.init({ tagId: 'tag_1' });
    const button = document.createElement('button');
    button.addEventListener('click', knock.chat.open);
    button.click();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });
});
