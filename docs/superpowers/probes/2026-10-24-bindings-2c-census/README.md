# Bindings 2c+2e census (with 2d and 2f)

The census for the wiring plan's contextual aliases, literal splits and clones-as-forms (`docs/superpowers/plans/2026-10-10-grammar-bindings-wiring.md`, "2c. Contextual aliases", "2e. Clones are forms"), with 2d's name heuristics and 2f's docstring path. It is taken on master 152107f18. The prototype is `prototype.patch`, on the probe branch `probe/2c-census`: hand-written path edits in each grammar's `grammar.bindings.ts`, plus two probe-only workarounds in `dsl/verbs/effects.ts` (section 3).

2c changes public kinds and builders, so its questions are the user's (end of page).

## 1. What the derivation gives today

The grammar bindings already compute splits from placed claims, but never print them: `printBindingsModule` drops `splits`, as the authoring-DSL spec's "splits stay off until the contextual-alias stage" says. Today:

| grammar | splits computed | what they are |
| --- | --- | --- |
| rust | 3 | `function_signature_item` in a trait → `signature_method_declaration`; `function_item` in a trait and in an impl body → `method_declaration`. Containers: `trait_interface_declaration_body`, `extension_declaration_body` |
| python | 0 | its placed claims (`class_definition body: (suite_block (block (function_definition)))`) sit under `suite_block` and `block`, enrich's names, which the derivation does not place |
| typescript | 0 | |

The impl-body split is back, once, as ruled. "One split per site" (2e) already holds: the receiver lead (2b) left one receiver claim.

## 2. Contextual aliases, measured

The DSL spells an alias split as a path edit: `trait_item: { 'body:/(declaration_list as trait_interface_declaration_body)/(function_item)': alias('method_declaration') }` copies the containers on the way and aliases the kind at its site. Deltas are against master:

| | rust | python |
| --- | --- | --- |
| sites | the three above | a method in a class body, and a decorated method there |
| `STATE_COUNT` | 3552 → 3575 (+23, +0.65%) | 2316 → 2334 (+18, +0.78%) |
| `LARGE_STATE_COUNT` | +14 | +5 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | +4 / +2 | +5 / +1 |
| `PRODUCTION_ID_COUNT` | +10 | +4 |
| `parser.c` bytes | +82,511 (+1.16%) | +56,205 (+1.75%) |
| named kinds added | `method_declaration`, `signature_method_declaration`, `trait_interface_declaration_body`, `extension_declaration_body` | `method_declaration`, `decorated_definition_class_declaration`, `_statement_class_definition` |

Both are within the contextual-alias probe's numbers (`../2026-10-10-contextual-alias/`): rust +23 states there too, python +17 with the decorated method. Python's path is `body:/(suite_block)/(block)/(function_definition)`, and the decorated one continues `(decorated_definition as decorated_definition_class_declaration)/definition:/(function_definition)`.

Rust's `crate` in `visibility_modifier` (`internal_public_visibility_modifier`) was not prototyped. The derivation gives rust no aliases today.

## 3. What the first printed split runs into

Each of these stops the regeneration. They are 2c's work beside the plan's list. The copy-path tests (`dsl/__tests__/copy-paths.test.ts`) evaluate the grammar but never compile it, so none of the first three is pinned today.

1. **A container copy's inherited option labels name its hidden rule.** `_declaration_list_trait_item/"{"/after` names no site: the copy is shown as `trait_interface_declaration_body`, and the model addresses it by that name. The probe keys the projected labels by the shown name.
2. **An alias renames its kind in option paths everywhere.** `source_file/statements:/(method_declaration)/after` names no site: `rewriteInherited` applies every alias effect to every option path, but a contextual alias renames the kind only at its sites. The probe skips the rename for an alias whose source the grammar still references bare.
3. **A copy shown under its source's name makes the source's addresses ambiguous.** Python's `block/statements/class_definition/after` names 2 sites in `options.rs`: `block` and `_block_class_definition`, which is shown as `block`.
4. **An alias kind has no model node of its own.** The read test for `declaration.method` on rust's `method_declaration` finds no `parameters` slot. This is the plan's "each alias kind gets its own builder" item.

