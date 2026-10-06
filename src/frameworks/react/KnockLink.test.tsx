import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { knock } = vi.hoisted(() => ({
  knock: {
    init: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
    modal: { open: vi.fn(), close: vi.fn() },
    scheduling: { load: vi.fn() },
    widget: { show: vi.fn(), hide: vi.fn(), open: vi.fn(), close: vi.fn() },
    wrapLink: vi.fn((url: string) => `${url}?UID=visitor-1`),
    on: vi.fn(),
    ready: true,
    version: '0.0.0-test',
  },
}));

vi.mock('../../core', () => ({ knock }));

import { KnockLink } from './KnockLink.js';

const HREF = 'https://start-chat.com/slack/acme/sales';
const WRAPPED = `${HREF}?UID=visitor-1`;

/** The anchor's href at the end of dispatch, which is what the browser's default action then uses. */
let hrefAtDefault: string | null;
function recordHrefAtDefault(event: Event): void {
  hrefAtDefault = (event.target as Element).closest('a')?.getAttribute('href') ?? null;
  event.preventDefault(); // jsdom can't navigate
}

function link(): HTMLAnchorElement {
  return screen.getByRole('link', { name: 'Chat with sales' }) as HTMLAnchorElement;
}

function mouse(type: string, button: number): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, button });
}

/** A pointerdown as a browser sends it (jsdom has no PointerEvent, so pointerType is set by hand). */
function press(pointerType: string, button = 0, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button, ...init });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  return event;
}

beforeEach(() => {
  vi.clearAllMocks();
  hrefAtDefault = null;
  document.addEventListener('click', recordHrefAtDefault);
});

afterEach(() => {
  document.removeEventListener('click', recordHrefAtDefault);
  vi.useRealTimers();
});

