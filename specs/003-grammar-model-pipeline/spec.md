# Feature Specification: Grammar Model Pipeline Refactoring

**Feature Branch**: `003-grammar-model-pipeline`
**Created**: 2026-03-27
**Status**: Draft
**Supersedes**: spec 002 (enriched-grammar-model)

## Mental Model

```
grammar.json ──────────────────► Grammar            (raw, complete)
                                    │ enrich
                                    ▼
                                 EnrichedGrammar     (heuristic-derived attributes)
                                    │
node-types.json ───► NodeTypes ─────┤
                                    │ initialize
                                    ▼
                                 NodeModel[]         (categorized, FieldModel/ChildModel created)
                                    │ apply members
                                    ▼
                                 NodeModel[]         (members from EnrichedGrammar, type refinements)
                                    │ optimize
                                    ▼
                                 NodeModel[]         (repeated patterns identified, semantic aliases)
                                    │
                                    ▼
                                 Emitters            (pure template producers)
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

| Method | Classification | What it does |
|--------|---------------|--------------|
| `loadGrammar(path)` | Raw read | Parse grammar.json, return Grammar |
| `getRule(grammar, kind)` | Raw read | Lookup rule by kind name |

No heuristics. No cross-referencing. Just structured access to grammar.json.

---

## Layer 2: EnrichedGrammar

Grammar + heuristic-derived attributes. Each heuristic is a named, documented method.

### Data

```typescript
interface EnrichedGrammar extends Grammar {
  /** Named kinds that are terminal (no fields, no children) */
  leafKinds: Set<string>;
  /** Named kinds that have fields and/or children */
  branchKinds: Set<string>;
  /** Named kinds with constant text: kind -> text */
  keywordKinds: Map<string, string>;
  /** Abstract supertypes: name -> concrete subtypes (recursive) */
  supertypeExpansions: Map<string, Set<string>>;
  /** Anonymous tokens classified as keywords (alphabetic) */
  keywordTokens: string[];
  /** Anonymous tokens classified as operators (non-alphabetic) */
  operatorTokens: string[];
  /** Per-rule enriched form (same tree shape, metadata-annotated) */
  enrichedRules: Map<string, EnrichedRule>;
}
```

### Heuristics (each is its own method)

| Method | Heuristic | Inputs | Output |
|--------|-----------|--------|--------|
| `classifyKinds(grammar, nodeTypes)` | Partition named kinds into leaf vs branch | grammar.json supertypes + node-types.json fields/children | leafKinds, branchKinds |
| `detectKeywords(grammar, leafKinds)` | Identify leaves with constant text | Grammar rules for leaf kinds | keywordKinds: Map<kind, text> |
| `expandSupertypes(grammar)` | Recursively resolve abstract types to concrete | grammar.json supertypes + rules | supertypeExpansions |
| `classifyTokens(nodeTypes)` | Split anonymous tokens into keyword vs operator | node-types.json unnamed entries | keywordTokens, operatorTokens |
| `enrichRule(rule, nodeTypes, kindSets)` | Annotate rule tree with cross-referenced metadata | Raw rule + node-types.json field info + kind classification | EnrichedRule |

#### Heuristic Details

**H1: classifyKinds** (cross-reference)
- Source: node-types.json `fields` and `children` presence
- A kind with fields OR children -> branch
- A kind without fields AND without children AND not a supertype -> leaf
- Supertypes (have `subtypes` array) are their own category

**H2: detectKeywords** (grammar analysis)
- For each leaf kind, read its grammar rule
- If rule resolves to a single constant STRING (possibly through PREC/TOKEN wrappers) -> keyword
- Example: `self` rule is `STRING("self")` -> keyword with text "self"
- Example: `mutable_specifier` rule is `STRING("mut")` -> keyword with text "mut"

**H3: expandSupertypes** (recursive resolution)
- Walk grammar.json rule for each supertype (CHOICE of SYMBOLs)
- Recursively expand nested supertypes until all are concrete
- Cycle detection via visited set
- Example: `_expression` -> { binary_expression, call_expression, ... }

**H4: classifyTokens** (pattern matching)
- Anonymous (unnamed) entries in node-types.json
- If `/^[a-z_]+$/i` -> keyword token (e.g., "fn", "let", "pub")
- If non-alphabetic and not quotes -> operator token (e.g., "+", "->", "::")

**H5: enrichRule** (metadata annotation)
- Same tree shape as GrammarRule, with added metadata at nodes:
  - FIELD nodes gain `required` and `multiple` from node-types.json
  - SYMBOL nodes gain `leaf`, `keyword`, `supertype` flags from kind classification
- Purely additive. No structural change.

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

```typescript
type NodeModel =
  | BranchModel          // named node with fields, optional children, members, rule
  | ContainerModel       // named node with children only, members, rule (was LeafWithChildrenModel)
  | LeafModel            // named node with variable text, optional pattern
  | EnumModel            // named node with fixed set of values (was LeafModel+values)
  | KeywordModel         // named node with constant text
  | TokenModel           // anonymous token
  | SupertypeModel;      // abstract grouping of concrete subtypes