## 4. Literal splits

**Typescript's `constructor`, measured.** The C5 form: `class_body_member_method: { '(method_definition)/(method_definition_plain)': ($, member) => choice(member, alias(replace(copy('method_definition_plain'), 'name:', alias('constructor', $.property_identifier)), $.constructor_declaration)) }`. The edit sits on `class_body_member_method`, which occurs only in class bodies: `class_body`'s members reach it through the inlined `_class_body_member`, which a path does not enter.

| | typescript |
| --- | --- |
| `STATE_COUNT` | 7728 → 8113 (+385, +4.98%) |
| `LARGE_STATE_COUNT` / `SYMBOL_COUNT` / `ALIAS_COUNT` / `PRODUCTION_ID_COUNT` | +1 / +3 / −1 / +1 |
| `parser.c` bytes | +346,574 (+2.85%) |
| where `constructor` lexes as a keyword | 13 large states and 433 entries of the small parse table (none before) |
| named kinds added | `constructor_declaration`, `_method_definition_class_body_member_method` |

The emit completes: `build.constructorDeclaration`, its types, wrap, record and native node, and typescript's kind ids from 173 up shift by the new symbols. The cost is the keyword promotion: every state that can start a class member's name now tells `constructor` apart from an identifier.

**What the rule covers.** "A kind claim whose predicate is `#eq?` or `#any-of?` on a keyword leaf" covers more than the plan's five (typescript's `constructor` and `never`, python's `__init__`, rust's `true` and `false`):

| kind | claimed literals | members of the kind | left after every claimed literal splits |
| --- | --- | --- | --- |
| rust `primitive_type` | 17 (`i8` … `usize`, `f32`, `f64`, `bool`, `char`, `str`) | 17 | none |
| rust `boolean_literal` | 2 (`true`, `false`) | 2 | none |
| typescript `predefined_type` | 9 (`any`, `number`, `boolean`, `string`, `symbol`, `void`, `unknown`, `never`, `object`) | 10 | `unique symbol` |

Each split literal becomes a public kind with its own builder. The plan does not say what becomes of a kind whose every literal splits out. Python's `__init__` and the leaf splits were not prototyped: how a leaf kind keeps its remaining literals is the open question above.

## 5. `static` and claim-level flags

Not measured. Both `static` facts still come from context today: rust's from the placed claim with a per-parameter `#not-kind-eq?` (`bindings.scm` line 38), python's from the decorated definition's decorator (line 17). They move onto the alias kinds once the aliases exist, as the plan writes them.

## 6. Clones as forms (2e)

- `splitFrom` reaches the model today (`node-model.ts` serializes it), and `slotModelOf` drops it, as the plan says.
- **`variantOf` survives in the grammar.** In the rust prototype, `_declaration_statement_trait_item`'s members keep their `variantOf: _declaration_statement` annotations.
- **A copy of a declared supertype is a new supertype.** Entering a supertype on the way to a site adds a copy to `supertypes`: python's `_statement_class_definition` and typescript's `_method_definition_class_body_member_method` appear in node-types. Rust's `_declaration_statement` is not a declared supertype, so its copies stay plain hidden rules.

## 7. Name heuristics (2d)

Every lookup each heuristic serves, counted by instrumenting `routes.ts` on clean master over the bound and the unbound layer (`census-2d.mts`, run from `packages/tools/src` with `census-2d-instrumentation.patch` applied); the two layers agree:

| heuristic | python | rust | typescript |
| --- | --- | --- | --- |
| `modelNode`'s `_${kind}` fallback | `simple_statements` → `_simple_statements` | `let_chain` → `_let_chain` | none |
| `memberNameOf`'s `Modifier$` strip | none | `extern_modifier` (`externModifier` → `extern`) | none |

