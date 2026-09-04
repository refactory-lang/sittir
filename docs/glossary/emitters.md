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

### `packages/codegen/src/emitters/engine.ts::emitEngine`

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
 * `@sittir/common/utils` (not `@sittir/legacy-core`; see
 * `.claude/codegen-conventions.md` rule 3). `freezeNodeData`/
 * `buildWithNamespace` in `@sittir/legacy-core/src/nodeData.ts` are
 * `@forFutureUse` scaffolding, not currently wired into generated output.
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

```text
/**
 * Compile leaf-pattern `RegExp` constants and push their declarations into `lines`.
 *
 * @param nodeMap - The assembled node map to scan for leaf nodes with patterns.
 * @param lines - Output line buffer; `const _leafRe_<name> = /.../` declarations
 *   are appended here as a side effect.
 * @returns Map from kind string to the emitted constant name (e.g. `_leafRe_identifier`).
 * @throws When a leaf pattern does not compile as a JavaScript `RegExp` under either
 *   the `'u'` flag or no flag.
 * @remarks
 *   RegExp constants are hoisted to module scope so they are compiled once at load
 *   time rather than per-call. For each patterned leaf, the `'u'` flag is tried
 *   first (needed for `\p{...}` property escapes), then no-flag. The constant name
 *   is `_leafRe_<camelKind>`; the leaf factory references it instead of the previous
 *   inline try/catch block.
 */
```

#### body

```text
// Token modelType hidden kinds (e.g. `_range_pattern_left_bare` = '..') have
// no standalone factory — skip their regex consts. Non-token hidden kinds
// (groups, branches) get fragment factories and may carry patterns.
```

#### body

```text
// Compile at codegen time to pick the flag. If NEITHER flag
// compiles the grammar has a pattern we can't turn into a runtime
// regex — surface this loudly instead of silently dropping the
// validation guard (which would let the factory accept any string
// for this leaf kind, bypassing grammar constraints).
```

#### body

```text
// Prefer a regex literal when the pattern has no unescaped `/`
// (which would break the literal delimiter). Escape `/` if present.
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
// Factory output remains structurally compatible with `AnyNodeData`
// because const-enum members ARE numeric at runtime; the $type read
// path doesn't widen.
```

### `packages/codegen/src/emitters/shared.ts::emitsPlainBuiltAlias`

```text
/**
 * Whether the factories emitter declares a plain `<TypeName>Built` return
 * alias for this kind — the field-carrying and separated-list emission
 * paths (branch/group/separatedList with an emitted factory). Leaves and
 * polymorph forms never carry one.
 *
 * @remarks
 * ONE predicate for every consumer of "this kind has a Built alias": the
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

### `packages/codegen/src/emitters/factories.ts::buildFactoryMapEntries`

```text
/**
 * Build the map entries list for `_factoryMap` and `FluentKindMap`.
 *
 * @param nodeMap - The assembled node map.
 * @param aliasSourceKinds - Set of kinds that are alias sources (included even if hidden).
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
 *   Only branches / containers / polymorphs get a `FluentNode` entry; leaves /
 *   keywords / enums produce raw `NodeData` instead and are keyed to their own
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

### `packages/codegen/src/emitters/factories.ts::group`

```text
/**
	 * Emit a group factory — field-carrying factory for hidden composition
	 * fragments (polymorph form inner kinds).
	 */
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

```text
/**
 * Build the runtime guard statements for a leaf factory.
 *
 * @param node - The leaf `AssembledNode` to generate guards for.
 * @param leafReConsts - Map from kind string to the module-level regex constant name.
 * @returns Array of guard statement strings (each is a complete `if (...) throw` statement).
 * @remarks
 *   Leaf factories accept arbitrary text but receive two categories of runtime guard:
 *
 *   1. **Pattern** — the module-level `_leafRe_*` const (hoisted for zero per-call
 *      regex compilation cost) is used directly if available.
 *
 *   2. **Non-empty** — every leaf gets this guard unconditionally. A named terminal
 *      always has at least one character in the parse tree, so an empty string is
 *      always semantically invalid regardless of pattern, word-kind, or enum constraints.
 *
 *   Reserved-keyword exclusion is intentionally omitted. The earlier heuristic
 *   ("if text matches word-pattern AND is in the collected keyword set, reject")
 *   rejected legitimate constructions: rust `_` in `'_` elided-lifetime identifier,
 *   python `print`/`match`/`exec` in identifier contexts (permitted via the grammar's
 *   `keyword_identifier` alias-to-identifier). Tree-sitter resolves these by grammar
 *   context; the factory has no context and cannot distinguish "this identifier slot
 *   permits the keyword" from "this one doesn't". The pattern check above still
 *   rejects non-identifier-shaped input; tree-sitter reparse in validators catches
 *   semantic misuse.
 */
```

### `packages/codegen/src/emitters/factories.ts::buildEnumLiteralUnion`

```text
/**
 * Build a TypeScript literal-union string for all enum values.
 *
 * @param node - The enum `AssembledNode` with a `values` array.
 * @returns A TS source string like `'foo' | 'bar' | 'baz'`.
 * @remarks
 *   Enums use compile-time literal-union typing on the parameter — the type
 *   system enforces the valid set, so no runtime `.includes()` guard is emitted.
 *   The `from()` resolvers that call enum factories via `Parameters<>` cast are
 *   trusted paths that do their own validation.
 */
```

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
// Hidden kinds with `multi` or `token` modelType don't get
// exported interfaces (types.ts excludes them from emission).
// When their typeName was collision-renamed (e.g.,
// `_expression_statement_tuple` → `_ExpressionStatementTuple`),
// the `T._X` reference is dangling. Redirect to the visible
// counterpart (strip leading `_`) which has a standalone
// exported interface. The runtime shapes are structurally
// compatible (same fields/children).
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
 *   NodeData object whose shape matches `Terminal<kind, text>`:
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
// A namespaced factory is exported as a const carrying its constructors
// (`export const buildX = attachProps(buildX$impl, {...})`); the
// implementation below is then the private `buildX$impl`, and every
// self-reference (setters, the forwarding tail) stays on the impl so
// the const's type never depends on its own initializer.
```

#### body

```text
// A field with an optional delimiter flank cannot reach this emitter: a
// delimiter-bearing list is a separatedList KIND (classifyNode routes it
// there, peeling group wrappers), and the delimiter is stored kind-level
// on that kind — field-prefixed delimiter storage is retired. Fail fast
// if classification ever regresses.
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
// A single non-object argument (undefined = optional-empty; string
// = text-collapsed scalar storage; number = scalarized kind-enum
// storage; boolean = keyword-presence storage) keeps the direct
// pass-through semantics — read-side storage scalar-collapses such
// children, so constructing a node here would diverge from what a
// real parse stores. Only structured forwarded args (config
// objects, node spreads) construct the child.
```

#### body

```text
// Prepended AFTER the rename: the alias bodies mention `config`, and
// `renameUnusedConfigParam` decides on whether the name is read anywhere
// else in the emitted source.
```

### `packages/codegen/src/emitters/factories.ts::childrenSetterRestType`

```text
/**
 * Resolve the rest-param type for a `$with.children` setter so it matches
 * the config's `children` slot shape. Three cases mirror the three shapes
 * `emitInterface` produces for `$children`:
 *
 *   - `anyMultiple && anyNonEmpty` → `NonEmptyArray<T>` (= `readonly [T, ...T[]]`).
 *   - `anyMultiple && !anyNonEmpty` → `T[]` (regular array).
 *   - `!anyMultiple` → `readonly [T]` (single-element tuple, exactly one arg).
 *
 * The TS rest-parameter type system accepts all three shapes; declaring
 * the right one means `factory({ ...config, children: items })` type-checks
 * without a runtime narrowing helper.
 */
```

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
 * fields, and returns a NodeData shape structurally identical to the
 * base factory's output (and to what `readNode` produces from a parsed
 * tree). No `$variant` tag — the selected literals live in `$fields`
 * exactly as they do when parsed, so the round-trip contract is
 * preserved.
 *
 * The fluent method suffix (render/toEdit/replace) mirrors the base
 * factory so the output shape is interchangeable; callers switching
 * between `ir.interfaceBody.curly(...)` and `readNode(...)` get the
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
 * exactly which fields `emitSeparatedListWrap` (wrap.ts) and
 * `renderTransportDataStruct` (render-module.ts) conditionally
 * capture/emit.
 *
 * Storage keys (`_separator_kind`/`_leading_sep`/`_trailing_sep`) match
 * wrap.ts's `emitSeparatedListWrap` naming exactly — the same per-instance
 * concepts share one naming scheme across capture/render/ construct. The
 * elements' own storage key/accessor, however, is NOT a fixed
 * `_content`/`content()` bucket — it is derived via
 * `canonicalSeparatedListField` (shared.ts), the SAME single-field
 * canonical-slot derivation `emitSeparatedListWrap`'s "Bug B fix" and
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
 * this function fixes that as a side effect of bypassing it, the same way
 * wrap.ts's analogous fix did for the wrap side).
 */
```

#### body

```text
// Single-field kinds (the common case) store/expose the elements under
// the model's real slot name (Bug B fix — shared with wrap.ts/
// render-module.ts via `canonicalSeparatedListField`), not a generic
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
// Stamp only a caller-chosen separator. A defaulted stamp fabricates
// a token the node never carried — read references for separator-less
// occurrences have no `_separator`, and the native render's
// separator_kind match already falls back to the template's own
// separator literal when the field is absent.
```

#### body

```text
// Rest param type must match `elementsType` exactly (`NonEmptyArray<T>`
// when nonEmpty) — a plain `T[]` rest capture isn't assignable to the
// tuple-shaped `NonEmptyArray<T>` the factory's own `elements` parameter
// requires. Independently computed from `node.nonEmpty` (the
// authoritative source — `rule.type === REPEAT1`) rather than via
// `childrenSetterRestType`, which derives multiplicity from
// `AssembledNonterminal.isMultiple`/`isNonEmpty` — themselves derived
// from `slot.values`' own per-value `multiplicity` tags, so they
// generally DO reflect the content slot's real multiplicity. The narrow
// edge case that rules this out as a safe drop-in: if
// `deriveValuesForRule` (node-map.ts) ever resolves `node.elements` to
// an EMPTY array for some content-rule shape (e.g. an unresolved
// reference), `isMultiple`/`isNonEmpty` degrade to `false` on zero
// values, silently diverging from the true (still-repeated) rule shape
// — `node.nonEmpty` has no such degenerate case since it reads directly
// off `rule.type`, never off the derived value count.
```

### `packages/codegen/src/emitters/factories.ts::stripUselessEscapes`

```text
/**
 * Strip ESLint-flagged useless escapes that occur inside tree-sitter
 * grammar regex patterns. Only two cases appear in real grammars and
 * are safe to strip:
 *
 *   - `\[` inside a character class — `[` has no special meaning inside
 *     `[...]`, so the backslash is decorative.
 *   - `\-` at the end of a character class — a literal `-` after a prior
 *     character set needs no escape when it's the last char in the class.
 *
 * The stripped pattern must still compile as a RegExp. If it doesn't
 * (some grammar regex we didn't anticipate), fall back to the original
 * pattern so semantics stay identical. Full set-equivalence cannot be
 * checked at codegen time without running both regexes against a corpus
 * — the two specific transformations above are provably safe by the
 * JavaScript regex grammar, so compile-success is the strongest static
 * check we can offer.
 */
```

```text
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
```

#### body

```text
// Inside character class.
```

#### body

```text
// `\[` inside a class → `[`
```

#### body

```text
// `\-` at end of class (next-next is `]`) → `-`
```

#### body

```text
// Otherwise keep the escape verbatim.
```

#### body

```text
// If the stripped pattern fails to compile, the transformation broke
// something — fall back to the original (which we know compiled;
// otherwise this function wouldn't have been called).
```

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
// Delimiter is emitted unconditionally and PRUNED in finalize() when the
// body never references it — whether any coercer carries a delimiter
// guard depends on per-kind emission decisions made after this preamble.
```

### `packages/codegen/src/emitters/from.ts::emitFromFieldInputType`

```text
/**
 * Emits the `_FromFieldInput` closed union type declaration into generated
 * from.ts, capturing every shape a loose-from() field value can hold.
 *
 * @remarks
 * Every loose-from() caller can hand us:
 *   - a fully-built NodeData     (passthrough path)
 *   - a primitive                (leaf-factory dispatch)
 *   - a { kind, ...rest } object (kind-tagged dispatch)
 *   - an array of any of above   (multi-field slot)
 *   - undefined / null           (absent optional field)
 *
 * `_FromFieldInput` is intentionally `unknown`. Generated field resolver
 * helpers immediately narrow with runtime guards (`typeof`, `Array.isArray`,
 * `isNodeData`, `'kind' in value`), and keeping the alias closed causes
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

#### body

```text
// Namespaced coercers are exported as consts (attachProps) — this
// top-of-module literal must reference the hoisted $impl declaration.
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

### `packages/codegen/src/emitters/from.ts::canDefaultToEmpty`

```text
/**
 * Returns the target factory name when a required field can default to an
 * empty factory call, or `null` when it cannot.
 *
 * A field qualifies for default-empty when:
 * 1. `isRequired(field)` is true.
 * 2. Its `values` resolve to exactly ONE kind (not a union).
 * 3. That kind's factory can be called with zero arguments:
 *    - Container shape with rest-params (multiple children) — always callable.
 *    - Container shape with optional singular child — callable.
 *    - Config-based factory where every non-auto-stamp field is optional and
 *      every non-auto-stamp child is either auto-stamp-eligible or repeat-0+.
 *
 * @param field - The field slot to check.
 * @param nodeMap - The assembled node map.
 * @returns The target factory's `rawFactoryName` if it qualifies, or `null`.
 */
```

#### body

```text
// 'list' is EXCLUDED here (unlike 'branch') — its Task-6 factory
// signature always requires an `elements` argument (never a zero-arg
// `F.x()` call, even for a plain `repeat` whose elements COULD be an
// empty array — the array itself is still a mandatory argument, not a
// default). `instanceof AssembledBranch` can't recognize
// AssembledList, so narrow on modelType instead.
```

#### body

```text
// Rest params (`...children`) always accept zero args. A singular
// positional `child` is safe only when it's itself optional.
```

#### body

