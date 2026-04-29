# Rule Identity and Binding/Simplify Split Design

## Problem

The current codegen/compiler model mixes together several different ideas:

- rule occurrence identity
- assembled `fields` / `children` surfaces
- tree-sitter CST surface behavior (`named` vs `anonymous`)
- late tree-sitter-generated IDs like kind IDs and field IDs

That makes it hard to say what the foundational entity actually is, and it encourages
re-deriving overlapping facts in different phases.

The earlier "slot IDs" framing also points in the wrong direction. What exists first is a
grammar rule occurrence. Any later assembled surface is downstream of that.

At the same time, the follow-on work has two different levels of risk:

1. defining the ontology and identity model
2. re-architecting Binding / Simplify / Assemble around that model

Those should not live in one spec.

## Decision

Split the work into two specs:

1. **Spec A = existing 021** — rule identity and rule classification
2. **Spec B = new 022** — Binding / Simplify / Assemble re-architecture

Spec A defines the foundational ontology and metadata model. Spec B rewires the compiler
pipeline and assembled representation to follow that ontology.

## Why Split

This split isolates stable concepts from risky mechanics.

- **Spec A** should settle what the compiler believes the world is made of.
- **Spec B** should settle how later phases normalize and assemble that world.

That sequencing keeps the identity/classification work reviewable on its own and prevents a
pipeline rewrite from smuggling in ontology decisions by accident.

## Spec A (021): Rule Identity and Classification

### Core ontology

- **Rule** is the only primary entity in the grammar rule tree.
- Every rule occurrence receives a deterministic **`RuleId`**.
- **`terminal`** and **`nonterminal`** are **classifications on rules**, not separate object kinds.
- **Kind** means a top-level rule. Tree-sitter may later contribute generated kind/type metadata,
  but that metadata is not foundational identity.

### Naming and parent-edge semantics

- `field(name, rule)` does not create a new ontology object.
- Instead, it gives a **name to the parent edge** leading to the wrapped constituent.
- In Sittir's model, `field(name, rule)` **forces the wrapped constituent to be classified as
  nonterminal**, even if tree-sitter later emits the CST node as anonymous.

This means field-ness wins over CST anonymity for compiler modeling.

### Tree-sitter surface is a separate axis

Spec A keeps these axes separate:

1. **Sittir ontology** — `Rule`, `RuleId`, `terminal`, `nonterminal`
2. **Parent-edge naming** — field names
3. **Tree-sitter CST surface** — `named` vs `anonymous`

They often correlate, but they are not the same thing.

In particular:

- a child can be **field-addressable** and still be **anonymous** on the CST surface
- named alias can force a surfaced nonterminal even when the wrapped content started simpler
- anonymous alias can affect anonymous CST labeling without becoming foundational compiler identity

### Alias model

Tree-sitter aliasing must be modeled in two explicit cases:

#### Named alias

`alias(rule, $.Name)`:

- surfaces the result as a named CST node
- **forces the result to be treated as nonterminal in Sittir's model**
- does not replace underlying `RuleId` provenance

#### Anonymous alias

`alias(rule, 'literal')`:

- produces an **anonymous CST node label**
- does not create a named/nonterminal boundary by itself
- is CST-surface metadata, not foundational identity

In a direct probe grammar:

- `alias($.identifier, $.renamed_identifier)` appeared as named CST node `renamed_identifier`
- `alias($.identifier, 'renamed_lit')` appeared as anonymous CST node `"renamed_lit"`

The anonymous alias label also appeared in `node-types.json` as:

```json
{ "type": "renamed_lit", "named": false }
```

So the label does "go somewhere", but only on the anonymous tree-sitter surface.

### Late tree-sitter metadata

Tree-sitter-generated IDs such as **KindID** and **FieldID** belong in Spec A, but only as
**late metadata**:

- attached after `tree-sitter generate`
- derived by interrogating generated artifacts
- never used as the foundational identity model

Their purpose is to support an eventual **enum-backed wire format** in place of string-literal
kind IDs for front/back-end serialization.

