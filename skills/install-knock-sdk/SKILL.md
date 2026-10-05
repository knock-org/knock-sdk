---
name: install-knock-sdk
description: "Installs the Knock AI SDK (@knock-ai/sdk, formerly knockai, which loads the Knock tag) in a web project: React, Next.js, Vue, Nuxt, Angular, plain JavaScript or HTML pages. Use it when the user asks to install, add or set up Knock, Knock AI, @knock-ai/sdk, knockai, the Knock SDK or the Knock tag in their site or app, or to move from knockai to @knock-ai/sdk, and not for anything else. It first says what it will do and waits for a yes. Then it looks through the project, suggests events to track, asks for the Knock tag id, installs @knock-ai/sdk, adds the setup, identify and track() calls, updates the Content-Security-Policy if there is one, and runs the build. @knocklabs packages are a different company's product: this skill isn't for them."
license: MIT
compatibility: "Web projects: React, Next.js, Vue, Nuxt, Angular, plain JavaScript or HTML pages. For any coding agent that can read files and run shell commands. Installing from npm needs network access."
metadata:
  author: Knock AI
---

# Install the Knock AI SDK

Add `@knock-ai/sdk` to this project so it loads the user's Knock tag, tells Knock who people are,
records the actions they pick and, if they want, opens their Knock scheduling modal. Read this whole
file before you start, to its last line: it's about 470 lines, and the plan and report formats are
in steps 3 and 7, near the end. Then work through the steps in order. Open a file in `references/`
only when a step sends you there. If you're reading this from a URL, its links are relative to
that URL.

## Rules

- **Talk like a teammate.** Short sentences. No preamble, no list of what you're about to do, no
  disclaimers, and no command syntax unless the user can't be asked. The plan and the report are the
  only long messages.

