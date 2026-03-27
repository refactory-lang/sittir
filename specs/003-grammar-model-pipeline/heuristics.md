# Heuristics Catalog

Every inference, derivation, and cross-reference in the grammar model pipeline. Organized by pipeline step.

---

## Step 3: Grammar Introspection (`classifyRules`)

Heuristics applied to grammar.json rules **without** node-types.json. All happen inside `classifyRules(grammar) → Map<string, EnrichedRule>`.

### H1: Rule Classification

**Logic:** For each rule in grammar.rules, determine modelType by structure:
1. Kind in grammar.supertypes → SupertypeRule
2. `hasFields(rule)` (contains FIELD nodes) → BranchRule
3. `hasChildren(rule)` (contains non-FIELD SYMBOLs) → ContainerRule
4. `extractKeywordText` resolves to constant STRING → KeywordRule
5. `extractEnumValues` finds CHOICE of STRINGs → EnumRule
6. Otherwise → LeafRule

Classification and extraction happen together — the extraction result determines the modelType.

### H2: Supertype Extraction (`extractSubtypes`)

**Input:** Rule for a kind listed in grammar.supertypes (CHOICE of SYMBOLs)
**Logic:**
- Walk CHOICE branches, collect SYMBOL names as subtypes
- Recursively expand nested `_`-prefixed supertypes
- Cycle detection via visited set
- Result: `SupertypeRule { subtypes: string[] }`
**Example:** `_expression` → subtypes: [binary_expression, call_expression, identifier, ...]

### H3: Field Extraction (`extractFields`)

**Input:** Rule with FIELD nodes
**Logic:**
- Walk rule tree for FIELD nodes → per-field metadata
- Detect multiplicity from REPEAT/REPEAT1 wrapping
- Detect optionality from CHOICE+BLANK
- Collect kinds from SYMBOLs within each FIELD
- Also detect separators from REPEAT+SEQ(STRING, ...) patterns
- Non-FIELD SYMBOLs become children
- Result: `BranchRule { fields, children?, separators }`

### H4: Child Extraction (`extractChildren`)

**Input:** Rule with non-FIELD SYMBOLs but no FIELDs
**Logic:**
- Walk rule tree for SYMBOL references
- Same multiplicity/optionality detection as fields
- Separator detection from REPEAT+SEQ patterns
- Result: `ContainerRule { children, separators }`

### H5: Keyword Detection (`extractKeywordText`)

**Input:** Grammar rule for a kind
**Logic:**
- Unwrap PREC, TOKEN, IMMEDIATE_TOKEN wrappers
- If result is a single STRING → keyword with that text
- If result is SEQ of all STRINGs → keyword with concatenated text
- Otherwise → null (not a keyword)
**Examples:** `self` → "self", `mutable_specifier` → "mut"

### H6: Enum Value Detection (`extractEnumValues`)

**Input:** Grammar rule (+ grammar for ALIAS fallback)
**Logic:**
- **Direct pattern:** Rule is CHOICE of STRINGs → values are those strings
  - Example: TypeScript `predefined_type` = CHOICE("any", "number", "boolean", ...)
- **ALIAS fallback:** If no direct rule, search ALL grammar rules for ALIAS nodes producing this kind
  - Example: Rust `primitive_type` only defined via ALIAS in other rules
  - Collect all aliased STRING values
- Result: sorted array of values, or empty (not enum-like)
**Distinction:** Non-empty values → EnumRule. Empty values → LeafRule.

### H7: Pattern Extraction (`extractPattern`)

**Input:** Grammar rule for a leaf kind
**Logic:** Recursively build regex from rule tree:
- PATTERN → use as-is
- STRING → escape regex special chars
- SEQ → concatenate
- CHOICE → union with `|` (wrap in group); optional if BLANK present
- REPEAT → `(...)*`
- REPEAT1 → `(...)+`
- TOKEN/IMMEDIATE_TOKEN → unwrap and recurse
**Example:** `integer_literal` pattern from its grammar rule

