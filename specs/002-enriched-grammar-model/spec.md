# Feature Specification: Enriched Grammar Model & Pre-computed Signatures

**Feature Branch**: `002-enriched-grammar-model`
**Created**: 2026-03-27
**Status**: Draft
**Input**: Emitters independently re-derive the same field type analysis. Push deduplication upstream into the grammar model so every emitter benefits.

## Problem

Each emitter independently classifies field types and produces per-field code:

| Emitter | Re-derived analysis | Per-field output |
|---------|-------------------|-----------------|
| `factories.ts` | Supertype collapsing, anonymous token unions | Type expression per setter |
| `from.ts` | Leaf/branch/anon classification, supertype expansion | Resolver IIFE per field |
| `assign.ts` | Leaf/branch classification, anonymous-only detection | Hydration logic per field |

Fields with identical type shapes across different kinds emit identical code. Rust `from.ts` is 885KB because 380 resolution expressions are emitted when only ~136 unique type patterns exist.

## Solution

Three-layer model:

```
GrammarRule              (raw tree-sitter grammar.json)
     ↓ enrich
EnrichedRule             (same tree shape, annotated with leaf/branch/keyword metadata)
     ↓ derive
KindMeta                 (pre-generation model, fields carry interned signatures)
     ↓
emitters                 (pure template producers)
```

### Layer 1: GrammarRule (unchanged)

Raw discriminated union from grammar.json. Recursive tree of SEQ, CHOICE, FIELD, SYMBOL, STRING, REPEAT, etc. Read-only input — never modified.

### Layer 2: EnrichedRule

Same tree shape as `GrammarRule`, with computed metadata attached at relevant nodes. Preserves full structural information (ordering, nesting, optionality).

```typescript
type EnrichedRule =
  | { type: 'SEQ'; members: EnrichedRule[] }
  | { type: 'CHOICE'; members: EnrichedRule[] }
  | { type: 'STRING'; value: string }
  | { type: 'FIELD'; name: string; content: EnrichedRule;
      // enrichments from node-types.json
      required: boolean;
      multiple: boolean; }
  | { type: 'SYMBOL'; name: string;
      // enrichments from leaf/branch/keyword sets
      leaf: boolean;
      keyword: boolean; }
  | { type: 'BLANK' }
  | { type: 'REPEAT'; content: EnrichedRule }
  | { type: 'REPEAT1'; content: EnrichedRule }
  | { type: 'PREC'; value: number; content: EnrichedRule }
  | { type: 'PREC_LEFT'; value: number; content: EnrichedRule }
  | { type: 'PREC_RIGHT'; value: number; content: EnrichedRule }
  | { type: 'ALIAS'; content: EnrichedRule; named: boolean; value: string }
  | { type: 'TOKEN'; content: EnrichedRule }
  | { type: 'IMMEDIATE_TOKEN'; content: EnrichedRule }
  | { type: 'PATTERN'; value: string };
```

Enrichment is minimal:
- **FIELD nodes** gain `required` and `multiple` from node-types.json
- **SYMBOL nodes** gain `leaf` and `keyword` flags from pre-computed kind sets

The tree structure is identical to `GrammarRule`. Emitters that need structural access (rules.ts for SEQ ordering, REPEAT separator detection) walk the enriched tree directly.

### Layer 3: KindMeta (derived, with signatures)

Derived by walking the enriched rule tree. Provides flat field access with pre-computed, interned signatures for each emitter concern.

#### FieldTypeClass (base classification)

Every field's types are classified once against the grammar's leaf/branch sets:

```typescript
interface FieldTypeClass {
  leafTypes: string[];     // sorted namedTypes that are terminal nodes
  branchTypes: string[];   // sorted namedTypes that are non-terminal nodes
  anonTokens: string[];    // sorted types that aren't in namedTypes (STRING tokens)
}
```

This replaces the raw `types` / `namedTypes` arrays. The classification is the source of truth.

#### Three Signatures

Each signature captures what determines identical emitter output for a specific concern. All three are computed from `FieldTypeClass`. `required` and `multiple` are excluded — they're quantifiers that emitters handle with `?` / `[]` / `.map()` wrappers.

```typescript
/** What TypeScript type expression does the factory setter accept? */
interface FactorySignature {
  id: string;
  /** Named types after supertype collapsing (e.g., ['Expression', 'Identifier']) */
  collapsedTypes: string[];
  /** Anonymous token literal types (e.g., ['+', '-', '*']) */
  anonLiterals: string[];
}

/** What runtime resolver logic does .from() need? */
interface FromSignature {
  id: string;
  /** Leaf kinds — coerce from string */
  leafTypes: string[];
  /** Branch kinds — dispatch to .from() factories */
  branchTypes: string[];
  /** Anonymous tokens — coerce from string to {type, text} */
  anonTokens: string[];
}

/** How does assign extract this field from a TreeNode? */
interface HydrationSignature {
  id: string;
  /** Concrete kinds to filter/dispatch (no supertype expansion) */
  namedTypes: string[];
  /** Whether field is anonymous-only (operator tokens etc.) */
  anonOnly: boolean;
}
```

