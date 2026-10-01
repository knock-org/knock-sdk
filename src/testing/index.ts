/**
 * In-memory test double for the `knockai` facade. Zero DOM access — every method
 * just records what was called so tests can assert on it.
 *
 * `installKnockMock`/`uninstallKnockMock` expect `../core` to export
 * `__setKnockForTesting(sdk: KnockSDK | undefined): void`, a test-only hook the
 * framework bindings resolve their singleton through.
 */
import { __setKnockForTesting } from 'knockai';
import type {
  KnockEventMap,
  KnockEventName,
  KnockFieldValue,
  KnockIdentifyTraits,
  KnockInitOptions,
  KnockModalOpenOptions,
  KnockSDK,
  KnockSchedulingHandle,
  KnockSchedulingLoadOptions,
  KnockSchedulingStatus,
} from '../core/types.js';

export type KnockMockCall =
  | { method: 'init'; args: [KnockInitOptions] }
  | { method: 'identify'; args: [KnockIdentifyTraits] }
  | { method: 'track'; args: [string, Record<string, KnockFieldValue> | undefined] }
  | { method: 'modal.open'; args: [KnockModalOpenOptions] }
  | { method: 'modal.close'; args: [] }
  | { method: 'scheduling.load'; args: [KnockSchedulingLoadOptions] }
  | { method: 'scheduling.handle.open'; args: [] }
  | { method: 'scheduling.handle.close'; args: [] }
  | { method: 'widget.show'; args: [] }
  | { method: 'widget.hide'; args: [] }
  | { method: 'widget.open'; args: [] }
  | { method: 'widget.close'; args: [] }
  | { method: 'on'; args: [KnockEventName] };

export interface KnockMock extends KnockSDK {
  /** Every call made against this mock, oldest first. */
  readonly calls: readonly KnockMockCall[];
  /** Traits from the most recent `identify()` call, if any. */
  lastIdentify(): { traits: KnockIdentifyTraits } | undefined;
  /** Properties from every `track(name, …)` call, in call order. */
  eventsNamed(name: string): Array<Record<string, KnockFieldValue> | undefined>;
  /** Fire a handler registered via `on()`, as the real runtime would. */
  emit<E extends KnockEventName>(event: E, payload: KnockEventMap[E]): void;
  /** Forget recorded calls; `on()` subscriptions stay. */
  clearCalls(): void;
}

/** A full, in-memory `KnockSDK` that records every call for assertions. */
export function createKnockMock(): KnockMock {
  const calls: KnockMockCall[] = [];
  const listeners = new Map<KnockEventName, Set<(payload: never) => void>>();

  function record(call: KnockMockCall): void {
    calls.push(call);
  }

  function createSchedulingHandle(): KnockSchedulingHandle {
    let status: KnockSchedulingStatus = 'slots_found';
    return {
      open(): void {
        record({ method: 'scheduling.handle.open', args: [] });
        status = 'slots_found';
      },
      close(): void {
        record({ method: 'scheduling.handle.close', args: [] });
        status = 'closed';
      },
      get status(): KnockSchedulingStatus {
        return status;
      },
    };
  }

  return {
    ready: true,
    version: '0.0.0-mock',
    surface: undefined,
    calls,

    init(options): void {
      record({ method: 'init', args: [options] });
    },

    identify(traits): void {
      record({ method: 'identify', args: [traits] });
    },

    track(eventName, properties): void {
      record({ method: 'track', args: [eventName, properties] });
    },

    modal: {
      open(options = {}): void {
        record({ method: 'modal.open', args: [options] });
      },
      close(): void {
        record({ method: 'modal.close', args: [] });
      },
    },

    scheduling: {
      load(options): KnockSchedulingHandle {
        record({ method: 'scheduling.load', args: [options] });
        return createSchedulingHandle();
      },
    },

    widget: {
      show(): void {
        record({ method: 'widget.show', args: [] });
      },
      hide(): void {
        record({ method: 'widget.hide', args: [] });
      },
      open(): void {
        record({ method: 'widget.open', args: [] });
      },
      close(): void {
        record({ method: 'widget.close', args: [] });
      },
    },

    clearCalls(): void {
      calls.length = 0;
    },

    on<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void {
      record({ method: 'on', args: [event] });
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(handler);
      return () => {
        listeners.get(event)?.delete(handler);
      };
    },

    emit<E extends KnockEventName>(event: E, payload: KnockEventMap[E]): void {
      const set = listeners.get(event);
      if (!set) return;
      // handlers are stored with their per-event type erased to `never`; this is the one
      // place that needs to undo it to actually invoke them.
      for (const handler of set) handler(payload as never);
    },

    lastIdentify() {
      for (let i = calls.length - 1; i >= 0; i -= 1) {
        const call = calls[i];
        if (call?.method === 'identify') {
          return { traits: call.args[0] };
        }
      }
      return undefined;
    },

    eventsNamed(name) {
      const result: Array<Record<string, KnockFieldValue> | undefined> = [];
      for (const call of calls) {
        if (call.method === 'track' && call.args[0] === name) {
          result.push(call.args[1]);
        }
      }
      return result;
    },
  };
}

/** Swap the singleton the framework bindings resolve `knock` through onto `mock`. */
export function installKnockMock(mock: KnockMock): void {
  __setKnockForTesting(mock);
}

/** Restore the framework bindings to the real (queueing) facade singleton. */
export function uninstallKnockMock(): void {
  __setKnockForTesting(undefined);
}