---

## Step 4: Initialize from NodeTypes (`initializeModels`)

### NT1: Kind Categorization

**Input:** node-types.json entries
**Logic:**
- Has `subtypes` → SupertypeModel
- Not named → TokenModel
- Has `fields` with >0 keys → BranchModel
- Has `children` but no fields → ContainerModel
- Otherwise → LeafModel (refined during reconcile)
**Authority:** node-types.json is authoritative for what kinds exist in the AST

### NT2: Field/Child Initialization

**Input:** node-types.json field/children entries
**Logic:**
- Each field entry → FieldModel with `required`, `multiple`, `kinds` from NT types
- Children entry → ChildModel[] with same attributes
- Anonymous tokens in NT `types` array are just kinds (strings)

---

## Step 5: Reconcile (`reconcile`)

### R1: ModelType Matching

**Input:** NT-initialized model + EnrichedRule
**Logic:**
- Same modelType → enrich with grammar data (merge fields, attach rule)
- Grammar narrows → promote model:
  - leaf → keyword (grammar found constant text)
  - leaf → enum (grammar found CHOICE of STRINGs)
  - branch → container (grammar found no FIELDs)
- Mismatch → throw Error (data inconsistency, needs manual review)

### R2: Field Merging (during enrichBranch)

**Input:** NT-derived fields + grammar-derived fields
**Logic:**
- NT provides: required, multiple, kinds (from types array)
- Grammar provides: additional kinds (from rule walking), separators
- Union kind sets from both sources
- NT is authoritative for required/multiple; grammar supplements

---

## Step 6: Member Application (`applyMembers`)

### M1: Abstract Symbol Inlining

**When:** Walking enriched rule, encountering a SYMBOL with `_`-prefixed name
**Logic:**
- Don't emit as a member directly
- Instead, recursively walk the abstract symbol's own rule
- Extract its fields and children into the parent's member list
- Cycle prevention via visited set
**Example:** `_call_signature` inlines `type_parameters`, `parameters`, `return_type` into parent

### M2: CHOICE with Same Fields (branch merging)

**When:** CHOICE where all branches contain the same field names
**Logic:**
- Collect FieldModels from every branch
- Union their kind sets
- Emit single merged set of field members with combined kinds
- If CHOICE had BLANK branch, mark all fields as optional
**Example:** `binary_expression` with PREC_LEFT branches for each operator precedence level. All branches have left/operator/right. Operators union into the operator field's kinds.

### M3: CHOICE with Different Fields (preserve as choice member)

**When:** CHOICE where branches have different field names
**Logic:**
- Emit as `{ member: 'choice', branches: [...] }`
- Each branch is independently projected to NodeMember[]
- Rare case. Preserves structural information.
**Example:** `visibility_modifier` with branches `"pub"` vs `"pub" "(" path ")"` (different field structures)

### M4: REPEAT/REPEAT1 Multiplicity

**Logic:**
- Content of REPEAT/REPEAT1 produces ListFieldModel/ListChildModel (`multiple: true`)
- REPEAT (0+) also makes content optional
- REPEAT1 (1+) keeps required status

### M5: CHOICE+BLANK Optionality

**Logic:**
- CHOICE containing a BLANK branch makes all other branches optional
- Fields inside become `required: false`
- Tokens inside become `optional: true`
- This is how tree-sitter represents optional constructs

### M6: Named ALIAS Handling

