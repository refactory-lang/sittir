# Vocabulary renames census

The census for the renames stage: the synonyms probe's ruled renames (`../2026-10-12-vocabulary-synonyms/`, Rulings) that have not landed. The 4a census found them (`../2026-10-24-synonyms-4a-census/`, §4), and its ruling 4 made them a stage of their own after 4a, with a census for the user, since they are public vocabulary names. Taken on master efc8df898.

**How it was measured.** `run.sh [commit]` exports the commit's vocabulary, `bindings.scm` files and grammars, and runs the synonyms probe's `census.py` over them. `renames.py` then checks each of `proposal.json`'s renames against the vocabulary as it stands. It writes:
- `results/pending.txt`: each rename still pending, with its claims and its members and the target's;
- `results/reach.txt`: the files that spell each old path, as a path or as its interface name, split into hand-written source, tests and generated files.

## Answer

1. **26 renames are pending, not 27.**
   - Of the 73 ruled renames, 46 have landed.
   - 27 old paths are still in the vocabulary, but one of them, `pattern.as`, has already landed. NO8 removes the old meaning of `pattern.as`: python's with-item `as_pattern`, which is now a container that the with item captures through. The path itself is now the merged kind that python's case-as pattern and rust's captured pattern claim.
   - 24 of the 26 have claims. `clause.match` and `type.named` are unclaimed.
2. **By ruling:** NO7 has 4 renames, NO9 10, ID1 4, ID2 5, ID4 1 and ID8 2. Three target kinds do not exist yet and are added: `identifier.qualified`, `pattern.map` and `pattern.complex`.
3. **One question is left for the user:** rust's match arm's low-level field (§3). The rulings and the bindings spec settle everything else, including the portable shape of the match case.
4. **Four rulings need grammar-binding edits that do not exist yet** (§4). Each changes a parse tree: three in python, one in rust.
5. **Low-level slot renames follow from the merged members** (§5). A capture of a claimed node's own field renames that field in the parser, as 2b's do.
6. **Validation.** The path renames and the slot renames are expected to move no row, as 2b's 65 field renames moved none. The four new edits change parse trees, so the stage measures their rows and parser deltas when it writes them.

## 1. The renames

p, r and t mark the claiming grammar; a number is the line in that grammar's `bindings.scm`. "Members" gives the old kind's members and what they become.

**NO7, the match case.** All four become `clause.case.match`, whose members are `pattern`, `guard`, `body` and rust's `attributes`.

| old path | claims | members |
| --- | --- | --- |
| `clause.match.arm` | r:208 `(match_arm pattern: _ @match)` | `match` → `pattern` and `guard`, read through the match pattern; `value` → `body`; `attributes` |
| `clause.match.arm.last` | r:209 `(last_match_arm pattern: _ @match)` | the same, and `trailingComma` goes: the bindings spec makes the trailing comma after rust's last arm a render option, and no member holds a spelling |
| `clause.match` | none | none |
| `pattern.match` (removed) | r:316 `(match_pattern) @pattern.match` | its `pattern` and `condition` become the arm's `pattern` and `guard` |

Python's `clause.case.match` already exists, with `casePatterns`, `consequence` and `guard`. These become `pattern` (one pattern, or one tuple pattern without parentheses when the case lists several, §4), `body`, and `guard`, which is now the `if` clause's condition, read through the clause.

**NO9, the case patterns.** All of these are python's, except the last.

| old path | becomes | claims | members |
| --- | --- | --- | --- |
| `pattern.case` | removed: `case_pattern` becomes a container | p:190 | `content` goes |
| `pattern.case.list` | `pattern.list` | p:198 | `elements` |
| `pattern.case.tuple` | `pattern.tuple` | p:197 | `elements` |
| `pattern.case.or` | `pattern.or` | p:191 | `patterns` → `left` and `right`, the list nested as pairs (§4) |
| `pattern.case.splat` | `pattern.rest` | p:194 | `name` → `pattern`. `operator` goes: `**` is the `pattern.rest.map` refinement |
| `pattern.case.dictionary` | `pattern.map` (to add) | p:192 | `elements` |
| `pattern.case.class` | `pattern.struct` | p:195 | `name` → `type`, `arguments` → `fields` |
| `pattern.case.keyword` | `pattern.struct.field` | p:193 | `name`; `value` → `pattern` |
| `pattern.case.complex` | `pattern.complex` (to add) | p:196 | `real`, `imaginary`, `operator`, `sign`, unchanged by the ruling |
| `pattern.tuple.struct` (r) | `pattern.struct` | r:318 | `type`; `patterns` → `fields`, a bare pattern for each positional sub-pattern |

