# Handoff — `021-rule-ids-at-evaluate`

**Date**: 2026-04-30  
**Branch**: `021-rule-ids-at-evaluate`  
**HEAD**: `93737642`  
**Base design docs**:

- `docs/superpowers/specs/2026-04-29-renderable-native-views-design.md`
- `docs/superpowers/specs/2026-04-30-kindid-runtime-migration-design.md`

This handoff captures the current state of the KindID work after the
native-view changes landed on the branch.

---

## 1. What landed recently

Recent relevant commits on this branch:

| SHA | Title | Why it matters |
| --- | --- | --- |
| `93737642` | `Merge branch '021-renderable-native-views-impl' into 021-rule-ids-at-evaluate` | The native-view implementation line is merged onto the active branch. Review after merge found that the plain-object typed transport landed, but the full renderable-native-view architecture from the design did **not** fully land yet — details in Section 2A below. |
| `3c0cb69e` | `native: pass plain transport objects across napi` | Confirms the JS↔native boundary is now plain-object transport rather than JSON strings. This was a prerequisite assumption for the KindID runtime design. |
| `874fe7a6` | `docs: refine KindID runtime design` | Replaces the earlier KindID design with the approved `parser.c`-backed symbol-catalog design. |
| `5410d1bf` | `codegen: emit data-only native transport types` | Part of the native-view implementation line. Relevant because KindID migration will now target these transport types rather than the old string/JSON path. |
| `eda590eb` | `codegen: preserve generate fallback` | Latest code change from the paused Task 1 investigation. |
| `56d0430f` | `codegen: source KindID from metadata` | Intermediate Task 1 attempt — important mostly because it exposed the `ts_symbol_names[]` collision problem. |
| `01fdc019` | `codegen: emit KindID runtime discriminants` | Initial Task 1 attempt; superseded by the refined catalog design. |
| `fd487b42` | `docs: add KindID runtime migration design` | Earlier design commit, now refined by `874fe7a6`. |

---

## 2A. Native views landing review (written up)

Reviewed merge:

- merge commit: `93737642c333760c9700f42e803ac0b91cf54bd8`
- review base: `874fe7a6d660227ae4ffced68d5537acb19dbe18`
- design reference:
  `docs/superpowers/specs/2026-04-29-renderable-native-views-design.md`

### What the review confirmed landed

1. **Plain-object JS→Rust transport is real**
   - TS backends now call native render with object transport, not JSON text
   - the N-API layer accepts object payloads directly

2. **Per-kind transport generation is real**
   - TS emits data-only per-kind `*.Transport` interfaces
   - Rust emits matching transport structs/enums

3. **Native backend activation is guarded**
   - backend selection checks both template hash and transport ABI before
     enabling native

### What the review found did **not** land

1. **Typed transport is collapsed back into generic `NodeData` before render**
   - generator source: `packages/codegen/src/emitters/render-module.ts`
   - generated Rust rebuilds generic `NodeData` / `FieldValue` and then calls
     the old `render_dispatch(&node)` path
   - there is no generated per-template `from_transport(...) -> ViewStruct`
     bridge as approved in the design

2. **The Askama-facing value model is still string-backed**
   - `FieldView` / `ListView` still hold strings rather than a closed
     `Renderable` family
   - join-style filters still return `String`
   - the streaming Askama wrapper design did not land

### Bottom line

The merge landed the **typed plain-object transport** portion of the native
views design, but **not** the actual renderable-native-view layer.

So the accurate dependency statement for follow-on work is:

- **safe to assume:** plain object transport over N-API and generated
  per-kind transport types
- **not yet safe to assume:** direct transport → Askama view bridging,
  renderable `FieldView` / `ListView`, or streaming join/filter wrappers

---

## 2B. Current KindID design (approved)

The current approved design is in:

- `docs/superpowers/specs/2026-04-30-kindid-runtime-migration-design.md`

The important decisions are:

1. **KindID identity comes from `parser.c` only**
   - authoritative source: `enum ts_symbol_identifiers`
   - no `parser.wasm` fallback for KindID identity
   - `ts_symbol_names[]` is display/debug metadata only

2. **Parser symbol identity is minimally cleaned**
   - strip only prefix families:
     - `sym_foo -> foo`
     - `anon_sym_PLUS -> PLUS`
     - `aux_sym_bar_repeat1 -> bar_repeat1`
     - `alias_sym_baz -> baz`
   - preserve parser-origin facts as flags:
     - `anon`
     - `aux`
     - `alias`
     - `hidden`

