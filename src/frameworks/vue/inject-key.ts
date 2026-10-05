import type { InjectionKey } from 'vue';
import type { KnockSDK } from '@knock-ai/sdk';

export const KNOCK: InjectionKey<KnockSDK> = Symbol('knock');
