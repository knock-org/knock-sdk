import { useEffect, useRef } from 'react';
import type { KnockIdentifyTraits } from '@knock-ai/sdk';
import { useKnock } from './useKnock.js';

export function useKnockIdentify(traits: KnockIdentifyTraits): void {
  const knock = useKnock();
  const key = JSON.stringify(traits);
  const lastKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    knock.identify(traits);
  }, [key, knock, traits]);
}
