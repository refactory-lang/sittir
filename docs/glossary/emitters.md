# `packages/codegen/src/emitters` — Function Glossary

Per-function reference for `packages/codegen/src/emitters/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `emitBitflagConstEnums` (`packages/codegen/src/emitters/consts.ts:397`)

```text
/**
 * Walk the NodeMap and emit a `const enum` declaration per bitflag-
 * classified field. Deduplicates by `constName`: when two fields
 * collapse to the same name and carry the same keyword set, a single
 * declaration serves both.
 */
```

### `collectBitflagBindings` (`packages/codegen/src/emitters/consts.ts:430`)

```text
/**
 * Walk the NodeMap and collect one BitflagBinding per bitflag-
 * classified field across all structural and group kinds. Resolves
 * the const name with collision disambiguation — fields whose name
 * collapses to the same PascalCase identifier across kinds get a
 * kind-prefixed name instead of the bare field-name form.
 */
```

### `bitflagBareConstName` (`packages/codegen/src/emitters/consts.ts:474`)

```text
/**
 * Compute the const enum name for a bitflag field from its property
 * name alone (collision-free form).
 *
 * Examples: `modifiers` → `Modifiers`, `functionModifiers` → `FunctionModifiers`.
 */
```

### `bitflagPrefixedConstName` (`packages/codegen/src/emitters/consts.ts:484`)

```text
/**
 * Compute the disambiguated const enum name by prefixing the parent
 * kind.
 *
 * Example: `class_declaration.modifiers` → `ClassDeclarationModifiers`.
 */
```

### `resolveBitflagConstName` (`packages/codegen/src/emitters/consts.ts:494`)

```text
/**
 * Resolve the bitflag const name for a given kind + field pair.
 *
 * This must agree with {@link collectBitflagBindings} — callers in
 * other emitters (types / factories / from) use this to reference the
 * emitted name.
 */
```

### `fieldsOfNode` (`packages/codegen/src/emitters/consts.ts:640`)

```text
/** Yield the fields of a node — branch, group, or (TEMPORARY, see
 * isSlotBearingCompound's doc comment, shared.ts) separatedList. */
```

### `emitAll` (`packages/codegen/src/emitters/emit.ts:82`)

```text
/**
 * Single-loop orchestrator: initializes all emitters, iterates
 * `nodeMap.nodes` once dispatching to each, then finalizes all.
 *
 * @param config - Union of what all emitters need.
 * @returns An object with every emitter's final output string.
 */
```

### `emitEngine` (`packages/codegen/src/emitters/engine.ts:11`)

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

### `collectUsesNonEmptyArray` (`packages/codegen/src/emitters/factories.ts:89`)

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
 *   Also checks `AssembledSeparatedList.nonEmpty` directly (a REPEAT1
 *   source rule) rather than through `allSlotsOf`'s `.fields` (the Task-2
 *   stub) — the stub can misderive a kind's real elements arity (see
 *   `emitSeparatedListFactory`'s doc comment), so it can't be trusted for
 *   this detection either.
 */
```

### `emitFluentSetterHelpers` (`packages/codegen/src/emitters/factories.ts:149`)

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

### `emitNonEmptyAssertHelper` (`packages/codegen/src/emitters/factories.ts:165`)

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

### `buildLeafReConsts` (`packages/codegen/src/emitters/factories.ts:190`)

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

### `factoryTypeDiscriminant` (`packages/codegen/src/emitters/factories.ts:249`)

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

### `namespaceOf` (`packages/codegen/src/emitters/factories.ts:297`)

```text
/**
 * The factory's namespaced constructors for a node, with each ambiguity
 * reported once — a name two candidates claim is emitted for neither.
 *
 * @remarks
 * Entries are pre-filtered to the emittable set (`namespacedEntryEligible`)
 * before being returned, so every consumer — the factory's attachProps
 * const, ir's hoisted bundles, from's mirrored props, and
 * `emitFromMapDeclaration`'s `$impl`-vs-plain-name decision — sees the
 * SAME surface. Filtering at any single consumer instead would let the
 * others disagree (e.g. `_fromMap` referencing a `<fn>$impl` that
 * `withNamespaceProps` never declared because all entries were
 * ineligible).
 */
```

### `buildFactoryMapEntries` (`packages/codegen/src/emitters/factories.ts:296`)

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
 *   slot uses the factory's own signature directly. Polymorph form kinds are
 *   excluded (`polymorphFormKinds`) and are not registered separately.
 */
```

### `emitFluentKindMap` (`packages/codegen/src/emitters/factories.ts:351`)

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

### `emitFactoryMapConst` (`packages/codegen/src/emitters/factories.ts:377`)

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

### `leaf` (`packages/codegen/src/emitters/factories.ts:410`)

```text
/**
	 * Emit a leaf factory (pattern, keyword, enum).
	 */
```

### `branch` (`packages/codegen/src/emitters/factories.ts:443`)

```text
/**
	 * Emit a branch factory — either container-shape (rest-param) or
	 * field-carrying (config object, internally routes to single-field
	 * when applicable).
	 */
```

### `group` (`packages/codegen/src/emitters/factories.ts:457`)

```text
/**
	 * Emit a group factory — field-carrying factory for hidden composition
	 * fragments (polymorph form inner kinds).
	 */
```

### `separatedList` (`packages/codegen/src/emitters/factories.ts:471`)

```text
/**
	 * Emit a `'separatedList'` factory — dedicated construct surface built
	 * directly from `AssembledSeparatedList`'s own real fields (`elements`/
	 * `separatorRule`/`leadingMode`/`trailingMode`), bypassing the Task-2
	 * `_slots` stub entirely (see `AssembledSeparatedList`'s doc comment,
	 * node-map.ts). Replaces the former `branch(...)` routing for this
	 * modelType.
	 */
```

### `buildLeafGuards` (`packages/codegen/src/emitters/factories.ts:490`)

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

### `buildEnumLiteralUnion` (`packages/codegen/src/emitters/factories.ts:530`)

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

### `childElementType` (`packages/codegen/src/emitters/factories.ts:551`)

```text
/** Resolve a container node's children element type to a concrete TS type expression. */
```

### `autoStampExpression` (`packages/codegen/src/emitters/factories.ts:590`)

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

### `setterValueSignature` (`packages/codegen/src/emitters/factories.ts:713`)

```text
/**
 * `$with.<name>` setter parameter signature for a single-valued field.
 * Required fields take `(value: T)`; optional fields take `(value?: T)`.
 * Previously the emitter unconditionally used `(value?: T)` — the new shape
 * matches the field's actual required/optional contract so callers can't
 * accidentally clear a required field by calling `$with.foo()` with no arg.
 */
```

### `setterElemType` (`packages/codegen/src/emitters/factories.ts:725`)

```text
/**
 * Param type for a single-valued setter:
 *   - storage-rewritten fields: derive from the factory's own config slot.
 *   - default: plain `elemType`.
 */
```

### `emitFieldCarryingFactory` (`packages/codegen/src/emitters/factories.ts:764`)

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

### `childrenSetterRestType` (`packages/codegen/src/emitters/factories.ts:943`)

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

### `renameUnusedConfigParam` (`packages/codegen/src/emitters/factories.ts:968`)

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

### `emitRefineFormFactory` (`packages/codegen/src/emitters/factories.ts:990`)

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

### `resolveRefineFormConfigOptional` (`packages/codegen/src/emitters/factories.ts:1088`)

```text
/**
 * Per-form equivalent of `resolveConfigOptional` — factors the narrowed
 * fields out of the "required" check (those are stamped by this form and
 * never come from Config input).
 */
```

### `resolveConfigOptional` (`packages/codegen/src/emitters/factories.ts:1104`)

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

### `resolveConfigType` (`packages/codegen/src/emitters/factories.ts:1122`)

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

### `resolvePolymorphFormVariantName` (`packages/codegen/src/emitters/factories.ts:1146`)

```text
/**
 * Resolve the `$variant` tag name for a polymorph form factory.
 *
 * @param node - The node descriptor (provides `name` and `parentKind`).
 * @returns The form's short name (e.g. `'body'`, `'binary'`, `'form0'`), or
 *   `undefined` when the node is not a polymorph form.
 * @remarks
 *   Polymorph form factories tag their output with `$variant: '<name>'` so the
 *   renderer's variant dispatch (path 1) can discriminate forms whose templates
 *   differ only by literal tokens (e.g. rust `struct_item` body vs semi — same
 *   `$VARS`, differ by trailing `;`).
 *
 *   Single source of truth (DRY): the variant name is `form.name`, assigned at
 *   assembly time in {@link buildAssembledFormGroups}. Reconstructing it from
 *   the kind suffix is fragile — `source='override'` polymorphs use
 *   `${parent}__form_${name}` and slicing by `${parent}_` yields `_form_<name>`
 *   (leading underscore garbage). Use `form.name` directly and let assemble
 *   own the naming decision.
 */
```

### `resolveContainerElementType` (`packages/codegen/src/emitters/factories.ts:1181`)

```text
/**
 * Resolve the element type for a container node's children parameter.
 *
 * @param node - The container node descriptor.
 * @param nodeMap - The assembled node map for type resolution.
 * @returns A TS source string for the element type (e.g. `T.FunctionItem | T.Block`).
 * @remarks
 *   Uses the concrete element type union (e.g. `FunctionItem | Block`) instead of
 *   the generic `ChildOf<X>` alias so consumers see the actual types in
 *   hover/autocomplete with no indirection.
 */
```

### `emitSeparatedListFactory` (`packages/codegen/src/emitters/factories.ts:1202`)

```text
/**
 * Emit a `'separatedList'` factory function.
 *
 * Signature: `fn(elements: T[] | NonEmptyArray<T>, options?: {...})` —
 * `elements` is always positional (a separatedList's whole rule identity is
 * array multiplicity, so there's never a singular-content case, unlike
 * `emitContainerFactory`). `options` is a SECOND, trailing parameter
 * (`elements` can't itself be a rest/spread param followed by more
 * arguments) and is emitted ONLY when at least one of
 * `separatorKind`/`leading`/`trailing` genuinely varies per-instance —
 * `mandatory`/`none` flank modes and a literal separator are all
 * compile-time-known and need no runtime parameter at all, mirroring
 * exactly which fields `emitSeparatedListWrap` (wrap.ts, Task 4) and
 * `renderTransportDataStruct` (render-module.ts, Task 5) conditionally
 * capture/emit.
 *
 * Storage keys (`_separator_kind`/`_leading_sep`/`_trailing_sep`) match
 * wrap.ts's `emitSeparatedListWrap` naming exactly (Task 4) — the same
 * per-instance concepts share one naming scheme across capture/render/
 * construct. The elements' own storage key/accessor, however, is NOT a
 * fixed `_content`/`content()` bucket — it is derived via
 * `canonicalSeparatedListField` (shared.ts), the SAME single-field
 * canonical-slot derivation `emitSeparatedListWrap`'s "Bug B fix" and
 * `renderTransportDataStruct`'s transport struct use, so the constructed
 * object's storage key matches the model's real slot name (e.g.
 * `_attributed_argument`, not `_content`) and satisfies both the wire
 * transport and the Task-2 `_slots` stub's `T.<TypeName>` interface in
 * types.ts (which declares `_<name>`/`<name>()` from the identical
 * `node.fields` source). Multi-field kinds (`node.fields.length > 1`, e.g.
 * TypeScript's `enum_body_group1`) can't route a flat `elements` array to
 * more than one field without partitioning by kind — they keep the generic
 * `_content`/`content()` bucket, which remains WRONG for those kinds (see
 * `expectTestFailures`) pending a real per-field partition.
 *
 * Bypasses `node.fields`/`.slots` (the Task-2 stub) entirely, reading
 * `node.elements`/`.nonEmpty`/`.leadingMode`/`.trailingMode`/`.separatorRule`
 * directly — the stub can misderive a kind's real shape for a rule that's
 * an alias of a hidden rule (empirically found: python's `lambda_parameters`,
 * whose rule id resolves through hidden `_parameters`, currently gets a
 * WRONG singular `child: T.Parameters` factory under the stub instead of
 * the real REPEAT1 array — this function fixes that as a side effect of
 * bypassing the stub, the same way Task 4's wrap.ts fix did for the wrap
 * side).
 */
```

### `stripUselessEscapes` (`packages/codegen/src/emitters/factories.ts:1415`)

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

### `buildSupertypeByKey` (`packages/codegen/src/emitters/from.ts:66`)

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

### `buildKindInterner` (`packages/codegen/src/emitters/from.ts:101`)

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

### `emitNamespaceImports` (`packages/codegen/src/emitters/from.ts:145`)

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

### `emitFromFieldInputType` (`packages/codegen/src/emitters/from.ts:169`)

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

### `withNamespaceProps` (`packages/codegen/src/emitters/from.ts:198`)

```text
/**
 * Mirror the factory's namespaced sub-constructors onto the from() surface:
 * rename the emitted coercer to `<fn>$impl` and export the public name as
 * `attachProps(<fn>$impl, { <key>: F.<factory>.<key>, ... })`, so
 * `FR.coerceToX.<form>` and `F.buildX.<form>` are the same constructors.
 * `_fromMap` keeps referencing the hoisted `$impl` declaration (a const
 * initializer at module top would hit the TDZ).
 *
 * @remarks
 * Consumes `namespaceOf`'s already-eligibility-filtered entries — the same
 * set `emitFromMapDeclaration` consults for its `$impl`-vs-plain-name
 * decision, so a node whose candidate entries are all ineligible keeps its
 * plain exported coercer and `_fromMap` never references an undeclared
 * `$impl` symbol.
 */
```

### `emitFromMapDeclaration` (`packages/codegen/src/emitters/from.ts:195`)

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

### `emitInternedKindTable` (`packages/codegen/src/emitters/from.ts:235`)

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

### `leaf` (`packages/codegen/src/emitters/from.ts:268`)

```text
/**
	 * Emit a leaf from() resolver — string-like (pattern, enum) or keyword.
	 */
