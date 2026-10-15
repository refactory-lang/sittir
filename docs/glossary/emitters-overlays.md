# `packages/codegen/src/emitters/overlays` — Function Glossary

Per-function reference for `packages/codegen/src/emitters/overlays/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `packages/codegen/src/emitters/overlays/polymorphs.ts::PolymorphWires.bundledKinds`

```text
/** Kinds the bundle exports, so their overlay entry carries a `strict` of its own. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::PolymorphWireSet.forwarded`

The elements seats a forwarding owner takes from its list (`forwardedSeatsOf`): the owner's builder forwards its arguments to the raw list builder, which takes built elements only, so an owner whose list seats a group must build a config element itself before forwarding. The owner's entry applies the same seat method the list's entry does, over the owner's own raw builder and coercer; a seat config is replaced by the built group and every other argument (a built list, an options bag, built elements, nothing) passes through to the owner unchanged, so the owner's dispatch is not restated here. Its parameters are the owner's argument rows (`T.<Owner>.BuildArgs`; on the loose side also the coercer's own direct parameter), which already union the list's.

An owner with a registered slot is not a list spread target (`listSpreadTarget`), so it has none.

The owner's raw builder does not refuse a seat config: it is not exported from the package, and the public `build.<owner>` is this entry.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatCount`

How many seats an entry carries, of every kind: flatten, elements, tuple and forwarded. `seatBearing` reads it, so a forwarding owner with forwarded seats is itself reached through its entry by its parents.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatBearing`

```text
/**
 * A child whose own overlay entry carries seats must be reached through that
 * entry, not its raw builder: the raw builder takes the unseated shape, so a
 * mount or seat wired to it would hand a seated argument (a group's config, a
 * tuple) straight to a slot that cannot take it. A seat is also what puts a
 * `strict` on the entry: a wire set of arms alone is a bare mount namespace
 * with none, and a leaf has no `strict` at all because its strict and loose
 * forms are one.
 *
 * A child in a cycle with its parent cannot be declared first, so it keeps
 * its raw builder: the seated form has no spelling that would resolve there.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::walkArms`

```text
/** Every arm entry a kind emits, nested ones included, with the key path each sits at. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeAcrossSlots`

```text
/**
 * Arms of one slot chain onto arms of another. A kind with two arm-seated
 * slots has to name both in one call — python `except a, b:` needs the
 * exception's `list` and the suite's `block` — and each arm on its own is a
 * whole route wrapping the parent, so a caller could otherwise pick only one.
 * A later slot's arms are emitted again under each earlier arm, applied to it:
 * `ir.exceptClause.exception.list.block.strict(…)`. The applied route needs a
 * name, since a call expression has no `typeof` for the parameter types.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeSeats`

```text
/**
 * Fold a kind's seats onto its own factory and give the result a name. Every
 * mount route then builds on that name instead of the raw factory, so a mount
 * carries the parent's seats rather than dropping them: `case_clause` seats
 * its patterns as a tuple AND mounts its suite, and both spellings must work
 * in one call.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::shape`

#### body

```text
// The parent collapsed to a direct/value factory around some OTHER
// slot (a registered slot never counts toward that classification),
// so `ArgsOf<PF>[0]` is that slot's own value — not a config object
// this arm's key could ever have lived in. This arm's own key must
// itself be a registered slot, set only through the trailing
// options argument the parent factory now takes.
```

#### body

```text
// No key routes to the child, so the partition below would send
// every key to `rest` and hand the child an empty object. Say
// that directly instead of emitting a loop guarded by `false`.
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::tupleShape`

```text
/**
 * The method behind a tuple seat. The child's whole argument list rides the
 * parent's slot as an array, so a separated list keeps both its options bag
 * and its elements. An already-built child still passes through: an array in
 * that slot is the seated form, anything else is the parent's own input.
 */
```

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::emitPortableNodeModel`

