# Handoff — `021-rule-ids-at-evaluate`

**Date**: 2026-05-01 (updated)  
**Branch**: `021-rule-ids-at-evaluate`  
**PR**: #19 (open)  
**Base design docs**:

- `docs/superpowers/specs/2026-04-29-renderable-native-views-design.md`
- `docs/superpowers/specs/2026-04-30-kindid-runtime-migration-design.md`
- `docs/superpowers/plans/2026-05-01-typed-transport-fields.md` (ADR-0016 resolution)

---

## 1. What landed in this session

### KindID runtime migration (DONE)

- **Symbol catalog**: `generated-metadata.ts` derives `KindParserMetadata` from `parser.c` `enum ts_symbol_identifiers`, keying on prefix-stripped C symbol (not lossy `ts_symbol_names[]`)
- **TSKindId const enum**: numeric `const enum TSKindId` in generated `types.ts` with `KIND_NAMES: ReadonlyMap<number, string>` (static lookup, no function)
- **Numeric $type end-to-end**: `AnyNodeData.$type: number`, factories stamp numeric IDs, `is.*` guards use numeric comparison via `_kindIdByKind` Map
- **Rust KindId newtype**: `#[repr(transparent)] pub struct KindId(pub u16)` in `sittir-core/src/types.rs`, per-grammar `kind_ids.rs` with `pub const` entries
- **Catalog flags**: `KindPresenceFlag` (TSGrammar | TSNodeTypes | TSInternals), `KindUseFlag` (Readable | Buildable | Renderable)
- **Engine.ts refactor**: generic `createGrammarEngine` in `@sittir/core`, codegen emits 41-line thin wrapper per grammar
- **Forms removed from nodeMap**: `__form_*` override polymorph forms no longer inserted as top-level `nodeMap.nodes` entries

### ADR-0016 typed transport resolution (DONE)

- **Typed slot classification**: `classifySlot(field, nodeMap)` returns concrete/supertype/heterogeneous based on `AssembledField.projection.kinds`
- **Per-supertype transport enums**: e.g. `ExpressionTransport` with custom `FromNapiValue`, per-supertype render helpers
- **RenderableTransport trait**: `render_into<W: Write>(&self, dest: &mut W) -> Result<(), askama::Error>` + `render_to_string()` default
- **Zero `render_transport_dispatch` internal callers**: all heterogeneous slots now dispatch through `.render_to_string()` via the trait
- **impl RenderableTransport per grammar**: rust 392, typescript 419, python 236 impls generated
- **NonterminalView cardinality split**: `SingleNonterminalView`, `OptionalNonterminalView`, `ListNonterminalView`
- **Renderable family**: `Renderable<'a>` enum (Text/Joined) with streaming `FastWritable` impls

### Cleanup

- `kindNameFromId` function eliminated — replaced by `KIND_NAMES` static Map
- `displayName` → `symbolName` rename across catalog
- `TSRuntime` → `TSInternals` presence flag rename
- `NativeNodeData` deleted (unified with `AnyNodeData`)
- Engine.ts duplication eliminated (was 152 lines × 3 grammars)

---

## 2. In-progress / pending

### Test fixes (subagent running)

A background agent (`aa948d7648001ad32`) is fixing test failures caused by:
- Form kinds with `$type=0` (not in TSKindId catalog) → readNode validator `$type mismatch`
- Floor threshold adjustments for factory round-trip ceilings
- `kindNameFromId` → `KIND_NAMES` import migration in test code
- Snapshot updates for forms-out-of-nodeMap changes

Current test status: 7 failures / 676 tests. The failures are:
- readNode lost content on 11/51/33 kinds (python/rust/typescript) — form-kind `$type=0` issue
- factory round-trip ceiling exceeded (rust: 273 > 70, typescript: 138 > 90)

### Task #21: Full streaming (NOT STARTED — user wants this done)

Template fields hold `&dyn RenderableTransport` directly instead of pre-rendered strings. Goal: zero `render_to_string()` calls, zero intermediate String allocations.

Key design points (from user):
- NonterminalView wrappers (Single/Optional/List) must be preserved but made generic over `T: RenderableTransport`
- Fields based on optionality and multiplicity still need wrapping
- `render_to_string()` only used in multi-supertype inline match today — eliminate it

### LiteralTransport elimination (follow-up)

Research completed. Recommended: Option 3 — drop string constants from transport, type dynamic text kinds. User wants this as follow-up.

### Vaporized rules investigation

4 known for rust: `_kw_ref_marker`, `_primitive_type`, `comment`, `mut`. Root cause of tree-sitter dropping enrich-synthesized rules unknown. Tracked with VAPORIZED warning messaging.

---

## 3. Key files modified this session

### Rust core
- `rust/crates/sittir-core/src/types.rs` — KindId newtype, RenderableTransport trait
- `rust/crates/sittir-core/src/lib.rs` — re-exports KindId, RenderableTransport
- `rust/crates/sittir-core/src/filters.rs` — NonterminalView cardinality split, Renderable family

### Codegen emitters
- `packages/codegen/src/emitters/render-module.ts` — typed transport, slot classification, supertype enums, RenderableTransport impls (~2700 lines)
- `packages/codegen/src/emitters/types.ts` — TSKindId enum, KIND_NAMES Map, collectAllKinds
- `packages/codegen/src/emitters/factories.ts` — numeric $type, phantom-kind handling
- `packages/codegen/src/emitters/wrap.ts` — collectCatalogKinds for kindEntries
- `packages/codegen/src/emitters/client-utils.ts` — isNodeData numeric check, toNativeRenderTransport
- `packages/codegen/src/emitters/engine.ts` (NEW) — thin per-grammar engine wrapper
- `packages/codegen/src/emitters/kind-discriminant.ts` — shared helpers: findKindEntry, collectKindEntries, etc.
- `packages/codegen/src/emitters/kind-id-rust.ts` — per-grammar kind_ids.rs emission

### Codegen compiler
- `packages/codegen/src/compiler/generated-metadata.ts` — parser.c-backed symbol catalog
- `packages/codegen/src/compiler/types.ts` — KindPresenceFlag, KindUseFlag, KindParserMetadata
- `packages/codegen/src/compiler/assemble.ts` — forms removed from nodeMap

### Core runtime
- `packages/core/src/engine.ts` — createGrammarEngine generic factory
- `packages/core/src/render.ts` — resolveKindName via KIND_NAMES Map
- `packages/core/src/native-boundary.ts` — isRenderableNodeData rename
- `packages/types/src/core-types.ts` — AnyNodeData.$type: number

---

## 4. Working assumptions now true

- Numeric `$type` end-to-end (factories, readNode, guards, transport)
- RenderableTransport trait on every transport struct — streaming render foundation in place
- `render_transport_dispatch` still exists as public export + AnyTransport impl body, but zero internal callers
- Engine.ts is codegen-emitted (fix the generator, not the output)
- Forms are factory-internal artifacts, not top-level nodeMap entries
- Symbol catalog covers every parser.c symbol with presence/use flags