```text
// Branch / hoisted compound with fields: check if the factory config is
// all-optional. 'list' excluded — see this function's doc comment above.
```

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
 * existing self-NodeData value's storage. Both `emitRepeatedChildrenFrom`
 * (container-shape branches — spreads the resolved elements into the
 * factory's `(...children: T[])` rest param) and `emitSeparatedListFrom`
 * (`'list'` kinds — passes the resolved elements as the single `elements: T[]
 * | NonEmptyArray<T>` array argument) share this exact three-shape structure
 * (numeric-discriminant gate, self-NodeData unwrap, fresh-input fallback);
 * they differ ONLY in how the final call expression is built from a resolved
 * variable name, which `buildCallExpr` parameterizes.
 *
 * The rest element is typed `T.<Kind>.Loose | LooseValue<Element>` — the kind's
 * own loose forms (its config bag, itself, a list's bare elements) plus what a
 * slot holding one element admits. Nothing is spelled by hand here: the body
 * resolves every element through `_resolveMany`, so the parameter must admit
 * exactly what the slot-level widening admits, tagged bags and bare arms
 * included — a hand-written `Element | Kind | { key: … }` union kept lagging
 * behind that widening.
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-NodeData check.
 * @param kindEntries - Collected kind-enum entries for numeric $type comparison.
 * @param nodeMap - The assembled node map (used for member-name derivation).
 * @param storageKey - The wire storage key to unwrap on the self-NodeData path.
 * @param buildCallExpr - Builds the final `factory(...)` call expression from
 *   a resolved variable name (`'input'` or `'children'`) — spread-via-unknown
 *   for container-shape factories, direct array cast for `'list'`.
 * @param childrenTypeAnnotation - Optional explicit type annotation for the
 *   self-NodeData-unwrap `children` local (e.g. `': readonly unknown[]'`) —
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
// single non-NodeData object carrying the key unwraps to its elements.
```

#### body

```text
// `isSelfUnwrap` distinguishes the two call sites below: `true` inside
// the self-NodeData-unwrap branch (a `data` local naming the original
// wrapped node is in scope, so a caller like `emitSeparatedListFrom` can
// read per-instance facts off it — e.g. preserving `_separator`/
// `_delimiter` when reconstructing an already-wrapped
// separatedList node); `false` for the fresh-input path, where no such
// source node exists to read facts from.
```

#### body

```text
// TSGrammar-only kinds (string $type) can't satisfy isNodeData() (which
// requires numeric $type). Skip the node-data pass-through guard entirely
// — the check would always be false at runtime anyway.
```

#### body

```text
// The accepted-input union allows callers to hand back an existing
// <kind> NodeData OR a flat list of element children. The single-arg
// self-NodeData path unwraps the storage key; otherwise every item must
// already be an element. The storage value is typed as singular-or-array
// on the loose `AnyNodeData` shape; normalize to an array before the
// boundary cast.
```

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
 * @param kind - The grammar kind string for the self-NodeData check.
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
 * readNode promotes `(` / `)` / `[` / `]` into fields and produces no
 * `children`. Calling `factory(undefined)` rebuilds the empty form;
 * indexing `children[0]` in that case throws "Cannot read properties of
 * undefined (reading '0')".
 *
 * @param fn - The `fromX` function name to emit.
 * @param factory - The `F.<factoryName>` reference string.
 * @param tName - The `T.<TypeName>` reference string.
 * @param elementType - The child element type union string.
 * @param kind - The grammar kind string for the self-NodeData check.
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
// TSGrammar-only kinds (string $type) can't satisfy isNodeData() (which
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
 * self-NodeData-unwrap `children` local, PROVIDED that local carries an
 * explicit `readonly unknown[]` annotation — its inferred type otherwise
 * widens to `any[]` (via the `Array.isArray` ternary), which tsgo does
 * reject directly. A narrower cast means a genuinely wrong shape at one of
 * these two remaining opaque-`unknown`-origin sites (the self-NodeData
 * unwrap's `stored` read, and `_wrapWithChildren`'s own `children` param)
 * would now surface as a real tsgo error instead of silently laundering
 * through `unknown`, closing the exact gap that let this bug ship
 * undetected the first time.
 *
 * `options` is omitted on the fresh-input path (no source node exists there
 * to read per-instance facts from — the factory's own defaults apply, same
 * as before this fix). On the self-NodeData-unwrap path, `options` IS built
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
// (factories.ts): the self-NodeData-unwrap path must read the SAME wire
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
// `KIND_LITERAL_TEXT` (types.ts) is the single stamped source for
// kindId→literal-text; the emitted guard narrows its `string`
// result to the factory's own separator literal union (built from
// this same `candidateKindNames` list).
```

#### body

```text
// The stored bitflag can carry values outside the factory's
// permitted union (`Delimiter.None`, an unpermitted side) —
// narrow with the same member list the option type is built from.
```

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

### `packages/codegen/src/emitters/from.ts::classifyKindsForResolver`

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
// token NodeData through instead of auto-wrapping it into the
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
// alternate-branch NodeData instead of auto-wrapping it into the
// primary container (#128). Leaf resolvers never wrap, so they need
// no alternate list. PR-K3d: the discriminants are baked at codegen
// (`altKindDiscriminants`) — no runtime `kindIdFromName` re-resolution.
```

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

### `packages/codegen/src/emitters/from.ts::emitResolveByKindHelper`

```text
/**
 * Emits the `_resolveByKind` generic helper into generated from.ts.
 *
 * @remarks
 * Generic over the kind literal so the return type is the precise
 * `ReturnType<_FromMap[K]>` — each per-kind factory's output flows through,
 * not a widened `AnyNodeData` union. Callers pass a narrow kind (string-
 * literal from the field's content types or narrowed via an `in`-check
 * against `_fromMap`) to get the specific return shape back. The internal
 * sideways cast routes around per-slot parameter variance without going
 * through `unknown` / `any`.
 *
 * @param lines - Output lines array to push into.
 */
```

#### body

```text
// Type guard for keyof _FromMap so `kind in _fromMap` checks elsewhere
// narrow the string parameter without an unchecked cast.
```

### `packages/codegen/src/emitters/from.ts::resolveScalarParamName`

```text
/**
 * Determines the scalar resolver parameter name, prefixing with `_` when
 * the grammar has no scalar leaf kinds to satisfy the oxlint unused-variable
 * convention.
 *
 * @remarks
 * When the grammar declares no scalar leaf kinds the function body is empty —
 * prefixing the parameter with `_` prevents oxlint from flagging it. Callers
 * still pass arguments; the `_` is a lint convention only.
 *
 * @param hasBool - Whether the grammar has a `boolean_literal` kind.
 * @param hasInt - Whether the grammar has an integer literal kind.
 * @param hasFloat - Whether the grammar has a float literal kind.
 * @returns The parameter name string: `'v'` or `'_v'`.
 */
```

### `packages/codegen/src/emitters/from.ts::emitResolveOneHelper`

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
 * structurally satisfy `AnyNodeData` (they omit the `named` property), and
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
// satisfy the slot's NodeData shape; scalar/leaf factories produce
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
 * NodeData whose `$type` differs from the target kind, it wraps the value
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

### `packages/codegen/src/emitters/ir.ts::bundleExpr`

```text
/**
 * Factory+from bundle expression, shared by flat and grouped emission.
 * Kinds with refine() metadata carry per-form bundles keyed by the form's
 * camelCase short name (e.g. `ir.interfaceBody.curly`). Branches call the
 * loose `from()` path by default and expose the raw factory as `.strict`.
 */
```

### `packages/codegen/src/emitters/ir.ts::groupNameFor`

```text
/**
 * Supertype kind → group namespace name.
 *   `_expression`            → `expression`
 *   `_declaration_statement` → `declarationStatement`
 *   `_literal_pattern`       → `literalPattern`
 */
```

### `packages/codegen/src/emitters/ir.ts::memberKeyFor`

```text
/**
 * Member kind → short key within its supertype group.
 * Strip the last underscored segment (e.g. `_expression`, `_item`, `_pattern`).
 * If that collides with a JS reserved word, suffix with `_` per FR-029.
 *
 * Falls back to the full camelCased kind if stripping would leave nothing.
 */
```

#### body

```text
// Drop what the GROUP already says, wherever it sits — not the last token
// positionally. `expression_statement` under `statement` keeps
// `expression`, and `statement_block` keeps `block` instead of stuttering.
```

#### body

```text
// The group's name says nothing about these members — many groups are
// structural unions (`condition`, `non_delim_token`) whose name never
// appears in a member. Drop a trailing CATEGORY token instead, so
// `array_expression` still reduces to `array`.
```

#### body

```text
// camelCase runs LAST, on the surviving snake tokens, so the group's own
// capitalization never has to be matched.
```

#### body

```text
// A member that reduces to the group's own name would read as a stutter.
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
 * Check if a node is a leaf factory (takes a text string, not a config object).
 * Leaf modelTypes: pattern, enum, keyword.
 */
```

### `packages/codegen/src/emitters/ir.ts::returnTypeExpr`

```text
/**
 * Build the ReturnType expression for a factory. Uses `ReturnType<typeof F.xxx>`
 * so the type tracks the fluent methods attached by withMethods.
 */
```

### `packages/codegen/src/emitters/ir.ts::emitFromNamespace`

```text
/**
 * Emit the `from` const — canonical factories that accept native JS values
 * and resolve to grammar-specific NodeData kinds.
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
/* Disambiguate member-name collisions. Two different catalog keys can
		   produce the same PascalCase member (e.g. `_literal` typeName `Literal`
		   and anon token `literal` → `Literal`). Append the numeric id to the
		   second occurrence so the enum compiles. */
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

### `packages/codegen/src/emitters/kind-id-rust.ts::toScreamingSnakeCase`

```text
/**
 * Convert a PascalCase `typeName` (as returned by `kindIdMemberName`) into
 * SCREAMING_SNAKE_CASE, preserving any leading underscore that marks the
 * kind as a hidden alias source.
 *
 * @param memberName - PascalCase member name, e.g. `'CallExpression'` or
 *   `'FieldIdentifier'` (already had its leading underscore stripped by
 *   `kindIdMemberName`; hidden kinds arrive here as `'FieldIdentifier'`).
 * @param rawKind - The original grammar kind string, used to detect whether
 *   a leading underscore must be re-attached (hidden kinds start with `_`).
 * @returns SCREAMING_SNAKE_CASE constant name, e.g. `'CALL_EXPRESSION'` or
 *   `'_FIELD_IDENTIFIER'`.
 */
```

#### body

```text
// `rawKind` is the source of truth for leading underscores (hidden-kind
// marker — `_field_identifier`, `_call_signature`). The grammar may
// produce a typeName that already carries the underscore (`_CallSignature`)
// — that would double up if both were preserved (`__CALL_SIGNATURE`).
// Strip leading underscores from `memberName` before processing, then
// re-attach exactly as many as `rawKind` carried.
```

#### body

```text
// Defense for all-uppercase input (e.g. `LPAREN`, `PLUS`): a memberName
// with no lowercase letters has no word boundaries to split on. Treat it
// as a single token and pass it through. The regex split below assumes
// PascalCase (`CallExpression` → `Call_Expression`); applying it to
// `LPAREN` would produce `L_P_A_R_E_N`. The catalog now lowercases
// `anon_sym_*` names upstream so this branch should rarely trigger;
// kept defensively so any other source of uppercase memberName (future
// emitters, edge cases) doesn't silently break.
```

```text
// remove leading underscore added by replace
```

### `packages/codegen/src/emitters/kind-id-rust.ts::emitKindIdRust`

```text
/**
 * Emit the Rust source for `kind_ids.rs` — one `pub const` per kind that
 * has a parser symbol (TSInternals presence), sorted by numeric id, plus a
 * `kind_name_from_id(KindId) -> &'static str` diagnostic helper.
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
// render_dispatch where NodeData.type_: KindId shows a numeric id.
```

#### body

```text
// For anonymous tokens use symbolName when available (shows literal text),
// otherwise fall back to the canonical kind string.
```

#### body

```text
// (the reader stays grammar-agnostic; wrap is the model-driven boundary —
// see `wrap.ts::_keepModelledSlots`.)
```

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

### `packages/codegen/src/emitters/refine-emit.ts::pascalCase`

```text
/**
 * PascalCase a form name for type / factory naming. Treats `_` as a
 * word boundary so `snake_case` forms pascal-case correctly.
 */
```

### `packages/codegen/src/emitters/refine-emit.ts::camelCase`

```text
/**
 * camelCase a form name for fluent-key naming on the parent namespace
 * (e.g. `ir.interfaceBody.curly`).
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

### `packages/codegen/src/emitters/render-module-runner.ts::runRenderModuleEmitter`

```text
/**
 * Drive the class-based emitter contract for render-module emission.
 * Mirrors the loop that emitAll() runs, but narrowed to TemplateEmitter
 * and RenderModuleEmitter. Use this in scripts and tests instead of
 * calling emitRenderModuleBundle directly.
 */
```

#### body

```text
// 'list' shares 'branch's emission — see
// isSlotBearingCompound's doc comment (shared.ts, emitters).
```

### `packages/codegen/src/emitters/render-module.ts::rustFieldIdent`

```text
/** Rust field identifier mapping for generated render/transport structs.
 *  Askama template expressions do not accept raw identifiers (`r#pub`),
 *  so keyword-named fields use a uniform `_` suffix (`pub_`, `type_`,
 *  `crate_`, etc.) across the Rust render module. */
```

### `packages/codegen/src/emitters/render-module.ts::structNameFor`

```text
/** Struct name: PascalCase(kind). Mirrors the AssembledNode.typeName
 *  conventions so emitted struct names match the factory/type naming
 *  per the T027 struct-name directive.
 *
 *  Prefers the AssembledNode.typeName when a matching node exists (this
 *  is the `_`-stripped form for hidden user-facing aliases); falls back
 *  to a pascal conversion for bare kinds. */
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

### `packages/codegen/src/emitters/render-module.ts::slotFieldType`

```text
/**
 * Pick the per-cardinality nonterminal-view type for an emitted slot.
 *
 * The four-type taxonomy:
 * - `SingleNonterminalView<'a>` — known-required, single occurrence.
 * - `OptionalNonterminalView<'a>` — known zero-or-one.
 * - `ListNonterminalView<'a>` — known zero-or-more.
 * - `NonterminalView<'a>` — escape hatch when cardinality is genuinely
 *   ambiguous at codegen time. Under current rules every emitted slot
 *   resolves to one of the three concrete types; the umbrella is
 *   reserved for future cases where the walker can't decide.
 */
```

#### body

```text
// list view OR field-view-with-multiple → always-list (original cases).
// Also treat any multiple-backed field as list: transport type Vec<X> or
// Option<Vec<X>> doesn't implement AsRef<dyn RenderableTransport>, so
// it must be emitted as ListNonterminalView populated from the *_buf slice.
```

#### body

```text
// scalar OR field-view-single, non-multiple
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
// (both use node.typeName). Hidden kinds like `_kw_abstract_marker` have
// typeName `KwAbstractMarker` — using kind would produce double-underscore
// render fn names that don't match.
```

#### body

```text
// `supertype`: downgrade to heterogeneous when enum name is reserved.
// `heterogeneous`: pass through unchanged.
```

### `packages/codegen/src/emitters/render-module.ts::buildSlotWriteCall`

```text
/**
 * Like `buildSlotRenderCall` but emits a `write`-to-dest statement
 * instead of a String-returning expression. Used by the streaming
 * fallback branch render fn.
 *
 * @param cls  - slot classification
 * @param expr - Rust expression for the slot value
 */
```

```text
/**
 * Write one slot value directly (no template). `expr` names the slot's
 * `SlotValue` carrier: the concrete and supertype classes call their own
 * `render_<kind>` function, so they unwrap through `node_or_write`, which
 * emits the verbatim arm itself and yields the node only when there is one.
 * The heterogeneous classes go through `RenderableTransport`, which the
 * carrier implements, so they need no unwrap.
 */
```

### `packages/codegen/src/emitters/render-module.ts::renderTypedDispatch`

```text
/**
 * Emit per-kind `render_<kind>` functions, per-supertype render
 * helpers, plus the top-level `render_transport_dispatch` that routes
 * `&AnyTransport` to the right fn.
 *
 * Each per-kind fn builds the `*Template` struct directly from the typed
 * transport fields (no `NodeData` round-trip) and writes directly into a
 * caller-provided `&mut dyn fmt::Write` via `template.render_into(dest)`.
 * This is the direct render path introduced by that change of the
 * renderable-native-views plan.
 *
 * Per-supertype render helpers are emitted AFTER all per-kind fns so every
 * concrete subtype render fn is already declared when the supertype match arm
 * references it.
 *
 * (the legacy transport→NodeData inverse bridge was verified zero-caller and
 * deleted — typed transport dispatch is the ONLY render path.)
 *
 * @param usedSupertypeNames - supertype typeNames actually used as slot types;
 *   only these get render helpers emitted. Passed from renderTransportSupport
 *   (single derivation, DRY).
 * @param kindIdByKind - Map<kind, u16 id>, same source `renderTransportSupport`
 *   already computes for supertype/per-slot enum dispatch (`buildKindIdByKind`).
 *   Threaded through so `'list'` kinds with a nonterminal separator
 *   can resolve each candidate arm's numeric KindId for the render-side
 *   `_separator_kind` → literal match (see `buildSeparatorKindMatchLines`).
 */
```

```text
// ----------------------------------------------------------------------
// Typed transport dispatch — render_transport_dispatch + per-kind fns
// ----------------------------------------------------------------------
```

#### body

```text
// ---- per-kind fns ----------------------------------------------------
```

#### body

```text
// ---- per-supertype render helpers ------------------------------------
// Emitted AFTER per-kind fns so subtype render fns are in scope.
```

#### body

```text
// Skip when enum name is reserved (mirrors the guard in renderTransportSupport).
```

#### body

```text
// ---- render_transport_dispatch ---------------------------------------
// Delegates to render_into so all dispatch logic lives in one place.
// render_into writes leaf text directly (no String intermediate) and
// dispatches branch nodes through their Askama template fns. This
// function is retained as the `pub fn -> String` entry point for callers
// that need an owned String (e.g. render_transport, parity tests).
// Per-grammar word class, derived at emit time from the Link-pinned
// wordMatcher (SpacingWriter spec: no new configuration). ASCII table
// via the pair test in wordCharAsciiTable; >=0x80 falls back to
// Unicode alphanumerics.
```

#### body

```text
// Per-grammar punctuation merge-hazard pairs, derived from this grammar's
// own anonymous literal inventory (`literals`, already collected for the
// unit-variant arms below) — see literalMergePairs' doc comment.
```

#### body

```text
// ---- impl RenderableTransport for AnyTransport -----------------------
// Heterogeneous (Box<AnyTransport>) slots call .render_to_string() instead
// of render_transport_dispatch(...) directly.
//
// Per-kind node arms delegate to the per-kind render fn (same as dispatch).
// Literal unit variant arms write static text directly via dest.write_str —
// no String allocation, no call through render_transport_dispatch.
```

#### body

```text
// Leaf/keyword/token: route through render_into so render_with_trivia! fires.
```

#### body

```text
// Multi-member enum: delegate to its RenderableTransport impl which
// writes the static text directly via dest.write_str(match self {...}).
```

#### body

```text
// Branch/container/group/polymorph: route through render_into (not
// the per-kind render fn directly) so this struct's own
// render_with_trivia!-wrapped impl fires — otherwise leading/
// trailing trivia attached to this node is silently skipped.
```

#### body

```text
// Literal unit variant — static text known at codegen time; write directly.
```

### `packages/codegen/src/emitters/render-module.ts::renderTypedKindFn`

```text
/**
 * Emit the `render_<kind>(t: &<Kind>Transport, dest: &mut dyn fmt::Write)`
 * function for a single node. Dispatches based on modelType:
 *
 * - polymorph → match on enum variants, delegate to per-form fns
 * - branch / container / group → build template struct, render_into(dest)
 * - leaf / keyword / token / enum → write text directly to dest
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

```text
/**
 * Emit a fallback typed render fn for branch/container/group nodes that
 * have no template struct (no `.jinja` file). Writes children directly
 * into dest, or falls back to writing `transport_text` if there are no
 * children.
 */
```

#### body

```text
// No template — render each slot in declaration order.
```

### `packages/codegen/src/emitters/render-module.ts::renderTypedLeafFn`

```text
/**
 * Emit a simple leaf/keyword/token/enum typed render fn that writes the
 * transport text directly into dest.
 *
 * For `enum` modelType nodes: transport is the Rust enum; write via `Display`
 * (`t.to_string()`).
 * For all others: write `t.text` directly.
 */
```

#### body

```text
// Grammar-declared immediacy (`token.immediate`, or an immediate-declared
// external's renderAs body): no whitespace may precede this token, so its
// write must not receive a seam space — mark the root SpacingWriter to
// skip the check for exactly this chunk. Placed here (inside the trivia-
// wrapped render fn) so factory-attached leading trivia still seams
// normally before the mark applies to the token text itself.
```

### `packages/codegen/src/emitters/render-module.ts::buildFieldKindsByName`

```text
/**
 * Build a name→projection.kinds map from a list of assembled fields.
 * Used to feed `classifySlot` per field in `buildTypedTemplateBody`.
 *
 * @param fields - the node's structural fields
 */
```

### `packages/codegen/src/emitters/render-module.ts::buildFieldMixedByName`

```text
/** Returns the set of field names whose slots contain mixed named+anonymous content. */
```

### `packages/codegen/src/emitters/render-module.ts::renderTypedBranchFn`

```text
/**
 * Emit a branch/container/group typed render fn that builds the template
 * struct from the typed transport fields.
 */
```

#### body

```text
// Node-wide fallback separator — used for list slots whose values don't
// carry per-slot separator stamps (inferred/positional slots).
```

#### body

```text
// Build per-field kind maps for typed render call selection — named and
// unnamed slots are symmetric (cleanup-rules §E1).
```

### `packages/codegen/src/emitters/render-module.ts::emitIterCollectBuffer`

```text
/**
 * Emit the iter/map/collect pattern that wraps each element in
 * `Renderable::Transport`. Shared by both single-child and list-slot
 * buffer emitters.
 *
 * @param ident      - Rust identifier base (e.g. `"children"`, `"parameters"`)
 * @param sourceExpr - The iterable expression to `.iter()` over
 * @param mapBody    - The closure body inside `.map(|t| ...)` (e.g. `Renderable::Transport(t)`)
 */
```

### `packages/codegen/src/emitters/render-module.ts::emitListSlotBuffer`

```text
/**
 * Emit the Rust boilerplate that converts a list-shaped transport slot into a
 * `*_buf: Vec<Renderable>` ready for `ListNonterminalView`.
 *
 * Concrete, supertype, and heterogeneous slots all share one path:
 * `Renderable::Transport(t)` — every concrete transport struct, supertype
 * enum, and `AnyTransport` implements `RenderableTransport`, so Rust
 * auto-coerces `&T` to `&dyn RenderableTransport` and no explicit cast is
 * needed.
 *
 * @param ident - Rust identifier base (e.g. `"children"`, `"parameters"`).
 * @param required - When `true`, the slot is a required Vec; when `false`
 *   it is `Option<Vec<...>>` and needs `as_deref()`.
 * @returns Lines to splice into the parent function body.
 */
```

#### body

```text
// An elidable position (`Vec<Option<T>>`) renders a hole as empty text —
// it still occupies a join position, so `Joined` emits the separators
// around it (`[a, , b]` reproduces its bytes).
```

### `packages/codegen/src/emitters/render-module.ts::buildSeparatorKindMatchLines`

```text
/**
 * Emit `match node.separator_kind { Some(<id>) => "<lit>", ..., _ => <fallback> }`
 * lines resolving a `'list'` node's per-instance nonterminal-separator
 * KindId back to its compile-time-known literal text (design doc's "Render"
 * section: the render side never stores separator text, only resynthesizes it).
 *
 * Candidates come from `collectSeparatorCandidateKindNames` — the SAME walk
 * wrap.ts's `_separator_kind` wire capture uses (kind-discriminant.ts), so the
 * match arms enumerate exactly the kinds a real `_separator_kind` value can
 * hold. For a `STRING` arm, `rule.value` doubles as both the catalog lookup
 * key (an anon token's literal text IS its `symbolName`, per
 * `buildKindIdByKind`) and the literal text to emit — a nonterminal
 * separator's arms are themselves just literals (no real grammar kind has one
 * today; see `emitSeparatedListWrap`'s doc comment, wrap.ts).
 *
 * Returns `undefined` (caller falls back to the plain literal `fallbackSeparator`)
 * when `kindIdByKind` is unavailable (no parser.c-derived numeric dispatch) or
 * none of the candidates resolve to a known id — codegen must still emit a
 * syntactically valid expression in that case.
 */
```

### `packages/codegen/src/emitters/render-module.ts::buildTypedTemplateBody`

```text
/**
 * Build the function body that constructs a template struct from typed
 * transport fields and calls `template.render_into(dest)`.
 *
 * Strategy: for every field and children slot, stream directly via
 * `Renderable::Transport(&node.field)`.  Rust auto-coerces `&T` to
 * `&dyn RenderableTransport` since every concrete transport struct and
 * supertype enum implements the trait.  This avoids the intermediate
 * `String` allocation that the old path incurred
 * (render_* → String → borrow as &str → Renderable::Text).
 *
 * Heterogeneous (Box<AnyTransport>) fields follow the same pattern using
 * `node.field.as_ref()` (Box::as_ref → &dyn RenderableTransport) — unchanged
 * from the previous Task 21 work.
 *
 * The final `template.render_into(dest)` call streams directly into the
 * caller-provided `&mut dyn fmt::Write` — no intermediate `String` allocation.
 *
 * @param struct - the template struct description
 * @param separator - the list/children separator for this kind
 * @param fieldKindsByName - per-field projection kinds (fieldName → kinds[]).
 *   Used to classify each field slot for typed render calls. Falls back to
 *   heterogeneous (Box<AnyTransport>) when a field name is absent.
 * @param fieldMixedByName - set of field names whose slots have mixed named+anonymous
 *   content. When a field is in this set, it is always classified as heterogeneous
 *   regardless of what classifySlotForEmit returns, matching the transport struct
 *   field type emitted by rustTransport (which then chooses per-slot enum
 *   vs Box<AnyTransport> via `hasAnyConcreteChildKind`).
 * @param childrenCls - slot classification for the children slot. Falls back
 *   to heterogeneous when not provided.
 * @param node - the assembled node this struct was built for. Only consulted
 *   for `'list'`-classified nodes, to wire real per-instance
 *   `leading`/`trailing`/`separator` values into list slots' `ListNonterminalView`
 *   instead of the hardcoded `false`/`sepLiteral` every other kind still uses
 *   (see the `f.view === 'list' || f.multiple` branch below).
 * @param kindIdByKind - Map<kind, u16 id>, needed to resolve a nonterminal
 *   separator's candidate arms to their numeric KindId for the `_separator_kind`
 *   match (see `buildSeparatorKindMatchLines`).
 */
```

#### body

```text
// `'boolean'`/`'verbatim'`-classified fields (see `classifyPrimitiveField`
// docstring) get a `bool`/`String` transport struct field
// (`renderTransportField`), not a per-slot enum or `AnyTransport`.
// Precompute once so both the `$text` fast-path "checkable" predicate
// below and the main template-struct loop agree with what the struct
// actually declares.
```

#### body

```text
// `$text` fast-path — match JS render's `nodeHasStructure` short-circuit.
// Shallow validator reads only `$type` + `$text` for nested nodes. With
// per-slot Option<...> fields, those nodes deserialize successfully (no
// throw) but every slot is `None`, so the template renders empty content.
// JS render handles this by short-circuiting to `node.$text` when no slot
// has data; mirror that here so native render produces matching bytes.
//
// Only emit when every slot is "checkable" — Option<T>, Option<Vec<T>>,
// or Vec<T>. A required non-Optional non-Vec slot is always present, so
// the structure check would always be `false` and the fast-path is dead
// code; skip emission in that case.
```

```text
// Vec<T> or Option<Vec<T>> — both checkable.
```

#### body

```text
// `Option<bool>` (boolean-collapsed terminal-only field) is checkable
// via `unwrap_or(false)` negation, same presence semantics as
// `Option<T>::is_none()`.
```

```text
// Option<T> is checkable; required T is not.
```

#### body

```text
// `Option<bool>` field — `None` and `Some(false)` both mean absent.
```

#### body

```text
// Vec<T> — empty when length 0.
```

#### body

```text
// Option<Vec<T>>
```

#### body

```text
// Option<T>
```

#### body

```text
// Classify helper — use classifySlotForEmit when nodeMap is available so
// that supertype/multi single-kind slots fall back to heterogeneous (Phase 1).
// When fieldName is in fieldMixedByName, return heterogeneous with `useBox`
// derived from whether any concrete child kind exists (per-slot enum vs
// Box<AnyTransport> — matches `rustTransportSlotType`'s decision).
```

#### body

```text
// Emit per-slot list buffers. Named and unnamed slots flow through one path
// (cleanup-rules §E1 — no special-case for `children`).
//
// Deduplicate by `storageName`: when an unnamed slot's projection covers
// multiple kinds, the template walker surfaces one template variable per
// kind. emitStruct registers each kind as an alias pointing back to the
// same storage, so several `EmittedField`s share a `storageName`. The
// transport struct has exactly one Vec field per storage — emit the
// `*_buf` once per unique storage to avoid duplicate `let` bindings.
```

#### body

```text
// Emit a Renderable-slice buffer for every slot that becomes a
// ListNonterminalView in the template struct — i.e. view='list' OR
// multiple=true (including the new case where a scalar-view template var
// is backed by a Vec transport field, e.g. `{{ lifetime }}` → Vec<X>).
```

#### body

```text
// Build template struct — all single-value fields use Renderable::Transport.
```

#### body

```text
// Variant detection on typed transport is a known follow-up; default to "".
```

#### body

```text
// `Option<bool>` field — presence (`Some(true)`; `None`/`Some(false)`
// both mean absent) gates the fixed literal text (the same text
// `keywordPresenceValue` stamped on the struct-field decision in
// `renderTransportField`). No transport dispatch needed.
```

#### body

```text
// `String`/`Option<String>` field — wrap sends the raw literal
// text (no kind_id), never a presence bool — mirrors `f.required`
// exactly like any other Option<T>/T field.
```

#### body

```text
// Any slot that becomes a ListNonterminalView in the template struct:
// - view='list' (iterated in template via {% for %} or | join)
// - multiple=true (any view — transport field is Vec<X> or Option<Vec<X>>)
// Vec doesn't implement AsRef<dyn RenderableTransport>, so always use
// the *_buf slice. Empty list when transport-field absent.
// Separator is per-slot (stamped on slot.values during evaluate /
// wrapper-deletion); falls back to the node-wide `separator` parameter
// for slots whose values don't carry one yet (TODO: migrate the
// fallback away once slot value stamping covers all kinds).
```

#### body

```text
// 'list' kinds carry real per-instance leading/trailing/
// separator-kind capture (Task 4's wire fields, mirrored onto this
// struct by renderTransportDataStruct) — resolve them here instead
// of the `false`/literal every other list-shaped slot still uses.
// See docs/superpowers/specs/2026-07-12-separator-as-slot-design.md
// ("Render" section).
```

#### body

```text
// Three-way branch on `DelimiterMode`: `'optional'` reads the
// wire-captured per-instance bitflag; `'mandatory'` is always
// present (hardcoded `true`, no per-instance capture exists — see
// AssembledList's `leadingDelimiter`/`trailingDelimiter`
// doc comment, node-map.ts); `'none'`/`undefined` is always absent
// (`false`). A delimiter-bearing list is always its own
// `'list'`-classified kind (kind-level `_delimiter`), so the kind-level
// read is the only wire read; an inner slot's own delimiter mode
// never carries an 'optional' flank here.
```

#### body

```text
// Required single-value slot (view='scalar' or view='field', non-list).
```

#### body

```text
// Virtual presentation slot — no backing transport field.
```

#### body

```text
// Heterogeneous fallback — type is SlotValue<Box<AnyTransport>>
// (no concrete child kind to ground a per-slot enum). The carrier
// implements RenderableTransport over the boxed inner.
```

#### body

```text
// Concrete / supertype / per-slot enum — Rust auto-coerces &T to
// &dyn RenderableTransport (per-slot enum impls RenderableTransport).
```

#### body

```text
// Optional single-value slot.
```

#### body

```text
// Group-lift inlining: the template emitter inlined a hidden helper
// (e.g. `_const_item_optional1`) and exposed its inner field as this
// surface slot (e.g. `value`). The transport struct carries the helper
// as `Option<HelperTransport>` under the helper's storage name.
//
// The helper template (` = {{ value }}`) is inlined into the PARENT
// template as `{% if value | isPresent %} = {{ value }}{% endif %}`.
// The `{{ value }}` slot in the parent MUST resolve to the INNER
// expression (e.g. `v.value`) — not the whole helper struct. Binding
// the whole helper struct would double-render the separator literal
// (` =  = expr` instead of ` = expr`).
//
// Two read paths exist:
//  1. Factory path: the JS factory writes `_const_item_optional1: { _value: ... }`.
//     The napi object has the helper object nested. Use node.<helper>.<inner>.
//  2. CST path: the native CST reader writes `_value: "5"` directly at the
//     parent level (tree-sitter places the field on the parent node, not the helper).
//     The transport struct has a direct `value` field for this path.
//
// When `backingDirectField` is set, the struct has both the helper field AND a
// direct inner field. Try the direct field first (CST path), fall back to the
// helper (factory path).
```

#### body

```text
// Dual-path: try direct field (CST read) then helper (factory).
```

#### body

```text
// `.node()` on the helper's carrier: reaching the inner field
// needs the helper's own storage. A hidden inlined helper has
// no CST node of its own, so it never arrives as an unexpanded
// stub — only the factory path populates it, always in full.
```

#### body

```text
// Inner field is required inside the helper.
```

#### body

```text
// Inner field is Option<T> inside the helper; both paths unwrap.
```

#### body

```text
// Inner field is a direct (required) transport — reference directly.
```

#### body

```text
// Inner field is itself Option<T> — flatten with a nested match.
```

#### body

```text
// Heterogeneous fallback — type is Option<SlotValue<Box<AnyTransport>>>.
```

#### body

```text
// Concrete / supertype / per-slot enum — Rust auto-coerces &T.
```

### `packages/codegen/src/emitters/render-module.ts::emitHashFiles`

```text
/**
 * Emit `hash.rs` + `hash.ts` for a single grammar (T016/T017 surface).
 * Kept as the historic low-dep entry point — the richer `emitRenderModule`
 * (T027+) subsumes it but we keep this exported so the existing unit
 * tests and intermediate CLI paths stay green.
 */
```

```text
// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------
```

### `packages/codegen/src/emitters/render-module.ts::emitRenderModule`

```text
/**
 * Emit the full render module for a grammar — hash files, per-kind
 * template structs, direct-render helpers, lib.rs,
 * Cargo.toml.
 *
 * @param lang — grammar identifier.
 * @param files — the grammar's `.jinja` bundle (filename → body).
 *   Used for the hash input AND for per-kind struct-field derivation.
 * @param nodeMap — the assembled node map, source of direct-render
 *   metadata tables and typeName lookups.
 * @param generatedIdTables — optional numeric KindID tables (T021+).
 * @returns paired file contents. The CLI writes them + handles the
 *   `.jinja` directory copy separately (T030).
 */
```

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
// --- templates.rs ---
// Per-kind Template structs. The `filters` module must live here because
// Askama resolves custom filters by searching for a sibling `filters`
// module at the `#[derive(Template)]` site.
```

#### body

```text
// --- transport.rs ---
// AnyTransport enum + FromNapiValue + per-kind transport structs +
// typed dispatch + transport bridge helpers.
```

### `packages/codegen/src/emitters/render-module.ts::pruneUnreferencedBridges`

```text
/**
 * reachability gate: drop any `*_transport_to_any` bridge fn that nothing in
 * the assembled transport.rs references. The file-top `#![allow(dead_code)]`
 * means rustc will never flag an unreferenced bridge, so without this prune
 * a dead bridge survives silently (exactly how the deleted
 * transport→NodeData island hid). Reachability is computed against the FINAL
 * assembled text — by construction, every emitted bridge has a live caller.
 */
```

```text
// swallow the trailing blank line
```

### `packages/codegen/src/emitters/render-module.ts::commonRustUseImports`

```text
/**
 * Common Rust `use` imports shared across templates.rs, bridge.rs, dispatch.rs,
 * and transport.rs. Each file gets the full set — Rust's module system deduplicates
 * and the `#![allow(unused_imports)]` suppresses warnings for imports not needed
 * in a particular file.
 */
```

### `packages/codegen/src/emitters/render-module.ts::filtersModule`

```text
/**
 * The Askama `filters` module — must live in the same module as `#[derive(Template)]`
 * structs so Askama's derive macro can resolve custom filter names at build time.
 */
```

### `packages/codegen/src/emitters/render-module.ts::collectUsedSupertypeNames`

```text
/**
 * Collect the set of supertype `typeName`s that are actually used as
 * field or children slot types across all assembled nodes. Only these
 * supertypes need per-supertype transport enum emission.
 *
 * @param nodes - assembled nodes (transport projection)
 * @param nodeMap - for classification
 */
```

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

### `packages/codegen/src/emitters/render-module.ts::renderAnyTransportWithStringTag`

```text
/**
 * Emit `AnyTransport` with the string-tagged `#[serde(tag = "$type")]` derive.
 * Fallback path when `generatedIdTables` is unavailable (no parser.c).
 */
```

### `packages/codegen/src/emitters/render-module.ts::nodeTransportHasRequiredField`

```text
/**
 * Returns true when a node's emitted `FromNapiValue` will NOT silently match
 * any bare JS string by coercing it to an object. Used to sort string-fallback
 * dispatch arms so "greedy" all-optional structs come LAST.
 *
 * Two categories return true (i.e. are safe to try first):
 *
 * 1. Leaf nodes (`pattern` / `keyword` / `token` / `enum`): use
 *    `renderLeafTransportNapiImpls` which reads `text` directly from the JS
 *    string value — they correctly decode a bare string and produce a
 *    non-empty `text` field.
 *
 * 2. Branch / group / polymorph nodes with at least one required (non-Option)
 *    grammar field: `#[napi(object)]`-derived `FromNapiValue` coerces the JS
 *    string to a boxed String object via `napi_coerce_to_object`; all property
 *    lookups return `undefined`. A required field (`String`, not `Option<String>`)
 *    cannot be `undefined` → deserialization fails → the arm is correctly skipped.
 *
 * All-optional branch/group/polymorph nodes are the "greedy" case: every field
 * becomes `None` when coerced from a string, so `FromNapiValue` silently
 * succeeds regardless of the input — these must come LAST.
 */
```

```text
/**
 * Emit a per-supertype transport enum, its `Debug + Clone` body,
 * a custom `FromNapiValue` impl that reads `$type` as u16 and dispatches
 * to the appropriate concrete variant, a stub `ToNapiValue`, and a
 * `<supertype>_transport_to_any` bridge helper (per-slot enum → AnyTransport).
 *
 * Pattern mirrors `renderAnyTransportWithNapiFromValue` — variant arms come
 * from `supertypeNode.subtypes` resolved through `kindIdByKind`.
 * DRY: same `kindEntries` source as `AnyTransport` dispatch.
 *
 * `Box<T>` is used for non-leaf subtypes inside the enum variants to break
 * potential size-cycle recursion (e.g. `ExpressionTransport::BinaryExpression`
 * contains `ExpressionTransport` fields). Leaf/keyword/token/enum subtypes
 * are small (text only) and inlined without `Box`.
 *
 * When `kindEntries` is absent (no parser.c), emit a stub enum with a
 * string-tagged fallback so fields referencing the enum type still compile.
 *
 * @param supertypeNode - the assembled supertype node
 * @param kindIdByKind  - Map<kind, u16 id> from `buildKindIdByKind(kindEntries)`;
 *   `undefined` when parser.c is unavailable (fallback path)
 * @param nodeMap       - for typeName + modelType lookups
 */
```

#### body

```text
// Leaf types use renderLeafTransportNapiImpls — always safe on bare strings.
```

#### body

```text
// For structural nodes (branch / group / polymorph): safe if any grammar
// slot is required (non-optional). All-optional nodes are the greedy ones.
```

### `packages/codegen/src/emitters/render-module.ts::isLeafLikeNode`

```text
/**
 * SCC-driven Box decision for a per-slot or supertype enum variant.
 *
 * The eventual rule is: Box variant `V` (a kind name) in enum `E`
 * (owned by `enumOwnerKind`) iff `V` is not leaf-like AND `V` and
 * `enumOwnerKind` are in the same SCC of the singular transport-
 * reference graph. The `computeTransportSCC` pass populates
 * `nodeMap.scc` with the analysis; consumers call `scc.sameSCC(...)`.
 *
 * **Live status (sittir-12):** the SCC analysis IS computed end-to-end
 * and exposed via `nodeMap.scc`, but `boxedInEnum` still falls back to
 * the conservative `Box-all-non-leaf` rule. Enabling SCC-based unboxing
 * for rust deep read-render-parse used to trigger a V8 stack overflow
 * inside napi-rs's `String::from_napi_value` error path (it
 * JSON.stringify's the deeply-nested object for diagnostic context).
 * That error path is no longer reachable: every hand-emitted
 * `FromNapiValue` impl now dispatches on `napi_typeof` first (see
 * `renderTransportValueTypeHelper`), so no typed read is ever attempted
 * on a mismatched shape. Flipping the SCC predicate can be retried.
 */
```

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

### `packages/codegen/src/emitters/render-module.ts::emitTransportEnumFromNapiValueBody`

```text
/**
 * Emit the `from_napi_value` body shared by supertype and per-slot transport
 * enums: strict three-shape dispatch on `napi_typeof` (raw u16 kind_id /
 * bare string → Verbatim / object with numeric `$type`).
 *
 * The typeof dispatch (see `renderTransportValueTypeHelper`) replaces the
 * earlier sequential probing, which crashed on deep recursive inputs. It
 * also keeps bare-string semantics exact: `Object::from_napi_value`
 * SUCCEEDS on a JS string (property access auto-boxes primitives), so any
 * ordering that probes Object before String would swallow bare strings
 * into a "$type property missing" error instead of the Verbatim arm.
 *
 * @param enumName - Rust enum name, e.g. `PatternTransport`.
 * @param kindIdArms - shared `match kind_id` arms (must end with a
 *   catch-all `other =>` arm so the match is exhaustive over u16).
 * @param admitsVerbatim - whether the enum has a `Verbatim` variant; gates
 *   the bare-string arm (bare strings carry no kind tag).
 */
```

#### body

```text
// (a) Raw u16 input: kind_id sent directly (value-less kinds).
```

#### body

```text
// (b) Object with numeric $type: strict kind_id dispatch. A bare string
//     carries no kind tag and is not this enum's to hold — the slot's
//     `SlotValue` carrier takes it as verbatim text instead.
```

### `packages/codegen/src/emitters/render-module.ts::emitAliasUnwrapRecurseArm`

```text
/**
 * Emit one `match` arm that unwraps an alias-mint wrapper node and
 * re-dispatches `Self::from_napi_value` on its single kind-keyed child.
 *
 * A mint arm (`alias($._hidden_rule, $.visible_name)`) makes an otherwise-
 * inlined hidden rule VISIBLE at one specific reference site, so runtime
 * nodes arrive under the alias occurrence's own id (`alias_sym_*`) rather
 * than any of the concrete kinds the hidden rule resolves to. The
 * grammar-agnostic reader stores such a node's single unlabeled child under
 * a kind-keyed slot (`{ $type: <aliasId>, _<childKind>: <child> }` —
 * read_node.rs kind-named-slot routing), so no variant struct can decode the
 * wrapper directly (decode trials would probe the wrong object). This arm
 * unwraps the kind-keyed slot and re-dispatches `Self` on the concrete
 * child, which carries its own `$type`.
 *
 * Shared by `emitSupertypeTransportEnum` (cross-supertype self-alias ids)
 * and `emitPerSlotChildEnum` (per-slot alias-canonicalized wrapper ids,
 * e.g. python's `_case_pattern_group1` / id 293) — same wrapper shape,
 * same unwrap, only the enclosing enum's name and error text differ.
 *
 * @param aliasId - the wrapper's own kind_id (the alias occurrence's `alias_sym_*`).
 * @param enumName - the enclosing enum's Rust name (for the error message only).
 * @param errorLabel - short label distinguishing the caller's alias-id class
 *   in the error text (e.g. `'self-alias'`, `'alias-wrapper'`).
 */
```

#### body

```text
// Leaf-collapsed alias occurrences ({$type: <aliasId>, $text} — the
// reader scalar-collapses leaf content, so there is NO kind-keyed child
// to unwrap) dispatch the SAME object through the alias expansion's own
// leaf variants. Text-validated enum variants must come first in this
// list; a mis-typed leaf dispatch is benign for RENDER (a leaf renders
// its own $text either way), but the enum's membership check is exact.
```

### `packages/codegen/src/emitters/render-module.ts::emitSupertypeRenderHelper`

```text
/**
 * Emit `render_<supertype>(t: &<Supertype>Transport, dest: &mut dyn fmt::Write) -> Result<(), ::askama::Error>`
 * as a bounded match over the enum variants.
 *
 * Each arm delegates to the concrete kind's render fn through the parent
 * typed helper. Arm count is bounded by the supertype's subtype
 * count (~5–40), not the full grammar (~1040 for rust).
 *
 * @param supertypeNode - the assembled supertype node
 * @param nodeMap       - for typeName + modelType lookups
 */
```

#### body

```text
// Boxed (in-cycle) variants need `.as_ref()` to reach the inner struct;
// inline variants reference the inner value directly. Route through
// render_into (not the per-kind render fn directly) so the concrete
// subtype's own render_with_trivia!-wrapped impl fires.
```

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

```text
/**
 * Collect all nodes whose `structuralChildren` classify as `heterogeneous`
 * (multiple distinct kinds, no grammar supertype covering them) — these need
 * a `{TypeName}ChildTransportSlot` per-slot enum emitted before the struct.
 *
 * Polymorph forms are also covered: each form that has heterogeneous children
 * contributes its own entry (keyed by `formTypeName` so the enum name is
 * distinct from the parent struct).
 *
 * Per cleanup-rules §E1, named heterogeneous fields ALSO get per-slot enums
 * (`{TypeName}{FieldName}TransportSlot`). Under option (c) of the task, the
 * enum is emitted alongside the existing `Box<AnyTransport>` field type so
 * the enum is available for future use without changing field types yet.
 *
 * @param nodes   - assembled nodes from the transport projection
 * @param nodeMap - for classification
 */
```

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
// there via `resolveHiddenKeywordLiteral`; re-deriving kinds/literals
// from `kindsOf`+`isTerminalValue` here missed that collapse, so a
// hidden-keyword arm got treated as a "real" child needing its own
// boxed struct variant instead of joining the slot's other literal(s)
// — the exact gap `member_expression`'s unified `separator` field hit.
```

#### body

```text
// Mixed-content override: a slot with named kinds AND anonymous literal
// content is heterogeneous regardless of classifier.
```

#### body

```text
// Symmetric — named and unnamed slots both flow through `consider`.
```

### `packages/codegen/src/emitters/render-module.ts::emitPerSlotChildEnum`

```text
/**
 * Emit a `{TypeName}ChildTransportSlot` per-slot children enum for a heterogeneous
 * children slot. The enum has one variant per concrete child kind; each variant
 * wraps the concrete transport struct (boxed for non-leaf kinds).
 *
 * Mirrors `emitSupertypeTransportEnum` but is derived from the specific child
 * kinds in a slot rather than grammar supertype membership.
 *
 * @param entry - the per-slot enum descriptor (typeName + child kinds)
 * @param kindIdByKind - map from kind to numeric parser symbol id (for FromNapiValue)
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
// SCC-driven Box rule for this per-slot enum's variants. The owner kind
// is the parent node that hosts the slot; a variant is boxed iff it and
// the owner share an SCC in the singular-reference graph. Leaf-like
// variants always stay inline (see `boxedInEnum`).
```

#### body

```text
// Spec 024 cleanup-§E1: named-slot enums are load-bearing alongside unnamed
// `$children` enums — `rustTransportSlotType` returns the per-slot enum name
// for any heterogeneous slot with at least one concrete child kind. No
// `#[allow(dead_code)]` needed; both the enum and its `_transport_slot_to_any`
// bridge fn are referenced (struct field type + bridge expression).
```

#### body

```text
// Build the kind_id match arms shared between the raw-u16 input shape
// and the object-with-$type input shape. Each accepted kind_id maps
// to a typed variant — pattern/keyword/token/enum inline, branch/
// group/polymorph boxed.
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
// Alias-canonicalized wrapper ids (narrow scope): one of this slot's
// raw storage kinds (`entry.kinds`, pre-expansion) is a hidden
// supertype that got flattened into `validKinds` above (per
// `expandConcreteTransportKinds` — every supertype-modelType kind has
// `concreteTransportTypeName === null`, so it's never its own
// variant). When a value at this reference site was ALSO wrapped by
// an enrich-minted `alias($._hidden_supertype, $.visible_name)` (the
// `parseAliases` fact — `aliasTargetToSourceMapOf`, node-map.ts), the
// alias occurrence's own wire id (e.g. python's
// `_case_pattern_group1` / id 293, wrapping a matched
// `union_pattern`) has no variant to land on directly — it must
// unwrap its single kind-keyed child and re-dispatch, same as a
// supertype's cross-supertype self-alias id. Scoped tightly to
// exactly this shape (flattened-supertype storage target already
// covered by this same enum); NOT a general alias-name fallback.
// The storage target may sit ANYWHERE in the slot's supertype closure,
// not only in the raw kind list — typescript's `_property_name` slot
// reaches `_property_identifier` one supertype deeper, and the alias
// occurrence's wire id (`alias_sym_property_identifier`) still needs
// an arm here. The closure's own `subtypeParseNames` facts (the
// per-subtype alias names link stamped on each supertype) join the
// grammar-wide parseAliases map — that is where a NESTED supertype's
// alias spelling lives.
```

#### body

```text
// Leaf trials: the alias storage's own concrete expansion, restricted
// to leaf variants THIS enum carries (see emitAliasUnwrapRecurseArm).
```

#### body

```text
// Box<EnumName> napi-trait impls. See note on `renderBoxedEnumNapiImpls`.
```

#### body

```text
// Bridge helper: converts per-slot enum → AnyTransport for the NodeData bridge
// (used by the typed render dispatch). AnyTransport is a sized enum — no Box
// needed. Both named-slot and unnamed `$children` bridge fns are load-bearing
// after that change (named field type became the per-slot enum, so the bridge MUST
// convert via this fn instead of derefing a `Box<AnyTransport>`). Every per-slot
// enum has a corresponding bridge fn keyed by typeName + slot name.
```

#### body

```text
// RenderableTransport impl — match on variant and route through render_into
// (not the per-kind render fn directly) so the concrete variant's own
// render_with_trivia!-wrapped impl fires.
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
// A literal arm for an immediate token writes seam-free — grammar
// forbids whitespace before it (see `mark_adjacent`). Inline
// terminals carry the stamp on the literal itself (no kind of
// their own to look up); kind-named literals resolve it through
// their kind.
```

### `packages/codegen/src/emitters/render-module.ts::renderAnyTransportWithNapiFromValue`

```text
/**
 * Emit `AnyTransport` with a custom `FromNapiValue` impl that reads `$type`
 * as a numeric `u16` KindId directly from the JS object properties (no serde,
 * no JSON intermediate). Phase B of the KindID runtime migration.
 *
 * Per the spec: the `AnyTransport` enum body itself has no serde derives —
 * only `Debug + Clone`. The custom `FromNapiValue` impl reads `$type` as `u16`
 * and dispatches to the per-kind struct's `FromNapiValue` (generated by
 * `#[napi(object)]`). Literal variants are unit variants — JS sends only `$type`
 * and no payload; the static text is embedded in the Rust dispatch arms.
 *
 * Unknown kind IDs produce a napi error with the numeric ID in the message
 * so that diagnostics can surface useful context.
 *
 * DRY constraint: the match arms come from the same `kindEntries` list that
 * `emitKindIdRust` uses for `kind_ids.rs` constants — both consumers read
 * from the same source so dispatch and constants stay in sync.
 *
 * @param nodes — assembled nodes that appear in the transport projection
 * @param literals — literal (terminal text-only) transport kinds
 * @param nodeMap — for `kindIdMemberName` lookups (typeName derivation)
 * @param kindEntries — entries from the symbol catalog; used for ID→variant dispatch
 */
```

#### body

```text
// Node-arm id index — the shared `buildKindIdByKind` construction (DRY:
// this was previously an inline duplicate of that helper). Literal arms
// do NOT resolve through this map — see the literal-first note below.
```

#### body

```text
// Enum declaration — no serde Deserialize; napi FromNapiValue added below.
```

#### body

```text
// Custom FromNapiValue impl — reads $type as u16 from the JS object,
// then dispatches to the per-kind struct's FromNapiValue. This eliminates
// the serde/JSON intermediate entirely. Gated behind napi-bindings feature
// so templates.rs compiles without the napi/napi-derive crates available.
```

#### body

```text
// One match arm per node — each arm delegates to the per-kind struct's
// FromNapiValue (generated by #[napi(object)]) over the same napi_val.
// T016: Deduplicate match arms — alias-collapsed kinds that share the same
// KindId emit only the first arm. The second would be unreachable.
```

```text
// no parser symbol — skip
```

```text
// skip duplicate KindId
```

#### body

```text
// One match arm per literal kind — unit variants, no payload.
// The literal text is a compile-time constant; JS does not need to send it.
// Use the same emittedNodeIds set to skip KindIds already claimed by node arms.
// Id resolution is `resolveLiteralKindId` — text-first for bare terminals
// (a literal whose text equals a NAMED rule's name, e.g. python's `'type'`,
// must resolve through the anon-token catalog row, not the rule's own id),
// kind-name-first for hidden-keyword/token/pattern collapses (whose
// `.kind` uniquely identifies one row; TEXT does not when two such kinds
// render identical text).
```

#### body

```text
// AnyTransport is kind_id-only: it admits the universe of typed nodes, so
// no bare-string fast-path can pick the "right" variant. A value with no
// kind_id belongs to the enclosing `SlotValue` carrier as verbatim text;
// by the time we reach AnyTransport, a missing kind_id is a real error.
```

#### body

```text
// Stub ToNapiValue for AnyTransport — transport is receive-only (JS→Rust);
// ToNapiValue is required by #[napi(object)] field bounds on containing structs
// but is never called at runtime. Returns JS null as a safe placeholder.
```

#### body

```text
// Box<AnyTransport>: FromNapiValue + ToNapiValue — required because
// #[napi(object)] per-kind transport structs have Box<AnyTransport> fields
// for single-value heterogeneous slots (Box breaks recursive size cycles).
// napi-rs does not provide a blanket impl for Box<T>.
```

### `packages/codegen/src/emitters/render-module.ts::renderGrammarRenderable`

```text
/**
 * Per-grammar `Renderable` extension enum. Closed family: `Text` for
 * already-final render-ready strings, `Joined` for streaming join wrappers.
 * Display + FastWritable dispatch on the variant.
 *
 * The `Node` variant (previously present) is removed in Phase 2: per-template
 * render functions call typed helpers directly and produce `String` values,
 * which they wrap as `Renderable::Text`. No render fn creates `Renderable::Node`.
 */
```

```text
// keep FQ — inside local enum, not in scope
```

### `packages/codegen/src/emitters/render-module.ts::renderLiteralTransportStruct`

```text
/**
 * Previously emitted a `pub struct LiteralTransport { text: String, ... }` napi
 * object so JS could send the literal text across the FFI boundary. Now that
 * `AnyTransport` literal variants are unit variants (no payload), the struct is
 * no longer needed and this function returns an empty array.
 *
 * The static text for each literal is embedded directly in the
 * `render_transport_dispatch` match arms.
 */
```

### `packages/codegen/src/emitters/render-module.ts::emitTriviaKindIdArm`

```text
/**
 * Build one `TriviaTransport::from_napi_value` kind-id match arm: try the
 * entry's own typed transport struct first, falling back to a verbatim
 * `$text` extraction on decode failure — the expected outcome for a
 * read-side extras stub, whose raw/unwrapped keys the typed struct's
 * `#[napi(object)]`-derived `FromNapiValue` cannot deserialize. `napi_val`
 * may also be a bare number in the raw-kind_id dispatch path (no `$text`
 * available there); the `Object::from_napi_value` attempt then fails
 * harmlessly and `text` stays empty, which cannot occur for a real extras
 * node (comments always carry `$text`).
 *
 * @param id — the node's numeric parser kind id
 * @param variant — the `TriviaTransport` variant name for this node
 * @param structName — the node's typed transport struct name
 */
```

### `packages/codegen/src/emitters/render-module.ts::renderTriviaTransportSupport`

```text
/**
 * `TriviaTransport` — one variant per grammar-`extras` kind (comments, line
 * continuations, …), sourced from `nodeMap.extras` (stamped from
 * `RawGrammar.extras`, DRY: never a hand-maintained kind list here), plus a
 * `Verbatim(VerbatimTransport)` fallback shared with every other transport
 * enum's bare-string/decode-failure path.
 *
 * Typed variants are needed because a factory-constructed trivia node (e.g.
 * `F.buildLineComment(...)`) carries the SAME wrapped wire shape as any other
 * node (`_content`, `$type`, …) and must render through its own template —
 * a text-only trivia carrier would silently drop that structure. The
 * `Verbatim` fallback exists because a READ-side extras stub (produced by
 * `read_node.rs`'s trivia routing) carries raw/unwrapped keys the typed
 * struct's `#[napi(object)]`-derived `FromNapiValue` cannot deserialize —
 * decode failure there is expected, not a bug, so it falls back to the
 * verbatim source text instead of erroring.
 *
 * `TransportTrivia` (leading/trailing `Vec<TriviaTransport>`) replaces the
 * old grammar-agnostic `sittir_core::types::TransportTrivia`, which could
 * only carry pre-rendered text and silently dropped factory-constructed
 * trivia at render time.
 */
```

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

### `packages/codegen/src/emitters/render-module.ts::declareLeafTriviaCapture`

```text
/**
 * Declares and initializes the release-mode leaf `__trivia` capture local.
 * A leaf sent as a bare string/number/boolean carries no metadata object to
 * read trivia from, so `__trivia` only gets populated in the object fallback
 * branch (a factory-attached comment on a leaf node always arrives as an
 * object — `$trivia()` forces the trivia-bearing owner off the bare-
 * primitive fast path).
 */
```

### `packages/codegen/src/emitters/render-module.ts::renderLeafTransportNapiImpls`

```text
/**
 * Emit manual napi `FromNapiValue` + `ToNapiValue` impls for a leaf
 * transport struct. Two cfg-gated `FromNapiValue` variants are emitted:
 *
 * - `#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]`
 *   reads the napi value as a plain JS string and constructs the struct
 *   with only `text` populated (metadata fields are `None` / default).
 *   JS callers in release mode send a bare string for leaf fields.
 *
 * - `#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]`
 *   reads the napi value as a JS object and extracts the full set of
 *   metadata fields (`$text`, `$source`, `$named`, `$span`, `$nodeId`).
 *   JS callers in debug mode send the complete transport object.
 *
 * `ToNapiValue` is a no-op stub in both modes. Transport is receive-only
 * (JS→Rust); the stub satisfies `#[napi(object)]` field bounds on parent
 * branch structs that embed these leaf types.
 *
 * @param structName - Rust struct name, e.g. `IdentifierTransport`.
 * @param named - Whether this leaf node is named in tree-sitter. Tokens are always
 *   anonymous (`false`); patterns and keywords are always named (`true`). Used to
 *   hardcode `transport_named` in non-debug mode so the children filter
 *   `.filter(|t| t.transport_named().unwrap_or(true))` works correctly without
 *   needing to read `$named` from the JS object.
 */
```

#### body

```text
// Release mode: read plain JS string — no metadata round-trip.
// transport_named is hardcoded (not read from JS) because named/anonymous
// is a grammar-level fact that never changes at runtime.
```

#### body

```text
// typeof dispatch — never probe String::from_napi_value on a non-string
// (its failure path JSON.stringify's Object inputs; see sittir_core::slot::transport_value_type).
```

#### body

```text
// Debug mode: read full metadata object — same shape as #[napi(object)] would derive.
```

#### body

```text
// ToNapiValue stub — transport is JS→Rust only; this impl satisfies the
// trait bound required by #[napi(object)] on parent branch structs whose
// fields embed this leaf transport type.
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportMetadataFields`

```text
/**
 * Emit struct field declarations with `#[cfg_attr(feature = "napi-bindings", napi(js_name = "..."))]`
 * attributes for branch/group/polymorph transport structs that carry
 * `#[napi(object)]` on the struct.
 *
 * @param includeText - true for branch structs (adds `transport_text`).
 */
```

#### body

```text
// source, named — always first
```

#### body

```text
// remaining fields: span, nodeHandle, childIndex, triviaData
```

### `packages/codegen/src/emitters/render-module.ts::renderLeafTransportPlainFields`

```text
/**
 * Plain struct fields for leaf/keyword/token transport structs. Unlike
 * branch structs, these do not carry `#[napi(object)]` on the struct itself,
 * so individual field `cfg_attr(napi(...))` attributes would have no proc-macro
 * to consume them and could confuse napi-derive. Plain field declarations are
 * used instead; `FromNapiValue` is emitted manually below the struct definition
 * (via `renderLeafTransportNapiImpls`), reading the JS property names with the
 * `$`-prefixed keys explicitly.
 */
```

### `packages/codegen/src/emitters/render-module.ts::rustTransportSlotType`

```text
/**
 * Unified emitter for the Rust type of a transport slot.
 *
 * Per cleanup-rules §E1 ("no special treatment for unnamed vs named slots"),
 * every slot (named or kind-derived) emits the same per-slot typed enum
 * shape — `{TypeName}{FieldName}TransportSlot` for heterogeneous slots.
 *
 *   - `concrete`      → `T` / `Vec<T>` / `Option<T>` / `Option<Vec<T>>`
 *   - `supertype`     → `T` / `Vec<T>` / `Option<T>` / `Option<Vec<T>>`
 *   - `heterogeneous` → per-slot enum (or `Box<AnyTransport>` fallback when
 *     no concrete child kind exists)
 *
 * @param slotKinds   - Named child kinds for this slot (terminals excluded; see
 *   `kindsOf`).
 * @param nodeMap     - For classification + concrete transport name lookup.
 * @param cardinality - Slot cardinality (required / multiple).
 * @param typeName    - Parent node's PascalCase typeName (per-slot enum name
 *   prefix).
 * @param fieldName   - The slot's name (per-slot enum name suffix source).
 * @param literalTexts - Anonymous literal terminal values appearing in this
 *   slot. A slot with BOTH named kinds AND literal terminals is forced
 *   heterogeneous (mixed-content override).
 */
```

#### body

```text
// Mixed-content override: a field with named kinds AND anonymous literal
// content is heterogeneous regardless of classifier (e.g. `function_modifiers.modifier`
// which accepts `extern_modifier` OR bare keywords like `async`/`const`/`unsafe`).
// `kindsOf()` intentionally skips TerminalValue entries, so without this
// check the slot would be misclassified as `concrete`.
```

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

### `packages/codegen/src/emitters/render-module.ts::renderBoxedEnumNapiImpls`

```text
/**
 * Emit `FromNapiValue` / `ToNapiValue` impls for `Box<EnumName>`. napi-rs's
 * derive does not auto-generate Box-wrapping impls for custom enums, but
 * `Box-at-back-edge` slot typing makes `Box<EnumName>` show up as a field
 * type wherever an enum-typed slot closes a singular size cycle. Without
 * these impls the generated transport structs (which derive `#[napi(object)]`)
 * fail to compile with "trait FromNapiValue is not implemented for Box<…>".
 *
 * Pattern mirrors the existing `Box<AnyTransport>` impls.
 */
```

### `packages/codegen/src/emitters/render-module.ts::concreteTransportTypeName`

```text
/**
 * Rust type name for a concrete transport struct given a grammar kind.
 * Returns `null` when the kind maps to a supertype or multi node — those are
 * NOT emitted as transport structs/enums in Phase 1 (Phase 2 will add them).
 * The caller must fall back to `Box<AnyTransport>` on `null`.
 *
 * @param kind - Grammar kind string (e.g. `"identifier"`, `"_expression"`).
 * @param nodeMap - For typeName + modelType lookup.
 */
```

#### body

```text
// Supertype and multi nodes are not emitted as transport structs.
```

#### body

```text
// Unknown kind — conservative fallback.
```

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

### `packages/codegen/src/emitters/render-module.ts::renderEnumType`

```text
/**
 * Emit a Rust enum type for an `AssembledEnum` node (synthesized field-enum
 * or pre-existing grammar enum). Replaces the `text: String` leaf-struct path
 * with a closed, statically-known variant set.
 * Emits for multi-member enums:
 * - `#[derive(Debug, Clone, Copy)] pub enum XxxEnum { ... }`
 * - `impl FromNapiValue` — reads a plain `u16` KindId (no heap allocation)
 *   and dispatches to the correct variant via a match on numeric IDs.
 *   Falls back to `$text: String` matching when `kindEntries` is absent.
 * - `impl RenderableTransport` — writes the static literal text per variant
 * - `impl Display` — writes the static literal text per variant
 *
 * @param node - the AssembledEnum node
 * @param hasNapi - whether napi-bindings feature is present (from generatedIdTables)
 * @param kindEntries - catalog entries for KindId lookup; when present, emits
 *   numeric `u16` dispatch in `FromNapiValue` instead of `$text: String` matching
 */
```

#### body

```text
// --- Rust enum declaration ---
```

#### body

```text
// --- impl FromNapiValue ---
```

#### body

```text
// Enum-valued fields cross the native boundary as NodeData-shaped objects.
// Some grammars send the resolved leaf kind in `$type` (primitive_type),
// while others keep the parent enum kind and expose the chosen literal
// under `$text` or `_<literal>` child fields (fragment_specifier).
// typeof dispatch — never probe a typed read on a mismatched shape
// (String::from_napi_value's failure path JSON.stringify's Object
// inputs; see sittir_core::slot::transport_value_type).
```

#### body

```text
// `values` are LITERAL member texts — read the node's
// construction-time literal-chain resolution
// (anon-scoped first so a same-spelled named rule
// can't shadow, #129).
```

#### body

```text
// Fallback: kindEntries unavailable (parser.c not found) — read $text string.
```

#### body

```text
// Stub ToNapiValue — enum is receive-only (JS → Rust).
```

#### body

```text
// --- impl Display ---
```

#### body

```text
// --- impl RenderableTransport ---
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

### `packages/codegen/src/emitters/shared.ts::canonicalSeparatedListField`

```text
/**
 * An `AssembledList`'s single-field-storage canonical slot — the `node.slots`
 * entry whose storage key wrap.ts/render-module.ts's transport-struct
 * emission actually use for the "whole element union" bucket (Bug B fix,
 * wrap.ts's `emitSeparatedListWrap`). Prefers the `arity === 'many'` field
 * (the real repeated-content slot) and falls back to the first field for
 * kinds with no such slot.
 *
 * SHARED across wrap.ts, factories.ts, from.ts, and test.ts so all four
 * emitters agree on the same canonical storage key a `'list'`-classified
 * kind's elements are read from / written to on the wire — see wrap.ts's
 * `emitSeparatedListWrap` doc comment ("Bug B fix") for the full rationale.
 * Multi-field kinds (`node.slots.length > 1`) must NOT use this helper for
 * storage — they route each field through `emitFieldStorageLines`/
 * `emitFieldAccessorLines` instead (see callers).
 */
```

### `packages/codegen/src/emitters/shared.ts::collectAliasSourceKinds`

```text
/**
 * Collect hidden source kinds (leading `_`) referenced via any field
 * / child value slot across the node map. These are the kinds whose
 * factory stamps `$type: '_X'` at construction — emission paths
 * (factories, templates, types) must include them even though they're
 * hidden.
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
 * `$fields` block of the concrete TypeScript interface so NodeData output
 * shape is unchanged and round-trips with readNode remain identical.
 */
```

### `packages/codegen/src/emitters/shared.ts::resolveHiddenKeywordLiteral`

```text
/**
 * Return the literal string that a hidden single-literal keyword kind
 * produces, or `undefined` if the kind is not a hidden single-literal
 * keyword.
 *
 * @remarks
 * Hidden `_kw_<name>` rules are an implementation detail for preserving
 * FIELD wrappers around bare string tokens (tree-sitter strips FIELD
 * around anonymous STRING; routing through a SYMBOL preserves it).
 * Consumers don't care that a hidden helper rule exists — the surface
 * type should be the literal string the keyword produces. This helper
 * lets type / factory emitters inline `"&"` / `"async"` / etc. in
 * field type expressions and fluent setter signatures instead of
 * surfacing a `KwLifetime` / `KwAsync` wrapper type.
 *
 * A kind qualifies when:
 *   - The kind name starts with `_` (hidden-rule marker).
 *   - The resolved node is an {@link AssembledKeyword} — its rule body
 *     is a single `StringRule`.
 *
 * @param kindName - The kind to probe.
 * @param nodeMap - Assembled node map (needed to resolve `kindName`
 *   to its `AssembledNode` and check for a keyword shape).
 * @returns The keyword's literal text, or `undefined`.
 */
```

### `packages/codegen/src/emitters/shared.ts::isHiddenInfraSlot`

```text
/**
 * Returns `true` when every kind a slot resolves to is hidden (`_`-prefixed).
 * Such fields represent parser-inserted infrastructure (e.g. `_semicolon` →
 * `_automatic_semicolon`) that shouldn't be exposed as a required user-facing
 * factory parameter.
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
 * - **Referenced keyword** (hidden AssembledKeyword NodeRef): NodeData object literal
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
 *              literal that resolved to a kind. The text is carried for
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
/** Projects a storage stamp onto the {@link TypeComponent} shape the
 *  component consumers expect. A `kindId` value becomes a literal
 *  component with its kind as `rawKind` and its wire id — whether the
 *  grammar wrote it as a reference or an inline terminal — so the
 *  transport and render walkers key every kind-bearing literal by kind;
 *  a genuinely anonymous literal has no `rawKind` and is keyed by its
 *  text. `immediate` passes through from the stamp. */
```

### `packages/codegen/src/emitters/shared.ts::childTypeComponents`

```text
/**
 * Compute the shared {@link TypeComponent} list for a children slot.
 *
 * Child slots intentionally project only constructible / drillable node refs.
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
 * Node-ref fields (to a keyword/token/pattern/branch/supertype KIND) are
 * deliberately EXCLUDED (gated out before consulting storage info at all):
 * a node-ref to a keyword/token/pattern kind already works today, because
 * that kind's OWN leaf transport struct has a manual `FromNapiValue`
 * accepting bare strings/booleans (see `renderLeafTransportNapiImpls`) —
 * e.g. rust `closure_expression.move_marker`, a node-ref to `_move_marker`.
 * A node-ref to an ordinary branch/supertype kind (e.g. `call_expression.
 * callee` → `_expression`) is a completely normal structural child —
 * `resolveFieldStorageInfo`'s `'verbatim'` result for THAT case means
 * "not a bounded keyword-literal set", not "wrap sends bare text"; treating
 * it as a primitive would be wrong (confirmed: an earlier version of this
 * function gated on `resolveFieldStorageInfo` alone and wrongly collapsed
 * ordinary structural fields to `String`).
 *
 * Within the terminal-only gate, `resolveFieldStorageInfo` (the SAME
 * slot-storage classification `wrap.ts` already uses) distinguishes what
 * wrap actually puts on the wire:
 *
 * - `'boolean'` — wrap collapses this to a JS `true`/absent boolean
 *   (rust `self_parameter.reference` → `&`, `closure_expression.async_marker`
 *   → `async`). The Rust field should be a plain `bool` carrying presence,
 *   with `text` the fixed literal to write when present.
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
// Same wire-identity derivation as classifyFieldStorageInfo /
// kindEnumTextMapExpr — see keywordRefWireIdentity.
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
 * if so by spread or directly — and six unrelated decisions used to read
 * that single answer:
 *
 *   factoryTakesSpreadChildren   factories.ts: does the factory take
 *                                positional element args?
 *   fromEmitsChildrenCoercer     from.ts: emit the children-taking
 *                                coercer rather than the field-carrying one?
 *   fromForwardsToChildFactory   from.ts: may this target's factory be
 *                                forwarded to?
 *   wrapExposesChildren          wrap.ts: does `$with` expose children?
 *   testConstructsWithChildren   test.ts: may a generated test construct
 *                                this with children?
 *   irNamespacesChildFactory     ir.ts: does a leaf factory under this
 *                                parent get namespaced?
 *
 * They agree today, and each is a one-line delegation because of that.
 * The names exist so they can stop agreeing: widening the shared
 * classifier for one consumer used to re-shape the other five silently —
 * narrowing it once emptied `_wrapKindIds` and broke array auto-wrap at
 * runtime, and re-broadening it moved named kinds into the child coercer
 * and cost them their dual-surface tolerance. A consumer whose question
 * changes now edits its own predicate.
 *
 * `isWrapChildrenKind` and `emitsFieldResolvers` are the same pattern,
 * already named for their questions before this split.
 */
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

### `packages/codegen/src/emitters/shared.ts::scalarLeafKinds`

```text
/** The leaf kinds a JavaScript scalar resolves to in this grammar — a
 *  boolean to the boolean literal, an integer to the integer literal, any
 *  other number to the float literal — by the grammar's own names for them
 *  (`integer_literal` in rust, `integer` in python), absent when the grammar
 *  has no such leaf. The one source for the runtime `_resolveScalar` and for
 *  the `LeafScalarMap` the loose surface widens those leaves through, so a
 *  scalar the resolver accepts is exactly a scalar the type admits. */
```

### `packages/codegen/src/emitters/shared.ts::wrapExposesChildren`

```text
/** Does `$with` expose children for this kind? Delegates to the module-private `classifyChildFactorySurface`;
 *  named separately so this consumer's answer can change without
 *  re-shaping the other five. */
```

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

### `packages/codegen/src/emitters/templates.ts::separateBraceFromTag`

```text
/** Splits a literal `{` off a following tag opener so askama does not lex
 *  the pair as one, and marks the tag with a whitespace trim so the
 *  inserted space never reaches rendered output. Askama lexes only `{{`,
 *  `{%` and `{#`; a brace before anything else, `}` included, is ordinary
 *  text and is left alone. Runs once, where a template body is finalized,
 *  which is what lets it see the adjacency a per-literal escape cannot. */
```

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

### `packages/codegen/src/emitters/shared.ts::classifyFactoryShape`

```text
/**
 * The factory surface, read from the model's class: leaves are `text`, a
 * list is `elements`, a compound with a sole repeated slot is `spread`,
 * with a sole singular slot `direct` (or `forwarded` when that slot names
 * one kind with its own factory), anything else — two-plus slots, zero
 * slots, a hidden non-user-facing kind — is `config`. A hoisted form is
 * `direct`/`forwarded`/`config` by the same sole-slot test.
 */
```

### `packages/codegen/src/emitters/shared.ts::wordCharAsciiTable`

```text
/**
 * Derive a 128-entry ASCII word-class table from the grammar's Link-pinned
 * `wordMatcher` regex (SpacingWriter spec: "the Link-pinned wordMatcher
 * already carried on LinkedGrammar — no new configuration").
 *
 * Per-char classification uses the PAIR test rather than a single-char
 * match: a char is word-class iff it would EXTEND a word match ('a'+c
 * matches longer than 'a') or START one that the next word char joins
 * (c+'a' matches longer than c). This is grammar-faithful where a naive
 * single-char test fails — digits are word-INTERIOR for identifier-shaped
 * word patterns without being valid word STARTS.
 */
```

### `packages/codegen/src/emitters/template-hash.ts::computeTemplateBundleHash`

```text
/**
 * Compute a stable SHA-256 hex digest over a set of template files.
 *
 * @param files — the grammar's `.jinja` files. Order is irrelevant;
 *   the function sorts by filename internally.
 * @returns lowercase hex-encoded SHA-256 digest, 64 characters.
 */
```

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

### `packages/codegen/src/emitters/templates.ts::firstBoundaryCharOfFragment`

```text
/**
 * Extract the leftmost meaningful character from a template fragment:
 * the first real text char or, if the fragment opens with a `{{ slot }}`
 * expression, the word-like stand-in character.
 */
```

### `packages/codegen/src/emitters/templates.ts::isTopLevelMultiConditional`

```text
/**
 * Detect whether a template string is a "pure top-level multi-conditional" —
 * two or more `{% if %}...{% endif %}` segments that are IMMEDIATELY ADJACENT
 * (no non-tag, non-whitespace content between `{% endif %}` and the next `{% if %}`).
 *
 * Example → true:
 *   `{% if A %}body_A{% endif %}{% if B %}body_B{% endif %}`
 *   `{% if A %}body_A{% endif %}{% if B %}body_B{% endif %}{% if C %}body_C{% endif %}`
 *
 * Example → false (nested):
 *   `{% if outer %}{% if A %}...{% endif %}{% if B %}...{% endif %}{% endif %}`
 *   (inner conditionals are at depth 1, not top-level)
 *
 * Example → false (interleaved non-tag content):
 *   `{% if type_params %}...{% endif %}{{ params }}{% if return_type %}...{% endif %}`
 *   (`{{ params }}` is non-tag content between the top-level segments)
 *
 * This distinction is critical: seq templates for nonterminals often have multiple
 * top-level conditionals separated by non-conditional content (slots, literals).
 * Only synthetic exclusive-arm choices produce PURE adjacent multi-conditionals.
 *
 * Algorithm: scan depth-tracking; when a top-level `{% endif %}` is found, check
 * if the immediately-following non-whitespace content is another `{% if %}` or
 * `{%-`. If YES: increment adjacentRun. If NO: reset to 0 (broken by non-tag).
 * Return true iff adjacentRun ever reaches ≥ 1 (meaning ≥ 2 adjacent segments).
 */
```

### `packages/codegen/src/emitters/templates.ts::_insertAfterTopLevelIfTags`

```text
/**
 * Insert `insert` immediately AFTER each top-level `{% if ... %}` opening tag
 * in `str`. "Top-level" means at depth 0 in the if/endif nesting.
 */
```

### `packages/codegen/src/emitters/templates.ts::_insertBeforeTopLevelEndifTags`

```text
/**
 * Insert `insert` immediately BEFORE each top-level `{% endif %}` closing tag
 * in `str`. "Top-level" means the tag transitions from depth 1 to depth 0.
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

### `packages/codegen/src/emitters/templates.ts::selectJoinFilter`

```text
/**
 * Pick the join-filter name based on a rule's flank metadata, reading
 * trailing/leading attributes directly off the rule.
 *
 * When the rule itself carries no trailing/leading flags (e.g. the outer
 * choice in `fanOutSeqChoices`/`factorChoiceBranches` rebuilds), falls back
 * to the slot values' per-value trailing/leading flags — stamped by
 * `stampSeparatorOnValues` when the separator flowed from a repeat wrapper
 * through wrapper-deletion onto the slot entries.
 */
```

#### body

```text
// trailing/leading now live NESTED inside `separator` — no more
// top-level siblings on the rule to check directly.
```

#### body

```text
// Presence check, not a specific `DelimiterMode` value: a rule
// reaching this (non-`'list'`-classified) function can only
// carry a `'mandatory'` flank here (a genuinely `'optional'` one would
// already have routed the rule to `'list'` classification
// instead, see `isSeparatedListShape`, assemble.ts) — mirrors
// `collect-slots.ts`'s `hasTrailingDelimiter`/`hasLeadingDelimiter` derivation.
```

#### body

```text
// Fallback: read trailing/leading from the slot's per-value entries.
// This handles the case where the separator was stamped onto slot values
// by `stampListFactsOnValues` but the rule itself (a rebuilt choice from
// `fanOutSeqChoices`/`factorChoiceBranches`) carries no flank flags.
```

#### body

```text
// Also check the AssembledNonterminal's own hasTrailingDelimiter/hasLeadingDelimiter flags.
```

### `packages/codegen/src/emitters/templates.ts::emitListSlot`

```text
/**
 * Emit Jinja for a list-shaped slot: `{{ name | join("…") }}` (or one
 * of the trailing/leading/flanks variants). Reads the separator from
 * the supplied rule's attributes.
 *
 * The slot name is the RAW (snake_case, singular) field/symbol name,
 * lowercased. We deliberately do NOT use `slot.propertyName` (camelCase +
 * pluralized) — templates reference slots by their raw storage name, and
 * the render-side transport struct fields use that same raw name, so the
 * two must match.
 *
 * When the optional `slot` back-pointer is supplied, the separator is
 * overridden to `""` (empty concatenation) when ALL values in the slot
 * are `token.immediate(…)` terminal entries. Immediate tokens must
 * adjoin the preceding token with no whitespace separator — e.g. the
 * content fragments of a Python string literal (`string_content`,
 * `interpolation`) must concatenate without separator.
 */
```

#### body

```text
// Immediate-terminal check: when ALL slot values are terminal entries
// stamped with `immediate: true` (produced by `token.immediate(…)` in
// the grammar), the correct separator is the empty string — the tokens
// must be concatenated adjacently, no whitespace between them.
```

#### body

```text
// Separator resolution: prefer the rule's own separator (directly carried),
// then fall back to the slot values' per-entry separator (stamped by
// `stampListFactsOnValues` when the separator flowed from a repeat wrapper
// through wrapper-deletion). This handles the case where `fanOutSeqChoices`/
// `factorChoiceBranches` rebuilt a choice carrying only the rule id (not the
// separator), so the outer choice has no separator but the slot values do.
```

#### body

```text
// A genuinely nonterminal separator (e.g. `choice(',', ';')`) has no
// fixed compile-time text — `ruleSep` is `undefined` for that reason,
// not because there's no separator at all. Reference the transport
// struct's own `.separator` field (a runtime-resolved `&str`, populated
// by render-module.ts's `buildSeparatorKindMatchLines` from the wire-
// captured `_separator`) instead of falling through to
// `DEFAULT_JOIN_SEPARATOR` — which would silently drop every separator
// occurrence (see docs/superpowers/specs/2026-07-12-separator-as-slot-design.md).
```

#### body

```text
// List-interior census: EVERY plain-join list boundary is classified —
// derivable (checks provably constant) or varying (the true residue) —
// so unresolved interiors are counted, not silently dropped. Emission
// is never changed (see staticListInterior on why baking is blocked).
// Flank filters are excluded: they compare captured anonymous-token
// text against the separator, which must stay the grammar's own.
```

### `packages/codegen/src/emitters/templates.ts::emitScalarSlot`

```text
/**
 * Emit Jinja for a scalar slot: `{{ name }}`. The slot name is the RAW
 * (snake_case, singular) name lowercased.
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

### `packages/codegen/src/emitters/templates.ts::emitFixedText`

```text
/** Emit fixed text into a template. Whitespace-only text (the newline
 *  externals) goes out as an expression tag — raw template whitespace
 *  adjacent to the header comment's `-#}` trim would be eaten (see the
 *  INDENT case). */
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
 * Derive the Jinja slot expression for a symbol ref, driven by the leaf
 * attributes set by the enrich / push-down pass (fieldName, multiplicity,
 * separator). In RenderRule input the wrapper rule types (field / optional /
 * repeat / repeat1) are absent; their slot facts live here instead.
 *
 * Multiplicity mapping:
 *  - 'array' | 'nonEmptyArray' → list form: `{{ name | join("…") }}`
 *  - 'optional'               → conditional scalar: `{% if name | isPresent %}{{ name }}{% endif %}`
 *  - undefined (required)     → scalar: `{{ name }}`
 */
```

```text
// ---------------------------------------------------------------------------
// Per-RenderRule.type helpers
// ---------------------------------------------------------------------------
```

```text
// emitField, emitOptional, and emitRepeat were deleted in PR2 Task 3.B3.
// Those wrapper rule types (field / optional / repeat / repeat1) must not
// appear in RenderRule input — the wrapper attributes (fieldName /
// multiplicity / separator) are now on the leaf rules themselves and
// emitSymbol reads them directly. emitRule throws defensively if they appear.
```

#### body

```text
// Link-synthesized symbols carry their original literal text — render
// it verbatim so keyword tokens lifted from `_kw_foo` helpers emit as
// `foo` not as a slot reference.
//
// A link-symbol renders its literal verbatim ONLY when it has no
// `fieldName`; a fielded one goes through the terminality stamp below.
```

#### body

```text
// `nonterminal: false` is the one switch that makes a reference text
// rather than a slot (`flatten.ts::stampTerminality`): a reference to a
// literal — a keyword/token leaf, a link-minted literal kind, a rule whose
// body is one fixed string — renders that text here and never reaches the
// slot lookup. `binary_expression`'s `operator` is NOT such a reference:
// its fielded position varies across the choice's arms, so the stamp
// marks it `nonterminal: true` and it falls through to the slot path,
// where the renderer substitutes the parsed operator.
```

#### body

```text
// A hidden, inline-flagged target with a real renderRule (e.g. rust's
// `struct_item.name` → `_type_identifier`, typescript's
// `*.semicolon` → `_semicolon`) inlines the SAME way regardless of
// whether the reference to it is a declared named FIELD or an unnamed
// group-lift helper — a hidden target is never a real slot value (it
// never surfaces as its own CST node), so treating a field-wrapped
// reference to it as an opaque scalar slot (the old behavior) produces
// an unresolvable template variable whenever the target isn't just a
// trivial single-value passthrough. Both branches below gate on this so
// the shared inlining logic further down (originally written only for
// the unnamed case) is the single place that decides.
//
// EXCLUDES a target whose own renderRule is a CHOICE (e.g. python's
// `_suite`, once its own indent-bearing arm is promoted to a real
// aliased kind — see `_suite: { 1: 'block_with_indent' }` in
// grammar.sittir.ts): a well-formed multi-arm choice is exactly what
// the union-slot machinery (`emitChoice`'s `unionBacked` routing) is
// built to route through a NORMAL slot reference on the outer field —
// inlining it here would bypass that machinery instead of exercising it,
// and `emitChoice` has no notion of gating on an arbitrary outer field
// name for a plain (non-union-backed) choice.
```

#### body

```text
// PR2 Task 3.B3: check leaf-level attributes pushed down from wrapper
// rules. fieldName is set when the symbol was formerly inside a FieldRule;
// multiplicity when inside a RepeatRule or OptionalRule.
```

#### body

```text
// Prefer the registered slot (single source); fall back to the field
// name + leaf multiplicity only when no slot is registered.
```

#### body

```text
// Slot back-pointer: when assembly registered a slot for this rule
// position, emit a multiplicity-aware slot expression. In RenderRule
// input, a symbol with a slot and no multiplicity attribute is a single
// required value → scalar. Array / optional shapes carry their
// multiplicity attribute from the push-down pass.
//
// Bug 2 fix: When the slot is UNNAMED (derived structurally from child
// positions rather than a declared grammar field) AND the rule is a
// group-lift symbol, we must NOT emit the helper-derived slot name — it is not
// a real FROM/read-populated field. Instead, fall through to the
// group-lift inlining path below. The inferred-slot path fires because
// assemble registers a back-pointer for EVERY rule position it processes,
// including auto-synthesized helpers. We skip it here so the group-lift
// inline logic handles it correctly. (Named fields wrapping an inlineable
// hidden helper take the same fall-through, for the reason above.)
```

#### body

```text
// Bug 2 fix: Group-lifted symbols that are auto-synthesized hidden helpers
// (e.g. `_function_item_optional1`, `_type_parameters_repeat1`) must be
// INLINED rather than emitted as opaque slot references. These helpers
// exist in `ctx.nodeMap.nodes` as hoisted compound nodes with their own
// `renderRule`, but they do NOT correspond to declared fields that FROM/read
// can populate — emitting `{{ function_item_optional1 }}` as a slot
// reference produces unresolvable template variables.
//
// The correct behavior: look up the target in `ctx.nodeMap.nodes`. If it
// has a `renderRule`, recursively emit that rule inline (matching the
// simplify-side inlining that tree-sitter applies at parse time for
// grammar.inline helpers). Guard against cycles with `visitingHelpers`.
//
// Non-hidden group-lift symbols (no leading `_`) or those without a
// `renderRule` in the nodeMap fall through to the scalar slot path — they
// represent proper named groups whose output is a single rendered string.
// Hidden helper refs INLINE, mirroring tree-sitter's parse-time flattening of
// `_`-rules. Provenance-free — keyed only on the structural `_` fact, NOT on
// `source:'group-lift'`. The assembled `renderRule` is the inline source for
// EVERY hidden ref (verified: emitRule(renderRule) === emitRule(flatten(raw))
// for every hidden ref — the raw-rule path below is now only a fallback for the
// rare hidden-without-renderRule case). Cycle guard via visitingHelpers.
```

#### body

```text
// Cycle guard — emit opaque scalar to break recursion
```

#### body

```text
// The helper's own inner symbol references must resolve against
// the HELPER's own slots, not the outer node's — lookupSlot's
// ownerSlots fallback would otherwise silently misresolve (or
// fail to resolve) any inner name that doesn't happen to
// collide with one of the outer node's own field names.
// slotByRuleId (lookupSlot's primary path) is unaffected —
// this only matters for its ownerSlots fallback.
```

#### body

```text
// Multiplicity is applied at the inlined SEQ UNIT (never the leaves —
// pushing past the seq distributes optional onto bare literals which
// the render walker drops). The inlined body is a seq with one
// internal slot; apply the ref's seq-unit multiplicity to that slot:
//   - array/nonEmptyArray → render the single slot with a seq-level
//     join `{{ k | join(sep) }}`. The list's delimiter literals are
//     absorbed into the separator (emitListSlot), so we do NOT emit
//     the raw helperBody (which would inline them). Reuse the in-scope
//     slot so name+separator reproduce the slot-path output exactly.
//   - optional → gate the inlined body on the first declared field.
```

#### body

```text
// symbolFieldName: when present, it's the outer FIELD's own name
// (e.g. `name`/`semicolon`) — prefer it over a condKey derived
// from the helper's inner content, since the outer field's
// presence is what the wire/read layer actually populates. That
// only holds when a slot actually carries the outer name: when
// the helper's INNER field names the slot instead (infer_type's
// `constraint` ref around a helper whose inner field is `type`),
// the outer name is unaddressable and its gate is never true —
// fall through to the helper-derived key.
```

#### body

```text
// Hidden without a renderRule node → fall through to the raw-rule fallback below.
```

#### body

```text
// Hidden helper rules (e.g. python's `_import_list`) are inlined by
// tree-sitter at parse time. Recurse into the target rule's body so
// the helper's content surfaces in place — but guard against
// left-recursive helpers like rust's `_let_chain` which references
// itself (`_let_chain && let_condition`). When recursion is detected
// we treat the symbol like an opaque scalar slot reference instead of
// inlining, matching the walker's `seen.has('@'+name)` short-circuit.
//
// ctx.rules is the normalizedRules view — already RenderRule, no flatten
// bridge needed. This is a fallback for the rare
// hidden-without-renderRule case (the primary path above handles every
// branch/group target); reached e.g. for hidden `pattern`/`multi`
// modelType targets that never got an AssembledBranch/Group `renderRule`.
```

#### body

```text
// Seq-unit multiplicity (mirrors the renderRule path above): array →
// seq-level join on the single slot; optional → gate the inlined body.
```

#### body

```text
// Bug 5 fix (hidden-helper path): when the surrounding context stamped
// `multiplicity: 'optional'` onto this symbol (e.g. the symbol was
// inside optional(_initializer)), wrap the inlined body in a conditional
// keyed on the first field inside the helper. This matches the group-lift
// path's behavior (lines 780-789) and ensures optional hidden helpers
// produce `{% if condKey | isPresent %}body{% endif %}` not bare `body`.
```

#### body

```text
// Fallback: bare kind-named scalar slot.
```

### `packages/codegen/src/emitters/templates.ts::joinStaticSeam`

The one place a statically resolved seam becomes template text. Spaced: a
literal space — the writer then sees a whitespace flank and has nothing to
decide. Glued: when the next segment is an expression (a separate write at
render time), the adjacency mark (`ADJACENT`, U+FFFE) written into the
template right before it, which `SpacingWriter` strips and takes as "no
seam space before the text that follows"; a glued literal-to-literal seam
needs nothing, because askama writes both literals as one chunk and the
writer only checks between chunks. The mark rides in
the stream, so its position is the write order regardless of how askama
orders its expression evaluation; it replaced the `| markSeam` filter,
whose thread-local side effect askama evaluated before earlier writes
(typescript's `_import_statement_arm` rendered `importsomething` the moment
its `from{{ source }}` seam went static). Runtime-varying seams get neither
— the writer decides them from the characters.

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

### `packages/codegen/src/emitters/templates.ts::scanArmBody`

```text
/**
 * Scan an emitted arm body for `emitChoice`'s union-routed path — the body is
 * the single authority on what the arm references (name- or id-based
 * partitioning of the render-tree arm is unreliable across choice rebuilds).
 *
 * `key` — the arm's discriminating slot: the first `{{ name }}` reference at
 * if-nesting depth 0 (an ungated reference is REQUIRED within the arm, so its
 * presence discriminates it — e.g. arrow_function's signature arm gates on
 * `parameters`, never on its leading OPTIONAL `type_parameters` block), else
 * the first gated reference.
 *
 * `needsGate` — whether the body has ANY depth-0 reference or literal text.
 * A body that is entirely self-gated blocks (e.g. range_pattern's
 * `{% if left %}…{% endif %}{% if content %}…{% endif %}` arm) must NOT get
 * an outer gate: nothing in it can leak, and wrapping it on one of its
 * optional refs would suppress the other forms.
 */
```

### `packages/codegen/src/emitters/templates.ts::assertSlotPreservation`

```text
/**
 * Verify each declared slot for `node` appears at least once in `body`.
 * Throws on missing slots — the gate that ensures the emitter's structural
 * rewrite didn't drop a slot reference. This is a structural check, not a
 * byte-equivalence one: the emitter is free to choose its own Jinja
 * formatting as long as every slot is referenced somewhere in the output.
 *
 * Uses word-boundary regex (`\bname\b`) on each slot's `storageName`
 * (snake_case, matches what the emitter writes into templates) so references
 * inside `{{ name }}`, `{% if name | isPresent %}`, and
 * `{{ names | join(...) }}` all match.
 *
 * Skips terminal-only slots (all values are literal terminals with no
 * node-refs) — these are deterministic-value tokens emitted as literals, not
 * as named slot references (e.g. `opening`/`closing` enum-delimiter slots).
 */
```

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

### `packages/codegen/src/emitters/templates.ts::writeJinjaTemplates`

```text
/**
 * Write per-kind `.jinja` files to `outputDir`. Creates the directory
 * if it does not exist. After writing, scans the directory for any
 * `.jinja` files whose kind is not in `emitted` and removes them —
 * prevents stale files from accumulating across regenerations when a
 * rule is renamed or removed from the grammar.
 *
 * Preserves `.gitkeep` and non-`.jinja` files (README.md, etc.).
 */
```

#### body

```text
// Stale-file cleanup — only touches `.jinja` files. Anything else
// (`.gitkeep`, README) is left alone. A pre-existing `_meta.json`
// from the short-lived sidecar era (prior to the joinby-filter
// migration) is removed — the Jinja bodies carry every separator
// now, so the sidecar is dead data.
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

One generated test per wired sub-factory, driven by `collectPolymorphWires` — the same derivation the overlay emits from, so tests exist exactly for wires that exist. Call arguments come from the dummy machinery, following the wire shapes (positional seat, residual config, merged config, seated tuple; list children lead with an options object when their surface takes one). `expectTestFailures["<kind>.<name>"]` skips a case and loosens its call target so a pinned, unwired name never type-errors. Alias wires get a form case each — the hoisted call with the child's bare-call arguments, asserting the child's discriminant (the form is its own node kind, not the parent's) — skipped when the dummy machinery cannot produce arguments for the child.

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
 * When recursion bottoms out (depth limit or cycle) the stub still declares
 * `$type`/`$text`/`$source`/`$named` but omits nested required fields —
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
// `NodeData` — NOT routed through the field's factory (which is
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
 *   deriveChildrenKinds result for children)
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
 *   `type_identifier`). This is the SAME kind of "runtime id diverges
 *   from the modeled storage kind" fact `aliasedHiddenKinds` covers for
 *   HIDDEN alias-source rules, just carried per-value (on `NodeOrTerminal.
 *   parseKind`) instead of globally keyed by hidden rule name — a
 *   visible-to-visible alias reference site has no hidden rule name to key
 *   `aliasedHiddenKinds` by, so it can only be recovered from the slot
 *   that actually saw the alias. Any entry whose source equals `kind` adds
 *   its target id too.
 */
```

### `packages/codegen/src/emitters/transport-common.ts::deriveChildrenKinds`

```text
/**
 * Extract the kind set from an `AssembledNonterminal.values` array.
 * Parallel to `AssembledNonterminal.projection.kinds` for field slots.
 * Terminal values (inline string literals) are skipped — they do not
 * contribute to the transport type.
 *
 * Unresolved refs are included using their `name` (the grammar kind string,
 * e.g. `_expression`) — mirroring how `AssembledNonterminal.projection.kinds`
 * is built in `deriveSlotsRaw`.
 *
 * @param child - any AssembledNonterminal (field or children slot)
 * @returns deduplicated list of resolved kind names
 */
```

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

### `packages/codegen/src/emitters/types.ts::buildGrammarKeySet`

```text
/**
 * Build the set of kind keys known to grammar.ts (the PythonGrammar / RustGrammar
 * type literal). Tree type interfaces can only use `NodeKind<Grammar>` as their
 * discriminator, so kinds absent from grammar.ts — hidden rules, promoted
 * terminals, synthesised forms — must fall back to a generic `AnyTreeNode`.
 *
 * @param grammar - Grammar name (e.g. `"rust"`, `"python"`).
 * @returns Set of kind strings present in the node-types.json for this grammar.
 *   Anonymous tokens are stored under the `_anonymous_<token>` key convention.
 *   Returns an empty set when node-types.json is unavailable.
 */
```

```text
// ---------------------------------------------------------------------------
// Grammar key helpers
// ---------------------------------------------------------------------------
```

#### body

```text
// No node-types.json available — emit all Tree interfaces as AnyTreeNode.
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
 * literals.
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
//  - The deprecated JS/Nunjucks backend's name-based template
//    resolution (`resolveKindName` / `renderNunjucks`,
//    packages/legacy-core/src/render.ts).
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
//    `from.ts`/`read-render-parse.ts`/`factory-render-parse.ts` —
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
// Mirrors 2026-07-18's original (pre-split) KIND_NAMES rule: prefer
// the parser's own display name over the raw catalog key, except
// for anonymous tokens (their symbolName carries literal
// punctuation text, e.g. "+", not a kind name).
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

### `packages/codegen/src/emitters/types.ts::enumMemberDiscriminant`

```text
/**
 * Build the `$type` discriminant expression for an enum kind by resolving
 * each member value to its `TSKindId.X` entry and joining as a union.
 *
 * @remarks
 * Only for an enum kind WITHOUT a parser symbol of its own — a synthesized
 * choice-of-literals (typescript's `unary_expression` operator, rust's
 * `reserved_identifier`): the parse yields one of the member tokens, so
 * `$type` is one of the members' symbol ids. Each member value is an
 * anonymous token with a catalog entry via its `symbolName`; the
 * discriminant is the union of their `TSKindId.X` references, `number` when
 * none resolves or `kindEntries` is absent. An enum kind that HAS its own
 * symbol (rust `boolean_literal`, typescript `accessibility_modifier`) is a
 * named node whose `$type` is that symbol — a parsed `true` carries
 * `TSKindId.BooleanLiteral`, not `TSKindId.True` — so its alias, its
 * factory stamp and its `is.*` guard all use the kind's own id;
 * `emitLeafTerminalAliases` decides by `hasKindId`.
 *
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

### `packages/codegen/src/emitters/types.ts::emitLeafTerminalAliases`

```text
/**
 * Emit one type alias per leaf kind, skipping those that are completely
 * unreferenced. A kind whose storage is its id (`storage === 'kindId'`: a
 * keyword) aliases the id itself — `export type EmptyStatement =
 * TSKindId.EmptyStatement` — so slot types keep naming the kind while the
 * value stored is the id. Hidden or visible makes no difference: every
 * referenced kind has a type. Pattern and enum kinds alias
 * `Terminal<kind, textType>`, the one shared leaf-node shape from
 * `@sittir/types`.
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
// inline their literal via `resolveHiddenKeywordLiteral`, so no
// consumer needs the `KwXxx` / `KwXxxTree` stub any more. Keeping
// them would be dead exports — `fieldTypeComponents` resolves the
// reference to a literal string at emit time, so no generated
// code mentions `KwAsync` / `KwMove` / `KwOperator` anywhere.
```

### `packages/codegen/src/emitters/types.ts::emitTreeInterfaceDeclarations`

```text
/**
 * Emit `export interface <TypeName>Tree` declarations for every structural
 * and leaf kind, plus synthetic per-form Tree interfaces for polymorphs.
 *
 * @remarks
 * Tree interfaces are retained for every kind because tree-sitter's native
 * `field` / `children` typing lives here, grammar-key-anchored. These
 * shape-match `X.Tree` (= `TreeNodeOf<X>`) structurally, but reach the
 * grammar schema through the `TreeNode<'kind'>` computed type. `X.Tree`
 * (namespace sugar) is the preferred consumer path; the flat `XTree`
 * interface stays because factories emit `replace(target: T.XTree)` with an
 * interface reference — anonymous type projections from namespace sugar are
 * verbose.
 *
 * @param lines - Output line buffer to append to.
 * @param nodeKinds - Structural kind strings.
 * @param leafKinds - Leaf kind strings.
 * @param nodeMap - The assembled node map.
 * @param grammarKeys - Set of kind keys present in grammar.ts / node-types.json.
 * @returns The set of type names for which a Tree interface was emitted.
 */
```

```text
// ---------------------------------------------------------------------------
// Tree interface declaration emission
// ---------------------------------------------------------------------------
```

#### body

```text
// Hidden single-literal `_kw_*` keywords are inlined at every
// field reference, so their Tree interfaces are dead exports.
// Skip in lockstep with `emitLeafTerminalAliases`.
```

### `packages/codegen/src/emitters/types.ts::emitSupertypeUnionDeclarations`

```text
/**
 * Emit `export type <TypeName> = | A | B | …` union declarations for every
 * supertype, plus the corresponding `<TypeName>Tree` union.
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
// Supertype Tree union — factories reference it from
// `replace(target: T.SupertypeTree)` signatures. Filter to
// subtypes whose data INTERFACE was actually emitted (the matching
// `Tree` alias only exists when the data type itself does — for
// example, hidden single-literal `_kw_*` keywords resolve their
// literal inline and emit no Tree alias, and a supertype member's
// own Tree union is emitted only when it has tree-bearing members
// of its own). Without the filter the supertype Tree references
// dangling identifiers like `WildcardPatternTree` for
// `_wildcard_pattern`.
```

#### body

```text
// Supertype Config/Loose unions dropped (US7 landing):
// consumers reach supertype Config via `T.Supertype` and map it
// through generic helpers rather than a flat alias.
```

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
 * content-type lists of structured nodes, then emit their type and Tree
 * interface declarations.
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
 * @param treeEmitted - Mutable set of type names for which a Tree interface was
 *   already emitted; updated in place as new token Tree interfaces are added.
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

### `packages/codegen/src/emitters/types.ts::emitNamespaceInterfaceLine`

```text
/**
 * Emit one `export interface <TypeName>Ns extends NodeNs<…> {}` row.
 *
 * @remarks
 * Threads `NamespaceMap` through `NodeNs` so that `Loose` can short-circuit
 * multi-branch union recursions to `NamespaceMap[K]['Loose']` lookups
 * instead of re-projecting per arm. When the kind has a factory, the row
 * also carries the kind's {@link BuiltTypeSurface} — the built type, the
 * build-args tuple and the loose-args tuple — inline as the trailing
 * `NodeNs` arguments: this file is where `<Kind>.Built` is DEFINED, and
 * `raw.ts` only annotates its builders with that name. The surface text is
 * written against `T.`, which is why `types.ts` imports itself as `T`
 * (type-only): the same text serves both files without a rewrite.
 *
 * @param lines - Output line buffer to append to.
 * @param typeName - The `TypeName` portion of the interface name.
 * @param surface - The construction surface, or `undefined` for a kind with
 *   no factory (the row then has no `Built` / args members beyond the
 *   `NodeNs` defaults).
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

### `packages/codegen/src/emitters/types.ts::quoteKey`

```text
/** Quote a type/object key if it is not a plain identifier. */
```

### `packages/codegen/src/emitters/types.ts::emitRefineFormTreeAliases`

```text
/**
 * Emit per-form Tree aliases for every refined kind.
 *
 * @remarks
 * Refine narrows choice selections at the Config/factory surface, not
 * the parse shape — the tree produced by tree-sitter is identical
 * regardless of which form constructed the node. The per-form Tree
 * alias therefore points at the base kind's Tree type; it exists so
 * method return types (`curly().type(...)`) can name a form-
 * specific Tree type at compile time without a structural duplicate.
 */
```

```text
// ---------------------------------------------------------------------------
// refine() per-form type emission (phase 2)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/types.ts::emitNamespaceSugarBlock`

```text
/**
 * Emit the namespace sugar block for one structured kind — the
 * declaration-merged `namespace <TypeName> { Config; Fluent; Loose; Tree;
 * Kind; }` block, plus per-form sub-namespaces when refine() registered
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
 *     fields) and `Tree` (alias to the base kind Tree).
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

### `packages/codegen/src/emitters/types.ts::emitRefineFormSubNamespaces`

```text
/** Each refine form's sub-namespace carries its own `Built` / `BuildArgs` /
 *  `LooseArgs` (from `refineFormBuiltTypeSurfaceOf`) beside `Config` and
 *  `Tree`, so a form factory annotates `T.<Kind>.<Form>.Built` exactly as
 *  a plain kind's factory annotates `T.<Kind>.Built`. */
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
 *   - `Tree`   — alias to the base Tree type (same parse shape).
 */
```

### `packages/codegen/src/emitters/wrap.ts::collectTypeImports`

```text
/**
 * Collects the set of concrete interface type names that need to be imported.
 *
 * Wrap functions return `AnyNodeData` (not `WrappedNode<T>`), so no
 * per-kind type imports are needed. Returns an empty set.
 *
 * @param _nodeMap - The fully assembled node map for the grammar (unused).
 * @returns An empty set — no per-kind type imports needed.
 */
```

```text
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
```

#### body

```text
// Wrap functions return AnyNodeData; no WrappedNode<T> per-kind type
// imports required.
```

### `packages/codegen/src/emitters/wrap.ts::branch`

```text
/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
```

### `packages/codegen/src/emitters/wrap.ts::group`

```text
/**
	 * Emit a group wrap function — hidden structural helpers still need lazy
	 * accessors so native read payloads can drill through their child stubs.
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

### `packages/codegen/src/emitters/wrap.ts::buildSupertypeMembersMap`

```text
/**
 * Builds a map from supertype kind name to its resolved transitive member set.
 * Used by the emitted `SUPERTYPE_MEMBERS` const in wrap.ts to enable
 * `_matchesAllowedWrapKind` to correctly match concrete kinds against
 * grammar-declared supertypes (e.g., "identifier" against "_expression").
 */
```

### `packages/codegen/src/emitters/wrap.ts::collectConcreteStorageKeys`

```text
/**
 * For a kind-origin slot whose `values[]` reference one or more concrete
 * grammar kinds (possibly through a supertype), collect the concrete
 * `_<kind>` storage keys the runtime reader will populate.
 *
 * Background (spec 2026-05-17 kind-named slots):
 *   The native reader routes UNNAMED-but-named CST children by their
 *   `child.kind()` (the CONCRETE kind, e.g. `identifier`, `call_expression`).
 *   That becomes the `_<kind_name>` storage key in the serialized NodeData.
 *
 *   For a grammar rule like `await_expression: seq($._expression, '.', 'await')`
 *   the slot is named after the supertype (`expression`), but the data on the
 *   wire is keyed by the CONCRETE subtype (`_identifier`, `_call_expression`,
 *   ...). Accessing `data._expression` always returns undefined.
 *
 *   This helper expands each value's referenced kind through
 *   `expandToConcreteParseKinds`, which normalizes the leading underscore on
 *   supertype names and reads each supertype's stamped `transitiveParseKinds`
 *   closure (`stampSupertypeClosures`, computed once during assemble — see
 *   `docs/glossary/compiler-model.md`) to enumerate concrete subtypes. The
 *   result is a list of concrete `_<kind>` keys — exactly one of which will
 *   be populated on the data object at runtime.
 *
 * Returns undefined when expansion produces a single key that already
 * matches the slot's nominal `_<slot.name>` — the legacy single-key access
 * is sufficient and no probe shape is needed.
 *
 * Union-slot design §5: a degenerate arm's value is LABEL-routed
 * (`parseName`, {@link valueParseLabelsOf}) — for that value, `storageName !=
 * parseName` by construction, and the wire key IS the literal tree-sitter
 * field name (`read_node.rs` keys a field-tagged child by field name, not by
 * kind). Expanding a label through the supertype tree — treating it as a kind
 * to expand — replaces the literal wire key with subtype kinds that are never
 * populated for a field-tagged child, so label names are unioned in
 * UNEXPANDED. Kind-derived names (including any that happen to equal a label,
 * e.g. `field('declaration', declaration)`) keep expanding as before.
 */
```

#### body

```text
// Route by the slot's parse-names — the kinds the parser can actually emit:
// ref-kinds PLUS alias targets (collect-slots now folds the targets into
// parseNames). Expand supertypes. No base→variant rewrite: parseNames
// already carries both the base kind (validation-only polymorph variants,
// which the parser emits as the base — e.g. type_query's
// instantiation_expression) AND the alias target (real tree-sitter aliases
// like decorator, which the parser emits as the target). The old rewrite
// REPLACED base with target, mis-routing the validation-only case.
```

### `packages/codegen/src/emitters/wrap.ts::computeConsumedCandidateKeys`

```text
/**
 * Consumed candidate keys: concrete kind-keyed wire keys any field's
 * `??`-chain reads (`collectConcreteStorageKeys`) that are NOT some field's
 * own canonical `storageKey`. Shared by `emitFieldCarryingWrap` (its
 * `slots` param) and `emitSeparatedListWrap` (its `node.slots` — the same
 * `_slots` source, single- or multi-slot) so both spread bases omit
 * the SAME raw un-dispatched shadow stubs instead of drifting apart — see
 * `_omitWrapKeys`'s doc comment for the masking bug this prevents.
 */
```

### `packages/codegen/src/emitters/wrap.ts::_keepModelledSlots`

```text
// Emitted prelude helper, called first in every wrap function with the
// keys that kind's wrap reads (its slots' storage keys plus the kind-keyed
// candidates of its unnamed slots). The grammar-agnostic reader still
// emits a `_<key>` for every named child, including a reference to a
// literal the model has no slot for; wrap is the model-driven boundary
// and drops those before they can be spread into the wrapped node.
```

### `packages/codegen/src/emitters/wrap.ts::collectWrapWireKeyTypes`

```text
/**
 * Union the wire-only `_<kind>` storage keys (see `collectConcreteStorageKeys`)
 * across every field of a wrap function, mapped to the SAME element type as
 * the field's own canonical key (`fieldElementType`) — not a generic
 * catch-all. This matters: each probe key feeds the same `??`-coalesce /
 * `_concatInSourceOrder` expression as the field's canonical key, whose
 * result flows (via the generic `normalizeSingularWrapSlot<T>` /
 * `normalizeRepeatedWrapSlot<T>` helpers) into a `drillIn<ElemType>`-typed
 * accessor. A broad probe-key type would widen that inferred `T`, breaking
 * the accessor's explicit generic argument — so precision here isn't
 * cosmetic, it's required for the coalesce chain to type-check.
 *
 * Excludes each field's own canonical `storageKey` (already declared on the
 * canonical `T.X` interface). When the SAME wire key is probed by more than
 * one field with different element types (a key collision that can't
 * actually happen at runtime — a physical key holds one value shape — but
 * isn't structurally impossible to encode), the member types are unioned.
 */
```

#### body

```text
// A wire key that coincides with SOME OTHER field's own canonical
// `storageKey` (e.g. a `block`-aliased field sharing the physical wire
// key with an unrelated `_block` field — tree-sitter alias-source
// sharing) is already declared, with its own authoritative type, on the
// canonical `T.X` interface. Adding a second, differently-typed member
// for that same key would form an incoherent property-type intersection
// (e.g. `Block & (SimpleStatements | Newline)`) and break assignability
// at every existing `T.X`-typed call site. The field that legitimately
// owns that key already reads it through its canonical declaration; skip
// re-declaring it here.
```

#### body

```text
// `resolveSlotStoreExpr`'s `arity: 'many'` branch documents that each
// wire candidate key may hold EITHER a scalar (text-collapsed leaf) OR
// an array of node stubs — that's what `_toArr`/`_concatInSourceOrder`
// normalize. Mirror that shape here (same widening pattern as
// `resolveSlotAccessorBody`'s `arrayElemType`), or the declared type
// would be narrower than what the runtime actually delivers.
```

### `packages/codegen/src/emitters/wrap.ts::buildWrapParamType`

```text
/**
 * Build the wrap function's `data` parameter type: the canonical `T.X`
 * interface widened with the wire-only keys the function body actually
 * reads/writes (`_<concreteKind>` probe keys from `collectWrapWireKeyTypes`,
 * and/or `$other`). The canonical interface intentionally omits these —
 * they're wire-shape artifacts, not part of the public `T.X` surface — so
 * the wrap body needs a widened LOCAL view. All added members are optional,
 * so `T.X` values remain assignable to the widened type (no cast needed at
 * existing `T.X`-typed call sites).
 *
 * `otherType`, when provided, is the PRECISE type for `$other` (e.g.
 * `T.Condition | readonly T.Condition[]` for a transparent supertype whose
 * body reads `data.$other` through the same generic-inference chain as the
 * field probe keys above — see `emitTransparentSupertypeWrap`). Pass a
 * generic fallback for call sites that only ever WRITE `$other` inside a
 * `{ ...data, $other: v }` argument literal (no local read, so no inference
 * chain to keep narrow — see the `childSurface` branch in
 * `emitInlineWithProperty`).
 */
```

### `packages/codegen/src/emitters/wrap.ts::collectSeparatorCandidateKindNames`

```text
/**
 * Recursively collect candidate separator token kind names from a
 * nonterminal separator rule (`AssembledList.separatorRule`) —
 * walks CHOICE/GROUP/OPTIONAL down to STRING/SYMBOL leaves, gathering the
 * set of literal texts / referenced rule names the runtime `$other` scan
 * must match against. A plain leaf-collecting walk, not related to
 * `link.ts`'s flank-absorption (which does structural `rulesEqual`
 * comparison between two rule trees — a different mechanism entirely).
 *
 * Throws on any rule shape this walk doesn't know how to resolve to a
 * kind-discriminant leaf (e.g. a `SEQ`-shaped separator — a genuinely
 * different scenario needing multi-token matching, not a single kind-id
 * probe) — no real grammar currently sets a nonterminal `separatorRule`
 * at all (see `emitSeparatedListWrap`'s doc comment), so a silent `[]`
 * here would make `_separator_kind` silently always resolve to
 * `undefined` for whatever future kind first reaches this gap, rather
 * than failing loudly at codegen time the way `kindDiscriminantExpr`
 * (this file) already does for its own unresolvable-kind case.
 *
 * Exported for reuse by render-module.ts, which needs the SAME candidate
 * set to resynthesize `_separator_kind`'s literal text on the render side
 * (see `buildSeparatorKindMatchLines` there) — the render-side match arms
 * must enumerate exactly the kinds this wire-capture walk can produce, or
 * a real runtime `_separator_kind` value could hit the render match's
 * fallback arm instead of its correct literal.
 */
```

### `packages/codegen/src/emitters/wrap.ts::buildSeparatedListContentSlot`

```text
/**
 * Build the synthetic `AssembledNonterminal` representing a
 * separatedList node's `elements` as a positional (unnamed) repeated
 * slot — routes through the SAME storage-info / concrete-kind-expansion
 * machinery real 'branch' repeated content fields use (`resolveFieldStorageInfo`,
 * `expandToConcreteParseKinds`), so `_content`'s READ SOURCE matches
 * whatever kind-named wire keys the native reader actually populates for
 * these elements (verified empirically — see `collectSeparatedListContentStorageKeys`).
 * `fieldName` is intentionally left `undefined` (positional/unnamed) so
 * `valueParseKindsOf` — not a literal field name — drives that expansion;
 * the OUTPUT storage key is forced to the fixed `_content` name separately
 * (see `emitSeparatedListWrap`), decoupling "what we call it" from "where
 * the data actually lives on the wire".
 *
 * Exported for reuse by factories.ts, which needs the SAME synthetic
 * "elements as an unnamed repeated slot" to resolve the `elements`
 * constructor parameter's element type — same reuse rationale as
 * `collectSeparatorCandidateKindNames` above.
 */
```

### `packages/codegen/src/emitters/wrap.ts::collectSeparatedListContentStorageKeys`

```text
/**
 * Concrete `_<kind>` wire storage keys for a separatedList's content
 * elements. Deliberately NOT `collectConcreteStorageKeys` (which elides
 * the result to `undefined` when the expansion matches the slot's OWN
 * nominal name) — `_content` is a fixed target name that never matches
 * the elements' real kind name, so that elision would silently produce
 * `data._content` (a key that does not exist on the wire; verified via
 * `probe-kind` — the native reader keys unnamed repeated children by
 * their CONCRETE kind, e.g. `data._with_item` / `data._identifier`, never
 * by a generic slot name). Always returns the real expansion instead.
 */
```

#### body

```text
// A fielded element arm routes by its field label, not its kind — the
// raw read stores those elements under `_<label>` (the value's stamped
// `parseName`), so the label is a capture key alongside the kind buckets.
```

### `packages/codegen/src/emitters/wrap.ts::collectSeparatedListWireKeyTypes`

```text
/**
 * Union the wire-only `_<kind>` storage keys a separatedList wrap function
 * body actually reads (`collectSeparatedListContentStorageKeys`) to the
 * content slot's own element type — mirrors the SAME wire-widening pattern
 * `emitFieldCarryingWrap`'s per-field version needs for real 'branch' fields
 * (see this function's commit message for provenance).
 *
 * Excludes any candidate key that coincides with a member `T.<TypeName>`
 * already declares (its OWN canonical `_<name>` storage key, from whatever
 * naming the Task-2 `_slots` stub's `types.ts` derivation picked for this
 * kind — e.g. `_with_item` for `WithClauseBare`, already typed
 * `NonEmptyArray<WithItem>` there) — re-declaring that same key with a
 * different (optional, elemType-only) shape here would form an incoherent
 * intersection.
 *
 * The widened type is derived from `canonicalField` — `node.slots`'s own
 * slot, the SAME `_slots`-derived source `types.ts` types `T.<TypeName>`'s
 * declared members from (see `emitSeparatedListWrap`'s Bug B fix comment) —
 * not from `contentSlot`. `contentSlot` (`buildSeparatedListContentSlot`)
 * is a raw, pre-simplify-normalization view used here only to enumerate the
 * real wire-level `_<kind>` discriminator keys; its per-kind element types
 * can disagree with the post-normalization kind `types.ts` settled on for
 * an equivalent choice arm (e.g. a merged/aliased sibling), which is
 * exactly the mismatch this widening exists to avoid re-introducing.
 */
```

#### body

```text
// `resolveSlotStoreExpr` always appends the target slot's OWN storage
// key as a final probe fallback (its normal behavior for ANY slot whose
// nominal key isn't already among the concrete candidates — see its doc
// comment) — so `data[fallbackStorageKey]` is read regardless, even
// though it is never a REAL wire key. `fallbackStorageKey` is the
// model's OWN derived slot name (Bug B fix — `node.slots`'s real
// storage key, e.g. `_pattern`, NOT a hardcoded `_content`; single-field
// kinds pass their sole field's storage key here). Widen for it too
// unless it already happens to be this kind's canonical key (the common
// case for genuinely multi-kind content, where `types.ts`'s own
// `_slots`-derived naming already fell back to the same generic name).
```

### `packages/codegen/src/emitters/wrap.ts::buildSeparatedListWrapParamType`

```text
/**
 * Build a separatedList wrap function's `data` parameter type: the
 * canonical `T.<TypeName>` interface widened with the wire-only members the
 * function body actually reads — the concrete-kind content probe keys
 * (`collectSeparatedListWireKeyTypes`), plus `$other` and `$span` (both read
 * directly by `_hasSeparatorFlank` / `_separatorKindOf`, and neither
 * declared on `T.<TypeName>` — that interface is the public, de-hoisted
 * surface; `$other`/`$span` are raw-wire-only). All added members are
 * optional, so real `T.<TypeName>` values remain assignable at existing
 * call sites (no cast needed there).
 */
```

### `packages/codegen/src/emitters/wrap.ts::emitSeparatedListWrap`

```text
/**
 * Emit a wrap function for a `'list'`-classified kind — REAL per-instance
 * separator capture, reading `AssembledList`'s own `elements`/
 * `separatorRule`/`leadingDelimiter`/`trailingDelimiter` directly rather
 * than the generic `.slots` surface, for wrap.ts specifically.
 * factories.ts (`emitSeparatedListFactory`) and from.ts
 * (`emitSeparatedListFrom`) have their own analogous dedicated emission,
 * reading the same real fields directly; render-module.ts's template
 * rendering still goes through the generic `.slots` surface
 * (which `AssembledList` genuinely inherits from `AbstractAssembledCompound`,
 * not a stub) because template rendering is generically slot-based by
 * design, consulting `AssembledList`'s own separator facts only for
 * delimiter emission specifics.
 *
 * Field derivation, verified against real generated grammar output
 * (`probe-kind` on python's `with_clause_bare` / `expression_statement_tuple`
 * / `lambda_parameters` and typescript's `object_type_content_comma` /
 * `object_type_content_semi` — the only 5 real `'list'` kinds
 * across all 3 grammars as of this task):
 *
 * - `_content`: the elements array. The wire has NO `_content` key —
 *   the native reader buckets unnamed repeated children by their CONCRETE
 *   kind (`data._with_item`, `data._identifier`, ...; see
 *   `collectSeparatedListContentStorageKeys`). Populated via the same
 *   `resolveSlotDrillExprs` a real repeated field uses, just targeting a
 *   fixed output key instead of the kind-projected name.
 *
 * - `_leading_sep` / `_trailing_sep`: whether an optional flank separator
 *   is present in THIS instance, verified against real
 *   `object_type_content_comma`/`_semi` payloads (the one real case where
 *   BOTH `leadingMode` and `trailingMode` are simultaneously `'optional'`)
 *   and all 3 python kinds. See the emitted `_hasSeparatorFlank` runtime
 *   helper's own doc comment (below, in the generated-boilerplate section
 *   of this file) for the full span-comparison rationale and the
 *   text-collapsed-content fallback's documented ambiguity guard — kept in
 *   one place since that's what a maintainer debugging generated output
 *   actually sees.
 *
 * - `_separator_kind`: only emitted when `separatorRule` is a nonterminal
 *   (Task 2). UNVERIFIED against real wire data — no real grammar kind in
 *   any of the 3 grammars currently has a nonterminal separator (all 5
 *   real `'list'` kinds have a literal `,` separator with
 *   `separatorRule === undefined`). Implemented via the SAME `$other`
 *   kind-id scan `readTerminalFromOther` already performs for kindEnum
 *   reclamation (option B) — reused, not reinvented — but this specific
 *   path has no real-grammar coverage yet.
 */
```

#### body

```text
// Bug B fix (separator-as-slot follow-up): a 'list' kind's elements do
// NOT always all bucket under one generic "content" name — `node.slots`
// (the SAME source `types.ts` derives `T.<TypeName>`'s
// declared members from) is the model's OWN name for the real slot(s),
// e.g. `_pattern`/`_parameters`/`_use_clause`/`_where_predicate` — NOT
// always `_content`. Hardcoding `_content` here (independent of
// `node.slots`) made anything whose real slot name differs throw a hard
// "Missing field" at render time (or silently happen to coincide with
// `_content` by luck, e.g. `tuple_pattern_group1`'s unnamed-CHOICE
// element). `_content` (the local var below) remains an INTERNAL bucket
// used only to feed `_hasSeparatorFlank`/`_separatorKindOf` (which need
// the full element list's span boundaries, not any one field's subset);
// it is no longer emitted as a storage key or accessor name itself.
//
// Single-field kinds (the common case: one field spans the whole element
// union) rename the emitted property/accessor to the model's real slot
// name. Multi-field kinds (e.g. a dict-pattern-shaped 'list' kind whose
// elements route to more than one real slot by kind) route EACH field
// through the exact same per-field drilling logic
// `emitFieldCarryingWrap` uses (`emitFieldStorageLines`/
// `emitFieldAccessorLines`) instead of one shared bucket.
```

#### body

```text
// `node.slots` is the SAME source `types.ts`
// derives `T.<TypeName>`'s declared members from — the canonical-key
// exclusion set for `collectSeparatedListWireKeyTypes` must match it
// exactly, or a still-declared key gets redundantly (and incoherently)
// re-widened.
```

#### body

```text
// Multi-field kinds (see doc comment above) route each field through
// emitFieldStorageLines/emitFieldAccessorLines separately — `_content`
// here is ONLY the internal `_hasSeparatorFlank`/`_separatorKindOf`
// probe bucket, never a real storage key or accessor. Its candidate
// keys can span more than one field's element type (e.g. TypeScript's
// enum_body_elements mixes PropertyName-kind and EnumAssignment-kind
// keys), which don't share a common generic T.
```

#### body

```text
// Same consumed-key omission as `emitFieldCarryingWrap` (shared via
// `computeConsumedCandidateKeys`) — a raw kind-keyed wire stub any real
// field's `??`-chain consumed (single-field: `canonical`/`_content`'s own
// source keys; multi-field: each of `node.slots`) must not survive on
// the spread base, or it wins the validator's deep-walk dedupe over the
// canonical `_<name>` key it was folded into (see `_omitWrapKeys`).
```

#### body

```text
// The delimiter bitflag (leading = 1, trailing = 2) is the single wire
// key for the list's optional-flank state — one fact, one key, matching
// the options-struct design. Only grammar-optional sides contribute
// bits; mandatory flanks are template text and never captured.
```

#### body

```text
// Match `emitFieldAccessorLines`' convention (`f.propertyName`, camelCase):
// `canonical.name` is the raw storage-level slot name (snake_case for
// kind-derived slots, e.g. `attributed_parameter`). An accessor emitted
// under that raw name is invisible to consumers that derive the
// expected accessor name via camelCase projection (e.g. the validator's
// `accessorCandidatesForStorageKey`), which then silently falls back to
// the raw, undrilled `_<kind>` storage value instead of calling this
// method — a materialization gap for `'list'`-classified content accessors.
```

### `packages/codegen/src/emitters/wrap.ts::computeCollidedReclaimKinds`

```text
/**
 * Option-B reclamation collision guard. Across a kind's kindEnum slots, find
 * member kinds claimed by more than one slot — a `$other` token of that kind
 * would be ambiguous between them. Warn and return the colliding set so the
 * caller can SUPPRESS the auto-reclaim for those members (they fall back to
 * normal field population / explicit fielding — option C).
 */
```

### `packages/codegen/src/emitters/wrap.ts::emitFieldStorageLines`

```text
/**
 * Emit per-field `_<name>: <storeExpr>,` storage assignments for `fields`,
 * reusing the exact same per-field kindEnum/verbatim/alias/candidate-
 * storage-key drilling logic regardless of which caller's kind classifies as
 * (`'branch'`/`'envelope'`/`'polymorph'` via `emitFieldCarryingWrap`, or a
 * MULTI-field `'list'` via `emitSeparatedListWrap` — e.g. a `'list'` kind
 * whose elements route to more than one real slot by kind, not one shared
 * bucket). Extracted so both callers share ONE source for this drilling
 * decision tree instead of two copies drifting apart.
 */
```

#### body

```text
// Option-B reclamation guard (pre-pass): each kindEnum slot reclaims its
// member tokens from `$other` by kindId. If two kindEnum slots on THIS kind
// claim the same member kind, a `$other` token is ambiguous between them (the
// `??` fallback would award it to whichever slot is read first). Detect such
// members up front, warn, and SUPPRESS the auto-reclaim for them — those slots
// fall back to normal field population / explicit fielding (option C).
```

#### body

```text
// f IS AssembledNonterminal — read getters directly (DRY: single source for arity/storageKey).
```

#### body

```text
// For kind-origin slots whose values reference one or more concrete
// kinds (possibly via a supertype), the native reader populates
// `_<concrete_kind>` not `_<slot.name>`. Probe each concrete key.
```

#### body

```text
// Option B: for kindEnum slots, build the numeric-kindId list for the
// `$other` reclamation fallback (anonymous discriminant tokens). Only
// catalog-resolvable members (real parser symbols) can appear in $other.
```

### `packages/codegen/src/emitters/wrap.ts::emitFieldAccessorLines`

```text
/**
 * Emit per-field `<propName>() { ... },` inline accessor methods for
 * `fields` — the accessor-side counterpart to `emitFieldStorageLines`,
 * shared for the same reason (branch/group AND multi-field separatedList
 * both need identical per-field drilling for their accessors).
 */
```

### `packages/codegen/src/emitters/wrap.ts::emitInlineWithProperty`

```text
/**
 * Emit the inline `$with: { ... }` property for a wrap function literal.
 *
 * Container-shape nodes with a real unnamed-children wire slot (`children`
 * non-empty) emit `$other`/`$child` lambdas calling the rest-param factory.
 * `node.childSurface` alone is NOT sufficient to pick that path — it
 * describes the factory's own calling convention, and under the unified-slot
 * model an unnamed slot lives in `fields` with a real `_<name>` storage key,
 * not in `$other`. All other nodes (including childSurface spread/direct
 * nodes whose unnamed slot is a `fields` entry) fall through to the
 * per-field setters below, which build a lazy config and call the factory
 * with a patched value at the field's real storage key.
 *
 * @param lines - Output line buffer to append to.
 * @param node - The assembled node descriptor.
 * @param slots - The node's slots; unnamed ones are already unified in.
 * @param children - Always `[]` from both call sites.
 */
```

#### body

```text
// An edited node is re-spelled by its template, so the text captured from
// the source it was read out of no longer describes it. Dropping `$text`
// here records that at the edit, which is the only place that knows it
// happened — leaving it in storage would force every downstream consumer
// to guess whether the text is still current. Leaves take the empty
// `$with` path above and keep their `$text`, which is their only content.
```

#### body

```text
// A SETTER DOES NOT COERCE. It takes the slot's own type and stores it.
// Coercion belongs to construction: a caller who wants it reaches for the
// constructor that does it — `node.$with.name(ir.identifier('run'))` — which
// is one composition longer and says exactly what it converts. Routing the
// setter through the field resolver instead would make the same key mean
// different things on a built node and a parsed one, which is the drift
// this rule exists to prevent.
```

#### body

```text
// Named after the slot, like every other setter — inside `$with` every
// key IS a slot name, so a sigil there would mark the namespace twice.
// The model names an unnamed slot too, falling back to `content` and
// pluralising it when the slot is repeated.
```

#### body

```text
// Field-carrying: $with setters spread `data` + patch the target
// `_<name>` key, then re-wrap — producing another fluent wrapped node
// with drill-in support (not a raw factory node). Typed params align
// with the factory version's setter signatures.
```

#### body

```text
// A repeated field keeps its rest-parameter calling convention; the
// element type is the storage element, since the setter stores what
// it is given.
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
	 * Kind names synthesized by evaluate's inline-alias-source pass
	 * (`synthesizeInlineAliasSources`). These have no parser symbol by design;
	 * warn and skip, same treatment as inline-list kinds.
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

```text
/**
	 * Polymorph variant discriminators. For each polymorph parent kind a
	 * descriptor telling `nodeToConfig` how to stamp `$variant` on the
	 * derived config.
	 *
	 *   source='override' — variant inferred from the first named child's
	 *     kind. The `childKind` map is `<parent_childKind>: <variantName>`.
	 *   source='promoted' — variant inferred from field-presence. The
	 *     `fields` map is `<variantName>: [<fieldPropertyName>...]`
	 *     (match if every listed field is present on the config).
	 *
	 * The dispatcher's switch on `config.$variant` expects the tag to be
	 * present; validators and legacy readNode→factory paths use this map
	 * to derive it from the parsed tree.
	 */
```

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

### `packages/codegen/src/emitters/render-module-runner.ts::jinjaTemplates`

```text
/** Pre-computed jinja templates. When omitted, a fresh TemplateEmitter drives the loop. */
```

### `packages/codegen/src/emitters/render-module.ts::Grammar`

```text
/** Grammars the emitter supports. Matches the three per-grammar packages. */
```

### `packages/codegen/src/emitters/render-module.ts::RustRenderModuleEmit`

```text
/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
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

### `packages/codegen/src/emitters/render-module.ts::templatesRs`

```text
/** `rust/crates/sittir-{lang}/src/render/templates.rs` — per-kind Template structs */
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
	 *  Used by ListNonterminalView emission so each list-multiplicity slot
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
	 * When set, the render fn emits a match on the backing helper field
	 * and then accesses the inner field (`v.<name>`). If the inner field
	 * is itself `Option<T>` (`backingInnerRequired = false`), a nested
	 * match is required to flatten it.
	 */
```

### `packages/codegen/src/emitters/render-module.ts::backingInnerRequired`

```text
/**
	 * True when the inner field (`v.<name>` inside the group-lift helper)
	 * is a required (non-Option) transport — Renderable::Transport(inner)
	 * can be used directly.
	 * False when the inner field is itself Option<T> — a nested match is
	 * needed: `match &v.<name> { Some(inner) => Present(inner), None => Missing }`.
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
/** True when the transport struct actually has a `children` field (structuralChildren.length > 0).
	 *  The template may reference `children` (hasChildren === true) without a transport field —
	 *  in that case we emit an empty ListNonterminalView instead of accessing node.children. */
```

### `packages/codegen/src/emitters/render-module.ts::childrenRequired`

```text
/** True when the transport struct's `children` field is `Vec<...>` (not `Option<Vec<...>>`). */
```

### `packages/codegen/src/emitters/render-module.ts::childrenMultiple`

```text
/** True when the transport struct's `children` field is `Vec<T>` (multiple elements possible).
	 *  When false, the field is scalar: `T` (required) or `Option<T>` (optional). */
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
	 * here (unlike a hidden hidden-rule alias, which `nodeMap.aliasedHiddenKinds`
	 * already covers) — so the runtime kind id for the ALIAS TARGET
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

### `packages/codegen/src/emitters/render-module.ts::TransportMetadataField`

```text
/**
 * Single source of truth for transport struct metadata fields.
 * Every transport struct (branch, leaf, polymorph) carries these
 * metadata fields. All emission helpers that produce struct field
 * declarations, `None` initialisers, `obj.get(...)` reads, or
 * `transport.<field>` bridge accesses derive from this array.
 *
 * @remarks
 * `jsName` is the `$`-prefixed JS property name on the wire.
 * `rustName` is the Rust struct field name.
 * `rustType` is the Rust type for the struct field declaration.
 * `bridgeMap` (optional) is an inline `.map(...)` transformation
 * applied when reading the field value in the transport-to-NodeData
 * bridge function. When absent the field is passed through directly.
 * `needsExplicitTypeAnnotation` flags fields whose `obj.get(...)` call
 * in the manual `FromNapiValue` impl requires a leading type annotation
 * (e.g. `let x: Option<Foo> = obj.get(...)?;`).
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
 * Emitters that decide which terminal aliases / Tree interfaces to emit
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

### `packages/codegen/src/emitters/template-hash.ts::TemplateFile`

```text
/**
 * Input to `computeTemplateBundleHash`. One entry per `.jinja` file
 * in the grammar's templates directory.
 */
```

### `packages/codegen/src/emitters/template-hash.ts::filename`

```text
/**
	 * Template filename, without the directory prefix (e.g.
	 * `function_item.jinja`). Used only as the per-entry framing
	 * label; the same template under two different filenames hashes
	 * differently.
	 */
```

### `packages/codegen/src/emitters/template-hash.ts::content`

```text
/**
	 * Template body. Line endings will be CRLF → LF normalized before
	 * hashing, so the caller needn't pre-normalize.
	 */
```

### `packages/codegen/src/emitters/templates.ts::isWordChar`

```text
/** Grammar-faithful word-class test for a single char (ASCII table from
	 *  wordCharAsciiTable + Unicode-alphanumeric fallback). Used for
	 *  compile-time STATIC-STATIC seam spaces; dynamic seams belong to the
	 *  runtime SpacingWriter with the same class. */
```

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
	 * DIAGNOSTIC (`DBG_SLOT_MISS=1`): the kind currently being emitted, threaded
	 * by `emitOne` so `lookupSlot` can attribute a `slotByRuleId` miss to a kind.
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

### `packages/codegen/src/emitters/test.ts::expectTestFailures`

```text
/**
	 * Kind → reason for known-failing tests (`expectTestFailures:` in the
	 * grammar's grammar.sittir.ts). Listed kinds emit `describe.skip` with the
	 * reason inline so the suite stays green on tracked defects without
	 * masking regressions in other kinds.
	 */
```

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

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * per-kind wrap functions stamp `$type: TSKindId.X` to convert the string
	 * from core's readNode to the numeric runtime discriminant. When absent,
	 * $type is inherited from data (string passthrough — legacy mode).
	 */
```

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
	 * Kind names synthesized by evaluate's inline-alias-source pass. No parser
	 * symbol by design; warn and skip.
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

### `packages/codegen/src/emitters/wrap.ts::ResolveSlotDrillConfig`

```text
/**
 * Resolve the drill-in expression for a field storage assignment.
 * Returns the raw-field read expression AND the inline accessor body.
 *
 * @param f - The assembled nonterminal field descriptor.
 * @param nodeMap - The assembled node map, needed to derive the per-field
 *   element type for generic type arguments on drill helpers.
 * @returns An object with `storeExpr` (storage init from `data` via
 *   `readRawField` — bridges the `AnyNodeData` type which doesn't
 *   declare per-kind `_<name>` properties) and `accessorBody` (reads
 *   `this._<name>` directly — the literal declares the property so
 *   TS resolves it from the inferred literal type).
 */
```

### `packages/codegen/src/emitters/wrap.ts::candidateStorageKeys`

```text
/**
	 * Optional list of concrete `_<kind>` storage keys to probe in lieu of
	 * the slot's nominal single key. When set, the storeExpr becomes a
	 * `??`-coalesce chain over these keys. See `collectConcreteStorageKeys`.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::reclaimKindIdsExpr`

```text
/**
	 * Pre-built numeric-kindId array expression (e.g. `[TSKindId.DotDotEq,
	 * TSKindId.DotDot]`) for a kindEnum slot's member discriminants. Drives the
	 * `$other` reclamation fallback (option B). Built by the caller, which holds
	 * `nodeMap` + `kindEntries` for `kindDiscriminantExpr` resolution.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::kindEnumTextIdPairs`

```text
/**
	 * Stamped text→member-kindId pairs for a kindEnum slot (see
	 * `kindEnumTextIdPairs`, shared.ts). Baked into `projectKindEnumStorage`'s
	 * call so wrapper-materialized enum reads project to NUMERIC member ids on
	 * the wire (id-first contract) instead of raw text.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::forceUnknownElement`

```text
/**
	 * Emit `normalizeRepeatedWrapSlot<unknown>`/`normalizeSingularWrapSlot<unknown>`
	 * with an EXPLICIT type argument instead of leaving `T` to be inferred from
	 * `reclaimedStoreExpr`. For a multi-field `AssembledList`
	 * (`emitSeparatedListWrap`'s `_content` local — see its doc comment), the
	 * probe combines candidate storage keys from MORE THAN ONE real slot (e.g.
	 * TypeScript's `enum_body_group1`: `PropertyName`-kind keys AND a
	 * `EnumAssignment`-kind key), which don't share a common element type.
	 * `_content` there is consumed only by `_hasSeparatorFlank`/
	 * `_separatorKindOf` (both take `readonly unknown[]`), never stored or
	 * exposed as a typed accessor — so forcing `T = unknown` is the correct
	 * type, not a type-hole cast: it matches what the value is actually used
	 * for, rather than masking a real mismatch.
	 */
```

### `packages/codegen/src/emitters/wrap.ts::computeCollidedReclaimKinds`

```text
/**
 * Emit a per-kind wrap function using shape A:
 * inline object literal with `_<name>` storage, method shorthand accessors,
 * inline `$with` property, wrapped by `withMethods<T>`.
 *
 * No `Object.defineProperty`, no `freezeNodeData`, no `Record<string,unknown>` casts.
 *
 * @param node - The assembled node descriptor (kind, typeName, rawFactoryName).
 * @param fields - Named field slots for this node.
 * @param children - Unnamed child slots for this node.
 * @param kindEntries - KindEnumEntry list for numeric `$type` stamping; undefined for legacy.
 * @param nodeMap - The assembled node map (for kindIdMemberName).
 * @returns Emitted TypeScript source string for the wrap function.
 */
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
	 * branch. After the isNodeData identity quick-return at resolver entry,
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
/** Methods on the `is` / `assert` namespaces beyond per-kind entries. */
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

### `packages/codegen/src/emitters/render-module.ts::RENDERABLE_PREFIX`

```text
/**
 * Fully-qualified prefix for the core `Renderable` enum.
 *
 * This module defines a local `pub enum Renderable` (Text+Joined) that
 * shadows `sittir_core::filters::Renderable` (Text+Joined+Transport).
 * The typed dispatch path constructs `::sittir_core::filters::Renderable::Transport`
 * values that feed into `ListNonterminalView.items`, so the full path is
 * required to avoid resolving to the wrong local type.
 */
```

### `packages/codegen/src/emitters/render-module.ts::collectFromSlots`

```text
/** Accumulate supertype names from a single node's slots — named and
	 *  unnamed flow through one path (cleanup-rules §E1). */
```

### `packages/codegen/src/emitters/render-module.ts::TRANSPORT_METADATA_FIELDS`

```text
/**
 * Metadata fields shared by all transport structs.
 *
 * `transport_text` is intentionally absent — it is present on branch
 * transport structs (which always include it) but NOT on leaf structs
 * (which use a plain `text: String` field instead). It is added
 * conditionally by `renderTransportMetadataFields`.
 */
```

#### body

```text
// $nodeHandle (u32) + $childIndex (u16) replace $nodeId. napi-rs 3 passes
// these as f64 from JS; converted at the transport boundary.
```

### `packages/codegen/src/emitters/render-module.ts::TRANSPORT_TEXT_FIELD`

```text
/**
 * The `transport_text` field, conditional on branch structs. Kept
 * separate from `TRANSPORT_METADATA_FIELDS` because leaf structs use
 * a plain `text: String` instead.
 */
```

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

### `packages/codegen/src/emitters/templates.ts::DEFAULT_JOIN_SEPARATOR`

```text
/**
 * Default join separator when the grammar didn't capture an explicit
 * separator literal. SpacingWriter first consumer (2026-07-24 spec):
 * empty — the render-time writer inserts a space exactly where a
 * word-class char would collide with a word-class char, so unseparated
 * lists no longer need a simulated style space. This is what lets a
 * statement list whose items self-terminate (';', visible `newline` /
 * `automatic_semicolon` nodes rendering '\n') join without planting
 * line-leading whitespace after the terminator — a python indentation
 * error under the old ' ' default. Grammar-captured separators
 * (ruleSep / per-value separators) are real tokens and unaffected.
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

### `packages/codegen/src/emitters/wrap.ts::expandToConcreteParseKinds`

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

### `packages/codegen/src/emitters/transport-common.ts::addVisibleAliasNameOfHiddenKind`

A hidden kind that is also the CONTENT of a named alias
(`alias(symbol(_X), $.visible)`) shares its runtime kind id with that alias's
visible name. The generated id catalog (`KIND_NAMES`, see `emitters/types.ts`)
records the id under the VISIBLE name, not the raw hidden kind key — so without
adding the alias target, `kindIdByKind.get(kind)` misses on the hidden key
entirely and the id arm silently drops.

### `emitIs` — numeric `$type` guard bodies (`packages/codegen/src/emitters/is.ts`)

All producers emit a numeric `$type`, so the emitted guards compare numeric
`TSKindId` values only. The one exception is the legacy path taken when
`generatedIdTables` is absent — unit-test callers that bypass the full codegen
pipeline — which falls back to string equality.

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
// polymorph). Leaves / keywords / enums use shape guards
// (isNode / isTree) instead; tokens, groups, multi, and
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
// Kind-named asserts (e.g. `assert.functionItem`) use the method name
// as the expected-type label. The generic `assert.kind(v, k)` uses the
// second argument `k` as the expected-type label instead — otherwise
// the error message would say `expected 'kind'`, which is useless.
```

#### body

```text
// Build assert entries by wrapping each is entry. Keys must match
// is's exactly.
```

#### body

```text
// isNode accepts string | number $type: hidden/synthetic kinds (e.g. "_suite")
// have no parser.c entry and emit string $type; AnyNodeData.$type: string | number.
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

Per-package `vitest.config.ts`: test include/env plus a `resolve.alias` block mapping every `@sittir/*` entry to its sibling `src/` — package-scoped test runs (and the examples they import) resolve to source, never to a stale `dist/` build, mirroring the root config and the workspace `paths`.

### `packages/codegen/src/emitters/is.ts::module`

```text
/**
 * Emits is.ts — per-grammar type guards.
 *
 * Three surfaces per grammar:
 *   - `is`     — per-kind guards keyed by camelCase kind name, a generic
 *                inverse `is.kind(v, k)`, and supertype guards
 *                (narrow the `type` discriminant). A slot or supertype
 *                union may contain keyword members stored as bare kind
 *                ids, so every guard accepts `{ $type } | number`: a
 *                per-kind guard is false for a bare id (a keyword kind is
 *                never a node) and narrows the object arms only, `_sg`
 *                tests the id directly, and `isNode` is false for a bare
 *                id.
 *   - `isTree` / `isNode` — shape guards with overloaded signatures that
 *                narrow through NamespaceMap when the kind is known or
 *                fall back to AnyTreeNode / AnyNodeData when it isn't.
 *   - `assert` — mirror of `is` with `asserts v is T` signatures, throws
 *                TypeError on mismatch. Runtime wraps `is` — no
 *                duplicated kind-check logic.
 *
 * Composition: `is.kind × shape = concrete type`. Inside
 * `if (is.functionItem(v) && isTree(v))`, `v` narrows to
 * `NamespaceMap['function_item']['Tree']` = `FunctionItem.Tree`.
 *
 * See `specs/008-factory-ergonomic-cleanup/contracts/is-guards.md`
 * for the full contract.
 */
```

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
 *  supertype chain) when that target stores as its id — else `undefined`.
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

### `packages/codegen/src/emitters/shared.ts::classifyFieldStorageInfo`

One encoding per slot, derived from its arms' stamped storage. Presence slots come first (`keywordPresenceKind`: boolean / bitflag). Otherwise: a slot whose arms are all `kindId` / `literal` / enum classifies `kindEnum` (whole-slot id storage); a slot mixing those with `node` arms classifies `mixedEnum` — `kindId` arms seat as ids, `node` arms as nodes, and a genuinely anonymous `literal` arm (no kind at all) seats as its quoted text: it contributes to `texts` but not `enumKinds`, so the text→id table has no row for it and `coerceMixedEnumStorage` passes it through unchanged. `enumKinds` / `texts` / `enumKindsById` describe only the fixed-text arms. `verbatim` survives only for a slot with no kind-bearing arm at all (nothing to seat as an id), an enum arm with a single value or no resolved member kinds, and a keyword reference with no wire identity. There is no longer an escape from `mixedEnum` back to text for layout literals, visible keyword references, or named-owner terminals: a keyword kind stores as its id everywhere, and the two ambiguities that escape used to dodge — an identifier spelled like a soft keyword (`type`), and whitespace-only layout tokens beside nodes — are answered by the coercion table (a string matching a fixed-text arm IS that arm) and measured by `validate:native`, not by a second encoding.

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

### `packages/codegen/src/emitters/shared.ts::kindEnumAltIdPairs`

```text
/**
 * For each fixed-text arm of an id-storing slot, the OTHER identities a
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
 * kind no parse can produce (typescript `_kw_static_marker` id vs the anon
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
 * Identical-char pairs are deliberately excluded: a real doubled-char
 * token (rust's `>>`) only exists with its own disambiguation context in
 * the grammar (nested-generic `>` `>` re-lexes correctly), and spacing
 * every repeated symbol char would make already-common constructs noisy
 * for no correctness gain — same exemption the SpacingWriter's seam check
 * applies.
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
 *   4. Per-form Config/Tree aliases (polymorph forms only — base-kind
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

### `packages/codegen/src/emitters/types.ts::emitTypes`

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
// 1b. Delimiter — separated-list optional-flank bitflag members. Values
// serialize compiler/model DelimiterFlags (one source, one derivation);
// factories/wrap/from reference the members instead of raw numbers.
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
// 4. Per-form Config/Tree aliases (polymorph forms only)
// Polymorph forms have no flat `${typeName}Config` alias — consumers
// (factories + dispatchers) reference `ConfigOf<T.${typeName}>` directly,
// which picks up the polymorph-variant hoist via the generic in
```

#### body

```text
// Tree interfaces
```

#### body

```text
// refine() per-form Tree aliases — one per form per refined kind.
// Tree shape is identical across forms (refine narrows choice
// selections at the Config/factory surface, not the parse shape),
// so each alias just points at the base kind's Tree type. Emitting
// the alias lets method return types (e.g. `curly().methodFoo()`)
// name a form-specific Tree at compile time when needed.
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
//   1. interface <TypeName>Ns extends NodeNs<<TypeName>, LeafScalarMap, LeafStringMap> {}
//   2. an entry in NamespaceMap keyed by the kind string
//   3. namespace sugar: `export namespace <TypeName> { Config; Fluent; Loose; Tree; Kind; }`
//      — declaration-merges with the data interface so consumers can
//      write `<TypeName>.Config` alongside using `<TypeName>` as a type.
//
// Generic accessors `ConfigFor<K>` / `BuiltFor<K>` / `LooseFor<K>` /
// `TreeFor<K>` resolve via NamespaceMap for code parametric over kinds.
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
// emitted body. Always-used: NodeData/NodeConfig/TreeNode/NodeKind/NodeNs/
// AnyTreeNodeOf/Terminal/NonEmptyArray/BooleanKeyword. Optional: ConfigOf
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
// Phase 2: emit `_<name>: T` storage + `<name>(): T` accessor function
// types at the top level instead of the old `$fields: { name: T }` nested
// wrapper. FieldsOf<T> in @sittir/types now extracts _-prefixed keys and
// strips the underscore prefix for ConfigOf/RuntimeNodeOf derivations.
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

### `packages/codegen/src/emitters/template-hash.ts::module`

```text
/**
 * SHA-256 template-bundle hash — FR-020 mechanism that detects drift
 * between the TS-side `.jinja` templates and the Rust engine baked
 * against them.
 *
 * Spec 012 T014. Unit-tested in `template-hash.test.ts`.
 *
 * The hash is baked into two artifacts during codegen:
 *   - `rust/crates/sittir-{lang}/src/render/hash.rs` — `pub const
 *     TEMPLATE_BUNDLE_HASH: &str = "…";` (T016)
 *   - `packages/{lang}/src/hash.ts` — `export const
 *     TEMPLATE_BUNDLE_HASH = "…";` (T016)
 *
 * At runtime the JS backend shim compares the hash baked into the
 * native `.node` artifact (via the Rust const) against the hash
 * exported from the TS package. Mismatch triggers silent fallback to
 * the TS engine with `reason: "hash mismatch"` surfaced via
 * `getActiveBackend()`.
 *
 * ## Determinism
 *
 * The function is pure — given the same file list + contents, it
 * produces byte-identical hex output. Three normalizations keep it
 * deterministic:
 *
 *   1. File order — filenames sorted lexicographically before
 *      concatenation. Insulates against filesystem enumeration order.
 *   2. Line endings — CRLF normalized to LF before hashing. Git
 *      autocrlf on Windows checkouts won't change the hash.
 *   3. Framing — each `{filename}\0{content}\0` separator keeps
 *      `["a.jinja":"b"]` distinguishable from `["a.jinjab", ""]`.
 *
 * Byte-for-byte content changes (including whitespace) DO change the
 * hash by design — template edits must force a Rust rebuild.
 */
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
 * These emitted files are the canonical authored templates under
 * `packages/{lang}/templates/`. The native Askama copies under
 * `rust/crates/sittir-{lang}/templates/` are derived later by
 * `cli.ts` from this source of truth; never edit those copies by hand.
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
 */
```

### `packages/codegen/src/emitters/templates.ts::SeamCensusSummary`

```text
/** Per-grammar census of template-boundary seam resolutions — the
 *  static-seam-resolution spec's residue report. */
```

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
// field, e.g. `readonly_marker` at three positions of
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

### `packages/codegen/src/emitters/templates.ts::SlotLookupMiss`

```text
// ---------------------------------------------------------------------------
// DIAGNOSTIC: slotByRuleId-miss inventory (env-gated via `DBG_SLOT_MISS=1`).
//
// Records every rule where the primary O(1) `slotByRuleId.get(rule.id)` lookup
// FAILED (no id, or id not registered), plus whether a name-based fallback
// recovered it. `recoveredBy: 'none'` is the bug class — the emitter then falls
// back to the arm/symbol name (e.g. choice `parameter` instead of slot
// `content`), producing a `.jinja` var with no matching transport field.
// Surfaces the rule-ID-not-preserved gap so it can be fixed at the source.
// ---------------------------------------------------------------------------
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

### `packages/codegen/src/emitters/templates.ts::seamNeedsSpace`

```text
/**
 * The SpacingWriter's word-seam law over edge CLASSES: a space is owed
 * exactly where word-class text meets word-class text. The one seam
 * decision shared by every static bake — fixed×fixed (classes of the
 * concrete chars) and tag boundaries (classes derived per kind) — so a
 * baked outcome can never disagree with the runtime writer's.
 * Punctuation merge-hazard pairs are decided from concrete characters
 * (`isLiteralMergePair`), never from classes, and are layered on by the
 * caller where characters are known.
 */
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

### `packages/codegen/src/emitters/templates.ts::ownerSlotsFor`

```text
/** The owner's slots keyed by name for `lookupSlot`'s fallbacks. */
```

### `packages/codegen/src/emitters/templates.ts::emitOne`

#### body

```text
// currentKind always populated — the seam census attributes every
// boundary to its owning kind (was DBG_SLOT_MISS-gated).
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
// carries a single `rule` whose Jinja shape is fully captured by `emitRule`.
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
// Walks a RenderRule subtree producing Jinja directly, in a single pass.
//
// Per PR1 design:
// - Reads PR0-enriched attributes (`fieldName`, `multiplicity`, `nonterminal`,
//   `separator`) directly from the rule.
// - Looks up slot facts (propertyName / storageName / paramName) via
//   `ctx.nodeMap.slotByRuleId.get(rule.id)` rather than re-deriving from
//   names.
// - Returns Jinja text (`{{ name }}`, `{% if name | isPresent %}…{% endif %}`,
//   `{{ items | join("…") }}`) — no `$NAME` placeholders, no translation
//   pass downstream.
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
// An INDENT member marks where this seq's content steps to a new
// depth (e.g. `_suite_block_with_indent` = seq(INDENT, block),
// `_match_block_block` = seq(INDENT, repeat(_statement), DEDENT)).
// Everything from right after it to the end of THIS seq's members
// is wrapped in an Askama `{% filter indent(...) %}` block, so the
// indent width is a property of the WRAPPING template text, not
// render-time state — nested INDENT sites each add their own
// `{% filter %}` layer, composing depth automatically through
// ordinary template nesting. A trailing DEDENT's own bare '\n'
// (see the INDENT/DEDENT/NEWLINE case above) rides inside the same
// wrapped span as the last line's terminator, so it never gets a
// spurious trailing prefix.
```

#### body

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
// The filter-wrapped indent seam is per-instance by
// construction (indented content) — the true residue; count
// it so the census hides nothing.
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
// INDENT/DEDENT are structural whitespace tokens tree-sitter never
// gives real bytes to — they only mark WHERE a depth transition
// happens. The actual indent WIDTH is applied by the SEQ case above,
// which wraps everything after an INDENT member in an Askama
// `{% filter indent(...) %}` block. Askama's `indent` filter
// composes correctly for nested depth via ordinary template
// nesting (each nested `{% filter indent %}` block adds its own
// width on top of whatever already passes through it) with no
// render-time counter needed.
//
// INDENT contributes the bare newline the indented content needs
// before its first line. Emitted as an EXPRESSION (`{{ "\n" }}`),
// not raw template text: a kind whose own SEQ starts with INDENT
// (e.g. `_suite_block_with_indent`) has this newline as the
// literal FIRST character of its compiled template body, directly
// adjacent to the `{#- @generated ... -#}` header comment every
// template carries — and `-#}`'s whitespace trim eats ALL adjacent
// literal whitespace (not just one line), silently deleting a bare
// '\n' there. An expression tag is not whitespace, so the trim
// stops at its opening `{{` and the newline survives.
```

#### body

```text
// DEDENT contributes NOTHING: in this grammar, INDENT/DEDENT only
// ever wrap a repeat of `_statement`-typed content, and every
// `_statement` shape already self-terminates with its own trailing
// newline (`_simple_statements.jinja` ends `{{ newline }}`; a
// compound statement's own suite ends the same way, transitively,
// via ITS block's DEDENT). A separate DEDENT newline here would
// duplicate that — invisibly, when the block is the very end of a
// rendered document (trimmed by the root render call), but as a
// spurious blank line whenever something follows.
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

### `packages/codegen/src/emitters/templates.ts::staticListInterior`

```text
/**
 * The SpacingWriter's seam law — `word_seam(l, r) ∨ (l ≠ r ∧
 * literal_merge_pair(l, r))`, same word table, same pair table, including
 * the identical-char exclusion (see `spacing.rs::write_str`) — applied
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

### `packages/codegen/src/emitters/templates.ts::isTagBalanced`

```text
// True when the fragment can stand alone as a template: it never closes an
// `{% if %}` it didn't open, and closes every one it did.
```

### `packages/codegen/src/emitters/templates.ts::commonBalancedTrailingTail`

```text
// Longest common trailing suffix across all bodies, trimmed forward to the
// earliest `{{`/`{%` boundary from which the fragment is tag-balanced —
// i.e. the largest shared tail that can be lifted out of every body and
// emitted as a standalone template fragment.
```

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
// (never gate on a name absent from the transport struct — an
// Askama compile error):
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
/** Split an arm body into pure self-gated slot units
 *  (`{% if <name> | isPresent %}{{ <name> }}{% endif %}` chunks, with the
 *  gate key and the referenced slot identical); null if anything else —
 *  literal text, ungated refs, joins, nested gates — appears. */
```

#### body

```text
// A bare ungated scalar ref is also a unit — an arm whose sole member is
// required WITHIN the arm emits it ungated (the arm's own optionality
// lived on the choice). Flat emission drops arm exclusivity, so the
// unit gets the standard presence gate here (identical output for a
// present slot).
```

### `packages/codegen/src/emitters/templates.ts::escapeRegex`

```text
// ---------------------------------------------------------------------------
// Slot-preservation gate
//
// The correctness invariant for emitted templates is structural, not
// byte-level: each declared slot for a kind must appear at least once in
// the emitter's output.
//
// Set SITTIR_SLOT_PRESERVATION=0 to bypass for survey / iteration mode.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/client-utils.ts::buildTriviaParamType`

```text
/** The parameter type of a grammar's `$trivia`: one of the grammar's trivia
 *  kinds (its `trivia` role, e.g. `Comment`), or a bare string, or the
 *  `{ leading, trailing }` object of the same. A string is verbatim text —
 *  trivia lives outside the node model, so its literal form needs no kind —
 *  and the render engine already takes it as such: every trivia entry
 *  crosses as a `SlotValue<TriviaTransport>`, whose decoder turns a JS
 *  string into `SlotValue::Verbatim`. The type only had to stop forbidding
 *  what the transport accepted. */
```

### `packages/codegen/src/emitters/client-utils.ts::module`

```text
/**
 * Emits utils.ts — typed facade over `@sittir/common/utils` with grammar-local narrowing.
 * Runtime behavior lives in `@sittir/common/utils`; this module only projects local types.
 */
```

### `packages/codegen/src/emitters/client-utils.ts::emitAttachProps`

Emits `attachProps` (property definition on a function — used by the coerce module's helpers), `ArgsOf<F>` (a function's argument tuple, covering the readonly-rest signatures `Parameters` degrades to `never` on — the overlay wire types and any future consumer use this, never bare `Parameters`, for factory references), the `FlavorPair`/`bundle` pair constructor, and `hoist` (wraps a pair as a callable — coerce flavor when present, strict otherwise — copying every prop and recursively hoisting nested pairs; `Hoisted<B>` carries the exact surface). Bundling and hoisting are dynamic because they are uniform across all kinds; everything per-kind is emitted statically.

### `packages/codegen/src/emitters/client-utils.ts::emitIsNodeData`

```text
/** The kind-parameterised overload's predicate is `Extract<Node,
 *  AnyNodeData>`, not `Node`: `NamespaceMap` carries keyword kinds whose
 *  `Node` is the bare id, and an id is never NodeData — with the plain
 *  `Node` the overload's predicate union contained numbers and stopped
 *  narrowing ids away in every `coerceTo*` `isNodeData(input)` check. */
```

### `packages/codegen/src/emitters/client-utils.ts::emitNodeGuards`

#### body

```text
// `NamespaceMap` is keyed by the kind id, so `kind` IS the discriminant —
// no runtime name lookup stands between the argument and the comparison.
// The predicate intersects with AnyNodeData for the same reason as
// `isNodeData`'s kinded overload: a keyword kind's `Node` is its id.
```

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

### `packages/codegen/src/emitters/node-model.ts::serializeSlot`

#### body

```text
/* kinds: derived from values via kindsOf(), not read from a stored
		   cache. */
```

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

### `packages/codegen/src/emitters/grammar.ts::module`

```text
/**
 * Emits a `grammar.ts` file containing a TypeScript type literal
 * derived from tree-sitter's node-types.json.
 */
```

### `packages/codegen/src/emitters/index-file.ts::module`

```text
/**
 * Emits index.ts — barrel re-exports.
 * Consumes NodeMap directly. Static output — doesn't depend on node list.
 */
```

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
 *  fixed text and resolved symbol when that target stores as its id
 *  (a keyword or fixed-text token, reached through a single-subtype
 *  supertype chain), else `undefined` — one storage read, no
 *  hidden-prefix or class test. */
```

### `packages/codegen/src/emitters/transport-projection.ts::isConcreteTransportNode`

#### body

```text
/* 'list' shares 'branch's transport-concreteness — see
		   isSlotBearingCompound's doc comment (shared.ts). */
```

### `packages/codegen/src/emitters/transport-projection.ts::collectTransportLiterals`

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

```text
/**
 * Emits consts.ts — discoverable arrays and maps from the grammar.
 *
 * Consumes NodeMap directly. No imports from node-model.ts or naming.ts.
 */
```

### `packages/codegen/src/emitters/consts.ts::emitConsts`

```text
// non-hoisted branch/envelope/polymorph + list
```

```text
// leaf + keyword + enum
```

```text
// AssembledKeyword (alphabetic tokens — modelType 'token', word: true)
```

```text
// AssembledToken (non-alphabetic — modelType 'token', word: false)
```

#### body

```text
// 'list' shares 'branch's consts emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

#### body

```text
// supertype, group — not in any public const array
```

#### body

```text
// NODE_KINDS / LEAF_KINDS are unexported locals: ALL_KINDS (their
// union) and the derived type aliases are the public surface.
```

#### body

```text
// OPERATORS — JSON.stringify to safely handle quotes/backslashes/newlines
```

#### body

```text
// Note: `AnyOperator` (not `Operator`) to avoid collision with concrete
// grammar terminal types named `_operator` that `types.ts` exports.
```

#### body

```text
// TSKindId's key universe MUST be the full parser-symbol catalog —
// the same source `collectKindEntries` feeds every other runtime
// dispatch surface from (see collectCatalogKinds' doc: TSKindId /
// kindIdFromName / kind_ids.rs / AnyTransport "MUST share the same
// kind universe"). The previous nodeMap-derived name list could
// never contain collision-disambiguated catalog keys (rust's
// `anon_block` — the fragment-specifier keyword whose text collides
// with the `block` rule), so emitters resolving those entries
// (findKindEntryForLiteral, #129) referenced TSKindId members that
// were never emitted. Fall back to the old list only when no id
// catalog exists (legacy callers).
```

#### body

```text
// Emit the type alias only once per unique name — hidden kinds like
// `_accessibility_modifier` and their visible counterparts like
// `accessibility_modifier` resolve to the same PascalCase type name.
// Emitting both would produce a duplicate identifier TS2300 error.
```

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

### `packages/codegen/src/emitters/render-module-runner.ts::module`

```text
/**
 * render-module-runner.ts — thin adapter that drives the class-based
 * RenderModuleEmitter contract for scripts and focused unit tests.
 *
 * Using this adapter instead of calling emitRenderModuleBundle directly
 * ensures scripts and tests exercise the same emitter contract as emitAll().
 */
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

### `packages/codegen/src/emitters/factories.ts::slotStorageFromValueExpr`

#### body

```text
// The storage type the node interface declares for this slot
// (types.ts: a kind-enum member id, or an array of them).
```

### `packages/codegen/src/emitters/factories.ts::slotStorageExpr`

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

### `packages/codegen/src/emitters/factories.ts::fieldElementType`

#### body

```text
// Missing kind — factories can't register for stub emission
// (types.ts owns that side). Fall back to the `T.` prefix so
// the reference at least links against whatever stub types.ts
// emits for its own missing kind.
```

### `packages/codegen/src/emitters/factories.ts::delimiterMembersFor`

```text
/** The `delimiter` bitflag members the grammar permits a caller to select
 *  (leading = 1, trailing = 2, both = 3); empty when neither flank is
 *  optional. ONE derivation for both the factory option's union type and
 *  the from() coercer's runtime narrowing guard. */
```

### `packages/codegen/src/emitters/factories.ts::delimiterUnionFor`

```text
/** The `delimiter` option's type for a list with these flank modes. */
```

### `packages/codegen/src/emitters/factories.ts::FactoryParam`

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
// (`T.X.Loose['key']`) would reach through its NodeData passthrough
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

### `packages/codegen/src/emitters/factories.ts::constructorSurface`

```text
/** The parameters a form constructor declares for `kind` and how it
 *  forwards them — the target factory's own surface.
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
 * resolve lazily. The `<Kind>Ns` row passes `<Kind>.Built` /
 * `<Kind>.BuildArgs` / `<Kind>.LooseArgs` by NAME: a base-type argument is
 * resolved eagerly, and an inline tuple whose `LooseValue<…>` walks
 * `NamespaceMap[arm]` for a union containing the kind itself reaches the
 * row being declared (TS2310). And the tuples themselves spell the config
 * as `ConfigOf<T.<Kind>>` / `LooseConfigOf<…> | T.<Kind>` rather than
 * `<Kind>.Config` / `<Kind>.Loose` (`rowStrictType` / `rowLooseType` on the
 * factory param), because those namespace members are projections OF the
 * row. The setter record's `T.<Kind>.Built` is also what keeps declaration
 * emit finite: an inferred recursive `$with` closure blows the serializer
 * (TS7056) and the package cannot publish types. And a separated list's
 * tuples spell a non-empty element list as `[element: E, ...elements: E[]]`
 * (`elementsTuple`), never as `[...elements: NonEmptyArray<E>]`: a variadic
 * spread of an alias makes the whole tuple alias resolve eagerly, and the
 * loose element's widening walks each element kind's bare slot straight back
 * into the list's own row while that row's base types are still resolving
 * (TS2310). A rest element that is an array type keeps the alias deferred.
 *
 * `buildArgs` names THE CANONICAL CALL SHAPE — the one signature the kind is
 * built through — not the full public overload set, which a tuple cannot
 * represent. Two kinds carry an extra overload the tuple deliberately does
 * not describe: a forwarded wrapper also accepts its target's constructor
 * arguments, and a separated list also accepts a leading options bag. Both
 * are sugar over the canonical shape, and both are what makes
 * `Parameters<typeof build<Kind>>` pick the wrong signature — which is why
 * the tuple is derived from the factory shape, never from the function.
 * `looseArgs` is the same arity and the same labels with every parameter
 * widened to what a coercing caller may pass.
 */
```

### `packages/codegen/src/emitters/factories.ts::elementsTuple`

```text
/** A separated list's `BuildArgs` / `LooseArgs` tuple for one element type:
 *  a rest of that element, preceded by one required element when the list
 *  is non-empty. The same call shape as the builder's `NonEmptyArray<E>`
 *  rest parameter, spelled so the tuple alias stays a deferred type
 *  reference — see the cycle rules on {@link BuiltTypeSurface}. */
```

### `packages/codegen/src/emitters/factories.ts::builtTypeSurfaceOf`

```text
/** The one derivation of a kind's {@link BuiltTypeSurface}, by factory
 *  shape: a separated list, a slot-bearing compound (config, direct or
 *  spread convention), or a text-constructible leaf. Keyword kinds have no
 *  surface here — their `Built` is the id (`KeywordNs`). The types emitter
 *  calls it for every namespace row; the factory emitter no longer emits
 *  the aliases it used to, it annotates each builder with `T.<Kind>.Built`
 *  and lets the types emitter define it. */
```

### `packages/codegen/src/emitters/factories.ts::refineFormBuiltTypeSurfaceOf`

```text
/** The {@link BuiltTypeSurface} of one refine form: the parent's interface
 *  with setters for every non-narrowed slot, self-referencing
 *  `T.<Kind>.<Form>.Built`, and the form's own `config` tuple. */
```

### `packages/codegen/src/emitters/factories.ts::setterTypeMember`

```text
/** One `$with` setter's type member: a rest signature for a verbatim
 *  multi-valued slot, else a single `value` whose type indexes the kind's
 *  config type by the slot's config key. */
```

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

### `packages/codegen/src/emitters/factories.ts::TextFactoryNode`

```text
// ---------------------------------------------------------------------------
// Text factory (leaves, keywords, enums)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/factories.ts::emitKindIdFactory`

```text
/** The factory of a kind stored as its id (a keyword): a zero-arg function
 *  returning the id — there is no node to build, the identity is the value.
 *  The name stays `build<Kind>` so call sites and the `BuildArgs` /
 *  `LooseArgs` (both `[]`) surface are unchanged from the node-returning
 *  form it replaces. The return type is written out as the member itself:
 *  an inferred return of an enum member widens to the whole enum, which
 *  would drop the id out of every slot union it belongs to. */
```


### `packages/codegen/src/emitters/factories.ts::kindDiscriminantType`

```text
/** A kind's `$type` discriminant spelled as a TYPE: the `TSKindId` member
 *  when the parser issued an id, else the kind's string literal. The same
 *  text is a valid expression, which is what lets a kind-id factory annotate
 *  and return one spelling. */
```
### `packages/codegen/src/emitters/factories.ts::emitTextFactory`

#### body

```text
// Emit numeric TSKindId discriminant for leaf / keyword /
// enum nodes, matching the AnyNodeData.$type: number contract. Falls back to
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
// NodeData passthrough and return the child unchanged.
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

### `packages/codegen/src/emitters/test.ts::soleSlotDummyKind`

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
// the factory's real signature expects full NodeData for this slot, not
// a type tag.
```

### `packages/codegen/src/emitters/test.ts::emitChildrenTest`

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
/** A keyword kind's factory returns its kind id — there is no node, so the
 *  only fact to pin is the id itself. */
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
// the Config surface, not a NodeData / array. Pre-empt the generic
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

### `packages/codegen/src/emitters/ir.ts::isFlatLeafOrKeyword`

```text
/** Does this keyword / pattern / enum kind get a flat `ir.<irKey>` entry —
 *  visible, not inlined, with a factory, a legal identifier for a key and a
 *  catalog id? One predicate for the pre-pass that maps flat keys to their
 *  factory references and for the two emission loops, so a group can learn
 *  whether it shares its name with a kind by the same rule that would have
 *  surfaced that kind. */
```

### `packages/codegen/src/emitters/ir.ts::emitIr`

A supertype group whose name is also a kind's flat key (typescript's
`identifier` supertype over `identifier | undefined`) is emitted as that
kind's callable with the group members attached — `attachProps(F.buildIdentifier,
{ … })` typed `typeof F.buildIdentifier & { … }` — so `ir.identifier('x')` and
`ir.identifier.identifier('x')` both work. Before, the flat entry simply
yielded to the group and the kind became uncallable from `ir`. `attachProps`
mutating the factory export is the same pattern the coercing bundles use
for `.strict`.

The `ir` namespace's node-factory members come from `bundleEntries` — the same SSOT the bundle module and the overlay wire map consume — so `ir`, the bundles, and `keyByKind` can never disagree on which kinds are surfaced or under what key. Aliased-hidden kinds therefore appear in `ir` under their visible-style keys the moment they qualify for a bundle; `ir` adds only the group-name dedupe on top. Keyword and leaf members keep their own loops (leaves have no coercers, so no bundle entry exists to consume).

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

### `packages/codegen/src/emitters/ir.ts::GROUP_TOKEN_SYNONYMS`

```text
/** Kind-name tokens that mean the same thing as a token in a group's name.
 *  A grammar spells the category one way in the group and another in the
 *  kinds themselves — rust groups `declaration_statement` over members named
 *  `function_item`, `struct_item`. */
