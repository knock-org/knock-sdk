import { inject } from 'vue';
import type { KnockSDK } from '@knock-ai/sdk';
import { knock } from '@knock-ai/sdk';
import { KNOCK } from './inject-key.js';

export function useKnock(): KnockSDK {
  return inject(KNOCK, knock);
}
