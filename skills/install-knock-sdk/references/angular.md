# Angular

Import from `knockai/angular`: `provideKnock(options)` and the `KNOCK` token.

## Initialize: `provideKnock`

Standalone app: add it to the providers in `src/app/app.config.ts`, after the existing ones:

```ts
import { provideKnock } from 'knockai/angular';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // the existing providers stay as they are
    provideKnock({ tagId: environment.knockProductTagId }),
  ],
};
```

- No `app.config.ts`: add it to the `providers` of `bootstrapApplication(...)` in `main.ts`.
  `NgModule` app: add it to the root module's `providers`.
- `provideKnock()` calls `init()` once, when the app starts.
- **Where the id goes.** Angular has no public env-var convention. If `src/environments/` exists,
  add `knockProductTagId` (or `knockWebsiteTagId` on a marketing site) with the pasted id to every
  environment file there, and read it as above. Otherwise pass the id straight to
  `provideKnock({ tagId: ... })`: it's public. Either way the id is always set, so no guard is
  needed.
- Server rendering (`@angular/ssr`) is safe: on the server `init()` does nothing.

## Identify

Use the Angular pattern in [identify.md](identify.md): `inject(KNOCK)` in the service or component
where sign-in resolves, and call `identify()` once per sign-in or session load. `inject(KNOCK)`
gives the same object as `import { knock } from 'knockai'`.

## Book a demo

Angular has no button component. See [demo-button.md](demo-button.md).
