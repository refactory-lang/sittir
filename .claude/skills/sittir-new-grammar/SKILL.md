---
name: sittir-new-grammar
description: >
  Add a new tree-sitter grammar to sittir (a new packages/<name> grammar package plus its
  rust/crates/sittir-<name> native crate) and iterate it to a clean `gen --all`. Use when the
  user asks to bootstrap, add, onboard or set up a grammar/language (e.g. "set up a grammar for
  regex"), when running `sittir tool bootstrap-grammar`, or when a freshly bootstrapped grammar's
  codegen fails and you need to tell authoring fixes from codegen-core defects.
---

# Adding a grammar to sittir

A grammar is registered by existing: every `packages/<name>/` holding a `grammar.sittir.ts` is a
grammar (`packages/codegen/src/grammars.ts`). There is no list of grammar names to edit anywhere.
A grammar joins the default gates (`regen:all`, `validate counts`, censuses, baseline ratchets)
only when its `package.json` sets `"sittir": { "stable": true }`.

## 1. Bootstrap

```bash
pnpm exec tsx packages/cli/src/cli.ts tool bootstrap-grammar --name <name> --dry-run   # preview
pnpm exec tsx packages/cli/src/cli.ts tool bootstrap-grammar --name <name> [--upstream <spec>]
```

- `--name` is the sittir grammar name: package dir, crate suffix, and the `wire({ name })` the
  parser is generated under (so the C symbol is `tree_sitter_<name>`). It may differ from the
  upstream grammar's own name.
- The upstream is always declared as the dependency `tree-sitter-<name>` in the grammar package
  (it is resolved from there, never from codegen's node_modules). `--upstream` picks the source:
  - default: npm `tree-sitter-<name>` at `^latest`;
  - another npm package: `--upstream tree-sitter-foo` → `npm:tree-sitter-foo@^x.y.z` alias;
  - not on npm / stale on npm: a verbatim spec, e.g.
    `--upstream github:tree-sitter-grammars/tree-sitter-query#v0.8.0`.
  Check provenance first (`npm view <pkg> repository.url time`) — an old anonymous npm snapshot
  is worse than a pinned git tag of the maintained repo.
- It writes `package.json`, `tsconfig*.json`, `README.md` and a minimal `grammar.sittir.ts`
  (`grammar(enrichedBase, wire({...}, enrichedBase))` with the three whitespace externals — the same composition as every grammar), inserts a root `tsconfig.json`
  reference, formats with oxfmt and runs `pnpm install`.
- It does **not** write the native crate. `gen --all` scaffolds `rust/crates/sittir-<name>` the
  first time it emits the grammar's render module (template: `emitters/native-crate.ts`, pinned to
  reproduce `sittir-python` byte-for-byte). A grammar whose codegen still fails therefore never
  leaves a crate behind that breaks `cargo check --workspace` for every other grammar.
- An upstream without an external scanner gets a stub `scanner.c` at transpile time — the
  whitespace externals need the scanner symbols to link.

## 2. Generate, read the failure, classify it

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar <name> --all --output packages/<name>/src
```

**Read `packages/<name>/.sittir/grammar-diagnostics.json` first** — it is the structured record of
every grammar diagnostic the run raised: `code`, `severity`, `ownerKind`, `ruleId`, `message`,
`proposal`, `canProceed` and `details`. Triage from it, not from the console log:

```bash
node -e 'for (const d of require("./packages/<name>/.sittir/grammar-diagnostics.json")) console.log(d.severity, d.code, d.ownerKind ?? "-", d.canProceed ? "" : "BLOCKING")'
```

`canProceed: false` entries are the blockers; `proposal` usually names the authoring fix. A
diagnostic is allowed through with `--allow-diagnostic <code>` for one run, or permanently with
the grammar's `expectDiagnostics:` block — only when the shape is understood and accepted.

Only when the run stops on a raw exception (a stack trace with no matching entry in the file) is
the console output the source — and that is itself a finding: the failure should have been a
diagnostic (report it with the core defect).

Ground truth for "what did tree-sitter see" is `packages/<name>/.sittir/src/grammar.json`; compare a
rule there against the upstream's `src/grammar.json` before reasoning about a failure.

Classify every stop as **authoring** (fix in `packages/<name>/grammar.sittir.ts`) or **core**
(stop, write it up, route to the design owner — see §4). Rule of thumb: if the fix would be the
same for any grammar with that shape, it is core; don't patch around core defects silently.

| Symptom | Class | Fix |
|---|---|---|
| `storagename-collision` / `content-collision`: two positional slots of one type (`seq(x, '.', x)`, `seq(a, '-', a)`) | authoring | `patches: { rule: { 0: field('start'), 2: field('end') } }` — name the roles |
| `TemplateEmitter duplicate-slot violation` on a choice whose arms share a slot | core defect, authoring workaround | `variant()` each arm (and `field()` any trailing single member) so each arm is its own form; report the core defect |
| `seated in a list but has no kind id` after a patch through an enrich-lifted group; parser `grammar.json` lacks a patch the IR has | composition | `wire(cfg, enrichedBase)` must receive the enriched base (`const enrichedBase = enrich(base); grammar(enrichedBase, wire({...}, enrichedBase))`) — without it a patch through a `<rule>_group` lands in the IR but not the parser, and a `variant()` mint ships orphaned. A test pins the composition for every grammar |
| `aliased token … has no verbatim literal` | core | report; the literal must come from grammar.json, not the mangled C name |
| `defaults: <kind> has a separator of shape SYMBOL` | core | report; fielding the member does not help |
| `Cannot find module …/src/boundary.ts` at post-generate | core (missing emitter) | report |
| `cargo check --workspace` fails in a crate with no `src/render/` | stale scaffold | delete that crate; the next successful `gen --all` recreates it |

### Patch path addressing

- Keys are `/`-joined member indices into the rule as the upstream grammar.json shows it; `prec*`
  and `token` wrappers are transparent. `choice` arms and `seq` members are indexed from 0;
  `optional(x)` is `choice(x, blank)`, so `x` is at `…/0`.
- Several patch kinds on one rule go in an array of blocks (a duplicate key in one block replaces
  the earlier one): `rule: [{ '1/0': field('a'), … }, { '1/0': variant('v'), … }]`.
- A path may walk through a rule enrich lifts into `<rule>_group` / `<rule>_arm` (the parent's path continues into the lifted body), or the patch may be keyed on the minted name directly.

## 3. Gates

The bootstrap and any codegen change must leave the stable grammars byte-identical:

```bash
pnpm run regen:all                      # every stable grammar, native builds + workspace check
git diff --stat -- packages/{rust,typescript,python} rust/crates   # only expected churn
pnpm exec tsx packages/cli/src/cli.ts validate counts && pnpm run validate:history
```

Expected churn is limited to what the change explains (e.g. `generated.manifest.json` source
hashes when a grammar `package.json` changes). Any other generated diff is a finding — stop and
review it, never revert it away. Run the unit suite as its own Bash call.

A new grammar is promoted by adding `"sittir": { "stable": true }` to its `package.json` once it
generates, validates, and its numbers are worth ratcheting; the next `validate counts` records its
baseline.

## 4. Routing core defects

Codegen-core design belongs to the design owner (in the peer workflow, `<repo>-brainstorm`):
send the minimal shape, the generated grammar.json fragment, the failing phase and the proposed
fix *before* coding it. Keep grammar packages, plumbing and each codegen fix in separate
commits so each can be reviewed alone. Do not commit until the user approves committing.
