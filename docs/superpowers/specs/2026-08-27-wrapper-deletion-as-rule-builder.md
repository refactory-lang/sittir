# Wrapper-deletion as a rule builder

**Status:** ready to implement · **Phase:** normalize · **Gate:** byte-identical

## The rule

A phase transform that reshapes the rule tree is a **re-evaluation of the tree
through a set of rule builders**, not an edit of the tree. A fact is a
parameter of the builder that creates the node. Nothing is pushed down, read
back off a node's shape, or carried in an accumulator: the walker rebuilds
bottom-up, so every builder receives an already-finished input and looks
exactly one level down.

**A builder owns pattern recognition against its own contents, and nothing
else.** It looks one level down, decides every attribute of the node it
returns, and never leaves a value unset in anticipation that the builder
above will fill it in or change it. A parent may *transform* a finished
child (`seq` folding an optional literal into a neighbour's separator);
a child never *defers* to a parent. Undefined means "not applicable",
never "to be decided later".

Every non-structural builder is one expression over its input:

```ts
optional(x)        → { ...x, multiplicity: combineMultiplicity('optional', x.multiplicity),
                        nonterminal: x.nonterminal || slotShaped(x) || undefined }
                     // slotShaped(x): x is a SYMBOL / SUPERTYPE / PATTERN
                     // (a reference) or a CHOICE / REPEAT / REPEAT1 (a union or
                     // a repetition). A literal is never a slot by itself. One
                     // level: x's own builder already stamped x.nonterminal for
                     // anything deeper. The unconditional form was tried and
                     // gated: it mints a slot for typescript's `optional('?.')`
                     // (`qmark_dot` on _type_query_subscript_expression) — a
                     // bare co-optional literal is deliberately not a slot.
repeat(x, sep?)    → { ...x, multiplicity: combineMultiplicity('array', x.multiplicity),
                        separator: sep ?? x.separator, nonterminal: true,
                        optionalElement: elided(x, sep) }
repeat1(x, sep?)   → same with 'nonEmptyArray'
field(name, x)     → { ...x, fieldName: name, nonterminal: true }
alias(x, value, named)
                   → { ...x, aliasedFrom: value, aliasNamed: named, inline: false,
                        nonterminal: x.nonterminal || named || undefined }
token(x)           → { ...x, tokenized: true }
token.immediate(x) → { ...x, tokenized: true, immediate: true }
prec(kind, n, x)   → { ...x, prec: { kind, value: n } }        // vocabulary only this step
variant(x) / group(x)
                   → the wrapper node survives (it is a kind boundary), attrs stamped on it
string / pattern / symbol / supertype / indent / dedent / newline
                   → leaves: returned as-is; the enclosing builder stamps them
```

**Rule identity is the current rule's, not the input's.** `id` is a fact
of the node being built: every builder stamps `id: rule.id ?? input.id`,
where `rule` is the wrapper it is replacing. A field's id is what
`slotByRuleId` resolves against — the collapse sites' `withAttrsFrom`
already carries the discarded wrapper's id onto the survivor for exactly
this reason — and spreading the input alone would keep the leaf's id and
lose the wrapper's, the gap `assemble.ts`'s back-compat name-matching walk
over raw `FieldRule` ids exists to paper over. Slots keep every id they
came from in `sourceRuleIds`, so nothing is lost at the slot level. With
the id threaded through the builder the back-compat walk is dead, and it
is removed in this step: `slotByRuleId` must resolve every `FieldRule` id
from `sourceRuleIds` alone (`DBG_SLOT_MISS=1` reports zero misses across
all three grammars, same as before the removal).

Three composition rules, and only three:

| attribute class | rule | attributes |
|---|---|---|
| composing | through the lattice `combineMultiplicity(outer, inner)` | `multiplicity` |
| identity | the outer builder writes unconditionally (applied last ⇒ wins) | `fieldName`, `aliasedFrom`, `aliasNamed`, `separator` |
| flag | OR-ed, monotone | `nonterminal`, `tokenized`, `immediate`, `inline:false` |

These reproduce every "outer wins" `??` and special case in today's
`deleteWrapperWith` — `optional(repeat1(x))` → `array` is just
`combine('optional','nonEmptyArray')`; `field('a', field('b', x))` → `a`
because `a` is applied last — without any of them being written down.

## Structural builders

`seq(members, mult?)` — receives finished members. Splices a bare nested seq
(`isSpliceableBareSeq`), then applies the enclosing multiplicity to each
slot-bearing member through the lattice (`nonEmptyArray` relaxes to `array`
per member: the at-least-one guarantee is the seq's, not each member's), and
retains the multiplicity on the seq node itself only when a bare literal
member is present (the co-optional-delimiter guard). Both rules are `seq`'s
own semantics and live in its body.

**Splicing is `seq`'s own recognition, at every level.** A bare nested seq
(`spliceableMembersOf`, today's `isSpliceableBareSeq`) is redundant
nesting by definition — seq is associative — so `seq` splices such a
finished member in, and does so at every level because every level is a
`seq`. The previous walk spliced once, top-down, and never re-examined
what its own splice exposed; that was a traversal quirk, not a rule about
sequences, and a top-down pre-pass reproducing it is not kept. Where the
full flattening changes `node-model.json5` (typescript's `number`, a
three-deep chain) the change is accepted only if it is render-inert: the
validator numbers and the rendered templates stay byte-identical.

**`seq` does not recognize separators in this step.** By normalize every
optional literal is already one of three finished things: lifted by link
into a neighbour's `separator` (gone from the members); promoted by the
grammar to a slot (arrives as `FIELD`, which `field` stamps — python's
`for_in_clause` trailing comma — and which a field-level list may not
absorb, as `emitFieldCarryingFactory` enforces); or a bare `STRING` with
`multiplicity: 'optional'` and no `nonterminal`, a co-optional literal the
seq-level multiplicity guard renders conditionally. Separator possession
moves into `seq` when the lift itself moves (see the recognizers spec),
not as a second decider alongside link.

`choice(members)` — finished members; no attrs of its own.
`detectSelfReferentialFold` is grammar-shape recognition, not construction:
it stays a named pre-step on the rule's own top-level body, keyed on
`ownName`, exactly as today.

## What changes

- `dsl/rule-transforms.ts` — `RuleBuilder` gains `alias`, `token`,
  `token.immediate` (spell as `tokenImmediate`), `prec`, `variant`, `group`,
  and the leaf constructors; `structuralBuilder` builds the wrapper nodes for
  each (byte-identical to hand literals, as now).
- `compiler/simplify.ts` — `attributeBuilder` implements every constructor as
  the one-liner above. Its current `optional`/`repeat`/`field` bodies, which
  delegate to `deleteWrapper`, are replaced: `deleteWrapper` becomes a
  consumer of `attributeBuilder`, not the other way round. Simplify's three
  `ctx.builder` call sites do not change.
- `compiler/wrapper-deletion.ts` — `deleteWrapperWith` + `WrapperAttrs` +
  `stampAttrs` + `carrySeparatorForward` are deleted. `deleteWrapper(rule,
  ownName)` becomes: fold on `ownName` if it matches, then
  `walker.map(rule, node => rebuild(node))` where `rebuild` is one exhaustive
  `switch (node.type)` calling the matching `attributeBuilder` method with
  the node's own parameters (`name`, `value`, `named`, `separator`, …) and
  its already-rebuilt content/members. `applyWrapperDeletion` keeps its shape
  (`fuseHeadRepeatLists(deleteWrapper(rule, name))`).
- `RuleBase` — gains `prec?: { kind: 'left'|'right'|'dynamic'|undefined;
  value: number|string }` on the normalize view. Link keeps consuming PREC
  wrappers this step, so the attribute is reachable but unpopulated in
  production; the builder is complete without the pipeline yet routing
  through it.

No other file changes. Link's `resolveRule` TOKEN/ALIAS/PREC cases are
untouched in this step.

## Gate (all byte-identical to the baseline commit)

1. `packages/{rust,typescript,python}/src/node-model.json5` — `git diff`
   empty after regenerating all three grammars (separately).
2. `sittir validate history` — rust `146/146 · 208/208 · 134/137 · 1519/1519`,
   typescript `142/143 · 194/194 · 112/114 · 1202/1202`, python
   `122/122 · 142/142 · 115/116 · 1385/1390`. Numbers compared, not eyeballed.
3. Unit tests that pin the OLD internal mechanism (`wrapper-deletion*.test.ts`,
   `simplify-*.test.ts`, `rule-attributes.test.ts`) are updated to the new
   one — they are not the invariant, the generated output is. Any assertion
   changed is listed in the report with the rule it now pins. Full
   `pnpm test` otherwise green except the two known `examples/01` WIP cases.
4. `pnpm run type-check` at the 49-error baseline (all pre-existing, none in
   touched files).
5. `SITTIR_TRACE=_block_comment_content,_let_chain` on rust: the normalize
   dump is byte-identical before/after (the self-referential fold and the
   aliased-external cases).

A moved number under a supposed no-behaviour-change edit is a finding, not
something to patch around: stop and report it with the diff.
