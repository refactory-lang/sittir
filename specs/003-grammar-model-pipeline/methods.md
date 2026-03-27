# File Organization & Methods

Each file corresponds to a domain. Every method listed with inputs and outputs.

---

## `grammar.ts` — Raw Grammar

Domain: faithful representation of grammar.json. No heuristics.

```typescript
// Types
interface Grammar {
  name: string;
  rules: Record<string, GrammarRule>;
  extras: GrammarRule[];
  conflicts: string[][];
  precedences: PrecedenceEntry[];
  externals: GrammarRule[];
  inline: string[];
  supertypes: string[];
  word: string | null;
}

// Methods

loadGrammar(grammarName: string): Grammar
  // in:  grammar name (e.g. "rust")
  // out: parsed grammar.json as Grammar
  // resolves path, reads file, parses JSON

getRule(grammar: Grammar, kind: string): GrammarRule | null
  // in:  Grammar, kind name
  // out: the raw rule, or null if kind has no rule
```

---

## `node-types.ts` — Raw Node Types

Domain: faithful representation of node-types.json. No heuristics.

```typescript
// Types
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

// Methods

loadNodeTypes(grammarName: string): NodeTypes
  // in:  grammar name
  // out: parsed node-types.json as NodeTypes
```

---

## `enriched-grammar.ts` — Enriched Grammar

Domain: grammar + heuristic-derived attributes. Each heuristic is a method.

```typescript
// Types
interface EnrichedGrammar extends Grammar {
  leafKinds: Set<string>;
  branchKinds: Set<string>;
  keywordKinds: Map<string, string>;
  supertypeExpansions: Map<string, Set<string>>;
  keywordTokens: string[];
  operatorTokens: string[];
  enrichedRules: Map<string, EnrichedRule>;
}

// Construction

enrichGrammar(grammar: Grammar, nodeTypes: NodeTypes): EnrichedGrammar
  // in:  raw Grammar, raw NodeTypes
  // out: EnrichedGrammar with all heuristic-derived attributes populated
  // orchestrates the heuristic methods below

// Heuristic methods (called by enrichGrammar)

classifyKinds(grammar: Grammar, nodeTypes: NodeTypes): { leafKinds: Set<string>; branchKinds: Set<string> }
  // in:  Grammar (for supertypes list), NodeTypes (for fields/children presence)
  // out: partition of named kinds into leaf vs branch

detectKeywords(grammar: Grammar, leafKinds: Set<string>): Map<string, string>
  // in:  Grammar (rules for leaf kinds), set of leaf kinds
  // out: kind -> constant text for keywords

detectEnumValues(grammar: Grammar, kind: string): string[]
  // in:  Grammar (rules), a leaf kind name
  // out: sorted array of fixed string values, or empty if not enum-like

expandSupertypes(grammar: Grammar): Map<string, Set<string>>
  // in:  Grammar (supertypes list + rules)
  // out: supertype name -> set of all concrete descendant kinds

classifyTokens(nodeTypes: NodeTypes): { keywordTokens: string[]; operatorTokens: string[] }
  // in:  NodeTypes (unnamed entries)
  // out: anonymous tokens split into keyword (alphabetic) vs operator (non-alphabetic)

enrichRule(rule: GrammarRule, nodeTypes: NodeTypes, kindSets: KindSets): EnrichedRule
  // in:  raw GrammarRule, NodeTypes (for field required/multiple), kind classification
  // out: same tree shape with metadata annotations on FIELD and SYMBOL nodes

extractLeafPattern(grammar: Grammar, kind: string): string | null
  // in:  Grammar, a leaf kind name
  // out: regex pattern string, or null if unconstrained
```

---

## `node-model.ts` — Node Model

Domain: NodeModel types, type guards, construction, transformation, refinement. This is the largest file — all NodeModel lifecycle lives here.

