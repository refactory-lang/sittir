# Bindings 2b census

The wiring plan's stage 2 census (`docs/superpowers/plans/2026-10-10-grammar-bindings-wiring.md`, "Census first"), taken on the authoring-DSL head b09499cf9. The DSL spec (§9) makes the rewrite's two layers 2b's activation, so part 1 is what lands with that merge and part 2 is what 2b still adds.

**How it was measured.** Each grammar was generated twice with the same tree-sitter CLI: once from `grammar.sittir.ts` alone (unbound) and once from `grammar.bindings.ts` on top of it (bound). The bound build's table counts equal the committed parser's. Entries and refusals come from the derivation itself (`bindingsModule`, which `bindings-inventory --write` writes from), run without writing.

## 1. What takes effect with the DSL merge

### Entries by type

| entry | rust | typescript | python | applied |
| --- | --- | --- | --- | --- |
| field rename (an existing parser field takes the vocabulary name) | 20 | 25 | 20 | yes |
| field wrap (an unfielded member gets a field) | 16 | 10 | 5 | yes |
| alias | 0 | 0 | 2 | yes |
| receiver lead | 1 | 1 | 0 | yes |
| kind rename | 109 | 111 | 91 | no: low-level kind names stay upstream's, and the portable layer maps them |
| split | 3 | 0 | 0 | no: off until 2c with 2e |

At the head, the derivation refuses 280 / 221 / 120 rows (rust / typescript / python). Most are refinements and nested routes that later stages own. Part 2 picks out the ones 2b owns.

### Parser deltas, bound against unbound

| | rust | typescript | python |
| --- | --- | --- | --- |
| STATE_COUNT | 3534 → 3552 (+0.51%) | 7682 → 7728 (+0.60%) | 2316 (=) |
| LARGE_STATE_COUNT | 1040 → 1045 | 1270 → 1286 | 328 (=) |
| SYMBOL_COUNT | 465 → 469 | 488 → 493 | 334 (=) |
| FIELD_COUNT | 81 → 92 | 80 → 83 | 67 → 68 |
| PRODUCTION_ID_COUNT | 418 → 430 | 1662 → 1680 | 173 → 175 |
| node kinds | +4 (receiver forms) | +3 (receiver forms) | +1 −2 (the lambda alias) |
| kinds whose fields change | 33 (18 renamed, 15 newly fielded) | 34 (25 renamed, 9 newly fielded) | 20 (15 renamed, 5 newly fielded) |

Python has no lead, and its renames, wraps and aliases add no states. So the rust and typescript state growth is the receiver lead's.

### What a user sees

- **Slot renames:** python 18 kinds, rust 21, typescript 19. Every parser field rename renames the node's accessor, its `$with` setter and its factory config key. The full list is under "Slot renames" at the end. A newly fielded member changes the API only where its slot had another name: rust 3 kinds, python 3, typescript 0.
- **New kinds:** the receiver forms. Rust: `attributed_parameter_receiver`, `parameters_elements_receiver`, `parameters_elements_receiver_group`, `receiver_parameter_declaration`. Typescript: `formal_parameters_elements_receiver`, `formal_parameters_elements_receiver_group`, `receiver_parameter_declaration`.
- **Python's lambda alias:** kinds 213 (`lambda`) and 214 (`lambda_within_for_in_clause`) keep their grammar names, and the parser shows both as `lambda_expression`.

### Validation rows and files

- **Rows:** +0 −0 in every grammar against master, in the merge gate.
  - typescript conflict-resolution 67 → 74 is the one moved count. +4 is the receiver lead: the receiver form spells four of upstream's conflicts over its forms. +3 is typescript's accessor arity, which is authored in layer 1 and is not a binding.
- **Files moved against master:**
  - rust: 31 generated files and 19 hand-written tests;
  - typescript: 32 and 12, including the accessor arity's;
  - python: 27 and 6.
  - The DSL plan's merge records explain each test edit.

## 2. What 2b still adds

