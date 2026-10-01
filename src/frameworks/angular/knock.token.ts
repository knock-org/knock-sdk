import { InjectionToken } from '@angular/core';
import type { KnockSDK } from 'knockai';
import { knock } from 'knockai';

/** `inject(KNOCK)` returns the shared knockai instance. A runtime token, so it needs no Angular compiler output. */
export const KNOCK = new InjectionToken<KnockSDK>('knockai', { providedIn: 'root', factory: () => knock });
