import type { KnockEnvironment } from './types.js';

/** Path each environment's tag builds are served from. */
const TAG_BUILD_PATH: Record<KnockEnvironment, string> = {
  production: 'knock-tag-build/prod',
  staging: 'knock-tag-build-stg/prod',
  development: 'knock-tag-build/dev',
};

export function tagBuildPath(environment: KnockEnvironment): string {
  return TAG_BUILD_PATH[environment];
}
