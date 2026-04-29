# Feature Specification: Rule IDs and Rule Classification

**Feature Branch**: `021-rule-ids-at-evaluate`
**Created**: 2026-04-27
**Status**: Refined
**Refined**: 2026-04-29 — narrowed 021 to rule identity, rule classification, and late tree-sitter metadata; extracted Binding / Simplify / Assemble re-architecture into new spec 022.
**Input**: Architectural work previously described in handoff notes as "slot IDs at evaluate stage," later clarified as a rule-first identity model. This spec now owns only the foundational ontology: rule occurrence identity, terminal/nonterminal classification on rules, field/alias classification semantics, and late tree-sitter-generated metadata such as KindID / FieldID. The Binding / Simplify / Assemble rewrite now lives in `specs/022-binding-simplify-assemble/spec.md`.

## Background

The codegen pipeline currently has one shared `Rule` IR, but it does **not** have a stable
identity for each concrete rule occurrence inside a top-level kind. Evaluate emits trees plus a
`SymbolRef[]` sidecar keyed mostly by parent kind names. Every later phase that needs structural
facts therefore re-walks trees and re-discovers them locally.

That has produced exactly the DRY failure mode called out in `CLAUDE.md` and the 016 handoff:
multiple walkers collecting partial projections of the same underlying facts.

Current examples in the implementation:

- `rule.ts::collectFieldNames()` answers "which field names appear anywhere in this tree?"
- `node-map.ts::hasAnyField()` / `hasAnyChild()` answer cheaper yes/no versions of overlapping questions.
- `node-map.ts::deriveFieldsRaw()` and `deriveChildren()` walk the canonicalized tree again to build assembled surfaces.
- `template-walker.ts::collectRepeatedFields()`, `containsRepeat()`, sibling-duplicate detection, and separator capture walk raw rule structure again for template concerns.
- `link.ts::collectRepeatedShapes()` does yet another projection over field-bearing structure.

The architectural problem is that there is no shared identity to hang these facts on. Without that
identity, every consumer carries its own walker, its own flattening rules, and its own local notion
of what counts as "the same thing."

This refinement also splits the previous merged 021/022 scope:

- **021** now defines the compiler ontology and identity model.
- **022** now owns the Binding / Simplify / Assemble rewrite and the assembled-surface migration.

## Clarifications

### Session 2026-04-29

- Q: Should structural wrapper rule occurrences receive terminal/nonterminal classification in 021, or should classification apply only to their children? -> A: Every wrapper occurrence receives a deterministic aggregate classification: nonterminal if any descendant or wrapper semantics expose a nonterminal boundary, otherwise terminal.
- Q: How stable must `RuleId` values remain across grammar changes? -> A: `RuleId` stability is required only for unchanged evaluated grammar output; structural edits may change IDs for affected paths.
- Q: How far should field and named-alias nonterminal forcing propagate? -> A: Field and named-alias forcing applies only to the immediately wrapped rule occurrence; descendants keep intrinsic or locally forced classifications.
- Q: What does rule occurrence provenance need to record? -> A: Provenance is per rule occurrence root: grammar-authored, override-authored/replaced, or evaluate-synthesized; descendants inherit only when introduced by that same source.
- Q: Where should `RuleId` live for downstream consumers? -> A: Each evaluated `Rule` occurrence carries its `RuleId` inline; `RuleCatalog` remains the authoritative metadata keyed by that ID.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Evaluate gives every rule occurrence a stable identity (Priority: P1)

A maintainer inspecting a top-level grammar rule needs to point at one exact occurrence inside the
Evaluate output and know that every later analysis pass is referring to that same occurrence, not
reconstructing it by path-specific heuristics.

**Why this priority**: This is the enabling step for all later DRY cleanup. Without occurrence
identity at Evaluate, every downstream classification or normalization decision remains another ad
hoc tree walk.

**Independent Test**: Run Evaluate on representative kinds from the existing grammars and assert
that every occurrence in each rule tree appears exactly once in an authoritative rule catalog,
including nested `seq` / `choice` / `repeat` wrappers, field wrappers, literals, and
Evaluate-synthesized top-level rules such as inline-alias sources.

**Acceptance Scenarios**:

1. **Given** a top-level kind like Rust `tuple_expression`, **When** Evaluate finishes, **Then** every nested rule occurrence under that kind has exactly one `RuleId` and exactly one catalog entry describing its owner kind, parent, path, and rule type.
2. **Given** two structurally identical subtrees in different positions, **When** Evaluate assigns IDs, **Then** they receive different `RuleId`s because occurrence identity is positional, not structural deduplication.
3. **Given** Evaluate synthesizes a hidden helper rule (for example an inline alias source), **When** that rule is inserted into `RawGrammar.rules`, **Then** its root and descendants also receive `RuleId`s with provenance marking them as Evaluate-synthesized rather than grammar-authored.
4. **Given** the same grammar input is evaluated twice with no structural changes, **When** the rule catalog is serialized in deterministic order, **Then** the same rule occurrences receive the same IDs both times.
5. **Given** a grammar edit changes the evaluated structure under a kind, **When** Evaluate assigns IDs after that edit, **Then** only same-input determinism is guaranteed and affected paths may receive different IDs.
6. **Given** an override replaces or introduces a rule occurrence, **When** Evaluate emits the rule catalog, **Then** provenance marks that occurrence root as override-authored/replaced and only descendants introduced by that override share that provenance.
7. **Given** a downstream phase receives an evaluated rule tree, **When** it inspects any rule occurrence, **Then** the occurrence carries its `RuleId` inline and can join to authoritative catalog metadata without recomputing identity from paths.

---

### User Story 2 — Rules carry stable terminal/nonterminal classification (Priority: P1)

A maintainer needs the compiler to treat `terminal` and `nonterminal` as classifications on rules,
not as a second ontology. They also need field and alias semantics to classify rules consistently
without conflating compiler classification with tree-sitter's CST `named` / `anonymous` surface.

**Why this priority**: If rule classification is fuzzy, every later phase will reinterpret
field-ness, aliasing, or CST named-ness differently and the identity model will drift again.

**Independent Test**: Build classification tests for representative rule forms (`symbol`, `string`,
`pattern`, `token`, `field`, named alias, anonymous alias, and structural wrappers) and assert that
rule classification, parent-edge naming, and CST surface behavior remain separate axes.

**Acceptance Scenarios**:

1. **Given** `field(name, rule)` wraps a subtree, **When** classification runs, **Then** the parent edge is named `name` and the wrapped constituent is treated as nonterminal in Sittir's model even if the resulting CST node is anonymous.
2. **Given** `alias(rule, $.Name)` wraps a subtree, **When** classification runs, **Then** the surfaced result is treated as nonterminal and the CST exposes a named node without replacing underlying `RuleId` provenance.
3. **Given** `alias(rule, 'literal')` wraps a subtree, **When** classification runs, **Then** the CST exposes an anonymous node label while the compiler still treats that label as CST-surface metadata rather than foundational identity.
4. **Given** a field-addressable anonymous CST child, **When** the compiler reads the rule model, **Then** it still has enough information to classify that constituent as nonterminal in Sittir's model.
5. **Given** a field or named alias wraps a subtree with descendants, **When** classification runs, **Then** the immediately wrapped occurrence is forced nonterminal while descendants keep their intrinsic or locally forced classifications.
6. **Given** a structural wrapper such as `seq`, `choice`, `optional`, `repeat`, `repeat1`, or `prec*`, **When** classification runs, **Then** the wrapper occurrence receives a deterministic aggregate classification rather than being left unclassified.

---

### User Story 3 — Tree-sitter-generated IDs attach as late metadata (Priority: P2)

A maintainer who wants enum-backed serialization between front and back end needs KindIDs,
FieldIDs, or similar tree-sitter-generated IDs, but those IDs must remain late metadata layered on
top of the rule model rather than a competing identity graph.

**Why this priority**: The ID model should support future wire-format optimization without making
tree-sitter-generated IDs the compiler's foundational identity source.

**Independent Test**: Generate tree-sitter artifacts for representative grammars and assert that
KindIDs / FieldIDs can be attached after generation while preserving traceability back to the
corresponding kind or parent-edge name in the compiler model.

**Acceptance Scenarios**:

1. **Given** `tree-sitter generate` has produced grammar artifacts, **When** metadata enrichment runs, **Then** the compiler can attach a KindID to a kind without changing the `RuleId` model or rule classifications.
2. **Given** a field name exists only on the parent edge, **When** tree-sitter provides a FieldID, **Then** that ID attaches as metadata to the edge/name concept rather than redefining foundational identity.
3. **Given** front/back-end serialization later swaps string literal kind IDs for enum values, **When** those enum values are derived from KindID metadata, **Then** the compiler model still points back to rule identity and classification first.

---

### Edge Cases