```

### `branch` (`packages/codegen/src/emitters/from.ts:295`)

```text
/**
	 * Emit a branch from() resolver — container shape, text-template,
	 * or regular field-carrying branch.
	 */
```

### `separatedList` (`packages/codegen/src/emitters/from.ts:309`)

```text
/**
	 * Emit a `'separatedList'` from() resolver — dedicated construct/
	 * reconstruction surface, see `emitSeparatedListFrom`'s doc comment.
	 */
```

### `buildBranchSignatureParts` (`packages/codegen/src/emitters/from.ts:341`)

```text
/**
 * Builds the input signature parts for a branch from() function.
 * Return type is omitted — TS infers it from the body.
 */
```

### `canDefaultToEmpty` (`packages/codegen/src/emitters/from.ts:364`)

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

### `emitBranchFrom` (`packages/codegen/src/emitters/from.ts:420`)

```text
/**
 * Emit a branch from() resolver — dispatches to the container calling
 * convention (positional element args) when `classifyChildFactorySurface`
 * recognizes an unnamed child slot, otherwise falls through to the regular
 * field-carrying Loose-input resolution below. Single entry point so
 * `branch()`'s dispatcher doesn't have to know about the two shapes.
 */
```

### `containerTypeCheck` (`packages/codegen/src/emitters/from.ts:553`)

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

### `emitRestParamFromResolver` (`packages/codegen/src/emitters/from.ts:574`)

```text
/**
 * Shared body for a rest-param (`...input`) from() resolver that reconstructs
 * either from a flat list of already-resolved elements or by unwrapping an
 * existing self-NodeData value's storage. Both `emitRepeatedContainerFrom`
 * (container-shape branches — spreads the resolved elements into the
 * factory's `(...children: T[])` rest param) and `emitSeparatedListFrom`
 * (`'separatedList'` kinds — passes the resolved elements as the single
 * `elements: T[] | NonEmptyArray<T>` array argument, Task 6) share this exact
 * three-shape structure (numeric-discriminant gate, self-NodeData unwrap,
 * fresh-input fallback); they differ ONLY in how the final call expression is
 * built from a resolved variable name, which `buildCallExpr` parameterizes.
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
 *   for container-shape factories, direct array cast for `'separatedList'`.
 * @param childrenTypeAnnotation - Optional explicit type annotation for the
 *   self-NodeData-unwrap `children` local (e.g. `': readonly unknown[]'`) —
 *   `emitSeparatedListFrom` needs this so its direct (non-`unknown`-laundered)
 *   cast type-checks; the local's inferred type otherwise widens to `any[]`
 *   via the `Array.isArray` ternary, which a direct cast rejects even though
 *   the runtime value is the same. `emitRepeatedContainerFrom` doesn't need
 *   it since its cast still routes through `unknown` first.
 * @returns The emitted function source string.
 */
```

### `emitRepeatedContainerFrom` (`packages/codegen/src/emitters/from.ts:659`)

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

### `emitSingularContainerFrom` (`packages/codegen/src/emitters/from.ts:703`)

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

### `emitSeparatedListFrom` (`packages/codegen/src/emitters/from.ts:795`)

```text
/**
 * Emit a `'separatedList'` from() resolver — dedicated construct/
 * reconstruction surface built directly from `AssembledSeparatedList`'s own
 * real fields, bypassing the Task-2 `_slots` stub entirely (see
 * `AssembledSeparatedList`'s doc comment, node-map.ts, and
 * `emitSeparatedListFactory`'s doc comment, factories.ts).
 *
 * Shares `emitRestParamFromResolver`'s three-shape structure with
 * `emitRepeatedContainerFrom` (see that function's doc comment for the
 * shared shape), with ONE deliberate difference in the call expression: the
 * resolved elements are passed to the factory as the `elements` ARRAY
 * argument directly (`factory(children as Parameters<typeof
 * factory>[0])`), never spread and never indexed — factories.ts's Task 6
 * signature is `factory(elements: T[] | NonEmptyArray<T>, options?: {...})`,
 * not the old `factory(...children: T[])` `emitRepeatedContainerFrom`
 * assumes. Before this function existed, `classifyChildFactorySurface`'s
 * stub-based 'spread'/'direct' classification routed `'separatedList'`
 * kinds through the SAME spread/index call shape `emitRepeatedContainerFrom`
 * still uses for real container-shape branches — which silently bound
 * `children[0]` to `elements` and `children[1]` to `options` instead of the
 * whole array once the Task 6 factory signature landed (found in
 * spec-compliance review of Task 6, confirmed via code reading:
 * `_assertNonEmpty` is a no-op outside `SITTIR_DEBUG`, so the mis-binding
 * compiled and ran silently rather than throwing).
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

### `resolveFieldFromTypedInput` (`packages/codegen/src/emitters/from.ts:977`)

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

### `expandAndDedupeContentTypes` (`packages/codegen/src/emitters/from.ts:1013`)

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

### `classifyKindsForResolver` (`packages/codegen/src/emitters/from.ts:1059`)

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

### `buildSingleKindFastPath` (`packages/codegen/src/emitters/from.ts:1113`)

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

### `altKindDiscriminants` (`packages/codegen/src/emitters/from.ts:1165`)

```text
/**
 * Baked discriminant expressions for a slot's anonymous-token union
 * siblings (the `altKinds` argument of `_resolveOneBranch`). Resolution
 * order per token kind (PR-K3d): the slot value's mint `storageKindId`
 * stamp when present (collision-free id), else the name chain via
 * {@link containerTypeCheck} (`TSKindId.X` for catalog-backed kinds,
 * string literal for catalog-less fixtures — matching the string `$type`
 * world those pipelines run in).
 */
```

### `buildInternedArrayResolverCall` (`packages/codegen/src/emitters/from.ts:1192`)

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

### `keywordPresenceResolverCall` (`packages/codegen/src/emitters/from.ts:1293`)

```text
/**
 * Emit the resolver call string for a keyword-presence field.
 *
 * Returns `undefined` when the field isn't a keyword-presence pattern
 * (caller falls through to the default resolver).
 */
```

### `buildLeafRegistryEntries` (`packages/codegen/src/emitters/from.ts:1315`)

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

### `emitResolveByKindHelper` (`packages/codegen/src/emitters/from.ts:1357`)

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

### `resolveScalarParamName` (`packages/codegen/src/emitters/from.ts:1388`)

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

### `emitResolveOneHelper` (`packages/codegen/src/emitters/from.ts:1407`)

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

### `emitAssertNonEmptyHelper` (`packages/codegen/src/emitters/from.ts:1468`)

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

### `emitRequireFieldHelper` (`packages/codegen/src/emitters/from.ts:1492`)

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

### `collectWrapChildrenEntries` (`packages/codegen/src/emitters/from.ts:1525`)

```text
/**
 * Collects all branch/separatedList kinds that accept `$other` (catch-all
 * children) — used by the `_wrapWithChildren` runtime dispatch table in
 * generated from.ts.
 *
 * @remarks
 * Child-surface branches wrap through the same taxonomy used by the factory
 * emitter: direct unnamed-child factories call `F.kind(children[0])`, while
 * spread-child factories call `F.kind(...children)`. `'separatedList'`
 * kinds are handled separately with `childSurface: 'array'` (`F.kind(children
 * as ...)`, the whole array as the single `elements` argument) — routing
 * them through `classifyChildFactorySurface`'s stub-based 'direct'/'spread'
 * classification here would reproduce the same real from() mis-binding bug
 * `emitSeparatedListFrom`'s doc comment (this file) documents; every
 * `'separatedList'` kind unconditionally gets an `'array'` entry regardless
 * of what the stub would have classified it as.
 *
 * @param nodeMap - The assembled node map.
 * @param kindEntries - Kind enum entries for TSKindId emission.
 * @returns Array of wrap-children descriptors.
 */
```

### `emitWrapWithChildrenTable` (`packages/codegen/src/emitters/from.ts:1578`)

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

### `bundleExpr` (`packages/codegen/src/emitters/ir.ts:270`)

```text
/**
 * Factory+from bundle expression, shared by flat and grouped emission.
 * Kinds with refine() metadata carry per-form bundles keyed by the form's
 * camelCase short name (e.g. `ir.interfaceBody.curly`). Branches call the
 * loose `from()` path by default and expose the raw factory as `.strict`.
 */
```

### `groupNameFor` (`packages/codegen/src/emitters/ir.ts:298`)

```text
/**
 * Supertype kind → group namespace name.
 *   `_expression`            → `expression`
 *   `_declaration_statement` → `declarationStatement`
 *   `_literal_pattern`       → `literalPattern`
 */
```

### `memberKeyFor` (`packages/codegen/src/emitters/ir.ts:309`)

```text
/**
 * Member kind → short key within its supertype group.
 * Strip the last underscored segment (e.g. `_expression`, `_item`, `_pattern`).
 * If that collides with a JS reserved word, suffix with `_` per FR-029.
 *
 * Falls back to the full camelCased kind if stripping would leave nothing.
 */
```

### `resolveRoleNodes` (`packages/codegen/src/emitters/ir.ts:348`)

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

### `isLeafFactory` (`packages/codegen/src/emitters/ir.ts:371`)

```text
/**
 * Check if a node is a leaf factory (takes a text string, not a config object).
 * Leaf modelTypes: pattern, enum, keyword.
 */
```

### `returnTypeExpr` (`packages/codegen/src/emitters/ir.ts:379`)

```text
/**
 * Build the ReturnType expression for a factory. Uses `ReturnType<typeof F.xxx>`
 * so the type tracks the fluent methods attached by withMethods.
 */
```

### `emitFromNamespace` (`packages/codegen/src/emitters/ir.ts:387`)

```text
/**
 * Emit the `from` const — canonical factories that accept native JS values
 * and resolve to grammar-specific NodeData kinds.
 *
 * Emitted as `export const from = { ... } as const` for tree-shakeable
 * standalone access (`from.boolean(...)`) and also referenced inside the
 * `ir` object for `ir.from.boolean(...)` access.
 *
 * @returns Lines to prepend before the `ir` const. Empty if no roles have kinds.
 */
```

### `emitFromBoolean` (`packages/codegen/src/emitters/ir.ts:419`)

```text
/**
 * `from.boolean(value: boolean)` — resolves `true`/`false` to the grammar's
 * boolean kind. Handles three shapes:
 * - Enum leaf: `booleanLiteral('true' | 'false')` (Rust)
 * - Keyword pair: `true_()` / `false_()` (Python, TypeScript)
 * - Single leaf: direct factory call
 */
```

### `emitFromNumber` (`packages/codegen/src/emitters/ir.ts:459`)

```text
/**
 * `from.number(value: number)` — resolves integers to integer-kind, floats to
 * float-kind. When only one number kind exists, routes everything there.
 */
```

### `emitFromString` (`packages/codegen/src/emitters/ir.ts:502`)

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

### `emitFromComment` (`packages/codegen/src/emitters/ir.ts:546`)

```text
/**
 * `from.comment(text: string)` — routes to line/block comment kinds.
 * Discriminates by prefix: `//` or `#` → line comment, `/*` → block comment.
 * When only one comment kind exists, routes everything there.
 */
```

### `emitFromType` (`packages/codegen/src/emitters/ir.ts:601`)

```text
/**
 * `from.type(name: string)` — routes to the grammar's type-identifier kind.
 * Excludes `type.builtin` kinds. When the type kind is a branch that takes
 * an identifier child, composes `F.typeIdentifier(F.identifier(name))`.
 */
```

### `emitFromIdentifier` (`packages/codegen/src/emitters/ir.ts:649`)

```text
/**
 * `from.identifier(name: string)` — routes to the grammar's `identifier` kind.
 *
 * Looks for the `identifier` kind in the `variable` role. Does not exclude
 * `variable.builtin` since some grammars (TypeScript) capture `identifier`
 * under both `@variable` and `@variable.builtin`.
 */
```

### `emitFromAliases` (`packages/codegen/src/emitters/ir.ts:671`)

```text
/**
 * Emit definition-role aliases — `from.function`, `from.class`, etc.
 * These are direct references to the grammar-specific `ir.*` entry,
 * not wrapper functions. E.g., `from.function = ir.functionItem`.
 */
```

### `kindIdMemberName` (`packages/codegen/src/emitters/kind-discriminant.ts:52`)

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

### `collectCatalogKinds` (`packages/codegen/src/emitters/kind-discriminant.ts:75`)

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

### `collectKindEntries` (`packages/codegen/src/emitters/kind-discriminant.ts:88`)

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

### `findKindEntry` (`packages/codegen/src/emitters/kind-discriminant.ts:129`)

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

### `findKindEntryForLiteral` (`packages/codegen/src/emitters/kind-discriminant.ts:157`)

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

### `hasCatalogEntry` (`packages/codegen/src/emitters/kind-discriminant.ts:186`)

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

### `kindDiscriminantExpr` (`packages/codegen/src/emitters/kind-discriminant.ts:203`)

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

### `kindDiscriminantExprForId` (`packages/codegen/src/emitters/kind-discriminant.ts:247`)

```text
/**
 * {@link kindDiscriminantExpr} for call sites holding a mint-time PARSER ID
 * stamp (`NodeRef.resolvedKindId`, PR-K3a). The id is the collision-free
 * identity — a link-minted `resolvedKind` NAME can collide with a rule name
 * (`'type'` the keyword vs `type` the rule), but the stamped id cannot
 * (0 intra-catalog id collisions, all grammars). Returns undefined when the
 * id has no catalog row (emitter catalog narrower than the mint's).
 */
```

### `toIdMap` (`packages/codegen/src/emitters/kind-discriminant.ts:274`)

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

### `toScreamingSnakeCase` (`packages/codegen/src/emitters/kind-id-rust.ts:31`)

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

### `emitKindIdRust` (`packages/codegen/src/emitters/kind-id-rust.ts:76`)

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

### `extractElementKinds` (`packages/codegen/src/emitters/node-model.ts:416`)

```text
/**
 * Best-effort extraction of element kind names from an `AssembledMulti`'s
 * `elementRule`. Walks choice/symbol/supertype; drops anonymous literals.
 * Used only for diagnostic display in node-model.json5.
 */
