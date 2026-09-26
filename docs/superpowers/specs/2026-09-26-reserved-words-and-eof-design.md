# Reserved words and `eof()`: DSL support, typescript on javascript 0.25, inferred reserved sets

## Goal

Sittir models tree-sitter's reserved-word machinery and the `eof()` rule the same way tree-sitter does, in both
pipelines. Every grammar ends up with a declared reserved set:
- python: already declared upstream;
- typescript: inherited from tree-sitter-javascript 0.25;
- rust: inferred by enrich.

The identifier guard (alias-identity Task 7d) reads that one fact and rejects a reserved word a slot does not
admit.

## Facts this rests on

- **tree-sitter-cli 0.26.9** (the pinned version) supports:
  - the grammar field `reserved: { <wordset>: $ => [rule, …] }`;
  - the rule `reserved(wordset, rule)` → `{ type: 'RESERVED', context_name, content }`, which overrides the
    global wordset for one rule.
- **`eof()`** → `{ type: 'EOF' }` exists from **tree-sitter-cli 0.27.0**:
  - it matches end of input;
  - it may only be the final symbol of a (possibly nested) sequence;
  - choice branches that continue past it are dropped;
  - it is not allowed inside `token()`.
- **Upstream grammars at their latest versions:**

  | grammar | version | `reserved` |
  | --- | --- | --- |
  | python | 0.25.0 | `global` (35 words) |
  | javascript | 0.25.0 | `global` (35), `properties` (empty) |
  | typescript | 0.23.2 (latest and master) | none; depends on `tree-sitter-javascript ^0.23.1` |
  | rust | 0.24.0 (master 0.24.2) | none |

- **Sittir today:**
  - `wire()` passes `reserved` through to tree-sitter (`renamingReserved`), so the parser has python's set;
  - sittir's own `evaluate()` drops `reserved`, so the model never sees it;
  - neither pipeline knows `RESERVED` or `EOF` rules.
- **Typescript on javascript 0.25** (spike, upstream typescript 0.23.2 with javascript forced to 0.25.0):
  - typescript inherits javascript's `reserved.global` through `grammar(base, …)` (`global: 35` in the generated
    grammar.json);
  - generation stops on javascript 0.25's `using` declarations, which conflict with typescript's
    `variable_declarator` definite-assignment `!`;
  - adding that conflict surfaces a second one, `assignment_expression` vs `_initializer`.

## Design

### 1. tree-sitter-cli 0.27.0

- Bump `tree-sitter-cli` to `^0.27.0` everywhere it is pinned.
- Regenerate all five grammars at the ABI the crates use.
- Parser tables may move. Generated sittir output, validate rows and parity fixtures must hold, and any move is
  reported before it is accepted.

### 2. `reserved` and `eof()` in the DSL and the model (both pipelines)

**Grammar field:**
- `RawGrammar.reserved?: Readonly<Record<string, readonly Rule<'evaluate'>[]>>`: wordset name → its members as
  rules, in declaration order, verbatim from the grammar (the same fact as grammar.json).
- `wire()` keeps renaming it for tree-sitter.
- It is carried unchanged through link to the linked grammar and the node map.
- `evaluate`'s `reserved` must equal `.sittir/src/grammar.json`'s, which is the dual-pipeline test.

**Word-set helper:** one helper turns a wordset into its words:
- STRING members contribute their text;
- SYMBOL members contribute their catalog `literalText`;
- a member with neither is a compile-time diagnostic (`reserved-member-not-literal`).

This is the only reader. The identifier guard and enrich's inference (section 4) both use it.

**`reserved(wordset, rule)`:**
- a new rule type in evaluate's DSL, and in the rule model as `ReservedRule { type: RESERVED; contextName; content }`;
- it is transparent to structure: link, simplify, assemble and every emitter see through it to `content`, exactly
  as they see through `token.immediate` for slot purposes;
- its only model effect: a slot whose value sits under `reserved(ctx, …)` records `reservedContext: ctx` (a slot
  fact), and the identifier guard reads that wordset instead of `global` for that slot.

**`eof()`:**
- a new rule type in evaluate's DSL, and `EofRule { type: EOF }` in the rule model;
- it contributes no slot and no render text: the template renders nothing for it;
- a sequence ending in `eof()` is still that sequence for modelling;
- evaluate rejects the misuses tree-sitter rejects: not final in its sequence, or inside `token()`. Each gets a
  diagnostic naming the rule.

**Grammars:** no grammar uses either rule today. A test grammar per rule pins evaluate == grammar.json and a model
that ignores both structurally.

### 3. typescript on tree-sitter-javascript 0.25

- **No vendoring:** a pnpm override points tree-sitter-typescript's javascript dependency at `0.25.0`
  (`pnpm.overrides["tree-sitter-typescript>tree-sitter-javascript"]`). Typescript keeps extending javascript
  through its own `require`, and inherits `reserved.global`.