- **Identical shape, different occurrence**: two `symbol($.expression)` occurrences in different branches are not the same rule and must not share an ID.
- **Evaluate-synthesized rules**: helper rules created inside Evaluate (for alias source normalization or future Evaluate-time synthesis) participate fully in the rule catalog.
- **Override-introduced roots**: when an override replaces or introduces a rule occurrence, provenance marks that occurrence root and any descendants introduced by the same override. It does not attempt to record a full original-source/latest-transformer history for every descendant.
- **Inline ID without duplicated metadata**: each evaluated `Rule` occurrence carries its `RuleId` inline, but parent/path/provenance/classification metadata remains in the catalog. Consumers must not rebuild metadata from inline IDs alone.
- **Field-addressable anonymous CST child**: a constituent can be addressable by field name while still being anonymous on the CST surface. That does not make it terminal in Sittir's model if field semantics forced nonterminal classification.
- **Named alias over terminal-only content**: `alias(rule, $.Name)` can still force a surfaced nonterminal result even when the wrapped rule started terminal-like.
- **Anonymous alias label**: `alias(rule, 'literal')` writes an anonymous CST/node-types label (`type = "literal", named = false`), but that label does not become foundational compiler identity.
- **Forced classification does not flood descendants**: field and named-alias forcing changes only the immediately wrapped occurrence. Descendant rules keep their intrinsic or locally forced classifications, and wrapper aggregate classification follows from those classified children.
- **Wrapper with mixed descendants**: if a structural wrapper contains both terminal-like and nonterminal-like descendants, the wrapper itself classifies as nonterminal because at least one descendant exposes a nonterminal boundary.
- **No `node-types.json` fallback**: rule identity and rule classification derive from Evaluate's rule tree and its catalogs, not from `node-types.json` shape hints.
- **Determinism**: ID generation must be deterministic for a given Evaluate output. Global counters whose values depend on traversal accidents or object-insertion order are not acceptable.
- **Structural grammar edits**: `RuleId` values are not a cross-version migration contract. If evaluated grammar structure changes, IDs for affected paths may change.
- **Exhaustiveness**: any walker building IDs or rule classifications must switch exhaustively on `Rule["type"]` and fail loudly on new child-bearing variants.

## Architectural Design

### 1. Evaluate assigns occurrence identity

Evaluate already owns the first fully-normalized rule tree and already emits the only cross-rule
sidecar today (`references: SymbolRef[]`). This spec extends that responsibility:

- Evaluate assigns a **`RuleId`** to every rule occurrence.
- Each evaluated `Rule` occurrence carries its `RuleId` inline.
- Evaluate emits one authoritative **rule catalog** of metadata keyed by `RuleId`.
- Later phases may consume those IDs, but they do not invent a competing foundational identity.

### 2. Rule is the only primary entity

The compiler ontology is deliberately narrow:

- **Rule** is the only primary entity in the grammar tree.
- **`terminal`** and **`nonterminal`** are classifications on rules.
- Every rule occurrence in the catalog receives a classification, including structural wrappers.
- **Kind** means a top-level rule.
- Parent-edge naming, CST surface behavior, and tree-sitter-generated IDs are all layered on top of that rule-first model.

Representative shape:

```ts
export type RuleId = string;

export interface IdentifiedRule {
	readonly id: RuleId;
	readonly rule: Rule;
}

export type RulePathSegment =
	| { edge: 'content' }
	| { edge: 'members'; index: number };

export interface RuleCatalogEntry {
	readonly id: RuleId;
	readonly ownerKind: string;
	readonly ruleType: Rule['type'];
	readonly parentId?: RuleId;
	readonly path: readonly RulePathSegment[];
	readonly childIds: readonly RuleId[];
	readonly provenance: 'grammar-authored' | 'override-authored-or-replaced' | 'evaluate-synthesized';
}

export interface RuleClassification {
	readonly ruleId: RuleId;
	readonly kind: 'terminal' | 'nonterminal';
	readonly forcedBy?: 'intrinsic' | 'field' | 'named-alias';
	readonly edgeName?: string;
	readonly cstSurface?: 'named' | 'anonymous';
}
```

### 3. Parent-edge naming is separate from CST surface behavior

This spec keeps three axes separate:

1. **Compiler ontology** — `Rule`, `RuleId`, `terminal`, `nonterminal`
2. **Parent-edge naming** — field names
3. **Tree-sitter CST surface** — `named` vs `anonymous`

They often correlate, but they are not the same thing.

### 4. Rule-form mapping