```

### `collectRefineKindInfos` (`packages/codegen/src/emitters/refine-emit.ts:39`)

```text
/**
 * Collect refine metadata for every kind that carries forms, walking
 * each form's paths against the assembled rule tree to precompute the
 * narrowed field-literal pairs. Returns `undefined` when the grammar
 * has no refine metadata.
 *
 * @remarks
 * Path resolution at emit time reads the post-Link rule map (stored on
 * `NodeMap.rules`). Forms that don't resolve to field-wrapped choices
 * contribute an empty `narrowedFields` list — the form's factory still
 * exists but narrows nothing at the Config surface, which is the
 * intended behavior for selections that target anonymous structural
 * literals.
 */
```

### `pascalCase` (`packages/codegen/src/emitters/refine-emit.ts:71`)

```text
/**
 * PascalCase a form name for type / factory naming. Treats `_` as a
 * word boundary so `snake_case` forms pascal-case correctly.
 */
```

### `camelCase` (`packages/codegen/src/emitters/refine-emit.ts:83`)

```text
/**
 * camelCase a form name for fluent-key naming on the parent namespace
 * (e.g. `ir.interfaceBody.curly`).
 */
```

### `refineFormTypeName` (`packages/codegen/src/emitters/refine-emit.ts:100`)

```text
/**
 * Per-form TS type name: `<ParentTypeName><FormPascal>`.
 * Example: `InterfaceBody` + `curly` → `InterfaceBodyCurly`.
 */
```

### `refineFormFactoryName` (`packages/codegen/src/emitters/refine-emit.ts:108`)

```text
/**
 * Per-form factory function name: `<kind-camel><FormPascal>`, matching
 * the base factory-naming convention already used for polymorph forms.
 */
```

### `runRenderModuleEmitter` (`packages/codegen/src/emitters/render-module-runner.ts:24`)

```text
/**
 * Drive the class-based emitter contract for render-module emission.
 * Mirrors the loop that emitAll() runs, but narrowed to TemplateEmitter
 * and RenderModuleEmitter. Use this in scripts and tests instead of
 * calling emitRenderModuleBundle directly.
 */
```

### `rustFieldIdent` (`packages/codegen/src/emitters/render-module.ts:395`)

```text
/** Rust field identifier mapping for generated render/transport structs.
 *  Askama template expressions do not accept raw identifiers (`r#pub`),
 *  so keyword-named fields use a uniform `_` suffix (`pub_`, `type_`,
 *  `crate_`, etc.) across the Rust render module. */
```

### `structNameFor` (`packages/codegen/src/emitters/render-module.ts:438`)

```text
/** Struct name: PascalCase(kind). Mirrors the AssembledNode.typeName
 *  conventions so emitted struct names match the factory/type naming
 *  per the T027 struct-name directive.
 *
 *  Prefers the AssembledNode.typeName when a matching node exists (this
 *  is the `_`-stripped form for hidden user-facing aliases); falls back
 *  to a pascal conversion for bare kinds. */
```

### `build

Surface` (`packages/codegen/src/emitters/render-module.ts:805`)

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

### `slotFieldType` (`packages/codegen/src/emitters/render-module.ts:854`)

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

### `classifySlotForEmit` (`packages/codegen/src/emitters/render-module.ts:943`)

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

### `buildSlotWriteCall` (`packages/codegen/src/emitters/render-module.ts:989`)

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

### `renderTypedDispatch` (`packages/codegen/src/emitters/render-module.ts:1017`)

```text
/**
 * Emit per-kind `render_<kind>` functions, per-supertype render
 * helpers, plus the top-level `render_transport_dispatch` that routes
 * `&AnyTransport` to the right fn.
 *
 * Each per-kind fn builds the `*Template` struct directly from the typed
 * transport fields (no `NodeData` round-trip) and writes directly into a
 * caller-provided `&mut dyn fmt::Write` via `template.render_into(dest)`.
 * This is the direct render path introduced by Task 4 of the renderable-
 * native-views plan.
 *
 * Per-supertype render helpers are emitted AFTER all per-kind fns so every
 * concrete subtype render fn is already declared when the supertype match arm
 * references it.
 *
 * (R5: the legacy transport→NodeData inverse bridge was verified zero-caller
 * and deleted — typed transport dispatch is the ONLY render path.)
 *
 * @param usedSupertypeNames - supertype typeNames actually used as slot types;
 *   only these get render helpers emitted. Passed from renderTransportSupport
 *   (single derivation, DRY).
 * @param kindIdByKind - Map<kind, u16 id>, same source `renderTransportSupport`
 *   already computes for supertype/per-slot enum dispatch (`buildKindIdByKind`).
 *   Threaded through so `'separatedList'` kinds with a nonterminal separator
 *   can resolve each candidate arm's numeric KindId for the render-side
 *   `_separator_kind` → literal match (see `buildSeparatorKindMatchLines`).
 */
```

### `renderTypedKindFn` (`packages/codegen/src/emitters/render-module.ts:1177`)

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

### `renderTypedBranchFallbackFn` (`packages/codegen/src/emitters/render-module.ts:1215`)

```text
/**
 * Emit a fallback typed render fn for branch/container/group nodes that
 * have no template struct (no `.jinja` file). Writes children directly
 * into dest, or falls back to writing `transport_text` if there are no
 * children.
 */
```

### `renderTypedLeafFn` (`packages/codegen/src/emitters/render-module.ts:1272`)

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

### `buildFieldKindsByName` (`packages/codegen/src/emitters/render-module.ts:1295`)

```text
/**
 * Build a name→projection.kinds map from a list of assembled fields.
 * Used to feed `classifySlot` per field in `buildTypedTemplateBody`.
 *
 * @param fields - the node's structural fields
 */
```

### `buildFieldMixedByName` (`packages/codegen/src/emitters/render-module.ts:1309`)

```text
/** Returns the set of field names whose slots contain mixed named+anonymous content. */
```

### `renderTypedBranchFn` (`packages/codegen/src/emitters/render-module.ts:1320`)

```text
/**
 * Emit a branch/container/group typed render fn that builds the template
 * struct from the typed transport fields.
 */
```

### `emitIterCollectBuffer` (`packages/codegen/src/emitters/render-module.ts:1375`)

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

### `emitListSlotBuffer` (`packages/codegen/src/emitters/render-module.ts:1394`)

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

### `buildSeparatorKindMatchLines` (`packages/codegen/src/emitters/render-module.ts:1421`)

```text
/**
 * Emit `match node.separator_kind { Some(<id>) => "<lit>", ..., _ => <fallback> }`
 * lines resolving a `'separatedList'` node's per-instance nonterminal-separator
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

### `buildTypedTemplateBody` (`packages/codegen/src/emitters/render-module.ts:1462`)

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
 *   for `'separatedList'`-classified nodes, to wire real per-instance
 *   `leading`/`trailing`/`separator` values into list slots' `ListNonterminalView`
 *   instead of the hardcoded `false`/`sepLiteral` every other kind still uses
 *   (see the `f.view === 'list' || f.multiple` branch below).
 * @param kindIdByKind - Map<kind, u16 id>, needed to resolve a nonterminal
 *   separator's candidate arms to their numeric KindId for the `_separator_kind`
 *   match (see `buildSeparatorKindMatchLines`).
 */
```

### `emitHashFiles` (`packages/codegen/src/emitters/render-module.ts:1845`)

```text
/**
 * Emit `hash.rs` + `hash.ts` for a single grammar (T016/T017 surface).
 * Kept as the historic low-dep entry point — the richer `emitRenderModule`
 * (T027+) subsumes it but we keep this exported so the existing unit
 * tests and intermediate CLI paths stay green.
 */
```

### `emitRenderModule` (`packages/codegen/src/emitters/render-module.ts:1871`)

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

### `pruneUnreferencedBridges` (`packages/codegen/src/emitters/render-module.ts:2059`)

```text
/**
 * R5 reachability gate: drop any `*_transport_to_any` bridge fn that nothing
 * in the assembled transport.rs references. The file-top
 * `#![allow(dead_code)]` means rustc will never flag an unreferenced bridge,
 * so without this prune a dead bridge survives silently (exactly how the
 * deleted transport→NodeData island hid). Reachability is computed against
 * the FINAL assembled text — by construction, every emitted bridge has a
 * live caller.
 */
```

### `commonRustUseImports` (`packages/codegen/src/emitters/render-module.ts:2093`)

```text
/**
 * Common Rust `use` imports shared across templates.rs, bridge.rs, dispatch.rs,
 * and transport.rs. Each file gets the full set — Rust's module system deduplicates
 * and the `#![allow(unused_imports)]` suppresses warnings for imports not needed
 * in a particular file.
 */
```

### `filtersModule` (`packages/codegen/src/emitters/render-module.ts:2121`)

```text
/**
 * The Askama `filters` module — must live in the same module as `#[derive(Template)]`
 * structs so Askama's derive macro can resolve custom filter names at build time.
 */
```

### `collectUsedSupertypeNames` (`packages/codegen/src/emitters/render-module.ts:2193`)

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

### `buildKindIdByKind` (`packages/codegen/src/emitters/render-module.ts:2242`)

```text
/**
 * Build a `Map<string, number>` from `kindEntries` for O(1) lookup by kind.
 * Also indexes `symbolName` when present so literal kinds (e.g. `"+"`)
 * resolve the same way as their parser-symbol names (`PLUS`).
 */
```

### `enumMemberAcceptedIds` (`packages/codegen/src/emitters/render-module.ts:2258`)

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

### `renderAnyTransportWithStringTag` (`packages/codegen/src/emitters/render-module.ts:2271`)

```text
/**
 * Emit `AnyTransport` with the string-tagged `#[serde(tag = "$type")]` derive.
 * Fallback path when `generatedIdTables` is unavailable (no parser.c).
 */
```

### `nodeTransportHasRequiredField` (`packages/codegen/src/emitters/render-module.ts:2325`)

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

### `isLeafLikeNode` (`packages/codegen/src/emitters/render-module.ts:2362`)

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

### `renderTransportValueTypeHelper` (`packages/codegen/src/emitters/render-module.ts:2405`)

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

### `emitTransportEnumFromNapiValueBody` (`packages/codegen/src/emitters/render-module.ts:2442`)

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

### `emitAliasUnwrapRecurseArm` (`packages/codegen/src/emitters/render-module.ts:2502`)

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

### `emitSupertypeRenderHelper` (`packages/codegen/src/emitters/render-module.ts:2807`)

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

### `admitsVerbatimCollapse` (`packages/codegen/src/emitters/render-module.ts:2863`)

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

### `hasAnyConcreteChildKind` (`packages/codegen/src/emitters/render-module.ts:2992`)

```text
/**
 * Returns `true` when at least one kind in `kinds` can produce a concrete
 * transport type (i.e. `concreteTransportTypeName` returns non-null).
 * When all kinds are supertypes / multi / polymorph, a per-slot enum would be
 * empty and must not be emitted — callers fall back to `Box<AnyTransport>`.
 */
```

### `collectPerSlotChildEnums` (`packages/codegen/src/emitters/render-module.ts:3002`)

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

### `emitPerSlotChildEnum` (`packages/codegen/src/emitters/render-module.ts:3080`)

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

### `renderAnyTransportWithNapiFromValue` (`packages/codegen/src/emitters/render-module.ts:3338`)

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

### `renderGrammarRenderable` (`packages/codegen/src/emitters/render-module.ts:3515`)

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

### `renderLiteralTransportStruct` (`packages/codegen/src/emitters/render-module.ts:3572`)

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

### `emitTriviaKindIdArm` (`packages/codegen/src/emitters/render-module.ts:3213`)

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

### `renderTriviaTransportSupport` (`packages/codegen/src/emitters/render-module.ts:3228`)

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

### `renderVerbatimTransportStruct` (`packages/codegen/src/emitters/render-module.ts:3585`)

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

### `declareLeafTriviaCapture` (`packages/codegen/src/emitters/render-module.ts:3611`)

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

### `renderLeafTransportNapiImpls` (`packages/codegen/src/emitters/render-module.ts:3836`)

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

### `renderTransportMetadataFields` (`packages/codegen/src/emitters/render-module.ts:4088`)

```text
/**
 * Emit struct field declarations with `#[cfg_attr(feature = "napi-bindings", napi(js_name = "..."))]`
 * attributes for branch/group/polymorph transport structs that carry
 * `#[napi(object)]` on the struct.
 *
 * @param includeText - true for branch structs (adds `transport_text`).
 */
```

### `renderLeafTransportPlainFields` (`packages/codegen/src/emitters/render-module.ts:4122`)

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

### `rustTransportSlotType` (`packages/codegen/src/emitters/render-module.ts:4190`)

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

### `renderBoxedEnumNapiImpls` (`packages/codegen/src/emitters/render-module.ts:4312`)

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

### `concreteTransportTypeName` (`packages/codegen/src/emitters/render-module.ts:4347`)

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

### `perSlotEnumName` (`packages/codegen/src/emitters/render-module.ts:4372`)

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

### `rustTransportStructName` (`packages/codegen/src/emitters/render-module.ts:4394`)

```text
/**
 * Rust type name for the transport representation of a node.
 *
 * For `enum` modelType nodes: the transport type is the Rust enum itself
 * (`XxxEnum`). All other nodes use the standard `XxxTransport` struct name.
 */
```

### `literalToVariantName` (`packages/codegen/src/emitters/render-module.ts:4647`)

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

### `enumTypeName` (`packages/codegen/src/emitters/render-module.ts:4688`)

```text
/**
 * Enum type name for an `AssembledEnum` node. Appends `Enum` to the typeName
 * (PascalCase) to avoid collision with the companion `*Transport` struct naming
 * convention. Used by the parent transport struct field type.
 *
 * Example: typeName `BinaryExpressionOperator` → `BinaryExpressionOperatorEnum`.
 */
