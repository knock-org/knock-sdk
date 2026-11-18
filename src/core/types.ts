/**
 * Public contract of the `@knock-ai/sdk` SDK. Everything the vendor's code can call is
 * declared here; the runtime (the Knock tag, loaded from Knock's CDN) implements it.
 * Keep this file dependency-free and DOM-agnostic: it is shared by the core and
 * every framework binding.
 */

import type { KnockChatClient } from './chat-types.js';

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
  /** Sets up the Knock chat before it shows. The same as calling `knock.chat.configure()` first. */
  chat?: KnockChatOptions;
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

/** A scripted conversation for the chat's test mode. */
export type KnockChatTestScenario =
  | 'default'
  | 'returning'
  | 'rep'
  | 'booking'
  | 'media'
  | 'edited'
  | 'send-fails'
  | 'rate-limited'
  | 'session-expired'
  | 'offline'
  | 'no-stream'
  | 'disabled'
  | 'origin-blocked'
  | 'captcha';

export interface KnockChatOpenOptions {
  /** Opens this screen of the chat. */
  screen?: string;
  /** Pre-fills the message box. */
  message?: string;
  /** Sends this message for the visitor. Sent once per conversation. */
  send?: string;
  /**
   * Moves the chat to this magic link: it stays there for later `open()` calls until another link is
   * set. Each link has its own conversation. In test mode it only names the scripted conversation.
   */
  magicLinkId?: string;
}

/**
 * A click event from the DOM or a framework, so `onClick={knock.chat.open}` and `@click="knock.chat.open"`
 * work as they are. The chat ignores it and opens as `open()` does.
 */
export interface KnockChatOpenEvent {
  readonly type: string;
  preventDefault(): void;
}

/** Names of the chat's built-in looks. Other names are passed through to the chat as they are. */
export type KnockChatPreset = 'harbor' | 'nightshift' | 'fieldbook' | 'signal' | 'terminal' | 'pixel';

type KnockChatSkinGroup = { [key: string]: unknown };

/**
 * The chat's colours, each a hex colour like `'#2346D8'`. A key you set replaces the look's value;
 * a key you leave out keeps the look's.
 */
export interface KnockChatColors {
  /** Your main colour: buttons and, in most looks, the visitor's bubble and the launcher. */
  brand?: string;
  /** Text and icons on `brand`. */
  onBrand?: string;
  /** Links and brand-coloured text on the chat's surfaces. */
  brandInk?: string;
  /** The chat's background. */
  bg?: string;
  /** Menus, cards, chips and code blocks. */
  surface?: string;
  /** Hovered items, table headers and day stamps. */
  surfaceRaised?: string;
  /** The main text. */
  text?: string;
  /** Secondary text: times, hints and placeholders. */
  textMuted?: string;
  /** Borders and dividers. Their width is `shape.borderWidth`. */
  border?: string;
  /** The visitor's bubble. */
  userBubble?: string;
  /** Text in the visitor's bubble. */
  userBubbleText?: string;
  /** The agent's bubble. */
  agentBubble?: string;
  /** Text in the agent's bubble. */
  agentBubbleText?: string;
  /** Unread badges and dots. */
  accent?: string;
  /** Text and icons on `accent`. */
  onAccent?: string;
  /** Success marks, such as a check or the live dot. */
  positive?: string;
  /** The keyboard focus outline. */
  focusRing?: string;
  /** The launcher bubble. */
  launcherBg?: string;
  /** The icon and label on the launcher bubble. */
  launcherFg?: string;
  /** The header's background. */
  headerBg?: string;
  /** Text and buttons in the header. */
  headerFg?: string;
}

/** How the chat looks. Each key you set replaces that part of the look; the chat fills in the rest. */
export interface KnockChatSkin {
  /** A built-in look to start from. A skin that names a preset drops the look set in your Knock tag. */
  preset?: KnockChatPreset | (string & {});
  mode?: 'light' | 'dark' | 'auto';
  colors?: KnockChatColors;
  /** The dark palette. `null` makes the chat derive one from `colors.brand`. */
  colorsDark?: KnockChatColors | null;
  /** The light palette of a dark look (`nightshift`), shown in light mode. */
  colorsLight?: KnockChatColors | null;
  typography?: KnockChatSkinGroup;
  shape?: KnockChatSkinGroup;
  layout?: KnockChatSkinGroup;
  bubble?: KnockChatSkinGroup;
  motion?: KnockChatSkinGroup;
  direction?: 'ltr' | 'rtl';
  responsive?: KnockChatSkinGroup;
  /**
   * Pictures by URL, one per place: each an `https://` or `http://` URL, or a path on your site.
   * Anything else is ignored. Without one, or when it fails to load, the place shows what it shows
   * with no picture. `null` clears it.
   * - `bubble`: the bubble's picture, in place of its icon.
   * - `wall`: the conversation's background, drawn as a soft pattern from the picture's shape. A
   *   picture from another origin needs CORS.
   * - `header`: your logo, in the header in place of the agent's picture.
   */
  assets?: { bubble?: string | null; wall?: string | null; header?: string | null };
  [key: string]: unknown;
}