**ID1, the role kinds.** Each becomes `identifier`. None has members. A private name's fact is the `privateName` flag on its holder.

| old path | claims |
| --- | --- |
| `identifier.type` | r:403 `type_identifier`, t:440 `type_identifier` |
| `identifier.field` | r:404 `field_identifier` |
| `identifier.property` | t:441 `property_identifier`, t:442 `private_property_identifier` |
| `identifier.property.shorthand` | r:405 `shorthand_field_identifier`, t:443 and t:444 the two shorthand property kinds |

**ID2, the qualified names.** Each becomes `identifier.qualified` (to add), whose pair form has members `qualifier` and `name`.

| old path | claims | members |
| --- | --- | --- |
| `identifier.dotted` | p:246 `dotted_name` | `names`, a flat list → nested as pairs (§4) |
| `identifier.nested` | t:445 `nested_identifier` | `object` → `qualifier`, `property` → `name` |
| `identifier.scoped` | r:313 `scoped_identifier` | `path` → `qualifier`; `name` |
| `type.path` | p:208 `member_type`, r:380 `scoped_type_identifier`, t:446 `nested_type_identifier` | `baseType`, `module` and `path` → `qualifier`; `name` |
| `type.path.expression` | r:381 `scoped_type_identifier_in_expression_position` | `path` → `qualifier`; `name` |

**ID4, rust's path roots.** `identifier.crate` (r:411) becomes `identifier`. The same ruling moves two more rust claims that are not renames:
- `(super) @identifier.super` (r:410) claims `identifier`. Typescript's `super` keeps `identifier.super` (ID6).
- `self` at a path's root becomes an alias kind that claims `identifier`, so `(self)` (r:409) reads only the receiver (§4).

**ID8.** `type.named` (unclaimed) and `type.named.prelude` (r:382, a `#match?` on five prelude names) are removed.

## 2. What they touch

`results/reach.txt` has every file with its counts. In outline:

- **Hand-written source:**
  - the vocabulary files: `match-expressions/clause.ts` and `pattern.ts`, `complex-numbers/pattern.ts`, `structs/pattern.ts`, `identifier.ts`, `type-annotations/type.ts`, and the slot table in `context.ts`;
  - the three `bindings.scm` files.
- **Tests that name an old path:**
  - `tools/tests/portable/is.test.ts`: `identifier.property`, `identifier.type`, `type.named.prelude`;
  - `codegen/src/bindings/__tests__/routes.test.ts`: `identifier.property`, `.field`, `.scoped`;
  - `codegen/src/bindings/__tests__/read.test.ts` and `types/tests/vocabulary-consumers.test-d.ts`: `identifier.crate`;
  - `tools/tests/inventory/bindings-inventory.test.ts` and `interface-extends.test.ts`: `identifier.type`;
  - `codegen/src/emitters/overlays/portable/__tests__/read-tests.test.ts`: `type.named.prelude`;
  - `codegen/src/bindings/__tests__/grammar-bindings.test.ts`, which uses `type.named` as a fixture's claim.

  `rust/tests/match-arm-guard.test.ts` reads the low-level arm (`arm.match()`), so it moves with §3's question.
- **Generated:**
  - every rename: `augment.ts`, `vocabulary-paths.ts`, and each claiming grammar's `portable.ts` and `node-model-portable.json5`;
  - where a slot rename or a new edit reaches the parser: `grammar.bindings.ts`, the parser and every low-level output of that grammar.
- **Not touched:** `python/tests/nodes.test.ts` and `python/src/factories/overlays/polymorphs.ts` match `type.named`, but they spell python's own low-level `type` kind and its `named` form, not the vocabulary path.

## 3. The match arm's `match`

**NO7 (ruled 2026-10-12)**, from the synonyms probe:

> match case | `clause.match.arm`, `.arm.last` (r), the unclaimed `clause.match`; `clause.case.match` (p) | `clause.case.match`, with `pattern`, `guard`, `body` and rust's `attributes`. Rust's match pattern is hoisted into its arm, so `pattern.match` goes, and python's `if` guard into its case. [...] The last arm differs only in that its comma is optional, which is a position, not a fact

> NO7: an arm holds one `pattern`, and python's several patterns are one tuple pattern without parentheses. Rust's match pattern and python's `if` guard are hoisted.

Its member table gives `pattern` as rust's "match pattern's `pattern`", `guard` as "the match pattern's `condition`", and `body` as rust's `value`.

**2b (2026-10-23)**, from the 2b census, §2.1:

> the arm's own field is renamed to `match` through the bindings (vocabulary member `pattern` → `match` on `Clause.Match.Arm` and `Arm.Last`). The inner `match_pattern`'s field stays `pattern`.

