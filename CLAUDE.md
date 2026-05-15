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
- Current branch state (honest, post-`$text`-fastpath-unmask; supersedes the masked 134/136 number recorded earlier):
  - rust/native read-render-parse: `81/136 pass, ast=45` (factory-render-parse `726/1425, ast=710`; cov `174/180`; from `137/168`)
  - typescript/native recursive RT: re-measure with restored sittir-8 wiring before trusting any stored number
  - python/native recursive RT: re-measure with restored sittir-8 wiring before trusting any stored number
  - the frozen reference worktree is `/Users/pmouli/GitHub.nosync/refactory-lang/sittir-polymorph-rollback-sonnet`
  - do **not** modify that frozen worktree unless explicitly reactivated
- Measurement rule (per cleanup-rules §B1 / §D2):
  - no `pnpm -r run build` needed — tsx + tsconfig paths resolve to source
  - run counts via the validator CLI: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native <grammar>`
  - validator output now appends the first 5 failing entries per stage with entry name — feeds straight into `pnpm probe:validate --first-failing`
  - trust cov over RT; the `134/136` baseline previously recorded here was `$text`-fastpath-masked and should not be chased

### Cross-grammar skip audit

- The earlier per-grammar numbers in this section were all `$text`-fastpath-masked. Re-measure with `pnpm exec tsx packages/validator/src/cli.ts counts --backend native <grammar>` before treating them as ground truth. Cleanup-rules §D2 governs.
- The rust read-render-parse honest number is currently `81/136`, with 53 failing entries in the first list (validator emits the first 5 with corpus entry names).

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
