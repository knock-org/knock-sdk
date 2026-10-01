/** Shared by the CDN stub and the IIFE facade. No side effects — importing it must never install anything. */

/**
 * Replayed by the IIFE in order: `path` is called on the facade with `args` and `bind` gets its return value;
 * a function `path` (a handle op queued before load) is just called.
 */
export type StubCall = [path: string | (() => void), args: unknown[], bind?: (result: unknown) => void];

export interface KnockStub {
  q: StubCall[];
  [key: string]: unknown;
}

declare global {
  interface Window {
    /** The public global: `knock.identify(...)`. Left alone if the page already owns `window.knock`. */
    knock?: KnockStub | unknown;
    /** Permanent alias — always ours, so it works even when `window.knock` is taken. */
    knockai?: KnockStub | unknown;
  }
}

export function isStub(value: unknown): value is KnockStub {
  return !!value && Array.isArray((value as KnockStub).q);
}

/** True for our stub or our facade — anything else on `window.knock` belongs to the host page. */
export function isKnockGlobal(value: unknown): boolean {
  return !value || isStub(value) || (value as { __knockai?: true }).__knockai === true;
}
