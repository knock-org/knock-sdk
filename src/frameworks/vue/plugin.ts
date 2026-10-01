import type { App } from 'vue';
import type { KnockInitOptions } from 'knockai';
import { knock } from 'knockai';
import { KNOCK } from './inject-key.js';

// Structural shape only (not Vue's `Plugin<T>` type) so app.use()'s generic
// overloads infer KnockInitOptions from `install` without version-specific friction.
export const KnockPlugin = {
  install(app: App, options: KnockInitOptions): void {
    knock.init(options);
    app.provide(KNOCK, knock);
  },
};
