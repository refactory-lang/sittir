# Rule pattern recognizers — one catalog, one shape

**Status:** step 1 (the catalog) landed for the shared recognizers —
`dsl/rule-patterns.ts` holds terminality, the enum/spliceable-seq
predicates, separated-list detection, group classification and the
self-referential fold; `list-patterns.ts`, `group-classify.ts` and
`compiler/rule-catalog.ts` are gone. Enrich's private helpers are the
remaining inventory. · **Depends on:** wrapper-deletion as a rule builder
(`2026-08-27-wrapper-deletion-as-rule-builder.md`) · **Feeds:** routing
link's `resolveRule` through the builders · **Gate:** byte-identical

## The rule

A builder owns pattern recognition against its own contents — and
recognition is not a question answered for someone else, it is a
**rewrite of the contents**. A recognizer is a transformer over a
builder's finished children:

```ts
transform(children: readonly Rule[]): readonly Rule[]      // for seq / choice
transform(child: Rule): Rule                                 // for a single-content builder
```

```
[seq(x…), seq(y…)]            → [x…, y…]                       spliceBareSeqs
[…, choice(field a, field b), …] → choice([…a…], […b…])          distributeExclusiveFields
[repeat(x){array}, ',']       → [x{array, separator: ','}]     absorbSeparatorLiteral
[seq(f,'&&',g), …] on own name → chain-folded arms              foldSelfReferentialChain
```

A transformer returns its input unchanged when the pattern is not present
— that is what "not applicable" means, and nothing is handed upward for
a parent to interpret. It looks **one level down**: at the children and
the attributes their own builders already stamped. A builder is then
`construct(compose(transformers)(children))`, and a phase's builder set
is that phase's list of transformers. Enrich's passes are the same kind
of thing (`distributeExclusiveFieldChoices` already is one); they stop
being a separate species.

No pass hand-rolls a `type === … && members.length === 3` again; a shape
that matters is a named transformer or it is not a shape. A boolean
predicate survives only as the guard inside a transformer.

Module: `dsl/rule-patterns.ts`, next to `rule-transforms.ts` (the builders)
and `rule-walker.ts` (the traversal). dsl-side, so enrich, normalize and
link all import the same module; compiler → dsl is the allowed direction.

## Multi-level recognition composes; it does not look deeper

Some current recognizers read two levels. Under bottom-up rebuilding they
must not: the inner level's transformer has already rewritten its own
pattern into the node it built — a stamped attribute, or a shape that
says what it is — so the outer transformer matches on the child's result,
not on the grandchildren. Where a table row below says "stamps a fact",
read: the inner transformer's output carries it.

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

## Motivating consumer: separator possession moves from link into `seq`

Today link lifts separators in a pass that reaches into shapes
(`liftSeparators`, `liftCommaSep`, `absorbTrailingSeparator`,
`absorbSuffixSeparatedList`), and normalize's `fuseHeadRepeatLists` fixes
up what that pass left split. Under the builders the same fact is decided
where it is created:

```
seq(repeat(x), ',')          repeat builds { ...x, multiplicity: 'array' }
                             seq sees a finished list-shaped member next to a
                             literal and stamps { ...x, multiplicity, separator }
```

`repeat` decides multiplicity from its content; `seq` decides possession
from its contents — a member carrying a collection multiplicity, adjacent
to a literal — one level down each. The literal is folded into that
member's `separator` (`leading` / `trailing` by position, `terminated` for
the `(x sep)+ x?` family) and dropped as a member.

What this has to respect:

- **Enrich needs separator facts before tree-sitter runs.** Separated-list
  *naming* (the `_elements` mints, `collectSeparatedListNameProposals`)
  happens in the DSL layer, which executes in both pipelines, so that
  detection cannot move to normalize. It is the same recognizer,
  `separatorOf`, called twice: by enrich for naming, by `seq` for
  possession. One derivation, two call sites — today there are two
  derivations.
- **A promoted delimiter is a slot, not a literal.** Python's
  `for_in_clause` trailing comma arrives at `seq` as a `FIELD`; `seq` sees
  a slot beside the list and does not fold. That is
  `emitFieldCarryingFactory`'s "a field-level list may not own a flank
  delimiter" stated once at the producer instead of enforced at the
  consumer.
- **Link-phase consumers of the lifted `separator`** — the lift functions
  above and normalize's `fuseHeadRepeatLists` — move with it into
  `seq`/`repeat` or become recognizer calls. Inventory them before the
  move; the first implementation of each recognizer is the link function
  relocated, not rewritten.

This is what the memory records as "SSOT flip blocked on the lift move":
moving the lift is what unblocks separator ownership. It lands as its own
step after the catalog, gated byte-identical; a kind where link and the
builder disagree is one of the separator-possession family and gets its
own diagnosis rather than a reconciliation inside the pass.

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

Land after the wrapper-deletion builder PR is green, in three gated steps:

1. **The catalog** — recognizers moved and renamed, call sites swapped,
   byte-identical.
2. **Link's `resolveRule` through the builders** — its TOKEN / ALIAS /
   PREC cases are the sites that need `tokenized`, `aliasedFrom` and
   `prec` as builder-stamped facts rather than push-down; the
   wrapper-deletion TOKEN case (left structural because `collect-slots`'
   `AssembledToken` still reads the wrapper node) is wired here.
3. **Separator possession into `seq`** — the section above; the lift
   functions relocate into recognizers, `fuseHeadRepeatLists` goes with
   them.