It landed with `(match_arm pattern: _ @match)` and `(last_match_arm pattern: _ @match)`, which derive the parser field `match` on `match_arm_with_comma`, `match_arm_block_ending` and `last_match_arm` (`grammar.bindings.ts`: `{ "1": field("match") }`).

**The spec settles the portable side.** The bindings spec's merged-kind rule: "The kind's interface names each member once, and each grammar's `bindings.scm` captures its own fields onto those names, reaching through any node the kind hoists." Python's case has no node that holds its pattern and guard together, so no `match` member can exist on `clause.case.match`. NO7's members stand.

**The conflict.** Both rulings name the slot that holds rust's match pattern, and they disagree:
- NO7 gives the arm no member for that slot. The arm's `pattern` and `guard` are read through it, and `pattern.match` goes.
- 2b gives the arm the member `match`, which holds the whole match pattern, and the parser field `match` derives from that member.

Under NO7, no member captures the arm's own field, so nothing derives `match`. The field would fall back to upstream's `pattern`. A capture that reaches through a nested node renames none of that node's fields: python's with item captures through `as_pattern`, which keeps `alias` and `expression`.

**What is open: rust's low-level field.**
- **(a) Keep `match`, authored in rust's grammar layer** instead of derived from a member. The low-level arm keeps `arm.match()`, with `.pattern()` and `.condition()` inside it, and its `value` becomes `body` (§5). The claims read through it: `(match_arm match: (match_pattern pattern: _ @pattern condition: _? @guard) value: _ @body) @clause.case.match`.
- **(b) Return to upstream's `pattern`.** In a bound build, `flattenSeatsOf` (`compiler/model/sub-factories.ts`) halts emission when a seated group's config key spells its seat's own name (`seatKeySpellsSeat`). The arm seats the match pattern in `pattern`, and the match pattern's keys are `pattern` and `condition`, so rust's regen halts. (b) also needs one of:
  - the arm's flat config for that seat dropped, so a build passes `pattern: matchPattern({ pattern, condition })`;
  - the refusal relaxed, though 2b made it strict.

  The low level reads `arm.pattern().pattern()`.

**Recommendation: (a).** It keeps the low-level name 2b chose for the same reason, keeps the strict seat rule, and leaves NO7's portable shape unchanged. The cost is one authored field name in rust's grammar layer, where none derives.

## 4. Grammar-binding edits the rulings need

The rulings fix these shapes, but nothing in `codegen/src/bindings` or the DSL makes them yet. Each changes a parse tree, so the stage measures each one's STATE and `parser.c` deltas, and the rows it moves, when it is written.

- **NO9:** python's `union_pattern` holds a flat `patterns` list; it is nested as pairs, `left` and `right`, as rust's or-pattern is.
- **ID2:** python's `dotted_name` holds a flat `names` list; it is nested as pairs, `qualifier` and `name`.
- **NO7:** python's case reads its patterns as one pattern, or as one tuple pattern without parentheses when there are several. This is a split of `case_patterns`.
- **ID4:** rust's `self` at the path sites is aliased into a kind that claims `identifier`. Like the `crate` alias, it needs no clones.

## 5. Expected low-level slot renames

A capture of the claimed node's own field onto a member name renames the field in the parser, its accessor, its `$with` setter and its factory key. The fields below are those in each grammar's `node-types.json`.

- **rust:**
  - the three arm kinds: `value` → `body`; `match` as §3 decides;
  - `scoped_identifier`, `scoped_type_identifier` and `scoped_type_identifier_in_expression_position`: `path` → `qualifier`;
  - `tuple_struct_pattern`: `patterns` → `fields`.
- **typescript:**
  - `nested_identifier`: `object` → `qualifier`, `property` → `name`;
  - `nested_type_identifier`: `module` → `qualifier`.
- **python:**
  - `case_clause`: `consequence` → `body`; `case_patterns` → `pattern` with the split (§4);
  - `keyword_pattern`: `value` → `pattern`;
  - `splat_pattern`: `name` → `pattern`. Its `operator` field stays a parser field with no member;
  - `class_pattern`: `name` → `type`, `arguments` → `fields`;
  - `member_type`: `base_type` → `qualifier`;
  - `union_pattern` and `dotted_name` take their pair fields from §4's edits.

Each is to be confirmed by the derivation on the change, as 2b's were.

## Questions

1. **Rust's match arm field.** Under NO7, keep the low-level field `match` as an authored name in rust's grammar layer (a), or return it to upstream's `pattern` and give up the arm's flat config for the match pattern (b)? Recommended: (a).
