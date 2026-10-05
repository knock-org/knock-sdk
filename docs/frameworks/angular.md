# Angular

```bash
npm install knockai
```

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideKnock } from 'knockai/angular';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [provideKnock({ tagId: 'YOUR_TAG_ID' })],
});
```

`provideKnock()` calls `knock.init()` once, when the app starts, with the options you give it
(`tagId`, `debug`, `scriptUrl`; see [Quickstart](../quickstart.md#2-pick-your-tag-id)). Using
`NgModule`? Add the same provider to your root module's `providers`.

## Use the SDK in a component

```ts
import { Component, OnInit, inject } from '@angular/core';
import { KNOCK } from 'knockai/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <button
      (pointerenter)="knock.scheduling.load({ magicLinkId: 'a1b2c3' })"
      (click)="knock.modal.open({ magicLinkId: 'a1b2c3', email: user.email })"
    >
      Book a demo
    </button>
  `,
})
export class DashboardComponent implements OnInit {
  readonly knock = inject(KNOCK);
  user!: { email: string; firstName: string };

  ngOnInit() {
    this.knock.identify({ email: this.user.email, firstName: this.user.firstName });
  }

  upgrade() {
    this.knock.track('upgrade_clicked');
  }
}
```

`inject(KNOCK)` gives you the same `knock` object as `import { knock } from 'knockai'`, so every
method is there. You don't need to wait for the SDK to be ready. Calls made before then are queued.
Loading the scheduling modal on hover means a click opens it with times already there. See
[Scheduling modal and widget](../widget-and-modals.md).

## Server rendering

On the server every SDK call does nothing, so `provideKnock()` and `inject(KNOCK)` are safe with
Angular SSR.
