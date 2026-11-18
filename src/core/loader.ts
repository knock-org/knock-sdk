import type { KnockEnvironment, KnockSdkBootConfig } from './types.js';
import { tagBuildPath } from './env.js';

const RUNTIME_SCRIPT_ID = 'knockai-runtime';
/** A Knock tag the vendor already pasted: hosted snippet (js.knock-ai.com), CDN build, or self-hosted; not any knock-ai.com script. */
const TAG_SRC = /js\.(stg\.)?knock-ai\.com|knock-tag/;

/** The Knock runtime <script> already in the DOM (booted or still loading), if any. */
export function runtimeScript(): HTMLScriptElement | undefined {
  return [...document.scripts].find((s) => s.id === RUNTIME_SCRIPT_ID || TAG_SRC.test(s.src));
}

/** tagIds of Knock tags that already booted on this page (the Knock tag's own duplicate guard). */
export function bootedTagIds(): string[] {
  return [...(window.__knockTagInstances?.values() ?? [])].map((i) => i.tagId);
}

export function buildScriptUrl(
  environment: KnockEnvironment,
  tagId: string,
  scriptUrl?: string,
): string {
  if (scriptUrl) return scriptUrl;
  return `https://storage.googleapis.com/${tagBuildPath(environment)}/${tagId}/latest/index.js`;
}

/** Informational; the current Knock tag doesn't read it. */
export function writeBootConfig(config: KnockSdkBootConfig): void {
  if (typeof window === 'undefined') return;
  window.__KNOCK_SDK__ = config;
}

/** Adds the runtime <script>, unless one is already there. Returns the one on the page, so init can hear it fail. */
export function injectRuntimeScript(url: string): HTMLScriptElement | undefined {
  if (typeof document === 'undefined') return undefined;
  const existing = runtimeScript();
  if (existing) return existing;
  const script = document.createElement('script');
  script.id = RUNTIME_SCRIPT_ID;
  script.async = true;
  script.src = url;
  return document.head.appendChild(script);
}
