# Heuristics Catalog

Every inference, derivation, and cross-reference in the grammar model pipeline. Organized by pipeline step.

---

## Layer 2: EnrichedGrammar Heuristics

### H1: classifyKinds
**File:** grammar-reader.ts (listBranchKinds, listLeafKinds)
**Input:** node-types.json entries
**Logic:**
- Has `fields` with >0 keys OR has `children` -> branch kind
- No fields AND no children AND not supertype AND named -> leaf kind
- Has `subtypes` -> supertype (separate category)
- Not named -> anonymous token
**Authority:** node-types.json is authoritative for what exists in the AST

### H2: detectKeywords
**File:** grammar-reader.ts (listKeywordKinds, extractConstantText)
**Input:** Grammar rules for leaf kinds
**Logic:**
- For each leaf kind, read its grammar rule
- Unwrap PREC, TOKEN, IMMEDIATE_TOKEN wrappers
- If result is a single STRING -> keyword with that text
- If result is SEQ of all STRINGs -> keyword with concatenated text
- Otherwise -> not a keyword
**Examples:** `self` -> "self", `mutable_specifier` -> "mut"

### H3: expandSupertypes
**File:** grammar-model.ts (supertypesToExpanded)
**Input:** grammar.json supertypes list + rules
**Logic:**
- Each supertype's rule is a CHOICE of SYMBOLs
- Recursively expand: if a subtypes is itself _-prefixed, expand it too
- Cycle detection via visited set
- Result: Map<supertype -> Set<all concrete descendants>>
**Example:** `_expression` -> { binary_expression, call_expression, identifier, ... }

### H4: classifyTokens
**File:** grammar-reader.ts (listKeywordTokens, listOperatorTokens)
**Input:** node-types.json unnamed entries
**Logic:**
- Unnamed entries are anonymous tokens
- If `/^[a-z_]+$/i` -> keyword token (e.g., "fn", "let", "if")
- If non-alphabetic and not pure quotes -> operator token (e.g., "+", "->", "::")
**Note:** This is a naming heuristic, not a grammar semantic

### H5: enrichRule (metadata annotation)
**File:** grammar-model.ts (ruleToEnriched)
**Input:** Raw GrammarRule + node-types.json field info + kind sets
**Logic:**
- Walk rule tree, produce identical tree with annotations
- FIELD nodes: add `required` and `multiple` from node-types.json
  - Default: required=true, multiple=false if not in node-types.json
- SYMBOL nodes: add three boolean flags
  - `leaf`: kind is in leafKinds set
  - `keyword`: kind is in keywordKinds set
  - `supertype`: kind is in supertypeNames OR name starts with `_`
**Invariant:** Same tree shape. Purely additive. No structural change.

### H6: detectEnumValues
**File:** grammar-reader.ts (listLeafValues)
**Input:** Grammar rule for a leaf kind
**Logic:**
- **Direct pattern:** Rule is CHOICE of STRINGs -> values are those strings
  - Example: TypeScript `predefined_type` = CHOICE("any", "number", "boolean", ...)
- **ALIAS fallback:** If no direct rule, search ALL grammar rules for ALIAS nodes producing this kind
  - Example: Rust `primitive_type` only defined via ALIAS in other rules
  - Collect all aliased STRING values
- Result: sorted array of values, or empty (not enum-like)
**Distinction:** Non-empty values -> EnumModel. Empty values -> LeafModel.

### H7: extractLeafPattern
**File:** grammar-reader.ts (extractLeafPattern, extractPattern)
**Input:** Grammar rule for a leaf kind
**Logic:** Recursively build regex from rule tree:
- PATTERN -> use as-is
- STRING -> escape regex special chars
- SEQ -> concatenate
- CHOICE -> union with `|` (wrap in group); optional if BLANK present
- REPEAT -> `(...)*`
- REPEAT1 -> `(...)+`
- TOKEN/IMMEDIATE_TOKEN -> unwrap and recurse
**Example:** `integer_literal` pattern from its grammar rule

---

## Step B: Member Application Heuristics

### M1: Abstract symbol inlining
**File:** grammar-model.ts (enrichedToElements)
**When:** Walking enriched rule, encountering a SYMBOL with `supertype: true` or `_`-prefixed name
**Logic:**
- Don't emit as a member directly
- Instead, recursively walk the abstract symbol's own rule
- Extract its fields and children into the parent's member list
- Cycle prevention via visited set
**Example:** `_call_signature` inlines `type_parameters`, `parameters`, `return_type` into parent

### M2: CHOICE with same fields (branch merging)
**File:** grammar-model.ts (choiceToMergedFields)
**When:** CHOICE where all branches contain the same field names
**Logic:**
- Collect FieldModels from every branch
- Union their type sets (leafTypes, branchTypes, anonTokens, expandedAll, etc.)
- Emit single merged set of field members with combined types
- If CHOICE had BLANK branch, mark all fields as optional
**Example:** `binary_expression` with PREC_LEFT branches for each operator precedence level. All branches have left/operator/right. Operators union into anonTokens.

