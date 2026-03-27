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

Four-step pipeline. Each step builds on the previous:

```
1. GrammarRule              (raw tree-sitter grammar.json)
        ↓ enrich
2. EnrichedRule             (same tree shape, annotated with metadata)
        ↓ derive
3. KindMeta                 (flat pre-generation model — fields stay pure)
        ↓ analyze
4. KindMeta + Signatures    (per-kind signature maps appended)
        ↓
   emitters                 (pure template producers)
```

---

### Step 1: GrammarRule (unchanged)

Raw discriminated union from grammar.json. Recursive tree of SEQ, CHOICE, FIELD, SYMBOL, STRING, REPEAT, etc. Read-only input.

### Step 2: EnrichedRule

Same tree shape as `GrammarRule`, with computed metadata attached at relevant nodes. Preserves full structural information (ordering, nesting, optionality).

```typescript
type EnrichedRule =
  | { type: 'SEQ'; members: EnrichedRule[] }
  | { type: 'CHOICE'; members: EnrichedRule[] }
  | { type: 'STRING'; value: string }
  | { type: 'FIELD'; name: string; content: EnrichedRule;
      required: boolean;       // from node-types.json
      multiple: boolean; }     // from node-types.json
  | { type: 'SYMBOL'; name: string;
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

### Step 3: KindMeta (derived)

Flat pre-generation model derived by walking the enriched rule tree. `FieldMeta` stays pure — it describes what the grammar says, nothing more.

```typescript
interface FieldTypeClass {
  leafTypes: string[];     // sorted namedTypes that are terminal nodes
  branchTypes: string[];   // sorted namedTypes that are non-terminal nodes
  anonTokens: string[];    // sorted types that aren't in namedTypes (STRING tokens)
}

interface FieldMeta {
  name: string;
  required: boolean;
  multiple: boolean;
  types: FieldTypeClass;
  separator?: string;      // detected from REPEAT+SEQ context in enriched tree
}

interface KindMeta {
  kind: string;
  rule: EnrichedRule;      // annotated grammar tree (for structural access)
  fields: FieldMeta[];
  hasChildren: boolean;
  children?: ChildrenMeta;
}
```

### Step 4: Signatures (appended per-kind)

A separate analysis pass over the assembled `KindMeta` collection computes interned signatures and appends them to each kind. Signatures are a per-kind concern — they describe the kind's emission shape for each emitter, not individual field properties.

```typescript
/** What TypeScript type expressions does the factory emit for this kind? */
interface FactorySignature {
  id: string;
  /** field name → collapsed type expression (post-supertype folding) */
  fieldTypes: Record<string, {
    collapsedTypes: string[];
    anonLiterals: string[];
  }>;
}

/** What resolver functions does .from() emit for this kind? */
interface FromSignature {
  id: string;
  /** field name → resolution dispatch shape */
  fieldResolvers: Record<string, {
    leafTypes: string[];
    branchTypes: string[];
    anonTokens: string[];
  }>;
}

/** How does assign hydrate this kind from a TreeNode? */
interface HydrationSignature {
  id: string;
  /** field name → hydration shape */
  fieldHydrators: Record<string, {
    namedTypes: string[];
    anonOnly: boolean;
  }>;
}

interface KindMeta {
  kind: string;
  rule: EnrichedRule;
  fields: FieldMeta[];
  hasChildren: boolean;
  children?: ChildrenMeta;
  // Appended in step 4
  factory?: FactorySignature;
  from?: FromSignature;
  hydration?: HydrationSignature;
}
```

Signatures are **interned** — kinds with identical emission shapes share the same object reference. The signature pools live on `GrammarModel` so emitters can iterate unique signatures and emit shared code once.

Key design: individual field resolver/hydrator/type entries within a signature are also candidates for sub-signature interning. Two kinds that share 8 of 10 field resolvers won't share a `FromSignature`, but the 8 common field resolvers can still reference the same interned sub-objects. This enables per-field dedup within each emitter's output even when whole-kind dedup doesn't apply.

### GrammarModel (top-level)

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

Emitters iterate their signature pool to emit shared artifacts, then reference them per-kind/per-field:

**from.ts** — if two kinds share the same `FromSignature`, only one `.from()` body is emitted and both reference it. Even when whole-kind signatures differ, shared field resolver sub-entries emit one resolver function referenced by multiple kinds.

**assign.ts** — same pattern for hydration functions.

**factories.ts** — shared type aliases for fields with identical collapsed type expressions.

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
     a. enrichRule(rule, nodeTypesEntry, leafKinds, keywordKinds)  → EnrichedRule
     b. deriveKindMeta(kind, enrichedRule)                         → KindMeta
        - Walk enriched tree to extract fields
        - Classify each field's types → FieldTypeClass
        - Detect separators from REPEAT+SEQ patterns
6. computeSignatures(kinds, supertypes)       → mutates KindMeta, populates pools
     - For each kind, compute FactorySignature, FromSignature, HydrationSignature
     - Intern into signature pools (whole-kind + per-field sub-entries)
     - Append to kind
7. Assemble GrammarModel
```

Steps 1-4 use existing grammar-reader.ts functions. Steps 5-7 are new. Step 6 is the dedicated signature analysis pass — it runs after all KindMeta are built so it has the full picture for interning.

## File Layout

```
packages/codegen/src/
  grammar-reader.ts          (existing — raw loading, kept as-is)
  grammar-model.ts           (NEW — enrichRule, deriveKindMeta, buildGrammarModel)
  signatures.ts              (NEW — computeSignatures, interning logic)
  index.ts                   (updated — calls buildGrammarModel, passes to emitters)
  emitters/
    *.ts                     (updated — receive GrammarModel, use signature pools)
```

## Migration

1. Add `grammar-model.ts` and `signatures.ts`
2. Update `generate()` to call `buildGrammarModel()` and pass the model to emitters
3. Migrate emitters one at a time — during transition, emitters can read both old and new shapes
4. Once all emitters migrated, remove unused exports from grammar-reader.ts

## Non-Goals

- Changing the generated output API (factories, `.from()`, `.assign()` signatures stay the same)
- Modifying `@sittir/core` or `@sittir/types`
- Changing the grammar.json or node-types.json input format
- Introducing new generated files
