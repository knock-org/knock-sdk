import { describe, expect, it } from 'vitest';
import { tagBuildPath } from './env.js';

describe('tagBuildPath', () => {
  it('maps each environment to its tag build path', () => {
    expect(tagBuildPath('production')).toBe('knock-tag-build/prod');
    expect(tagBuildPath('staging')).toBe('knock-tag-build-stg/prod');
    expect(tagBuildPath('development')).toBe('knock-tag-build/dev');
  });
});
