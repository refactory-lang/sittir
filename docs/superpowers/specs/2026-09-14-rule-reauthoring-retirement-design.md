# Rule re-authoring retirement

The `rules:` block of a grammar file is a copy of upstream rule bodies with edits. It is the one place where a grammar bump silently diverges: the copy keeps parsing the old shape while the base grammar moves under it. This design retires the block. Every fact it carried becomes a declaration on the existing patch surface or a generic the enrich pass applies to every grammar, and at the end `rules` is not a key the authored wire config accepts.

## 1. End state

- `packages/{python,typescript,rust}/grammar.sittir.ts` contain no `rules:` block. The key is removed from the authored `WireConfig` type, so the next rewrite is a type error.
- Every fact the block carried is a `patches:` entry (a placeholder at a path into the base rule) or a generic in `dsl/enrich.ts` that needs no authored fact.
- The generated grammar, node model, factory surface and validation numbers are identical to before the retirement, modulo the symbol ids that move when minted hidden rules are registered from a different place, and modulo one listed kind move (§8).
- `groups:`, `injects:`, `options:`, externals, supertypes, conflicts, inline and the other parser knobs are untouched. Retiring the body functions in `groups:` is a separate project.

## 2. What the block held

Seventy-eight entries after the three typescript no-ops (`optional_parameter`, `public_field_definition`, `required_parameter` returning `original`) were removed and shown to change nothing but the bundled grammar's hash. Seventy of them are full rewrites that return a fresh body from `$` alone; eight derive from `original` or `previous`. Every entry is one of these operations:

| operation | entries | declarative form |
|---|---|---|
| envelope aliasing: a hidden list aliased into a visible kind at its reference site | python `parameters`, `lambda_parameters`, `tuple_pattern`, `list_pattern`, `list`, `set`, `tuple`, `case_tuple_pattern`, `case_list_pattern`, `_parenthesized_import_list`; rust `tuple_type` / `_tuple_type_elements`, `tuple_expression` / `_tuple_expression_elements`; typescript `extends_clause` | `alias('<name>')` placeholder at the reference path (existing); fields inside the list are patches on the hidden rule |
| naming a bare literal, regex or hidden reference as a kind | python `_wildcard_pattern` and its `_simple_pattern` site; rust `_wildcard_pattern`, `_range_expression_bare`, `_string_literal_open` with `string_literal`, `_impl_item_unsafe_marker`, `_impl_item_semi`, `_impl_item_body`, the `$` arm of `_non_delim_token`; typescript's `;` arm of `class_body` | `field()` over a string mints `_kw_<name>`; `alias('<name>')` over any content mints `_<name>` (existing) |
| field naming inside a rule | python comprehensions, `comprehension_clauses`, `_except_clause_exception_as` and its optional, `_print_arguments`, `_print_chevron_arguments`; typescript `jsx_namespace_name`, `_ambient_declaration_global`, `_ambient_declaration_module`, `template_substitution`; rust `_use_wildcard_clause`, `impl_item`, `_let_chain`, the tuple element lists | positional and wildcard `field()` patches (existing); `_let_chain` is one `'*/0': field('left')`, `'*/2': field('right')` |
| precedence and conflict fixes | python `primary_expression`, `case_pattern`, `_simple_pattern`, `print_statement`; rust `_where_predicates`, `reference_expression`, `_let_chain`, `_non_special_token` | precedence placeholders (§3) |
| splitting a rule into named sub-shapes | python `print_statement` into chevron and plain, `case_as_pattern`; rust `reference_expression` raw-const and raw-mut, `impl_item` clauses, body and semicolon, `use_wildcard`; typescript `arrow_function`, `_reserved_identifier`, `object_type` with `object_type_content` | `variant()` on the arms (existing); a native symbol object at the path where `arrow_function` swaps a hidden reference for `call_signature` (existing); `refine` placeholder (§3); nested-choice flattening (§4); `case_as_pattern` and `use_wildcard` are checked against enrich's existing passes first (§4) |
| string internals | python `string_content`, `format_specifier`; typescript `template_substitution`; rust `string_literal` | alias placeholders at the hidden references, a native rule object for the regex member (existing), the immediate placeholder (§3) |
| token-tree regrouping | rust `_token_tree_punctuation`, `_token_keywords`, `_non_special_token`, `_non_delim_token` | the collect placeholder over kind-match classes (§3) |
| whitespace supertype | `_whitespace` in all three | minted by enrich (§4) |

## 3. The placeholders

Five placeholders join `field()`, `alias()`, `variant()`, `group()` and `arm.default`. Each is the existing DSL name called with its rule argument left out, the same convention that separates `field('x')` from `field('x', rule)`; each carries the `__sittirPlaceholder` brand and resolves in transform's patch resolution, so it reaches the parser through the bundled grammar and the IR through `evaluate()` alike. A placeholder mints hidden rules through the wire context like the existing ones, in `patches:` declaration order.