### 2.1 The match arm's `match`

- **The ruling:** the arm's own field is renamed to `match` through the bindings (vocabulary member `pattern` → `match` on `Clause.Match.Arm` and `Arm.Last`). The inner `match_pattern`'s field stays `pattern`.
- **The parked branch** (`feat/arm-match-field` @ 546c54e9f) has the vocabulary rename and the captures: `(match_arm pattern: _ @match)` and `(last_match_arm pattern: _ @match)`.
- **What derives:** `last_match_arm` derives `{ "1": field("match") }`. `match_arm` derives nothing, which is gap (a) below.
- **Expected effect:**
  - the parser field `pattern` → `match` on `last_match_arm`, `match_arm_with_comma` and `match_arm_block_ending`;
  - the accessor `pattern` → `match` on the same three kinds;
  - validation rows +0 −0, as no field rename in part 1 moved one.
  - All of this is to be measured on the change.

### 2.2 Gap (a): a claim on a supertype owner

**The cause.** A variant parent is a parser supertype over its forms (rust `match_arm` over `match_arm_with_comma` and `match_arm_block_ending`). A query such as `(match_arm pattern: _ @match)` matches each form's field. The derivation looks for the field's hosts in the owner's transparent reach, which stops at supertypes (`bind.ts::fieldHosts`), so it finds none and refuses: "field is not on the owner".

**The change.** A claim on a supertype owner routes its field rename to each subtype that holds the field. The bindings spec states the rule (§9, "A claim on a supertype owner reaches its forms"), including forms that hold the member under different field names.

**The rows it applies to today**, all refused as "field is not on the owner":

| grammar | row | forms and their field | would become |
| --- | --- | --- | --- |
| rust | `match_arm.match` (with 2.1) | `match_arm_with_comma`, `match_arm_block_ending`: `pattern` | `match` |
| rust | `reference_expression.argument` | the `_bare`, `_mut`, `_raw_const` and `_raw_mut` forms: `value` | `argument` |
| rust | `field_pattern.byReference` | `field_pattern_shorthand`, `field_pattern_named`: `ref` | `by_reference` |
| python | `with_clause.items` | `with_clause_bare`: `item`; `with_clause_paren`: `with_items` | `items` on both |

Each moves its forms' accessors to the vocabulary name. The expected validation rows are +0 −0.

### 2.3 Neighbouring rows that stay out of 2b

- **"The child is an arm of the owner, not a slot."** The claimed child is a whole arm of the owner's choice, so no field can hold it. Rows: rust `delim_token_tree.tokens` and `token_tree_pattern.tokens`; typescript `parenthesized_expression.expression`; python `expression_statement.expression` (an implicit route).
- **"Not a base rule".** Claims on a display name with no rule of its own: rust 10, typescript 7, python 4 (for example `type_identifier → identifier.type`). They read through the alias, as today.
- **The 3 rust splits.** They stay off until 2c with 2e.

## Rulings

1. Part 1 is accepted as the record of what 2b's activation changed: its slot renames, the receiver forms and python's `lambda_expression` display name.
2. Python `with_clause.items`: both forms hold a `with_item` list, so both fields become `items`. A form that holds the member in another shape (one item where another holds a list) still refuses.
3. 2.1 and 2.2 land as one change from master after the DSL merge, folding in the parked `feat/arm-match-field` branch, whose vocabulary and `bindings.scm` changes are 2.1's inputs.

## Slot renames

Accessor and storage key move together in every row (`querySlots`: accessor, index, keyword, `_<storage>`), so each change below renames a node's accessor, its `$with` setter and its factory config key. Compared by kind name between master and the head.

**Python:** 18 kinds renamed.