`node-model-portable.json5`: a bound grammar's routes (`bindings/routes.ts::GrammarRoutes`), written beside `node-model.json5` and kept out of it, since the low-level model never reads them. Per kind, in kind order: the vocabulary kind it reads as by default; its read entries, most specific first, each with its placement, pins, compiled test (`read-tests.ts::readTestOf`) and template; its members, each with its route and build path (`null` where a member cannot be built back); and its container unwrap. A slot is written by name; the slot itself is in `node-model.json5`. After the kinds, the `namespaces` section (`namespaces.ts::namespaceSection`). The pins stay beside the test because a build reads them; the predicates do not, since the test is their only reader-side form.

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::readEntryRecord`

A read entry as the routes model writes it: its vocabulary path, placement, pins, compiled test and template.

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::memberRecord`

A member route as the routes model writes it: its name, its route kind and that route's own facts, a slot by name, and `null` for a build path it has none of.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::readTestOf`

A read entry's test, as the `PortableCondition`s that must all hold. A condition's holder is the tested node when `up` is 0, else its `up`-th enclosing context node, the one at the same place as the entry's `within` kind; each `via` step is a slot's parser routes, anchored to its first or last node where the pattern anchors it, and the plan holds over all the nodes the steps reach together, its own subject the last slot or the reached node itself (`SelfText`). Each pin is an `eq` on its slot of the claimed node, except on a slot that holds one keyword's presence (`PresenceKeywordOf`), where the slot's value is a boolean: a pin of that keyword is a presence leaf (`present`), and a pin of any other text, which no node could hold, refuses the entry. Each predicate's `CaptureSite` is resolved kind by kind, and a text comparison (`comparesText`) of a capture of an alias kind (model `modelType: 'alias'`) steps on through its one content slot, repeatedly, so its own text is compared where it lives (a kind test compares the alias node's own type, so it does not step in), as the parser sees an alias's text (`aliasContent`): the holder's slot for each selector (`bindings/routes.ts::slotFor`), and the next holder the selector's kind. Every slot becomes its parser routes through `SlotRoutesOf`, so the routes have one derivation (`emitters/client-utils.ts::queryRoutesOf`) shared with the query facet's slot table. Each child test (`bindings/routes.ts::ChildTest`) compiles as a predicate at its site (`childPredicate`). Conditions that compile alike are kept once. Only the comparisons `comparisonOf` knows compile. Any other predicate, a capture under a wildcard, or a slot with no routes refuses the whole entry, naming the kind, the vocabulary path and every reason. A partial test would classify nodes the entry does not claim.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::childPredicate`

A child test as the predicate that compiles it: a text test is `eq`, an excluding test `not-kind-eq` over the excluded kinds, a kinds test `kind-eq` over its kinds, each at the test's site. A kinds test with no kinds reaches a slot that holds no node kind, and is refused with that reason.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::slotRoutesOf`

`SlotRoutesOf` over an assembled node map: a kind's slot, found by its model name, as `queryRoutesOf` spells it.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::SlotRoutesOf`

How a slot of a kind is reached in a parse tree: its parser fields and unfielded kinds, or nothing for a slot the parser does not carry.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::Steps`

The slot routes from a read entry's holder down to a predicate's capture, and the kind found there.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::stepsOf`

The steps from the kind a capture site starts at (the claimed kind, or an enclosing one `up` levels out) down its selectors, each anchored as `routes.ts::slotAnchor` reads its selector in its holder. A step under a wildcard, or one no slot of its holder takes, gives the reason the predicate cannot compile instead.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::aliasContent`

The single content slot of an alias kind, as the step that reads through it, and the kind it holds when that is one kind.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::conditionOf`

A predicate as a portable condition, or the reason it cannot be one (`comparisonOf`). The capture's steps are followed, through any alias's content; the last step is the comparison's subject slot, or, when the capture is the node itself, sits behind an alias, or its last step is anchored, the node itself (its text, or its type).

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::comparesText`

Whether a predicate compares one capture's text (`eq`, `match`) rather than its kind: such a comparison takes exactly one text, and through an alias it reaches the content that holds the text.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::comparisonOf`

