# Feature Specification: Pre-computed Field Signatures

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

Compute three per-field signatures during `KindMeta` construction — one per emitter concern. Signatures are interned so fields with the same shape share the same object reference. Emitters emit one shared artifact per unique signature, then reference it per-field.

No intermediate `EnrichedRule` layer. Signatures are computed from the same base classification (`leafTypes`, `branchTypes`, `anonTokens`) in a single pass and attached directly to each field.

### Base Classification

Every field's `namedTypes` are classified against the grammar's leaf/branch sets once:

```typescript
interface FieldTypeClass {
  leafTypes: string[];     // sorted namedTypes that are terminal nodes
  branchTypes: string[];   // sorted namedTypes that are non-terminal nodes
  anonTokens: string[];    // sorted types that aren't in namedTypes (STRING tokens)
}
```

This replaces the raw `types` / `namedTypes` arrays on `FieldMeta`. The classification is the source of truth — emitters never need to re-derive leaf/branch/anon splits.

### Three Signatures

Each signature captures what determines identical emitter output for a specific concern. All three are computed from `FieldTypeClass` plus field quantifiers (`required`, `multiple`):

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
- **`required` and `multiple` are excluded from all signatures.** They're quantifiers that emitters handle with `?` / `[]` / `.map()` wrappers around the shared artifact. Including them would split otherwise-identical signatures.
- **Factory signature uses collapsed types** (post-supertype folding). Two fields accepting all subtypes of `_expression` share one signature even if they list different subsets that happen to cover the same supertypes.
- **From signature uses expanded types** (pre-supertype, leaves and branches separated). Resolution logic dispatches on concrete kinds.
- **Hydration signature uses raw namedTypes** (no expansion, no collapsing). Assign works with concrete kinds only and branches on `required` × `multiple` structurally, not in the signature.

### Attachment to KindMeta

Signatures live on each field — no separate cross-reference map needed:

```typescript
interface FieldMeta {
  name: string;
  required: boolean;
  multiple: boolean;
  types: FieldTypeClass;              // replaces raw types/namedTypes
  factory: FactorySignature;          // interned
  from: FromSignature;                // interned
  hydration: HydrationSignature;      // interned
}

interface KindMeta {
  kind: string;
  rule: GrammarRule;                  // raw grammar tree (for structural access)
  fields: FieldMeta[];
  hasChildren: boolean;
  children?: ChildrenMeta;
}
```

`KindMeta` also gains a `rule` reference so emitters that need ordering/nesting (rules.ts) can walk the grammar tree directly without re-loading grammar.json.

### GrammarModel (top-level)

```typescript
interface GrammarModel {
  name: string;
  kinds: Record<string, KindMeta>;
  // Interned signature pools — for emitters to iterate and emit shared code
  factorySignatures: Map<string, FactorySignature>;
  fromSignatures: Map<string, FromSignature>;
  hydrationSignatures: Map<string, HydrationSignature>;
  // Pre-computed sets (currently passed as separate params)
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

Emitters that need ordering/nesting walk `kind.rule` directly:
- `rules.ts` — S-expression template generation (SEQ ordering, REPEAT separators)
- `factories.ts` — parts that need positional argument ordering

## Construction Flow

```
1. loadGrammarJson(grammar)                   → GrammarJson
2. loadRawEntries(grammar)                    → RawNodeEntry[]
3. classifyKinds(entries)                     → { leafKinds, branchKinds, keywordKinds }
4. buildSupertypeMap(entries)                 → Map<string, string[]>
5. For each (kind, rule) in grammar.json:
     nodeTypesEntry = entries[kind]
     For each field in nodeTypesEntry:
       a. classifyFieldTypes(field, leafKinds)         → FieldTypeClass
       b. internFactorySignature(typeClass, supertypes) → FactorySignature
       c. internFromSignature(typeClass)                → FromSignature
       d. internHydrationSignature(field, typeClass)    → HydrationSignature
       e. Attach all three + typeClass to FieldMeta
     Assemble KindMeta { kind, rule, fields, ... }
6. Assemble GrammarModel
```

All signature computation happens in step 5 — a single pass over all kinds and fields. The `intern*` functions maintain `Map<string, Signature>` pools keyed by canonical IDs.

## File Layout

```
packages/codegen/src/
  grammar-reader.ts          (existing — raw loading, kept as-is)
  grammar-model.ts           (NEW — buildGrammarModel, classifyFieldTypes, intern*)
  index.ts                   (updated — calls buildGrammarModel, passes to emitters)
  emitters/
    *.ts                     (updated — receive GrammarModel, use signature pools)
```

## Migration

1. Add `grammar-model.ts` with `buildGrammarModel()` that produces `GrammarModel`
2. Update `generate()` to call `buildGrammarModel()` and pass the model to emitters
3. Migrate emitters one at a time — during transition, emitters can read both old `FieldMeta` shape and new signatures
4. Once all emitters migrated, remove raw `types`/`namedTypes` from `FieldMeta` (replaced by `FieldTypeClass`)

## Non-Goals

- Changing the generated output API (factories, `.from()`, `.assign()` signatures stay the same)
- Modifying `@sittir/core` or `@sittir/types`
- Changing the grammar.json or node-types.json input format
- Introducing new generated files