describe('KnockLink', () => {
  it('renders a plain link with the raw href, and adds nothing until it is used', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    expect(link().getAttribute('href')).toBe(HREF);
    expect(knock.wrapLink).not.toHaveBeenCalled();
  });

  it('renders the raw href on the server', () => {
    const html = renderToString(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    expect(html).toBe(`<a href="${HREF}">Chat with sales</a>`);
    expect(knock.wrapLink).not.toHaveBeenCalled();
  });

  it('stamps the wrapped url on click, before the browser follows it', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent.click(link());
    expect(knock.wrapLink).toHaveBeenCalledWith(HREF);
    expect(hrefAtDefault).toBe(WRAPPED);
  });

  it.each([
    ['cmd', { metaKey: true }],
    ['ctrl', { ctrlKey: true }],
    ['shift', { shiftKey: true }],
  ])('stamps on a %s-click, which opens a new tab or window', (_, modifier) => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent.click(link(), modifier);
    expect(hrefAtDefault).toBe(WRAPPED);
  });

  it('stamps on a middle-click (auxclick, button 1)', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), mouse('auxclick', 1));
    expect(link().getAttribute('href')).toBe(WRAPPED);
  });

  it('stamps on Enter', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent.keyDown(link(), { key: 'Enter' });
    expect(link().getAttribute('href')).toBe(WRAPPED);
  });

  it.each([0, 1])('stamps on a mouse press with button %i, and keeps it for a drag', (button) => {
    vi.useFakeTimers();
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), press('mouse', button));
    vi.runAllTimers();
    expect(link().getAttribute('href')).toBe(WRAPPED);
  });

  it.each(['touch', 'pen'])('does not stamp on a %s press, which may be a long-press for the link menu', (pointerType) => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), press(pointerType));
    fireEvent.contextMenu(link());
    expect(link().getAttribute('href')).toBe(HREF);
    expect(knock.wrapLink).not.toHaveBeenCalled();
  });

  it('does not stamp on a Ctrl-press, which is a right-click on a Mac', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), press('mouse', 0, { ctrlKey: true }));
    fireEvent.contextMenu(link(), { ctrlKey: true });
    expect(link().getAttribute('href')).toBe(HREF);
    expect(knock.wrapLink).not.toHaveBeenCalled();
  });

  it('stamps a Ctrl-click that does click (Windows, Linux)', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), press('mouse', 0, { ctrlKey: true }));
    fireEvent.click(link(), { ctrlKey: true });
    expect(hrefAtDefault).toBe(WRAPPED);
  });

  it('puts the raw href back before the link menu opens, after a press', () => {
    let hrefInHandler: string | null = null;
    render(
      <KnockLink href={HREF} onContextMenu={(event) => (hrefInHandler = event.currentTarget.getAttribute('href'))}>
        Chat with sales
      </KnockLink>,
    );
    fireEvent(link(), press('mouse'));
    expect(link().getAttribute('href')).toBe(WRAPPED);
    fireEvent.contextMenu(link());
    expect(hrefInHandler).toBe(HREF);
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it('puts the raw href back when a drag ends', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), press('mouse'));
    expect(link().getAttribute('href')).toBe(WRAPPED);
    fireEvent.dragEnd(link());
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it.each([
    ['a click', () => fireEvent.click(link())],
    ['a middle-click', () => fireEvent(link(), mouse('auxclick', 1))],
    ['Enter', () => fireEvent.keyDown(link(), { key: 'Enter' })],
  ])('puts the raw href back once the browser has followed %s', (_, open) => {
    vi.useFakeTimers();
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    open();
    expect(knock.wrapLink).toHaveBeenCalledWith(HREF);
    vi.runAllTimers();
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it('keeps an href that changed while the link was opened', () => {
    vi.useFakeTimers();
    const next = 'https://login.start-chat.com/slack/acme/support';
    function Cycling() {
      const [href, setHref] = useState(HREF);
      return (
        <KnockLink href={href} onClick={() => setHref(next)}>
          Chat with sales
        </KnockLink>
      );
    }
    render(<Cycling />);
    fireEvent.click(link());
    vi.runAllTimers();
    expect(link().getAttribute('href')).toBe(next);
  });

  it('never stamps on a right-click, so a copied link stays clean', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent(link(), mouse('pointerdown', 2));
    fireEvent(link(), mouse('auxclick', 2));
    fireEvent.contextMenu(link());
    expect(link().getAttribute('href')).toBe(HREF);
    expect(knock.wrapLink).not.toHaveBeenCalled();
  });

  it('ignores keys other than Enter', () => {
    render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    fireEvent.keyDown(link(), { key: ' ' });
    fireEvent.keyDown(link(), { key: 'Tab' });
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it('calls your own handlers', () => {
    const onClick = vi.fn();
    const onAuxClick = vi.fn();
    const onKeyDown = vi.fn();
    const onPointerDown = vi.fn();
    const onContextMenu = vi.fn();
    const onDragEnd = vi.fn();
    render(
      <KnockLink
        href={HREF}
        onClick={onClick}
        onAuxClick={onAuxClick}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onDragEnd={onDragEnd}
      >
        Chat with sales
      </KnockLink>,
    );
    fireEvent(link(), mouse('pointerdown', 2));
    fireEvent(link(), mouse('auxclick', 2));
    fireEvent.keyDown(link(), { key: 'Escape' });
    fireEvent.contextMenu(link());
    fireEvent.dragEnd(link());
    fireEvent.click(link());
    expect(onPointerDown).toHaveBeenCalledOnce();
    expect(onAuxClick).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onContextMenu).toHaveBeenCalledOnce();
    expect(onDragEnd).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('runs your onClick first, with the raw href, then stamps the link', () => {
    let hrefInHandler: string | null = null;
    render(
      <KnockLink href={HREF} onClick={(event) => (hrefInHandler = event.currentTarget.getAttribute('href'))}>
        Chat with sales
      </KnockLink>,
    );
    fireEvent.click(link());
    expect(hrefInHandler).toBe(HREF);
    expect(hrefAtDefault).toBe(WRAPPED);
  });

  it('leaves the link alone when your handler calls preventDefault', () => {
    const onClick = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <KnockLink href={HREF} onClick={onClick}>
        Chat with sales
      </KnockLink>,
    );
    fireEvent.click(link());
    expect(onClick).toHaveBeenCalledOnce();
    expect(knock.wrapLink).not.toHaveBeenCalled();
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it.each([
    ['a mouse press', () => fireEvent(link(), press('mouse'))],
    ['Enter', () => fireEvent.keyDown(link(), { key: 'Enter' })],
  ])('gives your onClick the raw href after %s, and leaves it when you call preventDefault', (_, before) => {
    let hrefInHandler: string | null = null;
    render(
      <KnockLink
        href={HREF}
        onClick={(event) => {
          hrefInHandler = event.currentTarget.getAttribute('href');
          event.preventDefault();
        }}
      >
        Chat with sales
      </KnockLink>,
    );
    before();
    expect(link().getAttribute('href')).toBe(WRAPPED);
    fireEvent.click(link());
    expect(hrefInHandler).toBe(HREF);
    expect(link().getAttribute('href')).toBe(HREF);
  });

  it('gives your onClick the raw href after a press, then stamps the click', () => {
    let hrefInHandler: string | null = null;
    render(
      <KnockLink href={HREF} onClick={(event) => (hrefInHandler = event.currentTarget.getAttribute('href'))}>
        Chat with sales
      </KnockLink>,
    );
    fireEvent(link(), press('mouse'));
    fireEvent.click(link());
    expect(hrefInHandler).toBe(HREF);
    expect(hrefAtDefault).toBe(WRAPPED);
  });

  it('forwards its ref to the <a>', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <KnockLink href={HREF} ref={ref}>
        Chat with sales
      </KnockLink>,
    );
    expect(ref.current).toBe(link());
  });

  it('passes every other prop through to the <a>', () => {
    render(
      <KnockLink
        href={HREF}
        target="_blank"
        rel="noopener"
        className="cta"
        id="chat"
        aria-label="Chat with sales"
        data-section="pricing"
        download="chat"
        title="Opens Knock chat"
      >
        Chat
      </KnockLink>,
    );
    const a = link();
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener');
    expect(a.className).toBe('cta');
    expect(a.id).toBe('chat');
    expect(a.dataset['section']).toBe('pricing');
    expect(a.getAttribute('download')).toBe('chat');
    expect(a.title).toBe('Opens Knock chat');
    expect(a.textContent).toBe('Chat');
  });

  it('wraps the current href after it changes', () => {
    const next = 'https://login.start-chat.com/slack/acme/support';
    const { rerender } = render(<KnockLink href={HREF}>Chat with sales</KnockLink>);
    rerender(<KnockLink href={next}>Chat with sales</KnockLink>);
    expect(link().getAttribute('href')).toBe(next);
    fireEvent.click(link());
    expect(knock.wrapLink).toHaveBeenLastCalledWith(next);
    expect(hrefAtDefault).toBe(`${next}?UID=visitor-1`);
  });
});