- **Conflict porting:** in `packages/typescript/grammar.sittir.ts` (`conflicts` / precedences), one conflict at a
  time. The known ones are `using`-declaration `variable_declarator` vs `primary_expression`, then
  `assignment_expression` vs `_initializer`. Each resolution follows tree-sitter's suggestion that keeps both
  readings valid (a declared conflict), not a precedence that drops a reading, unless a corpus test shows the
  dropped reading is invalid typescript.
- **Behaviour moves are expected.** javascript 0.23 → 0.25 adds syntax (`using` declarations and whatever else
  0.24/0.25 changed). Every move is reported per kind:
  - new kinds;
  - changed rule bodies;
  - corpus entries gained or lost;
  - validate rows, fixtures, ir paths.
  Accepted moves tighten the baseline.
- **The upstream corpus follows:** typescript's pinned corpus stays typescript's. The javascript corpus is not
  added.

### 4. enrich infers reserved sets where upstream declares none

For a grammar whose upstream declares no `reserved` (rust today), enrich derives one from the grammar's own
patterns and injects it pre-generate, so it reaches the parser and the model alike:

- **`reserved.global`:** the word-shaped keyword literals the grammar uses as keywords, i.e. literal STRING members
  whose text matches the grammar's `word` token, minus every keyword the grammar also admits as an identifier:
  - a keyword that appears inside an alias to the word kind (the `_reserved_identifier` pattern: a choice of
    keyword literals aliased or referenced where `identifier` is expected);
  - a keyword that appears as a sibling arm of `identifier` in a choice.

  Those admitted keywords are exactly what tree-sitter would stop lexing as identifiers if they were reserved.
- **Contextual `reserved()`:** where the grammar admits a subset of keywords in one position (e.g. rust
  `_reserved_identifier` arms at an identifier site, or macro fragment names), enrich wraps that position in
  `reserved(<ctx>, …)` with a wordset of `global` minus the admitted keywords. This is only emitted when the
  position's admitted set differs from `global`.
- **Proof of soundness:**
  - the generated parser with the injected sets must parse every upstream corpus entry the parser without them
    parsed, with identical trees;
  - any tree difference stops the inference for that grammar, and the grammar keeps no set;
  - a report lists each inferred wordset and each injected context.
- **Grammars with a declared set** (python, typescript after section 3) keep it verbatim; enrich does not add to
  it.

This inference is a DSL-layer synthesis (enrich), so it runs in both pipelines: tree-sitter's generate and
sittir's evaluate see the same sets.

### 5. Direction beyond this spec: the reserved-identifier pattern becomes a reserved rule

Long term, the hand-rolled "keywords that may still be identifiers" pattern is recognised structurally and
rewritten to the tree-sitter mechanism built for it:
- the pattern is a hidden choice of keyword literals aliased to (or offered beside) the word kind, like
  typescript/javascript/rust `_reserved_identifier`;
- enrich pattern-matches it into a `reserved(<ctx>, …)` rule over a wordset;
- reserved sets then get their own handling in the model and the surface, so an identifier slot's admitted and
  rejected words come from the wordset, not from alias arms.

That work is not scheduled here. Sections 2 and 4 are designed so it lands without reshaping them:
- the wordset helper is the only reader of reserved sets;
- `reservedContext` is the only slot fact;
- enrich's inference is the only place reserved sets are synthesized.

It gets its own spec when it's picked up.

## Model additions (for design review)

1. `RawGrammar.reserved`, carried to the linked grammar and node map: a verbatim mirror of tree-sitter's grammar
   field.
2. `ReservedRule` and `EofRule` rule types, mirroring tree-sitter's `RESERVED` and `EOF`.
3. `reservedContext` on a slot: the wordset name governing that slot's identifier values when a `reserved()`
   wraps it.

There is no annotation, and no compiler branch on anything but these rule types and facts.

## Order

1. CLI 0.27 upgrade (its own PR; every gate holds or moves are reported).
2. `reserved` field + helper + `ReservedRule`/`EofRule` (the Task 7d prerequisite; Task 7d's python guard can land
   on the field alone).
3. typescript repoint and conflict porting.
4. enrich inference for rust (and any future grammar without a declared set).

## Gates

For each step:
- validate history row by row against `native.json`;
- parity fixtures;
- the full suite;
- workspace type-check and lint;
- cargo `--workspace`;
- the phantom and hand-rule ceilings.

Steps 3 and 4 move behaviour by design. Their moves are listed per kind and accepted explicitly before the
baseline tightens.

## Risks

- **javascript 0.24/0.25 changes beyond `using`** may need more typescript porting than the two known conflicts.
  Measure the full list before committing to step 3.
- **Over-reserving in step 4** would make valid identifiers unparseable. The corpus-equality proof is the guard,
  but a corpus that never uses a keyword as an identifier cannot catch it. The report must list every inferred
  word so a reviewer can check the language's actual reserved list.
- **`eof()` is unused** by any grammar today. Its support is justified by the upgrade and by enrich/grammar authors,
  and pinned by test grammars only.