- **Precedence.** `prec(n)`, `prec.left(n)`, `prec.right(n)` and `prec.dynamic(n)` wrap the content at the path in the corresponding precedence node. At the path `'.'` they wrap the rule body, and a body that already carries a precedence wrapper of the same kind has its value replaced rather than nested. `primary_expression: { '(list_splat_pattern)': prec.dynamic(-1) }` and `_where_predicates: { '.': prec.right(0) }` are the two shapes.
- **Immediate.** `token.immediate()` marks the literal at the path as left-immediate, the fact typescript's `template_substitution` declares on `${` so the seam check never inserts a space before it. A path that does not resolve to a string or pattern is an error.
- **Refine.** `refine(forms)` at `'.'` deposits the per-form choice selections exactly as the two-argument form does, so `object_type` becomes three `field()` patches and one `refine` entry.
- **Collect.** `collect('<name>')` at a kind-match path inside a choice gathers every matching arm, in order, into one hidden rule `_<name>` whose body is the choice of those arms, and places one `alias($._<name>, $.<name>)` arm at the first match's position. A path that matches outside a choice, or matches nothing, is an error. It is distinct from `alias('<name>')`, which resolves per occurrence.
- **Kind-match classes.** The path grammar's kind-match segment gains `(word)` and `(punctuation)`, matching literal arms by the grammar's link-pinned word matcher, never by a pattern written in the grammar file. `_non_special_token: { '(word)': collect('token_keywords'), '(punctuation)': collect('token_tree_punctuation') }` replaces the two literal lists of 30 and 44 arms.

## 4. Enrich generics

Two facts need no author because they follow from declarations the file already makes.

- **The whitespace supertype.** Enrich mints `_whitespace` as the choice over the grammar's declared visible externals and the depth arms, from the same externals declaration the file carries, and registers it as a supertype. The three identical hand-written rules and their `supertypes:` additions go.
- **Nested-choice flattening.** A choice with a choice among its members is flattened on the parser side. Simplify already does this on the sittir side; doing it in enrich makes both pipelines see one shape and retires typescript's `_reserved_identifier`.

Two rewrites are deleted before anything is built for them, and the regen log is read: python's `case_as_pattern` exists because upstream aliases `_as_pattern` to `as_pattern`, colliding with the expression-level kind of that name, which is the case enrich's unalias-distinct pass resolves; rust's `use_wildcard` is an `optional(seq(path, '::'))` clause the clause-hoist pass handles. If either pass does not produce the same model, the pass is fixed, not the grammar file.

Phase two's generic is the **envelope mint**: a hidden list rule referenced inside a delimited sequence surfaces as a visible envelope named by the names rules of the bindings-and-vocabulary design. It replaces the fourteen alias patches phase one writes for the envelope bucket, and because its names may differ from the hand-chosen ones it waits until the base vocabulary tree is on master, so the bindings and the tree are updated in the same change.

## 5. The gate and its tool

Identity is checked modulo kind ids, never by eye. `sittir tool grammar-diff <grammar> --baseline <dir>` snapshots `.sittir/src/grammar.json` and the node model before a change and, after it, compares them with symbol ids and minted-rule registration order normalised away, printing every rule body, slot, field name, kind set and supertype membership that differs. A retirement commit passes when the tool prints nothing, the validation history numbers for the grammar are unchanged, and the unit suite is green. In phase two the tool accepts a rename list and prints only what is not a listed rename.

The tool lives in `packages/tools/src/grammar-diff/` beside the inventory, is registered under `sittir tool`, and is documented in the glossary like every tool.

## 6. Phases and order

**Phase one, transliteration**, on a branch off master, one rewrite per commit, each quoting the tool's empty output:

1. the gate tool;
2. the precedence, immediate, refine and collect placeholders and the kind-match classes, each with unit tests on synthetic rules through `transform()`;
3. the whitespace mint and nested-choice flattening in enrich;
4. python's full rewrites, then rust's, then typescript's, checking `case_as_pattern` and `use_wildcard` against the existing passes first;
5. the eight `original`-based entries;
6. removal of `rules` from the authored config type, and the grammar workflow doc's override-patterns section rewritten so it teaches the placeholders and never a rewrite.

**Phase two, generics**, after the base vocabulary tree lands: the envelope mint, deletion of the alias patches it covers, the rename list in the regen log, and the bindings and tree updated in the same change.

## 7. Verification

- Per commit: the gate tool prints nothing; `sittir validate history` numbers for the grammar unchanged; the suite green with any new failure isolated by stash-and-rerun.
- Per placeholder: a unit test that applies it to a synthetic rule through `transform()` and checks the resolved body, the minted hidden rule and the registration through the wire context; an error test for each rejected path shape.
- Per enrich generic: a unit test on a synthetic grammar, and the three grammars' regen logs showing no new mint beyond the retired rule.
- End of phase one: the three grammar files type-check with `rules` absent from the config type; a grammar file that reintroduces the key fails `tsc`.

## 8. Accepted deviation

Rust's rewrite files the lifetime sigil `'` under `_token_keywords`; the word matcher files it under punctuation. Under the kind-match classes it moves to `token_tree_punctuation`. The move is accepted, listed in the regen log, and is the only difference the gate tool is expected to print in phase one.

## 9. Out of scope

`groups:` body functions (five entries), `preference()` entries and the token seam defaults implementation, the positional fragility of `patches:` paths under upstream bumps, and the bindings pass that spells the resulting slot names.