- `assignment_eq`: `left` → `name`, `right` → `value`
- `assignment_type`: `left` → `name`
- `assignment_typed`: `left` → `name`, `right` → `value`
- `attribute`: `attribute` → `property`
- `class_definition`: `superclasses` → `bases`
- `conditional_expression`: `body` → `consequence`
- `default_parameter`: `value` → `default`
- `dictionary_splat_pattern`: `target` → `pattern`
- `finally_clause`: `block` → `body`
- `list`: `collectionElements` → `elements`
- `list_pattern`: `patterns` → `elements`
- `list_splat_pattern`: `target` → `pattern`
- `named_expression`: `name` → `left`, `value` → `right`
- `set`: `collectionElements` → `elements`
- `splat_type`: `name` → `type`
- `subscript`: `value` → `object`
- `try_statement`: `exceptClauses` → `handlers`, `elseClause` → `alternative`, `finallyClause` → `finalizer`
- `typed_default_parameter`: `value` → `default`

**Rust:** 21 kinds renamed, 4 added.

- `attribute_item`: `attribute` → `content`
- `const_parameter`: `value` → `default`
- `field_expression`: `value` → `object`, `field` → `property`
- `field_initializer`: `attributeItems` → `attributes`
- `for_expression`: `pattern` → `left`, `value` → `right`
- `inner_attribute_item`: `attribute` → `content`
- `let_declaration`: `pattern` → `name`
- `macro_invocation`: `macro` → `function`
- `match_expression`: `value` → `subject`
- `reference_pattern`: `mutable` → `exclusive`
- `reference_type`: `mutable` → `exclusive`
- `shorthand_field_initializer`: `name` → `field`
- `slice_pattern`: `patterns` → `elements`
- `static_item`: `ref` → `byReference`
- `try_expression`: `value` → `argument`
- `tuple_expression`: `expressions` → `elements`
- `type_cast_expression`: `value` → `expression`
- `type_item`: `type` → `value`
- `type_parameter`: `defaultType` → `default`
- `unary_expression`: `operand` → `argument`
- `use_as_clause`: `path` → `name`
- Added: `attributed_parameter_receiver`, `parameters_elements_receiver`, `parameters_elements_receiver_group`, `receiver_parameter_declaration`.

**TypeScript:** 19 kinds renamed, 18 added, 4 removed.

- `as_expression`: `typeAnnotation` → `type`
- `assignment_expression`: `using` → `disposable`
- `constraint`: `type` → `bounds`
- `decorator`: `expression` → `content`
- `export_specifier`: `exportKind` → `typeOnly`
- `export_statement_default_from`: `type` → `typeOnly`
- `export_statement_equals_export`: `expression` → `value`
- `for_in_statement`: `await` → `async`
- `import_specifier_as`: `importKind` → `typeOnly`
- `import_specifier_name`: `importKind` → `typeOnly`
- `import_statement`: `importClause` → `typeOnly`. Master's field named `import_clause` sits on the optional `type`/`typeof` keyword, so the new name matches what the slot holds.
- `literal_type_negative_number`: `argument` → `value`
- `member_expression`: `separator` → `optionalChain`
- `new_expression`: `constructor_` → `function`
- `optional_parameter`: `pattern` → `name`
- `required_parameter`: `pattern` → `name`
- `satisfies_expression`: `typeAnnotation` → `type`
- `try_statement`: `handler` → `handlers`
- `type_parameter`: `value` → `default`
- Added: `_formal_parameters_set_accessor_signature`, `_formal_parameters_elements_set_accessor_signature`, `_get_accessor_signature`, `abstract_method_signature_getter`, `abstract_method_signature_plain`, `abstract_method_signature_setter`, `formal_parameters_elements_receiver`, `formal_parameters_elements_receiver_group`, `method_definition_getter`, `method_definition_plain`, `method_definition_setter`, `method_signature_getter`, `method_signature_plain`, `method_signature_setter`, `public_field_definition_accessor`, `public_field_definition_plain`, `receiver_parameter_declaration`, `setter_parameter`.
- Removed: `abstract_method_signature`, `method_definition`, `method_signature`, `public_field_definition`. Each is now the parent of its forms, and its slots moved to the forms above.
