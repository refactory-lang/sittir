# `packages/codegen/src/packages/tools/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/packages/tools/src/validate/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/tools/src/validate/render-bodies.ts::module`

```text
/**
 * The generated render bodies of a grammar — `packages/<grammar>/.sittir/render-bodies.json`,
 * one body IR per emitted kind — are the validators' catalog of renderable
 * kinds and the source the coverage checker reads a kind's body from.
 */
```

### `packages/tools/src/validate/render-bodies.ts::renderBodiesPath`

#### body

```text
// packages/tools/src/validate/ → ../../.. → packages/
```

### `packages/tools/src/validate/render-bodies.ts::loadRenderBodies`

```text
/** Every emitted kind's body. An absent file (a grammar never generated) throws, naming the path from `renderBodiesPath(grammar)`. */
```

### `packages/tools/src/validate/render-bodies.ts::deriveRuleKinds`

```text
/** The kinds the renderer can handle: those with an emitted body. */
```

### `packages/tools/src/validate/render-bodies.ts::bodyToLegacyRule`

```text
/**
 * A body in the coverage checker's placeholder shape: a slot reference is
 * `$NAME`, a gated arm is a `$TEST_CLAUSE` placeholder whose clause body is
 * the arm, and literal text is itself. The fallback of a gate chain inlines
 * into the surrounding template; an adjacency mark and a seam contribute
 * nothing. `indent`/`dedent` contribute the depth arms' stamped text
 * (`INDENT_TEXT`/`DEDENT_TEXT`) and a token seam contributes its own text —
 * exactly what the retired `whitespace` node contributed.
 */
```

### `packages/tools/src/validate/common.ts::module`

```text
/**
 * validate/common.ts — shared infrastructure across the three
 * corpus validators (`validate-roundtrip`, `validate-factory-roundtrip`,
 * `validate-from`):
 *   - Tree-sitter adapter: `adaptNode`, `treeHandle`, `findFirst`,
 *     `collectKinds`.
 *   - Corpus parser: `parseCorpus`, `loadCorpusEntries`.
 *   - Reparse wrapping: `buildKindToSupertypes`, `wrapForReparse`.
 *
 * Per-validator logic (per-kind assertions, reporting) stays in its
 * own file and imports whatever it needs from here.
 */
```

```text
// Codegen internals reached through the shared surface: types via import-type
// (runtime-erased), runtime values via load() at module top (destructure once,
// call synchronously — no per-call invoke()).
```

```text
// `loadWebTreeSitter` lives in ./engine-loader.ts: codegen-run infrastructure
// stays out of the relocatable validator surface. Imported for the internal
// caller below and re-exported so this module's public surface keeps it.
```

### `packages/tools/src/validate/common.ts::SlotArity`

```text
// Validator-local slot model. validate/common.ts has no AssembledNonterminal
// instances (it walks already-read napi UntypedNode), so slot descriptors are
// built from bare name strings + locally-derived arity.
// The validator is the ONLY allowed reader of the opaque `origin` fact
// (feedback_metadata_not_behavior.md); the compiler never sees this type.
```

### `packages/tools/src/validate/common.ts::SlotModel::storageKey`

```text
// always `_<name>` (or `$other` for the catch-all unmatched-children slot)
```

### `packages/tools/src/validate/common.ts::SlotModel::metadata`

```text
/** Validator-only facts; read ONLY via `readFacts` (never branched on by the compiler). */
```

### `packages/tools/src/validate/common.ts::CorpusEntry`

```text
// ---------------------------------------------------------------------------
// Corpus parser — tree-sitter test corpus format
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::parseCorpus`

Splits a tree-sitter test corpus file into entries exactly as the
`tree-sitter test` harness (cli/src/test.rs) does, so the validators see the
bytes the parser was tested on:

- A header is a `===` line, the name line (plus attribute lines), and a
  closing `===` line. Only headers whose suffix (text after the `=` run)
  equals the first header's suffix count, and only dividers with that
  suffix split input from expected tree.
