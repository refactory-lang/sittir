# Handoff — askama retirement (after the dependency removal)

Branch `spec/render-options` (PR #269), HEAD `ebe9129d4` (not pushed). Working tree clean apart from pre-existing untracked files (handoffs, `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, `packages/types/.vitest-report.json`, `examples/01-construct-nodes.ts`, the 2026-09-02 handoff) — never stage those.

## Where the askama retirement stands

Four commits, each gated on byte-identical renders (validator counts equal
the previous run for all three grammars; the six dogfood renders identical):

- `6f890be35` the template walk builds a body IR (`emitters/render-body.ts`: text, whitespace, slot, space, adjacent, if, indent); `printJinja` prints it. The two python INDENT templates changed spelling only (raw LF → `\n`).
- `db0bb1070` the template emitter reads the spaced render rules (`renderRules.rules[kind]`), looks through flank triples (`flanksOf`) and reads a spaced separator as its token; the seam-stamping dry run lives in `emitAll`.
- `97dc8bfe3` render bodies are generated Rust: `write_body_<kind>(template, dest)` in `transport.rs`, printed by `printRustBody`; the views have an askama-free `render_into`; every render path returns `std::fmt::Result`; python's indent block uses `spacing::IndentWriter` (askama's `indent(2, true)` semantics).
- `ebe9129d4` askama removed: no derive, view structs in `transport.rs`, no `templates.rs`, no crate template copies, no filter functions (`PresenceCheck` stays); `RENDER_MODULE_HASH` over `transport.rs` + `options.rs` replaces the template bundle hash (engine getter `renderModuleHash`, `hash.rs`/`hash.ts`, backend shims, `native-staleness.ts` compares `src/render/*.rs`); scope script updated; `regen-templates-rs.ts` deleted; `template-hash.ts` is `bundle-hash.ts`.

## The open decision

`packages/*/templates/*.jinja` are STILL emitted (`EmittedTemplates.jinja`,
`writeJinjaTemplates`), because the validator tooling reads them:

- `packages/tools/src/validate/templates-path.ts` — `deriveRuleKinds` (the kind universe of read-render-parse, factory-render-parse, the corpus census) and `loadRulesFromPath` (bodies).
- `packages/tools/src/validate/template-coverage.ts` — `jinjaBodyToLegacyRule` parses the Jinja bodies for the `cov` metric.
- `packages/tools/src/probe/kind.ts`, `packages/tools/src/scripts/collect-baseline.ts` — `createRenderer(templatesPath)` from `@sittir/legacy-core` (Nunjucks) for non-native diagnostics.
- `tool check-jinja` (CI step), `native-staleness` no longer, the manifest root `packages/<g>/templates`, the hookify block pattern, CLAUDE.md's generated-artifact list.

Options: (A) keep the Jinja files as a diagnostic projection of the IR
(the printer stays as a serializer, nothing renders with them); (B) emit an
IR sidecar (`.sittir/render-bodies.json`) and port the validators' kind
catalog, the coverage adapter and the diagnostics off Jinja, retire the
Nunjucks path, then delete the `.jinja` directories, `printJinja`,
`separateBraceFromTag`, `EmittedTemplates.jinja`, the `jinjaTemplates`
naming, the CI step and the doc mentions.

## Then

- Task 5 docs: README.md (engine description, pipeline table, diagram), `.claude/architecture.md`, `.claude/grammar-workflow.md` (Nunjucks ∩ Askama line), `.github/agents/sittir-research.agent.md` (render path), `docs/compiler-phase-glossary.md` render narrative, `docs/cli-command-glossary.md` (regenerated).
- Kind-level `<kind>_before` / `<kind>_after` seams with a coalescing writer; then plan 4 (`engine.ir`, `tree.options()`, `reformat`).

## Facts you would otherwise have to rediscover

- Gates: `pnpm exec vitest run --root packages/codegen` (125 files); per-package `pnpm exec vitest run`; `pnpm run type-check`; `rtk cargo test --workspace --exclude sittir-parity-tests` (102); `pnpm exec tsx packages/cli/src/cli.ts validate counts` (rows must equal: rust 149/149 207/207 134/137 1517/1517; ts 145/145 193/193 112/114 1202/1202; py 126/126 142/142 115/116 1390/1390); `bash scripts/assert-scope-boundaries.sh`. Dogfood: a scratch script imports `rebuildSplice`/`rebuildSpliceStrict`/`rebuildFormat`/`rebuildFormatStrict`/`rebuildProbeSweep`/`rebuildProbeSweepStrict` from `examples/17|18|19-dogfood-*.ts` and `$render()`s them — sizes rust 2222/745, ts 473/569, py 196/203.
- Regen: `gen --grammar <g> --all --output packages/<g>/src --skip-ts-chain` per grammar; a grammar's napi build compiles the whole workspace, so after a core change regenerate all three before trusting any binary (the first grammar's build fails against the stale others). A codegen-source edit after a regen invalidates the manifests' `source_hash`; a template-only regen (`--no-build-native --no-workspace-check`) re-stamps them.
- Infigraph's local DB is corrupted (kuzu WAL, index_project fails "checkpoint in progress"); shell search needs `date +%s > .infigraph/.search-fallback-allowed` in its own Bash call immediately before each `rg`.
