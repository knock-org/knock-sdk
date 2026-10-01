import { APP_INITIALIZER, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { KnockInitOptions } from 'knockai';
import { knock } from 'knockai';

export function initKnockRuntime(options: KnockInitOptions): void {
  knock.init(options);
}

// APP_INITIALIZER (not provideAppInitializer) to stay compatible with the package's
// declared >=17 Angular peer range; still a plain EnvironmentProviders, no NgModule.
export function provideKnock(options: KnockInitOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      multi: true,
      useValue: () => initKnockRuntime(options),
    },
  ]);
}
