/**
 * The copy-paste CDN stub. It defines `window.knock` (+ `window.knockai`) as a queue-only stand-in and loads the real
 * facade (`dist/knockai.iife.js`, the same tested core the npm package ships) which then replaces
 * the stub and replays the queue in order. Nothing here talks to the runtime directly.
 *
 * Built standalone by tsup; README/quickstart inline the compiled output verbatim.
 */
import type { KnockSchedulingHandle } from './types.js';
import { isKnockGlobal, type KnockStub, type StubCall } from './globals.js';

const FACADE_URL = 'https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/dist/knockai.iife.js';
const PATHS = [
  'init',
  'identify',
  'track',
  'modal.open',
  'modal.close',
  'widget.show',
  'widget.hide',
  'widget.open',
  'widget.close',
];

(function installStub(): void {
  if (typeof window === 'undefined' || window.knockai) return;
  const ownsKnock = isKnockGlobal(window.knock);

  const q: StubCall[] = [];
  const stub: KnockStub = { q, ready: false };

  for (const path of PATHS) {
    const [head, tail] = path.split('.') as [string, string?];
    const fn = (...args: unknown[]) => void q.push([path, args]);
    if (tail) ((stub[head] ??= {}) as Record<string, unknown>)[tail] = fn;
    else stub[head] = fn;
  }

  stub['on'] = (...args: unknown[]): (() => void) => {
    let off: (() => void) | undefined;
    const call: StubCall = ['on', args, (real) => (off = real as () => void)];
    q.push(call);
    // Unsubscribed before the facade loaded: the replay skips a path that isn't a facade method.
    return () => (off ? off() : void (call[0] = ''));
  };

  stub['scheduling'] = {
    load(...args: unknown[]): KnockSchedulingHandle {
      let real: KnockSchedulingHandle | undefined;
      q.push(['scheduling.load', args, (handle) => (real = handle as KnockSchedulingHandle)]);
      const op = (method: 'open' | 'close') => () => (real ? real[method]() : q.push([() => real![method](), []]));
      return {
        open: op('open'),
        close: op('close'),
        get status() {
          return real ? real.status : 'loading';
        },
      };
    },
  };

  window.knockai = stub;
  if (ownsKnock) window.knock = stub;
  else console.warn('[knockai] window.knock is taken by this page — use window.knockai instead');

  const script = document.createElement('script');
  script.async = true;
  script.src = (document.currentScript as HTMLScriptElement | null)?.dataset['knockaiSrc'] ?? FACADE_URL;
  document.head.appendChild(script);
})();