- When a body holds several matching `---` dividers, the one with the most
  hyphens splits it (the line ending doesn't count); on a tie, the last, as
  the harness's `max_by_key` returns the last of equal maxima.
- The input is the bytes from the header's end to the divider, minus one
  trailing `\n` (and a `\r` before it). A typical entry therefore reads as
  `"\n<source>\n"`; the leading newline stays, and a token that needs its
  line end (a shebang) keeps it.

Entries are dropped, not counted, when they carry `:error`, when their
expected tree holds `(ERROR` or `(MISSING` (intentional error tests), when
`:language(x)` names a grammar other than `grammar` (the validator loads a
single parser per grammar), or when the input is blank.

### `packages/tools/src/validate/common.ts::loadCorpusEntries`

A grammar's corpus: every `upstream/*.txt` under
`packages/codegen/fixtures/<grammar>/` in name order, then that directory's
`local.txt` (sittir-authored entries). A grammar with no entries throws,
naming `sittir tool fetch-corpus --grammar <grammar>`; an empty corpus
would otherwise report a passing 0/0 run.

### `packages/tools/src/validate/common.ts::NativeEngine`

The public engine a validator reads and renders through, typed for any grammar: `Engine<LanguageAPI>`. One engine per grammar per process, because a coordinate names the tree by the tag its engine minted.

### `packages/tools/src/validate/common.ts::kindViewOf`

The kind view a validator crosses data through (`KindView`), built from the engine it loaded: the engine's `rebuildWrappers` for `isWrapper`. It is the view the engine's own render uses, so the detached input `selfContainedRenderInput` builds carries the edges the validated render printed.

### `packages/tools/src/validate/common.ts::loadNativeEngine`

```text
/**
 * The engine the corpus validators read AND render through: the grammar's
 * public engine (`createEngine` over its language descriptor), never a
 * second instance. A coordinate names the tree by the tag its engine minted,
 * so a node read through one engine cannot render through another — the read
 * handle and the render must share the instance. That holds for concurrent
 * callers too: the validators of a grammar run side by side, so the cache
 * holds the load itself rather than its result, and every caller awaits the
 * one engine. Caching the result after the load lets each concurrent caller
 * create its own, and a tree read in one engine then fails to render in
 * another.
 *
 * Cached per grammar with the binary mtime: napi modules cannot be
 * re-dlopened in-process, so a binary rebuilt mid-process is refused loudly
 * rather than validated stale. The staleness gate (`assertNativeBinaryFresh`)
 * runs on first load.
 */
```

### `packages/tools/src/validate/common.ts::createNativeEngine`

```text
// Debug binaries have a known segfault class under validation; refuse
// them unless explicitly allowed. Binaries predating the getter report
// undefined — tolerated.
```

### `packages/tools/src/validate/common.ts::loadNativeRender`

The render function of a grammar's cached native engine, `(node) => string`: what the validators and exercise tools render node data with, and, because it is the engine that read the tree, the one that can resolve its coordinates.

### `packages/tools/src/validate/common.ts::fixtureReplayOf`

How a render fixture is replayed away from its tree: the grammar's own native engine renders the fixture's input with the options the fixture recorded (`RenderFixture.options`, the tree's inferred layer). The fixture capture's reproducibility check (`extractParityFixtures`) and the baseline's parity collection (`collectParityFixtures`) both replay through it, so a fixture counts as reproducible by the one test that later scores it. A replay that dropped the recorded options would render at the engine's indent unit and root edges, not the tree's.

### `packages/tools/src/validate/common.ts::FixtureReplay`

A fixture replay: input and recorded options in, the rendered text out.

### `packages/tools/src/validate/common.ts::readNativeTree`

Parses `source` in the engine and returns the raw `{ root, tree }` its diagnostics give, the tree typed as the reader's `TreeHandle`. The engine binds the tree, so nodes wrapped over it stamp the engine. The one place the diagnostics' opaque tree is read as a handle.

### `packages/tools/src/validate/common.ts::cachedNativeEngineProfile`

```text
/**
 * Compile profile of the cached native engine for `grammar` ('debug' |
 * 'release'), or undefined if its engine has not finished loading (or the
 * binary predates the `buildProfile` getter). A debug
 * profile only reaches here via `SITTIR_ALLOW_DEBUG_VALIDATE=1` — the loader
 * above refuses debug binaries by default — so callers that record results
 * (e.g. validation-history) still need to check this explicitly.
 */
```

### `packages/tools/src/validate/common.ts::buildReadHandle`

```text
/**
 * Build the read-side TreeHandle for the corpus validators. Selects
 * between the wasm/JS handle (default) and a native-engine handle
 * (when `SITTIR_BACKEND=native` is set). A native handle is the grammar
 * engine's own parse (`readNativeTree`): every read — root and
 * hydration alike — goes through the engine that also renders, so the
 * coordinates it hands out resolve at render time.
 *
 * The wasm `tree` is still required: validators use it for kind
 * navigation (`findFirst`, `collectKinds`) — that traversal needs a
 * raw tree-sitter tree the JS side can walk. The native engine owns
 * its own internal tree for reads; the two coexist within one probe.
 */
```

### `packages/tools/src/validate/common.ts::NativeNodeCoords`

`coordinate` is the node's own coordinate (`$_layout.at`, or the node itself when the walk met it unread); `embeddedData` is the native node as the whole-tree read holds it. A trivia entry read whole can carry data and no coordinate. The root is `{}`.


### `packages/tools/src/validate/common.ts::coordsOf`

What `walkNativeForKind` records for a node it visits: an unread coordinate as the coordinate alone, a native node as its stamped `at` beside the native node itself, and a native node with no `at` (a trivia entry the read handed over whole) as its data alone.


### `packages/tools/src/validate/common.ts::isUnitModelType`

Whether a kind's model type stores it as its kind id alone: a `keyword` or `punctuation` kind has one fixed text, so a slot holding it holds the id and no node. The one predicate behind the leaf test's unit case (`isLeafModelType`), the arm projection's unit case (`projectArmSlot`) and from-validation's unit-variant exclusion (`validateFrom`).


### `packages/tools/src/validate/common.ts::NativeNodeCoords::embeddedData`

```text
/**
	 * Set instead of `handle`/`childIndex` for a match found inside
	 * `$_trivia` — those entries are fully materialized at read time
	 * (not lazy stubs), so they carry no handle+child-index coordinates
	 * to re-read them by. Callers must use this data directly rather
	 * than calling `handle.read(handle, childIndex)`.
	 */
```

### `packages/tools/src/validate/common.ts::nativeNodeIsKind`

Whether a node from the native read is of a given kind name, under either identity it carries: the grammar symbol that parsed it (`$type`), or the kind the parser shows it as (`$displayType`, present only at an alias). The corpus names an alias envelope by the shown kind (`property_identifier`, `field_identifier`), so a lookup by `$type` alone would never find one. `findNativeNodeId` and `walkNativeForKind` both locate nodes through it.

### `packages/tools/src/validate/common.ts::findNativeNodeId`

The first `walkNativeForKind` candidate, narrowed to `span` when the caller passes one. The from validator passes its CST node's span converted to bytes (`sourceSpans(source).toSpan`), because a WASM node's indices count characters while a native span counts UTF-8 bytes; it passes none for the root. A span is a stamped read fact, so no text is compared, and a node found inside a trivia entry matches the same way.


### `packages/tools/src/validate/common.ts::NativeCandidateCoords`

```text
/**
 * A native candidate: navigation coordinates plus the node's byte span
 * (when available from the native AnyUntypedNode's `$span`).
 */
```

### `packages/tools/src/validate/common.ts::walkNativeForKind`

Reads the whole tree once (`handle.read(0, Infinity)`) and visits every native node in document order, each node's trivia entries (leading, trailing and inner) before its slot children. A coordinate met on the way (a child the read left unread) is read whole through `readNode` before its children are visited. Each candidate carries `coordsOf` the node: its own coordinate and the native node as the whole-tree read holds it, so a caller uses the data without reading it again; the root is `{}`, which `readNativeAt` reads as index 0. Empty for a handle with no native read.


### `packages/tools/src/validate/common.ts::findFirst`

The first named node under `node`, `node` included, whose kind is `kind`, depth first; `kindOf` names a node's kind as in `collectKinds`. Only named nodes match, because tree-sitter can give a named and an anonymous node the same `type` (typescript's named `string` literal and the anonymous `string` keyword in `predefined_type`), and the named kind is the one validated.

### `packages/tools/src/validate/common.ts::buildKindToSupertypes`

```text
Each kind's direct supertypes, from two sources that hold different facts.
node-types.json gives the parser's view, display names included: an alias
site such as typescript's `this` under `primary_type` is listed as
`this_type`, a name the model never holds. The node model gives every
supertype the grammar declares: tree-sitter leaves a supertype that is also
inlined out of node-types.json, so only the model still lists rust's
_declaration_statement or python's _suite. The node-types edges come first,
so a kind both sources list keeps the parser's order.
```

### `packages/tools/src/validate/common.ts::WrapForReparseResult.text`

```text
/** The rendered fragment spliced into the supertype wrapper template. */
```

### `packages/tools/src/validate/common.ts::WrapForReparseResult.offset`

```text
/** Byte offset where the rendered fragment begins in `text`. */
```

### `packages/tools/src/validate/common.ts::applyWrapperTemplate`

```text
/**
 * Apply a wrapper template to `rendered` and compute the byte offset at which
 * the rendered fragment begins inside the resulting string.
 *
 * @param rendered - The rendered fragment to splice into the wrapper.
 * @param wrapper - A function that takes the fragment and returns a full
 *   parse-valid program snippet.
 * @returns A `WrapForReparseResult` with `text` (the spliced program) and
 *   `offset` (byte position of `rendered` inside `text`).
 */
```

### `packages/tools/src/validate/common.ts::selectAndApplySupertypeWrapper`

```text
/**
 * Select the highest-priority wrapper reachable from `kind` via BFS over the
 * supertype graph and apply it.
 *
 * @remarks
 * Priority order: expression > type > declaration > statement > pattern (and
 * their `_`-prefixed siblings). Some kinds (python `attribute`, `subscript`)
 * are subtypes of BOTH `primary_expression` → `expression` AND `pattern`. A
 * pattern wrapper reparses an expression-shaped rendering as `dotted_name` /
 * other pattern kinds, not the original — so prefer the expression wrapper.
 * The ordering matches how tree-sitter grammars overload syntax: a construct
 * appears as an expression first, a pattern only in match-arm contexts, which
 * is the more restricted interpretation.
 *
 * Python's `attribute` has supertype `primary_expression` which isn't in the
 * wrapper map, but `primary_expression` itself is a subtype of `expression`
 * which IS mapped. BFS up through supertype chains so any mapped ancestor
 * produces a valid wrapping context.
 *
 * @param kind - The concrete grammar kind being wrapped.
 * @param wrappers - The grammar's wrapper map.
 * @param kindToSupertypes - BFS graph: kind → list of direct supertypes.
 * @param rendered - The rendered fragment to splice.
 * @returns A `WrapForReparseResult`, or `null` if no mapped ancestor exists.
 */
```

#### body

```text
// Declaration/statement-flavored wrappers come before expression/type/
// pattern ones: a kind can be reachable via BOTH (e.g. typescript's
// `internal_module`, which upstream tree-sitter-typescript lists under
// both `declaration` and `expression`) without the two positions being
// parse-equivalent. Statement-position content can carry positional
// tokens (e.g. an ASI-driven `automatic_semicolon`) that the external
// scanner only emits in statement context — wrapping the same bytes as
// an expression VALUE (`let _ = ${r};`) silently drops them even though
// the reparse itself succeeds without error. The declaration/statement
// wrappers are identity (`(r) => r`) and exactly reproduce the
// original top-level position, so they're strictly safer to prefer
// whenever reachable.
```

#### body

```text
// Reachable but not in priority list — take the first one.
```

### `packages/tools/src/validate/common.ts::VARIANT_ADOPTION_GATED_WRAPPERS`

```text
/**
 * Kind names whose direct `REPARSE_WRAPPERS[grammar]` entry should only
 * fire when variant() adoption is in effect for that kind. Otherwise
 * the wrapper is skipped so the baseline `{% if variant %}`
 * fall-through (a parent-template shape that only works under variant()
 * adoption) doesn't expose the kind to reparse where it'd render empty.
 */
```

### `packages/tools/src/validate/common.ts::wrapForReparse`

#### body

```text
// `kind` is the candidate's CANONICAL source kind (validator candidates
// are bucketed by the wire `$type`'s catalog name), so kind-specific
// wrappers keyed on source names — rust's disjoint `token_tree`
// (macro_rules arm body) vs `delim_token_tree` (invocation/attribute
// arguments) contexts — resolve directly through the lookups below.
// Canonical-hidden architecture (Option Y): the validator may pass
// a canonical hidden kind (`_x`) where REPARSE_WRAPPERS and
// `kindToSupertypes` are keyed on the visible alias-target name
// (`x`) — tree-sitter parser only sees visible names. Pre-strip
// for both lookups, but preserve the original `kind` for kind-
// specific lookups (e.g. `_expression` is itself a wrapper key).
```

#### body

```text
// Kind-specific wrapper first — the SOURCE kind's own context is the
// most specific one known: some kinds only appear in contexts their
// supertype's generic wrapper doesn't produce (rust `mut_pattern`
// surfaces in match/if-let but NOT in plain `let` statements), and a
// source-keyed wrapper must beat the alias-target preference below
// (rust `delim_token_tree` has targetKind `token_tree`, whose OWN
// wrapper is the disjoint macro_rules-body context).
```

#### body

```text
// Alias-target wrapper preference: when `kind` (the canonical source)
// differs from `targetKind` (the tree-sitter-emitted alias target), a
// wrapper keyed on the alias target — if one exists — reproduces the
// original parse position so reparse emits the same aliased kind. That
// keeps AST-match parity for kinds whose alias target doesn't survive
// a generic supertype wrapper (ts `interface_body` → `object_type`
// when reparsed in a `type _X = …;` context).
```

#### body

```text
// An alias-source occurrence sits in its alias TARGET's grammar
// position, so the target's supertype context is an equally valid
// reparse context — reach it when the source kind has no supertype
// edges of its own (e.g. python's `lambda_within_for_in_clause`,
// whose display `lambda` is the name the supertype graph knows).
```

The wrapper is chosen by the kind being rendered when it is visible, else by the parse kind the fixture targets —
never by stripping underscores, which can land on an unrelated kind (`_number` is not `number`).

The grammar's root kind reparses as written, with no wrapper: `opts.root` names it. A kind with no wrapper of its own and no supertype wrapper returns `null`.

### `packages/tools/src/validate/common.ts::upstreamWasmPath`

The upstream judge: `.sittir/upstream.wasm`, the unmodified grammar sittir builds on, built by the regen with the same CLI. The upstream package's published wasm stands in only when that file is absent; a grammar with neither is an error naming the gen command. An unknown name yields `undefined`.

### `packages/tools/src/validate/common.ts::nativeNodeIsKind`

A native node is a kind when its `$type` or its shown kind id (`$displayType` when present) names it; numeric ids resolve through the grammar's `kindNameFromId`.

### `packages/tools/src/validate/common.ts::readNodeOf`

The grammar's wrapped read, built from the generated wrap module's `wrapNode` and `hydrate`: the root, or the node a coordinate names, read `depth` levels down and wrapped, so nodes arrive under their source kind. The wrap module is required (`requireGrammarModule`): a module that cannot load, or lacks either export, throws, and each validator turns that into its failed run.

### `packages/tools/src/validate/common.ts::loadWrapNode`

The generated wrap module's `wrapNode`, from the required module: the wrapper `readNodeOf` applies after reading, for data already materialized (a trivia entry's `NativeNodeCoords.embeddedData`) that has no handle to read through.

### `packages/tools/src/validate/common.ts::Seat`

```text
/**
 * The validator-facing factory metadata: five sections of `node-model.json5`
 * (emitted from the single `buildFactoryMap` derivation), which the validators
 * read here — there is no validator-side re-derivation.
 */
```

```text
/**
 * Where a hoisted kind sits on the author-facing surface of its parent, as
 * the overlay decided and the node model stamped: an `arm` is reached through
 * the parent's mount route (`ir.<parent>.<mount>`), a `splice` spreads the
 * group's keys into the parent's config, `elements` keeps each element as
 * the group's config object.
 */
```

A `forwarded` seat names a group whose builder forwards to another kind's
builder: the parent takes the group's value whole under the slot key.

### `packages/tools/src/validate/common.ts::Seat::seated`

```text
/** An arm whose config-shaped child is handed to the wrapper as its own
	 *  config under the slot key, because a key it would merge is also a slot
	 *  of the parent. */
```

### `packages/tools/src/validate/common.ts::SeatTable`

```text
/**
 * `seats[parentKind][slotName][seatKind]`; a list's element seats sit under
 * the slot name `*` because a list's elements arrive as unnamed children.
 */
```

### `packages/tools/src/validate/common.ts::ParsedNodeModel`

The shape of a parsed `node-model.json5`, only the fields the validators read. Each slot carries its own factory flags (`registered`, `optionDefault`); the record has no top-level factory-slot table.

### `packages/tools/src/validate/common.ts::parseNodeModel`

