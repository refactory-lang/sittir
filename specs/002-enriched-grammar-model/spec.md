# Feature Specification: Enriched Grammar Model & Pre-computed Signatures

**Feature Branch**: `002-enriched-grammar-model`
**Created**: 2026-03-27
**Status**: Archived — superseded by spec 003 (grammar-model-pipeline)
**Input**: Emitters independently re-derive the same field type analysis via grammar retraversal. Consolidate all shared analysis into a pre-generation model so emitters become pure template producers.

## Problem

Each emitter re-walks the grammar tree to derive information that should be computed once:

| Shared analysis | Computed in |
|----------------|-------------|
| Leaf/branch/anon field type classification | `from.ts`, `assign.ts`, `factories.ts` |
| Supertype expansion (recursive) | `from.ts:buildExpandedSupertypeMap()`, `factories.ts:buildExpandedSupertypeMap()` (duplicated) |
| Supertype collapsing (type compression) | `factories.ts:collapseToSupertypes()` |
| Anonymous-only field detection | `factories.ts:fieldTypeExpr()`, `assign.ts:emitAssign()` |
| Separator detection (REPEAT+SEQ) | `rules.ts:walkForSeparators()`, `joinby.ts` |
| Field ordering from SEQ | `rules.ts:walkRule()` |
| Optionality from CHOICE+BLANK | `grammar-reader.ts:walkForFields()` (derived, but lost in flattening) |
| Leaf pattern extraction | `grammar-reader.ts:extractLeafPattern()`, called from `factories.ts`, `from.ts` |
| Constant text / keyword detection | `grammar-reader.ts:extractConstantText()`, `listKeywordKinds()` |
| Required token collection | `grammar-reader.ts:collectRequiredTokens()` |
| Resolver signature dedup | `from.ts:resolverKey()` |

Additionally, the current `KindMeta` flattening is lossy — it discards field ordering, nesting context, and token positions that emitters then re-derive by re-walking the grammar tree.

## Solution

Four-step pipeline. Each step builds on the previous:

```
1. GrammarRule              (raw tree-sitter grammar.json)
        ↓ enrich
2. EnrichedRule             (same tree shape, annotated with cross-referenced metadata)
        ↓ project
3. NodeModel                (lossless semantic remapping into node vocabulary)
        ↓ analyze
4. NodeModel + Signatures   (per-kind emitter signatures appended)
        ↓
   emitters                 (pure template producers — no grammar retraversal)
```

---

### Step 1: GrammarRule (unchanged)

Raw discriminated union from grammar.json. Recursive tree of SEQ, CHOICE, FIELD, SYMBOL, STRING, REPEAT, etc. Read-only input.

### Step 2: EnrichedRule

Same tree shape as `GrammarRule`, with cross-referenced metadata attached at relevant nodes.

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
      keyword: boolean;
      supertype: boolean; }
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

Enrichment is purely additive:
- **FIELD nodes** gain `required` and `multiple` from node-types.json
- **SYMBOL nodes** gain `leaf`, `keyword`, and `supertype` flags from pre-computed kind sets

The tree structure is identical to `GrammarRule`. This is the layer that preserves full grammar fidelity — everything downstream is derived from it.

### Step 3: NodeModel (lossless semantic remapping)

The grammar tree speaks in grammar constructs (SEQ, CHOICE, REPEAT, PREC). The node model speaks in node vocabulary (fields, tokens, children, optionality, multiplicity, separators). Same information, different framing. **No loss.**

The node model is an **ordered sequence of elements** — matching the physical token order that `render()` produces:

```typescript
/** An element in the node's ordered structure */
type NodeElement =
  | { element: 'field'; field: FieldModel }
  | { element: 'token'; value: string; optional: boolean }
  | { element: 'child'; child: ChildModel }
  | { element: 'choice'; branches: NodeElement[][] }

interface FieldModel {
  name: string;
  required: boolean;         // from node-types.json
  multiple: boolean;         // from node-types.json
  types: FieldTypeClass;     // classified types (leaf/branch/anon)
  separator?: string;        // detected from REPEAT+SEQ (e.g., ',')
}

interface FieldTypeClass {
  leafTypes: string[];       // sorted named types that are terminal nodes
  branchTypes: string[];     // sorted named types that are non-terminal
  anonTokens: string[];      // sorted anonymous tokens (STRING values)
  expandedBranch: string[];  // branchTypes with supertypes recursively expanded
  collapsedTypes: string[];  // named types after supertype folding (for TS type expressions)
}

interface ChildModel {
  multiple: boolean;
  types: FieldTypeClass;
  separator?: string;
}

interface NodeModel {
  kind: string;
  elements: NodeElement[];     // ordered sequence — the source of truth
  rule: EnrichedRule;          // retained for any edge cases
}
```

