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

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::readTestOf`

A read entry's test, as the `PortableCondition`s that must all hold. A condition's holder is the tested node when `up` is 0, else its `up`-th enclosing context node, the one at the same place as the entry's `within` kind; each `via` step is a slot's parser routes, and the plan holds when it holds on some node the steps reach, its own subject the last slot or the reached node's text (`SelfText`). Each pin is an `eq` on its slot of the claimed node. Each predicate's `CaptureSite` is resolved kind by kind, and a capture of an alias kind (model `modelType: 'alias'`) steps on through its one content slot, repeatedly, so its own text is compared where it lives, as the parser sees an alias's text (`aliasContent`): the holder's slot for each selector (`bindings/routes.ts::slotFor`), and the next holder the selector's kind. Every slot becomes its parser routes through `SlotRoutesOf`, so the routes have one derivation (`emitters/client-utils.ts::queryRoutesOf`) shared with the query facet's slot table. Only `eq` and `match` comparing one capture with one text compile. Any other predicate, a capture under a wildcard, or a slot with no routes refuses the whole entry, naming the kind, the vocabulary path and every reason. A partial test would classify nodes the entry does not claim.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::slotRoutesOf`

`SlotRoutesOf` over an assembled node map: a kind's slot, found by its model name, as `queryRoutesOf` spells it.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::namespaceTree`

The tree of every vocabulary path a grammar reads (`NamespaceNode`), segment by segment and sorted. Each node holds the kinds read at or under it, so a path's kinds are a superset of every refinement's under it.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::aliasesOf`

The shortcut names under each namespace node. A last segment unique among a node's descendants that are not its direct children becomes an alias for that path (`NamespaceAlias`). A segment two or more descendants share is dropped (`DroppedAlias`, naming every path), and a real child of the same name always wins.

### `packages/codegen/src/emitters/overlays/portable/namespaces.ts::namespaceSection`

The `namespaces` section of `node-model-portable.json5`. Per depth (`NamespaceLevel`): the paths there, the distinct kinds whose read entries name a path of that depth, the paths refining a path some entry reads (`expression.binary.add` under a read `expression.binary`), and the aliases added one level below the nodes they sit under. Then every dropped alias. A change to the tree shows up in these numbers when the file is reviewed. The dropped list is pinned by a ratchet test, so a new shared segment fails until the bindings tell the paths apart.

### `packages/codegen/src/emitters/overlays/portable/index.ts::emitPortable`

A bound grammar's two portable outputs from one route resolution: `node-model-portable.json5` (`emitPortableNodeModel`) and `src/portable.ts` (`emitPortableSurface`). Both use the same read tests and kind ids, so the reviewed model file and the runtime table cannot drift.

### `packages/codegen/src/emitters/overlays/portable/surface.ts::emitPortableSurface`

`src/portable.ts`: the types and the table of a bound grammar's portable surface. `PortableIds` names, per path, the union of the kind ids read at or under it (`namespaceTree`). `PortableKindsAt` and `PortableIsAt` type each path's `kinds` node and guard, both with their child segments and aliases, each referring to the next path by key, so an alias has the very type of its path. `PortableKinds` and `PortableIs` are the roots. The `PortableTable` holds each path's ids and whether they decide it (`exact`: every read entry of each of its kinds names it or a path under it, and one of each kind's entries is unplaced and untested, so the first match always lands under it), the aliases (`aliasesOf`), each kind's read entries in read order (placement kinds nearest first, `null` for a wildcard, and the compiled test), and every fixed literal's text. A placement kind without a parser id fails generation with `kindDiscriminantExpr`'s message. The module ends by building the runtime from it (`common/src/portable.ts::portableSurface`).