The model is grounded in the actual tree-sitter rule forms:

| Rule form | Meaning in this design |
| --- | --- |
| `symbol(...)` | a rule occurrence classified as nonterminal-like |
| `string(...)` | a rule occurrence classified as terminal-like |
| `pattern(...)` | a rule occurrence classified as terminal-like |
| `token(...)` | terminal-forming wrapper; the result stays terminal-like |
| `field(name, rule)` | gives a name to the parent edge and forces only the immediately wrapped constituent nonterminal |
| `alias(rule, $.Name)` | named alias; surfaces a named CST node and forces only the immediately wrapped constituent nonterminal |
| `alias(rule, 'lit')` | anonymous alias; changes anonymous CST labeling only |
| `seq(...)`, `choice(...)`, `optional(...)`, `repeat(...)`, `repeat1(...)`, `prec*` | structural wrappers classified by deterministic aggregation: nonterminal if any descendant or wrapper semantics expose a nonterminal boundary, otherwise terminal; Binding / Simplify / Assemble semantics are specified in 022 |

### 5. Tree-sitter-generated metadata attaches late

KindID, FieldID, or similar IDs are allowed only as **late metadata**:

- attached after `tree-sitter generate`
- derived by interrogating generated artifacts
- never used as the foundational identity model

Their intended use is to support an eventual **enum-backed wire format** in place of string-literal
kind IDs for front/back-end serialization.
Generated grammar packages expose this layer as parser-scoped numeric `TreeSitterKindId` and
`TreeSitterFieldId` enums plus forward/reverse lookup maps. These values are tied to the generated
parser artifact and are not a cross-version public stability promise.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Evaluate MUST assign a deterministic `RuleId` to every rule occurrence in every top-level rule tree emitted in `RawGrammar.rules`, including nested structural members and any rules synthesized during Evaluate itself.
- **FR-002**: `RuleId` MUST identify a concrete occurrence, not a semantic slot, merged field, or structurally deduplicated subtree.
- **FR-003**: Each evaluated `Rule` occurrence MUST carry its `RuleId` inline so downstream consumers can join to catalog metadata without recomputing identity from paths.
- **FR-004**: Evaluate MUST emit one authoritative `RuleCatalog` keyed by `RuleId`. The catalog MUST record at least owner kind, rule type, parent, deterministic path, direct child rule IDs, and provenance.
- **FR-005**: `RuleId` stability MUST be required only for unchanged evaluated grammar output. Structural grammar edits MAY change IDs for affected paths and MUST NOT require cross-version aliasing or migration behavior in 021.
- **FR-006**: Rule occurrence provenance MUST identify the occurrence root source as grammar-authored, override-authored/replaced, or evaluate-synthesized. Descendants MUST inherit that provenance only when introduced by the same source.
- **FR-007**: Provenance MUST NOT attempt to encode full original-source/latest-transformer history for every occurrence in 021.
- **FR-008**: The rule tree MUST treat `Rule` as the only primary entity. `terminal` / `nonterminal` MUST be represented as classifications on rules rather than as a second foundational object model.
- **FR-009**: `field(name, rule)` MUST name the parent edge and MUST force the wrapped constituent to be classified as nonterminal in Sittir's model.
- **FR-010**: `alias(rule, $.Name)` MUST surface a named CST node and MUST force the resulting constituent to be treated as nonterminal without replacing underlying `RuleId` provenance.
- **FR-011**: `alias(rule, 'literal')` MUST affect the anonymous CST label only. It MUST NOT by itself introduce a new nonterminal boundary or a competing identity layer.
- **FR-012**: Tree-sitter `named` / `anonymous` surface behavior MUST remain distinct from Sittir's `terminal` / `nonterminal` classification.
- **FR-013**: The implementation MUST support field-addressable anonymous CST children by allowing field semantics to force nonterminal classification even when the CST surface remains anonymous.
- **FR-014**: Field and named-alias nonterminal forcing MUST apply only to the immediately wrapped rule occurrence. Descendant occurrences MUST retain their intrinsic or locally forced classifications.
- **FR-015**: Structural wrapper rule occurrences, including `seq`, `choice`, `optional`, `repeat`, `repeat1`, and `prec*`, MUST receive terminal/nonterminal classifications by deterministic aggregation: nonterminal if any descendant or wrapper semantics expose a nonterminal boundary, otherwise terminal.
- **FR-016**: The implementation MUST NOT use `node-types.json` as the primary source for rule identity or rule classification. These derive from the evaluated rule tree and its ID-keyed catalogs.
- **FR-017**: Any walker building IDs or classifications over `Rule` children MUST switch exhaustively on child-bearing `Rule["type"]` variants and fail loudly on unhandled shapes. Silent `default:` branches are forbidden.
- **FR-018**: Tree-sitter-generated KindIDs, FieldIDs, or similar IDs MUST be incorporated only as a final post-Emit enrichment step, after running `tree-sitter generate` and interrogating the produced artifacts.
- **FR-019**: Any such KindID / FieldID metadata MUST be explicitly documented as a derived layer on top of `RuleId`, rule classification, and parent-edge naming. It MUST NOT become a competing foundational identity system.
- **FR-020**: The intended use of KindID metadata is to support an eventual enum-backed wire format in place of string-literal kind identifiers when serializing between front and back end.
- **FR-021**: Generated grammar packages MUST expose parser-scoped numeric `TreeSitterKindId` and `TreeSitterFieldId` const enums plus forward/reverse maps derived from the generated parser artifact.
- **FR-022**: Binding / Simplify / Assemble re-architecture and assembled-surface migration are out of scope for 021 and MUST be specified in 022 instead of being reintroduced here implicitly.

