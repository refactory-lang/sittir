# `packages/codegen/src/emitters` — Function Glossary

Per-function reference for `packages/codegen/src/emitters/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---





### `packages/codegen/src/emitters/consts.ts::emitBitflagConstEnums`

```text
/**
 * Walk the NodeMap and emit a `const enum` declaration per bitflag-
 * classified field. Deduplicates by `constName`: when two fields
 * collapse to the same name and carry the same keyword set, a single
 * declaration serves both.
 */
```

#### body

```text
// Sort alphabetically by constName for deterministic diffs.
```

#### body

```text
// Zero-flag member only when the repeat allows zero (plain repeat,
// not repeat1). For repeat1-backed bitflags, None would be a
// type-system lie — at least one flag must be present.
```

### `packages/codegen/src/emitters/consts.ts::collectBitflagBindings`

```text
/**
 * Walk the NodeMap and collect one BitflagBinding per bitflag-
 * classified field across all structural and group kinds. Resolves
 * the const name with collision disambiguation — fields whose name
 * collapses to the same PascalCase identifier across kinds get a
 * kind-prefixed name instead of the bare field-name form.
 */
```

#### body

```text
// Disambiguate collisions: a bare name used by more than one kind
// gets the prefixed form for every occurrence.
```

### `packages/codegen/src/emitters/consts.ts::bitflagBareConstName`

```text
/**
 * Compute the const enum name for a bitflag field from its property
 * name alone (collision-free form).
 *
 * Examples: `modifiers` → `Modifiers`, `functionModifiers` → `FunctionModifiers`.
 */
```

### `packages/codegen/src/emitters/consts.ts::bitflagPrefixedConstName`

```text
/**
 * Compute the disambiguated const enum name by prefixing the parent
 * kind.
 *
 * Example: `class_declaration.modifiers` → `ClassDeclarationModifiers`.
 */
```

### `packages/codegen/src/emitters/consts.ts::resolveBitflagConstName`

```text
/**
 * Resolve the bitflag const name for a given kind + field pair.
 *
 * This must agree with {@link collectBitflagBindings} — callers in
 * other emitters (types / factories / from) use this to reference the
 * emitted name.
 */
```

#### body

```text
// Recompute the collision map so callers don't have to thread it.
```

#### body

```text
// Ignore k/n unused warning — bareCounts only cares about collisions.
```

### `packages/codegen/src/emitters/consts.ts::fieldsOfNode`

```text
/** Yield the fields of a node — branch, group, or (TEMPORARY, see
 * isSlotBearingCompound's doc comment, shared.ts) separatedList. */
```

### `packages/codegen/src/emitters/emit.ts::emitAll`

```text
/**
 * Single-loop orchestrator: initializes all emitters, iterates
 * `nodeMap.nodes` once dispatching to each, then finalizes all.
 *
 * @param config - Union of what all emitters need.
 * @returns An object with every emitter's final output string.
 */
```

The render rules reach the emitters in three passes, in this order:
`spaceRenderRules` writes the separator and flank choices; the template
emitter's seam-stamping dry run (`stampStaticSpacing`) marks every static
seam on the members; `seamRenderRules` reads those stamps to inject the
token seam choices. The template, render-module and options emitters all
read the third pass's rules.

### `packages/codegen/src/emitters/engine.ts::emitRenderEngine`

The grammar's `render-engine.ts`: `createRenderEngine`, generic in the indent unit `I` it is given (`const I extends string`), so a literal `indent` in its options is checked whole against the grammar's `IndentChar` (`IndentOption`). The engine it returns is a `SittirEngine<Root, Options, IndentChar>`, whose `render` checks a per-call unit the same way.

### `packages/codegen/src/emitters/engine.ts::grammarTypeMapName`

The name of a grammar's type map, `<Prefix>TypeMap` (`RustTypeMap`), from the same type prefix as `grammars.ts::languageApiName`. `types.ts` declares it and `utils.ts` binds the runtime to it.

### `packages/codegen/src/emitters/engine.ts::emitApi`

The grammar's `api.ts`: the implementation a language descriptor loads. It declares the grammar's `LanguageAPI` (the builder table, guards, kind ids, the kind-to-node-type map keyed by each kind's ir key, the parsed root, the node union, the render options, and `indentChar`, which names the grammar's `IndentChar` alias from `options.ts`, and `empty`, the grammar's type-map member naming each kind's empty form) and exports `hooks`, which wire the package's render module hash, the builder table, guards, kind ids and trivia facts (joined by the grammar's comment coercer, `commentCoercer`, when it has a default trivia form, so a loose trivia string builds a comment), a native engine per engine through the shared `nativeLanguageEngine` adapter over `createRenderEngine`, and `wrapNode` for a parsed root and its tree, and `membership`, the guards' membership test (`isMember`, `membersOf`) for a query's `ofType`. The `hydrate` hook points to the existing `hydrateChild`, so factories resolve bound list stubs through the grammar's single child-hydration implementation.


```text
/**
 * Emit a per-grammar `engine.ts` that wires grammar-specific values
 * (KIND_NAMES, getActiveBackend) into the shared native wrapper from
 * `@sittir/common/engine`. Throws if native engine creation fails — there
 * is no JS-engine fallback.
 *
 * @param config - Grammar name (used in the JSDoc comment only).
 * @returns The full content of the emitted `engine.ts` file.
 */
```

`hooks` is frozen, and so is the trivia hook it carries (the grammar's facts, joined by the comment coercer when there is one), so every engine of the language shares facts that none can change.

### `packages/codegen/src/emitters/factories.ts::collectUsesNonEmptyArray`

```text
/**
 * Detect whether any field across all nodes uses `nonEmpty: true`.
 *
 * @param nodeMap - The assembled node map for the grammar.
 * @returns `true` when at least one field carries `nonEmpty`, triggering the
 *   `NonEmptyArray` import in the generated file.
 * @remarks
 *   `NonEmptyArray` is conditional on any field having `nonEmpty: true`
 *   (rust has none; typescript + python do). `Edit` was previously
 *   imported but no emitted body references it — dropped.
 *
 *   Also checks `AssembledList.nonEmpty` directly (a REPEAT1
 *   source rule) rather than through `.slots` — the
 *   generic slot surface can misderive a kind's real elements arity (see
 *   `emitSeparatedListFactory`'s doc comment), so it can't be trusted for
 *   this detection either.
 */
```

```text
// ---------------------------------------------------------------------------
// FactoryEmitter helpers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factories.ts::emitFluentSetterHelpers`

```text
/**
 * The old `_setField`, `_setFields`, `_branchMethods`, and `_leafMethods`
 * helpers are replaced by `withMethods` — emitted per-grammar in each
 * package's own `utils.ts` as a facade over `withMethods` from
 * `@sittir/common/utils` (see `.claude/codegen-conventions.md` rule 3).
 * Nothing to emit here.
 *
 * @returns Empty array — kept for call-site symmetry with `emitNonEmptyAssertHelper`.
 */
```

### `packages/codegen/src/emitters/factories.ts::emitNonEmptyAssertHelper`

```text
/**
 * Emit the `_assertNonEmpty` runtime guard + static narrowing helper source lines.
 *
 * @returns Array of source lines for the helper (without trailing blank line).
 * @remarks
 *   Callers get `readonly T[]` from input collections (`_children.filter(...)`,
 *   `_resolveMany(...)`, etc.) but the factory's stored shape is the non-empty
 *   tuple `readonly [T, ...T[]]`. This assertion function throws on empty input
 *   AND narrows the static type of the argument so the subsequent assignment /
 *   spread type-checks without a cast.
 */
```

### `packages/codegen/src/emitters/factories.ts::buildLeafReConsts`

The whole-text guard of every text-leaf factory. For each pattern-model kind that has a factory and a `textPattern`, it emits one module-scope constant `_leafRe_<factory>` holding the anchored literal `/^(?:<pattern>)$/`, and returns the kind → constant map the leaf guards read. The literal comes from `anchoredLeafRegexLiteral`, so the compile test and the emitted constant cannot drift. A kind with no derivable pattern (an external scanner token with no interior, an indent or dedent mark) gets no constant and keeps only its non-empty guard. Hidden fixed-text leaves have no factory and no constant.

The guards themselves (`buildLeafGuards`) always run: a non-empty check on every text leaf whose pattern does not accept the empty string (an empty doc comment is valid text for a `.*` leaf, so the pattern alone decides there) and, where a constant exists, `!_leafRe_<factory>.test(text)`. Neither is conditional on a debug flag; the guard is the factory's contract.

The grammar's word kind also gets the `reserved.global` words (`reservedWordset`), when the grammar declares any, as one `as const` list `_reservedWordList_<factory>`. Both its readers derive from that list: the runtime set `_reservedWords_<factory>` (map key `reservedGuardKey(kind)`) and the type `_ReservedWord_<factory>`, the list's element union (map key `reservedTypeKey(kind)`). Neither key can equal a slot guard key, because a slot name never contains `\0`.

With the type present, the word builder is generic, `<const W extends string>(text: W extends _ReservedWord_<factory> ? never : W)`, so a reserved literal fails to compile where it is written and a wide `string` reaches the runtime set. Only python declares a wordset today. `W` rather than `T`, because `T` names the types namespace in the factories module.

#### token interior

```text
Besides one anchored regex per pattern leaf, every text slot of a lexed kind gets its own anchored regex keyed
by kind and slot (interiorSlotGuards); the raw builder tests a slot value against that constant.
```

### `packages/codegen/src/emitters/factories.ts::factoryTypeDiscriminant`

```text
/**
 * Produce the `$type` line for a factory return object literal.
 *
 * When `kindEntries` is present, emits the
 * numeric `TSKindId.X` discriminant. Without it (legacy callers / unit
 * tests), falls back to `'kind' as const` so the emitter is backward-
 * compatible.
 */
```

#### body

```text
// All factory-emitting kinds must have a parser symbol. If kindEntries is
// present and this kind is absent, it's a TSGrammar-only kind that should
// have been filtered before reaching here — throw loudly so the emitter
// bug is surfaced at codegen time rather than producing a string $type.
```

#### body

```text
// `as const` narrows the literal type to the specific TSKindId member
// (e.g. `TSKindId.RangeExpressionBinary`), keeping `$type` discriminable
// for kind-narrowing in consumers — `is.functionItem(node)` etc. all
// match against the const-enum value, not the widened `number` type.
// Factory output remains structurally compatible with `AnyUntypedNode`
// because const-enum members ARE numeric at runtime; the $type read
// path doesn't widen.
```

### `packages/codegen/src/emitters/render-module.ts::seatLoops`

One `fill_seated_gaps` call per repeat slot that has seated sites and whose
elements can reach a seat (`slotElementsReach`), passing the slot's seat
table (`SEATS_<KIND>_<SLOT>`). The runtime walks the elements, so there is
no per-list match block: each element answers its own seat through
`SeatTarget`. A list field is never optional; a slot whose elements may
be absent is iterated through `Option::as_mut`, any other through
`Some`, so one core function serves both.

The core walk skips the last present element. A child's edge is written at
the end of its own body and cannot know whether a sibling follows, so
seating the final element would leak the gap past the end of the list
(`extern"C"fn foo` became `extern"C"\nfn foo` when it did). An absent
element renders nothing, so it is neither seated nor the sibling that makes
a gap. Skipping the last present one leaves its edge on the kind's own arm,
which makes "a sibling gap belongs to the child before it" literally true:
an element is seated only when a present element follows it. The seating happens in the parent's prepare, not in
the element's, because only the parent knows an element's position.

The seat fills an `after` edge only when nothing set it first. The slot's
`listGapClassification` runs before it, so a gap whose two items are still
adjacent in the source already holds its source class and keeps it; every
other gap takes the seat of the kind before it.

### `packages/codegen/src/emitters/render-module.ts::seatedListFields`

The repeat slots of a kind that take seats: named, multiple, with a seat
table (`SEATS_<KIND>_<SLOT>`), and with elements that can reach a seat
(`slotElementsReach`). `seatLoops` emits a call for each of them.

### `packages/codegen/src/emitters/render-module.ts::SeatReach`

Whether a kind can reach a seated element: a predicate over kind names,
computed once per render plan (`seatReachOf`).

### `packages/codegen/src/emitters/render-module.ts::wrapperSlotOf`

The one slot a polymorph wrapper holds its content in, or `undefined` for a
node that is not a polymorph wrapper (supertypes are excluded: they reach a
seat through their subtypes, not a slot).

### `packages/codegen/src/emitters/render-module.ts::slotElementsReach`

Whether any element kind a slot admits reaches a seat, classified the way
the transport emitter classifies the slot (`classifySlotForEmit`): a
concrete kind is looked up directly, a supertype slot by its supertype kind,
and a mixed slot through every concrete transport kind it expands to.

### `packages/codegen/src/emitters/render-module.ts::seatedKindsOf`

The public names of every kind some list seats (`site.seat.kind`): the
kinds whose own base `after` edge a seat table fills.

### `packages/codegen/src/emitters/render-module.ts::seatReachCache`

`seatReachOf`'s memo, keyed weakly by the render plan so a plan's reach set
is computed once and dropped with the plan.

### `packages/codegen/src/emitters/render-module.ts::SEAT_TARGET_SIG`

The emitted `seat_target` signature line, shared by the struct and enum
impls so the two cannot drift from the core trait.

### `packages/codegen/src/emitters/render-module.ts::seatReachOf`

The `SeatReach` for a plan, as a fixpoint over the node map: a kind reaches
a seat when it is seated itself, when it is a supertype one of whose subtypes
reaches, or when it is a polymorph wrapper whose content slot's elements
reach. Only kinds that reach get a `SeatTarget` impl, so the runtime descent
follows data and the emitter needs no visited-set. Cached per plan, since
every struct and enum impl asks it.

### `packages/codegen/src/emitters/render-module.ts::seatTargetMatchImpl`

`impl SeatTarget` for an enum (a supertype transport enum, a per-slot child
enum, `AnyTransport`): each reaching variant delegates to its payload, and a
non-exhaustive list falls through to `None`. An enum with no reaching
variant gets no impl.

### `packages/codegen/src/emitters/render-module.ts::seatTargetStructImpl`

`impl SeatTarget` for one transport struct that reaches a seat. A seated
kind looks itself up in the table by its kind id (`seat_site`) and answers
its own base `edges` with the site; a polymorph wrapper that is not itself
seated descends into its content slot. A wrapper keeps its own edges: the
descent is a separate trait, not an `Edged` delegation, so filling a seat
never overwrites the wrapper's own kind edges. A seated kind with no kind id
fails at codegen, and so does a seated fixed-literal kind: it is a unit
variant with no edges to answer.

### `packages/codegen/src/emitters/render-module.ts::renderSeatTargets`

Every `SeatTarget` impl for one render module, in one pass: struct impls for
the reaching nodes, then match impls for the used supertype enums, the
per-slot child enums and `AnyTransport`, each listing only the variants that
reach.

### `packages/codegen/src/emitters/shared.ts::emitsPlainBuiltAlias`

```text
/**
 * Whether the factories emitter declares a plain `<TypeName>Built` return
 * alias for this kind — the field-carrying and separated-list emission
 * paths (branch/group/separatedList with an emitted factory). Leaves and
 * polymorph forms never carry one.
 *
 * @remarks
 * ONE predicate for every consumer of "this kind has a Bound alias": the
 * types emitter passes it as NodeNs' `Built` argument (pinning the
 * `Fluent` projection to the factory's exact return type), and
 * buildFactoryMapEntries drives FluentKindMap entries with it. Deriving
 * the set locally at either site would let the generated
 * `F$.<TypeName>Built` references and the actually-emitted aliases drift.
 * (The factories namespace alias is `F$` — kind names are tree-sitter
 * identifiers, so no generated interface name can contain `$`.)
 */
```

```text
/** ONE predicate for "this kind declares a plain `<TypeName>Built` alias" —
 *  a local re-derivation would let the generated references and the
 *  actually-emitted aliases drift. */
```

### `packages/codegen/src/emitters/shared.ts::classifyFactoryEmission`

Whether a kind gets a top-level factory, and the skip reason when it does not. A presence marker (`isHiddenPresenceMarker`) is skipped as a hidden keyword literal; `buildFactoryMapEntries` skips the same kinds, and both read that one model predicate.

### `packages/codegen/src/emitters/factories.ts::buildFactoryMapEntries`

```text
/**
 * Build the map entries list for `_factoryMap` and `FluentKindMap`.
 *
 * @param nodeMap - The assembled node map.
 * @returns Ordered array of map entry descriptors.
 * @remarks
 *   Every kind with a factory lands here — branches, containers, leaves,
 *   keywords, enums — because each entry's type is `typeof <factory>`, so the map
 *   slot uses the factory's own signature directly.
 */
```

#### body

```text
// Include hidden non-token groups even when not userFacing — same
// predicate as emitPerNodeFactories so the map and emission stay in sync.
```

#### body

```text
// Hidden single-literal `_kw_*` keywords are inlined at every
// reference (factory fields emit the literal string directly,
// see `keywordPresenceAssignmentExpr`), so they never need a
// factory / `replace()` method / NamespaceMap entry. Dropping
// them also removes the dangling `T.Kw<Keyword>` / `T.Kw<
// Keyword>Tree` type references that would otherwise survive
// after types.ts skipped emitting those aliases. Lockstep with
// `emitLeafTerminalAliases` / `emitTreeInterfaceDeclarations`.
```

#### body

```text
// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
// never appear at runtime; no factory was emitted for them, so no map
// entry either. Lockstep with emitPerNodeFactories.
```

#### body

```text
// 'list' participates in this scan uniformly alongside 'branch' — see
// isSlotBearingCompound's doc comment (shared.ts).
```

#### body

```text
// `MapEntry.shape` is dead-to-runtime (emitFactoryMapConst/
// emitFluentKindMap never read it) — 'spread'/'elements' both
// collapse to 'children' here purely so this field's narrower type
// stays satisfied; the validator-only distinction lives in
// factory-map.ts's own factoryShapes, built straight from
// classifyFactoryShape without this remap.
```

### `packages/codegen/src/emitters/factories.ts::emitFluentKindMap`

```text
/**
 * Emit `FluentKindMap` type declaration source lines.
 *
 * @param mapEntries - Factory map entry descriptors produced by `buildFactoryMapEntries`.
 * @returns Array of source lines for the type declaration.
 * @remarks
 *   Only branches / containers / polymorphs get a `<TypeName>.Bound` entry; leaves /
 *   keywords / enums produce raw `UntypedNode` instead and are keyed to their own
 *   interface.
 */
```

#### body

```text
// The kind's own `<TypeName>Built` alias IS the factory return
// type — the map mirrors it instead of re-deriving a fluent
// shape from the Config surface.
```

### `packages/codegen/src/emitters/factories.ts::emitFactoryMapConst`

```text
/**
 * Emit `_factoryMap` const and `_FactoryMap` type alias source lines.
 *
 * @param mapEntries - Factory map entry descriptors produced by `buildFactoryMapEntries`.
 * @returns Array of source lines for the const and type alias.
 * @remarks
 *   Declared as a plain const so every entry's type comes from the factory's own
 *   signature via inference. `_FactoryMap` is then just `typeof _factoryMap`,
 *   giving consumers a precise type for each slot without duplicating the
 *   kind→factory mapping.
 */
```

### `packages/codegen/src/emitters/factories.ts::leaf`

```text
/**
	 * Emit a leaf factory (pattern, keyword, enum).
	 */
```

### `packages/codegen/src/emitters/factories.ts::branch`

```text
/**
	 * Emit a branch factory — either container-shape (rest-param) or
	 * field-carrying (config object, internally routes to single-field
	 * when applicable).
	 */
```

#### body

```text
// NOTE: class getters are NOT enumerable, so we must pass explicitly
// rather than relying on { ...node } to capture prototype-defined
// getters like `rawFactoryName`.
```

### `packages/codegen/src/emitters/factories.ts::separatedList`

```text
/**
	 * Emit a `'list'` factory — dedicated construct surface built
	 * directly from `AssembledList`'s own real fields (`elements`/
	 * `separatorRule`/`leadingMode`/`trailingMode`), bypassing the generic
	 * `.slots` surface entirely (see `AssembledList`'s doc
	 * comment, node-map.ts) rather than routing through `branch(...)`.
	 */
```

### `packages/codegen/src/emitters/factories.ts::buildLeafGuards`

The runtime guard statements of a text-leaf factory, each a complete `if (…) throw` statement. Three guards, none conditional on a debug flag:

1. **Non-empty**, on every leaf whose pattern does not accept the empty string.
2. **Pattern**, where `buildLeafReConsts` hoisted a `_leafRe_<factory>` constant: `!_leafRe_<factory>.test(text)`.
3. **Reserved word**, on the grammar's word kind only, where `buildLeafReConsts` hoisted a `_reservedWords_<factory>` set: text in the grammar's declared `reserved.global` wordset throws `<kind>: '<text>' is a reserved word`. The set is the grammar's own declaration read through `reservedWordset`, never a collected keyword list: a contextual keyword the grammar admits as an identifier (python `print`, `match`, `exec`) is not in it, and a grammar that declares no wordset (typescript and rust today) gets no guard. The builder has no slot context, so its message cannot name a keyword arm; the slot-side check is `keywordTextRejection`.

### `packages/codegen/src/emitters/factories.ts::childElementType`

```text
/** Resolve a container node's children element type to a concrete TS type
 *  expression, reading each value's stamped storage. A value stored as a
 *  kind id contributes its discriminant through `valueKindIdExpr` (the same
 *  resolver the runtime value arms use, so a strict parameter type and the
 *  value seated into it can never disagree); a text-stored value
 *  contributes its literal. */
```

#### body

```text
// A kind with no node of its own (an external scanner token,
// say) still gets a stub type under this name from types.ts,
// so the value is typed as that stub — never as the raw kind
// name spelled as a string literal.
```

#### body

```text
// Hidden kinds with `multi` or `punctuation` modelType don't get
// exported interfaces (types.ts excludes them from emission).
// When their typeName was collision-renamed (e.g.,
// `_expression_statement_tuple` → `_ExpressionStatementTuple`),
// the `T._X` reference is dangling. Redirect to the visible
// counterpart (strip leading `_`) which has a standalone
// exported interface. The runtime shapes are structurally
// compatible (same fields/children).
```

#### token interior

```text
A pattern value contributes `string`; a slot holding only pattern values never types as `never`.
```

### `packages/codegen/src/emitters/factories.ts::autoStampExpression`

```text
/**
 * Build the TypeScript stamp expression for an auto-stamp-eligible field.
 *
 * @remarks
 * Two cases:
 *
 * - **Source A** (`field.literalValues.length === 1`): the field content is an
 *   inline string literal. Stamp the string directly, e.g. `'pub' as const`.
 *
 * - **Source B** (`field.contentTypes.length === 1` and the referenced kind is
 *   an `AssembledKeyword`): the field content is a hidden-rule terminal with a
 *   single word-like text value (e.g. `_kw_async`). Stamp a minimal leaf
 *   UntypedNode object whose shape matches `Terminal<kind, text>`:
 *   `{ $type: '_kw_async', $text: 'async', $source: 2, $named: true }`.
 *
 * Returns `undefined` when the field is NOT auto-stamp-eligible.
 */
```

### `packages/codegen/src/emitters/factories.ts::setterValueSignature`

```text
/**
 * `$with.<name>` setter parameter signature for a single-valued field.
 * Required fields take `(value: T)`; optional fields take `(value?: T)`.
 * Previously the emitter unconditionally used `(value?: T)` — the new shape
 * matches the field's actual required/optional contract so callers can't
 * accidentally clear a required field by calling `$with.foo()` with no arg.
 */
```

### `packages/codegen/src/emitters/factories.ts::setterElemType`

```text
/**
 * Param type for a single-valued setter:
 *   - storage-rewritten fields: derive from the factory's own config slot.
 *   - default: plain `elemType`.
 */
```

```text
// `fnTakesFieldDirectly` distinguishes the two factory calling conventions:
// config-object factories (`fn(config)`) take the kind's `T.<Kind>.Config`,
// so re-deriving the field's type means indexing that config type by
// `configKey`; single-field factories (`fn(value)`) pass the field's own
// value as that first parameter, so `paramType` IS the field's type and
// indexing by `configKey` would reach into a non-object type instead. The
// config type is named rather than read back through
// `Parameters<typeof fn>[0]` so the same text is valid in `types.ts`,
// where no builder is in scope.
```

### `packages/codegen/src/emitters/factories.ts::emitFieldCarryingFactory`

A list owner's storage expression passes through `hydrateStored` before the shared view sizes it. The existing seat plan identifies that storage; the initializer, getter and list view then use the same resolved value. A missing live tree binding retains the existing refusal.

```text
/**
 * Emit a branch/group factory — one field-list-driven body shared by all
 * three calling conventions (container/single-field/config), mirroring
 * `emitInterface` in types.ts: one loop over `fields` producing storage +
 * getters, with the calling convention affecting ONLY the signature line
 * and the `$with` block. Each convention resolves its own per-field
 * storage-value expression (`valueSourceFor`) up front — this is where the
 * three genuinely differ (raw `child`/`children` vs a bare param name vs
 * `config.<key>` routed through the boolean/bitflag/kindEnum coercion
 * helpers), not in how storage/getters/the `withMethods` wrapper get built.
 */
```

#### body

```text
// A field with an optional delimiter flank has no control on this
// factory's surface: only a list kind stores a delimiter. Such a field
// is a blocking `field-optional-delimiter` record, so it reaches this
// emitter only when floored, and then the render keeps the flank as the
// grammar authors it.
```

#### body

```text
// Parallel type members for the `$with` record — same parameter text as
// the lambdas below, so the alias and the runtime never diverge.
```

#### body

```text
// Which fields actually get storage + a getter. Container shape only
// stamps its ONE real slot — `node.slots` can hold other entries
// (e.g. keyword-presence markers) that `classifyBranchSlots`' userSlot
// filtering already excluded from the single-slot classification, and
// the original per-shape emitters never touched those for a container.
// The other two shapes (single-field, config) always use every field.
```

#### body

```text
// The ONE user slot takes the elements positionally. Other fields
// (markers the single-slot classification excluded) stay un-emitted.
```

#### body

```text
// The setter is named after the slot, like every other setter. The
// rest PARAMETER keeps the generic `children` — it is positional, so
// its identifier is invisible to callers.
```

#### body

```text
// $with: setters call the factory directly with a patched config —
// `(value) => factory({ ...config, <key>: value })`. No `_setField` /
// `_setFields` indirection (those were old helpers serving
// the combined getter/setter method; under shape A getters are pure and
// the setter is purely a rebuild). Auto-stamp fields are skipped — no
// setter exposed because the value is fixed.
```

#### body

```text
// Post-unification: the legacy `children` setter is gone — per-slot setters
// above cover every slot through the unified `fields` loop.
```

#### body

```text
// --- Shared body, all three shapes: storage hoist, withMethods literal,
// getters. Storage uses property shorthand so the local const flows in
// by name; getters are method shorthand reading the local const via
// closure. `withMethods<T>` adds the four `$`-prefixed methods at the
// boundary — generic on T preserves the literal's type. ---
```

#### body

```text
// 'forwarded' shape (see forwardedTargetKind, shared.ts): the direct
// convention's single child slot holds exactly ONE concrete kind, so the
// factory forwards that kind's constructor — callers pass either the
// forwarded constructor arguments (the child is built internally) or a
// pre-built node, discriminated by `$type`. The direct implementation
// above becomes the private tail; chains compose transitively because a
// forwarded TARGET factory performs the same dispatch itself.
```

#### body

```text
// A catalog-less target (tree-sitter-inlined kind) gets no factory to
// forward to — the kind keeps the plain direct surface.
```

#### body

```text
// The forwarded overload re-declares the target's own constructor
// surface (its spread form for a list target) rather than
// `Parameters<typeof target>`, which would select the target's LAST
// overload — the options-first form of a separated list.
```

#### body

```text
// Whether the target's own factory accepts a call with no arguments at
// all: a parameterless keyword, a lone optional param, or a rest
// spread over a possibly-empty list. A non-empty list demands its
// first element, and says so on the model — its options-first overload
// spells the rest as a plain array, so the surface string alone would
// read as empty-admitting.
```

#### body

```text
// The DIRECT overload is the node's own canonical shape — the same
// `surface.params` the private implementation and `<TypeName>BuildArgs`
// are spelled from, so all three carry one label and one type.
```

#### body

```text
// The forwarded overload admits zero arguments, but the child this
// node stores is REQUIRED — passing the missing argument straight
// through would store `undefined` in a slot the render transport
// demands. The target builds its own empty form instead.
```

#### body

```text
// The wrapper's dispatch has three outcomes. No argument, or a lone
// `undefined`, is the absent child and goes to the direct builder as
// is. A lone object whose `$type` is the target kind is the pre-built
// child. Everything else is the target's own argument list — text or a
// number for a leaf target, a keyword kind, elements for a list — and
// the target's factory builds the child from it. No primitive is ever
// a pre-built child, so the test names the target node and never
// enumerates argument types.
//
// The node's `$with` setters call the private direct builder, not this
// wrapper: a setter takes the slot's own type and stores it, so it must
// not inherit the wrapper's building of the target from text.
```

#### body

```text
// Prepended AFTER the rename: the alias bodies mention `config`, and
// `renameUnusedConfigParam` decides on whether the name is read anywhere
// else in the emitted source.
```

The forwarded wrapper (the overloads plus the `$type`-probing body that
forwards a config or a spread to the target factory) is not emitted when the
target is a hoisted, config-shaped group: that parent keeps the direct
signature only, and the overlay's flatten seat (`flattenShape`) supplies the
config form. Group seating is emitted in one place.

#### token interior

```text
Every text slot of a lexed kind is guarded by its own anchored pattern before the node is built; the message
names the kind and the slot. The guards are the interior's slot patterns, so the whole-token regex is never
tested against a slot value.
```

#### body

```text
// A node with a registered slot (e.g. terminator) takes a trailing
// options argument, so its wrapper reads the child from args[0] alone
// and threads args[1] through as options on every branch; the target
// is built from args[0], never from the whole argument list.
```

#### overload order

The public wrapper declares its zero-parameter overloads first. TypeScript
resolves `Parameters<typeof f>` against the last overload, so a
parameterless form declared last would make the wrapper's parameter type
`[]` for every consumer that reads it (python `buildSuiteEmpty` in the
coerce layer).

A kind with an empty form gets the zero-argument overload returning `T.Empty<TypeName>` (`withEmptyOverload`). On a forwarding factory it goes on the exported wrapper, ahead of the forwarded overloads, and never on the private `_build…`.

### `packages/codegen/src/emitters/factories.ts::renameUnusedConfigParam`

```text
/**
 * Post-process emitted factory lines: rename the `config` parameter to
 * `_config` when the function body never reads it. Silences
 * `no-unused-vars` (lint rule explicitly exempts `_`-prefixed names)
 * without changing the public type signature — dispatchers and From
 * wrappers that forward `config` to these form factories continue to
 * type-check. Dropping the param entirely cascades into the dispatcher
 * + From emit, which is invasive; rename is the contained fix.
 */
```

#### body

```text
// Locate the signature line rather than assuming lines[0] — callers
// prepend Built-alias (and forwarded-wrapper) lines before the
// implementation's own header.
```

### `packages/codegen/src/emitters/factories.ts::emitRefineFormFactory`

```text
/**
 * Emit a per-form factory for a refined kind.
 *
 * @remarks
 * The per-form factory accepts the form's narrowed Config (base kind's
 * Config minus the fields stamped by this form), stamps the form's
 * selected literals directly into `$fields` alongside user-supplied
 * fields, and returns an UntypedNode shape structurally identical to the
 * base factory's output (and to what the typed read produces from a parsed
 * tree). No `$variant` tag — the selected literals live in `$fields`
 * exactly as they do when parsed, so the round-trip contract is
 * preserved.
 *
 * The fluent method suffix (render) mirrors the base
 * factory so the output shape is interchangeable; callers switching
 * between `ir.interfaceBody.curly(...)` and a parsed node get the
 * same surface.
 */
```

```text
// ---------------------------------------------------------------------------
// refine() per-form factory emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Refine form Config lives at `T.<Parent>.<FormShort>.Config` per
// emitRefineFormSubNamespaces — the flat `T.<ParentForm>` identifier
// is not emitted as a top-level namespace.
```

#### body

```text
// Post-unification: kind-named slots flow through `fields`; no separate
// `$children` storage path remains.
// Shape A: storage hoist + property shorthand + pure getters + $with.
```

#### body

```text
// Narrowed-literal fields are read-only — their value is fixed by
// the form, no setter is exposed.
```

#### body

```text
// Post-unification: legacy children setter is gone — per-slot setters above
// cover every slot.
```

#### body

```text
// An all-narrowed form reads nothing off `config` — rename before the
// alias lines are prepended (the rename inspects lines[0] as the header).
```

### `packages/codegen/src/emitters/factories.ts::resolveRefineFormConfigOptional`

```text
/**
 * Per-form equivalent of `resolveConfigOptional` — factors the narrowed
 * fields out of the "required" check (those are stamped by this form and
 * never come from Config input).
 */
```

### `packages/codegen/src/emitters/factories.ts::resolveConfigOptional`

```text
/**
 * Determine whether the `config` parameter should be optional (`?`).
 *
 * @param fields - The assembled field descriptors for the node.
 * @param nodeMap - The assembled node map (used for auto-stamp detection).
 * @returns The option marker — `'?'` when every non-auto-stamped field is
 *   optional, `''` otherwise.
 * @remarks
 *   Auto-stamp-eligible fields are excluded from the "required" check because
 *   they are never present in Config — the factory stamps them directly.
 *   Only fields that remain in Config can make config required.
 */
```

### `packages/codegen/src/emitters/factories.ts::resolveConfigType`

```text
/**
 * Resolve the config type reference for a field-carrying factory parameter.
 *
 * @param node - The node descriptor (provides `typeName` and `parentKind`).
 * @param hasRefineForms - Whether the node's kind carries refine() forms.
 * @returns A TS source string like `T.FunctionItem.Config` or `ConfigOf<T.FunctionItem>`.
 * @remarks
 *   Refined base kinds alias their parent `T.<TypeName>.Config` to the
 *   first-declared form's narrowed Config (per emitRefineFormSubNamespaces),
 *   dropping the narrowed-out fields. The base factory still references
 *   every field directly, so it must bypass that narrowed alias and use the
 *   full generic projection instead.
 *
 *   Hygiene rule 5 — prefer concrete per-kind namespace alias over the
 *   `ConfigOf<T>` generic indirection. `T.${typeName}.Config` is emitted
 *   by the types.ts namespace-sugar pass and resolves to the same
 *   `ConfigFor<kind>` shape, so this is a pure typing-surface improvement
 *   with no runtime change.
 */
```

### `packages/codegen/src/emitters/factories.ts::emitSeparatedListFactory`

```text
/**
 * Emit a `'list'` factory function.
 *
 * Signature: `fn(elements: T[] | NonEmptyArray<T>, options?: {...})` —
 * `elements` is always positional (a `'list'`-classified kind's whole rule
 * identity is array multiplicity, so there's never a singular-content case,
 * unlike `emitContainerFactory`). `options` is a SECOND, trailing parameter
 * (`elements` can't itself be a rest/spread param followed by more
 * arguments) and is emitted ONLY when at least one of
 * `separatorKind`/`leading`/`trailing` genuinely varies per-instance —
 * `mandatory`/`none` flank modes and a literal separator are all
 * compile-time-known and need no runtime parameter at all, mirroring
 * exactly which fields the read transport and `renderTransportDataStruct`
 * (render-module.ts) conditionally carry.
 *
 * Storage keys match the read transport's naming exactly — the same
 * per-instance concepts share one naming scheme across read, render and
 * construct. The
 * elements' own storage key/accessor, however, is NOT a fixed
 * `_content`/`content()` bucket — it is derived via
 * `canonicalSeparatedListField` (shared.ts), the SAME single-field
 * canonical-slot derivation `emitSeparatedListWrap` and
 * `renderTransportDataStruct`'s transport struct use, so the constructed
 * object's storage key matches the model's real slot name (e.g.
 * `_attributed_argument`, not `_content`) and satisfies both the wire
 * transport and the generic `.slots` surface's `T.<TypeName>` interface in
 * types.ts (which declares `_<name>`/`<name>()` from the identical
 * `node.slots` source). Multi-field kinds (`node.slots.length > 1`, e.g.
 * TypeScript's `enum_body_group1`) can't route a flat `elements` array to
 * more than one field without partitioning by kind — they keep the generic
 * `_content`/`content()` bucket, which remains WRONG for those kinds (see
 * `expectTestFailures`) pending a real per-field partition.
 *
 * Bypasses `node.slots`/`.slots` entirely, reading
 * `node.elements`/`.nonEmpty`/`.leadingMode`/`.trailingMode`/`.separatorRule`
 * directly — the generic slot surface can misderive a kind's real shape
 * for a rule that's an alias of a hidden rule (empirically found: python's
 * `lambda_parameters`, whose rule id resolves through hidden
 * `_parameters`, currently gets a WRONG singular `child: T.Parameters`
 * factory under the generic surface instead of the real REPEAT1 array —
 * this function fixes that as a side effect of bypassing it).
 */
```

#### body

```text
// Single-field kinds (the common case) store/expose the elements under
// the model's real slot name (shared with wrap.ts/render-module.ts via
// `canonicalSeparatedListField`), not a generic
// `_content` bucket. Multi-field kinds (`node.slots.length > 1`) can't
// be split from a flat `elements` array without a real per-field
// partition (see doc comment) — they keep the old generic bucket.
```

#### body

```text
// Spread signature with a LEADING optional options bag —
// `fn(...elements)` / `fn(options, ...elements)` — dispatched on the
// first argument: every element value is either a string literal or a
// node carrying `$type`, so a plain object WITHOUT `$type` can only be
// the options bag.
```

#### body

```text
// The canonical call shape is the spread form; the options-leading
// overload exists only so a per-instance options bag can lead, and it is
// the LAST overload precisely because call resolution wants it there.
```

#### body

```text
// Options are recognized by shape: a plain object (not an array, not a
// node — no `$type`) whose keys are all permitted option names.
```

#### body

```text
// Terminated-list validity invariant (see AssembledList.
// terminatedSeparator): a single element must carry the trailing
// delimiter — the undelimited one-element rendering parses as a
// different construct.
```

#### body

```text
// Transparent-wrapper coercion: bare content becomes the wrapper; a
// pre-built wrapper passes through. `.map` erases the rest-tuple
// shape, so a nonEmpty list re-narrows via the runtime assertion
// instead of a cast.
```

#### body

```text
// `_separator` is never absent on a built node: the caller's kind id, else
// the grammar's declared default (`declaredSeparatorDefault`). The typed
// read stamps the same default on a parsed list that carries no separator
// token, so a read reference and a rebuilt node agree field for field.
```

#### body

```text
// Rest param type must match `elementsType` exactly (`NonEmptyArray<T>`
// when nonEmpty) — a plain `T[]` rest capture isn't assignable to the
// tuple-shaped `NonEmptyArray<T>` the factory's own `elements` parameter
// requires. Independently computed from `node.nonEmpty` (the
// authoritative source — `rule.type === REPEAT1`) rather than from
// `AssembledNonterminal.isMultiple`/`isNonEmpty`, which derive from
// `slot.values`' own per-value `multiplicity` tags and generally DO
// reflect the content slot's real multiplicity. The narrow edge case
// that rules them out: if
// `deriveValuesForRule` (node-map.ts) ever resolves `node.elements` to
// an EMPTY array for some content-rule shape (e.g. an unresolved
// reference), `isMultiple`/`isNonEmpty` degrade to `false` on zero
// values, silently diverging from the true (still-repeated) rule shape
// — `node.nonEmpty` has no such degenerate case since it reads directly
// off `rule.type`, never off the derived value count.
```

`_separator` is `options.separator ?? <declared default>`
(`declaredSeparatorDefault`), so a built node always carries its token,
as it always carries its delimiter.

### `packages/codegen/src/emitters/factories.ts::withLeadingOptions`

A parameter list with the options parameter put first, typed `ListOptions<options>` so a node is never taken as the options. List builders and spread builders with registered slots share it.

### `packages/codegen/src/emitters/factories.ts::leadingOptionsSplit`

The lines that split a leading options object off a rest argument list: the first argument is the options when it is a plain object with no `$type` and only the permitted keys, and the rest are the items. A list builder, a spread builder with registered slots and the `from()` coercer of the latter emit it, each over its own argument list.

### `packages/codegen/src/emitters/shared.ts::pruneUnusedImports`

The one mechanism for "import only what the body uses" in every generated TypeScript module. An emitter writes its preamble naming every candidate import, then passes its finished lines and the candidate local names here. The body is every line that is not an `import`; a named import specifier (`X`, or `X as Y` tested by its local name `Y`) whose name has no `\b` use in the body is removed, and an import line left with no specifiers is dropped whole. A namespace import (`import * as X`) is dropped whole when `X` is unused. Keying on the imported name, not on the import's path or line text, keeps it correct wherever the import sits: the `Delimiter` import in the raw factories, the coerce module and wrap; the `@sittir/types` names in the factories, the coerce module and the types module; wrap's `projectInterior` / `TokenInterior` / `TOKEN_INTERIORS`, keyword-storage coercers and `FR` namespace. An emitter keeps a usage flag only where the flag gates a helper it writes, never to choose imports. A grammar that never uses a name (scm and regex have no separated lists and no keyword-presence slots) gets no import of it, so its generated package lints clean.

### `packages/codegen/src/emitters/shared.ts::isDeclaredSupertype`

Whether a node is a supertype the grammar declares (`AssembledSupertype.declared`, stamped at link from the grammar's `supertypes`). Every public surface that exists for supertypes only (the `ir` namespace groups, the `is` guards, the exported union alias and its namespace) reads this one predicate; an undeclared hidden choice keeps its alias in the internal types module and gets no guard. A grammar that wants a public guard for a hidden choice declares it a supertype.

### `packages/codegen/src/emitters/shared.ts::DELIMITER_IMPORT`

The import line every generated module that names `Delimiter` carries. `Delimiter` is one fact shared by every grammar, declared once in `@sittir/common/utils`; no grammar declares its own. Each emitter writes this line into its preamble and lets `pruneUnusedImports` drop it when the body never names `Delimiter`.

### `packages/codegen/src/emitters/shared.ts::importLocalName`

The name an import specifier binds in the module: `Y` for `X as Y`, otherwise `X`.

### `packages/codegen/src/emitters/types.ts::VOCABULARY_IMPORTS`

The `@sittir/types` vocabulary a generated types module may import, in the order the import line lists them. The line names all of them and `pruneUnusedImports` keeps only those the module's body uses, so there is no per-name usage flag to keep in step with the list.

### `packages/codegen/src/emitters/types.ts::emitGrammarTypeMap`

The grammar's `GrammarTypeMap`: `namespaces` is its `NamespaceMap`, `empty` pairs each kind that realizes empty (`emptyForms`) with its `Empty<TypeName>` form (`never` when none does), once per form of the node: the main interface and `.Bound` with `Empty<TypeName>`, and `.Parsed` with `Empty<TypeName>.Parsed`. `engine.isEmptyNode` looks its argument up by exact form, so the node an accessor returns narrows without the checker comparing a parsed surface to a built one; `Empty<TypeName>.Parsed` adds only the inner-trivia `$trivia` to `.Parsed`, because the built empty form extends `.Bound` and intersecting the two surfaces in full exceeds the checker's depth. and `trivia` is the union of its trivia kind types (`buildTriviaNodeType`). The three per-grammar aliases the node types use read the map's `trivia` member, so it is their one source: `NodeMethodsOf`, `TriviaSetterOf<Self>`, and `InnerTrivia<N>`, which takes a `Gap` parameter and becomes `GrammarInnerTriviaAt` when some kind has more than one gap (`innerGapsKeyed`).

### `packages/codegen/src/emitters/from.ts::buildSupertypeByKey`

```text
/**
 * Builds a reverse-lookup map from a sorted subtype key to the named
 * supertype constant identifier for dedup.
 *
 * @remarks
 * Each unique resolver kind list gets a single module-scoped constant
 * declaration; resolver call sites reference that constant instead of
 * repeating the literal array inline. Supertypes get *named* constants
 * (`_super_expression`) — when a field's content exactly matches a
 * supertype's subtype set we reuse the supertype's name as the dedup
 * identifier, making the generated code readable and aligning the physical
 * constant with the grammar's own supertype declarations. Any other list
 * falls through to numbered `_K0`, `_K1`, …
 *
 * Reverse lookup: sorted-subtypes key → supertype constant name.
 * First occurrence wins — two supertypes sharing an exact subtype set is
 * rare and the first name is as good as any.
 *
 * @param nodeMap - The assembled node map containing supertype entries.
 * @returns A map from sorted-subtypes key string to `_super_<name>` identifier.
 */
```

```text
// ---------------------------------------------------------------------------
// Dedup helpers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::buildKindInterner`

```text
/**
 * Creates a kind-list interner that deduplicates resolver kind arrays
 * into module-scoped constants.
 *
 * @remarks
 * Looks up by sorted supertype signature first — gives readable names for
 * the common case. Otherwise falls back to numbered dedup (`_K0`, `_K1`, …).
 *
 * @param supertypeByKey - Reverse lookup built by {@link buildSupertypeByKey}.
 * @param kindTableIndex - Mutable map from JSON-serialized kind list to index.
 * @param kindTableLiterals - Mutable array of JSON kind-list literals.
 * @param namedEntries - Mutable map from supertype constant name to JSON literal.
 * @returns An interner function that maps a kind list to its constant identifier.
 */
```

### `packages/codegen/src/emitters/from.ts::emitNamespaceImports`

```text
/**
 * Emits the namespace import lines into the generated from.ts header.
 *
 * @remarks
 * Factories are accessed via `F.<name>`; types via
 * `T.<Kind>.Config` / `.Loose` / `.Fluent`. Collapsing to a namespace
 * import eliminates the per-factory import wall (~3kB in rust) to a
 * single line.
 *
 * @param lines - Output lines array to push into.
 */
```

```text
// ---------------------------------------------------------------------------
// Emission helpers for the from.ts header block
// ---------------------------------------------------------------------------
```

#### body

```text
// `kindIdFromName` was a runtime kind-id resolver from before PR-K3d baked
// kind ids into generated from.ts statically (`kindIdExpr: TSKindId.<member>`
// above) — no call site references it anymore, so importing it here is
// dead weight that trips no-unused-vars.
// `DELIMITER_IMPORT` is emitted unconditionally and PRUNED in finalize() when
// the body never references `Delimiter` — whether any coercer carries a
// delimiter guard depends on per-kind emission decisions made after this
// preamble.
```

The grammar value imports are fixed (`TSKindId`, `KIND_NAMES`): a
read `_separator` is passed to the factory as the kind id it was read as,
so no kind-to-text table is needed here.

### `packages/codegen/src/emitters/from.ts::emitFromFieldInputType`

```text
/**
 * Emits the `_FromFieldInput` closed union type declaration into generated
 * from.ts, capturing every shape a loose-from() field value can hold.
 *
 * @remarks
 * Every loose-from() caller can hand us:
 *   - a fully-built UntypedNode     (passthrough path)
 *   - a primitive                (leaf-factory dispatch)
 *   - a { kind, ...rest } object (kind-tagged dispatch)
 *   - an array of any of above   (multi-field slot)
 *   - undefined / null           (absent optional field)
 *
 * `_FromFieldInput` is intentionally `unknown`. Generated field resolver
 * helpers immediately narrow with runtime guards (`typeof`, `Array.isArray`,
 * `isNode`, `'kind' in value`), and keeping the alias closed causes
 * recursive assignability failures once strict Config surfaces expose large
 * concrete node unions.
 *
 * @param lines - Output lines array to push into.
 */
```

### `packages/codegen/src/emitters/from.ts::emitFromMapDeclaration`

```text
/**
 * Emits the `_fromMap` runtime dispatch table and `_FromMap` type alias into
 * generated from.ts.
 *
 * @remarks
 * Same pattern as `_factoryMap` in factories.ts: declared as a plain `as const`
 * object so every entry's type is inferred from the per-kind `fromX` signature.
 * `_FromMap = typeof _fromMap` gives consumers the precise per-slot type without
 * duplicating the kind→function mapping.
 *
 * Declared BEFORE the resolver helpers so `_resolveByKind<K>` can reference
 * `_FromMap[K]` / `_fromMap[kind]` in its signature — the per-kind function
 * declarations it points at are hoisted at both the TS type level and the
 * runtime level, so forward references across the per-node blocks below
 * resolve cleanly.
 *
 * @param lines - Output lines array to push into.
 * @param nodeMap - The assembled node map.
 */
```

#### body

```text
// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
// never appear at runtime; no from() was emitted for them.
```

### `packages/codegen/src/emitters/from.ts::emitInternedKindTable`

```text
/**
 * Emits the interned resolver kind-list constants (dedup table) before
 * the per-node blocks, ensuring every `_KN` / `_super_X` identifier is
 * declared by the time it is referenced.
 *
 * @param lines - Output lines array to push into.
 * @param namedEntries - Map from supertype constant name to JSON literal.
 * @param kindTableLiterals - Array of numbered JSON kind-list literals.
 */
```

### `packages/codegen/src/emitters/from.ts::leaf`

```text
/**
	 * Emit a leaf from() resolver — string-like (pattern, enum) or keyword.
	 */
```

### `packages/codegen/src/emitters/from.ts::branch`

```text
/**
	 * Emit a branch from() resolver — container shape, text-template,
	 * or regular field-carrying branch.
	 */
```

### `packages/codegen/src/emitters/from.ts::separatedList`

```text
/**
	 * Emit a `'list'` from() resolver — dedicated construct/
	 * reconstruction surface, see `emitSeparatedListFrom`'s doc comment.
	 */
```

### `packages/codegen/src/emitters/from.ts::buildBranchSignatureParts`

```text
/**
 * Builds the input signature parts for a branch from() function.
 * Return type is omitted — TS infers it from the body.
 */
```

### `packages/codegen/src/emitters/shared.ts::emptyDefaultOf`

The expression a required single-value slot defaults to when its value is omitted, or `null` when the slot must be supplied. Both surfaces read it: the strict raw factory (`slotStorageExpr`, `defaultedValueExpr`) and the loose coercer (`emitBranchFrom`). The slot must have exactly one value; a slot that pairs a literal arm with a kind reference (`'.'` beside `optional_chain`) offers a choice and has no default.

- Fixed text (a literal, or a reference to a fixed-text leaf) defaults to its kind id, `TSKindId.X as const`, taken from `fixedTextEntryOf`. The `as const` keeps the member's literal type through an `orDefault` arrow, which would otherwise widen it to `TSKindId`.
- A list defaults to a call of its factory when the list is argument-optional.
- A compound whose loose `from()` forwards to a child factory defaults when that child's sole slot is multiple or optional; any other compound defaults when it is argument-optional.

`factoryNs` prefixes the factory call (`'F.'` in the coercer module); a kind id needs no prefix.

### `packages/codegen/src/emitters/from.ts::emitBranchFrom`

```text
/**
 * Emit a branch from() resolver — dispatches to the container calling
 * convention (positional element args) when `classifyChildFactorySurface`
 * recognizes an unnamed child slot, otherwise falls through to the regular
 * field-carrying Loose-input resolution below. Single entry point so
 * `branch()`'s dispatcher doesn't have to know about the two shapes.
 */
```

#### body

```text
// Only the SPREAD surface gets the children-taking coercer. A sole
// singular slot falls through to the field-carrying path below, whose
// direct-call emission already tolerates both shapes — bare value or
// `{ <configKey>: value }` — keyed on the slot's own config key, which
// the model supplies for an unnamed slot (`content`) exactly as for a
// named one.
//
// `emitsFieldResolvers` asks the same question of the SURFACE and adds its
// own emission conditions on top, so it is not this gate's negation — a
// kind that emits no `from` at all is not thereby a spread kind.
```

#### body

```text
// A field forces required input only if the caller must actually supply
// it: auto-stamped fields (always `required` but have no Config slot) and
// keyword-presence fields (default to absent/false) are excluded, same as
// the model's slot record — every slot is a Config field
// (shared.ts) — a caller only ever HAS to supply what that surface lists.
```

#### body

```text
// `fromBareInput` answering 'value' (a 'direct' or 'forwarded' factory
// shape) already guarantees the sole user slot is the only non-stamped
// field (resolveDirectFactorySlot) — no separate keyword-presence
// exclusion needed here.
```

#### body

```text
// 'forwarded' refines 'direct' — the factory still accepts the single
// direct value (a pre-built node dispatches via $type), so the same
// direct-call emission applies.
```

#### body

```text
// The direct-call body accepts the sole slot's value supplied BARE — and,
// when that slot holds a separated list, a single element, which the
// resolver wraps into the list node before the factory sees it. The
// signature is still just `T.<Kind>.Loose`: the kind's `Loose` carries the
// bare slot's loose form as its `NodeNs` bare arm, keyed by the slot the
// types emitter stamps on the row for exactly the kinds `fromBareInput`
// classifies. Spelling the union here again
// would admit the value at the coercer alone, while every slot that
// references the wrapper kept reading the narrower `Loose`.
```

#### body

```text
// One exported resolver per caller-supplied field: the single derivation
// of what that field accepts. `coerceTo<Kind>` and the tree-node `$with`
// setters in wrap.ts both call it, so the two surfaces cannot drift.
//
// The parameter is `LooseConfig[key]`, never `Loose[key]`: reading a field
// off `Loose` picks up the interface's accessor signature from its `| T`
// arm, and never `LooseValue<Config[key]>`, which drops the owner and with
// it the field's `__looseHints__`.
```

#### body

```text
// A non-empty repeated field carries its own emptiness check: the
// assertion narrows the resolved array to the tuple form the storage
// type declares, so the declared return type holds and every caller
// -- `coerceTo<Kind>` and the `$with` setters alike -- inherits the
// check from this one place.
```

#### body

```text
// Keyword-presence fields (boolean / bitflag) are NOT array-shaped on
// the factory's Config surface — they're a `Bitflag<Const, T>` /
// `BooleanKeyword<T>` brand. Skip the non-empty hoist for those even
// when the underlying values are repeat1, otherwise we generate a
// `_ne_X` array hoist + `_assertNonEmpty` call against a non-array.
```

#### body

```text
// Gap 5: single-field factories take the value directly. Emit
// `return F.label(resolved)` instead of `F.label({ identifier: resolved })`.
// Uses pre-computed slotClass for the sole-slot reference.
// Excluded: hidden kinds (inner polymorph children), keyword-presence,
// and multiple (array) fields.
```

#### body

```text
// Not routed through the field resolver: this expression yields the
// parent's own loose input when the value was supplied bare, which is
// wider than what the field itself declares it accepts.
```

#### body

```text
// Gap A: sole-slot direct-call factories skip the Config object
// literal entirely, so a required sole field needs its own guard.
```

#### body

```text
// Gap A: a required field whose loose-input value didn't
// resolve is otherwise silently `undefined` here.
```

#### body

```text
// No fields: pass-through to the factory with a boundary cast — the
// Loose input shape is wider than the factory's strict Config, but the
// structural overlap (children + leaf shape) is enough at runtime.
```

#### token interior

```text
A lexed kind's coercer accepts a bare string for its content slot: the string is rebound to a config object
(`_cfg`) after the UntypedNode passthrough, and every slot resolver reads that binding.
```

#### loose trivia

The coercer of every kind with a full form (`fullForm`), `ir.comment`'s default arm among them, passes a bare string through `spelledInterior`: text spelled with the kind's literal delimiters sheds them, and any other text is the content as it stands, checked by the content's leaf guard. The full form is tried first, so `'// TODO'` and `' TODO'` both build rust `// TODO`, and python `comment('# x')` is `# x`, never `## x`. The coercer passes the content slot's guard, the raw module's exported `_slotRe_<factory>_<slot>` (`interiorSlotGuards`), as the fourth argument: when what stripping leaves is text the pattern rejects and the input whole is text it accepts, the input is the interior. So a lone `\` is the escape `\\` in ts `escapeSequence`, rust and python `escapeSequence.simple`, regex `identityEscape` and scm `escapeSequence`, while `'\\'` still sheds its delimiter and builds the same escape. When the kind is a polymorph, `refuseSiblingLead` then refuses an interior that starts the way another arm can, naming that arm's builder (`refuseSiblingLeadExpr`).

A delimiter that is a spelling choice goes through `spelledForm` instead, and the alternative typed becomes that slot's option: python `integer.hex('0XFF')` renders `0XFF`, `integer.hex('FF')` the default `0xFF`, and an explicit option wins over the typed text (`spelledOptionKeys`).

The coercer's signature carries the same facts as types. With a spelled delimiter it is generic over the input and options (`<const I, const O>`) and returns `spelledReturnType`, so `integer.hex('0XFF').prefix()` is `'0X'`. With sibling leads its input is `I & SiblingLeadRefusal<…>` (`siblingLeadRefusalType`), so `blockComment('/*! x */')` fails to compile, naming `ir.blockCommentDocInner`. A plain `string` input keeps today's types and is checked at runtime. Delimiters with no slot and no siblings leave the signature as it was.

A kind with an empty form gets the zero-argument overload returning `T.Empty<TypeName>` ahead of its signature (`withEmptyOverload`), whichever of the three signatures it takes.

A direct-value coercer whose kind has a `listSpreadTarget` also takes the list's spread: beside its single-value signature it declares `(...input: T.<Target>.LooseArgs)`, and a call with more than one argument hands every argument to the target's own coercer and wraps the result. `parameters(a, b, c)` is `parameters([a, b, c])`, each element resolved as the list resolves it. A spelled or sibling-refusing signature cannot also spread, and the emitter throws if one would.


#### interior passthrough

A direct coercer whose sole slot is an interior text slot (it has an `interiorSlotGuards` entry) returns any read node as it is (`isNodeValue`), where every other direct coercer returns only a node of its own kind. A text slot cannot hold a node, so a node reaching it can only be a read leaf of another stored kind: an in-place leaf alias reads as the shared anonymous token, and `from` on that read must not rebuild it and lose its handle. This is the same scope as the text-shaped leaf coercers, which pass any non-string through. A config object `{ content }` and a string still reach the slot, spelled through `spelledInterior` and checked by the slot guard.

### `packages/codegen/src/emitters/from.ts::refuseSiblingLeadExpr`

An interior expression wrapped in `refuseSiblingLead` with each sibling's leading regex literal and builder, or the expression itself when there are none.

### `packages/codegen/src/emitters/from.ts::spelledOptionSlots`

The registered option slot of each full-form side that is a spelling choice, found through the field the affix names. A spelling slot that is not a registered option throws: the typed alternative has no option to go to.

### `packages/codegen/src/emitters/from.ts::literalUnion`

A list of texts as a TypeScript union of string literal types.

### `packages/codegen/src/emitters/from.ts::spelledReturnType`

The return type of a coercer with a spelled delimiter: the built node wrapped in `WithSpelling` per spelling slot. The slot's type is the explicit option when `O` carries it, and otherwise `SpelledAffix` over the stamped alternatives with the slot's registered default (`optionDefaultArm`). A spelled closing delimiter throws; no grammar has one.

### `packages/codegen/src/emitters/from.ts::siblingLeadRefusalType`

The `SiblingLeadRefusal` a polymorph coercer's input is intersected with: the full form's delimiters and each sibling's literal lead texts, in the runtime's order, paired with the sibling's builder. The list stops at the first sibling without texts: from there the runtime refuses by pattern, and a later literal lead must never name input that pattern would catch first. Undefined when no sibling ahead of that point has texts, and the signature stays untyped (rust `line_comment`, whose first sibling `extra_slashes` leads with a pattern).

### `packages/codegen/src/emitters/from.ts::kindDiscriminantCheck`

```text
/**
 * Returns the runtime expression used to compare `.$type` in container
 * from() guards.
 *
 * @remarks
 * When `kindEntries` is present (KindID pipeline), emits `TSKindId.X` — a
 * numeric discriminant. When absent (legacy / unit-test path), falls back
 * to `'<kind>'` string literal so callers without real grammar ID tables
 * continue to compile.
 *
 * @param kind - The grammar kind string.
 * @param kindEntries - Collected kind-enum entries, or `undefined` for fallback.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns An expression string suitable for `input.$type === <expr>`.
 */
```

### `packages/codegen/src/emitters/from.ts::emitRestParamFromResolver`

```text
/**
 * Shared body for a rest-param (`...input`) from() resolver that reconstructs
 * either from a flat list of already-resolved elements or by unwrapping an
 * existing self-UntypedNode value's storage. Both `emitRepeatedChildrenFrom`
 * (container-shape branches — spreads the resolved elements into the
 * factory's `(...children: T[])` rest param) and `emitSeparatedListFrom`
 * (`'list'` kinds — passes the resolved elements as the single `elements: T[]
 * | NonEmptyArray<T>` array argument) share this exact three-shape structure
 * (numeric-discriminant gate, self-UntypedNode unwrap, fresh-input fallback);
 * they differ ONLY in how the final call expression is built from a resolved
 * variable name, which `buildCallExpr` parameterizes.
 * For repeat-slot containers, a lone array is unwrapped before the same
 * per-element coercion used by spread arguments and config-slot arrays.
 *
 * The rest parameter is the kind's `LooseArgs` row, by name. The row is where
 * the element is spelled (`listBuiltTypeSurface`, `resolveConfigFactorySurface`):
 * the kind's own loose forms (its config bag, itself, a list's bare elements)
 * plus what a slot holding one element admits. Nothing is spelled here: the body
 * resolves every element through `_resolveMany`, so the parameter must admit
 * exactly what the slot-level widening admits, tagged bags and bare arms
 * included — a hand-written `Element | Kind | { key: … }` union kept lagging
 * behind that widening.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-UntypedNode check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @param storageKey - The wire storage key to unwrap on the self-UntypedNode path.
 * @param buildCallExpr - Builds the final `factory(...)` call expression from
 *   a resolved variable name (`'input'` or `'children'`) — spread-via-unknown
 *   for container-shape factories, direct array cast for `'list'`.
 * @param childrenTypeAnnotation - Optional explicit type annotation for the
 *   self-UntypedNode-unwrap `children` local (e.g. `': readonly unknown[]'`) —
 *   `emitSeparatedListFrom` needs this so its direct (non-`unknown`-laundered)
 *   cast type-checks; the local's inferred type otherwise widens to `any[]`
 *   via the `Array.isArray` ternary, which a direct cast rejects even though
 *   the runtime value is the same. `emitRepeatedChildrenFrom` doesn't need
 *   it since its cast still routes through `unknown` first.
 * @returns The emitted function source string.
 */
```

#### body

```text
// The slot's config key, when the resolver should ALSO accept the
// legacy named-field object shape (`from({ identifier: [...] })`) — a
// single non-UntypedNode object carrying the key unwraps to its elements.
```

#### body

```text
// `isSelfUnwrap` distinguishes the two call sites below: `true` inside
// the self-UntypedNode-unwrap branch (a `data` local naming the original
// wrapped node is in scope, so a caller like `emitSeparatedListFrom` can
// read per-instance facts off it — e.g. preserving `_separator`/
// `_delimiter` when reconstructing an already-wrapped
// separatedList node); `false` for the fresh-input path, where no such
// source node exists to read facts from.
```

#### body

```text
// TSGrammar-only kinds (string $type) can't satisfy isNode() (which
// requires numeric $type). Skip the node-data pass-through guard entirely
// — the check would always be false at runtime anyway.
```

#### body

```text
// The accepted-input union allows callers to hand back an existing
// <kind> UntypedNode OR a flat list of element children. The single-arg
// self-UntypedNode path unwraps the storage key; otherwise every item must
// already be an element. The storage value is typed as singular-or-array
// on the loose `AnyUntypedNode` shape; normalize to an array before the
// boundary cast.
```

#### options-first list coercer

A separated list's rest parameter is its `LooseArgs` row, which `listBuiltTypeSurface` spells with `listRestParamType` from the list's own cardinality (`AssembledList.nonEmpty`, the same fact the raw builder's non-empty guard reads) and its options. The options object is a spelling only as the first argument, so a later one is a type error. Runtime is unchanged because the list builder already sniffs an options-shaped first argument.

A kind with an empty form gets the zero-argument overload returning `T.Empty<TypeName>` ahead of the rest-parameter signature (`withEmptyOverload`).

With leading options (`leadingOptionsOf`), the coercer first splits a leading options object off `input` (`leadingOptionsSplit`) and resolves the rest. Rebuilding from a node of its own kind, it starts from the registered values that node holds (its storage keys) and lets a passed options object override them, so a coerced node keeps its spelling.

### `packages/codegen/src/emitters/from.ts::emitRepeatedChildrenFrom`

```text
/**
 * Emits the repeated-children variant of a container from() function, using
 * rest-parameter spread syntax.
 *
 * @remarks
 * Singular-child containers take one positional arg (`child?: T`); repeated-
 * child containers take `...children: T[]`. The from function has to match
 * the factory's signature at the call sites it forwards to.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-UntypedNode check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns The emitted function source string.
 */
```

#### body

```text
// Each rest element runs through the slot's normal field resolver —
// the same leaf/branch coercion a named config field gets (a loose
// identifier string still becomes an Identifier node) — instead of a
// raw cast into the strict factory. A slot with inline literal MEMBERS
// ('async' beside extern_modifier) keeps the passthrough: a bare string
// is a valid element there, and the branch resolver would wrongly wrap
// it into the node kind.
// as unknown as Parameters<>: elementType/children may include separator
// literals (e.g. ",") the factory doesn't accept directly as a spread
// element. Route through unknown.
```

A builder with leading options is called through an untyped view with the options first; `Parameters<typeof build>` names only the last overload, which there is the options-led one.

### `packages/codegen/src/emitters/from.ts::emitSingularChildrenFrom`

```text
/**
 * Emits the singular-child variant of a container from() function.
 *
 * @remarks
 * Casts the extracted single child all the way to the element type — the
 * container factory requires a non-nullable element when the grammar says
 * the child is required, and we can't express "indexed access on a non-null
 * tuple" through ConfigOf without pushing casts downstream.
 *
 * Empty collections (e.g. python `()` / `[]`) have no named children —
 * the reader promotes `(` / `)` / `[` / `]` into fields and produces no
 * `children`. Calling `factory(undefined)` rebuilds the empty form;
 * indexing `children[0]` in that case throws "Cannot read properties of
 * undefined (reading '0')".
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-UntypedNode check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @returns The emitted function source string.
 */
```

#### body

```text
// The factory's child parameter inferred type may be required or optional
// depending on grammar shape. Cast at the boundary funnels both shapes
// through one assertion so the emitter doesn't have to track which form
// each kind maps to. Runtime behaviour: required factories will throw
// on `undefined`, matching the unwrap path's "missing children" diagnostic.
```

#### body

```text
// TSGrammar-only kinds (string $type) can't satisfy isNode() (which
// requires numeric $type). Skip the node-data pass-through guard entirely
// — the check would always be false at runtime anyway.
```

#### body

```text
// Post-guard `input` is one of the element union's members; the
// slot's normal field resolver coerces it (loose leaf text
// included) exactly as a named config field would. Literal-bearing
// slots keep the passthrough — a bare string is a valid member.
// No cast on the resolved value: the resolver's return is already
// the element type, and a forwarded factory's pre-built-node
// overload must resolve naturally (a `Parameters<typeof f>[0]`
// cast would force the LAST overload — the forwarding-args form).
```

### `packages/codegen/src/emitters/from.ts::emitSeparatedListFrom`

```text
/**
 * Emit a `'list'` from() resolver — dedicated construct/
 * reconstruction surface built directly from `AssembledList`'s own
 * real fields, bypassing the generic `.slots` surface entirely (see
 * `AssembledList`'s doc comment, node-map.ts, and
 * `emitSeparatedListFactory`'s doc comment, factories.ts).
 *
 * Shares `emitRestParamFromResolver`'s three-shape structure with
 * `emitRepeatedChildrenFrom` (see that function's doc comment for the shared
 * shape), with ONE deliberate difference in the call expression: the
 * resolved elements are passed to the factory as the `elements` ARRAY
 * argument directly (`factory(children as Parameters<typeof factory>[0])`),
 * never spread and never indexed — factories.ts's Task 6 signature is
 * `factory(elements: T[] | NonEmptyArray<T>, options?: {...})`, not the old
 * `factory(...children: T[])` `emitRepeatedChildrenFrom` assumes. Before
 * this function existed, `classifyChildFactorySurface`'s stub-based
 * 'spread'/'direct' classification routed `'list'` kinds through the SAME
 * spread/index call shape `emitRepeatedChildrenFrom` still uses for real
 * container-shape branches — which silently bound `children[0]` to
 * `elements` and `children[1]` to `options` instead of the whole array once
 * the Task 6 factory signature landed (found in spec-compliance review of
 * that change, confirmed via code reading: `_assertNonEmpty` is a no-op
 * outside `SITTIR_DEBUG`, so the mis-binding compiled and ran silently
 * rather than throwing).
 *
 * Deliberately NOT `as unknown as Parameters<...>` (the cast pattern that
 * let the original bug hide from tsgo undetected) — empirically confirmed
 * (`tsgo` against a scratch repro) that a DIRECT cast from a `readonly`
 * array type to the tuple-shaped `NonEmptyArray<T>` target IS accepted as
 * "sufficiently overlapping" (tsgo TS2352's own comparability rule), for
 * both the rest-param `input` (already `readonly (...)[]`-typed) and the
 * self-UntypedNode-unwrap `children` local, PROVIDED that local carries an
 * explicit `readonly unknown[]` annotation — its inferred type otherwise
 * widens to `any[]` (via the `Array.isArray` ternary), which tsgo does
 * reject directly. A narrower cast means a genuinely wrong shape at one of
 * these two remaining opaque-`unknown`-origin sites (the self-UntypedNode
 * unwrap's `stored` read, and `_wrapWithChildren`'s own `children` param)
 * would now surface as a real tsgo error instead of silently laundering
 * through `unknown`, closing the exact gap that let this bug ship
 * undetected the first time.
 *
 * `options` is omitted on the fresh-input path (no source node exists there
 * to read per-instance facts from — the factory's own defaults apply, same
 * as before this fix). On the self-UntypedNode-unwrap path, `options` IS built
 * from the original wrapped node's own `_separator_kind`/`_leading_sep`/
 * `_trailing_sep` — calling `from()` on an already-wrapped separatedList
 * node used to silently reconstruct it with the factory's DEFAULTS (comma,
 * no flanks) regardless of what the original instance actually was, e.g.
 * `objectTypeContentFrom()` on a wrapped semicolon-delimited node would
 * change its rendered syntax back to a comma. Gated identically to
 * `emitSeparatedListFactory`'s own options surface (`node.separatorRule !==
 * undefined` / `leadingMode === 'optional'` / `trailingMode === 'optional'`)
 * so only fields the factory actually accepts get passed. `separatorKind`
 * needs a NUMBER→NAME reverse lookup since the wire stores a KindId but the
 * factory's `options.separatorKind` takes one of the candidate NAME
 * strings — built the same way `emitSeparatedListFactory`'s forward
 * (name→id) lookup is, just with the object literal's key/value swapped.
 */
```

#### body

```text
// Single elemType derivation with the factory surface — including the
// transparent-wrapper widening (the factory wraps bare content).
```

#### body

```text
// Same single-field-storage rule as `emitSeparatedListFactory`
// (factories.ts): the self-UntypedNode-unwrap path must read the SAME wire
// storage key the factory actually wrote. Multi-field kinds keep the
// generic `_content` bucket (see factories.ts's doc comment).
```

#### body

```text
// Mirrors emitSeparatedListFactory's own gating exactly (see that
// function's doc comment, factories.ts) — kept consistent across
// capture/render/construct/reconstruct rather than diverging.
```

#### body

```text
// The factory's spread signature — `fn(...elements)` / `fn(options,
// ...elements)` — needs the elements ARRAY spread at the call, typed as
// the same rest-tuple the factory declares (mirrors
// emitSeparatedListFactory's elementsType derivation).
```

#### body

```text
// `data`'s ambient type has no arbitrary storage keys (same reason
// `storageAccess` above needs its own `unknown` cast) — read the
// three per-instance fields through one shared cast rather than
// three separate ones.
```

#### body

```text
// A read `_separator` is a kind id and the factory's `separator` option
// is typed by the same kind ids, so the value passes straight through.
```

#### body

```text
// The stored bitflag can carry values outside the factory's
// permitted union (`Delimiter.None`, an unpermitted side) —
// narrow with the same member list the option type is built from.
```

#### elements resolve through the element slot

The fresh-input path never spreads the caller's elements raw into the strict
factory. Each element goes through the same slot resolver a repeated-children
coercer uses (`resolveFieldCall` over the element slot, many), so a bare
string is the leaf its pattern names, a bare number or boolean is the numeric
or boolean leaf (`_resolveScalar`), and a `$type:` object is that kind's
config; at the strict layer a number is a kind id, which is how a bare `1`
used to vanish from an argument list in silence. The element slot is the
list's content slot, or, when the content is one transparent wrapper
(`separatedListSurface().wrapper`), that wrapper's own content slot, because
the strict factory wraps the elements itself. A list whose elements are
literals is not resolvable and spreads as before. `_listElements` splits a
leading options object off first, keyed on `listOptionKeys(surface)`, the
same key list the strict factory accepts, so the options object passes
through untouched and only the elements resolve.

`_listElements` dispatches a tagged bag on its tag first, whether or not the element slot is resolvable: the tag names the kind, so it needs no slot knowledge. It reads the tag against `tagKinds` (the wrapper and the element slot's leaf and branch kinds). A list that seats a wrapper also passes `bagKinds`, the wrapper and the element slot's branch kinds: an untagged bag with several of them throws naming them, and an untagged bag with one is that kind's.

### `packages/codegen/src/emitters/from.ts::resolveFieldFromTypedInput`

```text
/**
 * Build a field-resolver call that reads a single camelCase property
 * directly off a typed FromInput bag (`input?.fieldName`). Typed
 * access flows the FromInput's per-field type into the resolver's
 * generic slot — no `_f` normalize, no index-signature widening. Used
 * by branch `fromX` bodies after the top-level kind discriminator has
 * already handed back any pre-built node.
 */
```

### `packages/codegen/src/emitters/from.ts::expandAndDedupeContentTypes`

```text
/**
 * Expands supertype references in a field's content types to their concrete
 * subtypes, deduplicating the result.
 *
 * @remarks
 * A content entry whose kind is a supertype in the NodeMap expands to that
 * supertype's declared subtypes — the resolver works at the concrete kind
 * layer, so dispatching through a supertype literal would never match
 * anything. Expansion also lets the interner reach for the named `_super_<name>`
 * dedup entry since the interner keys on the full subtype set.
 *
 * Deduplication is applied after expansion: contentTypes may legitimately
 * contain a supertype AND one of its concrete subtypes (e.g. `_expression`
 * and `range_expression` can both appear on the same field), and the
 * expansion would otherwise surface the concrete kind twice.
 *
 * @param contentTypes - The raw content types from the field.
 * @param nodeMap - The assembled node map (used to look up supertype subtypes).
 * @returns Deduplicated list of concrete kind strings.
 */
```

#### body

```text
// dedupe by the mint-stamped id where the slot's values carry one —
// same-id kinds are one runtime identity even under different names.
// Name key for stamp-less kinds (incl. supertype expansions).
```

### `packages/codegen/src/emitters/shared.ts::expandAndDedupeContentTypes`

The supertype expansion `from.ts` documents under the same name, shared so the factory emitter's alias admission (`slotAliases`, `slotStoredIds`) expands a slot's kinds exactly as the loose resolver does.

### `packages/codegen/src/emitters/shared.ts::classifyKindsForResolver`

```text
/**
 * Classifies a list of concrete kind strings into leaf kinds and branch kinds
 * for resolver dispatch.
 *
 * @remarks
 * Anonymous tokens have no factory binding and are skipped. Unknown kinds
 * (not in the node map) are treated as branch kinds so they go through
 * `_resolveByKind`.
 *
 * @param expanded - Concrete kind strings (already deduplicated / supertype-expanded).
 * @param nodeMap - The assembled node map.
 * @returns Object with `leafKinds` and `branchKinds` arrays.
 */
```

#### body

```text
// Unknown kind — treat as branch so it goes through _resolveByKind
```

#### body

```text
// Anonymous tokens have no factory binding — no resolver
// dispatch, but they are still VALID union members: report
// them so the single-kind fast path can pass an already-built
// token UntypedNode through instead of auto-wrapping it into the
// primary branch's container (#128).
```

#### body

```text
// 'list' shares 'branch'/'envelope'/'polymorph's from()
// dispatch — see isSlotBearingCompound's doc comment (shared.ts).
```

### `packages/codegen/src/emitters/from.ts::buildSingleKindFastPath`

```text
/**
 * Selects the single-kind fast-path resolver call when dispatch reduces to
 * exactly one possible target kind.
 *
 * @remarks
 * When there is only one possible target, skip the generic `_resolveOne` /
 * `_resolveMany` entry point (which iterates the leafKinds / branchKinds
 * arrays) and emit a direct specialized call. Removes one function-call
 * layer + array-iteration dispatch per field read at runtime.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 * The per-call-site `NonNullable<T.X.Config['y']>` ceremony was orphaned
 * after the earlier from-cleanup pass removed the `as X` casts it paired with.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @returns The fast-path call string, or `undefined` if there is more than one kind.
 */
```

#### body

```text
// Branch fast path with anonymous-token union siblings (e.g.
// mod_item.content's `';' | DeclarationList`): pass the token kinds'
// discriminants so the resolver recognizes an already-valid
// alternate-branch UntypedNode instead of auto-wrapping it into the
// primary container (#128). Leaf resolvers never wrap, so they need
// no alternate list. PR-K3d: the discriminants are baked at codegen
// (`altKindDiscriminants`) — no runtime `kindIdFromName` re-resolution.
```

A single branch kind at an optional slot resolves through `_resolveOneBranch(value, kind, alt, true)`: the trailing flag marks the slot optional, so an empty array is the slot absent (`undefined`) instead of an elements node the non-empty guard would reject. A required slot passes no flag.

### `packages/codegen/src/emitters/from.ts::altKindDiscriminants`

```text
/**
 * Baked discriminant expressions for a slot's anonymous-token union
 * siblings (the `altKinds` argument of `_resolveOneBranch`). Resolution
 * order per token kind: the slot value's mint `storageKindId` stamp when
 * present (collision-free id), else the name chain via
 * {@link kindDiscriminantCheck} (`TSKindId.X` for catalog-backed kinds,
 * string literal for catalog-less fixtures — matching the string `$type`
 * world those pipelines run in).
 */
```

### `packages/codegen/src/emitters/from.ts::buildInternedArrayResolverCall`

```text
/**
 * Emits an interned-array resolver call, referring to module-scoped
 * constants instead of repeating literal arrays at every call site.
 *
 * @remarks
 * Duplicated entries collapse to a single module-scoped `_KN = [...]` decl
 * or `_super_<name>` when the list matches a supertype exactly.
 *
 * Call sites no longer carry an explicit `<T>` type argument — TS infers
 * the slot type from the parameter type / return context at the assignment.
 *
 * @param prop - The property access expression string.
 * @param leafKinds - Classified leaf kind names.
 * @param branchKinds - Classified branch kind names.
 * @param fieldMultiple - Whether the slot accepts multiple values.
 * @param intern - Kind-list interner.
 * @returns The resolver call string with interned array references.
 */
```

#### body

```text
// Explicit `<T>` type arg when an element type is known — TS does not
// reliably infer the slot type from the assignment context for these
// generic helpers, so call sites that have field metadata provide it.
```

### `packages/codegen/src/emitters/from.ts::keywordPresenceResolverCall`

```text
/**
 * Emit the resolver call string for a keyword-presence field.
 *
 * Returns `undefined` when the field isn't a keyword-presence pattern
 * (caller falls through to the default resolver).
 */
```

```text
// kindEnumTextMapExpr: shared with factories.ts (imported above) — from.ts
// previously carried a duplicate that emitted runtime `kindIdFromName(text)`
// lookups, resolving literal texts through the name-polymorphic runtime
// switch (rust `'block'` → the named block RULE's id instead of the
// anon_sym_block token's) — the runtime face of the #129 shadowing class.
```

#### body

```text
// bitflag — pass through; the factory handles number expansion via _bf.
```

### `packages/codegen/src/emitters/from.ts::buildLeafRegistryEntries`

```text
/**
 * Builds the leaf registry entries from NodeMap leaves, keywords, and enums.
 *
 * @remarks
 * Enum factories declare their parameter as a literal union at the type
 * level but the factory's runtime guard accepts any string and throws on
 * invalid values. The registry slot declares the factory as `(text: string)`
 * so the enum's narrower signature is exposed through a thin closure — no
 * cast at the call site, runtime guard still catches invalid input.
 *
 * @param nodeMap - The assembled node map.
 * @returns Array of registry entry source strings to push into the `_leafRegistry` literal.
 */
```

Every text kind's check is built once as a `TextKindCheck` — fixed `values` for a visible fixed-text leaf, the compiled `pattern` (`anchoredLeafRegex`, or the token interior's `su` regex) otherwise — and the registry row prints that same check, so the emitted row and `leafTextChecks` cannot drift. The checks come back ordered by `rankTextKinds`, and their kinds are emitted as `_TEXT_KINDS_BY_RANK`. Hidden and visible leaves register alike; a kind the factory emitter does not emit (`classifyFactoryEmission`) is skipped, and a pattern kind with no text pattern is skipped when no slot references it and is an error otherwise.

```text
// ---------------------------------------------------------------------------
// Module-scoped resolver helpers (emitted into generated from.ts)
// ---------------------------------------------------------------------------
```

#### body

```text
// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
// never appear at runtime; no factory was emitted for them.
```

#### body

```text
// Enum factories declare a narrow string-literal union for `text`,
// but the registry slot is `(text: string)` (the runtime guard
// catches invalid input). Cast at the boundary so the wrapper
// signature stays uniform.
```

#### token interior

```text
A lexed kind is registered with the whole-token interior regex and a factory that projects the text into slot
values (`lexedConfig`) before calling the raw builder, so a bare token spelling in a loose position (`'1u8'`, a
number scalar) still resolves to the kind.
```

#### affixed leaves

```text
An affixed leaf (`isAffixedLeaf`: a lexed kind with a required fixed member) has a content row and no pattern: its text
differs from its content, so a bare string is never matched against it. Where the slot offers a choice, the kind must be
supplied (`ir.charLiteral('a')`); where the slot admits exactly one leaf, a bare string is that leaf's content and goes
through the kind's own coercer. The emitted `_AFFIXED_KINDS` set names
them; `_resolveOne` throws when a choice consists only of affixed leaves. An unaffixed lexed kind (rust `integer_literal`)
keeps its whole-text pattern row, and a visible external scanner token authors its shape in `renderAs` so every
factory-bearing pattern leaf has one; a leaf with a factory and no pattern is an emitter error, never a last resort.
```

### `packages/codegen/src/emitters/from.ts::aliasPatternLeaf`

The pattern leaf an AssembledAlias wraps when its single slot holds exactly one kind and that kind is a pattern leaf with a raw factory. `buildLeafRegistryEntries` gives such an alias a registry row with the leaf's anchored pattern and a factory that builds the leaf and then the alias, so a bare string resolves to the alias in the leaf pass exactly as it would to the leaf.

### `packages/codegen/src/emitters/from.ts::bareSlotKinds`

The concrete kinds a kind's bare-value slot admits (supertypes expanded; a list's transparent content kinds), or undefined when the kind takes no bare value.

### `packages/codegen/src/emitters/from.ts::forwardsBareString`

Whether a bare string reaches a leaf through a chain of single-kind bare slots. A slot admitting several kinds does not forward: which kind the string names is not decided by the text.

### `packages/codegen/src/emitters/from.ts::emitResolveByKindHelper`

```text
/**
 * Emits the `_resolveByKind` generic helper into generated from.ts.
 *
 * @remarks
 * Generic over the kind literal so the return type is the precise
 * `ReturnType<_FromMap[K]>` — each per-kind factory's output flows through,
 * not a widened `AnyUntypedNode` union. Callers pass a narrow kind (string-
 * literal from the field's content types or narrowed via an `in`-check
 * against `_fromMap`) to get the specific return shape back. The internal
 * sideways cast routes around per-slot parameter variance without going
 * through `unknown` / `any`.
 *
 * @param lines - Output lines array to push into.
 */
```

A bag's `$type` tag is a kind id, never a name and never a supertype: the tag always names the kind that is built, and the key is the node's own discriminant, so a grammar slot named `kind` is always plain data.

#### body

```text
// Type guard for keyof _FromMap so `kind in _fromMap` checks elsewhere
// narrow the string parameter without an unchecked cast.
```

It emits `_fromOfTag(tag, candidates)`, the one reading of a `$type` tag: a numeric tag that is the id of a kind with a from() coercer, and that the slot admits, names that kind. The slot admits a tag exactly when it would admit the node the tag builds: the tag is a candidate itself, or its id is in `_BARE_ACCEPTS[candidate]`, the table `bareAcceptClosure` derives for bare routing (a candidate's bare-input slot kinds, expanded through enum members and followed down every admitted kind). Any other tag throws `the $type tag <tag> is not a kind id of [<candidates>]`, at every resolver site: `_resolveOne`, `_resolveOneBranch`, `_resolveOneLeaf` and `_listElements` (which passes the wrapper and the element slot's leaf and branch kinds as `tagKinds`). `_splitTag` is the one test for a tagged bag: a plain object that is neither a node (`isNode`) nor a coordinate (`isCoordinate`) and has a `$type` key, split into the tag and the rest. A coordinate also carries `$type`, so without the second test an unread child of a parsed node would be split into its kind and a bag holding only its handle and span.

Bare-accept closure per grammar (kinds with a closure row, largest closure, and resolver call sites `_resolveOne` / `_resolveMany` / `_resolveOneBranch` / `_resolveOneLeaf` / `_listElements`): rust 88 rows, largest 114, sites 215/45/183/39/18; typescript 73 rows, largest 122, sites 281/37/142/50/8; python 71 rows, largest 89, sites 171/31/93/22/20; regex 12 rows, largest 3, sites 22/2/17/19/0; scm 5 rows, largest 9, sites 19/14/8/11/0.

`_resolveByKind` takes a leaf kind's bag as `{ $type, text }`: `_splitTag` has already removed the `$type` tag, so for a kind in
the leaf registry the remaining payload hands its `text` to the leaf's
resolver, and one without a string `text` throws naming the shape. Bare
strings, numbers and built nodes pass through unchanged.

### `packages/codegen/src/emitters/from.ts::emitResolveOneHelper`

A value names its own kind when it is a node or a coordinate (`isNodeValue`, the one test every coercer asks before reading a value as a config, a tag or a scalar): a coordinate is a node of its `$type` that the read left unread, so a parsed node's shallow child reaches `from()` as one, and `_resolveOne` admits it by that `$type` and returns it as stored, never hydrated (`from()` holds no tree to read it with). A coordinate whose kind the slot does not list goes through the same arm search as a node, and is returned as it is when no single arm takes it.

The order of the three kind-route branches is load-bearing. A value that
already carries a `$type` is a finished node, so it short-circuits and is
returned as-is BEFORE the several-arms error: only a value with no identity of
its own can sensibly be routed into an arm, and a typed node that happens to
fit two arms is not ambiguous, it is done. Single-arm wrapping still runs
first, so a bare `identifier` node passed where an arm is expected is still
lifted into that arm.

```text
/**
 * Emits the `_resolveOne` generic helper into generated from.ts.
 *
 * @remarks
 * Resolvers are emitted with a `<T>` type parameter so the call site can
 * name the expected slot shape (`_resolveOne<FunctionItem>`); no `extends`
 * constraint because the factory-emitted node interfaces don't all
 * structurally satisfy `AnyUntypedNode` (they omit the `named` property), and
 * adding such a constraint would force every call site to re-widen. The
 * input is the closed `_FromFieldInput` union so no caller has to cast
 * anything loose.
 *
 * @param lines - Output lines array to push into.
 */
```

#### body

```text
// Generic <T> reflects the caller-supplied slot shape. Body branches
// produce either a factory output, a scalar leaf, a resolved branch,
// or pass the input through unchanged. Each branch tail asserts to T —
// the runtime guarantees agree with the assertion: factory outputs
// satisfy the slot's UntypedNode shape; scalar/leaf factories produce
// Terminal<kind, text> matching the leaf interface; resolveByKind
// dispatches through `_FromMap` whose return type is the slot's
// factory output. Single-site cast keeps the helper readable; per-call
// assertions would clutter every consumer.
```

#### body

```text
// Gap B: an unresolved object/array would otherwise pass through raw and
// get embedded in the tree, surfacing only later as a confusing transport
// error. Scalars (string/number/boolean) are excluded — some call sites
// deliberately rely on scalar passthrough to coerceKindEnumStorage.
```

#### kind-tagged config

A `$type` config builds its named kind and then goes back through the same routing as any built node, so a config naming a kind the slot admits only through a wrapper or list (a `field_declaration` at an enum variant's body) is seated by the bare-accept tables instead of being stored unwrapped.

#### `_listElements`

`_listElements(input, optionKeys, wrapperKind, resolve, tagKinds, bagKinds?)`: the loose list
call's argument split. When `optionKeys` is non-empty and the first argument
is a plain object whose keys are all option keys (the strict factory's own
test, minus the `$type` check, which `isNode` covers), it is the options
object and is returned first, untouched, ahead of the resolved elements;
otherwise every argument is an element. When the list's content is one
transparent wrapper (`wrapperKind`), a kind-less plain object among the
elements is that wrapper's own config and builds through the wrapper's
coercer before the slot resolver sees it, since the element slot is the
wrapper's content and a kind-less config there would have no single kind to
take it; every other element goes to `resolve`, the element slot's resolver
supplied by `emitSeparatedListFrom`.

### `packages/codegen/src/emitters/from.ts::emitAssertNonEmptyHelper`

```text
/**
 * Emits the `_assertNonEmpty` runtime guard and static narrowing helper into
 * generated from.ts.
 *
 * @remarks
 * Runtime guard + static narrowing helper for repeat1-sourced list fields.
 * `from()` resolves a loose input to a `readonly T[]` via `_resolveMany*`,
 * but the factory's config slot is the non-empty tuple `readonly [T, ...T[]]`.
 * Calling this assertion on the resolver result narrows the static type to
 * the tuple shape AND throws at runtime if the input was empty.
 *
 * @param lines - Output lines array to push into.
 */
```

### `packages/codegen/src/emitters/from.ts::emitRequireFieldHelper`

```text
/**
 * Emits the `_requireField` runtime guard into generated from.ts.
 *
 * @remarks
 * Gap A: a required slot whose loose-input value didn't resolve to any
 * known branch/leaf kind comes back `undefined` from `_resolveOne` —
 * indistinguishable from a legitimately-absent optional slot. Call sites
 * for REQUIRED, non-defaultable fields wrap the resolver result in this
 * guard so the failure surfaces at the `from()` boundary (naming the kind
 * and slot) instead of silently constructing a node with a missing field.
 *
 * @param lines - Output lines array to push into.
 */
```

### `packages/codegen/src/emitters/from.ts::soleElementKindOf`

```text
/**
 * Name the ONE kind a bare config object in this container's auto-wrapped
 * array was meant to be.
 *
 * A bare array reaching a container slot is wrapped into the container and
 * each entry becomes an element, so an entry that is a plain config object
 * has to be resolved against the ELEMENT kind. Resolving it against the
 * container kind instead builds a second container nested inside the first
 * (rust's `struct_pattern.fields` produced a `_struct_pattern_elements`
 * whose elements were more `_struct_pattern_elements`).
 *
 * Parameterless element kinds are passed over rather than counted. They
 * take no config at all — rust's `remaining_field_pattern` is the bare
 * `..` — so a config object can never have meant one, and letting one sit
 * beside the real element kind would make the slot look ambiguous when it
 * is not. `parameterless` is the model's own attribute, so this reads the
 * fact rather than re-deriving it from node shape.
 *
 * Returns undefined when the remaining candidates are not exactly one: a
 * genuinely multi-kind element cannot be named from a bare object with no
 * `kind:` discriminant, and the caller leaves such an entry unresolved
 * rather than guessing.
 */
```

### `packages/codegen/src/emitters/from.ts::collectWrapChildrenEntries`

```text
/**
 * Collects all branch/`'list'` kinds that accept `$other` (catch-all
 * children) — used by the `_wrapWithChildren` runtime dispatch table in
 * generated from.ts.
 *
 * @remarks
 * Child-surface branches wrap through the same taxonomy used by the factory
 * emitter: direct unnamed-child factories call `F.kind(children[0])`, while
 * spread-child factories call `F.kind(...children)`. `'list'`
 * kinds are handled separately with `childSurface: 'array'` (`F.kind(children
 * as ...)`, the whole array as the single `elements` argument) — routing
 * them through `classifyChildFactorySurface`'s 'direct'/'spread'
 * classification here would reproduce the same real from() mis-binding bug
 * `emitSeparatedListFrom`'s doc comment (this file) documents; every
 * `'list'` kind unconditionally gets an `'array'` entry regardless
 * of what that classifier would have returned for it.
 *
 * Each entry also carries `elementKind` (see `soleElementKindOf`) — the
 * kind a bare config object among those children resolves to. The
 * container kind is NOT that answer; using it nests a container inside
 * itself.
 *
 * @param nodeMap - The assembled node map.
 * @param kindEntries - Kind enum entries for TSKindId emission.
 * @returns Array of wrap-children descriptors.
 */
```

#### body

```text
// Membership is `isWrapChildrenKind` — shared with the loose-hint
// emitter, which has to admit the array shape this table enables.
```

#### body

```text
// Both are guaranteed by the predicate; re-read them so the narrowing
// is the compiler's rather than an assertion.
```

#### body

```text
// Real arity decides direct-vs-spread — see `soleSlotFacts`'s doc
// comment for why this reads the slot directly rather than trusting
// `classifyFactoryShape`'s label for the shape itself.
```

### `packages/codegen/src/emitters/from.ts::emitWrapWithChildrenTable`

```text
/**
 * Emits the `_wrapKindIds` map and `_wrapWithChildren` dispatcher into
 * generated from.ts.
 *
 * @remarks
 * Gap 3 (array auto-wrap): when `_resolveOneBranch` receives an array and
 * the target kind is in `_wrapKindIds`, each element is resolved and the
 * array is forwarded to the factory via `_wrapWithChildren`.
 *
 * Gap 4 (single-value auto-wrap): when `_resolveOneBranch` receives a
 * UntypedNode whose `$type` differs from the target kind, it wraps the value
 * as a single child if the target kind accepts children.
 *
 * @param lines - Output lines array to push into.
 * @param nodeMap - The assembled node map.
 * @param kindEntries - Kind enum entries for TSKindId emission.
 */
```

#### body

```text
// Emit _wrapKindIds map: kind string → TSKindId numeric value
```

#### body

```text
// Emit _wrapWithChildren dispatcher
```

#### body

```text
// 'list' — the factory's spread-with-leading-options
// signature takes the elements as REST arguments; spread the array
// into the call (the `unknown` launder is unavoidable here: the
// overloaded signature's Parameters<> resolves to the
// options-leading overload, not the rest tuple).
```

`_wrapOptionalSoleKinds` names the direct wrapper kinds whose sole slot is optional. `_wrapArray` given an empty array for one of them builds the wrapper with no children rather than an empty inner elements node, which is the same optional-slot rule applied through the wrapper (`arguments: []` on a call).

#### spread and array kinds build through their coercer

`_wrapWithChildren` dispatches a `'spread'` or `'array'` kind that has a
from-coercer to that coercer, laundered through `(...args: unknown[]) =>
unknown` the way the strict-factory array call already was, so children given
as an array resolve through the kind's element slot exactly as a direct call
would. A `'direct'` kind still takes `children[0]` into its strict factory.
`_wrapArray` therefore carries no element resolution of its own: it recurses
into a direct kind's list target and otherwise hands the array to
`_wrapWithChildren`. One element resolver per kind, in its coercer.

### `packages/codegen/src/emitters/ir.ts::emitSynonymAliases`

Emits the role-named getters on `synonym` (`function`, `class`, `method`, `module`, `interface`), each returning the `ir` member for the role's primary kind. Each getter is annotated with the `ir` member type it returns, `(typeof ir)['<key>']`. `ir` carries an explicit annotation, so the indexed type resolves without inference; left inferred, a large overlay surface (rust's `struct_item` with its whole-arm variants) exceeds what the declaration emitter will serialize (TS7056).

### `packages/codegen/src/emitters/ir.ts::bundleExpr`

```text
/**
 * Factory+from bundle expression, shared by flat and grouped emission.
 * Kinds with refine() metadata carry per-form bundles keyed by the form's
 * camelCase short name (e.g. `ir.interfaceBody.curly`). Branches call the
 * loose `from()` path by default and expose the raw factory as `.strict`.
 */
```

### `packages/codegen/src/emitters/ir.ts::resolveRoleNodes`

```text
/**
 * Resolve role kinds to concrete AssembledNode entries that exist in the
 * nodeMap. Filters out candidate kinds that don't have a node entry.
 *
 * Also probes the hidden (`_`-prefixed) variant of each kind name, since
 * tree-sitter SCM captures reference unprefixed names but the grammar's
 * internal representation may use the hidden prefix (e.g. `type_identifier`
 * in SCM → `_type_identifier` in grammar).
 */
```

```text
// ---------------------------------------------------------------------------
// Role-synonym namespace — native JS value → node, keyed by semantic role
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/ir.ts::isLeafFactory`

```text
/**
 * A leaf kind with a build function: a pattern or a keyword. An
 * enum-of-literals is a leaf but mints no factory (`rawFactoryName` is
 * undefined) — its members are spelled as kind ids.
 */
```

#### token interior

```text
A lexed kind with a bare content slot is a leaf factory for the role synonyms; it is called through its hoisted factory.
```

### `packages/codegen/src/emitters/ir.ts::returnTypeExpr`

```text
/**
 * Build the ReturnType expression for a factory. Uses `ReturnType<typeof F.xxx>`
 * so the type tracks the fluent methods attached by withMethods. A build
 * constant (`isBuilderTextLeaf`) is not called, so its type is `typeof F.xxx`.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromNamespace`

```text
/**
 * Emit the `from` const — canonical factories that accept native JS values
 * and resolve to grammar-specific UntypedNode kinds.
 *
 * Emitted as `export const from = { ... } as const` for tree-shakeable
 * standalone access (`from.boolean(...)`) and also referenced inside the
 * `ir` object for `ir.synonym.boolean(...)` access.
 *
 * @returns Lines to prepend before the `ir` const. Empty if no roles have kinds.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromBoolean`

```text
/**
 * `from.boolean(value: boolean)` — resolves `true`/`false` to the grammar's
 * boolean kind. Handles three shapes:
 * - Enum leaf: `booleanLiteral('true' | 'false')` (Rust)
 * - Keyword pair: `true_()` / `false_()` (Python, TypeScript)
 * - Single leaf: direct factory call
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromNumber`

```text
/**
 * `from.number(value: number)` — resolves integers to integer-kind, floats to
 * float-kind. When only one number kind exists, routes everything there.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromString`

```text
/**
 * `from.string(value: string)` — routes to the primary string kind.
 *
 * Most grammars have branch string nodes (with escape sequences, content
 * children). For these, the canonical factory composes the branch: it wraps
 * the input text in a string-content leaf and passes it to the branch
 * factory. Only emitted when a composition path exists.
 *
 * Heuristic for primary string kind: the first kind whose name contains
 * `string` (not `char`, `raw`, `template`, `regex`). This picks
 * `string_literal` for Rust and `string` for TypeScript/Python.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromComment`

```text
/**
 * `from.comment(text: string)` — routes to line/block comment kinds.
 * Discriminates by prefix: `//` or `#` → line comment, `/*` → block comment.
 * When only one comment kind exists, routes everything there.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromType`

```text
/**
 * `from.type(name: string)` — routes to the grammar's type-identifier kind.
 * Excludes `type.builtin` kinds. When the type kind is a branch that takes
 * an identifier child, composes `F.typeIdentifier(F.identifier(name))`.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromIdentifier`

```text
/**
 * `from.identifier(name: string)` — routes to the grammar's `identifier` kind.
 *
 * Looks for the `identifier` kind in the `variable` role. Does not exclude
 * `variable.builtin` since some grammars (TypeScript) capture `identifier`
 * under both `@variable` and `@variable.builtin`.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromAliases`

```text
/**
 * Emit definition-role aliases — `from.function`, `from.class`, etc.
 * These are direct references to the grammar-specific `ir.*` entry,
 * not wrapper functions. E.g., `from.function = ir.functionItem`.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::kindIdMemberName`

```text
/**
 * Map a kind name to its `TSKindId.X` member name. Prefers the
 * AssembledNode's `typeName` when available (so `_function_item`
 * becomes `FunctionItem`), falls back to PascalCase of the raw kind.
 *
 * For catalog kinds NOT in `nodeMap.nodes` (children-only named kinds
 * like `empty_statement`, anonymous tokens like `PLUS`), the PascalCase
 * fallback applied to the catalog `parserName` produces a valid TS
 * identifier — `EmptyStatement`, `PLUS` (already-uppercase
 * passes-through). This is exactly what we want.
 */
```

The rule is one fact, whether the model has a node for the kind: a kind
with a node names its member by the node's `typeName`, so `TSKindId.X` and
type `X` agree; a nodeless row keeps its grammar spelling, leading
underscore included (`_ImportListRepeat1`). Nothing reads the row's `anon`
flag, so a literal rule gains the underscore-free name exactly when
assemble mints a node for it.

#### body

```text
/* toPascal strips leading underscores (`_literal` → `Literal`). For
	   hidden kinds this creates member-name collisions with visible kinds
	   that have the same base name (`literal` → `Literal`). Preserve the
	   leading underscore so hidden kinds get a distinct member: `_literal` →
	   `_Literal`, `_primitive_type` → `_PrimitiveType`. */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::collectCatalogKinds`

```text
/**
 * Return the canonical superset of parser-symbol-bearing kinds —
 * iterates `generatedIdTables.kindIds` directly so the catalog includes
 * (a) named kinds in `nodeMap.nodes`, (b) named kinds that appear only
 * as transport children (`empty_statement`, `never_type`), and (c)
 * anonymous tokens (`PLUS`, `EQ_EQ`, ...). This is the DRY source for
 * `TSKindId` / `kindIdFromName` / `kind_ids.rs` / `AnyTransport`
 * dispatch — they MUST share the same kind universe.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::collectKindEntries`

```text
/**
 * Collect catalog entries that should appear in `TSKindId`. Skips
 * kinds whose parser symbol is absent (`TSGrammar`-only-without-
 * `TSInternals` per the design).
 *
 * Pass `collectCatalogKinds(generatedIdTables)` for the runtime-
 * dispatch surfaces (TSKindId, kindIdFromName, AnyTransport,
 * kind_ids.rs); pass `collectAllKinds(nodeMap)` only for emitter
 * surfaces that intentionally restrict to user-facing rule names
 * (`is.kind()` guards — see `is.ts`).
 */
```

```text
// member → first kind that claimed it
```

#### body

```text
A row's member is named from its model kind (`modelKindOfEntry`, so a renamed row and an alias row take their tree name). The rows are collected first, because a row's model kind depends on the whole list. Two kinds that name one member are a codegen error.
```

### `packages/codegen/src/emitters/kind-discriminant.ts::findKindEntry`

```text
/**
 * Find the catalog entry for a given kind name, matching on either
 * `entry.kind` (the catalog key, e.g. `_expression_statement_tuple`) or
 * `entry.symbolName` (the symbol name, e.g. `expression_statement_tuple`).
 *
 * Some grammar kinds appear in node-types.json under their symbol name
 * (no leading underscore) while the parser.c symbol has a hidden prefix
 * (`sym__expression_statement_tuple` → catalog key `_expression_statement_tuple`,
 * symbol name `expression_statement_tuple`). Anonymous tokens are similar:
 * catalog key `rparen`, symbol name `)`. Both spellings must resolve to the
 * same catalog entry so emission-point guards can match the nodeMap kind name.
 *
 * @param kindEntries - The catalog entries from `collectKindEntries`.
 * @param kind - The nodeMap kind name to look up.
 * @returns The matching entry, or `undefined` if the kind has no parser symbol.
 */
```

#### body

```text
/* Delegates to the shared kind-name chain — see KindEntryLike in
	   compiler/generated-metadata.ts for the full step documentation,
	   including why step 3 is anon-scoped: the `_as_pattern` shadowing bug.
	   A step 4 (named-symbolName fallback for hidden compound tokens like
	   `_is_not` ← `"is not"`) is reachable only when steps 1-3 all miss. */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::findKindEntryForLiteral`

```text
/**
 * Resolve a LITERAL TOKEN TEXT (a `STRING` rule's value — e.g. `'type'`,
 * `'+'`) to its catalog entry. The anon-scoped symbolName match runs FIRST:
 * the caller holds a literal, so the anonymous token (`anon_sym_*`,
 * tree-sitter `named: false`) is the correct identity even when a NAMED
 * rule shares the same spelling (#129: python's `'type'` keyword literal
 * was resolved through {@link findKindEntry}, whose exact-catalog-key step
 * matched the `type` RULE first — the factory then stamped the rule's kind
 * id where the transport expects the anon token's, failing every
 * `ir.typeAliasStatement` render with "Missing field `_content`").
 *
 * Falls back to {@link findKindEntry} for literals with no anonymous twin —
 * tree-sitter compiles some keyword literals to named terminal symbols
 * (rust's `'crate'`/`'self'`), and those stamps were already correct via
 * the named match.
 *
 * Deliberately a SEPARATE function: the anon-first ordering is only sound
 * when the caller is known to hold literal text. Reordering
 * {@link findKindEntry} itself would reintroduce the `_as_pattern`
 * shadowing bug its step-3 comment records.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::hasCatalogEntry`

```text
/**
 * Return true when a kind has a parser symbol in the catalog — matches on
 * the catalog key (`entry.kind`) only, NOT on `entry.symbolName`.
 *
 * Using `entry.kind` only prevents phantom kinds (TSGrammar-only inlined
 * rules) from being treated as real kinds via a coincidental symbolName
 * match. Transport alternative lists must only include kinds that have a
 * parser symbol so `kindIdFromName` is always safe to call at runtime.
 *
 * @param kindEntries - The catalog entries from `collectKindEntries`.
 * @param kind - The nodeMap kind name to check.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::kindDiscriminantExpr`

```text
/**
 * Render the runtime discriminant expression for a given kind: always
 * `TSKindId.<Member>`. Throws at codegen time when the kind has no
 * parser symbol — kinds without runtime presence (TSGrammar-only,
 * tree-sitter-inlined) must not reach a TSKindId reference. Per the
 * user's direction (2026-04-30): if there is a TSKindId, it should
 * always resolve; the inverse is a loud error, not a silent string
 * fallback.
 *
 * Matches the kind against both the catalog key and the symbol name
 * (via `findKindEntry`) so nodeMap kinds that use the symbol spelling
 * (e.g. `expression_statement_tuple`) resolve to the same entry as
 * the catalog key (`_expression_statement_tuple`).
 *
 * Used by `types.ts` for interface `$type` declarations and by
 * `factories.ts` for factory body `$type` values, so both surfaces
 * resolve to the same expression.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::kindDiscriminantExprForId`

```text
/**
 * {@link kindDiscriminantExpr} for call sites holding a mint-time PARSER ID
 * stamp (`NodeRef.resolvedKindId`). The id is the collision-free identity —
 * a link-minted `resolvedKind` NAME can collide with a rule name (`'type'`
 * the keyword vs `type` the rule), but the stamped id cannot (0
 * intra-catalog id collisions, all grammars). Returns undefined when the id
 * has no catalog row (emitter catalog narrower than the mint's).
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::toIdMap`

```text
/**
 * Subset of `toCatalogMap` — drops TSGrammar-only entries (those whose
 * `id` is undefined). Substituting a `-1` sentinel would let them
 * survive the `id === undefined` filter in `collectKindEntries` and
 * emit `_kindIdByKind` / `TSKindId.X` entries that match nothing at
 * runtime (silent never-match). Filter them here so the catalog only
 * contains real parser-symbol ids.
 */
```

### `packages/codegen/src/emitters/kind-id-rust.ts::emitKindIdRust`

```text
/**
 * Emit the Rust source for `kind_ids.rs` — one `pub const` per kind that
 * has a parser symbol (TSInternals presence), sorted by numeric id, plus a
 * `kind_name_from_id(KindId) -> &'static str` diagnostic helper. The ERROR
 * row's const is followed by a const assert that it equals
 * `sittir_core::types::KindId::ERROR`, so the id the TS side emits from
 * `ERROR_KIND_ID` and the one the Rust core names cannot drift apart.
 *
 * @returns The complete Rust source as a single string, ready to write to
 *   `rust/crates/sittir-{grammar}/src/render/kind_ids.rs` (or equivalent).
 */
```

#### body

```text
// Source from the catalog superset so `kind_ids.rs` constants match
// the AnyTransport::FromNapiValue dispatch (which sources from the
// same superset). Coverage gap fix (Phase B).
```

#### body

```text
// Emit kind_name_from_id diagnostic helper — maps a KindId back to its
// grammar kind string. Sourced from the same `entries` list as the constants
// above (DRY: one source, one derivation). Used for error messages in
// render_dispatch where UntypedNode.type_: KindId shows a numeric id.
```

#### body

```text
// For anonymous tokens use symbolName when available (shows literal text),
// otherwise fall back to the canonical kind string.
```


### `packages/codegen/src/emitters/kind-id-rust.ts::KindConstant`

One `kind_ids.rs` constant: its name and the kind id it holds.

### `packages/codegen/src/emitters/kind-id-rust.ts::kindConstants`

The constants of a grammar's kind table, one per kind row, plus one for each alias parse id that has no row of its own: the parser symbol an alias site is read under (`let_chain`, `lhs_expression`), named from its parse name so the reader names every id it matches by constant. An alias whose name another kind already holds is a diagnostic.

### `packages/codegen/src/emitters/shared.ts::wireRoutesOf`

The parser keys that land in an unnamed slot: its field labels
(`valueParseLabelsOf`, the tree-sitter field names routed into the slot) and
its values' parse kinds expanded to concrete kinds
(`expandToConcreteParseKinds`), with the labels excluded from the kinds. A
named slot has no routes, since its field is its name.

### `packages/codegen/src/emitters/shared.ts::WireRoutes`

The fields and the concrete kinds `wireRoutesOf` finds for one slot.

### `packages/codegen/src/emitters/refine-emit.ts::collectRefineKindInfos`

```text
/**
 * Collect refine metadata for every kind that carries forms, pairing
 * each node with its `LinkedRefineForm`s. The narrowed field-literal
 * pairs are link's stamp (`narrowedFields`); nothing is resolved here.
 * Returns `undefined` when the grammar has no refine metadata.
 *
 * @remarks
 * Forms that don't resolve to field-wrapped choices carry an empty
 * `narrowedFields` list — the form's factory still exists but narrows
 * nothing at the Config surface, which is the intended behavior for
 * selections that target anonymous structural literals.
 */
```

### `packages/codegen/src/emitters/refine-emit.ts::refineFormTypeName`

```text
/**
 * Per-form TS type name: `<ParentTypeName><FormPascal>`.
 * Example: `InterfaceBody` + `curly` → `InterfaceBodyCurly`.
 */
```

### `packages/codegen/src/emitters/refine-emit.ts::refineFormFactoryName`

```text
/**
 * Per-form factory function name: `<kind-camel><FormPascal>`, matching
 * the base factory-naming convention already used for polymorph forms.
 */
```

### `packages/codegen/src/emitters/render-module.ts::build

Surface`

```text
/**
 * Build a RenderTemplateSurface from the assembled slot model, without
 * invoking the legacy template walker. Named slots drive the surface:
 * a multiple named slot maps to `'field'` view, a singular named slot
 * maps to `'scalar'`. `hasLeading`/`hasTrailing` are forwarded from the
 * slot. `usesChildren`/`usesVariant`/`usesText` are all false here —
 * mergeTemplateSurfaceFromBody fills those in via body-regex fallback.
 */
```

### `packages/codegen/src/emitters/render-module.ts::classifySlotForEmit`

```text
/**
 * Classify a slot for emit purposes — same as `classifySlot` but also:
 * - resolves `concrete` using the assembled typeName (PascalCase)
 * - downgrades `concrete` to `heterogeneous` when the single kind maps to a
 *   multi node (no transport struct) or polymorph (no ToNapiValue in Phase 1)
 * - classifies multi-kind slots as `supertype` when they match an assembled
 *   supertype's subtypes (Phase 2)
 *
 * @param kinds - the kind set for this slot
 * @param nodeMap - for modelType lookup + supertype map construction
 */
```

```text
// ----------------------------------------------------------------------
// Slot classification — single source for slot type width
// ----------------------------------------------------------------------
```

```text
// unknown kind — no transport struct, use bare AnyTransport
```

#### body

```text
// Multi nodes have no transport struct — fall back to bare AnyTransport.
```

#### body

```text
// A single-kind slot whose kind IS a supertype: classify as supertype
// (the concrete kind IS the supertype itself). Use its typeName.
// Skip when the enum name is reserved (e.g. 'LiteralTransport').
```

#### body

```text
// Concrete node: use the assembled typeName (PascalCase, leading-underscore-
// stripped by the assemble phase). This ensures the render fn name and
// struct type name match what renderTypedLeafFn / renderTypedBranchFn emit
// (both use node.typeName). Hidden kinds like `_kw_abstract` have
// typeName `KwAbstract` — using kind would produce double-underscore
// render fn names that don't match.
```

#### body

```text
// `supertype`: downgrade to heterogeneous when enum name is reserved.
// `heterogeneous`: pass through unchanged.
```

### `packages/codegen/src/emitters/render-module.ts::buildSlotWriteCall`

Writes one slot value directly, with no template, for the fallback render
of a kind that has no body. `expr` names the slot's `SlotValue` carrier:
the concrete and supertype classes call their own `render_<kind>` function,
so they unwrap through `transport_or_write`, which slices the coordinate
arm itself and yields the transport only when there is one. The
heterogeneous classes call `.render(w)` directly, which the carrier
implements, so they need no unwrap.

### `packages/codegen/src/emitters/render-module.ts::mergeTemplateSurfaceFromBody`

The slots a body needs, merged over the slot model: every gate test is a
guarded scalar, every slot reference a scalar, a name seen both ways keeps
the stricter presence. `variant` and `text` are the transport's own
members, not slots; `children` is a legacy name no walker emits, and a
body that still names it fails in `buildTypedTemplateBody`.

### `packages/codegen/src/emitters/render-module.ts::renderTypedDispatch`

Emits the per-kind `render_<kind>` functions, the per-supertype render
helpers, the grammar's word-class table, `render_transport_dispatch`, and
`impl Render for AnyTransport`. The supertype helpers come after every
per-kind function so each concrete subtype's function is declared before a
match arm names it.

`render_transport_dispatch` takes `&dyn Render` rather than
`&AnyTransport` so the root's own `SlotValue` carrier renders through the
same single `SpacingWriter` wrap; a second entry point would be a second
place the root seam policy could drift. It takes the render context and
builds the writer from it: `.with_table(&options::WHITESPACE)` so
`w.site(...)` resolves against this grammar's whitespace vocabulary,
`.with_indent(&ctx.options.indent)`, and `.with_sources(ctx.sources)` so a
`Coord` slot slices its bytes from the tree the engine still holds. It wraps
the output `String` once, never per level, and calls
`transport.render(&mut w)`.

The `AnyTransport` impl is one match: every kind variant delegates to the
payload's `Render` (so a struct kind's trivia wrapper fires), a fixed-literal
unit variant calls its kind's render function, and the `Verbatim` variant
writes its text. Each fixed-literal kind's render function
(`renderFixedLiteralFn`) is emitted here, once per kind, for every enum that
admits the kind to call.

`usedSupertypeNames` limits helper emission to the supertypes some slot
actually names; `kindIdByKind` lets a list kind with a nonterminal
separator resolve each candidate arm's numeric id for the
`separator_kind` match (see `buildSeparatorKindMatchLines`).

After the transport is written, the entry calls the writer's `finish`,
which flushes only a whitespace-token payload; a plain seam payload still
held at the end of the tree is dropped, so a root node gains no edge
whitespace.

Takes the generated kind entries so the emitted `with_literal_merge_pairs` table is derived from the tokens the parser actually lexes (`literalMergePairs`), not from every literal the transport projection carries.

### `packages/codegen/src/emitters/render-module.ts::renderTransportEntry`

The render entry the napi engine calls: `RenderRoot` is the root in the
same `SlotValue` carrier every slot position uses, and
`render_transport_parts(mut transport, ctx)` runs the prepare walk over the
whole tree (`Prepare::prepare(&mut transport, ctx)?`) before a single byte
is written, then renders through `render_transport_dispatch` with the same
context. A coordinate the sources cannot resolve fails here, before the
writer exists.

### `packages/codegen/src/emitters/render-module.ts::renderTypedKindFn`

```text
/**
 * Emit the `render_<kind>(node: &<Kind>Transport, f: &mut Formatter)`
 * function for a single node. Dispatches based on modelType:
 *
 * - branch / envelope / list / polymorph with a body → views as locals,
 *   one `write!` (renderTypedBranchFn); without a body, the slot-by-slot
 *   fallback (renderTypedBranchFallbackFn)
 * - pattern / token / enum → write the text (renderTypedLeafFn)
 */
```

#### body

```text
// 'list' shares 'branch'/'envelope'/'polymorph's typed-render
// path — see isSlotBearingCompound's doc comment (shared.ts).
```

#### body

```text
// No template for this kind — fall back to joining children/text.
```

### `packages/codegen/src/emitters/render-module.ts::renderTypedBranchFallbackFn`

The render function for a compound kind that has no body: each slot is
written in declaration order through `buildSlotWriteCall`, with the class
`slotClassOfShape` gives the slot's shape, or, when there are no slots, the
transport's captured text. A list slot is a `Vec` or a `NonEmptyVec`, never
optional, so its items are iterated directly; a single slot that may be
absent is an `Option`.

### `packages/codegen/src/emitters/render-module.ts::literalWrite`

The one classification every literal-render call site shares, whether the
value is known at codegen time (`valueExpr` a Rust string literal) or read
at runtime (`valueExpr` a field reference): `fixed` is always the
codegen-known text, used only to classify. The depth arms' stamped
identity (`isDepthText`) moves the writer's depth (`w.indent()`/
`w.dedent()`, never a written byte); a whitespace-only value is a token
seam (`w.token_seam(valueExpr)` — coalesces with the seams around it but,
unlike a seam, is never dropped, since it is a token the source holds);
anything else writes `valueExpr` as plain text. `leafTextWrite` (a leaf
transport's own `text`, shared by the typed render function and the
transport's `Render`) and every fixed literal's render function
(`renderFixedLiteralFn`, which every unit arm calls) go through this, so a
newline terminator renders the same whether it arrived as a kind id or as a
node.

The DEDENT arm here (`w.dedent()`, no seam) differs from
`SpacingWriter::site(DEDENT)`, which always merges a break seam after
dedenting: this route only calls `w.seam` when a body payload follows the
dedent at that edge. No grammar exercises both routes on the same edge
today, so the difference is inert; a future grammar that mixes them would
need one route's break behavior reconciled with the other's.

```text
/// The one classification a literal's render call makes, whether the value
/// is known at codegen time (`valueExpr` a Rust string literal) or read at
/// runtime (`valueExpr` a field reference) — `fixed` is always the
/// codegen-known text, used only to classify: the depth arms' stamped
/// identity moves the writer's depth, a whitespace-only value is a token
/// seam (survives a render's end, unlike a seam), and anything else writes
/// `valueExpr` as plain text.
```

The dedent arm hands the sink the break it should merge (`w.dedent("\n")`), so the cancel rule lives in the writer and the emitter states only what the break is; the body printer's dedent node does the same with its payload (`w.dedent(<payload>)`, or `w.dedent("")` when nothing follows). There is no second route that decides whether a break may follow a dedent.

### `packages/codegen/src/emitters/render-module.ts::renderTypedLeafFn`

The render function for a pattern, token or enum kind: an enum transport
writes through its own `Render`, every other leaf writes `t.text` through
`leafTextWrite`, after the leaf's edge call (`leafEdgesCall`).

### `packages/codegen/src/emitters/render-module.ts::isImmediateLeaf`

A leaf declared immediate in the grammar. The single predicate both the
typed render function and the leaf's own `Render` impl read, so a leaf
rendered as a child and a leaf rendered through its own `Render` agree on
whether adjacency is marked.

### `packages/codegen/src/emitters/render-module.ts::leafRenderExpr`

The leaf's own `Render` body: its text write, preceded by its edge call. A
fragment following an escape sequence inside a string is kept from the
word-hazard space by that call.

### `packages/codegen/src/emitters/render-module.ts::leafEdgesCall`

The sink call a leaf makes before its text. A stamped leaf (`leafEdgesOf`)
names its kind to the writer (`leaf_kind`), which reads the stamp from the
whitespace table, so the typed render path and a leaf sliced from the source
read one table. A leaf declared immediate that carries no stamp marks
adjacency alone (`w.adjacent()`): no whitespace may precede it. A call made
here, inside the trivia-wrapped render function, lets factory-attached
leading trivia seam normally before the edge applies to the leaf's own text.

### `packages/codegen/src/emitters/render-module.ts::renderTypedBranchFn`

The one render function for a kind with a body:
`fn render_<kind>(node: &<Kind>Transport, w: &mut dyn RenderSink) -> RenderResult`,
whose statements `buildTypedTemplateBody` produces. The node-wide fallback
separator comes from `MetaData.separators` for list slots whose values
carry no per-slot separator stamp.

### `packages/codegen/src/emitters/render-module.ts::buildSeparatorKindMatchLines`

```text
/**
 * Emit `match node.separator_kind { Some(<id>) => "<lit>", ..., _ => <fallback> }`
 * lines resolving a `'list'` node's per-instance nonterminal-separator
 * KindId back to its compile-time-known literal text (design doc's "Render"
 * section: the render side never stores separator text, only resynthesizes it).
 *
 * Candidates are the list's `separatorCandidateKindNames` — the SAME stamped
 * arms wrap.ts's `_separator_kind` wire capture reads, so the
 * match arms enumerate exactly the kinds a real `_separator_kind` value can
 * hold. For a `STRING` arm, `rule.value` doubles as both the catalog lookup
 * key (an anon token's literal text IS its `symbolName`, per
 * `buildKindIdByKind`) and the literal text to emit — a nonterminal
 * separator's arms are themselves just literals (no real grammar kind has one
 * today; see `emitSeparatedListWrap`'s doc comment, wrap.ts).
 *
 * Returns `undefined` (caller falls back to the plain literal `fallbackSeparator`)
 * when none of the candidates resolve to a known id — codegen must still emit a
 * syntactically valid expression in that case.
 */
```

When the plan holds a separator site for the list, the `_ =>` fallback is
the declared default's token text (`SpacingSite.defaultText`) rather than
the template's own separator literal: `fill_options` has already set
`separator_kind` from the table, so the fallback only covers a transport
that skipped the fill.

### `packages/codegen/src/emitters/render-module.ts::buildTypedTemplateBody`

The statements of a kind's render function: one local per slot the body
names, then the body printed by `printRustBody`.
The locals are the views; the body's sink calls reference them by name. A
seam is not bound as a local at all: `printRustBody` prints it directly as
`w.site(node.<field>.unwrap_or(0))`, resolved through the field's own
`Option<u16>`; a body naming a seam the transport has no spacing site for
is an error, like a slot naming a field the transport doesn't have.

A required slot with a transport field is a plain reference
(`let name = &node.name;`), since `SlotValue` is `Render` on its own.
Every other slot is a view built from the node's field and the slot's
template, `templateOf(struct.flanks.get(name))`:

- optional transport slot: `View::new(&node.x, "->{}")`;
- optional slot backed by a hoisted helper: `View::new(<lookup>, …)` where
  the lookup is the direct field or the helper's inner field, as an
  `Option<&SlotValue>`;
- presence (the slot's `transportSlotShapeOf`): `View::new(&node.x, "<keyword>")`,
  the keyword being the presence's text with the slot's flanks around it and
  no placeholder, so it is written whole when the flag is set; a presence
  that names its kind is `View::new(Presence::new(node.x, <Kind>Transport::<Variant>), "{}")`
  instead, so the keyword renders through its kind's render function (a
  named kind seats held trivia, a line-terminated one ends its line);
- text: a plain reference when required, a view when optional;
- list: a `ListView` literal with `items` borrowed from the transport
  (`&node.x`, a list field being never optional, or `NO_ITEMS` when
  the transport has no field), the template, the separator token or the
  `separator_kind` match, `before`/`after`/`head`/`tail` from the node's
  stamped spacing sites, and `leading`/`trailing` from the list's delimiter
  facts.

`variant` binds when the body names it. A body that names a
slot the transport has no field for is a codegen error raised here, with
the fields the transport does have, rather than a Rust compile error in
generated code.

There is no captured-text fast path. A compound transport carries no
text: a node that arrives with storage renders from its storage, and an
untouched node arrives as a coordinate the slot carrier slices. The path
that once returned a compound's `$text` when every slot was empty
returned before the body's `dedent`, and leaked depth for the rest of the
render.

### `packages/codegen/src/emitters/render-module.ts::emitHashFiles`

```text
/**
 * Emit `hash.rs` + `hash.ts` for a single grammar: the render-module hash
 * over the generated render sources, baked into the native crate and
 * mirrored on the TS side so the backend shim can tell a binary built
 * from older generated code apart from the current package.
 */
```

### `packages/codegen/src/emitters/render-module.ts::emitRenderModule`

Emits the render module for a grammar: `transport.rs` (the transport
types, their `Display` impls and the per-kind render functions), the
options module, the hash files and `mod.rs`. Takes the emitted bodies —
the per-kind bodies are what the render functions and the validators'
sidecar are both read from — the assembled node map, and the parser's
kind-id tables. The tables are required: every transport decodes by kind id,
so the parser is generated before the render module is emitted.
`transport.rs` imports `sittir_core::VerbatimTransport`, so every verbatim
variant the module names holds the core's type.


#### body

```text
// Same order the hash function sorts under — deterministic output.
```

#### body

```text
// Only user-facing nodes get templates emitted (see templates.ts
// emitJinjaTemplates); if the jinja file exists, the node exists
// and is userFacing.
```

#### body

```text
// --- transport.rs ---
// AnyTransport enum + per-kind transport structs + typed dispatch +
// transport bridge helpers.
```

### `packages/codegen/src/emitters/render-module.ts::grammarTriviaStatement`

The render module's last statement, `::sittir_core::grammar_trivia!(TriviaTransport; …)`: it states once, for every transport the module emits (each `pub struct` or `pub enum` deriving `Transport`, unit-only enums included), that the grammar's trivia type is `TriviaTransport`. A coordinate in any slot then decodes and frames the outside trivia a folded node carries (`HasTrivia`), whatever the slot's transport type. The names come from `ReadPrint.transports`, which `transportDeclaration` fills as each transport is printed.

### `packages/codegen/src/emitters/render-module.ts::transportDeclaration`

The head of a transport's declaration: its derive, its `#[transport(...)]` arguments and `pub struct` or `pub enum` with its name. Every printer of a transport goes through it, so it records the name in `ReadPrint.transports` where the type is printed.

### `packages/codegen/src/emitters/render-module.ts::pruneUnreferencedBridges`

```text
/**
 * reachability gate: drop any `*_transport_to_any` bridge fn that nothing in
 * the assembled transport.rs references. The file-top `#![allow(dead_code)]`
 * means rustc will never flag an unreferenced bridge, so without this prune
 * a dead bridge survives silently (exactly how the deleted
 * transport→UntypedNode island hid). Reachability is computed against the FINAL
 * assembled text — by construction, every emitted bridge has a live caller.
 */
```

```text
// swallow the trailing blank line
```

### `packages/codegen/src/emitters/render-module.ts::commonRustUseImports`

The `use` block at the top of `transport.rs`: the views (`View`,
`ListView`, `NO_ITEMS`) and the transport support types. `fmt::Write` is
deliberately not imported; the kind bodies write through `Formatter`'s
inherent `write_fmt`, and the render root spells the trait call in full.

The module permits `clippy::large_enum_variant` because
`payloadCeilingAssertions` enforces the canonical pinned payload ceiling
in both directions. Clippy's generic size heuristic does not override the
measured boxing policy. This allowance applies to the transport module.
See [Clippy policy](../clippy-policy.md) for the CI command and the separate
legacy-deserializer exception.

### `packages/codegen/src/emitters/render-module.ts::collectUsedSupertypeNames`

The supertypes whose transport enums are emitted: each one a slot's
`transportSlotShapeOf` names, closed over the supertypes those enums hold
as variants.

#### body

```text
// Transitive closure: supertype enums include sub-supertypes as variants.
// If PatternTransport has `KeywordIdentifier(Box<KeywordIdentifierTransport>)`,
// then KeywordIdentifierTransport must also be emitted. Expand to fixed point.
```

### `packages/codegen/src/emitters/render-module.ts::buildKindIdByKind`

```text
/**
 * Build a `Map<string, number>` from `kindEntries` for O(1) lookup by kind.
 * Also indexes `symbolName` when present so literal kinds (e.g. `"+"`)
 * resolve the same way as their parser-symbol names (`PLUS`).
 */
```

### `packages/codegen/src/emitters/render-module.ts::enumMemberAcceptedIds`

```text
/**
 * Accepted wire ids for an `AssembledEnum` transport variant — the
 * construction-time literal-chain stamps (`resolvedByText`), NOT the member
 * kind NAMES re-resolved through `buildKindIdByKind`. That map is last-wins
 * across catalog entries whose `kind` text collides (anon-token text ==
 * named-rule name, the #129 class), while the TS side emits the stamped
 * anon ids on the wire (`kindEnumTextMapExpr`) — dispatch arms must accept
 * the same ids the sender bakes.
 */
```

### `packages/codegen/src/emitters/render-module.ts::anyTransportPrepareArms`

`AnyTransport`'s `Prepare` arms: a payload arm per node that is not a fixed
literal, a unit arm per fixed-literal kind, and `Verbatim`. Shared by both
`AnyTransport` emitters.

### `packages/codegen/src/emitters/render-module.ts::renderTransportValueTypeHelper`

```text
/**
 * Emit the `transport_value_type` helper — a plain `napi_typeof` probe used
 * by every hand-emitted `FromNapiValue` impl in this module.
 *
 * Dispatching on the JS value's type FIRST (instead of probing typed reads
 * `u16` → `String` → `Object` in sequence) is load-bearing: napi-rs's
 * `String::from_napi_value` failure path JSON.stringify's Object inputs for
 * diagnostics — a JS callback re-entered from deep native recursion that
 * overflows the V8 stack on recursive AST shapes
 * (block→statement→expression→block) and aborts the process
 * (`Check failed: IsOnCentralStack()`, exit 133). `napi_typeof` is a plain
 * C call with no JS re-entry and no diagnostic error construction, so a
 * mismatched shape never pays that cost.
 */
```

### `packages/codegen/src/emitters/render-module.ts::emitSupertypeRenderHelper`

Emits `render_<supertype>(t: &<Supertype>Transport, w: &mut dyn RenderSink) -> RenderResult`
as a bounded match over the enum variants, each arm delegating to the
subtype payload's `.render(w)` so its own trivia-wrapped impl fires; a
fixed-literal subtype's unit arm calls its kind's render function. A boxed
payload (`boxedInEnum`, given the emission's pins) is reached through `.as_ref()`. Arm count
is bounded by the supertype's subtype count, not the grammar.

### `packages/codegen/src/emitters/render-module.ts::admitsVerbatimCollapse`

```text
/**
 * Whether a transport enum spanning `kinds` (supertype subtypes, or a
 * per-slot enum's candidate child kinds) must admit bare-string input via a
 * `Verbatim(VerbatimTransport)` variant.
 *
 * Two ways a candidate kind can surface as bare text at read time:
 *
 * 1. It (or a supertype subtype reachable from it) IS a `pattern`-modelType
 *    leaf (`identifier`, `integer_literal`, etc.) — these always render
 *    their raw `text` verbatim, so the transport layer sends them as bare
 *    strings rather than tagged objects.
 * 2. It's a concrete branch/group kind whose ONLY user-facing field is a
 *    repeated choice (`classifyBranchSlots` singleSlot/multiple) that
 *    includes a GRAMMAR-HIDDEN (leading-underscore) `pattern`-modelType
 *    alternative. Tree-sitter elides hidden rules entirely rather than
 *    nesting them as child nodes, so when the repeat is satisfied purely by
 *    that hidden leaf (typically an external-scanner symbol), the enclosing
 *    node ends up with zero named children in the real parse — the read
 *    side then has nothing to represent but the node's raw text. The
 *    alternative must be hidden, not merely `pattern`-modelType: a VISIBLE
 *    pattern alternative (e.g. `identifier` in `dotted_name`) still produces
 *    its own real child node, so the enclosing node never collapses.
 *    Concretely: python's `string_content` is `repeat1(choice(
 *    escape_interpolation | escape_sequence | string_content_group1 |
 *    _string_content))`; a plain string body matches purely via the hidden
 *    external-scanner `_string_content` (modelType `pattern`) and reads as
 *    bare text, so `StringContentTransportSlot` (string's `content` field,
 *    kinds `[interpolation, string_content]`) must admit `Verbatim` even
 *    though `string_content` itself is `modelType: 'branch'`.
 *
 * Checked over the fully recursively-flattened kind set (via
 * `collectConcreteTransportKinds`), not a shallow membership test — see the
 * call sites for concrete "missed it" cases confirmed in this codebase.
 */
```

### `packages/codegen/src/emitters/render-module.ts::hasAnyConcreteChildKind`

```text
/**
 * Returns `true` when at least one kind in `kinds` can produce a concrete
 * transport type (i.e. `concreteTransportTypeName` returns non-null).
 * When all kinds are supertypes / multi / polymorph, a per-slot enum would be
 * empty and must not be emitted — callers fall back to `Box<AnyTransport>`.
 */
```

### `packages/codegen/src/emitters/render-module.ts::collectPerSlotChildEnums`

The per-slot choices: one for each slot, named or unnamed, whose
`transportSlotShapeOf` is `union`, named `<TypeName><FieldName>TransportSlot`
by `perSlotEnumName`. Nothing else registers a choice, so every choice
emitted is a field's type. A choice's variants are the slot's
`fieldTypeComponents`: its node kinds and its literals.
`shareIdenticalChoices` then emits each distinct choice once.

#### body

```text
// All existing transport struct / enum names — used ONLY by the named-slot
// pass below to guard against any naming collision between named-slot enum
// names (`<TypeName><FieldName>TransportSlot`) and existing struct names.
// One observed collision class is polymorph-form-derived names (e.g.
// `AssertsAnnotationAssertsTransport` from form `asserts_annotation__form_asserts`
// coincides with parent `asserts_annotation` + named field `asserts`), but
// the set covers ALL transport struct names — branch, group, polymorph,
// supertype enum, etc. — so we catch every collision class, not just
// polymorph forms. Pre-populating from every `rustTransportStructName(node)`
// is the single, scope-correct guard.
```

#### body

```text
// Per cleanup-rules §E1: unnamed slots emit per-slot enums symmetric with named.
// Each unnamed slot (e.g. `_attributed_parameter.parameter`) gets its own enum
// named `<TypeName><FieldName>TransportSlot` (e.g. `AttributedParameterParameterTransportSlot`)
// — no special-case "Child" suffix anymore.
```

#### body

```text
// `fieldTypeComponents` is the single source of truth for "is this
// value a real child kind (its own transport type) or a literal" —
// already used to build the module-wide literal projection
// (`fieldTransportLiterals`/`collectTransportLiterals`). A node-ref to
// a HIDDEN keyword/token (e.g. an enrich-synthesized field-promotion
// helper like `_member_expression_separator`) collapses to a literal
// there via `resolveHiddenKeywordLeaf`; re-deriving kinds/literals
// from `kindsOf`+`isTerminalValue` here missed that collapse, so a
// hidden-keyword arm got treated as a "real" child needing its own
// boxed struct variant instead of joining the slot's other literal(s)
// — the exact gap `member_expression`'s unified `separator` field hit.
```

#### body

```text
// Symmetric — named and unnamed slots both flow through `consider`.
```

A slot with a blank arm always gets a per-slot enum, to hold its `Blank` variant: `transportSlotShapeOf` classifies it as a choice.

### `packages/codegen/src/emitters/render-module.ts::ChoiceNames`

The name of the choice each union-shaped slot is typed by, keyed by
`choiceKey(typeName, fieldName)`: the one place field types, option fills
and seat targets look a slot's choice up.

### `packages/codegen/src/emitters/render-module.ts::SharedChoices`

The choices `shareIdenticalChoices` emits, each with its generated lines,
and the `ChoiceNames` every slot's field resolves through.

### `packages/codegen/src/emitters/render-module.ts::choiceKey`

The key a slot's choice is filed under: its owner's type name and its field
name.

### `packages/codegen/src/emitters/render-module.ts::shareIdenticalChoices`

Emits each distinct choice once. Every slot's choice is generated under its
own name; two slots whose generated choices are identical once their own
names are set aside — the same variants, ids, aliases, seams and prepare
fill — share the first one's declaration and name, in node order. A choice
whose arms write its owner's seam sites differs from another owner's and
stays its own.

### `packages/codegen/src/emitters/render-module.ts::choiceNameOf`

The choice a union-shaped slot's field is typed by. A slot with no collected
choice is a codegen error, never a Rust type that names nothing.

### `packages/codegen/src/emitters/render-module.ts::literalSeamsOf`

The seam sites of the owner kind that one literal of a choice carries
(`before`, `after`), or `undefined` when it has none. A site belongs to the
literal when its token equals `tokenNameOfText` of the literal's text, the
same derivation the seam pass used to mint it, so an arm that is a kind
reference to punctuation (the `optional_chain` arm of `member_expression`'s
`dot` slot) finds the `?.` sites named for its text rather than for its kind
name.

A literal reached through an enum reference (`enumKind`, stamped by
`textStoragesOf`) looks its sites up under that enum kind instead of the
owner: the arm is one of the enum's tokens and carries the enum's seams.
rust `non_special_token`'s punctuation arms therefore write
`token_tree_punctuation`'s seams (no space before `,`), exactly as they
did when the enum was its own arm.

### `packages/codegen/src/emitters/render-module.ts::ChoiceUnit`

One fixed-literal kind as an arm of a choice: its registry entry (`fixed`),
whether the site marks it immediate when its kind is not (`siteImmediate`),
and the owner's seam sites around it (`seams`).

### `packages/codegen/src/emitters/render-module.ts::choiceUnitsOf`

A choice's unit arms, one per fixed-literal kind and keyed by its variant:
each fixed-text kind in the slot's concrete expansion, then each literal the
slot stores (`fixedLiteralOf`, which also checks the literal's spelling). A
kind reached both ways is one arm; it takes the literal's site immediacy and
seams. Two literals of one kind whose seams differ fail codegen, since one
arm can write only one set.

### `packages/codegen/src/emitters/render-module.ts::choiceUnitArm`

The render arm of a unit: a call to its kind's render function
(`renderFixedLiteralFn`), after `w.adjacent()` when the site is immediate,
and between the owner's seam sites when it has any (`literalSeamedArm`).

### `packages/codegen/src/emitters/render-module.ts::emitPerSlotChildEnum`

```text
/**
 * Emit a `{TypeName}ChildTransportSlot` per-slot children enum for a heterogeneous
 * children slot. The enum has one variant per concrete child kind: a payload
 * variant wrapping the kind's transport struct (boxed for non-leaf kinds), or,
 * for a fixed-literal kind, a unit variant named by the kind. When a
 * member is pattern-modeled the enum also admits `Verbatim(VerbatimTransport)`,
 * marked `#[transport(verbatim)]` — a bare string in that slot is text with no
 * kind of its own — with a prepare arm and a render arm.
 *
 * Mirrors `emitSupertypeTransportEnum` but is derived from the specific child
 * kinds in a slot rather than grammar supertype membership.
 *
 * @param entry - the per-slot enum descriptor (typeName + child kinds)
 * @param kindIdByKind - map from kind to numeric parser symbol id (for the variants' claims)
 * @param nodeMap - for transport struct names and modelType lookups
 */
```

#### body

```text
// Expand any supertype child kinds to their concrete transport-bearing kinds,
// then dedupe so aliased / overlapping paths emit one variant per concrete kind.
```

#### body

```text
// Claim each accepted kind id once. Unit claims come first, from
// `unitKindIdsOf`, then the blank id, then each payload variant's
// accepted ids; an id already claimed stays with its first claimant.
```

#### body

```text
// value-backed kinds take their accepted ids straight from the mint
// stamps (storageKindId + parseKindId subsume both name-keyed alias
// redirects, per reference site). The name chain remains only for
// kinds with no value in hand (supertype-expanded arms) or id-less
// values.
```

#### body

```text
// Render impl — match on variant and delegate to the payload's own Render
// (not the per-kind render fn directly) so the concrete variant's own
// impl, which renders through its layout, fires. A unit arm calls its kind's
// render function (`choiceUnitArm`).
```

#### body

```text
// A structural kind whose leftmost terminal is grammar-immediate
// (`isLeftImmediateKind`) renders seam-free on its left in every
// context — mark before delegating. Leaf kinds carry their mark
// inside their own render fn, so marking here would double-declare.
```

#### body

```text
// An immediate fixed-literal kind writes seam-free inside its own
// render function (see `w.adjacent()`). A literal the site marks
// immediate (`literal.immediate`) whose kind is not immediate marks
// `w.adjacent()` before the call.
```


A unit arm whose token has seam sites under the owner kind (a statement's
`;` terminator, `semi_before`) is still a unit variant: `literalSeamsOf`
finds the owner's `before` and `after` site constants in the render plan,
and `literalSeamedArm` writes `w.site_at(SITE)` around the call, so the sink
reads the arm from its resolved options. The
choice's seams sit inside the arm in the render rule, and the template
collapses the choice to one slot, so the enum is where they are written;
the parent never sees them.

Each payload is written by `choicePayloadType`, boxed when it is pinned over the payload ceiling, and its render arm reaches a boxed payload through `.as_ref()`.

The unit variants' kind ids are computed once (`unitKindIdsOf`) and become
their `#[kind]` claims. Each claim prints as the variant's `#[kind]` line
(`variantKindLines`), which is what the derive's codec decodes from, and from
which the derive builds `from_kind_id` for an enum whose arms are all units
or blank: a prepare-filled slot fills from its option's resolved kind id
through it, so a slot whose enum has a payload arm fails to compile there.
An id no variant claims, such as the wire id of an alias that wraps a
flattened supertype, is refused by the codec.

A slot with a blank arm (`hasBlankArm`) gets a `Blank` variant: it decodes from the blank id, renders nothing, and is no kind.

### `packages/codegen/src/emitters/render-module.ts::unitKindIdsOf`

A choice's unit arms as kind id → variant pairs, first occurrence per id:
each stored literal's resolved id (`resolveLiteralKindId`), then each
fixed-text kind's ids accepted at this slot (the same `acceptedIdsOf` the
payload arms use, which also checks the ids are routable). Two units sharing
an id are one pair, not a failure.

### `packages/codegen/src/emitters/render-module.ts::renderAnyTransport`

`AnyTransport`: one payload variant per node that is not a fixed literal, one
unit variant per fixed-literal kind (`collectFixedLiterals`), and `Verbatim`.
Each kind id is claimed once: node claims first, then each literal's own id
(`FixedLiteral.ownId`), and an id that alias-collapsed kinds share goes to its
first claimant. Each claim prints as the variant's `#[kind]` line
(`variantKindLines`), which is what the derive's codec decodes from.

`Verbatim` carries no `#[transport(verbatim)]`: `AnyTransport` admits every
typed node, so no bare string can pick a variant. A value with no kind id
belongs to the enclosing `SlotValue` carrier as verbatim text.

The ids come from the same `kindEntries` that `kind_ids.rs` is emitted from
(`buildKindIdByKind`), so the claims and the constants agree.

### `packages/codegen/src/emitters/render-module.ts::renderTriviaTransportSupport`

`TriviaTransport`: one variant per concrete trivia kind (`triviaKinds`, the
grammar's extras through their supertypes) — a unit variant named by the
kind for a fixed-text kind (every whitespace kind), rendered by the kind's
render function and decoded from its id — plus `Verbatim` for an entry
that arrives as bare text (a detached fixture's comment, or text a user
attached). Typed variants are needed because a factory-constructed comment
carries the same wrapped wire shape as any other node and renders through
its own template.

`TriviaTransport` derives `Transport` as `#[transport(choice, codec_only)]`:
the derive expands its codec and its variant lookup but no typed reader,
since the layout reader reads trivia. Each kind variant claims its kind's id
in a `#[kind]` line. `Verbatim` is marked `#[transport(verbatim)]`. `Text` is
marked `#[transport(text)]` and names the compound trivia kinds whose `$text`
objects it takes; a grammar whose extras hold no compound kind leaves `Text`
unmarked, and nothing decodes into it.

`TriviaTransport` implements `TriviaSeam` for the whitespace trivia kinds (`whitespaceTriviaKinds`): such an entry is merged into the gap it sits in and replaces that gap's spacing, instead of rendering as a line of its own. Its seam text is the kind's fixed text: JS names a whitespace entry by its exact spelling, so the kind determines the text.

`TransportLayout` is an alias for `sittir_core::layout::TransportLayout<TriviaTransport>`, the layout every struct transport carries; its trivia is a `sittir_core::trivia::TransportTrivia<TriviaTransport>`.
The carrier's shape (leading, trailing and inner entries, each with its
same-line facts) and where each entry renders are the core module's, the
same for every grammar.

It also emits a `Text` variant (`sittir_core::trivia::TriviaText`): a detached read entry that carries its stamped kind and captured text. `TriviaTransport` implements `FromTriviaText` as that variant, so a snapshot read builds each extra it places as its text and span. It writes that kind's edges around the text, like a rendered node of the kind. It is decoded from an object with `$text` whose kind is a compound trivia kind; a leaf trivia kind stores `$text` itself and keeps its own transport. A trivia entry needs no line-end handling of its own: each variant's render tells the sink its kind (`TransportLayout::render` for a typed variant, the kind's render function for a unit, `TriviaText`'s own render for `Text`), and the sink holds the line end from the grammar's `KIND_FLAGS` table (`renderOptionsRs`), as it does for any node.

### `packages/codegen/src/emitters/render-module.ts::renderVerbatimTransportStruct`

```text
/**
 * Emit the `VerbatimTransport` struct — a synthetic carrier for bare-string
 * inputs that have no `$type` annotation. Used by per-slot and supertype
 * enums that admit at least one AssembledPattern variant (kinds whose render
 * template emits the text verbatim — `identifier`, `integer_literal`, etc.).
 *
 * The struct itself has no kind_id, no factory or from-side production —
 * it ONLY appears via the `FromNapiValue` bare-string fast-path. The render
 * arm in the enclosing enum writes `self.text` directly to the destination.
 *
 * Rationale: AssembledPattern variants are interchangeable at the render
 * boundary (they all emit `{{ text }}`). On the recursive deep-read path,
 * leaf positions sometimes send text without a `$type` annotation; previously
 * the variant-trial fallback silently matched whatever variant's FromNapiValue
 * happened to accept the input first (e.g., StringLiteralTransport matched
 * bare strings and rendered as `""`). Verbatim removes the ambiguity.
 */
```

### `packages/codegen/src/emitters/render-module.ts::FixedLiteral`

One fixed-literal kind as the transport sees it: a kind stored by its kind
id whose text the kind fixes (`isFixedTextLeaf`), or a transport literal
with a kind id and no node of its own. `variant` names its unit variant, the
same in every enum that admits the kind (`AnyTransport`, a supertype enum, a
choice, `TriviaTransport`, and the kind's own type); `renderFn` is the one
function that writes it; `text` its spelling; `ownId` the kind's id;
`acceptedIds` every id the parser issues for it
(`resolveAcceptedTransportIds`); `owner` whether it is a named kind, which
owns trivia; `immediate` whether the grammar forbids whitespace before it.

### `packages/codegen/src/emitters/render-module.ts::FixedLiterals`

The grammar's fixed-literal kinds, keyed by kind (`collectFixedLiterals`).

### `packages/codegen/src/emitters/render-module.ts::collectFixedLiterals`

Every fixed-literal kind of the grammar, collected once: each projection
node `isFixedTextLeaf` marks, then each transport literal with a kind id
whose kind has no node, named by the member of the kind entry that id
belongs to. A kind's accepted ids add the ids its values are stored under
(`TransportProjection.wireIds`). A literal with no kind id gets no variant,
since nothing could decode it into one; a literal whose id no kind entry
has is a codegen error. A literal whose kind has a node that is not fixed
text (regex `lazy`) belongs to that node.

### `packages/codegen/src/emitters/render-module.ts::fixedLiteralOf`

A kind's registry entry. A kind with no entry, or a slot that stores the
kind under another spelling, fails codegen.

### `packages/codegen/src/emitters/render-module.ts::renderFixedLiteralFn`

`render_<kind>(w)`: a fixed literal's kind rendered through the layout's
render protocol with no layout (`layoutRenderCall`), exactly as a node of
the kind that carries no trivia or edges renders. A named kind (an owner,
`ownsTrivia`) seats pending trailing trivia before and after itself, and a
line-terminated kind ends its line (`end_line_after`). The body marks
`w.adjacent()` for an immediate kind and writes the text with
`literalWrite` (an indent or dedent marker, a whitespace token as a token
seam). Every arm that holds the kind calls this function.

### `packages/codegen/src/emitters/render-module.ts::layoutRenderCall`

The render call every node goes through:
`TransportLayout::render(layout, kind, role, w, |w| body)`, one protocol
for a struct transport, which passes its own layout, and a fixed literal's
unit, which has none. `owner` picks the trivia role.

### `packages/codegen/src/emitters/render-module.ts::ownsTrivia`

Whether a kind owns trivia: every kind but an anonymous token (its kind
entry's `anon`, the parser's fact). The reader counts an anonymous token
among the tokens between an owner and its same-line trailing entries
(`$tokensBetween`), never as an owner, so its render seats no held entries:
`a + /* x */ b` keeps the comment after `+`. A fixed literal's registry
entry (`collectFixedLiterals`) and a leaf struct's render read the fact
here.

### `packages/codegen/src/emitters/render-module.ts::renderFixedLiteralTransport`

The fixed literal's own type, the one a slot typed by the kind holds: the
one-variant enum `<Kind>Transport { <Variant> }`. Its `KindOf` answers its
own id, its `Prepare` is inert, it renders through `renderFixedLiteralFn`'s
function, and the derive decodes it from the ids its `#[kind]` line claims
(`fixedLiteralIds`).

### `packages/codegen/src/emitters/render-module.ts::enumMemberId`

An enum member's kind id (`AssembledEnum.resolvedByText`). A member with none
is a codegen error, since the transport has no other way to decode it.

### `packages/codegen/src/emitters/render-module.ts::renderLayoutField`

The `layout` field (`LAYOUT_FIELD`) a compound transport struct carries
besides its slots, keyed `#[wire(key = "$_layout")]` (`wireKeyAttr`). A
compound declares no text field — its content is its slots, and a node that
arrives with storage renders from that storage.

### `packages/codegen/src/emitters/render-module.ts::renderLeafTransportPlainFields`

A text leaf's transport fields: the layout field (`renderLayoutField`), then
`text: String` keyed `$text`, the leaf's own content. The struct's
`#[transport(…, text …)]` (`transportArgs`) has the derive expand the text
leaf codec: a bare string is its text, a number its fixed text, and an object
its `$text` and its layout.

### `packages/codegen/src/emitters/render-module.ts::TransportSlotShape`

What a transport slot's field holds, decided once per slot by
`transportSlotShapeOf`: a keyword's `presence` (with its text, and the
keyword's kind when the slot references a fixed-literal kind), bare
`text`, one `kind`'s transport, a `supertype`'s enum, the slot's own
`union` (its per-slot choice), or `any` (`AnyTransport`).

### `packages/codegen/src/emitters/render-module.ts::transportSlotShapeOf`

The one classification of a transport slot. Every transport emitter that
asks what a slot holds reads it: the field's Rust type
(`rustTransportSlotType`), the choices emitted (`collectPerSlotChildEnums`
registers a slot's choice exactly when its shape is `union`, so every
emitted choice is some field's type), the supertype enums emitted
(`collectUsedSupertypeNames`), the template locals
(`buildTypedTemplateBody`) and the fallback render's write calls
(`renderTypedBranchFallbackFn`, through `slotClassOfShape`).

A slot `classifyPrimitiveField` types as a primitive is `presence` or
`text`; a presence slot that references a fixed-literal kind names it
(`presenceKindOf`), so the keyword renders as that kind. Any other slot is
classified by its node kinds (`kindsOf`), with a slot that holds both kinds
and anonymous literals, or that has a blank arm (`hasBlankArm`), forced to a
choice. A slot no kind or supertype covers is its own choice when it holds a
concrete kind or a literal (`fieldTypeComponents`), so a slot that stores
only token kind ids gets the choice of those tokens; `any` is left for a
slot that holds neither.

### `packages/codegen/src/emitters/render-module.ts::presenceKindOf`

The fixed-literal kind a presence slot references, when its one value is a
reference to a fixed-text kind (`isFixedTextLeaf`); nothing for a keyword
written inline in the rule, which stays the owner's template text.

### `packages/codegen/src/emitters/render-module.ts::slotClassOfShape`

The write-call class (`buildSlotWriteCall`) of a slot's shape: a kind is
`concrete`, a supertype `supertype`, and every other shape `heterogeneous`,
written through its own `Render`. A fixed-literal kind is `heterogeneous`
too: its render function takes no node, and its type's `Render` calls it.

### `packages/codegen/src/emitters/render-module.ts::rustTransportSlotType`

The Rust type of a transport slot's field, printed from the slot's
`transportSlotShapeOf` and its cardinality (`required`, `multiple`,
`optionalElement`, `adjacent`): presence is `Option<bool>`, text `String`
(or `Option<String>`), and every other shape is its type in the `SlotValue`
carrier — the kind's transport, the supertype's enum, the slot's choice
as `choiceNameOf` names it, or `AnyTransport` — wrapped as
`T` or `Option<T>` for a single value, and for a list as
`NonEmptyVec<T>` (a `repeat1` slot, whose read refuses an empty list) or
`Vec<T>` (any other, an empty list being `[]`), never optional. A singular slot whose
reachable kinds share an SCC with `parentKind` boxes its value.

#### body

```text
// Back-edge detection: a singular (non-Vec) slot creates a size cycle when
// the slot's actual emitted type can hold a value that transitively
// references parentKind. The "reachable kind set" depends on slot
// classification:
//   - concrete: the single kind admitted
//   - supertype: the supertype kind itself (which the SCC graph treats as
//     a relay node — edges flow supertype → subtypes)
//   - heterogeneous: the slot's direct admit set (per-slot enum has no
//     graph node; edges are direct parent → admits)
// Vec slots don't propagate size cycles (Vec is heap-allocated, fixed size)
// so they never need an extra Box.
```

#### body

```text
// heterogeneous — per-slot enum admits slotKinds directly
```

#### body

```text
// Elidable separated-list positions (array elision, `[a, , b]`): a
// hole is a real position holding no element — `None` entries, which
// napi maps from the wire's `undefined` entries natively.
```

#### body

```text
// Box goes INSIDE the carrier: the carrier's own size is bounded by
// its `String` arm, so the indirection still has to sit on the node
// arm to break the size cycle.
```

#### body

```text
// Unknown kind — fall back to AnyTransport.
// Vec<AnyTransport> is safe (Vec provides indirection). Single-value
// AnyTransport fields need Box<> to break recursive size cycles
// (AnyTransport is potentially recursive through any singular slot).
```

#### body

```text
// Empty-enum guard: when no kind maps to a concrete transport struct
// (all are supertypes/polymorphs/multi), per-slot enum collection skips
// this slot. Fall back to AnyTransport.
```

A slot with a blank arm is always typed by its per-slot enum (`transportSlotShapeOf` classifies it as a choice), even when its one token would otherwise give it that token's transport type, because the field must hold the blank.

### `packages/codegen/src/emitters/render-module.ts::concreteTransportTypeName`

The transport type a slot's concrete kind is held as: `rustTransportStructName` of its node, so a per-slot choice names a payload as every other printer does. `null` for a supertype, which a per-slot choice expands to its members, and for a kind with no node.

### `packages/codegen/src/emitters/render-module.ts::perSlotEnumName`

```text
/**
 * Name for a per-slot children enum for a heterogeneous children slot.
/**
 * Per-slot transport enum name for a heterogeneous slot.
 *
 * Format: `{TypeName}{SlotName}TransportSlot` — symmetric for named and
 * unnamed slots (e.g. `ModItemBodyTransportSlot` for `mod_item.body`,
 * `AttributedParameterParameterTransportSlot` for `_attributed_parameter.parameter`).
 *
 * @param typeName - The parent node's typeName (PascalCase).
 * @param fieldName - The slot's name (snake_case / lowercase).
 */
```

#### body

```text
// Field names are typically snake_case / lowercase (e.g. `body`, `type_arguments`).
// PascalCase them so the resulting enum name reads correctly.
```

### `packages/codegen/src/emitters/render-module.ts::rustTransportStructName`

```text
/**
 * Rust type name for the transport representation of a node.
 *
 * For `enum` modelType nodes: the transport type is the Rust enum itself
 * (`XxxEnum`). All other nodes use the standard `XxxTransport` struct name.
 */
```

### `packages/codegen/src/emitters/render-module.ts::literalToVariantName`

```text
/**
 * Convert a literal text value to a safe Rust PascalCase enum variant name.
 *
 * Lookup order:
 * 1. Exact match in `LITERAL_TO_VARIANT_NAME` (operator/keyword/symbol table).
 * 2. Alphanumeric identifier: PascalCase the token (e.g. `async_block` → `AsyncBlock`).
 * 3. Fallback: encode each byte as `U{hex}` to guarantee a valid Rust identifier.
 *
 * @param literal - The grammar literal string (e.g. `"+"`, `"mut"`, `"u8"`).
 */
```

#### body

```text
// Alphanumeric / underscore — PascalCase each segment.
```

#### body

```text
// Fallback: encode each code-point as hex with a leading `V` prefix.
```

### `packages/codegen/src/emitters/render-module.ts::enumTypeName`

```text
/**
 * Enum type name for an `AssembledEnum` node. Appends `Enum` to the typeName
 * (PascalCase) to avoid collision with the companion `*Transport` struct naming
 * convention. Used by the parent transport struct field type.
 *
 * Example: typeName `BinaryExpressionOperator` → `BinaryExpressionOperatorEnum`.
 */
```

### `packages/codegen/src/emitters/render-module.ts::armSeamPairsOf`

The seam pair each literal arm of an enum owns, keyed by the arm's text. A
site records the arm's token as its slot (`armSeamName`), and the arm's text
names the same token through `anonTokenNameOfText`, the one function both
sides use. An arm missing either side is left out.

### `packages/codegen/src/emitters/render-module.ts::renderEnumType`

```text
/**
 * Emit a Rust enum type for an `AssembledEnum` node (synthesized field-enum
 * or pre-existing grammar enum). Replaces the `text: String` leaf-struct path
 * with a closed, statically-known variant set.
 * Emits for multi-member enums:
 * - `#[derive(Debug, Clone, Copy)] pub enum XxxEnum { ... }`
 * - a `#[kind(…)]` line per member: the derive's codec decodes a member's
 *   kind id and nothing else, and encodes a member as its first claimed id
 * - `impl Render` — writes the static literal text per variant; a variant
 *   whose arm has a seam pair (`armSeamPairsOf`) writes its before site, the
 *   text, then its after site, each read from the resolved options with
 *   `w.site_at`, so an enum arm needs no per-node carrier for its seams
 *
 * @param node - the AssembledEnum node
 * @param kindEntries - the kind catalog the arms' seam pairs resolve against
 */
```

#### body

```text
// --- Rust enum declaration ---
```

#### body

```text
// An enum member crosses as its kind id: the wrap folds a read enum node
// onto the member id, in a field slot and a list item alike.
```

#### body

```text
// --- impl Display ---
```

### `packages/codegen/src/emitters/shared.ts::isSlotBearingCompound`

```text
/**
 * `node instanceof AbstractAssembledCompound` — true for `AssembledBranch`,
 * `AssembledEnvelope`, `AssembledPolymorph`, AND `AssembledList` alike,
 * since all four extend that base directly and genuinely share its
 * `.slots` surface (not a widened special case: `AssembledList`
 * is a real subclass, not a byte-identity workaround pretending to be one).
 * `AssembledSupertype` is NOT included — despite also being
 * `modelType: 'polymorph'`, it has no slots of its own and does not extend
 * `AbstractAssembledCompound`. Centralizes the check so the several call
 * sites that need "does this node have a generic slot surface" stay in
 * sync on one predicate rather than each re-deriving it from `modelType`.
 */
```

### `packages/codegen/src/emitters/shared.ts::slotSeparatorTexts`

The literal separator texts a repeated slot's values carry — the one source
of "what separates this slot", which the render module reads for the
slot's separator texts. `elidedOnly` narrows to the
values that may be absent, which is the elidable-list form.

### `packages/codegen/src/emitters/shared.ts::canonicalSeparatedListField`

```text
/**
 * An `AssembledList`'s single-field-storage canonical slot — the `node.slots`
 * entry whose storage key wrap.ts/render-module.ts's transport-struct
 * emission actually use for the "whole element union" bucket. Prefers the `arity === 'many'` field
 * (the real repeated-content slot) and falls back to the first field for
 * kinds with no such slot.
 *
 * SHARED across wrap.ts, factories.ts, from.ts, and test.ts so all four
 * emitters agree on the same canonical storage key a `'list'`-classified
 * kind's elements are read from / written to on the wire.
 * Multi-field kinds (`node.slots.length > 1`) must NOT use this helper for
 * storage — they route each field through `fieldAccessorLines` instead
 * (see callers).
 */
```

### `packages/codegen/src/emitters/shared.ts::collectAliasSourceKinds`

```text
/**
 * Collect hidden source kinds (`surfaceHidden` nodes) referenced via any field
 * / child value slot across the node map, and every hidden subtype a
 * supertype aliases to a visible name (its `subtypeParseNames`). These are
 * the kinds whose factory stamps `$type: '_X'` at construction — emission
 * paths (factories, templates, types) must include them even though they're
 * hidden. A flattened variant parent is a supertype whose variant children
 * are aliased (`_assignment_eq` as `assignment_eq`), so they are reached
 * through that alias, not through a slot.
 */
```

### `packages/codegen/src/emitters/shared.ts::collectAliasTargetToSourceMap`

```text
/**
 * Compute the alias-target -> alias-source map for canonical hidden remaps.
 *
 * Tree-sitter parses `alias($._x, $.x)` as the visible target kind `x`,
 * while the generated Sittir surface treats the hidden source `_x` as
 * canonical. Both the wrap layer and native transport projector use this
 * single derivation so parser output is normalized consistently.
 */
```

#### body

```text
// RENAMED alias pairs: an enrich-minted arm (`alias($._expression_except_range,
// $.expression_group1)`) shares no base name with its storage kind, so the
// stripped-name derivation above can never find it — parser output arrives
// under the mint's own kind (`alias_sym_expression_group1`) and, without a
// remap, `wrapNode` falls through to "unknown kind — return as-is",
// leaving the wrapper unmaterialized (the silent-stub class). The link
// flatten stamped each pair on the REFERENCING supertype
// (`SupertypeRule.subtypeParseNames` — see types/rule.ts); register both
// the parse name and its catalog-key spelling (`_`-prefixed — the key
// `KIND_NAMES` yields for the `alias_sym_*` row) against the storage kind.
```

#### body

```text
// A parse name that IS a real independent kind is not a remap —
// leave its own wrap dispatch in charge.
```

### `packages/codegen/src/emitters/shared.ts::slotKindNames`

```text
/**
 * Extract the node kind names from a slot's `values` array.
 * Returns the name string for each NodeRef entry (resolved or unresolved).
 * Terminal values are excluded — they're not kinds.
 */
```

### `packages/codegen/src/emitters/shared.ts::slotLiteralValues`

```text
/**
 * Extract the terminal literal values from a slot's `values` array.
 */
```

### `packages/codegen/src/emitters/shared.ts::isValidIdent`

```text
/** True when `s` is a valid unquoted TypeScript identifier. */
```

### `packages/codegen/src/emitters/shared.ts::compareOrdinal`

```text
Code-unit ordering, the same comparator generated bytes are sorted with
everywhere a stable, locale-independent order matters. `localeCompare`
orders `_` and case differently from code units and varies by runtime ICU
data — neither is acceptable for output that must be byte-identical across
machines.
```

### `packages/codegen/src/emitters/shared.ts::_identOrQuoted`

```text
/** If `name` is a valid identifier, return `name`. Otherwise return its
 * JSON-quoted form — suitable for emission inside union / indexed-access
 * type positions where a non-identifier key would otherwise be a syntax
 * error. */
```

### `packages/codegen/src/emitters/shared.ts::resolveEffectiveLiteral`

```text
/**
 * Resolve a field's effective single-literal value, if any.
 *
 * A field qualifies for auto-stamp when ALL of the following hold:
 *   - It is **required** — no values are `optional`.
 *   - It is **not repeated** — no values are `array` / `nonEmptyArray`.
 *   - Its *effective* resolved type is exactly one string literal.
 *
 * Two sources of "single string literal" are recognised:
 *
 * - **Source A — inline literal**: exactly one TerminalValue in `values`.
 *
 * - **Source B — referenced keyword kind**: exactly one NodeRef in `values`
 *   pointing to a hidden AssembledKeyword (a hidden rule whose body is a
 *   single word-like string, such as `_kw_async: $ => 'async'`).
 *
 * Returns `undefined` when the field is optional, is repeated, has
 * multiple possible values, or the referenced kind is not a single-
 * literal terminal.
 *
 * @remarks Phase 1: omit auto-stamp-eligible fields from Config input and
 * stamp the constant directly in factory output. The field stays in the
 * `$fields` block of the concrete TypeScript interface so UntypedNode output
 * shape is unchanged and round-trips with readUntypedNode remain identical.
 */
```

### `packages/codegen/src/emitters/shared.ts::stampExpressionFor`

```text
/**
 * Build the TypeScript stamp expression for an auto-stamp-eligible REQUIRED slot.
 *
 * Returns `undefined` when:
 * - The slot is optional (no stamp needed — omit the key from the factory call).
 * - The slot is not auto-stamp-eligible.
 *
 * Two expression shapes:
 * - **Inline literal** (TerminalValue): `JSON.stringify(value) + " as const"`
 * - **Referenced keyword** (hidden AssembledKeyword NodeRef): UntypedNode object literal
 *   `{ $type: '...', $text: '...', $source: 2 as const, $named: true as const }`
 * - **Referenced parameterless compound**: factory call expression from
 *   `ref.stampExpression` — e.g. `"breakExpression()"`.
 *
 * @remarks
 * This function replaces the field-only `autoStampExpression()` inside factories.ts
 * for the general case. The factories.ts private function is kept as-is for backwards
 * compat; this helper is the authoritative version for emitters that need to handle
 * children slots too.
 */
```

### `packages/codegen/src/emitters/shared.ts::fieldTypeComponents`

```text
/**
 * The {@link TypeComponent} list for a field slot, projected from each
 * value's stamped `storage` by `typeComponentOf`. This is a presentation
 * layer for the consumers that still assemble type expressions from
 * components (types.ts, render-module.ts, transport-projection.ts); it
 * derives nothing itself. Ordered as the values appear in `field.values`;
 * an enum reference expands to one literal component per member
 * (`textStoragesOf`), so a slot reaching an enum lists the members' ids;
 * callers deduplicate at emission time. Values with no storage (neither a
 * node nor a literal) are dropped.
 */
```

### `packages/codegen/src/emitters/shared.ts::classifyValueStorage`

```text
/**
 * The one producer of a value's storage kind. Every entry in a slot's
 * `values` maps to exactly one of:
 *
 * - `node`   — a reference to a kind with a real factory; the built node
 *              is stored. A kind missing from the map still gets `node`
 *              storage under a synthesized PascalCase type name, flagged
 *              `missing` so types.ts can emit its stub.
 * - `kindId` — identity only: a reference whose storage target — the
 *              kind itself, or the leaf a transparent single-subtype
 *              supertype chain ends in (`storageTargetOf`) — carries
 *              `storage: 'kindId'` (`isKindIdStored`), or an inline
 *              literal that resolved to a kind. An enum target stamps its
 *              member set (`members`) instead of one text and id: the
 *              slot stores one of the members' ids. The text is carried for
 *              the verbatim-slot and fallback paths; the id is the
 *              reference's wire identity (`keywordRefWireIdentity` — the
 *              grammar type id a parse surfaces the arm under), the same
 *              derivation the slot-level tables use, so type, table and
 *              transport never disagree on which id a slot stores.
 * - `literal` — an inline literal with no kind at all.
 *
 * Whether the value arrived as a node reference or an inline terminal is
 * not recorded: a `kindId` value carries its kind either way, and the
 * transport keys a fixed-text arm by that kind whichever way it was
 * written in the grammar. `immediate` is a fact of an inline terminal
 * only (a `token.immediate` wrapper) and is carried as such.
 *
 * Resolved once per value in `computeFieldStorageInfo`, read verbatim by
 * every consumer, never re-derived from a slot-level verdict.
 */
```

### `packages/codegen/src/emitters/shared.ts::valueStorageOf`

```text
/** A value's storage stamp, classifying and stamping it on first use when
 *  the eager pass in `computeFieldStorageInfo` has not reached it. */
```

### `packages/codegen/src/emitters/shared.ts::typeComponentOf`

```text
/** Projects one text-or-node storage onto the {@link TypeComponent} shape
 *  the component consumers expect (a member set is expanded by the caller
 *  through `textStoragesOf` first). A `kindId` value becomes a literal
 *  component with its kind as `rawKind` and its wire id — whether the
 *  grammar wrote it as a reference or an inline terminal — so the
 *  transport and render walkers key every kind-bearing literal by kind;
 *  a genuinely anonymous literal has no `rawKind` and is keyed by its
 *  text. `immediate` passes through from the stamp. */
```

An expanded enum member keeps the enum it came through as `enumKind` on
the literal component, for `literalSeamsOf`.

### `packages/codegen/src/emitters/shared.ts::childTypeComponents`

```text
/**
 * Compute the shared {@link TypeComponent} list for a children slot.
 *
 * Child slots intentionally project only constructible / hydratable node refs.
 * Inline terminal values in the grammar (separator commas, keywords like
 * `"from"`, etc.) are filtered out by the wrap layer and never appear in the
 * public children accessor surface, so the type projection must ignore them too.
 *
 * Hidden keyword refs are still inlined to string literals because they are
 * node-backed slots the public surface can carry.
 */
```

#### body

```text
// One derivation with the named-field path: a sole slot's value set can
// mix node references with inline terminals (rust `function_modifiers`'
// 'async' | ... beside extern_modifier) — projecting only node kinds
// would make those grammar-valid members unconstructible type-safely.
```

### `packages/codegen/src/emitters/shared.ts::resolveEntryLiteral`

```text
/**
 * The fixed text a slot value carries, or `undefined` when it carries a
 * node. Reads the stamped value storage: a `kindId` or `literal` value has
 * exactly one text (a keyword / token kind is a single string rule; an
 * inline literal is one text), a `node` value has none. This is the
 * presence classifier's only input — it never asks whether the kind is
 * hidden, visible, or `_`-prefixed.
 */
```

```text
// ---------------------------------------------------------------------------
// Keyword-presence classifier
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/shared.ts::keywordPresenceKind`

```text
/**
 * Classify a field's keyword-presence intent from its slot `values` +
 * per-value multiplicity. Returns `'boolean'` for `optional(single-literal)`
 * (or the degenerate `repeat(single-literal)`), `'bitflag'` for
 * `repeat(choice-of-literals)`, and `null` when the field isn't a
 * keyword-presence pattern.
 *
 * Shape criteria:
 *
 * - **`'boolean'`** — EITHER:
 *   - exactly one `values` entry, resolves to a single literal, multiplicity
 *     is `'optional'`; OR
 *   - every entry resolves to a literal AND every entry's multiplicity is
 *     `'array'` / `'nonEmptyArray'` AND the set of distinct literals has
 *     size exactly 1 (degenerate repeat-of-one-literal).
 *
 * - **`'bitflag'`** — every entry resolves to a literal AND every entry's
 *   multiplicity is `'array'` / `'nonEmptyArray'` AND the set of distinct
 *   literal values has size >= 2.
 *
 * - **`null`** otherwise — any non-literal NodeRef (a symbol pointing at
 *   a structural kind) disqualifies, as does mixed or required-single
 *   multiplicity.
 *
 * @see ADR-0012 for the motivation and the three-row taxonomy.
 */
```

#### body

```text
// Single optional entry → boolean when the entry resolves to a literal.
```

#### body

```text
// Every entry must resolve to a literal and be array / nonEmptyArray
// for the repeat-of-literals cases.
```

```text
// degenerate repeat(single-literal)
```

A slot registered as a choice preference is never a presence flag: its token and its blank are two arms of one choice, stored as kind ids.

### `packages/codegen/src/emitters/shared.ts::blankFromInput`

The stored value of a caller's input to a slot with a blank arm: `null` is the blank id, `undefined` stays unset (the options fill it at render), and a kind id is stored as given.

### `packages/codegen/src/emitters/shared.ts::keywordPresenceValue`

```text
/**
 * The single literal for a boolean-keyword field. Returns `undefined` if
 * the field is not a boolean-keyword field.
 */
```

#### body

```text
// For single-entry optional: the entry's literal. For degenerate
// repeat(single-literal): the one distinct literal.
```

### `packages/codegen/src/emitters/shared.ts::keywordPresenceValues`

```text
/**
 * The ordered-unique literal set for a bitflag field. Returns an empty
 * array if the field is not a bitflag field. Order follows the order
 * the literals appear in the grammar's `values` array — that order is
 * the canonical render / enum-declaration order.
 */
```

### `packages/codegen/src/emitters/shared.ts::keywordPresenceIsNonEmptyRepeat`

```text
/**
 * Returns `true` when EVERY entry in the slot's `values` has multiplicity
 * `nonEmptyArray`. Used by the consts emitter to decide whether a bitflag
 * enum needs a `None = 0` member (repeat allows zero → yes, repeat1 no).
 */
```

### `packages/codegen/src/emitters/shared.ts::classifyPrimitiveField`

```text
/**
 * Classifies a slot whose ENTIRE value set is bare anonymous-literal
 * terminals (no node-ref at all — e.g. rust `self_parameter.self` is a bare
 * `field('self', 'self')` literal, not a reference to a keyword KIND) that
 * the Rust transport struct should type as a primitive (`bool` / `String`)
 * instead of routing through `rustTransportSlotType`'s node-ref-based
 * per-slot-enum / `AnyTransport` classification.
 *
 * `kindsOf()`-based slot classification (used to type the transport struct
 * field) intentionally skips `TerminalValue` entries, so a terminal-only
 * field is left with an empty kind set and no distinguishing content —
 * falling back to `AnyTransport`, which accepts neither wrap's collapsed
 * `bool` nor its bare verbatim string.
 *
 * A `'boolean'` storage is read first, for a node-ref slot as much as for a
 * terminal one: the reader and the factories store a present keyword as
 * `true` either way (rust `closure_expression.move`, a node-ref to `_move`,
 * like `self_parameter.reference`), and a fixed literal's own type takes
 * only its kind id, so the slot must be a boolean.
 *
 * For every other storage, node-ref fields (to a keyword/token/pattern/
 * branch/supertype KIND) are EXCLUDED: a node-ref to an ordinary
 * branch/supertype kind (e.g. `call_expression.
 * callee` → `_expression`) is a completely normal structural child —
 * `resolveFieldStorageInfo`'s `'verbatim'` result for THAT case means
 * "not a bounded keyword-literal set", not "wrap sends bare text"; treating
 * it as a primitive would be wrong (confirmed: an earlier version of this
 * function gated on `resolveFieldStorageInfo` alone and wrongly collapsed
 * ordinary structural fields to `String`).
 *
 * `resolveFieldStorageInfo` (the SAME slot-storage classification `wrap.ts`
 * already uses) distinguishes what wrap actually puts on the wire:
 *
 * - `'boolean'` — wrap collapses this to a JS `true`/absent boolean
 *   (rust `self_parameter.reference` → `&`, `closure_expression.async`
 *   → `async`). The Rust field is an `Option<bool>` carrying presence (the
 *   napi object derive needs the `Option` for an absent key), with `text`
 *   the fixed literal to write when present.
 * - `'verbatim'` — the literal has no stamped catalog kind_id at all. Wrap
 *   sends the literal's raw text on the wire; the Rust field should be a
 *   plain `String`/`Option<String>` (mirroring the slot's own
 *   required/optional — NOT collapsed, unlike `'boolean'`) carrying it
 *   through.
 * - `'kindEnum'` — has a stamped catalog kind_id, but that alone does NOT
 *   mean wrap sends the numeric id: confirmed empirically (`tool
 *   probe-kind`), rust `self_parameter.self` and `extern_crate_declaration.
 *   crate` are ALSO `'kindEnum'` (each resolves to its own single keyword
 *   kind, `self`/`crate`) yet wrap sends raw TEXT (`"self"`/`"crate"`) —
 *   while `visibility_modifier_pub._pub` and `binary_expression.operator`
 *   are ALSO `'kindEnum'` and wrap sends the numeric kind_id. The
 *   discriminator is whether the resolved kind is VISIBLE in our model
 *   (`hidden === false` — has its own factory, e.g. `self`/`crate`: a user
 *   can construct one directly, so wrap treats it as a genuine leaf node
 *   and forwards its text) vs a pure hidden/anonymous marker (`hidden ===
 *   true`, e.g. `pub`, the `&&`/`+`/... operator tokens: no dedicated
 *   factory, so wrap forwards only the bare kind_id). Only the VISIBLE case
 *   gets `'verbatim'` treatment here; the hidden case is left alone —
 *   `AnyTransport`'s existing kind_id branch already resolves it correctly,
 *   and redirecting it to `String` breaks it (converting a raw napi Number
 *   into a Rust `String` fails).
 * - `'bitflag'` — also NOT covered; a separate concern with no observed
 *   regression.
 *
 * Multiple/array-multiplicity slots are also excluded (`undefined`) — no
 * observed case needs a `Vec<String>` carrier yet; safer to fall through to
 * the existing path than introduce untested Vec-of-primitive handling.
 */
```

```text
// hidden kindEnum / bitflag — existing per-slot/AnyTransport path already handles these correctly.
```

#### token interior

```text
A slot whose values are all pattern values is a primitive verbatim slot: its transport field is `String`, not a
transport node.
```

### `packages/codegen/src/emitters/shared.ts::kindEnumTextIdPairs`

```text
/**
 * Stamped text→member-kindId pairs for a kindEnum slot — the compile-time
 * fact the wrap projection uses to put NUMERIC member ids on the wire when a
 * reference site materializes the enum as its own wrapper node (`{ $type:
 * <wrapper id>, $text: "private" }`). Ids come from the construction-time
 * stamps only (`AssembledEnum.resolvedByText`, `TerminalValue.resolvedKindId`,
 * keyword/token catalog rows) — never a runtime text chase; a member with no
 * stamped id is simply absent (the projection falls back to text for it, and
 * the render-side enum's string branch still accepts that).
 */
```

#### body

```text
// The arms come from enumArmsOf — the same walk classifyFieldStorageInfo reads.
```

### `packages/codegen/src/emitters/shared.ts::resolveFieldStorageInfo`

```text
/**
 * Shared classification for the public field-storage contract emitted by the
 * generator.
 */
```

### `packages/codegen/src/emitters/shared.ts::resolveSingleFieldFactorySlot`

```text
/** The slot a kind's factory takes as its one positional value: the
 *  compound's structural sole slot (`AbstractAssembledCompound.soleSlot`)
 *  when it is singular; never for a hidden, non-user-facing kind. The
 *  class is the surface — no derived "user slot" filtering. */
```

### `packages/codegen/src/emitters/shared.ts::resolveFactoryFieldNames`

```text
/** The factory's declared field names — a compound's slots as the model
 *  holds them (every slot is a factory field; the class is the surface),
 *  a list's canonical element field. */
```

### `packages/codegen/src/emitters/shared.ts::classifyChildFactorySurface`

```text
/**
 * `classifyChildFactorySurface` is module-private on purpose. It answers
 * one structural question — does this kind construct from children, and
 * if so by spread or directly — and five unrelated decisions used to read
 * that single answer:
 *
 *   factoryTakesSpreadChildren   factories.ts: does the factory take
 *                                positional element args?
 *   fromEmitsChildrenCoercer     from.ts: emit the children-taking
 *                                coercer rather than the field-carrying one?
 *   fromForwardsToChildFactory   from.ts: may this target's factory be
 *                                forwarded to?
 *   testConstructsWithChildren   test.ts: may a generated test construct
 *                                this with children?
 *   irNamespacesChildFactory     ir.ts: does a leaf factory under this
 *                                parent get namespaced?
 *
 * They agree today, and each is a one-line delegation because of that.
 * The names exist so they can stop agreeing: widening the shared
 * classifier for one consumer used to re-shape the other four silently —
 * narrowing it once emptied `_wrapKindIds` and broke array auto-wrap at
 * runtime, and re-broadening it moved named kinds into the child coercer
 * and cost them their dual-surface tolerance. A consumer whose question
 * changes now edits its own predicate.
 *
 * `isWrapChildrenKind` and `emitsFieldResolvers` are the same pattern,
 * already named for their questions before this split.
 */
```

#### body

```text
A 'direct' sole slot whose values are all AssembledEnum kinds takes its value
directly; it is not a compound child to construct.
```

### `packages/codegen/src/emitters/shared.ts::factoryTakesSpreadChildren`

```text
/** Does this kind's factory take positional element args? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

### `packages/codegen/src/emitters/shared.ts::fromEmitsChildrenCoercer`

```text
/** Emit the children-taking coercer rather than the field-carrying one? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

### `packages/codegen/src/emitters/shared.ts::fromForwardsToChildFactory`

```text
/** May this target's factory be forwarded to? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

### `packages/codegen/src/emitters/shared.ts::fromBareInput`

```text
/** What a kind's from() coercer accepts as its one BARE argument, beyond
 *  the kind itself and its config bag: `'value'` for a thin wrapper whose
 *  factory takes its sole slot directly (the 'direct' / 'forwarded'
 *  shapes), `'elements'` for a separated list, `null` for a config-bag
 *  builder. A slot's resolver calls the coercer with the slot's value as
 *  that single argument, so this is also what a slot referencing the kind
 *  admits — the types emitter stamps that slot's key on the kind's `NodeNs`
 *  row (its `Bare` argument) and `emitBranchFrom` gates its direct-call body on it, so
 *  the two surfaces cannot disagree about which kinds take a bare value.
 *  A sole MANY slot ('spread') is deliberately not here: its coercer hands
 *  the input to the strict factory unresolved. */
```

#### token interior

```text
A lexed kind with exactly one required text slot accepts a bare value for that slot, as a direct kind does:
`ir.charLiteral('a')` is content `a`. Whole-token text reaches a lexed kind only through the leaf registry, which
projects it through the token interior.
```

### `packages/codegen/src/emitters/shared.ts::scalarLeafKinds`

```text
/** The leaf kinds a JavaScript boolean resolves to in this grammar — the
 *  grammar's own true and false leaves — absent when it has none. The one
 *  source for the runtime `_resolveScalar` and for the `LeafScalarMap` the
 *  loose surface widens those leaves through. A number is not resolved by
 *  name: see `numericLeafKinds`. */
```

### `packages/codegen/src/emitters/interior.ts::numberShape`

The numeric shape of a guard pattern: an integer written in base 2, 8, 10 or 16 with the prefix the pattern requires (`0x`, `0o`, `0b`, or none), or a float, or nothing. It is found by probing the anchored pattern, never by reading its source: a base is taken when the pattern accepts digits of that base (with the prefix, when it needs one) and rejects a digit outside it, so `0x[0-9a-f]+` is hex with prefix `0x`, a bare `[\da-fA-F]+` is hex with no prefix, `\d+` is decimal, and a pattern that accepts a letter outside the base, or the empty string, has no shape. A float is a pattern that accepts a float numeral and no letter; its shape also carries the spelling a whole number takes in it, probed as `1.0`, `1.` then `1e0` (rust's `float_literal` takes `.0`, so `1` writes `1.0`), or none when the pattern spells no whole number (a leading-point float), leaving a whole number to its plain text for the guard to reject. The one classifier behind bare-number coercion, the number acceptance of builders and the widened config types.

### `packages/codegen/src/emitters/interior.ts::numberSignature`

`numberShape` named for reading and tests: decimal, hex, octal, binary or float.

### `packages/codegen/src/emitters/interior.ts::numberShapeOfPattern`

`numberShape` of a pattern source, compiled the way every leaf guard is.

### `packages/codegen/src/emitters/interior.ts::numericSlotShape`

The shape of a text slot whose values are one pattern; a slot of any other kind has none.

### `packages/codegen/src/emitters/interior.ts::numericSlotKeys`

The config keys of a node's numeric text slots.

### `packages/codegen/src/emitters/interior.ts::numericLeafShape`

The shape of a pattern leaf's own text pattern.

### `packages/codegen/src/emitters/factories.ts::omitRegistered`

Wraps a configuration type so it omits the registered slots' keys.

### `packages/codegen/src/emitters/factories.ts::spellingTypeOf`

The object type of a node's registered slots, each key optional and typed by the slot's literal arms; the type of the trailing options parameter and of the namespace's `Spelling`. Nothing when the node has no registered slot.

A slot with a blank arm also takes `null`, the blank.

### `packages/codegen/src/emitters/interior.ts::optionalGroupPeers`

The other named parts of the optional group a slot sits in, or nothing when the slot is not in a group. A registered spelling in a group is written only when one of these is present.

### `packages/codegen/src/emitters/factories.ts::registeredSlotSource`

The expression a builder binds a registered slot to: the option, else the registered arm, and, for a slot inside an optional group, only when one of the group's other parts is present. A choice-mode slot takes the option alone.

#### body

```text
// A choice-mode slot (terminator, quotes/style — arms with kind ids) is a
// native render option site: when the built node leaves it unset, the
// transport's prepare fills it from the option chain (per-tree > per-call >
// engine > grammar default; render-module.ts's optionDefaultFills). Baking
// the declared default into the built node would pre-empt that chain, so the
// factory only SETS the slot when the caller passes it. Only a
// spelling-mode slot (no kind ids, no render-time resolution) gets the
// eager default.
```

A choice slot with a blank arm stores its input through `blankFromInput`.

### `packages/codegen/src/emitters/interior.ts::bareInteriorText`

Whether a lexed kind with no single content slot takes a bare string as its whole text, and the number shape of that text when it is numeric (`numberShape` over the interior guard, compiled once by `interiorGuard` for the leaf guard and for this probe). A bare string is projected onto the kind's slots through its token interior.

### `packages/codegen/src/emitters/interior.ts::numberTextArgs`

The base and affix arguments of the `numberText` call an emitter writes for a shape: an integer's prefix, or a float's whole-number spelling.

### `packages/codegen/src/emitters/interior.ts::numberInputType`

The JavaScript values a numeric text slot of this shape accepts: `number | bigint` for an integer in any base, `number` for a float (a bigint has no float spelling). The one source for every emitted numeric input type: leaf text parameters, slot element types, `WidenNumeric` keys, bare loose inputs and `LeafScalarMap`.

### `packages/codegen/src/emitters/interior.ts::numericLiteralSignature`

The public overload of a numeric text builder: `<const N extends string | <numberInputType>>(param: N & NumericLiteral<N, <integer?>>)`, written before the builder's implementation signature, which keeps the widened parameter. The overload refuses a literal the runtime guard refuses (negative; non-integer for an integer shape; past the safe-integer range) and accepts a text, a non-literal number and a bigint. An integer shape (`integer?` true) and a float shape differ only in the integer check.

### `packages/codegen/src/emitters/interior.ts::numericConfigSlots`

The numeric text slots of a node as a type-level record from config key to whether the slot is an integer (a float's digit slots are integers), or `undefined` when it has none. The one source of the `W` argument of `NumericConfig` and `NumericInput`.

### `packages/codegen/src/emitters/interior.ts::numericInputRefusal`

The refusal a loose coercer applies to its input `I`: `NumericInput<I, bare, slots>`, where `bare` says whether the bare number the kind accepts is an integer (`undefined` when it accepts none) and `slots` is `numericConfigSlots`. `undefined` when the kind has neither a bare number nor a numeric config slot, so a coercer of any other kind keeps its signature.

### `packages/codegen/src/emitters/interior.ts::numberInputTest`

The runtime test, over the named value, that matches `numberInputType`: the guard a coercer uses to send a JavaScript value through `numberText` rather than treat it as a node or config.

### `packages/codegen/src/emitters/interior.ts::numericLeafInputTypes`

The `numberInputType` of each leaf a bare JavaScript number can resolve to (`numericLeafKinds`), keyed by kind: the entries `LeafScalarMap` types those leaves with.

### `packages/codegen/src/emitters/interior.ts::numericLeafKinds`

The leaf kinds a bare JavaScript number can resolve to: the leaves whose guard has a decimal or float shape (a hex, octal or binary leaf is reached by naming its arm). The list is ordered the default arms of hoisted parents first, then declaration order. The runtime resolver tests `String(value)` against each leaf's registered pattern in that order and builds the first that accepts it, so `1` reaches the default integer arm, `1.5` a point arm and `1e21` a scientific arm, in any grammar, with no leaf named in the emitter. The same list types the number-accepting leaves in `LeafScalarMap`.

#### the boolean kinds come from the model, not a name

A boolean resolves to a kind id, never through the leaf registry: the enum
whose two member texts are `true` and `false` in any case (rust's
`boolean_literal`, members `true_keyword` / `false_keyword`), or, where the
grammar has no such enum, the two keyword kinds with those texts (typescript
`true` / `false`, python `True` / `False`). `trueKind` / `falseKind` are the
kinds whose ids `_resolveScalar` returns, which the slot admits as a stored
kind id (through `_ENUMS_OF_MEMBER` when the slot names the enum), and the
two ids `LeafScalarMap` widens to `boolean`: a slot stores the member ids,
never the enum's own, so the map is keyed on the members and the types
package's `WidenScalarKindId` lets a bare id with a scalar entry admit it.

### `packages/codegen/src/emitters/shared.ts::testConstructsWithChildren`

```text
/** May a generated test construct this kind with children? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

### `packages/codegen/src/emitters/shared.ts::irNamespacesChildFactory`

```text
/** Does a leaf factory under this parent get namespaced? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

### `packages/codegen/src/emitters/render-body.ts`

The render body IR: the one representation of a kind's render body between
the template walk and the Rust printer. A body is a flat sequence of
nodes — literal `text`, structural `whitespace`, a `slot` reference, a
static `space` seam, the `adjacent` mark, and an `if` chain of
presence-gated arms with an optional literal fallback. The walk in
templates.ts builds it; `printRustBody` prints it into `transport.rs`, and
the JSON of the same nodes is the sidecar the validators read.

Both templates a body becomes use the `write!` vocabulary: the kind template
(`write!(f, "fn {name}{parameters}")`) and each view's template
(`View::new(&node.return_type, "->{}")`), with `{{` and `}}` for literal
braces in either.

### `packages/codegen/src/emitters/render-body.ts::Body`

`text` is literal token text; adjacent texts merge in `concat`. `indent`
and `dedent` are a NEWLINE-carrying depth move — an INDENT/DEDENT rule, or
the fixed text of a hidden kind that is exactly the depth arms' stamped
identity (`isDepthText`) — printed as `w.indent()`/`w.dedent()` sink calls,
never as text; `printStatements`'s payload rule folds a following literal's
leading whitespace into the call. `tokenSeam` is the fixed text of a
hidden kind that is nothing but whitespace and not depth text (the newline
external): printed as `w.token_seam(...)`, which coalesces like a seam but
is never dropped, since it is a token the source holds. None of the three
merge with `text`, and all read as an expression at a seam.
`slot` references a slot by storage name. `space` is a statically resolved
spaced seam. `adjacent` prints as `w.adjacent()` before the next sink call,
which reads it as "no seam space here". `seam` names a token seam site
(`lparen_before`) whose whitespace is a transport field resolved at render
time; it prints directly as `w.site(node.<field>.unwrap_or(0))` — no local
is bound for it — and, like `slot`, reads as an expression at a seam. `if`
tests its arms for presence in order and takes the literal `fallback` when
none holds.

### `packages/codegen/src/emitters/render-body.ts::SeamNode`

A token seam site in a body, named by its transport field
(`lparen_before`); `seam()` builds one. It carries no text of its own:
`printStatements` prints it directly as `w.site(node.<field>.unwrap_or(0))`,
resolved from the transport field at render time — no local is ever bound
for it.

### `packages/codegen/src/emitters/render-body.ts::isWhitespaceOnly`

Whether a fixed text is nothing but whitespace: the one predicate behind
every site that decides a text is structural whitespace rather than
token text.

### `packages/codegen/src/emitters/render-body.ts::writesText`

True when a body writes a non-whitespace text node on some path, looking into both arms of a conditional and its fallback.

### `packages/codegen/src/emitters/render-body.ts::tokenSeam`

The body node for a whitespace-only literal that is a token the source
holds, not inter-node whitespace the writer invents: a token seam merges
into the seam text around it like any other seam, but survives a render's
end where a plain seam is dropped. `literalBody`'s sole caller.

### `packages/codegen/src/emitters/render-body.ts::writesTokenSeam`

Whether a body writes `text` as a token seam anywhere, including inside
either arm of a conditional.

### `packages/codegen/src/emitters/render-body.ts::literalBody`

The one classification every render-body site with a literal grammar
string in hand shares: the depth arms' stamped identity (`isDepthText`)
becomes `INDENT`/`DEDENT`, a whitespace-only value becomes a `tokenSeam`,
and anything else is plain `text`. `emitRule`'s `STRING` case and
`emitSymbol`'s two literal-returning branches all call this instead of
each re-deriving the same three-way split.

```text
/// A literal value's one body: the depth arms' stamped identity becomes its
/// own depth node, a whitespace-only value becomes a token seam, and
/// anything else is plain text. The single classification every render-body
/// site with a literal grammar string in hand shares.
```

### `packages/codegen/src/emitters/render-body.ts::concat`

Flattens its inputs and merges adjacent literal text, so two bodies that
print the same compare equal node for node; every other node stays its own
node.

### `packages/codegen/src/emitters/render-body.ts::isPlainText`

Literal-only (text and seams): the shape `emitChoice` accepts as a choice's
literal fallback arm.

### `packages/codegen/src/emitters/render-body.ts::opensAsTag`

Which nodes are expressions or blocks rather than literal text: a slot,
structural whitespace, a gate, an indent block. `commonTrailingTail`
starts a hoisted tail at the first such node.

### `packages/codegen/src/emitters/render-body.ts::isExpression`

A body that opens and closes on an expression node (slot or structural
whitespace) — a separate write at render time, which is what decides
whether a glued seam needs the adjacency mark.

### `packages/codegen/src/emitters/render-body.ts::edgeChar`

The boundary character the seam classifier reads for a part: literal text
yields its own edge character, a spaced seam a space, and every expression
or tag node a brace. `classifySeqBoundary` treats a brace edge as "resolve
the edge from the rule" (`renderRuleEdge`); a literal brace in text takes
the same path, and the pinned templates depend on that.

### `packages/codegen/src/emitters/render-body.ts::equalNodes`

Structural equality of nodes and bodies; `commonTrailingTail` and the
literal-fallback ambiguity check in `emitChoice` compare with it.

### `packages/codegen/src/emitters/render-body.ts::refersTo`

Whether a slot reference by that name appears at any depth; gate tests do
not count.

### `packages/codegen/src/emitters/render-body.ts::mentions`

Whether the name appears as a slot reference, a gate test, or a whole word
of literal text at any depth — the slot-preservation gate's notion of "the
body references this slot".

### `packages/codegen/src/emitters/render-body.ts::weight`

The size of a body as the arm dedup orders arms by it: text by length,
every other construct by a fixed overhead (the constants are the spellings
of the template syntax the ordering was pinned under). `emitChoice` keeps
the heavier of two same-key blocks and the first on a tie, so this ordering
must stay what it has always been.

### `packages/codegen/src/emitters/render-body.ts::references`

The gate tests, the slot references and the seam sites of a body, each in
document order and at any depth; the render-module emitter derives a
kind's view fields from them and checks every seam is bound.

### `packages/codegen/src/emitters/render-body.ts::slotMultiplicity`

How many times each slot is referenced on one path through a body:
sequential references add, and the alternatives of one gate chain (its arms
and fallback) contribute the widest of their counts, since only one of them
renders.

### `packages/codegen/src/emitters/render-body.ts::duplicateSlots`

The slots a body references more than once on one path. A body that does
so renders the slot twice, which the writer cannot see (it only receives
two legitimate writes) and the validator only catches when the re-parse
fails; the template emitter refuses it at build time.

### `packages/codegen/src/emitters/render-body.ts::rustStringLiteral`

A Rust string literal for body text: quotes, backslashes, line breaks and
tabs escaped, and every control character and writer mark (U+FDD0 and up)
written as `\u{…}` so the marks never sit raw in generated source.

### `packages/codegen/src/emitters/render-body.ts::gateOptionalSlotSeams`

Moves the seams a slot owns inside its presence gate. The seam pass mints
`<slot>_before` and `<slot>_after` beside an optional slot's member, and the
template emits them as siblings of the slot's gate, so an absent slot still
wrote its sites and a declared `tight` on an absent `comma` outranked the
neighbour's space. A gate qualifies when it has one arm, no fallback and no
kinds test, and its body is exactly the slot the arm tests; the seam before
it and the seam after it are folded into the arm only when their fields are
that slot's own. Every other seam stays where it is. `TemplateEmitter` applies
it once to each kind's finished body, before the slot-preservation checks.
A slot's own seams are named by the slot and by the token it renders when
its only values are visible punctuation kinds (`seamNamesOf`, supplied by the
caller), so an optional `?.` reference folds `qmark_dot_before` and
`qmark_dot_after` into its presence gate and an absent chain marker leaves no
site behind.

### `packages/codegen/src/emitters/render-body.ts::WordSeamNode`

A seam whose payload is one space, written as a plain (non-token) seam: it
coalesces with its neighbours like a site's space arm and drops at the render's
edges, so a keyword that opens a standalone render gets no leading space.

### `packages/codegen/src/emitters/render-body.ts::WORD_SEAM`

The body holding one `WordSeamNode`; the Rust printer writes it as
`w.seam(" ")`.

### `packages/codegen/src/emitters/render-body.ts::gateKeywordSlotSeams`

A slot preference addresses the slot's punctuation values; keyword values
keep their word seam. For a slot whose values mix keywords and punctuation
(`keywordKindsOf` returns the keyword kinds, supplied by the caller), the
seam named `<slot>_after` right after the slot and the seam named
`<slot>_before` right before it become a kind gate: when the rendered value is
one of the keyword kinds the seam is `WORD_SEAM`, otherwise it is the slot's
own site. A tight preference on an operator slot that holds both `!` and
`typeof` renders `!x` tight while `typeof x` and `typeof (x)` keep their
space. A slot that is not mixed, and a seam not beside its slot, is left as it
is. `TemplateEmitter` applies it after `gateOptionalSlotSeams`, so a seam
already folded into an optional slot's gate is gated inside that arm.

### `packages/codegen/src/emitters/render-body.ts::liftGates`

Moves presence gates out of a body and onto the views. A gate that only
guards its own slot is dropped, since a view renders nothing when it is
missing. A gate whose arm is literal text around its own slot becomes that
slot with the text recorded as the slot's flanks, which `templateOf` spells
as the view's template: on an optional or list view the text is written
only when the slot is present; a required slot is always present, so its
flanks inline as body text. A gate over more than one slot, or a chain
with a fallback, stays a gate. Two different flank sets for one slot is an
error, since one view carries one template.

### `packages/codegen/src/emitters/render-body.ts::printRustBody`

Prints a lifted body as the statements of a kind's render function over
the sink `w`, with the slots already bound as locals by their field names.
A run of literal text is one `w.text(...)?;`; a slot is its own
`<local>.render(w)?;`; a seam is `w.site(node.<field>.unwrap_or(0));`
resolved straight from the transport field, with no local bound for it. An
`indent`/`dedent`/`tokenSeam` node is its own sink call (`w.indent()` plus
its seam payload, `w.dedent()`, `w.token_seam(...)`) — see
`printStatements`'s payload rule for how a following literal's leading
whitespace becomes that call's argument. A residual gate chain is an
`if … else if … else` block over the views' `is_present`.

A `seam` node that is the kind's own edge (the printer's `edge(name)`
answers its kind id and side) prints as `w.edge(KindId(N), Side::…,
node.layout.edges().<side>)`: the sink takes the node's stamp when it
carries one (arm and strength, from the site that set it: the kind's own
edge site or a list's seat), else the kind's edge row. Every
other seam prints as `w.site_at(<SITE const>)`: the transport carries no
field for it, and the sink reads the site's arm from its resolved options.
The printer's `site(name)` names the `options::SITE_*` constant from the
public kind name and the field, the same spelling `render-options-rs.ts`
emits.

### `packages/codegen/src/emitters/render-body.ts::printStatements`

The statement-by-statement printer `printRustBody` wraps. Runs of `text`/
`space` nodes coalesce into one `w.text(...)` call, flushed before any
sink-call node. The payload rule: when an `indent`, `dedent` or `tokenSeam`
node is immediately followed by a `text` node beginning with whitespace,
that leading run is split off and becomes the node's own payload — a
`w.seam(...)` call right after `w.indent()`/`w.dedent()`, or folded into a
`tokenSeam`'s own text — rather than ordinary literal text.

A `dedent`'s own `w.seam(...)` call is conditioned on `w.dedent()`'s return:
`if w.dedent() { w.seam(<run>); }` when a payload run follows, a bare
`w.dedent();` otherwise. `dedent()` returns whether the indent it closes
had text written — false cancels an empty body's payload along with its
own, so `{}` stays bare rather than gaining a stray blank line.

Inner trivia prints at its gap: before a `slot` the printer's `innerGap`
names, `trivia::render_inner(node.layout.trivia(), "<slot>", w)`. A
slot under a presence gate gets it before the `if` instead, since a node
holding inner trivia has no named child, so the gated slot is empty and its
arm never runs. `seatedGaps` carries the gaps already printed into nested
arms, so a gap prints once.

### `packages/codegen/src/emitters/render-body.ts::RustBodyPrinter.innerGap`

Whether a slot name is one of the node's inner-trivia gaps
(`AbstractAssembledCompound.innerGaps`), the keys the reader files ownerless
extras under (each transport's `gap(n) = key` attributes). `render-module.ts` supplies it
from the node the body renders.

### `packages/codegen/src/emitters/render-body.ts::escapeBraces`

Doubles `{` and `}` so literal text can sit in a view template
(`templateOf`), which `View`'s `write_literal` unescapes at render time.
`printRustBody`'s own literal runs are plain `w.text(...)` calls and need
no escaping — a literal brace is just a byte in the string.

### `packages/codegen/src/emitters/render-body.ts::templateOf`

A view template from a slot's flanks: the escaped prefix, `{}` for the
slot, the escaped suffix; `"{}"` when the slot has no flanks.

### `packages/codegen/src/emitters/shared.ts::unnamedChildSlotFacts`

```text
/**
 * Resolve the real multiplicity/requiredness/non-emptiness of a
 * container-shape branch's single unnamed child slot (`fields[0]`).
 *
 * @remarks
 * The single canonical source for these facts. `classifyFactoryShape`'s
 * 'direct'/'spread' label only says which calling convention applies — it
 * doesn't carry the shape's multiplicity/requiredness/non-emptiness, and
 * every call site that needs those (factories.ts, from.ts, test.ts) used to
 * re-derive them independently, which is how a hidden kind's required
 * singular unnamed slot (e.g. a polymorph's hoisted child, `_match_block`)
 * once got mislabeled 'spread' in one of those derivations despite its real
 * arity being singular. Read the facts from here instead of re-deriving them.
 *
 * Takes `fields` directly (not a full `AssembledNode`) since every call site
 * has already gated on container-shape-ness (typically via
 * `classifyChildFactorySurface(...) !== null`) before reaching for the slot
 * itself. Returns `null` when there's no field (not a container shape).
 */
```

### `packages/codegen/src/emitters/shared.ts::registeredSlots`

The slots of a node that take their value from the options argument instead of the config: the node's slots minus its `configSlots`. The options argument trails a direct value or a config and leads spread children (`leadingOptionsOf`). It inherits the model's inert-registration rule, so a compound whose every slot is registered keeps them all as config slots and has no registered slots here. Every consumer that asks whether a slot is registered (the factory surface, `from()`, the test emitter, `leadingOptionsOf` and the exported `FactorySlotMeta.registered`) reads it from this one function, never from the raw `registeredOption` stamp. A node with no `configSlots` falls back to the stamp.

### `packages/codegen/src/emitters/shared.ts::classifyFactoryShape`

```text
/**
 * The factory surface, read from the model's class: a fixed-text leaf with a
 * builder is `constant` (its build entry is its kind id, not a call), other
 * leaves are `text`, a
 * list is `elements`, a compound with a sole repeated slot is `spread`,
 * with a sole singular slot `direct` (or `forwarded` when that slot names
 * one kind with its own factory), anything else — two-plus slots, zero
 * slots, a hidden non-user-facing kind — is `config`. A hoisted form is
 * `direct`/`forwarded`/`config` by the same sole-slot test.
 */
```

Hoisting does not enter the shape: a hoisted compound with a multiple sole
slot is `spread` like any other (rust's token trees, typescript's string
forms, python's `_except_clause_list` and `_match_block_block`). The seat the
overlay derives from that shape is the kind's own builder passed through
the parent's.

Registered slots do not enter the shape either: a sole repeated slot is
`spread` whether or not the node has registered slots. Since a rest
parameter must come last, those slots' options argument leads the children
(`leadingOptionsOf`), as a list's options do, so there is one rule for where
options go: after a direct value or a config, before spread items.

### `packages/codegen/src/emitters/shared.ts::LeadingOptions`

The options argument a spread builder takes before its children: the
emitted options type, the config keys a leading object may carry (the
`_optsFirst` test admits an object only when every key is one of them), and
the storage keys those slots are held under on a built node, in the same
order.

### `packages/codegen/src/emitters/shared.ts::leadingOptionsOf`

The leading options of a `spread` builder whose node has registered slots;
undefined for any other node. The factory surface, the `from()` coercer, the
test emitter and the argument rows all read it here, so whether a builder
takes leading options is one fact.

### `packages/codegen/src/emitters/boxed-payloads.ts::PAYLOAD_CEILING_BYTES`

The payload ceiling: a choice the reader reads holds every payload larger than this boxed (`BOXED_PAYLOADS`), so a choice is no larger than the ceiling plus its tag. It is the largest of 512, 256 and 128 bytes at which, in both profiles, the typed read needs no more stack than today's read at 200 nested levels and per level (`typed_read_nesting.rs`); it is 256. The typed read's fixed root cost stays above today's at every ceiling, so a shallow source needs more stack than today's; that cost is reported, not gated.

### `packages/codegen/src/emitters/boxed-payloads.ts::BOXED_PAYLOADS`

Per grammar, the transport types a choice holds boxed: every payload type over `PAYLOAD_CEILING_BYTES`. The lists are measured, not chosen, and read once, by `grammarRenderInputs`: `size-census.py --pins <ceiling>` (in the shared-arena stack probes) prints them and says whether this file holds them. The build refuses a list that is wrong either way: the generated assertions (`payloadCeilingAssertions`) fail on an unpinned payload over the ceiling and a pinned one within it, and the printer refuses a pin no choice holds. A payload's size depends only on what it holds by value, and a cycle through a choice is already boxed at the field that closes it, so pinning settles from the leaves up in a few rounds.

### `packages/codegen/src/emitters/bundle-hash.ts::computeBundleHash`

A stable SHA-256 hex digest over a set of named files, sorted by name with
line endings normalized; the render-module hash is this digest over the
generated `transport.rs` and `options.rs`.

### `packages/codegen/src/emitters/bundle-hash.ts::BundleFile`

One named file in a bundle: the name frames the entry (the same content
under two names hashes differently) and the content is hashed after
CRLF → LF normalization.

### `packages/codegen/src/emitters/templates.ts::EmittedTemplates`

`bodies` is the render body per kind (empty for a kind whose model type
emits nothing); it is written to `packages/<grammar>/.sittir/render-bodies.json`,
the validators' catalog of renderable kinds. `seamCensus` tallies the
static/runtime seam resolutions of the walk.

### `packages/codegen/src/emitters/templates.ts::EmitTemplatesConfig`

`renderRules` are the spaced render rules (`spaceRenderRules`): the walk
reads a kind's body from `renderRules.rules[kind]` and a hidden helper from
the same table, never from `node.renderRule`, so the injected whitespace
choices are in front of the walk. A run without them (a unit fixture, a
diagnostic probe) falls back to the normalized rules, which are the same
rules before injection.

`kindEntries` are the generated kind entries the merge-pair inventory is gated on (`literalMergePairs`); a run without them (a unit fixture) has no merge pairs, which is what the fixtures that stub `isLiteralMergePair` expect.

### `packages/codegen/src/emitters/templates.ts::separatorTokenOf`

The separator token the walk classifies and stringifies: for a spaced
separator (`spacedSeparatorOf`) the token between the two whitespace
choices, and nothing for the gap choice of an unseparated repeat, so the
seam census and `emitListSlot` see exactly the separator the grammar wrote.

### `packages/codegen/src/emitters/templates.ts::stampStaticSpacing`

A template-emission dry run over the node map before the emitters
dispatch, so every `staticSeamBefore` stamp on the spaced rules is written
before any other emitter reads them; `emitAll` runs it right after it
builds the spaced rules, since the stamps land on those rules.

### `packages/codegen/src/emitters/templates.ts::stringifyRule`

```text
/**
 * Statically render a rule to its fixed literal text — only meaningful for
 * a rule classified `terminal` by Table 1 (`isNonterminalRuleType`,
 * rule-catalog.ts): every reachable descendant is compile-time-known text,
 * so there's nothing to capture at read-time. Callers gate on that
 * classification (e.g. `separatorToString` below); this function mirrors
 * Table 1's own recursive structure for the shapes actually reachable in a
 * `RenderRule` (GROUP survives wrapper-deletion; TOKEN is preserved
 * by the mechanism but excluded from `RenderRule`'s type — see
 * `RenderRule`'s doc comment — so it falls to `default` like any other
 * unreachable/nonterminal shape).
 */
```

### `packages/codegen/src/emitters/templates.ts::lookupSlot`

```text
/**
 * Look up an `AssembledNonterminal` for a rule from two sources:
 *
 * 1. `slotByRuleId` — registered during assembly via `slot.sourceRuleIds`.
 *    Fast O(1) lookup. Fails when `simplifyRule` creates new rule objects
 *    without preserving the original ID, or when the FieldRule ID doesn't
 *    match the renderRule's symbol ID.
 *
 * 2. `ctx.ownerSlots` fallback — keyed by `storageName` (which equals
 *    `rule.fieldName.toLowerCase()` for named fields). Used when the
 *    slotByRuleId lookup fails. Safe because `storageName` is unique within
 *    a node's slot set.
 *
 * Returns `undefined` when neither source finds a slot (test fixtures,
 * transient sub-rules without a registered slot).
 */
```

```text
// ---------------------------------------------------------------------------
// Slot emission helpers
// ---------------------------------------------------------------------------
```

#### body

```text
// Primary: slotByRuleId (by registered rule ID)
```

#### body

```text
// PRIMARY MISSED (no id, or id not registered — the rule-ID-not-preserved
// gap). Try the name-based fallbacks and record the miss for the diagnostic.
```

#### body

```text
// Fallback A: fieldName → storageName. For grammar-named fields whose
// FieldRule ID doesn't match the renderRule symbol's ID (because
// simplifyRule created new objects without preserving the original ID),
// look up the slot by the field name the symbol carries.
```

#### body

```text
// Fallback B: symbol name (exact, no underscore-stripping) → storageName.
// For inferred slots derived from tree-sitter's node-types.json children,
// the slot's storageName equals the dominant choice-arm kind name. When
// a symbol in the renderRule has the same name as the slot's storageName,
// map it. Only fires for symbols without fieldName (fieldName symbols are
// handled by Fallback A). Uses the EXACT name (no leading-_ stripping) to
// avoid false positives where `_hidden_rule` would match slot `hidden_rule`.
```

#### body

```text
// Fallback C: alias source → storageName. A singular `alias($._hidden,
// $.visible)` reference survives wrapper-deletion as
// `SYMBOL(name:'_hidden', aliasedTo:'visible')` with no id (rebuilt, not
// preserved), so slotByRuleId, Fallback A (no fieldName), and Fallback B
// (gated to non-`_`-prefixed names, so it never even attempts an aliased
// symbol) all miss. `.name` already IS the hidden target — the guard is
// `aliasedTo !== undefined` (this occurrence is aliased at all), then
// join on `rule.name` (underscore-stripped) instead of the alias's
// display name.
```

### `packages/codegen/src/emitters/templates.ts::separatorToString`

```text
/**
 * Project a rule's separator metadata onto a primitive `string`. The shared
 * `RuleBase.separator` is the nested `{value, trailing?, leading?}` fact;
 * the rendering layer only needs the primitive textual separator. Gates on
 * Table 1 (`isNonterminalRuleType`) rather than a bare `StringRule` check —
 * ANY terminal-classified shape (a plain literal, a sequence of literals, a
 * group/variant wrapping one) has fixed, compile-time-known text and can be
 * embedded directly via `stringifyRule`. A genuinely nonterminal shape
 * (choice/repeat/symbol/pattern) has no fixed text — returns `undefined`
 * (NOT `stringifyRule`'s `''`) so the caller falls back to the slot's
 * per-value separator / `DEFAULT_JOIN_SEPARATOR` instead of silently
 * treating "unknown" as "empty" (the previous behavior: a choice-shaped
 * separator like `choice(',', ';')` would render with NO separator
 * character at all, since `''` short-circuits the `??` fallback chain in
 * `emitListSlot` just as effectively as a real value).
 * `isNonterminalRuleType` is typed over `Rule<'evaluate'>` but classifies
 * purely by `.type` + child shape — phase-agnostic in practice, the same
 * cast pattern the wrapper-deletion emitters use.
 */
```

### `packages/codegen/src/emitters/templates.ts::isNonterminalSeparatorRule`

```text
/**
 * True when `rule` carries a genuinely nonterminal separator (Table 1,
 * `isNonterminalRuleType`) — i.e. `separatorToString` returned `undefined`
 * NOT because there's no separator at all, but because the separator's
 * text isn't compile-time-known (a `choice(',', ';')`-shaped separator has
 * no single fixed literal). Distinguishes the two `undefined` cases so
 * `emitListSlot` can reference the transport struct's own runtime-resolved
 * `.separator` field (populated by render-module.ts's
 * `buildSeparatorKindMatchLines` from the wire-captured `_separator_kind`)
 * instead of silently falling through to `DEFAULT_JOIN_SEPARATOR`.
 */
```

### `packages/codegen/src/emitters/templates.ts::emitScalarSlot`

```text
/**
 * A scalar slot is a slot reference by its RAW (snake_case, singular) name
 * lowercased.
 */
```

### `packages/codegen/src/emitters/templates.ts::emitSlotReference`

```text
/**
 * Emit a slot reference from its registered back-pointer slot — the single
 * shared path for symbol, choice, and field-wrapped slots
 * (feedback_ruleid_backpointer). Identity and multiplicity come FROM THE SLOT
 * (its `storageName` is the render-struct field key), never re-derived per
 * call site from `rule.name` / `rule.fieldName`. The leaf `rule.multiplicity`
 * is honoured as a fallback for the case where wrapper push-down stamped the
 * leaf but slot derivation under-counted (the prior emitSymbol "Bug 5" path).
 */
```

#### body

```text
// See EmitCtx.emittedSlotNames' doc comment: multiple grammar-tree
// positions (possibly straddling a SEQ/CHOICE boundary) can resolve to
// this SAME merged slot — emit the reference only once per kind.
```

### `packages/codegen/src/emitters/templates.ts::emitFieldNameSlot`

```text
/**
 * Fallback slot emission keyed on a field name + the leaf `rule.multiplicity`,
 * for a field-wrapped rule that has NO registered back-pointer slot (rare —
 * e.g. a flatten-stamped fieldName whose rule id / fieldName didn't
 * resolve in `lookupSlot`). Prefer `emitSlotReference` whenever a slot exists.
 */
```

#### body

```text
// Same merged-slot guard as emitSlotReference (one storage key, one
// reference per kind — see EmitCtx.emittedSlotNames).
```

### `packages/codegen/src/emitters/templates.ts::emitSymbol`

```text
/**
 * Derive the body for a symbol ref, driven by the leaf attributes set by
 * the enrich / push-down pass (fieldName, multiplicity, separator). In
 * RenderRule input the wrapper rule types (field / optional / repeat /
 * repeat1) are absent; their slot facts live here instead.
 *
 * Multiplicity mapping:
 *  - 'array' | 'nonEmptyArray' → the list slot reference (the view joins)
 *  - 'optional'               → the slot reference gated on its presence
 *  - undefined (required)     → the bare slot reference
 *
 * A hidden kind with fixed text renders that text; when the text is
 * nothing but whitespace it is a `tokenSeam` node instead, so the sink
 * coalesces it with the seams around it (`w.token_seam` never drops, unlike
 * `w.seam`) rather than writing it as literal text: a newline terminator
 * such as an automatic semicolon is absorbed by the newline gap after its
 * statement and outranked by a blank-line gap, rather than stacking a
 * second break on top of either. The depth arms' own stamped text
 * (`isDepthText`) is neither: it becomes the `indent`/`dedent` node itself,
 * the payload rule's job in `printStatements`.
 */
```

### `packages/codegen/src/emitters/templates.ts::joinStaticSeam`

The one place a statically resolved seam becomes body nodes. Spaced: a
`space` node — the writer then sees a whitespace flank and has nothing to
decide — unless the boundary carries token seam nodes, which then stand in
for the space (their default arm is `space` there, so the bytes hold).
Glued: a gap that carries seam nodes (a declared site) gets only those, the
site's valid set being the gap's one seam. Glued with none: when the next
segment is an expression (a separate write at render time), a tight join
(`seam(TIGHT)`) right before it, so no seam space and no word-collision space
falls before the text that follows; a glued literal-to-literal seam needs
nothing, because both literals are one write and the writer only checks
between writes. The join rides in the stream, so its position is the write
order regardless of how the printer orders its expression evaluation.

### `packages/codegen/src/emitters/templates.ts::pickConditionalKey`

```text
/**
 * Pick a Jinja conditional predicate name for a clause whose body emits a
 * slot. In RenderRule (wrapper-free) input, field wrappers no longer exist —
 * field metadata lives as `fieldName` on the leaf. Check leaf attributes
 * first, then transparent wrappers, then symbol/seq fallbacks.
 */
```

#### body

```text
// PR2 Task 3.B3: field wrappers no longer appear in RenderRule. Check
// the leaf-level fieldName attribute instead (pushed down from FieldRule
// by the enrich / push-down pass).
```

#### body

```text
// A fieldName no actual slot carries cannot gate anything — its
// `| isPresent` is never true. This happens when an override fields
// an optional GROUP REF (`field('constraint', optional(_helper))`)
// whose splice stamps the name on the seq node while the slot takes
// its name from the field INSIDE the helper (infer_type: gate said
// `constraint`, slot is `type`). Fall through to the structural
// search so the gate lands on a real slot; without ownerSlots
// (unit-test contexts) keep the historical name-trusting behavior.
```

#### body

```text
// Transparent wrappers — recurse. FIELD/TOKEN/ALIAS are WrapperPhase-only
// (types/rule.ts) and never survive into RenderRule — flattenRules
// has already pushed their facts (fieldName / aliasedTo+aliasedToId) onto
// leaf attributes or unwrapped them to content, so those cases are
// unreachable here and are not switch arms.
// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from RenderRule union.
```

#### body

```text
// A seq with a member that has a field name — use that field. Prefer a
// UNIT-MANDATORY member (no own optional/array stamp): the unit occurs
// exactly when that slot is present, so it is a sound `| isPresent`
// gate. An optional-within-unit member can be absent while the unit
// still renders (index_signature's `sign` before its mandatory
// `readonly` marker), so gating on it drops the unit's mandatory
// content; it survives only as the fallback when every keyed member is
// optional.
```

#### body

```text
// A choice whose branches carry field names — gate on the first branch
// that yields a key (mirrors the seq-member loop above). Without this,
// a group body of `choice([field('name', …), …])` falls through to the
// caller's `<rule>_optional1` fallback and gates on an unpopulated
// inlined-group slot instead of the populated field.
```

#### body

```text
// A symbol with a slot back-pointer — gate on its kind slot name.
```

A seam choice (`isSeamChoice`) is never a conditional key: it names a
whitespace site, not a slot, so an optional seq holding one gates on its
real slot.

### `packages/codegen/src/emitters/templates.ts::scanArmBody`

```text
/**
 * Scan an emitted arm body for `emitChoice`'s union-routed path — the body is
 * the single authority on what the arm references (name- or id-based
 * partitioning of the render-tree arm is unreliable across choice rebuilds).
 *
 * `key` — the arm's discriminating slot: the first slot reference at
 * gate-nesting depth 0 (an ungated reference is REQUIRED within the arm, so its
 * presence discriminates it — e.g. arrow_function's signature arm gates on
 * `parameters`, never on its leading OPTIONAL `type_parameters` block), else
 * the first gated reference.
 *
 * `needsGate` — whether the body has ANY depth-0 reference or literal
 * content (non-blank text, structural whitespace, the adjacency mark). A body that is entirely self-gated blocks (e.g.
 * range_pattern's `{% if left %}…{% endif %}{% if content %}…{% endif %}`
 * arm) must NOT get an outer gate: nothing in it can leak, and wrapping it
 * on one of its optional refs would suppress the other forms.
 */
```

### `packages/codegen/src/emitters/templates.ts::assertNoDuplicateSlots`

The complement of `assertSlotPreservation`: a kind's body may reference a
slot at most once on any one path. A seam node inside a choice's arms once
defeated the collapse of modifier-ordering arms into one gate per marker
and rendered `readonly` twice; this turns that class of defect into a
build error naming the kind and the slots.

### `packages/codegen/src/emitters/templates.ts::assertSlotPreservation`

```text
/**
 * Verify each declared slot for `node` appears at least once in `body`.
 * Throws on missing slots — the gate that ensures the emitter's structural
 * rewrite didn't drop a slot reference. This is a structural check, not a
 * byte-equivalence one: the emitter is free to choose its own Jinja
 * formatting as long as every slot is referenced somewhere in the output.
 *
 * A slot counts as referenced when `mentions` finds its `storageName`
 * (snake_case, what the emitter writes into the body) as a slot reference,
 * a gate test, or a whole word of literal text.
 *
 * Set SITTIR_SLOT_PRESERVATION=0 to bypass for survey / iteration mode.
 *
 * Skips terminal-only slots (all values are literal terminals with no
 * node-refs) — these are deterministic-value tokens emitted as literals, not
 * as named slot references (e.g. `opening`/`closing` enum-delimiter slots).
 */
```

A slot whose every value is a declared whitespace token that the body
writes as a token seam also counts as preserved
(`rendersAsDeclaredTokenSeam`): the seam writes the slot's only possible
text, so there is nothing to reference.

### `packages/codegen/src/emitters/templates.ts::rendersAsDeclaredTokenSeam`

Whether a slot value is a kind declared in the grammar's `visibleExternals`
(the catalog `visibleExternal` stamp), is a fixed-text leaf, and the body
writes its text as a token seam (`writesTokenSeam`). python `suite_empty`'s
`_newline` slot is the case: the body writes the newline behind the token
mark instead of referencing the slot.

#### body

```text
// Skip terminal-only slots — values are all literals (no node-refs).
// The template emits their literal text, not a slot-name reference.
```

#### body

```text
// Unnamed slots ARE checked (union-slot design PR 1, tightening the
// KNOWN_ISSUES fallback-B gate hole): a REQUIRED positional slot whose
// name and kinds never appear in the body is a dropped choice arm, and
// must fail loudly at emit. The former blanket `isUnnamed` skip cited
// `_semicolon`-style literal slots (terminal-only → still skipped
// above), and hidden-helper choice arms (cross-arm relaxed to optional
// → still skipped below); both documented false-positive classes
// remain covered by the structural skips.
// (debt PR-P1, item 4) REMOVED a former provenance-reading skip here:
// `(slot.source as string) === 'link' || 'group-lift'`. Per the
// doctrine, a compiler decision may not key on rule/slot provenance —
// this had to become either a structural check or a proven-redundant
// deletion. Verified EMPIRICALLY (not just by static reasoning) before
// deleting: generated `node-model.json5` for all three grammars at the
// pre-PR-P1 baseline (rust/typescript/python) has exactly ONE slot
// anywhere with `source: 'link'` or `'group-lift'` — typescript's
// `binary_expression.operator` (the exact case this comment used to
// cite) — and its `values[]` are ALL terminals (zero node-refs), i.e.
// `kindsOf(slot).length === 0`, which is ALREADY skipped by the check
// directly above. So the condition never once changed this function's
// outcome on any of the three grammars: it is provably redundant, not
// merely theoretically so. Deleting it is a genuine dead-condition
// removal — there is no structural fact to convert it to because it
// never selected anything the prior check hadn't already excluded.
// (Root cause: link-synthesized operator literals become terminal
// `.value` entries with no node-ref, per `deriveValuesForRule`'s
// SYMBOL case in node-map.ts — `kindsOf` is the exact structural
// signal this check was informally approximating via provenance.)
// Skip slots where no value is required (all are optional/array). These
// arise from `mergeChoiceArmSlots` cross-arm relaxation: a slot present
// in only some choice arms gets its values' multiplicities relaxed from
// 'single' → 'optional'. Such slots may legitimately not appear in the
// emitted body when the emitter takes the other arm. Checking them would
// produce false positives for mutually exclusive choice alternatives.
// Note: this also skips genuinely-declared optional slots, but those
// are less likely to be completely dropped (the gate prioritizes catching
// missing required slots over missing optional-slot guards).
```

#### body

```text
// Skip slots where every referenced kind already appears in the body
// under its own name. This handles the `isSyntheticFieldWrapper` case:
// when flatten on `field('constraint', optional(seq('extends',
// field('type', _type))))` produces a slot named 'constraint' with a
// single node-ref value of kind 'type', but the body correctly emits
// `{% if type | isPresent %}...{{ type }}...` — the inner 'type' field
// is rendered directly without naming the outer 'constraint' slot.
// This is a legitimate inlining pattern where the outer container slot
// delegates rendering entirely to its inner named slot.
```

#### body

```text
// Skip unnamed slots whose every referenced kind is HIDDEN (leading
// underscore): hidden refs are inline-expanded per the per-ref inline
// convention (inline = hidden && !aliased), so the body contains their
// EXPANSION, never their name — a textual check cannot see them (e.g.
// python dictionary_comprehension's `_comprehension_clauses` slot,
// rendered as `{{ for_in_clause }} {{ content | join(" ") }}`). Named
// slots never take this path — a fielded ref emits by field name even
// when hidden.
```

#### body

```text
// Use storageName (raw snake_case grammar field name) — this is what
// the emitter writes into templates, matching `rule.fieldName.toLowerCase()`.
```

#### body

```text
// Include slot details for debugging
```

### `packages/codegen/src/emitters/templates.ts::runTemplateEmitter`

```text
/**
 * Run TemplateEmitter over an entire NodeMap. Convenience wrapper around
 * the per-modelType dispatch in emit.ts so test fixtures and diagnostic
 * tools don't have to duplicate the loop.
 *
 * Dispatches each node by its modelType, calling the appropriate per-type
 * emitter method (emitLeaf, emitBranch, emitGroup), and
 * applies the skip-emit gate via classifyTemplateEmission.
 *
 * @param config Grammar, NodeMap, and optional grammar SHA
 * @returns EmittedTemplates with bodies keyed by kind
 */
```

#### body

```text
// Skip-emit gate: if this node doesn't need a template, skip entirely
```

#### body

```text
// Dispatch by modelType — mirrors production emit.ts:183-218
```

#### body

```text
// These modelTypes don't emit templates; classifyTemplateEmission
// should have already skipped them, so this is a safety fallback.
```

#### body

```text
// 'list' shares 'branch's template emission —
// see isSlotBearingCompound's doc comment (shared.ts).
```

### `packages/codegen/src/emitters/test.ts::testTypeDiscriminant`

```text
/**
 * Returns the expected-value expression for a `toBe($type)` assertion.
 *
 * @remarks
 * When kindEntries is present (KindID pipeline), emits `TSKindId.X`. When
 * absent (legacy / unit-test path), falls back to `'<kind>'` string literal.
 *
 * @param kind - The grammar kind string.
 * @param kindEntries - Collected kind-enum entries, or `undefined` for fallback.
 * @param nodeMap - The assembled node map.
 * @returns Expression string suitable for `expect(node.$type).toBe(<expr>)`.
 */
```

### `packages/codegen/src/emitters/test.ts::emitBranchTest`

```text
/**
 * Emit a branch test — dispatches to the container calling convention
 * (positional element args) when `classifyChildFactorySurface` recognizes
 * an unnamed child slot, otherwise falls through to the regular
 * field-carrying config-object test below. Single entry point so
 * `emitTests`' dispatch loop doesn't have to know about the two shapes.
 */
```

#### body

```text
// Render test. Two variants depending on whether the minimal config
// produces renderable content:
//
// - If renderConfig has any injected content (required fields,
//   required children, or a dummy child for kinds with a children
//   slot), the render output is expected to be non-empty.
//
// - If renderConfig is `{}` (no required content and no children
//   slot — kinds whose fields are ALL optional, like self_parameter
//   or field_pattern_shorthand), rendering with no input legitimately
//   produces an empty string. We still invoke render() to catch
//   template-walker crashes, but don't assert non-empty — the empty
//   output is the correct behavior.
```

### `packages/codegen/src/emitters/test.ts::emitSubFactoryTests`

One generated test per wired sub-factory, driven by `collectPolymorphWires` — the same derivation the overlay emits from, so tests exist exactly for wires that exist. Call arguments come from the dummy machinery, following the wire shapes (positional seat, residual config, merged config, seated tuple; list children lead with an options object when their surface takes one). `expectTestFailures["<kind>.<name>"]` skips a case and loosens its call target so a pinned, unwired name never type-errors. Alias wires get a form case each — the hoisted call with the child's bare-call arguments, asserting the child's discriminant (the form is its own node kind, not the parent's) — skipped when the dummy machinery cannot produce arguments for the child. A keyword or punctuation child is built as its kind-id value, not a node (as `emitKeywordTest` asserts for the kind itself), so its form case asserts the returned value is that kind id.

A case whose seated slot is a list owner's list slot asserts the slot reads back non-empty items, not a node: the accessor of that slot hoists the list away, so there is no child node whose discriminant could be checked.

A kind's tests are addressed through its public spelling (`subFactoryBase`): its flat `ir` key when it is bundled (sub-factories are callable), or its flattened-parent route (`variantRoutePaths`) called through `.coerce`, the loose flavor that accepts the prebuilt nodes the dummy machinery passes. A kind with neither has no public path, and no sub-factory tests are emitted for it.

#### body

```text
// A registered slot other than this arm's own key has no home in the
// sub-factory's call arguments — some composer shapes (e.g. a bare
// rest-args forward to the child) can't structurally accept a trailing
// options argument at all. `.$with.<key>(...)` rebuilds through the
// same options closure regardless of composer shape, so it is the one
// mechanism that works uniformly here.
```

#### body

```text
// The alias constructs `child` (a wrapper kind of its own, e.g.
// class_body_member), not `node` — its required registered slots are
// its own, unrelated to `node`'s.
```

### `packages/codegen/src/emitters/test.ts::subFactoryBase`

The spelling generated sub-factory tests address a kind by, with the call
flavor that spelling needs: the flat `ir` key (callable) for a bundled kind,
the flattened-parent route plus `.coerce` for a variant reached only through
its parent, or `undefined` when the kind has no public path.

### `packages/codegen/src/emitters/test.ts::emitSeparatedListTest`

```text
/**
 * SeparatedList factories (`emitSeparatedListFactory`, factories.ts) take a
 * positional `elements` array — never a config object — so this mirrors that
 * function's own derivation of the content slot ({@link
 * buildSeparatedListContentSlot}) rather than routing through
 * `emitBranchTest`'s field-config-object shape. Builds a dummy for ONE
 * element via `dummyValueForField` and wraps it in an array literal here,
 * rather than delegating to `dummyValue` — `dummyValue`'s keyword-presence
 * fast path returns a bare scalar (`true` / `0 as never`) for the WHOLE
 * field before checking multiplicity, which is correct for a genuine
 * Config-object field but wrong for this synthetic elements slot (every
 * separatedList factory requires a real array, even when its content is
 * keyword/literal-shaped). This both satisfies `nonEmpty` lists'
 * `_assertNonEmpty` runtime check and guarantees non-empty render output —
 * so no separate empty-config render-test branch is needed here (unlike
 * `emitBranchTest`, which must accommodate an all-optional minimal config).
 */
```

#### body

```text
// `ir.<key>` resolves to the coerceTo* resolver (see emitRestParamFromResolver,
// from.ts), whose signature is `...input: readonly T[]` — rest params, not a
// single array param like the underlying factory. Spread the elements here or
// TS sees a lone `T[]` argument failing to match the first rest slot's `T`.
```



### `packages/codegen/src/emitters/test.ts::subFactoryChildrenArgs`

The child arguments a sub-factory test passes when the child is built from
its children: a stub for the sole slot's first kind, one element even when
the slot's repeat may be empty, so the built parent renders non-empty text.
### `packages/codegen/src/emitters/test.ts::pickSampleForPattern`

```text
/**
 * Pick a sample string that satisfies a tree-sitter leaf pattern.
 * Tries a handful of common shapes, returning the first that matches
 * (anchored full-string). When `pattern` is undefined the leaf accepts
 * arbitrary text and `'test'` is fine. Returns `null` when no
 * candidate matches and the test should be skipped.
 */
```

#### body

```text
// Common candidates ordered loosely from "most likely to match
// an identifier-ish leaf" to "specific token shapes".
```

### `packages/codegen/src/emitters/test.ts::resolveConcreteKind`

The chooser also takes `onPath`: the kinds already on the stub being built (the sole slot's owner, and every compound above the current field). A non-leaf candidate off that path wins over one on it. A stub stamped with the owner's own kind is node data of the target kind, which the coercer's identity rule hands back unbuilt, so the placeholder would never render. A self-recursive arm is chosen only when every non-leaf candidate is on the path and no enum leaf exists.

Among the off-path candidates the first whose stub closes (`stubCloses`) wins, so a slot whose first arm leads back into the path (python `case_pattern`'s `case_as_pattern`, which requires a `case_pattern`) takes a later arm that terminates (the `_simple_pattern` envelope). A surface-hidden kind is a candidate only when it still gets a factory (`classifyFactoryEmission`): an envelope over aliased hidden storage is a node in the tree.

```text
/**
 * Resolve a slot's candidate kind names to the first one reachable that has
 * a plain leaf/keyword/enum/token shape (safe as a `$text`-only stub),
 * expanding supertypes recursively. Falls back to the first concrete
 * candidate (leaf or not) when no leaf-shaped descendant exists anywhere in
 * `candidates`.
 *
 * @remarks
 * PR (gen-tests-native-backend): this used to fall back to a
 * grammar-global "safe leaf" (`identifier`) whenever no leaf was found
 * among a *single* starting kind's supertype expansion. That is unsound:
 * `identifier` is frequently not a member of the target field's transport
 * slot at all (e.g. a `MatchPatternTransport` field, or a
 * `UnaryExpressionOperatorEnum` field), so native's strict transport
 * `FromNapiValue` rejects it ("unknown kind id 1 in ..."). The native JS
 * render engine tolerated this because it does not validate structural/enum
 * conformance — only the native transport layer does — so the bug was
 * invisible under `SITTIR_BACKEND=js`.
 *
 * The fix: only resolve *within* the field's own candidate kinds (plus
 * their supertype expansions), never substitute an unrelated kind from
 * elsewhere in the grammar. When every candidate is itself a branch
 * requiring nested structure, the caller ({@link buildDummyStub}) descends
 * into it recursively instead of stubbing it as a flat leaf.
 *
 * @param candidates - Kind names offered by the field (a supertype expands
 *   to multiple; a concrete kind is a single-element list).
 * @param nodeMap - Assembled node map for supertype/kind lookup.
 * @param kindEntries - Parser-symbol catalog; when provided, skips kinds
 *   that lack a parser symbol.
 * @returns A concrete kind name — prefers a leaf-shaped one, else the first
 *   concrete candidate found, else the first raw candidate.
 */
```

#### body

```text
// Supertypes: expand to subtypes.
```

#### body

```text
// TSGrammar-only: skip when kindEntries present and this kind has no parser symbol.
```

#### body

```text
// Prefer text-only-compatible kinds — safe as `$text`-only stubs.
```

#### body

```text
// No leaf-shaped candidate anywhere in the field's own kind set: use the
// first concrete (branch-shaped) candidate — the caller will recurse
// into it — or fall back to the raw input when nothing resolved at all
// (e.g. an entirely TSGrammar-only candidate set).
```

### `packages/codegen/src/emitters/test.ts::stubCloses`

Whether a dummy stub of `kind` can be built without re-entering `blocked` (the kinds on the stub's path) within `budget` levels: a supertype when some subtype closes, a leaf always, a compound or list when every required slot needs no stub or has a candidate that closes one level down with `kind` added to the path.

### `packages/codegen/src/emitters/test.ts::stubKindsOf`

The kinds a field's dummy must build a stub from: none when `dummyValueForField` fills it without one (a pattern sample, a text enum, a boolean, a bitflag or a kind enum), otherwise its `slotKindNames`. `dummyValueForField` and `stubCloses` both read it.

### `packages/codegen/src/emitters/test.ts::dummyValueForField`

```text
/**
 * Build a dummy expression for a single dummy value of the given field, for
 * use inside a larger stub literal (config-object value or array element).
 *
 * @remarks
 * Dispatches on the field's actual storage classification
 * ({@link resolveFieldStorageInfo}) before falling back to node-ref
 * resolution:
 *  - `boolean` / `bitflag` / `kindEnum` fields are terminal *text* fields at
 *    the factory Config surface (coerced via `coerceKindEnumStorage` et al.)
 *    — the dummy is the bare literal text, never a `{ $type, $text }` stub.
 *  - Node-ref fields resolve to a concrete kind within the field's own
 *    candidate set ({@link resolveConcreteKind}) and, when that kind is
 *    branch-shaped, recurse via {@link buildDummyStub} to satisfy its own
 *    required fields instead of emitting an under-structured leaf stub.
 */
```

#### body

```text
// `boolean` / `bitflag` / `kindEnum` bare-literal shortcuts are only valid
// at depth 0 (the top-level Config object passed to `ir.<kind>(...)`) —
// the FACTORY's `coerceBooleanKeywordStorage` / `coerceBitflagStorage` /
// `coerceKindEnumStorage` calls are what turn those literals into the
// numeric/transport shape the native wire expects. At depth > 0 we are
// splicing a RAW object literal directly (see {@link buildDummyStub}) —
// there is no factory call to do that coercion, so a bare string/`0`
// reaches native's `AnyTransport::from_napi_value` as-is and is rejected
// ("expected u16 kind_id or object with $type"). Emit the pre-coerced
// numeric discriminant instead in that position.
```

### `packages/codegen/src/emitters/test.ts::buildDummyStub`

```text
/**
 * Build a complete dummy stub literal for `kind`, recursing into required
 * fields whenever `kind` is `instanceof AbstractAssembledCompound` (branch,
 * envelope, polymorph, or list alike — no separate case for a hoisted kind).
 *
 * @remarks
 * Leaf/keyword/enum/token kinds are safe as flat `{ $type, $text, $source,
 * $named }` stubs (this is what native's transport `FromNapiValue` expects
 * for those shapes). Compound kinds additionally require every required
 * field to be present and correctly shaped — a flat stub is rejected with
 * "Missing field `_x`" by the native transport. A hoisted kind (the
 * synthesized single-field wrapper kinds, e.g. `_match_arm_with_comma`) is
 * just an ordinary compound with `enrichment.hoisted` set — structurally a
 * one-field record like any other branch, its slots reachable via
 * `.slots` the same way. This function fills required fields
 * recursively for every compound shape, bounded by {@link MAX_DUMMY_DEPTH}
 * and a per-branch `visiting` set (cycle guard for self-referential
 * grammars).
 *
 * Every list slot the stub does not populate is `[]`, at the depth limit
 * too: an empty list is `[]`, and the transport refuses a missing list key.
 *
 * When recursion bottoms out (depth limit or cycle) the stub still declares
 * `$type`/`$text`/`$source`/`$named` but omits nested required single fields —
 * this may still fail construction for pathological kinds, matching the
 * existing "skip when no safe sample found" precedent elsewhere in this
 * emitter (see {@link pickSampleForPattern}) rather than guessing further.
 */
```

#### body

```text
// Canonical-hidden architecture (Option Y): an alias-promoted kind's own
// fields live on the pre-promotion hidden node (`_<kind>`), not on a
// separate model entry under the visible name — same fallback
// `template-coverage.ts::validateTemplateCoverage` uses for the same
// reason.
```

#### body

```text
// 'list' participates in this scan uniformly alongside
// 'branch'/'envelope'/'polymorph' — see isSlotBearingCompound's doc
// comment (shared.ts).
```

#### body

```text
// Nested stubs are raw object literals passed directly as
// `UntypedNode` — NOT routed through the field's factory (which is
// what translates a Config's `configKey` into `_<storageKey>` at
// runtime). Native's transport `FromNapiValue` reads the storage
// key straight off the object (`napi(js_name = "_pattern")`), so
// the literal must use `storageKey` here, unlike the top-level
// `emitBranchTest` config object (which legitimately uses
// `configKey` because it IS passed through `ir.<kind>(...)`).
```

#### body

```text
// Splice the recursively-built required fields into the base literal —
// `base` always ends in `} as any`; insert before the closing brace.
```

### `packages/codegen/src/emitters/test.ts::dummyTextForKind`

```text
/**
 * Returns a safe `$text` value for a stub node of the given kind.
 *
 * @remarks
 * Keyword kinds have a fixed text (e.g. `type`, `fn`, `async`) — using
 * a keyword stub with `$text: 'test'` fails transport validation because
 * `assertTextIn` enforces the exact keyword string. For non-keyword kinds
 * (leaves, enums, branches), `'test'` is accepted since their validators
 * either have no text constraint or accept arbitrary strings.
 */
```

### `packages/codegen/src/emitters/transport-common.ts::classifySlot`

```text
/**
 * Classify a slot's kind set against the supertype registry.
 *
 * Single source of derivation for slot class — all emitters (field type,
 * children type, render call, list buffer) MUST call this. DRY constraint.
 *
 * Tiebreak when multiple supertypes cover the kinds: the narrower supertype
 * (smallest `subtypes.size`) wins. If tied, Map insertion order (grammar order)
 * is the tiebreak — deterministic across runs.
 *
 * @param kinds - the kind set for this slot (projection.kinds for fields;
 *   the children slot's node-ref kinds for children)
 * @param supertypeMap - result of `buildSupertypeTransportSet(nodeMap)`; when
 *   absent (test path / no nodeMap) multi-kind slots fall back to `heterogeneous`.
 */
```

### `packages/codegen/src/emitters/transport-common.ts::buildSupertypeTransportSet`

```text
/**
 * Build a registry of supertype typeName → resolved concrete subtype set
 * from the assembled node map.
 *
 * @param nodeMap - the assembled node map for the grammar
 */
```

### `packages/codegen/src/emitters/transport-common.ts::acceptedTransportKinds`

```text
/**
 * @param parseAliases - Optional per-slot `parseKind -> storageKind` pairs
 *   (see `aliasTargetToSourceMapOf`, node-map.ts) for the specific slot
 *   `kind` was drawn from. Covers the VISIBLE-to-visible alias case a
 *   reference site canonicalizes to its storage/source kind (e.g.
 *   `alias($.identifier, $.type_identifier)` used inline at a CHOICE
 *   member — the value's `node` resolves to `identifier`, but its
 *   `parseKind` — the wire `$type` tree-sitter actually stamps — is
 *   `type_identifier`). The fact is carried per value (on
 *   `NodeOrTerminal.parseKind`), so it is recovered from the slot that
 *   actually saw the alias. Any entry whose source equals `kind` adds
 *   its target id too.
 */
```

### `packages/codegen/src/emitters/transport-common.ts::slotElementKinds`

The child kinds a repeat slot's element type actually carries as variants.
A per-slot enum flattens a supertype to its concrete kinds; a supertype enum
stops at any subtype holding its own transport type, so `Declaration` stays
one variant rather than the fourteen declarations under it. Read by the enum
emitters and by the model that mints seated sites, so an address always has
a variant behind it.

A slot whose element type is a single concrete kind yields that kind, so a
homogeneous repeat can seat its one child like any other.

### `packages/codegen/src/emitters/transport-common.ts::supertypeTransportKinds`

The walk behind a supertype's transport enum: its subtypes in declaration
order, with a reserved supertype flattened through rather than kept as a
variant, plus the kinds that flattening suppressed and the parse names the
subtypes carry. `collectEffectiveSupertypeTransportShape` maps the result to
nodes and names the variants; `slotElementKinds` reads the kinds alone.

### `packages/codegen/src/emitters/types.ts::kindDiscriminantOrLiteral`

```text
/**
 * Return the discriminant expression for a kind, falling back to a JSON
 * string literal when `kindEntries` is absent (legacy callers / tests
 * that don't supply `generatedIdTables`). The primary path always uses
 * `TSKindId.X` so generated grammar packages carry numeric discriminants.
 */
```

#### body

```text
// TSGrammar-only kinds (inlined by the parser, never in kindEntries) fall
// back to string literal — they can't carry a runtime $type so the type
// annotation stays as a string literal instead of a TSKindId reference.
```

### `packages/codegen/src/emitters/types.ts::collectNodesByCategory`

```text
/**
 * Partition all nodes in the NodeMap into the five categories used by the
 * type emitter.
 *
 * @remarks
 * Groups that act as standalone inlined hidden rules (e.g. python's
 * `_key_value_pattern`) need an interface emitted so field/child content-type
 * unions referencing their `typeName` resolve. Polymorph form groups are
 * skipped here — their parent polymorph emits the form interface inline.
 *
 * @param nodeMap - The fully assembled node map for this grammar.
 * @returns An object with five categorised collections.
 */
```

#### body

```text
// 'list' shares 'branch's type-interface emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

#### body

```text
// Standalone group — treat like a branch for type emission.
```

#### body

```text
// Excluded from every category here on purpose: token nodes
// are structural-only with no emitted interface, and multi
// is a synthetic alternation — neither carries an integer
// TSKindId or appears in the type emitter's output.
```

### `packages/codegen/src/emitters/types.ts::collectAllKinds`

```text
/**
 * Return the canonical list of kinds that get a TSKindId integer-enum
 * entry — struct kinds (branch / container / polymorph / standalone
 * group) and leaf kinds (leaf / keyword / enum). This is the single
 * source of truth used by:
 *
 *   - this file's own `kindEntries = collectKindEntries(allKinds, ...)`
 *   - the `is.ts` emitter's runtime `_kindIdByKind` map
 *
 * Both consumers MUST receive the same list — drift means a guard or
 * lookup references a TSKindId member that the integer enum never
 * received, breaking the generated package's type-check.
 */
```

### `packages/codegen/src/emitters/types.ts::emitKindIdEnumAndLookups`

```text
/**
 * Emit the runtime KindID enum and bidirectional lookup helpers.
 *
 * @remarks
 * The generator stays name-first: the lookup helpers are still emitted
 * from kind names, but the runtime discriminant surface is numeric so
 * data/transport interfaces can carry `TSKindId.*` instead of string
 * literals. The `ERROR` kind's member (`TSKindId.Error`) is followed
 * by a `satisfies typeof ERROR_KIND_ID` check, so a grammar whose
 * `TSKindId` holds another value fails its own type-check; `kind_ids.rs`'s const assert is the
 * Rust side of the same check.
 */
```

#### body

```text
// Always the canonical catalog key (`entry.kind`), never
// `entry.symbolName`. KIND_NAMES id->name lookups feed the
// generated runtime's canonical-name projections (`wrapNode`'s
// name materialization and wrap-kind filtering, `kindIdFromName`
// round-trips, the engine/boundary kind views — packages/*/src/),
// which are keyed by the catalog's canonical (possibly hidden,
// `_`-prefixed) name — NOT by the raw C-parser display label
// `ts_symbol_names[]` happens to carry. Substituting a symbolName
// here (e.g. `_template_chars`'s `string_fragment`, or `_patterns`'s
// `pattern_group`) breaks those lookups silently: the node falls
// through to the unknown-kind fallback and comes back unwrapped,
// with no error thrown. This holds even for entries whose
// symbolName was preserved across a `joinIdNames` alias-id
// collision — the wire `$type` is the grammar-symbol id, so a
// visible-aliased node arrives under its canonical kind's id (or
// the parseId row below) and resolves through this same map.
//
// Two OTHER consumers prefer the C-parser display label instead
// (`entry.symbolName`) and must NOT read this map — see
// `KIND_DISPLAY_NAMES` below, which serves them:
//  - The validator's native/WASM coordinate bridge
//    (`findNativeNodeId` / `walkNativeForKind`,
//    packages/tools/src/validate/common.ts): it matches a native
//    numeric `$type` against a WASM-parsed tree's raw string
//    `.type` field, which tree-sitter itself populates from
//    `ts_symbol_names[]` — the display label, not the catalog key.
//    Using this (canonical-keyed) map there silently breaks that
//    match for every hidden kind whose display label differs from
//    its catalog key (`_newline` vs `"newline"`, etc.), which
//    surfaces as native/WASM node-lookup misses across
//    `from.ts`/`read-render-parse.ts`/`factory-storage.ts` —
//    confirmed empirically: reusing this map there dropped
//    python's `from` validator from 102/120 to 97/120 with zero
//    new *reported* errors, because the failure mode is a silent
//    `continue` (`nativeCoords === null`), not a thrown error.
```

#### body

```text
// parseId row: a kind whose only visible identity is an alias
// occurrence carries the alias's OWN runtime symbol id (e.g.
// `_simple_statements` storage id 110, `alias_sym_simple_statements`
// 295) — runtime `$type` arrives as the PARSE id, so it must resolve
// to the same canonical catalog key for wrapNode dispatch.
```

#### body

```text
// Prefers the parser's own display name (`entry.symbolName`) over
// the raw catalog key for every entry that carries one, anonymous
// tokens included — matching `kind_name_from_id`
// (kind-id-rust.ts) and `buildKindIdByKind` (render-module.ts),
// the other two consumers of this same parser-display fact. A
// per-row anon guard here would make KIND_DISPLAY_NAMES disagree
// with those two on the display name for the same kind id.
```

#### body

```text
// parseId row — same rationale as KIND_NAMES above; the WASM
// bridge matches native numeric `$type` (the parse id at aliased
// positions) against tree-sitter's display label.
```

#### body

```text
// Catalog-key cases (e.g. `"as_pattern"`, `"plus"`).
```

#### body

```text
// Symbol-value cases: resolve display names (e.g. `"+"` → Plus,
// `"is not"` → IsNot) so callers can pass the literal text.
// Only emitted when symbolName doesn't collide with an existing
// catalog key — prevents the python `_as_pattern` symbolName
// `"as_pattern"` shadowing the real `as_pattern` entry.
```

`TSKindId` is frozen right after its declaration.

### `packages/codegen/src/emitters/types.ts::makeInliningLookupUnion`

```text
/**
 * Return a no-op `LookupUnion` that always returns `undefined`, forcing the
 * emitter to inline every field and child union directly.
 *
 * @remarks
 * Spec 008 US4 / FR-007 mandates always inlining field/child unions. The
 * prior `_union_<name>` alias dedup pass saved only ~6 aliases per grammar
 * and emitted ugly auto-generated names. Inlining removes the naming problem
 * entirely and makes each field type self-describing.
 *
 * @returns A `LookupUnion` function that unconditionally returns `undefined`.
 */
```

```text
// ---------------------------------------------------------------------------
// LookupUnion factory
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/types.ts::emitLeafTerminalAliases`

```text
/**
 * Emit one type alias per leaf kind, skipping those that are completely
 * unreferenced. A kind whose storage is its id aliases the id itself — a
 * keyword as `export type EmptyStatement = TSKindId.EmptyStatement`, an
 * enum-of-literals as its member-id union (`enumMemberDiscriminant`:
 * `export type BooleanLiteral = TSKindId.True | TSKindId.False`) — so slot
 * types keep naming the kind while the value stored is the id. Hidden or
 * visible makes no difference: every referenced kind has a type. Pattern
 * kinds alias `Terminal<kind, string>`, the one shared leaf-node shape
 * from `@sittir/types`.
 *
 * T073: a terminal is skipped when ALL of the following are true:
 * - It has no factory binding (`rawFactoryName` is absent) — downstream
 *   `factories.ts` would not import the type.
 * - It does not appear in any structural field/child content union.
 * - It is not listed as a supertype member.
 * Truly orphaned terminals (hidden tokens that survived link with no factory
 * and no references) are dropped to avoid dead exports.
 *
 * @param lines - Output line buffer to append to.
 * @param leafKinds - Ordered list of leaf kind strings.
 * @param nodeMap - The assembled node map.
 * @param generatedTypes - Mutable set tracking type names already emitted;
 *   updated in place as new aliases are added.
 */
```

```text
// ---------------------------------------------------------------------------
// Leaf terminal alias emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Drop truly-unreferenced terminal aliases.
```

#### body

```text
// Drop hidden single-literal `_kw_*` helper kinds: field types
// inline their literal via `resolveHiddenKeywordLeaf`, so no
// consumer needs the `KwXxx` / `KwXxxTree` stub any more. Keeping
// them would be dead exports — `fieldTypeComponents` resolves the
// reference to a literal string at emit time, so no generated
// code mentions `KwAsync` / `KwMove` / `KwOperator` anywhere.
```

### `packages/codegen/src/emitters/types.ts::emitSupertypeUnionDeclarations`

```text
/**
 * Emit `export type <TypeName> = | A | B | …` union declarations for every
 * supertype.
 *
 * @remarks
 * Unions must be emitted under the `AssembledNode`'s `typeName` (e.g.
 * `HiddenFExpression` for `_f_expression`), matching what `fieldTypeExpr`
 * references in the structural interfaces above. Using a local
 * `toPascal(kind.replace(/^_/, ''))` would produce `FExpression`, leaving
 * field references dangling.
 *
 * @param lines - Output line buffer to append to.
 * @param supertypes - List of supertype descriptors (kind + subtypes array).
 * @param nodeMap - The assembled node map.
 * @param generatedTypes - Mutable set of emitted type names; updated in place.
 * @throws {Error} If a supertype has zero subtypes or a subtype is absent from the map.
 *
 * A member is written when its type exists: an interface emitted above, or
 * a token, whose kind-id alias `collectAndEmitTokenTypeAliases` writes
 * next (membership in a supertype references it). A supertype of nothing
 * but tokens — python's `_layout`, whose members are all fixed-text
 * externals — is therefore a union of kind ids, the same union `options.ts`
 * types its whitespace sites with.
 */
```

```text
// ---------------------------------------------------------------------------
// Supertype union emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Pre-register every union's own type name: a supertype can be a MEMBER
// of another supertype (python's `expression` includes
// `primary_expression`), and the membership filter below must not
// depend on this loop's emission order — TS type aliases have no
// ordering constraint, but `generatedTypes` is populated as we go, so
// an early union would silently drop a later union's name.
```

#### body

```text
// Canonical-hidden fallback (Option Y): an alias-target subtype's
// node lives under the pre-promotion hidden name (`_<sub>`) when
// no visible node was minted for the target — e.g. rust's
// `alias('$', $.token_tree_punctuation)` arm names the parse kind,
// whose only NodeMap entry is the hidden `_token_tree_punctuation`
// rule. Same fallback buildDummyStub (test.ts) and
// validateTemplateCoverage use.
```

#### body

```text
// Supertype Config/Loose unions dropped (US7 landing):
// consumers reach supertype Config via `T.Supertype` and map it
// through generic helpers rather than a flat alias.
```

### `packages/codegen/src/emitters/types.ts::EmittedSupertype`

A supertype union `emitSupertypeUnionDeclarations` wrote: its kind and its
type name.

### `packages/codegen/src/emitters/types.ts::supertypeTypeName`

The type name a supertype's union is declared under: the node's own
`typeName`, else the Pascal-cased kind without its leading underscore.

### `packages/codegen/src/emitters/types.ts::emitSupertypeNamespaces`

Besides the `Kind` alias, each declared supertype's namespace carries `Bound` and `Parsed`, the unions over its members, both derived through `SupertypeSurface` from the id-keyed maps. Only a supertype the model declares gets them; a hidden choice the grammar does not declare as a supertype gets no public surface.

`export namespace X { Kind }` for every emitted supertype, so a
supertype has the same kind of home a struct kind has. It merges with the
union alias of the same name.

### `packages/codegen/src/emitters/types.ts::emitOptionsHints`

`OptionsHintMap` and one `export namespace X { export interface Hints {
readonly __optionsHint__?: … } }` per kind root of the trie (`HintRoot`),
keyed by the root's own key: struct kinds, supertypes and enum leaves alike,
each namespace merging with the kind's interface or alias. A kind root that
finds no declared type to carry its hint fails at codegen instead of
dropping out of `Options` while the Rust trie still accepts it. The hint lives in the namespace, not on the node
interface, because a member on the node interfaces is re-examined by every
derived surface (`Built`, `Loose`, the namespace map) and cost about
30k instantiations on the typescript grammar however its type was spelled;
in the namespace it costs nothing until `Options` is read. Kinds that share
a display share a root; the one that owns its display (`ownsItsDisplay`) is
kept, and any other pair fails at codegen.

### `packages/codegen/src/emitters/types.ts::leafTextType`

```text
/** The text a text-constructible leaf's factory takes and its `Terminal`
 *  carries: an enum's literal union, else `string` (a pattern). One
 *  derivation for the alias, the `LeafNs` row and the namespace. */
```

### `packages/codegen/src/emitters/types.ts::collectAndEmitTokenTypeAliases`

```text
/**
 * Collect all token type names that are actually referenced in field/child
 * content-type lists of structured nodes, then emit their type declarations.
 *
 * @remarks
 * Only tokens that ARE actually referenced in field/child content-type lists
 * of structured nodes get stubs. Pure punctuation delimiters (e.g. `...`,
 * `;`, `->`) never appear as typed union members — they're surfaced only as
 * `named: false` anonymous children and would produce unreferenced dead
 * exports if emitted.
 *
 * A token's storage is its id, so the stub is `export type X = TSKindId.X`.
 *
 * @param lines - Output line buffer to append to.
 * @param nodeMap - The assembled node map.
 * @param generatedTypes - Mutable set of emitted type names; updated in place.
 */
```

```text
// ---------------------------------------------------------------------------
// Token type alias collection and emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Reuse the shared referenced-kind walk, then filter to tokens. Previously
// this emitter had its own inline walker doing the same traversal as
// `referencedKinds` — one walk, one set, then the token-specific filter.
```

#### body

```text
// Same hidden-inline skip as emitLeafTerminalAliases — field
// references resolve directly to the literal string.
```

### `packages/codegen/src/emitters/types.ts::assertNoCamelCaseCollisions`

```text
/**
 * Assert that no two structural kinds in the grammar camelCase to the same
 * identifier.
 *
 * @remarks
 * Two snake_case kinds that collapse to the same camelCase identifier would
 * shadow each other under the `is.*` guards and namespace sugar forms. This
 * function errors at emit time rather than generating broken output.
 *
 * @param nodeKinds - Ordered list of structural kind strings to check.
 * @throws {Error} If two kinds map to the same camelCase identifier
 *   (spec 008 FR-017).
 */
```

```text
// ---------------------------------------------------------------------------
// camelCase collision guard
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/types.ts::coercerRowArgs`

```text
/** The trailing `NodeNs` arguments a kind's namespace row carries when the
 *  kind has a from() coercer, or `undefined` when it has none
 *  (`classifyFromEmission`). `bare` is the storage name (the `FieldsOf`
 *  key) of the slot `fromBareInput` says the coercer takes bare — a
 *  wrapper's sole slot, a list's element slot — as a string literal, or
 *  `undefined` (emitted as `never`) when the coercer takes only the kind or
 *  a config bag. `kind` is the grammar name, the `kind` tag a multi-kind
 *  slot's config bag carries: the runtime dispatches such a bag through the
 *  from map, keyed by grammar name, so only a kind with a coercer gets a
 *  name on its row. Only literals cross into the row; `@sittir/types` widens
 *  the bare slot inside its depth-guarded recursion (`BareLoose` /
 *  `BareArm`) — spelling the widened type at the row, or indexing the
 *  kind's `LooseArgs` tuple for it, resolves eagerly and re-enters the row
 *  when the slot's union reaches the kind itself (TS2310 / TS4110). */
```

#### token interior

```text
The bare slot of a coercer row is the direct slot, or the content slot of a lexed kind.
```

### `packages/codegen/src/emitters/types.ts::emitNamespaceInterfaceLine`

The row ends with the kind's `.Parsed` and its empty form (`never` when the kind cannot be empty), which is what lets the namespace-map lookup admit an empty form where a kind is asked for.

A kind with a construction surface narrows `BuildArgs` and `LooseArgs` (typed `readonly unknown[]` on the base) as members of its namespace interface's body. A type argument is resolved together with the base type, and a row whose elements reach back to the kind (a statement block's statements include statement blocks; a wrapper forwards to the block's rows) would need that base while it is still being resolved. A member is resolved only when it is read.

```text
/**
 * Emit one `export interface <TypeName>Ns extends NodeNs<…>` row: an empty
 * body for a kind with no factory, else a body declaring the kind's
 * `BuildArgs` and `LooseArgs` members.
 *
 * @remarks
 * Threads `NamespaceMap` through `NodeNs` so that `Loose` can short-circuit
 * multi-branch union recursions to `NamespaceMap[K]['Loose']` lookups
 * instead of re-projecting per arm. When the kind has a factory, the row
 * also carries the kind's {@link BuiltTypeSurface}: the built type, its
 * parsed form and its empty form as trailing `NodeNs` arguments, and the
 * build-args and loose-args tuples as members: this file is where `<Kind>.Bound` is DEFINED, and
 * `raw.ts` only annotates its builders with that name. The surface text is
 * written against `T.`, which is why `types.ts` imports itself as `T`
 * (type-only): the same text serves both files without a rewrite.
 *
 * @param lines - Output line buffer to append to.
 * @param typeName - The `TypeName` portion of the interface name.
 * @param surface - The construction surface, or `undefined` for a kind with
 *   no factory (the row then has no `Built` / args members beyond the
 *   `NodeNs` base's `readonly unknown[]`).
 * @param coercer - The row's trailing `Bare` / `Kind` arguments from
 *   {@link coercerRowArgs}, or `undefined` when the kind has no from()
 *   coercer (the row then ends at `LooseArgs`). A coercer with no surface is
 *   a contradiction (a coercer implies a factory), so that combination
 *   throws.
 */
```

```text
// ---------------------------------------------------------------------------
// Per-kind namespace interface line emission
// ---------------------------------------------------------------------------
```

#### body

```text
// A kind with an emitted factory pins `Fluent` to the factory's own
// `<TypeName>Built` alias — the exact return type, never a re-derived
// generic. Factory-less kinds keep NodeNs' default Fluent projection.
//
// `BuildArgs` / `LooseArgs` follow the same rule for the ARITY fact. They
// sit AFTER `Built` positionally, and the only kinds declaring one without
// the other are leaves — which have no data interface, so no Ns line at
// all. Fail loudly rather than emit a line whose type arguments have
// silently shifted.
```

### `packages/codegen/src/emitters/types.ts::emitFieldArrayDeclaration`

```text
/**
 * Emit the `readonly <name><opt>: <arrayType>` declaration for a repeated
 * (`multiple`) field inside a `$fields` block.
 *
 * @remarks
 * `repeat1` fields carry a grammar-enforced `length >= 1` guarantee. They
 * are emitted as `NonEmptyArray<T>` — the alias is inherently `readonly`
 * (TS1354 forbids prefixing a type-alias reference with `readonly`, so the
 * `readonly` lives inside the alias definition). Plain `repeat` fields stay
 * `readonly T[]`.
 *
 * @param lines - Output line buffer to append to.
 * @param name - The raw field name (snake_case).
 * @param opt - Optionality suffix: `""` for required, `"?"` for optional.
 * @param typeExpr - The resolved TypeScript type expression for the element type.
 * @param nonEmpty - Whether the field is `repeat1` (non-empty array guaranteed).
 *   `undefined` is treated as `false`.
 */
```

```text
// ---------------------------------------------------------------------------
// Field array declaration emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Phase 2: indentation at interface body level (2 spaces) since fields are
// now declared directly on the interface, not inside $fields: {}.
```

### `packages/codegen/src/emitters/types.ts::_fieldTypeParts`

```text
/**
 * Expand a field's content types into the identifier parts that
 * would form its type union. Used by both the dedup pre-pass and
 * the emission pass. Literal-value enums and empty unions return
 * `[]` — they don't get aliased because they don't produce a
 * multi-type union.
 */
```

### `packages/codegen/src/emitters/types.ts::fieldTypeExpr`

```text
/**
 * Format a field's type expression for the types.ts surface — bare
 * identifiers (no `T.` prefix) and missing kinds registered via
 * {@link missingKindTypes} for stub emission.
 *
 * Delegates to the shared {@link fieldTypeComponents} walker so the node-ref /
 * literal / alias-source / hidden-keyword logic lives in one place
 * (factories.ts::fieldElementType is the same walk with a `T.` prefix).
 */
```

#### body

```text
// Pure-literal slot (no node refs) — emit as a string-literal union.
```

```text
// defensive; current callers always pass nodeMap
```

#### body

```text
// missing kind — register for stub emission and use the
// PascalCase fallback name (bare, no prefix).
```

### `packages/codegen/src/emitters/types.ts::stringUnion`

```text
/**
 * Wrap a field's type expression with the keyword-presence brand the
 * field classifies as, or leave it bare.
 *
 * Precedence:
 *   1. `BooleanKeyword<T>` when the storage kind is `boolean`.
 *   2. `Bitflag<ConstEnumName, T>` when the storage kind is `bitflag`.
 *   3. Bare `T` otherwise.
 *
 * The two branded domains do not overlap: boolean requires an optional
 * slot, bitflag requires a repeated one.
 */
```

#### `BaseBooleanKeyword`

The keyword-presence brand is imported as `BaseBooleanKeyword`, the same `Base` prefix the other vocabulary imports
take, because a grammar may have a kind whose type is named `BooleanKeyword` (typescript's `boolean` keyword).

### `packages/codegen/src/emitters/types.ts::quoteKey`

```text
/** Quote a type/object key if it is not a plain identifier. */
```

### `packages/codegen/src/emitters/types.ts::emitNamespaceSugarBlock`

```text
/**
 * Emit the namespace sugar block for one structured kind — the
 * declaration-merged `namespace <TypeName> { Config; Fluent; Loose; Kind; }`
 * block, plus per-form sub-namespaces when refine() registered
 * forms for this kind. Keyword kinds get the same merge under the same
 * convention (bare name = the built type, here the id alias) with the
 * full member set read off their `KeywordNs` row (`Config` / `LooseConfig`
 * are `never`, `Built` is the id, the arg tuples are empty); the row's
 * `NamespaceMap` entry is also what lets `WidenValue` widen a bare id slot
 * member to `id | text`. Constructible
 * pattern / enum leaves get the full member set through a `LeafNs` row
 * (`Config` = the text the factory takes, `Loose` = node | text, `Fluent`
 * = the factory's return type); the row joins `NamespaceMap` only when
 * the kind has a parser id (an enum whose members carry the ids has
 * none), so the namespace reads its members off the row directly rather
 * than through the `*For<K>` projections.
 *
 * For refined kinds:
 *   - Each form gets its own sub-namespace `<TypeName>.<FormPascal>`
 *     exposing `Config` (base Config minus the form's auto-stamped
 *     fields).
 *   - The top-level `<TypeName>.Config` shadows the generic
 *     `ConfigFor<'kind'>` with the first-declared form's Config — so
 *     bare-call sugar `ir.<kind>({...})` routes to the default form's
 *     Config surface.
 */
```

#### body

```text
// The NamespaceMap key — the kind's id. `Kind` below stays the NAME,
// which is the grammar's own spelling and what a reader recognises.
```

### `packages/codegen/src/emitters/types.ts::aliasContentTypeExpr`

The content type of an AssembledAlias with one slot: the slot's storage type, except that a kind-enum slot names its member ids (`TSKindId.X | …`) rather than `number`. `<Alias>.Types` in the alias's namespace is this type resolved to its `.Bound` forms through `SupertypeSurface` over the `.Bound` map (a kind id passes through), so the public name never names a storage interface; it is referenced by the interface's `__aliasContent__` brand and by every construction input that admits the alias's content.

### `packages/codegen/src/emitters/types.ts::emitRefineFormSubNamespaces`

```text
/** Each refine form's sub-namespace carries its own `Built` / `BuildArgs` /
 *  `LooseArgs` (from `refineFormBuiltTypeSurfaceOf`) beside `Config`, so a
 *  form factory annotates `T.<Kind>.<Form>.Bound` exactly as
 *  a plain kind's factory annotates `T.<Kind>.Bound`. */
```

```text
/**
 * Emit the per-form sub-namespace blocks for a refined kind.
 *
 * Each form gets:
 *   - `Config` — `Omit<ConfigFor<'kind'>, 'field1' | 'field2'>` stripping
 *     the form's narrowed fields (those selections map to a single
 *     string literal, so phase-1 auto-stamp would otherwise need to be
 *     reapplied on top of the main Config).
 */
```

### `packages/codegen/src/emitters/shared.ts::aliasEnvelopesOf`

The model's alias envelopes (`AssembledAlias`): the kinds whose read node `wrapNode` keys by its display kind (`_ALIAS_ENVELOPES`).

### `packages/codegen/src/emitters/shared.ts::aliasEnvelopeIds`

The sorted, distinct alias kind ids of `envelopes`: the members of `_ALIAS_ENVELOPES`, and the alias half of `rebuildWrapperKindIds`.

### `packages/codegen/src/emitters/wrap.ts::rebuildWrapperKindIds`

What a rebuild constructs around an existing node, as sorted, distinct kind ids: the kinds enrich mints that seat on their parent (`seated`; rust `_attributed_parameter` among them), and the alias envelopes (`aliasEnvelopeIds`). Such a wrapper, rebuilt, has no source of its own, so where source adjacency is judged the node it holds stands for it (`evidenceOf`). The set is derived only from those two existing stamps, with no filter by model class, and emitted once per grammar as `TriviaFacts.rebuildWrappers` (`emitTriviaFacts`). Its breadth is safe on two independent checks: `evidenceOf` looks through an instance only when it holds exactly one present node, so a list or a leaf never is, and the reader takes `previous` from the outermost node spanning exactly the child's bytes, so a rebuilt wrapper that adds tokens around a read child never reads as adjacent.

### `packages/codegen/src/emitters/wrap.ts::listKindIds`

The grammar's list kinds as sorted kind ids: every `AssembledList` the model holds with a kind id. A list node's items reach the parent's delimiters, so its source flanks are the whitespace between those delimiters and its edge items. A construct that holds an array between delimiters of its own, such as a string around its fragments, is a different model class and is not in the set. Emitted once per grammar as `TriviaFacts.listKinds` (`emitTriviaFacts`), and asked by `listItemsOf` through `TriviaView.isList`.

### `packages/codegen/src/emitters/wrap.ts::branch`

```text
/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
```

### `packages/codegen/src/emitters/wrap.ts::separatedList`

```text
/**
	 * Emit a separatedList wrap function — per-instance separator capture
	 * (`_content`/`_separator_kind`/`_leading_sep`/`_trailing_sep`). See
	 * `emitSeparatedListWrap`'s doc comment for the wire-shape rationale.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::buildSeparatedListContentSlot`

The synthetic `AssembledNonterminal` that stands for a separatedList node's `elements` as a positional (unnamed) repeated slot, so the elements' types resolve through the same storage-info machinery a branch's repeated content field uses (`resolveFieldStorageInfo`). `fieldName` is left `undefined` (positional); the read transport stores the elements under the list's slot key, the key the wrap reads.

Exported for factories.ts, which needs the same synthetic slot to resolve the `elements` constructor parameter's element type.


### `packages/codegen/src/emitters/wrap.ts::emitSeparatedListWrap`

Emits the wrap function for a `'list'`-classified kind. The list's own view (`listSelfViewParts`, over the elements stored under the list's canonical slot key, `canonicalSeparatedListField`) makes the node an array-like list; a single-slot list's elements accessor hydrates through `hydrateSlots`, and a list whose elements route to more than one model slot gets one accessor per slot (`fieldAccessorLines`), as a field-carrying kind does. The separator kind, the delimiter flags and the elements all arrive in the read transport as the Rust reader stamped them, so the wrap reads no token and stamps no default of its own.

#### body

```text
// Match `fieldAccessorLines`' convention (`f.propertyName`, camelCase):
// `canonical.name` is the raw storage-level slot name (snake_case for
// kind-derived slots, e.g. `attributed_parameter`). An accessor emitted
// under that raw name is invisible to consumers that derive the
// expected accessor name via camelCase projection (e.g. the validator's
// `accessorCandidatesForStorageKey`), which then silently falls back to
// the raw, unhydrated storage value instead of calling this method.
```


### `packages/codegen/src/emitters/client-utils.ts::triviaKinds`

```text
/** Trivia kind names (e.g. `['line_comment', 'block_comment']`). */
```

### `packages/codegen/src/emitters/emit.ts::expectTestFailures`

```text
/** Kind → reason for known-failing generated tests (`expectTestFailures:`
	 *  in grammar.sittir.ts) — threaded to `emitTests` for `describe.skip` emission. */
```

### `packages/codegen/src/emitters/emitter.ts::CodegenEmitter`

```text
/** Constructor-based emitter with no init() lifecycle phase. */
```

### `packages/codegen/src/emitters/factories.ts::strict`

```text
/** Emit runtime leaf pattern validation. Default `false`. */
```

### `packages/codegen/src/emitters/factories.ts::generatedIdTables`

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * factories stamp numeric `$type: TSKindId.X` discriminants. When absent
	 * (legacy callers / unit tests), falls back to string `$type: 'kind' as const`.
	 */
```

### `packages/codegen/src/emitters/factories.ts::inlineKinds`

```text
/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When it's absent from this list, it's a codegen bug — throw.
	 */
```

### `packages/codegen/src/emitters/factories.ts::synthesizedKinds`

```text
/**
	 * Kind names evaluate synthesized on the sittir side only (provenance
	 * `evaluate-synthesized`). These have no parser symbol; warn and skip,
	 * same treatment as inline-list kinds.
	 */
```

### `packages/codegen/src/emitters/factories.ts::buildFactoryMapEntries`

```text
/**
 * Emit factory source for each eligible node and push it into `lines`.
 *
 * @param nodeMap - The assembled node map.
 * @param strict - Whether runtime leaf pattern validation is enabled.
 * @param aliasSourceKinds - Set of kinds that are alias sources (included even if hidden).
 * @param leafReConsts - Map from kind to its compiled-regex constant name.
 * @param kindEntries - KindEnumEntry list for numeric $type emission; undefined for legacy fallback.
 * @param lines - Output line buffer; factory declarations are appended here.
 * @remarks
 *   Dispatch is on `modelType`. Polymorph form groups are skipped at the top
 *   level (`classifyFactoryEmission` → `skip-polymorph-form-group`).
 */
```

### `packages/codegen/src/emitters/factories.ts::MapEntry`

```text
/**
 * Factory map entry descriptor — used to emit `FluentKindMap` and `_factoryMap`.
 *
 * @remarks
 *   Factory signature shape — `'config'` for config-object factories,
 *   `'children'` for child-backed rest/single-child factories,
 *   `'direct'` for field-backed direct-value factories, and `'text'`
 *   for leaf / keyword factories that take a raw string.
 */
```

```text
// ---------------------------------------------------------------------------
// Internal interfaces
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factory-map.ts::polymorphVariants`

Polymorph variant discriminators, one `PolymorphVariantDescriptor` per
polymorph parent kind, read by `nodeToConfig` to stamp `$variant` on a
derived config the caller didn't supply one for.
`collectVariantAdoptedBranches` builds it: every authored compound
(`isAuthoredCompound`) with at least one variant child, kept even when
parser-hidden if it aliases into a visible kind. `childKind` maps each
child kind to its variant name (`mapVariantChildKindsToNames`, reading the
name variant-structural derivation already resolved). `definedBy` is
`'enrich'` only when every one of the kind's variant children was itself
enrich-stamped (`VariantChild.definedBy`); one hand-declared arm (a
`variant()` override) makes the whole kind `'override'`.

### `packages/codegen/src/emitters/from.ts::generatedIdTables`

```text
/**
	 * Parser-symbol ID tables for numeric $type comparison emission.
	 * When present, from.ts emits `input.$type === TSKindId.X` checks.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
```

### `packages/codegen/src/emitters/from.ts::enumValues`

```text
/** Enum value list when the underlying node is an enum. */
```

### `packages/codegen/src/emitters/from.ts::KindInterner`

```text
/** Interner signature passed through the resolver emitter calls. */
```

```text
// ---------------------------------------------------------------------------
// Field-level resolver call generation
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/is.ts::generatedIdTables`

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * guards compare BOTH numeric `TSKindId.X` and string kind-name during
	 * Phase A coexistence. Kinds with no parser symbol (TSGrammar-only) are
	 * skipped — they can never appear at runtime. When absent (legacy /
	 * unit-test callers), guards compare string kind-names only.
	 */
```

### `packages/codegen/src/emitters/is.ts::member`

```text
/** TSKindId enum member name (e.g. 'FunctionItem'); present when kindEntries available. */
```

### `packages/codegen/src/emitters/is.ts::numericId`

```text
/** Numeric TSKindId; undefined when kind has no parser symbol. */
```

### `packages/codegen/src/emitters/is.ts::memberIds`

```text
/** Numeric IDs of member kinds (Phase A coexistence); empty = string-only. */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::parseId`

```text
/**
	 * The alias occurrence's own runtime symbol id, when this kind's ONLY
	 * visible identity comes from an `alias_sym_*` occurrence distinct from
	 * its plain `sym_*` storage id (see `GeneratedIdEntry.parseId`). Runtime
	 * `$type` dispatch tables must also map THIS id to the kind — it's what
	 * tree-sitter actually emits at the aliased position.
	 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::symbolName`

```text
/**
	 * Symbol name from `ts_symbol_names[]`, when distinct from `kind`.
	 * Anonymous tokens (`anon_sym_PLUS`) carry the literal text (`"+"`)
	 * here while `kind` is the parser symbol name (`"PLUS"`). Used to
	 * emit additional `kindIdFromName` switch arms so JS callers passing
	 * the literal text can also resolve to the correct id.
	 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::anon`

```text
/** True when this entry came from an `anon_sym_*` parser symbol. */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::kindDiscriminantExprForId`

```text
/**
 * {@link kindDiscriminantExpr} for call sites holding a LITERAL TOKEN TEXT
 * (a `STRING` rule's value) rather than a kind/rule name — resolves via
 * {@link findKindEntryForLiteral} so the anonymous token wins over a
 * same-spelled named rule (#129). The grammar's own rule-type
 * discrimination (STRING vs SYMBOL) decides which of the two functions a
 * call site uses; this must never be called with a rule name.
 */
```

### `packages/codegen/src/emitters/kind-discriminant.ts::parseId`

```text
/** See `GeneratedIdEntry.parseId` — the alias occurrence's own runtime id, when distinct from `id`. */
```

### `packages/codegen/src/emitters/kind-id-rust.ts::grammar`

```text
/** Grammar name, e.g. `'rust'` | `'typescript'` | `'python'`. */
```

### `packages/codegen/src/emitters/node-model.ts::name`

```text
/** for node-ref: target kind name */
```

### `packages/codegen/src/emitters/node-model.ts::parseKind`

```text
/** CST kind / alias target when it differs from the storage kind */
```

### `packages/codegen/src/emitters/node-model.ts::unresolved`

```text
/** for node-ref: true when the ref was not resolved to an AssembledNode */
```

### `packages/codegen/src/emitters/node-model.ts::value`

```text
/** for terminal: string value */
```

### `packages/codegen/src/emitters/node-model.ts::factoryShape`

```text
/**
	 * factory calling convention (`text`/`config`/`direct`/`spread`),
	 * folded from `factory-map.json5`'s `factoryShapes`. Present only for
	 * factory-emitting kinds (`classifyFactoryShape` non-null).
	 */
```

### `packages/codegen/src/emitters/node-model.ts::factoryFields`

```text
/**
	 * the factory-declared field names, folded from `factory-map.json5`'s
	 * `factoryFields`. Present only for factory-emitting kinds.
	 */
```

### `packages/codegen/src/emitters/node-model.ts::separator`

```text
/**
	 * Repeat-list separator surfaced when the assembled rule was a
	 * `repeat` / `repeat1` (the former-container shape, Phase 1d.vii).
	 * Field-carrying branches don't surface this — the repeat separator
	 * is reachable via the per-value metadata on the relevant
	 * `AssembledNonterminal` slot.
	 */
```

### `packages/codegen/src/emitters/node-model.ts::text`

```text
/**
	 * Present when the pattern's sole realisation is a single fixed anonymous
	 * literal (e.g. `_semicolon` → `";"`). Used by the render-module to gate
	 * the u16 kind-id acceptance branch in the generated `FromNapiValue` impl.
	 * Absent for content-bearing patterns (identifier, number, …).
	 */
```

### `packages/codegen/src/emitters/node-model.ts::SerializedList`

```text
/**
 * `modelType: 'list'` — covers both populations `AssembledList` now models
 * (hidden tree-sitter-inlined repeat helpers and genuine separated lists
 * alike). No wire/render/factory support for the separator rule tree itself
 * — this serialization is deliberately minimal (`nonEmpty`,
 * `hasNonterminalSeparator`, `leadingDelimiter`/`trailingDelimiter`,
 * `elementKinds`) rather than attempting to serialize the full separator
 * rule tree, which is a later task's design surface.
 */
```

`defaultDelimiter` is the list's declared delimiter default
(`declaredDelimiterDefault`), the value the options table renders a list
built without one with, so a tool can tell a read delimiter that merely
restates the default from one that must be spelled.

### `packages/codegen/src/emitters/node-model.ts::polymorphVariants`

```text
/**
	 * polymorph variant dispatch tables, folded from `factory-map.json5`'s
	 * `polymorphVariants` (top-level, keyed by parent kind). Built via the
	 * shared `buildFactoryMap` so the dispatch logic stays single-sourced.
	 * Consumed by the validators' `nodeToConfig` / `inferPolymorphVariant` /
	 * variant-adopted-kind scan.
	 */
```

### `packages/codegen/src/emitters/node-model.ts::fieldAliasMap`

```text
/**
	 * per-field alias-source map, folded from `factory-map.json5`'s
	 * `fieldAliasMap` (top-level, keyed `"parentKind.fieldName"` → `{
	 * aliasTarget: sourceKind }`). The per-field `values[].parseKind`/`name`
	 * carry the same facts, but the alias-source PAIRING + the
	 * factory-emitting-kind FILTER (`collectAliasSourceKinds`) live only in
	 * `buildFactoryMap`. Serializing the finished map keeps that filtering
	 * single-sourced — a validator-side rebuild would have to re-derive it.
	 * Consumed by `resolveAliasedKind`.
	 */
```

### `packages/codegen/src/emitters/node-model.ts::factorySlots`

```text
/**
	 * per-kind slot metadata, folded from `factory-map.json5`'s `factorySlots`
	 * (top-level, keyed by kind). Same single-source rationale as
	 * `fieldAliasMap` — the emitting-kind filter is `buildFactoryMap`'s, not
	 * reconstructable from per-field data without duplicating it. Consumed by
	 * `nodeToConfig`'s config-surface normalization.
	 */
```

### `packages/codegen/src/emitters/refine-emit.ts::RefineKindInfo`

```text
/**
 * Per-kind refine descriptor collected once, consumed by every emitter
 * that needs to walk the forms. Exposes the field-literal narrowing
 * per form so downstream emission doesn't re-walk the rule tree.
 */
```

### `packages/codegen/src/emitters/refine-emit.ts::narrowedFields`

```text
/** Per-form field narrowings: each entry says "in this form, field
	 *  `fieldName` should be narrowed to the literal `literal`". */
```

### `packages/codegen/src/emitters/render-module.ts::RustRenderModuleEmit`

```text
/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
 * `transportRs` carries the per-kind view structs and render bodies
 * as well as the transports; there is no separate template file.
 */
```

### `packages/codegen/src/emitters/render-module.ts::hashRs`

```text
/** `rust/crates/sittir-{lang}/src/render/hash.rs` */
```

### `packages/codegen/src/emitters/render-module.ts::hashTs`

```text
/** `packages/{lang}/src/hash.ts` */
```

### `packages/codegen/src/emitters/render-module.ts::transportRs`

```text
/** `rust/crates/sittir-{lang}/src/render/transport.rs` — AnyTransport + FromNapiValue + typed dispatch + transport bridge */
```

### `packages/codegen/src/emitters/render-module.ts::libRs`

```text
/** `rust/crates/sittir-{lang}/src/render/mod.rs` — exposes transport render entrypoints */
```

### `packages/codegen/src/emitters/render-module.ts::parseNames`

```text
/** Storage→parse pairs merged from every walked supertype (the owner AND
	 * flattened reserved sub-supertypes) — see `SupertypeRule.subtypeParseNames`.
	 * Keyed by `subtypes[].subKind`; first-stamped pair wins on collision. */
```

### `packages/codegen/src/emitters/render-module.ts::hasTransportField`

```text
/** True when this slot has a corresponding field in the transport struct.
	 *  Slots without transport fields (virtual presentation slots from the
	 *  template walker) must be defaulted to "" in the typed dispatch path. */
```

### `packages/codegen/src/emitters/render-module.ts::storageName`

```text
/** Rust struct storage identifier for this slot — used to build `node.<storageName>`
	 *  access expressions. Defaults to `name` when no assembled slot exists. */
```

### `packages/codegen/src/emitters/render-module.ts::isUnnamed`

```text
/** True when this slot was inferred (not declared via `field(...)`) — i.e. it
	 *  came from `slotModel.unnamed`. Consumers use this to
	 *  route lookups through `node.children` instead of `node.fields[name]`. */
```

### `packages/codegen/src/emitters/render-module.ts::separator`

```text
/** Per-slot separator stamped on the slot's NodeRef/TerminalValue metadata.
	 *  Used by ListView emission so each list-multiplicity slot
	 *  gets its own separator (rather than a node-wide first-match). */
```

### `packages/codegen/src/emitters/render-module.ts::backingTransportField`

```text
/**
	 * When this surface slot was produced by inlining a group-lift helper
	 * (e.g. template inlined `_const_item_optional1` and exposed its inner
	 * field `value`), this field names the HELPER's transport struct field
	 * (e.g. `const_item_optional1`) that must be matched at render time.
	 *
	 * When set, the render fn looks the value up through the backing helper
	 * field and then its inner field (`h.<name>`), as an `Option<&SlotValue>`
	 * the view is built from.
	 */
```

### `packages/codegen/src/emitters/render-module.ts::backingInnerRequired`

```text
/**
	 * True when the inner field (`h.<name>` inside the group-lift helper)
	 * is a required (non-Option) transport, so the lookup maps to it;
	 * false when it is itself Option<T>, so the lookup flattens through it.
	 * Only meaningful when `backingTransportField` is set.
	 */
```

### `packages/codegen/src/emitters/render-module.ts::backingDirectField`

```text
/**
	 * When set, the transport struct ALSO has a direct field (`_<backingDirectField>`)
	 * that the native CST reader can populate directly (since tree-sitter exposes
	 * the inner CST field at the parent level, not wrapped inside a helper object).
	 * The render fn tries this direct field first (for CST read path), then falls
	 * back to `backingTransportField` (for factory path).
	 * Only meaningful when `backingTransportField` is set.
	 */
```

### `packages/codegen/src/emitters/render-module.ts::transportHasChildren`

```text
/** True when the transport struct has an unnamed (kind-named) child slot. */
```

### `packages/codegen/src/emitters/render-module.ts::PerSlotChildEnum`

```text
/**
 * Per-slot children enum entry: identifies a heterogeneous slot (named or
 * unnamed) on a parent node, plus the set of concrete kinds it accepts.
 *
 * Per cleanup-rules.md §E1 (no special treatment for unnamed vs named slots):
 * BOTH kinds of heterogeneous slots get per-slot typed enums. Per-slot enums
 * give us Box-elision (non-recursive variants stay inline in the parent
 * struct) that `Box<AnyTransport>` cannot.
 */
```

### `packages/codegen/src/emitters/render-module.ts::typeName`

```text
/** PascalCase typeName of the parent node. */
```

### `packages/codegen/src/emitters/render-module.ts::ownerKind`

```text
/** Raw grammar kind of the parent node — owner key for SCC lookup. */
```

### `packages/codegen/src/emitters/render-module.ts::fieldName`

```text
/** Slot name — symmetric for named and unnamed slots (cleanup-rules §E1). */
```

### `packages/codegen/src/emitters/render-module.ts::kinds`

```text
/** Concrete kinds in this slot. */
```

### `packages/codegen/src/emitters/render-module.ts::literals`

```text
/** Terminal literal children that may appear in runtime `$children`. */
```

### `packages/codegen/src/emitters/render-module.ts::parseAliases`

```text
/**
	 * `parseKind -> storageKind` pairs for this slot's values whose wire
	 * `$type` (`parseKind`, e.g. `type_identifier`) diverges from the
	 * canonical storage kind sittir models it under (`node`, e.g.
	 * `identifier` — see `aliasTargetToSourceMapOf`'s doc comment,
	 * node-map.ts). A visible-to-visible `alias($.identifier,
	 * $.type_identifier)` reference site canonicalizes to the SOURCE kind
	 * here — so the runtime kind id for the ALIAS TARGET
	 * (`type_identifier`) is otherwise missing from the generated
	 * `FromNapiValue` match arms. Threaded into `acceptedTransportKinds` so
	 * the id arm for the storage kind (`identifier`) also accepts the
	 * alias-target id, per slot (the alias-target set is per-reference-site,
	 * not global to the kind).
	 *
	 * retained ONLY for the name-based fallback — kinds present in
	 * `acceptedIdsByKind` never consult it.
	 */
```

### `packages/codegen/src/emitters/render-module.ts::acceptedIdsByKind`

```text
/**
	 * Per-storage-kind accepted wire ids from the mint stamps
	 * (`acceptedIdPairsByKindOf`, node-map.ts). Kinds absent here (id-less
	 * values, supertype-expanded arms with no value in hand) fall back to
	 * the name chain (`acceptedTransportKinds` + `kindIdByKind`).
	 */
```

### `packages/codegen/src/emitters/render-module.ts::enumTypeName`

```text
/**
 * True when an `AssembledEnum` has exactly one member value.
 *
 * Single-member enums are presence markers — the field either holds
 * the one known literal or is absent. The Rust transport layer maps
 * these to plain `bool` rather than a single-variant enum type, and
 * JS sends `true`/`false` (or omits the field) instead of an object
 * with `$text`. This eliminates the enum struct entirely and lets
 * `#[napi(object)]` handle the bool field automatically.
 */
```

### `packages/codegen/src/emitters/shared.ts::collectAliasSourceKinds`

```text
/**
 * Compute the set of kind names referenced by any structural node in the
 * NodeMap — walked once, consumed by multiple emitters.
 *
 * A kind is "referenced" when it appears in:
 *   - A structural node's `fields[*].values` (node-ref kind names).
 *   - A structural node's `children[*].values` (node-ref kind names).
 *   - A polymorph form's fields / children (same, per form).
 *   - A supertype's `subtypes` list.
 *
 * Emitters that decide which terminal aliases to emit
 * use this to skip unreferenced terminals whose only consumer is a missing
 * factory binding. Previously duplicated in `types.ts::computeReferencedKinds`,
 * `type-test.ts` (inline walker), and `types.ts::collectAndEmitTokenTypeAliases`
 * (inline walker) — one walk, three derivations that had to stay in sync.
 *
 * @param nodeMap - The assembled node map to walk.
 * @returns The set of referenced kind strings.
 */
```

### `packages/codegen/src/emitters/shared.ts::TypeComponent`

```text
/**
 * One component of a field or child type expression. Callers assemble a
 * final TS type expression by formatting these (adding / omitting a `T.`
 * prefix, wrapping literals in `JSON.stringify`, routing `missing` to a
 * fallback stub, etc.).
 *
 * Three shapes:
 *
 * - **`nodeKind`** — a resolved node kind in the NodeMap. `value` is the
 *   kind's computed `typeName` (already PascalCase, always a valid TS
 *   identifier when emitted unquoted; callers that need a quoted form
 *   when `typeName` is not ident-shaped should branch on
 *   {@link isValidIdent}). `rawKind` is the original kind string — used
 *   as the indexed-access key when falling back to `"kind-string"` under
 *   unquoted-alias conditions.
 * - **`literal`** — an inline string literal from a terminal value.
 *   `value` is the raw string; callers typically `JSON.stringify` it.
 * - **`missing`** — a kind referenced in the slot's values that isn't in
 *   the NodeMap. `value` is a PascalCase fallback identifier; `rawKind`
 *   is the raw kind. types.ts registers this for stub emission;
 *   factories.ts prefixes with `T.`.
 *
 * `fieldTypeComponents` pre-inlines hidden single-literal keywords (the
 * `_kw_*` pattern) as `literal` components so consumer emitters don't
 * surface helper wrapper types.
 */
```

```text
// ---------------------------------------------------------------------------
// Field / child type-expression projection (shared by types.ts + factories.ts)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/shared.ts::PrimitiveFieldStorage`

```text
/** Rust struct-field storage for a `classifyPrimitiveField` verdict. */
```

### `packages/codegen/src/emitters/shared.ts::UnnamedChildSlotFacts`

```text
/** Real facts about a container-shape branch's single unnamed child slot. */
```

### `packages/codegen/src/emitters/templates.ts::isWordChar`

The grammar's word-class test for a single char (`wordCharPredicate`), used for compile-time static seam spaces; dynamic seams belong to the runtime SpacingWriter with the same class.

### `packages/codegen/src/emitters/templates.ts::rules`

```text
/**
	 * `normalizedRules` — the wrapper-deleted `RenderRule` view, read directly
	 * by `emitSymbol`'s hidden-helper fallback (the only consumer). There is
	 * no separate wrapper-bearing view to bridge through: `normalizedRules`
	 * is the one post-normalize rule map this emitter ever reads.
	 */
```

### `packages/codegen/src/emitters/templates.ts::visitingHelpers`

```text
/**
	 * Cycle guard for hidden-helper recursion in `emitSymbol`. A flat mutable
	 * Set tracks visited helper names, keyed by `@${name}`, passed down via
	 * this field. Each call to `emitOne()` resets it.
	 */
```

### `packages/codegen/src/emitters/templates.ts::ownerSlots`

```text
/**
	 * Owner-level slots for the current node being emitted, keyed by
	 * `storageName` (snake_case, matches `rule.fieldName.toLowerCase()`).
	 * Used as a fallback when `slotByRuleId` lookup fails because the
	 * symbol's rule `id` doesn't match any of the slot's `sourceRuleIds` — a gap
	 * that occurs when `simplifyRule` creates new rule objects without
	 * preserving the original ID. Set by `emitBranchTemplate` and
	 * `emitGroupTemplate` before recursing into the node's `renderRule`.
	 */
```

### `packages/codegen/src/emitters/templates.ts::currentKind`

```text
/**
	 * The kind currently being emitted, threaded by `emitOne` so the seam
	 * census and the emitter's diagnostics can attribute a boundary or a lookup
	 * to its owning kind.
	 */
```

### `packages/codegen/src/emitters/test.ts::generatedIdTables`

```text
/**
	 * Parser-symbol ID tables for numeric $type assertion emission.
	 * When present, generated tests emit `TSKindId.X` in `toBe()` calls.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
```

### `packages/codegen/src/emitters/test.ts::renderBodies`

The compiled render bodies by kind. `rendersText` reads them to decide whether a sampled kind writes text; without them every kind is taken to write text.

### `packages/codegen/src/emitters/test.ts::expectTestFailures`

```text
/**
	 * Kind → reason for known-failing tests (`expectTestFailures:` in the
	 * grammar's grammar.sittir.ts). Listed kinds emit `describe.skip` with the
	 * reason inline so the suite stays green on tracked defects without
	 * masking regressions in other kinds.
	 */
```

A key of the form `<kind>.<arm path>` skips one sub-factory test instead of
the kind: the arm path is the arm's spelled ir path under the kind
(`export_statement_default_declaration.defaultKw.value`), the same spelling
the test calls.

### `packages/codegen/src/emitters/test.ts::childBareCallArgs`

The arguments a generated sub-factory test passes to an arm's child: the
child's own factory call arguments. With `withOptions`, a child whose
required slots are registered options also gets its options argument, so an
arm that forwards the child's whole argument list (no residual parent slots)
builds the child the same way the child's own generated test does. Arms that
seat the child into a config or tuple take the value arguments only.

### `packages/codegen/src/emitters/transport-common.ts::SlotClass`

```text
/**
 * Classification of a transport slot by its type width.
 *
 * - `concrete`      — exactly one known kind; emit `<Kind>Transport` directly.
 *                     `typeName` is the assembled node's typeName (PascalCase,
 *                     leading-underscore-stripped) used to derive the Rust
 *                     struct name and render fn name. Falls back to the kind
 *                     string when nodeMap is unavailable (test / exported path).
 * - `supertype`     — kind set is a subset of a known assembled supertype's
 *                     resolved subtypes; emit `<Supertype>Transport` enum.
 *                     `supertypeName` is the supertype's `typeName` (PascalCase).
 * - `heterogeneous` — no grammar-bound type (theoretically unreachable in
 *                     sittir's pipeline; retained as a compile-safety escape).
 */
```

### `packages/codegen/src/emitters/wrap.ts::generatedIdTables`

`EmitWrapConfig.generatedIdTables`: the parser-symbol id tables (from `loadGeneratedIdTables`). When the config passes no `kindEntries`, the emitter derives its kind catalog from them; with a catalog, every wrap function stamps `$type: TSKindId.X` (`typeStampLines`) and `wrapNode` dispatches by numeric id. Without one (synthetic test grammars) dispatch is by kind name.


### `packages/codegen/src/emitters/wrap.ts::inlineKinds`

```text
/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When absent from this list, it's a codegen bug — throw.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::synthesizedKinds`

```text
/**
	 * Kind names evaluate synthesized on the sittir side only (provenance
	 * `evaluate-synthesized`). No parser symbol; warn and skip.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::rawFactoryName`

```text
/** rawFactoryName for $with — null when the kind has no factory. */
```

### `packages/codegen/src/emitters/wrap.ts::childSurface`

```text
/** Child-factory surface when the node exposes positional child factories. */
```

### `packages/codegen/src/emitters/consts.ts::PUNCT_MNEMONIC`

```text
/**
 * Convert a keyword string to a valid PascalCase const-enum member.
 * Strips non-word characters and PascalCases each segment.
 *
 * Examples: `async` → `Async`, `pub(crate)` → `PubCrate`.
 *
 * Pure-punctuation literals (e.g. python comparison operators `<`,
 * `>=`, `!=`) all have zero word segments after the non-word strip;
 * routing them all through the `Unknown` fallback produced duplicate
 * enum members that `tsgo` / TS-native rejects with `Identifier X has
 * already been declared`. Map the most common operator punctuation
 * to mnemonic names so each literal produces a distinct identifier.
 * The table intentionally covers comparison + bitwise + logical +
 * assignment forms shared across rust / ts / python grammars; any
 * literal not in the table still falls through to the
 * char-code-based fallback below, which generates a unique name per
 * literal (prefixed `Op_<codepoints>`) so duplicates never collide.
 */
```

### `packages/codegen/src/emitters/from.ts::optChain`

```text
/**
	 * Single-access camelCase read on the bag
	 * branch. After the isNode identity quick-return at resolver entry,
	 * the resolver body runs only for loose-bag input, which carries the
	 * camelCase property directly. No cast — if the typed input union
	 * doesn't expose the camelCase property at this position that is a
	 * real type error, not something to paper over.
	 */
```

### `packages/codegen/src/emitters/is.ts::RESERVED`

```text
/** JS reserved words that need a trailing `_` when used as a guard key. */
```

#### body

```text
// Also reserve `is` method names so kind keys don't shadow them
```

### `packages/codegen/src/emitters/is.ts::RESERVED_GUARD_NAMES`

```text
/** Methods on the `is` namespace beyond per-kind entries. */
```

### `packages/codegen/src/emitters/render-module.ts::RESERVED_SUPERTYPE_ENUM_NAMES`

```text
/**
 * Per-supertype transport enum names that collide with pre-existing
 * generated items and must be skipped during Phase 2 supertype-enum
 * emission.  The `_literal` supertype has `typeName = 'Literal'` which
 * would produce `pub enum LiteralTransport`.  Keep reserved so the
 * supertype enum is not emitted; slots fall back to `Box<AnyTransport>`
 * (`heterogeneous`).
 */
```

### `packages/codegen/src/emitters/render-module.ts::RESERVED_TRANSPORT_STRUCT_NAMES`

```text
/**
 * Sittir-infra transport type names `rustTransportStructName` must never
 * collide with — `renderTransportSupport` emits exactly one of each,
 * unconditionally, as global dispatch/support machinery (the `AnyTransport`
 * kind_id-dispatch enum, `VerbatimTransport`/`ProtectedTransport`'s bare-text
 * carriers, `LiteralTransport`). A grammar-authored kind whose PascalCase
 * `typeName` happens to match one of these (confirmed concretely: TypeScript's
 * `any` keyword type-names to `Any`, so its per-kind struct would otherwise
 * also be named `AnyTransport`) produces two Rust items with the identical
 * name in the same module — a hard `E0428`/`E0119` compile error, not a
 * cosmetic naming quirk. This was a documented, anticipated risk left
 * unresolved by the original typed-transport-fields plan (its "Open
 * questions" #1 covered the analogous supertype-enum case, resolved there via
 * `RESERVED_SUPERTYPE_ENUM_NAMES`'s skip-and-fall-back strategy — skipping
 * isn't available here since a kind's own per-kind struct can't just be
 * omitted without losing its data).
 */
```

### `packages/codegen/src/emitters/render-module.ts::collectFromSlots`

```text
/** Accumulate supertype names from a single node's slots — named and
	 *  unnamed flow through one path (cleanup-rules §E1). */
```

### `packages/codegen/src/emitters/render-module.ts::LAYOUT_FIELD`

The one field every struct transport carries besides its content:
`$_layout` → `layout: Option<TransportLayout>`, the node's layout
(`sittir_core::layout::TransportLayout`): the trivia it owns, its base
edges, and the source evidence a rebuilt node keeps, its gap toward the list
item before it and, for a list, its flanks. Its `wireKey` is the key
`wireKeyAttr` prints. It is an `Option` because the derive's codec reads a
non-`Option` field as required, and a node with no layout sends no
`$_layout`. The generated
code reads it through `sittir_core::layout::Layout`, so an absent layout
reads as an empty one.

The edges never arrive on the wire. An unset side means "not yet prepared":
`prepare_edges` fills it from the kind's edge row, a seat or a list gap's
source class sets it first, and a body passes `node.layout.edges().<side>`
to `w.edge`, which falls back to the row itself. Each side is an `EdgeArm`
(arm plus an optional strength): the render side stamps both, so a seated
gap writes at its seat's strength, and a stamp without a strength writes at
the strength the kind's edge site gives that arm. A transport carries no
coordinate fields: a coordinate is the `Coord` arm of the slot's `SlotValue`
carrier, never a field on the transport.

### `packages/codegen/src/emitters/render-module.ts::wireKeyAttr`

The `#[wire(key = "…")]` line above a transport field: the property the
derive's codec reads the field from and writes it under. Every field key
prints through it.

### `packages/codegen/src/emitters/render-module.ts::LITERAL_TO_VARIANT_NAME`

```text
/**
 * Mapping from operator/punctuation literal text to a safe Rust PascalCase
 * identifier. Covers the symbols that appear across the three grammars
 * (rust, typescript, python). Identifiers that need disambiguation from
 * Rust keywords get a `Kw` suffix.
 */
```

```text
// ----------------------------------------------------------------------
// Enum transport type emission
// ----------------------------------------------------------------------
```

#### body

```text
// Arithmetic
```

#### body

```text
// Bitwise / logical
```

#### body

```text
// Comparison
```

#### body

```text
// Shift
```

#### body

```text
// Compound assignment
```

#### body

```text
// Double-char operators
```

#### body

```text
// Range operators
```

#### body

```text
// Optional chaining
```

#### body

```text
// Arrow / fat arrow / thin arrow
```

#### body

```text
// Assignment
```

#### body

```text
// Misc punctuation
```

#### body

```text
// Brackets (less common as enum members but cover all cases)
```

#### body

```text
// Boolean literals
```

#### body

```text
// Keywords that appear as enum members (with Kw suffix to avoid collisions)
```

#### body

```text
// Rust-specific primitives
```

#### body

```text
// Fragment specifiers
```

### `packages/codegen/src/emitters/shared.ts::IDENT_RE`

```text
/** TypeScript identifier pattern — starts with letter/underscore/dollar,
 * continues with word chars or dollar. Used by emitters to decide whether
 * a kind name can be emitted as a bare identifier vs. a quoted literal. */
```

### `packages/codegen/src/emitters/templates.ts::JINJA_COND_FULL_RE`

```text
/** Full Jinja conditional: `{% if ... %}...{% endif %}` (incl. whitespace-strip variants). */
```

### `packages/codegen/src/emitters/templates.ts::SLOT_WORDLIKE_CHAR`

```text
/**
 * A virtual word-like character used to stand in for slot emissions
 * (`{{ name }}`) and other dynamic content whose runtime first/last char
 * is unknown but typically an identifier / literal head. Using a real
 * word character lets the grammar's wordMatcher decide consistently
 * (matches `\w`, `[a-zA-Z_]`, identifier-shaped patterns).
 */
```

### `packages/codegen/src/emitters/test.ts::MAX_DUMMY_DEPTH`

```text
/** Maximum branch-recursion depth for synthesized dummy stubs. Bounds
 * self-referential grammars (e.g. `expression` containing `expression`);
 * beyond this depth `buildDummyStub` falls back to the flat base literal
 * (`$type`/`$text`/`$source`/`$named`, omitting nested required fields —
 * see its docstring) rather than looping forever. */
```

### `packages/codegen/src/emitters/transport-projection.ts::TransportLiteral.resolvedKindId`

The mint-time literal-chain id (`NodeRef.resolvedKindId`) carried through from
the terminal value. Absent for kind-derived literals (keyword/token model
nodes) and hidden-keyword inlines — those fall back to emit-time chain
resolution.

### `buildNodeModel` — folding in factory-map (`packages/codegen/src/emitters/node-model.ts`)

ALL of factory-map's sections are folded in through the SINGLE shared builder,
so there is one derivation and validators only READ. `factoryShapes` /
`factoryFields` attach per-node; `polymorphVariants` / `factorySlots` /
`fieldAliasMap` go top-level.

The per-field data carries the raw facts (`required` / `multiple` /
`nonEmpty` plus `values[].parseKind`), but the alias-source pairing and the
factory-emitting-kind FILTER live only in `buildFactoryMap`. Serializing that
builder's finished output is what keeps the filtering logic single-sourced and
the validator maps byte-identical to the factory-map output.

### `packages/codegen/src/emitters/factory-map.ts::collectVariantAdoptedBranches`

Variant-adopted branches are kinds that went through Link's push-down
(`pushAmbientScaffoldIntoVariantChildren`): they classify as `branch` but still
carry the variant-child kinds on `variantChildKinds`. They must land in
`polymorphVariants` so that `.from()`-dispatch and the validator's deep-read
path both know which kinds participate in `variant()` adoption.

### `packages/codegen/src/emitters/factory-map.ts::mapVariantChildKindsToNames`

Reads the name each variant child already carries. The name was resolved once
during structural derivation — from the author's declaration where there is
one, else from the prefix convention — so this is a projection into the
`{childKind: name}` shape the model file wants, not a second derivation.

### `packages/codegen/src/emitters/shared.ts::expandToConcreteParseKinds`

Expands each name to the parser's actual emittable leaf kinds: a plain
(non-supertype) name passes through as-is; a supertype name expands to its
stamped `transitiveParseKinds` closure
(`compiler/supertype-closure.ts::stampSupertypeClosures` — computed once
during assemble; this reads the stamp rather than
re-walking the closure per call site, as the deleted `factory-map.ts::
expandRuntimeDiscriminatorKinds`/`pushAliasMintedArmParseNames` did on every
call). Dedupes by normalized (hidden-prefix-stripped) name across the whole
input list.

```text
// Reads the stamp `compiler/supertype-closure.ts::stampSupertypeClosures`
// computes once, during assemble — see glossary.
```

### `packages/codegen/src/emitters/transport-common.ts::coversExactly`

A slot only collapses onto a supertype transport when its kind set EQUALS the
supertype's full resolved subtype set — a proper subset is not enough.

A subset match would collapse the slot onto a wider supertype transport than it
actually ranges over, and when that supertype is large and self-recursive the
result is a native stack overflow: rust's `match_arm` slot
`{attribute_item, inner_attribute_item}` is a 2-of-21 subset of
`declaration_statement`, which transitively references `match_arm` again, so
the generated `FromNapiValue` recurses through the whole statement graph.
Subset slots instead fall through to `heterogeneous`, which emits a per-slot
enum of exactly their kinds.

### `emitIs` — numeric `$type` guard bodies (`packages/codegen/src/emitters/is.ts`)

All producers emit a numeric `$type`, so the emitted guards compare numeric
`TSKindId` values only. The one exception is the legacy path taken when
`generatedIdTables` is absent — unit-test callers that bypass the full codegen
pipeline — which falls back to string equality.

Every guard tests membership through the emitted `isMember(kind, type)`: a kind with a row in `_members`, the table of each declared supertype's member ids (a polymorph parent's arms included), admits its members; any other kind admits itself. A supertype or a polymorph parent is never a node's own type, so its row does not list it. `membersOf(kind)` lists the same set, which is what a walk selects and a `where` compiles against. The language's hooks export both as `membership`, so a query's `ofType` and `is.*` run one test. A supertype with no kind id (a phantom) keeps a guard over its id set, since no query can name it.

A supertype guard is generic over its input and narrows through the shared `NarrowTo<T, <member kind ids>>`: storage data stays storage, and a `.Bound` or `.Parsed` node stays `.Bound` or `.Parsed`, so a guard never claims node methods its input lacks. A numeric input narrows to its member ids, and a node broadly typed `{ $type: number }` narrows to the intersection with them, so the declared narrowing matches the runtime guard, which accepts raw kind ids. The check reads one property, where relating a `.Parsed` union to a storage member walks both interfaces past the checker's relation depth.

#### body

```text
// Collect KindEnumEntry table for numeric $type coexistence when
// generatedIdTables is present (Phase A KindID migration). Undefined
// for legacy callers / unit tests — those fall back to string-only guards.
//
// `is.kind()` guards are about user-facing rule names — restrict to
// `collectAllKinds(nodeMap)` (rule roots) so we don't expose anon-sym
// tokens or children-only kinds as guard targets. The runtime-dispatch
// surfaces (TSKindId / kindIdFromName / AnyTransport / kind_ids.rs) source
// from the catalog superset instead via `collectCatalogKinds`.
```

#### body

```text
// Collect structural kinds with data interfaces (those that emitTypes
// emits NodeNs entries for). These are the kinds that get per-kind
// is.<camel> guards.
//
// When kindEntries is present, kinds that have NO parser symbol
// (TSGrammar-only — inlined by tree-sitter, never present at runtime)
// are skipped entirely. They can't appear on a parsed or factory-produced
// node so a guard for them would always return false and mislead callers.
```

#### body

```text
// 'list' shares 'branch's per-kind guard emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

#### body

```text
// TSGrammar-only skip: when kindEntries is available and this kind
// has no parser symbol, do not emit a guard for it — it has no
// runtime presence and the guard would always return false.
```

#### body

```text
// Per-kind guards exist only for structural kinds (branch /
// polymorph). Leaves, keywords and enums have none; the
// common node guards (`isNode`, `isParsedNode`, `isFactoryNode`)
// cover them. Tokens, groups, multi, and
// supertypes have no per-kind guard surface. Supertypes
// get their own guards in a separate pass below.
```

#### body

```text
// Resolve subtypes to concrete kinds (skip if missing — supertype
// might reference hidden rules that didn't produce a data
// interface; those aren't narrowable). Also collect numeric IDs
// for Phase A coexistence guards.
```

#### body

```text
// Supertype name collision with per-kind guard is possible (e.g.
// a kind named exactly `expression`). Skip the supertype entry if
// it would shadow — the per-kind takes precedence.
```

#### body

```text
// Type imports — only supertype typeNames are referenced at the type
// level (in `v is <SupertypeUnion>` return annotations). Per-kind
// guards narrow via string-literal type discriminants (e.g.
// `v is T & { readonly type: 'function_item' }`) and don't need
// the concrete interface imported.
```

#### body

```text
// When kindEntries is present, emit a value-import for TSKindId so guard
// bodies can compare numeric discriminants (Phase D numeric-only path).
```

#### body

```text
// IsGuards mapped type — per-kind entries narrow the `type` discriminant
// to the kind literal; supertype entries narrow to the supertype union.
```

#### body

```text
// Supertype guards accept `string | number` $type because the supertype union
// may include Terminal<K> leaf types (e.g. Identifier, True, False) whose
// $type is a string literal. The parameter must be wide enough to satisfy
// TS2677 ("type predicate's type must be assignable to its parameter's type").
// The runtime guard body (_sg) only matches numeric IDs in Phase D, so
// passing a string-$type value safely returns false.
```

#### body

```text
// Legacy / unit-test callers without generatedIdTables: string-only
// fallback. This path is only reached in tests that bypass the full
// codegen pipeline and do not supply generatedIdTables.
```

#### body

```text
// Per-supertype Sets, one per supertype. Declared before `is` so the
// object-literal construction can reference them.
// Phase D: when kindEntries is present, only the numeric id set is needed.
// The string-name set is kept for the legacy no-kindEntries path only.
```

#### body

```text
// `NamespaceMap` is keyed by the kind id, so `k` IS the discriminant —
// the comparison is direct and no name table stands between them.
```

#### body

```text
// Legacy / unit-test callers without generatedIdTables: string equality.
```

#### body

```text
// All member kinds are TSGrammar-only; emit with empty id set.
```

#### body

```text
// Phase 2: factory/wrap nodes use `_<name>` storage keys (de-hoisted
// surface). Any top-level `_*` key indicates a branch node with named fields.
// Leaf nodes have `$text` instead.
```

### `packages/codegen/src/emitters/render-module.ts::resolveLiteralKindId`

```text
/**
 * Single derivation of "which numeric kind_id backs this literal" — a
 * literal's `.kind` is either the rendered TEXT itself (a bare terminal, no
 * underlying kind) or the name of the real hidden kind it collapsed from
 * (`_newline`, `_not_escape_sequence`, ...). In the latter case `.kind`
 * uniquely identifies one catalog row; TEXT does not — two unrelated
 * hidden kinds can render identical text (e.g. two single-backslash
 * tokens), and matching by text first would silently pick whichever one
 * the catalog happens to list first, leaving the other's id unroutable.
 * Prefer the unambiguous kind-name lookup whenever one exists.
 */
```

---

#### body

```text
// A kind-derived literal (collapsed from a real hidden keyword/token/
// pattern, not a bare grammar-inline string) has a catalog row by
// construction — if that row exists but resolution still failed, the
// derivation itself is broken, not a benign unrouted variant. Fail at
// codegen time rather than emit a match arm that silently can't be
// reached, deferring the same gap to an opaque native "unknown kind id"
// error at runtime.
```

A bare-text literal takes its kind id from the stamp alone
(`resolvedKindId`): value derivation already looked its text up and left it
kindless on purpose, as a lexeme fragment inside a token (rust integer
suffixes, typescript exponent signs), so a second text lookup here would
route those literals by kind ids the parser never issues there.

### `packages/codegen/src/emitters/shared.ts::stringConstructibleTexts`

```text
/**
 * Texts that construct `kind` from a bare string via from(): a keyword's
 * own text, a keyword-constructible branch's leading keyword, or — for a
 * branch whose sole user slot is its content — the constructible texts of
 * that content's arms, one level deep. Single derivation shared by the
 * runtime resolver tables (from emitter) and the config-input literal
 * widening (types emitter).
 */
```

```text
// One derivation shared by the runtime string routes and the
// config-literal widening — see glossary.
```

### `packages/codegen/src/emitters/shared.ts::wordConstructibleText`

```text
/**
 * `keywordConstructibleText` gated by the grammar's word shape — brace/
 * paren-led list kinds also open with a fixed STRING, but only a WORD
 * keyword may claim a bare-string construction route. The single filter
 * both the runtime routing tables and the literal widening go through.
 */
```

```text
// Word-shape gate: brace/paren-led list kinds also open with a fixed
// STRING — only a WORD keyword claims a bare-string route.
```

### `packages/codegen/src/emitters/shared.ts::transparentWrapperContentSlot`

```text
/**
 * A wrapper kind is TRANSPARENT when exactly ONE of its slots is required
 * (a singular content payload beside only-optional decoration — e.g.
 * parameters' `attributed_parameter`: optional attribute + required
 * content). Callers may hand the content directly; the consuming factory
 * wraps it. A single-slot kind IS the element — its factory may take a
 * direct value (text form), never qualifying. Returns the content slot,
 * or undefined when the shape doesn't qualify.
 */
```

```text
// ≥2 slots required: a single-slot kind IS the element — its factory may
// take a direct text value. See glossary.
```

#### body

```text
// A REAL wrapper decorates its content (≥2 slots, one required). A
// single-slot kind IS the element — its factory may take a direct
// value (text form), not a config object, so it never qualifies.
```

### `packages/codegen/src/emitters/factories.ts::chainParamOptional`

```text
/**
 * Whether any hop of `kind`'s forwarding chain crosses an OPTIONAL slot —
 * the hop target's surface alone loses that fact, so a form constructor
 * consuming the chain's final surface must re-apply it (and guard the
 * forward call: the target's own overloads need not accept undefined for
 * that param type).
 */
```

```text
// A hop target's surface alone loses an earlier optional slot's
// optionality — see glossary.
```

### `packages/codegen/src/emitters/types.ts::fieldFromInputHintTypeExpr`

```text
/**
 * from()/loose-only input widening — never reaches the strict Config
 * surface (strict factories store config values directly, so a widened
 * strict input would leak literals into Built storage). Keyword-
 * constructible widening: a sole-ref-kind field whose target builds from
 * a bare keyword string accepts those literals — mirrors _resolveOne's
 * string routes exactly (same stringConstructibleTexts derivation).
 */
```

### `packages/codegen/src/emitters/config.ts::EmitConfigConfig`

```text
/**
 * Emits a `vitest.config.ts` for the generated package.
 */
```

### `packages/codegen/src/emitters/config.ts::emitConfig`

Per-package `vitest.config.ts`: test include/env plus `resolve.alias` from `sourceAliases()`, which maps every workspace package's `exports` entry to its `src/` file — package-scoped test runs resolve to source, never to a stale `dist/` build. `passWithNoTests` is emitted only for a grammar that is not stable (`isStableGrammar`), so a freshly bootstrapped grammar with no tests yet runs clean while a stable package fails if its tests go missing.

### `packages/codegen/src/emitters/is.ts::kindPredicate`

The signature of a guard that narrows to one kind: it takes a node or a bare kind id, and narrows the node arms to the kind. Per-kind guards and node variant guards share it.

### `packages/codegen/src/emitters/is.ts::supertypePredicate`

The signature of a guard that narrows to a set of kinds by id, bare ids included. Supertype guards and leaf variant guards share it.

### `packages/codegen/src/emitters/is.ts::module`

```text
/**
 * Emits is.ts — per-grammar type guards.
 *
 * One surface per grammar:
 *   - `is`     — per-kind guards keyed by camelCase kind name, a generic
 *                inverse `is.kind(v, k)`, and supertype guards
 *                (narrow the `type` discriminant). A slot or supertype
 *                union may contain keyword members stored as bare kind
 *                ids, so every guard accepts `{ $type } | number`: a
 *                per-kind guard is false for a bare id (a keyword kind is
 *                never a node) and narrows the object arms only, `_sg`
 *                tests the id directly.
 *
 * Whether a value is a node, and where it came from, is the common
 * guards' question (`isNode`, `isParsedNode`, `isFactoryNode` in
 * `@sittir/common/utils`), not a per-grammar one.
 */
```

`is` is frozen and is a check on the kind id alone, with no language check: the package-level table has no engine. `engine.is` is the same table composed with the engine's language check.

A supertype whose arms are all variants (the parents `flattenedVariantParents` lists, the same ones that give `ir.<parent>.<variant>`) has a guard per variant on its own guard: `is.suite(v)` tests every form, `is.suite.block(v)` one. A variant guard narrows like a per-kind guard; a leaf variant is tested by id like a supertype guard, and a variant that is itself a variant parent is that parent's guard. Variant ids resolve through the whole catalog, as the build surface's do, so a leaf alias with no node of its own still has its id.

A supertype guard tests every kind the supertype reaches, through nested supertypes too (`expandToConcreteParseKinds`, the parse kinds of the stamped closure), so `is.integer` accepts a plain decimal although the decimal forms sit under a nested `integer_decimal`. Each parse kind resolves to its entry the way a kind discriminant does (`findKindEntry`), so an arm that aliases a hidden rule to a visible name keeps the hidden rule's id.

### `packages/codegen/src/emitters/shared.ts::module`

```text
/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */
```

```text
// Re-export derived helpers so emitters can import from one place.
```

```text
// ---------------------------------------------------------------------------
// Branch slot classification — single source of truth
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/shared.ts::isTextLeaf`

```text
/** The three model types whose factory is a text leaf (`factory.leaf`): a
 *  fixed-text keyword, a free-text pattern, a literal-union enum. Together
 *  with `isSlotBearingCompound` this is every kind that has a factory of its
 *  own — a supertype does not. */
```

### `packages/codegen/src/emitters/shared.ts::resolveHiddenKeywordLeaf`

```text
/** The fixed-text leaf a HIDDEN (`_`-prefixed) kind name resolves to — the
 *  kind's storage target (`storageTargetOf`, through a single-subtype
 *  supertype chain) when that target is a keyword or token
 *  (`isFixedTextLeaf`; an enum has no one text) — else `undefined`.
 *  The `_` gate is grammar hiddenness (a hidden rule issues no parser node,
 *  so its fixed text is inlined at the reference), not a storage fact; the
 *  storage half is the stamp. Readers that want the storage fact alone use
 *  `isKindIdStored(storageTargetOf(...))` directly. */
```

### `packages/codegen/src/emitters/shared.ts::TypeComponent.kind`

```text
// A `literal` component is a fixed-text arm. `rawKind` is the kind it
// stores as (present for every kind-bearing arm, whether the grammar
// wrote it as a reference or an inline terminal; absent only for a
// genuinely anonymous literal) and `resolvedKindId` its wire id, so id
// resolution joins on the KIND even when the literal's TEXT collides with
// an unrelated kind's text elsewhere in the same catalog (two different
// kinds can render identical text). `immediate` is the inline terminal's
// `token.immediate` fact.
```

### `packages/codegen/src/emitters/shared.ts::enumArmsOf`

```text
/**
 * The one walk over a slot's arms that seats id-stored members: an
 * enum-of-literals arm contributes the member set its storage stamp
 * carries (`seatMembers`, reading `valueStorageOf`), a keyword or token
 * arm contributes its wire identity, and a transparent supertype arm is
 * looked through to its subtypes, recursively, so `_delim_tokens` →
 * `_non_special_token` → `token_tree_punctuation` seats `TSKindId.Comma`
 * exactly as a direct enum arm does. A subtype the supertype aliases into
 * another public kind (`subtypeParseNames`) is a node arm, as is any
 * pattern or compound. `verbatim` marks a direct arm that cannot be
 * seated as an id at all (an enum with no resolved members, a keyword
 * with no wire identity, a non-terminal value); the classifier then falls
 * back to text for the whole slot. `classifyFieldStorageInfo` and
 * `kindEnumTextIdPairs` both read this walk; neither re-derives it.
 */
```

#### own symbol

```text
Seating an enum arm also records the enum's own parser symbol (`ownSymbolIds`): the reference's stamped storage
symbol, for an enum that is not hidden. A parse surfaces such an enum as one node of that symbol carrying the member
text (`{ $type: 346, $text: 'object' }`), not as the member's own id, so the symbol is what identifies a read enum
leaf. A hidden enum is never issued by the parser and records nothing.
```

### `packages/codegen/src/emitters/shared.ts::classifyFieldStorageInfo`

One encoding per slot, derived from `enumArmsOf`. Presence slots come first (`keywordPresenceKind`: boolean / bitflag). Otherwise: a slot whose arms are all fixed-text members (directly or through a supertype) classifies `kindEnum` (whole-slot id storage); a slot mixing those with node arms classifies `mixedEnum` — `kindId` arms seat as ids, `node` arms as nodes, and a genuinely anonymous `literal` arm (no kind at all) seats as its quoted text: it contributes to `texts` but not `enumKinds`, so the text→id table has no row for it and `coerceMixedEnumStorage` passes it through unchanged. `enumKinds` / `texts` / `enumKindsById` describe only the fixed-text arms. `verbatim` survives only for a slot with no kind-bearing arm at all (nothing to seat as an id), an enum arm with no resolved members, and a keyword reference with no wire identity. There is no longer an escape from `mixedEnum` back to text for layout literals, visible keyword references, or named-owner terminals: a keyword kind stores as its id everywhere, and the two ambiguities that escape used to dodge — an identifier spelled like a soft keyword (`type`), and whitespace-only layout tokens beside nodes — are answered by the coercion table (a string matching a fixed-text arm IS that arm) and measured by `validate:native`, not by a second encoding.

#### body

```text
// Prefer this reference SITE's own stamped id/name over the
// shared node's `resolvedKind`/`resolvedKindId` — the latter is
// derived once from the rule's own catalog-text/name lookup and
// has no way to know this occurrence is an alias (e.g. rust's
// `_pointer_type_const`, aliased to visible `pointer_type_const`
// at link time — its correct wire id lives on `value.parseKind`/
// `value.parseKindId`, stamped per-occurrence, not on the
// canonical AssembledKeyword instance shared across all sites).
```

### `packages/codegen/src/emitters/shared.ts::enumMemberDiscriminant`

```text
/**
 * Build the `$type` discriminant expression for an enum kind by resolving
 * each member value to its `TSKindId.X` entry and joining as a union.
 *
 * @remarks
 * The one expression of an enum-of-literals' value set: each member value
 * resolves to its anonymous token's catalog entry (through
 * `resolvedByText`, else by name) and the discriminant is the union of
 * their `TSKindId.X` references — `number` when none resolves or
 * `kindEntries` is absent. Whether the enum has a parser symbol of its own
 * (rust `boolean_literal`) or not (`_primitive_type`) makes no difference:
 * the slot stores a member id either way, so the type alias, the form
 * constructor's `value:` parameter and the boolean synonym all read this.
 * @param node - The `AssembledEnum` node whose member discriminant to build.
 * @param kindEntries - Catalog entries for TSKindId lookup; `undefined` for
 *   legacy callers without parser.c metadata.
 * @returns The discriminant expression string (e.g.
 *   `TSKindId.DotDot` or `TSKindId.U8 | TSKindId.I8 | ...`).
 */
```

```text
// ---------------------------------------------------------------------------
// Enum member discriminant resolution
// ---------------------------------------------------------------------------
```

#### body

```text
// member texts resolve through the node's construction-time
// literal-chain record (anon-scoped first, #129) — the emitter
// catalog is consulted only to map the resolved catalog KIND to its
// TSKindId member name (exact-key hit). The direct name-chain
// fallback covers nodes constructed without a catalog (fixtures).
```

### `packages/codegen/src/emitters/shared.ts::kindEnumAltIdPairs`

```text
/**
 * For each fixed-text arm (`isFixedTextLeaf`; an enum arm has no single
 * stored id to fold onto) of an id-storing slot, the OTHER identities a
 * parse may surface it under, paired with the stored id (the grammar type
 * id from `keywordRefWireIdentity`): the reference's own storage symbol,
 * its link-stamped parse symbol, and the underlying token's resolved
 * symbol, whichever differ from the stored one. The wrap projection folds
 * any of them onto the stored id so the transport only ever sees the one
 * identity the slot's enum carries. Evidence this is needed: python's
 * `_newline` arm aliased to `suite_empty` — the grammar type is
 * `suite_empty`, but in the invalid-python empty-block corpus case the
 * parser recovers with the raw `newline` token, which would otherwise
 * reach the transport as an unknown kind id.
 */
```

### `packages/codegen/src/emitters/shared.ts::keywordRefWireIdentity`

```text
/**
 * The wire identity a keyword/token REFERENCE surfaces under in a real
 * parse. An ALIASED occurrence surfaces as its alias target — the
 * per-occurrence `parseKind`/`parseKindId` stamps (e.g. rust's
 * `_pointer_type_const` aliased to visible `pointer_type_const`). An
 * UNALIASED reference to a HIDDEN keyword/token rule surfaces as the rule's
 * CONTENT — hidden rules are inlined, so the parse yields the anon token,
 * whose identity is the node's literal-chain stamp (`resolvedKind`/
 * `resolvedKindId`, anon-wins): stamping the rule's own id there compares a
 * kind no parse can produce (typescript `_kw_static` id vs the anon
 * `'static'` token the tree actually holds). A visible unaliased rule
 * surfaces as itself. Single preference derivation — every enum/keyword
 * storage emitter consumes this instead of ordering the stamps locally.
 */
```

### `packages/codegen/src/emitters/shared.ts::resolveDirectFactorySlot`

```text
/** Same as `resolveSingleFieldFactorySlot`: with the class read from the
 *  model a sole slot is by definition the only slot. Kept as the name the
 *  factory/from/ir emitters ask by. */
```

### `packages/codegen/src/emitters/shared.ts::forwardedTargetKind`

```text
/** The kind a direct factory forwards to: the sole singular slot names
 *  exactly one kind (no literal values, no optional delimiter on any slot)
 *  that has a factory of its own. `null` for a refine-form kind. */
```

#### body

```text
An envelope's content can reference an AssembledEnum kind; its rawFactoryName
builds a scalar kind-enum value, not a node, so it is never a forwarding
target — the kind-enum value path (kindEnumTextIdPairs) builds that slot.

An AssembledAlias never forwards: its input surface is its single content
value (`direct`), so a parent can take the content bare and the envelope's
own builder wraps it.
```

### `packages/codegen/src/emitters/shared.ts::soleSlotFacts`

```text
/** Cardinality facts of a compound's structural sole slot, or `null` when
 *  the kind has zero or two-plus slots. */
```

### `packages/codegen/src/emitters/shared.ts::classifyFromEmission`

The single gate for the coerce surface: which kinds get a `coerceTo*` and, through it, a bundle entry, an `ir` key, and coerce flavors on overlay wires. The from-surface is a strict subset of the factory-surface — a coercer wraps a raw builder, so `classifyFactoryEmission !== 'emit'` is `skip-no-raw-factory` (this is what keeps a name-only `rawFactoryName` getter from minting references to builders that were never emitted). A hidden kind passes only when `userFacing` (the stamped model attribute — alias-faced, variant-adopted, or slot-reachable), which is how aliased-hidden kinds join the surface under their visible identity. Hoisted forms are NOT withheld: a form is an arm a caller can name, so it gets its own coercer, its `_fromMap` row and the `coerce` half of its overlay wire; `bundleEntries` is what keeps it off the top-level bundle. Every consumer (from.ts dispatch, `bundleEntries`, the overlay's `coerceEmitted`, the test emitter through the wire SSOT) reads this one classification; none re-derives it.

### `packages/codegen/src/emitters/shared.ts::emitsBuildArgsAlias`

```text
/** ONE predicate for "this kind declares `<TypeName>BuildArgs` /
 *  `<TypeName>LooseArgs`" — every kind whose factory is actually emitted,
 *  leaves included. Mirrors `FactoryEmitter.dispatchNode`'s own switch so
 *  the `NodeNs` references and the emitted aliases cannot drift. */
```

#### body

```text
// Bound before the switch: switching on `node.modelType` narrows `node`
// itself, leaving nothing to name in the exhaustiveness check.
```

#### body

```text
// Shapes with no aliases to declare: a token and a supertype are
// dispatched to rather than built, and a multi has no single shape to
// give arguments to.
```

### `packages/codegen/src/emitters/shared.ts::emitsFieldResolvers`

```text
/** ONE predicate for "this kind's from-emitter declares per-field
 *  `resolve<TypeName>_<field>` helpers". The `$with` setters in wrap.ts call
 *  those resolvers, so a local re-derivation would let a setter reference a
 *  resolver that was never emitted. Mirrors `emitBranchFrom`'s own
 *  delegation check: a kind carrying a child factory surface is handed to
 *  `emitChildrenFrom`, which declares no per-field resolvers. */
```

#### body

```text
// The spread surface takes its children positionally and has no per-field
// config to resolve; every other branch goes through the field-carrying
// coercer, which is what emits these. `emitBranchFrom` routes on this same
// answer, so the two cannot disagree about which kinds have resolvers —
// and wrap's `$with` setters read it to know which ones they may call.
```

### `packages/codegen/src/emitters/shared.ts::fieldResolverName`

```text
/** ONE name for one fact, so `coerceTo<Kind>` and wrap's `$with` setter
 *  reach the same function rather than each re-deriving the expression. */
```

### `packages/codegen/src/emitters/shared.ts::needsNonEmptyHoist`

```text
/** A non-empty repeated field reaches the factory config through
 *  `_assertNonEmpty`, which narrows an inline expression to the tuple form
 *  the config demands; a declared resolver return type is a plain array and
 *  loses that narrowing. Keyword-presence fields (boolean / bitflag) are a
 *  brand rather than an array on the Config surface, so they take no hoist
 *  even when the underlying values are repeat1. */
```

### `packages/codegen/src/emitters/shared.ts::isWrapChildrenKind`

```text
/** Whether a kind can be built from a bare list of its children — the
 *  membership rule behind the `_wrapKindIds` table `_resolveOneBranch`
 *  consults before wrapping an array. A singular slot holding such a kind
 *  therefore accepts an ARRAY of that kind's elements at runtime, which is
 *  why the type surface has to consult the same rule rather than restate it.
 *  Read by from's wrap table and by the loose-hint emitter. */
```

#### body

```text
// A separated list is a list by construction; any other branch qualifies
// only when its factory takes the children directly.
```

A hoisted compound is admitted like any other; the children-wrap route
still requires a child factory surface (`classifyChildFactorySurface`), which
a hoisted kind does not have today, so its `_wrapKindIds` entry is decided
there, not by the hoisted flag here.

### `packages/codegen/src/emitters/shared.ts::classifyTemplateEmission`

#### body

```text
// These modelTypes never get a template file — emitBodyForNode returned null
// for all of them unconditionally (regardless of userFacing). Match that
// behaviour so classifyTemplateEmission is a strict superset of the legacy gate.
```

### `packages/codegen/src/emitters/shared.ts::literalMergePairs`

```text
/**
 * Per-grammar punctuation merge-hazard pairs: every ordered pair of
 * DIFFERING ASCII punctuation characters that appear adjacent inside some
 * multi-character anonymous literal token. A seam whose boundary chars
 * form such a pair risks the same maximal-munch collision the word-class
 * table guards against — the lexer's munch at the seam continues past the
 * left char into the right exactly when some real token contains that
 * transition (e.g. a bare range-pattern `..` immediately followed by a
 * match arm's `=>` re-lexes as `..=` plus a dangling `>`, via the `.`→`=`
 * transition inside `..=`). A pair occurring in NO token (`!`→`[`, rust's
 * `#![...]`; `:`→`<`, the turbofish) cannot extend any munch and stays
 * tight. Derived from the grammar's own anonymous-literal inventory —
 * never hand-picked.
 *
 * An identical-char pair `c|c` is never derived from the literal
 * inventory: it comes from `sameCharMergePairs` over the grammar's render
 * rules (the `rules` argument), which admits it only when the doubled
 * token `cc` can begin what directly follows the single token `c`
 * (typescript's `--` after a unary `-`, rust's `::` after a type-annotation
 * `:`). A doubled token that begins nothing that follows its single char
 * (`>>` after a nested-generic `>`) yields no pair, so those seams stay
 * tight.
 *
 * Word-class and whitespace characters are excluded even when they occur
 * inside a multi-character literal (e.g. python's `alias($._not_in, 'not
 * in')` — a compound-keyword token whose spelling embeds a literal space
 * and letters): those characters are either already covered by the
 * word-class table or, for whitespace, never risk a token-fusion seam.
 *
 * This IS the literal-spanning seam check, reduced losslessly to the
 * junction chars: a literal spanning a seam always places its junction
 * transition adjacent inside itself, so testing the junction pair alone
 * misses nothing. Returns sorted `[left, right]` char-code pairs — the
 * single derivation behind BOTH the emitted SpacingWriter pair table
 * (render-module.ts) and the template emitter's static-seam join
 * (templates.ts).
 */
```

The inventory is the set of literals a parser token spells: a literal counts only when `findEntryForLiteralText` finds a kind entry for its text (an anonymous symbol or a named literal rule). A collapsed sequence's fixed text (`unit_expression`'s `()`) and a PATTERN's regex source are not lexer tokens and contribute no pairs; before this gate they did, and the writer spaced `(` from `)` and `{` from `}` for a hazard no token creates. The kind entries come from the caller: `renderTypedDispatch` receives them, `EmitTemplatesConfig.kindEntries` carries them into the template emitter.

### `packages/codegen/src/emitters/shared.ts::escForSource`

```text
/**
 * Escapes a string for embedding inside a single-quoted JS/TS string literal
 * in emitted source. Grammar values can contain literal control characters
 * (e.g. the newline that stands for TypeScript's automatic-semicolon token) —
 * escaping only backslash and `'` leaves those raw, producing an unterminated
 * string literal in the generated file.
 */
```

### `packages/codegen/src/emitters/refine-emit.ts::module`

```text
/**
 * emitters/refine-emit.ts — shared helpers for that change
 * phase 2 per-form factory + Config emission.
 *
 * Both types.ts and factories.ts need the same naming scheme for
 * per-form types (`InterfaceBodyCurly`), fluent-case short names,
 * and the narrowed-field computation (which field names the form's
 * selections auto-stamp). Living in a small shared module avoids a
 * walker-per-emitter duplication.
 */
```

### `packages/codegen/src/emitters/factory-map.ts::module`

```text
/**
 * `buildFactoryMap` — the single derivation for validator-only factory
 * metadata (factory shapes, field-alias map, factory field lists, per-kind
 * slot metadata, polymorph variant dispatch tables).
 *
 * this metadata is no longer emitted to a standalone `factory-map.json5`.
 * `emitters/node-model.ts` calls `buildFactoryMap` ONCE and folds its output
 * into `node-model.json5` (per-node `factoryShape`/`factoryFields`; top-level
 * `polymorphVariants`/`factorySlots`/`fieldAliasMap`). The validators read it
 * back via `validate/common.ts`'s `loadNodeModel`. This module is therefore a
 * pure derivation library — it produces no on-disk artifact of its own.
 *
 * The function-valued `_factoryMap` stays in `factories.ts` — it can't
 * round-trip through JSON.
 */
```

### `packages/codegen/src/emitters/factory-map.ts::FactoryMapData.forwardsTo`

```text
/** Companion fact to a `'forwarded'` factoryShape: the kind whose
	 *  constructor the factory forwards. Present iff the shape is
	 *  'forwarded'; transitive chains resolve by following entries. */
```

### `packages/codegen/src/emitters/types.ts::module`

```text
/**
 * Emits types.ts — all type aliases derived from the grammar.
 * Consumes NodeMap directly. No imports from node-model.ts or naming.ts.
 *
 * Sections:
 *   1. const enum TSKindId + lookup helpers
 *   2. Scoped const enums per supertype
 *   3. Concrete node interfaces
 *   4. Per-form Config aliases (polymorph forms only — base-kind
 *      aliases were dropped in spec 008 Phase 9)
 *   5. Supertype unions
 *   6. Discriminated grammar union + KindMap + VariantMap
 *   7. NamespaceMap + per-kind Ns interfaces + namespace sugar (spec 008 US1)
 */
```

```text
// One-way: factories never imports this module, so naming its
// constructor-target resolution here adds no cycle.
```

### `packages/codegen/src/emitters/types.ts::hasKindId`

```text
/** Whether the parser issues an id for this kind. `NamespaceMap` is keyed by
 *  that id, so a kind without one takes no entry: nothing builds it, no parse
 *  produces it, and the per-kind family (`Config` / `Loose` / `BuildArgs`) has
 *  no meaning for it. Its data interface still stands, so it can be read out
 *  of a tree and named in a union. */
```

### `packages/codegen/src/emitters/types.ts::StructuralNode`

```text
// 'list' participates in this scan uniformly alongside
// 'branch'/'envelope'/'polymorph' — see isSlotBearingCompound's doc
// comment (shared.ts).
```

### `packages/codegen/src/emitters/types.ts::TypesModules`

The two modules `emitTypesModules` produces: `types`, the public type surface the package index re-exports, and `internal`, the module wrap, the coercers and the raw factories import as `T`.

### `packages/codegen/src/emitters/types.ts::emitTypesModules`

Emits the types module and its internal sibling in one pass. A declared supertype's union alias and namespace go to `types`; an undeclared one goes to `internal`, and `types` imports it back for the interfaces and hints that name it (a type-only import cycle). Which module a supertype lands in is `isDeclaredSupertype`, with no second predicate.

Given `entryRows`, the internal module also declares `SubBuilderRowKind`: each `ir` sub-builder path with the kind whose `LooseArgs` row declares that entry. It is not public; the per-grammar type test reads it to compare every sub-builder with its row.

### `packages/codegen/src/emitters/types.ts::internalModule`

The internal types module: everything `types` exports (`export type *`) plus the undeclared supertypes' aliases and namespaces, importing only the public names its aliases use. Consumers that resolve `T.<Name>` for any supertype alias import this module; the package index never re-exports it, so the public type surface has no alias for an undeclared hidden choice.

### `packages/codegen/src/emitters/types.ts::emitTypes`

The types module of `emitTypesModules`, for callers that need only the public surface.

`FixedTextKindId` is the union of the kind ids `kindIdText` gives a text, so it holds exactly the kinds whose leaf transport renders a bare kind id. `engine.render` accepts it beside the language's nodes.

`TypeKeyOf` is emitted from exactly the kinds `NamespaceMap` is emitted from that have a kind id, mapping each id to the kind's stamped `typeKey`, so the engine's kind-to-type map keys every kind with an id, whether or not `ir` exports a builder for it, never by re-casing a kind-id name.

#### body

```text
// `LeafScalarMap` / `LeafStringMap` are keyed by each leaf's `$type`
// discriminant (`kindDiscriminantOrLiteral`), because the widening indexes
// them with the leaf member's inferred `$type` — a map keyed by grammar
// name is unreachable from a numeric id and silently widens every leaf to
// `string`. The scalar rows come from `scalarLeafKinds`, the same table
// the runtime scalar resolver is emitted from.
```

#### body

```text
// TSKindId / kindIdFromName / kindNameFromId source from the parser
// symbol catalog superset (children-only kinds + anon tokens), not
// just nodeMap rule roots — see collectCatalogKinds doc. This matches
// the AnyTransport::FromNapiValue dispatch so wire $type values from
// any source resolve to the same KindId. Coverage gap fix (Phase B).
```

#### body

```text
// Placeholder for the @sittir/types import — patched in below once the
// body is emitted so we only import names actually referenced (avoids
// `no-unused-vars` on grammars that don't use ConfigOf / Bitflag).
```

#### body

```text
// LeafScalarMap
```

#### body

```text
// LeafStringMap
```

#### body

```text
// 1. TSKindId runtime discriminants + lookup helpers
```

#### body

```text
// 2. Scoped enums per supertype
```

#### body

```text
// Base the name on the node's own resolved typeName (same source
// emitSupertypeUnionDeclarations uses below) rather than
// re-deriving from `st.kind` — a hidden/visible pair sharing one
// cleaned name (e.g. `_property_identifier` / `property_identifier`)
// already got disambiguated typeNames upstream; stripping the `_`
// again here would collide the two into one duplicate enum.
```

#### body

```text
// 3. Concrete interfaces
```

#### body

```text
// Fallback types for kinds referenced in fields but absent from NodeMap
```

#### body

```text
// 4. Per-form Config aliases (polymorph forms only)
// Polymorph forms have no flat `${typeName}Config` alias — consumers
// (factories + dispatchers) reference `ConfigOf<T.${typeName}>` directly,
// which picks up the polymorph-variant hoist via the generic in
```

#### body

```text
// 5. Supertype unions
```

#### body

```text
// 5b. Token stubs (only referenced tokens)
```

#### body

```text
// Leftover-reference stubs intentionally omitted: if a typeName is
// referenced but never defined, that is a bug in the pipeline (Link
// should have rewritten the reference, or the filter in fieldTypeExpr
// should have dropped it). We do not paper over dangling references.
```

#### body

```text
// 6. Discriminated union + maps
```

#### body

```text
// ConfigMap / LooseMap dropped (US7 landing) — consumers use
// `NamespaceMap[K]['Config']` / `['Loose']` or the generic accessors
// `ConfigFor<K>` / `LooseFor<K>`, emitted below.
```

#### body

```text
// ---------------------------------------------------------------------
// NamespaceMap — single source of truth for the per-kind type family.
//
// For every structural kind with a data interface, emit:
//   1. interface <TypeName>Ns extends NodeNs<<TypeName>, LeafScalarMap, LeafStringMap, NamespaceMap, …>,
//      with a body declaring `BuildArgs` / `LooseArgs` when the kind has a builder
//   2. an entry in NamespaceMap keyed by the kind string
//   3. namespace sugar: `export namespace <TypeName> { Config; Fluent; Loose; Kind; }`
//      — declaration-merges with the data interface so consumers can
//      write `<TypeName>.Config` alongside using `<TypeName>` as a type.
//
// Generic accessors `ConfigFor<K>` / `BoundFor<K>` / `LooseFor<K>`
// resolve via NamespaceMap for code parametric over kinds.
// All three access paths (`<TypeName>.Config`, `ConfigFor<'kind'>`,
// `NamespaceMap['kind']['Config']`) resolve to the same type.
// ---------------------------------------------------------------------
```

#### body

```text
// 1. Per-kind namespace interfaces
```

#### body

```text
// 2. NamespaceMap
// Keyed by the kind id, which is what a node's `$type` actually carries —
// so `LooseProjection` can reach a kind's cached `Loose` straight off the
// node type instead of re-deriving one per nesting level.
```

#### body

```text
// 3. Generic accessors over NamespaceMap
```

#### body

```text
// 4. Namespace sugar — declaration-merges with the data interface
```

#### body

```text
// Splice in the bitflag const-enum import after the main header imports.
// Collected during emit so only consts actually referenced by `Bitflag<>`
// expressions are imported — no dead identifiers.
```

#### body

```text
// Header layout: comment, blank, grammar import, sittir import, blank.
// Insert the consts import after the sittir import.
```

#### body

```text
// Patch the @sittir/types import: include only names referenced in the
// emitted body. Always-used: NodeNs/Terminal/NonEmptyArray/BooleanKeyword.
// Optional: ConfigOf
// (used by polymorph dispatcher signatures), Bitflag / KindEnum (used by
// bitflag-typed fields). Empty grammars don't pull any of these, so emitting
// them unconditionally trips `no-unused-vars` on the generated package.
```

#### body

```text
// The per-kind Ns lines reference `F$.<TypeName>Built` factory return
// aliases; import the factories module (type-only — erased at runtime,
// so the factories→types value import stays acyclic) only when at
// least one such reference was emitted. The `$` in the alias keeps it
// collision-proof: kind names are tree-sitter identifiers, so no
// generated interface name can ever contain `$`.
```

After the namespaces, one `Empty<TypeName>` interface per empty form. It extends the kind's `Built`, and its `$trivia` adds `InnerTrivia<this>`, keyed by the form's gap keys only under `innerGapsKeyed`. It uses `this` because the base declares `TriviaSetterOf<this>`.

### `packages/codegen/src/emitters/types.ts::NodeCategories`

```text
// ---------------------------------------------------------------------------
// Node category collection
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/types.ts::LookupUnion`

```text
// ---------------------------------------------------------------------------
// Interface emitters
// ---------------------------------------------------------------------------
```

```text
// `fieldsOf` → `nodeFields(node)` (getter on AssembledNodeBase +
// subclass overrides). One source: each class owns the semantics for
// its own interface surface.
```

### `packages/codegen/src/emitters/types.ts::emitInterface`

A storage key is optional exactly when its slot is a single optional value: a list's key never is, a possibly-empty list storing `readonly (X)[]` (`[]` when empty) and a `repeat1` list `NonEmptyArray<X>`. A builder input still omits a possibly-empty list: `ConfigOf` and `LooseConfigOf` take input optionality from `RequiredKeys`, which leaves such a list out, and the factory stores `[]`.

#### body

```text
// Canonical-hidden architecture (Option Y): hidden alias-source kinds
// (`_foo`) keep the leading underscore in the declared `$type`.
// Factories stamp `_foo`; `wrapNode` canonicalizes parser-output
// `foo` back to `_foo` before dispatch. The interface's declared
// `$type` is the single source of truth for both producer paths.
```

#### body

```text
// Emit `_<name>: T` storage + `<name>(): T` accessor function
// types at the top level instead of the old `$fields: { name: T }` nested
// wrapper. FieldsOf<T> in @sittir/types now extracts _-prefixed keys and
// strips the underscore prefix for the ConfigOf derivation.
```

#### body

```text
// Storage keys: `readonly _name?: T` (enumerable, serializable)
```

#### body

```text
// Elidable separated-list positions store holes as `undefined`
// entries (array elision, `[a, , b]`).
```

#### body

```text
// Accessor function types: `name(): T` (non-enumerable at runtime —
// declared here for type-safety so consumers can call node.name()).
```

#### body

```text
// Multiple accessor returns the array type (same as storage type).
```

A kind with setters, or that owns a list, stamps `__slotHints__` (`emitSlotHints`) after its input hints; the accessors are unchanged.

### `packages/codegen/src/emitters/types.ts::emitSlotHints`

Prints the type-only `__slotHints__` member of a kind interface: one `SlotHint` per setter of the kind's built surface, keyed by the setter name that its accessor and `$with` share, `$listView` when `listViewHint` is defined, `$flat` (the union of one `FlatHint` per entry of `groupSeatHints`) when the node seats a group, and `$listSlots` with one `ListSlotHint` per slot `listSlotHints` names, carrying the element config only for a list whose element group has one. The node surface types read these hints and never re-derive a slot's input, or whether a kind or a slot holds a list, from storage keys.

### `packages/codegen/src/emitters/types.ts::enumStorageDiscriminantExpr`

#### body

```text
// Enum member values and storageInfo.texts are LITERAL TOKEN TEXTS —
// the node's construction-time literal-chain record is authoritative
// (anon token wins a same-spelled named rule, #129); the emitter
// catalog only maps resolved kind → TSKindId member. Chain fallback
// covers catalog-less construction (fixtures). Must stay consistent
// with factories.ts's kindEnumTextMapExpr or the declared Config
// type and the runtime stamp diverge.
```

### `packages/codegen/src/emitters/types.ts::fieldInputHintTypeExpr`

#### body

```text
// A separated list whose element kind is a transparent wrapper (one
// required slot plus optional extras) is BUILT from the wrapper's content
// as readily as from the wrapper: the strict builder maps a bare content
// node into the wrapper (`separatedListSurface().wrapper`). That is an
// input-side fact about the element slot, so it is stamped as the slot's
// input hint from the same `elemType` the builder's parameter is spelled
// from — every projection that reads the slot (Config, Loose, a slot's
// bare arm) then admits the content without a second derivation.
```

#### body

```text
// See storageFieldTypeExpr's matching branch — a single-member
// kindEnum can also be auto-stamp-eligible; brand its hint the same
// way so FieldInputType (which prefers this hint over raw storage)
// stays consistent with the (now-excluded) Config/Loose key.
```

### `packages/codegen/src/emitters/types.ts::wrapChildrenListHint`

```text
// Loose-only: strict factories store config values directly, so widened
// literals must never reach Config. See glossary.
```

```text
/** A singular slot whose one kind can be built from a bare list of children
 *  accepts that list directly — `_resolveOneBranch` maps the elements and
 *  wraps them. The element type is the CONSTRUCTOR TARGET's, not the
 *  wrapper's: a direct-surface wrapper forwards into an inner container, so
 *  its own first parameter is that container rather than an element.
 *
 *  Spelled as the target's element slot type and left for `WidenSlotValue`
 *  to widen, NOT as that kind's `LooseArgs`. The tuple would have been the
 *  tighter derivation, but it names `NamespaceMap`, and a hint sitting on an
 *  interface that the map's own `Loose` projections reach makes the two
 *  mutually recursive — TS answers "excessive stack depth" across the whole
 *  generated surface. */
```

#### body

```text
// Same rule `canonicalSeparatedListField` applies: the repeated slot is
// the element carrier, and a single-slot wrapper has only the one.
```

#### body

```text
// Names the same supertype ALIAS the interface's own slot uses. The
// expanded union is the same type, but a 37-arm union multiplies every
// assignability check that reaches it; a named alias compares once.
```

### `packages/codegen/src/emitters/templates.ts::module`

```text
/**
 * Emits per-rule `.jinja` files for the render pipeline (feature 011).
 *
 * The YAML template format (`templates directory`) was retired in favor of
 * per-rule `.jinja` files — see ADR-0013 / spec 011 for design notes.
 * This file owns the functions that drive that emission:
 *
 *   - `runTemplateEmitter(config)` — runs the authoritative TemplateEmitter
 *     class introduced in PR2. Walks the NodeMap, dispatches each node by
 *     its modelType, and returns a Map keyed by rule kind (values include
 *     the `@generated` header).
 *   - `writeJinjaTemplates(emitted, outputDir)` — writes the Map to
 *     disk and removes any stale `.jinja` files whose rule kinds are
 *     no longer present.
 *
 * All template generation happens inside the `AssembledNode` class
 * hierarchy in `compiler/node-map.ts`. Each `renderTemplate()` method
 * returns Jinja-shaped output directly — clause / variant inlining,
 * `$VAR` → `{{ var }}` translation, and separator-filter selection are
 * all collapsed into that one chokepoint.
 *
 * These emitted files are templates under `packages/{lang}/templates/`
 * for the retired jinja render pipeline. The live Rust render engine
 * under `rust/crates/sittir-{lang}/src/render/` is generated separately,
 * by `render-module.ts` from the render-body IR — not from these files.
 */
```

### `packages/codegen/src/emitters/templates.ts::SeamBoundaryRecord`

```text
/**
 * One template boundary the SEQ join classified. `left`/`right` are the
 * seam's adjacent characters in template text — a `'}'` left or `'{'`
 * right is template syntax (a slot/tag boundary). A boundary whose
 * outcome is statically constant — fixed×fixed chars, or a tag boundary
 * whose both edge CLASSES are known — is baked into template text
 * (`static-spaced` / `static-glued`). `runtime-varying` is a tag boundary
 * at least one of whose edges varies per instance (or a literal-merge pair
 * is possible for the class combo, which only concrete characters can
 * decide) — the writer's true residue. `runtime-derivable` survives only
 * for list interiors (`staticListInterior`), where baking is still
 * blocked on trailing-trivia edges.
 *
 * `origin` is a census-only fact, orthogonal to `resolution`: it names
 * where the boundary's governing seam arm(s) came from, not how the
 * boundary bakes. `preference` means a kind- or supertype-scoped
 * `options:` declaration reached the seam; `literal-default` means only a
 * grammar-wide `_`-scope declaration did; `fallback` means neither did —
 * the boundary has no `whitespaceChoice` neighbor at all (not
 * token-adjacent, so no declaration could ever reach it), or its
 * neighbor's default arm carries no stamped origin (a separator gap's
 * `whitespaceChoice`, built from `DefaultResolver.resolveSeparator`,
 * which does not track origin — separator gaps are outside this
 * mechanism). When a boundary sits between two independently-resolved
 * seam faces (a token's `after` face and the next token's `before`
 * face), the record reports the more specific of the two
 * (`preference` > `literal-default` > `fallback`) — the same specificity
 * order `resolveBindings` already uses to pick a winning declaration.
 * Never re-derived from address text here or anywhere the record is
 * read; it is read off the `origin` annotation
 * `render-rules.ts::whitespaceChoice` stamps on the seam's resolved
 * default-arm member, via `render-rules.ts::originOfSeamChoice`.
 */
```

### `packages/codegen/src/emitters/templates.ts::SeamCensusSummary`

```text
/** Per-grammar census of template-boundary seam resolutions — the
 *  static-seam-resolution spec's residue report. `preferenceOrigin`,
 *  `literalDefaultOrigin` and `fallbackOrigin` count `boundaries` by
 *  `SeamBoundaryRecord.origin` — the literal-defaults design's measure of
 *  how many boundaries a `_`-scope declaration would still need to
 *  reach. */
```

`cascadeOrigin` counts the boundaries whose seam took its arm from the edge
token's grammar-wide face (origin `cascade`), beside the preference,
literal-default and fallback counts.

### `packages/codegen/src/emitters/templates.ts::EmitCtx.isLiteralMergePair`

```text
// Same merge-hazard pairs the emitted SpacingWriter table uses (one
// derivation: literalMergePairs over the transport literal inventory) —
// consumed by the static-seam join so emit-time and render-time apply
// ONE seam law: space only where the seam's char transition occurs
// inside some real token of the grammar.
```

### `packages/codegen/src/emitters/templates.ts::EmitCtx.emittedSlotNames`

```text
// Slot storage names already emitted during this kind's tree walk. Two
// DIFFERENT grammar-tree positions can resolve to the SAME merged slot —
// arrays via `lookupSlot` (e.g. python's `if_statement` has
// `repeat(field('alternative', elif_clause))` and
// `optional(field('alternative', else_clause))` feeding one `alternative`
// slot; rust's `tuple_expression` has three separate `elements`
// positions, one inside a CHOICE arm), and singular slots via
// structural-choice distribution (permutation arms sharing one marker
// field, e.g. `readonly` at three positions of
// `public_field_definition`'s modifier choice). Without this ctx-level
// (rather than SEQ-local) guard the emitters would re-emit the merged
// slot at each position, duplicating output; first occurrence wins (the
// occurrences are mutually exclusive at parse time, so one reference is
// the whole slot). Keyed by storage name — both emission paths
// (`emitSlotReference`, `emitFieldNameSlot`) resolve to storage-key
// spellings, and storage keys are unique per kind (content-collision
// preflight). Cleared per node in `TemplateEmitter#emitNode` (mirrors
// `visitingHelpers`).
```

### `packages/codegen/src/emitters/templates.ts::EmitCtx.seamBoundaries`

```text
// Seam-census sink (optional so hand-built test ctx literals stay valid):
// the SEQ join appends one record per boundary it classifies.
```

### `packages/codegen/src/emitters/templates.ts::EmitCtx.mergePairClassCombos`

```text
// Class combos (`${leftClass}\0${rightClass}`) for which at least one
// literal-merge pair exists — a tag boundary with such a combo cannot be
// declared glued from classes alone (only concrete characters decide),
// so it stays `runtime-varying`. Optional for hand-built test ctx.
```

### `packages/codegen/src/emitters/templates.ts::EmitCtx.mergePairLeftChars`

```text
// The pair table's left/right character projections: a char absent from
// the right set can never be seamed AGAINST (as a boundary's right
// char), one absent from the left set can never seam FORWARD — the
// separator-side static rule in `staticListInterior` quantifies over
// these instead of unknown element edges. Optional for hand-built ctx.
```

### `packages/codegen/src/emitters/templates.ts::GENERATED_HEADER`

```text
// Nunjucks whitespace control (`{#- ... -#}`) strips whitespace
// flanking the comment — crucial when a template is rendered as a
// nested child, where the outer `.trim()` doesn't apply. Without the
// trim, every nested render picks up a leading `\n` from the line
// break between this header and the body. See core/render.ts for the
// top-level `.trim()` that handles the outermost render.
```

### `packages/codegen/src/emitters/templates.ts::TemplateEmitter.slotSeamNames`

The seam names a slot owns on a node: the slot's own name, plus the token of
each value that is a visible punctuation kind, through
`punctuationTokenOfNode`. It is the `seamNamesOf` argument the emitter passes
to `gateOptionalSlotSeams`.

### `packages/codegen/src/emitters/templates.ts::TemplateEmitter.mixedSlotKeywordKinds`

The keyword kinds among a slot's literal values, through
`keywordKindOfLiteral`, when the slot also has a value that is not a keyword;
undefined for a slot whose values are all keywords or all punctuation. It is
the `keywordKindsOf` argument the emitter passes to `gateKeywordSlotSeams`.

### `packages/codegen/src/emitters/templates.ts::TemplateEmitter.constructor`

#### body

```text
// Link-time-pinned, carried on `nodeMap.wordMatcher` — NOT recompiled
// here. See `LinkedGrammar.wordMatcher`'s doc comment (compiler/types.ts)
// for why a post-link recompile from `nodeMap.normalizedRules`, the
// wrapper-deleted view, is unsound in general. `?? /\w/` preserves the
// pre-existing no-word-rule fallback.
```

#### body

```text
// EmitCtx for the modelType-dispatching emitter: `rules` (for
// hidden-helper inlining — the normalized/wrapper-deleted view),
// `wordMatcher` (currently unused by emitRule but kept for parity),
// `externals` (token-shape detection), and `nodeMap` (slot back-pointer
// lookup via `slotByRuleId`).
```

### `packages/codegen/src/emitters/templates.ts::TemplateEmitter.<unknown>`

#### body

```text
// Skip-emit gate: classifyTemplateEmission skips non-user-facing
// nodes, polymorph-form groups, and all leaf modelTypes
// (pattern/keyword/token/supertype/enum/multi), none of which get a
// template file.
```

#### body

```text
// emitOne returns undefined for modelTypes that don't get templates
// (supertype / pattern / keyword / token / enum); emit an empty body
// to preserve file presence.
```

#### body

```text
// Slot-preservation gate (PR2 Task 3.B4): assert every declared slot
// appears at least once in the emitted body. Replaces the deleted
// byte-equivalence diff gate. Set SITTIR_SLOT_PRESERVATION=0 to bypass.
```

### `packages/codegen/src/emitters/templates.ts::renderRuleEdge`

```text
/**
 * Edge class of a RenderRule member's EMITTED form — the tag-boundary side
 * of the seam census. Mirrors `edgeClassesOfKind`'s lattice with one extra
 * value: `'empty'` marks members whose canonical emission is nothing (an
 * `optional` separator literal — see the STRING case in `emitRule`), so a
 * SEQ's edge falls through to its next member. Conditional emissions
 * (optional/array slots) are `varies`: presence itself is per-instance.
 * An injected flank triple reads as the array it wraps.
 */
```

#### body

```text
// Fork the cycle guard per explored member: `visiting` is an
// ancestor-path set and each member is its own path — a shared
// set would make a symbol resolved in one sibling look
// recursive in the next (order-dependent false varies).
```

#### body

```text
// Per-arm cycle-guard fork — see the SEQ case above.
```

A seam choice among a seq's members is skipped: the edge of the seq is
the edge of what the seam sits beside.

### `packages/codegen/src/emitters/templates.ts::ownerSlotsFor`

```text
/** The owner's slots keyed by name for `lookupSlot`'s fallbacks. */
```

### `packages/codegen/src/emitters/templates.ts::emitOne`

#### body

```text
// currentKind always populated — the seam census attributes every
// boundary to its owning kind.
```

#### body

```text
// classifyTemplateEmission always skips a hidden, non-user-facing node
// (a hidden tree-sitter-inlined repeat helper is one such node) before
// emitOne is reached — this arm is an unreachable safety fallback.
```

#### body

```text
// 'list' shares 'branch's template emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

### `packages/codegen/src/emitters/templates.ts::emitBranchTemplate`

```text
// ---------------------------------------------------------------------------
// Per-modelType emit functions
//
// Every compositional modelType (`branch`, `envelope`, `polymorph`, `list`)
// has a single spaced render rule, read from the rule table by kind, whose
// body shape is fully captured by `emitRule`.
//
// Exported so the modelType-emit test suite can exercise each function in
// isolation against minimal in-memory fixtures (no NodeMap construction
// required).
// ---------------------------------------------------------------------------
```

```text
// 'list' participates in this scan uniformly alongside 'branch' — see
// isSlotBearingCompound's doc comment (shared.ts).
```

#### body

```text
// PR2 Task 3.B3: consume renderRule (RenderRule, wrapper-free) instead
// of rule (RawRule, wrapper-bearing). Wrapper attributes (fieldName,
// multiplicity, separator) are now on the leaf rules themselves.
//
// Populate ownerSlots so emitSymbol can fall back to name-based slot
// lookup when slotByRuleId lookup fails (gap: simplifyRule may create
// new rule objects without preserving IDs, breaking slotByRuleId).
```

#### token interior

```text
For a lexed kind the top rule is recorded on the context (`lexedTop`) so `emitRule` glues its members.
```

### `packages/codegen/src/emitters/templates.ts::emitGroupTemplate`

#### body

```text
// PR2 Task 3.B3: consume renderRule (RenderRule, wrapper-free).
// Populate ownerSlots for the same reason as emitBranchTemplate.
```

### `packages/codegen/src/emitters/templates.ts::emitRule`

```text
// ---------------------------------------------------------------------------
// emitRule — RenderRule.type dispatcher
//
// Walks a RenderRule subtree producing the render body (render-body.ts)
// in a single pass.
//
// Per PR1 design:
// - Reads PR0-enriched attributes (`fieldName`, `multiplicity`, `nonterminal`,
//   `separator`) directly from the rule.
// - Looks up slot facts (propertyName / storageName / paramName) via
//   `ctx.nodeMap.slotByRuleId.get(rule.id)` rather than re-deriving from
//   names.
// - Reads through an injected flank triple (`flanksOf`) to the array it
//   wraps: the flank choices render through the list view, not the body.
// - Returns body nodes (a slot reference, a presence gate, literal text)
//   — no `$NAME` placeholders, no translation pass downstream; the
//   printers read the body as is.
// ---------------------------------------------------------------------------
```

#### body

```text
// A string literal is a slot reference only when it is a slot:
// `nonterminal: true` (a repeated literal, or an arm of a choice —
// `attributeBuilder`'s table). A field name alone never makes a
// literal a slot; a fielded single literal is `false` and renders as
// its text.
```

#### body

```text
// An optional anonymous separator literal (e.g. the trailing
// `optional(',')` in a comma-list, stamped `multiplicity:'optional'`
// by flatten) has no slot to gate on. Canonical render omits
// it — emitting it unconditionally produces a spurious trailing
// token (`f(a,b,)` instead of `f(a,b)`).
```

#### body

```text
// Patterns are NONTERMINAL slots (classifyByType), so they
// emit a slot REFERENCE — not inline text. Previously pattern→'' and
// enum→first-literal dropped the slot; once collectSlots makes them real
// slots that fails slot-preservation. Prefer the registered slot (named
// via field() → `{{ operator }}`, else the owner's sole slot when
// lookupSlot's id/name-based paths all miss — emitSlotReference
// handles multiplicity either way.
```

#### body

```text
// No field name and no lookupSlot hit — this PATTERN can only be
// rendering its owner's OWN registered slot (e.g. a polymorph
// parent's single discriminating union slot). Read that slot's
// real storageName directly rather than guessing a name: when
// the owner has exactly one slot, it's unambiguous; anything
// else means lookupSlot's fallbacks have a real gap to fix, not
// a case to paper over with a hardcoded placeholder.
```

#### body

```text
// ENUM handled as CHOICE below via isEnumChoiceRule guard.
```

#### body

```text
// SpacingWriter follow-on (2026-07-24 spec): seq members concatenate
// with NO compile-time boundary spaces — the render-time
// SpacingWriter inserts a space exactly where a word-class char
// would collide with a word-class char across write seams. This
// replaces the former four-case conditional-boundary matrix (with
// its absorb-into-conditional helpers and the emitted[i-2]
// outer-absent lookback): a boundary space's presence depends on
// whether optional neighbours render — runtime information the
// matrix could only simulate, and the writer simply observes.
```text
// Two DIFFERENT grammar-tree positions — possibly straddling a SEQ/
// CHOICE boundary — can carry the SAME fieldName and merge into ONE
// array slot at collect-slots time (see EmitCtx.emittedSlotNames'
// doc comment). `emitSlotReference` is the shared chokepoint that
// dedupes by slot identity, so a member whose subtree resolves to an
// already-emitted array slot simply emits '' here.
```

#### body

```text
// Static seams: askama compiles adjacent template literals into ONE
// write, so the render-time writer never sees a seam between two
// static tokens — neither two words ('abstract' + 'class' glued to
// 'abstractclass') nor a punctuation merge-hazard pair ('..' +
// '=>' glued to '..=>', which re-lexes as '..=' plus a dangling
// '>'). Apply the writer's exact invariant — BOTH halves, word
// seam and hazard-pair seam — to the statically-known seam chars.
// A '}' left edge or '{' right edge is always TEMPLATE SYNTAX
// ('}}'/'%}' and '{{'/'{%'), never a real brace: separateBraceFromTag splits
// real braces with spaces ('{ '/' }'), which makes them seam-inert.
// A tag boundary is baked too when both edge classes are known
// (the writer would decide identically); otherwise it is left
// glued for the writer, which sees the real rendered characters.
```

#### body

```text
// Tag-boundary subdivision: when both sides' edge CLASSES are
// statically known the writer's outcome is a constant — derivable,
// and baked. word×word always spaces; a no-word-seam combo is
// glued only if no literal-merge pair exists for the class combo
// (concrete characters alone decide a possible pair — varying).
```

#### body

```text
// Tag boundary: decide from edge CLASSES. A derivable
// outcome is baked exactly like a fixed×fixed seam —
// same predicate, so the runtime writer (which sees a
// baked space as a not-word left char) agrees with it.
```

#### body

```text
// §D-2a seq-unit multiplicity (normalize inline hoist): a `seq` that
// carries its OWN `multiplicity` is an inlined group body whose
// optionality belongs to the sequence as a UNIT — its literals (`=`,
// `->`, `extends`, …) must ride with, and be gated on, the seq's single
// internal slot rather than being individually leaf-stamped (the BLOCKED
// v2 regression). Gate the whole body on the seq's gating slot, reusing
// the EXISTING optional-group machinery (`pickConditionalKey`).
```

#### body

```text
// DRY: the gating-slot resolver is the single source of slot-count
// truth (the inline hoist does NOT pre-count). A seq-unit multiplicity
// group with >1 internal slot cannot be gated on one slot — it should
// have stayed a VISIBLE group; warn (§2d).
```

#### body

```text
// Transparent wrappers — recurse into content. Variant / group have no
// template-level surface of their own; the inner rule's emission is
// what the renderer sees.
// TOKEN and ALIAS have no case: both collapse to `never` under RenderRule
// (types/rule.ts) because `flattenRules` genuinely eliminates both — a
// `token()`/`token.immediate()` wrapper is consumed into `tokenized`/
// `immediate` on its content the same way `alias()` is consumed into
// `aliasedTo`/`aliasedToId`, so neither wrapper survives as its own node.
// Post-normalize aliasing and tokenization are both fully represented via
// leaf attributes (`fieldName`/`aliasedTo`/`tokenized`/`immediate`) other
// cases here already read (see `pickConditionalKey`'s `contentFieldName`
// check).
```

#### body

```text
// PR2 Task 3.B3 / phase-visibility-tightening: wrapper rule types
// (field / optional / repeat / repeat1) must not appear in RenderRule
// input — they have been pushed down to leaf attributes.
// FieldRule/OptionalRule/RepeatRule/Repeat1Rule collapse to `never`
// under RenderRule (types/rule.ts), so the former defensive `case
// FIELD: case OPTIONAL:...: throw` arms are unreachable at the type
// level and have been deleted — the exhaustiveness check in the
// `default` branch below still catches any future non-conforming Rule
// variant.
```

#### body

```text
// INDENT and DEDENT are the scanner's depth tokens, which tree-sitter
// gives no bytes to. They print as their own `indent`/`dedent` body
// nodes — `w.indent()`/`w.dedent()` sink calls, never text — because the
// scanner emits the indent token in place of the line break that
// precedes a deeper line, and the dedent token follows the closing
// line's own newline token, so a newline of its own would duplicate it.
// The writer pays the depth after the newline when the next text
// arrives, so a `DEDENT` between that newline and the next statement
// puts the statement at the outer depth.
```

#### body

```text
// Supertype rules are dispatched at the modelType boundary
// (supertype short-circuit in `emitOne`), not inside nested rule
// walks. Reaching here means we're emitting an inline supertype
// reference; defer to per-modelType emit by returning empty.
```

#### body

```text
// The boundary immediately before a SEQ member is a fact of the grammar
// shape, invariant across every occurrence of this rule subtree — once
// decided statically it is stamped onto that member so a repeat visit
// (shared helper rules inlined at multiple call sites) and any other
// consumer of the assembled tree read the fact instead of re-deriving it.
```

A seq member that is a seam choice becomes a `seam` node. The seq join
holds seam parts pending until the next real segment, so the boundary's
own decision (the stamp, or the classification) is made between the real
neighbours and the seams are placed by `joinStaticSeam`; seams before the
first real segment lead the body, seams after the last trail it. The left
rule of a boundary is the last real member, never a seam. A nested group's
body may begin or end with seam nodes (its edge seams); the join peels
those off into the boundary's seam list before reading the edges, so a
statically spaced boundary is written by the seam and never by both the
seam and a literal space.

#### body

```text
// NEWLINE renders as `text('\n')` directly rather than through
// `literalBody`: `isWhitespaceOnly('\n')` is true, so routing it through
// `literalBody` would emit a token seam (`w.token_seam`) instead of plain
// text — a token seam survives a render's end where a plain seam is
// dropped, which would change what a trailing NEWLINE rule does at the
// end of a render. NEWLINE content is exactly this rule's text, not an
// inter-node seam, so `text` is the correct call.
```

#### token interior

```text
The top seq of a lexed kind is joined with adjacency marks instead of seam decisions: every slot and seam after
the first member is preceded by an adjacent mark, and inside a gate the mark sits at the head of each arm so an
absent optional slot leaves no mark behind. The boundary is recorded as static-glued.
```

### `packages/codegen/src/emitters/templates.ts::staticListInterior`

```text
/**
 * The SpacingWriter's seam law — `word_seam(l, r) ∨
 * literal_merge_pair(l, r)`, same word table, same pair table (identical-char
 * pairs included exactly when `literalMergePairs` derives them) — applied
 * STATICALLY to a list's interior boundaries, for the census:
 *
 * - `runtime-derivable`: the checks' outcome is a statically-known
 *   constant — a separator whose own edge chars can never seam against
 *   any character, or a `""`-joined list whose derived element edge-char
 *   sets (`edgeCharSetsOfKind`) give the law one outcome over every
 *   combination.
 * - `runtime-varying`: unknown edges or a non-constant outcome — the
 *   true residue.
 *
 * Emission is NEVER changed here. A constant-space verdict statically
 * owes the writer's space between GRAMMAR edges, but a rendered element
 * may end in trailing trivia (a line comment's `'\n'`) that is not in
 * the derived sets — the writer would then NOT insert, so baking the
 * space into the separator would diverge (and a space after a newline is
 * an indentation error in python). Baking stays blocked until trivia
 * edges are modeled or ruled out; until then the verdict is census
 * information only, and the separator string remains the sole place a
 * space could ever be added.
 */
```

### `packages/codegen/src/emitters/templates.ts::warnedMultiSlotGroups`

```text
// §D-2a/§2d — one-time warning when a seq-unit multiplicity group (the inlined
// form produced by `inlineHiddenSeqRefs`) carries MORE THAN ONE distinct
// internal slot. Such a group cannot be soundly gated on a single
// `| isPresent` slot — it should have stayed a VISIBLE group. The emit-time
// gating-slot resolver is the SINGLE source of slot-count truth (DRY); the
// inline hoist deliberately does not pre-count. Diagnostic only — never throws.
```

### `packages/codegen/src/emitters/templates.ts::warnMultiSlotMultiplicityGroup`

#### body

```text
// A unit-mandatory keyed member IS a sound single gate (the unit occurs
// exactly when it is present — pickConditionalKey selects it), so
// multi-slot is only unsound when every keyed member is optional.
```

#### body

```text
// Message label: the distinct internal slot names identify the offending
// group precisely enough for a diagnostic (the hidden source-kind name
// this seq was spliced from is not available here without a metadata
// read — see `RuleBase.splicedBody`; the slot list is sufficient to find
// the site, and dedup below is still keyed uniquely per kind + slot set).
```

### `packages/codegen/src/emitters/templates.ts::commonTrailingTail`

Longest common trailing run of nodes across all bodies, trimmed forward to
the first node that opens a tag — the largest shared tail that can be
lifted out of every arm and emitted once after the gates.

### `packages/codegen/src/emitters/templates.ts::restoreEmittedSlotNames`

```text
// emitOptional and emitRepeat were deleted in PR2 Task 3.B3.
// Those wrapper types no longer appear in RenderRule; their slot facts are
// now leaf attributes on the inner rule, consumed by emitSymbol directly.
```

```text
// Reset `ctx.emittedSlotNames` to exactly the given snapshot. Used by
// emitChoice's speculative per-arm probes (see its doc comments): a probe
// whose body is discarded, or later superseded by a longer same-key body,
// must not leave its `emitSlotReference` side effect behind — otherwise a
// LATER reference to the same array slot (the trailing union reference, or
// another arm) would wrongly see it as already-emitted and produce ''.
```

### `packages/codegen/src/emitters/templates.ts::armSlotKinds`

The kinds a choice arm admits into the slot it carries: the names of its
symbol members, a supertype standing for its members. `undefined` when the
arm carries no symbol or more than one, since a literal cannot be gated on
two slots at once.

### `packages/codegen/src/emitters/templates.ts::withFieldOnCarriers`

A choice's field name pushed down onto the members that carry a slot, so
each arm emits as the parser tags it: the symbol takes the field, a literal
beside it stays the arm's own text. Tree-sitter tags that literal with the
field too, and the wrap layer drops it as punctuation, which is why the
template must print it.

### `packages/codegen/src/emitters/templates.ts::emitKindGatedLiterals`

The arms of a choice that share one slot and differ only by the literal they
put beside it, folded into the slot once with each literal gated on the kinds
its arm admits (`IfArm.kinds`). `for (init; cond; inc)`: the initializer's
expression arm ends in `;` and its declaration arms do not, so the `;` is
written when the initializer is an expression; the condition's `empty_statement`
arm carries its own `;`, so the gate names the expression kinds only. Arms
with the same residual merge their kinds. Nothing else about the choice
qualifies: an arm without a slot (the literal-fallback shape), an arm with
two, a residual that is not literal-only, or arms whose text before the slot
differs all leave the choice to the other resolutions. An arm that is a
literal kind alone (`empty_statement`, whose whole rendering is `;`) has no
slot in its body; it counts as the slot with nothing beside it, since the
slot renders that value as itself. Tried first in `emitChoice`, before the
slot lookup, on both the fielded choice (`field(x, choice(...))`) and the
plain one, so the weight-based arm merge never gets to keep one arm's
literal for every value. `SITTIR_TRACE_GATED=<kind>` prints why a choice of
that kind was left alone.

### `packages/codegen/src/emitters/templates.ts::emitChoice`

#### body

```text
// Every choice that surfaces as data is a registered slot — there is no
// "positional choice" anymore (kind-named slots). Look the slot up by the
// choice's rule id (the flatten-stamped `fieldName` case resolves via
// lookupSlot's fieldName→storageName fallback) and emit it FROM THE SLOT
// through the shared `emitSlotReference` (feedback_ruleid_backpointer) — no
// first-arm-pick (which dropped the other arms + the separator), no
// per-site name re-derivation.
```

#### body

```text
// Union-slot routing (2026-07-21 design §2): a fieldless structural
// choice that routed its unnamed-nonterminal arms into ONE union slot
// resolves here BY THE CHOICE's rule id. The MODEL made the routing
// decision at slot-derivation time — do NOT re-run the gates on this
// rule object: the render tree's choice can be a DIFFERENT rebuild
// sharing the same id (fanOutSeqChoices/factorChoiceBranches), whose
// arms partition differently (observed: python dict_pattern_group1's
// render variant carries a fieldless seq arm). The union-backed
// condition is structural: the slot was built FROM this choice
// (unnamed + sourceRuleIds carries the choice id).
//
// Mixed row (named arms + union arms): the union slot is only PART of
// the choice's surface. Emit every non-union arm as a presence-gated
// block (gated on the arm's own discriminating slot, so its ambient
// literals cannot leak when the parse took another arm), then the
// union reference (self-gated by emitSlotReference when optional).
// Arms are deduped BY GATE KEY — rebuild variants of one arm project
// onto the same slots and must reference them once (the phi2 lesson:
// never emit one block per arm for arms sharing slots); the longest
// body wins (it carries the fullest literal shape, e.g. the seq[3]
// `key ":" value` variant over the seq[2] rebuild).
```

#### body

```text
// Array-slot marks produced by the WINNING body per key (see
// restoreEmittedSlotNames' doc comment) — only committed to
// `ctx.emittedSlotNames` for real once we know which bodies
// actually survive into the returned text.
```

#### body

```text
// The arm's EMITTED BODY is the authority on what it references —
// structural partitioning is unreliable here because the render
// tree's choice can be a different rebuild than the derive
// tree's (arms appear as bare hidden symbols whose slots only
// materialize through inline-splicing, e.g. python
// dict_pattern_group1's `_key_value_pattern` kv arm). The
// body's FIRST slot reference is the arm's discriminating
// presence key, validated against the owning node's slots
// (never gate on a name absent from the transport struct — the
// generated Rust body would reference a field that does not exist):
//  - no reference → nothing gateable (pure-literal arm) → skip;
//  - reference IS the union slot → the arm is union-covered
//    (e.g. ts rest_pattern's member_expression arm) — emitting
//    a block would double-render it → skip.
// Arms are deduped BY KEY — rebuild variants of one arm project
// onto the same slots and must reference them once (the phi2
// lesson: never one block per arm for arms sharing slots); the
// longest body wins (fullest literal shape).
```

#### body

```text
// No back-pointer slot but a flatten-stamped fieldName (a `field()`
// around a choice whose members carry no fieldName): emit by the field
// name directly.
```

#### body

```text
// No slot, no fieldName. Two sub-cases:
//
// A) Synthetic exclusive-arms choice (from `buildBranchRenderRuleFromForms`):
//    Identified by the sentinel id `__synthetic_exclusive_choice__`. Arms
//    are mutually exclusive at runtime (grammar guarantee) but we must emit
//    ALL of them as conditionals so every arm can fire. Each arm emits as
//    `{% if disc | isPresent %}...{% endif %}`. Concatenating them is correct
//    because only one fires at runtime.
//
//    JINJA_COND_FULL_RE's greedy match treats the concatenated result as a
//    single conditional block, so the seq boundary checker sees the whole
//    choice as one conditional unit (correct inner-present boundary; no
//    outer-absent space inserted between prefix and a non-firing arm).
//
// B) Pure-literal choice (punctuation alternates, no data slot): emit
//    only the first non-empty arm (original behaviour). This also covers
//    real grammar choices with no registered slot (e.g. group-internal
//    unregistered choices) — these use first-arm semantics.
```

#### body

```text
// Emit ALL arms — concatenated conditionals, only one fires at runtime.
```

#### body

```text
// Unregistered choice whose EVERY non-empty arm carries its own
// discriminating slot (validated against the owner's transport struct):
// arms are mutually exclusive at runtime, so emit ALL of them as
// presence-gated blocks — same mechanism as the union-backed mixed-row
// path above, just with no union reference appended. First-arm semantics
// here silently dropped every later arm (e.g. rust `_attribute_group1` =
// choice(seq('=', value), arguments): the `arguments` arm vanished and
// the seq arm's bare `=` leaked into argument-form renders).
```

#### body

```text
// Two passes: (1) scan every arm's body into an ArmInfo — deferring
// the by-key dedup — then (2) resolve KEY COLLISIONS across
// sibling arms before building the final blockByKey. A collision
// happens when 2+ arms share a trailing UNGATED slot reference
// (scanArmBody's `depth0Ref`) that outranks each arm's own gated
// discriminator when scanned in isolation — e.g. rust
// `function_type`'s trait-form/fn-form arms both end in an ungated
// `{{ parameters }}`, so both key on 'parameters' and the
// dedup-by-longest-body below silently drops one arm entirely.
// Once 2+ arms are found sharing a key, each one's OWN
// discriminator (a real, more specific registered slot) is a
// better key than the shared one, since it no longer collides.
```

#### body

```text
// A PURE-LITERAL arm (no `{{ }}`/`{% %}` markers at all — e.g. ts
// member_expression's plain `.` arm alongside its `optional_chain`
// arm) has no slot to gate on, but it's a legitimate "default"
// branch for an otherwise-gateable choice, not something to drop.
// Track it separately from genuinely-ungateable arms (which DO
// reference something but have no valid gate key — those still
// bail below, since emitting only the gated arms would lose real
// content with no fallback to catch it).
```

#### body

```text
// A non-empty, ref-bearing arm with nothing valid to gate on —
// emitting only the gated arms would drop it. Fall back to
// first-arm below.
```

#### body

```text
/* Modifier-stack (permutation) choice: every arm's body is PURELY
		   self-gated slot units (`{% if k | isPresent %}{{ k }}{% endif %}`
		   chunks, nothing else) and at least one slot name recurs across
		   arms — the arms are order-permutations of one merged-slot set
		   (structural-choice distribution merged them; e.g.
		   public_field_definition's modifier positions). Per-arm blocks
		   would re-render every shared slot once per arm; the correct
		   emission is the flat dedup of the units in arm order (first
		   occurrence wins — occurrences are mutually exclusive at parse
		   time), which IS the canonical modifier order. Arms with no shared
		   slot keep the block path below (byte-identical output for them).
		*/
```

#### body

```text
/* Permutation check: flattening renders any present subset in
					   flat order, which the grammar accepts only if that order is
					   one an arm can parse. For each arm, project the flat order
					   onto the arm's name set — the result must be a subsequence
					   of SOME arm's own unit order (subsets of a subsequence stay
					   subsequences, so full-set checks cover partial presence).
					   Permutation stacks (pfd's modifier positions) pass; arms
					   that merely share a trailing slot in different relative
					   positions (rust function_type's trait/fn forms around
					   `parameters`) fail and keep the block path below. */
```

#### body

```text
// EVERY arm keying on the same ungated trailing reference means
// that reference is not arm content at all — it is a slot of the
// enclosing SEQ that the choice fan-out distributed into each arm
// (rust `function_type`: both form arms end in `{{ parameters }}`).
// Gating it inside the arm blocks renders NOTHING for that slot
// when no arm slot is stamped, even though the model derived it as
// required. Lift the largest shared balanced tail out of every arm
// body and emit it once, ungated, after the blocks — for a
// well-formed node (exactly one arm present) the output is the
// same text, one tail render either way.
```

#### body

```text
// Raw (unwrapped) body per key, kept alongside blockByKey's
// pre-wrapped `{% if %}...{% endif %}` strings so a literal
// fallback arm (below) can be spliced into a single if/elif/else
// chain instead of a concatenation of independent blocks.
// `undefined` when the arm's own body isn't a plain needsGate
// payload (rare — see the `every` check below before using this).
```

#### body

```text
// See the union-backed branch above for why array-slot marks must stay
// speculative (snapshot/restore per arm) until we know a body survives
// into the returned text.
```

#### body

```text
// An arm whose whole body was the hoisted shared tail has nothing
// arm-specific left to gate — the unconditional tail covers it.
```

#### body

```text
// ungateableArm, or fewer than 2 distinct keys with no usable literal
// fallback: falls through to the first-arm-wins loop below. Every
// per-arm probe above was already rolled back, so
// `ctx.emittedSlotNames` is unchanged by this block.
```

#### body

```text
// Pure-literal or unregistered choice — emit the first non-empty arm's text.
```

### `packages/codegen/src/emitters/templates.ts::selfGatedSlotUnits`

```text
/** Split an arm body into pure self-gated slot units (a gate whose test
 *  and sole referenced slot are the same name); null if anything else —
 *  literal text, seams, nested gates, a gate over more than its own slot —
 *  appears. */
```

#### body

```text
// A bare ungated scalar ref is also a unit — an arm whose sole member is
// required WITHIN the arm emits it ungated (the arm's own optionality
// lived on the choice). Flat emission drops arm exclusivity, so the
// unit gets the standard presence gate here (identical output for a
// present slot).
```

### `packages/codegen/src/emitters/client-utils.ts::buildTriviaNodeType`

The union of the grammar's trivia kind types, `AnyUntypedNode` when it has none: what a stored trivia entry is, and so what the `$trivia` getters return. It is the `trivia` member of the grammar's type map (`emitGrammarTypeMap`).

### `packages/codegen/src/emitters/client-utils.ts::module`

Emits the grammar's `utils.ts`: its trivia facts (`triviaFacts`) and the runtime bound to its type map (`bindRuntime`), destructured as `isNode`. Every other runtime helper is grammar-free and generated code imports it from `@sittir/common/utils`. The binding stays in its own module rather than `api.ts`: the factories index calls `hoist` while it loads, and `api.ts` reads `ir` while it loads, so a factory importing the runtime from `api.ts` would reach `ir` before it is initialised.

### `packages/codegen/src/emitters/client-utils.ts::emitTriviaFacts`

Emits `triviaFacts`, the grammar's `TriviaFacts`, which the language hooks carry to the engine, and which a node's `$trivia` reads through its engine:
- `kindName`, from `KIND_NAMES`;
- `kinds`, the trivia kind names (`triviaKinds`); the runtime refuses a node or kind id of any other kind, saying it is not an extra;
- `innerGaps` (`INNER_GAPS`);
- `whitespace` (`whitespaceTrivia`), when the grammar has lexical extras: loose text the extras run accepts becomes the kind id of the whitespace kind spelled exactly so, and any other such text is refused;
- `rebuildWrappers` (`rebuildWrapperKindIds`), engine plumbing: the kind ids of what a rebuild constructs around an existing node;
- `listKinds` (`listKindIds`), engine plumbing: the kind ids of the grammar's list kinds, the only nodes that have list flanks.

The render engine passes both sets to `createNativeEngine` (`emitRenderEngine`), so the engine's trivia view and a tool's view built from the engine's facts answer from one emitted set.

The facts carry no `comment` builder and no render or edit: a node renders and edits through the engine it belongs to. A grammar with a default trivia form passes its comment builder in the language hooks' `trivia` (`emitApi`), where `api.ts` imports the coercer.

`triviaFacts` is frozen, with its whitespace run table.

### `packages/codegen/src/emitters/client-utils.ts::queryRoutesOf`

How the parser delivers a slot's children: a named slot by its field alone, and an unnamed slot by the routes `wireRoutesOf` finds (its field labels, and the concrete kinds that arrive under no field), the derivation the `wire_slot` rows use.

### `packages/codegen/src/emitters/client-utils.ts::querySlotRows`

Each kind's slots, by stamped kind id: the accessor a node reads the slot through (`propertyName`) and the slot's parser routes (`queryRoutesOf`). A query condition compiles on the client to these routes, so the native evaluator knows no slot names. A kind with no slots has no row. Two nodes stamped with one kind id must agree on the row, and the emitter throws when they do not.

### `packages/codegen/src/emitters/client-utils.ts::emitQuerySlots`

Emits `querySlots`, the `querySlotRows` table as a frozen object keyed by kind id. The language hooks carry it to the engine, where a node's query facet takes its slot names from the row of the node's kind and a `where` condition compiles each slot it reads to that slot's routes.

### `packages/codegen/src/emitters/emit.ts::module`

```text
/**
 * emit.ts — single-loop orchestrator for all codegen emitters.
 *
 * Replaces the independent `emitXxx()` calls in `generate.ts` with ONE
 * entry point (`emitAll`) that iterates `nodeMap.nodes` once and
 * dispatches to every emitter per node.
 *
 * Emitters that already have `collect()` namespace APIs
 * (factory, from, wrap, templates) get true per-node dispatch in the loop.
 * Emitters that use category collection or complex multi-pass patterns
 * (types, ir, is, consts, test, clientUtils,
 * typeTests) run their existing `emitXxx()` function during finalize —
 * they keep their own internal loops for now, but the architecture is
 * set up for future migration to per-node dispatch.
 */
```

### `packages/codegen/src/emitters/emit.ts::EmitAllResult.rootTreeTypeName`

```text
/** Name of the `wrap.ts` alias for the root kind's wrapped surface — the
	 *  return type `engine.ts` gives `parse()`. */
```

### `packages/codegen/src/emitters/emit.ts::dispatchNodeMapByTaxonomy`

`envelope`, `branch` and `polymorph` share one case: their bodies were
byte-identical. The from() emitter runs for all of them regardless of the
hoisted split — a hoisted form still needs its coercer, and `_fromMap` is
keyed off the same `classifyFromEmission` the dispatch reads, so withholding
the emission here would leave the map referencing a function nobody wrote.
Only the factory, wrap, template and render-module emitters take the
`emitGroup` path when the node is hoisted.

#### body

```text
/* template/render-module still share 'branch's full slot-based
			   emission for 'list' kinds (deliberately — template rendering is
			   generically slot-based by design) — see isSlotBearingCompound's doc
			   comment (shared.ts). wrap.ts, factories.ts, and from.ts instead have
			   their own dedicated emission reading `AssembledList`'s real fields
			   directly — see `emitSeparatedListWrap`'s doc comment (wrap.ts),
			   `emitSeparatedListFactory`'s doc comment (factories.ts), and
			   `emitSeparatedListFrom`'s doc comment (from.ts). */
```

### `packages/codegen/src/emitters/emit.ts::classifyRenderModuleEmission`

Whether `emitAll` emits the render module: only when asked to, for a grammar sittir knows, and with the parser's kind-id tables. A request without the tables is an error naming the grammar, not a skipped module: every transport decodes by kind id, so the parser is generated first, as `gen` and the bootstrap do.

### `packages/codegen/src/emitters/engine.ts::EmitEngineConfig`

```text
/**
 * Emits the per-grammar engine surface, split across two files so that
 * rendering never depends on parsing.
 *
 * `render-engine.ts` holds the render / edit half and imports
 * no wrapper. `engine.ts` adds `parse()`, which does need `wrap.ts`. The
 * split is load-bearing, not cosmetic: constructed nodes carry `$render()`,
 * so `factories -> utils -> boundary` reaches the render half; if that half
 * also carried `parse()`, it would pull `wrap.ts` and close a cycle back
 * onto `factories.ts`.
 */
```

### `packages/codegen/src/emitters/engine.ts::spelledTriviaBuilders`

The rows of the model's spelled-trivia table as the generated api writes them: one per opening and closing text of each kind, with the builder that takes text spelled so. An own-text leaf (`ownTextLeaf`) is built by its raw builder with the `affix` toggle off, since that is its spelled form; any other kind, a polymorph parent among them, by its coercer, which reads the spelled form itself. Empty when the grammar has no table.

### `packages/codegen/src/emitters/engine.ts::triviaHook`

The `trivia` member of the language hooks: the generated facts, the default comment kind's coercer as `comment`, and the spelled-trivia rows as `spelled`, in the model's match order. The bare facts object when there is neither.

### `packages/codegen/src/emitters/engine.ts::triviaImports`

The factory imports the trivia hook needs, one line per module: raw builders for own-text leaves, coercers for the default comment kind and for kinds built through their coercer.

### `packages/codegen/src/emitters/engine.ts::EmitEngineConfig.rootTypeName`

```text
/** The grammar's root kind interface name (e.g. `SourceFile`) — types
	 *  `createEngine`'s diagnostics so `parseAndRead(...).root` needs no cast. */
```

### `packages/codegen/src/emitters/engine.ts::EmitEngineConfig.rootTreeTypeName`

```text
/** The `wrap.ts` alias for the root kind's wrapped surface (e.g.
	 *  `SourceFileTree`) — `parse()`'s return type. Emitted by the wrap
	 *  emitter from the same table that types `wrapNode`. */
```

### `packages/codegen/src/emitters/node-model.ts::module`

```text
/**
 * Emits node-model.json5 — a structural dump of the assembled `NodeMap`.
 *
 * Consumers (external tooling, fixture-based tests, downstream analyzers)
 * can parse this JSON5 file to get a structural view of each grammar
 * node's shape — kind, modelType, slots with per-value multiplicities,
 * supertype subtypes, polymorph forms, etc. — without re-running
 * the codegen pipeline.
 *
 * The serializer deliberately mirrors the public shape of `NodeMap` /
 * `AssembledNode` (plus their subclass-specific accessors) rather than
 * inventing a bespoke wire format. That way it tracks the source model
 * automatically: adding a new getter on `AbstractAssembledCompound` only
 * needs a one-line addition here to surface in the dump.
 *
 * Output is plain JSON (which is valid JSON5) with 2-space indent,
 * deterministically sorted by kind so diffs are stable.
 */
```

### `packages/codegen/src/emitters/node-model.ts::SerializedNodeBase.forwardsTo`

```text
/** Companion fact to factoryShape 'forwarded': the kind whose constructor
	 *  this kind's factory forwards (see buildFactoryMap.forwardsTo). */
```

### `packages/codegen/src/emitters/node-model.ts::SerializedNodeBase.oneSurface`

Set on a kind with one builder and no strict/coerce pair (`hasOneSurface`). The predicate is the emitter's own, stamped here so a tool that spells calls reads it and does not re-derive it from the kind's shape.

### `packages/codegen/src/emitters/node-model.ts::serializeNode`

#### body

```text
/* Branch/envelope/polymorph read `separator` from the inherited
			   `AbstractAssembledCompound.separator` getter, which is permanently
			   `undefined` for those three (a compound's post-wrapper-deletion
			   `simplifiedRule` never survives as REPEAT-shaped) — surfaced here
			   only for parity with `AssembledList`'s own live override, never
			   actually populated for a compound. */
```

Every node carries its rule's `annotations` (`hoisted`, `variant`,
`variantOf`, …) as written, and `seated` when it seats on its parent; the
tools read `seated`, never `annotations.hoisted`. A seated compound also
serializes `name`.

### `packages/codegen/src/emitters/node-model.ts::serializeSlot`

#### body

```text
/* kinds: derived from values via kindsOf(), not read from a stored
		   cache. */
```

Takes the parent and the polymorph wires so each value can carry its `seat`
(`seatOf` on the parent's wire set).

### `packages/codegen/src/emitters/node-model.ts::seatsOfList`

A list serializes no slots, so its elements seats ride `elementSeats`: one
`Seat` per element value the overlay seats (rust's `_type_arguments_elements`
seating `_type_argument`), read off the list's own wire set. The census
reads it beside the slot seats.

### `packages/codegen/src/emitters/node-model.ts::buildNodeModel`

Collects the polymorph wires once (`collectPolymorphWires`, silent) and
hands each parent's wire set to `seatOf`, so the seats the model stamps are
the routes the overlay emits from the same id tables. `emitNodeModel`
passes the generator's `generatedIdTables` through for that reason.

`textLeavesThrough` publishes `transparentEnvelopeTextLeaves` per envelope, so the loose source emitter predicts which bare strings the coercer routes through an envelope.

`innerGapsKeyed` publishes the predicate that decided whether the emitted `InnerTrivia` takes a gap key, so the source emitter prints the inner-trivia surface that was emitted: `innerAt(gap, …)` when keyed, `.inner(…)` otherwise.

`root` is the grammar's root kind (`NodeMap.root`, the first rule), so tools reparse a rendered root without naming it per grammar.

`externals` and `extras` are the grammar's rule lists, serialized as grammar.json holds them (SYMBOL, STRING and PATTERN entries, in declaration order).

`variantRoutes` publishes `variantRoutePaths` — each flattened variant kind's public `ir` path — sorted by kind, so tools read the one derivation instead of reconstructing paths from `polymorphVariants` and hoisting facts.

Each kind that takes a bare input on the loose surface also carries
`bareAccepts`: the kind names its bare input admits, transitively, read from
the same `bareAcceptClosure` the from emitter turns into `_BARE_ACCEPTS`.
A tool that has to predict what the coercer wraps (the loose rebuild
printer) reads the stamp rather than re-walking wrappers and lists. The
kind entries come from the same `collectKindEntries` call the from emitter
makes, so the two closures cannot differ.

### `packages/codegen/src/emitters/node-model.ts::serializeValue`

A slot value declared with `arm.default` serializes `default: true`, the
one fact the loose surface's bare-value hoist reads; every other value
omits the key.

### `packages/codegen/src/emitters/kind-discriminant.ts::module`

```text
/**
 * Shared helpers for emitting `$type` discriminants per the KindID
 * runtime migration design (2026-04-30): runtime objects carry numeric
 * `TSKindId.X` discriminants where `X` is the parser.c-derived ID.
 *
 * Kinds without a parser symbol (TSGrammar-only inlined rules) fall
 * back to string-literal discriminants — they never carry a runtime
 * `$type` on a parsed tree, but emitter sites that reference them
 * still need *some* expression.
 *
 * Used by both `types.ts` (interface declarations) and `factories.ts`
 * (factory body literals) so both surfaces agree on the same
 * discriminant expression for each kind.
 */
```

### `packages/codegen/src/emitters/index-file.ts::emitIndex`

The grammar's `index.ts`: the language descriptor as the default export (its name, and a `load` that imports `./api.js` on demand, so importing the package's descriptor loads no factories and no native binding; its `createEngine` imports `@sittir/common` on the first call for the same reason, and delegates to the one `createEngine` there), the language API type, and the grammar's types, re-exported type-only. Builders, guards and kind ids are values reached through an engine (`engine.build`, `engine.is`, `engine.kinds`), never through the package index; the descriptor is its only value export. It depends on the grammar's name only, not on its node list.

The descriptor carries `fileTypes`, the model's file types, an empty list for a grammar with none.

### `packages/codegen/src/emitters/transport-projection.ts::TransportLiteral.immediate`

```text
/** Grammar-immediacy stamp of an INLINE terminal value (`token.immediate`
	 *  threading) — kind-named literals resolve immediacy via their kind
	 *  instead (`isImmediateLeafKind`); inline terminals have no kind to
	 *  look up, so the stamp must ride the literal itself. */
```

### `packages/codegen/src/emitters/transport-projection.ts::terminalTransportLiteralForKind`

```text
/** The transport literal a kind name contributes: its storage target's
 *  fixed text and resolved symbol when that target is a fixed-text leaf
 *  (`isFixedTextLeaf`: a keyword or token, reached through a
 *  single-subtype supertype chain), else `undefined` — an enum target has
 *  a member set, not one literal. */
```

### `packages/codegen/src/emitters/transport-projection.ts::isConcreteTransportNode`

#### body

```text
/* 'list' shares 'branch's transport-concreteness — see
		   isSlotBearingCompound's doc comment (shared.ts). */
```

### `packages/codegen/src/emitters/transport-projection.ts::TransportProjection.wireIds`

Every id a kind's values are stored under, by kind, gathered from every
literal component before the literal list dedupes by kind and text. A
hidden fixed-text kind (rust's `_range_expression_bare`) is spliced out of
the parse tree, so its values arrive under the token that spells it (`..`);
the fixed literal's own decoder accepts these ids beside its own
(`collectFixedLiterals`).

### `packages/codegen/src/emitters/transport-projection.ts::collectTransportLiterals`

Also records `wireIds`: each literal's resolved id under its kind, for every
site, including the kind-derived literals the list then drops.

#### body

```text
/* The node-kind guard only applies to KIND-DERIVED literals (their `kind`
		   names a real transport node, whose struct already covers the value — a
		   Literal unit variant would duplicate it). Bare literal TEXTS must not
		   be name-matched against node kinds: a keyword text that happens to
		   spell a rule name (e.g. python's `'type'`) is a DIFFERENT parser
		   identity (anon token) and dropping it here left the anon token's kind
		   id with no AnyTransport arm at all. Genuine id collisions are deduped
		   at arm emission (emittedNodeIds). */
```

### `packages/codegen/src/emitters/consts.ts::module`

Emits `consts.ts`: the runtime tables generated code reads from the grammar
package itself. Consumes the NodeMap directly.

### `packages/codegen/src/emitters/consts.ts::emitConsts`

Prints `TOKEN_INTERIORS` (read by the generated `wrap.ts` and
`factories/coerce.ts`), `INNER_GAPS` (read by the generated `utils.ts`) and,
when a grammar has bitflag fields, their enums (read through the imports
`types.ts` builds with `resolveBitflagConstName`). Kind names and ids are not
repeated here: `KIND_NAMES` and `TSKindId` in `types.ts` are their one source.

### `packages/codegen/src/emitters/consts.ts::bitflagMemberName`

#### body

```text
// Pure-punctuation mnemonic fast path — produces distinct names
// for common operators without depending on word segmentation.
```

#### body

```text
// Unknown punctuation — hash the literal's char codes into a
// stable suffix so repeated fallbacks don't collide. Prefixed
// `Op_` to make it readable + obviously-a-fallback at a glance.
```

#### body

```text
// Prefix a leading digit so the name is a valid identifier.
```

### `packages/codegen/src/emitters/kind-id-rust.ts::module`

```text
/**
 * Per-grammar Rust `KindId` constants emitter (Phase B prep, 2026-04-30).
 *
 * Outputs a single `kind_ids.rs` source that exports one `pub const`
 * per kind in `kindEntries`, matching the TS-side `TSKindId` enum values.
 *
 * Keys use SCREAMING_SNAKE_CASE derived from the PascalCase `typeName`
 * that `kindIdMemberName` returns. Leading underscores are preserved for
 * hidden-kind sources (e.g. `_FieldIdentifier` → `_FIELD_IDENTIFIER`).
 *
 * This emitter is intentionally **not wired into `generate.ts`** yet —
 * Phase A is still landing. Export-only; the CLI will wire it after Phase A
 * merges to avoid concurrent-edit conflicts on `generate.ts`.
 *
 * Reuses `collectKindEntries` + `kindIdMemberName` from `kind-discriminant.ts`.
 * No logic is duplicated — those two helpers are the single source of truth
 * for the kind-to-member mapping.
 */
```

### `packages/codegen/src/emitters/factories.ts::module`

```text
/**
 * Emits factories.ts — consumes NodeMap directly.
 *
 * Owns ALL factory string generation. Rule.ts exposes the IR
 * (AssembledNode class hierarchy, derivation functions) but does
 * not know how to spell a factory. This file dispatches on
 * `node.modelType` and calls model-specific helpers locally.
 */
```

```text
/**
 * Taxonomy-keyed factory dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
```

### `packages/codegen/src/emitters/factories.ts::FieldCarryingNode`

```text
// ---------------------------------------------------------------------------
// Field-carrying factory (branches, groups, polymorph forms)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factories.ts::kindEnumMemberDiscriminants`

The kind discriminant of each literal member of a kind-enum or mixed-enum slot: every literal the slot stores by kind id, keyword or punctuation (scm's punctuation-backed mixed enum passes `TSKindId.Underscore`). The single-branch fast path in `from.ts` passes them as the alternate kinds of `_resolveOneBranch`, so a stored literal node (`{ $type: AsyncKeyword }`) in a slot that also admits one node branch (rust `function_modifiers`: keywords beside `extern_modifier`) is kept as itself instead of being wrapped into the branch. The literal members are not among the slot's leaf or branch kinds, so without them the slot reads as a single branch.

### `packages/codegen/src/emitters/factories.ts::kindEnumTextMapExpr`

```text
// Exported: from.ts's resolver emission shares this map builder (it
// previously had its own duplicate emitting runtime `kindIdFromName(text)`
// lookups — which resolve literal texts through the name-polymorphic
// runtime switch and reintroduce the #129 shadowing at runtime).
```

#### body

```text
// Every text below is a LITERAL TOKEN TEXT (enum member values and
// terminal STRING values), so resolution goes through the literal-aware
// lookup — the anonymous token must win over a same-spelled named rule
// (#129: python's `'type'` keyword stamped the `type` RULE's id, which
// the transport dispatched to TypeTransport → "Missing field `_content`").
```

#### body

```text
// Same wire-identity derivation as kindEnumTextIdPairs/
// classifyFieldStorageInfo — see keywordRefWireIdentity
// (shared.ts) for the alias vs hidden-inlined split.
```

#### body

```text
// the enum node's construction-time literal-chain record is
// authoritative and already carries the stamped id (`rec.id`)
// — resolve straight from it via kindDiscriminantExprForId
// rather than re-deriving one from `rec.kind` through a fresh
// name-keyed catalog scan. The old chain remains only for
// catalog-less construction (fixtures).
```

#### body

```text
// the mint ID stamp (resolvedKindId, minted through the literal
// chain) is authoritative when present — the resolvedKind NAME is
// not a resolution key (a link-minted name can collide with a rule
// name; the id cannot). Chain fallback for stamp-less values
// (fixtures); genuinely kindless literals skip.
```

### `packages/codegen/src/emitters/shared.ts::kindEnumTextEntries`

The text → discriminant rows behind `kindEnumTextMapExpr`, each flagged `keyword` when its text is a keyword: a fixed-text leaf whose model type is `keyword`, an enum member whose kind (or literal's catalog kind) is a keyword kind, or a terminal whose literal's catalog kind is one. Fixed-text values resolve through `fixedTextEntryOf`, the same derivation `emptyDefaultOf` uses for a default.

### `packages/codegen/src/emitters/shared.ts::fixedTextEntryOf`

The text → discriminant row for one fixed-text value — a reference to a fixed-text leaf, or a literal terminal — or `undefined` for any other value or one with no catalog kind. A leaf reference resolves its wire identity through `keywordRefWireIdentity`; a literal resolves through its stamped `resolvedKindId`, falling back to the catalog row for its text.

### `packages/codegen/src/emitters/shared.ts::isKeywordKindIn`

True when a kind name is a keyword kind in the node map; the test behind every text row's `keyword` flag.

### `packages/codegen/src/emitters/factories.ts::keywordArmTextMapExpr`

The keyword rows of `kindEnumTextEntries` as an emitted `[[text, kindId], …]` literal, or `[]` when the slot declares no keyword arm. It is the table `_keywordOf` searches in a loose resolver; its rows come from `keywordArmTextEntries`, the same rows `seatedKeywordTexts` reads.

### `packages/codegen/src/emitters/factories.ts::keywordArmTextEntries`

The slot's keyword-arm rows: `kindEnumTextEntries` filtered to `keyword`. The single source for both the loose keyword extraction table and the strict keyword-text check.

### `packages/codegen/src/emitters/factories.ts::seatedKeywordTexts`

The keyword-arm texts a strict slot refuses as an identifier: the texts of `keywordArmTextEntries` when the slot's text leaves include the grammar's word kind, else none. A slot whose word leaf cannot be seated has nothing to confuse with its keyword arms.

### `packages/codegen/src/emitters/factories.ts::keywordTextRejection`

Wraps a slot's admitted value in `rejectKeywordText(value, '<Kind>.<configKey>', <word kind id>, [<texts>])` when `seatedKeywordTexts` is non-empty. It runs after `bareTextRejection`, on the built value, so it sees only nodes. Its one job is the message: an identifier spelled as one of the slot's keyword arms is rejected, naming the slot; it does not look up or build the arm.

### `packages/codegen/src/emitters/factories.ts::slotStorageFromValueExpr`

#### body

```text
// The storage type the node interface declares for this slot
// (types.ts: a kind-enum member id, or an array of them).
```

### `packages/codegen/src/emitters/factories.ts::slotStorageExpr`

A slot that can default to its empty form stores `orDefault(<config value>, () => <empty factory>())` and never `<config value> ?? <empty factory>()`: the `??` expression reduces the union of the two operands, which exceeds the checker's depth when one holds a node's `.Bound` beside its storage type.

#### body

```text
// types.ts declares every multiple field's accessor as always returning
// an array, never `| undefined` — storage draws no distinction between
// "empty array" and "absent" for array-shaped slots; "must have at least
// one" is enforced elsewhere (the Config type's required key, or
// `_assertNonEmpty` at the from.ts boundary), not by leaving storage
// `undefined`. Default here unconditionally for any multiple field so a
// bypassed/omitted value still stores `[]` rather than `undefined`.
```

#### body

```text
// A required field alongside an optional sibling (e.g. async_block's
// body next to move) is what makes `config` itself defaultable to
// `{}` (argumentOptional, above) — reading it bare would then silently
// store `undefined` instead of the empty construction that field's own
// omission means. `emptyDefaultOf` is the same fact `emitBranchFrom`
// (from.ts) already applies on the loose surface.
```

### `packages/codegen/src/emitters/factories.ts::defaultedValueExpr`

A slot's value expression with its omission filled: `(<value> ?? [])` for a multiple slot (a slot the model marks non-empty is not defaulted: its type requires the value, and an omitted one fails where it is used instead of building an empty required list), `orDefault(<value>, () => <default>)` when `emptyDefaultOf` gives the slot a default, and the bare value otherwise. `slotStorageExpr` applies it to a config key; the direct-value surface applies it to `value` when that slot holds fixed text.

### `packages/codegen/src/emitters/factories.ts::fieldElementType`

#### body

```text
// Missing kind — factories can't register for stub emission
// (types.ts owns that side). Fall back to the `T.` prefix so
// the reference at least links against whatever stub types.ts
// emits for its own missing kind.
```

### `packages/codegen/src/emitters/factories.ts::declaredDelimiterDefault`

The grammar's declared default for a separated list's `<slot>_delimiter`
site, else `Delimiter.None`, as a `Delimiter` member. It is the same fact the
render table's default is made from. A list factory does not stamp it: a list
built without a delimiter leaves `_delimiter` unset, and the render takes the
default from the options table, the one channel for preference defaults. The
node model records it for tools that compare a list's delimiter with its
default.

### `packages/codegen/src/emitters/factories.ts::declaredSeparatorDefault`

The kind-id expression a separated-list factory stamps as `_separator`
when the caller gives none (the typed read stamps the same default when a
parsed list carries no separator token): the grammar's declared `preference('separator',
<kind>)` for that list's `<slot>_separator` site, resolved through the kind
catalog, or `undefined` when the list declares none. With no default the
separator is a required construction input: the list factory's
`separator` option loses its `?`, the overload without options is not
emitted, and the factory throws when a caller omits it.
The grammar reports the omission as a blocking
`separator-default-undeclared` record, so this path is reached only when
the record is floored.

### `packages/codegen/src/emitters/factories.ts::delimiterUnionFor`

```text
/** The `delimiter` option's type for a list with these flank modes. */
```

### `packages/codegen/src/emitters/factories.ts::FactoryParam`

A parameter that holds a node (`admitsNodes`) is typed through `Admit`, so it takes any node of the slot's kinds (built, parsed or a draft) by kind and never the storage shape; a leaf parameter is raw text and is not widened.

```text
/**
 * One factory parameter, resolved once. The label, the rest marker and the
 * optionality have a SINGLE author here; only the type column differs
 * between the strict signature and the loose one.
 *
 * Single-sourcing is the only thing that can catch a drift between the two:
 * a tuple element's label is erased by structural comparison, so
 * `[child: X]` and `[value: X]` are the same type. No type-level pin can
 * see a label diverge — but a reader of the generated surface can.
 */
```

### `packages/codegen/src/emitters/factories.ts::FactoryParam.strictType`

```text
/** The type the builder itself declares. */
```

### `packages/codegen/src/emitters/factories.ts::FactoryParam.looseType`

```text
/** The type a coercing caller may pass for the same position. */
```

### `packages/codegen/src/emitters/factories.ts::FactoryParam.rowLooseOptional`

Whether the loose row's parameter may be left out, where that differs from the strict one. A wrapper around a kind that can be built from nothing takes no argument on the coercing side (`argumentOptional`), while its strict row names the built child.

### `packages/codegen/src/emitters/factories.ts::FactoryParam.defaultValue`

```text
/** Set where the emitted signature defaults the parameter; an
	 *  initializer already implies optionality, and TypeScript rejects
	 *  spelling both. */
```

### `packages/codegen/src/emitters/factories.ts::FactorySurface`

```text
/**
 * A field-carrying factory's calling convention, resolved once: the
 * parameter list the factory declares and how the body reads each slot.
 * `emitFieldCarryingFactory` spells its signature from this, and a
 * namespaced form constructor (`parent.form(...)`) re-declares the SAME
 * parameters for its child — one derivation, two consumers.
 */
```

### `packages/codegen/src/emitters/factories.ts::FactorySurface.param`

```text
/** The parameter the two strings below are rendered from. */
```

### `packages/codegen/src/emitters/factories.ts::FactorySurface.params`

```text
/** Parameter list text, without the parentheses. */
```

### `packages/codegen/src/emitters/factories.ts::FactorySurface.looseParams`

```text
/** `params` with the parameter's type widened to what a COERCING caller
	 *  may hand it — same label, same optionality, same rest marker.
	 *
	 *  Both tuple aliases are projections of these two strings
	 *  (`paramsToTuple`), never independently composed. */
```

### `packages/codegen/src/emitters/factories.ts::FactorySurface.args`

```text
/** Forwarding call arguments for `params` (`...children`, `config`, …). */
```

### `packages/codegen/src/emitters/factories.ts::declarationParams`

```text
/** A parameter list as it must appear where an INITIALIZER is illegal — an
 *  overload declaration and a tuple element both reject `= {}`, so the
 *  defaulted parameter re-declares as an optional one. One rewrite, for
 *  every consumer including parameter lists resolved elsewhere
 *  (`constructorSurface`) that never passed through a `FactoryParam`. */
```

The rewrite consumes only the initializer (`= {}`), never what follows it: a defaulted `config` followed by a spelling `options?` keeps both parameters, so an all-optional kind with a registered option declares `[config?, options?]` in its `BuildArgs` / `LooseArgs` as its builder does.

### `packages/codegen/src/emitters/factories.ts::paramText`

```text
/** Render a parameter's signature text against one of its two type columns.
 *  A rest parameter is never `?`-marked, and a defaulted one carries its
 *  initializer instead of the marker. */
```

### `packages/codegen/src/emitters/factories.ts::renderSurfaceParams`

```text
/** The strict and loose renderings of one parameter — the only place either
 *  string is composed. */
```

It also answers the parameter's arity: 1, or none (unbounded) for a rest parameter. `resolveFactorySurface` adds 1 when it appends the spelling `options?`, so the count and the text come from the same parameter list.

### `packages/codegen/src/emitters/factories.ts::paramsToTuple`

```text
/** A parameter list as a tuple type — labels, optional markers and the rest
 *  element all survive verbatim. The tuple is a PROJECTION of the signature
 *  string, so the two can never spell the calling convention differently. */
```

### `packages/codegen/src/emitters/factories.ts::looseValueOf`

```text
/** The type a COERCING caller may pass for a node-valued parameter. The
 *  widening itself lives on the model (`LooseValue` reuses the same
 *  projection `Loose` applies to a children slot); the emitter only names
 *  the application, because open-coding leaf-vs-branch or brand handling
 *  here would re-derive predicates the type layer already owns. */
```

### `packages/codegen/src/emitters/factories.ts::resolveFactorySurface`


The direct-value parameter is optional when its slot is optional or holds fixed text (`holdsFixedText`). A fixed-text slot then stores `defaultedValueExpr(value)`, so `buildLazy()` fills `?` itself.

A node with registered slots takes an options argument. It trails a direct value or a config (`options?: T.<Kind>.Options`). On a spread surface it leads instead (`leadingOptions`): the builder is emitted as two overloads, `(...children)` and `(options, ...children)`, over an implementation that splits the arguments with `leadingOptionsSplit`, and its setters pass the options on.

#### body

```text
// The spread surface: a sole MANY-arity slot, taking `...children`
// positionally. A sole SINGULAR slot takes the direct-value path below
// instead, named or not — the model names every slot, so the surface is
// chosen by arity alone. Never applies to 'group': polymorph FORM
// factories are always field-carrying.
```

#### body

```text
// Gap 5: Single-field-no-children factories take the value directly
// instead of a config object. `resolveDirectFactorySlot` is the single
// derivation of this calling convention, shared with
// `classifyFactoryShape` so the emitted signature and the shape
// metadata can never disagree.
```

#### body

```text
// The slot's own element type, spelled the same way the spread surface
// spells it. Indexing `Config` instead re-projects the slot through the
// config surface and loses the union of kinds it actually admits.
```

#### body

```text
// A POSITIONAL parameter, so its identifier is invisible to callers and
// carries no contract — the same reason the container surface above
// spells its own `child` / `...children`. `value` matches what the
// `$with` setter already calls its parameter, and it keeps a slot named
// for a reserved word (`arguments`, `function`) from ever reaching a
// binding, which is the one position where such a name is illegal.
//
// `paramName` stays on the model for a positional-parameter surface,
// where several parameters must be spelled apart from each other.
```

#### body

```text
// The field's own value, widened. Indexing `Loose` instead
// (`T.X.Loose['key']`) would reach through its UntypedNode passthrough
// arm and re-admit the interface's accessor signature as a config
// value — the leak the `Loose` projection already suffers.
```

#### body

```text
// When opt is '?' (all fields optional), a local `_config` default lets
// property access use `config.x` (no optional chaining) — only when the
// body actually reads from config.
```

#### body

```text
// A config parameter's loose counterpart is the kind's own `Loose` — the
// only projection that reads the from-only (`__looseHints__`)
// widenings, which a per-value widener applied to `Config` cannot reach.
```

#### body

```text
// A local default lets the body read `config.x` without optional
// chaining, and only pays off where the body reads config at all.
```

### `packages/codegen/src/emitters/factories.ts::constructorTargetKind`

```text
/**
 * The kind whose constructor arguments a form constructor takes: a
 * forwarding factory (see `forwardedTargetKind`) hands its target's
 * arguments straight through, transitively.
 */
```

### `packages/codegen/src/emitters/factories.ts::forwardedConstructorTarget`

The kind a field-carrying factory forwards its argument to, when its strict builder is a forwarding wrapper: the node takes a direct value (`directParamType`), `forwardedTargetKind` names a target, the target has a catalog entry, the target's constructor does not resolve (`constructorTargetKind`) to a pattern leaf, and the target is not a hoisted config-shaped group (which splices through its seat instead). `emitFieldCarryingFactory` emits the forwarding overloads exactly when this answers a kind; `listSpreadTarget` reads the same answer.

A chain that ends in a pattern leaf forwards nothing, because that leaf's constructor takes text (or a number, for a numeric leaf) and a strict builder takes no text: building a leaf from a scalar is coercion, and the loose entry does it. Such a kind's strict builder takes the built leaf only, and refuses bare text at run time (`rejectBareText`).

### `packages/codegen/src/emitters/factories.ts::forwardedConstruction`

The overload list of a forwarding strict builder, as a value: the kind's own parameters, then each parameter list the target's constructor declares (`constructorSurface`; a target with no constructor surface forwards the target builder's own arguments), with an empty list first. It carries the list twice, in the two spellings the two readers need: `overloads` for the builder's declarations in `raw.ts`, and `rows` as tuples for `types.ts`, where a target with no constructor surface is named by its row (`T.<Target>.BuildArgs`) because the types module does not see the factories. `emitFieldCarryingFactory` writes the declarations from it and `fieldCarryingBuiltTypeSurface` writes `BuildArgs` as the union of its rows, so a strict row cannot omit an overload the builder declares. `null` when the kind forwards nothing.

A node with registered slots does not offer a spread target's own forms (`restForwardTarget`): its options argument trails its value, so it cannot also take the target's items, and its loose builder takes no spread either (`listSpreadTarget`). It still forwards, so it still builds from no argument when its target can be empty.

### `packages/codegen/src/emitters/factories.ts::restForwardTarget`

The forward target of a kind whose constructor chain ends in a kind built from its elements (factory shape `elements` or `spread`), whatever the kind's own registered slots.

### `packages/codegen/src/emitters/factories.ts::listSpreadTarget`

The forward target of a kind whose strict builder accepts the spread of the child it wraps (`parameters(a, b)` for `parameters` → `parameters_elements`, `string(a, b)` for `string` → `string_content`): `forwardedConstructorTarget` names a target whose constructor chain ends in a kind built from its elements, a list or a compound with one multiple slot (factory shape `elements` or `spread`), and the kind registers no spelling slot (a spelling wrapper forwards only its first argument). The strict wrapper, the loose coercer's spread overload (`emitBranchFrom`), and the `BuildArgs` / `LooseArgs` tuples (`fieldCarryingBuiltTypeSurface`) all read this one answer, so the loose surface accepts at least what the strict one does.

### `packages/codegen/src/emitters/factories.ts::RowParam`

The single parameter of a one-argument kind's row, in parts: its label, the strict and the loose type, whether each side may leave it out, and the trailing `options?:` text when the kind has a registered spelling. `rowTuple` turns it back into the tuple text for one side, given the parameter type, which is the kind's own or a seated one built on it.

### `packages/codegen/src/emitters/factories.ts::rowParamOf`

Reads a `RowParam` off a kind's factory surface: the row types as `paramsToTuple` prints them (the strict one through `Admit` where the parameter holds a node), the loose optionality from `rowLooseOptional`, and the options text from the same `spellingTypeOf` fact the raw factory's trailing parameter comes from.

### `packages/codegen/src/emitters/factories.ts::fieldCarryingBuiltTypeSurface`

The construction surface of a field-carrying kind, from its factory surface: the `$with` setters, and the `BuildArgs` / `LooseArgs` tuples from the surface's row parameters. The `BuildArgs` of a kind whose strict builder forwards to its child's constructor is the union of that builder's overloads (`forwardedConstruction`): the child itself, the child's config, the child's content, or the child's elements, each typed by the child's strict types. An own-text leaf (`ownTextLeaf`) has one row for both, `ownTextArgs`, and takes at most two arguments. A kind with a `listSpreadTarget` unions its tuples with the target's own (`… | T.<Target>.BuildArgs`), by name, so the spread form is the list's derivation rather than a copy; its `maxArgs` is then unbounded.

A repeat-slot spread kind also accepts a single readonly array on its loose surface. This row uses the same loose element types and cardinality as its spread parameters. Leading options apply to both the spread and array forms.

### `packages/codegen/src/emitters/factories.ts::constructorSurface`

```text
/** The parameters a form constructor declares for `kind` and how it
 *  forwards them — the target factory's own surface. An enum-of-literals
 *  target takes `value: <member-id union>` (`enumMemberDiscriminant`):
 *  there is no enum factory to forward text to.
 *
 *  `looseParams` is the same list widened to what a COERCING caller may
 *  pass, and is present only where the target's factory surface renders
 *  one: a text leaf accepts its own loose input already, and a separated
 *  list has no loose element rendering to project. Absent means "no loose
 *  form distinct from the strict one", which is what gates the loose
 *  mirror in `formLooseSurface`. */
```

#### body

```text
// With per-instance options the list factory dispatches on its
// first argument (`fn(...elements)` / `fn(options, ...elements)`);
// the hoisted form keeps that one surface.
```

#### body

```text
// The chain's final surface may declare a required param even
// though an earlier hop's slot is optional (e.g. a `pub` arm
// whose parenthesized group is optional): re-apply the lost
// optionality to the single-value param form. `argOptional`
// tells the caller to guard the forward — the target's own
// overloads need not accept undefined for this param type.
```

#### body

```text
// Fixed-text leaf: its factory takes no arguments (`buildCrate()`).
```

#### body

```text
// Free-text leaf: its factory takes the raw text.
```

#### body

```text
// Literal-union leaf: same shape, narrowed to the declared values.
```

A list target's surface is the overload pair the list factory itself carries,
`(options, ...elements: NonEmptyArray<E>)` then `(...elements: NonEmptyArray<E>)`,
never one permissive `...args: (Options | E)[]` that admits a lone options bag
and so zero elements for a `repeat1` list. Overload order is load-bearing: the
coercers reach these builders through `Parameters<typeof F.build<Kind>>`, which
resolves to the last declared overload, so the elements-only form is declared
last. The arity is a type-level contract only; `_assertNonEmpty` stays behind
`SITTIR_DEBUG`, and a `repeat1` list takes no spread of a possibly-empty array
(`T[]` is not `NonEmptyArray<T>`).

A compound target whose builder takes leading options declares both forms as `paramsOverloads`, the options-led one first, so a forwarding builder offers the same pair.

### `packages/codegen/src/emitters/factories.ts::BuiltTypeSurface`

```text
/**
 * A kind's construction surface as type text, owned by the types emitter
 * and merely referenced by the factory. `extendsList` + `members` are the
 * body of `namespace <Kind> { export interface Built … }` — the concrete
 * interface plus construction metadata, the `$with` setter record and the
 * shared `NodeMethodsOf` tail — and `buildArgs` / `looseArgs` are the
 * calling convention as tuples, emitted as `<Kind>.BuildArgs` /
 * `<Kind>.LooseArgs` aliases. The text is written against the `T.` alias,
 * so it is valid both in `raw.ts` (which imports `T`) and in `types.ts`
 * (which imports itself as `T` for exactly this).
 *
 * Three cycle rules decide the shapes. `Built` is an INTERFACE, not an
 * alias, because its setters return itself and an interface's members
 * resolve lazily. The `<Kind>Ns` row passes `<Kind>.Bound` /
 * `<Kind>.BuildArgs` / `<Kind>.LooseArgs` by NAME: a base-type argument is
 * resolved eagerly, and an inline tuple whose `LooseValue<…>` walks
 * `NamespaceMap[arm]` for a union containing the kind itself reaches the
 * row being declared (TS2310). The strict tuple spells the config as
 * `ConfigOf<T.<Kind>>` rather than `<Kind>.Config` (`rowStrictType` on the
 * factory param), because that namespace member is a projection OF the row.
 * The loose tuple names `T.<Kind>.Loose` (`rowLooseType`): `Loose` is
 * computed from the kind's interface and its bare slot, never from the
 * tuples, so the reference does not come back to the row. The setter record's `T.<Kind>.Bound` is also what keeps declaration
 * emit finite: an inferred recursive `$with` closure blows the serializer
 * (TS7056) and the package cannot publish types. And a separated list's
 * tuples spell a non-empty element list as `[element: E, ...elements: E[]]`
 * (`listRestParamType`), never as `[...elements: NonEmptyArray<E>]`: a variadic
 * spread of an alias makes the whole tuple alias resolve eagerly, and the
 * loose element's widening walks each element kind's bare slot straight back
 * into the list's own row while that row's base types are still resolving
 * (TS2310). A rest element that is an array type keeps the alias deferred.
 *
 * `buildArgs` names the argument lists the kind is built through, as a
 * tuple or a union of tuples. For most kinds that is one signature. A
 * separated list's is every form its call takes: the elements alone or the
 * options bag first. A kind that forwards to a list (`listSpreadTarget`)
 * unions the list's tuples into its own, so neither needs a second spelling
 * of the other's arguments. One strict overload is still outside the
 * tuples: a wrapper that forwards to a kind that is not a list also accepts
 * that target's constructor arguments in its strict builder, and its strict
 * row names the direct form only. Its loose row is the wrapper's own `Loose`,
 * which holds the target's config, so the loose row is every form the
 * coercing call takes. The tuples are derived from the
 * factory shape, never from the function: `Parameters<typeof build<Kind>>`
 * resolves to the last overload only.
 * `looseArgs` is the same arity and the same labels with every parameter
 * widened to what a coercing caller may pass.
 */
```

`row` is the one-parameter row in parts (`RowParam`: label, the strict and loose types, each side's optionality, the trailing options), for a kind whose call takes a single config or value. The overlay reads it to print a seated kind's rows (`seatedRowsOf`), so the seated form is built on the same parameter the plain row prints.

`setters` is the surface's slot setters as parts (`SlotSetter`): the one derivation of what each `$with` setter takes. The interface's `$with` record prints them, and the types emitter stamps the same parts as `__slotHints__`, so the two cannot disagree. A leaf has none.

`maxArgs` is the most arguments the calling convention accepts, beside the tuples it counts: the factory surface's `arity`, 1 for a leaf, 1 or 2 for a refine form (its config, plus its options when it has registered slots), and none for a list or for a kind that forwards a wrapped-list spread, whose tuples end in a rest element. `bundleEntries` reads it to stamp the hoisted builder.

### `packages/codegen/src/emitters/factories.ts::listBuiltTypeSurface`

The construction surface of a separated list. Its `BuildArgs` / `LooseArgs` are every argument list the list's public call takes, spelled once here by `listRestParamType`; the coercer takes the `LooseArgs` row by name. The forms are the elements alone, and the options bag first when the list has options. An element is the list's own element type, on the loose row also the list's own `Loose` (the list itself or its config, which the coercer unwraps), or, when the list seats a hoisted group (`emittedElementsSeats`), that group's config (`T.<Group>.BuildArgs[0]` / `.LooseArgs[0]`), by name. A kind that forwards to the list unions these rows into its own (`fieldCarryingBuiltTypeSurface`), so an owner's row takes whatever its list's row takes without a second spelling.


### `packages/codegen/src/emitters/factories.ts::builtTypeSurfaceOf`

```text
/** The one derivation of a kind's {@link BuiltTypeSurface}, by factory
 *  shape: a separated list, a slot-bearing compound (config, direct or
 *  spread convention), or a text-constructible leaf. Keyword kinds have no
 *  surface here — their `Built` is the id (`KeywordNs`). The types emitter
 *  calls it for every namespace row; the factory emitter no longer emits
 *  the aliases it used to, it annotates each builder with `T.<Kind>.Bound`
 *  and lets the types emitter define it. */
```

### `packages/codegen/src/emitters/factories.ts::refineFormBuiltTypeSurfaceOf`

```text
/** The {@link BuiltTypeSurface} of one refine form: the parent's interface
 *  with setters for every non-narrowed slot, self-referencing
 *  `T.<Kind>.<Form>.Bound`, and the form's own `config` tuple. */
```

### `packages/codegen/src/emitters/factories.ts::setterTypeMember`

Prints one `SlotSetter` as its `$with` type member: a rest signature when the setter takes rest arguments, else a single `value` (optional when the slot is). It only prints; `slotSetter` decides what the setter takes.

### `packages/codegen/src/emitters/factories.ts::slotSetter`

What one slot's `$with` setter takes, as parts. Every multi-valued slot takes rest arguments (`restSetterType`); any other slot takes one value, typed through `setterElemType`. The factory `$with`, the form `$with` and the wrap `$with` all ask this one derivation whether a setter is rest, so a list setter has the same call shape in every grammar and on parsed and built nodes alike.

### `packages/codegen/src/emitters/factories.ts::restSetterType`

The rest-parameter type of a multi-valued slot's setter, or nothing for a slot that holds one value. The element is the slot's construction element type when its storage is verbatim, and the element of the config field's array otherwise (a list that mixes nodes with terminal tokens, such as statements with `;`, stores a projected form, so its element type is read off the config). A non-empty slot takes `NonEmptyArray`. The emitted setter passes its arguments through `restItems`, which refuses one array given in place of the items: without that, a rest setter called with an array would store a nested array and fail later, in the native transport, with a message that names no slot.

### `packages/codegen/src/emitters/factories.ts::SlotSetter`

A slot's setter as parts: the accessor `name`, the `input` type text, whether the slot is `optional`, and whether the setter takes the input as `rest` arguments.

### `packages/codegen/src/emitters/factories.ts::valueKindIdExpr`

```text
/** The kind-discriminant expression for a value's stamped storage, or
 *  `undefined` when the value is not stored as a kind id. Three facts gate
 *  it, each resolved once elsewhere and only read here: the value's
 *  `storage.via` must be `kindId`, a kind catalog must be in scope, and the
 *  owning slot must store ids at all (`slotStoresKindIds`) — a verbatim
 *  slot seats raw text with no coercion call, so an id there would land a
 *  number where render expects a string. Identity only: the stamped
 *  `kindId`, else the stamped `kind`, is looked up directly and, if the
 *  catalog lacks it, the answer is `undefined` rather than a text match —
 *  a text match cannot tell two kinds apart when they share a literal, and
 *  several do (`;` is the whole body of a unit struct's arm, an empty
 *  impl's, and a bodyless module's). This is the single site that turns a
 *  storage stamp into an emitted discriminant; every emitter that needs
 *  one calls it. */
```

### `packages/codegen/src/emitters/factories.ts::valueStorageExpr`

```text
/** The strict value expression a value arm seats: `valueKindIdExpr` when
 *  the storage resolves to a kind id, else the text quoted for source.
 *  Used wherever an arm's value is emitted as a runtime argument (the
 *  polymorph overlays and the generated node tests); type positions use
 *  `valueKindIdExpr` directly with their own `JSON.stringify` fallback so
 *  the two quoting conventions never diverge in what kind they name. */
```

### `packages/codegen/src/emitters/factories.ts::slotStoresKindIds`

```text
/** Whether a slot's storage encoding holds kind ids at all — true for
 *  `kindEnum` and `mixedEnum`, and when no slot verdict is in scope. This
 *  is the slot-level half of the storage decision: the per-value stamp says
 *  whether a value IS an identity-only arm, this says whether the slot has
 *  anywhere to put an id. They are orthogonal and both are needed; neither
 *  alone can decide what a mixed slot's token arm seats. */
```

### `packages/codegen/src/emitters/factories.ts::kindEnumTextExpr`

```text
/** The discriminant for a bare text with no value in hand — the generated
 *  tests' dummy-value path reads a kind-enum slot's first text without
 *  walking its values, so the only handle is the text: matched against the
 *  catalog's literal entries, else quoted. The one place a text match is
 *  the lookup; every value-bearing site goes through `valueKindIdExpr`. */
```

### `packages/codegen/src/emitters/factories.ts::elementsTypeOf`

```text
// ---------------------------------------------------------------------------
// SeparatedList factory (separator-as-slot)
// ---------------------------------------------------------------------------
```

```text
/** The rest-spread type for a list of `elemType`: a `repeat1`-sourced list
 *  demands its first element and says so on the model. ONE rule, shared by
 *  the list factory's own signature and by its `LooseArgs` counterpart. */
```

### `packages/codegen/src/emitters/factories.ts::parenthesizeUnion`

Wraps an element type in parentheses only when it has a union at its top level. A union inside generic arguments (`Admit<A | B>`) is atomic and stays bare before an array suffix.

```text
/** `fieldElementType` doesn't parenthesize multi-member unions (unlike
 *  `childElementType`) — guard the bare-array case, or `A | B[]` binds
 *  `[]` to `B` alone. */
```

### `packages/codegen/src/emitters/factories.ts::separatedListSurface`

```text
/**
 * A separated list factory's calling surface: the elements rest type and,
 * when the list has per-instance options (a nonterminal separator or an
 * optional flank), the leading options bag — `fn(...elements)` /
 * `fn(options, ...elements)`. Shared by the list factory's own signature
 * and by form constructors that hoist it.
 */
```

#### body

```text
/** Present when the sole element kind is a transparent wrapper (see
	 *  transparentWrapperContentSlot): the loose element union admits the
	 *  wrapper's content directly, and the factory wraps bare content. */
```

#### body

```text
/** The UN-widened elements tuple — what storage actually holds after
	 *  the factory's wrap pass; Built assignability depends on it. */
```

#### body

```text
// Outer gate matches wrap.ts's `emitSeparatedListWrap` and render-module.ts's
// `renderTransportDataStruct` exactly: `node.separatorRule !== undefined`,
// NOT "at least one candidate resolves in the catalog" — the catalog
// filter is applied only to the candidate LIST inside, same as those two.
// Currently inert (no real grammar kind has a nonterminal separator), but
// keeps the three tasks' gating logic consistent rather than diverging on
// an edge case none of them can reach today.
```

#### body

```text
// `never` when the separator is nonterminal but zero candidates resolve
// in the catalog (mirrors `childElementType`/`fieldElementType`'s own
// zero-parts fallback) — an uninhabited type communicates "no valid
// choice exists" rather than emitting an invalid empty union.
```

The `separator` option is typed by the kind ids of the choice's literal
tokens (`TSKindId.Comma | TSKindId.Semi`), the same tier as every other
preference; the literal texts are not part of the surface.

`storageElemType` is the element type the list stores and its `elements()` accessor returns, before the factory's wrapper alternative is added to `elemType`, so a read loses no content. The option keys come from `listOptionParts`. When the element is a transparent wrapper, `wrapper` also names the wrapper's content accessor (`contentProperty`) and the storage keys of every other slot it has (`decorationKeys`): an element is undecorated exactly when none of those keys holds a value, which is when a list owner's accessor reads it as its content.

### `packages/codegen/src/emitters/factories.ts::listOptionParts`

A separated list's option facts: whether it takes a `separator` and `delimiter` option, the separator kinds it allows, whether the separator is required, and the options type the factory's `options` argument takes (`undefined` when the list has none). One derivation shared by the list surface, the list factory and `listOwnerHint`.

### `packages/codegen/src/emitters/factories.ts::listOptionsType`

The options type a list's factory takes as its leading argument, or `undefined` when it has none. Takes the kind entries because the separator's allowed kinds are catalog kinds.

### `packages/codegen/src/emitters/factories.ts::listViewHint`

Whether a kind reads as a list, as the facts its node surface needs: the item type the list's factory accepts, the options that factory takes (`{}` when it takes none), the list's raw factory, and the accessor and option names the view shares the node with. A kind reads as a list when it is a separated list itself, or when it is a list owner, whose sole content is a separated list (`forwardedTargetKind` names an `AssembledList`, the fact that gives the owner's strict factory its `(options?, ...items)` overloads). Both read as a `ReadonlyArray` of the same items, a transparent wrapper carrying only its content reading as that content, so both forms are in the item type and a read item can be passed straight back to the builder.

Throws when one of the node's accessors or options has the name of a `ReadonlyArray` member (`LIST_VIEW_MEMBERS`): the two would be one property, and neither reading is safe to drop. The fix is to rename the slot in the grammar.

### `packages/codegen/src/emitters/factories.ts::TextFactoryNode`

```text
// ---------------------------------------------------------------------------
// Text factory (leaves, keywords, enums)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factories.ts::emitKindIdFactory`

```text
/** The build entry of a kind stored as its id and given a builder
 *  (`isBuilderTextLeaf`): a constant equal to the kind id — there is no node
 *  to build, the identity is the value, so `build.passStatement` is
 *  `kinds.PassStatement` and is not callable. The name stays `build<Kind>`,
 *  so the irs, the factory map and the bundles that name it as a value read
 *  the constant. The type is written out as the member itself: an inferred
 *  type of an enum member widens to the whole enum, which would drop the id
 *  out of every slot union it belongs to. */
```

### `packages/codegen/src/emitters/factories.ts::kindDiscriminantType`

```text
/** A kind's `$type` discriminant spelled as a TYPE: the `TSKindId` member
 *  when the parser issued an id, else the kind's string literal. The same
 *  text is a valid expression, which is what lets a kind-id factory annotate
 *  and return one spelling. */
```

### `packages/codegen/src/emitters/factories.ts::emitTextFactory`

`typeParams` is written between the builder's name and its parameter list; the word builder passes `<const W extends string>` for its reserved-word check (`buildLeafReConsts`).

#### body

```text
// Emit numeric TSKindId discriminant for leaf / keyword /
// enum nodes, matching the AnyUntypedNode.$type: number contract. Falls back to
// string literal for kinds not yet in kindEntries (TSGrammar-only or no
// parser.c available).
```

#### body

```text
// Leaf/keyword/enum factories — inline literal +
// `withMethods<T>` wrap. No `_<name>` storage (text nodes carry only
// `$text`); no `$with` (no updatable slots).
// A leaf's whole calling convention is its text parameter, so `BuildArgs`
// and `LooseArgs` genuinely coincide — the parameter is already the raw
// text (or, for a keyword, absent), with nothing left to widen.
```

### `packages/codegen/src/emitters/factories.ts::FactoryEmitter`

```text
// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factories.ts::FactoryEmitter.constructor`

#### body

```text
// resolveConfigType() emits `ConfigOf<T.X>` (rather than `T.X.Config`)
// for every refine-form kind's config parameter — import it whenever
// at least one such kind exists.
```

### `packages/codegen/src/emitters/test.ts::module`

```text
/**
 * Test scaffold emitter — consumes NodeMap directly.
 * Generates per-kind tests: factory produces correct type, render returns non-empty.
 */
```

### `packages/codegen/src/emitters/test.ts::emitTests`

An alias kind gets no test of its own: it is not on `ir`, and every parent test that seats one exercises its builder.

#### body

```text
// Use catalog kinds (parser-symbol universe) as the basis for kindEntries.
// TSGrammar-only kinds (no parser symbol) are excluded from the catalog
// and therefore have no factory to test.
```

#### body

```text
// Branch/container/polymorph tests
```

#### body

```text
// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
// never appear at runtime; no factory was emitted for them, so no test.
```

```text
// synthesised group or skipped kind
```

#### body

```text
// Skip kinds whose irKey isn't a valid JS identifier — those are
// anonymous tokens that surface as leaves but can't be accessed
// via `ir.<key>(...)` syntax. The external externals-inheritance
// pass surfaces new such kinds for grammars that declare them.
```

#### body

```text
// Known-failing kind (`expectTestFailures:` in grammar.sittir.ts): emit the
// tests into a scratch buffer, then splice them in as `describe.skip`
// with the declared reason. Skipping at the describe level (rather than
// per-`it`) keeps the override surface to one kind→reason entry.
```

### `packages/codegen/src/emitters/test.ts::rendersText`

True when a kind's render writes non-whitespace text for the arguments the dummy machinery samples. A kind with no body is a leaf and writes its text; a body that `writesText` writes it directly; a supertype writes text when every subtype does; any other kind writes text when some required slot referenced in its body holds only values that write text. A cycle reads as `false`.

### `packages/codegen/src/emitters/test.ts::factoryCallArgs`

```text
/**
 * The arguments a kind's factory call takes in the emitted tests: the
 * minimal (required-only) form for the type check and the render form.
 * Shared by the kind's own test and by the namespaced-constructor tests
 * that build a child through its parent.
 */
```

#### body

```text
// Build two configs. The type-check test uses the minimal config — only
// required, non-auto-stamp fields/children. Auto-stamp slots are excluded
// (the factory stamps them directly; supplying would be a type error).
//
// The render test needs NON-EMPTY output, which the minimal config can
// fail to produce for kinds whose children are all optional (repeat(...)
// with every alt optional — calling ir.k({}) produces an empty repeat
// that renders to ""). So the render test unconditionally injects a dummy
// children element when the kind has a children slot at all, escaping
// the type via `as any`.
```

#### body

```text
// Gap 5: single-field-no-children factories take the value directly.
// Detect and emit a direct-value call instead of a config-object.
// `resolveDirectFactorySlot` is the same derivation the factories and
// from emitters use for the calling convention — a marker-carrying kind
// (e.g. class_static_block's automatic_semicolon) is config-shaped, and
// a direct-value call against its config coercion would hit the
// UntypedNode passthrough and return the child unchanged.
//
// Excludes a sole field backed by a KindEnum (e.g. debugger_statement's
// `semicolon`, coerced via coerceKindEnumStorage in the emitted
// coerceToXxx — kindEnumTextIdPairs is non-empty for it): `ir.<key>`
// resolves to that coerce function, whose declared parameter type is
// `Xxx | {config}` (no bare-value variant), even though `Xxx`'s own
// builder does take the value directly — only `ir.<key>.strict(...)`
// (untested here) matches Gap 5's premise for that shape. The
// object-config form below is always type-correct regardless of field
// shape, since coerceToXxx checks `input.<fieldName>` first.
```

#### body

```text
// Optional field: type test passes no arg; render test passes dummy.
```

#### body

```text
// A required registered slot (e.g. terminator) has no config-object home
// any more and no viable render-time default — a minimal-config render
// call would throw without it, so the caller building the actual `ir.key(
// ...)` call threads a dummy through the trailing options argument the
// factory now takes. Returned separately rather than folded into
// renderConfigArg: some callers (childBareCallArgs) reuse renderConfigArg
// as a value nested inside a larger literal, where a second top-level
// call argument couldn't be spliced in anyway. The options type only
// ever accepts the kind-id form, so this dummy is always built strict.
```

### `packages/codegen/src/emitters/test.ts::soleSlotDummyKind`

The owner's own kind is the path handed to `resolveConcreteKind`, so a slot that admits its owner (python's `parenthesized_list_splat` admits itself and `list_splat`) stubs the other arm.

```text
/** The kind a sole slot's dummy stub is built as: the value's STORAGE kind
 *  first, its parse alias only when there is no node behind it. A stub
 *  stands in for what a caller constructs and what the slot stores; the
 *  parse alias (`parenthesized_expression` for python's inner
 *  `parenthesized_list_splat`) is what tree-sitter labels the node on read.
 *  Stubbed by alias, the value is a foreign kind to the coercer — it used to
 *  pass through unresolved, and once the resolver routed foreign kinds to
 *  the arm that admits them it was rightly rejected as fitting several. */
```

### `packages/codegen/src/emitters/test.ts::childrenCallArgs`

```text
/** The positional argument a container-shape factory call takes in the
 *  emitted tests — a recursively-built dummy when the slot demands one. */
```

#### body

```text
// Candidate kind names for the slot, preferring each value's `parseKind`
// (the tree-sitter-facing, constructable name) over `slotKindNames`'
// storage kind: for an alias-promoted slot (e.g. a hidden rule later
// exposed as its own visible kind), the storage kind is the
// pre-promotion hidden name, which the factory surface no longer
// accepts. Routed through `resolveConcreteKind` exactly like
// `dummyValueForField` — a bare supertype name (e.g. `type`) isn't
// itself constructable; it needs expanding to one of its subtypes.
```

#### body

```text
// A recursively-built dummy (populating the child's own required fields,
// not just its type discriminant) rather than a bare `{ type: X }` —
// the factory's real signature expects full UntypedNode for this slot, not
// a type tag.
```

#### body

```text
// A registered slot with no viable default (e.g. terminator) still has
// to come from somewhere at render time even when the node's own sole
// value is omittable — the value-only placeholder above leaves it unset,
// so a minimal-config render call would throw. Thread a dummy through
// the trailing options argument the direct-shaped factory now takes.
```

Required registered slots get an options object, placed where the builder takes it: before the children on a builder with leading options, after the value otherwise.

### `packages/codegen/src/emitters/test.ts::pushRenderTest`

The render test shared by the config-shaped and children-constructed blocks. An argument that carries content (`emitBranchTest`'s render config with required slots, or a children placeholder) asserts a non-empty render, but only for a kind whose render writes text (`rendersText`). A kind whose only content is layout — a lone newline, a token seam — can render empty at a root, as can an empty argument or `{}` for a kind whose slots are all optional; those cases assert only that render does not throw.

### `packages/codegen/src/emitters/test.ts::emitChildrenTest`

The block carries the shared render test (`pushRenderTest`) after the type test, so a children-constructed kind asserts a non-empty render the way a config-shaped one does.

The placeholder seats the optional single-valued slots of the top-level stub as well as the required ones, and collects the text of every leaf it seats (`DummyOptions.texts`). `pushRenderTest` then asserts the render contains each of them, so a slot that stops reaching the output (extends_clause_single's `type_arguments` is the case that motivated it) fails the generated test rather than only the aggregate validate counts. A stub with no optional slot is unchanged.

#### body

```text
// Container-shape branch factories take positional args: singular-
// child containers require one `child?` and repeated containers take
// `...children` rest args. We need a placeholder element when:
//   - the singular child is required, OR
//   - the multi children slot is `nonEmpty` (repeat1-sourced)
//     — the factory's `_assertNonEmpty` helper throws on empty
//     input, so the no-arg form `ir.kind()` would fail at
//     runtime even though it type-checks.
//
// `soleSlotFacts` is the same canonical derivation
// `emitFieldCarryingFactory` (factories.ts) bases its real signature
// on. Read it here too, so the test placeholder matches what the
// factory actually requires.
```

### `packages/codegen/src/emitters/test.ts::emitKeywordTest`

```text
/** A keyword kind's build entry is its kind id — there is no node, so the
 *  only fact to pin is that the entry is the id itself. */
```

### `packages/codegen/src/emitters/test.ts::emitLeafTest`

#### body

```text
// Find a sample text that satisfies the leaf's regex pattern (if
// any). The factory enforces patterns at runtime now — passing
// `'test'` to a shebang or metavariable factory would throw at
// construction time. Try a list of common shapes against the
// pattern and pick the first match; if none match, the leaf has
// an exotic shape and we skip the construction test (the regex
// check itself is the test).
```

#### body

```text
// No working sample found — skip this leaf's construction
// test rather than emit a known-failing assertion. The
// pattern guard is exercised by other tests anyway.
```

### `packages/codegen/src/emitters/test.ts::dummyValue`

```text
/**
 * A Config-surface dummy for one field. `strict` targets the factory's own
 * Config (a namespaced constructor calls `F.buildX` directly), where a
 * kind-enum slot takes its member's discriminant; the `ir.<kind>` coerce
 * path also accepts the member text.
 */
```

#### body

```text
// Keyword-presence brands (boolean / bitflag) take a number / scalar at
// the Config surface, not an UntypedNode / array. Pre-empt the generic
// structural fallback below.
```

#### body

```text
// Multiple fields need a non-empty dummy array so templates with
// `$FIELD`/`joinBy` produce non-empty output; otherwise the generated
// `render produces non-empty string` test fails for kinds where
// every required field is multiple.
```

### `packages/codegen/src/emitters/ir.ts::module`

```text
/**
 * Emits ir.ts — developer-facing namespace re-exporting factories with short names.
 *
 * Consumes NodeMap directly. Derives from factory exports — thin namespace wrapper.
 *
 * Spec 008 US5:
 *   - Namespace imports (`import * as F` / `import * as FR`) replace the
 *     per-entry import walls. Single short line per source module.
 *   - Supertype-grouped sub-namespaces (`ir.expression`, `ir.pattern`, …)
 *     emitted alongside the flat `ir.*` namespace. Members keyed by
 *     supertype-stripped short names; JS reserved words get a `_` suffix.
 */
```

The flat namespace holds each builder once, under its own `irKey`; a supertype-stripped name exists only as a member of its group namespace (`ir.expression.binary`, never a flat `ir.binary`).

A supertype gets an ir namespace if and only if the grammar declares it (`AssembledSupertype.declared`). An undeclared hidden choice gets no ir namespace however it would be emitted, neither a supertype group here nor flattened-parent routes (`flattenedVariantParents`); each of its arms keeps its own flat builder. Declare it in `grammar.sittir.ts` (`supertypes`) to give it one. The kind's type union is unaffected.

### `packages/codegen/src/emitters/overlays/module.ts::ownTextEntries`

The keyed kinds that have one surface (`ownTextKeyedNodes`) with their `maxArgs`. They get a flat `ir` entry that is the raw factory instead of a bundle.

### `packages/codegen/src/emitters/overlays/module.ts::withMaxArgs`

Adds each keyed node's `BuiltTypeSurface.maxArgs`, the one fact a bundle entry carries that is the emitter's own: it is computed from the built type surface, which the model does not hold.

### `packages/codegen/src/emitters/shared.ts::ownTextLeaf`

The facts of a lexed kind that is nothing but its own text between two fixed affixes, or `undefined` for any other kind: the content slot, the opening and closing text, and the template-literal type of the text spelled in full (`\`<open>${string}<close>\``). The kind qualifies when it has a lexed content slot, that slot is its only slot, and it has a full form. A kind whose affix is a spelled slot or a choice of texts has no single spelled type and is a compile-time error here, so the classification cannot drift from what the builder can type.

Such a kind is a leaf. Its builder takes text only and has one surface. It never reads the text to decide whether the affixes are present: detection lives only on a coercion surface, and a leaf has none. The caller says which it gave, with the `affix` argument. A slot that holds the kind keeps its coercer, which still detects either form (`spelledInterior`); a kind with a second slot, and a polymorph parent, keep their coercing entry and its detection.

### `packages/codegen/src/emitters/factories.ts::ownTextArgs`

The argument row of an own-text leaf, as both its `BuildArgs` and its `LooseArgs`: `[content: T, affix?: true] | [text: <spelled type>, affix: false]`. `T` is `ownTextContentType`, the content slot's storage type widened by what its storage coercion accepts (a numeric content also takes `number | bigint`). With `affix` true or absent the first argument is the content, and the builder adds the affixes; with `affix: false` it is the token spelled in full, typed by the kind's affixes, and the builder removes them (`unaffixed`), refusing text that lacks either. Text that carries the affixes passed without `affix: false` is content like any other: it is refused when the content pattern excludes it, and renders with the affixes doubled when the pattern admits it.

### `packages/codegen/src/emitters/ir.ts::emitIr`

Prints the `ir` module from the model's plan (`irPlanOf`): the supertype groups as top-level consts, then the frozen `ir` table — bundled node factories, the variant parents, keyword factories, own-text leaves, leaf node factories, the group namespaces and `synonym`. Which kinds appear, under what key and through which factory export is the plan's decision (`deriveIrPlan`); the emitter adds only the role synonyms, which come from the grammar's roles rather than the model.

No emitted code attaches properties to a factory: a factory is shared under every key that reaches it, so a mutation made for one key shows under all of them.

#### body

```text
// One hoisted const per bundle kind — the group/`ir` namespace consts
// reference these by NAME (see bundleLine).
```

#### body

```text
// ----------------------------------------------------------------------
// Supertype-grouped sub-namespaces — collected first so they can be
// both exported as tree-shakeable top-level consts AND attached to
// the flat `ir` namespace for nested access (`ir.expression.binary`).
// ----------------------------------------------------------------------
```

#### body

```text
// TSGrammar-only kinds (no parser symbol — tree-sitter inlined) can
// never appear at runtime; no factory was emitted for them.
```

#### body

```text
// 'list' participates in this scan uniformly alongside 'branch' — see
// isSlotBearingCompound's doc comment (shared.ts).
```

#### body

```text
// ------------------------------------------------------------------
// Role synonyms — native JS value → this grammar's node for that role.
// Grammar-agnostic construction from native JS values, keyed by the
// semantic role a kind plays rather than by its grammar-specific name.
// Emitted BEFORE `ir` so it can be referenced as `ir.synonym`.
// Also exported standalone for tree-shakeable `synonym.boolean(...)`.
// ------------------------------------------------------------------
// ----------------------------------------------------------------------
// Flat `ir.*` namespace — every grammar kind by camelCase short name.
// ----------------------------------------------------------------------
```

#### body

```text
// Explicit typeof-composed surface — same TS7056 rationale as the
// hoisted bundle consts above.
```

`ir` and `synonym` are frozen tables: the emitted module is the one place each is built, and nothing writes to either afterwards.

### `packages/codegen/src/emitters/ir.ts::emitSynonymBoolean`

#### body

```text
// Strategy 1: single leaf factory that accepts text
```

#### body

```text
// Strategy 2: keyword pair — look for `true` and `false` keyword kinds
```

#### body

```text
// Strategy 3: single factory (whatever it is)
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymNumber`

#### body

```text
// Identify integer and float kinds via the number.float sub-role
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymString`

#### body

```text
// Find the primary string kind — prefer kinds containing "string"
// but not "char", "raw", "template", "regex"
```

#### body

```text
// If it's a leaf, emit directly
```

#### body

```text
// Branch string: look for a string-content leaf child to compose. Only
// when the branch is container-shaped (`classifyChildFactorySurface`
// 'direct'/'spread' — a single positional child, or `...children`,
// either of which accepts one positional argument the same way) —
// composing via a hardcoded `{ children: [...] }` config object here
// previously assumed a calling convention the factory doesn't have.
```

#### body

```text
// Otherwise: skip — too complex to auto-compose
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymComment`

Emits `synonym.comment` from the grammar's trivia kinds (a trivia supertype contributes its subtypes). Each kind is reached through its stamped `builderPath` on `ir` (`ir.commentLine`), never by splicing a name; a trivia kind with no builder path is refused. With more than one leaf comment kind, the line comment is the one whose text ends only at a line break (`lineTerminatedKinds`) and the block comment one that does not (typescript `comment_line` and `comment_block`).

#### body

```text
// Find leaf comment kinds (Python/TS: `comment(text)`)
```

#### body

```text
// Single leaf comment kind — route everything there
```

#### body

```text
// No leaf comment kinds — branch/polymorph comment kinds (e.g. Rust's
// line_comment polymorph, block_comment branch) are too complex to
// auto-compose in a canonical factory. Skip emission.
// Users should call the grammar-specific `ir.lineComment(...)` /
// `ir.blockComment(...)` factories directly.
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymType`

#### body

```text
// Get type kinds, excluding builtin types
```

#### body

```text
// Find the type-identifier node (not plain `identifier`).
// Probe both bare and hidden-prefixed names since SCM captures use
// unprefixed names but the grammar may use `_type_identifier`.
```

#### body

```text
// No type-specific kind — check if `identifier` is the only option
```

#### body

```text
// Simple leaf type factory
```

#### body

```text
// Branch type-identifier — compose with identifier factory
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymIdentifier`

#### body

```text
// Find the `identifier` kind specifically — not `this`, `super`, `self`
```

### `packages/codegen/src/emitters/from.ts::module`

```text
/**
 * Emits from.ts — consumes NodeMap directly.
 *
 * Owns ALL `from()` resolver string generation. Rule.ts exposes the
 * IR; this file dispatches on `node.modelType` and emits the per-kind
 * resolver bodies plus the module-scoped helpers (_resolveOne,
 * _resolveMany, _resolveBareText, _resolveByKind, _resolveScalar).
 */
```

```text
/**
 * Taxonomy-keyed from() dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
```

### `packages/codegen/src/emitters/from.ts::FormChildForFrom`

```text
/** What the branch from-emitter can render: a branch, or the hidden
 *  polymorph-form `group` a loose form mirror coerces through. A group is
 *  never dispatched as a kind of its own — only reached as some parent
 *  form's child. */
```

### `packages/codegen/src/emitters/from.ts::ARGS_HELPER`

```text
/** The `@sittir/types` names the generated from-module may reference.
 *  `AnyUntypedNode` is unconditional (every leaf-registry entry names it); the
 *  rest depend on per-kind emission decisions made long after the preamble
 *  is written, so the preamble names them all and `pruneUnusedImports`
 *  drops whichever the body never mentions. */
```

```text
/** `Parameters<F>` resolves to `never` for a signature whose rest element is
 *  `readonly T[]` — `infer P` in rest position matches only a mutable array —
 *  and the rest-param coercers declare exactly that. The loose form mirrors
 *  forward their child coercer's parameters, so they reflect through this
 *  instead. Pushed as ONE line entry so `finalize` can drop it whole when no
 *  mirror was emitted. */
```

### `packages/codegen/src/emitters/from.ts::BranchLikeNode`

```text
// ---------------------------------------------------------------------------
// Branch from() — loose input, field-level resolution
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::BranchLikeNode.modelType`

```text
// 'list' participates in this scan uniformly alongside
// 'branch'/'envelope'/'polymorph' — see isSlotBearingCompound's doc
// comment (shared.ts).
```

### `packages/codegen/src/emitters/from.ts::emitBranchUntypedNodePassthrough`

#### body

```text
// Phrased as a negated type predicate rather than `if (isNode(input))`
// so the checker narrows the REMAINDER of the body to the config arm.
// A plain `isNode` early-return does not: negative narrowing drops a
// union constituent only when it is a strict subtype of the guard type,
// and `AnyUntypedNode`'s optional members defeat that for every generated
// kind interface — leaving the interface's accessor signatures in the
// type of every `input.<field>` read below.
```

#### token interior

```text
The config type the passthrough narrows to gains `string` when the kind accepts a bare content value.
```

### `packages/codegen/src/emitters/from.ts::ChildrenFromNode`

```text
// ---------------------------------------------------------------------------
// Container from() — accepts element args OR a self UntypedNode
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::ChildrenFromNode.childSlotFacts`

```text
// The container's classified sole user slot (soleSlotFacts) —
// its `storageName` drives the `_<name>` data key we read here. Computed
// by the caller from the full node; not derivable from `slots` alone.
```

### `packages/codegen/src/emitters/shared.ts::looseElementType`

```text
/**
 * The accepted per-element input union for a container's `from()` rest
 * parameter: the strict element type, widened by `string` when every kind
 * the slot accepts is leaf-shaped — the resolver coerces loose text into
 * the leaf node exactly as a named config field would.
 */
```

### `packages/codegen/src/emitters/factories.ts::coercedChildElementType`

The element a spread kind's coercer resolves for its sole slot: the slot's element type with literal texts where the strict builder takes kind ids, and `string` as well when every kind the slot accepts is a leaf (`looseElementType`). The row reads it so the coercer's accepted elements are in the row; the coercer reads the row.

### `packages/codegen/src/emitters/shared.ts::resolvesLooseInput`

Whether a slot's `from()` coercer resolves loose input rather than passing it to the raw factory as it stands: always
when the slot has no literal values, and also when it mixes literals with leaf or branch kinds, so a bare string
still reaches the slot's node kinds (`object_pattern` properties beside the keyword arms a shorthand property
admits). A slot of literals only passes its input through; the raw factory's literal coercion handles it.

### `packages/codegen/src/emitters/from.ts::emitChildrenFrom`

#### body

```text
// The interface declares `_<storageName>` per slot (no `$other`), so the
// element type is the slot's element type and the data read is
// `data._<storageName>` — keyed off the classified sole user slot.
```

#### body

```text
// A sole separated-list slot forwards single elements too: the list's
// (wrapper-widened) element union joins the INPUT signature only — the
// resolver's type argument and the factory call keep the narrow element
// type (the runtime resolver builds the list node before the factory
// sees it).
```

#### body

```text
// No classified sole slot — the legacy `$other` passthrough has no
// slot whose resolver could coerce; keep the direct call.
```

### `packages/codegen/src/emitters/from.ts::LeafFromNode`

```text
// ---------------------------------------------------------------------------
// Leaf / enum from() — `string | UntypedNode` passthrough
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::emitStringLikeFrom`

#### body

```text
// `isNode` does not negative-narrow `Terminal<K, V>` out of the
// input union (TS structural-Exclude limitation), so the
// `typeof === 'string'` test is what funnels the post-guard branch
// to the factory's `string` parameter.
```

#### body

```text
// Enum-leaf factories declare a narrow string-literal union for
// their text parameter; the from() entry point accepts arbitrary
// strings and the factory's runtime guard catches invalid values.
// Cast at the boundary funnels the `string` to the narrow shape.
```

### `packages/codegen/src/emitters/from.ts::emitStringLikeFrom`

```text
/** A text-constructible leaf's coercer takes `<Kind>.Loose` — the node
 *  or its text — the same surface every other kind's coercer takes. */
```

### `packages/codegen/src/emitters/from.ts::emitKeywordFrom`

```text
// ---------------------------------------------------------------------------
// Keyword from() — a keyword has exactly one value, its id: whatever
// `<Kind>.Loose` form arrives (the id or the fixed text), the answer is the
// build constant, the id. The parameter exists only to type the surface.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::leafFromForm`

Which coercer a leaf kind gets: `string` for a pattern leaf (its text), `keyword` for a builder text leaf (a zero-argument factory), none otherwise. `from.leaf` dispatches on it and `keywordLeafArity` reads it.

### `packages/codegen/src/emitters/from.ts::keywordLeafArity`

The arity of a keyword leaf's pair: its coercer takes one optional `<Kind>.Loose` input. Its strict entry is its kind id, a constant, so the pair's hoisted call is always the coercer. Undefined for any other leaf, whose arity its built-type surface states.

### `packages/codegen/src/emitters/from.ts::resolveFieldCall`

#### body

```text
/** When true, keyword-presence short-circuit applies.
	 * Children slots (the merged-values pseudo shape) skip it because
	 * the Config surface there is `children`, not the keyword name — a
	 * boolean-keyword classifier match on a children slot is coincidental
	 * and should not route through _resolveBooleanKeyword. */
```

#### body

```text
/** Pre-computed element type expression for the explicit `<T>` type
	 * argument on the resolver call. When omitted, falls back to deriving
	 * from the field shape (only possible when `field` is an `AssembledNonterminal`). */
```

#### body

```text
/** Catalog entries — required for kindEnum fields to emit compile-time
	 * literal-aware discriminants (shared kindEnumTextMapExpr, #129). */
```

#### body

```text
// Short-circuit keyword-presence fields through dedicated
// resolvers. Boolean / bitflag inputs must NOT get routed through the
// leaf-literal registry (a `true` on a boolean-keyword field is a
// presence marker, not a boolean_literal node).
```

#### body

```text
// Pass an explicit element type when we have one — `resolveFieldCall` is
// also invoked with merged children pseudo-fields (no AssembledNonterminal
// shape), so prefer an override when supplied; otherwise derive from the
// AssembledNonterminal when present.
```

#### body

```text
// A kind-enum slot STORES a discriminant, so a numeric loose value is
// already the stored form. Leaf resolution would scalarize it into an
// integer / float literal first, and `coerceKindEnumStorage` would then
// read that literal's own kind id back — a silently wrong member, and
// the one way the loose surface disagreed with the strict factory,
// which takes the discriminant verbatim. The thunk keeps the leaf path
// for every other input shape.
```

### `packages/codegen/src/emitters/from.ts::storedFieldCall`

A slot's resolver expression without keyword extraction: the single-kind fast path or the interned resolver call, wrapped in the kind-enum or mixed-enum storage coercion. `resolveFieldCall` puts keyword extraction in front of it: whole value for a scalar slot, one element at a time (resolved as a scalar) for an array slot.

### `packages/codegen/src/emitters/from.ts::WrapChildrenEntry`

```text
// ---------------------------------------------------------------------------
// Gap 3 + 4: _wrapWithChildren dispatch table
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::emitFromMapDeclaration`

```text
/** `_fromMap`: kind name → its from() coercer, for every kind whose coercer
 *  is emitted (`classifyFromEmission`) — the same gate the dispatcher uses,
 *  so a coercer that exists is always reachable by name. That includes the
 *  user-facing hidden kinds (`_simple_statements`, `_impl_item_body`):
 *  `_resolveOneBranch` and the bare routing in `_resolveOne` dispatch
 *  through this map, and a wrapper or list a slot names but the map omits
 *  is a coercer nothing can call — its bare input silently passed through
 *  unresolved. */
```

### `packages/codegen/src/emitters/from.ts::bareSlotOf`

The slot a kind's bare input fills: the sole slot for a direct/forwarded
compound, the element slot for a list, nothing for anything else.

### `packages/codegen/src/emitters/from.ts::bareAcceptClosure`

For every from-emitted kind that takes a bare input, the kind NAMES that input
admits, transitively — a wrapper admits its slot's kinds, a list its elements',
and a wrapper over a list that list's elements. One closure feeds both tables
that need it: `_BARE_ACCEPTS` derives ids from these names, and
`_STRING_CAPABLE_BRANCHES` adds the kinds whose closure reaches a leaf-registry
kind. Names rather than ids because only one of the two consumers wants ids,
and a name is what the model actually carries.

An admitted enum contributes its member kinds as well as itself: a wrapper
whose slot reaches `predefined_type` accepts a bare `string_keyword` id, so
a member id given at a parent slot that admits only the wrapper is hoisted
through it (rule 5) exactly as a node would be, instead of reaching the
transport unwrapped.

#### list elements through a transparent wrapper

A list's admitted kinds are its content slot's kinds plus, when that slot holds exactly one kind that is a transparent wrapper (`transparentContentKindNames`), the wrapper's own required slot's kinds. A list of `_attributed_field_declaration` therefore accepts a bare `field_declaration`, and a slot that holds the list (or a forwarding envelope over it) takes one element on its own, the same as an array of one.

### `packages/codegen/src/emitters/from.ts::isLeafRegistryKind`

Whether a kind can take a bare string by itself — an enum, a visible fixed-text leaf or a pattern leaf with a raw factory, hidden or not. `forwardsBareString` reads it to decide whether a single-kind chain ends at a leaf.

### `packages/codegen/src/emitters/from.ts::TextKindCheck`

One text kind's bare-text check: `values` for a fixed-text kind, `pattern` for a pattern, interior or alias-of-pattern kind. `buildLeafRegistryEntries` builds it and prints the registry row from it; the `text-kind-overlap` tool reads the same checks.

### `packages/codegen/src/emitters/from.ts::leafTextChecks`

The leaf registry's text-kind checks in lexical rank order — the value behind `_TEXT_KINDS_BY_RANK`, for callers outside the emitter.

### `packages/codegen/src/emitters/from.ts::textCheckAccepts`

Whether a `TextKindCheck` accepts a text: membership in `values`, else a test of `pattern`. It is the build-time mirror of the emitted `_resolveBareText` row test.

### `packages/codegen/src/emitters/from.ts::rankTextKinds`

Orders text-kind checks by the catalog's `lexicalRank` (`findKindEntry`, so an alias display finds its row). A text kind with no rank is an error: every factory-bearing text kind has a parser row, so a missing rank means the catalog and the registry disagree. Without a catalog the order is left as it is.

### `packages/codegen/src/emitters/from.ts::slotResolverKinds`

A slot's resolver kinds: its kind names expanded through supertypes (`expandAndDedupeContentTypes`) and split into leaf, branch and token kinds (`classifyKindsForResolver`). `resolveFieldCall` emits the `_resolveOne` call from it, and the overlap tool reads a slot's text candidates from it.

### `packages/codegen/src/emitters/from.ts::transparentEnvelopeTextLeaves`

The text leaf kinds a bare string reaches through an envelope that adds no text of its own: a surface-hidden envelope (hidden storage the parser shows under an alias, such as typescript `_lhs_expression`) with a coercer and one slot, whose leaves are that slot's `slotResolverKinds` leaf kinds. Any other node reaches none: an envelope with fixed text (`array`, `await_expression`) would wrap a bare string in text the author never wrote. The coercer's `_ENVELOPE_TEXT_LEAVES` table and the node model's `textLeavesThrough` both read it.

### `packages/codegen/src/emitters/from.ts::defaultArmKindOf`

The storage kind of the slot value an author marked `arm.default`, or
`undefined`. The fact rides the value bag next to `variant`/`variantOf`
(`armFactsOf`); this is its only reader. Two flagged arms on one slot is an
authoring error and throws here rather than emitting an arbitrary winner.

With no default of its own, a slot takes the default of a supertype it holds, when exactly one such supertype
declares one.

### `packages/codegen/src/emitters/from.ts::emitPickArmHelper`

Emits `_pickArm`, the one rule both of `_resolveOne`'s routes use to choose
among candidate arms: one candidate wins outright, several are decided by the
declared default, and no default leaves the caller to report the ambiguity.
The kind route and the string route differ only in how they build the
candidate list.

### `packages/codegen/src/emitters/from.ts::emitBareRoutingTables`

```text
/** The two tables `_resolveOne` routes bare kinds with. `_KIND_ID_STORED`:
 *  the ids of the kinds whose storage is the id (keywords, fixed-text
 *  tokens) — the only numbers that mean a kind rather than a scalar.
 *  `_BARE_ACCEPTS`: for each kind whose coercer takes a bare input
 *  (`fromBareInput`), the kind ids that input admits, transitively — a
 *  wrapper admits its slot's kinds, a list its elements', and a wrapper
 *  over a list that list's elements. Both are read off the model at emit
 *  time; the type-level twin is `BareArms` in `@sittir/types`. */
```

#### `_ENUMS_OF_MEMBER`

Member kind id to the enum kinds that carry it (a keyword id can be a member
of several enums), from every `AssembledEnum`'s resolved members.
`_resolveOne` admits a bare member id wherever one of its enums is a leaf
kind of the slot, before the arm search, so
`typeArguments: [TSKindId.StringKeyword]` stays the enum member it is
instead of being offered to every wrapper whose bare-accept set now lists it
(`bareAcceptClosure`); a slot that admits the enum directly goes through
`_resolveKindEnum` first, which is why the arm search only ever saw member
ids at wrapper-only slots until arrays started resolving per element.

### `packages/codegen/src/emitters/from.ts::scalarResolutionOf`

What a grammar's scalar resolver can resolve: the true and false members of its boolean kind (found in the kind entries, so a boolean kind whose members are missing resolves nothing), the numeric leaf kinds it tries by pattern, and `resolves`, true when either exists. It is the one fact behind every scalar emission: `_resolveScalar` is emitted only when `resolves`, and so is the scalar branch in `_resolveOne` and `_resolveOneLeaf`, so a grammar with no scalars (scm) carries neither, and a scalar falls through unchanged (`return v`), as it did when the resolver answered nothing.

### `packages/codegen/src/emitters/from.ts::emitScalarFallthrough`

The scalar branch of `_resolveOne` and `_resolveOneLeaf`: a boolean, number or bigint is offered to `_resolveScalar`, and a defined answer is the value. Emitted from one place so the two resolvers cannot drift.

### `packages/codegen/src/emitters/from.ts::emitResolverHelpers`

In `_resolveOne`, a value that is neither a config object nor kinded data hoists into a branch arm only when that arm is the slot's sole branch kind or its declared default arm; a string additionally needs the arm to be string-capable. A bare string never picks an arm by elimination among several — which kind it names is not decided by its text — so a string no leaf accepts throws when any arm could take it.

`_resolveBareText` tests the slot's text leaves in lexical-rank order, counting an envelope arm's leaves (`_ENVELOPE_TEXT_LEAVES`, from `transparentEnvelopeTextLeaves`) as the slot's own. A text reached through an envelope is passed as text to the envelope's coercer, which runs its own keyword extraction and rank, so `left: 'result'` builds the same `_lhs_expression` envelope the strict surface spells and `left: 'async'` builds the envelope around the keyword arm.

`_listElements` passes an element that is already the list's wrapper kind through untouched and resolves only the others to the wrapper's content; resolving a built wrapper toward an alias content kind would nest it inside that alias.

The node resolvers (`_resolveOne`, `_resolveMany`, `_resolveOneLeaf`, `_resolveOneBranch`, `_resolveManyLeaf`, `_resolveManyBranch`, `_wrapArray`) take the slot's kinds as the type argument `T` and return `Admit<T>`: what they produce is a node of one of those kinds, built or passed through, and the builders they feed admit nodes by kind.

#### body

```text
// Keyword-constructible branch routing (see _resolveOne's string
// routes): text → branch kind for exact-arm construction, plus the
// single-target branches whose coercer can consume a bare string.
// Both derive from the model's stringConstructibleTexts stamp. HIDDEN
// arms (`_visibility_modifier_pub`) have no from() route of their own,
// so a parallel build table maps each constructible kind to its STRICT
// factory — an empty build IS the keyword (all slots optional).
```

#### body

```text
// Single-kind fast paths — resolver call sites with only one
// possible target dispatch here directly, skipping the leafKinds
// / branchKinds iteration in _resolveOne.
```

#### body

```text
// Gap B: see _resolveOne — same object/array-only throw, scalars pass through.
```

#### body

```text
// Bare routing on a multi-kind slot: a value that is a kind — a node, or a
// number that is the id of a kind stored as its id — and is not one of the
// slot's own kinds goes to the one arm whose bare slot admits it
// (`_BARE_ACCEPTS`, the transitive kinds behind each bare-input coercer:
// a wrapper's slot, a list's elements, a wrapper's list's elements); more
// than one such arm is an error, not a guess. The slot's own kinds still
// pass through untouched. `_KIND_ID_STORED` is the check that keeps a
// scalar `1` from being read as kind id 1 — only kinds whose storage IS
// the id are ids at this boundary; every other number is a scalar.
```

#### body

```text
// Gap 3+4: emit _wrapWithChildren table before _resolveOneBranch
// since _resolveOneBranch references _wrapKindIds and _wrapWithChildren.
```

#### body

```text
// Gap 4: UntypedNode pass-through if $type matches; wrap as single child
// when it doesn't and target kind supports children. `altKinds` carries
// the slot's OTHER union members (anonymous tokens the resolver
// classification has no factory dispatch for, e.g. mod_item.content's
// `';'` external form) — an UntypedNode already matching one is a VALID
// alternate branch and must pass through, not get auto-wrapped into the
// primary branch's container (#128).
```

#### body

```text
// Gap 3: Array at wrapper position — resolve each element, wrap in
// target kind via _wrapWithChildren.
```

#### body

```text
// Existing object handling
```

#### body

```text
// Keyword-presence resolvers — pass-through. For scalar /
// repeat-of-one booleans the factory inlines
// `config.x ? '<literal>' : undefined` (no runtime helper); for
// bitflags the `_bf` helper stamps the UntypedNode container. The
// resolver layer only has to refuse the leaf-registry path so a
// `true` input doesn't get misrouted through `_resolveScalar` into
// a `boolean_literal` factory call.
```

#### _TEXT_KINDS_BY_RANK

A mixed-enum slot resolves a bare string by keyword extraction first, then lexical rank, as tree-sitter does. `_keywordOf(v, [[text, kindId], …])` (table from `keywordArmTextMapExpr`) returns the kind id of the slot's keyword arm whose text equals the string, and only a string that is no keyword arm goes on to the resolver below; a slot with no keyword arm emits no `_keywordOf`. An array slot applies the same rule per element: each element is `_keywordOf(e, …) ?? <the slot's scalar resolution of e>`, so an element that is a keyword arm's text is stored as the arm's kind id before the element resolver could build a leaf or a scalar from it. Elements that resolve to `undefined` are dropped, as the whole-array storage coercion drops them, so an absent element never reaches the transport. Non-keyword fixed-text arms keep going through the rank. The emitted from-module lists every registered text kind in `lexicalRank` order. `_resolveBareText(v, kinds)` walks that list, skips kinds the slot does not admit, and builds the first kind whose row accepts the text; the runtime never ranks anything itself. When a slot admits text kinds and none accepts, `_resolveOne` throws `"<text>" matches none of [<kinds>]`. `_resolveOneLeaf` builds a single-leaf slot through `_buildGuardedText`, which throws `"<text>" is not a <kind>` on a mismatch. The keyword-text table (`_KEYWORD_BRANCH_BY_TEXT`) keeps exact identity and is asserted unique at codegen: one keyword text building two branches is an error.

### `packages/codegen/src/emitters/from.ts::FromEmitter`

```text
// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::FromEmitter.finalize`

#### body

```text
// Prune preamble imports the emitted body never references — the
// per-kind emission decisions that consume them (delimiter guards,
// NonEmptyArray spreads) run after the preamble is written.
```

#### body

```text
// The helper's own declaration names `_Args`, so it is excluded from
// the scan that decides whether anything actually uses it.
```

### `packages/codegen/src/emitters/wrap.ts::module`

Emits `wrap.ts`, the members layer over the typed read. Each kind's wrap function spreads the transport the read handed over (its `$type`, `$_layout` and `_`-prefixed slots, stored as they crossed) and attaches the kind's members: one accessor per slot, `$with` setters that rebuild through the raw factories, and the `$render`, `$trivia`, `$query` and `$engine` members `nodeMemberLines` prints. Nothing is reshaped on the way in: the Rust reader already stores every slot in its model shape (lists inline, unit variants as kind ids, enum members as member ids, a coordinate for each child past the read's depth), so the wrap only names what the data holds.

Consumes the `NodeMap` directly; `wrap` is the taxonomy-keyed dispatch namespace, and callers provide the output buffer per run so collection state stays on the emitter instance instead of in module globals.


### `packages/codegen/src/emitters/wrap.ts::typeStampLines`

The `$type: TSKindId.<member> as const` line a wrap function's node literal starts with, so the wrapped node's `$type` is typed as its own kind's literal id. Empty without a kind catalog, where the node keeps the `$type` its data carries.


### `packages/codegen/src/emitters/wrap.ts::SlotAccessorConfig`

What `slotAccessorBody` needs to know about a slot beyond its model: the element type its accessor returns, whether the slot is required (an optional singular slot's accessor admits `undefined`), and its storage info (`resolveFieldStorageInfo`), which says whether the stored value is a node or a scalar.


### `packages/codegen/src/emitters/wrap.ts::slotAccessorBody`

The body of one slot accessor. A scalar slot (one whose storage holds no node, `storesNodes`: a flag, a set of flags, a kind id) returns its storage as it is; a node slot hydrates through `hydrateSlots` (`many`) or `hydrateSlot`, typed by the slot's element type. An alias envelope's content slot (`aliasContent`) passes the role `contentRole` gives its stored content, so a content that shares the envelope's parser node is registered apart from the envelope.


### `packages/codegen/src/emitters/wrap.ts::fieldAccessorLines`

One `name() { … }` accessor line per model slot of a field-carrying kind, minus the slots in `skip` (`spelledGroupSlots`: slots whose group seat has a key of the slot's own name, which the group's reader serves instead), each body from `slotAccessorBody`.


### `packages/codegen/src/emitters/wrap.ts::SlotModel`

```text
// Local view-layer slot descriptor: the minimal `{ name, storageKey, arity }`
// surface wrap.ts consumes. `AssembledNonterminal` structurally satisfies it
// (it exposes `name`, `storageKey`, and `arity` getters — the single source of
// truth for those derivations), so emitFieldCarryingWrap passes `f` directly.
// The shape is retained only for the synthetic unnamed-children slot, which is
// not a class instance (see resolveUnnamedSlotConfig; reworked in task B).
```

### `packages/codegen/src/emitters/wrap.ts::SlotModel.propertyName`

```text
/** The accessor/setter name. One contributing slot lends its own; several
	 *  share the `$other` bucket and have no single name to lend, so they take
	 *  the generic the model uses for a slot the grammar left unnamed. */
```

### `packages/codegen/src/emitters/wrap.ts::EmitWrapConfig.rootKind`

```text
/** The grammar's `root` role kind. Names that kind's wrapped surface as an
	 *  exported alias so `engine.ts` can type `parse()`'s return without
	 *  re-deriving the wrap table's row for it. */
```

### `packages/codegen/src/emitters/wrap.ts::declaredParsedType`

The declared return type of a kind's wrap: `T.<Kind>.Parsed` when the kind has a catalog entry (a kind id and a namespace), nothing when it has none. The parsed-by-kind-id map holds the same declared types, and it is the one map the wrapped root (`<Root>Tree`), `wrapNode`'s return and every accessor's child type read, so no wrap's type is inferred from its body and no second mapping exists.

### `packages/codegen/src/emitters/wrap.ts::castToParsed`

The one cast a wrap makes at each return: the object literal it builds carries the storage keys, the accessors and `$with`, and is not related to `T.<Kind>.Parsed` structurally. Relating them walks every accessor of both interfaces and exceeds the checker's relation depth on deep grammars, so the literal is cast through `unknown` once, at the return, and the declared `Parsed` is what callers see.

### `packages/codegen/src/emitters/wrap.ts::returnAnnotation`

The `: T.<Kind>.Parsed` annotation on a wrap's signature, or an empty string when the kind has no catalog entry. A transparent supertype wrap is annotated with the supertype's own `.Parsed` union, since it returns whichever member it dispatches to.

### `packages/codegen/src/emitters/wrap.ts::ParsedOfData`

The wrap header's type from a wrapped datum to its declared `Parsed` node: a datum whose `$type` is a kind id in the parsed-by-kind-id map becomes that map's row, anything else stays as it is. `hydrateChild` and `hydrateChildren` return through it, so an accessor's return type is the child's declared surface and never an inference through the tree's recursion.

### `packages/codegen/src/emitters/wrap.ts::renameUnusedTreeParam`

```text
// ---------------------------------------------------------------------------
// Namespace — taxonomy-keyed wrap dispatch API
// ---------------------------------------------------------------------------
```

```text
// A wrap body with nothing to hydrate never reads `tree` — rename the param
// so the generated package lints clean.
```

### `packages/codegen/src/emitters/wrap.ts::SAFE_IDENT_KEY`

```text
// `_<ident>` where ident is a valid JS identifier suffix. Keys outside this
// shape must be accessed via bracket notation. Tree-sitter exposes some kinds
// as literal token strings (`'`, `$`, `.`), which become storage keys like
// `_'` / `_$` / `_.` — all valid object keys but invalid dotted accessors.
```

### `packages/codegen/src/emitters/wrap.ts::emitFieldCarryingWrap`

#### body

```text
// $other is real ONLY when the assembled node's own children slot is
// non-empty — the model's structural fact that this kind's wire data can
// carry unfielded/unnamed children. (`node.childSurface` governs $with
// CALLING CONVENTION, not wire storage shape — see investigation note
// below; using it here would describe the body's ACCESS, not the data's
// real shape.)
```

#### body

```text
// Shape A: inline object literal wrapped by withMethods<T>. No
// Object.defineProperty, no freezeUntypedNode, no Record<string,unknown> cast.
//
// When $with setters are present, we hoist the literal to `const _node`
// so the closures inside $with can reference it (arrow functions capture
// the variable by reference; _node is initialized before any setter runs).
```

#### body

```text
// Override $type with the numeric TSKindId.X discriminant when kindEntries is present.
```

#### body

```text
// Named fields -> `_<name>` storage (enumerable).
```

#### body

```text
// Unnamed children slot -- pass through from data (stubs; hydrated lazily by consumer).
// $other is a $-prefixed metadata key, not a _<name> storage key, so
// $other doesn't have the `_` prefix convention — access via data.$other
// which AnyUntypedNode declares as `readonly NodeMemberValue[] | undefined`.
```

#### body

```text
// Inline method shorthand accessors: `name()` returns hydrated value via `this._<name>`.
```

#### body

```text
// $with — calls the corresponding factory for update operations.
```

#### token interior

```text
A lexed kind projects a read node's `$text` through `TOKEN_INTERIORS[kind]` at wrap time, before slot
normalization; a node that already carries slot storage (built or edited) is left alone.
```

### `packages/codegen/src/emitters/wrap.ts::WrapEmitter`

```text
// ---------------------------------------------------------------------------
// Emitter protocol — init / dispatchNode / finalize
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/wrap.ts::WrapEmitter.rootTreeTypeName`

```text
/** The exported alias naming the wrapped root surface, once `finalize()`
	 *  has run. `undefined` when no root kind was configured. The alias is the
	 *  root kind's wrap-table row intersected with `ParsedRoot`: a
	 *  whole-source parse's root carries the parse's error regions
	 *  (`$errors`), and `wrapNode`'s typed overload keeps whichever of those
	 *  members its input declares — the wrap spreads the data it is given — so
	 *  `engine.parse()` reaches this alias without a cast. */
```

### `packages/codegen/src/emitters/wrap.ts::WrapEmitter.finalize`

Assembles the wrap module: the imports `pruneUnusedImports` leaves, `ParsedOfData` (a transport's `$type` mapped to its wrapped surface through `T.ParsedByKindId`, the data type itself for a grammar with no kind catalog), the hydrate helpers, every per-kind wrap function, the `_wrapTable` dispatch table and `wrapNode`.

`hydrate`, `hydrateSlot` and `hydrateSlots` bind `@sittir/common`'s `hydrateWith`, `hydrateSlotWith` and `hydrateSlotsWith` to this module's `wrapNode` (`hydrateSlot` also passes the route's registry role): a stored coordinate is read through `readNode` on the holder's tree and wrapped, a transport is wrapped, anything else (a kind id, a text leaf already plain) is returned as it is. A slot accessor writes what it hydrated back into the slot and adopts it, so the next read returns the same node, and a list is stored once as a frozen array. `hydrate` is exported, so a tool that hydrates read data takes the same path as the accessors.

`wrapNode` dispatches on `data.$type` through `_wrapTable` and runs the kind's wrap function inside `inTreeEngine`, so a node is built under the engine that read its tree however long after the parse it is first reached; it carries read provenance (`carryRead`) from the transport to the wrapped node. Data whose kind has no row (an ERROR read, a plain text leaf) is returned as it crossed. With a catalog, `wrapNode` has a narrowing overload: a `$type`-narrowed input (an `is.*` guard) resolves to that kind's wrapped surface, read through an indexed `D['$type']` so a guard-narrowed intersection reduces instead of unioning every constituent's discriminant.

#### body

```text
// _wrapTable — runtime dispatch by kind. With a catalog, keys are the
// numeric TSKindId members (the wire `$type` IS the grammar-symbol id,
// so dispatch needs no id→name resolution); the catalog-less path
// (synthetic test grammars) keeps name keys and string dispatch.
```

#### body

```text
// Members resolve through findKindEntry's kind-name chain — an
// exact-key find misses entries reached via parser-symbol/literal
// aliases (`)` → `Rparen`, `||` → `PipePipe`, hidden pairs →
// `_PropertyIdentifier`) and emitted keys for nonexistent members.
// The chain also lets TWO model kinds resolve to ONE catalog entry
// (hidden/alias pairs), where a duplicate object key would silently
// last-win — so each member is claimed once: the kind that IS the
// catalog entry's own key (the canonical storage kind) beats an
// alias-reached claimant; otherwise the first claim stands.
```

#### body

```text
// 'list' shares 'branch's wrap function — see
// isSlotBearingCompound's doc comment (shared.ts).
```


### `packages/codegen/src/emitters/render-module.ts::module`

```text
/**
 * Rust render-module emitter. Owns codegen output for
 * `rust/crates/sittir-{lang}/src/render/*.rs` and the companion
 * `packages/{lang}/src/hash.ts` that the TS backend shim imports.
 *
 * Spec 012:
 *  - T016 (initial scaffold): hash.rs + hash.ts emission.
 *  - T027/T028/T029: per-kind `#[derive(Template)]` structs + direct
 *    typed-transport render dispatch in
 *    `rust/crates/sittir-{lang}/src/render/templates.rs`.
 *  - T030: canonical `.jinja` copying into
 *    `rust/crates/sittir-{lang}/templates/`.
 *
 * The emitter is pure — given a grammar's template bundle + node map,
 * it returns the string contents of each file it would write. The CLI
 * owns filesystem I/O and the template-directory copy.
 */
```

### `packages/codegen/src/emitters/render-module.ts::RenderModuleEmitter.emitLeaf`

```text
// No per-node accumulation needed — emitRenderModule reads the full nodeMap.
```

### `packages/codegen/src/emitters/render-module.ts::RenderModuleEmitter.emitBranch`

```text
// 'list' participates in this scan uniformly alongside 'branch' (no-op
// body, same as 'branch') — see isSlotBearingCompound's doc comment
// (shared.ts).
```

### `packages/codegen/src/emitters/render-module.ts::RUST_KEYWORDS`

```text
// ----------------------------------------------------------------------
// Rust identifier safety
// ----------------------------------------------------------------------
```

### `packages/codegen/src/emitters/transport-common.ts::rustFieldIdent`

```text
/** A Rust keyword cannot itself be a field identifier (`pub`, `type`,
 *  `crate`, …); a trailing `_` is the escape (`pub_`, `type_`, `crate_`).
 *  Every non-keyword id passes through unchanged. */
```

### `packages/codegen/src/emitters/render-module.ts::pascal`

```text
// strip leading underscores (hidden-kind marker)
```

### `packages/codegen/src/emitters/render-module.ts::EmittedField`

```text
// ----------------------------------------------------------------------
// Per-kind struct emission
// ----------------------------------------------------------------------
```

### `packages/codegen/src/emitters/render-module.ts::EmittedField.name`

```text
// raw grammar field name
```

### `packages/codegen/src/emitters/render-module.ts::EmittedField.multiple`

```text
// true when the transport-side field is Vec<Box<AnyTransport>>
```

### `packages/codegen/src/emitters/render-module.ts::renderSlotAuditKey`

#### body

```text
// Symmetric per-slot storage key (cleanup-rules §E1). Both named and unnamed
// slots use the `_<storageName>` form — the storage key the JS factory writes.
```

### `packages/codegen/src/emitters/render-module.ts::emitStruct`

#### body

```text
// Slot-stamped emission metadata (multiplicity, storage, separators,
// flank modes, unnamed aliases) — see collectSlotEmissionMetadata for
// why each stamp must win over the surface defaults below.
```

#### body

```text
// Override required from assembly if available; fall back to surface.
```

#### body

```text
// Slot-stamped flank modes win over the surface's default (see the
// trailingModeByName doc comment above).
```

#### body

```text
// Mark whether this slot has a corresponding field in the transport struct.
// Virtual presentation slots (from the template walker) are not in the
// transport struct and must be defaulted to "" in the typed dispatch path.
```

#### body

```text
// Resolve group-lift backing transport fields for surface slots that have
// no direct transport field but are produced by inlining a hidden group-lift
// helper (e.g. `_const_item_optional1`). The template emitter inlined the
// helper and surfaced its inner field (e.g. `value`) directly — but the
// transport struct still carries the helper as a struct field under
// `const_item_optional1`. Detect this by looking for unnamed assembled slots
// whose helper node (`_<slotName>`) has a slot matching the surface slot name.
```

#### body

```text
// Look for a helper backing this optional surface slot.
```

#### body

```text
// Helper nodes are hidden (leading `_`); the slot name has the `_` stripped.
```

#### body

```text
// Check if the helper node exposes the surface slot name.
```

#### body

```text
// Record whether the inner field is required (non-Option) or itself
// optional (Option<T>): the render-time lookup maps to a required inner
// field and flattens through an optional one.
```

#### body

```text
// The CST reader (native side) exposes the inner field directly
// at the parent level (e.g. `_value` on const_item, not wrapped
// inside `_const_item_optional1`). Record the inner storageName
// so the struct emitter can add a direct fallback field AND the
// render fn can try it first (before the helper path).
```

### `packages/codegen/src/emitters/render-module.ts::MetaData`

```text
// ----------------------------------------------------------------------
// Direct-render metadata collection
// ----------------------------------------------------------------------
```

### `packages/codegen/src/emitters/render-module.ts::MetaData.separators`

```text
// kind → separator (fallback for inferred slots)
```

### `packages/codegen/src/emitters/render-module.ts::collectMetaData`

#### body

```text
// Separator — scan slot values for stamped separators (set by
// deriveSlotsRawFromLeafAttr via stampListFactsOnValues for named
// field slots). Falls back to node.separator (the
// `AbstractAssembledCompound.separator` getter, overridden on
// `AssembledList`) for container-shaped nodes whose separator lives on
// the rule rather than slot values.
//
// This scan runs uniformly across every `isSlotBearingCompound` node
// (see that predicate's doc comment, emitters/shared.ts) so it doesn't
// silently skip `'list'`-classified nodes alongside `'branch'`/
// `'envelope'`/`'polymorph'`. The base `AbstractAssembledCompound.separator`
// getter is permanently dead for branch/envelope/polymorph (0/468 branches
// ever had a REPEAT-shaped simplifiedRule — wrapper-deletion always
// converts it to a leaf attribute first) but `AssembledList`'s override is
// NOT dead: its `rule` is always the raw REPEAT/REPEAT1 rule by
// construction, so the fallback is live for it even though it's a no-op
// for the other three.
```

#### body

```text
// 1. Check field slot values for a stamped separator.
```

#### body

```text
// 2. Fall back to node.separator (from simplified rule / raw rule) for
//    list-container nodes where the separator lives on the top-level
//    repeat and children are inferred/positional (no
//    deriveSlotsRawFromLeafAttr path). Live only for `AssembledList`;
//    a no-op for the other three compound classes.
```

### `packages/codegen/src/emitters/render-module.ts::libRsContents`

```text
// ----------------------------------------------------------------------
// lib.rs — expose transport render entrypoints
// ----------------------------------------------------------------------
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportSupport`

#### body

```text
// Build kind entries for numeric dispatch from the catalog superset
// (children-only kinds + anon tokens) so the AnyTransport dispatch matches
// the TS-side TSKindId / kindIdFromName universe.
```

#### body

```text
// Collect all supertypes used as field/children types across all nodes.
// Emit per-supertype transport enums BEFORE per-kind structs so struct
// fields that reference the enum types can resolve them at compile time.
```

#### body

```text
// Cross-supertype self-alias ids: a mint arm (`alias($._hidden_supertype,
// $.visible)`) records its storage→parse pair on the REFERENCING
// supertype's `subtypeParseNames`, and the STORAGE supertype's own enum
// withholds the id from its members too (`claimSupertypeIds`). Collect
// globally (the pair never lives on the storage supertype itself).
```

#### body

```text
// Skip supertypes whose enum name is reserved
// (e.g. `_literal` → `LiteralTransport` is in RESERVED_SUPERTYPE_ENUM_NAMES).
```

#### body

```text
// Collect per-slot children enums (heterogeneous children slots where no
// grammar supertype covers all kinds). Emit before transport structs since
// structs reference the enum type in their children field.
```

The fixed-literal kinds are collected once (`collectFixedLiterals`), before
any enum: every emitter that admits one reads its variant, render function
and ids from that registry. A fixed-literal node's own type is a unit enum
(`renderFixedLiteralTransport`), not a struct, and the `AnyTransport`
emitters and `renderTypedDispatch` take the other nodes (`payloadNodes`),
filtered once here.

#### body

```text
// Per-supertype transport enums must precede per-kind transport structs
// so struct field type references resolve correctly.
```

#### body

```text
// Per-slot child enums also precede per-kind transport structs.
```

#### body

```text
// Typed dispatch: render_transport_dispatch + the per-kind render_<kind> fns,
// emitted BEFORE renderTransportEntry() so render_transport_parts can call
// render_transport_dispatch.
```

### `packages/codegen/src/emitters/render-module.ts::boxedInEnum`

Whether a choice holds a payload boxed: when the payload's transport type is among the pins the emission was given (`RenderOptionsInputs.boxedPayloads`, the grammar's `BOXED_PAYLOADS` through `grammarRenderInputs`). The pins hold every payload type over `PAYLOAD_CEILING_BYTES`, and the generated assertions (`payloadCeilingAssertions`) keep them exact, so a choice is no larger than the ceiling plus its tag. Every choice the reader reads boxes the same types, so a payload passes between choices, a supertype's bridge to `AnyTransport` included, as it is.

### `packages/codegen/src/emitters/render-module.ts::choicePayloadType`

The type a choice variant holds its payload as: the payload's transport type, boxed when `boxedInEnum` says so. It records the payload in `ReadPrint.choicePayloads`, so every payload a choice holds is checked against the ceiling.

### `packages/codegen/src/emitters/render-module.ts::payloadCeilingAssertions`

One `const` assertion per payload any choice holds, each one way: a pinned payload must be over `PAYLOAD_CEILING_BYTES`, an unpinned one at most that. A payload that grows past the ceiling fails the build asking to be pinned; a pinned one that shrinks under it fails asking to be unpinned. Each assertion is its own item, so one build reports every payload on the wrong side. A pin no choice holds is refused while printing, asking to be removed. The checks are for the pins the emission was given: the `<= N` assertion on every unpinned payload is what makes an emission that forgets the pins fail the Rust build, naming each payload over the ceiling. `renderTransportSupport` prints them after every choice.

### `packages/codegen/src/emitters/render-module.ts::emitSupertypeTransportEnum`

A supertype whose concrete expansion (`supertypeAdmitsVerbatim`) holds a
pattern-modeled kind admits `Verbatim(VerbatimTransport)`, marked
`#[transport(verbatim)]`, beside its members: a prepare arm, a bridge arm to
`AnyTransport::Verbatim`, and a render arm in the supertype's render helper.

Each payload is written by `choicePayloadType`, boxed when it is pinned over the payload ceiling. The bridge to `AnyTransport` passes a payload as it is, a box included, since both choices box the same types; a boxed supertype payload is unboxed to call its own bridge.

Each member's claims (`claimSupertypeIds`) print as its `#[kind]` line
(`variantKindLines`), which is what the derive's codec decodes from. A
fixed-literal member is a unit variant named by its kind: its bridge arm
builds the unit and its `KindOf` arm answers the kind's own id.

#### body

```text
// Bridge helper: converts <Supertype>Transport → AnyTransport for the
// per-slot→AnyTransport bridges. Each variant
// wraps the inner concrete transport into the matching AnyTransport variant.
// AnyTransport is a sized enum — no Box needed.
```

#### body

```text
// Sub-supertype: delegate to its own bridge function which expands
// the sub-supertype enum into the correct concrete AnyTransport variant.
```

#### body

```text
// Render for the supertype enum — delegates to the per-supertype
// render helper (declared later by emitSupertypeRenderHelper; forward fn
// references are fine at Rust module scope).
```

### `packages/codegen/src/emitters/render-module.ts::claimSupertypeIds`

The kind ids each member of a supertype's enum claims, by variant. The
supertype's own id, its suppressed kinds' ids and its self-alias ids are
withheld before any member claims, so no variant claims them and the
derive's codec refuses them. A self-alias id is a parse alias that makes the
hidden supertype visible (`alias($._expression_except_range,
$.expression_group1)`): its nodes arrive under the alias occurrence's own id
with their child under a kind-keyed slot, which no member decodes.

Members then claim in stored-kind-id-first order (`kindIdStoredFirst`):
every member's own ids, then every member's accepted ids. An aliased arm's
accepted ids include its parse name's id (`parseNames.get(subKind)`), the
id tree-sitter emits at that arm's position. An id goes to its first
claimant. Owner-kind and supertype-membership ids stay name-resolved; enum
member ids are stamped facts.

### `packages/codegen/src/emitters/render-module.ts::supertypeAdmitsVerbatim`

Whether a supertype's concrete expansion (`expandConcreteTransportKinds`)
holds a pattern-modeled kind — the one predicate behind the supertype
enum's `Verbatim` arm and its render helper's, so the two cannot disagree.

### `packages/codegen/src/emitters/render-module.ts::collectConcreteTransportKindIds`

```text
/**
 * Id-carrying counterpart of `collectConcreteTransportKinds`: recurses via
 * `AssembledSupertype.subtypes` (each entry's own stamped `storageKindId`,
 * assemble.ts's discovery-time stamp) instead of `.subtypeNames`, so an
 * alias-occurrence subtype's accepted id comes from its own mint stamp
 * rather than a later separate name->id lookup that can diverge from it.
 * A subtype with no stamped id (nested supertype, or genuinely id-less)
 * recurses/yields nothing — purely additive alongside the name-keyed path.
 */
```

### `packages/codegen/src/emitters/render-module.ts::AcceptedTransportIdsInput.stampedIds`

```text
/** Per-reference-site mint stamp (slot values only) — authoritative when present. */
```

### `packages/codegen/src/emitters/render-module.ts::AcceptedTransportIdsInput.parseAliases`

```text
/** Name-derived alias map for this slot/field (`aliasTargetToSourceMapOf`), used to
	 *  expand `kind`'s alias-site names when no mint stamp is available. */
```

### `packages/codegen/src/emitters/render-module.ts::AcceptedTransportIdsInput.parseName`

```text
/** This kind's own alias-occurrence parse name (e.g. supertype `subtypeParseNames`),
	 *  when it's reached only via `alias($.kind, $.parseName)` at this position. */
```

### `packages/codegen/src/emitters/render-module.ts::resolveAcceptedTransportIds`

```text
/**
 * Single derivation of "which numeric kind_ids should route to this concrete
 * kind at this reference site" — shared by `emitPerSlotChildEnum` and
 * `emitSupertypeTransportEnum`, which previously reimplemented slightly
 * divergent versions of this chain (one had the mint-stamp fast path and the
 * fixed-literal fallback; the other had parse-alias resolution but neither of
 * those) — the exact kind of drift that let a routable kind silently resolve
 * zero ids in one path and not the other.
 *
 * An enum-of-literals member id routes through every supertype above it:
 * the enum members' ids are gathered for `kind` itself and for every enum
 * among its concrete transport kinds, so a bare `TSKindId.Comma` seated in
 * a `_delim_tokens` slot reaches `TokenTreePunctuationEnum` through
 * `_NonSpecialTokenTransport`, and a reserved identifier's member id
 * reaches its leaf decoder through `ExpressionTransport` and
 * `PrimaryExpressionTransport`.
 *
 * The same holds for a terminal alias: an anonymous token the parser
 * shows as a kind in the member's closure arrives under the token's own
 * id (python's `print` shown as `identifier`, nested under
 * `primary_expression`), so the terminal-alias wire ids of every concrete
 * kind in the closure are accepted, not only the member's own.
 */
```

#### body

```text
// A `parseName` accepts both spellings: the parse entry's own id (the
// alias display name a caller matches against) AND `kind`'s own storage
// entry id. Native stamps the storage id on an aliased hidden kind that
// has no `kindIdByKind` entry of its own — without this union that
// occurrence's runtime kind_id would never satisfy the accepted set.
```

#### body

```text
// Supertype-expanded subtypes each carry their OWN stamped
// storageKindId (assemble.ts's discovery-time stamp) — an alias
// occurrence's id can genuinely differ from what the name-keyed
// `kindIdByKind` lookup above resolves for that same subtype name.
// Union both sources; the stamped ids are the ones this defect class
// depends on, the name-keyed ids cover everything the stamp doesn't.
```

#### body

```text
// A pattern whose sole realization is a fixed literal (e.g. `_semicolon` =
// `choice($._automatic_semicolon, ';')` → `';'`) has no catalog row under
// its own hidden name, so neither the mint stamp nor the name-derived
// chain above resolves an id for it. Resolve through the same
// literal-first chain already used for `entry.literals`.
```

#### body

```text
// Anon-token occurrences aliased to this kind (`alias('match',
// $.identifier)` — soft keywords as names): the wire delivers the
// TOKEN's own grammar-symbol id there, and supertype expansion swallows
// the occurrence (only the kind survives as a subtype), so the token
// ids reach decode arms only through this kind-level stamp.
```

#### supertype dispatch order

A supertype's decoder claims every member's own storage ids before any id a member accepts only through its display
(`parseName`). A keyword shown as `identifier` accepts identifier's id through its display; claiming own ids first
keeps that id on the `Identifier` member, where a read identifier belongs.

### `packages/codegen/src/emitters/render-module.ts::kindIdStoredFirst`

```text
/** The arm order both transport enum builders (supertype and per-slot)
 *  emit: variants of id-stored kinds (keywords, tokens, enums) first, so
 *  a bare member id decodes to its own variant even when a pattern
 *  subtype also wears that id on the wire — rust aliases the primitive
 *  tokens onto `identifier` in expression position, so the alias wire-id
 *  map lists `u8`'s id under `identifier` grammar-wide, and in `_type` the
 *  first arm wins. Stable, so everything else keeps declaration order. */
```

### `packages/codegen/src/emitters/render-module.ts::assertRoutableTransportIds`

```text
/**
 * A concrete member kind that resolves zero ids would still get a variant in
 * the enum but no match arm ever routes to it — any node of this kind
 * arriving at this position falls through to the generated catch-all
 * `Err("unknown kind id")`, silently, with no compile error and no coverage
 * failure unless the corpus happens to exercise this exact shape. Kinds with
 * no catalog entry at all (VAPORIZED / inline / synthesized — see
 * `warnSkippedParserSymbol`) never had a parser symbol to route by in the
 * first place; that's a separate, already-surfaced condition, not this
 * check's concern.
 */
```

### `packages/codegen/src/emitters/render-module.ts::collectSlotEmissionMetadata`

```text
/**
 * Per-slot emission metadata for `emitStruct`'s typed dispatch, collected
 * from the assembled node's slots so generated code stays consistent with
 * what the transport struct emits (NonEmptyVec<...> vs Vec<...>, Box<...>
 * vs Option<Box<...>>). Named and unnamed slots are symmetric (cleanup
 * rules §E1) — both contribute transport fields.
 *
 * Separators are read from the slot's own NodeRef/TerminalValue metadata
 * (stamped at evaluate / wrapper-deletion time): a separator is a property
 * of the value, not the node, so each list-multiplicity slot's emission
 * gets its own — no node-wide fallback that would mask distinct per-slot
 * separators behind a single first-match. Flank modes travel the same way:
 * they are slot stamps that must reach template emission even when the
 * slot is UNNAMED — the surface only carries named slots, so a surface
 * entry for unnamed storage (e.g. a merged union slot's `content`) is
 * minted from the template body with default 'none' modes, silently
 * hardcoding the rendered flank to absent. The stamps collected here win
 * over those surface defaults at the call site.
 */
```

#### body

```text
// Template walker emits one template var per kind referenced by an
// unnamed slot (e.g. a slot with kinds [escape_sequence, string_content]
// surfaces both names in the template). Register every kind as an
// alias that points back to the slot's single storage so the template
// variables all bind to the same transport field. Skip aliases that
// collide with another slot's own name — declared fields take
// precedence. Only register aliases for unnamed MULTIPLE slots:
// single-value slots store one transport-shaped value that cannot
// be re-routed through a kind-named template variable, and the
// template-walker's "kind as variable" pattern only applies to the
// list-style `{{ kind | join(...) }}` emission.
```

#### body

```text
// Only mark as unnamed-alias when the alias resolves to this
// unnamed slot — see the storageByName guard above.
```

### `packages/codegen/src/emitters/render-module.ts::slotVerbatimIsImmediate`

```text
/**
 * True when every SCALAR-capable source of this slot is grammar-immediate —
 * the `ADJACENT` const on the slot's `SlotValue` carrier. Verbatim text on
 * the wire erases kind identity (a text-collapsed leaf, an inline terminal
 * and an unhydrated read stub all arrive as text), so the carrier can only
 * suppress the seam space when ALL sources that can produce one forbid
 * preceding whitespace: inline `TerminalValue`s via their own `immediate`
 * stamp, leaf kind refs via the referenced node's stamp. Non-leaf refs
 * can't scalarize and are ignored. Requires at least one scalar-capable
 * source — a vacuous pass would mark positions whose text comes from paths
 * this gate can't see.
 */
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportStruct`

#### body

```text
// Enum modelType: emit a Rust enum type with FromNapiValue / Display.
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportDataStruct`

#### body

```text
// 'list' shares 'branch's transport struct field emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

#### body

```text
// Named and unnamed slots emit symmetric per-slot transport fields. JS
// factories write `_<storageName>` keys for every slot regardless of
// named-ness, so the struct declares a field per slot keyed by that name.
```

#### body

```text
// INLINED-helper inner field storage: for each unnamed SINGULAR slot
// referencing an inlined hidden helper (`_<slotName>`, no CST node of
// its own — tree-sitter splices it), also emit the helper's inner
// NAMED fields as direct transport fields on the parent struct (e.g.
// `_value: Option<ExpressionTransport>` on ConstItemTransport).
//
// For an inlined ref the parent level IS the parser's real shape:
// the CST native reader exposes the inner grammar fields there
// (tree-sitter places `value` directly on `const_item`, not nested
// inside `_const_item_optional1`). Adding the direct fields lets
// the codec read the CST path without a nested helper
// object. The render fn then tries the direct field first, falling
// back to the helper for factory-built transports.
//
// An alias-VISIBLE helper ref is the opposite case: the CST
// materializes the helper's own node, the reader nests the inner
// fields inside it, and factories build the node — so a parent-level
// field could never be populated. Such refs may project their shape
// onto the factory surface (hoisting) but never into storage.
//
// MULTIPLE unnamed slots are excluded (`isMultiple` guard below): this
// hoist only makes sense for a single collapsed occurrence — a
// Vec-typed slot can hold 0, 1, or many nodes, so "hoisting" one into
// a scalar `Option<T>` field would silently drop every occurrence past
// the first. Vec-typed helpers also don't need this hoist for the
// stated CST-reader reason: the parser DOES emit the helper's inner
// fields as their own addressable per-element struct (the Vec element
// type), so the direct-field bypass this hoist exists for doesn't apply.
```

#### body

```text
// Track ALL already-emitted storage names to prevent duplicate fields.
// Includes: named slots, unnamed slots (helpers themselves), and any
// inner fields already hoisted from previous helpers in this loop.
```

#### body

```text
// Alias-visible ref → the helper has its own CST node; inner
// fields live inside it, never at the parent level (see the
// inlining-vs-hoisting note above).
```

```text
// skip unnamed inner slots
```

```text
// already present
```

#### body

```text
// Emit the inner field directly on the parent struct.
// Use the HELPER node's kind/typeName so per-slot enum references
// resolve to the helper's already-generated per-slot enum types
// (e.g. FunctionTypeTraitFormTraitTransportSlot, not a new
// FunctionTypeTraitTransportSlot that would be undefined).
// forceOptional=true: the outer helper is Option<HelperTransport>,
// so the hoisted direct field must always be Option<T> regardless
// of whether the inner slot is required inside the helper.
```

#### body

```text
// Track to avoid emitting the same inner field from multiple helpers.
```

#### body

```text
// The separated list's wire capture (wrap.ts's `emitSeparatedListWrap`) emits
// `_delimiter`/`_separator` sibling wire keys
// ONLY when the corresponding grammar-level mode/rule actually needs
// per-instance capture (design's "Field shape and wire capture"
// section) — mirror that same gating here so the struct never
// declares a field the wire can't populate.
```

#### body

```text
// Emit impl Display for this struct so any slot holding it, and the
// views over it, interpolate it without routing through the top-level
// render_transport_dispatch match.
//
// All struct impls render through their layout (TransportLayout::render),
// which streams leading/trailing trivia text around the node content.
// Enums carry no layout and are handled separately.
```

#### body

```text
// Tokens are anonymous (named=false); patterns and keywords are named (named=true).
```

Every field prints its wire key (`wireKeyAttr`): `$_layout` for the layout,
`_<storageName>` for a slot, `_delimiter` and `_separator` for a list's
captured flank and separator, and each spacing site's own key. The derive
expands the struct's codec from those keys.

Every struct passes its own kind id to `TransportLayout::render` (`None` when the kind has no parser id), so the sink holds a line end after a line-terminated kind (`RenderSink::end_line_after`). A leaf whose kind entry is anonymous renders in the token role (`ownsTrivia`), so its transport leaves held trailing entries held and doesn't seat them ahead of itself.

### `packages/codegen/src/emitters/render-module.ts::isPrepareFilled`

Whether a slot's value is filled by `prepare` when the caller leaves it out:
a single registered choice option (`registeredOption === 'choice'`, e.g.
typescript's `terminator`). An optional one is filled too: its blank is a
stored arm (`BLANK_KIND_ID`), so a slot left unset is one the options choose,
and the option may choose the blank.

### `packages/codegen/src/emitters/render-module.ts::isTransportRequired`

Whether a slot's transport field is required (a bare `SlotValue`, `NonEmptyVec`, or `String`) rather than an `Option` or a possibly empty `Vec`. A list is required when it holds at least one item (`isNonEmpty`, the predicate the types' `NonEmptyArray` reads, so the transport and the types state one fact). A single slot is required when it is required and not prepare-filled. Every transport-shape decision in this module (field types, render bindings, prepare loops, seat targets, napi dispatch order) asks this one predicate, so a prepare-filled slot decodes when absent and renders once `prepare` has filled it.

### `packages/codegen/src/emitters/render-module.ts::renderTransportField`

A field's optionality is `isTransportRequired`, unless the caller forces it
optional.

#### body

```text
/** When true, override required→false regardless of the slot's own multiplicity.
	 *  Used for group-lift inner fields hoisted to the parent struct: those fields
	 *  are accessible only when the outer optional helper is present, so the direct
	 *  field on the parent is always Option<T>, even if the inner slot is required
	 *  inside the helper. */
```

#### body

```text
// Generator-owned UntypedNode stores raw fields as `_<storageName>` top-level
// keys, and each slot's field is keyed the same (`wireKeyAttr`), so the
// boundary reads storage keys directly. Named and unnamed slots alike.
```

The field's type is `rustTransportSlotType` of the slot's
`transportSlotShapeOf`. A presence field is `Option<bool>`, not `bool`: the
wrap omits the key when the keyword is absent rather than sending `false`,
and the view treats `None` as not present.

### `packages/codegen/src/emitters/render-module.ts::slotCarrier`

```text
/**
 * The `SlotValue` carrier every slot position holds — one uniform tolerance
 * for values the position's own type cannot represent (an unhydrated read
 * stub, or free text where no text kind is admitted). `ADJACENT` rides on
 * the type because it is a grammar fact about the position, not about the
 * value that arrives there.
 */
```

### `packages/codegen/src/emitters/render-module.ts::supertypeKindByTypeNameCache`

```text
// Memoized lookup: supertype typeName → supertype kind. Used by back-edge
// detection in rustTransportSlotType to map a supertype-classified slot
// to the supertype kind that the SCC graph carries as a relay node.
```

### `packages/codegen/src/emitters/overlays/module.ts::OVERLAY_CHAIN`

```text
/** Fixed decoration order for the factories overlay stack: `refines` wraps
 *  `raw`, `polymorphs` wraps `refines`, `supertypes` wraps `polymorphs`.
 *  The order is fixed rather than derived because each layer's
 *  decorations depend on facts only available once the layer before it
 *  has resolved — a supertype attachment reads the polymorph layer's
 *  resolved variant surface, which reads the refine layer's resolved
 *  refinement forms, which reads the raw builders — so reordering the
 *  chain would reorder which facts are visible to which layer. */
```

### `packages/codegen/src/emitters/overlays/module.ts::overlayImportPath`

Import path each chain layer loads its predecessor from: index 0 (refines) imports `../bundle.js`; later layers import the previous overlay. The chain is raw → coerce → bundle → refines → polymorphs → supertypes → index.

### `packages/codegen/src/emitters/overlays/module.ts::emitFactoriesIndex`

Each entry is `export const <name>: Hoisted<typeof O.<name>> = hoistAs<typeof O.<name>>(O.<name>);`, so the annotation and the call carry the same type and nothing is related between the overlay's declared type and an inferred one.

Emits `factories/index.ts`, the dynamic final chain step: re-exports the top overlay and, for every bundle entry, `export const <exportName> = hoist(O.<exportName>);` — the consumer surface where a bare call is the coerce flavor and `.strict` stays reachable (recursively, sub-factory pairs included).

Every flattened parent is exported the same way through `hoistRoutes(O.<key>)`, so `ir.<parent>.<variant>(…)` is the coerce flavor and `.strict` stays reachable, just as for a bundled kind.

The arity bound comes from the pair itself: `emitBundleModule` stamps each entry, and every overlay builds its pairs through `bundle`, so the index passes no stamp.

### `packages/codegen/src/emitters/overlays/module.ts::overlayFrame`

Shared header for a static overlay module: imports the previous layer as `B`, any extra imports, and re-exports the previous layer; a layer shadows only the bundles it decorates.

### `packages/codegen/src/emitters/overlays/module.ts::BundleEntry`

One bundled kind: the model's keyed node (`IrKeyedNode`: `key`, `exportName`, `node`) with `maxArgs`, the kind's `BuiltTypeSurface.maxArgs`: the stamp `emitBundleModule` gives the entry's pair, absent for an unbounded (rest) calling convention.

### `packages/codegen/src/emitters/overlays/module.ts::bundleEntries`

The bundled kinds (`bundleKeyedNodes`) with their `maxArgs` (`withMaxArgs`) — consumed by the bundle module, the overlays, the index hoisting, and `ir.ts`. Which kinds are keyed, and under what names, is the model's decision (`irKeyedNodes`).

### `packages/codegen/src/emitters/overlays/module.ts::emitBundleModule`

Emits `factories/bundle.ts`: re-exports raw and coerce, then one line per entry — `export const <exportName> = bundle(F.<build>, C.<coerceTo>, { key, max });`, stamped with the entry's `maxArgs` (`bundleExpr`). The pairing is the one dynamic stage below the index.

### `packages/codegen/src/emitters/overlays/module.ts::bundleExpr`

The one spelling of a pair construction in generated code: `bundle(<strict>, <coerce> | undefined, { key, max })`, the stamp omitted when `max` is undefined. `key` is the route's dotted path from its `ir` key, which the refusal message names.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::parentRefs`

The strict/coerce expression pair for a parent builder; `coerce` is absent when the kind has no coercer.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::childRefs`

The strict/coerce expression pair for an arm: a direct child uses its own factories (strict builder doubling as the coerce seat when no coercer exists); a flattened arm references the decorated child const emitted above (`<childKey>.<path>.strict` / `.coerce`).

A child with one surface is forwarded as that surface on both sides. `builderRefs` gives the pair for a direct child: the raw builder, and the coercer only when the child is not an own-text leaf, since that leaf's coercer detects the spelled form and takes one argument where the entry takes the `affix` toggle. `coerceSideOf` names which member of a child's namespace is its coercing side: it follows the default variant of each flattened parent down to the kind the bare call builds, and answers `strict` when that kind has one surface, because the namespace then has no `coerce` member.

Given the wires, the refs also carry the child's arity, `max`: a route reference reads `routeArity`, a supertype or seated child's key reads `entryArity`, and a direct child reads `surfaceArity`. An arm that forwards the child's arguments takes this `max` as its own.

A flattened arm through a hoisted child references that child's private
wiring const under the same `<childKey>.<path>` spelling. Whenever the refs
spell a child's wiring const, they name that child in `set`, so the overlay
knows which private consts are read.

A supertype child (a variant-bearing kind with a flattened-parent const) is routed through that const's key, `<childKey>.strict` / `.coerce`, the same route a seated set takes; it has no raw factory of its own.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::OverlayChunk`

One wiring const's emitted lines (its methods and its const), whether it is
private (a hoisted compound's const), whether it carries methods, and the
kinds whose wiring consts its text reads (`uses`, collected from the `set`
of every ref the emitters wrote into it).

### `packages/codegen/src/emitters/overlays/polymorphs.ts::withoutUnusedPrivateSets`

Drops every private wiring const no other kept chunk reads, to a fixpoint (a
private const read only by a dropped one goes too). What reads a const is
exactly what the emitters wrote (`OverlayChunk.uses`): arms, seats, alias
routes and supertype variant routes all report through their refs' `set`,
so no reader is listed by hand. The helpers go before the first kept chunk
that has methods.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::inDependencyOrder`

Orders the overlay's chunks so each const is declared before any chunk that reads it. Each chunk is keyed by the node kind it provides, and a chunk waits until every kind in its `uses` that another chunk provides has been placed. Among ready chunks the original order wins, so chunks with no such dependency keep the order the overlay built them in. A sub-factory set that routes an arm through a flattened parent's const is placed after that const, and a flattened parent after the nested parents it names.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::renderArm`

Renders an arm entry and its nested children as one object literal and its type, the arm's pair through `bundleExpr` under its dotted route path: `name: bundle(…)` for a leaf arm, `name: { ...bundle(…), child: … }` when it has children. A namespace arm (no pair) contributes only its children. Each rendered pair records its path's arity in `PolymorphWires.routes`, which a later arm referencing the route reads through `routeArity`.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::ArmPair`

An arm's pair as named flavor consts plus its arity stamp; the renderer spells it through `bundleExpr` once the arm's route path is known.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::armPair`

Names an emission's composed flavors as consts, `<method>$strict` and `<method>$coerce`, pushes them among the overlay's methods, and returns the pair over those names. Every composed flavor is named before its `bundle` call because an inline generic composer call inside `bundle`'s arguments leaves TypeScript (7.0.2) unable to infer the flavor type while the stamp parameter depends on it: the flavor falls back to its constraint, `MaxArity` reads `number`, and every correct stamp is refused. A named const has a settled type, so the stamp is checked against the flavor exactly. Do not inline the composer calls back into `bundle`.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::armType`

The declared `strict`/`coerce` member types of an emitted arm, `coerce` omitted for a strict-only route.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::pairExpr`

Spells an arm pair at its route path and records the path's arity for later references.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::maxOf`

A spreadable `{ max }` that is empty when the arity is unbounded.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::surfaceArity`

The most arguments a kind's own factory flavor takes: its `BuiltTypeSurface.maxArgs`, or, for a keyword leaf with no surface, its coercer's (`keywordLeafArity`).

### `packages/codegen/src/emitters/overlays/polymorphs.ts::entryArity`

The arity of the pair at a kind's own entry, the call `<childKey>(…)` makes. A flattened parent's entry is its default variant's entry. A seated kind's entry is the seated pair (`seatedArity`) when that pair is the hoisted target: it has a coercer, or the entry is a private hoisted-compound const with no bundle beneath it; otherwise the bundle's coercer is the target and the kind's surface arity holds.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::routeArity`

The arity of a route referenced by its dotted path. A wire arm's path is read from `PolymorphWires.routes`, filled as each arm renders; children render before their parents. A flattened parent's variant routes render after the wire chunks, so their paths are resolved structurally: the variant's entry arity, or, for a deeper path, the same lookup under the variant's own entry key. A path that resolves to neither throws, since a reference to an unstamped route is a codegen defect.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatsOf`

A wire set's seat emissions, flatten first, then element seats, then tuple seats; `composeSeats` folds them and `seatedArity` reads them.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatedOptionsType`

The trailing options type a non-spread seated pair declares, present when the kind has a spelling option.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatedArity`

The seated pair's arity and whether it has a coerce flavor. A spread seat makes it unbounded; otherwise it takes its config, plus the options argument when `seatedOptionsType` is present. It is coercible when the parent has a coercer and every seat's child has one.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::shape`

The method text and parameter type of one sub-factory arm, chosen by what the
arm supplies. A value arm stamps its literal into the slot. A node arm with no
residual keys forwards the child's own arguments. A node arm whose child merges
its keys into the parent's config reads that config. A node arm whose child is
`parameterless` has no argument to receive: it takes only the parent's
remaining keys and stamps `child()` into the slot the way a value arm stamps
its literal, so a keyword arm or an arm holding only fixed text
(`attribute.self`, `exceptClause.empty`) takes the parent's config alone. That
check comes before the seated-config one, because a parameterless child whose
factory is config-shaped still has nothing to seat. The config parameter is
optional when no remaining slot is required, so `ir.exceptClause.empty()`
takes no argument at all. A node arm whose child takes a single config
argument seats it under the slot key. Every other node arm takes the slot's
key as the child's argument tuple and spreads it. The arity is the model's
`parameterless` stamp, the fact the factories emitter reads for a
zero-argument factory; the overlay never re-derives it.

Each shape also states the arity of the call it declares, `max`: 1 for a value arm that takes only options, 2 for every shape that takes its config (or positional argument) plus options, and `'child'` for a node arm that forwards the child's own arguments, whose bound is the child route's.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::flattenShape`

The method behind a flatten seat. For a config parent: partition the
caller's keys into the group's (`configKeysOf`) and the rest; when any group
key carries a value, build the group from them and seat it under the slot
key, otherwise pass the rest through — the type is the parent's own input
(the direct spelling with the built group under the seat key, and
`undefined` where the parent's argument is optional), which names none of the
group's flattened keys beside the seat (`WithoutGroup`), or `OmitEach<parent
config, seat> & (group config | NoneOf<group keys>)`, so the flattened keys
come together or not at all. The group's keys are read from its config type
without `$type`, and `WithoutGroup` lets a built node through as it is: a
node is not a config, and its accessors share the group's key names. The type
is written once, by `typeFor`, into the kind's rows; the method itself takes
`unknown` and partitions at run time. The parent's own input must forbid the group keys
itself: an object literal is checked for excess keys against the whole union,
so a partial group would otherwise pass as the parent's own input. The wrapped `strict` must satisfy the bundle's
signature too, which is why the parent's own input stays accepted. For a positional parent (a forwarded wrapper such as
`match_block`) there is nothing to partition: a built value or `undefined`
passes straight to the parent, anything else is the group's config and is
built first. The `$type` probe (`_built`) is what the raw forwarded wrapper
used to do; it lives here now, once, because the seating is the overlay's.

#### options

Every non-spread seat method (flatten, config elements, tuple) takes the
parent's trailing options argument and hands it to the parent through
`_fwd`, which appends it only when given: a parent such as `break_statement`
registers its `terminator` spelling there, and a seat that dropped it would
lose the spelling. Appending only a defined value keeps a bare-text call at
one argument, which the raw factory's arity dispatch depends on. The method's
own parameter is `unknown` — the methods are erased appliers, and the public
type lives on `$seated` (composeSeats).

#### wrapper seat

A visible wrapper seated on its parent (`match_pattern` on a match arm) has a config key equal to the seat's own slot key. The seated method takes the wrapper's kind id as a third argument and passes the config through untouched when the value at that key is already the wrapper, either built (its `$type` is the id) or a plain config whose keys all belong to the wrapper and that names no `kind`. Anything else at the key is the wrapper's own slot and is built into the wrapper.

### `packages/codegen/src/emitters/render-module-paths.ts::renderModuleLeftOutPath`

The sidecar beside a grammar's `test-fixtures.json`: the render fixtures the
parity extraction left out because their input, detached from the tree the
validator rendered it from, no longer renders the validated bytes, counted
by kind. The baseline collector reads it into `parityFixtures.leftOutByKind`
and the regression checker lets a kind's count only shrink, so a template
that stops reproducing its source fails the build instead of dropping out of
the fixture set unseen. Excluded from the manifest for the same reason the
fixture file is: both land in the validator's own commit.

### `packages/codegen/src/emitters/render-module.ts::kindOfImplLines`

The `KindOf` answer a generated transport type gives a kind-gated body: a
struct is its own kind, an enum answers for the variant it holds (a payload
variant delegates, a literal variant names its id), and a verbatim value
stands for whichever pattern kinds the position admits. Every transport
struct, supertype enum, per-slot enum, literal enum and `AnyTransport` gets
one, so a `SlotValue` of any generated type satisfies `KindTest`.

### `packages/codegen/src/emitters/render-module.ts::rustKindIdSlice`

The Rust slice literal a kind-gated arm tests against: the arm's kind names
expanded through `concreteKindsOf` (a supertype to its members) and mapped to
ids. A name with no id is an error, since a gate that can never fire would
silently drop the literal.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::elementsShape`

The method behind an elements seat. An element is the group's config when
it is a plain object without `$type` whose keys are all the group's config
keys (`configTest`); anything else passes through unchanged. A config
parent: the seat's array is mapped and the parent called with the rest. A
list, or a spread-shaped parent whose sole slot is the seat (python
`union_pattern`): the elements arrive as rest arguments and are mapped in
place, options object included, which the key test leaves alone. The
type admits the parent's own input or the group's config per element.

#### list options

A spread seat's parameter is the kind's own row, by name (`T.<Kind>.BuildArgs` / `LooseArgs`): `listBuiltTypeSurface` spells the list's forms once, with the seated group's config among the elements, so the options object is accepted first and rejected in every later position, and a non-empty list requires an element.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatEmission`

One seat's method, its application, and its parameter-type transform.
Seats compose: `emitPolymorphsOverlay` threads the parent's `strict` (and
`coerce`) through each flatten seat then each elements seat, so a parent with
both gets `m2(m1(F.parent, F.g1), F.g2)`. The parameter TYPE composes the
same way, in `seatedRowsOf`: each `typeFor` takes the type the previous seat
produced, the seated group's row (`T.<Group>.BuildArgs` / `LooseArgs`) and
its config type, all as type text and none as a `typeof` reference, because
the result is printed into `types.ts`, which cannot name a factory. A spread
seat has no `typeFor`; its kind's row already holds the seated element.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::methodName`

Transformation-method identifier for one sub-factory: `<parentKey>$<name>`, with non-identifier characters in the name replaced by `_`.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::collectPolymorphWires`

The wire sets the polymorph overlay emits: per parent, the arm routes the model settled (`armRoutesOf`: the parent's key, its filtered sub-factories and alias wires) plus the seats this walk adds — flatten seats (`flattenSeatsOf`), elements seats (`emittedElementsSeats`), tuple seats and the seats a forwarding owner takes from its list (`forwardedSeatsOf`) — and the traversal order (children, seat groups and alias children before their parent, DFS post-order). Consumed by `emitPolymorphsOverlay` AND by the generated-test emitter (`test.ts::emitSubFactoryTests`), so a test is emitted exactly for the wires that exist; the test emitter passes `silent` so diagnostics print once. The diagnostics the model recorded (ambiguous and shared-key sub-factories, context-mismatched arms) print here, as each parent is visited. The emit pass computes the wires once and hands the same map to the types emitter (seated rows) and to `emitPolymorphsOverlay`; a caller that runs outside that pass (`emitTypes`, the node-model and generated-test emitters) computes its own with `silent`.

A parent enters the map when it has subs, alias forms or seats: a parent with a seat and no subs still enters, because the seat rewrites its `strict`.

An alias wire's child visits before its parent too, like a seat's group. `variantRouteOf` reads whether the child's entry is already emitted when the parent's route is written. A child emitted later would leave its route as a bare `{ strict, coerce }` pair and its own entry unreferenced.

The wires also carry the node map, the flattened variant parents by kind, and `routes`, the arity of every rendered arm path, which the emitter fills in chunk order and `routeArity` reads.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::emitSub`

A positional parent (one direct slot) wraps with the raw builder in both flavors. The wrapping step's input is always the built child, and the parent's coercer would hand that child back unbuilt when it is of the parent's own kind (a self-recursive arm such as python's `parenthesized_list_splat.parenthesizedListSplat`), collapsing one level of nesting. A config-shaped parent keeps its coercer, since its residual slots arrive loose. Whether a route has a coerce flavor at all is unchanged: it still requires both the parent's and the child's coercer to exist.

Renders one sub-factory's transformation method and its two applications. Methods are generic over the function types themselves (`PF` for the parent, `CF` for the child) with parameter and return types indexed off them (`Parameters<PF>[0]`, `ReturnType<PF>`), because a type parameter constrained by another inference variable and appearing only in a contravariant function-parameter position makes TypeScript fall back to the constraint instead of inferring — any parent with a residual field would then fail to apply. The two internal calls are made through erased views (`parent as (arg: unknown) => ReturnType<PF>`); the external signature and the emitted per-wire type annotations stay exact. Shapes: literal fix (with/without residual, positional/keyed), positional/keyed seat, config merge (path-empty arms only; keys split by a baked owner list), config seat (a path-empty config-shaped arm that does not merge, `seatsConfigChild`: the child's config object sits whole under the slot key, `{ function: { macro, arguments }, arguments }`), and tuple-spread for every other residual arm — flattened arms always tuple-spread, since their seated value is the sub-factory's own argument tuple.

The emission carries its method's name, which `armPair` builds the flavor const names from, and its arity: the shape's own `max`, or the child refs' `max` for a shape that forwards the child's arguments.

### `packages/codegen/src/emitters/overlays/refines.ts::emitRefinesOverlay`

Static wiring for refine forms over bundles: for each kind with refine forms, spreads the bundle (`...B.<key>`) and wires each form as `bundle(F.<refineFormFactory>, undefined, { key, max })` under its camelCase key (plus the raw form name when it differs), stamped with the form's `refineFormBuiltTypeSurfaceOf` arity. Refine forms have no emitted coercers, so the pair carries only `strict`.

The overlay table and each form's pair are frozen.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::tupleShape`

The method behind a tuple seat: destructure the slot, spread it into the
child, hand the rest to the parent. An array in that slot is the seated form
and anything else is the parent's own input, which is what keeps the nested
call (`fields: ir.structPatternElements.strict(a, b)`) working alongside it.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeSeats`

Folds a kind's seats onto its own factory and names the result
`<key>$seated`. Every mount route builds on that name instead of the raw
factory, so a mount carries the parent's seats rather than dropping them:
python `case_clause` seats its patterns as a tuple AND mounts its suite, and
`ir.exceptClause.block.strict({ content, suite })` keeps its flattened
`content`. Without the name there is nothing a mount could reference, because
a composed call expression has no `typeof`.

`<key>$seated` and `<key>$seatedCoerce` are annotated `(...args: T.<Type>.BuildArgs)` and `(...args: T.<Type>.LooseArgs)`: the seated call's type is the kind's row and is spelled nowhere else. The entry's type replaces the bundle's own `strict` / `coerce` with them (`Omit<typeof B.<key>, 'strict' | 'coerce'> & …`) rather than intersecting, since the seated row already holds the plain form and two stacked signatures make the hoisted call's argument type too deep to compare.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatedRowsOf`

The `BuildArgs` / `LooseArgs` rows of a kind with seats, from the same wire set the overlay emits its methods from (`PolymorphWires.byKind`) and the kind's one-parameter row (`BuiltTypeSurface.row`): the row's type folded through each seat's `typeFor`, with the trailing options kept. It returns nothing for a kind without seats, without a one-parameter row, or with a spread seat, whose rows the surface already prints. The loose row is seated only when every seat's group has a coercer (`seatedArity`), which is when the overlay emits `$seatedCoerce`; otherwise it stays the plain row, as the hoisted call then stays the bundle's coercer.

The seated pair is spread onto the entry through `bundle`, stamped with `seatedArity`, so it replaces the bundle's own stamp together with its flavors. A public entry whose seated pair has no coerce flavor keeps a bare `strict` line instead: the bundle's coercer stays the hoisted target, and the bundle's stamp is its bound.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatedParent`

The strict and coerce entry points of a parent whose arms are seated into it: the parent's builder composed with each seat, typed to accept the parent's own input or a seated child's. When the parent has an empty form, each entry point is emitted as an overloaded function through `withEmptyOverload`, so `ir.<kind>()` keeps its `Empty<TypeName>` type through the overlay. Otherwise it stays a typed `const`. Called with no argument, the composed builder calls the parent with none, so the runtime realizes the same empty node.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::nestingArmOf`

Where a nested arm sits: under the direct arm reaching the same child, at
the keys the child spells for the entry it forwards to. A variant minted
inside another variant's rule is spelled inside it,
`ir.visibilityModifier.pub.scope.inPath`, never a flat `inPath` that reads
as its sibling. When the child's entry is itself nested, the keys are the
child's emitted path to it (`emittedArmPath`), so the parent's namespace
mirrors the child's at every depth; otherwise the key is the child's own
arm name. A nested arm whose child no parent arm reaches stays flat, and a
clash on the short key falls back to the flattened name.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::emittedArmPath`

How an arm is spelled on its emitted entry: its own name at the top, or its
host's name followed by the keys it nests under, one per level, however deep
(`nestingArmOf`). Every reader of an arm's spelling goes through this — the
child references inside the overlay, the seat stamps in the node model, and
the generated per-kind tests — so no second derivation can drift from what was
emitted.

The overlay's mount loop places arms in two passes — every emitted arm is
built first, then each nested arm attaches under its host — so nesting does
not depend on the order the derivation listed the arms in. A host that
appears after an arm it hosts (python `case_pattern`'s `negative` after the
`integer` and `float` it hosts) still receives them.


### `packages/codegen/src/emitters/overlays/polymorphs.ts::entryRowsByIrPath`

```text
Rewrites the paths recorded during emission, which start at an emitted const's name, as paths from
the public `ir` namespace. An emitted set referenced under another path (a nested parent, a child's
own sub-factory set) is reachable under every path that references it, so its entries repeat under
each; a set with no `ir` key of its own (a hoisted compound's private set) is reachable only that way.
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::variantChildAt`

```text
The kind a path of variant or alias names leads to, starting from a kind, or undefined when a step is
neither. Read from the same route and alias facts the overlay emits from.
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatBearing`

Whether a child must be reached through its own overlay entry rather than its
raw builder. A seat-bearing child takes the seated shape (a group's config, a
tuple), which the raw builder cannot read, so a mount or seat wired to the raw
builder silently collapses it. A seat is also what puts a `strict` on the
entry: a wire set of arms alone is a bare mount namespace with none, and a
leaf has no `strict` at all because its strict and loose forms are one call. A
child in a cycle with its parent cannot be declared first, so it keeps the raw
builder.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::childChains`

The chained arm keys recorded for a nested arm's last path key, on its
child's kind (`chainedByKind.get(sub.arm.child.kind)?.get(<last path
key>)`, empty when the arm isn't node-backed or nests at depth zero). A
parent that mounts a child variant's arms (`except_clause`'s
`exception.list`, reached through the `exception` variant) mounts the
child's chain beneath it the same way, as another route onto the child's
composed `list.block`, so the parent spells `exception.list.block` without
composing a chain of its own. Composing it at the parent would apply the
inner arm to the parent's builder instead of the variant's. `wires.order`
emits a child before its parent, so the child's chains are recorded first.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeAcrossSlots`

Arms of one slot chain onto arms of another. A kind with two arm-seated slots
has to name both in one call — python `except a, b:` needs the exception's
`list` and the suite's `block` — and each arm on its own is a whole route
wrapping the parent, so a caller could otherwise pick only one. A later slot's
arms are emitted again under each earlier arm, applied to it, giving
`ir.exceptClause.exception.list.block`. The applied route needs a name, since
a call expression has no `typeof` for the parameter types. Only a kind whose
arms span two slots emits any of this.


Each chain it builds is recorded by the outer arm's name, so a parent that mounts this kind's arms can mount the chains too (`childChains`).

### `packages/codegen/src/emitters/overlays/polymorphs.ts::emitPolymorphsOverlay`

Static wiring for sub-factories over bundles. One module-local transformation method per sub-factory (`<parentKey>$<name>`), applied twice — once to the strict pair (`F.*`), once to the coerce pair (`C.*`). Wiring consts carry explicit type annotations (`typeof B.<key> & { <n>: { strict: <sig>; coerce: <sig> } }`) so declaration emit never exceeds the compiler's serialization limit. Coerce applications exist only where the coerce emitter actually emits the coercer (`classifyFromEmission === 'emit'`); a child with no coercer is seated with its strict builder inside the parent's coercer. Alias wires (`variantAliasWires`) emit inside the same wiring const with no method; each is the child's variant route (below), so a child with its own overlay entry keeps its sub-factories under the alias. In per-slot transport enums, id claims are ordered literal variants → enum-kind arms → other kind arms: alias-wire id sets legitimately overlap (identifier accepts primitive-keyword ids for OBJECT payloads carrying `$text`), but a bare number must reach the arm that can render it from the id alone — an `IdentifierTransport` built from a number has an empty `$text` and renders nothing. Parents emit DFS post-order so flattened wires reference the decorated child const above. Skipped sub-factories print `[codegen] <parent>: sub-factory <name> skipped (<reason>): <claimants>` on console.warn.

A default route (`route.default`) binds the parent's own `strict`/`coerce` to that arm's builders, so the hoisted parent is callable and a bare call builds the default arm. A supertype whose arms carry `variantOf` gets the callable bundle through its default arm the same way (rust `ir.comment` over `line_comment`/`block_comment`).

A hoisted parent's wiring const is module-private — `const <factoryName>: {
… } = { … }` with no `export` and no `...B.<key>` spread, since the bundle
has no entry for it — and is emitted before the parents that flatten
through it (post-order).

`NoneOf<T>` (every key of `T` forbidden) and `_built` (the `$type` probe)
ride in the erased-helper block for the flatten methods.

Flattened parents emit last as plain route objects (`export const <parent> = { <variant>: … }`). A `leaf` route (`FlattenedVariantRoute.leaf`, a child with no factory of its own) skips `variantRouteOf` entirely and is emitted as the child's own kind-id expression (`empty: TSKindId.Newline`), never seated in `defaultRoutes` and never itself a nested-parent target. Every other route (`variantRouteOf`, shared by flattened routes and alias wires) is, in order of preference: a nested flattened parent's route object; a bundle entry (`B.<key>`) when the kind is bundled and has no overlay entry; the kind's overlay entry itself when that entry already carries `strict`/`coerce` (a seated entry, or a non-hoisted one spread from its bundle); otherwise `{ strict, coerce, ...entry }`, the raw pair merged with the hoisted kind's own sub-factory object. `variantRouteOf` also returns the bare `strict`/`coerce` refs it used to build `.value`, not just the rendered strings, because a route declared `arm.default` (`FlattenedVariantRoute.default`) hoists those refs onto the PARENT's own object (`{ strict: <default's strict>, coerce: <default's coerce>, <variant>: … }`) — so `hoistRoutes` sees a flavor pair at the top of the route object and makes the parent itself callable (`ir.arrayExpression(...)` builds the `list` variant, the default, while `.semi` and `.list` stay reachable). A default nested through another flattened parent only carries through when that inner parent resolved a default of its own.

It imports the grammar types as `T` when any emitted block names `T.`.

Every table the overlay emits (a wired parent, a private set, a flattened variant parent) is frozen where it is built, and so is a route pair it builds for a variant child; the pairs a sub-factory method emits are consumed by hoisting, which builds a frozen callable from them.

Alias routes, variant routes and a flattened parent's default pair are built through `bundle` with the variant child's `entryArity` as their stamp, keyed by their dotted route path; alias paths are recorded in `routes` like arm paths.

A route to a kind with one surface (`hasOneSurface`) is the kind's raw entry itself (`empty: F.buildCharLiteralEmpty`, `pass: F.buildPassStatement`), never a bundle: the same function or constant the top of `ir` holds. A default route to a pattern leaf binds the parent's call to that builder with no coercer; a kind stored as its id cannot be a default, since there is nothing to call, and throws. A forwarding sub-factory that reaches such a kind through a path (`nonSpecialToken.char.empty`) reads the kind's builder and coercer directly (`variantChildAt`), because the routed entry has no `.strict` / `.coerce` to read; it still fills the parent's slot, so its coerce flavor keeps accepting a built leaf.

The return carries, beside the module text, `entryRows`: every `ir` path whose entry is a kind's own entry, mapped to that kind (`entryRowsByIrPath`), recorded at the one place a route is resolved (`variantRouteOf`) and for a parent's default call. `forwardingPaths` are the remaining routed paths: sub-factories that build the parent. Their argument type is spelled from the parent's and the child's builders (`paramFor(parent, child) => ReturnType<parent>`), so no kind's row declares them and nothing compares them.

### `packages/codegen/src/emitters/options.ts::kindIdArmType`

```text
/**
 * Types a preference arm by its kind id: `TSKindId.<member>` looked up in
 * the kind catalog, so an option value is always a kind the parser knows.
 * An arm without a kind (the delimiter bitflag members) is already type
 * text and passes through. A kind with no catalog entry is a build error,
 * never a string fallback.
 */
```

The blank arm is typed `null`.

### `packages/codegen/src/emitters/options.ts::renderOptionsModule`

Source text for `options.ts`: a re-export of `WhitespaceKindId` and `LayoutKindId`
(declared in `types.ts`, where the hints that use them live), `LabelOptions`
from the label roots, `IndentChar` (the `indentChars` texts as a union,
`never` when there are none), `LineEnding` (the `newlineArms` as a union, `never`
when the grammar admits no `_newline`; named `LineEnding` because `Newline` is
the whitespace kind's own type), and `Options = DerivedOptions<T.OptionsHintMap,
IndentChar, LineEnding> & LabelOptions`. There is no address table and no mapped type over one: every
kind's sites are on its namespace as `X.Hints` (`emitOptionsHints`),
`OptionsHintMap` points at them by key, and `DerivedOptions` in
`@sittir/types` is a plain mapped type over that map, so each property
resolves lazily. The `layout` group comes with `DerivedOptions`: `layout.indent`
only where `IndentChar` is not `never`, `layout.newline` only where `LineEnding`
is not `never`. Without the kind aliases (a
grammar with no sites) the two aliases are declared `never` here instead of
re-exported.

### `packages/codegen/src/emitters/options.ts::OptionsModuleInputs`

What the module is written from: the kind aliases (`layoutKindAliasesOf`), the
hint emitter over the address tables (`hintEmitterOf`), whose label roots
become `LabelOptions`, and the grammar's indent characters (`indentChars`),
which become `IndentChar`, and its line-ending arms (`newlineArms`), which become `LineEnding`.

### `packages/codegen/src/emitters/options.ts::addressTablesFor`

```text
/** The one place that assembles `deriveAddressTables`'s remaining inputs —
 *  the declared `options:` block read against the grammar's public kind
 *  names, and the supertype-membership map — from a node map, kind catalog
 *  and already-collected sites. `emit.ts` calls this once per grammar and
 *  threads the resulting `AddressTables` into `emitTypes`, `emitOptions` and
 *  `emitRenderModule`, so the TypeScript hints and the Rust address trie are
 *  never derived from two independent builds of the same inputs. A caller with no `AddressTables` in hand yet (a test)
 *  may call this directly; production has exactly one call site. */
```

A label's entry reaches only the bound sites that admit the label's declared arm (`admitsArm`), the same test that decides which sites the declaration registers.

### `packages/codegen/src/emitters/options.ts::emitOptions`

`options.ts` for one grammar package, from the site preferences
(`collectSitePreferences`, unless the caller passes them), the kind catalog
and the address tables (`config.addresses` when `emit.ts` already built them
through `addressTablesFor`). The catalog is required: option values are typed
by kind id and there is no fallback spelling.

### `packages/codegen/src/emitters/options.ts::optionKey`

The key a segment is written under on the options surface, in TypeScript
and in the Rust trie alike: `snakeToCamel` of its `nestedKey`. It is the one
casing of an option key. Canonical paths (the `options:` block, error
messages, `SiteRef.path`) keep the grammar's snake spelling; only the key a
caller writes is camel-cased. A serde or napi rename on the Rust side would
be a second casing implementation, and the trie is a codegen table, not a
derived struct, so the rename happens here once.

### `packages/codegen/src/emitters/options.ts::DirectChild`

One address one segment below some prefix: its snake `name` (the order key),
its option `key`, and whichever of `branch`/`leaf` it is.

### `packages/codegen/src/emitters/options.ts::ChildIndex`

Every branch and leaf bucketed by its parent's canonical address, each bucket
sorted by snake name, so the hint printer and the trie printer walk the same
children in the same order with one lookup per level.

### `packages/codegen/src/emitters/options.ts::childIndexOf`

Builds the `ChildIndex`. Takes `kindEntries` because a literal segment's
name is its token's kind name (`nestedKey`), the same derivation the address
tables used for `path` and `children`.

### `packages/codegen/src/emitters/options.ts::LayoutKindAliases`

The two unions every layout leaf is typed by: `whitespaceType`, the
whitespace kinds (the `_layout` members a separator admits), and
`layoutType`, the layout kinds (every member, indent and dedent included,
when some site admits depth; otherwise the same as `whitespaceType`).

### `packages/codegen/src/emitters/options.ts::layoutKindAliasesOf`

`LayoutKindAliases` for a grammar, from `whitespaceKindsOf`/`layoutKindsOf` and
whether any site admits depth. `types.ts` declares the aliases from it and
`options.ts` re-exports them, so there is one source.

### `packages/codegen/src/emitters/options.ts::layoutKindAliasName`

Writes a leaf type as `WhitespaceKindId` or `LayoutKindId` when it is exactly one
of the two unions, and as itself otherwise.

### `packages/codegen/src/emitters/options.ts::HintEmitter`

What the types and options emitters read off the address tables: every root
of the trie as a `HintRoot`, in the shared index's order.

### `packages/codegen/src/emitters/options.ts::HintRoot`

One root of the address trie as the hint surfaces see it: its snake `name`
(a kind's public name or a label), its `key` (`optionKey`), its printed
`hint`, and whether it is a `label`.

### `packages/codegen/src/emitters/options.ts::hintEmitterOf`

Prints each root's sites as one nested object type, from the same
`ChildIndex` the Rust trie is printed from, so the two surfaces cannot
disagree on which sites exist or how a key is spelled: a root's key is its
index entry's `optionKey`, the same key the trie root carries. Every level
is optional, so the hint is the option shape a caller writes. A root that is
not a kind's public name (`kinds`) is a label. An address that is a site at
the root has no hint home and fails at codegen.

### `render options: LabelOptions` (emitted into `options.ts`)

The virtual kinds a grammar declares in its `options:` block (`body`,
`quotes`, `statements`, …), each typed by the sites bound to it, keyed and
nested like the kind hints. They are not kinds, so they have no namespace to
carry a hint; this interface is their home. It is derived from the label
roots of the same address tables, not kept by hand, and it is the only
residual table on the TypeScript options surface.

### `packages/codegen/src/emitters/templates.ts::hasFlankSignal`

```text
/**
 * Whether a repeated slot carries any optional or mandatory flank — from
 * the rule's separator record, a value-level leading/trailing stamp, or the
 * slot's own delimiter facts. Only the seam-boundary audit reads it now: a
 * template names the slot and nothing else, so the flanks reach the view
 * through the transport's `_delimiter`, never through a filter choice.
 */
```

### `packages/codegen/src/emitters/templates.ts::emitListSlot`

```text
/**
 * A repeated slot in a template is `{{ slot }}`. The view behind the slot
 * carries the separator token, the spacing around it and the flanks, so the
 * template never spells a separator; the seam-boundary audit still uses the
 * static separator text to classify the interior seam.
 */
```

### `packages/codegen/src/emitters/render-options-rs.ts::SpacingSite`

```text
/**
 * One spacing-table site of the render crate: the owning kind's visible
 * name and slot, the label that is its option key, the dense constant and
 * the transport field it fills (the site key, wire `_<site key>`),
 * the default kind id and the ids it admits. `side` is present only for
 * synthesized separator spacing (before, after, or the single gap of an
 * unseparated repeat), which is what gives the site a transport field; a
 * declared preference has none because its choice is already a slot.
 */
```

A list whose separator is a choice of literal tokens has one more row:
`role: 'separator'`, field `separator_kind`, wire key `_separator`, the
declared default's kind id and the choice's literal kinds as `allowedIds`,
and `defaultText` (the default token's text) for the render's fallback
arm. It has no `side` and registers no top-level label, like the
delimiter site.

`strength` (`SeamStrength`, 0–2) is the sixth column of the emitted
`SPACING_SITES` row: how firmly the site's table default holds against the
mark meeting it at the same gap. `seamStrength` maps the site's origin —
declared (`preference`, `literal-default`, `word-default`) is 2, `cascade` is 1, the fallback
is 0; separator sites are declared.

### `packages/codegen/src/emitters/render-options-rs.ts::armIdOf`

The kind id one preference arm stands for: `BLANK_KIND_ID` for the blank arm,
else the id of the arm's kind (or of its value, for an arm with no kind). The
native options table's allowed and default ids, and the factory map's
`optionDefault`, both come from it.

### `packages/codegen/src/emitters/render-options-rs.ts::SeamStrength`

How firmly a site's table default holds against the mark meeting it at the
same gap: a declared value (a preference or literal-default row, a keyword's
word-default, or a value set on the node) outranks a cascaded one (the edge
token's face reaching the kind edge), which outranks the bare fallback.

### `packages/codegen/src/emitters/render-options-rs.ts::seamStrength`

An exhaustive switch over `SeamOrigin | undefined`: `preference`,
`literal-default` and `word-default` are declared (2), `cascade` is 1, and
`fallback` or no origin is 0. A new origin fails to compile here until it is
given a strength.

### `packages/codegen/src/emitters/render-options-rs.ts::SEAM_DECLARED`

The declared strength (2), named once on the TypeScript side so the plan's
fixed-strength rows (separators, list flanks) and `seamStrength`'s declared
origins spell the same value core's `spacing::SEAM_DECLARED` holds.

### `packages/codegen/src/emitters/render-options-rs.ts::edgeSitesOf`

The per-kind edge rows: for each spacing site that is its kind's own edge
(`isKindEdge`), the kind's id (`edgeKindId`) and the site index of its before
and after edge, plus, for a kind whose edge is a choice of tokens, the arm sites
of each side: one `{ arm, site }` per arm site (`edgeArm`), keyed by the arm
token's kind id. An arm token with no kind id is an error. Kinds whose name
resolves to more than one id are dropped, and rows come out in id order.
`renderOptionsRs` writes them as `EDGE_SITES` (`before_arms`/`after_arms`) and
indexes them by kind id in the dense `EDGE_ROWS` table (`denseTable`), so the
runtime reaches a kind's row by one array read. A source coordinate of that
kind meets these seams like a rendered node would, and a transport's
`prepare_edges` and `w.edge` read the same rows, so the render emitter checks
a kind with edge sites against this table (`edgeIdOf`).

### `packages/codegen/src/emitters/render-options-rs.ts::isKindEdge`

Whether a spacing site is its kind's own edge: its address parses as a seam
whose token is the kind itself (`<kind>_before`/`<kind>_after`). One
predicate for the edge table, the transport emitter's edge writes and its
field filter, so they cannot disagree on which sites live in the base.

### `packages/codegen/src/emitters/render-options-rs.ts::edgeKindId`

The id a kind's edges are keyed by: the kind's catalog entry by public name.
`EDGE_SITES` rows, a transport's `Edged::kind_id` and every `w.edge` call
take it from here, so a kind's edges are found under the id they were
written with.

### `packages/codegen/src/emitters/render-options-rs.ts::carriesPerNodeValue`

Whether a spacing site keeps a field on its transport: only list facts do —
the separator row and a list's gap sites (`before`, `after`, `gap`), which
the reader's gap classifier stamps per node. A token seam and a list flank
have no per-node value; the body reads them from the resolved options with
`w.site_at`, and a kind edge lives in the transport's base `edges`.

### `packages/codegen/src/emitters/render-options-rs.ts::SeatTable`

One slot's seat table before emission: its constant name and its rows (kind
id, site index), sorted by kind id.

### `packages/codegen/src/emitters/render-options-rs.ts::seatTableName`

`SEATS_<KIND>_<SLOT>`, the constant a slot's seat table is emitted under
and `seatLoops` passes to `fill_seated_gaps`.

### `packages/codegen/src/emitters/render-options-rs.ts::seatEdgeSide`

The side of a seated site's edge, read from the parsed label of the child's
edge address the site carries (`seat.field`). A seat whose label is not the
seated kind's own edge is a malformed site and fails generation.

### `packages/codegen/src/emitters/render-options-rs.ts::seatTablesOf`

Groups every seated spacing site by its list (kind, slot) into a
`SeatTable` keyed by the seated element's kind id, the id the transport
carries for that element (for an alias element, the envelope's own id). A
seat must fill the element's `after` edge (a sibling gap is the preceding
element's own trailing edge); a seat on a `before` edge, a seated kind with
no id, or one kind seated twice in the same list fails at codegen. The rows
are written as a dense table indexed by kind id (`denseTable`).

### `packages/codegen/src/emitters/render-options-rs.ts::seatedTableNames`

The seat-table name of every list that seats something, from the same
grouping key `seatTablesOf` uses, so `seatLoops` asks the tables' own
grouping whether a slot has seats.

### `packages/codegen/src/emitters/render-options-rs.ts::DelimiterSite`

```text
/** A list slot with an optional flank: its constant and the union of
 *  `Delimiter` bits the grammar lets a caller set. */
```

### `packages/codegen/src/emitters/render-options-rs.ts::RenderOptionsPlan`

```text
/** Everything `options.rs` is written from, in emission order: spacing and
*  delimiter sites, the merged path table over both, the depth walk, and
 *  the layout kinds' render text. */
```

`indentChars` is the grammar's indent characters (`indentChars`), written as `OptionTables.indent_chars`: the runtime refuses a `layout.indent` unit that is empty or holds any other character, and treats `layout.indent` as an unknown key when there are none.

`newlineArms` is the grammar's line-ending arms (`newlineArms`), written as `OptionTables.newline_arms`: the runtime refuses a `layout.newline` outside them, naming them, and treats `layout.newline` as an unknown key when there are none. `newline` is the preferred arm (`PREFERRED_NEWLINE`), written into the generated `defaults()` as `newline: "<arm>".to_string()`, so the default ending comes from the model's preference; core's own `Default` holds the writer's internal spelling only, for tables built outside a generated grammar.

`indent` is the grammar's declared indent unit (`indentUnitOf`), empty for a grammar whose whitespace admits no indent characters. `renderOptionsRs` writes it into the generated `defaults()` as `indent: "<unit>".to_string()`, so the unit is the grammar's and core has no default of its own; an empty unit emits no line and `defaults()` keeps core's empty unit.

### `packages/codegen/src/emitters/render-options-rs.ts::DepthSites`

A kind and the indices of its sites that admit `indent` or `dedent`, in
rule order. `resolve()` walks each kind's list over the resolved table and
refuses a `dedent` with no indent open before it or an indent still open
at the end, the same walk the build runs over the declared defaults
(`validateIndentDepth`).

### `packages/codegen/src/emitters/render-options-rs.ts::planRenderOptions`

```text
/**
 * Numbers the sites densely — kind, then slot, then label — so the constants
 * are stable across regenerations, resolves every arm to its kind id (a
 * missing id is a build error), and folds the delimiter arms into one
 * bitflag union. Whitespace text is sorted for the same reason.
 */
```

`spacing_text` writes each whitespace kind's literal text: a depth mark
(`isDepthText`) as it is, anything else behind a SEAM mark. `INDENT_KIND`
and `DEDENT_KIND` are the ids of the kinds whose text is `INDENT_TEXT` and
`DEDENT_TEXT`, zero when the grammar declares neither.

A `source: 'separator'` site becomes a spacing-table row under its kind
(`SITE_<KIND>_<SLOT>_SEPARATOR`) that fills `separator_kind`; its
default's token text is stamped on the row as `defaultText` here, where
the kind catalog is in hand, so the render emitter never re-derives it.

A row's strength is what the sink writes the site's default arm at:
`SiteSpec` carries it into the resolved options, and `site_arm`/`edge_arm`
use it when the arm is the default and `SEAM_DECLARED` otherwise, so a value
set on the node counts as declared. A separator row carries
`SEAM_DECLARED` regardless of origin: the list view writes it at declared
strength, so the row states the strength render uses. A list flank row
(`start`/`end`) takes its origin's strength like any other site: only a
flank a grammar row or a node value declares holds its gap at declared
strength, and an undeclared flank yields to any declared token face there.
A declared flank that meets a declared token face at one gap wins it
whatever their widths (core's `RenderSink::flank_at`, which the list view
writes its flanks through): the flank is written only inside a list that
has members, so it is the more specific fact about that gap, and an empty
list leaves the gap to the face alone (`{}`). A value set explicitly to the default of a cascaded site is
indistinguishable from the default and takes the cascade tier; the
read-side inference that will set such values records explicitness when it
lands.

A site's blank arm is the blank id (`armIdOf`) in its allowed ids and as its default.

### `packages/codegen/src/emitters/render-options-rs.ts::renderOptionsRs`

Source text of a render crate's `options.rs`: the site constants,
`SPACING_SITES`/`DELIMITER_SITES`/`SITE_SPECS`, the edge rows and their
kind-indexed `EDGE_ROWS`, one dense `SEATS_*` table per seated slot
(`seatTablesOf`), `DEPTH_SITES`, `spacing_text`, `defaults()`, the address
trie `ADDRESSES` (`emitAddressTrie`), a `Sites` marker implementing
`sittir_core::options::OptionSites` over those tables, and
`pub type Options = sittir_core::options::Options<Sites>`. `KIND_FLAGS` (`kindFlagsOf`, through `denseFlags`) sits beside `EDGE_ROWS`, and `defaults()` hands it to the resolved options as `kind_flags`. No per-grammar
struct, deserializer or resolver is emitted: reading a JS object through the
trie and resolving it over a base table live once in core, and this file only
supplies the tables. `defaults()` builds `spacing` through
`ResolvedOptions::default_spacing`, so every site is already a `SeamArm` at
its default arm and strength. A text whitespace kind's string is written with
the core writer's seam mark in front, so every option-driven whitespace
coalesces in the writer; the indent and dedent kinds keep their own mark
constants.

### `packages/codegen/src/emitters/render-options-rs.ts::allowed`

`allowed(site) -> &'static [u16]`: the arms a spacing site admits, the last
column of its `SPACING_SITES` row. It is one of the `OptionTables` a grammar's
`Sites` marker hands core, so `Options::resolve` refuses a value the site does
not admit, and the prepare walk's gap classification asks it which measured
gap a site may take.

### `packages/codegen/src/emitters/render-options-rs.ts::siteRefsOf`

The site each of a leaf's `canonical` entries names, looked up in the
`SiteIndex` by its canonical address. Exactly one site must answer each
entry: none, or more than one at the same address, fails at codegen rather
than silently taking the first. One entry for an ordinary site, every bound
site for a declaration reached through bindings. A leaf whose entries mix
spacing and delimiter sites (its trie node would have to be two variants)
also fails.

### `packages/codegen/src/emitters/render-options-rs.ts::SiteIndex`

```text
/** `plan.sitePaths` bucketed by each site's own canonical address, built
 *  once per emit so `siteRefsOf` is a hash lookup instead of a scan over
 *  every site for every leaf. */
```

### `packages/codegen/src/emitters/render-options-rs.ts::siteIndexOf`

Builds a `SiteIndex`: every `plan.sitePaths` entry keyed by
`formatPreferencePath` of its own `segments`, the canonical string identity
`siteRefsOf`, `childIndexOf` and `emitAddressLevel` all share.

### `packages/codegen/src/emitters/render-options-rs.ts::resolveTests`

The generated `#[cfg(test)] mod resolve_tests`, one smoke test per error
shape the core walk can raise, since the core trie test cannot know a
grammar's real addresses: no options leaves `defaults()`; an unknown root key
is refused; an unknown key beneath the first branch is refused naming the
branch's canonical path; the first leaf with an arm every site it names admits
and at least one does not hold by default (`admittedEverywhere`) changes
exactly those sites' arms; the first spacing leaf refuses `65535` naming its
path; and, where `unbalancedLeafOf` finds one, a single-site indent leaf
refuses an indent its kind never dedents. Each test feeds a JSON object built
by `jsonAt` through `Options::read` over a `serde_json` map, the second
`OptionObject` impl.

### `packages/codegen/src/emitters/render-options-rs.ts::siteConstOf`

The `SITE_*`/`DELIM_*` constant name a `SitePath` stands for, from the
spacing or delimiter site it indexes.

### `packages/codegen/src/emitters/render-options-rs.ts::emitAddressLevel`

One level of `ADDRESSES`: every child beneath `prefix` from the shared
`ChildIndex`, in its snake-name order, as an `AddressNode::Branch` carrying
its canonical path (the `at` an unknown key beneath it is reported against)
and its children recursively, or an `AddressNode::Spacing`/`Delimiter` leaf
carrying every `SiteRef` (site constant plus canonical path) its `canonical`
entries name. The key is the child's `optionKey`, the same camel spelling
the TypeScript hint uses, so the key a caller writes is the key the trie
matches.

### `packages/codegen/src/emitters/render-options-rs.ts::emitAddressTrie`

`pub static ADDRESSES: &[AddressNode]`, the whole address trie from the
roots down (`emitAddressLevel`), over one `ChildIndex` (`childIndexOf`)
built for the emit, the same index the TypeScript hints are printed from.

### `packages/codegen/src/emitters/render-options-rs.ts::SmokeLeaf`

A leaf as the generated smoke tests see it: its key path from the root and
the sites it names.

### `packages/codegen/src/emitters/render-options-rs.ts::smokeLeavesOf`

Every address leaf as a `SmokeLeaf`, in table order, so the smoke tests pick
the first leaf of each shape they need.

### `packages/codegen/src/emitters/render-options-rs.ts::jsonAt`

A JSON object literal nesting `value` under `keys`, the wire an options
object arrives on, for the generated smoke tests.

### `packages/codegen/src/emitters/render-options-rs.ts::admittedEverywhere`

For a spacing leaf, the first arm every site it names admits and at least
one does not hold by default, or `undefined`: the value whose resolution the
admitted-value smoke test can assert changed every named site and nothing
else. A leaf naming several sites through bindings needs a value all of them
admit.

### `packages/codegen/src/emitters/render-options-rs.ts::unbalancedLeafOf`

The first single-site spacing leaf whose site admits the indent kind and
sits in a `DEPTH_SITES` row whose other sites hold neither indent nor dedent
by default, with that row's kind: setting it to indent must trip the
resolver's depth balance. `undefined` when the grammar has no such leaf
(python), and the smoke test is then not emitted.

### `packages/codegen/src/emitters/render-options-rs.ts::NO_SITE`

The Rust spelling of an empty cell in a kind-indexed site table
(`sittir_core::options::NO_SITE`); `NO_SITE_ID` is its value, the bound a
real site index must stay below (`siteOrNone`).

### `packages/codegen/src/emitters/render-options-rs.ts::NO_SITE_ID`

The value `NO_SITE` spells, `0xffff`; a real site index must stay below it
to fit a `u16` table cell.

### `packages/codegen/src/emitters/render-options-rs.ts::UNCATALOGUED_KIND_ID`

A kind id no grammar's catalog holds, one below `ERROR_KIND_ID`. The emitted resolve test feeds it to a site to show that a value the site does not admit is refused with its path.

### `packages/codegen/src/emitters/render-options-rs.ts::denseWidth`

The cell count of a dense table: one past its highest key. It fails at codegen when a key reaches `ERROR_KIND_ID`, since one ERROR row would make a 65536-cell static. ERROR carries no flag, edge or seat, so no table ever needs its row.

### `packages/codegen/src/emitters/render-options-rs.ts::siteOrNone`

A table cell: a site index as written, or `NO_SITE` for none. A site index
at or above `NO_SITE_ID` fails at codegen, since it would be read back as
empty.

### `packages/codegen/src/emitters/render-options-rs.ts::denseTable`

`pub static NAME: &[u16]`, a table indexed by kind id up to the highest key
present, `NO_SITE` in every gap, sixteen cells to a line. `EDGE_ROWS` and the
`SEATS_*` tables are written through it so a runtime lookup by kind id is one
array read instead of a search.

### `packages/codegen/src/emitters/render-options-rs.ts::denseFlags`

`pub static NAME: &[u8]`, a table indexed by kind id up to the highest flagged id, `0` in every gap, thirty-two cells to a line. `KIND_FLAGS` is written through it. It is separate from `denseTable` because a flag cell's empty value is `0`, not `NO_SITE`.

### `packages/codegen/src/emitters/render-options-rs.ts::leafEdgesTable`

Per kind id, the leaf's `LeafEdges` packed into one cell: the leading set in the low byte, the trailing set in the high byte. Only a stamped leaf (`leafEdgesOf`) has a row; the dense table's other cells are 0, which no stamp can be (`_tight` is always taken). A kind's id is found through its node's kind name (`findEntryForKindName`): the entry a parser keys by an external's symbol name and the node keyed by its display name are one kind. The table rides in the whitespace table (`WHITESPACE.leaf_edges`), which every writer holds, rather than the resolved options, which a render built from factories may not carry.

### `packages/codegen/src/emitters/render-options-rs.ts::kindFlagsOf`

Per kind id, the OR of its flags over every kind entry that carries that id: `KIND_ANON` when the entry is the parser's anonymous token (`anon`), `KIND_LINE_TERMINATED` when it is an outermost line-terminated kind (`lineTerminatedKinds`), `KIND_LINE_BREAK_TERMINATED` when it is an outermost kind ending in the declared newline token (`lineBreakTerminatedKinds`), `KIND_ROOT` for the grammar root (`grammarRoot`), whose edges the writer writes at a render's two ends. The bit values match `sittir_core::options`. The sink reads them by kind id. A coordinate onto an anonymous token is a token, not an owner, so the writer seats no held trailing entries before it. A node of a line-terminated kind, whether a transport, a coordinate or detached trivia text, holds its line end (`RenderSink::end_line_after`) as a `LineHold::Terminated`; a node of a kind ending in the declared newline token holds it as a `LineHold::Break`, which the end of a render drops.

### `packages/codegen/src/emitters/render-options-rs.ts::EdgeSiteRow`

One kind's edge row before emission: its id and the site index of its
before and after edge, either absent when the kind owns no seam on that side,
and the arm sites of each side (`EdgeArmRow`: the arm token's kind id and its
site), empty when the side has one site for every token.

### `packages/codegen/src/emitters/render-module.ts::RenderOptionsInputs`

```text
/** The facts the render module needs beside the node map: the spaced render
 *  rules and the visible externals' bodies, and — when the caller already
 *  built them (`emit.ts`, the only production caller) — the kind catalog,
 *  the collected site preferences and the address tables, so
 *  `planRenderOptionsFor` never re-collects or re-derives what the caller
 *  already has. Absent, each is computed the same way a caller without one
 *  in hand would (tests on fixture node maps). */
```

`boxedPayloads` is the grammar's payload pins (`BOXED_PAYLOADS`), a fact beside the node map like the render rules. The real pipeline fills it through `grammarRenderInputs`; a fixture emission that passes none boxes nothing and refuses nothing.

### `packages/codegen/src/emitters/render-module.ts::grammarRenderInputs`

The render inputs a grammar's real emission passes: the caller's facts plus the grammar's payload pins. It is the one read of `BOXED_PAYLOADS`; `emit.ts` and the render-module test's real-model helper both call it.

### `packages/codegen/src/emitters/render-module.ts::PlannedRenderOptions`

```text
/** The three things `planRenderOptionsFor` produces together: the site
 *  table plan, the address tables, and the kind catalog they were both
 *  built from — kept together because `renderOptionsRs` needs all three and
 *  they must be the one build, not three independent ones. */
```

### `packages/codegen/src/emitters/render-module.ts::EMPTY_PLANNED_OPTIONS`

```text
/** What `planRenderOptionsFor` returns when there is no kind catalog or no
 *  spaced render rules — an emitter test on a fixture node map, never the
 *  real pipeline. */
```

### `packages/codegen/src/emitters/render-module.ts::planRenderOptionsFor`

```text
/**
 * The render-options plan, address tables and kind catalog for one grammar,
 * or `EMPTY_PLANNED_OPTIONS` when there are no spaced render rules. Uses `inputs.kindEntries`/`inputs.sites`/`inputs.addresses`
 * as-is when the caller supplied them (`emit.ts`, via `addressTablesFor`);
 * otherwise collects/derives each the same way `emitOptions` does, through
 * the same `addressTablesFor` helper — there is one derivation, never two
 * independent ones building the same `AddressTables` from the same inputs.
 */
```

### `packages/codegen/src/emitters/render-module.ts::whitespaceTextFromVisibleExternals`

```text
/** Whitespace kind → render text, read from the same `visibleExternals`
 *  bodies the kinds' own templates render, so `_tight`, `_space` and
 *  `_newline` have one spelling. */
```

### `packages/codegen/src/emitters/render-module.ts::prepareEnumImpl`

A `Prepare` impl for a generated enum: payload variants delegate to the
payload's `prepare(ctx)`, unit variants (literals) are `Ok(())`. The match
is the tail expression, so the impl's result is whichever arm ran. An enum
with payloads also delegates `source_gap`, `gap_edges` and `snapshot_edge`,
so a list's gap fill reaches the gap, the edges and the geometry of
whichever kind the item is.

### `packages/codegen/src/emitters/render-module.ts::PREPARE_MOD`

The core module path the generated `Prepare` impls name, spelled once.

### `packages/codegen/src/emitters/render-module.ts::PREPARE_SIG`

The one signature every generated `prepare` shares:
`fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>`.
An impl whose body never reads the context binds it as `_ctx` by string
replacement on this constant, so the two spellings cannot drift.

### `packages/codegen/src/emitters/render-module.ts::inertPrepareImpl`

A `Prepare` impl for a type that owns no slots and no coordinates (leaf
enums, `VerbatimTransport`): `Ok(())`.

### `packages/codegen/src/emitters/render-module.ts::spacingFieldExprs`

```text
/** The transport expressions a list view reads its `before`, `after`, `head`
 *  and `tail` from: the node's own separator and flank fields for that slot,
 *  never a token seam site; absent means the view writes nothing there. */
```

### `packages/codegen/src/emitters/render-module.ts::rootEdgeStamp`

The grammar root's prepare lines that give an edited root its source flanks, ahead of `prepare_edges`: the first and last present item across its child fields (`EdgeItems`, fields in declaration order), whose coordinates `root_flanks` reads the tree bytes around, classified into the root's before and after sites exactly as a list gap is (for a snapshot root, the gaps from the root's own span, `Layout::snapshot_edge`, to where its first item's render begins and its last item's ends, trivia included; `outermost` puts the root's inner trivia, `Layout::snapshot_inner`, in place of an end item it lies beyond or of a missing one); `fill_edges` sets only the sides the wire left unset. A field order that put a non-edge item first only costs evidence: the bytes before it are not whitespace and classify to nothing. Empty for every other kind.

### `packages/codegen/src/emitters/render-module.ts::prepareStructImpl`

A transport struct's `Prepare` impl. Every struct answers `source_gap` from
its layout's gap (`$_layout.gap`), `gap_edges` with its own base edges,
made when the layout holds none, and `snapshot_edge` from its layout's
span and trivia, so a snapshot list's gaps and root's edges read geometry. A compound kind first fills its own
base edges (for the grammar root, from its source flanks, `rootEdgeStamp`;
then, for a kind that owns kind-edge sites, from the source flanks the
wire carries for a list node, `fill_source_flanks`, and from its edge row,
`prepare_edges`), then gives each repeated slot's source-adjacent gaps their source class
(`listGapClassification`), then fills this kind's
own facts: each spacing field that carries a per-node value
(`carriesPerNodeValue`) takes the resolved arm when unset; the seat calls
(`seatLoops`) write each seated element's gap into that element's own base
`after` edge; and a separated list takes its `delimiter` and its
`separator_kind` from their sites when unset; and a required registered
choice option the caller left unset is built from its option site's resolved
arm (`optionDefaultFills`). Only then does it walk the children (every slot
field's `prepare(ctx)?`). The order matters: a seat is
a `get_or_insert` on the child's base edge, and the child's own
`prepare_edges` fills that same edge from its kind's row, so the parent must
seat before the child sees it. A wire-carried value always wins; a
coordinate that names no tree or a span outside its source is the walk's
error, not the render's.

A list's delimiter is filled from the table like any site, zero included:
the table's value is the grammar's declared default or a render option, and
the transport's own value still wins. One exception: a list whose trailing
separator is optional takes its trailing flag from the source while its
source flank after is kept (`sourceTrailingSeparator`).

Every struct transport prepares its layout's trivia first, leaves included. A trivia entry that is a source coordinate takes its kind's edges there, as a coordinate in a slot does.

### `packages/codegen/src/emitters/render-module.ts::sourceTrailingSeparator`

The facts a list's generated `prepare` passes to `source_trailing_delimiter`:
the list's own kind id and the kind ids of its separator tokens (the multiple
slot's literal separators and the token arms of its separator rule), or
nothing when the list's trailing separator is not optional. A separator with
no kind id is a compile error.

When a list has them, an unset `delimiter` is filled by
`source_trailing_delimiter` instead of the plain table value. A rebuilt list
whose last item is still the source's last keeps its source flank after
(`sourceFlankOf`, the same evidence the trailing flank uses). For such a list
the trailing flag follows the source tree: set if the source list's last
child that is not an extra is one of these separators, clear otherwise. The
child is read from the tree, never from the span's text, so a comment the span
includes is not mistaken for a separator. The leading flag and every list
without that flank take the table value. The source wins both ways, so a
source with no trailing separator renders none even where the table's default
is trailing.

### `packages/codegen/src/emitters/render-module.ts::optionDefaultFills`

The `prepare` lines that fill a node's prepare-filled slots (`isPrepareFilled`)
when the transport arrived without them: the slot's choice, as `choiceNameOf`
names it, is built with `from_kind_id` from `ctx.options.spacing[<site>].arm`, the arm the option
chain resolved for the slot's choice site (per-tree, engine, then the
grammar's declared default). The site is the one choice site in the render
plan for this kind and slot, with no side and no seat. A slot with no such
site fails codegen: the option would have nothing to resolve from. A value
the caller set is never replaced.

### `packages/codegen/src/emitters/render-module.ts::listGapSitesOf`

The un-seated spacing sites of one repeated slot on a kind, by side: `gap`
for an unseparated repeat (the whole gap is one site), `before`/`after` for
a separated one (the bytes on each side of the token). Seated sites belong
to the item kinds and are filled by `seatLoops`; the flank and seam sites
of the list are not gaps between items.

### `packages/codegen/src/emitters/render-module.ts::listGapTokenOf`

The one literal that separates a slot's items, or `undefined` when the slot
has none or has several — a choice separator is per instance, so the bytes
around it are not one site's spelling. Derived from
`shared.ts::slotSeparatorTexts`, the same source the reader table and the
wrap drop expression use.

### `packages/codegen/src/emitters/render-module.ts::listGapClassification`

The call a generated `prepare` makes for every repeated slot with a gap
site, before the seats and the option fills: `fill_list_gaps` over the
slot's items, with the slot's separator token and the arms its sites admit.
Every gap in a rebuilt list follows one of two rules:

1. A gap between two items that were adjacent in the source keeps its source
   spelling. The transport decides adjacency with the neighbour rule's own
   test and sends the gap's source range on the later item (`$_layout.gap`), for an
   edited item as much as an untouched one. `fill_list_gaps` classifies that
   range, split at the one separator, onto the earlier item's `after` edge
   and, past the token, the later item's `before` edge, at trivia strength.
2. Every other gap is canonical: the seat of the kind before it
   (`seatLoops`, which fills only an edge nothing set), or the list site,
   which comes from the option table or the caller and never from the source.

One source per gap. Where the later item's derived line-gap run spells the
gap (the leading run its read gave it, already split around its comments),
that run is the gap and the transport sends no gap; the native
classification fills only gaps that have no derived run. A same-line gap
renders as the whitespace member its run classifies to, so a run no member
spells exactly (two spaces where the grammar declares only a single space)
renders as the nearest member below it. That is the first limit of rule 1,
not an inference. The second: a gap that holds a comment, or anything else
but whitespace and the one separator, is not a spelling the whitespace
classes can carry, so `fill_list_gaps` leaves it unset and the gap falls to
rule 2, the seat or the list site. The comment itself still renders as the
trivia its owner carries. The third: a list's flanks keep their source class
with its depth (the indent arm after the opener, the dedent arm before the
closer, where the source lines show the depth change), but the depth unit is
the render's, from the format record or the options, never the source's
columns. A list indented two spaces in a source rendered with four-space
indentation renders with four.

A list's flanks follow rule 1 like its item gaps: the gap between the opener
and the first item is kept while that item is still the source's first, and
the gap between the last item and the closer while that item is still the
source's last (`sourceFlankOf`). A list's gaps and flanks are kept only while
the list itself carries source identity, so a list built afresh is canonical
throughout. A rebuilt list's trailing delimiter stays canonical.

### `packages/codegen/src/emitters/render-module.ts::synthesizedSpacingSites`

```text
/** The spacing sites of a kind that own a transport field: the separator
 *  spacing sites, each `Option<u16>` named by the site key. */
```

### `packages/codegen/src/emitters/render-module.ts::kindEdgeSidesOf`

A kind's own edge sites among its synthesized sites, by field name to side:
the seams `isKindEdge` accepts, their side read from the parsed seam label.

### `packages/codegen/src/emitters/render-module.ts::edgeArmSlotsOf`

The slot each side's arm is read from, for a kind whose edge has arm sites. For
each kind-edge seam of the body whose side has arm sites, the member beside the
seam (the one after a before seam, the one before an after seam) must be a slot;
its name is the answer. Anything else is an error, since the arm could not be
read at render time. Arm sites exist only where the compiler saw such a slot
(`spacingSitesOf`), so the error marks a disagreement between the two.

### `packages/codegen/src/emitters/render-module.ts::edgeRowsOf`

`edgeSitesOf` for one plan, keyed by kind id and computed once.

### `packages/codegen/src/emitters/render-module.ts::kindEdgeWriterOf`

The body printer's `edge` lookup for one struct: a seam name answers its
kind id and side when it is the kind's own edge, nothing otherwise. A kind
with edge sites resolves its id once, through `edgeIdOf`.

### `packages/codegen/src/emitters/render-module.ts::edgeIdOf`

The edge-row id of a kind that has kind-edge sites, checked against the
plan's edge-row kinds (`edgeRowKindsOf`). A kind whose id is missing, or that
`edgeSitesOf` dropped as ambiguous, has no row to prepare and write its edges
from; generation fails here rather than rendering the kind with its edges
silently gone.

### `packages/codegen/src/emitters/render-module.ts::edgeRowKindsCache`

`edgeRowKindsOf`'s memo, keyed weakly by the render plan.

### `packages/codegen/src/emitters/render-module.ts::edgeRowKindsOf`

The kind ids that have an edge row, from `edgeSitesOf`, computed once per
plan so `edgeIdOf` is a set lookup per node.

### `packages/codegen/src/emitters/render-module.ts::edgedImplLines`

A transport's `Edged` impl: its edge-row id, and access to its base `edges`,
inserting the default on first write. `edges()` answers `Edges::NONE` for a
transport not yet prepared. A kind with arm sites also overrides
`edge_arm_kinds`: each side's edge slot (`edgeArmSlotsOf`) answers which arm
token it holds (`ArmOf::arm_among`, over the row's arm sites), so
`prepare_edges` stamps that arm's site and not the shared one.

### `packages/codegen/src/emitters/render-module.ts::delimiterSiteOf`

```text
/** The flank site of a separated-list kind, if its flank is optional. */
```

### `packages/codegen/src/emitters/render-module.ts::separatorSiteOf`

The separator site of a separated-list kind whose separator is a choice of
literal tokens: the spacing-table row with `role: 'separator'`, if any.

### `packages/codegen/src/emitters/render-options-rs.ts::SpacingSite.address`

```text
// The key the site answers to under its kind, and the tail of the transport
// field that carries it; an array flank's field is `<slot>_start` / `_end`.
```

### `packages/codegen/src/emitters/render-options-rs.ts::planRenderOptions`

A row names its kind by display; its path is taken from the preference it
was built from, which still holds the storage kind, so `pathOf` resolves the
display once.

Spacing sites are numbered in canonical path order rather than by kind, slot and
label. That is what makes every descendant of a prefix a contiguous index range,
so a scoped declaration resolves by binary search rather than a scan. The sort is
in place, because the depth walk identifies its sites by object and reads their
indices afterwards.

The plan takes the grammar's declared `indent` (read by `planRenderOptionsFor` through `readOptionsBlock`) and its name, and `indentUnitOf` validates it: a grammar with indent characters must declare a unit made only of them, and one without must declare none. A violation throws naming the grammar at generation time, so the runtime never meets an unusable unit.

`SITE_PATHS` holds every site — spacing and delimiter — by its formatted
address in canonical order, each entry a `SiteRef` naming the row it stands
for in `SPACING_SITES` or `DELIMITER_SITES`, and is the table a prefix is
looked up in. Delimiter rows keep kind-and-slot order among themselves so
their constants are stable; a delimiter is reached by address like any other
site, its path ending in `delimiter`.

### `packages/codegen/src/emitters/options.ts::deriveAddressTables`

Every site's address split into the two tables the generated surface needs: the
branches, each an address with what sits beneath it, and the leaves, each an
address that names a site with what that site admits. Roots and the deepest path
come out with them, so the emitted type is unrolled to the depth the grammar
actually has rather than a guess.

The tables are data, not structure. A key is `nestedKey` of the segment, joined
with `/`; two different segments that both resolve to the same joined path (a
literal whose kind name collides with a sibling's name, or with a fieldName)
would otherwise merge silently — the collision is caught by comparing each
path's incoming segments against the ones already recorded there
(`formatPreferencePath`, which keeps the quoted literal spelling), and a
mismatch is rejected as `options: address '<path>' names two segments`.

A key that is both a branch and a leaf, or an address resolving to two types, is
rejected: an address names one site or a set of them, never both.

### `packages/codegen/src/emitters/options.ts::deriveAddressTables` — supertype membership

Takes the public-name members map so a binding or declaration spelled on a
supertype counts as reaching its members' sites when the tables decide which
declared labels have a home.

### `packages/codegen/src/emitters/options.ts::deriveAddressTables` — declared labels

A label is a declaration that names no site. It reaches the surface through the
bindings that name it: the sites those addresses match give it its type, and its
path is nested like any other address, so `body/before` is emitted as `body`
carrying `before`.

Without this a label would vanish: a table built from sites alone cannot
put it back — a virtual kind has no site of its own. A consumer would lose the one
key that moves every address bound to it, which is the only reason the label
exists.

### `packages/codegen/src/emitters/render-body.ts::ADJACENT_EDGE`

```text
/// Internal-only edge sentinel for an `adjacent` node's boundary character
/// at compile-time seq classification (`classifySeqBoundary`): never reaches
/// generated Rust source.
```

### `packages/codegen/src/emitters/render-body.ts::literalOf`

```text
/// A slot's flank text lifted onto a `View`: a literal run reproducible as
/// plain `w.text(...)` on its own, with nothing that needs a `RenderSink`
/// call of its own (`adjacent`, a seam, a depth move, a token seam). A gate
/// carrying one of those stays an explicit `if`/`else` in the printed body,
/// where it can still make its own sink calls.
```

### `packages/codegen/src/emitters/render-body.ts::splitLeadingWhitespace`

```text
/// Splits off the whitespace run that immediately follows a depth move or a
/// token seam in the SAME literal, so it becomes that node's payload
/// (`w.seam(...)` right after the depth call, or folded into the token
/// seam's own text) rather than ordinary text.
```

### `packages/codegen/src/emitters/options.ts::nestedKey`

The one derivation of a segment's snake name, the order key of the shared
`ChildIndex` and the input to `optionKey`, which the TypeScript hints and
the Rust trie both write keys with: an index segment's number as a string, `_` for a
wildcard, a named segment's own name, and — for a literal segment — the
anonymous token's own kind name (`findEntryForLiteralText`), never its raw
text. The kind name it reads is `generated-metadata.ts::deriveSymbolRuntimeName`'s
own output, so a keyword-shaped literal (`class`, `await`, …) already carries
its `_keyword` suffix there (`class_keyword`, `await_keyword`) — `nestedKey`
adds no naming rule of its own for that case. A literal with no kind entry at
all is a codegen-time error, never a guessed name. The canonical address path (`formatPreferencePath`, the
`canonical` strings on leaf entries, every error message) is untouched by this
— it keeps the literal's quoted text, since that is what makes two different
segments that would spell the same nested key distinguishable.

### `packages/codegen/src/emitters/options.ts::AddressBranchEntry.segments`

```text
/** This branch's own address as typed segments — the prefix `path` was joined from. */
```

### `packages/codegen/src/emitters/options.ts::AddressLeafEntry.segments`

```text
/** This leaf's own address as typed segments — the full list `path` was joined from. */
```

### `packages/codegen/src/emitters/options.ts::AddressLeafEntry.canonical`

```text
/** The typed segment list(s) of every site this leaf sets: one for an
 *  ordinary site, every bound site's own path for a declaration reached
 *  through bindings. Kept as segments, not a formatted string, so
 *  `siteRefsOf` can match structurally (`segmentsEq`) against
 *  `plan.sitePaths` rather than by string; the formatted form is produced
 *  only where a message or an `at` prefix needs one. */
```

### `packages/codegen/src/emitters/factories.ts::textLeaves`

The text leaves one slot admits: the slot's node-stored values whose kind is a pattern leaf with a factory, hidden or visible. A strict factory never builds them from text, so the slot's rejection names their builders.

### `packages/codegen/src/emitters/factories.ts::strictNodeExpectation`

What a strict slot expects in place of a string, or `undefined` when a string is a legal strict value. A slot with text leaves (`textLeaves`) names their builders (`buildStringOpen(…)`); otherwise a slot with at least one node-stored value and no `literal`-stored value names the built types it stores (`a built Expression / ExpressionList`). A `literal` value's text is its stored form, and a slot with no node value stores kind ids or verbatim text, so neither takes the guard. The same predicate decides the `rejectBareText` import.

### `packages/codegen/src/emitters/factories.ts::bareTextRejection`

Wraps a slot's stored value in `rejectBareText(value, '<Kind>.<configKey>', '<expected>')` when `strictNodeExpectation` names an expectation. It runs after the slot's enum storage coercion, so a mixed slot's keyword members are already kind ids and only a string left over is rejected.

### `packages/codegen/src/emitters/factories.ts::storedSlotValueExpr`

The storage coercion of one slot value (boolean keyword, bitflag, kind enum, mixed enum, or verbatim), before the bare-text rejection. `slotStorageFromValueExpr` composes it with `bareTextRejection`.

### `packages/codegen/src/emitters/factories.ts::leafReDeclaration`

The anchored pattern constant a text leaf's factory declares: its `_leafRe_<factory>` name and its regex literal, or nothing for a fixed-text hidden leaf or a kind with no derivable pattern. The guard constants and the hidden-leaf admission table read it, so both name the same constant.

### `packages/codegen/src/emitters/factories.ts::constructionChildElementType`

`childElementType` for a construction parameter: the read-side element union, widened by the children's alias content types (`aliasContentTypes`). The read side (`wrap.ts`, `from.ts`) keeps `childElementType`, because a node read from a tree holds no alias content.

### `packages/codegen/src/emitters/factories.ts::slotAliases`

The AssembledAlias kinds a slot holds, after supertype expansion, that have a raw factory. Each is a transparent wrapper the slot's builder applies itself, so the slot's input admits the alias's content (`T.<Alias>.Types`) alongside the built alias.

### `packages/codegen/src/emitters/factories.ts::aliasContentTypes`

The `T.<Alias>.Types` names of every alias the given slots hold, deduplicated — the one list the construction element types widen by.

### `packages/codegen/src/emitters/factories.ts::withAliasContentTypes`

A slot's element type widened by its aliases' content types (`aliasContentTypes`).

### `packages/codegen/src/emitters/factories.ts::kindIdsOf`

The parser ids one kind stores as: an enum's member ids, otherwise the kind's own catalog id.

### `packages/codegen/src/emitters/factories.ts::slotStoredIds`

Every id a slot can store directly: its node kinds' ids after supertype expansion plus its terminal values' stamped ids.

### `packages/codegen/src/emitters/factories.ts::aliasContentAdmission`

Wraps a slot's stored value in `admitAliasContent` with one row per alias the slot holds: the alias content's stored ids minus the ids the slot already stores directly, and the alias's raw builder. A value whose id is in a row is alias content and is built into the alias; anything else, including a built alias, passes through. `storedType` is the stored value's type (a config slot's storage entry or a list's storage elements type).

### `packages/codegen/src/emitters/factories.ts::admittedSlotInput`

A slot input's admissions in order: the bare-text rejection, the keyword-text rejection, then alias content. Shared by config slots, the positional value, and spread children.

### `packages/codegen/src/emitters/factories.ts::constructionFieldElementType`

`fieldElementType` for a construction parameter or setter: the read-side element union, widened by the slot's alias content types (`withAliasContentTypes`) and by `number` on a numeric slot (`numericSlotShape`).

### `packages/codegen/src/emitters/shared.ts::transparentContentKindNames`

The kinds a list admits at its content slot: the slot's own kinds and, when there is exactly one and it is a transparent wrapper, the kinds of the wrapper's required slot. The bare-accept closure reads it so a list takes an element the wrapper would have built.

### `packages/codegen/src/emitters/factories.ts::listHasOptions`

Whether a separated list's builder takes an options object: a separator kind to choose, or a leading or trailing delimiter the caller may set. The coercer signature, the list's own options type, and the overlay's list parameter all read it.

### `packages/codegen/src/emitters/factories.ts::listOptionKeys`

The keys a list's options object may carry, `separator` and/or `delimiter`,
derived once from the surface flags. The strict factory's options-first test
and the coercer's `_listElements` split both read it, so the two never
disagree on what counts as an options object.

### `packages/codegen/src/emitters/shared.ts::listRestParamType`

The argument tuples of a separated list, from one place: its `BuildArgs` / `LooseArgs` rows, its loose coercer's rest parameter and its seated overlay all spell them here. It is a union of labelled tuples, one per call form. The elements-only form is `[...elements: E[]]`, or `[element: E, ...elements: E[]]` for a non-empty list, so the empty call is a type error, matching the non-empty guard the raw builder runs. With options there is also the options-first form, `[options: O, ...]` followed by the same elements; on an empty-capable list the options object alone is a valid call, on a non-empty list it is a type error. When the options are required (`separatorRequired`: a separator site with no declared default), only the options-first form exists, so an elements-only call is a type error, matching the raw builder's throw.

A non-empty element list is never spelled as a variadic spread of an alias: a rest element that is an array type keeps the tuple alias deferred (see the cycle rules on `BuiltTypeSurface`).

### `packages/codegen/src/emitters/shared.ts::withEmptyOverload`

Puts the zero-argument overload `head(): T.Empty<TypeName>` in front of a function's lines when the kind has an empty form, and leaves the lines unchanged otherwise. `general` is the declaration of the implementation's own signature. Pass it when the lines hold only the implementation, because once one overload exists the implementation signature is no longer callable. Omit it when the lines already begin with overload declarations. Factories, coercers and seated polymorph parents all get the empty overload here. It comes first because `ReturnType<typeof f>` reads the last overload, so the general signature has to stay last.

### `packages/codegen/src/emitters/interior.ts::interiorOf`

```text
The slot structure of a lexed kind, derived once from its render rule and its slots: an ordered list of
literal, flag, enum and slot entries, the anchored regex with one named group per slot, and the config key of
each slot. `node-model.json5`, `TOKEN_INTERIORS`, the wrap projection, the leaf registry and the per-slot
guards all read this; nothing re-derives it. Slots are matched left to right, each greedy (the regex's own
semantics, the lexer's longest match over the whole token). A lexed kind whose render rule is not a sequence, or
whose member is neither template text nor a slot, is a compile-time error naming the kind and the member. An
optional literal followed by a literal it cannot be told apart from at their first differing character is a
compile-time error naming both. An optional group of members (a nested optional sequence) is walked
recursively: the regex wraps it in an optional non-capturing group, while `entries` stays the flat list of
literal, flag, enum and slot entries every consumer reads, so a slot inside a group is guarded, typed and
projected like any other, and an optional pattern slot is an optional named group.
```

### `packages/codegen/src/emitters/interior.ts::interiorSlotGuards`

The anchored regex literal of each pattern and enum slot in a lexed kind's interior, by slot name, with the name of the constant that holds it (`_slotRe_<factory>_<slot>`): a pattern slot's own pattern, an enum slot's arms longest first (`interiorEnumArms`), each through `anchoredLeafRegexLiteral`. A slot whose pattern yields no literal is left out. `buildLeafReConsts` exports one constant per entry from the raw factories module, and the raw builder's per-slot guard reads it there; the loose coercer imports the content slot's constant as `spelledInterior`'s `accepts`, so the strip and the guard test the same object.

### `packages/codegen/src/emitters/interior.ts::walkInterior`

Turns the members of a lexed kind's render rule into interior nodes: an entry for a literal, flag, enum or slot, and a group node for a nested sequence, walked recursively.

### `packages/codegen/src/emitters/interior.ts::groupMembers`

The members of a nested sequence member, which is an optional group of interior members. The render rule carries no optional marker here: `flattenMembers` in the token-interior pass splices every nested sequence that is not a group arm, so a nested sequence that survives to the render rule is, by construction, the arm of an optional group and the regex wraps it as one.

### `packages/codegen/src/emitters/interior.ts::interiorNodePattern`

The regex of an interior node: an entry's own pattern, or a group's members joined inside an optional non-capturing group.

### `packages/codegen/src/emitters/interior.ts::flattenNodes`

The leaf entries of an interior tree in order, the flat list consumers read.

### `packages/codegen/src/emitters/consts.ts::emitTokenInteriors`

```text
Emits `TOKEN_INTERIORS`, the runtime table (`regex`, `slots`) of every lexed kind, typed by `TokenInterior`.
```

### `packages/codegen/src/emitters/consts.ts::emitInnerGaps`

Emits `INNER_GAPS`: for every compound with inner gaps, the gap keys in render order, from the node map's `innerGaps` rows (the same rows each Rust transport's `gap(n) = key` attributes print). `$trivia.inner` writes to the first key, and `$trivia.innerAt(key)` to a named one; a kind with no row has no inner position.

The table and each row's key list are frozen.

### `packages/codegen/src/emitters/shared.ts::holdsOwnKind`

```text
Can the kind's one config slot hold the kind itself: its own kind is among the kinds the slot holds,
expanded through supertypes, or the slot holds a child whose elements the builder takes and those
elements admit it. That child is a list (`tuple` through `collection_elements`), or the one kind the
builder forwards to when that kind is built from its spread elements (typescript's parenthesized
sequence through `sequence_expression`). For such a kind a single argument of its own kind is ambiguous between the
node itself and a value of the slot, so its coercer has no own-node short circuit and no re-spread of
the node's elements: the argument is resolved as the slot's value, and the call wraps it
(`await(awaitNode)` is `await await x`, `array(arr)` is `[[…]]`). A list that cannot contain itself
(`arguments`) is not selected and keeps taking its own node as its elements. A kind with several
config slots is not selected either: its argument is a config object, which a node is not.
```

### `packages/codegen/src/emitters/shared.ts::lexedContentSlot`

```text
The sole required text slot of a lexed kind, or undefined. It is the slot a bare loose value stands for.
```

### `packages/codegen/src/emitters/shared.ts::isAffixedLeaf`

```text
A lexed kind whose interior has a required fixed member (a quote, a sigil, a comment opener): its text differs
from its content, so a bare string is never matched against it. An optional affix does not count, because the
content may then equal the whole text (rust integer_literal). See "affixed leaves" under buildLeafRegistryEntries.
```

### `packages/codegen/src/emitters/render-body.ts::adjacentInto`

Puts a tight join (`adjacent`, printed as `seam(TIGHT)`) before every slot and literal of a body, descending into the arms of a gate so the join is only written when the gated member is. A node that follows a site or token seam gets none: that seam is the flank's one seam. A lexed token's interior joins its parts through this: tree-sitter lexes the token as one unit, so no join inside it may take the word-boundary space, a literal after a slot (a bigint's `n`) included.

### `packages/codegen/src/emitters/render-body.ts::doubledFlanks`

The one-seam-per-flank check: every internal gap and each edge of a template carries at most one seam, decided in codegen, and coalescing (strength, then rank) happens only where flanks of different templates meet. It lists each run of seam-class nodes in a body (descending into gates) that holds a join (`adjacent`) or a static word seam (`wordSeam`) beside another, and generation fails naming the kind and the run. Two declared sites at one gap, or a site beside a whitespace token, are legal and permanent: each is an option address of its own, and the writer's coalescing resolves them. With `SEAM_FLANK_CENSUS` set the run is logged instead of failing, for counting.

### `packages/codegen/src/emitters/render-body.ts::RustBodyPrinter.optional`

Whether a slot may be absent at render time (its transport field is not required). A join printed after such a slot is written inside the slot's presence test, since the gap between a slot and what follows exists only when the slot does: a join with no left neighbour would otherwise coalesce with the seam of the template before it.

### `packages/codegen/src/emitters/factories.ts::slotGuardKey`

```text
The key under which a lexed kind's per-slot guard regex is registered.
```

### `packages/codegen/src/emitters/node-model.ts::serializeCompoundNode`

```text
A lexed kind serializes its `interior` beside its slots, from the same derivation the runtime table uses.

A kind with a full form serializes it (`fullForm`, its literal `open` and `close` texts), the same stamp the coercer's full-form acceptance reads. The source emitter spells a text-only read entry with it.
```

### `packages/codegen/src/emitters/ir.ts::factoryRef`

```text
A text leaf is called through its raw builder, and so is any other kind with one surface; a lexed kind with a coercing entry is called through its hoisted factory, which coerces the bare content.
```

### `packages/codegen/src/emitters/test.ts::patternSlotDummy`

```text
A sample that satisfies the slot pattern, so the generated construction tests pass the per-slot guard.
```

### `packages/codegen/src/emitters/factories.ts::leafTextParams`

The text parameter of a pattern leaf's builder: `string | number` when its pattern has a numeric shape, where the builder converts a number to the leaf's text before its guards run, else `string`.

### `packages/codegen/src/emitters/interior.ts::widenNumericSlots`

Wraps a config type in `WidenNumeric` for the numeric text slots of a node, each key widened by its own `numberInputType`, so the namespace `Config` and `LooseConfig` and the builder's config parameter accept the JavaScript values the builder converts. The one widening both the types and the factories emitters write.

### `packages/codegen/src/emitters/factory-map.ts::FactorySlotMeta.registered`

```text
/** A registered (spelling/choice) slot has no home in the factory's
	 * config object — it moves to the trailing options argument. */
```

### `packages/codegen/src/emitters/factory-map.ts::FactorySlotMeta.optionDefault`

The grammar default of a registered slot, in the value domain the builder takes:
the spelling text for a spelling slot, the arm's kind id for a choice slot
(`BLANK_KIND_ID` for the blank arm). Absent when the map was built without kind
entries. The validator's argument builder and the example printer omit a value
equal to it.

### `packages/codegen/src/emitters/factory-map.ts::optionDefaultOf`

Resolves a registered slot's `optionDefault`: the stamped `optionDefaultArm`
as text for a spelling slot, else `armIdOf` over the arm's stamped kind, so
the id matches the native options table's default for the same site.

### `packages/codegen/src/emitters/factory-map.ts::createFactorySlotMeta`

One slot's factory metadata: its arity facts plus, for a registered slot,
`registered` and `optionDefault`.

### `packages/codegen/src/emitters/test.ts::subFactoryCallArgs`

The call arguments for one sub-factory case, following the arm shapes `shape` emits in the same order: a merged config, then a parameterless child (the residual keys alone), then a seated config, then a seated tuple.

#### body

```text
// The parent collapsed to a direct/value factory around this
// arm's one residual slot (see polymorphs.ts's own `positional`
// branch), so the composer takes that slot's value directly
// rather than wrapped in a config object.
```

### `packages/codegen/src/emitters/test.ts::strictOptionDummy`

```text
// A registered slot's option value is always the kind-id form — the choice's
// arms (e.g. terminator's automatic-semicolon marker) are synthesized kinds
// with no source spelling, so kindEnumTextExpr's literal-text lookup (used
// for the config-surface's spelling form) can't resolve them; read the
// enum kind straight off the field's own storage facts instead.
```

### `packages/codegen/src/emitters/factories.ts::resolveConfigFactorySurface`

The loose row of a kind that takes one argument is that kind's own `Loose`, by name: a config kind's, a single-slot kind's and a single-child kind's alike. `Loose` is what the coercer accepts (the config, the built or parsed node itself, and the bare value of the kind's sole slot), so the row and the coercer's parameter are one type and a wrapper's row takes its target's config with no second spelling. A child of a supertype given as a config must carry its `$type`, because nothing else says which kind it is; the row does not admit an untagged one. A kind that spreads its children takes, per element, its own `Loose`, the strict element widened through `LooseValue`, and the element the coercer resolves (`coercedChildElementType`).

The rest parameter of a spreading kind is typed from the slot's own cardinality, with the function a list's elements use (`elementsTypeOf`): a slot the model marks non-empty takes `NonEmptyArray` of the admitted element (strict) and the `$with` setter takes the same, so the empty call is a compile-time refusal beside the runtime guard; the loose spread row uses that same cardinality around the union of its own loose form and the widened element. The lone-array row derives from the loose rest parameter, admitting both strict and coerced element spellings and preserving non-empty cardinality.

#### body

```text
// classifyFactoryShape() already falls through to 'config' for a
// registered node whose sole slot is multiple — a rest parameter must be
// last in a JS/TS signature, so it can never sit before the trailing
// options argument. factoryTakesSpreadChildren reads that same
// classification, so this stays in sync without re-checking here.
```

#### body

```text
// The same recursive fact the loose surface's `emitBranchFrom` derives
// its own optionality from (node-map.ts `argumentOptional`): a required
// slot only blocks the no-argument call when it has no default-empty
// construction of its own (an optional sibling slot alongside it never
// blocks on its own, unlike the shallow "any slot required" scan this
// replaced).
```

### `packages/codegen/src/emitters/native-crate.ts::nativeCrateFiles`

The scaffold of a grammar's native crate (`rust/crates/sittir-<name>`): `Cargo.toml`, `build.rs` (compiles the generated `.sittir/src/parser.c` and a C `scanner.c` as C11; a C++ `scanner.cc`, which transpile also copies, compiles in its own C++ build so `parser.c` never goes through the C++ compiler), the napi `package.json` (private: the crate is never published; its `build` scripts run `scripts/build-native.mts`, which writes the loader, typings and binary into the grammar package's `native/` directory), and `src/lib.rs` (the `LanguageFn`, the `EngineGrammar` impl over the generated render module, whose `shows` is the generated `AnyTransport`'s set of display ids it claims a node by, so every coordinate stamps the display id at an alias envelope and the grammar id elsewhere, and `sittir_core::napi_engine!`). `runCodegenInternal` writes these files on every `gen --all`, like the render module beside them, so a crate exists only alongside generated code it can compile and never lags its generator. No grammar edits its crate. A scanner that shares a header outside the generated sources (typescript's `scanner.c` includes `common/scanner.h`) needs no special case: `build.rs` follows each scanner source's quoted `#include`s at build time and has cargo rebuild when any of them changes. A new crate (no `Cargo.toml` yet) also triggers `pnpm install`. Pinned by a test: every grammar's crate files match the emitter.

### `packages/codegen/src/emitters/native-crate.ts::NativeCrateFile`

One crate file: its path under the crate and its contents.

### `packages/codegen/src/emitters/grammar-runtime.ts::EmitGrammarRuntimeConfig`

The per-grammar runtime glue shared by every grammar package, emitted into `packages/<name>/src/` next to `engine.ts`. It differs between grammars only in the grammar name, so it is emitted rather than copied into each package — a new grammar gets it from its first `gen --all`.

### `packages/codegen/src/emitters/grammar-runtime.ts::emitBackend`

`backend.ts`: loads the native build the package ships (`native/index.cjs`, resolved relative to the module, so the same path holds in the workspace and in an installed package) once per process and checks its render-module hash and transport ABI against the package's generated `RENDER_MODULE_HASH` / `NATIVE_RENDER_TRANSPORT_ABI`. The outcome is `native` or `js`; `js` means "native unavailable" — there is no JS engine behind it, and `createRenderEngine` throws on it. `SITTIR_BACKEND` forces a choice; a forced `native` that fails to load throws. A load failure's reason comes from `nativeLoadFailure`, so it names the host platform and what the package ships.

### `packages/codegen/src/emitters/native-crate.ts::NATIVE_RENDER_TRANSPORT_ABI`

The version of the wire between the JS packages and a native build: the render transport shape JS sends, the read shape the native reader sends back (`$type` / `$displayType`, which children and tokens arrive, when `$text` is present, which of `$handle` / `$parentHandle` / `$treeHandle` a node carries, and the error regions a parse returns beside its root), and the read calls' names and arguments (a read takes a level count; a descendant walk takes the address it starts from, kinds, a resume path, a limit, a plan and a depth, and returns its start's own handle with each batch; a plan is evaluated over a list of addresses in one call; the line starts inside tokens take a tree and an optional descendant index, and return byte offsets). It is the one source for both sides of the handshake: `emitBackend` bakes it into each package's `backend.ts`, and `nativeCrateFiles` into each crate's generated `lib.rs` (passed to `napi_engine!`, reported by the native engine). `backend.ts` refuses a native build reporting a different value. The render-module hash covers only the render templates, so a reader change with unchanged templates passes the hash check; bump this whenever any of these changes, and regenerate every grammar.

### `packages/codegen/src/emitters/types.ts::emitNodeSurfaceInterfaces`

Emits a kind's `Bound` and `Parsed` interfaces. Every `Parsed` extends `HoldsTree`, because every object a read returns holds its tree's token. A terminal kind (no main type) gets the same members twice: `Bound` over the node methods, and `Parsed` over `HoldsTree` alone, because a parsed leaf is plain data with no methods. Otherwise each declares `$type` first, then `$with` over `this`, then (on `Parsed` only) `$query`, the node's `QueryFacet`, and `$snapshot`, the kind's `Snapshot`, then its own members. A draft drops `$query` and `$snapshot` with `$with` and `$trivia` (`WithSlot`), so only a node read from a parse has them. A kind that seats a flattened group gets its `Bound` and `Parsed` as type aliases instead, `BoundSurface & FlatShapesOf<…>` and `ParsedSurface & FlatShapesOf<…>`, because an interface cannot extend the present-or-absent union; each unexported surface interface carries the members, and its `$with` returns the alias while reading its hints from the interface itself, so a rebuilt node keeps the union without the alias referring to itself. The kind's empty form is then an alias too, whose `$trivia` names the alias where an interface would use `this`. The order matters: the checker compares a target's properties in declaration order, and a mismatched kind must fail on the `$type` discriminant before it reaches the deep `$with` and accessor members; without it every non-matching arm of a wide union is compared structurally to the checker's depth limit.

### `packages/codegen/src/emitters/shared.ts::listOptionsParam`

The options parameter type of a generated list builder, a forwarding constructor's list overload and a list's argument rows: the list's options type under `ListOptions`, so a node is never taken as the options. The list view hint keeps the bare options type.

### `packages/codegen/src/emitters/factories.ts::hasTopLevelUnion`

Whether a type text has ` | ` outside every bracket pair, the test `parenthesizeUnion` applies.

### `packages/codegen/src/emitters/from.ts::keywordOr`

The emitted `_keywordOr(input, keywords, () => resolved)` that replaces `_keywordOf(input, keywords) ?? resolved` for a single slot. Its declared result is `number | R`, so the checker forms the union without reducing it, which a `??` expression does and which exceeds the depth on a union that holds a node's `.Bound`.

### `packages/codegen/src/emitters/factories.ts::listOptionDefaults`

The options a separated list's factory takes, each with the expression a list owner's getter falls back to when the list does not hold it: `undefined` for the delimiter, which a list built without one leaves unset (its default is the options table's, applied at render), and the separator's declared arm (`undefined` when there is none). It reads the same option flags as the options type, so a list owner's getters report what the list holds.

### `packages/codegen/src/emitters/factories.ts::listSlotTargets`

The slots of a node that hold a list: each single-valued slot whose one kind reads as a list (`listViewTarget`) and has a raw factory, paired with that kind.

### `packages/codegen/src/emitters/factories.ts::listSlotHints`

The facts of each slot `listSlotTargets` names: the slot's accessor name, the kind it holds, and that kind's `listViewHint`. `emitSlotHints` stamps them as `$listSlots`, which gives the slot's setter the kind's builder arguments.

### `packages/codegen/src/emitters/factories.ts::listSlotsRuntimeSpec`

The entries a node's builder and wrap pass to `listSlotWith`, one per list slot: per slot `listSlotTargets` names, the setter's name, the held kind's id, whether the slot is optional, and the held kind's raw factory (`make`, prefixed by `factoryScope` where the caller reaches it through a namespace import).

### `packages/codegen/src/emitters/factories.ts::ListViewFacts`

The facts `listViewHint` returns: the item type, the options type, the list's raw factory and the names the view must not collide with.

### `packages/codegen/src/emitters/factories.ts::SeatRuntime`

One runtime helper call a node's builder and wrap add: the helper's name and its spec literal.

### `packages/codegen/src/emitters/factories.ts::listViewOwners`

The nodes that own a list: those `listViewTarget` finds an owner slot for. The wrap reads each of these kinds two levels at once, so the owner's list node arrives with its elements as stubs and its view is sized with no read of its own.

### `packages/codegen/src/emitters/factories.ts::listViewTarget`

The separated list a node reads as: the node itself when it is an `AssembledList`, or, for a list owner, the list it forwards to together with its sole slot (`owner`). `undefined` when the node reads as neither.

### `packages/codegen/src/emitters/factories.ts::listSelfViewPlan`

The list view of a separated list read as itself: its elements, count, option defaults and wrapper. Every `AssembledList` reads as a list (`listViewTarget`), so the plan always exists; the list's own wrap takes it here rather than from `seatPlanOf`'s optional `viewPlan`.

### `packages/codegen/src/emitters/factories.ts::viewPlanOfTarget`

The list view a `listViewTarget` describes: the list's elements, count and option defaults, its wrapper when the list surface has one, and the owner's accessor and storage key when a list owner forwards to it. `listViewPlanOf` and `listSelfViewPlan` both build their plan here.

### `packages/codegen/src/emitters/factories.ts::groupSeatHints`

The facts each flattened group of a node needs for its node surface, one per seat: the slot that seats the group and the parent's storage property that holds it (`stored`), the group's type and kind, its raw factory, whether the seat is optional, and the keys it flattens. Each key has the name the parent reads and sets it by (`name`), the group field it stands for (`field`) whether its setter takes rest arguments, and whether the group requires it (`required`, which lets `seatWith` refuse to build a partial group). There is one for each seat `flattenSeatsOf` names, and its keys come from that seat's own keys, so the config surface and the node surface agree on which kinds flatten a group and on every key's name. A key the seat prefixed is named with `prefixedKey` from the seat's accessor and the field's, the same rule the config key follows. A key that spells the seat's own slot reads the group's inner value, and its setter takes the inner value or the whole group.

### `packages/codegen/src/emitters/factories.ts::groupSeatRuntimeSpecs`

The object literal a node's builder and wrap pass to `seatWith`, one per seat: the seat's accessor (`slot`) and storage property (`stored`), the group's kind id (`kind`), the group's raw factory (`make`) and its keys (`keys`), each with its rest mark and, for a prefixed key, the group field it names. It shares `groupSeatHints` with the type-level `$flat` stamp, so the flattened members exist at runtime exactly when the interface declares them.

### `packages/codegen/src/emitters/factories.ts::elementConfigsOf`

The elements seats of a node: each multiple slot whose elements include exactly one hoisted config-shaped group, as the slot's accessor name, the group's type and raw factory, its config keys and the type of its config object. A separated list's element slot is one when its element is such a group. The config surface takes the group's config objects in these slots and builds each through the group's factory; the node surface takes them the same way in every `$with` setter for the slot, including the setter of a slot that holds the list. The type stamp (`config` of a slot hint or a list-slot hint) and the runtime spec (`element` of a list-slot spec, or an `elementsWith` call) come from this one function.

### `packages/codegen/src/emitters/templates.ts::droppedLiteralTexts`

The render-only literals of a node's rule that its template does not write and no slot carries. A literal counts as written when some template text contains it or a slot holds it as a terminal value; indent and dedent markers and literals inside a token are not counted. Each result is a token a parse of the source reads but the render loses.

### `packages/codegen/src/emitters/templates.ts::templateTexts`

The text nodes of a template body, descending into the arms of its conditionals.

### `packages/codegen/src/emitters/factories.ts::patternMismatchThrow`

The one place a pattern guard's refusal is worded: `<label>: text does not match pattern: <value>`, with the value written through `describeValue` so a non-text value shows what it was. The leaf-text guard and the per-slot interior guard both emit it, so the message cannot differ between them.

### `packages/codegen/src/emitters/shared.ts::emptyDefaultOf`

The expression that fills a required slot the caller omitted: the fixed text's discriminant, or a call of the target kind's factory. It answers only for a slot `slotFilledWhenOmitted` accepts, so a default is never emitted for a target whose own no-argument build would throw. A hidden infrastructure slot is never defaulted. The predicate also accepts a slot that holds fixed text, so two cases stay `null` after it accepts: fixed text with no kind entry to name it (no discriminant to write), and a reference to a fixed-text leaf with none either; a leaf of that kind has a factory but no no-argument call to emit.

### `packages/codegen/src/emitters/factories.ts::requiredUnfilled`

A text slot's pattern guard in the raw builder skips `undefined` only where `undefined` is legal. A slot that is required, carried by no registered option and not filled when omitted is tested directly, so an untyped `undefined` fails the guard instead of building an empty node; the skip stays on every other guarded slot. A pattern that accepts the text `undefined` (a free-text comment, a shebang) still accepts it: the guard tests the value as text and adds no required-slot check of its own.

### `packages/codegen/src/emitters/node-members.ts::SetterEntry`

One `$with` setter of a node literal: its name, its parameter list and the rebuild expression it runs. The factory and wrap emitters collect these, and `seatedSetters` wraps the ones a seat changes.

### `packages/codegen/src/emitters/node-members.ts::nodeMemberLines`

The member lines of a node's literal after its storage keys: the `$with` block, a reader per slot (`accessorRead`), the `$render` closure, the `$trivia` positions, `$query` and `$snapshot` when the literal is a parsed node's (`parsed`), and `$engine`. Every closure reads the `handle` the builder captured with `currentHandle()` and the `node` the literal is assigned to, so the node needs no helper after it is built and every node of a kind has one shape. `$query` is one closure that makes the query facet only when called (`queryOf`), so a node that is never queried pays only for the closure. `$snapshot` is the same: it calls `snapshotOf` on the node, and is `undefined` where `$query` is. A `$with` rebuild calls the same wrap with data `markEdited` stripped of its coordinates, so the member checks that the data still names its tree (`treeHandleOf`) and is `undefined` on a draft; `undefined` rather than absent keeps every node of a kind on one shape. `extra` carries the lines a group seat or a list owner adds. One function writes these lines for the factories and the wraps; only the wraps pass `parsed`, because a built node holds no tree to query. A parsed leaf is not written here and stays plain data with no `$query`.

### `packages/codegen/src/emitters/node-members.ts::StoredAccessor`

One slot reader of a node literal: its name, the storage key it reads, and, for a built node's slot whose storage holds nodes, whether it hydrates one value or a list (`hydrates`). The factory emitter sets `hydrates` (`storedAccessor`); the wraps never do, since their accessors are written by `slotAccessorBody`.

### `packages/codegen/src/emitters/node-members.ts::accessorRead`

The expression a slot reader returns: the storage key as it is, or `hydrateStoredSlot(node, key)` / `hydrateStoredSlots(node, key)` when the reader hydrates, so a coordinate a built node stores comes back as the node every route returns, written back into the slot.

### `packages/codegen/src/emitters/factories.ts::storedAccessor`

A builder's reader for one slot: it hydrates when the slot's storage holds nodes (`storesNodes` over `resolveFieldStorageInfo`, the classification `slotAccessorBody` reads), a list when the slot is multiple; a scalar slot reads its storage as it is. Every builder literal's readers come from it: field-carrying factories, form factories and a list's content.

### `packages/codegen/src/emitters/node-members.ts::innerPositionsOf`

Whether a kind's `$trivia` carries `inner`, and `innerAt`. `inner` is present exactly for the kinds in `emptyForms` (the kinds with an inner gap, which the type surface offers `inner` on as their empty form), and `innerAt` only when the grammar keys its gaps (`innerGapsKeyed`). The types and the literal read the same fact, so they cannot drift.

### `packages/codegen/src/emitters/node-members.ts::triviaInnerImports`

The inner-trivia functions a grammar's builder module imports: none when no kind has an inner gap, `triviaInner` when some does, and `triviaInnerAt` as well when the gaps are keyed. Unused imports would fail the lint of the generated file.

### `packages/codegen/src/emitters/node-members.ts::withEntry`

One `$with` setter line: the entry runs its rebuild through `rebuilt`, which scopes the rebuild in the node's engine and hands the node's trivia on to the result.

### `packages/codegen/src/emitters/factories.ts::narrowedStorageExpr`

The storage of a refine form's narrowed slot: the kind id the narrowing literal names (a missing one fails at emit time), `true` for a keyword-presence slot. A strict builder reads no text, so the literal is resolved here once instead of being mapped at run time.

### `packages/codegen/src/emitters/node-members.ts::seatedSetters`

The setters of a node as its literal writes them, after its seats. A list slot's setter runs through `listSlotWith`, an elements slot's through `elementsWith`. Each key a group seat flattens onto the node gets a setter that runs `seatWith` over the seat's slot setter, and a key that spells its slot replaces that slot's own setter. A seat with no slot setter to wrap, a wrapped list owner among them, adds no keys.

### `packages/codegen/src/emitters/node-members.ts::spelledGroupSlots`

The slots whose group seat has a key of the slot's own name. That key reads the group's inner value, so the slot's own accessor is not written: the node keeps the group's reader under `STORED_SLOT_READERS` instead.

### `packages/codegen/src/emitters/node-members.ts::groupSeatParts`

The lines a group seat adds to a node's builder: a reader of the seated group, hoisted before the literal because both the setters and the stored-reader member call it, and written by `readOf` from the seat's hint, which names the slot, its stored key and its group; a member per flattened key, `undefined` while the group is absent and a reader of the group's field while it is present; and the `STORED_SLOT_READERS` member. A reader exists only when it has a value, decided when the node is built, so a node with the group and a node without it differ in the value of these members and not in the shape of the node.

### `packages/codegen/src/emitters/node-members.ts::ownerViewParts`

The lines that make a list owner read as an array: before the literal, the owner's view of its list; as members, `length`, the items under `LIST_ITEMS`, the shared array methods, the iterator, `isConcatSpreadable`, `unscopables` and the list's options; after the literal, the index positions. Built and wrapped owners hold no items until first use (`LIST_READ`), read them through the owner's own list accessor (so `at`, an index and iteration return what the accessors return, hydrated), and take the shared index getters; only the view before the literal differs. A wrapped owner hands `ownerView` its own `hydrate`, so a list stored as a stub is read wrapped; a raw factory has already resolved its list through `hydrateStored`, and refuses a list that is still a read stub (`refuseReadStub`) before the literal.

### `packages/codegen/src/emitters/node-members.ts::listSelfViewParts`

The same lines for a separated list node that is the list itself: its own stored elements instead of an owner's view, and its options read from its own storage keys, hoisted before the literal in a wrap. A built list and a wrapped list read their items the same way, on first use and through the list's own items accessor (`ownerElements(node, reader)`), so `at`, an index and iteration return what the accessor returns: a built list's accessor hydrates a stored coordinate (`hydrateStoredSlots`), a wrapped list's reads its storage (`hydrateSlots`).

### `packages/codegen/src/emitters/kind-id-rust.ts::kindConstName`

The Rust constant a kind has in `kind_ids.rs`: the screaming-snake name of its member and kind. `kind_ids.rs` and every generated attribute that names a kind take the name from here, so a kind has one spelling in native code.

### `packages/codegen/src/emitters/field-id-rust.ts::fieldConstName`

The Rust constant a parser field has in `field_ids.rs`: the field name in upper case. Fields stay under their module (`field_ids::NAME`) because a field and a kind can share a name.

### `packages/codegen/src/emitters/field-id-rust.ts::emitFieldIdRust`

The source of `render/field_ids.rs`: one `FieldId` constant per entry of the parser's field table, in id order. The ids are `parser.c`'s own, so a generated attribute names a field by constant and the native reader compares ids without looking a name up.

### `packages/codegen/src/emitters/shared.ts::fieldTaggedLiterals`

The literals a compound's render rule places directly under each field, keyed by field name: a `STRING` reached through `CHOICE`/`SEQ` inside `field(name, …)`, each with its text and its stamped kind id (the aliased id when the site aliases it). Tree-sitter tags such a token with the field (the `,` in python's `for_in_clause.right`, the `;` in typescript's `for_statement.condition`), so the reader puts it in the field's storage beside the field's real content. The token is punctuation the render template already emits, so `slotDropKindIds` adds these literals' kind ids to the slot's drop set, and the generated reader leaves them out of the field's storage, for singular slots as well as `many` ones. Lexed-interior compounds are skipped: their interior is one token, not fields.

### `packages/codegen/src/emitters/shared.ts::slotDropKindIds`

The kind ids of a slot's drop set, for the reader: the `separatorKindId` stamped on each of the slot's separated values, and the kind id of each field-tagged literal. Each id is the public symbol link stamped; a separator with no stamp is an error naming it. The ids come out once each, the separators first and then the field-tagged literals.

### `packages/codegen/src/emitters/transport-projection.ts::SCALAR_STORAGE`

The `FieldStorageKind`s whose value is not a node: `boolean` and `bitflag`
presence, and the `kindEnum` / `mixedEnum` kind ids. `verbatim` stores the
node.

### `packages/codegen/src/emitters/transport-projection.ts::isScalarStorage`

Whether a slot stores what it holds as a scalar (a presence flag, a bit flag or a kind id) over a non-empty set of kinds. The reader's `scalar` slot attribute asks it, so a child a slot stores as a unit variant keeps no trivia, and the trivia view's owners come from the same placement (`EngineGrammar::sides_at`).

### `packages/codegen/src/emitters/transport-projection.ts::ReadNames`

The constants a read attribute names: `kind(id)` gives `kind::X` for a kind id and `field(name)` gives `field::X` for a parser field. Both throw when the id or the field has no generated constant, so a missing fact fails at generation.

### `packages/codegen/src/emitters/transport-projection.ts::readNames`

Builds `ReadNames` from the kind entries and the parser's field table. The first entry of an id names it, as `kind_ids.rs` does.

### `packages/codegen/src/emitters/transport-projection.ts::ReadFactsCtx`

What the read facts are computed from: the node map, the kind entries, the names, and the kinds that own a list view (whose read reaches their items).

### `packages/codegen/src/emitters/transport-projection.ts::tokenGroup`

A token as an entry of a reader table (`layout`, an unaliased `presence`, `separator`, separator `candidates`): its kind, then each raw symbol the parser folds into it (`foldedTokens`), written `KIND | RAW`. The reader takes a child as this token when the child's grammar id is any of them, and stores the kind.

### `packages/codegen/src/emitters/transport-projection.ts::oneOrList`

A path, or a bracketed list of paths when there are several.

### `packages/codegen/src/emitters/transport-projection.ts::layoutTokenIds`

The tokens a kind's own rule writes and no slot takes, as the grammar ids the parser gives them: an unfielded string (at an alias site, the symbol under the alias, not the one it is shown as), an unfielded literal symbol, an external, and a fixed-text leaf that no printed slot holds, fielded or not. `transportArgs` prints each with the raw symbols folded into it (`tokenGroup`). Tokens inside a printed slot's field belong to the slot. The reader skips these tokens where it routes children. Every string reads its stamp: link stamps the public symbol on each string site, duplicates and `token(…)`-wrapped strings included, so there is no lookup by text. A string with no stamp, and a fixed symbol with no kind id, is a diagnostic naming the kind and the token, so nothing drops silently. The indent and dedent render markers are not tokens and are skipped.

### `packages/codegen/src/emitters/transport-projection.ts::listItemSlot`

The item slot of a separated list that has a delimiter flank or a separator, or `undefined`. It names the slot the reader's flags and separator kind are computed over.

### `packages/codegen/src/emitters/transport-projection.ts::transportArgs`

The `#[transport(…)]` arguments of a struct: an alias envelope reads by its display id, a text leaf as its text (with the fixed text it reads when its span is empty), a token interior by its pattern, and every other kind by its own id with its minimum depth, layout tokens, inner gaps and list marker. Each fact comes from the derivation the wrap already uses.

### `packages/codegen/src/emitters/transport-projection.ts::takesUntagged`

Whether a slot takes children that carry no field: when it has no field route or names kinds as well.

### `packages/codegen/src/emitters/transport-projection.ts::slotArgs`

The `#[slot(…)]` arguments of one slot: its field routes, `untagged` when it also takes untagged kinds, the keyword a presence slot reads (`display(KIND)` for an aliased one, `presenceKeyword`), its separators, read from the stamps (`slotDropKindIds`; a list's item slot also takes the list's separator candidates), and `scalar` for a text slot stored as a unit. An unaliased keyword and each separator are printed with the raw symbols folded into them (`tokenGroup`). Empty means a bare `#[slot]`.

### `packages/codegen/src/emitters/transport-projection.ts::captureArgs`

The `capture` argument of a token interior's slot: the named group of the interior's pattern it reads.

### `packages/codegen/src/emitters/transport-projection.ts::flankArgs`

The flanks a list leaves optional, each with the number of mandatory flank tokens on the other side: the arguments `_hasSeparatorFlank` checks. `undefined` when no flank is optional.

### `packages/codegen/src/emitters/transport-projection.ts::separatorKindArgs`

The kinds a list's separator can be and the one its declaration falls back to: the arguments `_separatorKindOf` reads. `undefined` for a list with no separator. The candidate ids come from one derivation shared with the item slot's `separator =`, each printed with the raw symbols folded into it (`tokenGroup`), so the reader matches a separator by its grammar id and stores the candidate's kind.

### `packages/codegen/src/emitters/transport-projection.ts::enumKindArgs`

The `#[transport(…)]` arguments of an enum kind: its own id, and `spelled` so its node reads as the member its spelling tokens display.

### `packages/codegen/src/emitters/transport-projection.ts::variantKindArgs`

The `#[kind(…)]` arguments of a variant: the ids it claims, and `display` when they are display ids. An alias envelope's id is printed `display(kind)`, because the parser shows it only by its public symbol. The raw symbols the parser folds into a claimed kind are printed `folded(kind)`: the choice matches them after every exact claim, so a sibling variant that claims the raw symbol itself keeps it. An enum's members take their ids from the arms its decoder holds, so the reader and the decoder read one list.

### `packages/codegen/src/emitters/transport-projection.ts::assertOneUntaggedSlot`

Refuses a kind with two slots that take an untagged child of the same kind, naming the kind, both slots and the shared kind: the reader could not choose between them.

### `packages/codegen/src/emitters/transport-projection.ts::PresenceKeyword`

What `presenceKeyword` answers for a presence slot: `id`, the kind id the reader matches the keyword by, and `envelope`, whether that id is an alias envelope's display id (printed `display(KIND)` and matched by the child's display id) or a token's grammar id (printed with its folds and matched by the child's grammar id).

### `packages/codegen/src/emitters/transport-projection.ts::presenceKeyword`

The keyword a presence slot reads, and how the reader matches it. A keyword the site aliases (`presenceIsAliased`) is an alias envelope: its id is the display id the alias shows, and `envelope` marks it to be matched by display id, as an envelope's admits are. Otherwise its id is the parser symbol of the slot's literal, else a hidden marker keyword's own literal id, else the fixed-literal kind the slot references, matched by grammar id with its folds. `slotArgs` prints it as `presence`, and the diagnostic that checks untagged slots takes the slot's admitted id from it, so one lookup answers both.

### `packages/codegen/src/emitters/transport-projection.ts::presenceIsAliased`

Whether a presence slot's value is a keyword the site wraps in an alias, read from the value's stamps. A literal is aliased unless the id the parser shows for it is its own anonymous token with its text. A referenced kind is aliased when the kind the parser shows differs from the kind it stores. A hidden symbol aliased to one name everywhere shows that name under its own id, so its display id and grammar id agree.

### `packages/codegen/src/emitters/render-module.ts::ReadPrint`

What the transport printers share while they state the read facts: the facts' context, the template bodies by kind, the kind ids each printed type admits, the choices that carry a blank arm, the payload types the choices hold (`choicePayloads`), which the ceiling assertions check, and the transports printed (`transports`), which `grammarTriviaStatement` lists. One value is threaded through every printer so a type's ids and name are recorded where it is printed and checked after all of them are.

### `packages/codegen/src/emitters/render-module.ts::readPrintOf`

Builds the `ReadPrint` of one emit: the names are the kind and field constants, and the list owners are the kinds whose read reaches their items.

### `packages/codegen/src/emitters/render-module.ts::admit`

Records ids a printed type admits, so a slot typed by it can be checked against the other slots of its struct.

### `packages/codegen/src/emitters/render-module.ts::variantKindLines`

The `#[kind(…)]` line of one choice variant. An alias envelope reads by its
display id alone; the other ids the decode claims for it are recorded for the
pin check and printed in `decodes(…)`, ids the derive's codec decodes as the
variant and its reader ignores. A variant the decode gives no id gets no line
and is never read.

### `packages/codegen/src/emitters/transport-projection.ts::foldedTokens`

The raw string-literal symbols the parser folds into a kind's public symbol (`ts_symbol_map`), from the stamped fold table, restricted to kind rows that carry their literal text: a token the grammar writes twice gets a second raw symbol the parser reports under the first one's id, and the typed reader admits it as that kind. A folded raw symbol with no literal text is a lexical symbol of its own and is not admitted.

### `packages/codegen/src/emitters/transport-projection.ts::separatorCandidateIds`

The kind ids of a list's separator candidates, resolved from the model's candidate names; a candidate with no kind row gives none.

### `packages/codegen/src/emitters/envelope-claims.ts::EnvelopeClaims`

The display kind id an envelope variant shows as, and the further kind ids the decode claims for it, as the printer sees them. The pin compares them by kind name.

### `packages/codegen/src/emitters/envelope-claims.ts::ENVELOPE_PINS`

The display kind and the further kinds, by kind name, per grammar and envelope variant, that the decode claims for the variant beyond its display kind (`EnvelopePin`). The reader does not accept them. The pin is a ceiling: it lists the kinds that exist today so none is added unnoticed. Names, not parser ids, so a grammar edit that renumbers symbols does not touch it. The real pipeline hands the table in through the emitter inputs (`grammarRenderInputs`); an emission without one checks nothing.

### `packages/codegen/src/emitters/envelope-claims.ts::assertEnvelopeExtrasPinned`

With a pin table given, refuses a pin whose enum the generation did not print or that names a kind the grammar does not have (naming the entry), a variant that claims a kind outside its pin (a new claimed kind is a decision, never a raised pin), and a pinned variant that is no longer an envelope variant, displays as another kind, or no longer claims a pinned kind (the pin is lowered or removed to match). Claimed ids are turned into kind names through the kind entries, so the comparison and every message speak in kinds. Without a table nothing is checked.

### `packages/codegen/src/emitters/envelope-claims.ts::EnvelopePin`

One pinned envelope variant: its display kind name and the kind names it may claim beyond it.

### `packages/codegen/src/emitters/render-module.ts::alternatesOf`

The alternate ids a slot's fixed-literal variant folds into its stored id: the wrap folds them before the wire, so the decode never meets them, and the reader, which reads the parser's own id, lists them on the variant.

### `packages/codegen/src/emitters/render-module.ts::fixedLiteralIds`

The ids a fixed-literal transport takes: its accepted ids, or its own id. The decode and the reader's attribute both list them.

### `packages/codegen/src/emitters/render-module.ts::structSlotsOf`

The slots a struct has fields for, in order: the slot model's named and unnamed slots in the node's own slot order, then the named slots of each hidden helper node an unnamed slot hoists, all optional. The field order is the order the read writes the transport's keys, so a read transport's keys follow the model's slots. The printer and the check that follows it walk the same list.

### `packages/codegen/src/emitters/render-module.ts::slotReadAttr`

The `#[slot]` attribute of one field: a capture for each slot of a token interior, else the routes, presence keyword, separators and scalar mark `slotArgs` computes. An alias envelope's content has none: it is not a parser field, and the derive's envelope mode names it by `content = …`.

### `packages/codegen/src/emitters/render-module.ts::readsItsSlots`

Whether a kind's reader routes children to its slots: a leaf, an alias envelope and a token interior read otherwise.

### `packages/codegen/src/emitters/render-module.ts::slotTransportTypeName`

The type a slot's carrier wraps: the kind's transport, the supertype's enum, the slot's own choice, or `AnyTransport`. The field type and the untagged-slot check name the type once.

### `packages/codegen/src/emitters/render-module.ts::assertReadableTransports`

The checks that need every type printed. Two slots of a kind that take an untagged child of one kind are refused, naming the kind and both slots. A slot's registration as a blank option must agree with its choice having a blank arm, since a choice is shared by every slot with the same variants.

### `packages/codegen/src/emitters/render-module.ts::isCompoundOf`

Whether a kind prints a layout field and its slots: a branch, an envelope, a list, an alias, or a polymorph that is not a supertype.

### `packages/codegen/src/emitters/factories.ts::buildDelimitedConsts`

Emits one `_delimited_<factory>` constant per delimited kind into the raw module: the kind and its kind id, the excluded characters as a `u`-flag class, the fixed delimiter texts, the parse-back host and the node kinds. The host is resolved here, once, from the grammar's `reparseHosts` block through the supertype closure; a trivia kind (an extra) falls back to the bare `$r` host, and any other kind with no host throws at generation time.

### `packages/codegen/src/emitters/factories.ts::delimitedCheckLine`

The `checkDelimited(handle, node, spec, [content slots], open, close)` call emitted before a delimited builder returns. The delimiter slots come from the stamped fact; every other slot is content.

### `packages/codegen/src/emitters/test.ts::delimiterSamples`

The sample text of every leaf that ends a delimited composite: the shortest text its pattern accepts, so the generated tests build a string with a matching start and end instead of `test` on both sides.

### `packages/codegen/src/emitters/reparse-hosts.ts::emitReparseHosts`

Writes the grammar's `reparseHosts` block as the generated `reparse-hosts.ts`: the host templates, the priority list and the gated kinds.

### `packages/codegen/src/emitters/__tests__/self-containing-list-types.test.ts::selfContainingList`

Builds an isolated assembled list whose repeated element choice includes the list itself. The emitted modules are compiled with TypeScript 6 and 7 to pin own-kind built and parsed inputs, recursive loose configurations, setters, and namespace argument-row resolution without changing a language grammar.
