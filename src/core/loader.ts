import type { KnockEnvironment, KnockSdkBootConfig } from './types.js';
import { tagBuildPath } from './env.js';

const RUNTIME_SCRIPT_ID = 'knockai-runtime';
/** A Knock tag the vendor already pasted: hosted snippet (js.knock-ai.com), CDN build, or self-hosted. */
const TAG_SRC = /knock-ai\.com\/|knock-tag/;

/** True when a Knock runtime <script> is already in the DOM (booted or still loading). */
export function hasRuntimeScript(): boolean {
  return [...document.scripts].some((s) => s.id === RUNTIME_SCRIPT_ID || TAG_SRC.test(s.src));
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

export function injectRuntimeScript(url: string): void {
  if (typeof document === 'undefined' || hasRuntimeScript()) return;
  const script = document.createElement('script');
  script.id = RUNTIME_SCRIPT_ID;
  script.async = true;
  script.src = url;
  document.head.appendChild(script);
}
