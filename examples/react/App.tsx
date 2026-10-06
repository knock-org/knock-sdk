// Example: `@knock-ai/sdk/react` in a logged-in app. Not built as part of this repo;
// see docs/frameworks/react.md.

import { useEffect } from 'react';
import { KnockProvider, KnockButton, KnockLink, useKnock } from '@knock-ai/sdk/react';

interface CurrentUser {
  email: string;
  firstName: string;
  companyName: string;
}

export function App({ user }: { user: CurrentUser }) {
  return (
    // In a logged-in app, use your product tag's id.
    <KnockProvider tagId="YOUR_PRODUCT_TAG_ID">
      <Dashboard user={user} />
    </KnockProvider>
  );
}

function Dashboard({ user }: { user: CurrentUser }) {
  const knock = useKnock();

  // No need to wait for the SDK: calls made before it's ready are queued.
  useEffect(() => {
    knock.identify({
      email: user.email,
      firstName: user.firstName,
      company: user.companyName,
    });
  }, [knock, user]);

  return (
    <main>
      <h1>Welcome back, {user.firstName}</h1>

      {/* Opens the scheduling modal for this magic link. Hover or focus starts loading it. */}
      <KnockButton magicLinkId="a1b2c3" email={user.email}>
        Book a demo
      </KnockButton>

      {/* A link to Knock chat: the visitor's identity is added when they open it, not at render. */}
      <KnockLink href="https://start-chat.com/slack/acme/sales" target="_blank" rel="noopener">
        Chat with sales
      </KnockLink>

      <button onClick={() => knock.track('upgrade_clicked', { plan: 'pro' })}>Upgrade</button>
    </main>
  );
}
