# Feature Specification: Rule IDs at Evaluate Stage

**Feature Branch**: `021-rule-ids-at-evaluate`
**Created**: 2026-04-27
**Status**: Draft
**Input**: Architectural work previously described in handoff notes as "slot IDs at evaluate stage," with a clarified constraint: **rule IDs, not slot IDs, are the foundational concept**. Slot-ness is a downstream derived classification over rule IDs.

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
- `node-map.ts::deriveFieldsRaw()` and `deriveChildren()` walk the canonicalized tree again to build assembled slots.
- `template-walker.ts::collectRepeatedFields()`, `containsRepeat()`, sibling-duplicate detection, and separator capture walk raw rule structure again for template concerns.
- `link.ts::collectRepeatedShapes()` does yet another projection over field-bearing structure.

None of these projections is individually wrong. The architectural problem is that there is no
shared identity to hang them on. Without that identity, every consumer carries its own walker,
its own flattening rules, and its own local notion of what counts as "the same thing."

### Why "slot IDs" is the wrong foundation

The old framing — "slot IDs at evaluate stage" — gets the dependency direction backwards.

A **rule occurrence** exists as soon as Evaluate has built the rule tree. A **slot** does not.
Slot-ness depends on later interpretation:

- some rule occurrences are structural wrappers only;
- some become separators, clause punctuation, or discriminants;
- some groups of multiple rule occurrences collapse into one downstream addressable slot;
- some slot projections differ by consumer (`fields`, `children`, future unified slots in spec 022).

Examples already in the codebase make this clear:

- repeated same-name fields merge later (`deriveFields()` folds multiple `field('alternative', ...)` occurrences into one assembled field);
- sibling-duplicate child refs merge later into one multi-valued `children` slot (`or_pattern`-style shapes);
- separator / leading / trailing behavior is not a separate foundational node identity — it is a role derived from a particular rule occurrence in context.

So the pipeline must first know **which rule occurrence is which**, and only then decide whether
that occurrence contributes to a slot, punctuation role, wrapper role, or nothing user-facing.

This spec therefore **supersedes** the old handoff label:

> The foundational concept is **evaluate-stage rule IDs**. "Slot" becomes a later,
> derived grouping/classification over those IDs.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Evaluate gives every rule occurrence a stable identity (Priority: P1)

A maintainer inspecting a top-level grammar rule needs to point at one exact occurrence inside the
Evaluate output and know that every later analysis pass is referring to that same occurrence, not
reconstructing it by path-specific heuristics.

**Why this priority**: This is the enabling step for all later DRY cleanup. Without occurrence
identity at Evaluate, every downstream "slot" or "separator" decision remains another ad hoc tree
walk.

**Independent Test**: Run Evaluate on representative kinds from the existing grammars and assert
that every occurrence in each rule tree appears exactly once in an authoritative rule catalog,
including nested `seq` / `choice` / `repeat` wrappers, field wrappers, literals, and
Evaluate-synthesized top-level rules such as inline-alias sources.

**Acceptance Scenarios**:

1. **Given** a top-level kind like Rust `tuple_expression`, **When** Evaluate finishes, **Then** every nested rule occurrence under that kind has exactly one `RuleId` and exactly one catalog entry describing its owner kind, parent, path, and rule type.
2. **Given** two structurally identical subtrees in different positions, **When** Evaluate assigns IDs, **Then** they receive different `RuleId`s because occurrence identity is positional, not structural deduplication.
3. **Given** Evaluate synthesizes a hidden helper rule (for example an inline alias source), **When** that rule is inserted into `RawGrammar.rules`, **Then** its root and descendants also receive `RuleId`s with provenance marking them as Evaluate-synthesized rather than grammar-authored.
4. **Given** the same grammar input is evaluated twice with no structural changes, **When** the rule catalog is serialized in deterministic order, **Then** the same rule occurrences receive the same IDs both times.

