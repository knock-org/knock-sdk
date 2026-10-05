import { useEffect, useRef, type ReactNode } from 'react';
import type { KnockIdentifyTraits, KnockInitOptions } from '@knock-ai/sdk';
import { knock } from '@knock-ai/sdk';
import { KnockContext } from './context.js';

export interface KnockProviderUser {
  traits: KnockIdentifyTraits;
}

export interface KnockProviderProps extends KnockInitOptions {
  user?: KnockProviderUser | null;
  children?: ReactNode;
}

export function KnockProvider({ user, children, ...initOptions }: KnockProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // init runs once; later prop changes are intentionally ignored (matches `knock.init`'s contract).
    knock.init(initOptions);
  }, []);

  const prevUserKey = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const key = user ? JSON.stringify(user) : null;
    if (key === prevUserKey.current) return;
    prevUserKey.current = key;
    if (user) knock.identify(user.traits);
  }, [user]);

  return <KnockContext.Provider value={knock}>{children}</KnockContext.Provider>;
}
