# File Organization & Methods

Each file corresponds to a domain. Every method listed with inputs and outputs.

---

## `grammar.ts` — Raw Grammar

Domain: faithful representation of grammar.json. No heuristics.

```typescript
loadGrammar(grammarName: string): Grammar
  // in:  grammar name (e.g. "rust")
  // out: parsed grammar.json as Grammar

getRule(grammar: Grammar, kind: string): GrammarRule | null
  // in:  Grammar, kind name
  // out: the raw rule, or null if kind has no rule
```

---

## `node-types.ts` — Raw Node Types

Domain: faithful representation of node-types.json. No heuristics.

```typescript
loadNodeTypes(grammarName: string): NodeTypes
  // in:  grammar name
  // out: parsed node-types.json as NodeTypes
```

---

## `enriched-grammar.ts` — Enriched Grammar

Domain: grammar.json introspection only. Rule in, enriched rule out. Does not touch NodeTypes.

```typescript
classifyRules(grammar: Grammar): EnrichedRule[]
  // in:  Grammar
  // out: every rule classified with modelType + extracted attributes
  //
  // Iterates grammar.rules. For each rule:
  //   - if kind in grammar.supertypes -> extractSubtypes -> SupertypeRule
  //   - if hasFields(rule) -> extractFields -> BranchRule
  //   - if hasChildren(rule) -> extractChildren -> ContainerRule
  //   - try extractKeywordText -> if found: KeywordRule
  //   - try extractEnumValues -> if found: EnumRule
  //   - try extractPattern -> LeafRule (with or without pattern)
  //
  // Classification and extraction happen together — the extraction
  // result determines the modelType.

// Internal helpers (private) — all rule in, enriched rule out:

extractSubtypes(rule: GrammarRule): SupertypeRule
  // in:  rule (CHOICE of SYMBOLs)
  // out: SupertypeRule { modelType: 'supertype', subtypes: string[] }

extractFields(rule: GrammarRule): BranchRule
  // in:  rule with FIELD nodes
  // out: BranchRule { modelType: 'branch', fields, children?, separators }
  //      fields: per-field metadata (kinds, required, multiple) derived from rule structure
  //      separators: detected from REPEAT+SEQ(STRING, ...) patterns
  //      children: non-FIELD SYMBOLs if present

extractChildren(rule: GrammarRule): ContainerRule
  // in:  rule with non-FIELD SYMBOLs but no FIELDs
  // out: ContainerRule { modelType: 'container', children, separators }

extractKeywordText(rule: GrammarRule): string | null
  // in:  rule
  // out: constant text if rule resolves to STRING (through PREC/TOKEN wrappers), null otherwise

extractEnumValues(rule: GrammarRule, grammar: Grammar): string[]
  // in:  rule, grammar (for ALIAS fallback search across all rules)
  // out: sorted string values if CHOICE of STRINGs, empty if not enum-like

extractPattern(rule: GrammarRule): string | null
  // in:  rule
  // out: regex pattern string, null if not extractable

hasFields(rule: GrammarRule): boolean
  // in:  rule
  // out: true if rule contains FIELD nodes

hasChildren(rule: GrammarRule): boolean
  // in:  rule
  // out: true if rule contains non-FIELD SYMBOLs
```

### EnrichedRule Types

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

---

## `node-model.ts` — Node Model

Domain: NodeModel types, type guards, construction, and all transformations. Every method that builds or transforms a NodeModel lives here.

### Types

```typescript
type NodeModel = BranchModel | ContainerModel | LeafModel | EnumModel
              | KeywordModel | TokenModel | SupertypeModel;
type FieldModel = SingleFieldModel | ListFieldModel;
type ChildModel = SingleChildModel | ListChildModel;
type NodeMember = ...;
```

### Type Guards

```typescript
isBranch(n: NodeModel): n is BranchModel
isContainer(n: NodeModel): n is ContainerModel
isLeaf(n: NodeModel): n is LeafModel
isEnum(n: NodeModel): n is EnumModel
isKeyword(n: NodeModel): n is KeywordModel
isToken(n: NodeModel): n is TokenModel
isSupertype(n: NodeModel): n is SupertypeModel
isStructural(n: NodeModel): n is BranchModel | ContainerModel
```

### Step 1: Initialize from NodeTypes

```typescript
initializeModels(nodeTypes: NodeTypes): NodeModel[]
  // in:  NodeTypes (authoritative for what kinds exist)
  // out: initial NodeModel[] — model types from NT structure, field/children shells
  //      anonymous tokens classified as keyword vs operator here
  //      no grammar-derived data yet

initializeBranch(kind: string, entry: NodeTypeEntry): BranchModel
  // in:  kind name, node-types.json entry
  // out: BranchModel shell — fields from NT metadata, children from NT, members empty

initializeContainer(kind: string, entry: NodeTypeEntry): ContainerModel
  // in:  kind name, node-types.json entry (has children, no fields)
  // out: ContainerModel shell — children from NT, members empty

initializeLeaf(kind: string): LeafModel
  // in:  kind name
  // out: LeafModel with null pattern, null rule

initializeEnum(kind: string): EnumModel
  // in:  kind name
  // out: EnumModel shell (values empty, populated during reconciliation)

initializeKeyword(kind: string): KeywordModel
  // in:  kind name
  // out: KeywordModel shell (text empty, populated during reconciliation)

initializeToken(kind: string): TokenModel
  // in:  kind name
  // out: TokenModel

initializeSupertype(kind: string, entry: NodeTypeEntry): SupertypeModel
  // in:  kind name, node-types.json entry (has subtypes)
  // out: SupertypeModel with subtypes from NT
```

