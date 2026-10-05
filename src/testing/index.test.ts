import { describe, expect, it, vi } from 'vitest';
import * as core from '@knock-ai/sdk';
import { createKnockMock, installKnockMock, uninstallKnockMock } from './index.js';

describe('createKnockMock', () => {
  it('has no calls and no identify state when created', () => {
    const mock = createKnockMock();
    expect(mock.calls).toEqual([]);
    expect(mock.lastIdentify()).toBeUndefined();
    expect(mock.ready).toBe(true);
    expect(typeof mock.version).toBe('string');
  });

  it('records identify calls and exposes the most recent one', () => {
    const mock = createKnockMock();
    mock.identify({ email: 'a@example.com' });
    mock.identify({ email: 'b@example.com' });

    expect(mock.lastIdentify()).toEqual({ traits: { email: 'b@example.com' } });
  });

  it('records track calls and filters them by event name in call order', () => {
    const mock = createKnockMock();
    mock.track('signup_completed', { plan: 'pro' });
    mock.track('other_event');
    mock.track('signup_completed', { plan: 'free' });

    expect(mock.eventsNamed('signup_completed')).toEqual([{ plan: 'pro' }, { plan: 'free' }]);
    expect(mock.eventsNamed('missing_event')).toEqual([]);
  });

  it('records every call, in order, across the full surface', () => {
    const mock = createKnockMock();
    mock.init({ tagId: 't1' });
    mock.modal.open({ magicLinkId: 'm1' });
    mock.modal.close();
    mock.widget.show();
    mock.widget.hide();
    mock.widget.open();
    mock.widget.close();

    expect(mock.calls.map((call) => call.method)).toEqual([
      'init',
      'modal.open',
      'modal.close',
      'widget.show',
      'widget.hide',
      'widget.open',
      'widget.close',
    ]);
  });

  it('returns a working scheduling handle and records its use', () => {
    const mock = createKnockMock();
    const handle = mock.scheduling.load({ magicLinkId: 'm1', email: 'a@example.com' });

    expect(handle.status).toBe('slots_found');
    handle.close();
    expect(handle.status).toBe('closed');
    handle.open();
    expect(handle.status).toBe('slots_found');

    expect(mock.calls.map((call) => call.method)).toEqual([
      'scheduling.load',
      'scheduling.handle.close',
      'scheduling.handle.open',
    ]);
  });

  it('dispatches emitted events to on() subscribers and honors unsubscribe', () => {
    const mock = createKnockMock();
    const received: unknown[] = [];
    const unsubscribe = mock.on('modal:open', (payload) => received.push(payload));

    mock.emit('modal:open', { magicLinkId: 'm1' });
    unsubscribe();
    mock.emit('modal:open', { magicLinkId: 'm2' });

    expect(received).toEqual([{ magicLinkId: 'm1' }]);
  });

  it('emit is a no-op when nothing is subscribed', () => {
    const mock = createKnockMock();
    expect(() => mock.emit('widget:open', undefined)).not.toThrow();
  });

  it('clearCalls forgets recorded calls but leaves subscriptions active', () => {
    const mock = createKnockMock();
    const received: unknown[] = [];
    mock.on('widget:open', () => received.push('fired'));
    mock.identify({ email: 'a@example.com' });
    mock.track('x');

    mock.clearCalls();

    expect(mock.calls).toEqual([]);
    expect(mock.lastIdentify()).toBeUndefined();

    mock.emit('widget:open', undefined);
    expect(received).toEqual(['fired']);
  });
});

describe('installKnockMock / uninstallKnockMock', () => {
  it('installs and uninstalls the mock as the core singleton', () => {
    const spy = vi.spyOn(core, '__setKnockForTesting');
    const mock = createKnockMock();

    installKnockMock(mock);
    expect(spy).toHaveBeenCalledWith(mock);

    uninstallKnockMock();
    expect(spy).toHaveBeenLastCalledWith(undefined);

    spy.mockRestore();
  });
});
