# The tag id in env files

Tag ids are not secrets: they're part of the URL the browser loads. But the env files they go into
can hold secrets, so never open or print `.env`, `.env.local` or `.env.<mode>`. Work on them only
with the commands below: each prints a one-word answer or nothing, never the file. You may read the
example file (`.env.example`, `.env.sample` or `.env.template`), which is committed and holds no
secrets, to match its format.

These commands need a POSIX shell (macOS, Linux, Git Bash, WSL). Without one, do the same with your
own tools, still without printing the file.

Run each command exactly as written, one per call, with `NAME`, `<file>` and `<id>` filled in. Some
agents block or stop to ask about other forms (`{ ... }` groups, `( ... )` subshells, `if` blocks,
`sed -i`), and some don't show exit codes. That's why every check ends in `&& echo ... || echo ...`
and prints its answer.

## Which files there are

Names only. In the app's directory, `ls -A | grep -E '^\.env'` lists the env files, and
`git ls-files -- '.env*'` lists the committed ones. No output means none: don't add an `echo`
verdict to `git ls-files`, which succeeds either way. Without git, the committed ones are those
`.gitignore` doesn't match.

## Which files get it

- If the app keeps public settings in a committed env file (`git ls-files` lists `.env` or
  `.env.production`), add it there.
- Otherwise add it to `.env.local` (in Nuxt, `.env`: see [vue.md](vue.md)). In the report, say the
  same variable has to be set wherever production builds run (the hosting provider or CI), because
  that file isn't deployed.
- Add `NAME=` with no value to the example env file (`.env.example`, or the `.env.sample` or
  `.env.template` the app uses; create `.env.example` if there's none), unless the value went into
  a committed env file. Before creating one, run
  `git check-ignore -q .env.example && echo ignored || echo not-ignored`. If it prints `ignored`, a
  `.gitignore` rule (such as `.env*`) would hide the new file from the diff and from commits: put
  adding `!.env.example` to `.gitignore` in the plan, and if the user doesn't want that, skip the
  example file and say why in the report.
- If the app validates its env vars (for example `@t3-oss/env-*`, or a schema in `env.ts`),
  declare the new one there as optional and read it the way the app reads its other public
  variables.

## Commands

### Check

- Is the key there? `grep -qs '^NAME=' <file> && echo present || echo missing`
- Does it have a value? `grep -qs '^NAME=.' <file> && echo has-value || echo no-value`
- Is the stored id the one the user gave?
  `grep -qsxF 'NAME=<id>' <file> && echo same || echo different`. If it prints `different`, try
  the quoted form once before you treat it as different:
  `grep -qsxF 'NAME="<id>"' <file> && echo same || echo different`.

### Add a key

Two commands. First:

```sh
grep -qs '^NAME=' <file> && echo present || echo missing
```

Only if it printed `missing`:

```sh
tail -c1 <file> 2>/dev/null | grep -q . && echo >> <file>; printf 'NAME=%s\n' '<id>' >> <file>
```

It creates the file if it isn't there, and starts a new line first only when the file's last line
has none. For the example file, the value is empty: `''`.

### Replace a value

When the key is there with no value, or after the user agreed to replace a different stored id.
Ask before replacing a stored id ([Already installed](../SKILL.md#already-installed)).

```sh
grep -v '^NAME=' <file> > <file>.tmp; printf 'NAME=%s\n' '<id>' >> <file>.tmp; mv <file>.tmp <file>
```

This moves the line to the end of the file, and the file gets the default permissions instead of
its own. Say both in the report.
