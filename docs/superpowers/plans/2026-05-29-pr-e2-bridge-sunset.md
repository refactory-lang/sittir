# PR-E2 — Sunset the deprecated `bridge.rs` NodeData render path

> **For agentic workers:** Execute stage-by-stage; each stage compiles independently. Rust-emitting — gate on `cargo check --workspace --all-features` + **`cargo test --workspace`** (the discriminating gate) + `pnpm validate:native` hold.

**Goal:** Remove the dead NodeData render path (`render_nodedata_into` + `bridge.rs` + `render_dispatch`) and its callers, across all 3 grammars. Production + the validator render exclusively via the **transport** path (`render_transport_parts`); the NodeData/JSON-string path has **zero napi callers** (isolation-test-confirmed).

**Architecture:** The bridge path is a self-contained dead island. Severing it = drop vestigial imports + `render_dispatch` + bridge emission (emitter-driven, `render-module.ts`) **plus** two non-emitter edges: the static crate-root `lib.rs` `EngineGrammar::render` impl (×3) and the `sittir-parity-tests` harness.

**CRITICAL gate correction:** `validate:native` deep-AST renders via the **transport** path — it **cannot** detect bridge removal (count-hold is necessary but NOT sufficient). The **discriminating gate is `cargo test --workspace`** (parity-tests exercise `render_dispatch`). Watch both.

**Edit-kind split (do NOT conflate):**
- **Emitter-driven** (fix `packages/codegen/src/emitters/render-module.ts`, regenerate): `render/{mod,bridge,dispatch,transport,templates}.rs`.
- **Static / hand-written** (edit directly — NOT generated): `rust/crates/sittir-{rust,ts,python}/src/lib.rs` (crate root), `rust/crates/sittir-core/src/engine.rs`, `rust/crates/sittir-parity-tests/tests/parity.rs`.

**Baseline:** rust ast 125 / ts ast 72 / py ast 76 (deep, must HOLD — bridge is dead so removal is count-neutral) + `cargo test --workspace` green.

---

## Open design decision (resolve before S2)

`EngineGrammar::render` cannot be re-pointed (NodeData ≠ AnyTransport; no non-napi conversion). Two options:
- **(A) Full removal (spike-recommended):** remove the `render` trait method (`engine.rs:25`) + grammar impls + `ParsedTree::render`/`render_node_data` + the 6 sittir-core trivia unit tests (engine.rs:475-539 — they drive `render_node_data`'s trivia-wrapping, itself dead with no napi caller). Cleanest; retires dead surface + dead tests.
- **(B) Minimal cut:** make the grammar `render` impls `unimplemented!()`, keep the trait + core island + the trivia tests. Preserves the trivia-wrapping logic/tests at the cost of leaving dead surface.

---

## Staged plan (rust-first; ts/python mechanical, separate commits)

| Stage | Edit | File(s) | Kind |
|---|---|---|---|
| **S1** | Retire the parity render/roundtrip arms (kills the `render_dispatch` consumer first) | `sittir-parity-tests/tests/parity.rs:43/52/61`, `Cargo.toml` | static |
| **S2** | Per decision (A/B): remove or neuter `EngineGrammar::render` + (A) `ParsedTree::render`/`render_node_data` + 6 trivia tests; drop `pub use render::{render_nodedata_into,…}` from crate-root `lib.rs` | `sittir-core/src/engine.rs`, `sittir-{lang}/src/lib.rs:30,52-56` | static |
| **S3** | Stop emitting `dispatch.rs` (`render_dispatch`); drop `pub mod dispatch` + `pub use dispatch::render_dispatch` from `mod.rs` | `render-module.ts` (`libRsContents` ~2387/2395; dispatch emit ~2507) | emitter |
| **S4** | Drop the vestigial `use super::bridge::*` (transport/templates) + `use super::dispatch::render_dispatch` (transport) | `render-module.ts` | emitter |
| **S5** | Stop emitting `bridge.rs`; drop `pub mod bridge` + `pub use bridge::render_nodedata_into` from `mod.rs` | `render-module.ts` (`bridgeRsContents` ~2477; `bridgeRs:` ~2548; run-codegen.ts:343 `writeFile(emit.bridgeRs…)`) | emitter |

**Per rust-emitting stage (S3-S5) + final:**
- [ ] `cargo check --workspace --all-features` clean (workspace-wide — `-p sittir-rust` alone misses parity + core).
- [ ] `cargo test --workspace` green (**the discriminating gate**).
- [ ] `pnpm validate:native` deep-AST HOLD at 125/72/76 (.node rebuilt).
- [ ] Commit (source + regen; exclude `test-fixtures.json`).

**Restore note:** `git checkout -- .` (never `git stash` — swallowed-failure hazard). Regen rewrites manifests + `test-fixtures.json` (derived, never stage).

## Out of scope
PR-E band-aid cleanup (band-aid 1 delete + band-aid 2 relabel) — deferred/orthogonal (band-aid 2 is load-bearing; see `project_pr_e_spec_premises_false`).
