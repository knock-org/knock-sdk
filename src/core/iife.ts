/**
 * Browser global build (`dist/knockai.iife.js`). Loaded by the CDN stub in `snippet.ts`: replays the
 * stub's queue through the real facade, then exposes the facade as `window.knock` (unless the page
 * owns that name) and always as `window.knockai`.
 */
import { knock } from './index.js';
import { isKnockGlobal, isStub, type StubCall } from './globals.js';

function call([path, args, bind]: StubCall): void {
  if (typeof path === 'function') return path();
  const [head, tail] = path.split('.') as [string, string?];
  const target = tail ? Reflect.get(knock, head) : knock;
  const fn = Reflect.get(target as object, tail ?? head);
  if (typeof fn !== 'function') return;
  const result: unknown = fn.apply(target, args);
  if (bind) bind(result);
}

function replay(calls: StubCall[]): void {
  for (const queued of calls) {
    try {
      call(queued);
    } catch {
      // One bad call (e.g. init() with no options) must not drop the calls queued after it.
    }
  }
}

// Loaded twice: keep the SDK that's already live (and its queue, subscriptions and ready state).
if (typeof window !== 'undefined' && !(window.knockai as { __knockai?: true } | undefined)?.__knockai) {
  const stub = [window.knockai, window.knock].find(isStub);
  const ownsKnock = isKnockGlobal(window.knock);
  window.knockai = knock;
  if (ownsKnock) window.knock = knock;
  if (stub) replay(stub.q);
}

export { knock as default };