```

### `packages/codegen/src/emitters/ir.ts::CATEGORY_TOKENS`

```text
/** Tokens naming a syntactic CATEGORY rather than the construct itself.
 *  Only these may be dropped from a member's tail, and only when the group's
 *  own name did not already account for a token. `line_comment` keeps
 *  `comment` because a comment is the construct, not a category. */
```

### `packages/codegen/src/emitters/ir.ts::emitSynonymBoolean`

#### body

```text
// Strategy 1: single leaf/enum factory that accepts text (e.g., booleanLiteral('true' | 'false'))
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
 * _resolveMany, _resolveLeafString, _resolveByKind, _resolveScalar).
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
 *  `AnyNodeData` is unconditional (every leaf-registry entry names it); the
 *  rest depend on per-kind emission decisions made long after the preamble
 *  is written, so `finalize` prunes whichever the body never mentions. */
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

### `packages/codegen/src/emitters/from.ts::emitBranchNodeDataPassthrough`

#### body

```text
// Phrased as a negated type predicate rather than `if (isNodeData(input))`
// so the checker narrows the REMAINDER of the body to the config arm.
// A plain `isNodeData` early-return does not: negative narrowing drops a
// union constituent only when it is a strict subtype of the guard type,
// and `AnyNodeData`'s optional members defeat that for every generated
// kind interface — leaving the interface's accessor signatures in the
// type of every `input.<field>` read below.
```