---

### User Story 2 — Later phases derive semantic roles from shared rule IDs (Priority: P1)

A maintainer changing Link, Optimize, Assemble, or template emission needs to derive facts like
"this occurrence is inside a repeat," "this occurrence contributes a separator," or
"these two occurrences merge into one user-facing field" without introducing a new one-off walker
that re-discovers the same structure from scratch.

**Why this priority**: The architecture only pays off if the IDs become the join key for later
facts. Otherwise the repository still has many tree walks, now with IDs attached but unused.

**Independent Test**: For representative kinds that currently force overlapping walkers
(`if_statement`, `or_pattern`, `tuple_expression`, `function_modifiers`), build a derived
role/fact table keyed by `RuleId` and assert that field derivation, child derivation, and template
separator logic can all point back to the same originating IDs.

**Acceptance Scenarios**:

1. **Given** a field-bearing rule with repeated same-name branches, **When** the downstream role pass runs, **Then** each contributing occurrence is recorded by `RuleId`, and the later merged field projection cites those contributing IDs rather than inventing a new foundational identity.
2. **Given** a repeated list with separator / trailing / leading behavior, **When** the downstream role pass runs, **Then** the separator-carrying occurrence is classified as a derived role on the originating `RuleId`, not as a distinct evaluate-stage "slot."
3. **Given** a downstream pass needs to know field name, repeat context, or clause ownership for one occurrence, **When** it consults the shared fact table, **Then** it reads that fact from the ID-keyed derivation instead of walking the raw tree independently.
4. **Given** a future bug fix adds a new derived role, **When** the role pass is extended, **Then** the extension adds one more classification keyed by existing `RuleId`s rather than introducing another independent projection of the tree.

---

### User Story 3 — Slot projections are derived later from rule IDs (Priority: P2)

A maintainer planning spec 022 (collapse fields/children bifurcation) needs to build a single,
ordered slot projection without pretending that slots exist as first-class identity inside Evaluate.
They need a later pass that groups rule occurrences into slots while preserving provenance back to
those occurrences.

**Why this priority**: This is the direct downstream payoff. Spec 021 should make 022 possible
without pre-deciding 022's exact output shape.

**Independent Test**: Construct a slot projection for representative shapes where multiple rule
occurrences collapse into one addressable slot, and assert that the projection stores the
contributing `RuleId[]` for each slot.

**Acceptance Scenarios**:

1. **Given** multiple same-name field occurrences that later merge into one assembled field, **When** the slot projection is built, **Then** the resulting slot stores every contributing `RuleId` in declaration order.
2. **Given** duplicate sibling child refs that later become one array-valued child slot, **When** the slot projection is built, **Then** the slot points back to both contributing `RuleId`s rather than losing which occurrences created the multiplicity.
3. **Given** a rule occurrence that is structural-only and never becomes user-facing, **When** the slot projection is built, **Then** it remains classified as non-slot while still keeping its `RuleId` available for diagnostics and later analyses.
4. **Given** a consumer needs a phase-local slot key for ordering, **When** that key is introduced, **Then** it is explicitly documented as a derived projection that refers back to source `RuleId[]`; it is not treated as the pipeline's foundational identity.

---

### Edge Cases

- **Identical shape, different occurrence**: two `symbol($.expression)` occurrences in different branches are not the same rule and must not share an ID.
- **Evaluate-synthesized rules**: helper rules created inside Evaluate (for alias source normalization or future Evaluate-time synthesis) participate fully in the rule catalog. The architecture must not special-case them into an ID-less side channel.
- **Later tree rewrites**: Optimize may hoist, merge, or wrap structure. Those rewrites must preserve origin identity by carrying forward contributing `RuleId[]`; they must not force consumers back to path re-walking.
- **Choice simplification**: a downstream simplifier may erase an explicit wrapper occurrence from the optimized tree. Its `RuleId` still matters for provenance — for example, explaining why a separator or optionality fact exists.
- **No `node-types.json` fallback**: rule identity and later slot classification derive from Evaluate's rule tree and its catalogs, not from `node-types.json` shape hints.
- **Determinism**: ID generation must be deterministic for a given Evaluate output. Global counters whose values depend on traversal accidents or object-insertion order are not acceptable.
- **Exhaustiveness**: any walker building IDs or derived roles must switch exhaustively on `Rule["type"]` and fail loudly on new child-bearing variants. Silent `default:` branches recreate the same drift this spec is trying to remove.

