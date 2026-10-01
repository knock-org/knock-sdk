/**
 * Public contract of the `knockai` SDK. Everything the vendor's code can call is
 * declared here; the runtime (the Knock tag, loaded from Knock's CDN) implements it.
 * Keep this file dependency-free and DOM-agnostic: it is shared by the core and
 * every framework binding.
 */

export type KnockEnvironment = 'production' | 'staging' | 'development';

/** Which of the vendor's two Knock tags is loaded: the website tag or the product tag. */
export type KnockTagSurface = 'website' | 'product';

/** Dates are sent as ISO strings. */
export type KnockFieldValue = string | number | boolean | Date | string[] | null;

export interface KnockInitOptions {
  /** Your Knock tag id — your website tag's on a marketing site, your product tag's in a logged-in app. */
  tagId: string;
  /** For Knock's own testing. Leave unset. */
  environment?: KnockEnvironment;
  /** Logs the SDK's own warnings (dropped calls, a method the loaded tag doesn't have) to the console. */
  debug?: boolean;
  /** Load the Knock tag from this URL instead of Knock's default location. */
  scriptUrl?: string;
}

export interface KnockIdentifyTraits {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  [customField: string]: KnockFieldValue | undefined;
}

export interface KnockModalOpenOptions {
  /** The scheduling modal for this magic link. Omit it to open your workspace's default Knock modal. */
  magicLinkId?: string;
  /** Pre-fills the scheduling modal so it starts finding times immediately. Only used together with `magicLinkId`. */
  email?: string;
}

export type KnockSchedulingStatus =
  | 'loading'
  | 'email_submitted'
  | 'slots_found'
  | 'no_slots_found'
  | 'booked'
  | 'pending_confirmation'
  | 'error'
  | 'closed';

export interface KnockSchedulingStatusChange {
  status: KnockSchedulingStatus;
  magicLinkId: string;
  /** Once an email is known — passed to `load()`, or typed into the modal. */
  email?: string;
  /** `slots_found`: how many bookable times came back, and the earliest. */
  slots?: { count: number; first: string | null };
  /** `booked`: the confirmed meeting. `pending_confirmation`: only a requested time — not a booking yet. */
  meeting?: { startDateTime: string; endDateTime: string };
  /** `no_slots_found`: `disqualified` or `no_slots`. */
  reason?: string;
  /** `error`: what went wrong. */
  message?: string;
}

export interface KnockSchedulingLoadOptions {
  magicLinkId: string;
  email?: string;
  onStatusChange?: (change: KnockSchedulingStatusChange) => void;
}

export interface KnockSchedulingHandle {
  open(): void;
  close(): void;
  readonly status: KnockSchedulingStatus;
}

export interface KnockEventMap {
  /** Fires once. A handler added after that still runs, once. */
  ready: void;
  /** `magicLinkId` is null for the default Knock modal. */
  'modal:open': { magicLinkId: string | null };
  'modal:close': { magicLinkId: string | null };
  'widget:open': void;
  'widget:close': void;
  error: { message: string; cause?: unknown };
}

export type KnockEventName = keyof KnockEventMap;

export interface KnockSDK {
  init(options: KnockInitOptions): void;
  identify(traits: KnockIdentifyTraits): void;
  track(eventName: string, properties?: Record<string, KnockFieldValue>): void;
  modal: { open(options?: KnockModalOpenOptions): void; close(): void };
  scheduling: { load(options: KnockSchedulingLoadOptions): KnockSchedulingHandle };
  widget: { show(): void; hide(): void; open(): void; close(): void };
  on<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void;
  /** True once the runtime has loaded and drained the queue. */
  readonly ready: boolean;
  readonly version: string;
  /** The loaded tag's surface; `undefined` before ready, or on a tag that predates it. */
  readonly surface: KnockTagSurface | undefined;
}

/** What the loaded runtime (the Knock tag, website or product) must expose on `window.Knock`. */
export interface KnockRuntime {
  /** Absent on tags that predate it. */
  surface?: KnockTagSurface;
  identify(traits: Record<string, unknown>): void;
  track?(eventName: string, properties?: Record<string, unknown>): void;
  scheduling: { load(options: KnockSchedulingLoadOptions): KnockSchedulingHandle };
  modal?: { open(options?: KnockModalOpenOptions): void; close(): void };
  widget?: { show(): void; hide(): void; open(): void; close(): void };
  on?<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void;
}

/** What the SDK writes to `window.__KNOCK_SDK__` on `init()`. Informational; the current Knock tag doesn't read it. */
export interface KnockSdkBootConfig {
  protocolVersion: 1;
  sdkVersion: string;
  tagId: string;
  environment: KnockEnvironment;
  debug: boolean;
}

declare global {
  interface Window {
    Knock?: KnockRuntime;
    __KNOCK_SDK__?: KnockSdkBootConfig;
    /** The Knock tag's own duplicate guard: one entry per booted `tagId:vendorId`. */
    __knockTagInstances?: Map<string, { tagId: string; vendorId: string; initialized?: boolean }>;
  }
}
