import { createContext } from 'react';
import type { KnockSDK } from 'knockai';

/** No default — useKnock() falls back to the live `knock` singleton outside a provider. */
export const KnockContext = createContext<KnockSDK | undefined>(undefined);
