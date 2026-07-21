# KindId-based NodeRefs — design

**Status:** proposed (user-directed pivot, 2026-07-20). Evidence base: read-only discovery inventory (appendix below), commissioned after the Wave-2 debt close-out (PR #173) demonstrated the failure class this design retires.

## 1. Problem

Slot values / NodeRefs in the nodemap graph reference kinds by NAME STRING, and every consumer independently re-resolves those names: `hydrateSlotRefs`' `_`-prefix retry, `findKindEntry`'s 3-step chain, `buildKindIdByKind`'s first-wins map, the runtime `kindIdFromName` switch, symbolName fallbacks. Name spaces collide where parser identities don't — literal texts vs rule names (#129, six emitter sites), hidden `_X` vs visible `X`, alias targets vs sources. Every collision workaround is a separate, independently-maintained hydration of the same fact, and Wave 2 (PR #173) spent most of its effort fixing divergences *between those hydrations*.

The parser's numeric kind id (parser.c `ts_symbol_identifiers`, the project's authoritative identity per the KindID rules) is collision-free. The grammar pipeline loads it (`loadGeneratedIdTables`, generate.ts:165) **before link runs** — earlier than every ref-creation site.

## 2. End state

### 2.1 Refs carry ids as stamped facts; node identity stays the name

`NodeRef` (compiler/model/node-map.ts:358-382) gains three optional numeric facts, stamped at mint:

- `storageKindId?: number` — parser id of the storage/render kind (`node.name`/`node.kind` today)
- `parseKindId?: number` — parser id of the wire `$type` (`parseKind.name` today)
- `resolvedKindId?: number` — parser id for `value`-bearing literal refs (alongside `resolvedKind`), resolved through the LITERAL (anon-scoped) path

**The nodeMap's key and node identity remain the model kind name.** Ids are attributes, not identity. This is forced by measurement, not taste:

- id→node is **non-injective**: 16 rust / 11 python / 14 typescript collision groups — literal-text twins (`&` + `amp`) and hidden/visible group twins (`_X_group1` + `X_group1`), including two typescript pairs where one id maps to nodes with **different modelTypes** (`_enum_body_group1`[group] vs `enum_body_group1`[separatedList]).
- Real ref targets have **no parser id by design**: enrich-synthesized markers (`_kw_*`, `_async_marker`), IR-only enum kinds (`_operator`), tree-sitter-erased hidden supertypes (`_path`, `_declaration_statement` — rust 17 / python 13 / typescript 45 live ref targets), `_<kind>_optional<N>` helpers, render-only external-scanner rules. An id-less ref carries names only; the absence is typed, not discovered via lookup misses.

### 2.2 One resolution chain (precondition)

Two parallel 3-step chains exist today and **disagree on step 3**: `findGeneratedKindEntry` (generated-metadata.ts:117-134, broad symbolName match) vs `findKindEntry` (kind-discriminant.ts, anon-scoped after the `_as_pattern` shadowing bug). Mint-time stamps inherit whichever chain runs at the mint — stamping through the broad chain would move the #129 class *upstream* instead of killing it. Before any stamping lands, the two chains merge into ONE shared pair:

- `findKindEntry(name)` — rule-name callers (exact key → `_`-prefix → anon-scoped symbolName)
- `findKindEntryForLiteral(text)` — literal-text callers (anon-scoped symbolName first → named fallback)

hosted in one module, imported by both generated-metadata and the emitters. The mint funnel already keeps STRING/SYMBOL cases separate, matching this split.

### 2.3 Consumers read stamped ids instead of re-resolving

Once refs carry ids (discovery §2 classification):

- **Retire:** `hydrateSlotRefs`' `_`-prefix retry; `findKindEntry`/`hasCatalogEntry` calls at ref-consuming emit sites; `buildKindIdByKind` map lookups keyed by ref names; the emit-time `findKindEntryForLiteral` re-resolutions the #129 fix added (their job moves to the mint); `acceptedTransportKinds`' name-keyed alias redirects (a dual-id ref supplies the accepted-id set directly).
- **Simplify:** the `isUnresolvedRef(v.node) ? v.node.name : v.node.kind` fork (~85 sites); `resolveParseKindCollisions`' name+structural-signature keying (id equality); parseKind fold/dedupe passes.
- **Keep name-based:** slot/storage naming projections, typeName/member emission, diagnostics text, `referencedKinds`, the runtime `kindIdFromName` switch (human-facing input surface only — codegen call sites bake numeric ids).

### 2.4 Serialization: names stay the identity on disk

`node-model.json5` keeps NAME-based refs. Ids stay in-memory derived facts. Rationale: python's grammar.js nondeterminism renumbers parser.c ids across regens — committed id-bearing artifacts would be permanent regen noise. Side fix folded in: `emitNodeModel` runs before `hydrateSlotRefs`, so today 170 (rust) / 102 (python) targets serialize `unresolved: true` purely from phase ordering; with mint-time stamps, `unresolved` reverts to meaning "no AssembledNode exists," orthogonal to id presence — document it as such.

## 3. Migration order

1. **PR-K1 — reconcile the resolution chains** (§2.2). Byte-neutral gate expected: chains agree everywhere except the step-3 scope, and every live divergence is a latent bug of the #129 class. Any output diff is a found bug, triaged individually.
2. **PR-K2 — stamp ids at the five mint sites** (deriveValuesForRule, node-map.ts:1267-1330) + carry through `dedupeValues`/fold/alias-expansion passes + serialization-shape tests. No consumer changes; byte-neutral by construction.
3. **PR-K3 — consume**: retire class-(a) sites, simplify class-(b), bake codegen-side `kindIdFromName` calls to numeric ids. Gated per-site on byte-identical generated output (or triaged diffs = found bugs, per PR-K1's rule).
4. **PR-K4 — twin dedupe study** (separate decision, not blocking K1-K3): fold literal-text twins (`&`/`amp` — look like pure collection-time duplication); group twins need a modelType-divergence resolution first (ties into enum_body_group1's multi-field debt and the mintContentAliasKinds self-ref bug — see §4).

## 4. Explicitly connected debts

- **mintContentAliasKinds self-ref classification bug** (KNOWN_ISSUES #1): *not* dissolved by ids alone — hidden `_foo` storage and promoted `foo` parse kind share one parser id, so an id-only ref makes the self-collision indistinguishable. The dual-id split (storageKindId ≠ parseKindId as separate facts) is the mechanism that CAN dissolve it; revisit the bug in PR-K4's twin study.
- **python promoted alias targets** (`element_list`, `pattern_group`, `parameter_list`) surface NO catalog id in the visible-node-type walk (generated-metadata.ts:136-155) — investigate during PR-K2; likely an alias-display-name gap in the catalog walk.
- **enum_body_group1** (#170 residual): its group/separatedList twin is one of the two divergent-modelType id collisions; PR-K4 and the multi-field partition fix are the same conversation.

## 5. Non-goals

- Changing nodeMap keying or serialized identity to numeric ids (blocked by non-injectivity + renumbering).
- Removing the runtime `kindIdFromName` switch (public input surface).
- Folding the divergent-modelType group twins inside K1–K3.

## Appendix — discovery inventory (2026-07-20, read-only pass)

Probe scripts (rerunnable): session scratchpad `kindid-ref-probe.mts` (catalog-absent targets per grammar), `kindid-collide-probe.mts` (id collisions + fallback-only resolutions). Headline numbers, current tree:

- **Mint funnel:** all refs created in `deriveValuesForRule` (node-map.ts:1244-1400), five sites (SYMBOL-literal :1267, SYMBOL :1281, SUPERTYPE :1295, STRING/PATTERN :1306, enum-CHOICE :1320); `DeriveCtx.kindEntries` already threaded; STRING/PATTERN/enum sites already call `findGeneratedKindEntry` and discard `.id`. Refs are never created during evaluate; assemble-time only.
- **Resolution-site census:** retire-class sites at assemble.ts:1107-1177 (hydrate + `_`-retry :1137-1143), kind-discriminant.ts:136-156 chain callers (from.ts:1510, type-test.ts:79, types.ts:671, wrap.ts:943/1000/1064/1805), render-module.ts:1386/2420-2456/2844-2886/3032/3083-3107, transport-common.ts:141-166. Simplify-class: kindsOf/slotKindNames/valueParseKindsOf/aliasTargetToSourceMapOf projections, resolveParseKindCollisions (node-map.ts:1058-1126), expandAndDedupeContentTypes (from.ts:1032-1047), ~42 isNodeRef / ~43 isUnresolvedRef forks.
- **Dual-id read sites:** storageKindOfValue :1051, projectSlotNaming :1957-1974 ("parallel, must NOT cross"), collision resolution :1071 (`preferRepresentative: storageKind === parseKind`), dedupe key :1416, folds :1999-2069/2138-2143, node-model.ts:402/411, parseAliases consumers (transport-common.ts:160-164, render-module.ts:2763, wrap.ts:400, factory-map.ts:77).
- **Catalog health:** 0 id-less catalog rows, 0 intra-catalog id collisions (all 3 grammars). Model kinds with no name-resolvable id: rust 45/389, python 23/262, typescript 67/434 (populations: enrich markers, IR-only enums, erased hidden supertypes, `_optional<N>` helpers, JSX-in-non-tsx, token oddities). Live ref targets with no id: rust 17 / python 13 / typescript 45.
- **id→node collisions:** rust 16 / python 11 / typescript 14 groups; literal-text twins (rust 3 / py 6 / ts 7) + hidden/visible group twins (rust 13 / py 5 / ts 7); typescript divergent-modelType pairs: `_catch_clause_group1`[group]/`catch_clause_group1`[branch], `_enum_body_group1`[group]/`enum_body_group1`[separatedList]. Fallback-only resolutions (never exact key): rust 49 / py 25 / ts 38.
- **Serialization:** emitNodeModel at generate.ts:304 precedes hydrateSlotRefs :310 → 170/102 ordering-artifact `unresolved:true` entries (rust/python). Ref-shape-pinning tests: node-model-emit.test.ts:29-52, emitter-consts.test.ts:116-130, render-module-emit.test.ts:94-122, resolve-effective-literal.test.ts:51-146, keyword-presence.test.ts:46, reconcile-naming.test.ts:21/124-156.
