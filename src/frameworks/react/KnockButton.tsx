import type { ButtonHTMLAttributes, FocusEventHandler, MouseEventHandler, PointerEventHandler, ReactNode } from 'react';
import { useKnock } from './useKnock.js';

export interface KnockButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Omit to open your workspace's default Knock modal. */
  magicLinkId?: string;
  email?: string;
  children?: ReactNode;
}

/** Loads the scheduling modal on hover or focus, so a click opens it with times already there. */
export function KnockButton({ magicLinkId, email, children, onClick, onPointerEnter, onFocus, ...rest }: KnockButtonProps) {
  const knock = useKnock();

  const prewarm = () => {
    if (magicLinkId) knock.scheduling.load({ magicLinkId, email });
  };
  const handlePointerEnter: PointerEventHandler<HTMLButtonElement> = (event) => {
    onPointerEnter?.(event);
    prewarm();
  };
  const handleFocus: FocusEventHandler<HTMLButtonElement> = (event) => {
    onFocus?.(event);
    prewarm();
  };
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    knock.modal.open({ magicLinkId, email });
  };

  return (
    <button type="button" {...rest} onClick={handleClick} onPointerEnter={handlePointerEnter} onFocus={handleFocus}>
      {children}
    </button>
  );
}