```typescript
// Types (see spec.md for full definitions)
type NodeModel = BranchModel | ContainerModel | LeafModel | EnumModel | KeywordModel | TokenModel | SupertypeModel;
type FieldModel = SingleFieldModel | ListFieldModel;
type ChildModel = SingleChildModel | ListChildModel;
type NodeMember = ...;

// Type guards

isBranch(n: NodeModel): n is BranchModel
isContainer(n: NodeModel): n is ContainerModel
isLeaf(n: NodeModel): n is LeafModel
isEnum(n: NodeModel): n is EnumModel
isKeyword(n: NodeModel): n is KeywordModel
isToken(n: NodeModel): n is TokenModel
isSupertype(n: NodeModel): n is SupertypeModel
isStructural(n: NodeModel): n is BranchModel | ContainerModel

// Step 1: Initialize

initializeModels(enrichedGrammar: EnrichedGrammar, nodeTypes: NodeTypes): NodeModel[]
  // in:  EnrichedGrammar (for keyword/enum detection), NodeTypes (authoritative kind list)
  // out: initial NodeModel[] with correct model types, fields/children shells, empty members
  // calls the individual initializers below based on categorization logic

initializeBranch(kind: string, entry: NodeTypeEntry): BranchModel
  // in:  kind name, node-types.json entry
  // out: BranchModel shell — fields from NT metadata, children from NT, members empty, no rule yet

initializeContainer(kind: string, entry: NodeTypeEntry): ContainerModel
  // in:  kind name, node-types.json entry (has children, no fields)
  // out: ContainerModel shell — children from NT, members empty, no rule yet

initializeLeaf(kind: string, pattern: string | null): LeafModel
  // in:  kind name, pattern (from extractLeafPattern, may be null)
  // out: LeafModel

initializeEnum(kind: string, values: string[]): EnumModel
  // in:  kind name, non-empty sorted values array
  // out: EnumModel

initializeKeyword(kind: string, text: string): KeywordModel
  // in:  kind name, constant text
  // out: KeywordModel

initializeToken(kind: string): TokenModel
  // in:  kind name (the token text itself)
  // out: TokenModel

initializeSupertype(kind: string, subtypes: string[]): SupertypeModel
  // in:  kind name, subtype kind names
  // out: SupertypeModel

// Step 2 & 6: Refine Model Type

refineModelType(model: NodeModel): NodeModel
  // in:  a NodeModel (possibly miscategorized)
  // out: same model or new model with corrected modelType
  // e.g. a BranchModel that turns out to have no fields and only children -> ContainerModel

// Step 3: Apply Non-Grammar Heuristics

applyNonGrammarHeuristics(models: NodeModel[], enrichedGrammar: EnrichedGrammar, nodeTypes: NodeTypes): NodeModel[]
  // in:  initialized models, enriched grammar, node types
  // out: models with non-grammar heuristics applied
  // heuristics that use only precomputed attributes, not grammar rule walking

// Step 4: Apply Members + Rule

applyMembersAndRule(model: BranchModel | ContainerModel, enrichedRule: EnrichedRule, ctx: MemberContext): BranchModel | ContainerModel
  // in:  structural model, its enriched rule, context for resolution
  // out: model with members populated and rule attached
  // walks enriched rule tree to produce ordered NodeMember[] sequence

applyMembers(enrichedRule: EnrichedRule, ctx: MemberContext): NodeMember[]
  // in:  enriched rule tree, context (leafKinds, supertypeExpansions, etc.)
  // out: ordered NodeMember[] sequence
  // handles: abstract inlining, CHOICE merging, REPEAT, ALIAS, tokens

applyRule(model: NodeModel, enrichedRule: EnrichedRule): NodeModel
  // in:  any model, its enriched rule
  // out: model with rule attached (for leaves, keywords, etc. that don't get members)

// Step 5: Apply Grammar-Based Heuristics

applyGrammarHeuristics(model: BranchModel | ContainerModel, enrichedRule: EnrichedRule, ctx: MemberContext, entry: NodeTypeEntry): BranchModel | ContainerModel
  // in:  structural model with members, enriched rule, context, NT entry
  // out: model with field kinds populated, separators detected, fields supplemented/reordered
  // orchestrates the methods below

applyFieldKinds(field: FieldModel, enrichedRule: EnrichedRule, ctx: MemberContext): FieldModel
  // in:  field model, enriched rule containing this field, context
  // out: field with kinds[] populated from grammar rule type analysis

applySeparators(model: BranchModel | ContainerModel, enrichedRule: EnrichedRule): BranchModel | ContainerModel
  // in:  structural model, enriched rule
  // out: model with ListFieldModel/ListChildModel separator values set
  // detects REPEAT+SEQ(STRING, ...) separator patterns

supplementFromNodeTypes(model: BranchModel, entry: NodeTypeEntry): BranchModel
  // in:  branch model, node-types.json entry
  // out: model with missing fields added (fields in NT but not found in grammar walk)

reorderFields(model: BranchModel, entry: NodeTypeEntry): BranchModel
  // in:  branch model, node-types.json entry
  // out: model with fields reordered to match NT field key order
```

---

## `hydration.ts` — Hydrate Kind References

Domain: resolve string kind names to NodeModel references.