Projects a node model's text into the validators' tables; `loadNodeModel` reads the grammar's file and parses it here, so a test can build the tables from a literal model. `renamedFrom` and `splitFrom` collect each node's provenance by kind. What the record leaves out it fills through codegen's reader (`node-model-read.ts`): each slot's kinds and default value names, and the factory slots of every kind with a factory shape. `displayUnions` comes through as stored.

### `packages/tools/src/validate/common.ts::loadBoundNameOf`

The base-to-bound kind name mapping, from the node model's `renamedFrom` through codegen's `boundNameOf`. Fixture lists and parity tables written in base names translate through it.

### `packages/tools/src/validate/common.ts::readNodeModelFile`

```text
/**
 * Load a grammar's `node-model.json5` and project the validator-facing factory
 * metadata. `factoryShapes` / `factoryFields` are reindexed from the per-node
 * records (pure reshape of serialized facts); `factorySlots` / `fieldAliasMap` /
 * `polymorphVariants` are read verbatim from their top-level sections. The file
 * is plain JSON (emitter uses `JSON.stringify`), so no comment-stripping. Returns
 * empty maps when the grammar is unknown or the file is unavailable — mirrors the
 * legacy `loadFactoryMap` fail-soft behavior so bootstrap runs don't throw.
 */
```

### `packages/tools/src/validate/common.ts::walkWrappedTree`

```text
/**
 * Walk a wrapped tree via declared getters, calling `visit` on each
 * encountered wrapped node. A stored member is read through the accessor
 * the model names for it (`slotAccessorOf`, by the node's stamped kind id);
 * a stored member the model has no slot for (a list's `_delimiter`) is
 * plain data. Each child materializes through the wrap layer's hydration
 * ($type on every node is the grammar-symbol wire identity stamped by the
 * read).
 *
 * `$`-prefixed keys are spread UntypedNode metadata (not child getters)
 * and get skipped. Leaves short-circuit when accessing a getter that
 * doesn't return a wrapped-shape value.
 */
```

#### body

```text
// $parentHandle + $childIndex form the composite dedup key: a handle can
// repeat across child positions, so neither part suffices alone.
```

### `packages/tools/src/validate/common.ts::AccessorThrowRecord`

```text
/**
 * One accessor-throw occurrence — a slot's declared getter threw instead of
 * returning a value, so `resolveWrappedStorageValue` fell back to the raw,
 * unwrapped stub for that slot (see its doc comment for what that masks).
 * Callers that care about these beyond the unconditional stderr line pass an
 * `onAccessorThrow` collector through to receive one record per occurrence,
 * in addition to — not instead of — the stderr line. `validateReadRenderParse`
 * fails the entry on any.
 */
```

### `packages/tools/src/validate/common.ts::ValidatorSkip`

```text
/**
 * One untested item, named, with the reason it went untested. Every
 * validator result carries these lists, so that no item leaves a
 * validator without a record:
 *
 * - `skips`: items counted in `total` but neither passed nor failed. The
 *   result's `skip` count is `skips.length`, derived from the list rather
 *   than kept as a separate counter, and `fail` is `total - pass - skip`.
 * - `excluded`: in-domain items dropped before counting (a corpus entry
 *   that does not parse, a candidate with no reparse wrapper or an empty
 *   render, a kind with no from/factory function or no render rule).
 * - `trivia` (from and read-render-parse only): items lost because the
 *   native read dropped an extra (a comment with no named non-extra
 *   sibling to attach to). Kept out of `total`, `pass`, `fail` and `skip`,
 *   and reported as `<stage>-trivia` at severity `warning`, classified
 *   `trivia` with its own shrink-only ceiling.
 *
 * Items outside a validator's domain (anonymous nodes, supertypes, pure
 * leaves, kinds outside the grammar's rule set) are not in either list.
 * `collectValidatorFailuresForGrammar` writes both lists into
 * `validation-report.json` at severity `info`: one `<stage>-skip` entry per
 * skip, and one `<stage>-excluded` entry per (reason, kind) carrying the
 * candidate `count` and the sorted corpus `entries` it came from.
 */
```

### `packages/tools/src/validate/common.ts::resolveWrappedStorageValue`

#### body

```text
// Unconditional (not env-gated): a thrown accessor here means this
// ENTIRE slot falls back to raw, unwrapped stubs below — including
// any sibling elements in an array-valued slot that wrapped fine on
// their own. Without SITTIR_VALIDATOR_DUMP_ACCESSOR_THROW, the only
// visible symptom is a downstream render/FromNapiValue error on an
// innocent sibling element, which misdirects investigation toward
// that sibling instead of the actual failing accessor.
```

### `packages/tools/src/validate/common.ts::IrEntry`

```text
/** One `ir` binding: the bundle's `strict` plus its mount routes by name. */
```

### `packages/tools/src/validate/common.ts::IrSurface`

```text
/**
 * The author-facing factory surface: every kind bound on `ir`, keyed by its
 * canonical kind, plus the seat table that says how a hoisted child is
 * spelled on its parent. A kind without an entry (a privately wired hoisted
 * kind, or one an overlay does not bind) is built through its raw factory.
 */
```

### `packages/tools/src/validate/common.ts::loadStorageKindNameFromId`

```text
/**
 * Storage-identity resolver: id → the canonical catalog kind name
 * (KIND_NAMES). The display resolver below serves the native<->WASM
 * locator, whose names must match tree-sitter's raw `.type` label — an
 * ALIASED id therefore resolves to its parse FACE there, never to the
 * storage kind. Identity decisions (which from/factory pair owns a read
 * node) must use THIS resolver instead.
 */
```

### `packages/tools/src/validate/common.ts::loadIsLeafKind`

The model's own classification of a kind as a leaf (`isLeafModelType`), keyed by kind id through `loadKindNameFromId`.

### `packages/tools/src/validate/common.ts::loadKindNameFromId`

Names a kind id with its display name from the generated `KIND_DISPLAY_NAMES` (not `KIND_NAMES`): it feeds the native/WASM kind-name bridge (`findNativeNodeId`, `walkNativeForKind`), which compares against tree-sitter's own `.type` string. The types module is required (`requireGrammarModule`), so a grammar whose module cannot load throws instead of answering nothing, and an id the table does not name throws: the table names every kind id and `ERROR`, so such an id is a defect, never a label to fall back on.

### `packages/tools/src/validate/common.ts::loadKindIdFromName`

The grammar package's generated `kindIdFromName`, from the required types module (`requireGrammarModule`). It throws on a name the catalog does not have, so a caller that reads names outside the catalog wraps it.

### `packages/tools/src/validate/common.ts::loadLanguageForGrammar`

```text
/**
 * Load the best available parser for a grammar: override-compiled
 * WASM if it exists, otherwise the base grammar's WASM from npm.
 *
 * The override WASM is built by every regen (`buildParserWasm`) and lives at
 * `packages/<grammar>/.sittir/parser.wasm`. When present, it carries
 * all field labels from transform()/enrich() patches natively.
 */
```

#### body

```text
// Hash-verify the grammar's generated content before any consumer touches
// it. This is the universal choke point — every validator, every probe,
// every dev tool that loads a grammar funnels through here. See A5 in
// docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md.
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts`

```text
// ---------------------------------------------------------------------------
// nodeToConfig — UntypedNode → factory Config-shape conversion
// ---------------------------------------------------------------------------
//
// Validators read tree-sitter output through the typed read (snake_case `_<name>`
// keys, $-prefixed metadata). The factory signatures take `ConfigOf<T>`:
//   - top-level keys in camelCase (snake→camel on each `_<name>` entry)
//   - `children` in place of $children
//   - leaf values as bare strings (factory leaf signatures are `(text: string)`)
//   - branch values as UntypedNode produced by THAT kind's factory — when
//     `tree` + `factoryMap` are supplied, children are hydrated
//     (`hydrateForConfig`) and reconstructed through their own factory before
//     being installed under the parent's config. This is what makes the
//     factory layer actually exercise construction instead of passing
//     data through verbatim; a declared-type mismatch (e.g. a
//     match_statement.body typed as Block but carrying case_clauses)
//     surfaces at construction time via the child factory's ConfigOf
//     rejecting the shape it was given.
//
// Plain shallow mode (no tree/factoryMap) still works and matches the
// older camelFields behavior so other validators can adopt this helper
// without the recursion cost.
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::factoryShapes`

```text
/** Per-kind factory signature hint (from the generated `_factoryShapes`
	 * map). `'config'` expects a Config object; `'children'` is rest-
	 * params `(...children)`; `'text'` expects a bare string. Without
	 * this, recursion defaults to `'config'` which breaks children-shape
	 * factories (e.g. python `argument_list`) because they'd interpret
	 * the whole Config object as the single rest-param item. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::fieldAliasMap`

```text
/** Per-field alias-source map (from the generated `_fieldAliasMap`).
	 * Key format: `"parentKind.fieldName"`; value: the source kind the
	 * factory expects. When a child arrives at an alias-declared slot,
	 * its tree-sitter-emitted $type is the alias target; `resolveChild`
	 * consults this map to dispatch the matching source-kind factory
	 * instead. Without it, an aliased field silently dispatches the
	 * wrong factory (e.g. `block` factory on a `_match_block` body). */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::factoryFields`

```text
/** Per-kind list of declared factory Config field names (from the
	 * generated `_factoryFields`). Drives orphan-child promotion: when
	 * a read node has $children but the expected field is missing from
	 * $fields (tree-sitter elided the label — python `list_splat` at
	 * expression-statement position is the canonical case), route
	 * children into the declared fields by position. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::factorySlots`

```text
/** Per-kind slot metadata (from the generated `_factorySlots`).
	 * Drives config-surface normalization for both named and unnamed slots. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::cstNodeKindHint`

```text
/** Validator-supplied CST node-kind fallback for override polymorphs whose
	 * read shape collapsed the discriminating wrapper before factory dispatch. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::firstNamedChildKindHint`

```text
/** Validator-supplied CST fallback for override polymorphs whose native
	 * read collapsed the wrapper child kind before factory dispatch. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::namedChildKindHints`

```text
/** Ordered CST named-child candidates for override polymorphs whose
	 * discriminating wrapper kind is not the first named child. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::_parentKind`

```text
/** Internal — current parent kind during field recursion. Used with
	 * `fieldAliasMap` to form `${parentKind}.${fieldName}` lookups. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::_fieldName`

```text
/** Internal — current field name during field recursion. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::_depth`

```text
/** Internal recursion guard — set by the helper, not the caller. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::kindNameFromId`

```text
/** Resolver for numeric $type → string kind name; every read node
	 * carries a numeric $type. */
```

