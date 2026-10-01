import { inject } from 'vue';
import type { KnockSDK } from 'knockai';
import { knock } from 'knockai';
import { KNOCK } from './inject-key.js';

export function useKnock(): KnockSDK {
  return inject(KNOCK, knock);
}
