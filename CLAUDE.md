# sittir

Generate typed factories, render templates, and native bindings from tree-sitter grammars.

## Quick reference

- Package manager: `pnpm`
- Validate: `pnpm test`, `pnpm type-check`, `pnpm lint`, `pnpm format:check`
- Generate a grammar package: `npx tsx packages/codegen/src/cli.ts --grammar <rust|typescript|python> --all --output packages/<lang>/src`

## Universal rules

- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, `packages/{rust,python,typescript}/factory-map.json5`, or `packages/{rust,python,typescript}/overrides.suggested.ts`; fix codegen or `packages/<lang>/overrides.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.
- Specs live under `specs/NNN-feature-name/`; feature branches use `NNN-short-name`.
- DRY is the core correctness rule for codegen work: each fact should have one source and one derivation.

## Detailed instructions

- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)

## Current investigation handoff (`023-native-read-parity`)

- Session handoff doc: `/Users/pmouli/.copilot/session-state/6bcf5246-449f-4d2d-9c9f-50b5b3d675c9/plan.md`
- Current branch state:
  - rust/native recursive RT: `134/136`, `fail=0`, `skip=2`, `ast=134`
  - typescript/native recursive RT: `83/112`, `fail=0`, `skip=29`, `ast=83`
  - python/native recursive RT: `115/115`, `fail=0`, `skip=0`, `ast=115`
  - the frozen reference worktree is `/Users/pmouli/GitHub.nosync/refactory-lang/sittir-polymorph-rollback-sonnet`
  - do **not** modify that frozen worktree unless explicitly reactivated
- Measurement rule:
  - trust counts only after a full rebuild: `pnpm -r run build`
  - then run counts, e.g. `npx tsx packages/codegen/src/scripts/counts.ts rust --recursive`

### Cross-grammar skip audit

- Current native recursive RT counts:
  - rust: `134/136`, `skip=2`, `fail=0`
  - typescript: `83/112`, `skip=29`, `fail=0`
  - python: `115/115`, `skip=0`, `fail=0`
- Important: the current RT gap is **all skip debt**, not runtime RT failures
- Every current skip is a **parse-error skip**

### Override parser comparison

Comparing base tree-sitter WASM vs `packages/<grammar>/.sittir/parser.wasm` on the corpus:

- rust: base parser errors `2`, override parser errors `12`, override-only regressions `10`
- typescript: base parser errors `2`, override parser errors `31`, override-only regressions `29`
- python: base parser errors `0`, override parser errors `1`, override-only regressions `1`

So the remaining skip debt is primarily **override parser regression**, not validator/read-render-parse logic.

### Current rust parser leads

Rust override-only regressions:

- `Functions with precise capture syntax`
- `Functions with empty precise capture syntax`
- `Generic functions`
- `Inherent Impls`
- `Trait impls`
- `Trait declarations`
- `Macro invocations inside trait declarations`
- `Where clauses`
- `Scoped functions`
- `Struct patterns`

Current concrete parser-diff findings:

1. `self_parameter` is misparsed in the override parser.
   - `&self`, `&mut self`, and `&'a mut self` are being read as `ERROR(self)` / `reference_pattern`
   - this likely explains several rust skip entries at once (`Generic functions`, `Where clauses`, `Inherent Impls`, `Trait impls`, `Trait declarations`, precise-capture entries)
2. Pattern-side turbofish/scoped parsing is broken.
   - `Some::<isize>(x)` inside match patterns is misparsed via `generic_pattern`
   - this is the current lead for `Struct patterns`
3. Scoped generic function calls are broken.
   - `C::<D>::e()` loses the expected call shape / semicolon in the override parse
   - this is the current lead for `Scoped functions`

### Rust update

The rust override parser regressions above are now fixed on the current branch.

- Root cause:
  - parser-critical auto-synthesized `_kw_*` helpers changed parse behavior
  - specifically:
    - `_kw_reference` was synthesized as `prec(-1, '&')`
    - `_kw_turbofish` was synthesized as `prec(-1, '::')`
- Fix:
  - move the fix into the shared DSL path: wire now auto-appends synthesized `_kw_*` helpers to `inline:`
  - synthesize bare token bodies (no default `prec(-1, STRING)` wrapper)
  - resolve inline entries through native symbol construction instead of fabricating raw objects
  - remove the now-redundant rust-specific manual `_kw_reference` / `_kw_turbofish` override bodies and inline entries
- Result after full rebuild:
  - rust override parser errors now match the base parser exactly (`2`, both baseline)
  - rust/native recursive RT is now `134/136`, `skip=2`, `fail=0`, `ast=134`
  - the former rust override-only skip set is gone

### Shared `_kw_*` update

- Shared files:
  - `packages/codegen/src/dsl/primitives/field.ts`
  - `packages/codegen/src/dsl/wire/wire.ts`
  - `packages/codegen/src/compiler/evaluate.ts`
- Behavior:
  - field-promoted bare tokens now synthesize plain `_kw_*` helper bodies
  - wire drains those helpers into `inline:` automatically after rule evaluation
  - the inline drainer now uses native symbol construction
- Measured before/after native recursive RT:
  - rust: `134/136` → `134/136` (holds the rust fix without the manual override patch)
  - typescript: `81/112` → `83/112`
  - python: `114/115` → `115/115`

Remaining rust baseline-only parser skips:

- `External Modules`
- `Raw reference expression conflicts`

### TypeScript note

- There was earlier discussion of “skip JSX for now”, but that is **not** implemented.
- The known TSX/JSX issue is:
  - corpus reader still keeps `:language(...)` directive lines in source
  - validator/parser loading still uses plain TS only, not per-entry TSX
- This is intentionally punted for now while rust override parser regressions are investigated.
