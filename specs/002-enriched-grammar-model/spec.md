# Feature Specification: Enriched Grammar Model

**Feature Branch**: `002-enriched-grammar-model`
**Created**: 2026-03-27
**Status**: Draft
**Input**: Observation that emitters independently re-derive the same field type analysis (leaf/branch classification, supertype expansion, anonymous token detection, separator extraction) from flat `KindMeta[]`. Deduplication should happen once at the grammar model level.

## Problem

Today's codegen pipeline has two representations:

1. **`GrammarRule`** — raw recursive tree from grammar.json (full structural information)
2. **`KindMeta`** — flat projection (loses ordering, nesting, optionality context)

Each emitter independently re-derives information that was lost in the flattening:

| Emitter | Re-derived information |
|---------|----------------------|
| `rules.ts` | Field ordering from SEQ, separator from REPEAT+SEQ, optional tokens from CHOICE+BLANK |
| `from.ts` | Leaf/branch classification, supertype expansion, anonymous token detection, resolution deduplication |
| `assign.ts` | Leaf/branch classification, anonymous-only field detection, children structure |
| `factories.ts` | Supertype collapsing, anonymous token type unions, field type expressions |
| `types.ts` | Supertype union construction |

This causes:
- **Duplicated analysis** — the same leaf/branch/anon classification computed 3+ times
- **Duplicated output** — fields with identical type signatures emit identical resolver/hydration code per-kind instead of sharing
- **Generated file bloat** — Rust `from.ts` is 885KB / 4211 lines because each field inlines its own resolver

## Solution

Introduce a three-layer model:

```
grammar.json + node-types.json
         |
    [1] GrammarRule            (raw, as-is)
         |
    [2] EnrichedRule           (same tree shape, annotated)
         |
    [3] KindMeta               (derived pre-generation model)
         |
    emitters                   (pure template producers)
```

### Layer 2: EnrichedRule

Same discriminated union as `GrammarRule`, but with computed metadata attached at the relevant nodes. The tree shape is preserved — no flattening.

```typescript
type EnrichedRule =
  | { type: 'SEQ'; members: EnrichedRule[] }
  | { type: 'CHOICE'; members: EnrichedRule[] }
  | { type: 'STRING'; value: string }
  | { type: 'FIELD'; name: string; content: EnrichedRule;
      required: boolean;       // from node-types.json
      multiple: boolean;       // from node-types.json
      signature: FieldSignature; }
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

Enrichment is minimal — only metadata that requires cross-referencing node-types.json or the leaf/branch/keyword sets gets attached. The tree structure itself is untouched.

### FieldSignature (interned)

```typescript
interface FieldSignature {
  id: string;              // canonical key for dedup (e.g., "B:block;L:identifier")
  leafTypes: string[];     // sorted named types that are leaves
  branchTypes: string[];   // sorted named types that are branches
  anonTokens: string[];    // sorted anonymous tokens
}
```

Signatures are **interned** — fields with the same type shape share the same object reference. This is the mechanism for cross-kind deduplication. `required` and `multiple` are excluded from the signature because they're quantifiers (emitters wrap with `?` / `[]`), not type identity.

A grammar-wide `Map<string, FieldSignature>` is built once during enrichment. Each FIELD node in the enriched tree holds a reference into this map.

### Layer 3: KindMeta (derived)

`KindMeta` is computed by walking the enriched rule tree. It provides both the tree and a convenience index:

```typescript
interface KindMeta {
  kind: string;
  rule: EnrichedRule;                    // full annotated tree (source of truth)
  fields: Map<string, FieldView>;        // indexed projection for flat access
  hasChildren: boolean;
  children?: ChildrenMeta;
}

