# grammar.bindings.ts prototype

`grammar.sittir.ts` runs in full, enrich included, as the base. A generated `grammar.bindings.ts` (from `bindings.scm`, in base names) applies last through `bind(base, binding)`. Both pipelines see only the bound grammar: tree-sitter loads it through `.sittir/grammar.js`, and sittir's `evaluate` through the package entry. `{ unbound: true }` evaluates the base layer alone.

The question is convergence: how close the bound grammar brings the low-level surface (kind names, field names) to the vocabulary, while parsing exactly what the base parses. Its answer feeds one decision: whether the portable API becomes a typed view over the low-level nodes, one runtime on bound names. [What the portable surface still adds](#what-the-portable-surface-still-adds) lists what such a view would carry on top.

## Primitives

They live in `packages/codegen/src/dsl/bind.ts` and apply in this order:

| primitive | what it does |
| --- | --- |
| rename | Renames a rule or external and every reference to it: supertypes, inline, extras, externals, conflicts, word, reserved, precedences, named alias targets, `renderAs`, `groups`, every name-set field, and the options table's kind keys and `(kind)` path segments. A `name:` path segment is renamed only when no field of that name exists, since fields keep their names. Hiddenness never flips, and a taken name is refused. Records `renamedFrom` (bound → base). |
| field rename | Renames a field on one owner to its vocabulary member name, with the owner's option paths. |
| field wrap | Wraps an owner's unfielded references to a child kind, or occurrences of a token, in `field(member, …)`, with the owner's option paths (`kind:` and `"token"` segments become `member:`). A root choice's alternative is an arm, not a slot, and is never wrapped. |
| alias | Wraps every reference to a kind in a named `ALIAS` to the target. |
| split | Splits a kind by placement. The ancestors on the path from the outer placement down to the kind are cloned, and inside the clones the kind's reference becomes the arm. A visible clone is named `<outer>_<member>` and its reference is fielded with the member. A hidden clone (a supertype) is named `<base>_<outer>`. Records `splitFrom` (arm or clone → the source kind's bound name; a renamed source reaches its base name through `renamedFrom`). |

Field renames and field wraps are parse-neutral, and both are refused when the field would sit in a hidden rule another kind shares, when the owner already has the member name, or when the field or target is not on the owner (`fieldRenameIssue`, `fieldWrapIssue`). An owner's reach is its rule and the hidden rules it references, stopping at supertypes, since a supertype is a named child.

The base layer's authoring metadata keeps base names: `ruleCauses`, `expectDiagnostics`, patch sites and `derivationRecords`.

## Naming

The overlay derivation (`deriveOverlay`, `packages/codegen/src/bindings/overlay.ts`) names a claim with its vocabulary path reversed, subkind first, keeping hiddenness: `declaration.function` becomes `function_declaration` (`boundKindName`). `NAME_OVERRIDES` is the per-row hook; it is empty for all three grammars. A member's field name is its camelCase name in snake case, so every slot a member reaches is named by the member, never by a kind.

`CONTAINER_MEMBER_OVERRIDES` names a placement's container where the vocabulary has no member for it. rust needs one (`impl_item_body` → `body`), and it is a vocabulary gap: `declaration.extension` declares no `body`.

## Members

Every declared member becomes a field where the grammar allows it:

1. A member routed to a field renames it.
2. A member routed to an unfielded child, or to a token's presence, first looks for the field the enriched base already gives that child (`childFields`). `bindings.scm` describes the node before enrich, so many of its unfielded children are fielded in the base:
   - when that field already has the member's name, the member is realized;
   - when the field holds only this child, it is renamed;
   - otherwise the child or token is wrapped in a new field.