Key design decisions:
- **Factory signature** uses collapsed types (post-supertype folding). Fields accepting all subtypes of `_expression` share one signature.
- **From signature** uses expanded types (leaves and branches separated). Resolution dispatches on concrete kinds.
- **Hydration signature** uses raw namedTypes (no expansion, no collapsing). Assign works with concrete kinds and structural branching.
- All signatures are **interned** — fields with the same shape share the same object reference across all kinds.

#### KindMeta and FieldMeta

```typescript
interface FieldMeta {
  name: string;
  required: boolean;
  multiple: boolean;
  types: FieldTypeClass;
  factory: FactorySignature;          // interned
  from: FromSignature;                // interned
  hydration: HydrationSignature;      // interned
  separator?: string;                 // detected from REPEAT+SEQ context in enriched tree
}

interface KindMeta {
  kind: string;
  rule: EnrichedRule;                 // annotated grammar tree (for structural access)
  fields: FieldMeta[];
  hasChildren: boolean;
  children?: ChildrenMeta;
}
```

#### GrammarModel (top-level)

```typescript
interface GrammarModel {
  name: string;
  kinds: Record<string, KindMeta>;
  // Interned signature pools — emitters iterate to emit shared artifacts
  factorySignatures: Map<string, FactorySignature>;
  fromSignatures: Map<string, FromSignature>;
  hydrationSignatures: Map<string, HydrationSignature>;
  // Pre-computed sets
  leafKinds: Set<string>;
  branchKinds: Set<string>;
  keywordKinds: Set<string>;
  supertypes: Map<string, string[]>;
}
```

## Emitter Impact

### Per-signature emission pattern

Each emitter iterates its signature pool once to emit shared artifacts, then references them per-field:

**from.ts:**
```typescript
// Emitted once per unique FromSignature
function _r7a3f(v: any): any { /* leaf/branch/anon dispatch */ }

// Per-field — just a reference
resolved.name = _r7a3f(input.name);
resolved.value = _r7a3f(input.value);  // same signature → same function
```

**assign.ts:**
```typescript
// Emitted once per unique HydrationSignature
function _h4b2e(target: any): any { /* assignByKind dispatch */ }

// Per-field
fields.name = _h4b2e(target.field('name'));
fields.value = _h4b2e(target.field('value'));
```

**factories.ts:**
```typescript
// Emitted once per unique FactorySignature (as type alias, optional)
type _T9c1d = Expression | Identifier;

// Per-field setter type
set name(value: _T9c1d) { ... }
```

### Structural access

Emitters that need ordering/nesting walk `kind.rule` (the enriched tree) directly:
- `rules.ts` — S-expression template generation (SEQ ordering, REPEAT separators)
- `factories.ts` — positional argument ordering

The enriched tree has leaf/keyword flags on SYMBOL nodes and required/multiple on FIELD nodes, so these emitters don't need to cross-reference external sets.

## Construction Flow

```
1. loadGrammarJson(grammar)                   → GrammarJson
2. loadRawEntries(grammar)                    → RawNodeEntry[]
3. classifyKinds(entries)                     → { leafKinds, branchKinds, keywordKinds }
4. buildSupertypeMap(entries)                 → Map<string, string[]>
5. For each (kind, rule) in grammar.json:
     a. enrichRule(rule, nodeTypesEntry, leafKinds, keywordKinds) → EnrichedRule
        - Recursive walk: annotate FIELD with required/multiple, SYMBOL with leaf/keyword
     b. deriveKindMeta(kind, enrichedRule, leafKinds, supertypes) → KindMeta
        - Walk enriched tree to extract fields
        - Classify each field's types → FieldTypeClass
        - Compute + intern FactorySignature, FromSignature, HydrationSignature
        - Detect separators from REPEAT+SEQ patterns
6. Assemble GrammarModel { name, kinds, signature pools, kind sets, supertypes }
```

Steps 1-4 use existing grammar-reader.ts functions. Steps 5-6 are new.

## File Layout

```
packages/codegen/src/
  grammar-reader.ts          (existing — raw loading, kept as-is)
  grammar-model.ts           (NEW — enrichRule, deriveKindMeta, buildGrammarModel)
  index.ts                   (updated — calls buildGrammarModel, passes to emitters)
  emitters/
    *.ts                     (updated — receive GrammarModel, use signature pools)
```

## Migration

1. Add `grammar-model.ts` with `buildGrammarModel()` that produces `GrammarModel`
2. Update `generate()` to call `buildGrammarModel()` and pass the model to emitters
3. Migrate emitters one at a time — during transition, emitters can read both old and new shapes
4. Once all emitters migrated, remove unused exports from grammar-reader.ts

## Non-Goals

- Changing the generated output API (factories, `.from()`, `.assign()` signatures stay the same)
- Modifying `@sittir/core` or `@sittir/types`
- Changing the grammar.json or node-types.json input format
- Introducing new generated files
