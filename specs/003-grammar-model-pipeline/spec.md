# Feature Specification: Grammar Model Pipeline Refactoring

**Feature Branch**: `003-grammar-model-pipeline`
**Created**: 2026-03-27
**Status**: Draft
**Supersedes**: spec 002 (enriched-grammar-model)

## Mental Model

```
grammar.json ──────────────────► Grammar              (raw, complete)
                                    │ classifyRules
                                    ▼
                                 EnrichedRule[]         (grammar-introspected, classified)

node-types.json ───► NodeTypes ──► NodeModel[]          (initial shells from NT)
                                    │ reconcile (merge EnrichedRule[])
                                    ▼
                                 NodeModel[]            (grammar + NT merged, rules attached)
                                    │ apply members
                                    ▼
                                 NodeModel[]            (ordered members from rule walking)
                                    │ refine model type
                                    ▼
                                 NodeModel[]            (final model type classification)
                                    │ semantic aliases
                                    ▼
                                 NodeModel[]            (anonymous tokens given meaningful names)
                                    │ naming
                                    ▼
                                 NodeModel[]            (typeName, factoryName, propertyName)
                                    │ optimize
                                    ▼
                                 NodeModel[]            (repeated patterns identified, signatures interned)
                                    │ hydrate
                                    ▼
                                 NodeModel[]            (kind strings → NodeModel references)
                                    │
                                    ▼
                                 Emitters               (pure template producers)
```

Each arrow is a distinct, testable step. Each step has well-defined inputs and outputs.

---

## Layer 1: Grammar (raw)

Everything from grammar.json, nothing inferred. This is a faithful TypeScript representation of the tree-sitter grammar.json structure.

### Data

```typescript
interface Grammar {
  name: string;
  rules: Record<string, GrammarRule>;       // all production rules
  extras: GrammarRule[];                     // whitespace, comments
  conflicts: string[][];                     // GLR conflict groups
  precedences: PrecedenceEntry[];           // explicit precedence ordering
  externals: GrammarRule[];                 // external scanner tokens
  inline: string[];                         // inlined rules (compiler hint)
  supertypes: string[];                     // abstract supertype names
  word: string | null;                      // word token (identifier-like)
}
```

### Methods

| Method | What it does |
|--------|-------------|
| `loadGrammar(grammarName)` | Parse grammar.json, return Grammar |
| `getRule(grammar, kind)` | Lookup rule by kind name |

No heuristics. No cross-referencing. Just structured access to grammar.json.

---

## Layer 2: EnrichedRule (grammar introspection only)

Grammar rules classified and enriched by introspection of grammar.json alone. Does **not** touch node-types.json. Classification and extraction happen together — the extraction result determines the modelType.

### Data

```typescript
type EnrichedRule =
  | SupertypeRule    // { modelType: 'supertype', subtypes, rule }
  | BranchRule       // { modelType: 'branch', fields, children?, separators, rule }
  | ContainerRule    // { modelType: 'container', children, separators, rule }
  | KeywordRule      // { modelType: 'keyword', text, rule }
  | EnumRule         // { modelType: 'enum', values, rule }
  | LeafRule;        // { modelType: 'leaf', pattern: string | null, rule }

// All variants carry the original GrammarRule for downstream use.
// Anonymous tokens have no grammar rules — handled in node-model.ts initialization.
```

### Method

| Method | What it does |
|--------|-------------|
| `classifyRules(grammar)` | Classify every grammar rule and extract attributes. Returns `Map<string, EnrichedRule>`. |

#### Classification Logic

For each rule in grammar.rules:
1. kind in grammar.supertypes → `extractSubtypes` → SupertypeRule
2. hasFields(rule) → `extractFields` → BranchRule
3. hasChildren(rule) → `extractChildren` → ContainerRule
4. `extractKeywordText` succeeds → KeywordRule
5. `extractEnumValues` succeeds → EnumRule
6. Otherwise → `extractPattern` → LeafRule (with or without pattern)

#### Private Helpers (all rule in, enriched rule out)

| Helper | What it does |
|--------|-------------|
| `extractSubtypes(rule)` | CHOICE of SYMBOLs → subtypes list |
| `extractFields(rule)` | Walk rule for FIELD nodes → field metadata, separators, children |
| `extractChildren(rule)` | Walk rule for non-FIELD SYMBOLs → child metadata, separators |
| `extractKeywordText(rule)` | Resolve through PREC/TOKEN to single STRING, or null |
| `extractEnumValues(rule, grammar)` | CHOICE of STRINGs → sorted values, or empty (ALIAS fallback) |
| `extractPattern(rule)` | Build regex from rule tree, or null |