**Logic:**
- ALIAS with `named: true` → emit as child member (it's an explicit typed child)
- ALIAS with `named: false` → unwrap and recurse into content
**Example:** `shorthand_field_initializer` has named alias for `identifier`

---

## Step 7: Refine Model Type (`refineModelType`)

### RF1: Reclassification

**Input:** A NodeModel after members applied and all grammar data merged
**Logic:**
- BranchModel with no fields and only children → ContainerModel
- Other cases as discovered during implementation
**When:** After all enrichment, some models may need type correction

---

## Steps 8–9: Semantic Token Aliases

### S1: Operator Context Inference (`inferTokenAliases`)

**Logic:**
1. For each anonymous operator token (e.g., `&&`, `+`, `-`)
2. Walk all grammar rules to find FIELD nodes containing this token as a STRING
3. Record each (parentKind, fieldName, token) triple
4. Derive semantic name: parentKind + fieldName → semantic prefix
   - `binary_expression` + `operator` + `&&` → `LogicalAndOperator`
   - `binary_expression` + `operator` + `+` → `AddOperator`
   - `unary_expression` + `operator` + `-` → `NegateOperator`
5. If same token appears in multiple distinct contexts → multiple model nodes
   - `-` gets two entries: `SubtractOperator` (binary) and `NegateOperator` (unary)
6. Each alias becomes the token's `kind` in the model

### S2: Punctuation Context Inference

**Logic:**
- Same as S1 but for non-operator punctuation
- `::` in `scoped_identifier` → `PathSeparator`
- `->` in `function_type` → `ReturnArrow`
- `,` → typically not aliased (too generic)
- Threshold: only alias tokens used in ≤ N distinct contexts (avoids over-aliasing)

---

## Step 10: Naming (`applyNaming`)

### N1: Model Naming

**Input:** NodeModel
**Logic:**
- `typeName`: PascalCase of kind (`function_item` → `FunctionItem`, `_expression` → `Expression`)
- `factoryName`: camelCase of kind (`function_item` → `functionItem`, `_expression` → `expression`)

### N2: Field Naming

**Input:** FieldModel
**Logic:**
- `propertyName`: camelCase of field name (`return_type` → `returnType`)

### Emitter Derivations

Emitters derive suffixed names from `typeName`:
- `configType`: typeName + "Config" (`FunctionItemConfig`)
- `treeType`: typeName + "Tree" (`FunctionItemTree`)

---

## Step 11: Optimization (`optimize`)

### O1: Signature Interning (`computeSignatures`)

**Logic:**
- Compute JSON key from field configuration per kind
- Multiple kinds with identical keys share same signature object
- Three signature types: Factory, From, Hydration

### O2: Field List Deduplication (`identifyFieldLists`)

**Logic:**
- Find fields across different kinds that have identical kind sets
- These can share the same TypeScript type expression in generated code

### O3: Child List Deduplication (`identifyChildLists`)

**Logic:**
- Find children across different kinds with identical kind sets
- These can share the same children type/handler

### O4: Enum Pattern Detection (`identifyEnumPatterns`)

**Logic:**
- Find EnumModel kinds that share the same value set
- These can share type definitions

---

## Kind Projections (derived, not stored)

Emitters that need to partition a field's kinds for code generation use projection helpers computed from hydrated `NodeModel[]` references:

| Projection | What | Used by |
|-----------|------|---------|
| `leafKinds` | Kinds that are leaves (read `.text()`) | assign.ts, from.ts |
| `branchKinds` | Kinds that are branches (recurse into) | assign.ts, from.ts |
| `expandedAll` | All concrete kinds after supertype expansion | assign.ts dispatch tables |
| `expandedBranch` | Only branch kinds after supertype expansion | from.ts resolution |
| `collapsedKinds` | PascalCase names after supertype folding | types.ts, factories.ts type expressions |

### Supertype Expansion
- For each supertype kind in a field's `kinds`, look up subtypes
- Add all concrete descendants
- `expandedAll` = leaf + branch concrete kinds
- `expandedBranch` = only branch concrete kinds

### Supertype Collapsing (for TypeScript type expressions)
- Given a set of concrete kinds, find supertypes that cover subsets
- If supertype S covers ALL of a subset → fold to S
- **Subset pruning:** If S1's subtypes strictly subset of S2's, and S2 is present, remove S1
- Remaining uncovered kinds listed individually
- All names converted to PascalCase
**Example:** {IntLit, FloatLit, StringLit} where all are in `_literal` → `Literal`
