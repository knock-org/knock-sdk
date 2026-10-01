/**
 * Wire protocol: what a conforming runtime sends for `track()` — `POST <ingest>/client/an/v1/product-events`.
 * The facade never touches the network — these shapes bind the runtime (the Knock tag). On the product tag,
 * `identify()` is sent here too, as the reserved `$identify` event.
 */
import type { KnockTagSurface } from './types.js';

/** Retry policy every runtime must implement (posthog-js backoff). Status codes not listed are not retried. */
export const WIRE_RETRY_POLICY = {
  retryOn: [408, 429, 500, 502, 503, 504],
  neverRetryOn: [400, 401, 403],
  maxAttempts: 10,
  /** No HTTP response at all (usually an ad blocker). Offline time doesn't count. */
  maxNetworkAttempts: 3,
  initialBackoffMs: 3000,
  maxBackoffMs: 300_000,
  jitter: 0.25,
  /** `Retry-After` (seconds) is a floor on the next delay, itself capped. */
  maxRetryAfterMs: 30_000,
} as const;

/** The server caps a request body at 64 KB and a batch at 50 events; a 413 halves the batch. */
export const WIRE_BATCH_POLICY = {
  maxEventsPerBatch: 50,
  maxBatchBytes: 64 * 1024,
  flushIntervalMs: 1000,
} as const;

/** Bodies at least this large are gzipped and named in `?e=gzip` (sendBeacon can't set Content-Encoding). */
export const WIRE_COMPRESSION = { param: 'e', format: 'gzip', minBytes: 1024 } as const;

/**
 * Server-enforced event name. The runtime normalizes a vendor's name onto it (`Signed up` → `signed_up`)
 * and a name that can't be normalized is dropped — one invalid event rejects its whole batch.
 */
export const WIRE_EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

export interface KnockWireEvent {
  /** A unique id per event (`[A-Za-z0-9_-]{8,64}`), minted once at call time and identical on every retry. */
  eventId: string;
  /** Normalized to `WIRE_EVENT_NAME_PATTERN`, or the runtime's reserved `$identify` (properties = traits, `email` required). */
  name: string;
  /** ISO-8601 time of the vendor's call, unchanged on retry. The server keeps it only within ±24 h. */
  occurredAt: string;
  /** JSON values, ≤ 3 levels of nesting, ≤ 100 keys, arrays ≤ 50, strings ≤ 1 KB, ~8 KB serialized. */
  properties?: Record<string, unknown>;
}

/** One request: the session context once, then the events. Keys match the tag's analytics rows. */
export interface KnockWireBatch {
  vendorId: string;
  /** Knock's visitor id from `/uid2` (`<uuid>.<mintedAtMs>`) — required; the runtime holds events until it exists. */
  userId: string;
  sessionId: string | null;
  /** Required: the sending tag's id. */
  tagId: string;
  tagVersion: string | null;
  /** Which tag sent the batch; absent from tags that predate it. */
  surface?: KnockTagSurface;
  pageVisit: string | null;
  referrerUrl: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  events: KnockWireEvent[];
}
