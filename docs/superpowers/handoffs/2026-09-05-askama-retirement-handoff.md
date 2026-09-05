# Handoff — askama retirement (complete)

Branch `feat/askama-retirement`, stacked on `spec/render-options` (PR #269). Working tree clean apart from pre-existing untracked files (handoffs, `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, `packages/types/.vitest-report.json`, `examples/01-construct-nodes.ts`, the 2026-09-02 handoff) — never stage those.

## What landed

Five commits, each gated on byte-identical renders (validator counts equal
the previous run for all three grammars; the six dogfood renders identical):

- `6f890be35` the template walk builds a body IR (`emitters/render-body.ts`).
- `db0bb1070` the template emitter reads the spaced render rules (`renderRules.rules[kind]`, `flanksOf` look-through, spaced separators read as their token).
- `97dc8bfe3` render bodies are generated Rust: `write_body_<kind>(template, dest)` in `transport.rs`; views have `render_into`; every render path returns `std::fmt::Result`; python's indent block uses `spacing::IndentWriter`.
- `ebe9129d4` askama removed; `RENDER_MODULE_HASH` (sha256 over `transport.rs` + `options.rs`) replaces the template bundle hash; engine getter `renderModuleHash`.
- `7a6e2623d` no `.jinja` anywhere: codegen writes `packages/<grammar>/.sittir/render-bodies.json` (tracked), the validators read it (`packages/tools/src/validate/render-bodies.ts`), every validator takes a grammar only, the backend is native only, legacy-core's Nunjucks render path is deleted, `tool check-jinja` and its CI step are gone.

## Facts you would otherwise have to rediscover

- The body IR (`render-body.ts`): `text | whitespace | slot | space | adjacent | if{arms,fallback} | indent`. Structural whitespace (INDENT/NEWLINE/a whitespace kind's fixed text) is its own node; a literal blank STRING stays `text`. `weight` orders same-key arms by size with the old template spellings as its constants — the ordering is pinned, not the syntax.
- `printRustBody` coalesces every literal run into one `write_str`; gates call `is_present_check`; an indent block shadows `dest` with an `IndentWriter` (askama's `indent(2, true)`: first line indented, blank lines not).
- The validators' catalog of renderable kinds is `deriveRuleKinds(grammar)` over the sidecar keys; the coverage checker's placeholder shape comes from `bodyToLegacyRule` (slot → `$NAME`, gated arm → `$TEST_CLAUSE` + clause).
- `probe-kind --engine js|native|both` selects the READ lane (TypeScript wrap vs napi); rendering is always native. `--baseline <dir>` compares parser/read from the staged package and renders through the current native binary.
- legacy-core keeps only its `/engine` types (`engine-boundary.ts`) as a live export; the rest of the package (readNode, format, metrics, native-*) has no importer and is a candidate for deletion. Its vitest project entry has no config/setup file (pre-existing; the suite errors before running).
- Gates: `pnpm run type-check`; `pnpm exec vitest run --root packages/{codegen,tools,cli}`; per-package `pnpm exec vitest run`; `rtk cargo test --workspace --exclude sittir-parity-tests` (102); `pnpm exec tsx packages/cli/src/cli.ts validate counts` (rust 149/149 207/207 134/137 1517/1517; ts 145/145 193/193 112/114 1202/1202; py 126/126 142/142 115/116 1390/1390); `bash scripts/assert-scope-boundaries.sh`. Dogfood: import `rebuildSplice`/`rebuildSpliceStrict`/`rebuildFormat`/`rebuildFormatStrict`/`rebuildProbeSweep`/`rebuildProbeSweepStrict` from `examples/17|18|19-dogfood-*.ts` and `$render()` — sizes rust 2222/745, ts 473/569, py 196/203.
- Regen: `gen --grammar <g> --all --output packages/<g>/src --skip-ts-chain` per grammar; a grammar's napi build compiles the whole workspace, so after a core change regenerate all three before trusting any binary. A codegen-source edit after a regen invalidates the manifests' `source_hash`; a template-only regen (`--no-build-native --no-workspace-check`) re-stamps them. A newly generated file must be `git add`ed before the manifest is written.
- Infigraph's local DB is corrupted (kuzu WAL, index_project fails "checkpoint in progress"); shell search needs `date +%s > .infigraph/.search-fallback-allowed` in its own Bash call immediately before each `rg`.

## Then

- Kind-level `<kind>_before` / `<kind>_after` seams with a coalescing writer (Task 2 of this plan gave the emitter the spaced rules it needs for literal tokens); then plan 4 (`engine.ir`, `tree.options()`, `reformat`).
- Delete the rest of `packages/legacy-core` once its `/engine` types have a home.