### `packages/codegen/src/emitters/from.ts::ChildrenFromNode`

```text
// ---------------------------------------------------------------------------
// Container from() — accepts element args OR a self NodeData
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::ChildrenFromNode.childSlotFacts`

```text
// The container's classified sole user slot (soleSlotFacts) —
// its `storageName` drives the `_<name>` data key we read here. Computed
// by the caller from the full node; not derivable from `slots` alone.
```

### `packages/codegen/src/emitters/from.ts::looseElementType`

```text
/**
 * The accepted per-element input union for a container's `from()` rest
 * parameter: the strict element type, widened by `string` when every kind
 * the slot accepts is leaf-shaped — the resolver coerces loose text into
 * the leaf node exactly as a named config field would.
 */
```

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
// Leaf / enum from() — `string | NodeData` passthrough
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/from.ts::emitStringLikeFrom`

#### body

```text
// `isNodeData` does not negative-narrow `Terminal<K, V>` out of the
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
// zero-arg factory's id. The parameter exists only to type the surface.
// ---------------------------------------------------------------------------
```

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

### `packages/codegen/src/emitters/from.ts::isLeafRegistryKind`

Whether a kind has a row in `_leafRegistry` — a visible pattern, enum or
keyword with a raw factory. Shared with `buildLeafRegistryEntries` so the
predicate that fills the registry and the one that asks whether a bare string
can reach it cannot drift.

### `packages/codegen/src/emitters/from.ts::defaultArmKindOf`

The storage kind of the slot value an author marked `arm.default`, or
`undefined`. The fact rides the value bag next to `variant`/`variantOf`
(`armFactsOf`); this is its only reader. Two flagged arms on one slot is an
authoring error and throws here rather than emitting an arbitrary winner.

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

### `packages/codegen/src/emitters/from.ts::emitResolverHelpers`

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
// Gap 4: NodeData pass-through if $type matches; wrap as single child
// when it doesn't and target kind supports children. `altKinds` carries
// the slot's OTHER union members (anonymous tokens the resolver
// classification has no factory dispatch for, e.g. mod_item.content's
// `';'` external form) — a NodeData already matching one is a VALID
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
// bitflags the `_bf` helper stamps the NodeData container. The
// resolver layer only has to refuse the leaf-registry path so a
// `true` input doesn't get misrouted through `_resolveScalar` into
// a `boolean_literal` factory call.
```

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

