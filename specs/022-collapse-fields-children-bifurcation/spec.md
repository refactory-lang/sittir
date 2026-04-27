# Feature Specification: Rule-ID Slot Surface

**Feature Branch**: `022-collapse-fields-children-bifurcation`  
**Created**: 2026-04-27  
**Status**: Draft  
**Depends on**: `021` rule-ID foundation at Evaluate stage (every evaluated rule gets a rule ID before any downstream slot classification)  
**Input**: User description: "Build spec 022 downstream from 021's rule-ID-first design. Specify how the current fields/children bifurcation can be collapsed or re-expressed once rule IDs exist. Do not assume slot IDs exist; classify slot behaviour downstream from rule IDs."

## Background

The current compiler and runtime surface split one structural fact into two storage shapes:

- named positions become `fields`
- unnamed positions become `children`

That split is useful as an API projection, but as a **primary model** it violates the repository's DRY rule: one ordered sequence of rule occurrences is being re-derived into two parallel buckets, then enriched separately for multiplicity, clauses, separators, and walker behaviour.

Handoff notes for open spec 022 already call this out explicitly: the current `$fields` vs `$children` split is a derivation duplication, and the intended exit is a single ordered slot surface with metadata per slot. The new prerequisite from spec 021 sharpens that plan: **021 is not a slot-ID design**. Instead, Evaluate assigns a stable **rule ID** to every evaluated rule occurrence first; downstream phases then classify which rule IDs behave as slots and what kind of slot behaviour they have.

This spec defines that downstream model. It does **not** define how 021 assigns or preserves rule IDs internally; 021 owns that foundation. 022 consumes it and makes the slot surface the single canonical source for everything that is currently split across fields vs children.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Compiler maintainers reason about one canonical slot table (Priority: P1)

A codegen maintainer investigating a node kind with mixed named and unnamed structure should be able to inspect one ordered slot table, keyed by rule IDs and derived once, instead of reconciling `fields`, `children`, `findFieldsWithRepeatFlag`, clause walkers, and other pass-local projections.

**Why this priority**: This is the DRY core of the feature. If the compiler still stores parallel `fields` and `children` as primary facts, every later pass can drift again.

**Independent Test**: Pick representative kinds that currently mix named fields, unnamed children, optional groups, and repetition. Inspect the assembled representation. Verify that the canonical structure is one ordered `slots` list and that both the field-like and child-like views are projections from that list rather than independent storage.

**Acceptance Scenarios**:

1. **Given** a kind with both named and unnamed positions, **When** Assemble finishes, **Then** the kind has one canonical ordered slot list and no second primary list for fields vs children.
2. **Given** a slot produced from a named `field(...)` wrapper, **When** a consumer requests the legacy field view, **Then** the slot appears there with its raw field name and original order preserved relative to sibling slots.
3. **Given** a slot produced from an unnamed positional rule occurrence, **When** a consumer requests the legacy child view, **Then** the same slot appears there without having been re-derived from a separate walker.

---

### User Story 2 — Downstream passes classify slot behaviour from rule IDs, not from a second identity system (Priority: P1)

A maintainer working in Link, Optimize, Assemble, or Emit should treat "is this rule occurrence a slot?", "is it named?", "is it repeated?", and "does it carry separator/clause behaviour?" as **derived classifications over rule IDs**. They should not need a parallel slot-ID graph or a fresh walker per emitter.

**Why this priority**: The user's new 021 constraint is the architectural foundation. If 022 reintroduces slot IDs or per-pass slot discovery, the same duplication comes back under a new name.

**Independent Test**: Trace a representative rule occurrence from Evaluate into Assemble using its rule ID. Verify that every slot property consumed by emitters can be explained as a classification or projection of that rule ID's downstream shape/provenance.

**Acceptance Scenarios**:

1. **Given** a rule ID assigned by Evaluate, **When** downstream passes determine it behaves as a slot, **Then** the slot record is keyed by that rule ID (or by 021's provenance-preserving derivative of it), not by a newly minted slot ID.
2. **Given** a rule occurrence that never surfaces as a consumable slot, **When** downstream passes run, **Then** it retains its rule ID but does not appear in the canonical slot table.
3. **Given** a slot with optionality, multiplicity, separator, clause, or hoist/promotion behaviour, **When** emitters consume it, **Then** those properties come from the shared slot record rather than separate field-only or child-only derivations.

---

### User Story 3 — Existing runtime and generated surfaces can stay stable while the internals collapse to slots (Priority: P2)

A maintainer should be able to land the canonical slot model without forcing an immediate public API break to generated packages. Existing `$fields` / `$children`, factory ergonomics, and template context shapes may remain as compatibility projections during the migration, so long as they are derived from one slot source of truth.

**Why this priority**: Lower than the architectural unification itself, but still important. The spec should resolve whether 022 is an internal canonicalization or a public API break. This spec chooses **internal canonicalization first**.

**Independent Test**: Run existing generated-surface tests and verify that any surviving `$fields` / `$children` views are produced mechanically from the canonical slot table with no behavioural diff.

**Acceptance Scenarios**:

1. **Given** a consumer of `node.$fields`, **When** 022 lands, **Then** the consumer still receives the same logical field map, but the map is projected from canonical slots.
2. **Given** a consumer of `node.$children`, **When** 022 lands, **Then** the consumer still receives the same ordered child list, but the list is projected from canonical slots.
3. **Given** a future feature that wants to retire `$fields` / `$children` publicly, **When** it does so, **Then** it builds on 022's canonical slot model rather than having to redesign internal storage first.

### Edge Cases

- **Repeated same-name fields**: a repeated field remains one slot definition with `cardinality: many`; runtime values may still materialize as arrays, but the grammar-side slot identity is singular and rule-ID-based.
- **Anonymous keyword promotion collisions**: cases like an anonymous keyword token and a named field sharing the same text must resolve through slot metadata/projection rules, not by inventing a second placeholder-only structure.
- **Group inlining / hoisted fields**: when a hidden/group rule is inlined or its field is promoted, the surviving slot record must retain rule-ID provenance back to the originating evaluated rule occurrence as defined by 021.
- **Polymorph forms**: form-specific slots are subsets/projections of the same rule-ID foundation. A slot absent in one form is absent because classification says so, not because forms keep independent field/child storage schemes.
- **Clause / separator behaviour**: leading separators, trailing separators, clause wrappers, and block-bearing metadata must live on the canonical slot record (or slot-table projection), not on separate field-only walkers.
- **Public compatibility period**: as long as `$fields` / `$children` remain public, their projection rules must be deterministic and documented. "Sometimes stored, sometimes projected" is forbidden.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Spec 021 MUST establish the prerequisite identity contract: every evaluated rule occurrence receives a stable rule ID before downstream classification begins. 022 MUST consume that contract and MUST NOT introduce a second slot-ID identity layer.

- **FR-002**: The canonical post-Assemble representation for branch-like, container-like, group-like, and form-like structures MUST be a single ordered slot collection named `slots`. `fields` and `children` MUST NOT remain independent primary storage inside the compiler contracts.

- **FR-003**: Slot-ness MUST be a downstream classification of rule IDs. Evaluate assigns IDs only; Link, Optimize, and Assemble determine whether a rule ID surfaces as a slot and what behaviour that slot has.

- **FR-004**: Every canonical slot record MUST carry enough metadata for all current field/child consumers to project from it without re-walking the rule tree. At minimum this includes:
  - canonical rule ID / provenance handle from 021
  - parent kind (and form, when applicable)
  - stable ordinal within the parent's ordered slot list
  - raw field name when named, absent when positional
  - required vs optional
  - single vs many cardinality
  - content kind set / projection target set
  - provenance/source using the pipeline's existing vocabulary (`grammar`, `override`, `inlined`, `inferred`, plus any already-established derived category that survives 021)
  - separator / flank / clause / block-bearing metadata when relevant

- **FR-005**: `field` vs `child` MUST become a **projection**, not a storage split. The canonical rule is:
  - a slot with a raw field name projects into the field view
  - a slot without a raw field name projects into the child view
  - both views preserve the slot order defined by the canonical slot list

- **FR-006**: All metadata currently derived separately for `AssembledField` and child-oriented walkers MUST be derived once from the canonical slot model. This includes repeat/multiplicity behaviour, clause participation, join/separator behaviour, and any equivalent trailing/leading token metadata.

- **FR-007**: Link/Optimize/Assemble rewrites that inline, hoist, merge, or specialize structure MUST preserve rule-ID provenance according to 021's contract so the resulting slot record can still explain where it came from. 022 may rely on 021's provenance mechanism, but it may not replace it with ad-hoc slot-local naming.

- **FR-008**: Emitters and validators MUST consume slot projections from one shared derivation point. No emitter may maintain its own private "field slots" vs "child slots" discovery pass over the optimized rule tree.

- **FR-009**: Any compatibility `fields` / `children` view retained in generated packages or runtime `NodeData` during 022's landing MUST be explicitly defined as a projection over canonical slots. The feature MUST NOT require a public API break merely to achieve internal unification.

- **FR-010**: Raw grammar field names remain the canonical names for named slots. 022 MUST NOT camelCase, rename, or otherwise normalize the canonical slot key surface.

- **FR-011**: Diagnostics and probe tooling added or updated after 022 MUST be able to report slot provenance in terms of rule IDs and slot projections. If a maintainer asks "why is this a field?" or "why is this positional?", the answer must be traceable through the shared slot record.

- **FR-012**: The repository MUST have exactly one canonical definition of slot metadata used by compiler/emitter code. Parallel `AssembledField` and `AssembledChild` authority types are forbidden once 022 lands; any retained compatibility aliases must be mechanically derived wrappers.

### Key Entities _(include if feature involves data)_

- **Rule ID** — Identity assigned by 021 to an evaluated rule occurrence. It is the only required identity foundation for 022. Slot behaviour is classified from this identity; it is not replaced by slot IDs.

- **Canonical Slot Record** — The single source-of-truth description of one exposed slot in a parent rule/form. Carries rule-ID provenance plus named/positional, multiplicity, ordering, and render-relevant metadata.

- **Slot Table** — Ordered list of canonical slot records for one assembled parent kind or one polymorph form. This is the canonical replacement for storing fields and children separately.

- **Slot Projection** — A mechanical view over the slot table for a consumer that still wants field-like or child-like access. Examples: field map, ordered child list, template context bags, runtime `$fields` / `$children`.

- **Compatibility View** — A legacy surface retained for API stability during migration. Compatibility views are allowed only when they are pure projections from canonical slots.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every assembled visible kind/form that currently exposes both field-like and child-like structure, the compiler stores exactly one canonical slot table and zero parallel primary `fields` / `children` collections.

- **SC-002**: Existing generated-package tests that read `$fields` and `$children` continue to pass unchanged, proving those views are preserved as projections during the migration period.

- **SC-003**: At least one maintainer-facing probe/debug path can show, for a representative mixed-shape kind, the ordered slot table with rule-ID provenance and the derived field/child projections from that same source.

- **SC-004**: No compiler/emitter/validator path re-walks the optimized rule tree solely to rediscover "field slots" vs "child slots" after the canonical slot table has been built.

- **SC-005**: Mixed-shape behaviours currently prone to drift — repeated named fields, positional separators, clause-bearing groups, and hoisted/inlined fields — are each expressible from the canonical slot record without introducing a second identity or storage structure.

## Dependencies & Assumptions

**Dependencies**:

1. **Spec 021** lands first and defines the rule-ID assignment + provenance-preservation contract that 022 consumes.
2. Existing DRY rules remain binding: one source, one derivation; fix the generator, not generated output.
3. Current terminology remains canonical: rule, field, child, named, anonymous, supertype, variant, clause.

**Assumptions**:

- Rule IDs are available early enough that Link/Optimize/Assemble can classify slot behaviour without inventing replacement identities.
- A single ordered slot table is sufficient to reconstruct every current field/child consumer surface.
- Public generated APIs should remain stable for the first landing of 022; internal canonicalization comes first, outward simplification can follow in a later feature if desired.

**Out of scope**:

- Defining 021's internal rule-ID algorithm, persistence mechanics, or provenance encoding.
- Introducing slot IDs or any other second identity namespace.
- Renaming user-facing factory/config fields or changing camelCase-vs-snake_case policy.
- Changing template syntax, render-engine choice, or non-slot-related runtime APIs.
- Hand-editing generated grammar package output; any implementation work must follow the generator-first rule.