```

### `renderEnumType` (`packages/codegen/src/emitters/render-module.ts:4699`)

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

### `isSlotBearingCompound` (`packages/codegen/src/emitters/shared.ts:33`)

```text
/**
 * TEMPORARY (separator-as-slot Task 2 follow-up — see
 * `AssembledSeparatedList`'s doc comment, compiler/model/node-map.ts): the
 * render/wrap/factory pipeline currently treats `'separatedList'` nodes
 * exactly like `'branch'`/`'group'` (slot-bearing compounds) for
 * byte-identical emission, pending Tasks 4-6's real per-instance capture.
 * Centralizes the widened modelType check so the several call sites that
 * used to gate on `'branch'|'group'` alone stay in sync. Remove once
 * 'separatedList' gets its own dedicated emission and this predicate's
 * call sites revert to `'branch'|'group'` only.
 */
```

### `canonicalSeparatedListField` (`packages/codegen/src/emitters/shared.ts:50`)

```text
/**
 * A separatedList's single-field-storage canonical slot — the `node.fields`
 * entry whose storage key wrap.ts/render-module.ts's transport-struct
 * emission actually use for the "whole element union" bucket (Bug B fix,
 * wrap.ts's `emitSeparatedListWrap`). Prefers the `arity === 'many'` field
 * (the real repeated-content slot) and falls back to the first field for
 * kinds with no such slot.
 *
 * SHARED across wrap.ts, factories.ts, from.ts, and test.ts so all four
 * emitters agree on the same canonical storage key a separatedList's
 * elements are read from / written to on the wire — see wrap.ts's
 * `emitSeparatedListWrap` doc comment ("Bug B fix") for the full rationale.
 * Multi-field kinds (`node.fields.length > 1`) must NOT use this helper for
 * storage — they route each field through `emitFieldStorageLines`/
 * `emitFieldAccessorLines` instead (see callers).
 */
```

### `collectAliasSourceKinds` (`packages/codegen/src/emitters/shared.ts:94`)

```text
/**
 * Collect hidden source kinds (leading `_`) referenced via any field
 * / child value slot across the node map. These are the kinds whose
 * factory stamps `$type: '_X'` at construction — emission paths
 * (factories, templates, types) must include them even though they're
 * hidden.
 */
```

### `collectAliasTargetToSourceMap` (`packages/codegen/src/emitters/shared.ts:115`)

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

### `slotKindNames` (`packages/codegen/src/emitters/shared.ts:174`)

```text
/**
 * Extract the node kind names from a slot's `values` array.
 * Returns the name string for each NodeRef entry (resolved or unresolved).
 * Terminal values are excluded — they're not kinds.
 */
```

### `slotLiteralValues` (`packages/codegen/src/emitters/shared.ts:189`)

```text
/**
 * Extract the terminal literal values from a slot's `values` array.
 */
```

### `isValidIdent` (`packages/codegen/src/emitters/shared.ts:201`)

```text
/** True when `s` is a valid unquoted TypeScript identifier. */
```

### `_identOrQuoted` (`packages/codegen/src/emitters/shared.ts:206`)

```text
/** If `name` is a valid identifier, return `name`. Otherwise return its
 * JSON-quoted form — suitable for emission inside union / indexed-access
 * type positions where a non-identifier key would otherwise be a syntax
 * error. */
```

### `resolveEffectiveLiteral` (`packages/codegen/src/emitters/shared.ts:214`)

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
 * @remarks
 * Phase 1 (ADR-0010): omit auto-stamp-eligible fields from Config input
 * and stamp the constant directly in factory output.  The field stays in
 * the `$fields` block of the concrete TypeScript interface so NodeData
 * output shape is unchanged and round-trips with readNode remain identical.
 */
```

### `isAutoStampField` (`packages/codegen/src/emitters/shared.ts:277`)

```text
/**
 * Returns `true` when `resolveEffectiveLiteral` would return a value —
 * i.e., the field is auto-stamp-eligible per ADR-0010 phase 1.
 */
```

### `resolveHiddenKeywordLiteral` (`packages/codegen/src/emitters/shared.ts:285`)

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

### `isHiddenInfraSlot` (`packages/codegen/src/emitters/shared.ts:329`)

```text
/**
 * Returns `true` when every kind a slot resolves to is hidden (`_`-prefixed).
 * Such fields represent parser-inserted infrastructure (e.g. `_semicolon` →
 * `_automatic_semicolon`) that shouldn't be exposed as a required user-facing
 * factory parameter.
 */
```

### `stampExpressionFor` (`packages/codegen/src/emitters/shared.ts:355`)

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

### `fieldTypeComponents` (`packages/codegen/src/emitters/shared.ts:455`)

```text
/**
 * Compute the shared {@link TypeComponent} list for a field slot.
 *
 * Pure derivation over the slot's `values`. Applies:
 *   1. Hidden-keyword inlining: `_kw_async` → literal `"async"`.
 *   2. NodeMap lookup: resolved kind → `nodeKind`; missing → `missing`
 *      (with a PascalCase fallback name for consumers that need one).
 *
 * Used by `types.ts::fieldTypeExpr` and `factories.ts::fieldElementType`
 * — previously two parallel walkers with near-identical logic, differing
 * only in prefix choice and missing-kind handling.
 *
 * @param field - The field whose slot values drive the projection.
 * @param nodeMap - The assembled node map for kind resolution.
 * @returns Ordered components (in the order the kinds / literals appear
 *   in `field.values`). Callers deduplicate at emission time.
 */
```

### `childTypeComponents` (`packages/codegen/src/emitters/shared.ts:497`)

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

### `resolveEntryLiteral` (`packages/codegen/src/emitters/shared.ts:531`)

```text
/**
 * Resolve a single NodeOrTerminal entry to a single literal string, or
 * `undefined` when the entry doesn't point at a single literal.
 *
 * Three sources:
 *   - TerminalValue → its `.value`.
 *   - NodeRef to a hidden `_kw_*` keyword kind (AssembledKeyword) or
 *     hidden single-string AssembledToken → the keyword/token text.
 *
 * Any other shape (non-literal node ref, unresolved ref) returns undefined.
 */
```

### `keywordPresenceKind` (`packages/codegen/src/emitters/shared.ts:560`)

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

### `keywordPresenceValue` (`packages/codegen/src/emitters/shared.ts:612`)

```text
/**
 * The single literal for a boolean-keyword field. Returns `undefined` if
 * the field is not a boolean-keyword field.
 */
```

### `keywordPresenceValues` (`packages/codegen/src/emitters/shared.ts:627`)

```text
/**
 * The ordered-unique literal set for a bitflag field. Returns an empty
 * array if the field is not a bitflag field. Order follows the order
 * the literals appear in the grammar's `values` array — that order is
 * the canonical render / enum-declaration order.
 */
```

### `keywordPresenceIsNonEmptyRepeat` (`packages/codegen/src/emitters/shared.ts:647`)

```text
/**
 * Returns `true` when EVERY entry in the slot's `values` has multiplicity
 * `nonEmptyArray`. Used by the consts emitter to decide whether a bitflag
 * enum needs a `None = 0` member (repeat allows zero → yes, repeat1 no).
 */
```

### `classifyPrimitiveField` (`packages/codegen/src/emitters/shared.ts:660`)

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

### `kindEnumTextIdPairs` (`packages/codegen/src/emitters/shared.ts:836`)

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

### `resolveFieldStorageInfo` (`packages/codegen/src/emitters/shared.ts:876`)

```text
/**
 * Shared classification for the public field-storage contract emitted by the
 * generator.
 */
```

### `classifyBranchSlots` (`packages/codegen/src/emitters/shared.ts:897`)

```text
/**
 * Classify a branch/group/polymorph node's user-facing slot count — the ONE
 * source of truth for single-slot vs multi-slot detection.
 *
 * Filters out:
 * - Auto-stamp fields (constant-valued, stamped by factory)
 * - Hidden-infra fields (all-hidden-kind slots, parser infrastructure)
 * - Keyword-presence fields (boolean / bitflag keyword toggles)
 *
 * Returns `multiSlot` when 0 or 2+ user-facing slots remain (0 maps to
 * the parameterless factory path, which is a multi-slot degenerate).
 * Returns `singleSlot` with full metadata when exactly 1 survives.
 *
 * @remarks
 * Replaces ad-hoc `isSingleFieldDirect` checks in factories.ts,
 * factory-map.ts, and from.ts. Those call sites should migrate to
 * this function (Task 3).
 *
 * @param node - An AssembledNode (only `branch`, `group`, and `polymorph` modelTypes
 *   produce meaningful results; other modelTypes always return `multiSlot`).
 * @param nodeMap - The assembled node map, needed by the filtering helpers.
 */
```

### `computeSlotClasses` (`packages/codegen/src/emitters/shared.ts:946`)

```text
/**
 * Post-assembly pass: compute and store `slotClass` on every branch/group/
 * polymorph
 * node in the node map. Called from `generate.ts` after `hydrateSlotRefs`.
 */
```

### `resolveSingleFieldFactorySlot` (`packages/codegen/src/emitters/shared.ts:959`)

```text
/**
 * Resolve the sole field eligible for the direct-value factory surface.
 *
 * @remarks
 * This is intentionally narrower than {@link classifyBranchSlots}: the slot
 * must be a named field slot (not an inferred child), and hidden
 * infrastructure kinds remain config-only even when they structurally
 * collapse to one field.
 */
```

### `resolveFactoryFieldNames` (`packages/codegen/src/emitters/shared.ts:987`)

```text
/**
 * Resolve the raw field names visible on a kind's factory surface.
 *
 * @remarks
 * Validator metadata uses this to decide when orphan `$children` should be
 * promoted back into named config slots. The field list must match the actual
 * factory surface, so auto-stamped fields, keyword-presence toggles, and
 * hidden infra are excluded.
 */
```

### `classifyChildFactorySurface` (`packages/codegen/src/emitters/shared.ts:1009`)

```text
/**
 * Resolve whether a branch factory consumes children directly instead of a config bag.
 *
 * @remarks
 * `direct` covers the single unnamed-child surface (`factory(child)`), while
 * `spread` covers repeated child surfaces (`factory(...children)`). Field-backed
 * direct factories intentionally return `null` here — they still consume a direct
 * value, but not through the children surface used by wrap/from dispatch.
 */
```

### `unnamedChildSlotFacts` (`packages/codegen/src/emitters/shared.ts:1043`)

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

### `classifyFactoryShape` (`packages/codegen/src/emitters/shared.ts:1068`)

```text
/**
 * Shared factory-shape classification used by emitters and validator metadata.
 *
 * @remarks
 * This encodes only the validator-relevant calling convention:
 * - `direct` => factory takes one direct value (sole field OR sole child)
 * - `spread` => factory takes positional children (`...children`)
 * - `config` => factory takes a config object
 */
```

### `wordCharAsciiTable` (`packages/codegen/src/emitters/shared.ts:1245`)

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

### `deriveArmNameFromRule` (`packages/codegen/src/emitters/suggested.ts:39`)

```text
/**
 * Derive a short, readable base label for a single choice arm.
 *
 * Priority: explicit `variant()` label (from `tagVariants`) → named
 * symbol / supertype target → leading named member of a seq (symbol,
 * supertype, or identifier-shaped string literal) → `form${index}`
 * fallback.
 *
 * @param node - The rule for this choice arm.
 * @param index - Zero-based position within the parent CHOICE.
 * @returns A suggested name string (not yet deduplicated — use
 *   {@link deduplicateArmNames} to collide-resolve a full arm list).
 * @remarks Used when suggesting `variant(...)` for bare choices that
 *   lack explicit variant() markers. The name is a suggestion the
 *   grammar author can refine; the important property is that distinct
 *   arms produce distinct base names where possible.
 *
 *   Previously duplicated as an inline ladder inside `armNamesFor`.
 *   Both paths now share this base-name function.
 */
```

### `deduplicateArmNames` (`packages/codegen/src/emitters/suggested.ts:77`)

```text
/**
 * Assign collision-free names to all arms of a CHOICE node.
 *
 * @param members - The choice's arm rules, in order.
 * @param nameFn - Per-arm name derivation function (receives rule + index).
 *   Defaults to {@link deriveArmNameFromRule}.
 * @returns An array of unique strings, one per arm. Duplicate base names
 *   get a numeric suffix (2, 3, …) so `registerPolymorphVariant`'s
 *   uniqueness guard accepts the full set.
 */
```

### `_locateTopLevelChoice` (`packages/codegen/src/emitters/suggested.ts:100`)

```text
/**
 * Locate the first CHOICE reachable from the rule root through the
 * transparent composition wrappers that `variant()` can target — seq
 * members + single-content wrappers. Returns the path to that choice
 * (joinable with `/`) plus a suggested variant name per alternative.
 * Names come from `tagVariants` when present (`variant.name` — "semi",
 * "form_1", ...); fall back to `form_N` for untagged choices.
 *
 * Returns null if no choice is reachable — the rule isn't a polymorph
 * candidate despite Link's suggestion (rare but possible when multiple
 * passes run; defensive).
 */
```

### `findSymbolPosition` (`packages/codegen/src/emitters/suggested.ts:142`)

```text
/**
 * Find the position index of `targetSymbol` within a top-level SEQ rule.
 * Matches both the bare symbol (held inference — pipeline didn't rewrite)
 * and the already-wrapped `field(fieldName, symbol(targetSymbol))` shape
 * (applied inference). Returns null when the rule is not a SEQ at the
 * top level or the target can't be located as a direct member.
 */
```

### `createDeduplicatingEmitter` (`packages/codegen/src/emitters/suggested.ts:665`)

```text
/**
 * Build the rule-block emitter: a closure over a seen-set that dedups
 * repeated kinds, plus a `quoteKey` helper so callers can render the
 * same kind as either a bare identifier or a JSON-quoted property key.
 *
 * @returns `{ emittedKinds, emit, quoteKey }` — shared state + emit closure
 * @remarks
 *   Every call to `emit(kind, fn)` is a no-op after the first for a given
 *   `kind`, so repeated entries in the source log collapse to one block.
 */
```

### `groupInferencesByKind` (`packages/codegen/src/emitters/suggested.ts:690`)