3. **Do not overload parser names as the global join term**
   - `key` is the canonical Sittir cross-pipeline value (the existing
     grammar/node-types/runtime-facing join term)
   - parser-derived names like `PLUS` stay metadata, not the global join
     key

4. **One grammar-wide symbol catalog**
   - covers every parser symbol, even if it does not map to the current
     generated runtime surface
   - stores:
     - `id`
     - optional `key`
     - parser metadata
     - JS/native emitted names
     - presence flags
     - use flags

5. **Two flag sets**
   - `KindPresenceFlag`: `TSGrammar | TSNodeTypes | TSRuntime`
   - `KindUseFlag`: `Readable | Buildable | Renderable`

6. **JS/native names are intentionally different**
   - JS:
     - `enumName: 'AsPattern'`
     - `methodName: 'asPattern'`
   - native:
     - `enumName: 'as_pattern'`
     - `methodName: 'as_pattern'`

---

## 3. Why Task 1 was paused

The original Task 1 implementation tried to use the late generated ID
tables keyed by the effective symbol name. That exposed a real tree-sitter
name-table collision:

- `sym__as_pattern = 165`
- `sym_as_pattern = 178` (via `parser.c`)
- `ts_symbol_names[]` maps both to `"as_pattern"`

That means `ts_symbol_names[]` is **not** a uniqueness-preserving identity
surface. Using it as the KindID key source makes `_as_pattern` and
`as_pattern` collapse.

That is why the implementation was paused and the design was refined.

**Status of the old task:** blocked/pending redesign integration. Do not
resume from the old plan without rewriting it around the approved symbol
catalog design.

---

## 4. Repo guidance already updated

`CLAUDE.md` now records the durable KindID rules:

- `parser.c` is the KindID identity source
- no `parser.wasm` fallback for KindID identity
- use `key` as the canonical cross-pipeline join term
- retain parser-origin flags in metadata
- use `KindPresenceFlag` / `KindUseFlag`
- read JS/native emitted names from the catalog

Future implementers should read `CLAUDE.md` first and follow those rules.

---

## 5. Plan status

There is an older implementation plan at:

- `docs/superpowers/plans/2026-04-30-kindid-runtime-migration.md`

It was written **before** the refined `parser.c`-catalog design settled.
Do not execute it as-is. It needs to be rewritten around:

1. replacing the current generated-metadata join logic
2. introducing the grammar-wide symbol catalog
3. emitting KindID helpers from catalog entries
4. then switching runtime/transport/native dispatch to numeric `$type`

At the time of this handoff, the plan rewrite was in progress but not yet
saved.

---

## 6. Concrete next steps

1. **Rewrite the implementation plan**
   - update `docs/superpowers/plans/2026-04-30-kindid-runtime-migration.md`
   - make the first task about replacing the current `generated-metadata.ts`
     join with a `parser.c`-backed symbol catalog

2. **Restart implementation from the new plan**
   - discard the old “emit TSKindId directly from `kindIds` map” approach
   - start with failing tests around:
     - symbol-catalog extraction from `parser.c`
     - `_as_pattern` / `as_pattern` staying distinct
     - no `parser.wasm` fallback for KindID identity

3. **Only after the catalog exists, continue into runtime migration**
   - TS runtime/data `$type`
   - JS/native transport
   - Rust native transport + render dispatch

---

## 7. Files most relevant to resume from

- `docs/superpowers/specs/2026-04-30-kindid-runtime-migration-design.md`
- `docs/superpowers/plans/2026-04-30-kindid-runtime-migration.md`
- `CLAUDE.md`
- `packages/codegen/src/compiler/generated-metadata.ts`
- `packages/codegen/src/compiler/types.ts`
- `packages/codegen/src/compiler/generate.ts`
- `packages/codegen/src/emitters/types.ts`
- `packages/codegen/src/emitters/consts.ts`
- `packages/codegen/src/__tests__/kindid-emit.test.ts`
- `packages/codegen/src/__tests__/generated-metadata.test.ts`
- `packages/codegen/src/__tests__/generate.test.ts`
- `packages/codegen/src/__tests__/emitter-consts.test.ts`
- `packages/rust/src/engine.ts`
- `rust/crates/sittir-core/src/types.rs`

---

## 8. Working assumptions that are now true

- Plain object transport over N-API has landed on this branch.
- Generated per-kind native transport types have landed on this branch.
- The full renderable-native-view layer has **not** fully landed yet; the
  merged implementation still routes typed transport back through generic
  `NodeData` and string-backed view/filter types.
- The KindID design is approved in its `parser.c`-catalog form.
- The earlier Task 1 implementation attempts are **not** the right basis
  for the next wave of changes.
