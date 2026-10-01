import type { InjectionKey } from 'vue';
import type { KnockSDK } from 'knockai';

export const KNOCK: InjectionKey<KnockSDK> = Symbol('knock');