```text
/**
 * Group inferred-field entries by their parent kind.
 *
 * @param entries - Inferred-field entries from the derivation log.
 * @returns Map from kind string to the entries that inferred fields on it.
 */
```

### `detectGroupCandidates` (`packages/codegen/src/emitters/suggested.ts:719`)

```text
/**
 * Walk rule bodies looking for nested seqs that could benefit from
 * group synthesis. Candidates:
 *   - Live inside a wrapper (not at the top level of the rule body).
 *   - Have ≥1 structural member (field / symbol / supertype).
 */
```

### `emitSuggestedGroupsBlock` (`packages/codegen/src/emitters/suggested.ts:867`)

```text
/**
 * Format the `suggestedGroups` export block. All entries are held —
 * the author copies them into the grammar.sittir.ts `groups:` block to activate.
 */
```

### `computeTemplateBundleHash` (`packages/codegen/src/emitters/template-hash.ts:58`)

```text
/**
 * Compute a stable SHA-256 hex digest over a set of template files.
 *
 * @param files — the grammar's `.jinja` files. Order is irrelevant;
 *   the function sorts by filename internally.
 * @returns lowercase hex-encoded SHA-256 digest, 64 characters.
 */
```

### `stringifyRule` (`packages/codegen/src/emitters/templates.ts:170`)

```text
/**
 * Statically render a rule to its fixed literal text — only meaningful for
 * a rule classified `terminal` by Table 1 (`isNonterminalRuleType`,
 * rule-catalog.ts): every reachable descendant is compile-time-known text,
 * so there's nothing to capture at read-time. Callers gate on that
 * classification (e.g. `separatorToString` below); this function mirrors
 * Table 1's own recursive structure for the shapes actually reachable in a
 * `RenderRule` (GROUP/VARIANT survive wrapper-deletion; TOKEN is preserved
 * by the mechanism but excluded from `RenderRule`'s type — see
 * `RenderRule`'s doc comment — so it falls to `default` like any other
 * unreachable/nonterminal shape).
 */
```

### `firstBoundaryCharOfFragment` (`packages/codegen/src/emitters/templates.ts:397`)

```text
/**
 * Extract the leftmost meaningful character from a template fragment:
 * the first real text char or, if the fragment opens with a `{{ slot }}`
 * expression, the word-like stand-in character.
 */
```

### `isTopLevelMultiConditional` (`packages/codegen/src/emitters/templates.ts:424`)

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

### `_insertAfterTopLevelIfTags` (`packages/codegen/src/emitters/templates.ts:479`)

```text
/**
 * Insert `insert` immediately AFTER each top-level `{% if ... %}` opening tag
 * in `str`. "Top-level" means at depth 0 in the if/endif nesting.
 */
```

### `_insertBeforeTopLevelEndifTags` (`packages/codegen/src/emitters/templates.ts:509`)

```text
/**
 * Insert `insert` immediately BEFORE each top-level `{% endif %}` closing tag
 * in `str`. "Top-level" means the tag transitions from depth 1 to depth 0.
 */
```

### `lookupSlot` (`packages/codegen/src/emitters/templates.ts:698`)

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

### `separatorToString` (`packages/codegen/src/emitters/templates.ts:771`)

```text
/**
 * Project a rule's separator metadata onto a primitive `string`. The
 * shared `RuleBase.separator` is the nested `{value, trailing?, leading?}`
 * fact (PR-S); the rendering layer only needs the primitive textual
 * separator. Gates on Table 1 (`isNonterminalRuleType`) rather than a bare
 * `StringRule` check — ANY terminal-classified shape (a plain literal, a
 * sequence of literals, a group/variant wrapping one) has fixed,
 * compile-time-known text and can be embedded directly via `stringifyRule`.
 * A genuinely nonterminal shape (choice/repeat/symbol/pattern) has no fixed
 * text — returns `undefined` (NOT `stringifyRule`'s `''`) so the caller
 * falls back to the slot's per-value separator / `DEFAULT_JOIN_SEPARATOR`
 * instead of silently treating "unknown" as "empty" (the previous
 * behavior: a choice-shaped separator like `choice(',', ';')` would render
 * with NO separator character at all, since `''` short-circuits the `??`
 * fallback chain in `emitListSlot` just as effectively as a real value).
 * `isNonterminalRuleType` is typed over `Rule<'evaluate'>` but classifies
 * purely by `.type` + child shape — phase-agnostic in practice, same cast
 * pattern used throughout PR-S (e.g. wrapper-deletion.ts's OPTIONAL case).
 */
```

### `isNonterminalSeparatorRule` (`packages/codegen/src/emitters/templates.ts:797`)

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

### `selectJoinFilter` (`packages/codegen/src/emitters/templates.ts:813`)

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

### `emitListSlot` (`packages/codegen/src/emitters/templates.ts:876`)

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

### `emitScalarSlot` (`packages/codegen/src/emitters/templates.ts:934`)

```text
/**
 * Emit Jinja for a scalar slot: `{{ name }}`. The slot name is the RAW
 * (snake_case, singular) name lowercased.
 */
```

### `emitSlotReference` (`packages/codegen/src/emitters/templates.ts:942`)

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

### `emitFieldNameSlot` (`packages/codegen/src/emitters/templates.ts:963`)

```text
/**
 * Fallback slot emission keyed on a field name + the leaf `rule.multiplicity`,
 * for a field-wrapped rule that has NO registered back-pointer slot (rare —
 * e.g. a deleteWrapper-stamped fieldName whose rule id / fieldName didn't
 * resolve in `lookupSlot`). Prefer `emitSlotReference` whenever a slot exists.
 */
```

### `emitSymbol` (`packages/codegen/src/emitters/templates.ts:990`)

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

### `pickConditionalKey` (`packages/codegen/src/emitters/templates.ts:1201`)

```text
/**
 * Pick a Jinja conditional predicate name for a clause whose body emits a
 * slot. In RenderRule (wrapper-free) input, field wrappers no longer exist —
 * field metadata lives as `fieldName` on the leaf. Check leaf attributes
 * first, then transparent wrappers, then symbol/seq fallbacks.
 */
```

### `scanArmBody` (`packages/codegen/src/emitters/templates.ts:1252`)

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

### `assertSlotPreservation` (`packages/codegen/src/emitters/templates.ts:1449`)

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

### `runTemplateEmitter` (`packages/codegen/src/emitters/templates.ts:1558`)

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

### `writeJinjaTemplates` (`packages/codegen/src/emitters/templates.ts:1610`)

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

### `testTypeDiscriminant` (`packages/codegen/src/emitters/test.ts:49`)

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

### `emitBranchTest` (`packages/codegen/src/emitters/test.ts:155`)

```text
/**
 * Emit a branch test — dispatches to the container calling convention
 * (positional element args) when `classifyChildFactorySurface` recognizes
 * an unnamed child slot, otherwise falls through to the regular
 * field-carrying config-object test below. Single entry point so
 * `emitTests`' dispatch loop doesn't have to know about the two shapes.
 */
```

### `emitSeparatedListTest` (`packages/codegen/src/emitters/test.ts:289`)

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

### `pickSampleForPattern` (`packages/codegen/src/emitters/test.ts:372`)

```text
/**
 * Pick a sample string that satisfies a tree-sitter leaf pattern.
 * Tries a handful of common shapes, returning the first that matches
 * (anchored full-string). When `pattern` is undefined the leaf accepts
 * arbitrary text and `'test'` is fine. Returns `null` when no
 * candidate matches and the test should be skipped.
 */
```

### `resolveConcreteKind` (`packages/codegen/src/emitters/test.ts:459`)

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

### `dummyValueForField` (`packages/codegen/src/emitters/test.ts:538`)

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

### `buildDummyStub` (`packages/codegen/src/emitters/test.ts:598`)

```text
/**
 * Build a complete dummy stub literal for `kind`, recursing into required
 * fields when `kind` is branch- or group-shaped.
 *
 * @remarks
 * Leaf/keyword/enum/token kinds are safe as flat `{ $type, $text, $source,
 * $named }` stubs (this is what native's transport `FromNapiValue` expects
 * for those shapes). Branch AND group kinds additionally require every
 * required field to be present and correctly shaped — a flat stub is
 * rejected with "Missing field `_x`" by the native transport. Groups
 * (`AssembledGroup`, `modelType === 'group'`) are the synthesized hidden
 * single-field wrapper kinds (e.g. `_match_arm_with_comma`) — structurally
 * a one-field record like a branch, just keyed via `.slots` instead of
 * `.fields` (see {@link allSlotsOf}). This function fills required fields
 * recursively for both shapes, bounded by {@link MAX_DUMMY_DEPTH} and a
 * per-branch `visiting` set (cycle guard for self-referential grammars).
 *
 * When recursion bottoms out (depth limit or cycle) the stub still declares
 * `$type`/`$text`/`$source`/`$named` but omits nested required fields —
 * this may still fail construction for pathological kinds, matching the
 * existing "skip when no safe sample found" precedent elsewhere in this
 * emitter (see {@link pickSampleForPattern}) rather than guessing further.
 */
```

### `dummyTextForKind` (`packages/codegen/src/emitters/test.ts:687`)

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

### `classifySlot` (`packages/codegen/src/emitters/transport-common.ts:29`)

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

### `buildSupertypeTransportSet` (`packages/codegen/src/emitters/transport-common.ts:80`)

```text
/**
 * Build a registry of supertype typeName → resolved concrete subtype set
 * from the assembled node map.
 *
 * @param nodeMap - the assembled node map for the grammar
 */
```

### `acceptedTransportKinds` (`packages/codegen/src/emitters/transport-common.ts:124`)

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

### `deriveChildrenKinds` (`packages/codegen/src/emitters/transport-common.ts:168`)

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

### `typeTestDiscriminant` (`packages/codegen/src/emitters/type-test.ts:40`)

```text
/**
 * @param isLeaf - When true, the node uses `Terminal<K>` (string-keyed `$type`);
 *   numeric discriminants are not applicable until `Terminal` itself is migrated.
 *   Phase A only migrates structural (branch/container/polymorph) interfaces.
 */
```

### `enumMemberTypeTestDiscriminant` (`packages/codegen/src/emitters/type-test.ts:60`)

```text
/**
 * Build the expected discriminant for a type-test assertion on an enum kind.
 *
 * @remarks
 * Mirrors `enumMemberDiscriminant` in `types.ts`: resolves each member
 * value to its `TSKindId.X` entry and joins as a union. Falls back to
 * the string kind name when no entries resolve or `kindEntries` is absent.
 *
 * @param node - The `AssembledEnum` node.
 * @param kindEntries - Catalog entries for TSKindId lookup.
 * @returns The expected discriminant expression for the type assertion.
 */
```

### `kindDiscriminantOrLiteral` (`packages/codegen/src/emitters/types.ts:37`)

```text
/**
 * Return the discriminant expression for a kind, falling back to a JSON
 * string literal when `kindEntries` is absent (legacy callers / tests
 * that don't supply `generatedIdTables`). The primary path always uses
 * `TSKindId.X` so generated grammar packages carry numeric discriminants.
 */
```

### `buildGrammarKeySet` (`packages/codegen/src/emitters/types.ts:373`)

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

### `collectNodesByCategory` (`packages/codegen/src/emitters/types.ts:409`)

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

### `collectAllKinds` (`packages/codegen/src/emitters/types.ts:473`)

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

### `emitKindIdEnumAndLookups` (`packages/codegen/src/emitters/types.ts:523`)

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

### `makeInliningLookupUnion` (`packages/codegen/src/emitters/types.ts:641`)

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

### `enumMemberDiscriminant` (`packages/codegen/src/emitters/types.ts:661`)

```text
/**
 * Build the `$type` discriminant expression for an enum kind by resolving
 * each member value to its `TSKindId.X` entry and joining as a union.
 *
 * @remarks
 * Enum kinds are codegen-only constructs — they have no parser.c symbol of
 * their own. At runtime the `$type` will always be one of the member
 * tokens' parser symbol IDs. Each member value (e.g. `".."`, `"u8"`) is
 * an anonymous token that has a catalog entry via its `symbolName`. When
 * `kindEntries` is present and at least one member resolves, the
 * discriminant is a union of `TSKindId.X` references. Falls back to
 * `number` when no members resolve (shouldn't happen for real grammars)
 * or when `kindEntries` is absent.
 *
 * @param node - The `AssembledEnum` node whose member discriminant to build.
 * @param kindEntries - Catalog entries for TSKindId lookup; `undefined` for
 *   legacy callers without parser.c metadata.
 * @returns The discriminant expression string (e.g.
 *   `TSKindId.DotDot` or `TSKindId.U8 | TSKindId.I8 | ...`).
 */
```

### `emitLeafTerminalAliases` (`packages/codegen/src/emitters/types.ts:704`)

```text
/**
 * Emit `export type <TypeName> = Terminal<kind, textType>` aliases for all
 * leaf / keyword / enum kinds, skipping those that are completely unreferenced.
 *
 * @remarks
 * Every leaf/keyword/enum is a `Terminal<K, V>`, so all terminal shapes share
 * one shared shape from `@sittir/types`.
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

### `emitTreeInterfaceDeclarations` (`packages/codegen/src/emitters/types.ts:770`)

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

### `emitSupertypeUnionDeclarations` (`packages/codegen/src/emitters/types.ts:831`)

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

### `collectAndEmitTokenTypeAliases` (`packages/codegen/src/emitters/types.ts:909`)

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
 * Stubs are emitted as `type` aliases over `Terminal<kind>` rather than
 * verbose `interface` declarations — semantically identical, much shorter.
 *
 * @param lines - Output line buffer to append to.
 * @param nodeMap - The assembled node map.
 * @param generatedTypes - Mutable set of emitted type names; updated in place.
 * @param treeEmitted - Mutable set of type names for which a Tree interface was
 *   already emitted; updated in place as new token Tree interfaces are added.
 */
```

### `assertNoCamelCaseCollisions` (`packages/codegen/src/emitters/types.ts:973`)

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