## Architectural Design

### 1. Evaluate becomes the one point that assigns occurrence identity

Evaluate already owns the first fully-normalized rule tree and already emits the only cross-rule
sidecar today (`references: SymbolRef[]`). This spec extends that responsibility:

- Evaluate assigns a **`RuleId`** to every rule occurrence.
- Evaluate emits one authoritative **rule catalog** keyed by `RuleId`.
- Later phases may derive facts from those IDs, but they do not invent a competing foundational identity.

This keeps identity creation at the earliest phase where the full tree exists, and it avoids the
current problem where later phases rediscover occurrences by re-walking structure.

### 2. Rule ID means "occurrence in an owning top-level rule tree"

A `RuleId` identifies a concrete occurrence, not a semantic category.

That means:

- one top-level rule root has one `RuleId`;
- each nested `content` or `members[i]` child occurrence has its own `RuleId`;
- the same literal token text appearing twice produces two IDs if it appears twice in the tree;
- structural equivalence does not collapse identity.

This is the minimum identity granularity that can later explain merged slots, separator behavior,
repeatedness, and wrapper provenance without ambiguity.

### 3. The authoritative data shape is a rule catalog, not a slot table

The catalog is the new architectural center. A representative contract:

```ts
export type RuleId = string;

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
	readonly provenance: 'grammar' | 'override' | 'evaluate-synthesized';
}

export interface RuleCatalog {
	readonly byId: ReadonlyMap<RuleId, RuleCatalogEntry>;
	readonly rootsByKind: ReadonlyMap<string, RuleId>;
}
```

The important architectural properties are:

- **one source of occurrence identity** (`RuleCatalog`);
- **deterministic addressability** (`ownerKind + path` semantics, regardless of exact string encoding);
- **parent/child traversal without re-walking unknown object shape**;
- **phase-independent join key** for later semantic tables.

This spec does **not** require one specific string encoding for `RuleId`; it only requires that the
encoding be deterministic and derived from catalog position, not from runtime-global counters.

### 4. Symbol references attach to rule IDs, not only parent kinds

`SymbolRef` today is anchored primarily by `from: string` (the top-level kind name). That is too
coarse for downstream reasoning. Under this architecture, references become rule-occurrence facts.

Representative direction:

```ts
export interface SymbolRef {
	readonly refType: 'symbol' | 'alias' | 'token';
	readonly fromKind: string;
	readonly fromRuleId: RuleId;
	readonly toKind: string;
}
```

Existing convenience facts like `fieldName`, `optional`, `repeated`, and `position` should no
longer be treated as foundational graph identity. They become derived annotations keyed by
`fromRuleId` once later passes have enough context.

That change matters because repeatedness, separator role, clause role, and slot grouping are not
intrinsic to "a symbol ref from kind X"; they are intrinsic to one exact occurrence in one exact
context.

### 5. Downstream passes build fact/role tables keyed by `RuleId`

This spec does **not** collapse every downstream concern into one mega-pass. Instead, it gives
those passes a common join key.

Representative shared shape:

```ts
export interface RuleFactTable {
	readonly byRuleId: ReadonlyMap<
		RuleId,
		{
			readonly roles: readonly RuleRole[];
			readonly derivedFrom: readonly RuleId[];
		}
	>;
}

export type RuleRole =
	| 'field-carrier'
	| 'child-carrier'
	| 'slot-member'
	| 'separator'
	| 'leading-separator'
	| 'trailing-separator'
	| 'clause-wrapper'
	| 'discriminant'
	| 'structural-wrapper';
```