## Spec B (022): Binding / Simplify / Assemble Re-architecture

### New pipeline shape

Spec B owns the compiler rewrite:

1. **Binding**
2. **Simplify**
3. **Assemble**

### Binding

Binding is the first step toward the constituent-oriented model.

Its job is to bind terminals to the nonterminals they belong with, so later phases can reason in
terms of constituent rules instead of raw wrapper-heavy shapes.

### Simplify

Simplify becomes the normalization phase.

It pushes wrapper behavior down onto constituent rules, so wrappers stop behaving like primary
assembled members.

That applies to forms like:

- `seq`
- `choice`
- `optional`
- `repeat`
- `repeat1`
- `prec*`

Under this design:

- ordering belongs to constituents
- multiplicity belongs to constituents
- alternative structure belongs to constituents
- precedence metadata belongs to constituents

#### Choice rule

`choice(...)` resolves by its **frontier result after Binding + Simplify**.

If necessary, Simplify may synthesize a normalized constituent form so Assemble sees one coherent
result.

### Assemble

Assemble should no longer think in the old `fields` / `children` / slot ontology.

Instead, it materializes a kind from normalized constituent rules, with parent-edge naming
attached where present.

This is the spec that retires the current primary-storage mental model and replaces it with a
Binding/Simplify/Assemble pipeline based on the Spec A ontology.

## Tree-sitter Rule-Form Mapping

The mental model should be grounded in the actual rule forms:

| Rule form | Meaning in this design |
| --- | --- |
| `symbol(...)` | a rule occurrence classified as nonterminal-like |
| `string(...)` | a rule occurrence classified as terminal-like |
| `pattern(...)` | a rule occurrence classified as terminal-like |
| `token(...)` | terminal-forming wrapper; the result stays terminal-like |
| `field(name, rule)` | gives a name to the parent edge and forces the wrapped constituent nonterminal |
| `seq(...)` | ordered composition wrapper over constituent rules |
| `choice(...)` | alternative wrapper resolved by frontier result after Binding + Simplify |
| `optional(rule)` | optionality modifier on the constituent rule(s) of `rule` |
| `repeat(rule)` / `repeat1(rule)` | multiplicity modifier on the constituent rule(s) of `rule` |
| `alias(rule, $.Name)` | named alias; surfaces a named CST node and forces nonterminal treatment |
| `alias(rule, 'lit')` | anonymous alias; changes anonymous CST surface labeling only |
| `prec*` wrappers | parse-behavior metadata, not foundational identity |

## Validation Plan

### Spec A validation

- deterministic `RuleId` snapshot tests
- rule-level `terminal` / `nonterminal` classification tests
- tests proving `field(...)` forces nonterminal treatment
- tests proving named alias forces nonterminal treatment
- tests proving anonymous alias affects CST surface only
- KindID / FieldID enrichment tests against generated tree-sitter artifacts

### Spec B validation

- Binding tests showing terminals attach to the correct nonterminal constituents
- Simplify tests showing wrapper pushdown
- Assemble tests showing kinds materialize from normalized constituent rules
- regression cases for:
  - field-wrapped literals
  - mixed `choice`
  - named alias
  - anonymous alias

## Risks

### Confusing CST surface with compiler ontology

The biggest conceptual risk is regressing into tree-sitter-surface-first thinking. This design
must keep:

- field naming
- CST named/anonymous behavior
- rule classification

as separate axes.

### Overloading the first spec

Spec A should not quietly absorb the Binding / Simplify / Assemble rewrite. If it does, the split
fails and review becomes much harder.

### Partial pipeline migration

Spec B must not leave wrapper logic half-pushed-down while the assembled representation has already
changed. Binding, Simplify, and Assemble need one coherent target model.

## Recommendation

Proceed in two steps:

1. update **021** to define the rule-first identity/classification model plus late KindID/FieldID
   metadata
2. create **022** for the Binding / Simplify / Assemble re-architecture

That preserves one foundational identity model while giving the risky pipeline rewrite its own
explicit design and review surface.