- **Fixed formats.** The step-0 message, the plan ([step 3](#3-plan-then-install)) and the report
  ([step 7](#7-report)) have fixed layouts: use them exactly, also in non-interactive runs. Your
  last message is the step-0 message, the step-7 report in a code block, or, when you stop early,
  why you stopped and a request the user can send. Never a prose summary instead of the report.
- **Asking: multiple choice.** Ask with your agent's question tool when it has one (AskUserQuestion
  in Claude Code): up to 4 questions per round, each with a short header (12 characters at most) and
  2–4 options. Put the recommended or detected option first, ending its label with
  "(Recommended)". Give each option a one-line description that says what happens, with the
  `path:line`. Use multi-select where several answers fit (events). The user can always type their
  own answer. Without a question tool, send the same questions in chat as numbered options, and
  accept "1, 3" style replies. Ids (tag id, magic link id) are always pasted as plain text in chat,
  never offered as options.
- **The request may already answer.** As `key=value` (`website=<id>`, `product=<id>`, `app=<path>`,
  `events=signed_up,plan_upgraded` or `events=none`, `split=yes`; square brackets around one are
  fine) or in plain sentences ("it's our marketing site", "the app is under /app", "no demo
  button"). Use those answers and don't ask again. An unfilled placeholder such as `<tag-id>` is not
  an answer.
- **Never invent ids.** Tag ids and magic link ids come from the user, or from an existing install
  ([Already installed](#already-installed)). Never write a placeholder such as `YOUR_TAG_ID` into
  their code. No tag id, no install: ask for it, or stop if you can't ask.
- **Never commit, stage, stash or push.** The user reviews the diff. Move files with `mv`, not
  `git mv`, which stages them.
- **Change only what the install needs.** Match each file's existing style. No reformatting,
  renaming, moving, dependency upgrades or unrelated fixes. The one exception is a route-group split
  that the user picks, or that the request asks for ([nextjs-app.md](references/nextjs-app.md)).
  Don't copy the comments from the examples in `references/` into the user's code.
- **This skill's own files aren't part of the app.** Installing this skill may have put copies of
  it in the project, in each agent's own folder: any path containing `skills/install-knock-sdk`
  (under `.agents/`, `.windsurf/`, another agent's folder, or `skills/` at the root; some may be
  links to one copy), and `skills-lock.json`. They contain every string this skill searches for.
  Leave them out of every search and every `git status` check ([the exclude set](#the-exclude-set)),
  and never edit them.
- **Don't open or print env files that can hold secrets**: `.env`, `.env.local`, `.env.<mode>`.
  Check, add and replace keys in them only with the commands in [env.md](references/env.md), which
  print a one-word answer at most, never the file. The example file (`.env.example`, `.env.sample`
  or `.env.template`) is safe to read.
- **Commands print their answer.** Some agents don't show a command's exit code, so every check in
  this skill ends in `&& echo <yes> || echo <no>` and prints a word. Run the commands as written,
  one per call, without chaining others onto them: some agents block `{ ... }` groups, `( ... )`
  subshells and `if` blocks, or stop to ask about `sed -i` or a command they don't know. Read files
  with your agent's own file tool when it has one, not with shell commands.
- **One `init()` per page load, one Knock tag per page.** A second `init()` is ignored with a
  console warning, so the first one wins.
- **Identify real people, by email.** `identify()` requires an email. In a logged-in app, identify
  the signed-in user. On a marketing site, only where a visitor submits their email. Never on an
  anonymous page load.
- **Use only the real API.** `init`, `identify`, `track`, `modal`, `scheduling`, `widget`, `on`,
  and the read-only `ready`, `version` and `surface`. There's no sign-out or reset call to add.
- **Re-running is safe.** Detect what's already installed and only fill the gaps
  ([Already installed](#already-installed)). Running this on a finished install changes nothing.
- **The installed package wins.** After installing, the types in
  `node_modules/@knock-ai/sdk/dist/types/` are the source of truth for the API, and
  `node_modules/@knock-ai/sdk/README.md` for how to use it (the
  `docs/` pages it links to aren't in the package). On HTML pages nothing is installed: the README
  is at `https://cdn.jsdelivr.net/npm/@knock-ai/sdk@0.1/README.md`. If this skill disagrees with them,
  follow them.

## 0. Explain, and get a yes

Before reading or changing anything in the project (not even a file listing), ask this, word for
word, and wait. Use your question tool if you have one, with the options **Yes, go ahead** and
**No**; otherwise send it in chat:

```text
Install Knock in this project?
I'll look through your code, suggest a few events worth tracking, and ask for your Knock tag id.
You'll see the plan before anything changes. Nothing gets committed.
```

- **No:** stop and change nothing.
- **A clear yes in the request** ("yes", "go ahead", "don't ask, just install it"): skip this and go
  on. Asking to install Knock isn't a yes by itself.
- **No clear yes, and you can't ask** (a non-interactive run): send the three lines above, then one
  more line, and stop without changing anything:
  `To run it unattended, send: Install the Knock SDK. Yes: product=<tag-id>` (or `website=`).

## 1. Look around (read-only)

Look before you ask, and ask only what the code can't answer. Don't install, create or edit anything
in this step.

### The exclude set

Every search and every `git status` in this skill leaves out the same paths: `node_modules`, `.git`,
build output (`dist`, `build`, `.next`, `out`, and the app's own, such as `.nuxt`, `.output`,
`.angular` or `.svelte-kit`), env files (`.env*`: [env.md](references/env.md) has the only commands
for them), any path containing `skills/install-knock-sdk` (this skill's copies) and
`skills-lock.json`. Ready to paste, with your pattern in place of `<pattern>`:

```sh
rg -n --hidden -g '!node_modules' -g '!.git' -g '!dist' -g '!build' -g '!.next' -g '!out' -g '!.env*' -g '!**/skills/install-knock-sdk/**' -g '!skills-lock.json' '<pattern>' .
grep -rn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.next --exclude-dir=out --exclude-dir=install-knock-sdk --exclude='.env*' --exclude=skills-lock.json '<pattern>' .
git grep -n '<pattern>' -- . ':^*skills/install-knock-sdk*' ':^skills-lock.json' ':^.env*' ':^*/.env*'
git status --porcelain --untracked-files=all -- . ':^*skills/install-knock-sdk*' ':^skills-lock.json'
```

Add the app's other build folders the same way. With your agent's own search tool, give it the same
set as exclude globs.

### What to find

1. **Uncommitted changes.** Run the `git status` line of [the exclude set](#the-exclude-set). Note
   anything it lists: you'll ask about it in step 2. Also note if this isn't a git repository.
2. **Which app.** In a monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`,
   `turbo.json`, `nx.json`, `lerna.json`), list the packages that are web apps: they depend on a
   framework below and have a `dev` or `build` script. Use `app=`, or the directory the user is
   in. If that still leaves more than one, ask now: everything below depends on it. Install into
   one app at a time.
3. **Framework**, from that app's `package.json`:

   | The app has | Recipe |
   |---|---|
   | `next`, with `app/` or `src/app/` | [nextjs-app.md](references/nextjs-app.md) |
   | `next`, with only `pages/` or `src/pages/` | [nextjs-pages.md](references/nextjs-pages.md) |
   | `react` (Vite, Create React App, React Router / Remix, or another setup) | [react-vite.md](references/react-vite.md) |
   | `vue` or `nuxt` | [vue.md](references/vue.md) |
   | `@angular/core` | [angular.md](references/angular.md) |
   | A bundler and none of the above (Vite, webpack, Parcel, esbuild, Astro, SvelteKit, ...) | [vanilla.md](references/vanilla.md) |
   | No `package.json`, or only HTML templates (static site, Shopify or WordPress theme, Hugo, Jekyll, Eleventy) | [cdn.md](references/cdn.md) |

   A Next.js app with both `app/` and `pages/` uses both Next.js recipes. If the app is on React
   below 17, Vue below 3 or Angular below 17, stop and tell the user `@knock-ai/sdk` needs at least
   that. If it's a React Native app (`react-native` without `react-dom`), stop: `@knock-ai/sdk` runs
   in web pages only.
4. **Language.** TypeScript if the app has a `tsconfig.json`. Write new files in the language and
   extension the app already uses.
5. **Package manager**, from the lockfile (at the repo root in a monorepo): `pnpm-lock.yaml` is
   pnpm, `yarn.lock` is yarn, `bun.lock` or `bun.lockb` is bun, `package-lock.json` or none is npm.
6. **Sign-in.** The auth library, or the app's own current-user hook or store, and whether the app
   reads the user in the browser or on the server. See [identify.md](references/identify.md).
7. **Knock already there?**
   - `@knock-ai/sdk` or `knockai` in the dependencies, imports from either, `knockai.init(`,
     `cdn.jsdelivr.net/npm/@knock-ai/sdk` or `cdn.jsdelivr.net/npm/knockai`: partly or fully
     installed. Note what exists, including each `track('...')` call and its event name, and only
     fill gaps ([Already installed](#already-installed)). `knockai` is the old name of
     `@knock-ai/sdk`; same API. An install under the old name is swapped for the new one (step 3).
   - A `<script>` that loads `js.knock-ai.com` or `knock-tag-build`: the Knock tag is already on
     the page. See step 5.
   - `@knocklabs/*` packages are a different company's product, not Knock AI. Leave them alone. If
     a file already imports their `KnockProvider`, import ours as
     `import { KnockProvider as KnockAIProvider } from '@knock-ai/sdk/react'`.
8. **Content-Security-Policy.** Search the app for `Content-Security-Policy`. See step 5.
9. **Env conventions.** Which env files exist and which are committed, names only:
   `ls -A | grep -E '^\.env'` and `git ls-files -- '.env*'` in the app's directory
   ([env.md](references/env.md#which-files-there-are)). Also whether there's an example env file,
   and whether the app validates its env vars.
10. **Events.** Find the app's key user actions in the code
    ([where to look](references/events.md#finding-them)): sign up, log in and out, onboarding
    steps, invites, plan upgrades, checkout and purchases, clicks on the main call to action,
    important form submits, and the app's core actions. For each, note **where** it has succeeded
    (`file:line`), **a name** (lowercase snake_case, verb in the past tense: `signed_up`,
    `invite_sent`, `plan_upgraded`; it starts with a letter and has at most 64 characters) and
    **0 to 3 properties** from values in scope there (`plan`, `method`, `role`): no personal data
    beyond what `identify()` sends, and no free text
    ([names and properties](references/events.md#names)). Mark the 3 to 5 most valuable as
    recommended. Leave out actions with no handler in this code (a hosted sign-up page, a
    third-party widget), and mark the ones already tracked.

## 2. Ask which events to track, and what's still open

Start with what you found, in one line: "Next.js 15 (App Router), TypeScript, pnpm, sign-in with
Clerk." If step 1 found other uncommitted changes, add one picker question first: go on (your edits
land in the same diff) or stop. Without git, say there won't be a diff to review.

Then ask in two rounds. Skip any question the request or the install already answered.

**Round 1: one question-tool call with these four questions** (as numbered options in chat without
a tool):

1. **Events** (header `Events`, multi-select). The question: "Which events should I track?" One
   option per candidate, strongest first, at most 4: the label is the event name, with
   "(Recommended)" on the 3–5 you'd pick, and the description is `path:line` plus the properties
   (e.g. `app/signup/form.tsx:42 · method`). If you found more than 4, name the rest in the question
   text ("Also found: invite_sent, project_created; type them in to add them"). If you found
   nothing worth tracking, ask what action they want tracked instead. For an event they type in,
   find where it happens; if you can't, ask.
2. **App type** (header `App type`). "Where does this code run?" Options: **Logged-in app**
   (product tag), **Marketing site** (website tag), **Both** (see
   [One codebase, both tags](#one-codebase-both-tags)). The detected one comes first: a sign-in
   library means a logged-in app.
3. **Identify** (header `Identify`). For a logged-in app: "**Yes, from `useUser()`** (Recommended)",
   with the description "`app/knock-identify.tsx` sends the signed-in user's email and name";
   **Somewhere else**; **Skip for now**. For a marketing site: one multi-select option per form
   that collects an email (`Footer.tsx` newsletter, `pages/demo.tsx` demo form), plus **None**. The
   description says identifying a visitor captures them as a lead, and Knock may research the
   lead's company for their sales team. Leave embedded third-party forms (iframes) alone. With no
   email form in the code, skip this question and list identify under Skipped in the report.
4. **Demo button** (header `Demo`). "Add a button that opens your Knock scheduling modal?" Options:
   **No** (Recommended), **Yes, my default modal**, **Yes, for a magic link**. If yes, the
   description says which existing button you'd wire, or where you'd add one. See
   [demo-button.md](references/demo-button.md).

If the app-type answer contradicts what question 3 assumed, ask question 3 again for the right
type.

**Round 2: in chat, plain text.** "Paste your Knock product tag id" (or website, or both, from
round 1), plus the magic link id if they chose one. Take only what the user pastes: one token, with
no spaces or quotes. Don't say where to find it. If they don't have it yet, stop. Tell them to ask
their agent to install the Knock SDK again once they have it (in Claude Code `/install-knock-sdk`,
in Codex `$install-knock-sdk`), with their answers so far:
`Install the Knock SDK. Yes: product=<tag-id> events=signed_up,plan_upgraded`.

### If you can't ask

With no way to get a reply (a non-interactive run), work from the request and the existing install:

- No clear yes in the request: step 0 already stopped.
- No tag id (given or stored), or a monorepo with several apps and no `app=`: stop and change
  nothing. Print a request that would work, with the events you found:
  `Install the Knock SDK. Yes: product=<tag-id> app=apps/web events=signed_up,plan_upgraded`.
- Both tags and one shared root: see [One codebase, both tags](#one-codebase-both-tags).
- A stored tag id that differs from the request's: stop and change nothing
  ([Already installed](#already-installed)).
- Other uncommitted changes: go on, leave them untouched, and list them under "Before you merge"
  in the report.
- Track only the events the request names that you found a place for. With none named, add none,
  and list your suggestions under Skipped in the report.
- Identify only if there's exactly one clear source of the signed-in user. Add the button only if
  the request asks for it.
- List everything you skipped in the report.

### Already installed

What the existing install shows counts as answered:

- **The tag id.** If the code reads a Knock tag variable and an env file other than the example
  gives it a value, the id is set: don't ask for it. For each tag id in the request, compare it with
  the stored value, using the command in [env.md](references/env.md#check) that prints `same` or
  `different`. On `different`, never keep or replace it silently: ask whether to replace it, or, if
  you can't ask, stop, change nothing and report which variable in which file differs, without
  printing either value. A key that's there with no value gets filled in
  ([env.md](references/env.md#replace-a-value)).
- **On HTML pages** the id is in the page, in `knockai.init({ tagId: '...' })`, and it's public:
  show it and ask only to confirm. Replace it only after a yes. If you can't ask and it differs from
  the request's, stop and report both.
- **What the app is.** The variable's name (`..._WEBSITE_TAG_ID` or `..._PRODUCT_TAG_ID`).
- **Events.** An event already tracked (a `track('name'` call) is done: list it under Already
  there, and never add a second call for it.
- **The button.** An existing `KnockButton` or `modal.open(...)` call answers it.
- **The package.** If `@knock-ai/sdk` is already in the app's dependencies, don't run the install
  command, which could upgrade it. Keep its version and report it. If `knockai` is there instead,
  that's the old name: the plan swaps it (step 3), and everything else it shows still counts.

### One codebase, both tags

A page runs one Knock tag (the first `init()` picks it, and client-side navigation keeps it), so
the two tags need separate page loads: separate apps, one install each, or separate Next.js root
layouts. Never choose the tag id from the URL inside one root. If both share one root (one
`main.tsx`, one root layout), say so and ask which tag to install. In the Next.js App Router, also
offer a split into two root layouts ([nextjs-app.md](references/nextjs-app.md)).

If you can't ask, split only in the Next.js App Router, and only if the request says which routes
are the marketing site and which are the app ("the marketing site is the root page; the app is
under /app"), or says `split=yes`. With `split=yes` alone, place each top-level route by what its
code does (a route that reads the signed-in user is the app's), and stop if one isn't clear.
Otherwise stop, change nothing, and print a request that would work:
`Install the Knock SDK. Yes: website=<tag-id> product=<tag-id> events=signed_up. The marketing site is / and /pricing; the logged-in app is under /app.`
For one tag on the whole app, the request names only that one.

## 3. Plan, then install

Before changing anything, show the plan in exactly this format, also when you can't ask: a title
line, then one line per file with its path and what changes. `install` comes first, then each env
file with the variables it gets, then one `move <old> -> <new>` line per moved file or folder, then
the other files:

```text
Plan for apps/web
  install                   pnpm add @knock-ai/sdk
  .env.local                + NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID
  .env.example              + NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID=
  app/layout.tsx            wrap {children} in <KnockProvider>
  app/knock-identify.tsx    new: identifies the signed-in user from useUser()
  app/signup/form.tsx       track signed_up { method }
  app/billing/upgrade.tsx   track plan_upgraded { plan, interval }
  next.config.ts            add Knock's sources to the Content-Security-Policy
```

With a route-group split, the moves and new layouts look like this:

```text
  move app/page.tsx -> app/(marketing)/page.tsx
  move app/dashboard -> app/(app)/dashboard
  app/(marketing)/layout.tsx   new: copy of app/layout.tsx, with the website tag
  app/(app)/layout.tsx         new: copy of app/layout.tsx, with the product tag
  app/layout.tsx               deleted
```

When the app has `knockai`, the old name, the install line swaps it, and each file that imports
it gets a line. Say why, in the plan's last line:

```text
  install                   pnpm remove knockai, then pnpm add @knock-ai/sdk
  app/layout.tsx:3          import from @knock-ai/sdk/react instead of knockai/react
  lib/analytics.ts:1        import from @knock-ai/sdk instead of knockai
  knockai is the old name of @knock-ai/sdk; same API.
```

Then ask one picker question (header `Plan`): **Install it** (Recommended), **Change something**,
**Cancel**. Skip it if the request itself had a clear yes (step 0) and nothing had to be asked
since: that yes covers the plan, so show it and go on in the same turn. Then install from the
app's directory with its package manager and the bare package name: `npm install @knock-ai/sdk`,
`pnpm add @knock-ai/sdk`, `yarn add @knock-ai/sdk` or `bun add @knock-ai/sdk`. Skip this if
`@knock-ai/sdk` is already a dependency. Don't pin or invent a version, don't edit `package.json` by
hand, and don't add `--force` or `--legacy-peer-deps`. Try once. If it fails for a reason that isn't
`@knock-ai/sdk` (an existing peer conflict, no network, a broken lockfile), stop and report the
command and the error. The CDN recipe installs nothing.

**Swapping `knockai`.** If `knockai` is a dependency, remove it first with the same package manager
(`npm uninstall knockai`, `pnpm remove knockai`, `yarn remove knockai` or `bun remove knockai`),
then install `@knock-ai/sdk` as above. Then change every `knockai` import, `require` and test mock
path to `@knock-ai/sdk`, keeping the subpath: `knockai/react` becomes `@knock-ai/sdk/react`, and
likewise for `/vue`, `/angular`, `/testing` and any other. Change nothing else: the API is the same. On HTML pages,
a snippet that loads from `cdn.jsdelivr.net/npm/knockai` is replaced with the current one
([cdn.md](references/cdn.md)); `knockai.init(...)` and the other `knockai.` calls stay.

## 4. Write the code

Follow the recipe. They all use the same pieces:

- **The tag id goes in an env var** with the framework's public prefix, named for the tag:
  `<PREFIX>KNOCK_WEBSITE_TAG_ID` or `<PREFIX>KNOCK_PRODUCT_TAG_ID`, for example
  `VITE_KNOCK_PRODUCT_TAG_ID`. If the code already reads a Knock tag variable, keep its name. Tag
  ids are not secrets: they're part of the URL the browser loads. Which env files get it (a
  committed one, or `.env.local` plus the example file), `.gitignore` and env validation:
  [env.md](references/env.md). Angular and HTML pages have no env convention: their recipes say
  where the id goes.
- **Guard on an id read from an env var.** `init()` doesn't check the id: without one it would
  request a tag that doesn't exist. Initialize only when the variable is set, and in development
  warn once, naming the variable. The Angular and HTML recipes write the pasted id into the code,
  so they need no guard.
- **Initialize once, at the root** that every page goes through, next to what's already there.
- **Identify** where the recipe and [identify.md](references/identify.md) say.
- **Track** each chosen event at the place step 1 found, as in [events.md](references/events.md):
  `knock.track('name', { ...properties })` inside the existing handler, after the action has
  succeeded, once per action. Never in a render, a template expression or an effect that runs on
  load, and never in server code. Get `knock` the framework's way: React and Vue `useKnock()`,
  Angular `inject(KNOCK)`, other code `import { knock } from '@knock-ai/sdk'`, HTML pages `knockai`
  (the global the snippet defines). These
  work while Knock is off (no tag id set): the call just isn't sent, so it needs no guard.
- **No readiness checks.** Calls made before `init()`, or before Knock has loaded, are queued (up to
  1,000) and sent in order.
- **Server rendering is safe.** On the server every call does nothing (so a `track()` there is
  never sent).

## 5. Content-Security-Policy, and a Knock tag already on the page

**Content-Security-Policy.** If step 1 found a policy, update it in the same change: see
[csp.md](references/csp.md). A partial update fails silently in the browser, so cover every
directive in one pass. If there's no policy in the code but the app could get one from its hosting
or a proxy, say so in the report.

**A Knock tag already on the page.** If the app already loads the Knock tag with its own `<script>`
(from `js.knock-ai.com` or `.../knock-tag-build/...`), keep it and don't add a second one: when
`init()` runs, the SDK uses a Knock tag that's already on the page, loaded or still loading.

- Init with the same tag id. If you can't tell that the existing script is for the id the user
  pasted, ask. With a different id, the page keeps running the tag that's already there, and the
  SDK may warn `[knockai] using Knock tag <id> already on the page`.
- If that script is added late (by a tag manager, or by code that runs after the page loads),
  `init()` may not see it and load the tag itself. Tell the user, and suggest loading the tag one
  way only.

## 6. Verify

Run whichever of the app's own `typecheck`, `lint` and `build` scripts exist, with its package
manager. Fix only errors in what you added; report errors elsewhere as already there, without
fixing them. Don't run the test suite, and don't leave a dev server running. A passing build means
the code compiles, not that Knock receives anything, so don't report it as more than that.

## 7. Report

End with this report, in exactly this layout, in a code block, also in non-interactive runs. Don't
condense it, turn it into prose or links, or leave out a section: write `none` under an empty one.
Anything else you need to say goes inside it, under Skipped or Before you merge, not after it.

```text
Knock AI SDK installed in apps/web: @knock-ai/sdk 0.1.2, with pnpm
Checks: typecheck passed, build passed, no lint script

Changed
  app/layout.tsx:3,15             KnockProvider around the app
  app/knock-identify.tsx:1        new: identifies the signed-in user (Clerk)
  .env.local                      + NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID
  .env.example:4                  + NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID=
  package.json, pnpm-lock.yaml    + @knock-ai/sdk
Moved
  none
Events added
  name            | file:line                    | properties
  signed_up       | app/signup/form.tsx:44       | method
  plan_upgraded   | app/billing/upgrade.tsx:81   | plan, interval
Already there
  none
Skipped
  "Book a demo" button (not requested)
  invite_sent, app/team/invite-form.tsx:30 (suggested, not picked)

Check it in your browser
  1. Run pnpm dev and open the app.
  2. In DevTools, Network tab, filter by "knock": the Knock tag's script
     (.../knock-tag-build/prod/<tag-id>/latest/index.js) loads with status 200. A 403, or
     (blocked:orb) in Chrome, means the tag id is wrong. Nothing is printed in the Console for that.
  3. In the Console: no "[knockai]" warnings and no Content-Security-Policy errors.
  4. Do each tracked action once (sign up, upgrade): it works as before, with no new errors.

Before you merge
  - Set NEXT_PUBLIC_KNOCK_PRODUCT_TAG_ID wherever production builds run. Without it, Knock is off.
  - Review the Content-Security-Policy change in next.config.ts:22.
```

- **Changed**: every change as `path:line`. Name env vars, but don't print what's in `.env` files.
  After a swap, the package line is `- knockai, + @knock-ai/sdk`, and each rewritten import has its
  own line.
- **Moved**: one `old -> new` line per move. Unstaged moves show in `git status` as a deleted file
  and a new one.
- **Events added**: the table, header row included: name, `file:line`, properties (`-` for none).
- **Already there**: what you found and kept: the package and its version, the setup, env vars,
  identify, and each event already tracked, with its `file:line`.
- **A re-run that changes nothing**: the first line is
  `Knock AI SDK already installed in apps/web: @knock-ai/sdk 0.1.2. Nothing changed.`, Changed is
  `Nothing changed`, Moved and Events added are `none`, and everything goes under Already there.
  Never say added or installed about something that was already there.
- **Check it in your browser**: the steps as written, with the app's own dev command, routes and
  actions filled in. Keep step 2's 403 and `(blocked:orb)` explanation.
- **Before you merge** also lists any uncommitted changes that were there before you started, left
  untouched. After a route-group split, it also says that a URL matching no page now shows
  Next.js's default 404 page, without either layout.
- Take the version from `node_modules/@knock-ai/sdk/package.json`: read the file, don't run code
  for it. On HTML pages, say `@knock-ai/sdk@0.1 from jsDelivr, nothing installed`, and say to open
  the page through the site's local server or its deployed URL.
- Add the event notes from [events.md](references/events.md#in-the-report) where they fit.
- If the tag id variable is unset, the "is not set, so Knock is off" warning shows in the browser
  Console, or in the dev server's terminal when the file renders on the server (a Next.js root
  layout). A Knock button does nothing while Knock is off, and no event is sent.
- With the npm package there's no `knock` variable to type in the Console; that's expected. On HTML
  pages, `knockai.ready` is `true` once the Knock tag has loaded.
- If the project folder is itself what gets deployed (a static site or theme), add a "Before you
  merge" item: this skill's own files (`skills-lock.json`, and each folder holding
  `skills/install-knock-sdk`) are in it too, so keep them out of the deploy or remove them.
  Installing the skill with `npx skills add knock-org/knock-sdk -g` keeps it out of the project.
- If you couldn't check something, say what and why on the Checks line.
