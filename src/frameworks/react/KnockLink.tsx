import { forwardRef, type AnchorHTMLAttributes, type SyntheticEvent } from 'react';
import { useKnock } from './useKnock.js';

export interface KnockLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The link, as is. The rendered `<a>` keeps it; the visitor's identity is added only while they open it. */
  href: string;
}

/**
 * A plain `<a>` for links to Knock chat that keeps the visitor's identity when they open it. It
 * renders `href` as is, so server rendering stays the same and nothing re-renders when Knock loads.
 * It swaps in `knock.wrapLink(href)` only while the link is opened (a click with any modifier, a
 * middle-click, Enter, or a mouse press, so a drag to a new tab keeps it too), then puts `href`
 * back. A right-click, a long-press or a Ctrl-click on a Mac always shows `href` as is, so a copied
 * link stays clean. Your own handlers run first and see `href` as is; if your `onClick` calls
 * `preventDefault()`, the link stays as it is.
 */
export const KnockLink = forwardRef<HTMLAnchorElement, KnockLinkProps>(function KnockLink(
  { href, onClick, onAuxClick, onKeyDown, onPointerDown, onContextMenu, onDragEnd, ...rest },
  ref,
) {
  const knock = useKnock();

  // Puts the raw href back, runs the caller's handler, then stamps the link if this event opens it
  // and they didn't cancel it. A mouse press keeps its stamp for the drag or click that follows;
  // any other stamp goes back to the raw href once the browser has read it.
  const on =
    <E extends SyntheticEvent<HTMLAnchorElement>>(handler?: (event: E) => void, opens?: (event: E) => boolean, press?: boolean) =>
    (event: E) => {
      const a = event.currentTarget;
      a.href = href;
      handler?.(event);
      if (!event.defaultPrevented && opens?.(event)) {
        const wrapped = (a.href = knock.wrapLink(href));
        if (!press) setTimeout(() => a.getAttribute('href') === wrapped && (a.href = href));
      }
    };

  return (
    <a
      {...rest}
      ref={ref}
      href={href}
      onClick={on(onClick, () => true)}
      onAuxClick={on(onAuxClick, (event) => event.button === 1)}
      onKeyDown={on(onKeyDown, (event) => event.key === 'Enter')}
      // Mouse only: a touch press may be a long-press for the link menu, and Ctrl-click is a Mac's right-click.
      onPointerDown={on(onPointerDown, (event) => event.button < 2 && event.pointerType === 'mouse' && !event.ctrlKey, true)}
      onContextMenu={on(onContextMenu)}
      onDragEnd={on(onDragEnd)}
    />
  );
});