3. An implicit route is a member with no route in `bindings.scm` whose name a child kind spells (python's `comprehensionClauses` reads the unfielded `comprehension_clauses`). A rename moves that slot name, so the child is fielded with the member too.

Where it can't be done, the refusal stays in the residue with its reason.

## Convergence (round 2 → round 3)

| | rust | typescript | python |
| --- | --- | --- | --- |
| renames / aliases / splits | 98 / 2 / 3 | 92 / 9 / 0 | 73 / 7 / 0 |
| field renames | 11 → 15 | 6 → 12 | 13 → 16 |
| field wraps (of which implicit routes / tokens) | – → 9 (9 / 0) | – → 8 (3 / 5) | – → 9 (9 / 0) |
| members realized as field names | 13/40 → 24/40 (60 %) | 6/40 → 17/40 (42.5 %) | 13/31 → 17/31 (54.8 %) |
| claims realized as kinds | 149/200 (74.5 %) | 163 → 167/234 (71.4 %), 4 by the parent | 117 → 119/180 (66.1 %), 2 by the parent |

Claims by the parent: arms that claim their own parent's path give the claim to the parent, and stay its variants. typescript's `update_expression_prefix`/`_postfix` go to the `update_expression` supertype, and `comment_block`/`comment_line` to the `comment` supertype. python's `print_statement`/`print_statement_plain` go to `print_statement`. typescript's `html_comment` is an external with no rule the parent references, so it stays residue.

The residue, by cause:

| cause | rust | ts | python | what it is |
| --- | --- | --- | --- | --- |
| field-literal refinement | 28 | 53 | 31 | an operator or field literal decides it |
| child-pattern refinement | 10 | 1 | 12 | a child kind decides it |
| predicate refinement | 3 | 5 | 11 | text decides it (`#match?`/`#eq?`) |
| token refinement | 3 | – | – | an operator token decides it |
| nested route | 3 | 8 | 5 | the member reads through a child |
| token reached through a child | 4 | – | – | a presence member whose token sits in a child kind (`function_modifiers`) |
| field shared by several members | 5 | 1 | 6 | one field feeds several members, by kind |
| one child or token feeds several members | – | 4 | – | |
| child sits in several fields | 1 | – | 2 | |
| positional or wildcard child with no field | 1 | 1 | 1 | |
| field sits in a hidden rule another kind shares | – | 7 + 4 implicit | 1 implicit | see below |
| child is an arm of the owner | – | 1 implicit | 1 implicit | `binary_expression_in`, python `expression_statement`'s arms |
| member name already a field / child not on the owner | 1 | – | 1 implicit | |
| member not in the vocabulary | 1 | 2 | – | |
| not a base rule | 6 | 4 | 1 | an alias target or supertype name |
| name taken | – | 2 | – | the bound name is another base kind (`call_expression`, `lambda_expression`) |
| alias target taken | – | 1 | – | `html_comment` |
| placed claim / container with no member name | – | – | 4 / 2 | python's method placement needs a container member, like rust's `body` |
| wildcard placement | 1 | 1 | – | `_` has no rule to split |

### Shared hidden rules: what cloning would cost

Cloning the hidden rule per owner, measured with `--clone-shared` (each host group alone, never part of the binding):

| grammar | hidden rule | owners | cost |
| --- | --- | --- | --- |
| typescript | `_kw_optional` | `method_definition` | +0 states, +0 symbols |
| typescript | `_initializer` | `required_parameter`, `optional_parameter` | +4 states, +2 symbols |
| typescript | `_parameter_name` | `required_parameter`, `optional_parameter` | does not generate: the two clones conflict after `( readonly` with `primary_expression`, a new LR conflict |
| typescript | `_expressions` | `return_statement`, `throw_statement`, `expression_statement`, `template_substitution` | +0 states, +0 symbols |
| python | `_expressions` | `yield` | +0 states, +0 symbols |

So 10 of the 12 shared cases would cost nothing or 4 states. `_parameter_name` (typescript's parameter `name`/`visibility`, 2 members per owner) needs a declared conflict, which is not parse-neutral.

## Parse neutrality (round 3)

| | rust | typescript | python |
| --- | --- | --- | --- |
| STATE / SYMBOL / TOKEN / ALIAS | rust's 3 splits only: STATE 3531 → 3725, SYMBOL 465 → 471; TOKEN 176, ALIAS 4 equal | equal (7244 / 460 / 188 / 8) | equal (2318 / 333 / 127 / 5) |
| FIELD | 80 → 90 (round 2: 83) | 78 → 84 (79) | 65 → 70 (66) |
| PRODUCTION_ID | 401 → 425 (415) | 1561 → 1566 (1561) | 177 → 181 (178) |
| conflict resolutions | identical | identical | identical |
| corpus trees, mapped back | 148/148 | 117/117 | 117/117 |
| parser.c bytes | 7,059,061 → 7,469,977 (+5.8 %; round 2 7,468,511) | 11,128,139 → 11,360,979 (+2.1 %; 11,367,662) | 3,215,191 → 3,432,364 (+6.8 %; 3,431,763) |

Field renames and wraps move only FIELD and PRODUCTION_ID: new member names enter the field table, and the new field maps add production ids. The parse table is otherwise untouched.

RuleIds: every renamed kind keeps its base root id (98/98, 92/92, 73/73), and no base id is lost. Every split's `splitFrom` resolves to a base root id. Ids added outside split rules are the new FIELD layers at link (rust 10, typescript 7, python 11; round 2: 1, 4, 2); normalize adds none beyond round 2's.

## Validation

`validate:native` passes every row on all three bound grammars, equal to round 2. typed-read-parity agrees on every entry (148, 115, 116).

| row | rust | typescript | python |
| --- | --- | --- | --- |
| from | 244 → 246 | 186 → 183 | 180 → 173 |
| cov | 207 → 209 | 202 → 200 | 146 → 139 |
| factory-storage | 1670 → 1673 | equal | equal |
| ir-storage | 1214 → 1217 | equal | equal |
| built-render-parse | 1733 → 1775 | equal | 1161/1303 → 1163/1305 (master's 142 failures) |

Every population change, kind by kind (`population-diff.py` and the validators' skip reasons). An alias merges its sources into one node-types entry under the alias's display name, and that display has no rule and no factory of its own:

| grammar | change | kinds |
| --- | --- | --- |
| rust | +4 split kinds | `method_declaration`, `signature_method_declaration`, `trait_interface_declaration_body`, `extension_declaration_body` |
| rust | −1 merge, −1 skipped | `impl_item_body` + `impl_item_semi` → `extension_declaration` (cov `no-rule`, from `no-from-function`) |
| typescript | −1 merge, −1 skipped | `variable_declarator_definite` + `variable_declarator_plain` → `variable_declaration` (round 3 only; see [Round 4](#round-4)) |
| typescript | −1 from | `number_bigint` → `integer_number_literal` (`no-from-function`; round 3 only, see [Round 4](#round-4)) |
| python | −4 merges, −3 skipped | `binary_operator` + `comparison_operator` → `binary_expression`; `lambda` + `lambda_within_for_in_clause` → `lambda_expression`; `assignment_eq` + `assignment_type` + `assignment_typed` → `variable_declaration` |

## Conformance (binding-generator probe)

| | base | round 2 | round 3 |
| --- | --- | --- | --- |
| rust | 133 | 136 | 136 |
| typescript | 98 | 94 | 98 |
| python | 197 | 202 | 197 |

- **python** returns to its base: the fielded `comprehensionClauses` routes resolve again.
- **rust** keeps round 2's +3: 2 extra member (`body` on `declaration.extension`), 1 other (the trait body's item type).
- **typescript** equals its base in round 3. Its base re-measures at 98 against round 2's 94: four `absent` rows on `expression.binary.logical.and`/`.or` (`left`, `right`) now appear unbound too, so the binding does not cause them. Their cause is not yet traced.

## What the portable surface still adds

What a typed view over the bound low-level nodes would still have to carry, per grammar. Everything not listed is a bound kind or field read as is.

| | rust | typescript | python | what the view does |
| --- | --- | --- | --- | --- |
| refinements | 44 | 59 | 54 | a kind's subkind decided by a literal, token, child kind or text (`is.*`, `$kind` narrowing) |
| nested routes | 3 | 8 | 5 | a member read through a child |
| presence | 4 | 5 | – | a token's presence as a boolean: rust's through `function_modifiers`; typescript's realized as token fields, still read as a boolean |
| one field, several members | 7 | 6 | 9 | a field (or position) split into members by kind |
| fields in shared hidden rules | – | 7 (11 before the addendum) | 1 | members the grammar can't field without cloning (see the cost table) |
| arms realized by the parent | – | 4 | 2 | the parent is the vocabulary kind; the arms are its variants |
| alias merges | 1 group | 3 groups | 3 groups | several kinds under one vocabulary kind (the low level already shows one display) |
| kinds the low level can't name | 7 | 8 | 5 | not a base rule, name taken, alias target taken, placed claims, wildcard placements |
| vocabulary gaps | 2 | 2 | 2 | members the vocabulary lacks (`body` on `declaration.extension`, rust `reference_expression.argument`, typescript `optional_chain` ×2) or container names (python method placement) |

## Addendum: agreeing owners edit a shared hidden rule in place

Maintainer rule: a field in a hidden rule several kinds share is renamed or wrapped in place, with no clone, when every kind that reaches the hidden rule asks for the identical edit. A kind with no binding for the field keeps the base name, so it disagrees. `fieldRenameIssue` and `fieldWrapIssue` check the edit against its batch (`sharersAgree`), and bind applies the batch against the original rules. The generator accepts edits to a fixpoint: an edit agrees only with edits that are themselves accepted.

| | rust | typescript | python |
| --- | --- | --- | --- |
| members realized as field names | 24/40 (unchanged) | 17/40 → 21/40 (52.5 %) | 17/31 (unchanged) |
| field renames / wraps | 15 / 9 | 12 / 8 → 14 / 10 | 16 / 9 |
| field sits in a hidden rule another kind shares | – | 7 + 4 implicit → 3 + 4 implicit | 1 implicit |

typescript's `_parameter_name` is reached only by `required_parameter` and `optional_parameter`, and both bind `pattern` to `name` and the accessibility modifier to `visibility`. So `pattern` is renamed and the modifier wrapped inside `_parameter_name`, which the clone measurement showed could not be cloned without a new conflict. The rest stay residue:

- `_initializer`: 7 owners, and only the two parameters bind `value` to `default`;
- `_kw_optional`: `method_definition.optional`;
- `_expressions`: the four implicit `expression` routes;
- python `yield.expression`.

typescript after the addendum:

- Parse table unchanged (STATE 7244, SYMBOL 460, TOKEN 188, ALIAS 8). FIELD 84. PRODUCTION_ID 1551: the two parameter kinds now share field maps, so production ids merge.
- Resolutions identical, corpus trees 117/117 after mapping, and every renamed root keeps its RuleId.
- `validate:native` rows unchanged and passing; typed-read-parity agrees on every entry; conformance 98, unchanged.
- rust and python bindings are byte-identical to round 3.

In [What the portable surface still adds](#what-the-portable-surface-still-adds), typescript's "fields in shared hidden rules" row drops from 11 to 7.

## Round 4

Measured on current master with the binding written as patch sets (`bindings({ patches, renames, splits })`). The checked-in state is bindings off; `grammar.sittir.ts` passes `bindings` only while a bound run is measured.

### What changed

- **Seating is a node fact.** A hoisted group seats on its parent unless the parser declares it a supertype (`seatedOf`), and every reader takes `node.seated`. Patches carry `hoisted` like every other property, so a field-only patch no longer loses it.
- **typescript `variable_declarator` keeps its `plain`/`definite` arms.** The portable surface presents both as `declaration.variable`, with `definite` set by which arm parsed: the view maps two low-level kinds onto one vocabulary kind. The arms stay residue in the generator (an alias target names a base rule the binding renames away), and round 3's merge row no longer applies.
- **Options follow binding patches.** Wire records each binding patch's effect (a field renamed, a child or token wrapped, a kind aliased), and `sittirGrammar` rewrites the authored option paths with them before the kinds are renamed. The keys this moves: rust `module statements:/(impl_item_body)/after` (alias), typescript `optional_parameter "?"/before` (token wrap), python `comparison_operator/comparators:/separator` (alias) and `try_statement/except_clauses:/separator` (field rename).
- **Payload pins are measured in emitted names.** A bound build settles its own pin list; the base list is unchanged. Pins that move with a rename only change spelling (`FloatPointTransport` → `FloatNumberLiteralTransport`).
- **Reparse hosts are bound names.** The authored `reparseHosts` block is renamed with the grammar. A split kind with no host of its own reparses inside its placement's owner (`wrapRendered`), in both the render-and-reparse step and the factory row's host check.
- **Provenance is stamped.** Link carries `{ renamedFrom, splitFrom }` as one `provenance` object; each node stamps both once, and the node model serializes them. A clone's `splitFrom` names its source kind's bound name. The tools read provenance from the node model (`parseNodeModel`, `loadBoundNameOf`) and never re-evaluate the grammar for it. Bound node models record rust 100 renamed and 6 split kinds, typescript 102 renamed, python 79 renamed.

### Number literals

Every form a grammar gives its own arm is its own kind, claimed at its own path. A parent that only groups the arms is a parser supertype with no node, so it claims nothing; the vocabulary's `.Any` union covers the family.

| path | typescript | rust | python |
| --- | --- | --- | --- |
| `literal.number` | `number` (supertype) | – | – |
| `literal.number.integer` | `number_decimal` | `integer_literal_decimal` | `integer_decimal_plain` |
| `.integer.hex` / `.binary` / `.octal` | `number_hex` / `_binary` / `_octal` | `integer_literal_hex` / `_binary` / `_octal` | `integer_hex` / `_binary` / `_octal` |
| `.integer.big` | `number_bigint_decimal` | – | `integer_decimal_long` (`L`) |
| `.integer.big.hex` / `.binary` / `.octal` | `number_bigint_hex` / `_binary` / `_octal` | – | – |
| `.integer.imaginary` | – | – | `integer_decimal_imaginary` (`j`) |
| `literal.number.float` | `number_float_point` | `float_literal` | `float_point` |
| `.float.leading_point` / `.scientific` | `number_float_leading_point` / `_scientific` | no arm | `float_leading_point` / `_scientific` |
| `literal.number.negative` | – | `negative_literal` | – |

rust's float forms sit in one regex (`/[0-9][0-9_]*(?:\.…|[eE]…)…/`) with no arm to lift, so they stay one kind. `literal.number.integer.long` is reserved for fixed-width `L` literals (a Java, Kotlin or C grammar); python's `L` is arbitrary precision and binds to `.integer.big`.

The vocabulary adds `Integer.Binary`, `Integer.Octal`, `Integer.Big` (with `.Hex`, `.Binary`, `.Octal`), `Integer.Imaginary`, `Float.LeadingPoint` and `Float.Scientific`. `Integer` loses `prefix` (the prefixed forms have their own paths) and gains rust's `suffix`; `Float` gains python's `imaginary`. The bindings inventory's check agrees with the vocabulary.

### Convergence (round 4)

| | rust | typescript | python |
| --- | --- | --- | --- |
| renames / aliases / splits | 100 / 2 / 3 | 102 / 0 / 0 | 79 / 7 / 0 |
| field renames / wraps | 15 / 9 | 14 / 11 | 16 / 9 |
| members realized as field names | 24/40 (60 %) | 22/41 (53.7 %) | 17/31 (54.8 %) |
| claims realized as kinds | 151/202 (74.8 %) | 168/237 (70.9 %), 4 by the parent | 125/186 (67.2 %), 2 by the parent |

typescript's aliases fall to 0: its number forms used to share two claims and merged under them; each now claims its own path.

### Parse neutrality and validation (round 4)

Corpus trees map back with every kind mapped through the bound node model's provenance and the binding's alias merges: rust 148/148, typescript 116/116, python 118/118 (the corpus itself changed since round 3).

`validate:native` passes every row bound and unbound, and typed-read-parity agrees on every entry in all five grammars. Bound rows that differ from the unbound ones (pass / total / AST match where a row has three):

| row | rust | typescript | python |
| --- | --- | --- | --- |
| built-render-parse | 1775/1775/1775 (unbound 1733) | 1690/1690/1690 (1689) | 1248/1248/1246 (1246) |
| from | 246 (244) | 186 (186) | 173 (180) |
| cov | 209 (207) | 202 (202) | 140 (147) |

python's two AST mismatches are `lambda_within_for_in_clause`, aliased into `lambda_expression`.

### Bound-only checks

These hold with bindings on and pass in the checked-in state:

- The tools' type-check reports about 30 errors from tests and tools written against base names (`is.functionItem`, `build.parameter`): the bound surface renames them.
- The bindings inventory's check reports 4 disagreements: bound field names route as new members (`declaration.extension.body`, `declaration.extension.conformance.body`, `element.struct.field.attributes`, `literal.string.concatenated.stringLiterals`).

## Findings

1. **`bindings.scm` describes the node before enrich.** Most "unfielded" routes already have a field in the enriched base, often with the member's name (rust `parameter.mutable`, `return_expression.expression`). Resolving a route through the base's own fields realizes more members than wrapping.
2. **Implicit routes are name coincidences.** A member resolves through an unfielded slot named after its child kind, and a rename silently breaks it (python `comprehensionClauses`). Fielding every member removes the coincidence.
3. **Arms are not slots.** Fielding an arm of a root choice (typescript `binary_expression_in`) makes every arm's fields optional. Arms are refused.
4. **Shared hidden rules mostly clone for free.** Only `_parameter_name` needs a new conflict.
5. **Name-keyed tables follow the base.** Codegen's text-resolved layout sites look up `renamedFrom[kind]`. Each node carries its own `renamedFrom` and `splitFrom`, stamped once and serialized in `node-model.json5`, and the tools read them there rather than evaluating the grammar again. The reparse host table is renamed with the grammar, so its keys, priority list and gated list are bound names; required fixture coverage and listed empty slots translate through `loadBoundNameOf`.
6. **Render rows are keyed by storage kind.** This also fixes edge ids that had been borrowed through a shared display in the unbound grammars: rust `raw_string_literal_content`, typescript `unescaped_single_string_fragment`, `_template_chars` and `__error_recovery`, and scm `_immediate_identifier`.
7. **Options addressing under an alias.** An address's head also matches the site's storage kind.
8. **Diagnostics mix spellings.** Patch-site and rule-cause diagnostics name base kinds; collect-slots diagnostics name bound kinds. `expectDiagnostics` accepts either.
9. **Name lookups need own keys.** typescript's variant `constructor` resolved to `Object.prototype.constructor`; every rename-map lookup goes through `mappedName`.
10. **The validator commits history rows.** `validate counts` commits its history row on whatever branch is checked out.

## Files

| file | what it does |
| --- | --- |
| `generate-bindings.mts` | The measurement copy of the overlay derivation: derives a bindings overlay from `bindings.scm` and prints convergence and the residue with reasons. Flags: `--out <file>` (write the overlay module there; it never writes the package's own `grammar.bindings.ts`), `--no-aliases`, `--no-splits`, `--no-externals`, `--clone-shared` (measures the shared-hidden-rule clones; the result is not a binding to keep), `--record <file>`, `--verbose`. Production writes `packages/<grammar>/grammar.bindings.ts` (the overlay, the claim rows and their hash) through `sittir tool bindings-inventory --write`, whose derivation is `packages/codegen/src/bindings/overlay.ts`. |
| `parser-neutrality.py` | Compares two parser.c files: the define counts, the byte sizes, and the lines that still differ after bound names map back. |
| `dump-corpus.mts` | Writes each corpus entry to its own file for `tree-sitter parse`. |
| `tree-neutrality.py` | Compares the base and bound parse trees after mapping kinds, fields, wrap fields, aliases, split arms and clones back. |
| `rule-id-stability.mts` | `snapshot` writes the base ids, and `compare` checks the bound run against them. |
| `population-diff.py` | Attributes a change in the from/cov validators' population to kinds. |
| `base-<grammar>/` | The base snapshot: parser.c, grammar.json, node-types.json, resolutions.json, rule-ids.json and the `.sittir` folder (typescript also needs `common/` beside it for its scanner header). |
| `nosplit-rust/` | rust's round-2 parser and binding without splits. |

## Run

From the worktree root. Each base snapshot is taken with the grammar's `grammar.bindings.ts` moved aside and the package regenerated:

```bash
P=docs/superpowers/probes/grammar-bindings
G=rust EXT=rs   # typescript ts, python py
SITTIR_INTERNAL_CODEGEN_RUN=1 pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write
SITTIR_INTERNAL_CODEGEN_RUN=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $G --all --output packages/$G/src
python3 $P/parser-neutrality.py $P/base-$G/parser.c packages/$G/.sittir/src/parser.c packages/$G/grammar.bindings.ts
python3 $P/population-diff.py $P/base-$G/node-types.json packages/$G/.sittir/src/node-types.json packages/$G/grammar.bindings.ts
(cd $P && SITTIR_INTERNAL_CODEGEN_RUN=1 pnpm exec tsx rule-id-stability.mts $G compare base-$G/rule-ids.json)
pnpm exec tsx $P/dump-corpus.mts $G "$OUT/corpus" $EXT
# tree-sitter caches the compiled parser by grammar name, so give each side its own TREE_SITTER_LIBDIR:
(cd $P/base-$G/sittir && for f in "$OUT"/corpus/*.$EXT; do TREE_SITTER_LIBDIR="$OUT/lib-base" tree-sitter parse "$f"; done) > "$OUT/base.txt"
(cd packages/$G/.sittir && for f in "$OUT"/corpus/*.$EXT; do TREE_SITTER_LIBDIR="$OUT/lib-bound" tree-sitter parse "$f"; done) > "$OUT/bound.txt"
python3 $P/tree-neutrality.py "$OUT/base.txt" "$OUT/bound.txt" packages/$G/grammar.bindings.ts
```
