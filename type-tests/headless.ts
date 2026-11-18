// A vendor's headless chat against the built package: each line under @ts-expect-error fails, the line above it passes.
import { knock } from '@knock-ai/sdk';
import type { KnockChatClient, KnockChatColors, KnockChatPart } from '@knock-ai/sdk';

const seen: string[] = [];

function draw(chat: KnockChatClient, part: KnockChatPart): void {
  if (part.type === 'image') seen.push(part.url);
  // @ts-expect-error there is no video part
  if (part.type === 'video') seen.push('video');

  switch (part.type) {
    case 'image':
      seen.push(part.alt);
      break;
    case 'text':
      seen.push(part.text);
      // @ts-expect-error a text part has no url
      seen.push(part.url);
      break;
    case 'actions':
      for (const action of part.actions) {
        const kind: string = action.kind;
        seen.push(kind, action.label);
        chat.resolveAction(action.id);
        // @ts-expect-error an action is named by its id
        chat.resolveAction(action);
      }
      break;
    case 'joined':
      break;
    default: {
      const unhandled: never = part;
      throw new Error(`unknown part ${String(unhandled)}`);
    }
  }
}

function use(chat: KnockChatClient): void {
  const sent: boolean = chat.send('hi');
  // @ts-expect-error a message is text
  chat.send(42);

  const state = chat.getState();
  const count: number = state.messages.length;
  // @ts-expect-error the messages are read-only
  state.messages.length = 0;

  const message = state.messages[0];
  if (!message) return;
  const failed: boolean = message.status === 'failed';
  // @ts-expect-error a message is 'sending', 'sent' or 'failed'
  const pending: boolean = message.status === 'pending';
  chat.retry(message.id);
  // @ts-expect-error retry names the message
  chat.retry();

  for (const part of message.parts) draw(chat, part);
  seen.push(String(sent), String(count), String(failed), String(pending));
}

knock.init({ tagId: 'tag_1', chat: { headless: use } });
knock.chat.configure({ headless: null });
// @ts-expect-error headless is a function
knock.init({ tagId: 'tag_1', chat: { headless: true } });

// The pictures: a URL string, or null to clear it.
knock.chat.configure({ agentImageUrl: '/team/ava.png', skin: { assets: { bubble: 'https://cdn.example.com/logo.png' } } });
knock.chat.configure({ agentImageUrl: null });
knock.chat.setSkin({ assets: { bubble: null } });
// @ts-expect-error the agent's picture is a URL string
knock.chat.configure({ agentImageUrl: 42 });
// @ts-expect-error the bubble's picture is a URL string
knock.chat.setSkin({ assets: { bubble: 42 } });
knock.chat.setSkin({ assets: { wall: '/images/pattern.png', header: 'https://cdn.example.com/logo.svg' } });
knock.chat.setSkin({ assets: { wall: null, header: null } });
// @ts-expect-error the wall's picture is a URL string
knock.chat.setSkin({ assets: { wall: 42 } });
// @ts-expect-error the header's logo is a URL string
knock.chat.setSkin({ assets: { header: true } });
// @ts-expect-error assets names three places: bubble, wall and header
knock.chat.setSkin({ assets: { footer: '/logo.png' } });

// The colours: a hex string per token; colorsDark: null derives the dark palette.
const colors: KnockChatColors = { bg: '#FFFFFF', text: '#14161C', border: '#D0D5DD' };
knock.chat.setSkin({ colors, colorsDark: null, shape: { borderWidth: 2 } });
knock.chat.setSkin({ preset: 'nightshift', colorsLight: { brand: '#B07400' } });
// @ts-expect-error a colour is a string
knock.chat.setSkin({ colors: { bg: 0xffffff } });
// @ts-expect-error colors names the chat's tokens: bg, not background
knock.chat.setSkin({ colors: { background: '#FFFFFF' } });