The plan a predicate compares with, given the subject it reads, or the reason it cannot compile: `eq` and `match` of one capture against one text, and `kind-eq` and `not-kind-eq` of one capture against kind names, which become an `is` of the ids of every kind a node of those kinds reads as (`readAs`), negated for `not-kind-eq`. A kind with no id is refused.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::readAs`

The kinds a node of a kind can carry as its type: the kind itself and, for an enum kind, each member's kind, from the model's stamped enum members. The typed reader holds an enum node as its member's kind (a `private` modifier reads as `private_keyword`, not `accessibility_modifier`), so a type test on the enum kind admits every member. A branch's `variantOf` parts are not members: a variant of a branch is a part of its owner.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::PlanOn`

A comparison waiting for the subject it reads.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::PresenceKeywordOf`

The keyword a slot of a kind holds the presence of, or nothing for any other slot.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::presenceKeywordOf`

`PresenceKeywordOf` over an assembled node map: a kind's slot, found by its model name, read by `shared.ts::keywordPresenceValue`, the fact the query slot table stamps too (`client-utils.ts::querySlotRows`).

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::TypeOf`

A kind name's kind id, stamped from the generated id tables, or `undefined` for a kind with none.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::namespaceTree`

The tree of every vocabulary path a grammar reads (`NamespaceNode`), segment by segment and sorted. Each node's kinds are derived once from the read entries whose paths satisfy its facts through `portablePathHasFacts`. A crossing is admitted beneath each path that names its facts, even when another refinement separates its segments.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::descendants`

Every node below a namespace node, each before its own descendants. The alias pass and the portable surface walk the tree with it.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::namespaceSection`

The `namespaces` section of `node-model-portable.json5`. Per depth (`NamespaceLevel`): the paths there, the distinct kinds whose read entries name a path of that depth, and the paths refining a path some entry reads (`expression.binary.add` under a read `expression.binary`). A change to the tree shows up in these numbers when the file is reviewed.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::NamespaceNode`

One level of the portable namespace tree: its dotted path, the kinds whose readings carry every fact it names, and its child levels by segment.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::MutableNode`

A namespace level while the tree is built.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::joinPath`

A path one segment deeper, from the root's empty path or a dotted one.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::NamespaceLevel`

The namespace counts at one depth: its paths, the kinds read at them, and the refinements among them.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::depthOf`

The number of segments in a path; the root is depth 0.

### `packages/codegen/src/emitters/overlays/portable/index.ts::emitPortable`

A bound grammar's two portable outputs from one route resolution: `node-model-portable.json5` (`emitPortableNodeModel`) and `src/portable.ts` (`emitPortableSurface`). Both use the same read tests and kind ids, so the reviewed model file and the runtime table cannot drift. A read test's kind tests carry kind ids from the same id tables (`TypeOf`).

### `packages/codegen/src/emitters/overlays/portable/index.ts::PortableOutputs`

The portable overlay's two emitted files: the routes model (`node-model-portable.json5`) and the typed surface (`portable.ts`).

### `packages/codegen/src/emitters/overlays/portable/surface.ts::emitPortableSurface`

`src/portable.ts`: the types and the table of a bound grammar's portable surface. `PortableIds` names, per path, the union of the kind ids read at or under it (`namespaceTree`). `PortableKindsAt` and `PortableIsAt` type each path's `kinds` node and guard, both with their child segments, each referring to the next path by key. A path is reached only by its full path: no segment is linked under a further ancestor. `PortableKinds` and `PortableIs` are the roots. The `PortableTable` holds each path's ids and whether they decide it (`exact`: each of its kinds has an unplaced, untested entry, and every entry up to and including the first such one carries all of its facts (`portablePathHasFacts`), so the first match always satisfies it; no entry after an unconditional one is ever tried), each kind id's read entries in read order (placement kinds nearest first, `null` for a wildcard, and the compiled test; kinds the parser shows by one name share one id, so their entries are written once under it and a path's ids are listed once each), and every fixed literal's text. A placement kind without a parser id fails generation with `kindDiscriminantExpr`'s message. The module ends by building the runtime from it (`common/src/portable.ts::portableSurface`).
### `packages/codegen/src/emitters/overlays/portable/surface.ts::PortableSurfaceConfig`

What the portable surface is emitted from: the grammar's routes, the compiled test of each read entry, the kind-id expression of a kind, and the fixed text of each fixed-text kind.

### `packages/codegen/src/emitters/overlays/portable/surface.ts::q`

A string as a quoted TypeScript literal.