## 8. The docstring path (2f)

The unbuildable-routes ceiling still lists python's `class_definition.doc` and `function_definition.doc`, the two 2f removes, beside rust's `impl_item_body.implements`, which is not this stage's. The `doc` path goes through `_simple_statements`, the first fallback above.

## 9. What 2c adds to the public surface

For engine-api's planning: each kind below gets a builder, types, a wrap and a native node. Each grammar's kind ids above the first new symbol renumber.

| grammar | kinds with builders | hidden copies (no builders) |
| --- | --- | --- |
| rust | `methodDeclaration`, `signatureMethodDeclaration`, `traitInterfaceDeclarationBody`, `extensionDeclarationBody` (with list setters for the two bodies' `declarations`); `internalPublicVisibilityModifier` if the `crate` alias lands; `trueBooleanLiteral`, `falseBooleanLiteral` (and 17 primitive types, per question 1) | `_declaration_list_trait_item`, `_declaration_list_impl_item_body`, `_declaration_statement_trait_item`, `_declaration_statement_impl_item_body` |
| python | `methodDeclaration`, `decoratedDefinitionClassDeclaration`, `constructorDeclaration` (`__init__`) | `_suite_class_definition`, `_suite_block_class_definition`, `_block_class_definition`, `_statement_class_definition` (a supertype), `_compound_statement_class_definition`, and `_decorated_definition_class_definition` (shown as `decorated_definition_class_declaration`) |
| typescript | `constructorDeclaration`; `neverPrimitiveType` (and 8 more predefined types, per question 1) | `_method_definition_class_body_member_method` (a supertype), and `_method_definition_plain_class_body_member_method` (shown as `constructor_declaration`) |

## 10. Overlap with engine-api's branch

`feat/record-render-bridge` (at 04be766fa) changes most of the emitters 2c's builders touch: `factories.ts` (291 lines), `wrap.ts` (184), `render-module.ts` (830), `native-crate.ts` (42), `node-members.ts` (80) and `node-model.ts` (2). 2c's DSL and derivation side (`grammar-bindings.ts`, `module.ts`, `verbs/effects.ts`, `bind.ts`) is not on that branch. The bridge's `bindings/input.ts` hunks (the node model's slot accessor) do not meet the 4a change there.

## Questions

1. **Literal-split coverage.** The rule covers 25 claims beyond the plan's five: rust's 17 primitive types and 8 more typescript predefined types. Should every fixed-text kind claim on a keyword leaf split, which empties rust's `primitive_type` and `boolean_literal`? Or should splits cover only the plan's five, with the rest staying read tests?
2. **Typescript's `constructor`.** Splitting it adds 385 states (+4.98%) and 347 KB of `parser.c`, so that an object literal's `constructor` method reads as a method. Accept the cost? Or keep it a read test that gains the class-body context?
3. **Supertype copies.** Reaching python's class-body method and typescript's class-body method copies a declared supertype, which adds a new supertype to node-types (`_statement_class_definition`, `_method_definition_class_body_member_method`). Accept these as hidden copies with no builders?

## Rulings

The user's, on 2026-10-24:

1. **Splits cover the plan's five only:** typescript's `constructor` and `never`, python's `__init__`, rust's `true` and `false`. Rust's primitive types and typescript's other predefined types stay read tests on their kinds. `boolean_literal` still empties, since both its literals are among the five.
2. **Typescript's `constructor` splits, as the plan rules,** at the measured cost: +385 states and +347 KB of `parser.c`. Its claim gains the class body as context, and the builder contexts' `Visibility` stopgap at every method's parameters goes away with it.
3. **Supertype copies are hidden copies with no builders.** `_statement_class_definition` and `_method_definition_class_body_member_method` appear only in node-types' supertype list.