### `packages/tools/src/validate/common.ts::NodeToConfigOpts::surface`

```text
/** When set, nodes are built through the author-facing `ir` surface and a
	 * hoisted child is projected by its seat instead of built on its own. */
```

### `packages/tools/src/validate/common.ts::ReadNodeLike`

The shape of a read node as the tools consume it: its `$`-metadata (`$type`, `$text`, `$span`, `$parentHandle`, `$childIndex`, `$named`), its unnamed children under `$other`, and its `$_trivia`. It is the one read-node type in tools; the exercise roundtrip and the factory-source printer import it rather than declaring narrower copies.

### `packages/tools/src/validate/common.ts::ReadNodeLike::$type`

The node's kind id (`TSKindId`); a reader resolves it to a kind name through the grammar's `kindNameFromId`.

### `packages/tools/src/validate/common.ts::isAnonTokenPassthrough`

Whether a child is an anonymous token object (`$named === false`). `resolveChild` passes one through unchanged only when it is given no tree, where the child is the read node itself. Building from a tree, it refuses one: stored data holds a token as its kind id, so a token object reaching a builder input is a fault, never an input.

### `packages/tools/src/validate/common.ts::resolveAliasedKind`

```text
/**
 * Resolve the effective factory kind for a child, unaliasing the
 * tree-sitter-emitted kind when the declaring slot has an alias-source
 * registered in `fieldAliasMap`.
 *
 * @remarks
 * `fieldAliasMap` is keyed `parentKind.fieldName` → `{ targetKind: sourceKind }`.
 * Example: python `match_statement` has `body: alias($._match_block, $.block)`,
 * so `match_statement.body` maps `'block'` → `'_match_block'`. A child with
 * `$type 'block'` arriving at that slot dispatches to the `_match_block`
 * factory (whose config accepts `alternative: CaseClause[]` rather than the
 * plain block's `children: Statement[]`).
 *
 * @param rawKind - The kind as emitted by tree-sitter.
 * @param parentKind - The kind of the parent node, if known.
 * @param fieldName - The field name under which the child was found, if known.
 * @param fieldAliasMap - Per-field alias-source map.
 * @returns The source kind to dispatch, or `rawKind` when no alias applies.
 */
```

### `packages/tools/src/validate/common.ts::resolveChild`

One child of a node as the config takes it. A scalar passes through. Given no tree or no factory map, a child object passes through unchanged: it is the read node itself, which a builder admits. Given both, the child is hydrated (`hydrateForConfig`) and built through its kind's factory (`buildWithFactory`); a kind with no factory of its own is resolved through its single wrapped child. A builder is never handed a node it could not build: an anonymous token object, a kind with no factory and no single wrapped child, and a node nested more than 64 deep each throw, naming the kind and its slot path (`pathOf`).

#### body

```text
// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
```

#### body

```text
// Phase D: kindNameFromId returns the canonical form (e.g. '_type_identifier')
// but factoryMap is keyed by the tree-sitter visible name ('type_identifier').
// If the factory lookup fails and kind starts with '_', try the stripped form.
```

### `packages/tools/src/validate/common.ts::soleWrappedNode`

```text
/**
 * The concrete node inside a factoryless wrapper. A supertype the read stamps
 * over its child (`_non_special_token` over a `string_literal`) has no factory
 * of its own, and holds that child under a single `_<kind>` key; resolution
 * has to go through it or the child arrives unbuilt. Only a node with a
 * factory of its own is unwrapped: a wrapper holding bare text, or a token
 * with no builder, is left whole, because its text is what names the kind id
 * or the leaf a caller would type.
 */
```

### `packages/tools/src/validate/common.ts::readNodeText`

```text
/**
 * Whether a node holds its own contents rather than being a lazy read stub.
 * A stub carries its coordinate and nothing else; a leaf's text, slot keys,
 * `$children` or `$other` all mean the node has already been materialized.
 */
```

```text
/**
 * The bytes a read node stands for: its captured text when the reader kept
 * one (an anonymous token, a text kind), otherwise the span it was read at,
 * sliced from the tree's source. Empty only when neither is known.
 */
```

### `packages/tools/src/validate/common.ts::hydrateForConfig`

```text
/**
 * Hydrate a stub through the grammar wrap's `hydrateChild` (the caller passes
 * it with the tree) before it becomes factory config, so its `_` keys are the
 * model's slots, as the accessors see them, before they are mapped to factory
 * slots. Without a tree or a hydrator, or when the handle lacks the node (a
 * factory-built subtree), the stub is left as is.
 *
 * A child that already carries its own contents is left alone. Re-reading it
 * would return the raw parse node and discard the wrap layer's per-slot kind
 * filter, which is what parks a separated list's separators in `$other`
 * rather than handing them back as elements.
 */
```

### `packages/tools/src/validate/common.ts::materializeDetached`

A wrapped tree as plain data with no coordinates: `materialize` resolves every accessor, then `detachCoordinates` drops what would tie the data to the tree it was read from. It is the input for a render that must not slice that tree: the probe's trace, read-render-parse's deep mode and the detached-render tests.

Detaching removes the hold on the tree with the coordinates, and a leaf whose slots are projected from its text keeps a text-only coordinate that a render still slices. The result is therefore given the tree of the root it was made from (`holdingTreeOf`), so it renders for as long as it is held.

Each copied node keeps the source identity of the node it copies (`carryPlace`), as a live rebuild does. A copy is not sliced, but its sides and its list slots' stored layouts are still read from the source, so the validator's render follows the source layout the way an edit would, rather than falling back to canonical.

### `packages/tools/src/validate/common.ts::holdingTreeOf`

Makes a copy hold the tree its original holds, through slots and trivia, and returns the copy. A parsed object holds its tree under a member only `@sittir/common` can write, which a spread copies and nothing that copies by string keys does (JSON, `Object.entries`, `detachCoordinates`). A coordinate that holds no tree is refused at render, so each tool that copies read data and still renders the copy passes the tree on here: `materializeDetached`, and the probe's JSON copy.

### `packages/tools/src/validate/common.ts::detachedHoldingTree`

Detaches read data in place and gives it back the tree it held. `detachCoordinates` releases the hold on every node, so the token is read first and held again after. The probe's deep reads use it before a render.

### `packages/tools/src/validate/common.ts::armRouteOf`

```text
/** The mount route a projected config asks for, when one of its slots is an arm seat. */
```

### `packages/tools/src/validate/common.ts::positionalOf`

```text
/** The exact arguments a positional parent takes, when a tuple seat filled its sole slot. */
```

### `packages/tools/src/validate/common.ts::flattenedOf`

What a projected config that carries a spliced group's keys in place of the
group records about that group, or `undefined` for a config with no spliced
group: `true` when the group's factory takes a config (the spliced keys are
that config), else the group's own call arguments. A direct parent takes a
seated positional group the way its emitted factory does, as the group's own
value (`wildcard_import_clause(path)`), never the spliced keys.

### `packages/tools/src/validate/common.ts::readValueKind`

```text
/** The canonical kind of a read slot value: a node's `$type`, or a kind-id leaf. */
```

### `packages/tools/src/validate/common.ts::seatForSlotValue`

```text
/**
 * The seat a read slot value occupies on its parent, when the parent is built
 * through the `ir` surface. A node or kind-id value is looked up by kind; a
 * bare text value takes the slot's only text arm; an array takes the slot's
 * elements seat.
 */
```

### `packages/tools/src/validate/common.ts::projectElements`

```text
/** Each element of an elements seat: the group's config object for a group element, a built node otherwise. */
```

The config of a group element carries its seat kind as a mark that is not a key (`withSeatKind`, read back by `seatKindOf`), because a `kind` key would be an unknown slot for the strict factory. The printer reads the mark to tag the element on the loose surface; it never infers the seat from the config's keys.

### `packages/tools/src/validate/common.ts::carryGroupTrivia`

```text
/**
 * A seated group has no ir object, so its own trivia moves onto the children
 * the call builds: leading entries to the first built child, trailing entries to
 * the last. One rule for every seat shape; a group with trivia and no built
 * child at that edge is recorded in `seatedTriviaEdges`.
 */
```

The same rule serves the `elements`, `tuple` and `flatten` shapes; the container is the config (or argument list) the shape projects, and the first and last built values are found in it past array nesting. The edge child is replaced in its container by a copy carrying the moved entries, never changed in place: a child is the cached built value of the read node, and a second projection of the same group would otherwise append the moved comment again. The group's sides are `groupSides`, entries resolved through `resolveChild`. Only its comments and `ERROR`s move: its layout runs lie at its flanks, which the list's source flank spells (`sourceFlankOf`), and moved onto a child they would spell that gap twice. `seatedTriviaEdges` is the census hook: it is empty across the five grammars' ir lanes.

### `packages/tools/src/validate/common.ts::projectArmSlot`

```text
/**
 * Project an arm seat child onto its parent's config the way the mount
 * route spells it. A token leaf hands the route nothing: the mount carries
 * the value. A text leaf hands its text. A config-shaped child on a config
 * parent is flattened when the seat merges: its keys join the parent's, and
 * a nested arm inside it extends the route, since a variant minted inside
 * another variant's rule is spelled inside it (`withLeft.withRight`). A seat
 * the model marks `seated` keeps its value whole under the slot — a
 * config-shaped child its config, a one-argument child (direct, or forwarded
 * to a non-spread target) its one argument — which is what the mount route
 * hands the child's builder; any other child hands the route its own factory
 * arguments under the slot, spread into the builder.
 */
```

### `packages/tools/src/validate/common.ts::splitRegisteredSlots`

A config key is the camelCase of its slot name (a kind-origin slot keeps its
name), while the factory slot metadata is keyed by the slot name. A key is
registered when it equals a metadata name or the camelCase of one, so a
multi-word registered slot keeps its option instead of falling into the config.

```text
/**
 * Pulls a kind's registered (spelling/choice) slots out of a projected
 * config — they have no home there any more, only in the factory's
 * trailing options argument — and returns what's left alongside them.
 */
```

With `omitOptionDefaults` (the example printer sets it), a registered value
equal to the slot's `optionDefault` (the grammar default, as a kind id or
spelling text) is dropped rather than passed, so the printed call reads in its
condensed form and the default reaches the node the way it reaches an unset
slot. The validators leave it off: an unset slot takes an engine option where a
passed value does not, so their storage comparison keeps the explicit value.
The options are `undefined` when nothing is left to pass.

#### body

```text
// The common case: nothing to split. Return `config` itself, not a
// rebuilt copy — `nodeToConfig` may have attached non-enumerable
// metadata (e.g. the POSITIONAL marker) that a plain-object rebuild
// via Object.entries would silently drop.
```