---

## Layer 3: NodeTypes (raw)

Direct representation of node-types.json. No heuristics.

```typescript
interface NodeTypes {
  entries: Map<string, NodeTypeEntry>;
}

interface NodeTypeEntry {
  type: string;
  named: boolean;
  fields?: Record<string, NodeTypeField>;
  children?: NodeTypeField;
  subtypes?: { type: string; named: boolean }[];
}

interface NodeTypeField {
  multiple: boolean;
  required: boolean;
  types: { type: string; named: boolean }[];
}
```

---

## Layer 4: NodeModel

### Model Types

Each model type corresponds to a unique set of fields. 1:1 mapping. No optional field overloading.

**Mutation strategy:** Pipeline steps mutate models in-place. The `readonly` modifiers protect downstream consumers (emitters) from accidental writes, but the pipeline itself owns the objects and casts away `readonly` at the build boundary. No immutable copies between steps.

```typescript
type NodeModel =
  | BranchModel          // named node with fields, optional children, members, rule
  | ContainerModel       // named node with children only, members, rule
  | LeafModel            // named node with variable text, optional pattern
  | EnumModel            // named node with fixed set of values
  | KeywordModel         // named node with constant text
  | TokenModel           // anonymous token
  | SupertypeModel;      // abstract grouping of concrete subtypes

// Common base (discriminant)
interface NodeModelBase {
  modelType: string;
  kind: string;
  // Added by naming step:
  typeName?: string;
  factoryName?: string;
}
```

#### BranchModel
Named node with fields and optionally children. Has members and rule.
```typescript
interface BranchModel extends NodeModelBase {
  modelType: 'branch';
  kind: string;
  fields: FieldModel[];
  children?: ChildModel[];
  members: NodeMember[];
  rule: EnrichedRule;
  // Appended in optimization step
  factory?: FactorySignature;
  from?: FromSignature;
  hydration?: HydrationSignature;
}
```

#### ContainerModel
Named node with children but no fields. Has members and rule.
```typescript
interface ContainerModel extends NodeModelBase {
  modelType: 'container';
  kind: string;
  children: ChildModel[];
  members: NodeMember[];
  rule: EnrichedRule;
}
```

#### LeafModel
Named node with variable text. No fields, no children, no fixed values.
```typescript
interface LeafModel extends NodeModelBase {
  modelType: 'leaf';
  kind: string;
  pattern: string | null;
  rule: EnrichedRule | null;
}
```

#### EnumModel
Named node with a fixed set of text values. Like a leaf but with enumerated options.
```typescript
interface EnumModel extends NodeModelBase {
  modelType: 'enum';
  kind: string;
  values: string[];
  rule: EnrichedRule | null;
}
```

#### KeywordModel
Named node with constant text. Zero-arg factory.
```typescript
interface KeywordModel extends NodeModelBase {
  modelType: 'keyword';
  kind: string;
  text: string;
  rule: EnrichedRule | null;
}
```

#### TokenModel
Anonymous token. Has a fixed text value (the token itself).
```typescript
interface TokenModel extends NodeModelBase {
  modelType: 'token';
  kind: string;
  rule: EnrichedRule | null;
}
```

#### SupertypeModel
Abstract grouping node. Not emitted directly, used for type unions.
```typescript
interface SupertypeModel extends NodeModelBase {
  modelType: 'supertype';
  kind: string;
  subtypes: string[];
  rule: EnrichedRule | null;
}
```

### Type Guards

Exported from the model module. Each narrows the discriminated union and makes the property set visible to emitters.

```typescript
export function isBranch(n: NodeModel): n is BranchModel { return n.modelType === 'branch'; }
export function isContainer(n: NodeModel): n is ContainerModel { return n.modelType === 'container'; }
export function isLeaf(n: NodeModel): n is LeafModel { return n.modelType === 'leaf'; }
export function isEnum(n: NodeModel): n is EnumModel { return n.modelType === 'enum'; }
export function isKeyword(n: NodeModel): n is KeywordModel { return n.modelType === 'keyword'; }
export function isToken(n: NodeModel): n is TokenModel { return n.modelType === 'token'; }
export function isSupertype(n: NodeModel): n is SupertypeModel { return n.modelType === 'supertype'; }

/** Branch or Container — nodes with members and rules */
export function isStructural(n: NodeModel): n is BranchModel | ContainerModel {
  return n.modelType === 'branch' || n.modelType === 'container';
}
```