### `emitNamespaceInterfaceLine` (`packages/codegen/src/emitters/types.ts:1005`)

```text
/**
 * Emit a single `export interface <TypeName>Ns extends NodeNs<…> {}` line.
 *
 * @remarks
 * Spec 009 Layer 1: threads `NamespaceMap` through `NodeNs` so that
 * `Loose` → `FromInputOf<T, Scalars, Strings, [], NamespaceMap>` can
 * short-circuit multi-branch union recursions to `NamespaceMap[K]['Loose']`
 * lookups instead of re-projecting per arm.
 *
 * @param lines - Output line buffer to append to.
 * @param typeName - The `TypeName` portion of the interface name.
 */
```

### `emitFieldArrayDeclaration` (`packages/codegen/src/emitters/types.ts:1094`)

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

### `_fieldTypeParts` (`packages/codegen/src/emitters/types.ts:1128`)

```text
/**
 * Expand a field's content types into the identifier parts that
 * would form its type union. Used by both the dedup pre-pass and
 * the emission pass. Literal-value enums and empty unions return
 * `[]` — they don't get aliased because they don't produce a
 * multi-type union.
 */
```

### `fieldTypeExpr` (`packages/codegen/src/emitters/types.ts:1148`)

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

### `stringUnion` (`packages/codegen/src/emitters/types.ts:1188`)

```text
/**
 * Wrap a field's type expression with the correct ADR-0012 brand when
 * the field classifies as keyword-presence, or fall through to the
 * auto-stamp brand, or no brand otherwise.
 *
 * Precedence:
 *   1. `BooleanKeyword<T>` when `keywordPresenceKind === 'boolean'`.
 *   2. `Bitflag<ConstEnumName, T>` when `keywordPresenceKind === 'bitflag'`.
 *   3. `AutoStamp<T>` when `isAutoStampField`.
 *   4. Bare `T` otherwise.
 *
 * The keyword-presence and auto-stamp domains don't overlap: auto-stamp
 * requires required+non-repeated, boolean requires optional, bitflag
 * requires repeat.
 */
```

### `quoteKey` (`packages/codegen/src/emitters/types.ts:1327`)

```text
/** Quote a type/object key if it is not a plain identifier. */
```

### `emitRefineFormTreeAliases` (`packages/codegen/src/emitters/types.ts:1336`)

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

### `emitNamespaceSugarBlock` (`packages/codegen/src/emitters/types.ts:1359`)

```text
/**
 * Emit the namespace sugar block for one kind — the declaration-merged
 * `namespace <TypeName> { Config; Fluent; Loose; Tree; Kind; }` block,
 * plus per-form sub-namespaces when refine() registered forms for this
 * kind.
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

### `emitRefineFormSubNamespaces` (`packages/codegen/src/emitters/types.ts:1397`)

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

### `collectTypeImports` (`packages/codegen/src/emitters/wrap.ts:96`)

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

### `branch` (`packages/codegen/src/emitters/wrap.ts:122`)

```text
/**
	 * Emit a branch wrap function — field-carrying (handles both regular
	 * and container shapes; fields is `[]` for the container case).
	 */
```

### `group` (`packages/codegen/src/emitters/wrap.ts:151`)

```text
/**
	 * Emit a group wrap function — hidden structural helpers still need lazy
	 * accessors so native read payloads can drill through their child stubs.
	 */
```

### `separatedList` (`packages/codegen/src/emitters/wrap.ts:184`)

```text
/**
	 * Emit a separatedList wrap function — per-instance separator capture
	 * (`_content`/`_separator_kind`/`_leading_sep`/`_trailing_sep`). See
	 * `emitSeparatedListWrap`'s doc comment for the wire-shape rationale.
	 */
```

### `buildSupertypeMembersMap` (`packages/codegen/src/emitters/wrap.ts:213`)

```text
/**
 * Builds a map from supertype kind name to its resolved transitive member set.
 * Used by the emitted `SUPERTYPE_MEMBERS` const in wrap.ts to enable
 * `_matchesAllowedWrapKind` to correctly match concrete kinds against
 * grammar-declared supertypes (e.g., "identifier" against "_expression").
 */
```

### `collectConcreteStorageKeys` (`packages/codegen/src/emitters/wrap.ts:429`)

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
 *   closure (`computeSupertypeTransitiveParseKinds`, computed once
 *   post-assemble — see that entry) to enumerate concrete subtypes. The
 *   result is a list of concrete `_<kind>` keys — exactly one of which will
 *   be populated on the data object at runtime.
 *
 * Returns undefined when expansion produces a single key that already
 * matches the slot's nominal `_<slot.name>` — the legacy single-key access
 * is sufficient and no probe shape is needed.
 *
 * Union-slot design §5 (PR 1.5): a degenerate arm's value is LABEL-routed
 * (`parseName`, {@link valueParseLabelsOf}) — for that value, `storageName !=
 * parseName` by construction, and the wire key IS the literal tree-sitter
 * field name (`read_node.rs` keys a field-tagged child by field name, not by
 * kind). Expanding a label through the supertype tree — treating it as a
 * kind to expand — replaces the literal wire key with subtype kinds that are
 * never populated for a field-tagged child, so label names are unioned in
 * UNEXPANDED. Kind-derived names (including any that happen to equal a
 * label, e.g. `field('declaration', declaration)`) keep expanding as before.
 */
```

### `computeConsumedCandidateKeys` (`packages/codegen/src/emitters/wrap.ts:487`)

```text
/**
 * Consumed candidate keys: concrete kind-keyed wire keys any field's
 * `??`-chain reads (`collectConcreteStorageKeys`) that are NOT some field's
 * own canonical `storageKey`. Shared by `emitFieldCarryingWrap` (its
 * `fields` param) and `emitSeparatedListWrap` (its `node.fields` — same
 * Task-2 `_slots` source, single- or multi-field) so both spread bases omit
 * the SAME raw un-dispatched shadow stubs instead of drifting apart — see
 * `_omitWrapKeys`'s doc comment for the masking bug this prevents.
 */
```

### `collectWrapWireKeyTypes` (`packages/codegen/src/emitters/wrap.ts:508`)

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

### `buildWrapParamType` (`packages/codegen/src/emitters/wrap.ts:568`)

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

### `collectSeparatorCandidateKindNames` (`packages/codegen/src/emitters/wrap.ts:721`)

```text
/**
 * Recursively collect candidate separator token kind names from a
 * nonterminal separator rule (`AssembledSeparatedList.separatorRule`) —
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

### `buildSeparatedListContentSlot` (`packages/codegen/src/emitters/wrap.ts:767`)

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

### `collectSeparatedListContentStorageKeys` (`packages/codegen/src/emitters/wrap.ts:796`)

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

### `collectSeparatedListWireKeyTypes` (`packages/codegen/src/emitters/wrap.ts:817`)

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
 * The widened type is derived from `canonicalField` — `node.fields`'s own
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

### `buildSeparatedListWrapParamType` (`packages/codegen/src/emitters/wrap.ts:871`)

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

### `emitSeparatedListWrap` (`packages/codegen/src/emitters/wrap.ts:891`)

```text
/**
 * Emit a wrap function for a `'separatedList'`-classified kind — REAL
 * per-instance separator capture, replacing the Task-2 stub's
 * `_slots`-based branch-reuse emission for wrap.ts specifically (other
 * emitters — render-module.ts, factories.ts, from.ts — still read the
 * stub's `_slots`/`fields` surface; only wrap.ts, the TS SDK's deprecated
 * JS view layer, switches over here — see `AssembledSeparatedList`'s doc
 * comment: "at that point this slot-bearing surface goes away" for wrap.ts).
 *
 * Field derivation, verified against real generated grammar output
 * (`probe-kind` on python's `with_clause_bare` / `expression_statement_tuple`
 * / `lambda_parameters` and typescript's `object_type_content_comma` /
 * `object_type_content_semi` — the only 5 real `'separatedList'` kinds
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
 *   real `'separatedList'` kinds have a literal `,` separator with
 *   `separatorRule === undefined`). Implemented via the SAME `$other`
 *   kind-id scan `readTerminalFromOther` already performs for kindEnum
 *   reclamation (option B) — reused, not reinvented — but this specific
 *   path has no real-grammar coverage yet.
 */
```

### `computeCollidedReclaimKinds` (`packages/codegen/src/emitters/wrap.ts:1079`)

```text
/**
 * Option-B reclamation collision guard. Across a kind's kindEnum slots, find
 * member kinds claimed by more than one slot — a `$other` token of that kind
 * would be ambiguous between them. Warn and return the colliding set so the
 * caller can SUPPRESS the auto-reclaim for those members (they fall back to
 * normal field population / explicit fielding — option C).
 */
```

### `emitFieldStorageLines` (`packages/codegen/src/emitters/wrap.ts:1116`)

```text
/**
 * Emit per-field `_<name>: <storeExpr>,` storage assignments for `fields`,
 * reusing the exact same per-field kindEnum/verbatim/alias/candidate-
 * storage-key drilling logic regardless of which caller's kind classifies as
 * (`'branch'`/`'group'` via `emitFieldCarryingWrap`, or a MULTI-field
 * `'separatedList'` via `emitSeparatedListWrap` — e.g. a separatedList whose
 * elements route to more than one real slot by kind, not one shared
 * bucket). Extracted so both callers share ONE source for this drilling
 * decision tree instead of two copies drifting apart.
 */
```

### `emitFieldAccessorLines` (`packages/codegen/src/emitters/wrap.ts:1184`)

```text
/**
 * Emit per-field `<propName>() { ... },` inline accessor methods for
 * `fields` — the accessor-side counterpart to `emitFieldStorageLines`,
 * shared for the same reason (branch/group AND multi-field separatedList
 * both need identical per-field drilling for their accessors).
 */
```

### `emitInlineWithProperty` (`packages/codegen/src/emitters/wrap.ts:1315`)

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
 * @param fields - Named field slots.
 * @param children - Unnamed child slots (currently always `[]` from both
 *   call sites — `AssembledBranch/Group.fields` already unifies unnamed
 *   slots into `fields`).
 */
```

### `triviaKinds` (`packages/codegen/src/emitters/client-utils.ts:11`)

```text
/** Trivia kind names (e.g. `['line_comment', 'block_comment']`). */
```

### `expectTestFailures` (`packages/codegen/src/emitters/emit.ts:54`)

```text
/** Kind → reason for known-failing generated tests (`expectTestFailures:`
	 *  in grammar.sittir.ts) — threaded to `emitTests` for `describe.skip` emission. */
```

### `CodegenEmitter` (`packages/codegen/src/emitters/emitter.ts:3`)

```text
/** Constructor-based emitter with no init() lifecycle phase. */
```

### `strict` (`packages/codegen/src/emitters/factories.ts:62`)

```text
/** Emit runtime leaf pattern validation. Default `false`. */
```

### `generatedIdTables` (`packages/codegen/src/emitters/factories.ts:64`)

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * factories stamp numeric `$type: TSKindId.X` discriminants. When absent
	 * (legacy callers / unit tests), falls back to string `$type: 'kind' as const`.
	 */
```

### `inlineKinds` (`packages/codegen/src/emitters/factories.ts:71`)

```text
/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When it's absent from this list, it's a codegen bug — throw.
	 */
```

### `synthesizedKinds` (`packages/codegen/src/emitters/factories.ts:77`)

```text
/**
	 * Kind names synthesized by evaluate's inline-alias-source pass
	 * (`synthesizeInlineAliasSources`). These have no parser symbol by design;
	 * warn and skip, same treatment as inline-list kinds.
	 */
```

### `buildFactoryMapEntries` (`packages/codegen/src/emitters/factories.ts:219`)

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

### `MapEntry` (`packages/codegen/src/emitters/factories.ts:1126`)

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

### `polymorphVariants` (`packages/codegen/src/emitters/factory-map.ts:45`)

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

### `generatedIdTables` (`packages/codegen/src/emitters/from.ts:53`)

```text
/**
	 * Parser-symbol ID tables for numeric $type comparison emission.
	 * When present, from.ts emits `input.$type === TSKindId.X` checks.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
```

### `enumValues` (`packages/codegen/src/emitters/from.ts:661`)

```text
/** Enum value list when the underlying node is an enum. */
```

### `KindInterner` (`packages/codegen/src/emitters/from.ts:703`)

```text
/** Interner signature passed through the resolver emitter calls. */
```

### `generatedIdTables` (`packages/codegen/src/emitters/is.ts:34`)

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * guards compare BOTH numeric `TSKindId.X` and string kind-name during
	 * Phase A coexistence. Kinds with no parser symbol (TSGrammar-only) are
	 * skipped — they can never appear at runtime. When absent (legacy /
	 * unit-test callers), guards compare string kind-names only.
	 */
```

### `member` (`packages/codegen/src/emitters/is.ts:139`)

```text
/** TSKindId enum member name (e.g. 'FunctionItem'); present when kindEntries available. */
```

### `numericId` (`packages/codegen/src/emitters/is.ts:141`)

```text
/** Numeric TSKindId; undefined when kind has no parser symbol. */
```

### `memberIds` (`packages/codegen/src/emitters/is.ts:201`)

```text
/** Numeric IDs of member kinds (Phase A coexistence); empty = string-only. */
```

### `parseId` (`packages/codegen/src/emitters/kind-discriminant.ts:32`)

```text
/**
	 * The alias occurrence's own runtime symbol id, when this kind's ONLY
	 * visible identity comes from an `alias_sym_*` occurrence distinct from
	 * its plain `sym_*` storage id (see `GeneratedIdEntry.parseId`). Runtime
	 * `$type` dispatch tables must also map THIS id to the kind — it's what
	 * tree-sitter actually emits at the aliased position.
	 */
```

### `symbolName` (`packages/codegen/src/emitters/kind-discriminant.ts:40`)

```text
/**
	 * Symbol name from `ts_symbol_names[]`, when distinct from `kind`.
	 * Anonymous tokens (`anon_sym_PLUS`) carry the literal text (`"+"`)
	 * here while `kind` is the parser symbol name (`"PLUS"`). Used to
	 * emit additional `kindIdFromName` switch arms so JS callers passing
	 * the literal text can also resolve to the correct id.
	 */
```

