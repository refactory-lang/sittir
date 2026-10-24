# Vocabulary synonyms 4a census

The wiring plan's stage 4a census (`docs/superpowers/plans/2026-10-10-grammar-bindings-wiring.md`, "Stage 4: vocabulary synonyms", "Census first"), taken on master bdb91f902. 4a adds the synonym tables, canonicalizes claims where they are read, adds the collision rule to `vocabulary-features --check`, and rewrites the three `bindings.scm` files into their languages' words. Its gate is that every generated file stays byte-identical.

**How it was measured.** `run.sh [commit]` exports the vocabulary, the three `bindings.scm` files and each grammar's `grammar.json` and `node-types.json`. It reuses the synonyms probe's census and collision report (`../2026-10-12-vocabulary-synonyms/`) with the probe's ruled tables and none of its renames, so the vocabulary is checked as it stands. `attribute.py` finds where each grammar spells each synonym, and `rewrites.py` gives each claim line's rewrite. The results are in `results/`.

## 1. The tables

The tables are the probe's ruled ones (`proposal.json` `levels`): 11 levels, 61 canonical segments, 87 synonyms. The flags' table is empty (NT11), and the ten excluded words (NT10) are in no table.

Every canonical segment has a position in today's vocabulary except one: `identifier.qualified`, whose synonyms are `dotted`, `nested`, `scoped` and `path`. ID2's rename, which collapses `identifier.dotted`, `.nested`, `.scoped`, `type.path` and `type.path.expression` into it, has not landed (section 4).

## 2. The collision rule

Against the vocabulary as it stands (`results/collisions-as-is.txt`), 120 synonym positions were checked.

- **One collision:** `identifier` has no segment `qualified` for its synonyms.
- **Seven notes,** each legal, since canonical names resolve first at every position:
  - `try` is a synonym of `propagate` and the canonical segment of `expression.block.try` (the probe's note);
  - `arm` is a synonym of `case` and canonical in `clause.match.arm`;
  - `dotted`, `nested` and `scoped` are synonyms of `qualified` and canonical in `identifier.dotted`, `.nested` and `.scoped`;
  - `dictionary` and `splat` are synonyms of `map` and `rest` and canonical in `pattern.case.dictionary` and `pattern.case.splat`.

  Every note but `try` comes from a rename that has not landed (section 4).

With the `qualified` row withheld (question 2), the collision goes, and so do the three notes on its synonyms.

## 3. The claims each grammar rewrites into its words

**The rule.** A claim segment is rewritten into a synonym when the claim's own line spells that synonym: as a word of a kind name in its pattern, or as a string in a predicate. Each segment takes at most one synonym, and no line spells two candidates for one segment. A word the grammar spells only elsewhere does not count (question 1).

| grammar | claim lines | distinct paths |
| --- | --- | --- |
| python | 31 | 31 |
| rust | 96 | 64 |
| typescript | 25 | 25 |

The full list, with line numbers, is `results/rewrites.txt`. By word:

- **python:** `keyword` (argument), `except`, `elif`, `splat` (elements, patterns and types, with `dictionary` where the kind is a dictionary splat), `augmented` (14 operators), `attribute` (member access and member calls), `dictionary` (the dictionary display and comprehension), `none`, `pass`, `raise`.
- **rust:**
  - `crate` for `internal` (every `pub(crate)` refinement, `modifier.visibility.public.internal`, and `statement.import.package`, which becomes `statement.import.crate`);
  - `variant` for `enum_member` (15 paths);
  - `mod` for `module` (with `declaration.module.foreign` becoming `declaration.mod.foreign`);
  - `impl` for `extension`;
  - `use` for `import`, on `use_declaration` only, since the extern crate claim spells `crate`, not `use`;
  - `self` for both receiver claims and `identifier.receiver`;
  - `gen`, `field` (member access and member calls), `scoped` for the qualified call, `array` (array expressions), `slice` (slice patterns), `closure`, `try` (the `?` expression), `index`, `char` (the literal), and `bool`, `char` and `str` for the primitive types.
- **typescript:** `constraint`, `this` (the receiver parameter and `identifier.receiver`), `augmented` (15 operators), `new`, `array` (array expressions and patterns), `ternary`, `arrow`, `template`, `maybe` (`flow_maybe_type`).

**Words each grammar spells only elsewhere, not rewritten** (`results/attribution.txt`, rows marked `grammar`):

- python's f-string prefix (`f` for `interpolated`): the claim matches the prefix with `#match?`, and no token or kind name spells it;
- python's `slice` (for `pattern.list`), `dict`;
- rust's `attribute`, `path`, `base`, `extern` and `array` (for `pattern.list`);
- typescript's `self`, `initializer` (for `constructor`), `arm` (for its switch cases), `index`, and `attribute`, `field` and `property` (for `member`).

**What the rewrite does not change.** The reader canonicalizes each claim as it reads it, so the rewrite changes only the `bindings.scm` sources. `grammar.bindings.ts`, `augment.ts`, `flags.ts`, the node models, `portable.ts` and the inventory's output stay byte-identical. That is 4a's gate.

## 4. Finding: 27 ruled renames have not landed

The synonyms probe's rulings (2026-10-12) rename 73 paths. Of those, 27 old paths are still in the vocabulary, 25 of them claimed:

- **NO7:** `clause.match.arm`, `.arm.last` and `clause.match` into `clause.case.match`, with `pattern.match` hoisted. Bindings 2b has since renamed the arm's member to `match` on `Clause.Match.Arm` and `Arm.Last`, so NO7 needs reconciling with it.
- **NO8, NO9:** `pattern.as`, and the eight `pattern.case.*` kinds into `pattern.list`, `.tuple`, `.or`, `.rest`, `.map`, `.struct`, `.struct.field` and `.complex`; `pattern.tuple.struct` into `pattern.struct`.
- **ID1:** `identifier.type`, `.field`, `.property` and `.property.shorthand` into `identifier`.
- **ID2:** `identifier.dotted`, `.nested`, `.scoped`, `type.path` and `type.path.expression` into `identifier.qualified`.
- **ID4:** `identifier.crate` into `identifier`.
- **ID8:** `type.named` and `type.named.prelude` removed.

Each changes portable kinds and the captures that fill them, so it is not part of 4a, whose gate allows no generated byte to move. It is an open vocabulary stage of its own, with its own census.

## Questions

1. **The attribution rule.** A segment is rewritten only where the claim's own line spells the word. Accept, or widen it to words the grammar spells anywhere, which would add the rows in section 3's second list?
2. **The `qualified` row.** Withhold `identifier: qualified → dotted, nested, scoped, path` from 4a's tables until ID2's rename gives it a position, so `vocabulary-features --check` passes. Accept?
3. **Python's f-string.** By the rule, `literal.string.interpolated` stays canonical in python, since `f` is matched only by a regex. Keep it canonical, or rewrite it as `literal.string.f` by hand?
4. **The 27 renames.** Take them as a stage after 4a, with a census, reconciling NO7 with 2b's `match`?