```text
/**
 * Emits wrap.ts — de-hoisted lazy view layer over readNode output.
 *
 * Mirrors the factory emitter (factories.ts) shape A one-for-one:
 *   - `_<name>` storage keys (enumerable, serializable stubs from readNode de-hoisted output)
 *   - Inline method shorthand `name()` accessors that perform lazy drill-in
 *   - Inline `$with` property that calls the factory for updates
 *   - `withMethods<T>` from per-grammar `./utils.js` wraps the literal
 *   - No `Object.defineProperty`, no `freezeNodeData`, no `Record<string,unknown>` casts
 *
 * Consumes NodeMap directly. No routing-map / override-field-promotion
 * emission — the compiled override grammar bakes all field() placements
 * into the tree-sitter parser, so tree-sitter's native
 * `fieldNameForChild` is the single source of truth at runtime.
 */
```

```text
/**
 * Taxonomy-keyed wrap dispatch namespace.
 *
 * Callers provide the output buffer per run so collection state stays
 * instance-local instead of living in module globals.
 */
```

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

### `packages/codegen/src/emitters/wrap.ts::renameUnusedTreeParam`

```text
// ---------------------------------------------------------------------------
// Namespace — taxonomy-keyed wrap dispatch API
// ---------------------------------------------------------------------------
```

