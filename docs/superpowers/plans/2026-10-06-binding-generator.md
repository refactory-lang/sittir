# Binding generator: implementation plan

**Spec:** `docs/superpowers/specs/2026-10-06-binding-generator-design.md`, over the bindings spec (`2026-09-13-bindings-and-vocabulary-design.md`). **Probe:** `docs/superpowers/probes/2026-10-06-binding-generator/`.

Each stage is one PR off the previous one, with its own gate. Every stage also passes the standing gates:
- `validate:native` rows equal to the baseline on all five grammars;
- the full unit suite;
- the cargo workspace;
- type-check of the workspace and `examples/`;
- lint on touched files;
- every Copilot comment answered.

No stage touches `packages/common/src/transport-data.ts` or the native reader; the typed reader owns them.

## Where things are today

- `ApiSurface` is reserved (`'default' | 'strict' | 'portable'`, `packages/types/src/engine-api.ts`); `createEngine` refuses `api: 'portable'` (`refuseUnimplemented`), and `BuildSurface<…, 'portable'>` is `never`.
- The vocabulary under `packages/types/src/vocabulary/` is authored. A member is typed by its sole role, its vocabulary refs or its scalar, and otherwise by its entry in the context slot table, `G['slots']['<kind path>']['<member>']`. Today `BaseContext` fills each entry with roles, refs or `string`. The bindings spec retires it (§3.4, §4.4): `GrammarContext<G extends GrammarContext<G>>` is the namespace map and carries those permissive fills, and portable code is generic over `G`, bounded by the features it reads. Stage work that touches the context builds on that shape, not on `BaseContext`. The inventory's `--check` reports where the vocabulary and the bindings disagree, and they agree everywhere.
- The bindings reader (`readBindings`, `inventory/bindings.ts`) and the derivation (`derive`, and the member classification `slotEntries` and `soleRole`, `inventory/derive.ts`) live in `packages/tools`, and read `bindings.scm` through the workspace `@sittir/scm`. `packages/codegen` cannot import `packages/tools`.
- `bindings.scm` exists for rust, typescript and python.
- The query facet's plan form is `QueryPlan` (`@sittir/types`), evaluated by `holds` in `packages/common/src/query.ts`.
- The form and subtype routing for kinds with no bare factory lives in `packages/tools/src/validate/common.ts` (`buildFactoryNodeFromReference` over the `ir` surface).
- Probe, rust: 191 read entries, 174 build entries, 133 of 374 members rejected by the vocabulary, with the probe filling rust's context (each role's keyword text and the slot table) from rust's own derivation.

## How codegen gets the bindings facts (decided)

`bindings.scm` is the one source. It reaches codegen two ways, split by whether the parser sees the fact:

- **Parser-aware changes go through a generated module.** The overlay (patches, renames, splits, merges, aliases) changes the grammar tree-sitter compiles, so it is written into a generated, committed `packages/<grammar>/grammar.bindings.ts`, which `grammar.sittir.ts` imports. The module carries a hash of `bindings.scm` and the vocabulary sources it was derived against. Codegen refuses a stale one, comparing bytes with no scm parse, with a diagnostic naming the command that regenerates it. The overlay's derivation is a pure function in `packages/codegen/src/bindings/`, and the inventory is its one writer.
- **Everything else is interpreted directly.** The claims (paths, kinds, refinements, predicates, member routes), the namespaces and the routes are read from `bindings.scm` at codegen time, through a pinned `@sittir/scm`: the generator runs sittir's own scm package from one pinned commit, not the workspace copy, so a change that breaks `@sittir/scm` can never break regenerating the fix. The inventory reads through the same pinned reader, so there is one reader and one derivation.
- With the overlay on, codegen binds the claims' base names through the node model's stamped provenance (`renamedFrom`); with it off, it reads them as they are.
- Codegen stays out of the scm engine's bootstrap: regenerating `@sittir/scm` itself uses the pinned copy, never the one being regenerated.

## The rejected members: the rule