### `packages/tools/src/validate/common.ts::factoryArgs`

```text
/**
 * The positional arguments a factory of `shape` takes for a projected
 * config. A config whose arm seat asks for a mount route hands that route
 * the child's arguments directly on a non-config parent.
 */
```

#### body

```text
// `separatedListFactoryOptions` reads `_separator`/`_delimiter` off the
// raw read node by field name alone — a false match when the kind has
// its own unrelated structural field of the same name (e.g.
// member_expression's `.`/`?.` separator). Real list-options slots
// never coexist with a same-named config key, so that's the signal.
```

A spread or list builder takes its options first: a list's come from the read node's separator and delimiter, a spread builder's from its registered slots, split off the config before the elements are read.

A direct factory whose config carries a spliced group (`flattenedOf`) takes
the spliced keys when the group is config-shaped and the group's own value
otherwise.

### `packages/tools/src/validate/common.ts::walkMount`

```text
/**
 * The callable the `ir` surface offers for `kind`: the entry's `strict`, or
 * the mount route's `strict` when the projected config asks for one. A leaf
 * binding IS the callable, with no `strict` of its own, because its strict
 * and loose forms are the same call. A missing route is an error, not a
 * fallback: the seat said the spelling exists. `undefined` when the kind is
 * not bound on `ir`.
 */
```

```text
/** Walk a dotted mount (`withLeft.withRight`) down an `ir` entry. */
```

### `packages/tools/src/validate/common.ts::buildWithFactory`

```text
/**
 * Build `referenceData` through `factory` by the calling convention its
 * declared shape implies; on the `ir` surface the same convention is applied
 * to the kind's `ir` binding (or its mount route) instead.
 */
```

#### body

```text
// $TEXT-templated branch/container (e.g. rust raw_string_literal) —
// the factory accepts the raw source span because external-scanner
// delimiters can't be reconstructed from children.
```

### `packages/tools/src/validate/from.ts::kindIdDiffs`

The comparison of a from() result against a factory result when either is a kind id: a kind stored as its id has no node, so equality of the ids is the whole check. It answers `undefined` when neither side is an id (the structural diff applies), an empty list when the ids match, and one message when they differ. Both the scalarized leaf route and the read-driven route call it, so a from() that returns the wrong constant fails on either.

### `packages/tools/src/validate/common.ts::FactoryEntry`

One entry of a factory map: the factory function of a kind, or, for a `constant`-shaped kind (a keyword or punctuation kind with a build entry), the value itself. The dispatch returns a constant entry as it is and calls every other.

### `packages/tools/src/validate/common.ts::tableSides`

A read node's sides from its trivia table (`sideOf`), as trivia data a built value can carry. A comment is read whole through `tree` and built by the caller's builder, so it is built the way the caller builds every other node; an `ERROR` keeps its text, and a layout run keeps its whitespace member: a written entry with no whitespace renders on its owner's line, so the run is what keeps an own-line comment on its own line. `undefined` when every side is empty.

### `packages/tools/src/validate/common.ts::groupSides`

A read node's sides as the lanes build them: from its tree's table while it holds a tree (`tableSides`), else the trivia a detached copy carries, each entry resolved as a child. `writeSides` and `carryGroupTrivia` both take a node's sides from here.

### `packages/tools/src/validate/common.ts::writeSides`

A factory rebuilds a node from its config alone, and trivia is not config, so the lanes copy a read node's sides onto the value built from it. It is a copy, not an edit: the sides are set as data, and none of the trivia writers' refusals apply (a parsed typescript block holds its zero-width automatic semicolon as a stored child, which a built block renders with width). A node read from a tree takes its sides from the tree's table (`tableSides`); a detached copy carries its sides as data, each entry resolved as a child: `rebuildChildren` takes them from the table, and the factory-source emitter seats them from the read.

### `packages/tools/src/validate/common.ts::directFactoryValue`

```text
/**
 * The one positional value a `direct` / `forwarded` factory takes: the
 * kind's sole slot (the model's structural slot record, `factorySlots`),
 * else the first declared factory field, else the first child.
 */
```

### `packages/tools/src/validate/common.ts::isIdentifierShapedFieldKey`

```text
/**
 * Test whether a named-slot key is identifier-shaped and thus a valid factory
 * Config slot.
 *
 * @remarks
 * Promoted anonymous keyword / punctuation tokens use the token's raw text as
 * the storage key (e.g. `_,`, `_:`, `_(`). Factory Config types only declare
 * identifier-shaped slots; spreading punctuation keys pollutes the config
 * without ever being read by the factory.
 *
 * @param key - A raw key (without `_` prefix) from a named slot.
 * @returns `true` if the key matches `[a-zA-Z_]\w*` and should be included.
 */
```

### `packages/tools/src/validate/common.ts::slotOrigin`

```text
/** Read the validator-only `origin` fact off a slot's opaque metadata. The
 *  validator MAY branch on this (it's the deprecated-ish TS read path); the
 *  compiler may not — hence the explicit `readFacts` seam. */
```

### `packages/tools/src/validate/common.ts::getChildFactoryArgs`

```text
/**
 * Resolve the spread-shape factory's single rest-param slot from
 * `nodeToConfig`'s output. `nodeToConfig` only writes the literal
 * `children` key for genuinely UNNAMED ($other-derived) slots — a
 * spread-shape kind whose sole field has a real grammar name (e.g.
 * python `module`'s `statement`) gets that slot's model name instead
 * (`slotKeyOf`).
 * Without `factoryFields`, such kinds always read `undefined` here and
 * the spread call silently invokes the factory with zero arguments.
 *
 * @param factoryFields - Declared factory field list per kind (from
 *   `_factoryFields`). Optional for backward compatibility with callers
 *   that only ever exercise the genuinely-unnamed `children` case.
 */
```

### `packages/tools/src/validate/common.ts::nodeToConfig`

#### body

```text
// $type may be numeric (TSKindId) or string (hidden/synthetic kind).
```

#### body

```text
// Named slots are stored as `_<name>` top-level keys
// directly on the UntypedNode object (de-hoisted storage). Fall back to the
// legacy `$fields` wrapper for backward compatibility with old fixtures.
```

#### body

```text
// Missing declared fields were recovered from surviving named children.
```

#### body

```text
// Assign by position: first N named children → first N declared fields.
```

#### body

```text
// Ambiguous-free anonymous-token fill completed above.
```

#### body

```text
// Residual scalar children on optional singular `children` slots are token
// baggage from the native read path, not structural children for the factory surface.
```

### `packages/tools/src/validate/common.ts::emitValidatorMetrics`

```text
// ---------------------------------------------------------------------------
// Metrics emission helper
// ---------------------------------------------------------------------------
```

```text
/**
 * Single shared call site for `dumpMetrics` so all four corpus validators
 * funnel through one definition (DRY: one source, one derivation). The
 * metrics accumulator is process-wide; each invocation writes the
 * cumulative state, so when vitest runs all four validators against all
 * three grammars in one process the final write contains every per-kind
 * entry observed in that run.
 *
 * Backend selection mirrors `buildReadHandle`: `SITTIR_BACKEND=native`
 * → `'native'`; anything else → `'ts'`. No-op when `SITTIR_METRICS=1`
 * is unset (the underlying `dumpMetrics` short-circuits).
 *
 * @see packages/common/src/metrics.ts for the accumulator + writer.
 */
```

### `packages/tools/src/validate/common.ts::dedupeMismatchesByContainment`

```text
// ---------------------------------------------------------------------------
// Mismatch dedup — ancestor-containment collapse
// ---------------------------------------------------------------------------
```

```text
/**
 * A failing node re-renders as part of every enclosing ancestor kind's own
 * independent round-trip test, so read-render-parse and factory-storage
 * each report the same defect once per ancestor kind — one bug becomes N
 * rows. Collapse to the innermost (root-cause) span per entry: drop a
 * mismatch when another mismatch for the same entry has a span strictly
 * contained within it.
 */
```

### `packages/tools/src/validate/common.ts::separatedListFactoryOptions`

```text
/**
 * Build a separatedList factory's options bag from a read/wrap node's
 * kind-level separator facts — `_delimiter` (bitflag: leading = 1,
 * trailing = 2) and `_separator` (dynamic separator kind id). One wire
 * spelling: a delimiter-bearing list is always its own separatedList
 * kind, so the kind-level keys are the only place these facts live. A
 * read delimiter is always passed through, `Delimiter.None` included: the
 * factory's own default is the grammar's declared one and applies only
 * when the caller says nothing.
 */
```

### `packages/tools/src/validate/common.ts::FactoryDispatchArtifacts`

```text
// ---------------------------------------------------------------------------
// Factory-call dispatch — the ONE mapping from a factory's declared shape to
// its calling convention, shared by the factory-storage validator and
// the exercise tool.
// ---------------------------------------------------------------------------
```

### `packages/tools/src/validate/common.ts::buildFactoryNodeFromReference`

```text
/**
 * Dispatch `referenceData` through the factory call convention its declared
 * shape (`factoryShapes[kind]`) implies and return the built node. Throws
 * whatever the factory throws — callers own error recording. Returns `null`
 * when no factory is registered for `kind`.
 */
```

### `packages/tools/src/validate/trivia-placement.ts::module`

The trivia placement census behind `sittir tool trivia-placement`. It reads, it never changes behaviour. The owner rule is never re-derived here: placement comes from the parsed tree's trivia table. For every extra in a source's tree-sitter parse, the census finds the table entry that holds it. It records the owner's kind and the position (`leading`, `trailing` or `inner`), or `lost` when no side holds the extra. The summary counts each position. The command exits non-zero when any extra is lost, and a test pins every corpus and probe extra of rust, typescript and python to a placement.

### `packages/tools/src/validate/trivia-placement.ts::descendants`

Every node of a tree-sitter tree in preorder, anonymous ones included: the order a descendant index counts, so the n-th node is the one the table's index n names.

### `packages/tools/src/validate/trivia-placement.ts::tablePlacements`

Where the table puts each extra, from every node's three sides (`triviaSide`). An extra the table holds as a coordinate is found by its span. A layout member (python's line continuation) is held as its text, with no span, so it is found by its text, taken in table order: the census counts placements, and two continuations with one text are interchangeable for it.

### `packages/tools/src/validate/trivia-placement.ts::parsedExtras`

The outermost extras of a tree-sitter tree, in document order. An extra's own children are part of its entry, never separate extras.

### `packages/tools/src/validate/trivia-placement.ts::placementReader`

One grammar's parser and native engine, paired so that each source is parsed once for its extras and once natively for its table. Spans and descendant indexes match across the two because both parse the same source with the same grammar.

