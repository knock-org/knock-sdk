import { useContext } from 'react';
import type { KnockSDK } from '@knock-ai/sdk';
import { knock } from '@knock-ai/sdk';
import { KnockContext } from './context.js';

export function useKnock(): KnockSDK {
  return useContext(KnockContext) ?? knock;
}