interface FieldView {
  name: string;
  required: boolean;
  multiple: boolean;
  signature: FieldSignature;             // shared reference
  separator?: string;                    // detected from REPEAT+SEQ context
}
```

`FieldView` replaces today's `FieldMeta`. It no longer carries raw `types` / `namedTypes` arrays — that information lives in `signature.leafTypes`, `signature.branchTypes`, `signature.anonTokens`, which are already classified. Emitters that need the full type list can reconstruct it from the signature (`[...leafTypes, ...branchTypes]`).

The `fields` map is a **read-only projection** derived from walking `rule`. It is not a separate source of truth.

### GrammarModel (top-level)

```typescript
interface GrammarModel {
  name: string;                                    // grammar language
  kinds: Record<string, KindMeta>;                 // mirrors grammar.json's `rules`
  signatures: Map<string, FieldSignature>;          // all unique signatures
  leafKinds: Set<string>;
  branchKinds: Set<string>;
  keywordKinds: Set<string>;
  supertypes: Map<string, string[]>;               // supertype → concrete subtypes
}
```

Mirrors the shape of `grammar.json` (`name` + map of rules), enriched with pre-computed sets that emitters currently receive as separate parameters.

## Emitter Impact

Emitters receive `GrammarModel` instead of `(nodes: KindMeta[], leafKinds: string[], keywordKinds: string[], supertypes: SupertypeInfo[], ...)`.

### Per-signature emission pattern

Each emitter that produces per-field code can iterate `model.signatures` to emit one shared artifact per unique type shape, then reference it per-field:

| Emitter | Shared artifact (per signature) | Per-field reference |
|---------|-------------------------------|-------------------|
| `from.ts` | `function _r<id>(v: any): any { ... }` | `fields.name = _r<id>(input.name)` |
| `assign.ts` | `function _h<id>(node: any): any { ... }` | `fields.name = _h<id>(target.field('name'))` |
| `factories.ts` | `type Sig<id> = A \| B \| C` (optional) | Field type references |

This is the generic optimization — it applies uniformly because every emitter queries the same `FieldSignature` objects.

### Structural access

Emitters that need ordering/nesting (rules.ts, parts of factories.ts) walk `kind.rule` directly. The enriched tree has everything they need without re-loading grammar.json.

## Construction Flow

```
1. loadGrammarJson(grammar)           → GrammarJson (raw)
2. loadRawEntries(grammar)            → RawNodeEntry[] (node-types.json)
3. classifyKinds(entries)             → { leafKinds, branchKinds, keywordKinds }
4. buildSupertypeMap(entries)         → Map<string, string[]>
5. For each rule in grammar.json:
   a. enrichRule(rule, nodeTypesEntry, leafKinds, keywordKinds) → EnrichedRule
      - Walks the GrammarRule tree recursively
      - At FIELD nodes: attaches required/multiple from node-types.json, computes signature
      - At SYMBOL nodes: attaches leaf/keyword flags
      - Interns signatures into a shared map
   b. deriveKindMeta(kind, enrichedRule) → KindMeta
      - Walks enriched tree to build FieldView index
      - Detects separators from REPEAT+SEQ patterns
      - Detects children from bare SYMBOL nodes
6. Assemble GrammarModel
```

Steps 1-4 use existing grammar-reader.ts functions. Step 5 is new. Step 6 is assembly.

## File Layout

```
packages/codegen/src/
  grammar-reader.ts          (existing — raw loading, kept as-is)
  grammar-model.ts           (NEW — enrichRule, deriveKindMeta, buildGrammarModel)
  index.ts                   (updated — calls buildGrammarModel, passes to emitters)
  emitters/
    *.ts                     (updated — receive GrammarModel, use signatures)
```

## Migration

1. Add `grammar-model.ts` alongside existing `grammar-reader.ts`
2. Update `generate()` in `index.ts` to build `GrammarModel` and pass it to emitters
3. Update emitters one at a time to consume `GrammarModel` instead of flat params
4. Once all emitters migrated, remove unused `KindMeta`/`FieldMeta` exports from grammar-reader.ts

Emitters can be migrated incrementally — during transition, `KindMeta` can be derived from `GrammarModel` to keep the old interface working.

## Non-Goals

- Changing the generated output API (factories, `.from()`, `.assign()` signatures stay the same)
- Modifying `@sittir/core` or `@sittir/types`
- Changing the grammar.json or node-types.json input format
- Introducing new generated files
