import { useContext } from 'react';
import type { KnockSDK } from 'knockai';
import { knock } from 'knockai';
import { KnockContext } from './context.js';

export function useKnock(): KnockSDK {
  return useContext(KnockContext) ?? knock;
}