### `anon` (`packages/codegen/src/emitters/kind-discriminant.ts:48`)

```text
/** True when this entry came from an `anon_sym_*` parser symbol. */
```

### `kindDiscriminantExprForId` (`packages/codegen/src/emitters/kind-discriminant.ts:141`)

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

### `parseId` (`packages/codegen/src/emitters/kind-discriminant.ts:175`)

```text
/** See `GeneratedIdEntry.parseId` — the alias occurrence's own runtime id, when distinct from `id`. */
```

### `grammar` (`packages/codegen/src/emitters/kind-id-rust.ts:25`)

```text
/** Grammar name, e.g. `'rust'` | `'typescript'` | `'python'`. */
```

### `name` (`packages/codegen/src/emitters/node-model.ts:57`)

```text
/** for node-ref: target kind name */
```

### `parseKind` (`packages/codegen/src/emitters/node-model.ts:59`)

```text
/** CST kind / alias target when it differs from the storage kind */
```

### `unresolved` (`packages/codegen/src/emitters/node-model.ts:61`)

```text
/** for node-ref: true when the ref was not resolved to an AssembledNode */
```

### `value` (`packages/codegen/src/emitters/node-model.ts:63`)

```text
/** for terminal: string value */
```

### `factoryShape` (`packages/codegen/src/emitters/node-model.ts:90`)

```text
/**
	 * PR-K: factory calling convention (`text`/`config`/`direct`/`spread`),
	 * folded from `factory-map.json5`'s `factoryShapes`. Present only for
	 * factory-emitting kinds (`classifyFactoryShape` non-null).
	 */
```

### `factoryFields` (`packages/codegen/src/emitters/node-model.ts:96`)

```text
/**
	 * PR-K: the factory-declared field names, folded from `factory-map.json5`'s
	 * `factoryFields`. Present only for factory-emitting kinds.
	 */
```

### `separator` (`packages/codegen/src/emitters/node-model.ts:107`)

```text
/**
	 * Repeat-list separator surfaced when the assembled rule was a
	 * `repeat` / `repeat1` (the former-container shape, Phase 1d.vii).
	 * Field-carrying branches don't surface this — the repeat separator
	 * is reachable via the per-value metadata on the relevant
	 * `AssembledNonterminal` slot.
	 */
```

### `text` (`packages/codegen/src/emitters/node-model.ts:129`)

```text
/**
	 * Present when the pattern's sole realisation is a single fixed anonymous
	 * literal (e.g. `_semicolon` → `";"`). Used by the render-module to gate
	 * the u16 kind-id acceptance branch in the generated `FromNapiValue` impl.
	 * Absent for content-bearing patterns (identifier, number, …).
	 */
```

### `SerializedSeparatedList` (`packages/codegen/src/emitters/node-model.ts:167`)

```text
/**
 * No wire/render/factory support yet (separator-as-slot Task 2) — this
 * serialization is deliberately minimal (mirrors `SerializedMulti`'s shape
 * using the analogous `AssembledSeparatedList` facts) rather than attempting
 * to serialize the full separator rule tree, which is a later task's design
 * surface.
 */
```

### `polymorphVariants` (`packages/codegen/src/emitters/node-model.ts:201`)

```text
/**
	 * PR-K: polymorph variant dispatch tables, folded from
	 * `factory-map.json5`'s `polymorphVariants` (top-level, keyed by parent
	 * kind). Built via the shared `buildFactoryMap` so the dispatch logic stays
	 * single-sourced. Consumed by the validators' `nodeToConfig` /
	 * `inferPolymorphVariant` / variant-adopted-kind scan.
	 */
```

### `fieldAliasMap` (`packages/codegen/src/emitters/node-model.ts:209`)

```text
/**
	 * PR-K: per-field alias-source map, folded from `factory-map.json5`'s
	 * `fieldAliasMap` (top-level, keyed `"parentKind.fieldName"` →
	 * `{ aliasTarget: sourceKind }`). The per-field `values[].parseKind`/`name`
	 * carry the same facts, but the alias-source PAIRING + the
	 * factory-emitting-kind FILTER (`collectAliasSourceKinds`) live only in
	 * `buildFactoryMap`. Serializing the finished map keeps that filtering
	 * single-sourced — a validator-side rebuild would have to re-derive it.
	 * Consumed by `resolveAliasedKind`.
	 */
```

### `factorySlots` (`packages/codegen/src/emitters/node-model.ts:220`)

```text
/**
	 * PR-K: per-kind slot metadata, folded from `factory-map.json5`'s
	 * `factorySlots` (top-level, keyed by kind). Same single-source rationale
	 * as `fieldAliasMap` — the emitting-kind filter is `buildFactoryMap`'s, not
	 * reconstructable from per-field data without duplicating it. Consumed by
	 * `nodeToConfig`'s config-surface normalization.
	 */
```

### `RefineKindInfo` (`packages/codegen/src/emitters/refine-emit.ts:16`)

```text
/**
 * Per-kind refine descriptor collected once, consumed by every emitter
 * that needs to walk the forms. Exposes the field-literal narrowing
 * per form so downstream emission doesn't re-walk the rule tree.
 */
```

### `narrowedFields` (`packages/codegen/src/emitters/refine-emit.ts:31`)

```text
/** Per-form field narrowings: each entry says "in this form, field
	 *  `fieldName` should be narrowed to the literal `literal`". */
```

### `jinjaTemplates` (`packages/codegen/src/emitters/render-module-runner.ts:20`)

```text
/** Pre-computed jinja templates. When omitted, a fresh TemplateEmitter drives the loop. */
```

### `Grammar` (`packages/codegen/src/emitters/render-module.ts:81`)

```text
/** Grammars the emitter supports. Matches the three per-grammar packages. */
```

### `RustRenderModuleEmit` (`packages/codegen/src/emitters/render-module.ts:89`)

```text
/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
 */
```

### `hashRs` (`packages/codegen/src/emitters/render-module.ts:96`)

```text
/** `rust/crates/sittir-{lang}/src/render/hash.rs` */
```

### `hashTs` (`packages/codegen/src/emitters/render-module.ts:98`)

```text
/** `packages/{lang}/src/hash.ts` */
```

### `templatesRs` (`packages/codegen/src/emitters/render-module.ts:100`)

```text
/** `rust/crates/sittir-{lang}/src/render/templates.rs` — per-kind Template structs */
```

### `transportRs` (`packages/codegen/src/emitters/render-module.ts:102`)

```text
/** `rust/crates/sittir-{lang}/src/render/transport.rs` — AnyTransport + FromNapiValue + typed dispatch + transport bridge */
```

### `libRs` (`packages/codegen/src/emitters/render-module.ts:104`)

```text
/** `rust/crates/sittir-{lang}/src/render/mod.rs` — exposes transport render entrypoints */
```

### `parseNames` (`packages/codegen/src/emitters/render-module.ts:329`)

```text
/** Storage→parse pairs merged from every walked supertype (the owner AND
	 * flattened reserved sub-supertypes) — see `SupertypeRule.subtypeParseNames`.
	 * Keyed by `subtypes[].subKind`; first-stamped pair wins on collision. */
```

### `hasTransportField` (`packages/codegen/src/emitters/render-module.ts:457`)

```text
/** True when this slot has a corresponding field in the transport struct.
	 *  Slots without transport fields (virtual presentation slots from the
	 *  template walker) must be defaulted to "" in the typed dispatch path. */
```

### `storageName` (`packages/codegen/src/emitters/render-module.ts:461`)

```text
/** Rust struct storage identifier for this slot — used to build `node.<storageName>`
	 *  access expressions. Defaults to `name` when no assembled slot exists. */
```

### `isUnnamed` (`packages/codegen/src/emitters/render-module.ts:464`)

```text
/** True when this slot was inferred (not declared via `field(...)`) — i.e. it
	 *  came from `slotModel.unnamed`. Consumers use this to
	 *  route lookups through `node.children` instead of `node.fields[name]`. */
```

### `separator` (`packages/codegen/src/emitters/render-module.ts:470`)

```text
/** Per-slot separator stamped on the slot's NodeRef/TerminalValue metadata.
	 *  Used by ListNonterminalView emission so each list-multiplicity slot
	 *  gets its own separator (rather than a node-wide first-match). */
```

### `backingTransportField` (`packages/codegen/src/emitters/render-module.ts:474`)

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

### `backingInnerRequired` (`packages/codegen/src/emitters/render-module.ts:486`)

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

### `backingDirectField` (`packages/codegen/src/emitters/render-module.ts:495`)

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

### `transportHasChildren` (`packages/codegen/src/emitters/render-module.ts:511`)

```text
/** True when the transport struct actually has a `children` field (structuralChildren.length > 0).
	 *  The template may reference `children` (hasChildren === true) without a transport field —
	 *  in that case we emit an empty ListNonterminalView instead of accessing node.children. */
```

### `childrenRequired` (`packages/codegen/src/emitters/render-module.ts:515`)

```text
/** True when the transport struct's `children` field is `Vec<...>` (not `Option<Vec<...>>`). */
```

### `childrenMultiple` (`packages/codegen/src/emitters/render-module.ts:517`)

```text
/** True when the transport struct's `children` field is `Vec<T>` (multiple elements possible).
	 *  When false, the field is scalar: `T` (required) or `Option<T>` (optional). */
```

### `PerSlotChildEnum` (`packages/codegen/src/emitters/render-module.ts:2544`)

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

### `typeName` (`packages/codegen/src/emitters/render-module.ts:2554`)

```text
/** PascalCase typeName of the parent node. */
```

### `ownerKind` (`packages/codegen/src/emitters/render-module.ts:2556`)

```text
/** Raw grammar kind of the parent node — owner key for SCC lookup. */
```

### `fieldName` (`packages/codegen/src/emitters/render-module.ts:2558`)

```text
/** Slot name — symmetric for named and unnamed slots (cleanup-rules §E1). */
```

### `kinds` (`packages/codegen/src/emitters/render-module.ts:2560`)

```text
/** Concrete kinds in this slot. */
```

### `literals` (`packages/codegen/src/emitters/render-module.ts:2562`)

```text
/** Terminal literal children that may appear in runtime `$children`. */
```

### `parseAliases` (`packages/codegen/src/emitters/render-module.ts:2564`)

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
	 * PR-K3c: retained ONLY for the name-based fallback — kinds present in
	 * `acceptedIdsByKind` never consult it.
	 */
```

### `acceptedIdsByKind` (`packages/codegen/src/emitters/render-module.ts:2583`)

```text
/**
	 * Per-storage-kind accepted wire ids from the mint stamps
	 * (`acceptedIdPairsByKindOf`, node-map.ts). Kinds absent here (id-less
	 * values, supertype-expanded arms with no value in hand) fall back to
	 * the name chain (`acceptedTransportKinds` + `kindIdByKind`).
	 */
```

### `TransportMetadataField` (`packages/codegen/src/emitters/render-module.ts:3506`)

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

### `enumTypeName` (`packages/codegen/src/emitters/render-module.ts:4081`)

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

### `collectAliasSourceKinds` (`packages/codegen/src/emitters/shared.ts:48`)

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

### `TypeComponent` (`packages/codegen/src/emitters/shared.ts:285`)

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

### `PrimitiveFieldStorage` (`packages/codegen/src/emitters/shared.ts:441`)

```text
/** Rust struct-field storage for a `classifyPrimitiveField` verdict. */
```

### `UnnamedChildSlotFacts` (`packages/codegen/src/emitters/shared.ts:686`)

```text
/** Real facts about a container-shape branch's single unnamed child slot. */
```

### `RoundTripDiagnostic` (`packages/codegen/src/emitters/suggested.ts:127`)

```text
/**
 * Round-trip diagnostic captured by corpus validation. One entry per
 * corpus case that failed parse → readNode → render → reparse: we
 * surface the offending rule kind plus an input/output diff so the
 * user can spot the drop (typically a missing `joinBy` separator, a
 * `transform()` patch that would wrap a repeated slot, or a render
 * template gap). Emitted as a dedicated section at the top of
 * overrides.suggested.ts.
 */
```

### `entry` (`packages/codegen/src/emitters/suggested.ts:137`)

```text
/** Corpus entry name (e.g., "Async / await used as identifiers"). */
```

### `kind` (`packages/codegen/src/emitters/suggested.ts:139`)

```text
/** Rule<'link'> kind the validator was testing. */
```

### `source` (`packages/codegen/src/emitters/suggested.ts:141`)

```text
/**
	 * Which validator raised the diagnostic:
	 *  - 'render' — `parse → readNode → render → reparse`
	 *    (template / routing / joinBy issues)
	 *  - 'factory' — `parse → readNode → factory() → render → reparse`
	 *    (factory API surface gaps: missing fields, wrong defaults)
	 */
```

### `category` (`packages/codegen/src/emitters/suggested.ts:149`)

```text
/** What broke — 'parse-error' (rendered text unparseable) or 'ast-mismatch' (structural drift). */
```

### `input` (`packages/codegen/src/emitters/suggested.ts:151`)

```text
/** Input source text. */
```

### `rendered` (`packages/codegen/src/emitters/suggested.ts:153`)

```text
/** Rendered text (what the renderer emitted). Absent when parse-error occurs before render. */
```

### `message` (`packages/codegen/src/emitters/suggested.ts:155`)

```text
/** Human-readable message from the validator. */
```

### `roundTripFailures` (`packages/codegen/src/emitters/suggested.ts:162`)

```text
/** Corpus round-trip diagnostics, collected by CLI --roundtrip. */
```

### `kind` (`packages/codegen/src/emitters/suggested.ts:646`)

```text
/** Parent rule kind whose body contains the nested seq. */
```

### `path` (`packages/codegen/src/emitters/suggested.ts:648`)

```text
/** Slash-separated positional path to the seq within the rule body. */
```

### `discriminatorGuess` (`packages/codegen/src/emitters/suggested.ts:650`)

```text
/** Heuristic discriminator guess — first structural member's name, or position-based fallback. */
```

### `TemplateFile` (`packages/codegen/src/emitters/template-hash.ts:39`)

```text
/**
 * Input to `computeTemplateBundleHash`. One entry per `.jinja` file
 * in the grammar's templates directory.
 */