**A grammar's portable members ship only at zero rejected members.** The generated module is type-checked with its package, so a rejected member is a compile error in the package. The namespaces `kinds` and `is` carry no member types, so stage 3 emits them for every bound grammar regardless of its count. Until a grammar reaches zero:
- its typed views, read and build (stages 5 to 7) are not emitted into the package;
- its rejection count, sorted by cause (the probe's `conformance.py`, promoted to `sittir tool portable-conformance`), is a ratchet that only falls.

Stage 4 drives the count to zero for each cause on the side that owns it. Rust is first, then typescript and python.

## Stage 0: lock the vocabulary (landed)

- The emitter was cleaned up first and the vocabulary regenerated:
  - `$kind` on every interface, holes included;
  - a flat `SubKindOf` with no `Simplify`;
  - grammar-neutral member types through the context slot table.
- Then the vocabulary files lost their "Generated" banner and became authored, and the inventory's emitter and `--emit` were removed.
- `--check` reads the vocabulary structurally and reports where it and the bindings disagree: a claimed path no interface has as its `$kind`, a routed member, pinned field or template hole its interface does not declare. They agree everywhere; the ceiling records none.
- A grammar's context is filled by the type maps (stage 5); until then the probe fills rust's from its own derivation.

## Stage 1: bindings facts reach codegen

- The facts schema and the derivation move into `packages/codegen/src/bindings/`, as pure functions of the facts and the slot model. The scm reader (`readBindings`) runs on the pinned `@sittir/scm`, called by codegen for the claims and by the inventory for the overlay module it writes. Codegen refuses an overlay module whose hash does not match `bindings.scm` and the vocabulary sources, naming the command that regenerates it.
- The facts keep two things they drop today:
  - a predicate claim's predicate (operator, capture, argument), so a read entry can test it and a build entry can pin it;
  - a flag's token text, so a capture named otherwise than its token (`"async" @isAsync`) still has a route.
- Gate: the inventory's report is byte-identical; `grammar.bindings.ts` (the overlay) is committed for rust, typescript and python; codegen reads the claims through the pinned reader; unit tests pin the two new facts (`#eq? @name "__init__"`, `"async" @isAsync`) and the stale-overlay refusal.

## Stage 2: one route resolution

- `resolveRoutes(input)` in `packages/codegen/src/bindings/routes.ts` produces, per kind, as data: read entries (most specific first: predicate claims, then literals, ties in file order; no claim is placed, bindings spec §9), member routes (slot, nested through a selector), fact routes (each flag's token or kind, each axis value's node, and the facts an envelope sets on the element it unwraps), container unwraps and build inverses (member to parameter path, flag to the token or kind it builds, with pins). Each claimed name resolves against the vocabulary's declarations, and a claim that maps onto none is reported (generator spec §3.1). `derive`'s member loop folds member types from these routes instead of re-walking slots, and slot matching uses `derive`'s field matching only.
- The routes are written per bound grammar as `packages/<grammar>/src/node-model-portable.json5`, beside and apart from `node-model.json5`, which stays low-level.
- The low-level build's routing (the seat table and its mounts, already codegen output) is unchanged: the validation lanes build through the low-level API, whose references carry the concrete kind.
- Gate: the inventory's report is byte-identical, and the `ir-render-parse` rows are equal.

## Stage 3: namespaces, `kinds` and `is`

Everything portable is emitted by one overlay, `packages/codegen/src/emitters/overlays/portable/` (`namespaces.ts` first). The low-level emitters expose only what it reads.

- Per bound grammar, a namespace tree by vocabulary path, built from the stage-2 routes: `kinds.<path>` and `is.<path>`.
- Short aliases: a path also appears under each ancestor where its last segment is unique among all that ancestor's descendants (`is.expression.add` beside `is.expression.binary.add`). It is the same object, a real child of the same name wins, and it is derived from the path tree, not listed. A segment that is not unique gets no alias, and is reported in the overlay's dropped list with the paths that have no realized kind.
- `is.<path>` is compiled from the read entries under the path into a kind set plus a `QueryPlan`, evaluated with `holds`, and a mask of the path's flags, tested against the node's bitflag. It tests each fact its path names, not the path as a prefix (bindings spec §3.3), so it sits under every path that names its facts: `is.declaration.method.public` passes a public getter, and a flag's guard sits under every path of its kind. A claim a child's kind decides compiles to the plan's `is` op, and a step toward a captured child may carry a `first` or `last` anchor (one-query-evaluator spec §1). It takes a node from either engine. Its overloads narrow a grammar node to the row's grammar types and, once stage 6 gives portable nodes, a portable node to the vocabulary interface.
- `createEngine(lang, { api: 'portable' })` is accepted and exposes `kinds` and `is`; `parse`, `render` and `build` refuse until their stages land.
- Emitted for every bound grammar, whatever its rejection count.
- Gate:
  - `is.<path>` holds for exactly the nodes whose read entries classify them under the path, on both surfaces, and tells `identifier` from `type_identifier` where their roles differ; a guard holds alongside every refinement its path does not name; the narrowing is checked at compile time;
  - the alias derivation has unit tests (a unique segment aliases, a colliding one is dropped, a real child wins);
  - per-level counts (paths, kinds, refinements, aliases) and the dropped list are recorded per grammar.

## Stage 4: conformance to zero (rust first)

The causes the probe reports, each on the side that owns it:

| cause | count | stage-3 change |
| --- | --- | --- |
| kind | 97 | A primitive type token read as `type.primitive` where the slot admits its const string. The enum-read rule is a routing fact, defined once in the shared route resolution: a token that is a value of a claimed enum reads as the enum's kind where the slot admits that enum, and as its const string otherwise. The conformance count reads through it. |
| predicate | 13 | A member that admits a kind admits all its claims (vocabulary). |
| unmapped | 12 | Each unmapped grammar kind gets a claim (bindings): onto an existing vocabulary kind, or onto a kind a feature adds to the vocabulary when none fits. |
| untyped reader | 6 | The readers typed `unknown` get types (codegen typed surface). |
| refinement | 3 | In the authored vocabulary, a level's `$kind` admits every path beneath it. |
| token text | 1 | `parameter.name` reads keyword text (`'default'`) where rust's fill holds only its unmapped `rust:pattern` marker; it is cleared by the unmapped row's claim for `rust:pattern`. |
| absent | 1 | Requiredness carries through containers (vocabulary projection). |

- `sittir tool portable-conformance <grammar>` (the probe's tools, promoted) reports the count and causes.
- The enum-read rule has unit tests: `i32` in an expression slot reads as `'i32'`, and in a type slot as `type.primitive`; `bool` in a slot that admits both reads as the enum.
- Gate: rust's count is 0. Typescript's and python's are recorded as their ratchet baselines.

## Stage 5: type maps beside the low-level ones

- `ViewForm` lives in `@sittir/types`.
- The types emitter writes `Ctx`, `VocabViews`, `ViewByKind`, `ViewOf`, `EnumViewByKind`, `ViewEnumOf` and `Backward` into a zero-conformance grammar's `types.ts`, beside `ParsedByKindId`.
- Gate: the workspace type-check, timed before and after with the same command, does not regress beyond noise; generated-output drift is clean.

## Stage 6: read (the portable `parse` and `render`)

- A generated `portable.ts` per zero-conformance grammar:
  - node literal factories, with `$type` as the only public data member and every member a closure;
  - the dispatch: predicate claims on the captured node's text, the facts an envelope sets on the element it unwraps, one level down, into its bitflag, and an enum value read by stage 4's enum-read rule;
  - each node's flags, one bitflag behind a module-private symbol that only `is` reads, read along the flags' routes;
  - a varying leaf's `$value`, and a fixed literal as its const string.
- `createEngine(lang, { api: 'portable' })` is accepted. `parse` reads portable nodes, and `render` renders one by dispatching on `$type`. The engine reaches a portable node's low-level node through a module-private symbol, never a public member.
- Gate:
  - the dispatch reads an enum token by calling stage 4's enum-read rule, the same function the conformance count uses; no second rule;
  - a read lane: every node of the corpus reads through the portable engine with no throw, and every member call returns;
  - rendering a parsed portable root equals the low-level render.

## Stage 7: build

- Build entries per vocabulary kind under `build.<path>`, with the same short aliases as stage 3. Where one path maps to several grammar kinds, the build picks the kind from the input's shape (which members are present, and the kinds of their values), then builds through the low-level API and its mount routing. There is no default arm and no inference from text. Kinds whose shapes cannot be told apart are stage-4 conformance items, cleared by giving each its own vocabulary path (`expression.update.prefix` / `.postfix`, `comment.block` / `comment.line`), so the input's `$kind` picks the call.
- Refinement builders and flag steps, the only form a refinement or a flag takes in a build. A step per flag on each builder of its kind, in any order, sets its bit and builds its token or kind. One refinement builder per refinement path:
  - a literal or token refinement presets the literal (`build.expression.binary.add` fills `operator: '+'`);
  - a child-kind refinement narrows the slot's type to that child kind;
  - a text refinement (`#match?`, `#eq?`) narrows the type and runs the predicate as a guard when the node is built, always on like a leaf guard, refusing text it rejects.
  - a template predicate (a pattern with holes, such as a dunder name) builds from its holes; any other `#match?` checks the given text against the pattern and refuses a mismatch.
- The portable `build` is typed per kind from the vocabulary; the low-level generic build is keyed by `$type`.
- A portable round-trip lane joins `validate:native`: parse with the portable engine, build every node again from its members, render, and parse-equal over the corpus.
- Gate: the existing rows are equal; the new lane's row is recorded as its baseline.

## Stage 8: crossing

- `attach` on both engines, overload-typed from `Backward`, `ViewByKind` and the build map.
- A parsed node is re-wrapped from its row with no reparse; a built node is rebuilt.
- A node bound to the engine is returned as is; one bound to another engine of the same surface is re-wrapped or rebuilt.
- Gate, as tests: a parsed node attached to the other engine is re-wrapped with no reparse and renders the same text; a built node attached is rebuilt and renders the same text; attaching a low-level node of a kind that does not cross on its own is a type error; attaching a node to its own engine returns it.
