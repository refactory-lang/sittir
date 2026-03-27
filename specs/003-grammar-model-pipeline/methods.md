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
classifyRules(grammar: Grammar): Map<string, EnrichedRule>
  // in:  Grammar
  // out: kind -> EnrichedRule, each classified with modelType + extracted attributes
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
  // out: SupertypeRule { modelType: 'supertype', subtypes: string[], rule }

extractFields(rule: GrammarRule): BranchRule
  // in:  rule with FIELD nodes
  // out: BranchRule { modelType: 'branch', fields, children?, separators, rule }
  //      fields: per-field metadata (kinds, required, multiple) derived from rule structure
  //      separators: detected from REPEAT+SEQ(STRING, ...) patterns
  //      children: non-FIELD SYMBOLs if present

extractChildren(rule: GrammarRule): ContainerRule
  // in:  rule with non-FIELD SYMBOLs but no FIELDs
  // out: ContainerRule { modelType: 'container', children, separators, rule }

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

Domain: NodeModel types, type guards, construction, and all transformations.

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
initializeModels(nodeTypes: NodeTypes): Map<string, NodeModel>
  // in:  NodeTypes (authoritative for what kinds exist)
  // out: kind -> NodeModel, initial shells from NT structure
  //      anonymous tokens classified as keyword vs operator here
  //      no grammar-derived data yet
  //
  // Per entry:
  //   if entry.subtypes                     -> initializeSupertype
  //   if !entry.named                       -> initializeToken
  //   if entry.fields with >0 keys          -> initializeBranch
  //   if entry.children && no fields        -> initializeContainer
  //   otherwise                             -> initializeLeaf
  //     (could be leaf, enum, or keyword — refined during reconcile)

initializeBranch(kind: string, entry: NodeTypeEntry): BranchModel
  // in:  kind name, node-types.json entry
  // out: BranchModel shell
  //      fields: FieldModel[] from NT (name, required, multiple, kinds from NT types)
  //      children?: ChildModel[] from NT children if present
  //      members: [], rule: null

initializeContainer(kind: string, entry: NodeTypeEntry): ContainerModel
  // in:  kind name, node-types.json entry (has children, no fields)
  // out: ContainerModel shell — children from NT, members: [], rule: null

initializeLeaf(kind: string): LeafModel
  // in:  kind name
  // out: LeafModel { kind, pattern: null, rule: null }

initializeToken(kind: string): TokenModel
  // in:  kind name
  // out: TokenModel { kind, rule: null }

initializeSupertype(kind: string, entry: NodeTypeEntry): SupertypeModel
  // in:  kind name, node-types.json entry (has subtypes)
  // out: SupertypeModel { kind, subtypes from NT, rule: null }
```

### Step 2: Reconcile

Merge grammar-derived data (EnrichedRule map) with NT-derived models. Iterates models, dispatches by modelType match.

```typescript
reconcile(models: Map<string, NodeModel>, enrichedRules: Map<string, EnrichedRule>): Map<string, NodeModel>
  // in:  NT-initialized models, grammar-classified rules
  // out: models enriched with grammar data
  //
  // For each model:
  //   rule = enrichedRules.get(model.kind)
  //   if !rule -> model unchanged (no grammar rule exists, keep as-is)
  //
  //   if model.modelType === rule.modelType:
  //     same classification — route to enrich method
  //
  //   if rule.modelType is narrower:
  //     grammar refined it — promote model, then enrich
  //     narrowing: leaf -> keyword, leaf -> enum
  //                branch -> container
  //
  //   if rule.modelType is wider or conflicts:
  //     NT wins — warn, keep NT modelType, attach rule only

// Per-modelType enrich methods (private):

enrichBranch(model: BranchModel, rule: BranchRule): BranchModel
  // merge field kinds from rule into model fields
  // add separators from rule
  // populate members from rule
  // attach rule reference

enrichContainer(model: ContainerModel, rule: ContainerRule): ContainerModel
  // merge child kinds from rule
  // add separators
  // populate members
  // attach rule reference

enrichLeaf(model: LeafModel, rule: LeafRule): LeafModel
  // add pattern from rule
  // attach rule reference

enrichKeyword(model: KeywordModel, rule: KeywordRule): KeywordModel
  // add text from rule
  // attach rule reference

enrichEnum(model: EnumModel, rule: EnumRule): EnumModel
  // add values from rule
  // attach rule reference

enrichSupertype(model: SupertypeModel, rule: SupertypeRule): SupertypeModel
  // merge subtypes (NT subtypes + grammar subtypes)
  // attach rule reference
```

### Step 3: Apply Members

```typescript
applyMembers(model: BranchModel | ContainerModel): BranchModel | ContainerModel
  // in:  structural model (reconciled, has rule attached)
  // out: model with ordered NodeMember[] populated from rule
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
  // in:  a NodeModel (possibly miscategorized after reconciliation + members)
  // out: same model or new model with corrected modelType
  //      e.g. BranchModel with no fields and only children -> ContainerModel
```

---

## `hydration.ts` — Hydrate Kind References

Domain: resolve string kind names to NodeModel references.

```typescript
hydrate(models: Map<string, NodeModel>): Map<string, NodeModel>
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
optimize(models: Map<string, NodeModel>): Map<string, NodeModel>
  // in:  hydrated models
  // out: models with signatures attached, patterns identified

computeSignatures(models: Map<string, NodeModel>): { factory, from, hydration }
  // in:  all models
  // out: interned signature pools

identifyFieldLists(models: Map<string, NodeModel>): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> fields sharing identical kind sets

identifyChildLists(models: Map<string, NodeModel>): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> children sharing identical kind sets

identifyEnumPatterns(models: Map<string, NodeModel>): Map<string, string[]>
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
inferTokenAliases(models: Map<string, NodeModel>, grammar: Grammar): Map<string, TokenAlias[]>
  // in:  all models, raw grammar (for rule walking)
  // out: token text -> list of semantic aliases (one per distinct usage context)

applyTokenAliases(models: Map<string, NodeModel>, aliases: Map<string, TokenAlias[]>): Map<string, NodeModel>
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
  //   3. enrichedRules = classifyRules(grammar)                       -- grammar introspection
  //   4. models        = initializeModels(nodeTypes)                  -- NT-derived shells
  //   5. models        = reconcile(models, enrichedRules)             -- merge both sources
  //   6. models        = applyAllMembers(models)                      -- walk rules for members
  //   7. models        = refineAllModelTypes(models)                  -- final classification
  //   8. aliases       = inferTokenAliases(models, grammar)           -- semantic aliases
  //   9. models        = applyTokenAliases(models, aliases)
  //  10. models        = optimize(models)                             -- signatures, patterns
  //  11. models        = hydrate(models)                              -- resolve references
  //  12. return { name, models, signatures }
```
