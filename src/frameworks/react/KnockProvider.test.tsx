import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { knock } = vi.hoisted(() => ({
  knock: {
    init: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
    modal: { open: vi.fn(), close: vi.fn() },
    scheduling: { load: vi.fn() },
    widget: { show: vi.fn(), hide: vi.fn(), open: vi.fn(), close: vi.fn() },
    on: vi.fn(),
    ready: false,
    version: '0.0.0-test',
  },
}));

vi.mock('../../core', () => ({ knock }));

import { KnockProvider } from './KnockProvider.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KnockProvider', () => {
  it('initializes once on mount', () => {
    render(<KnockProvider tagId="tag_1">child</KnockProvider>);
    expect(knock.init).toHaveBeenCalledTimes(1);
    expect(knock.init).toHaveBeenCalledWith({
      tagId: 'tag_1',
      environment: undefined,
      debug: undefined,
    });
  });

  it('does not re-init when props change', () => {
    const { rerender } = render(<KnockProvider tagId="tag_1">child</KnockProvider>);
    rerender(
      <KnockProvider tagId="tag_1" debug>
        child
      </KnockProvider>,
    );
    expect(knock.init).toHaveBeenCalledTimes(1);
  });

  it('identifies when a user is passed', () => {
    render(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'a@b.com' } }}>
        child
      </KnockProvider>,
    );
    expect(knock.identify).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('re-identifies when user traits change', () => {
    const { rerender } = render(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'a@b.com' } }}>
        child
      </KnockProvider>,
    );
    rerender(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'c@d.com' } }}>
        child
      </KnockProvider>,
    );
    expect(knock.identify).toHaveBeenCalledTimes(2);
  });

  it('does not re-identify when the user is deep-equal but a new object', () => {
    const { rerender } = render(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'a@b.com' } }}>
        child
      </KnockProvider>,
    );
    rerender(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'a@b.com' } }}>
        child
      </KnockProvider>,
    );
    expect(knock.identify).toHaveBeenCalledTimes(1);
  });

  it('does not identify again when the user signs out', () => {
    const { rerender } = render(
      <KnockProvider tagId="tag_1" user={{ traits: { email: 'a@b.com' } }}>
        child
      </KnockProvider>,
    );
    rerender(
      <KnockProvider tagId="tag_1" user={null}>
        child
      </KnockProvider>,
    );
    expect(knock.identify).toHaveBeenCalledTimes(1);
  });
});

describe('KnockProvider init options', () => {
  it('forwards every KnockInitOptions key', async () => {
    const { render } = await import('@testing-library/react');
    const { KnockProvider } = await import('./KnockProvider.js');
    const { knock } = await import('@knock-ai/sdk');
    const init = vi.spyOn(knock, 'init').mockImplementation(() => {});
    render(<KnockProvider tagId="t1" scriptUrl="https://example.com/rt.js" environment="staging" debug />);
    expect(init).toHaveBeenCalledWith({ tagId: 't1', scriptUrl: 'https://example.com/rt.js', environment: 'staging', debug: true });
    init.mockRestore();
  });
});