### Step 2: Reconcile

Merge grammar-derived data (EnrichedRule[]) with NodeTypes-derived models. Resolve conflicts.

```typescript
reconcile(models: NodeModel[], enrichedRules: EnrichedRule[], nodeTypes: NodeTypes): NodeModel[]
  // in:  NT-initialized models, grammar-classified rules, NodeTypes
  // out: models with grammar data merged in
  //
  // For each model, find its matching EnrichedRule (by kind):
  //   - Attach rule to model
  //   - Merge field metadata: grammar-derived kinds + NT-derived required/multiple
  //   - NT says field exists but grammar missed it -> add field
  //   - Grammar says field exists but NT doesn't -> drop it (NT authoritative)
  //   - Populate keyword text, enum values, leaf pattern from enriched rule
  //   - If grammar and NT disagree on modelType -> NT wins (with warning)
  //   - Grammar-derived separators preserved (NT doesn't know about separators)
  //   - Reorder fields to match NT field key order
```

### Step 3: Apply Members

```typescript
applyMembers(model: BranchModel | ContainerModel, enrichedRule: EnrichedRule, ctx: MemberContext): BranchModel | ContainerModel
  // in:  structural model (reconciled), its enriched rule, context
  // out: model with ordered NodeMember[] populated
  //
  // Walks rule tree to produce members:
  //   - Abstract symbol inlining (_-prefixed)
  //   - CHOICE with same fields -> merge
  //   - CHOICE with different fields -> choice member
  //   - REPEAT/REPEAT1 -> multiple
  //   - CHOICE+BLANK -> optional
  //   - Named ALIAS -> child member
  //   - TOKEN wrapping STRING -> token member
```

### Step 4: Refine Model Type

```typescript
refineModelType(model: NodeModel): NodeModel
  // in:  a NodeModel (possibly miscategorized after reconciliation)
  // out: same model or new model with corrected modelType
```

---

## `hydration.ts` — Hydrate Kind References

Domain: resolve string kind names to NodeModel references.

```typescript
hydrate(models: NodeModel[]): NodeModel[]
  // in:  models with kinds as string[]
  // out: models with kinds as NodeModel[] (resolved references)

hydrateField(field: FieldModel, modelMap: Map<string, NodeModel>): FieldModel
  // in:  field with kinds: string[], lookup map
  // out: field with kinds: NodeModel[]

hydrateChild(child: ChildModel, modelMap: Map<string, NodeModel>): ChildModel
  // in:  child with kinds: string[], lookup map
  // out: child with kinds: NodeModel[]
```

---

## `optimization.ts` — Optimize & Analyze Patterns

Domain: cross-model pattern detection, signature interning, derived projections.

```typescript
optimize(models: NodeModel[], enrichedRules: EnrichedRule[]): NodeModel[]
  // in:  hydrated models, enriched rules (for supertype expansion info)
  // out: models with signatures attached, patterns identified

computeSignatures(models: NodeModel[]): { factory, from, hydration }
  // in:  all models
  // out: interned signature pools

identifyFieldLists(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> fields sharing identical kind sets

identifyChildLists(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> children sharing identical kind sets

identifyEnumPatterns(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: value set hash -> enum kinds sharing same values

// Kind projection (derived on-demand, not stored)

projectKinds(kinds: NodeModel[], supertypeExpansions: Map<string, Set<string>>): KindProjection
  // in:  resolved kind references, supertype expansion map
  // out: leaf/branch partition, expanded, collapsed

collapseKinds(concreteKinds: string[], supertypeExpansions: Map<string, Set<string>>): string[]
  // in:  concrete kind names, supertype map
  // out: PascalCase names after supertype folding with subset pruning
```

---

## `semantic-aliases.ts` — Semantic Token Aliases

Domain: infer meaningful names for anonymous tokens from usage context.

```typescript
inferTokenAliases(models: NodeModel[], grammar: Grammar): Map<string, TokenAlias[]>
  // in:  all models, raw grammar (for rule walking)
  // out: token text -> list of semantic aliases (one per distinct usage context)

applyTokenAliases(models: NodeModel[], aliases: Map<string, TokenAlias[]>): NodeModel[]
  // in:  models with raw token kinds, alias map
  // out: models with token kind strings replaced by semantic alias names
  //      TokenModel nodes duplicated per-alias
```

---

## `build-model.ts` — Orchestrator

Domain: runs the full pipeline, returns complete model ready for emitters.

```typescript
buildModel(grammarName: string): GrammarModel
  // in:  grammar name (e.g. "rust")
  // out: fully built, hydrated, optimized GrammarModel
  //
  // Pipeline:
  //   1. grammar       = loadGrammar(grammarName)
  //   2. nodeTypes     = loadNodeTypes(grammarName)
  //   3. enrichedRules = classifyRules(grammar)                        -- grammar introspection
  //   4. models        = initializeModels(nodeTypes)                   -- NT-derived shells
  //   5. models        = reconcile(models, enrichedRules, nodeTypes)   -- merge both sources
  //   6. models        = applyAllMembers(models, enrichedRules)        -- walk rules for members
  //   7. models        = models.map(refineModelType)                   -- final classification
  //   8. aliases       = inferTokenAliases(models, grammar)            -- semantic aliases
  //   9. models        = applyTokenAliases(models, aliases)
  //  10. models        = optimize(models, enrichedRules)               -- signatures, patterns
  //  11. models        = hydrate(models)                               -- resolve references
  //  12. return { name, models, enrichedRules, signatures }
```