### Key Entities _(include if feature involves data)_

- **`RuleId`** — opaque, deterministic identifier carried inline by one concrete rule occurrence in an Evaluate-stage rule tree.
- **`RuleCatalog`** — authoritative sidecar emitted by Evaluate that records every occurrence exactly once and gives later phases a stable join key.
- **`RuleCatalogEntry`** — one row in the catalog: `id`, owner kind, parent, path, rule type, child IDs, and provenance.
- **`RuleClassification`** — rule-level classification record that captures whether a rule is treated as terminal or nonterminal and whether that classification was forced by field or named-alias semantics.
- **Parent-edge name** — the name attached by `field(name, rule)`. This is an edge property, not a separate primary entity.
- **Kind metadata** — late tree-sitter-generated metadata such as KindID or FieldID, attached after generation and always secondary to the rule model.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every evaluated grammar, serializing the `RuleCatalog` shows that every rule occurrence appears exactly once and that every non-root entry points to a parent entry that also exists.
- **SC-002**: For representative evaluated kinds, every rule occurrence has an inline `RuleId` that joins to exactly one `RuleCatalog` entry.
- **SC-003**: Re-evaluating an unchanged grammar produces the same `RuleId` set and the same parent/path relationships for representative snapshot kinds across Rust, TypeScript, and Python.
- **SC-004**: Tests covering a structural grammar edit show that affected paths may receive different IDs while unchanged re-evaluation still remains deterministic.
- **SC-005**: Provenance tests show that grammar-authored, override-authored/replaced, and evaluate-synthesized occurrence roots are distinguishable without requiring full transformation-history tracking.
- **SC-006**: Representative rule-form tests show that `field(name, rule)` forces nonterminal treatment even when the corresponding CST node is anonymous.
- **SC-007**: Representative alias tests show that named alias forces nonterminal treatment while anonymous alias only affects anonymous CST labeling.
- **SC-008**: Representative field and named-alias tests show that forced nonterminal classification does not flood descendant occurrences.
- **SC-009**: Representative wrapper tests show that every structural wrapper occurrence receives the expected aggregate classification for all-terminal, all-nonterminal, and mixed-descendant forms.
- **SC-010**: KindID / FieldID enrichment can be derived from generated tree-sitter artifacts after generation without replacing `RuleId` or rule classification as foundational identity.

## Out of Scope

- Re-architecting Binding, Simplify, or Assemble.
- Replacing the current assembled `fields` / `children` storage shape.
- Defining the final Binding/Simplify frontier algorithm for mixed wrapper forms.
- Re-introducing `node-types.json` as a fallback source of identity or classification.
- Implementing the eventual enum-backed serialization format itself.

## Dependencies & Assumptions

- **Depends on** the five-phase compiler contract from spec 005 remaining intact: Evaluate is the first phase with the whole rule tree, so it is the correct place to assign foundational IDs.
- **Depends on** the DRY convention in `CLAUDE.md`: one source of identity, one derivation of semantic roles/classification.
- **Assumes** existing Evaluate-time synthesis (for example inline alias source synthesis) stays within Evaluate's ownership so synthesized rules can enter the same catalog naturally.
- **Assumes** `specs/022-binding-simplify-assemble/spec.md` will own the Binding / Simplify / Assemble rewrite that consumes this ontology.
