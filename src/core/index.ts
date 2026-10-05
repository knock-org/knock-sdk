import type {
  KnockEventMap,
  KnockEventName,
  KnockFieldValue,
  KnockIdentifyTraits,
  KnockInitOptions,
  KnockModalOpenOptions,
  KnockRuntime,
  KnockSDK,
  KnockSchedulingHandle,
  KnockSchedulingLoadOptions,
  KnockTagSurface,
} from './types.js';
import { Emitter } from './emitter.js';
import type { QueuedCommand } from './queue.js';
import { applyCommand, createDeferredSchedulingHandle } from './bridge.js';
import { bootedTagIds, buildScriptUrl, injectRuntimeScript, writeBootConfig } from './loader.js';
import { VERSION } from './version.js';

export type {
  KnockEnvironment,
  KnockEventMap,
  KnockEventName,
  KnockFieldValue,
  KnockIdentifyTraits,
  KnockInitOptions,
  KnockModalOpenOptions,
  KnockRuntime,
  KnockSDK,
  KnockSchedulingHandle,
  KnockSchedulingLoadOptions,
  KnockSchedulingStatus,
  KnockSchedulingStatusChange,
  KnockSdkBootConfig,
  KnockTagSurface,
} from './types.js';
export { VERSION } from './version.js';

const LOG_PREFIX = '[knockai]';
/** Calls held before the runtime is ready; past this the page is calling faster than Knock can load. */
const MAX_PENDING_COMMANDS = 1000;
const BRIDGED_EVENTS = ['modal:open', 'modal:close', 'widget:open', 'widget:close', 'error'] as const;
type WidgetMethod = 'show' | 'hide' | 'open' | 'close';

function browser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Builds one independent KnockSDK instance: its own queue, emitter and ready
 * state. Use this in tests, or when a page legitimately needs two instances;
 * everyday code should use the `knock` singleton below instead.
 */
export function createKnock(): KnockSDK {
  let initialized = false;
  let ready = false;
  let debug = false;
  let lastEmail: string | undefined;
  let surface: KnockTagSurface | undefined;
  const emitter = new Emitter<KnockEventMap>();
  const pending: QueuedCommand[] = [];

  function runtime(): KnockRuntime | undefined {
    return ready && browser() ? window.Knock : undefined;
  }

  // Adds `email` from the last identify() when the caller didn't pass one.
  function withEmail<T extends KnockModalOpenOptions>(options: T): T {
    return options.email || !lastEmail ? options : { ...options, email: lastEmail };
  }

  function send(command: QueuedCommand): void {
    if (!browser()) return;
    const rt = runtime();
    if (rt) applyCommand(rt, command, debug);
    else enqueue(command);
  }

  function enqueue(command: QueuedCommand): void {
    if (pending.length < MAX_PENDING_COMMANDS) pending.push(command);
    else if (debug) console.warn(LOG_PREFIX, `${MAX_PENDING_COMMANDS} calls queued before Knock loaded — ${command.path} dropped`);
  }

  function onReady(): void {
    if (ready) return;
    ready = true;
    const rt = runtime();
    if (!rt) {
      if (debug) console.warn(LOG_PREFIX, 'ready without window.Knock');
      return;
    }
    if (rt.surface === 'website' || rt.surface === 'product') surface = rt.surface;
    for (const command of pending.splice(0)) {
      try {
        applyCommand(rt, command, debug);
      } catch (error) {
        if (debug) console.warn(LOG_PREFIX, command.path, error);
      }
    }
    for (const event of BRIDGED_EVENTS) rt.on?.(event, (payload) => emitter.emit(event, payload));
    emitter.emit('ready', undefined);
  }

  function init(options: KnockInitOptions): void {
    if (!browser()) return;
    if (initialized) {
      console.warn(LOG_PREFIX, 'init() called twice — ignored');
      return;
    }
    initialized = true;
    debug = !!options.debug;
    const environment = options.environment ?? 'production';
    writeBootConfig({
      protocolVersion: 1,
      sdkVersion: VERSION,
      tagId: options.tagId,
      environment,
      debug,
    });
    // Never load a second runtime: adopt a tag the vendor already pasted. If it booted first its
    // knock:ready is gone, so attach now; if it's still loading, injectRuntimeScript sees its <script>.
    const tags = bootedTagIds();
    if (tags.length && !tags.includes(options.tagId)) console.warn(LOG_PREFIX, `using Knock tag ${tags} already on the page`);
    if (window.Knock) onReady();
    else {
      window.addEventListener('knock:ready', onReady, { once: true });
      injectRuntimeScript(buildScriptUrl(environment, options.tagId, options.scriptUrl));
    }
    if (debug) console.log(LOG_PREFIX, 'initialized', window.__KNOCK_SDK__);
  }

  const widget = {} as Record<WidgetMethod, () => void>;
  for (const method of ['show', 'hide', 'open', 'close'] as const) {
    widget[method] = () => send({ path: `widget.${method}`, args: [] });
  }

  return {
    init,
    identify(traits: KnockIdentifyTraits): void {
      lastEmail = traits.email;
      send({ path: 'identify', args: [traits] });
    },
    track(eventName: string, properties?: Record<string, KnockFieldValue>): void {
      send({ path: 'track', args: [eventName, properties] });
    },
    modal: {
      open: (options: KnockModalOpenOptions = {}) => send({ path: 'modal.open', args: [withEmail(options)] }),
      close: () => send({ path: 'modal.close', args: [] }),
    },
    scheduling: {
      load(options: KnockSchedulingLoadOptions): KnockSchedulingHandle {
        if (!browser()) return { open() {}, close() {}, status: 'loading' };
        const resolved = withEmail(options);
        const rt = runtime();
        if (rt) return rt.scheduling.load(resolved);
        const handle = createDeferredSchedulingHandle();
        enqueue({ path: 'scheduling.load', args: [resolved], handle });
        return handle;
      },
    },
    widget,
    on<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void {
      if (!browser()) return () => {};
      if (event !== 'ready' || !ready) return emitter.on(event, handler);
      // `ready` already fired: a late subscriber still gets it, once, unless it unsubscribes first.
      let live = true;
      queueMicrotask(() => live && handler(undefined as KnockEventMap[E]));
      return () => void (live = false);
    },
    get ready() {
      return ready;
    },
    get version() {
      return VERSION;
    },
    get surface() {
      return surface;
    },
  };
}

const realKnock = createKnock();
let activeKnock: KnockSDK = realKnock;

/**
 * The shared `knock` instance. Property reads resolve through `activeKnock` at
 * access time, so `__setKnockForTesting` can redirect every framework binding
 * without any of them re-importing anything.
 */
export const knock: KnockSDK = new Proxy({} as KnockSDK, {
  // `__knockai` marks the facade so the CDN stub never mistakes it for a host page's own `window.knock`.
  get: (_, key) => (key === '__knockai' ? true : Reflect.get(activeKnock, key)),
});

export default knock;

/**
 * Test-only hook: redirects the `knock` singleton to `sdk` (e.g. a
 * `createKnockMock()` from `@knock-ai/sdk/testing`), or back to the real SDK when
 * called with `undefined`.
 */
export function __setKnockForTesting(sdk: KnockSDK | undefined): void {
  activeKnock = sdk ?? realKnock;
}