### Sub-Models

#### FieldModel

Discriminated by `multiple`. Separator only exists on list fields.

```typescript
type FieldModel = SingleFieldModel | ListFieldModel;

interface SingleFieldModel {
  name: string;
  required: boolean;
  multiple: false;
  kinds: string[];
  propertyName?: string;
  fieldSignature?: FieldSignature;   // added by optimization
}

interface ListFieldModel {
  name: string;
  required: boolean;
  multiple: true;
  kinds: string[];
  separator: string | null;
  propertyName?: string;
  fieldSignature?: FieldSignature;   // added by optimization
}
```

#### ChildModel

Same as FieldModel but without `name`.

```typescript
type ChildModel = SingleChildModel | ListChildModel;

interface SingleChildModel {
  required: boolean;
  multiple: false;
  kinds: string[];
  childSignature?: ChildSignature;   // added by optimization
}

interface ListChildModel {
  required: boolean;
  multiple: true;
  kinds: string[];
  separator: string | null;
  childSignature?: ChildSignature;   // added by optimization
}
```

#### NodeMember
```typescript
type NodeMember =
  | { member: 'field'; field: FieldModel }
  | { member: 'token'; value: string; optional: boolean }
  | { member: 'child'; child: ChildModel }
  | { member: 'choice'; branches: NodeMember[][] };
```

### Kind Projections (derived, computed on-demand)

Emitters that need to partition a field's kinds into leaf vs branch, or collapse supertypes for TypeScript type expressions, use derived projections. These are not stored on the field — they're computed from the hydrated `kinds` references.

```typescript
interface KindProjection {
  leafKinds: string[];         // kinds that are leaves (read .text())
  branchKinds: string[];       // kinds that are branches (recurse)
  expandedAll: string[];       // all concrete kinds after supertype expansion
  expandedBranch: string[];    // only branch kinds after expansion
  collapsedKinds: string[];    // PascalCase names after supertype folding
}
```

After hydration, these are trivially computed from the `NodeModel[]` references using the type guards:

```typescript
function projectKinds(kinds: NodeModel[]): KindProjection {
  // kinds are resolved references — use type guards directly
  const leafKinds = kinds.filter(isLeaf).map(n => n.kind);
  const branchKinds = kinds.filter(isBranch).map(n => n.kind);
  // ... expand supertypes, collapse, etc.
}
```

---

### Hydrated Types (post-hydration, emitter-facing)

After step 12 (hydrate), all models are promoted to hydrated variants via a type transformation. `Hydrate<T>` recursively replaces `kinds: string[]` with `kinds: NodeModel[]` and makes all properties `readonly`. Every NodeModel subtype has a hydrated counterpart.

```typescript
// Core transformation: replace kinds + freeze
// kinds: string[] → kinds: HydratedNodeModel[] (references are hydrated too)
type Hydrate<T> =
  T extends { kinds: string[] }
    ? Readonly<Omit<T, 'kinds'> & { kinds: HydratedNodeModel[] }>
    : T extends { fields: FieldModel[] }
      ? Readonly<Omit<T, 'fields' | 'children'> & {
          fields: Hydrate<FieldModel>[];
          children?: Hydrate<ChildModel>[];
        }>
      : T extends { children: ChildModel[] }
        ? Readonly<Omit<T, 'children'> & { children: Hydrate<ChildModel>[] }>
        : Readonly<T>;

// Every model subtype has a hydrated variant
type HydratedFieldModel = Hydrate<FieldModel>;
type HydratedChildModel = Hydrate<ChildModel>;
type HydratedBranchModel = Hydrate<BranchModel>;
type HydratedContainerModel = Hydrate<ContainerModel>;
type HydratedLeafModel = Hydrate<LeafModel>;
type HydratedEnumModel = Hydrate<EnumModel>;
type HydratedKeywordModel = Hydrate<KeywordModel>;
type HydratedTokenModel = Hydrate<TokenModel>;
type HydratedSupertypeModel = Hydrate<SupertypeModel>;

type HydratedNodeModel =
  | HydratedBranchModel
  | HydratedContainerModel
  | HydratedLeafModel
  | HydratedEnumModel
  | HydratedKeywordModel
  | HydratedTokenModel
  | HydratedSupertypeModel;
```

