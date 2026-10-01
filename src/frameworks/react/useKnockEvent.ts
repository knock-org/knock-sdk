import { useEffect, useRef } from 'react';
import type { KnockEventMap, KnockEventName } from 'knockai';
import { useKnock } from './useKnock.js';

export function useKnockEvent<E extends KnockEventName>(
  event: E,
  handler: (payload: KnockEventMap[E]) => void,
): void {
  const knock = useKnock();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Subscribe once per (knock, event); always dispatch to the latest handler.
  useEffect(() => knock.on(event, (payload) => handlerRef.current(payload)), [knock, event]);
}
