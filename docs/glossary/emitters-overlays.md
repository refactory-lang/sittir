# `packages/codegen/src/emitters/overlays` — Function Glossary

Per-function reference for `packages/codegen/src/emitters/overlays/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `packages/codegen/src/emitters/overlays/polymorphs.ts::PolymorphWires::bundledKinds`

```text
/** Kinds the bundle exports, so their overlay entry carries a `strict` of its own. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::PolymorphWireSet::forwarded`

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

Each seated entry point is a function: one refusing overload, generic over its whole argument row (`refusingParam`), over a plain implementation that calls the composition. A constant typed by a generic rest signature could not take the composed function, whose parameters are fixed.

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

### `packages/codegen/src/emitters/overlays/polymorphs.ts::refusingConfig`

A form builder's config parameter in its refusing form, followed by the parent's options (`optionsOf`). The config is generic as a whole, which loses TypeScript's excess-property check, so it passes its own type as the declared input: the walk then refuses an undeclared key as well as an untyped node. An optional config is the rest tuple `refusingParam` writes, with the options inside it.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::optionsOf`

The trailing options parameter of a form builder, typed by its parent's options.

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::emitPortableNodeModel`

`node-model-portable.json5`: a bound grammar's routes (`bindings/routes.ts::GrammarRoutes`), written beside `node-model.json5` and kept out of it, since the low-level model never reads them. Per kind, in kind order: the vocabulary kind it reads as by default; its read entries, most specific first, each with its placement, pins, compiled test (`read-tests.ts::readTestOf`) and template; its members, each with its route and build path (`null` where a member cannot be built back), and `flag` and `spelled` where the route carries them (a spelled flag has no path, yet a build reaches it by picking the kind); and its container unwrap. A slot is written by name; the slot itself is in `node-model.json5`. After the kinds, the `namespaces` section (`namespaces.ts::namespaceSection`). The pins stay beside the test because a build reads them; the predicates do not, since the test is their only reader-side form.

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::readEntryRecord`

A read entry as the routes model writes it: its vocabulary path, placement, pins, compiled test and template.

### `packages/codegen/src/emitters/overlays/portable/node-model.ts::slotRecord`

A member route as the routes model writes it: its name, its route kind and that route's own facts, a slot by name, and `null` for a build path it has none of.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::readTestOf`

A read entry's test, as the `PortableCondition`s that must all hold. A condition's holder is the tested node when `up` is 0, else its `up`-th enclosing context node, the one at the same place as the entry's `within` kind; each `via` step is a slot by its numbers (`SlotSubject`), anchored to its first or last node where the pattern anchors it, and the plan holds over all the nodes the steps reach together, its own subject the last slot or the reached node itself (`SelfText`). Each pin is an `eq` on its slot of the claimed node, except on a slot that holds one keyword's presence (`PresenceKeywordOf`), where the slot's value is a boolean: a pin of that keyword is a presence leaf (`present`), and a pin of any other text, which no node could hold, refuses the entry. Each predicate's `CaptureSite` is resolved kind by kind, and a text comparison (`comparesText`) of a capture of an alias kind (model `modelType: 'alias'`) steps on through its one content slot, repeatedly, so its own text is compared where it lives (a kind test compares the alias node's own type, so it does not step in), as the parser sees an alias's text (`aliasContent`): the holder's slot for each selector (`bindings/routes.ts::slotFor`), and the next holder the selector's kind. Every slot becomes its number through `SlotSubjectOf`, the native node's own slot numbering (`render-module.ts::nodeSlotNumbers`), so a test reads a slot the way the native read routes it. A comparison of the node's own text an enum member's fixed text already decided (`ReadEntry.spelled`, `routes.ts::comparesOwnText`) is left out. Each child test (`bindings/routes.ts::ChildTest`) compiles as a predicate at its site (`childPredicate`). Conditions that compile alike are kept once. Only the comparisons `comparisonOf` knows compile. Any other predicate, a capture under a wildcard, or a slot with no number refuses the whole entry, naming the kind, the vocabulary path and every reason. A partial test would classify nodes the entry does not claim.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::childPredicate`

A child test as the predicate that compiles it: a text test is `eq`, an excluding test `not-kind-eq` over the excluded kinds, a kinds test `kind-eq` over its kinds, each at the test's site. A kinds test with no kinds reaches a slot that holds no node kind, and is refused with that reason.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::slotSubjectOf`

`SlotSubjectOf` over an assembled node map: a kind's slot, found by its model name, by its number among the kind's native node slots (`render-module.ts::nodeSlotNumbers`), keyed by the kind's stamped id, the numbering the query slot table carries too (`client-utils.ts::querySlotRows`).

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::SlotSubjectOf`

A slot of a kind by its number (`SlotSubject`), or nothing for a slot the kind's node has no field for.

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::Steps`

The slots, by their numbers, from a read entry's holder down to a predicate's capture, and the kind found there.

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

### `packages/codegen/src/emitters/overlays/portable/read-tests.ts::keywordTestOf`

The test that a slot holds a keyword: a presence leaf when the slot is a boolean slot holding only that keyword (`presenceKeywordOf`), a text comparison when it holds the keyword among others. A read entry's pin and a flag's keyword both lower through it; a keyword a boolean slot cannot hold is refused.

### `packages/codegen/src/emitters/overlays/portable/flags.ts::flagPlansOf`

One kind's flags, each as the plan that tests it on a node of the kind. A member flag lowers its route: each step before the last becomes a `child` step over that step's slot by its number, keeping its anchor, and the last slot gives the leaf, presence for a flag slot, `keywordTestOf` for a keyword, and an `is` over the slot for a captured kind. A flag the kind's own form spells (`SlotRoute.spelled`) always holds, `{ op: 'and', of: [] }`; any other route with no path is refused. A claim flag lowers its read test when the test is node-local (no placement, no context condition); otherwise it depends on the node's context and is `null`, which a query refuses by name. A claim flag whose test still compares the node's own text, one no fixed text decided, is refused: a where plan reads no node's own text. A flag declared by several routes lists each distinct plan once and `or`s them. A flag both declared on the node and by a contextual claim is refused, as is a route that reaches no slot.

### `packages/codegen/src/emitters/overlays/portable/flags.ts::slotFlagsOf`

The flags each kind's slots can test, by stamped kind id and slot accessor, over the nodes `client-utils.ts::querySlotRows` rows (a kind id and at least one slot), so the two tables key the same slots. A slot's kinds are its values' concrete parse kinds (`kindsOf`; `emitPortable` passes `valueParseKindsOf`, then `expandToConcreteParseKinds`, then `memberKindsOf`, since a slot that holds an enum stores its member's kind id, which is the kind whose fixed text spells the flag). For each flag one of them declares (`flagPlansOf`'s plans, by kind name), the entry is a `SlotFlagTest`: its `types` are the ids of every kind whose plan always holds (`isAlways`: `and` over no plans, a flag the kind's fixed form spells), expanded as `ofType` expands a kind (`typesOf`), and its `kinds` are the stamped ids of the kinds whose plan reads their own slots, which the recorder tests with that plan on the node the slot holds. One kind that declares it through its context (`null`) makes the flag a refusal naming that kind (`SlotFlagRefusal`), since no plan the slot's owner runs can read the held node's context; the first such kind in the slot's order wins over the rest. A slot with no flag has no entry, and a kind with no such slot has no row. Two nodes stamped with one kind id must agree on the row. A row carries its node, so the surface declares the readable flags on the node's interface without finding it again.

### `packages/codegen/src/emitters/overlays/portable/flags.ts::SlotFlag`

One slot's entry for one flag: the sorted ids of the kinds the slot can hold that always carry it and of those that carry it by their own slots (`SlotFlagTest`), or the refusal naming the kind that declares it through its context.

### `packages/codegen/src/emitters/overlays/portable/flags.ts::isAlways`

Whether a flag plan always holds: `and` over no plans.

### `packages/codegen/src/emitters/overlays/portable/flags.ts::ClaimFlag`

A claim that declares a flag (`ClaimFact.flag`), as `flagPlansOf` reads it: the flag, its entry's read test, and whether the entry is placed under other kinds.

### `packages/codegen/src/emitters/overlays/portable/index.ts::emitPortable`

A bound grammar's two portable outputs from one route resolution: `node-model-portable.json5` (`emitPortableNodeModel`) and `src/portable/index.ts` (`emitPortableSurface`). Both use the same read tests and kind ids, so the reviewed model file and the runtime table cannot drift. A read test's kind tests carry kind ids from the same id tables (`TypeOf`). It also lowers each kind's flags (`flagPlansOf`), a captured kind expanded by membership as `ofType` expands it (`membershipKindsOf`, so an enum kind stands for the member ids a read stores), into the surface's `queryFlags`; two kinds that share a kind id must lower to the same table. A kind with a node interface (`shared.ts::isSlotBearingCompound`) also lists its flags, those that do not depend on the node's context, by its type name (`flagTypes`); a kind read as a kind-id leaf has no node to declare them on. Those flags reach a query through the slots that hold the kind instead: `slotFlagsOf` expands each slot's flags into `querySlotFlags`, and each node interface lists, by slot accessor, the flags a slot test can read there (`slotFlagTypes`: every flag of the slot that is not refused).

### `packages/codegen/src/emitters/overlays/portable/index.ts::PortableOutputs`

The portable overlay's two emitted files: the routes model (`node-model-portable.json5`) and the typed surface (`portable/index.ts`).

### `packages/codegen/src/emitters/overlays/portable/index.ts::PortableOutputs::typed`

The typed portable module, emitted from the same routes as the other portable outputs.

### `packages/codegen/src/emitters/overlays/portable/surface.ts::emitPortableSurface`

`src/portable/index.ts`: the types and the table of a bound grammar's portable surface. `PortableIds` names, per path, the union of the kind ids read at or under it (`namespaceTree`). `PortableKindsAt` and `PortableIsAt` type each path's `kinds` node (its `$path`) and guard (`PortableGuard` over the path's ids, the grammar's node union from `./types.js` and its `TSKindId`, so a node or kind id of another language, or a node widened to a bare `$type`, is refused at compile time, and a kind id narrows to the path's ids), both with their child segments, as views of the shared portable trees, each referring to the next path by key. A path is reached only by its full path: no segment is linked under a further ancestor. `PortableKinds` and `PortableIs` are the roots. The `PortableTable` holds each path's ids and whether they decide it (`exact`: each of its kinds has an unplaced, untested entry, and every entry up to and including the first such one carries all of its facts (`portablePathHasFacts`), so the first match always satisfies it; no entry after an unconditional one is ever tried), each kind id's read entries in read order (placement kinds nearest first, `null` for a wildcard, and the compiled test; kinds the parser shows by one name share one id, so their entries are written once under it and a path's ids are listed once each), and every fixed literal's text. A placement kind without a parser id fails generation with `kindDiscriminantExpr`'s message. The module ends by exporting `rows` (`PortableRows`: the table and the grammar's slot table), which the language hooks carry onto every engine's identity, so a node's engine (`engineOf`) reaches its language's rows, then exports `queryFlags`, each kind id's flag plans, which the language hooks carry to a `where` recorder's `is`, and `querySlotFlags`, each kind id's slot flags (`slotFlagsOf`), which they carry to a slot's `is`. Last, in `./types.js`, it fills the grammar's `PortableReads` with its `PortableIds` (`interface PortableReads extends PortableIds {}`), merged by declaration into the empty interface the types module declares, so a parsed node's query views narrow a portable kind by the paths this grammar reads, and a grammar without bindings, which has no portable module, keeps it empty. It also declares each flagged kind's flags on its node interface there (`readonly __flags__?: …`, `flagTypes`), merged by declaration, so a recorder's `is` takes only the flags the view's kind declares (`types/src/query.ts::FlagOf`), and declares each slot's readable flags beside them (`readonly __slotFlags__?: { readonly <accessor>: … }`, `slotFlagTypes`), so a slot's `is` takes only those (`types/src/query.ts::SlotRef`). The grammar's `api.ts` imports this module, and its index imports `api.ts`, so the declaration is in every program that imports the grammar package, portable surface used or not.
### `packages/codegen/src/emitters/overlays/portable/surface.ts::PortableSurfaceConfig`

What the portable surface is emitted from: the grammar's node union type name (`grammarNodeTypeName`), its routes, the compiled test of each read entry, the kind-id expression of a kind, the fixed text of each fixed-text kind, each kind's flag plans and the type names that declare them, and each kind's slot flags and the type names that declare the readable ones.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedInput`

The inputs of the typed portable module: the read routes, the grammar input, the vocabulary, the node map and the kind entries that `emitPortableTyped` reads.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedInput::routes`

The grammar's read routes: for each kind, the vocabulary entries it claims and the member routes of each.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedInput::input`

The grammar input the bindings were derived from, which supplies the model the reads are typed against.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedInput::nodeMap`

The node map that gives each kind its type name and, through the kind entries, its kind id.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedInput::kindEntries`

The kind enumeration entries, which give each kind the id that the typed module's kind lookups use.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedUnemitted`

A read entry or member that the typed emitter skipped, with the reason. Its kind and vocabulary name the entry; its member names the member when the skip is per member.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedUnemitted::kind`

The grammar kind of the skipped read entry.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedUnemitted::vocab`

The vocabulary path the skipped entry reads into.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedUnemitted::slot`

The member the skip applies to, when the skip is per member. Absent when the whole entry was skipped.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedUnemitted::reason`

Why the emitter skipped the entry or member.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedOutput`

The generated typed module: its source text and the reads the emitter skipped. `emitPortableTyped` returns it.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedOutput::source`

The module source, written to the portable typed file.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PortableTypedOutput::unemitted`

The reads the emitter skipped, each with its reason.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PORTABLE_TYPED_FILE`

The file name the typed module is written under, in the `.sittir` directory.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::PORTABLE_TYPED_TSCONFIG`

The name of the tsconfig that type-checks the typed module on its own, beside it in the `.sittir` directory.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::emitPortableTyped`

Emits one grammar's typed portable module as source text, with the reads the emitter could not type. Each read entry becomes a factory function bound to its kind. The module's views, its per-kind view map, its backward view and its enum view map are derived from the routes and the model. Reads that cannot be typed go to `unemitted` and are not emitted as code.

### `packages/codegen/src/emitters/overlays/portable/typed.ts::portableTsconfigText`

The text of the tsconfig that type-checks the typed module together with the grammar's portable type tests. It is written beside the module in the `.sittir` directory.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::mapFlagsOf`

Per path in the portable map, the sorted unique flags of its build arms, in codepoint order. Paths are listed in codepoint order, so the output is stable across runs.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::mapInputsOf`

Per path in the portable map, the input shapes that path accepts, sorted by codepoint. A text-built path always accepts a bare `string`, and a number path accepts its scalars (`scalarInputsOf`), so a slot whose type holds it admits a bare number. A path whose scalar build is shared with another path's build also accepts `{ readonly $path; readonly $value }` for the owning path.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::mapNeverOf`

Predicate for the map's `never` members: true when a path's member has an exact set with no arms, so the member is typed `never` on that path.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::mapNodesOf`

Per path, the sorted discriminant ids of the kinds that read it. Each read kind contributes its discriminant to every path its read reaches (`readPathsOf`), so a path's `nodes` entry lists the kinds that yield it.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::MapDecided`

Per path, the slots whose structure without `$path` is read as one decided path, with that path. The map writes them as `decided`, and the build emitter takes the same entries as its input.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::ScalarInput`

The TypeScript type a number path's scalar takes in the map's inputs: `number` for an integer or a float, `bigint` for a bigint.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::mapDecidedOf`

Derives `MapDecided` once, from the exact sets: for each path and slot, the slot's only path built from a structure (a vocabulary kind with no `$value`), when the read views it. A slot with several, or with one the read doesn't view, has none.

### `packages/codegen/src/emitters/overlays/portable/grammar-map.ts::scalarInputsOf`

Per path the build table builds from a scalar (`builds`), the sorted TypeScript types of those scalars (`ScalarInput`). The map's inputs admit them at the path, so a slot whose type holds a number path admits a bare number, and the generated slot function's parameter takes the same types.

### `packages/codegen/src/emitters/overlays/portable/emit-input.ts::PortableEmitCode`

The portable module emitter's diagnostic codes: a path in a slot's type with no arm that fits the slot's seats in any arm of the slot's owner (`portable-emit-unplaced-path`); a path the slot's type admits that one arm's seats don't place, though another arm of the owner does (`portable-emit-unplaced-arm`); a path the emitter can't compile whole, which the module leaves out (`portable-emit-unfit-slot`); a construct the pinned builders can't express (`portable-emit-pinned-gap`); a generated module that fails its type-check (`portable-emit-type`); and a slot's tail that is the full name of another path (`portable-emit-tail-is-path`).

### `packages/codegen/src/emitters/overlays/portable/emit-input.ts::PortableEmitDiagnostic`

One portable emit diagnostic: its code, the path it is about, the slot when it is about one, and its message. Gen reports them as grammar warnings. They count only functions the module keeps.

### `packages/codegen/src/emitters/overlays/portable/emit-input.ts::PortableEmitInput`

What codegen hands the pinned child to emit a grammar's portable build module: the grammar, the map and node type names, the import specifiers, the build table, each path's slots as the slot functions type them (`PortableEmitSlot`), the paths the read views, the text paths, text inputs and text values, each path's flags as the grammar map types them (the flags its input can state), the holder and key of each strict list argument that takes a hole, and each path's decided slots (`MapDecided`). It is generic over the table type and imports nothing: codegen instantiates it with `@sittir/types`' `PortableBuildTable`, and the emitter with the same declarations through the one workspace file its program admits.

### `packages/codegen/src/emitters/overlays/portable/emit-input.ts::PortableEmitOutput`

The emitted module's text and its diagnostics.

### `packages/codegen/src/emitters/overlays/portable/emit-input.ts::PortableEmitSlot`

One slot of one path as its generated slot function types the value: the paths it takes, the token texts it takes, the unclaimed kinds it holds, whether it takes bare text, the scalar types a bare number in it may have (the scalar inputs of its number paths), and whether it is optional.

### `packages/codegen/src/emitters/overlays/portable/emit/build.ts::emitPortableBuildInProcess`

Emits a grammar's portable build module in the current process: it loads the pinned build, opens a TypeScript engine on it, writes the module with `emitPortableModule` and renders it. The pinned child calls it for its `portableBuild` mode, through `EMITTER_ENTRY`; the engine is disposed when the call returns.

### `packages/codegen/src/emitters/overlays/portable/emit/build.ts::emitPortableModule`

Writes a grammar's portable build module through the pinned TypeScript builders: a function per path the emitter compiles whole, each slot placed through its slot function, and only the helpers and imports those functions use. It returns the program with the diagnostics of what it left out. A path it can't compile whole is left out with `portable-emit-unfit-slot`, never written with an empty body.

A container that holds slots of its own (python's decorated definition, typescript's labeled statement) fills them from the structure it wraps, and an arm's facts spelled there join that slot's items at the index `$at` records, in the spelling `$at` names by its stamped text (the first spelling when it names none). Where an arm fits seats that wrap it differently, the generated code takes the first seat whose containers hold every such slot the structure states or a set fact fills, as the interpreter's seat choice does; a slot no seat holds is refused with `unrouted`. The root does the same over two choices, the bare node and, when the arm has facts, the container that spells them, so a root path with a fact set builds that container itself. A node or a text placed by its kind skips a seat whose container holds a slot that is never empty, since nothing would fill it.

### `packages/codegen/src/emitters/overlays/portable/covered.ts::FamilyCoverage`

A kind that reads as a family path no build takes, with that path covered: every case its slots allow reads as one of the path's refinements, so no read returns the family path itself. It names the kind's test-less read entry of the path, the refinement paths among the kind's readable entries, how many cases were read, and each case that two entries neither of which refines the other both take.

### `packages/codegen/src/emitters/overlays/portable/covered.ts::familyCoverageOf`

Each kind whose readable entries hold a test-less one whose path has no arms in the build table, a family path no build takes. It builds every case the node map allows over the slots the kind's entries' tests read (numbered as plans number them, `render-module.ts::numberedSlotsOf`): each value of a slot, a fixed-text terminal or each concrete kind a node value names, built the same way; no item when the slot is optional; and lists of up to two items, longer when a `count` test needs it. It reads each case as the classifier reads a node (`facts.ts::entriesHolding`), and a case is covered when the first entry it reads as is not the family path. A test that reads a text, a kind or a delimiter the grammar does not fix, a kind that holds itself through a tested slot, or more than 4096 cases leaves a case undecided, and an undecided case counts as uncovered. A kind with an uncovered case is refused (`portable-family-uncovered`), naming each case, so a path no build takes is never in a read type a parse can return. `emitPortable` runs it once; the typed emitter's read paths leave out the covered entries (`typed.ts::PortableTypedInput`, `covered`), so a read and an input share one slot type, and the node model stamps each kind's coverage (`node-model.ts::emitPortableNodeModel`).

### `packages/codegen/src/emitters/overlays/portable/spelled-facts.ts::portableSpellingOf`

One spelling of a fact a container spells, from the read entry whose tests on the container name it: the item those tests reach (its own text, or the slots they test, each a text or a nested item), and a hole for each slot a capture fills. A spelling with no holes also carries its text, rendered in the same codegen run from the render bodies of the item's kinds (`EmittedTemplates.bodies`): each body's text parts and placed slots in order, its seams written as nothing. That text is the spelling the reader records at the fact, so a build can tell `@override` from `@typing.override`. A slot the item states that its kind's body never places, a body part that spells no one text (a gate, a space, a token seam), or two parts whose word characters would meet once its seams are written as nothing refuses the spelling, naming the kind.