```text
// A wrap body with nothing to drill never reads `tree` — rename the param
// so the generated package lints clean.
```

### `packages/codegen/src/emitters/wrap.ts::WrapNode`

```text
// ---------------------------------------------------------------------------
// Field-carrying wrap — shape A inline literal + withMethods<T>
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/wrap.ts::ResolveSlotDrillConfig.elidedSeparatorIdsExpr`

```text
// Elidable separated-list slot (`hasOptionalElements`): emitted expression
// for the separator's numeric kind id(s). Presence selects the
// position-splitting store path over filter+normalize.
```

### `packages/codegen/src/emitters/wrap.ts::resolveSlotDrillExprs`

#### body

```text
// Both id-storing projections take the slot's text→stored-id map and, when
// any fixed-text arm has an alternate parse identity
// (`kindEnumAltIdPairs`), an alt-id→stored-id map. A bare id or a node whose
// `$type` is an alternate folds onto the stored id (the grammar type id)
// BEFORE the by-text / by-value match, so the transport only ever receives
// the identity its slot enum carries.
```

#### body

```text
// Elidable separated-list positions (array elision, `[a, , b]`): the raw
// wire array interleaves element entries with the separator's numeric kind
// id. Segment on those delimiters — one position per segment, an empty
// segment stores `undefined` — instead of filtering the numerics away
// (which collapses `[a, , b]` and `[a, b]` into identical storage).
```