### M3: CHOICE with different fields (preserve as choice member)
**File:** grammar-model.ts (enrichedToElements)
**When:** CHOICE where branches have different field names
**Logic:**
- Emit as `{ member: 'choice', branches: [...] }`
- Each branch is independently projected to NodeMember[]
- Rare case. Preserves structural information.
**Example:** `visibility_modifier` with branches `"pub"` vs `"pub" "(" path ")"` (different field structures)

### M4: REPEAT/REPEAT1 multiplicity
**File:** grammar-model.ts (enrichedToElements)
**Logic:**
- Content of REPEAT/REPEAT1 marked as `multiple: true`
- REPEAT (0+) also makes content optional
- REPEAT1 (1+) keeps required status

### M5: CHOICE+BLANK optionality
**File:** grammar-model.ts (enrichedToElements, hasBlankChoice)
**Logic:**
- CHOICE containing a BLANK branch makes all other branches optional
- Fields inside become `required: false`
- Tokens inside become `optional: true`
- This is how tree-sitter represents optional constructs

### M6: Named ALIAS handling
**File:** grammar-model.ts (enrichedToElements)
**Logic:**
- ALIAS with `named: true` -> emit as child member (it's an explicit typed child)
- ALIAS with `named: false` -> unwrap and recurse into content
**Example:** `shorthand_field_initializer` has named alias for `identifier`

### M7: Separator detection
**File:** grammar-model.ts (ruleToSeparators)
**When:** Walking rule for FIELD followed by REPEAT(SEQ(STRING, ...))
**Logic:**
- Look for pattern: REPEAT( SEQ( STRING(sep), content ) )
- Where STRING is a single-char separator matching `/^[,;|&]$/`
- The preceding FIELD gets `separator: sep`
**Example:** `parameters` has REPEAT("," parameter) -> separator is ","

### M8: Field supplementation from node-types.json
**File:** grammar-model.ts (enrichedToNodeModel)
**When:** After member application, some fields in node-types.json weren't found in grammar walk
**Logic:**
- Compare fields extracted from grammar vs fields in node-types.json
- Add missing fields with types from node-types.json
- This handles deeply-nested optional CHOICE branches that the walker missed
**Authority:** node-types.json is authoritative for field existence

### M9: Field reordering to node-types.json order
**File:** grammar-model.ts (enrichedToNodeModel)
**When:** After all fields collected
**Logic:**
- node-types.json field key order is authoritative
- Sort fields to match that order
**Rationale:** grammar.json ordering can vary between grammar versions; node-types.json is stable

---

## Step B: Field Type Classification

### T1: Leaf/branch partitioning
**File:** grammar-model.ts (typesToFieldTypeClass)
**Logic:**
- Named types in leafKinds -> leafTypes
- Named types NOT in leafKinds -> branchTypes
- STRING values in FIELD content -> anonTokens

### T2: Supertype expansion
**File:** grammar-model.ts (typesToFieldTypeClass)
**Logic:**
- For each `_`-prefixed type in the field's named types
- Look up in supertypeExpansions map
- Add all concrete descendants to expandedAll (leaf + branch)
- Add only non-leaf descendants to expandedBranch

### T3: Supertype collapsing (for TypeScript type expressions)
**File:** grammar-model.ts (typesToCollapsed)
**Logic:**
- Given a set of concrete types, find supertypes that cover subsets
- If supertype S covers ALL of a subset -> fold to S
- **Subset pruning:** If S1's subtypes strictly subset of S2's, and S2 is present, remove S1
- Remaining uncovered types listed individually
- All names converted to PascalCase
**Example:** {IntLit, FloatLit, StringLit} where all are in `_literal` -> `Literal`

---

## Step C: Optimization Heuristics

### O1: Signature interning
**File:** grammar-model.ts (nodesToSignatures)
**Logic:**
- Compute JSON key from field configuration per kind
- Multiple kinds with identical keys share same signature object
- Three signature types: Factory, From, Hydration

### O2: Field list deduplication (new)
**Logic:**
- Find fields across different kinds that have identical FieldTypeClass
- These can share the same TypeScript type expression in generated code

### O3: Child list deduplication (new)
**Logic:**
- Find children across different kinds with identical type sets
- These can share the same children type/handler

---

## Step D: Semantic Token Aliases (Enhancement)

### S1: Operator context inference
**Logic:**
1. For each anonymous operator token (e.g., `&&`, `+`, `-`)
2. Walk all grammar rules to find FIELD nodes containing this token as a STRING
3. Record each (parentKind, fieldName, token) triple
4. Derive semantic name: parentKind + fieldName -> semantic prefix
   - `binary_expression` + `operator` + `&&` -> `LogicalAndOperator`
   - `binary_expression` + `operator` + `+` -> `AddOperator`
   - `unary_expression` + `operator` + `-` -> `NegateOperator`
5. If same token appears in multiple distinct contexts -> multiple model nodes
   - `-` gets two entries: `SubtractOperator` (binary) and `NegateOperator` (unary)
6. Each alias becomes the token's `kind` in the model

### S2: Punctuation context inference
**Logic:**
- Same as S1 but for non-operator punctuation
- `::` in `scoped_identifier` -> `PathSeparator`
- `->` in `function_type` -> `ReturnArrow`
- `,` -> typically not aliased (too generic)
- Threshold: only alias tokens used in <= N distinct contexts (avoids over-aliasing)
