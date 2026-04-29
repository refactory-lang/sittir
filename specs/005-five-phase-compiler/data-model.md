# Data Model: Five-Phase Grammar Compiler

**Phase 1 output** — entities, relationships, and state transitions.

All type definitions are authoritative in the design doc (`specs/sittir-grammar-compiler-spec.md`). This file summarizes entities and relationships at a conceptual level.

## Core Entities

### Rule (Shared IR)

The single intermediate representation used across all phases. A discriminated union of 20 variants grouped into five categories:

| Category              | Variants                                                   | Lifecycle                            |
| --------------------- | ---------------------------------------------------------- | ------------------------------------ |
| Structural grouping   | `seq`, `optional`, `choice`, `repeat`, `repeat1`           | Optimize restructures these          |
| Named patterns        | `field`, `variant`, `clause`, `enum`, `supertype`, `group` | Created/enriched by different phases |
| Terminals             | `string`, `pattern`                                        | Immutable across all phases          |
| Structural whitespace | `indent`, `dedent`, `newline`                              | Created by Link from external roles  |
| References            | `symbol`, `alias`, `token`                                 | Eliminated by Link                   |

**Key invariant**: Rule is defined once in `compiler/rule.ts` and never extended. New information goes on grammar contracts, as metadata on existing variants, or (rarely) as new variants.

### SymbolRef (Reference Graph)

Edges in the rule-to-rule reference graph. Captured during Evaluate, enriched during Link.

| Field       | Set by   | Purpose                                 |
| ----------- | -------- | --------------------------------------- |
| `from`      | Evaluate | Parent rule name                        |
| `to`        | Evaluate | Referenced rule name                    |
| `fieldName` | Evaluate | Field name (if inside a `field()` call) |
| `optional`  | Evaluate | Whether inside `optional()`             |
| `repeated`  | Evaluate | Whether inside `repeat()`               |
| `position`  | Link     | Index within parent's SEQ               |

### Grammar Contracts

Three contracts, one per pre-Assemble phase:

| Contract           | Produced by | Key additions over previous                                                                                                                                                  |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RawGrammar`       | Evaluate    | Rules with unresolved references, metadata (extras, externals, supertypes, inline, conflicts, word), reference graph. Overrides already applied with provenance.             |
| `LinkedGrammar`    | Link        | All references resolved. Hidden rules classified. Field provenance annotated. Supertypes determined. External roles mapped. Suggested overrides from diagnostic derivations. |
| `OptimizedGrammar` | Optimize    | Structural grouping restructured. Choice branches wrapped in variants. Common prefixes/suffixes factored.                                                                    |

### NodeMap

Produced by Assemble. First and only place nodes appear.

Contains:

- `nodes: Map<string, AssembledNode>` — all classified nodes
- `signatures: SignaturePool` — for kind collapse
- `projections: ProjectionContext` — kind projection data

### AssembledNode (Discriminated Union)

Nine model types, each with distinct shape and emitter behavior:

| Model type  | Visibility | Has factory    | Key properties                                  |
| ----------- | ---------- | -------------- | ----------------------------------------------- |
| `branch`    | visible    | yes            | fields, children                                |
| `container` | visible    | yes            | children, separator                             |
| `polymorph` | visible    | yes (per form) | forms (each with fields, detectToken, children) |
| `leaf`      | visible    | yes            | pattern                                         |
| `keyword`   | visible    | yes            | text                                            |
| `token`     | visible    | no             | (minimal)                                       |
| `enum`      | either     | no             | values                                          |
| `supertype` | hidden     | no             | subtypes                                        |
| `group`     | hidden     | no             | fields (promoted to parent)                     |

### AssembledField

Per-field metadata, all derived from rule tree context at Assemble time:

| Property       | Derived from                                            |
| -------------- | ------------------------------------------------------- |
| `required`     | Not inside an `optional` ancestor                       |
| `multiple`     | Inside a `repeat` ancestor                              |
| `contentTypes` | Walk field content, collect kind names                  |
| `source`       | `'grammar'` / `'override'` / `'inlined'` / `'inferred'` |
| `projection`   | Kind projection context                                 |

### AssembledForm (Polymorph)

One structural variant of a polymorph node:

| Property      | Derived from                                                  |
| ------------- | ------------------------------------------------------------- |
| `detectToken` | Unique string literal among sibling forms                     |
| `fields`      | Per-form narrowed fields                                      |
| `mergedRules` | Preserved from collapse (non-lossy) — for template generation |

## Entity Relationships

```
RawGrammar ──has──→ Record<string, Rule>
           ──has──→ SymbolRef[]
           ──has──→ metadata (extras, externals, supertypes, ...)

LinkedGrammar ──has──→ Record<string, Rule> (resolved)
              ──has──→ SymbolRef[] (enriched with position)
              ──has──→ SuggestedOverride[]

NodeMap ──has──→ Map<string, AssembledNode>
        ──has──→ SignaturePool
        ──has──→ ProjectionContext

AssembledNode ──has──→ AssembledField[] (branch, group)
              ──has──→ AssembledChild[] (branch, container)
              ──has──→ AssembledForm[] (polymorph)

AssembledForm ──has──→ AssembledField[]
              ──has──→ AssembledChild[]
              ──has──→ Rule[] (mergedRules, for templates)
```

## State Transitions

Rules progress through phases — their type composition changes but the union type itself is stable:

```
After Evaluate:  symbol ✓  alias ✓  token ✓  repeat1 ✓  variant ✗  clause ✗  group ✗
After Link:      symbol ✗  alias ✗  token ✗  repeat1 ✗  variant ✗  clause ✓  group ✓
After Optimize:  same as Link + variant ✓
After Assemble:  Rules consumed → AssembledNode with derived metadata
```
