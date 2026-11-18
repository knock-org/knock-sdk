/**
 * The conversation as a vendor's own chat UI gets it. This file is the one definition of these types: it imports
 * nothing and names nothing of the DOM, so knock-sdk compiles a copy of it as it is.
 */

/** The page's one conversation as data, and what the visitor can do in it. */
export interface KnockChatClient {
  /** The conversation now. The same object until something in it changes, so it works with useSyncExternalStore. */
  getState(): KnockChatConversation;
  /** Calls `listener` once after each change. Returns a function that stops it. */
  subscribe(listener: () => void): () => void;
  /** Sends a visitor message. False (nothing sent) when the text is empty after trimming, longer than 4,000 characters, or the status is 'unavailable'. */
  send(text: string): boolean;
  /** Sends a 'failed' visitor message again. */
  retry(messageId: string): void;
  /** Runs an action of an 'actions' part. Call it inside the visitor's click. */
  resolveAction(actionId: string): void;
}

export interface KnockChatConversation {
  /**
   * 'connecting': the history is loading. 'reconnecting': the live stream dropped; messages still go and come.
   * 'unavailable': the chat is off or blocked on this site. 'ready': everything else.
   */
  status: 'ready' | 'connecting' | 'reconnecting' | 'unavailable';
  messages: readonly KnockChatMessage[];
  /** Who is typing: the agent or a rep. */
  typing: KnockChatPerson | null;
  /** Suggested first messages. Empty after the visitor's first message. */
  starters: readonly string[];
  /** Messages from the agent or a rep that arrived while your UI was closed. */
  unread: number;
}

/** One run of parts from one author. A long reply can arrive as more than one message: group by author. */
export interface KnockChatMessage {
  /** Stable. A visitor message keeps its id from 'sending' to 'sent'. */
  id: string;
  /** Within one snapshot the same person is the same object: group messages with ===. */
  author: KnockChatPerson;
  /** Sent at, ms since epoch. */
  at: number;
  /** Render the part types you know and skip any other: later versions can add types. */
  parts: readonly KnockChatPart[];
  /** Visitor messages: 'sending' until Knock has it, 'failed' when it gave up (retry(id)). Every other message: 'sent'. */
  status: 'sending' | 'sent' | 'failed';
  /** A rep edited it. */
  edited: boolean;
}

export type KnockChatPart =
  /** Markdown for the agent and reps, plain text for the visitor. Never insert it as raw HTML. */
  | { type: 'text'; text: string }
  /** An http(s) URL. */
  | { type: 'image'; url: string; alt: string }
  | { type: 'actions'; actions: readonly KnockChatAction[] }
  /** The author, a rep, joined the conversation here. */
  | { type: 'joined' };

export interface KnockChatAction {
  id: string;
  label: string;
  primary: boolean;
  /** What the action does: 'book-a-meeting' today. Draw a kind you do not know as a plain button. */
  kind: string;
}

export interface KnockChatPerson {
  kind: 'visitor' | 'agent' | 'rep';
  /** The agent's or the rep's name. null for the visitor. */
  name: string | null;
  imageUrl: string | null;
}