#### body

```text
// $other reclamation (option B): a kindEnum slot's value is a terminal
// discriminant (operator / keyword). When that token is anonymous and
// unfielded, read_node forwards it to `$other`, not `_<kind>` storage, so
// the nominal `??`-chain comes up empty. Append a final fallback that
// reclaims it from `$other` by numeric kindId (`config.reclaimKindIdsExpr`,
// the kindEnum member discriminants). When the token IS field-tagged the
// chain short-circuits and the fallback is inert.
```

#### body

```text
// Id-first wire contract: bake the slot's STAMPED text→member-id map
// into the call so a wrapper-materialized enum (`{ $type: <wrapper id>,
// $text: "private" }`) projects to the member's numeric kind id — the
// same stamped ids the render-side enum arms accept — instead of raw
// text. Text survives only as the fallback for unstamped members.
```

### `packages/codegen/src/emitters/wrap.ts::SAFE_IDENT_KEY`

```text
// `_<ident>` where ident is a valid JS identifier suffix. Keys outside this
// shape must be accessed via bracket notation. Tree-sitter exposes some kinds
// as literal token strings (`'`, `$`, `.`), which become storage keys like
// `_'` / `_$` / `_.` — all valid object keys but invalid dotted accessors.
```

### `packages/codegen/src/emitters/wrap.ts::resolveSlotStoreExpr`

#### body

```text
// Probe the slot's own canonical storage key WITH PRIORITY over the
// concrete-kind candidate keys, rather than as a final fallback. On a
// genuinely fresh wire read the reader never populates the canonical
// key (only the concrete-kind-keyed candidates), so this is a no-op for
// that case. But `$with` setters re-invoke the wrap function via
// `{ ...data, [storageKey]: v }` (see `emitInlineWithProperty`), which
// spreads the ORIGINAL data — carrying the stale candidate-key values
// from the original read — alongside the newly patched canonical key.
// Probing candidates first would mask the patched value entirely
// (singular: the stale `??` operand wins) or merge stale-and-patched
// (repeated: concat includes both) — the canonical key must win
// outright once populated. Exclude it from the candidate list itself
// so it isn't probed twice.
```

#### body

```text
// Repeated supertype-list slot: the runtime reader populates EACH
// concrete-kind wire field as a separate array (e.g. `_primitive_type:
// ["i32"]`, `_type_identifier: ["String"]`). A ??-coalesce returns
// only the first non-null source, dropping the rest.
// Concatenate ALL source arrays instead, preserving child order
// (each kind-keyed array is already in source order; cross-kind
// ordering within a single slot relies on child position in the CST,
// which the reader preserves within each kind bucket — interleaved
// ordering across kinds is not guaranteed, but all elements are kept).
//
// Each wire field may be a scalar value (text-collapsed leaf, e.g.
// "i32" for primitive_type) OR an array of node stubs. The native
// reader buckets by kind, so a plain declaration-order concat
// interleaves cross-kind members wrongly (e.g. an object_type's
// `call_signature` + `property_signature` swap). `_concatInSourceOrder`
// normalizes each source (via _toArr) and STABLE-sorts the result by
// CST position (`$span.start` / `$childIndex`) to restore source order.
//
// The canonical key, once populated by a `$with` setter, is
// authoritative on its own — normalize it (scalar-or-array, via the
// same `_toArr` the concat path uses) rather than merging it into
// the candidate concat.
// Pair each candidate storage key with its read-route name (the
// storage key minus the `_` prefix — the same name the reader
// records in `$slotOrder`), so `_interleaveBySlotOrder` can walk
// the parent's stamped document order with per-bucket cursors.
```

#### body

```text
// See resolveSlotDrillExprs's ResolveSlotDrillConfig.forceUnknownElement
// doc comment: a multi-field AssembledList's internal
// `_content` probe can combine candidate keys from more than one real
// slot with no common element type — `_interleaveBySlotOrder`'s own
// generic inference (independent of the outer normalizeRepeatedWrapSlot
// call) needs the same explicit widening, or it silently picks one
// candidate's type and rejects the others.
```

#### body

```text
// Singular slot: exactly one of these will be populated on a fresh
// read; the canonical key wins outright once a `$with` setter patches it.
```

### `packages/codegen/src/emitters/wrap.ts::emitTransparentSupertypeWrap`

#### body

```text
// A member stored as its kind id (a keyword member of the union) has no
// children to filter and nothing to drill: it is already the value the
// wrapper would return, so it passes through before any `$other` probe.
```

#### body

```text
// `data.$other` flows through the generic `_filterWrapChildrenByKind<T>` /
// `normalizeSingularWrapSlot<T>` helpers into an explicit
// `drillIn<T.${typeName}>(...)` check below — the inferred `T` must stay
// exactly `T.${typeName}` (the supertype's own member union), or the
// explicit generic argument mismatches. Array-inclusive: the wire may
// deliver the single member wrapped in a 1-element array.
```

#### body

```text
// A VISIBLE occurrence of this supertype (enrich-minted alias node)
// carries its member child under a kind-keyed `_<childKind>` property
// (reader kind-named slots) — probe those first; `$other` covers the
// legacy bucketed shape.
```

#### body

```text
// The native reader collapses a node whose children are ALL
// anonymous tokens (no named member — e.g. this supertype's visible
// occurrence wrapping a bare punctuation/lifetime token like `'`)
// into a text-only leaf: no kind-keyed child, no `$other` bucket to
// drill into. The occurrence itself already carries the leaf's own
// `$text`/`$span`/`$type` — exactly the bare-leaf shape the
// transport side already accepts for such members — so treat the
// node itself as the resolved member instead of requiring a named
// child that will never surface.
```

### `packages/codegen/src/emitters/wrap.ts::isFieldBackedSeparatedList`

```text
// A 'list'-classified kind's content position is genuinely field-backed when
// wrapper-deletion stamped a `fieldName` directly onto its simplified rule
// (carried down from the REPEAT wrapper it deleted — see
// `compiler/model/node-map.ts`'s `AssembledList` doc comment).
// That's a real tree-sitter `field()` the native reader always populates —
// confirmed empirically (a fielded list kind's canonical storage key is
// present on every genuine parse) — as opposed to a kind
// classified purely by structural shape (`isSeparatedListShape`,
// compiler/assemble.ts) with no grammar-level field backing it, where the
// canonical key is a compiler-only abstraction and the candidate-kind-bucket
// keys below are the ONLY thing a fresh read ever populates. Conflating the
// two (dropping candidates whenever there's a "single" canonical slot,
// regardless of whether it's a real field) breaks the many 'list'-classified
// kinds that fall in the second bucket — verified the hard way.
```

### `packages/codegen/src/emitters/wrap.ts::elidedSeparatorIdsExprOf`

```text
/**
 * Emitted `[<sep kind id>, …]` expression for an elidable separated-list
 * slot (`hasOptionalElements`), or undefined for every other slot. Throws
 * (via `kindDiscriminantExprForLiteral`) when the separator literal has no
 * catalog kind id — the splitter cannot recognize delimiters without one,
 * and silently falling back would collapse holes.
 */
```

### `packages/codegen/src/emitters/wrap.ts::wrapsAnonLiteralContent`

```text
// The `_isReadTextLeaf` pass-through applies only to kinds that declare
// ANONYMOUS LITERAL TOKENS as legitimate slot content (e.g. python
// `string_content`, whose content union includes bare `'\\'` escape
// tokens, with implicit text gaps between them that only the leaf's
// verbatim `$text` carries). For every other kind an all-anon-children
// occurrence is genuinely EMPTY structure (an empty `{}` block, `()`
// arguments) whose declared slot keys are a load-bearing wrap contract —
// pass-through there breaks required-slot drills and from() field
// comparison.
```

### `packages/codegen/src/emitters/wrap.ts::wrapTextLeafTypeStamp`

```text
// `$type` restamp for the `_isReadTextLeaf` pass-through — same numeric
// TSKindId discriminant the structural body stamps, so leaf pass-through
// and structural output dispatch identically downstream.
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
// Object.defineProperty, no freezeNodeData, no Record<string,unknown> cast.
//
// When $with setters are present, we hoist the literal to `const _node`
// so the closures inside $with can reference it (arrow functions capture
// the variable by reference; _node is initialized before any setter runs).
```

#### body

```text
// Consumed candidate keys: concrete kind-keyed wire keys any field's
// `??`-chain reads (collectConcreteStorageKeys) that are NOT some field's
// own canonical storageKey. Omit them from the spread base so the wrapped
// object carries exactly ONE copy of each child — the canonical `_<name>`
// assignment below — never a raw un-dispatched shadow stub (see
// `_omitWrapKeys`' doc comment).
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
// Unnamed children slot -- pass through from data (stubs; drilled lazily by consumer).
// $other is a $-prefixed metadata key, not a _<name> storage key, so
// $other doesn't have the `_` prefix convention — access via data.$other
// which AnyNodeData declares as `readonly NodeMemberValue[] | undefined`.
```

#### body

```text
// Inline method shorthand accessors: `name()` returns drilled value via `this._<name>`.
```

#### body

```text
// $with — calls the corresponding factory for update operations.
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
	 *  root kind's wrap-table row intersected with `@sittir/common`'s
	 *  `ParsedRoot`: the reader stamps `$span` and the captured `$text` on a
	 *  whole-source parse's root (required there, optional on every other read
	 *  node), and `wrapNode`'s typed overload keeps whichever of those members
	 *  its input declares — the wrap spreads the data it is given — so
	 *  `engine.parse()` reaches this alias without a cast. */