```typescript
// Types
type HydratedFieldModel = SingleFieldModel & { kinds: NodeModel[] } | ListFieldModel & { kinds: NodeModel[] };
type HydratedChildModel = SingleChildModel & { kinds: NodeModel[] } | ListChildModel & { kinds: NodeModel[] };

// Methods

hydrate(models: NodeModel[]): NodeModel[]
  // in:  models with kinds as string[]
  // out: models with kinds as NodeModel[] (resolved references)
  // builds kind->model map, walks all fields/children, replaces strings with references

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
// Types
interface FactorySignature { id: string; fields: Record<string, { collapsedKinds: string[] }> }
interface FromSignature { id: string; fields: Record<string, { leafKinds: string[]; branchKinds: string[] }> }
interface HydrationSignature { id: string; fields: Record<string, { namedKinds: string[] }> }

interface KindProjection {
  leafKinds: string[];
  branchKinds: string[];
  expandedAll: string[];
  expandedBranch: string[];
  collapsedKinds: string[];
}

// Methods

optimize(models: NodeModel[], enrichedGrammar: EnrichedGrammar): NodeModel[]
  // in:  hydrated models, enriched grammar (for supertype info)
  // out: models with signatures attached, patterns identified

computeSignatures(models: NodeModel[]): { factory: Map<string, FactorySignature>; from: Map<string, FromSignature>; hydration: Map<string, HydrationSignature> }
  // in:  all models
  // out: interned signature pools — kinds with identical shapes share objects

identifyFieldLists(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> list of (kind, fieldName) pairs that share identical kind sets

identifyChildLists(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: kind set hash -> list of kind names with identical child kind sets

identifyEnumPatterns(models: NodeModel[]): Map<string, string[]>
  // in:  all models
  // out: value set hash -> list of enum kind names sharing same values

// Kind projection (derived on-demand, not stored)

projectKinds(kinds: NodeModel[], supertypeExpansions: Map<string, Set<string>>): KindProjection
  // in:  resolved kind references, supertype expansion map
  // out: leaf/branch partition, expanded, collapsed

collapseKinds(concreteKinds: string[], supertypeExpansions: Map<string, Set<string>>): string[]
  // in:  set of concrete kind names, supertype map
  // out: PascalCase names after supertype folding with subset pruning
```

---

## `semantic-aliases.ts` — Semantic Token Aliases

Domain: infer meaningful names for anonymous tokens from usage context.

```typescript
// Methods

inferTokenAliases(models: NodeModel[], grammar: Grammar): Map<string, TokenAlias[]>
  // in:  all models, raw grammar (for rule walking)
  // out: token text -> list of semantic aliases (one per distinct usage context)

// Types
interface TokenAlias {
  text: string;            // original token text, e.g. "&&"
  alias: string;           // inferred kind name, e.g. "LogicalAndOperator"
  parentKind: string;      // where it appears, e.g. "binary_expression"
  fieldName: string;       // which field, e.g. "operator"
}

applyTokenAliases(models: NodeModel[], aliases: Map<string, TokenAlias[]>): NodeModel[]
  // in:  models with raw token kinds in field.kinds, alias map
  // out: models with token kind strings replaced by semantic alias names
  //      TokenModel nodes duplicated per-alias (one model per semantic usage)
```

---

## `build-model.ts` — Orchestrator

Domain: runs the full pipeline, returns complete model ready for emitters.

```typescript
// Types
interface GrammarModel {
  name: string;
  models: NodeModel[];                      // all models, hydrated
  enrichedGrammar: EnrichedGrammar;         // retained for emitters that need it
  signatures: {
    factory: Map<string, FactorySignature>;
    from: Map<string, FromSignature>;
    hydration: Map<string, HydrationSignature>;
  };
}

// Methods

buildModel(grammarName: string): GrammarModel
  // in:  grammar name (e.g. "rust")
  // out: fully built, hydrated, optimized GrammarModel
  //
  // Pipeline:
  //   1. grammar     = loadGrammar(grammarName)
  //   2. nodeTypes   = loadNodeTypes(grammarName)
  //   3. enriched    = enrichGrammar(grammar, nodeTypes)
  //   4. models      = initializeModels(enriched, nodeTypes)          -- Step 1
  //   5. models      = models.map(refineModelType)                    -- Step 2
  //   6. models      = applyNonGrammarHeuristics(models, enriched, nodeTypes)  -- Step 3
  //   7. models      = applyAllMembersAndRules(models, enriched)      -- Step 4
  //   8. models      = applyAllGrammarHeuristics(models, enriched, nodeTypes)  -- Step 5
  //   9. models      = models.map(refineModelType)                    -- Step 6
  //  10. aliases     = inferTokenAliases(models, grammar)             -- semantic aliases
  //  11. models      = applyTokenAliases(models, aliases)
  //  12. models      = optimize(models, enriched)                     -- Step 7
  //  13. models      = hydrate(models)                                -- Step 8
  //  14. return { name, models, enrichedGrammar, signatures }         -- Step 9: ready for emit
```