The `GrammarModel` returned by `buildModel()` uses `HydratedNodeModel`:

```typescript
interface GrammarModel {
  readonly name: string;
  readonly models: ReadonlyMap<string, HydratedNodeModel>;
  readonly signatures: SignaturePool;
}

interface SignaturePool {
  readonly factory: Map<string, FactorySignature>;
  readonly from: Map<string, FromSignature>;
  readonly hydration: Map<string, HydrationSignature>;
  readonly field: Map<string, FieldSignature>;
  readonly child: Map<string, ChildSignature>;
}
```

---

## Pipeline Steps

The 13-step pipeline as orchestrated by `build-model.ts`:

### Step 1–2: Load Sources

| Step | Method | What it does |
|------|--------|-------------|
| 1 | `loadGrammar(grammarName)` | Parse grammar.json → Grammar |
| 2 | `loadNodeTypes(grammarName)` | Parse node-types.json → NodeTypes |

### Step 3: Classify Grammar Rules

| Step | Method | What it does |
|------|--------|-------------|
| 3 | `classifyRules(grammar)` | Grammar introspection only → `Map<string, EnrichedRule>` |

Each rule classified as SupertypeRule, BranchRule, ContainerRule, KeywordRule, EnumRule, or LeafRule. Classification and extraction happen together — the extraction result determines the modelType.

### Step 4: Initialize from NodeTypes

| Step | Method | What it does |
|------|--------|-------------|
| 4 | `initializeModels(nodeTypes)` | Create initial NodeModel shells from NT structure |

**Categorization logic** (determines which initializer):
1. Has `subtypes` in node-types.json → SupertypeModel
2. Not named → TokenModel
3. Has fields → BranchModel
4. Has children but no fields → ContainerModel
5. Otherwise → LeafModel (refined during reconcile)

### Step 5: Reconcile

| Step | Method | What it does |
|------|--------|-------------|
| 5 | `reconcile(models, enrichedRules)` | Merge grammar-derived data into NT-derived models |

For each model, lookup matching EnrichedRule:
- Same modelType → enrich with grammar data
- Grammar narrows (leaf→keyword, leaf→enum) → promote, then enrich
- Mismatch → throw error (needs manual review)

### Step 6: Apply Members

| Step | Method | What it does |
|------|--------|-------------|
| 6 | `applyAllMembers(models)` | Walk rules to produce ordered NodeMember[] for structural models |

For each BranchModel and ContainerModel, walks the enriched rule to produce members. Sub-heuristics: abstract symbol inlining, CHOICE merging, multiplicity, optionality, ALIAS handling, TOKEN wrapping.

### Step 7: Refine Model Type

| Step | Method | What it does |
|------|--------|-------------|
| 7 | `refineAllModelTypes(models)` | Final classification check after all data available |

Grammar-based enrichment may reveal that a model needs reclassification (e.g., BranchModel with no fields and only children → ContainerModel).

### Step 8–9: Semantic Aliases (v1: naming-only; context inference deferred)

| Step | Method | What it does |
|------|--------|-------------|
| 8 | `inferTokenAliases(models, grammar)` | **v1:** Character-to-name table for non-alphanumeric tokens. **Deferred:** context-aware inference (e.g., `AddOperator`, `PathSeparator`). |
| 9 | `applyTokenAliases(models, aliases)` | Replace raw token kinds with readable alias names so naming step produces valid identifiers. |

**v1 naming convention:** `Nx[Name]` where `1x` is omitted.
- `+` → `Plus`, `-` → `Minus`, `*` → `Star`
- `&&` → `2xAmpersand`, `||` → `2xPipe`, `::` → `2xColon`
- `>>=` → `2xGreaterThanEquals` (each char named, repetition prefixed)

### Step 10: Naming

| Step | Method | What it does |
|------|--------|-------------|
| 10 | `applyNaming(models)` | Compute typeName (PascalCase), factoryName (camelCase) on models; propertyName (camelCase) on fields |

### Step 11: Optimize

| Step | Method | What it does |
|------|--------|-------------|
| 11 | `optimize(models)` | Signature interning (factory, from, hydration, field, child), enum pattern detection |

### Step 12: Hydrate

| Step | Method | What it does |
|------|--------|-------------|
| 12 | `hydrate(models)` | Resolve all `kinds: string[]` to `kinds: NodeModel[]` references |

### Step 13: Return

