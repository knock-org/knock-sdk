import { describe, expect, it, vi } from 'vitest';
import { Emitter } from './emitter.js';

interface TestEvents {
  greet: string;
  count: number;
  [key: string]: unknown;
}

describe('Emitter', () => {
  it('calls every handler registered for an event, in order', () => {
    const emitter = new Emitter<TestEvents>();
    const calls: string[] = [];
    emitter.on('greet', (payload) => calls.push(`a:${payload}`));
    emitter.on('greet', (payload) => calls.push(`b:${payload}`));

    emitter.emit('greet', 'hi');

    expect(calls).toEqual(['a:hi', 'b:hi']);
  });

  it('does not call handlers registered for a different event', () => {
    const emitter = new Emitter<TestEvents>();
    const greetHandler = vi.fn();
    const countHandler = vi.fn();
    emitter.on('greet', greetHandler);
    emitter.on('count', countHandler);

    emitter.emit('count', 1);

    expect(greetHandler).not.toHaveBeenCalled();
    expect(countHandler).toHaveBeenCalledWith(1);
  });

  it('emitting with no listeners is a no-op', () => {
    const emitter = new Emitter<TestEvents>();
    expect(() => emitter.emit('greet', 'hi')).not.toThrow();
  });

  it('on() returns an unsubscribe that stops future calls', () => {
    const emitter = new Emitter<TestEvents>();
    const handler = vi.fn();
    const unsubscribe = emitter.on('greet', handler);

    emitter.emit('greet', 'first');
    unsubscribe();
    emitter.emit('greet', 'second');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });

  it('unsubscribing twice is harmless', () => {
    const emitter = new Emitter<TestEvents>();
    const unsubscribe = emitter.on('greet', vi.fn());
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });

  it('clear() removes every handler for every event', () => {
    const emitter = new Emitter<TestEvents>();
    const handler = vi.fn();
    emitter.on('greet', handler);
    emitter.clear();
    emitter.emit('greet', 'hi');
    expect(handler).not.toHaveBeenCalled();
  });
});