/** The chat's screens: which one it starts on, how the visitor moves between them, and what each shows. */
export interface KnockChatScreens {
  start?: string;
  nav?: 'none' | 'menu' | 'tabs';
  items?: Array<{ id: string; [key: string]: unknown }>;
}

/** Each key you pass replaces that key; `skin: null` clears the look set from code. Keys you leave out stay as they are. */
export interface KnockChatOptions {
  /** The look: colours, type, shape, layout, bubble, motion, direction and your pictures. */
  skin?: KnockChatSkin | null;
  /** What opens the chat: its bubble, your page's buttons, or both. Default `'both'`. */
  launcher?: 'bubble' | 'buttons' | 'both';
  screens?: KnockChatScreens;
  /** Up to 4 suggested first messages. */
  starters?: string[];
  brandName?: string;
  agentName?: string;
  /**
   * The AI agent's picture, in the header and beside its messages: an `https://` or `http://` URL, or
   * a path on your site. Anything else is ignored. Without it, or when it fails to load, the agent
   * shows the first letter of `brandName`, else the spark icon. `null` clears it.
   */
  agentImageUrl?: string | null;
  /**
   * The magic link the chat runs on, instead of the one set in your Knock tag. Setting it moves the
   * chat to that link, even after `open()` moved it to another one; `null` goes back to the tag's
   * link. Each link has its own conversation. The link must belong to your workspace.
   */
  magicLinkId?: string | null;
  /**
   * Test mode: the chat runs a scripted conversation instead of your live chat. `true` runs the
   * `'default'` scenario. Once on, it stays on for the page; `false` doesn't turn it off.
   */
  test?: boolean | KnockChatTestScenario;
  /**
   * Shows the chat inside this element of your page instead of floating over it. The chat fills the
   * element and is always shown: no bubble and no close button, styled by your skin. Give the
   * element a height. A string is a CSS selector. It is looked up when you set it and when the chat
   * loads. Set `container` again to move the chat (after a route change, for example): the
   * conversation stays. `null` goes back to the floating chat.
   */
  container?: Element | string | null;
  /**
   * Your own chat UI. Knock renders nothing and downloads no UI (no React, no styles): only the
   * conversation. Your function is called with the chat client when the chat has loaded. Set it
   * before the chat loads, in `init({ chat })`; once on, it stays on for the page. `null` clears
   * it before the chat loads.
   */
  headless?: ((chat: KnockChatClient) => void) | null;
}

/**
 * The Knock chat. When your Knock tag has the chat, the SDK uses it. When it has none, the SDK loads and runs the chat
 * itself. A page never shows two chats.
 */
export interface KnockChat {
  /** Opens the chat. Also takes a click event, so you can pass it straight to `onClick`. */
  open(options?: KnockChatOpenOptions | KnockChatOpenEvent): void;
  close(): void;
  /** Replaces the look you set from code. */
  setSkin(skin: KnockChatSkin): void;
  /** Drops the look you set from code, back to your Knock tag's. */
  resetSkin(): void;
  configure(options: KnockChatOptions): void;
}

export interface KnockEventMap {
  /** Fires once. A handler added after that still runs, once. */
  ready: void;
  /** `magicLinkId` is null for the default Knock modal. */
  'modal:open': { magicLinkId: string | null };
  'modal:close': { magicLinkId: string | null };
  'widget:open': void;
  'widget:close': void;
  /** `test` is true while the chat runs in test mode. */
  'chat:open': { test: boolean };
  'chat:close': { test: boolean };
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
  chat: KnockChat;
  on<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void;
  /**
   * Returns `url` with the visitor's Knock identity added, so a Knock chat opened from it knows who
   * they are. Call it when the visitor opens the link (on click and middle-click), not when you
   * render it, and put the plain URL back right after, so a copied link stays clean. Before your
   * Knock tag is ready, on the server, or on a tag that predates it, it returns `url` unchanged.
   * Synchronous; never throws, never queued. In React, `<KnockLink href={url}>` does all of this.
   *
   * @example
   * link.onclick = () => {
   *   link.href = knock.wrapLink(url);
   *   setTimeout(() => (link.href = url));
   * };
   * window.open(knock.wrapLink(url));
   */
  wrapLink(url: string): string;
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
  /** On a tag whose config turns the chat on, and on any tag after `loadChat()`. */
  chat?: KnockChat;
  /** Loads the tag's chat on a tag whose config has none: `chat` is there once it resolves. Absent on tags that predate it (0.10.0 and earlier). */
  loadChat?(): Promise<KnockChat | undefined>;
  on?<E extends KnockEventName>(event: E, handler: (payload: KnockEventMap[E]) => void): () => void;
  /** `url` with the visitor's identity added. Absent on tags that predate it. */
  wrapLink?(url: string): string;
  /** The visitor's id. */
  getUID?(): string;
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
  /** The DOM's own `Element`. Named here so these types also compile without the DOM lib. */
  interface Element {}
}