```

### `packages/codegen/src/emitters/wrap.ts::WrapEmitter.finalize`

#### body

```text
// `wrapNode`'s unknown-kind fallback (below) always calls
// `_drillUnknownKindChildren`, which unconditionally uses both — so
// these must be `true` regardless of what `bodySource` (the per-kind
// wrap functions) itself references.
```

#### body

```text
// `_separatorKindOf` calls `readTerminalFromOther`, so emit it whenever either is used.
```

#### body

```text
// `splitElidedWrapSlot` calls `_filterWrapChildrenByKind` per segment.
```

#### body

```text
// `_interleaveBySlotOrder` falls back to `_concatInSourceOrder` (and both
// call `_toArr`), so emit each helper whenever a caller above it is used.
```

#### body

```text
// A reference site can materialize the enum choice as its OWN
// wrapper node (a dedicated kind_id distinct from any member
// literal's id, carrying which member matched only in `$text`
// — e.g. TS `method_definition._accessibility_modifier` reads
// `{ $type: <wrapper kind>, $text: "private" }`, not the bare
// `private` keyword's own id). `$type` alone can't disambiguate
// that case. Id-first contract: resolve the text through the
// slot's STAMPED text→member-id map (baked at codegen time) so
// the wire carries the same numeric ids the render-side enum
// arms accept; raw text survives only as the fallback for
// members with no stamped id (mixed literal/external members —
// the render-side string branch still accepts those). The bare
// `$type` id passes through for the direct, already-flattened
// keyword-literal case. A bare string (not object-wrapped) is
// read_node\'s raw-read shape for a NAMED fixed-text keyword
// leaf (e.g. rust\'s mutable_specifier: "mut") — map it the
// same way before falling through to the object-shaped checks.',
```

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

#### body

```text
// Structural type — some leaf kinds (enrich-minted markers,
// alias-reached members) have no exported interface.
```

#### body

```text
// Kind-id → wrapped-surface map: `wrapNode` on a `$type`-narrowed
// input (an `is.*` guard) resolves to that kind's wrap return —
// no caller-side cast. Rows mirror _wrapTable's claims exactly.
```

#### body

```text
// Kinds absent from the NodeMap entirely (no `_wrapTable` entry — e.g.
// python's `case_pattern_group1`, a hidden alias-mint wrapper the
// grammar produces but our model doesn't represent) have no dedicated
// wrap function to drill into their own kind-named-slot children.
// `read_node.rs`'s one-level read (`read_children` / `read_child_stub`)
// leaves an unlabeled named child with sub-structure as a shallow stub
// (`$nodeHandle`/`$childIndex`, no fields of its own) — normally a
// generated wrap function's `drillIn` call materializes it fully via
// `readTreeNode`. With no such function for the PARENT kind, nothing
// ever calls `drillIn` on the stub, so it reaches the native
// transport deserializer still shallow — and the child's OWN
// transport struct then fails, missing every one of its real fields
// (confirmed via `tool probe-kind`: python's `case_pattern` → `content`
// → `_dotted_name` arrives as `{$type, $text, $span, ...}` only, no
// `_identifier`, because `case_pattern_group1` triggers exactly this
// fallback). Drill in every `_`-prefixed property here — mirrors
// `_firstKindKeyedWrapChild`'s kind-named-slot convention above, just
// applied unconditionally instead of gated to one matching kind.
```

#### body

```text
// Public entry points
```

#### body

```text
// T-based with an indexed `$type` access — a guard-narrowed
// intersection (`Statement & { $type: TSKindId.FunctionItem }`)
// REDUCES under indexed access, where a bare `{ $type: K }`
// inference site would union every constituent's discriminant.
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
// Record whether the inner field is required (non-Option) or
// itself optional (Option<T>). Required inner fields can be
// referenced directly as `Renderable::Transport(&v.<name>)`;
// optional inner fields need a nested match to flatten the Option.
```

#### body

```text
// The CST reader (native side) exposes the inner field directly
// at the parent level (e.g. `_value` on const_item, not wrapped
// inside `_const_item_optional1`). Record the inner storageName
// so the struct emitter can add a direct fallback field AND the
// render fn can try it first (before the helper path).
```

### `packages/codegen/src/emitters/render-module.ts::renderStructDefs`

#### body

```text
// A fully-static template (every slot determined) has no borrowed
// fields — an unused lifetime parameter is a hard rustc error (E0392).
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
// Build kind entries for numeric dispatch when parser.c metadata is available.
// Source from the catalog superset (children-only kinds + anon tokens) so the
// AnyTransport dispatch matches the TS-side TSKindId / kindIdFromName universe.
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
// supertype's `subtypeParseNames`, but the id must also be accepted by the
// STORAGE supertype's OWN enum — a delegated decode
// (`ExpressionTransport` 432-arm → `ExpressionExceptRangeTransport`) hands
// the same napi value down, so the inner enum sees the alias id too.
// Collect globally (the pair never lives on the storage supertype itself).
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
// Typed dispatch: render_transport_dispatch + per-kind render_<kind>_transport fns.
// These are emitted AFTER renderGrammarRenderable() so Renderable::Node is in scope,
// and BEFORE renderTransportEntry() so render_transport can call render_transport_dispatch.
```

### `packages/codegen/src/emitters/render-module.ts::boxedInEnum`

#### body

```text
// All transport enum variants are now inline. Box decisions moved to
// the slot-field level (see `rustTransportSlotType` — singular slots
// whose admit-set intersects parentKind's SCC get `Box<T>` at the
// source of the back-edge). This keeps enums uniformly small in stack
// frames and pushes the heap-indirection cost to the exact field that
// creates the size cycle, not every variant of the enum.
```

### `packages/codegen/src/emitters/render-module.ts::aliasLeafTrialOrder`

```text
/** Leaf modelTypes an alias occurrence can scalar-collapse into — the trial
 *  set for {@link emitAliasUnwrapRecurseArm}, text-validated enums first. */
```

### `packages/codegen/src/emitters/render-module.ts::supertypeClosureOf`

```text
/** The supertype closure of `kinds`: every kind reachable by walking
 *  supertype subtype lists transitively (the kinds themselves included). */
```

### `packages/codegen/src/emitters/render-module.ts::emitSupertypeTransportEnum`

#### body

```text
// SCC-driven Box rule. Box only when the variant kind and the
// supertype's owner kind are in the same SCC of the singular-
// reference graph (see `boxedInEnum` docstring). Leaf-like
// variants (pattern / keyword / token / enum) are always inline.
```

#### body

```text
// Self-alias / reserved-supertype kind_id: parser sent the supertype's
// own kind_id rather than a concrete variant's. We don't know which
// variant — try each in turn. Pattern/keyword/token/enum leaves have
// safe FromNapiValue impls; branches/groups are skipped here unless
// leafOnly=false because their impls can match coerced inputs greedily.
```

#### body

```text
// Enum declaration — Debug + Clone only; no serde, no napi object derive.
```

#### body

```text
// Build kind_id match arms shared between the raw-u16 input shape and
// the object-with-$type input shape. Self-alias and suppressed-supertype
// kind_ids fall back to emitDecodeTrials (we don't statically know which
// variant the parser meant).
```

#### body

```text
// Parse-aliases of THIS supertype itself: a mint arm
// (`alias($._expression_except_range, $.expression_group1)`) makes
// the hidden supertype VISIBLE at that position, so runtime nodes
// arrive under the alias occurrence's own id (`alias_sym_*`). The
// grammar-agnostic reader stores such a node's single unlabeled
// child under a kind-keyed slot (`{ $type: <aliasId>,
// _<childKind>: <child> }` — read_node.rs kind-named-slot routing),
// so no variant struct can decode the wrapper directly (decode
// trials would probe the wrong object). Unwrap the kind-keyed slot
// and re-dispatch Self on the concrete child, which carries its own
// `$type`.
```

#### body

```text
// Owner-kind / supertype-membership ids stay name-resolved (spec §2.3
// keep-list); enum member ids are stamped facts. Aliased arm:
// `parseNames.get(subKind)` also accepts the parse name's id — the
// alias occurrence's own runtime symbol (`alias_sym_*`), the id
// tree-sitter actually emits at that arm's position.
```

#### body

```text
// Fallback: no kindEntries — emit an always-error FromNapiValue stub.
```

#### body

```text
// Stub ToNapiValue — supertype transport is receive-only (JS → Rust).
```

#### body

```text
// Box<EnumName> napi-trait impls. Required because `Box-at-back-edge`
// slot typing in rustTransportSlotType emits `Box<EnumName>` as a struct
// field type whenever an enum-typed slot closes a singular size cycle.
```

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
// RenderableTransport for the supertype enum — delegates to the per-supertype
// render helper (declared later by emitSupertypeRenderHelper; forward fn
// references are fine at Rust module scope).
```

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

### `packages/codegen/src/emitters/render-module.ts::DBG_KINDID_FASTPATH`

```text
// ---------------------------------------------------------------------------
// Fast-path coverage (env-gated via `DBG_KINDID_FASTPATH=1`): tallies how
// often `resolveLiteralKindId`/`resolveAcceptedTransportIds` are satisfied by
// their link-time mint-stamp fast path versus falling through to the
// name/text derivation chains. The fallback chains stay load-bearing (not
// every kind routes through the catalog yet) — this is measurement only.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/emitters/render-module.ts::registerKindIdFastPathDump`

#### body

```text
// `process.stderr.write` isn't guaranteed to flush from an `exit`
// listener when stderr is an async pipe (as in CI) — Node only
// permits synchronous work during `exit`, so a buffered async write
// can be silently truncated or dropped. `writeSync` bypasses the
// stream's buffering entirely.
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
 * what the transport struct emits (Vec<...> vs Option<Vec<...>>, Box<...>
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
 * and an unexpanded read stub all arrive as text), so the carrier can only
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
// Enum modelType: emit a Rust enum type with FromNapiValue / Display / RenderableTransport.
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportDataStruct`

#### body

```text
// Branch/envelope/polymorph/list/enum use #[napi(object)] for derived
// FromNapiValue. Leaf/keyword/token transport structs opt out of
// #[napi(object)] and instead get manual cfg-gated FromNapiValue impls
// below — so JS can send a plain string in release mode (no debug-transport)
// and the full metadata object in debug mode.
```

#### body

```text
// 'list' shares 'branch's transport struct field emission — see
// isSlotBearingCompound's doc comment, shared.ts.
```

#### body

```text
// Per cleanup-rules §E1: named and unnamed slots emit symmetric per-slot
// transport fields. JS factories write `_<storageName>` keys for every
// slot regardless of named-ness, so the napi struct must declare a field
// per slot with the matching `js_name` to deserialize.
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
// napi deserialization read the CST path without a nested helper
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
// Task 4's wire capture (wrap.ts's `emitSeparatedListWrap`) emits
// `_delimiter`/`_separator` sibling wire keys
// ONLY when the corresponding grammar-level mode/rule actually needs
// per-instance capture (design's "Field shape and wire capture"
// section) — mirror that same gating here so the struct never
// declares a field the wire can't populate.
```

#### body

```text
// Leaf/keyword/token structs have manual cfg-gated FromNapiValue impls
// (below). The napi field attributes are not emitted because there is no
// #[napi(object)] on the struct to act as the consuming proc-macro.
```

#### body

```text
// Emit impl RenderableTransport for this struct so heterogeneous
// (Box<AnyTransport>) slots can call .render_to_string() without routing
// through the top-level render_transport_dispatch match.
//
// All struct impls wrap the render call with render_with_trivia! to stream
// leading/trailing trivia text around the node content. Bool/enum variants
// don't have transport_trivia_data and are handled separately (no macro).
```

#### body

```text
// For leaf/keyword/token structs: emit manual cfg-gated napi impls.
// These replace the #[napi(object)]-derived FromNapiValue so that:
//   - release (not debug-transport): JS sends a plain string → read as String
//   - debug  (    debug-transport): JS sends full metadata object → read fields
// ToNapiValue is a stub in both modes — transport structs are receive-only.
```

#### body

```text
// Tokens are anonymous (named=false); patterns and keywords are named (named=true).
```

#### body

```text
// Emit Box<StructName> napi impls so the `Box-at-back-edge` slot-field
// typing in rustTransportSlotType can produce `Box<ConcreteTransport>`
// without compile-time "trait FromNapiValue is not implemented" errors.
// napi-rs's derive doesn't auto-generate Box wrappers; we forward
// manually to the inner struct's impls (which the #[napi(object)] derive
// or the manual leaf impls above provide). Dead Box impls for structs
// never actually boxed get DCE'd by the compiler.
```

### `packages/codegen/src/emitters/render-module.ts::leafDefaultTextLiteral`

#### body

```text
// Patterns whose sole realisation is a single fixed anonymous literal
// (e.g. `_semicolon` → ";", `||` → "||") arrive over NAPI as a bare u16
// kind-id rather than a string, because scalar_leaf_value in sittir-core
// serialises anonymous single-leaf fields that way.  Accept the u16 branch
// only for patterns that carry a known fixed literal (`fixedLiteralText`);
// content-bearing patterns (identifier, number, …) must never collapse to a
// constant — they come in on the String path and must stay on that path.
```

### `packages/codegen/src/emitters/render-module.ts::TRANSPORT_METADATA_FIELDS.jsName`

```text
// $triviaData carries leading/trailing comment nodes. TransportTrivia's
// manual FromNapiValue decodes each entry through TriviaTransport, which
// tries the entry's own typed struct before falling back to verbatim text.
```

### `packages/codegen/src/emitters/render-module.ts::renderTransportField`

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
// Generator-owned NodeData stores raw fields as `_<storageName>` top-level
// keys. Keep the JS/native render boundary dumb by teaching the generated
// napi structs to read the same storage keys directly. Symmetric for named
// and unnamed slots (cleanup-rules §E1).
```

#### body

```text
// `'boolean'`/`'verbatim'`-classified fields (see `classifyPrimitiveField`
// docstring) bypass `rustTransportSlotType` entirely and get a primitive
// Rust type instead — wrap sends a presence bool or bare text for these,
// never the kind_id/object shape `rustTransportSlotType`'s per-slot-enum
// / `AnyTransport` machinery expects.
```

```text
// `Option<bool>`, NOT bare `bool`: wrap OMITS the wire key entirely
```

#### body

```text
// when absent/false (confirmed via `tool probe-kind`) rather than
// sending an explicit `false`. `#[napi(object)]` derive requires a
// non-Option field's key to always be present, so a bare `bool`
// throws "Missing field" on every absent instance — the common
// case for an optional keyword modifier. Render-side glue treats
// `None` the same as `Some(false)` (`unwrap_or(false)`).
```

### `packages/codegen/src/emitters/render-module.ts::slotCarrier`

```text
/**
 * The `SlotValue` carrier every slot position holds — one uniform tolerance
 * for values the position's own type cannot represent (an unexpanded read
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

Emits `factories/index.ts`, the dynamic final chain step: re-exports the top overlay and, for every bundle entry, `export const <exportName> = hoist(O.<exportName>);` — the consumer surface where a bare call is the coerce flavor and `.strict` stays reachable (recursively, sub-factory pairs included).

### `packages/codegen/src/emitters/overlays/module.ts::overlayFrame`

Shared header for a static overlay module: imports the previous layer as `B`, any extra imports, and re-exports the previous layer; a layer shadows only the bundles it decorates.

### `packages/codegen/src/emitters/overlays/module.ts::BundleEntry`

One bundled kind: `key` is the ir property key (irKey, falling back to camelCase(kind)); `exportName` is the module-level export identifier — `key` suffixed with `_` when the key is a reserved identifier (e.g. `arguments`), since a reserved word is legal as an object property but not as a top-level export.

### `packages/codegen/src/emitters/overlays/module.ts::bundleEntries`

The single derivation of which kinds get bundles and under what names — consumed by the bundle module, the overlays, the index hoisting, and `ir.ts`. A kind qualifies with both a raw factory and a coercer, compound or list class, not factoryInline, and a catalog entry. A hoisted non-list compound is excluded here rather than at `classifyFromEmission`: a form has a coercer and belongs on its parent's wire, but never gets a top-level `ir` key of its own. Lists are exempt because a hoisted separated list owns a public surface.

### `packages/codegen/src/emitters/overlays/module.ts::emitBundleModule`

Emits `factories/bundle.ts`: re-exports raw and coerce, then one line per entry — `export const <exportName> = bundle(F.<build>, C.<coerceTo>);`. The pairing is the one dynamic stage below the index.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::parentRefs`

The strict/coerce expression pair for a parent builder; `coerce` is absent when the kind has no coercer.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::childRefs`

The strict/coerce expression pair for an arm: a direct child uses its own factories (strict builder doubling as the coerce seat when no coercer exists); a flattened arm references the decorated child const emitted above (`<childKey>.<path>.strict` / `.coerce`).

### `packages/codegen/src/emitters/overlays/polymorphs.ts::AliasWire`

A form wire with no seat: the child kind is a complete alternative of the parent's rule, so the wire is the child's own factory pair exposed under the parent, not a transformation method.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::variantAliasWires`

Whole-rule alternative arms. A parent's `variantChildKinds` can name arms that are complete alternatives of the parent's rule rather than values in any slot (`binary_expression = choice(seq(left, op, right), _binary_expression_in)`); `choiceSlotOf` never sees those, because they are not in a slot. Each resolves to its node (visible key, else `_`-prefixed), takes the name the variant child already carries, and wires as the child's own factory pair — the form IS its own node kind in the CST, so there is nothing to seat. Arms already claimed by a sub-factory (same child kind or same name) are skipped: when the arms sit in a real choice slot (rust `token_tree`), the seated path owns them.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::methodName`

Transformation-method identifier for one sub-factory: `<parentKey>$<name>`, with non-identifier characters in the name replaced by `_`.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::collectPolymorphWires`

The single derivation of which sub-factories the polymorph overlay actually wires — traversal order (children before flattened parents), per-parent filtered entry lists (ambiguity and slot-collision resolved in `subFactoriesOf`; unreferenceable children filtered here, and a flattened arm survives only when the child's ALREADY-EMITTED wire set — children visit first, DFS post-order — carries the referenced property, because the child's context-sensitive derivation under this parent can name entries the child's own top-level set resolved away), the emission predicates, and the bundle key map. Consumed by `emitPolymorphsOverlay` AND by the generated-test emitter (`test.ts::emitSubFactoryTests`), so a test is emitted exactly for the wires that exist; the test emitter passes `silent` so diagnostics print once. Alias wires from `variantAliasWires` ride the same sets: a parent enters the map when it has seated subs or alias forms. Any consumer deriving the wire set independently will drift — this map is the fact.

### `packages/codegen/src/emitters/overlays/polymorphs.ts::emitSub`

Renders one sub-factory's transformation method and its two applications. Methods are generic over the function types themselves (`PF` for the parent, `CF` for the child) with parameter and return types indexed off them (`Parameters<PF>[0]`, `ReturnType<PF>`), because a type parameter constrained by another inference variable and appearing only in a contravariant function-parameter position makes TypeScript fall back to the constraint instead of inferring — any parent with a residual field would then fail to apply. The two internal calls are made through erased views (`parent as (arg: unknown) => ReturnType<PF>`); the external signature and the emitted per-wire type annotations stay exact. Shapes: literal fix (with/without residual, positional/keyed), positional/keyed seat, config merge (path-empty arms only; keys split by a baked owner list), and tuple-spread for every other residual arm — flattened arms always tuple-spread, since their seated value is the sub-factory's own argument tuple.

### `packages/codegen/src/emitters/overlays/refines.ts::emitRefinesOverlay`

Static wiring for refine forms over bundles: for each kind with refine forms, spreads the bundle (`...B.<key>`) and wires each form as `{ strict: F.<refineFormFactory> }` under its camelCase key (plus the raw form name when it differs). Refine forms have no emitted coercers, so the pair carries only `strict`.

### `packages/codegen/src/emitters/overlays/sub-factories.ts::ValueArm`

```text
/** A sub-factory arm that seats a VALUE directly into the parent's choice
 *  slot instead of composing a child factory. Two shapes reach it: a
 *  literal branch of the slot (`op: choice('and', 'or')` yields one per
 *  string), and a reference to a factoryless value kind — an
 *  AssembledKeyword or AssembledToken whose whole body is a fixed literal,
 *  which owns a kind identity but has no factory to call. The arm carries
 *  the value's stamped `storage` and nothing else: its text, and — for a
 *  value that resolved to a kind — that kind and its id. What the emitter
 *  seats is read from the stamp by `valueStorageExpr`; the arm never
 *  re-derives it and carries no second copy of the fact. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::NodeArm`

```text
/** A sub-factory arm backed by a child kind reachable through the parent's
 *  seat slot (a choice slot, or a forwarding hop's sole slot). `child` is
 *  always the *direct* child under that slot, even for a flattened entry
 *  reached through the child's own sub-factories; `path` is empty for a
 *  direct arm and otherwise holds exactly one name — the property on the
 *  child's own wire const that already encapsulates every deeper hop.
 *  `leaf` is the deepest kind the entry ultimately builds (undefined when
 *  `child` is the leaf); outer levels name their flattened entries from
 *  it, so `visibility_modifier` calls the in-path form `inPath` even
 *  though the arm's direct child is the pub hop. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::SubFactory`

```text
/** One named narrowing of a parent's factory: `subfactory = parent slots −
 *  choice slot ∪ arm slots` — `residual` is every parent field except the
 *  chosen `slot`, and the arm (`literal` or `kind`) supplies whatever the
 *  narrowing itself fixes. `slot` is the parent's own choice slot, kept on
 *  every entry (direct and flattened alike) so a caller can tell which
 *  field the sub-factory narrows without re-deriving it via `choiceSlotOf`. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::SubFactoryDiagnostic`

```text
/** Recorded instead of a `SubFactory` entry when a name can't be resolved
 *  to one canonical claimant: `ambiguous` when two or more claimants (direct
 *  or flattened) land on the same name with no single direct winner among
 *  them, `slot-collision` when a would-be entry's own config keys overlap
 *  the parent's residual field keys. `claimants` lists what collided —
 *  `'<literal>'` for a value arm, `<kind>` for a direct node arm,
 *  `<child>.<path>` for a flattened one. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::SubFactorySet`

```text
/** The complete result of deriving sub-factories for one node: the
 *  survivors in `entries`, everything dropped (and why) in `diagnostics`. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::choiceSlotOf`

```text
/** The parent's eligible choice slot, or `undefined` when there isn't
 *  exactly one. A slot qualifies when it holds two or more values
 *  (`values.length >= 2`) and isn't a multi/array slot (`!isMultiple`) —
 *  a single value has nothing to choose between, and an array slot picks
 *  a set of children rather than one arm. A node with zero or more than
 *  one such slot has no unambiguous narrowing target, so it isn't
 *  eligible for sub-factories at all. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::armName`

```text
/** The DERIVED sub-factory name a choice-slot value contributes, or
 *  `undefined` when the value can't be named (the arm is then skipped, not
 *  defaulted). This is the fallback half of the naming pair — `armNaming`
 *  layers an arm's declared name over it. A node-backed value always names
 *  successfully: a hoisted compound whose `parentKind` matches
 *  `parent.kind` contributes its own `name` (the variant name enrich
 *  minted it under); every other node-backed value contributes the suffix
 *  `prefixNamedSuffix(parent.kind, child.kind)` strips off the parent's
 *  kind prefix, or — when the child's kind doesn't carry that prefix — the
 *  child's own kind with any leading `_` stripped. That derivation is
 *  parent-relative, so it yields distinct names for two arms that share a
 *  declared name; this is what makes it a sound deconfliction fallback. A
 *  literal value names itself when it's already a valid identifier;
 *  otherwise it falls back to the literal's resolved token kind
 *  (`resolvedKind`, never re-derived from the literal text), and skips
 *  entirely when neither is available. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::armNaming`

```text
/** The name an arm claims, the name it falls back to, and whether this
 *  parent is the one that declared it. `name` prefers the arm's declared
 *  variant annotation and falls back to the derived `armName`; `fallback`
 *  always holds the derived name; `declaring` is true when the consuming
 *  parent is the kind the annotation was declared under. One child kind is
 *  reachable from many parents, so a declared name belongs to the
 *  parent-to-arm edge rather than to the child — `resolveCandidates` reads
 *  `declaring` to settle which arm keeps the declared name when two claim
 *  it. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::textStorageOf`

```text
/** The value's stamped storage when it seats text or a kind id, or
 *  `undefined` when it stores a node — a node-storage value composes a
 *  child factory (a NodeArm) and is never a value arm. Factoryless
 *  AssembledKeyword / AssembledToken references arrive here already
 *  stamped `kindId` by `classifyValueStorage`; everything else that lacks
 *  a factory — supertypes above all — has no value to seat and stays
 *  skipped by the caller's own test. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::resolveCandidates`

```text
/** Group same-named candidates, settle each winner, and drop arms whose
 *  config keys collide with the parent's residual slots.
 *
 *  Names are deconflicted before grouping. Two arms can legitimately claim
 *  one declared name when a slot holds variants declared by two different
 *  kinds: a token tree's content slot carries both the `paren` arm it
 *  declared itself and the `paren` arm its delimited form declared, spliced
 *  in. On such a clash the declaring parent keeps the declared name and
 *  every other claimant falls back to its derived name, which is
 *  parent-relative and therefore already distinct. Only a genuine clash
 *  triggers that fallback — an arm whose declared name nothing else claims
 *  keeps it whichever parent consumes it.
 *
 *  What survives deconfliction is grouped by name: a lone claimant wins
 *  outright, a tie goes to the one direct arm when exactly one is direct,
 *  and anything still ambiguous is reported as a diagnostic and dropped. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::subFactoriesOf`

Top-level entry: derives the sub-factory set for a kind with an empty visiting context and caches per (nodeMap, predicate, kind). The cache is read ONLY for top-level queries — a nested derivation (non-empty visiting set) always recomputes, because ambiguity and flattening are context-sensitive: a cached context-free result served into a cyclic context (or vice versa) yields order-dependent wire sets. True cycles short-circuit to the empty set through a per-derivation in-progress guard. A kind with no choice slot but a forwarding hop (`forwardedTargetKind`: sole slot seating exactly one emitted child kind) passes the child's sub-factories through — each entry re-seated in the hop's own slot under a leaf-relative name, its wire referencing the child const's matching property. Both the choice-slot and forwarding branches feed one shared resolution tail (`resolveCandidates`: name-ambiguity and slot-collision filtering), so the two seat modes cannot diverge in how claims are settled.

### `packages/codegen/src/emitters/overlays/sub-factories.ts::armConfigKeys`

```text
/** The config keys a sub-factory's arm accepts as a config object; empty
 *  when the arm's call takes its residual fields positionally instead —
 *  callers ask `classifyFactoryShape(child)` themselves to tell the two
 *  apart, this function never re-derives or reports the calling
 *  convention. A value arm always returns `[]` — a seated value has no child
 *  to read config keys from. A direct node arm (empty `path`) returns
 *  `[]` when the child's own factory shape (`classifyFactoryShape`) isn't
 *  `config`; otherwise it returns the child's own field config keys. A
 *  flattened arm (non-empty `path`) looks up the child's sub-factory named
 *  `path[0]` (threading `opts` through the lookup so it agrees with
 *  whatever `isEmitted` the caller resolved the arm under — a mismatched
 *  default here would let the nested lookup diverge from the entry the
 *  caller actually built) and returns that sub-factory's residual keys
 *  unioned with what the nested step itself contributes: when the nested
 *  arm's own child is `config`-shaped, that's `armConfigKeys` recursed
 *  one level deeper (the nested sub-factory destructures its child's
 *  fields individually, so the merged config needs each of those fields
 *  by name); otherwise — a nested value arm, or a node arm whose child
 *  is `text`/`direct`/`forwarded`/`spread`/`elements`-shaped — the nested
 *  sub-factory calls its own child wholesale (`C(k)` / `C(...k)`, never
 *  destructured), so the merged config needs the nested arm's own slot
 *  key as one explicit prop instead (empty contribution for a value arm,
 *  which needs nothing beyond its residual). `visiting` guards this
 *  recursion against the mutual cycle `derive → armConfigKeys →
 *  subFactoriesOf → derive → …` can otherwise walk into: a flattened
 *  step's own `subFactoriesOf` call always starts a fresh (empty)
 *  `visiting` set, so without a caller-supplied one a cycle spanning
 *  several distinct kinds is invisible to any single call's local
 *  tracking — `derive`'s call site seeds it with its own ancestor chain
 *  for exactly this reason. */
```

### `packages/codegen/src/emitters/overlays/sub-factories.ts::claimantOf`

```text
/** Renders one `SubFactory` as the diagnostic-facing string that names it
 *  in `SubFactoryDiagnostic.claimants` — the single formatter both the
 *  `ambiguous` candidate list and the `slot-collision` diagnostic build
 *  from, so the two diagnostics never disagree on how a claimant reads. A
 *  value arm renders as `'<literal>'`; a node arm renders as
 *  `<child.kind>` joined by `.` with every name in `path` — `<child>` for
 *  a direct arm (empty `path`), `<child>.<path…>` for a flattened one, so
 *  a claimant several levels deep still names the full chain instead of
 *  just its first hop. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::emitPolymorphsOverlay`

Static wiring for sub-factories over bundles. One module-local transformation method per sub-factory (`<parentKey>$<name>`), applied twice — once to the strict pair (`F.*`), once to the coerce pair (`C.*`). Wiring consts carry explicit type annotations (`typeof B.<key> & { <n>: { strict: <sig>; coerce: <sig> } }`) so declaration emit never exceeds the compiler's serialization limit. Coerce applications exist only where the coerce emitter actually emits the coercer (`classifyFromEmission === 'emit'`); a child with no coercer is seated with its strict builder inside the parent's coercer. Alias wires (`variantAliasWires`) emit inside the same wiring const with no method — the pair is the child's own factories (`{ strict: F.<build> }`, plus the coercer when emitted). In per-slot transport enums, id claims are ordered literal variants → enum-kind arms → other kind arms: alias-wire id sets legitimately overlap (identifier accepts primitive-keyword ids for OBJECT payloads carrying `$text`), but a bare number must reach the arm that can render it from the id alone — an `IdentifierTransport` built from a number has an empty `$text` and renders nothing. Parents emit DFS post-order so flattened wires reference the decorated child const above. Skipped sub-factories print `[codegen] <parent>: sub-factory <name> skipped (<reason>): <claimants>` on console.warn.