Return `{ name, models, signatures }` — fully built, hydrated, optimized GrammarModel ready for emitters.

---

## Semantic Token Aliases (Steps 8–9)

**v1 scope:** Character-to-name table for non-alphanumeric tokens. Produces valid identifiers for the naming step. Uses `Nx[Name]` convention where `1x` is omitted.

**Deferred (follow-up):** Context-aware inference using grammar rule walking (e.g., `+` in `binary_expression.operator` → `AddOperator`).

Anonymous tokens without alphabetic names get semantic aliases inferred from usage context.

**Algorithm:**
1. For each anonymous operator token (e.g., `&&`), find its usage contexts in grammar rules
2. Determine the parent kind and field where it appears (e.g., `binary_expression.operator`)
3. Derive semantic name: `&&` in `binary_expression` → `LogicalAndOperator`
4. If a token has multiple distinct semantic usages, each becomes a distinct node in the model
   - Example: `-` gets two entries: `SubtractOperator` (binary) and `NegateOperator` (unary)
5. The inferred alias becomes the token's `kind` value in the model

**Naming convention:**
- `{semantic_name}Operator` for operators
- Derived from parent kind + field + position
- Example mappings:
  - `&&` → `LogicalAndOperator`
  - `||` → `LogicalOrOperator`
  - `+` in binary_expression → `AddOperator`
  - `->` → `ReturnArrow`
  - `::` → `PathSeparator`

---

## File Layout

```
packages/codegen/src/
  grammar.ts                 # Layer 1: Grammar (raw grammar.json)
  enriched-grammar.ts        # Layer 2: classifyRules (grammar introspection only)
  node-types.ts              # Layer 3: NodeTypes (raw node-types.json)
  node-model.ts              # Layer 4: NodeModel types, type guards, initialize, reconcile, members, refine
  naming.ts                  # Naming: typeName, factoryName, propertyName
  hydration.ts               # Hydrate: kind strings → NodeModel references
  optimization.ts            # Optimize: signatures, dedup, kind utilities
  semantic-aliases.ts        # Semantic aliases: infer + apply token aliases
  build-model.ts             # Orchestrator: 13-step pipeline
  emitters/
    utils.ts                 # Updated: use type guards, KindProjection helpers
    *.ts                     # Updated: receive hydrated NodeModel[], use type guards
```

---

## Migration Strategy

**Approach:** Single cutover. Replace the entire pipeline at once, validate via generated output diff test against all three grammars (Rust, TypeScript, Python). No incremental coexistence of old and new code.

**Validation:** Run codegen for all three grammars before and after. Diff generated output. Zero diff = done. Remove old code only after diff test passes.

**Steps:**
1. Implement new model types + type guards
2. Implement 13-step pipeline (`build-model.ts` + domain files)
3. Update emitters to consume hydrated `NodeModel[]` with type guards
4. Run codegen for all three grammars, diff against current output
5. Remove old grammar-reader.ts / grammar-model.ts functions

---

## Non-Goals

- Changing generated output API (factories, .from(), .assign() stay the same)
- Modifying @sittir/core or @sittir/types
- Changing grammar.json or node-types.json input format

---

## Clarifications

### Session 2026-03-28

- Q: Pipeline steps mutate models through 13 stages, but model interfaces use `readonly`. How should steps transform models? → A: Mutable in-place — pipeline owns the objects, `readonly` protects consumers (emitters) only.
- Q: How should the `kinds: string[]` → `kinds: NodeModel[]` hydration boundary be represented in TypeScript? → A: Two separate types — `FieldModel`/`ChildModel` (pre-hydration, `kinds: string[]`) and `HydratedFieldModel`/`HydratedChildModel` (post-hydration, `kinds: NodeModel[]`). Emitters receive hydrated types only.
- Q: What's the minimum scope for semantic aliases in v1? → A: Naming-only — character-to-name table (`Plus`, `2xColon`). Convention: `Nx[Name]` where `1x` omitted. Context-aware inference (e.g., `AddOperator`) deferred to follow-up.
- Q: Incremental migration or single cutover? → A: Single cutover — replace pipeline, validate via generated output diff test against all three grammars. No parallel coexistence.
- Q: Do emitters receive hydrated model types or resolve kinds via map? → A: Hydrated model variants — `HydratedBranchModel`, `HydratedNodeModel` union. All fields `readonly`. `GrammarModel` uses `ReadonlyMap<string, HydratedNodeModel>`.