### `packages/tools/src/validate/trivia-placement.ts::runTriviaPlacement`

The placement rows for one source text, for probes and tests.

### `packages/tools/src/validate/trivia-placement.ts::computeTriviaPlacementCensus`

The rows and summary for one grammar's whole corpus. Entries that parse with errors are skipped.

### `packages/tools/src/validate/common.ts::LoadedNodeModel::fullForms`

Each kind's `fullForm` from the node model: the literal delimiters around its one text content.

### `packages/tools/src/validate/common.ts::LoadedNodeModel::oneSurfaceKinds`

The kinds the node model stamps `oneSurface`: one builder, no `.strict` or `.coerce` member. The factory-source printer spells their call as the bare path.

### `packages/tools/src/validate/common.ts::LoadedNodeModel::root`

The grammar's root kind as the node model records it; `undefined` when no model is loaded.

### `packages/tools/src/validate/read-render-parse.ts::validateReadRenderParse`

Reads each corpus candidate, renders it, reparses the render inside its supertype wrapper and compares the reparsed node's AST with the source's. The reparsed node is found at the wrapper's splice offset (`findReparsedNodeAtOffset`), past the candidate's own leading trivia. A candidate that is the tree's root (its kind is the first parse's root node type) is compared against the reparsed tree's root node directly: the root's render carries its source flanks, and a leading whitespace flank is padding tree-sitter starts no node at, so no offset names it. Every other candidate keeps the offset lookup, so a non-root render that starts with whitespace still fails it as `kind not found at rendered offset`.

A kind passes when any of its candidates round-trips, so a candidate that only renders badly is outweighed by one that renders well. A candidate that throws is not: an error while its input is read, rendered, measured (`leadingTriviaRenderedWidth`) or captured as a fixture (`selfContainedRenderInput`) is reported with its message and fails the entry whatever its kind's other candidates do, so a broken trivia view or line-gap query surfaces as a failure instead of one fewer fixture.

A read refused anywhere in an entry fails it the same way: a child whose hydration throws while the tree is walked for candidates, or while a candidate is materialized, reaches `onAccessorThrow`, and the entry's refusals are reported as `read:` errors. An entry whose refusal leaves it no candidate to test is a failure, not a `no-testable-kind` skip. The deep and shallow `read-render-parse` rows of `validate counts` therefore count every read refusal in the corpus.

### `packages/tools/src/validate/read-render-parse.ts::wrapRendered`

Rendered text inside its reparse host: the kind's own host (`wrapForReparse`), or, for a split kind that has none, the host of its placement's owner with the placement's source on either side, the offset moved past the prefix. `renderReparse` wraps through it, and the factory row's host check asks it with empty text, so a kind the row counts is one `renderReparse` can wrap.

### `packages/tools/src/validate/read-render-parse.ts::renderReparse`

The render-and-reparse step every rendering row shares. It renders a node with the native engine, wraps the text in its kind's reparse wrapper (`wrapRendered`), reparses it, finds the reparsed node of the target kind at the wrapper's offset (or the tree's root for a root candidate), and diffs its AST with the source node's (`astStructuralDiff`). It returns one outcome: excluded (no wrapper for the kind, or an empty render), failed (a reparse error, or the kind not at the offset), or round-tripped with the AST difference. A render that throws propagates, so each row reports it in its own terms. `loadRenderReparseContext` loads what it needs for a grammar once per run.

### `packages/tools/src/validate/factory-storage.ts::validateFactoryStorage`

Builds a node through the factory surface (raw builders, or the `ir` binding) from each corpus candidate's read, then checks two things apart. Its storage is compared with the read's (`compareNodeStorage`): the `factory-storage` and `ir-storage` rows. The built node is rendered and reparsed through `renderReparse`, its AST compared with the source's: the `render` result, the `built-render-parse` row. The render runs whether or not storage matched, so a storage defect and a render defect never hide each other. Both builds are given the read tree, so every child is built through its own factory: the storage comparison reads nested content the factory built, never the read's own children, and a builder is never handed a `materialize` copy. Only a candidate whose kind has no factory is skipped. A factory that throws, the kind's own or a child's, fails the candidate: the error is recorded, the storage comparison has nothing to compare, and the render still runs.

Each candidate tested is one case of its kind, and `total` and `casesByKind` are read from that one count (`KindCases`). The render counts the built nodes it renders the same way, taking a case back out when the kind has no reparse host or the render is excluded.

A built node carries no source identity, so its render cannot fold back to source bytes or classify its layout from the source. A node that does carry one (`placeOf` on it or any node under it) is a render failure.

### `packages/tools/src/validate/built-render.ts::combineBuiltRender`

The `built-render-parse` row: the render results of the raw and the `ir` runs summed, each kind's cases added across them (`casesByKind`), each failure's kind labeled with its surface (`surfaceLabel`: `factory: <kind>`, `ir: <kind>`).

### `packages/tools/src/validate/built-render.ts::BuiltRenderRun`

A storage run's render result while the run goes on: the counts and failures of `BuiltRenderResult`, with its cases in a `KindCases`, from which `finishBuiltRender` reads `total` and `casesByKind`.

### `packages/tools/src/validate/built-render.ts::finishBuiltRender`

The `BuiltRenderResult` of a run: its counts and failures, with `total` and `casesByKind` read from its cases.

### `packages/tools/src/validate/uncovered-content.ts::computeUncoveredContentCensus`

The census of corpus nodes that hold text no child of theirs covers, read the way the native reader reads them (a deep `readNativeTree` over every validate corpus entry). A node counts when some descendant span intersects its own, and any non-whitespace bytes of its span lie outside every descendant span. Trivia attached anywhere inside counts as covering. Rows group by the kind the node reads as (`$displayType` when present, else `$type`), with the node and entry counts, every distinct uncovered text, and the grammar producers `hiddenProducers` names for the grammar symbol that parsed it.

Such text is carried by a token tree-sitter hides from the node API: an unnamed pattern, a hidden terminal rule, or a hidden external. A reader that captures text only on anonymous, error, or childless nodes loses it, so the target is zero rows.

### `packages/tools/src/validate/uncovered-content.ts::hiddenProducers`

For a grammar symbol, the hidden token producers its rule reaches without crossing a visible node boundary, read from `.sittir/src/grammar.json`. It follows symbols into hidden (`_`-prefixed) and inline rules, and stops at visible symbols and at alias contents. It reports each unnamed `PATTERN` or non-literal `TOKEN`/`IMMEDIATE_TOKEN`, each hidden rule whose definition is a terminal, and each hidden external. Results are cached per symbol.

### `packages/tools/src/validate/uncovered-content.ts::uncoveredRuns`

The trimmed, non-empty text runs of a node's span that no descendant span covers. Descendant spans are clipped to the node's span, so trivia just outside it covers nothing.

### `packages/tools/src/validate/uncovered-content.ts::run`

`sittir tool uncovered-content`: prints the census per grammar (one line per kind, then each distinct uncovered text with its count), or the census as JSON with `--json`. Exits 1 when any grammar has an uncovered node.

### `packages/tools/src/validate/from.ts::structuralDiff`

Shallow comparison of a `from()` result against the factory's: `$type`, the slots the factory declares, the stored value of every `_<slot>` text slot on either side, and the count of named children. A text slot that differs, or that only one side holds, is a divergence; read metadata such as `$text` is not compared, because `from` on a node of its own kind returns the read node itself.

### `packages/tools/src/validate/from.ts::validateFrom`

A read leaf whose stored kind differs from the kind the corpus shows (an in-place leaf alias reads as the shared anonymous token) is validated by its text: `from(node.$text)` is compared with `factory(nodeToConfig(node))`, and `from(node)` must return the same object. Either the read identity is kept or the row is an error. The scalarized text and constant leaves, which have no node, keep comparing `from(text)` with `factory(text)` through the same closure.

An occurrence the read holds no node for is not a failure. The walk finds the first occurrence of each kind in the WASM tree, and when the native read has no node at its span, `unreadReason` names the model fact that explains it: inside an extra (`native-read-dropped-extra`, reported as trivia); under a parent the model stores as its text (`folded-into-parent-text`, a parent of `factoryShape` `text`, such as regex `zero_or_more` holding its `lazy` `?`); or a grammar symbol the model stores as its kind id (`read-as-unit-variant`, `isUnitModelType`, such as the `\-` a regex class reads as `bslash_dash`). An extra is reported as trivia. Any other kind is retried in later entries, so it is tested directly wherever some entry reads it as a node. A kind no entry reads as a node did not leave the grammar, it is stored inside its parent, so after the walk it is tested through the nearest ancestor of its first occurrence that the read holds, and that ancestor's result is credited to it; it counts toward the total like any tested kind. Each tested kind is one case, under its own name, and `total` and `casesByKind` are read from that one count (`KindCases`); a kind put back to be retried leaves it. An occurrence none of these explains stays an error.

Each occurrence is compared by `validateAt`, which looks the node up by the kind it is read as and credits the pass or error to the kind being tested; the two differ only when an ancestor stands in.

A display several storage kinds share is validated per storage kind (`occurrenceKind`, through `display-families.ts::physicalDisplayKind`): the corpus's kind set, the first occurrence and the ancestor walk name a node by its storage kind, and the native coordinate lookup names a native node the same way (`nativeKindName`). So each storage kind behind typescript's `string_fragment` or rust's `string_content` is checked against its own factory instead of the display's.

### `packages/tools/src/validate/common.ts::nodeToConfig`

#### interior projection

A read leaf that carries `$text`, whose shown kind has a token interior and whose stored slots do not yet hold it, is projected through `projectInterior`, the one projection the wrap and the coercer share, and read under the shown kind. A leaf already wrapped as its own kind has its slots and takes the unchanged path.

### `packages/tools/src/validate/common.ts::loadScopedFactoryMap`

The grammar's raw factory map with every builder run through the validators' native engine (`scopeBuilders`), so a composite that checks its content parses it back the way a user's build would. The engine is constructed with `verifyStructure: 'runtime'`, so every node a validator builds is checked against its kind's structure row. `loadIrSurface` scopes the ir entries the same way.

### `packages/tools/src/validate/common.ts::loadReparseHosts`

Loads the grammar's generated `reparse-hosts.ts` once; `wrapForReparse` reads it.

### `packages/tools/src/validate/factory-storage.ts::loadFactoryModuleForGrammar`

Loads everything factory storage validates against, or the one reason it could not: the raw factory map through `requireGrammarModule` (builders scoped to the existing engine), the validator-only calling conventions and slot metadata from the node model, factory identity from `loadStorageKindNameFromId`, and the wrapped read (`readNodeOf`). Every artifact is required, so a missing module, a module without its declared exports, or a failing types or wrap module returns `importFailure`, which the validator reports as a failed run rather than an empty 0/0 pass.

### `packages/tools/src/validate/factory-storage.ts::buildFactoryUntypedNode`

Dispatches materialized reference data through the existing factory calling convention, using the walked source kind so alias-source factories preserve their declared identities. Slot metadata, field aliases and CST hints pass through to `buildFactoryNodeFromReference`. A missing factory returns null; a thrown factory records the kind, corpus entry and source in the errors list and returns null so comparison can be skipped.

### `packages/tools/src/validate/factory-storage.ts::storageValueOf`

One stored value of a node as the storage comparison reads it: `$text` through `nodeText`, since a built leaf holds its text as a function and a materialized read holds it as a string; any other key as the node holds it.

### `packages/tools/src/grammar-internals.ts::Hydrate`

The signature of a grammar's generated `hydrate` (`wrap.ts`): a stored value as an accessor would return it, a coordinate read `depth` levels down through the given tree and wrapped.

### `packages/tools/src/validate/common.ts::hydrateOf`

The generated wrap module's `hydrate`, from the required module, so a validator hydrates read data on the same path as the accessors.

### `packages/tools/src/validate/common.ts::storedChildren`

Every node a native node stores in its `_` slots, list items included, in key order: the children `walkNativeForKind` descends into. A kind id or a text value is not a node and is skipped.

### `packages/tools/src/validate/common.ts::sideEntries`

Every node entry of a read node's sides (`sidesOf`, its tree's trivia table): its leading, trailing and inner sides, in that order, without their layout runs. `walkNativeForKind` descends into them, so a comment kind is found where the table assigns it.

