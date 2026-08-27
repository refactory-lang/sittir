# Rule pattern recognizers — one catalog, one shape

**Status:** written up, not started · **Depends on:** wrapper-deletion as a
rule builder (`2026-08-27-wrapper-deletion-as-rule-builder.md`) · **Feeds:**
routing link's `resolveRule` through the builders · **Gate:** byte-identical

## The rule

A builder owns pattern recognition against its own contents. The
recognizers are therefore the builders' vocabulary, and they live in one
place with one shape:

```ts
recognize<Fact>(node: Rule): Fact | undefined
```

Every recognizer is named for the **fact it recognizes**, returns that fact
or `undefined` (not applicable), and looks **one level down** — at the
node and the already-built attributes of its direct children. A boolean
predicate is the degenerate case (`Fact = true`). No pass hand-rolls a
`type === … && members.length === 3` again; a shape that matters is a
named recognizer or it is not a shape.

Module: `dsl/rule-patterns.ts`, next to `rule-transforms.ts` (the builders)
and `rule-walker.ts` (the traversal). dsl-side, so enrich, normalize and
link all import the same module; compiler → dsl is the allowed direction.

## Multi-level recognition composes; it does not look deeper

Some current recognizers read two levels. Under bottom-up rebuilding they
must not: the inner level has already recognized its own pattern and
**stamped the fact** on the node it built, so the outer recognizer reads
the child's fact, not its shape.

| today | reads | becomes |
|---|---|---|
| `detectSelfReferentialFold` (wrapper-deletion, private) | choice → each seq → `[field, STRING, field]` + self-ref symbol | `seq` stamps `chainArm: { base, separator, extension, selfRef }` when it recognizes the 3-member shape; `choice` recognizes `selfReferentialFoldOf` from members' `chainArm` facts |
| `separatedListBodyInfo` (enrich, private) | seq → nested seq → repeat + flank | `seq` recognizes `separatedListOf` from a member already stamped as a repeat with `separator`, plus its own flank literals |
| `exclusiveFieldChoiceBranches` (enrich, private) | choice → each member FIELD, distinct names; also derefs a hidden symbol to its choice | `choice` stamps `exclusiveFields: [names]` when every member is a single distinct field; the hidden-symbol deref is `symbol`'s recognizer resolving its target's stamped fact |
| `armsDifferOnlyByLiteralChoice` (enrich) | choice → each seq → position-wise compare | `seq` stamps its literal positions; `choice` compares members' facts |

The rewrite rule is mechanical: **whatever a recognizer reads below its
direct children is a fact the child's builder should have stamped.**

## Inventory to fold

Shared today, moved as-is (renamed to the fact they return where the name is
a predicate on a shape rather than a fact):

| from | recognizer | fact returned |
|---|---|---|
| `dsl/list-patterns.ts` | `detectRepeatSeparator` | `separatorOf(repeat) → SeparatorFact` |
| | `firstStringOfChoice` | `leadingLiteralOf(choice) → string` |
| | `separatorFactsEqual`, `rulesEqual` | equality — stays a utility, not a recognizer |
| `dsl/group-classify.ts` | `ruleMatchesEmpty` | `matchesEmpty(rule) → true` |
| | `isInlineSafe` | `inlineSafeSlotOf(seq) → the single slot` (the fact is *which* slot) |
| | `isSupertypeLike` | `supertypeMembersOf(choice) → names` |
| | `isPermutationChoice` | `permutationArmsOf(choice) → arms` |
| `types/rule.ts` | `isSpliceableBareSeq` | `spliceableMembersOf(seq) → members` |
| | `isEnumChoiceRule` | `enumMembersOf(choice) → literals` |
| `compiler/rule-catalog.ts` | `isNonterminalRuleType` | `nonterminalOf(rule) → true` |
| `types/runtime-shapes.ts` | `isPrecWrapper`, `isWrapperType`, `isContainerType` | type-tag classifiers — stay where they are; they classify the *type field*, not a pattern over contents |

Private today, promoted to the catalog (the four in the table above plus
`peelOptional*`, `optionalStringLiteral`, `listSeparatorOfOptionalSeq`,
`armStartsWithSymbol` from enrich).

## What does NOT change

- Builders (`structuralBuilder` / `attributeBuilder`) keep their contract;
  they gain calls into the catalog and lose inline shape tests.
- Enrich's passes keep their order and their mints; only their shape
  tests are replaced by catalog calls.
- No recognizer changes what it recognizes. Renames are name-only.

## Gate (byte-identical, the only invariant)

1. `node-model.json5` / `types.ts` / `factories.ts` diff empty across all
   three grammars, regenerated separately.
2. `validate history` numbers exact (baseline recorded at dispatch time).
3. `SITTIR_TRACE` dumps identical for: `_block_comment_content`,
   `_let_chain` (self-referential fold), `line_comment` (exclusive fields),
   python `_parameters` (separated-list body), typescript `_semicolon`
   (permutation/empty-match).
4. Unit tests that pin the old predicate names or private helpers are
   updated to the catalog; every changed assertion is listed with the fact
   it now pins. A moved output byte is BLOCKED, never adapted around.

## Sequencing

Land after the wrapper-deletion builder PR is green. Do it as the first
half of routing link's `resolveRule` through the builders: link's TOKEN /
ALIAS / PREC cases are exactly the sites that need `tokenized`,
`aliasedFrom` and `prec` as builder-stamped facts rather than push-down,
and they need the catalog to recognize what they are consuming.
