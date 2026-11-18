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
import type { QueuedCommand, RuntimePath } from './queue.js';
import { LOG_PREFIX, applyCommand, createDeferredSchedulingHandle } from './bridge.js';
import { bootedTagIds, buildScriptUrl, injectRuntimeScript, writeBootConfig } from './loader.js';
import { VERSION } from './version.js';

export type {
  KnockChat,
  KnockChatColors,
  KnockChatOpenEvent,
  KnockChatOpenOptions,
  KnockChatOptions,
  KnockChatPreset,
  KnockChatScreens,
  KnockChatSkin,
  KnockChatTestScenario,
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
export type {
  KnockChatAction,
  KnockChatClient,
  KnockChatConversation,
  KnockChatMessage,
  KnockChatPart,
  KnockChatPerson,
} from './chat-types.js';
export { VERSION } from './version.js';

/** Calls held before the runtime is ready; past this the page is calling faster than Knock can load. */
const MAX_PENDING_COMMANDS = 1000;
const BRIDGED_EVENTS = ['modal:open', 'modal:close', 'widget:open', 'widget:close', 'chat:open', 'chat:close', 'error'] as const;

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
  /** The Knock tag's script failed: the tag will never be ready, and the chat is part of the tag. */
  let tagGone = false;
  /** The tag's chat, asked for once: at the first chat call on a tag whose config has no chat. Its value is the tag's runtime with the chat. */
  let chat: Promise<KnockRuntime | void> | undefined;
  /** Stops the events bridged from the runtime in use. */
  const unbridge: Array<() => void> = [];

  function runtime(): KnockRuntime | undefined {
    return ready && browser() ? window.Knock : undefined;
  }

  // Adds `email` from the last identify() when the caller didn't pass one.
  function withEmail<T extends KnockModalOpenOptions>(options: T): T {
    return options.email || !lastEmail ? options : { ...options, email: lastEmail };
  }

  /** The runtime whose events this SDK listens to. */
  let bridged: KnockRuntime | undefined;
  /** Sends the runtime's events to this SDK's listeners. Again once the tag has added its chat: `window.Knock` is a new object then. */
  function bridge(rt: KnockRuntime): void {
    bridged = rt;
    for (const off of unbridge.splice(0)) off();
    for (const event of BRIDGED_EVENTS) {
      if (event.startsWith('chat:') && !rt.chat) continue; // a tag without the chat does not know these
      const off = rt.on?.(event, (payload) => emitter.emit(event, payload));
      if (typeof off === 'function') unbridge.push(off);
    }
  }

  const noChat = (cause: unknown): void => emitter.emit('error', { message: 'chat failed to load', cause });

  /** Asks the tag for its chat (`Knock.loadChat()`, knock-tag 0.10.1 and later): the tag downloads it then, and only then. */
  function tagChat(rt: KnockRuntime): Promise<KnockRuntime | void> {
    return Promise.resolve(rt.loadChat?.())
      .then(() => {
        const now = window.Knock;
        if (!now?.chat) throw new Error(rt.loadChat ? 'the Knock tag could not load its chat' : 'this Knock tag predates the chat');
        bridge(now);
        return now;
      })
      .catch(noChat);
  }

  function send(command: QueuedCommand): void {
    if (!browser()) return;
    const rt = runtime();
    if (rt && rt !== bridged) bridge(rt); // other code loaded the tag's chat: window.Knock is a new object
    if (!command.path.startsWith('chat.')) {
      if (rt) applyCommand(rt, command, debug);
      else enqueue(command);
    } else if (rt && rt.chat && !chat) applyCommand(rt, command, debug);
    // In order behind the load: a call made while the tag fetches its chat runs after the calls before it.
    else if (rt) void (chat ||= tagChat(rt)).then((now) => now && applyCommand(now, command, debug));
    else if (!tagGone) enqueue(command);
    else if (!chat) chat = Promise.resolve(noChat(new Error('the Knock tag did not load, and the chat is part of it')));
  }

  /** Sends the queue again, in order: at ready, and when the tag is gone (chat calls are dropped with one error, the rest wait). */
  function drain(): void {
    for (const command of pending.splice(0)) {
      try {
        send(command);
      } catch (error) {
        if (debug) console.warn(LOG_PREFIX, command.path, error);
      }
    }
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
    // Subscribe before draining: a queued call can make the runtime emit at once (chat.open → chat:open).
    bridge(rt);
    drain();
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
    // Ahead of every earlier call, so the chat is set up before anything opens it.
    if (options.chat) pending.unshift({ path: 'chat.configure', args: [options.chat] });
    // Never load a second runtime: adopt a tag the vendor already pasted. If it booted first its
    // knock:ready is gone, so attach now; if it's still loading, injectRuntimeScript sees its <script>.
    const tags = bootedTagIds();
    if (tags.length && !tags.includes(options.tagId)) console.warn(LOG_PREFIX, `using Knock tag ${tags} already on the page`);
    if (window.Knock) onReady();
    else {
      window.addEventListener('knock:ready', onReady, { once: true });
      const gone = (): void => {
        tagGone = true;
        drain();
      };
      injectRuntimeScript(buildScriptUrl(environment, options.tagId, options.scriptUrl))?.addEventListener('error', gone);
    }
    if (debug) console.log(LOG_PREFIX, 'initialized', window.__KNOCK_SDK__);
  }

  // `widget.*` and `chat.*`: each method forwards its arguments to the same path on the runtime.
  function group<M extends string>(name: 'widget' | 'chat', methods: M[]): Record<M, (...args: unknown[]) => void> {
    const target = {} as Record<M, (...args: unknown[]) => void>;
    for (const method of methods) target[method] = (...args) => send({ path: `${name}.${method}` as RuntimePath, args });
    return target;
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
    widget: group('widget', ['show', 'hide', 'open', 'close']),
    chat: group('chat', ['open', 'close', 'setSkin', 'resetSkin', 'configure']),
    wrapLink(url: string): string {
      const rt = runtime();
      try {
        return (rt && (applyCommand(rt, { path: 'wrapLink', args: [url] }, debug) as string)) || url;
      } catch {
        return url;
      }
    },
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
