import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { VERSION } from './version.js';

describe('VERSION', () => {
  it('matches package.json, so a version bump cannot publish a stale sdkVersion', () => {
    expect(VERSION).toBe(pkg.version);
  });
});