// Common base (discriminant)
interface NodeModelBase {
  readonly modelType: string;
  readonly kind: string;
}
```

#### BranchModel
Named node with fields and optionally children. Has members and rule.
```typescript
interface BranchModel extends NodeModelBase {
  readonly modelType: 'branch';
  readonly kind: string;
  readonly fields: FieldModel[];
  readonly children: ChildModel | null;
  readonly members: NodeMember[];          // was "elements"
  readonly rule: EnrichedRule;
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
  readonly modelType: 'container';         // was "leafWithChildren"
  readonly kind: string;
  readonly children: ChildModel;           // always present (not optional)
  readonly members: NodeMember[];          // was "elements"
  readonly rule: EnrichedRule;
}
```

#### LeafModel
Named node with variable text. No fields, no children, no fixed values.
```typescript
interface LeafModel extends NodeModelBase {
  readonly modelType: 'leaf';
  readonly kind: string;
  readonly pattern: string | null;         // regex validation pattern, null if unconstrained
  readonly rule: EnrichedRule | null;      // retained unless truly absent
}
```

#### EnumModel
Named node with a fixed set of text values. Like a leaf but with enumerated options.
```typescript
interface EnumModel extends NodeModelBase {
  readonly modelType: 'enum';
  readonly kind: string;
  readonly values: string[];               // non-empty, sorted
  readonly rule: EnrichedRule | null;
}
```

#### KeywordModel
Named node with constant text. Zero-arg factory.
```typescript
interface KeywordModel extends NodeModelBase {
  readonly modelType: 'keyword';
  readonly kind: string;
  readonly text: string;
  readonly rule: EnrichedRule | null;
}
```

#### TokenModel
Anonymous token. Has a fixed text value (the token itself).
```typescript
interface TokenModel extends NodeModelBase {
  readonly modelType: 'token';
  readonly kind: string;                   // the token text, e.g. "+", "fn"
  readonly rule: EnrichedRule | null;
}
```

#### SupertypeModel
Abstract grouping node. Not emitted directly, used for type unions.
```typescript
interface SupertypeModel extends NodeModelBase {
  readonly modelType: 'supertype';
  readonly kind: string;
  readonly subtypes: string[];
  readonly rule: EnrichedRule | null;
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
```typescript
interface FieldModel {
  readonly name: string;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly types: FieldTypeClass;
  readonly separator: string | null;
}
```

#### ChildModel
```typescript
interface ChildModel {
  readonly required: boolean;
  readonly multiple: boolean;
  readonly types: FieldTypeClass;
  readonly separator: string | null;
}
```

#### FieldTypeClass
```typescript
interface FieldTypeClass {
  readonly leafTypes: string[];
  readonly branchTypes: string[];
  readonly anonTokens: string[];
  readonly expandedAll: string[];
  readonly expandedBranch: string[];
  readonly collapsedTypes: string[];
}
```

#### NodeMember (was NodeElement)
```typescript
type NodeMember =
  | { member: 'field'; field: FieldModel }
  | { member: 'token'; value: string; optional: boolean }
  | { member: 'child'; child: ChildModel }
  | { member: 'choice'; branches: NodeMember[][] };
```

---

## Pipeline Steps

### Step A: Initialize NodeModels from NodeTypes

NodeTypes is the authoritative source for what kinds exist and their initial categorization.

| Method | What it does |
|--------|-------------|
| `initializeBranch(kind, entry)` | Create BranchModel shell from node-types.json fields/children. Initial FieldModel/ChildModel from NT field metadata. Members empty. |
| `initializeContainer(kind, entry)` | Create ContainerModel shell from node-types.json children. Members empty. |
| `initializeLeaf(kind)` | Create LeafModel with null pattern, null rule. |
| `initializeEnum(kind, values)` | Create EnumModel with values from grammar analysis. |
| `initializeKeyword(kind, text)` | Create KeywordModel with constant text. |
| `initializeToken(kind)` | Create TokenModel. |
| `initializeSupertype(kind, subtypes)` | Create SupertypeModel with subtypes. |

**Categorization logic** (determines which initializer):
1. Has `subtypes` in node-types.json -> SupertypeModel
2. Not named -> TokenModel
3. Has fields -> BranchModel
4. Has children but no fields -> ContainerModel
5. Is keyword (detected by H2) -> KeywordModel
6. Has enumerated values (detected from grammar) -> EnumModel
7. Otherwise -> LeafModel

### Step B: Apply EnrichedGrammar to NodeModels

For each BranchModel and ContainerModel, walk the EnrichedRule to produce members.

| Method | Classification | What it does |
|--------|---------------|-------------|
| `applyMembers(model, enrichedRule, ctx)` | Grammar-derived | Walk enriched rule tree, produce ordered NodeMember[] sequence. Each FIELD -> field member, each STRING -> token member, etc. |
| `applyFieldTypes(field, enrichedRule, ctx)` | Grammar-derived | Classify field types into FieldTypeClass (leaf/branch/anon, expanded, collapsed) |
| `applySeparators(model, enrichedRule)` | Grammar-derived | Detect REPEAT+SEQ separator patterns, annotate FieldModel/ChildModel |
| `applyLeafPattern(model, rule)` | Grammar-derived | Extract regex pattern from leaf grammar rule |
| `refineModelType(model)` | Refinement | After member application, check if categorization needs adjustment |
| `supplementFromNodeTypes(model, entry)` | Cross-reference | Add fields found in node-types.json but missed in grammar walk |
| `reorderFields(model, entry)` | Cross-reference | Reorder fields to match node-types.json authoritative field order |

#### Member Application Heuristics (inside applyMembers)

| Sub-heuristic | What |
|--------------|------|
| Abstract symbol inlining | `_`-prefixed symbols recursively expanded, fields/children extracted |
| CHOICE with same fields | All branches merged, type sets unioned (binary_expression pattern) |
| CHOICE with different fields | Preserved as choice member |
| REPEAT/REPEAT1 | Content marked as multiple |
| CHOICE+BLANK | Content marked as optional |
| Named ALIAS | Treated as explicit child |
| TOKEN wrapping STRING | Emitted as token member |

### Step C: Optimizations

Pattern detection across all models. These inform emit-time deduplication.

| Method | What it detects |
|--------|----------------|
| `computeSignatures(models)` | Intern FactorySignature, FromSignature, HydrationSignature. Multiple kinds sharing identical field shapes get same signature object. |
| `identifyFieldLists(models)` | Fields across different kinds that have identical FieldTypeClass (reusable type expressions) |
| `identifyChildLists(models)` | Children across different kinds with identical type sets |
| `identifyEnumPatterns(models)` | Leaf kinds that share the same value set or pattern |

### Step D: Semantic Token Aliases (Enhancement)

Anonymous tokens without alphabetic names get semantic aliases inferred from usage context.

| Method | What it does |
|--------|-------------|
| `inferTokenAliases(models, grammar)` | For each anonymous operator token, find its usage contexts in grammar rules. Infer semantic name from the parent kind + field. |

**Algorithm:**
1. For each operator token (e.g., `&&`), find all grammar rules that reference it
2. Determine the parent kind and field where it appears (e.g., `binary_expression.operator`)
3. Derive semantic name: `&&` in `binary_expression` -> `LogicalAndOperator`
4. If a token has multiple distinct semantic usages, each becomes a distinct node in the model
   - Example: `-` as `SubtractOperator` (in binary_expression) vs `NegateOperator` (in unary_expression)
5. The inferred alias becomes the token's `kind` value in the model

**Naming convention:**
- `{semantic_name}Operator` for operators
- Derived from parent kind + field + position
- Example mappings:
  - `&&` -> `LogicalAndOperator`
  - `||` -> `LogicalOrOperator`
  - `+` in binary_expression -> `AddOperator`
  - `+` in unary_expression -> `UnaryPlusOperator` (if it existed)
  - `->` -> `ArrowOperator`
  - `::` -> `PathSeparator`

---

## File Layout

```
packages/codegen/src/
  grammar.ts                 # Layer 1: Grammar (raw grammar.json)
  enriched-grammar.ts        # Layer 2: EnrichedGrammar (heuristics applied)
  node-types.ts              # Layer 3: NodeTypes (raw node-types.json)
  node-model.ts              # Layer 4: NodeModel types, type guards
  pipeline/
    initialize.ts            # Step A: NodeTypes + EnrichedGrammar -> initial NodeModels
    apply-members.ts         # Step B: EnrichedRule -> members, field types, separators
    optimize.ts              # Step C: Signature dedup, pattern detection
    semantic-aliases.ts      # Step D: Token alias inference (enhancement)
  build-model.ts             # Orchestrator: runs steps A-D, returns complete model
  emitters/
    utils.ts                 # Updated: use type guards instead of filter functions
    *.ts                     # Updated: receive NodeModel[], use type guards
```

---

## Migration Strategy

1. Define new model types + type guards alongside existing ones
2. Rename elements -> members, LeafWithChildrenModel -> ContainerModel
3. Split LeafModel: extract EnumModel for kinds with values
4. Add rule to all model types (retain unless truly absent)
5. Restructure pipeline into named steps
6. Move heuristics into individual named methods
7. Verify generated output unchanged via diff test
8. Remove old grammar-reader.ts functions superseded by pipeline

---

## Non-Goals

- Changing generated output API (factories, .from(), .assign() stay the same)
- Modifying @sittir/core or @sittir/types
- Changing grammar.json or node-types.json input format
