import type { KnockSchedulingHandle } from './types.js';

/**
 * A `scheduling.load()` handle returned before the runtime exists. Buffers
 * `open`/`close` until `attach()` hands it the real handle from the runtime.
 */
export interface DeferredSchedulingHandle extends KnockSchedulingHandle {
  attach(real: KnockSchedulingHandle): void;
}

/** Dotted path into `window.Knock` (`identify`, `modal.open`, `widget.show`, …). `wrapLink` is only ever live, never queued. */
export type RuntimePath =
  | 'identify'
  | 'track'
  | 'modal.open'
  | 'modal.close'
  | 'scheduling.load'
  | 'widget.show'
  | 'widget.hide'
  | 'widget.open'
  | 'widget.close'
  | 'wrapLink';

export interface QueuedCommand {
  path: RuntimePath;
  args: unknown[];
  /** Only for `scheduling.load`: receives the runtime's real handle. */
  handle?: DeferredSchedulingHandle;
}
