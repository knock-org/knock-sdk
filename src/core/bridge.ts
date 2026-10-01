import type { KnockRuntime, KnockSchedulingHandle, KnockSchedulingLoadOptions } from './types.js';
import type { DeferredSchedulingHandle, QueuedCommand } from './queue.js';

const LOG_PREFIX = '[knockai]';

/** Returned synchronously from `scheduling.load()` before the runtime exists. */
export function createDeferredSchedulingHandle(): DeferredSchedulingHandle {
  let real: KnockSchedulingHandle | undefined;
  let pending: 'open' | 'close' | undefined;

  return {
    attach(handle) {
      real = handle;
      if (pending) handle[pending]();
    },
    open() {
      real ? real.open() : (pending = 'open');
    },
    close() {
      real ? real.close() : (pending = 'close');
    },
    get status() {
      return real ? real.status : 'loading';
    },
  };
}

function resolve(runtime: KnockRuntime, path: string): { fn: unknown; self: unknown } {
  const [head, tail] = path.split('.');
  const self = tail ? Reflect.get(runtime, head!) : runtime;
  return { self, fn: self ? Reflect.get(self as object, tail ?? head!) : undefined };
}

/** Applies one queued (or live) command against the loaded runtime. */
export function applyCommand(runtime: KnockRuntime, command: QueuedCommand, debug: boolean): void {
  const { path, args } = command;
  const { fn, self } = resolve(runtime, path);

  if (typeof fn === 'function') {
    const result = fn.apply(self, args) as KnockSchedulingHandle;
    if (command.handle) command.handle.attach(result);
    return;
  }
  // No dedicated modal in this runtime build — scheduling.load(...).open() is the fallback.
  if (path === 'modal.open') {
    runtime.scheduling.load(args[0] as KnockSchedulingLoadOptions).open();
    return;
  }
  if (debug) console.warn(LOG_PREFIX, `no runtime ${path} — ignored`);
}