The exact role taxonomy can evolve during planning, but the architectural rule is fixed:

> downstream facts are keyed by `RuleId`; they do not replace `RuleId`.

This lets different consumers derive what they need at the right phase without redefining identity.

### 6. Slot projections are later groupings over rule IDs

A slot is a later, consumer-facing grouping. It is not the primitive.

Representative shape:

```ts
export interface SlotProjection {
	readonly ownerKind: string;
	readonly slotKey: string; // phase-local / derived, not foundational
	readonly memberRuleIds: readonly RuleId[];
	readonly roles: readonly RuleRole[];
}
```

Implications:

- one slot may correspond to **multiple** rule IDs;
- one rule ID may contribute to **zero** slots;
- slot projections may legitimately differ by consumer or phase;
- spec 022 can build a unified ordered slot array without retroactively making slots the identity model.

### 7. Cross-phase rewrites preserve origin, not replacement identity

Link and Optimize legitimately rewrite trees. That is fine. What must change is how provenance is
tracked.

When a later phase:

- hoists a wrapper,
- merges duplicate branches,
- collapses same-name field occurrences,
- or synthesizes a consumer-facing grouping,

it records `derivedFrom: RuleId[]` pointing back to Evaluate-stage rule occurrences.

That keeps Evaluate as the single anchor while still letting later phases reshape trees for their
own needs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Evaluate MUST assign a deterministic `RuleId` to every rule occurrence in every top-level rule tree emitted in `RawGrammar.rules`, including nested structural members and any rules synthesized during Evaluate itself.
- **FR-002**: `RuleId` MUST identify a concrete occurrence, not a semantic slot, merged field, or structurally deduplicated subtree.
- **FR-003**: Evaluate MUST emit one authoritative `RuleCatalog` keyed by `RuleId`. The catalog MUST record at least owner kind, rule type, parent, deterministic path, and direct child rule IDs.
- **FR-004**: The `RuleCatalog` MUST be the single source of occurrence identity. No second side table or per-consumer cache may redefine rule identity with a competing ID space.
- **FR-005**: `SymbolRef` (or its replacement edge record) MUST anchor outbound references to `fromRuleId`, not only to a top-level parent kind string.
- **FR-006**: Later semantic facts such as field-carrying status, repeatedness, separator roles, clause roles, discriminants, and slot candidacy MUST be derived in ID-keyed tables. They MUST NOT be treated as foundational identity.
- **FR-007**: Slot classification MUST happen downstream of Evaluate as a derived projection over `RuleId`s. If a later phase introduces slot keys, those keys MUST reference contributing `RuleId[]` and MUST NOT replace them.
- **FR-008**: Later phases that hoist, merge, or synthesize structures MUST preserve provenance by carrying forward originating Evaluate-stage `RuleId[]` on derived outputs.
- **FR-009**: The architecture MUST support many-to-one grouping from rule occurrences to slots, because multiple rule occurrences may later collapse into one user-facing slot.
- **FR-010**: The implementation MUST NOT use `node-types.json` as the primary source for rule identity, slot detection, or rule-role classification. These derive from the evaluated rule tree and its ID-keyed catalogs.
- **FR-011**: Any catalog-builder or role-deriver that walks `Rule` children MUST switch exhaustively on child-bearing `Rule["type"]` variants and fail loudly on unhandled shapes. Silent `default:` branches are forbidden.
- **FR-012**: The design MUST preserve the existing five-phase compiler contract from spec 005: Evaluate creates occurrence identity; Link/Optimize/Assemble/Emit consume or refine it. This spec does not move slot derivation back into Evaluate.
- **FR-013**: This feature MUST remain architectural only. It does not itself change the public generated package API, collapse `$fields` and `$children`, or alter render templates. Those are follow-on implementation/spec work.