```

### `filename` (`packages/codegen/src/emitters/template-hash.ts:44`)

```text
/**
	 * Template filename, without the directory prefix (e.g.
	 * `function_item.jinja`). Used only as the per-entry framing
	 * label; the same template under two different filenames hashes
	 * differently.
	 */
```

### `content` (`packages/codegen/src/emitters/template-hash.ts:51`)

```text
/**
	 * Template body. Line endings will be CRLF → LF normalized before
	 * hashing, so the caller needn't pre-normalize.
	 */
```

### `isWordChar` (`packages/codegen/src/emitters/templates.ts:77`)

```text
/** Grammar-faithful word-class test for a single char (ASCII table from
	 *  wordCharAsciiTable + Unicode-alphanumeric fallback). Used for
	 *  compile-time STATIC-STATIC seam spaces; dynamic seams belong to the
	 *  runtime SpacingWriter with the same class. */
```

### `rules` (`packages/codegen/src/emitters/templates.ts:83`)

```text
/**
	 * PR-137: `normalizedRules` (wrapper-deleted `RenderRule` view), not
	 * `linkRules` — `emitSymbol`'s hidden-helper fallback (the only
	 * consumer) used to bridge `linkRules[name]` through a per-call
	 * `deleteWrapper()`; verified byte-identical to reading
	 * `normalizedRules[name]` directly for every hidden ref the fallback
	 * actually reaches, across all 3 grammars, so the bridge is gone.
	 */
```

### `visitingHelpers` (`packages/codegen/src/emitters/templates.ts:92`)

```text
/**
	 * Cycle guard for hidden-helper recursion in `emitSymbol`. A flat mutable
	 * Set tracks visited helper names, keyed by `@${name}`, passed down via
	 * this field. Each call to `emitOne()` resets it.
	 */
```

### `ownerSlots` (`packages/codegen/src/emitters/templates.ts:98`)

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

### `currentKind` (`packages/codegen/src/emitters/templates.ts:108`)

```text
/**
	 * DIAGNOSTIC (`DBG_SLOT_MISS=1`): the kind currently being emitted, threaded
	 * by `emitOne` so `lookupSlot` can attribute a `slotByRuleId` miss to a kind.
	 */
```

### `generatedIdTables` (`packages/codegen/src/emitters/test.ts:34`)

```text
/**
	 * Parser-symbol ID tables for numeric $type assertion emission.
	 * When present, generated tests emit `TSKindId.X` in `toBe()` calls.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
```

### `expectTestFailures` (`packages/codegen/src/emitters/test.ts:40`)

```text
/**
	 * Kind → reason for known-failing tests (`expectTestFailures:` in the
	 * grammar's grammar.sittir.ts). Listed kinds emit `describe.skip` with the
	 * reason inline so the suite stays green on tracked defects without
	 * masking regressions in other kinds.
	 */
```

### `SlotClass` (`packages/codegen/src/emitters/transport-common.ts:10`)

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

### `generatedIdTables` (`packages/codegen/src/emitters/type-test.ts:20`)

```text
/**
	 * Parser-symbol ID tables for numeric $type assertion emission.
	 * When present, generated type tests emit `TSKindId.X` in extends checks.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
```

### `typeTestDiscriminant` (`packages/codegen/src/emitters/type-test.ts:28`)

```text
/**
 * Returns the expected-type expression for a `_TypeExtends<X['$type'], ...>` check.
 *
 * @remarks
 * When kindEntries is present (KindID pipeline), emits `TSKindId.X`. When
 * absent (legacy / unit-test path), falls back to `'<kind>'` string literal.
 *
 * @param kind - The grammar kind string.
 * @param kindEntries - Collected kind-enum entries, or `undefined` for fallback.
 * @param nodeMap - The assembled node map.
 * @returns Expression string suitable for `_TypeExtends<X['$type'], <expr>>`.
 */
```

### `generatedIdTables` (`packages/codegen/src/emitters/wrap.ts:71`)

```text
/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * per-kind wrap functions stamp `$type: TSKindId.X` to convert the string
	 * from core's readNode to the numeric runtime discriminant. When absent,
	 * $type is inherited from data (string passthrough — legacy mode).
	 */
```

### `inlineKinds` (`packages/codegen/src/emitters/wrap.ts:78`)

```text
/**
	 * Kind names listed in the grammar's `inline:` array. When a kind has no
	 * parser symbol AND appears here, it's a deliberately inlined rule — warn
	 * and skip. When absent from this list, it's a codegen bug — throw.
	 */
```

### `synthesizedKinds` (`packages/codegen/src/emitters/wrap.ts:84`)

```text
/**
	 * Kind names synthesized by evaluate's inline-alias-source pass. No parser
	 * symbol by design; warn and skip.
	 */
```

### `rawFactoryName` (`packages/codegen/src/emitters/wrap.ts:185`)

```text
/** rawFactoryName for $with — null when the kind has no factory. */
```

### `childSurface` (`packages/codegen/src/emitters/wrap.ts:187`)

```text
/** Child-factory surface when the node exposes positional child factories. */
```

### `ResolveSlotDrillConfig` (`packages/codegen/src/emitters/wrap.ts:220`)

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

### `candidateStorageKeys` (`packages/codegen/src/emitters/wrap.ts:241`)

```text
/**
	 * Optional list of concrete `_<kind>` storage keys to probe in lieu of
	 * the slot's nominal single key. When set, the storeExpr becomes a
	 * `??`-coalesce chain over these keys. See `collectConcreteStorageKeys`.
	 */
```

### `reclaimKindIdsExpr` (`packages/codegen/src/emitters/wrap.ts:247`)

```text
/**
	 * Pre-built numeric-kindId array expression (e.g. `[TSKindId.DotDotEq,
	 * TSKindId.DotDot]`) for a kindEnum slot's member discriminants. Drives the
	 * `$other` reclamation fallback (option B). Built by the caller, which holds
	 * `nodeMap` + `kindEntries` for `kindDiscriminantExpr` resolution.
	 */
```

### `kindEnumTextIdPairs` (`packages/codegen/src/emitters/wrap.ts:254`)

```text
/**
	 * Stamped text→member-kindId pairs for a kindEnum slot (see
	 * `kindEnumTextIdPairs`, shared.ts). Baked into `projectKindEnumStorage`'s
	 * call so wrapper-materialized enum reads project to NUMERIC member ids on
	 * the wire (id-first contract) instead of raw text.
	 */
```

### `forceUnknownElement` (`packages/codegen/src/emitters/wrap.ts:261`)

```text
/**
	 * Emit `normalizeRepeatedWrapSlot<unknown>`/`normalizeSingularWrapSlot<unknown>`
	 * with an EXPLICIT type argument instead of leaving `T` to be inferred from
	 * `reclaimedStoreExpr`. For a multi-field `AssembledSeparatedList`
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

### `computeCollidedReclaimKinds` (`packages/codegen/src/emitters/wrap.ts:819`)

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

### `PUNCT_MNEMONIC` (`packages/codegen/src/emitters/consts.ts:491`)

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

### `optChain` (`packages/codegen/src/emitters/from.ts:714`)

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

### `RESERVED` (`packages/codegen/src/emitters/is.ts:39`)

```text
/** JS reserved words that need a trailing `_` when used as a guard key. */
```

### `RESERVED_GUARD_NAMES` (`packages/codegen/src/emitters/is.ts:90`)

```text
/** Methods on the `is` / `assert` namespaces beyond per-kind entries. */
```

### `RESERVED_SUPERTYPE_ENUM_NAMES` (`packages/codegen/src/emitters/render-module.ts:269`)

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

### `RESERVED_TRANSPORT_STRUCT_NAMES` (`packages/codegen/src/emitters/render-module.ts:279`)

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

### `RENDERABLE_PREFIX` (`packages/codegen/src/emitters/render-module.ts:1195`)

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

### `collectFromSlots` (`packages/codegen/src/emitters/render-module.ts:1907`)

```text
/** Accumulate supertype names from a single node's slots — named and
	 *  unnamed flow through one path (cleanup-rules §E1). */
```

### `TRANSPORT_METADATA_FIELDS` (`packages/codegen/src/emitters/render-module.ts:3417`)

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

### `TRANSPORT_TEXT_FIELD` (`packages/codegen/src/emitters/render-module.ts:3448`)

```text
/**
 * The `transport_text` field, conditional on branch structs. Kept
 * separate from `TRANSPORT_METADATA_FIELDS` because leaf structs use
 * a plain `text: String` instead.
 */
```

### `LITERAL_TO_VARIANT_NAME` (`packages/codegen/src/emitters/render-module.ts:3737`)

```text
/**
 * Mapping from operator/punctuation literal text to a safe Rust PascalCase
 * identifier. Covers the symbols that appear across the three grammars
 * (rust, typescript, python). Identifiers that need disambiguation from
 * Rust keywords get a `Kw` suffix.
 */
```

### `IDENT_RE` (`packages/codegen/src/emitters/shared.ts:127`)

```text
/** TypeScript identifier pattern — starts with letter/underscore/dollar,
 * continues with word chars or dollar. Used by emitters to decide whether
 * a kind name can be emitted as a bare identifier vs. a quoted literal. */
```

### `JINJA_COND_FULL_RE` (`packages/codegen/src/emitters/templates.ts:342`)

```text
/** Full Jinja conditional: `{% if ... %}...{% endif %}` (incl. whitespace-strip variants). */
```

### `SLOT_WORDLIKE_CHAR` (`packages/codegen/src/emitters/templates.ts:345`)

```text
/**
 * A virtual word-like character used to stand in for slot emissions
 * (`{{ name }}`) and other dynamic content whose runtime first/last char
 * is unknown but typically an identifier / literal head. Using a real
 * word character lets the grammar's wordMatcher decide consistently
 * (matches `\w`, `[a-zA-Z_]`, identifier-shaped patterns).
 */
```

### `DEFAULT_JOIN_SEPARATOR` (`packages/codegen/src/emitters/templates.ts:724`)

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

### `MAX_DUMMY_DEPTH` (`packages/codegen/src/emitters/test.ts:444`)

```text
/** Maximum branch-recursion depth for synthesized dummy stubs. Bounds
 * self-referential grammars (e.g. `expression` containing `expression`);
 * beyond this depth `buildDummyStub` falls back to the flat base literal
 * (`$type`/`$text`/`$source`/`$named`, omitting nested required fields —
 * see its docstring) rather than looping forever. */
```

### `TransportLiteral.resolvedKindId` (`packages/codegen/src/emitters/transport-projection.ts`)

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

### `collectVariantAdoptedBranches` (`packages/codegen/src/emitters/factory-map.ts`)

Variant-adopted branches are kinds that went through Link's push-down
(`pushAmbientScaffoldIntoVariantChildren`): they classify as `branch` but still
carry the variant-child kinds on `variantChildKinds`. They must land in
`polymorphVariants` so that `.from()`-dispatch and the validator's deep-read
path both know which kinds participate in `variant()` adoption.

### `mapVariantChildKindsToSuffixes` (`packages/codegen/src/emitters/factory-map.ts`)

Uses `prefixNamedSuffix` (`compiler/variant-structural.ts`) rather than a raw
`${kind}_` slice. The raw slice is unsound when `kind` is hidden: a hidden
parent's visible target strips its OWN leading `_` independently of the
parent's, per `polymorphVisibleName`'s convention — `_match_block` yields
`match_block_block`, not `_match_block_block`. It falls back to the full name
only for the (currently unobserved) shape where the target doesn't prefix-match
at all.

### `expandToConcreteParseKinds` (`packages/codegen/src/emitters/wrap.ts:57`)

Expands each name to the parser's actual emittable leaf kinds: a plain
(non-supertype) name passes through as-is; a supertype name expands to its
stamped `transitiveParseKinds` closure (`computeSupertypeTransitiveParseKinds`,
below — computed once, post-assemble; this reads the stamp rather than
re-walking the closure per call site, as the deleted `factory-map.ts::
expandRuntimeDiscriminatorKinds`/`pushAliasMintedArmParseNames` did on every
call). Dedupes by normalized (hidden-prefix-stripped) name across the whole
input list.

### `computeSupertypeTransitiveParseKinds` (`packages/codegen/src/emitters/shared.ts:40`)

Stamps each supertype's transitive parse-kind closure once, post-hydration,
onto `AssembledSupertype.transitiveParseKinds` (a plain `NodeOrTerminal[]` —
the same reference shape `.subtypes` already uses). Walks the assemble-time-
RESOLVED `AssembledSupertype.subtypes`/`.subtypeParseNames` — hidden names
already expanded to concrete kinds — NOT the raw `rule.subtypes`, which is
less complete (`AssembledSupertype`'s own doc comment: do not substitute
it). This is why this function does its own closure walk instead of calling
`types/rule.ts::transitiveParseKinds` (the pre-hydration raw-rule helper
`compiler/model/node-map.ts::existingSupertypeClosureOf` uses) — the two
representations diverge (assemble does additional hidden-name resolution
between link and itself) and a shared walk over either one would be wrong,
or stale, for the other's caller. Confirmed empirically: reusing the
raw-rule path here silently dropped a real typescript discriminator kind
(`_statement_identifier_group1`) until caught by diffing regenerated
`wrap.ts` byte-for-byte against pre-refactor HEAD for all 3 grammars.

`wrap.ts`'s storage-key routing (`expandToConcreteParseKinds`, above) reads
this stamp instead of re-walking the closure per call site.

### `coversExactly` (`packages/codegen/src/emitters/transport-common.ts`)

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

### `addVisibleAliasNameOfHiddenKind` (`packages/codegen/src/emitters/transport-common.ts`)

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

### `resolveLiteralKindId` (`packages/codegen/src/emitters/render-module.ts:2624`)

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
