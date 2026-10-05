import { InjectionToken } from '@angular/core';
import type { KnockSDK } from '@knock-ai/sdk';
import { knock } from '@knock-ai/sdk';

/** `inject(KNOCK)` returns the shared `knock` instance. A runtime token, so it needs no Angular compiler output. */
export const KNOCK = new InjectionToken<KnockSDK>('@knock-ai/sdk', { providedIn: 'root', factory: () => knock });