#### What the projection computes (consolidating all shared emitter logic):

| Currently in | Moves to NodeModel |
|-------------|-------------------|
| `walkForFields()` field extraction | `elements` sequence with `field` entries |
| `walkForChildren()` | `elements` sequence with `child` entries |
| `hasBlankChoice()` optionality | `token.optional`, `field.required` |
| `walkForSeparators()` | `field.separator`, `child.separator` |
| `extractTypesFromContent()` | `field.types` |
| `resolveSupertypeMembers()` / `collectConcreteTypes()` | `types.expandedBranch` |
| `collapseToSupertypes()` | `types.collapsedTypes` |
| `resolveFieldTypes()` leaf/branch/anon split | `types.leafTypes`, `types.branchTypes`, `types.anonTokens` |
| `extractLeafPattern()` | (stays on leaf model, not field-level) |
| `extractConstantText()` / keyword detection | (stays on leaf model) |
| `walkRule()` for template ordering | `elements` sequence directly |
| `collectRequiredTokens()` | filter `elements` for non-optional tokens |
| Anonymous-only field detection | `types.leafTypes.length === 0 && types.branchTypes.length === 0` |

**Key insight**: The `elements` ordered sequence replaces multiple grammar walks. `rules.ts` reads element order directly. `factories.ts` reads field types from `FieldModel.types`. `from.ts` and `assign.ts` read `types.leafTypes`/`branchTypes`/`anonTokens`. Nobody re-walks the grammar tree.

#### Choice handling

Some grammar constructs (like `visibility_modifier` or `binary_expression` with precedence levels) have top-level CHOICE branches where different alternatives produce structurally different sequences. The `choice` element type preserves this:

```typescript
// binary_expression: CHOICE of PREC_LEFT branches
{
  kind: 'binary_expression',
  elements: [
    { element: 'field', field: { name: 'left', required: true, ... } },
    { element: 'field', field: { name: 'operator', required: true,
        types: { anonTokens: ['&&', '||', '+', '-', ...], ... } } },
    { element: 'field', field: { name: 'right', required: true, ... } },
  ]
}

// The CHOICE/PREC structure collapses because all branches share the
// same field names — they differ only in operator tokens, which are
// captured in types.anonTokens. The enriched rule is retained for
// cases where branch structure matters.
```

When CHOICE branches have genuinely different field structures (rare), the `choice` element preserves the alternatives.

### Step 4: Signatures (appended per-kind)

After all `NodeModel`s are built, a separate pass computes interned emitter signatures:

```typescript
/** What TypeScript type expressions does the factory emit for this kind? */
interface FactorySignature {
  id: string;
  // Per-field: field name → collapsed type expression
  fields: Record<string, { collapsedTypes: string[]; anonLiterals: string[] }>;
}

/** What runtime resolver logic does .from() emit for this kind? */
interface FromSignature {
  id: string;
  // Per-field: field name → resolution dispatch shape
  fields: Record<string, { leafTypes: string[]; branchTypes: string[]; anonTokens: string[] }>;
}

/** How does assign hydrate this kind from a TreeNode? */
interface HydrationSignature {
  id: string;
  // Per-field: field name → hydration shape
  fields: Record<string, { namedTypes: string[]; anonOnly: boolean }>;
}

interface NodeModel {
  kind: string;
  elements: NodeElement[];
  rule: EnrichedRule;
  // Appended in step 4
  factory?: FactorySignature;
  from?: FromSignature;
  hydration?: HydrationSignature;
}
```

Signatures are **interned**: kinds with identical emission shapes share the same object reference. Per-field sub-entries within signatures are also interned for per-field dedup when whole-kind signatures differ.

### Serialization: `node-model.json5`

The NodeModel (step 3) is fully serializable — every type in the model is a plain object with string, boolean, number, and array fields. No functions, no class instances, no circular references.

After step 3 completes, the codegen emits `node-model.json5` as a generated artifact alongside the TypeScript files:

```typescript
// Serializable shape (JSON-safe — Sets/Maps become arrays/records)
interface SerializedGrammarModel {
  name: string;
  nodes: Record<string, NodeModel>;     // branch kinds
  leafKinds: string[];
  branchKinds: string[];
  keywordKinds: Record<string, string>;
  supertypes: Record<string, string[]>;
  leafValues: Record<string, string[]>;
  leafPatterns: Record<string, string>;
}
```

This is emitted **after step 3, before step 4** (signatures). The node model is the grammar's complete semantic description — independent of any particular code generation strategy. Signatures are codegen-specific and live only in memory.

**Use cases for `node-model.json5`:**
- Alternative code generators (other languages, other patterns) can consume the pre-computed model without running sittir's pipeline
- IDE tooling can read field types, ordering, and optionality directly
- Diffing between grammar versions — semantic diff rather than raw grammar.json diff
- Testing — golden-file snapshot of the model for regression detection

### GrammarModel (in-memory, top-level)

The in-memory model extends the serializable shape with interned signatures and `Set`/`Map` types:

```typescript
interface GrammarModel extends SerializedGrammarModel {
  // Overrides with efficient runtime types
  leafKinds: Set<string>;
  branchKinds: Set<string>;
  keywordKinds: Map<string, string>;
  supertypes: Map<string, string[]>;
  leafValues: Map<string, string[]>;
  leafPatterns: Map<string, string>;
  // Interned signature pools (step 4, not serialized)
  factorySignatures: Map<string, FactorySignature>;
  fromSignatures: Map<string, FromSignature>;
  hydrationSignatures: Map<string, HydrationSignature>;
}
```

All the data currently scattered across `listLeafKinds()`, `listKeywordKinds()`, `listSupertypes()`, `listLeafValues()`, `extractLeafPattern()` etc. is computed once and lives on the model.

## Construction Flow

```
1. loadGrammarJson(grammar)                     → GrammarJson
2. loadRawEntries(grammar)                      → RawNodeEntry[]
3. classifyKinds(entries)                       → { leafKinds, branchKinds, keywordKinds, supertypes, ... }
4. For each (kind, rule) in grammar.json:
     a. enrichRule(rule, nodeTypesEntry, kindSets) → EnrichedRule
     b. projectNodeModel(kind, enrichedRule)       → NodeModel
        - Walk enriched tree → ordered NodeElement[]
        - Classify field types → FieldTypeClass (leaf/branch/anon/expanded/collapsed)
        - Detect separators from REPEAT+SEQ context
        - All shared analysis consolidated here
5. Assemble SerializedGrammarModel → emit node-model.json5
6. computeSignatures(allModels)                 → mutates NodeModel, populates pools
     - Compute FactorySignature, FromSignature, HydrationSignature per kind
     - Intern into pools
     - Append to kind
7. Assemble GrammarModel (extends serialized with signatures + runtime types)
```

Steps 1-4 use existing grammar-reader.ts functions (refactored). Step 5 emits the serializable artifact. Steps 6-7 are codegen-specific.

## Generated Output

`node-model.json5` is added to the generated files alongside existing outputs:

```typescript
interface GeneratedFiles {
  // ... existing files ...
  /** node-model.json5 — serialized pre-computed grammar model */
  nodeModel: string;
}
```

## File Layout

```
packages/codegen/src/
  grammar-reader.ts          (existing — raw loading, kept but simplified)
  enriched-rule.ts           (NEW — enrichRule: GrammarRule → EnrichedRule)
  node-model.ts              (NEW — projectNodeModel: EnrichedRule → NodeModel)
  signatures.ts              (NEW — computeSignatures, interning)
  grammar-model.ts           (NEW — buildGrammarModel orchestration)
  index.ts                   (updated — calls buildGrammarModel, passes to emitters)
  emitters/
    *.ts                     (updated — receive GrammarModel, no grammar retraversal)

packages/rust/src/
  node-model.json5            (NEW — generated, serialized NodeModel)
packages/typescript/src/
  node-model.json5            (NEW — generated)
packages/python/src/
  node-model.json5            (NEW — generated)
```

## Migration

1. Build new pipeline alongside existing one
2. Migrate emitters one at a time (each stops re-walking the grammar)
3. Verify generated output is identical (diff test)
4. Remove superseded functions from grammar-reader.ts

## Non-Goals

- Changing the generated output API (factories, `.from()`, `.assign()` signatures stay the same)
- Modifying `@sittir/core` or `@sittir/types`
- Changing the grammar.json or node-types.json input format