### Key Entities _(include if feature involves data)_

- **`RuleId`** — opaque, deterministic identifier for one concrete rule occurrence in an Evaluate-stage rule tree.
- **`RuleCatalog`** — authoritative sidecar emitted by Evaluate that records every occurrence exactly once and gives later phases a stable join key.
- **`RuleCatalogEntry`** — one row in the catalog: `id`, owner kind, parent, path, rule type, child IDs, and provenance.
- **`RuleFactTable`** — downstream derived table keyed by `RuleId`, used to record semantic roles without re-walking the tree independently in each consumer.
- **`RuleRole`** — downstream classification attached to a `RuleId` (examples: `field-carrier`, `slot-member`, `separator`, `structural-wrapper`). Role taxonomy is extensible, but always secondary to `RuleId`.
- **`SlotProjection`** — a downstream grouping over one or more `RuleId`s for a particular consumer. Slot keys are derived and local; provenance back to source `RuleId[]` is mandatory.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every evaluated grammar, serializing the `RuleCatalog` shows that every rule occurrence appears exactly once and that every non-root entry points to a parent entry that also exists.
- **SC-002**: Re-evaluating an unchanged grammar produces the same `RuleId` set and the same parent/path relationships for representative snapshot kinds across Rust, TypeScript, and Python.
- **SC-003**: At least three currently-overlapping downstream concerns — assembled field derivation, assembled child derivation, and template separator/duplicate-field handling — can be planned against shared `RuleId`-keyed facts rather than three unrelated occurrence-discovery mechanisms.
- **SC-004**: A derived slot projection for representative merge cases (same-name repeated fields, sibling-duplicate child refs, separator-bearing lists) preserves contributing `RuleId[]` for every slot.
- **SC-005**: No architectural document or implementation plan produced after this spec treats slot IDs as the foundational identity. Rule IDs are the root identity model; slot-ness is always described as derived.
- **SC-006**: The design remains DRY with respect to identity: there is exactly one foundational ID space for rule occurrences, and all later semantic classifications point back to it.

## Out of Scope

- Implementing the rule catalog, derived role tables, or slot projection in code.
- Collapsing the public `$fields` / `$children` bifurcation (that is spec 022 follow-on work).
- Changing generated package APIs, NodeData shape, or render template syntax.
- Re-introducing `node-types.json` as a fallback source of structure.
- Defining the complete final taxonomy of every downstream semantic role. This spec fixes the identity model and the rule that roles are derived; exact role names are planning detail.

## Dependencies & Assumptions

- **Depends on** the five-phase compiler contract from spec 005 remaining intact: Evaluate is the first phase with the whole rule tree, so it is the correct place to assign foundational IDs.
- **Depends on** the DRY convention in `CLAUDE.md`: one source of identity, one derivation of semantic roles.
- **Assumes** existing Evaluate-time synthesis (for example inline alias source synthesis) stays within Evaluate's ownership so synthesized rules can enter the same catalog naturally.
- **Assumes** later phases may continue to normalize or restructure rules, but they can preserve origin provenance without needing a second identity system.

## Open Questions

1. **Exact `RuleId` encoding**: the spec requires determinism and path-derived identity, but leaves open whether IDs are stored as branded strings (`kind:members[1].content`) or a more compact opaque encoding. This is an implementation choice for plan.md.
2. **Catalog storage shape**: the spec fixes `RuleCatalog` as the authoritative identity source, but leaves open whether the concrete implementation uses `Map`, plain objects, or a small custom arena structure. This is also an implementation choice for plan.md.
3. **Derived-role staging**: the architecture fixes that roles are downstream and keyed by `RuleId`, but it deliberately does not force a single monolithic "role pass." Planning should decide whether role derivation is centralized or introduced incrementally per consumer on top of the shared catalog.