### `packages/tools/src/validate/gap-census.ts::adjacentPairs`

Each item paired with the one after it, in order: the neighbouring list items whose gap the census measures, and the neighbouring field runs a separator sits between. Its items are objects, so a missing left neighbour is the only `undefined` it meets.

### `packages/tools/src/validate/common.ts::projectSeatedSlot`

Projects a seated slot's value into its parent's config by the seat's shape.
A `flatten` seat splices the group's own config keys into the parent's and
marks the config (`flattenedOf`): `true` for a config-shaped group, else the
group's call arguments, so a direct parent can pass the group's positional
value. A group present with none of its keys set (python's `c[::]` step
group, rust's `use ::*;` wildcard group) has no flattened spelling: it is
built through its own factory and passed under the seat's key, which the
seated surface accepts beside the flattened keys. An `elements` seat projects each element, and a `tuple` seat takes the
group's call arguments as the slot's value.

### `packages/tools/src/validate/reparse-derive.ts::deriveReparseHosts`

The reparse hosts a grammar's corpus supports beyond its declared ones, derived at validation time and never stored. A kind is hostable when a parent kind whose slots admit it (through hidden wrapper kinds and supertypes) is hostable. Admission compares kind ids: each model kind in a slot (or, for a list kind, among its element kinds) resolves to every symbol the generated `KIND_NAMES` table names with it, and a tree node is matched on its display symbol at an alias envelope and its grammar symbol elsewhere, so a display alias such as `simple_pattern` meets the model's `_simple_pattern` and a name that owns several symbols (a keyword and the alias of it) is not reduced to one. A list, alias or envelope kind holds its content as the node itself, so admission looks through it whether or not the corpus shows it elsewhere; a hidden supertype with no stamp is compared by its model name. The derivation's host lookups pass the adopted variant kinds and the kind itself as target, so a gated parent host serves the variants it gates. Its template is the parent's host with a corpus occurrence of the parent around the kind: the kind's span is replaced by the hole, and the kind's layout lead (the whitespace its text starts with, else the whitespace before its first child) stays in the template so a node that starts at a line break is hosted with that break and text-leaf kinds are not given padding. Samples are the kind's texts in the form a render has: shifted left by the indentation of the line the first character sat on, and left out when that shift is lossy (a continuation line indented less than the first, or a token spanning lines). Breadth first from the declared hosts: each round considers only parents hostable at the round's start, candidates order by shortest context then parent name, and the first template that verifies takes the kind. A template verifies when every distinct non-empty source text of the kind in the corpus (a zero-width instance has no text to place), placed in it, reparses without an error and yields at the hole a node of the kind that is structurally the source node (`astStructuralDiff` is clean), so a host that reads the source differently from its own parent — a raw string's content under an escape-parsing string, a keyword property name read as an identifier — never takes the kind. Declared hosts always win; a kind no verified template reaches stays hostless.

Corpus occurrences and their parents are also indexed under the canonical
model names of their grammar and display ids. Two physical parser symbols can
share a display alias while needing different hosts (Python's ordinary and
for-in-clause lambdas). Their storage-name buckets preserve that distinction;
the existing exact grammar-id lookup and structural comparison still verify
every candidate host.

### `packages/tools/src/validate/common.ts::setDerivedReparseHosts`

Merges a grammar's derived hosts under its declared ones in the per-grammar host cache, so `wrapForReparse` sees one table in which declared entries override derived ones.

### `packages/tools/src/validate/read-render-parse.ts::hostlessReason`

Why a kind without a host is excluded from a rendering row: `hidden-kind` when the kind has no node of its own to reparse (it never appears among the grammar's named kinds), `no-reparse-wrapper` otherwise. The two are counted separately so a hidden kind is not mistaken for a missing host.

### `packages/tools/src/validate/read-render-parse.ts::findReparsedNodeAtOffset`

The reparsed node of a kind at the splice offset. The kind is a grammar id wherever the source node is known, since a named rule and the keyword token it wraps share a name and a range but not an id; a name stands in only where there is no source node. Lookups run in order: past the candidate's own leading trivia (mapped through the indentation the host added to the lines before it), at the splice offset itself (a list kind's leading trivia belongs to its first element), and last at a node of the kind that starts inside the whitespace run just before the hole and spans it (a block node starts at the line break before its first line). Each requires the kind.

### `packages/tools/src/validate/read-render-parse.ts::readIdentityOf`

The id a parsed node reads as: its display id where the model's relaxation table says the node is a relaxed keyword or is shown as an alias of the word rule, else its grammar id. Host derivation, the reparse lookup and the structural AST compare use it, so a relaxed keyword equals its target and two spellings of one name share a host.

### `packages/tools/src/validate/common.ts::relaxesOf`

The generated reader's relaxation predicate over the node model's `relaxes` table.

### `packages/tools/src/validate/common.ts::collectKinds`

Every named node's kind under `node`, `node` included, as `kindOf` names it (by default `nodeType`).

### `packages/tools/src/validate/common.ts::nodeType`

A node's kind as tree-sitter names it, its `type`: the kind `findFirst` and `collectKinds` use unless given another.

### `packages/tools/src/validate/common.ts::isLeafModelType`

Whether a kind's model type makes it a leaf, a kind that carries text rather than slots: a `pattern`, an `enum`, or a unit (`isUnitModelType`). The one predicate behind the leaf test by kind id (`loadIsLeafKind`) and template coverage's skip of leaf kinds. Node-types can show a leaf with fields or children, for example a shared display's fixed-text storage or a pattern token's interior pieces, so coverage asks the model.

### `packages/tools/src/validate/common.ts::slotKeyOf`

The key a config holds a kind's slot under: the slot's model name, read from the factory slot metadata (`FactorySlotMeta.propertyName`), which the node-model reader derives once (`slotPropertyName`). The validators build every config through it and never camel-case or pluralize a slot name themselves. A slot with no metadata throws, naming the kind and slot, instead of falling back to a guessed key.

### `packages/tools/src/validate/common.ts::slotAccessorOf`

A kind's slots for the tools' walkers (`materialize`, `walkWrappedTree`, the exercise walker's `collectChildren`, the gap census), keyed by the node's stamped kind id through `kindNameFromId`: each storage key to the accessor that reads it, built once from the loaded model (`LoadedNodeModel.slotAccessors`, from `storageKeyOf` and `slotPropertyName`). It answers the kind's name with the map (`KindSlots`). A walker reads a stored member through its accessor; a member the model has no slot for is data and is copied as it is. A kind the model does not have throws, naming the kind, and so does a slot whose model-named accessor the node does not have as a reader (`resolveWrappedStorageValue`): the model and the generated node disagree. No walker derives an accessor name from a storage key. `loadSlotAccessorOf` builds it for a grammar from its model and `KIND_NAMES`.

### `packages/tools/src/validate/common.ts::slotNameOf`

A kind's slot, by its model slot name (the storage name a seat table or `factoryFields` lists), to the name a config builds it by and its accessor reads it by, from the loaded model (`LoadedNodeModel.slotAccessors`). The factory-source printer keys a seated slot (`wrapSeatedConfig`) and a trivia entry's content slot through it. A slot the model does not have throws, naming the kind and slot.

### `packages/tools/src/validate/common.ts::pathOf`

The slot path `resolveChild` names when it refuses a child: the steps `memberValueOpts` records in `NodeToConfigOpts._path`, or "the root" for the node `nodeToConfig` was called on.

### `packages/tools/src/validate/read-render-parse.ts::candidateData`

The candidate as its own source span has it. Its leading and trailing sides lie outside the span, where its parent renders them, so a candidate rendered alone leaves both out and keeps its inner side. The full-source lanes render those sides in place. A side the table gives a node can lie where a reparse of the node alone would take it inside (python's comment between `case …:` and its body's first statement is the body's leading side, which a reparsed block absorbs), so keeping it would compare an extra the source node never had. The candidate is an edit of its node (`markEdited`) holding its sides with both outer ones empty, so a parsed candidate renders from its storage rather than as its coordinate, which the render would frame with the sides its tree's table gives it, and a filled side (`$_layout.sides`) never restores them. `renderReparse` applies it first, so the read-render-parse, factory and ir lanes prepare a candidate in one place. The render fixtures the validator captures take their input through it too, so a fixture's input renders to the output it records.

value. An `elements` seat projects each element, a `tuple` seat takes the
group's call arguments as the slot's value, and a `forwarded` seat assigns the
value under the slot key as an unseated slot's value is.

### `packages/tools/src/validate/layout-runs.ts::withTreeOf`

Parses a source with a grammar's native engine, hands the tree id to the caller, and disposes the tree after, so each corpus diagnostic (`layoutRunsOf`, `storedLayoutOf`) reads one live tree per source and leaks none.

### `packages/tools/src/validate/layout-runs.ts::layoutRunsOf`

Every run of whitespace a side of the source's tree takes, each with the line breaks, spaces and tabs its read-time options write there (`SittirEngine::layoutBaseline`): read from the run's region, or from the whole tree's record when `whole`. The corpus test compares the two, the whole tally, for every run, so a region record that renders a token next to the run as a slice (and so cannot know its edge) shows up as a disagreement.

### `packages/tools/src/validate/layout-runs.ts::layoutWorkOf`

Reads, for a parsed node, the work its tree's layout reads have done so far: the nodes the region-depth walks entered and the items the sibling lookups visited, counted natively where the work is done. The growth gates compare these counts at two list lengths, so a quadratic path fails the same way on an idle machine and a loaded one; a timer only measured the machine.

### `packages/tools/src/validate/layout-runs.ts::storedLayoutOf`

How much of its layout the source's tree stores apart from its read-time options (`SittirEngine::storedLayout`): the runs a side stores as a member, the list slots that store a layout, and the items that store their own separator.

### `packages/tools/src/validate/layout-runs.ts::runLayoutRuns`

The layout rows of a grammar's corpus: how many runs, which no region's record reaches, which entries' region render was refused, and what the corpus stores (`stored`, summed over `storedLayoutOf`). The stored counts are small against the runs because the baseline is the read-time options, the tree's inferred layer over the engine's: a source's own conventions are inferred once and store nothing per gap.

### `packages/tools/src/validate/grammar-diagnostics-file.ts::readGrammarDiagnostics`

Reads `packages/<grammar>/.sittir/grammar-diagnostics.json` (written by codegen's `writeGrammarDiagnosticsJson`) as report entries. Every on-disk field is kept; `location` is added from `ownerKind` (and `.slotName` when present). A missing file reads as no entries, since a grammar may not have been generated yet. A file that exists but does not parse reads as one `grammar-diagnostics-read-error` entry naming the path, so a corrupt file is reported rather than counted as clean. The validation report (`writeMergedValidationReport`) and the regen status lines (`regenerateGrammars`) both read through it.

### `packages/tools/src/validate/grammar-diagnostics-file.ts::severitySummary`

One phrase counting diagnostics by severity, most severe first (`SEVERITY_ORDER`), skipping severities with none: `1 error, 2 info`, or `none`.

### `packages/tools/src/validate/grammar-diagnostics-file.ts::SEVERITY_ORDER`

Severities from most to least severe: `fail`, `error`, `warning`, `info`. The order `severitySummary` lists counts in.

### `packages/tools/src/validate/display-families.ts::DisplayFamilies`

The serialized node model's `displayUnions`: each display name with the storage rules tree-sitter shows under it (`DisplayUnionMember`).

### `packages/tools/src/validate/display-families.ts::sharedDisplayStorageKinds`

The storage kinds that share `display`: the non-literal members of its family when there are two or more, else `display` alone. Rust's `string_content` is shared by `raw_string_literal_content` and `string_content`; a family with one storage rule, or whose other members are literal tokens, keeps its display identity.

### `packages/tools/src/validate/display-families.ts::physicalDisplayKind`

The kind a node counts as: `storage` when it is one of the storage kinds sharing `display` (`sharedDisplayStorageKinds`), else `display`. A storage name outside the family keeps the display rather than crediting a member.

### `packages/tools/src/validate/display-families.ts::sharedDisplayEntries`

Node-types entries with each shared display's entry repeated once per storage kind (`sharedDisplayStorageKinds`), named for that kind. Template coverage walks these, so each storage kind's own template is checked against the display's node-types entry.

### `packages/tools/src/validate/kind-cases.ts::KindCases`

A validator's case counter, per kind. `add` counts a case (or several) of a kind, `remove` takes one back and throws when none is counted, and `total` and `byKind` read the same counts, so a result's `total` and its `casesByKind` cannot disagree. `byKind` sorts by kind and leaves out a kind whose last case was taken back.

### `packages/tools/src/validate/kind-cases.ts::CasesByKind`

Cases counted per kind, as a validator result and the baseline record them.

### `packages/tools/src/validate/surface-label.ts::surfaceLabel`

A failure's kind labeled with the surface whose run produced it, `<surface>: <kind>` (`factory: block`, `ir: block`). `combineBuiltRender` labels every built-render failure this way, so the built-render-parse row's `failingKinds` and the validation report name the surface; `kindOfLabel` reads the kind back.

### `packages/tools/src/validate/surface-label.ts::kindOfLabel`

The kind a `surfaceLabel` names, or the entry itself when it carries no surface. A kind name holds no `': '`, so an unlabeled kind reads back unchanged. The baseline check reads the built-render-parse row's failing kinds through it, to compare them with the grammar's `kinds`.

### `packages/tools/src/validate/glossary-keys.ts::GLOSSARY_TREES`

The four source trees the glossary covers, as paths from the repo root. The tool reads only these trees, and a key naming a file outside them is `out-of-scope-file`.

### `packages/tools/src/validate/glossary-keys.ts::GLOSSARY_DIR`

The directory of glossary documents, relative to the repo root. Every `.md` file in it except `README.md` is read for headings.

### `packages/tools/src/validate/glossary-keys.ts::UNDOCUMENTED_DEPTH`

How deep the undocumented count reaches: exported top-level declarations and their direct members, depth two. Nested properties below that are valid keys but are not counted as undocumented.

### `packages/tools/src/validate/glossary-keys.ts::DEFAULT_CEILINGS`

The checked-in ceilings file, relative to the repo root: one ceiling per broken class and one for the undocumented count. A run fails when a count exceeds its ceiling. `--update` only lowers a ceiling and creates the file when it is absent.

### `packages/tools/src/validate/glossary-keys.ts::VALID_CLASSES`

The valid key classes the tool accepts: `ok-bare-unique` (a bare name declared once in the file), `ok-owner-qualified` (a full path matching one declaration) and `ok-module` (a file-level `::module` key).

### `packages/tools/src/validate/glossary-keys.ts::BROKEN_CLASSES`

The broken key classes the tool counts: `ambiguous`, `no-declaration`, `wrong-owner`, `dot-separated`, `placeholder`, `out-of-scope-file` and `file-missing`. Each has a ceiling in the ceilings file.

### `packages/tools/src/validate/glossary-keys.ts::COUNT_NAMES`

The names a run reports counts under, in order: each broken class, then `undocumented`. The ceilings file has one entry per name.

### `packages/tools/src/validate/glossary-keys.ts::ValidClass`

The union of the valid key classes, taken from `VALID_CLASSES`.

### `packages/tools/src/validate/glossary-keys.ts::BrokenClass`

The union of the broken key classes, taken from `BROKEN_CLASSES`.

### `packages/tools/src/validate/glossary-keys.ts::KeyClass`

Any key class: a valid class or a broken one.

### `packages/tools/src/validate/glossary-keys.ts::CountName`

A name a count is reported under: a broken class, or `undocumented`.

### `packages/tools/src/validate/glossary-keys.ts::Declaration`

One declaration the compiler enumerates in a source file: its path within the file (owner names, then the member name), whether it is exported, and whether it is a static member. A static and an instance member of one name are two declarations.

### `packages/tools/src/validate/glossary-keys.ts::GlossaryKey`

One heading key read from a glossary document: the key text and where the heading is (document and line).

### `packages/tools/src/validate/glossary-keys.ts::ClassifiedKey`

A glossary key with its class, and the declaration it resolves to when it resolves to one.

### `packages/tools/src/validate/glossary-keys.ts::Classification`

The result of classifying one key: its class, and the resolved declaration path when the key resolves to exactly one declaration.

### `packages/tools/src/validate/glossary-keys.ts::Measurement`

A full run's result: every classified key, the count per name (each broken class, and undocumented), and the undocumented declarations themselves.

### `packages/tools/src/validate/glossary-keys.ts::Ceilings`

The ceilings file's content: an optional ceiling per count name. A missing ceiling is not checked.

### `packages/tools/src/validate/glossary-keys.ts::Regression`

One count that exceeds its ceiling: the name, the count, and the ceiling it breaks.

### `packages/tools/src/validate/glossary-keys.ts::GlossaryKeysOptions`

The options a run takes: `update` lowers the ceilings file, `table` and `json` choose the output form, `undocumented` lists the undocumented declarations, `ceilings` names another ceilings file, and `root` names the repo root.

### `packages/tools/src/validate/glossary-keys.ts::enumerateDeclarations`

Lists the declarations one source file contains, parsed through the TypeScript compiler API. Top-level declarations, class and interface members, enum members, const-object and type-literal properties, and namespace members are enumerated at any depth, each with an export flag. Bound names in destructuring exports and dotted namespaces are walked. Private members are skipped, protected members are kept, and a static and an instance member of one name stay two declarations. A const object is followed only through `as const`, `satisfies` and parentheses.

### `packages/tools/src/validate/glossary-keys.ts::inGlossaryTrees`

True when a file is a TypeScript source under one of the glossary trees. A key naming any other file is `out-of-scope-file`.

### `packages/tools/src/validate/glossary-keys.ts::enumerateTrees`

Enumerates the declarations of every source file under the glossary trees, keyed by repo-relative path. Test files and files whose first line is the auto-generated banner are skipped: they carry no authored declarations.

### `packages/tools/src/validate/glossary-keys.ts::readKeys`

Reads every `### \`file::key\`` heading from the glossary documents, with its location. A fence is skipped until a closing marker with nothing after it, so a `ts` line inside a fence does not end the fence early and hide a real heading after it.

### `packages/tools/src/validate/glossary-keys.ts::classifyKey`

Classifies one heading key against the enumerated declarations, in order: a file outside the glossary trees is `out-of-scope-file`; a missing file is `file-missing`; a `::module` key is `ok-module` once its file exists; a bare name declared once resolves; a qualified key resolves only when its full path matches exactly one declaration; a dot-separated qualifier is `dot-separated`; `<unknown>` is `placeholder`.

### `packages/tools/src/validate/glossary-keys.ts::measure`

Runs the whole measurement for one repo root: enumerates the declarations, classifies every heading key, and counts each broken class and the undocumented declarations, which are the exported declarations at depth two that no key resolves to.

### `packages/tools/src/validate/glossary-keys.ts::compareWithCeilings`

Lists every count that exceeds its ceiling. A count with no ceiling is not checked.

### `packages/tools/src/validate/glossary-keys.ts::loweredCeilings`

The ceilings an `--update` run writes: each count's ceiling lowered to the current count when the count is below it, and never raised. A name with no ceiling takes the current count.

### `packages/tools/src/validate/glossary-keys.ts::run`

The `sittir tool glossary-keys` entry point. It measures the repo, reads the ceilings file, and prints the result in the requested form. With `update`, it writes the lowered ceilings and creates the file when absent. Otherwise it fails when any count exceeds its ceiling, or when a ceiling is not a non-negative integer, which is refused rather than compared as NaN.
