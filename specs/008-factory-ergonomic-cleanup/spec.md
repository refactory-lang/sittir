# Feature Specification: Factory & Ergonomic Surface Cleanup

**Feature Branch**: `008-factory-ergonomic-cleanup`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Factory & Ergonomic Surface cleanup: NamespaceMap type restructure, is/isTree/isNode/assert type guards, codegen-time fixes (remove _attach, inline _union_ aliases, import _NodeData, remove double casts), from.ts cleanup (concrete types, namespace imports), ir.ts namespace imports and grouped sub-namespaces, dead code removal"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified type-family access via NamespaceMap (Priority: P1)

A consumer writing code that manipulates `FunctionItem` nodes wants a single, discoverable way to access the data interface, the factory input config, the fluent builder output, the loose input shape, and the parse-tree shape for that kind. Today those live in five parallel top-level aliases (`FunctionItem`, `FunctionItemConfig`, `LooseFunctionItem`, `FunctionItemTree`, `ConfigMap`/`LooseMap` entries). The consumer has to learn the naming convention for each and import them separately.

After this change, `FunctionItem.Config`, `FunctionItem.Fluent`, `FunctionItem.Loose`, `FunctionItem.Tree`, and `FunctionItem.Node` all resolve from one source (a per-kind namespace that extends a shared computed base). A generic `ConfigFor<'function_item'>` / `FluentFor<'function_item'>` path exists for code that parameterises over kinds, and a `NamespaceMap` type surface supports programmatic type utilities. All three paths resolve to the same concrete interface.

**Why this priority**: The types restructure removes ~791 lines of derived per-kind aliases from generated files and establishes a single source of truth for the type family. It is a prerequisite for the from.ts rewrite (User Story 3), because from.ts signatures switch from `ReturnType<typeof functionItem>` / `T.FunctionItemConfig['name']` paths to the namespace forms. Without this, from.ts cleanup can't land.

**Independent Test**: Regenerate all three grammar packages, run `tsc --noEmit` on each. Write a small consumer script that uses all three access paths (`T.FunctionItem.Config`, `ConfigFor<'function_item'>`, `NamespaceMap['function_item']['Config']`) and assert via a type-level check (`extends ... ? true : never`) that they resolve to the same concrete type.

**Acceptance Scenarios**:

1. **Given** a consumer imports `FunctionItem` from a generated grammar package, **When** they access `FunctionItem.Config`, **Then** the type resolves to the factory's input config without any extra imports or alias lookups.
2. **Given** a consumer writes a generic helper `function build<K extends keyof NamespaceMap>(c: ConfigFor<K>): FluentFor<K>`, **When** they call `build<'function_item'>(...)`, **Then** TypeScript enforces that the input config matches `FunctionItem.Config` and the return type matches `FunctionItem.Fluent`.
3. **Given** the generated grammar declares `interface FunctionItemNs extends NodeNs<FunctionItem> {}`, **When** a new kind is added to the grammar, **Then** adding the one-line `XNs extends NodeNs<X>` declaration and a `NamespaceMap` entry is sufficient to make the kind's full type family available — no per-kind `XConfig`, `LooseX`, or `XTree` aliases need to be emitted.
4. **Given** the old aliases are marked as deprecated re-exports, **When** consumer code references `FunctionItemConfig` directly, **Then** the code still compiles but the compiler surfaces a deprecation notice pointing to `FunctionItem.Config`.

---

### User Story 2 - Type guards: is × shape composition (Priority: P1)

A consumer writing an ast-grep transform receives an `AnyNodeData` or `AnyTreeNode`. They want to narrow it to a specific kind (is it a `function_item`?) AND to a specific shape (is it a tree node or a constructed data node?). Today they write manual `v.type === 'function_item'` checks, cast their way to the right shape, and repeat per rule. There is no generated guard API.

After this change, each grammar package exports three guard surfaces:

- `is` — a namespace object with per-kind guards (`is.functionItem(v)`), a generic inverse (`is.kind(v, 'function_item')`), and supertype guards (`is.expression(v)`, `is.pattern(v)`, etc.). All narrow the `type` discriminant.
- `isTree(v)` / `isNode(v)` — shape guards with overloaded signatures that resolve via `NamespaceMap` when the kind is already narrowed, and fall back to generic `AnyTreeNode` / `AnyNodeData` when it isn't.
- `assert` — parity with the `is` namespace, but throws `TypeError` on failure and uses TypeScript's `asserts v is T` signature so subsequent code in the same scope is narrowed.

Composition: `is.kind × shape = concrete type`. `is.functionItem(v) && isTree(v)` narrows to `FunctionItem.Tree`; the same with `isNode` narrows to `FunctionItem.Node`.

**Why this priority**: Type guards are the most-requested consumer feature on the sittir surface. Consumers writing transforms in user code today have no typed way to narrow nodes — they fall back to manual casts. The API mirrors Babel's `t.is*` / `t.assert*` convention so prior-art users have a familiar mental model. The work is self-contained (one new emitter, one new runtime module per grammar) and lands independently of the types restructure.

**Independent Test**: Regenerate a grammar, write a consumer script using each guard shape (`is.functionItem`, `is.kind`, `is.expression`, `isTree`, `isNode`, `assert.functionItem`). Assert narrowing via a type-level check: the `if (is.functionItem(v) && isTree(v)) { ... }` block must give `v` a concrete `FunctionItem.Tree` type inside. `assert.functionItem({ type: 'block' })` must throw `TypeError` with a message identifying expected vs actual kind.

**Acceptance Scenarios**:

1. **Given** a value of type `AnyNodeData`, **When** the consumer wraps access in `if (is.functionItem(v))`, **Then** inside the block, TypeScript narrows `v.type` to the literal `'function_item'`.
2. **Given** a narrowed value, **When** the consumer composes `if (is.functionItem(v) && isTree(v))`, **Then** inside the block `v` has type `FunctionItem.Tree` and the consumer can call tree-node methods (`v.field('name')`, `v.range()`) without casts.
3. **Given** a value where the kind is unknown at authoring time, **When** the consumer writes `if (isTree(v)) { ... }`, **Then** inside the block `v` has type `AnyTreeNode` (the fallback overload) — no kind narrowing, but tree-node shape is confirmed.
4. **Given** supertype groups are declared in the grammar, **When** the consumer calls `is.expression(v)`, **Then** inside the block `v.type` narrows to the `Expression` union of concrete kinds.
5. **Given** an assertion-style callsite, **When** the consumer writes `assert.functionItem(v)`, **Then** subsequent code in the same scope treats `v` as narrowed, and a mismatched input throws `TypeError` describing the expected and actual kind.

---

### User Story 3 - from.ts clarity: quick-return on NodeData, single-access on bag (Priority: P2)

A contributor opens a generated `from.ts` to debug a `.from()` resolver. Today every field read carries a three-way cast + dual-access expression like `((input as {...}).fields?.['snake'] ?? (input as {...}).camelCase)`. There are 297 instances across the rust resolvers alone. Resolver generics use computed paths through Config (`NonNullable<T.FunctionItemConfig['name']>`, 417 instances). Return types are spelled `ReturnType<typeof functionItem>` (192 instances). The per-factory import line is a ~3000-character wall.

After this change, `.from()` reclaims its actual semantic: **resolve a loose bag into a fluent node**. A NodeData input is already resolved — `.from()` quick-returns identity. A bag input is always camelCase by construction, so every field read is single-access:

```ts
export function functionItemFrom(
    input: T.FunctionItem | T.FunctionItem.Loose,
): T.FunctionItem.Fluent {
    if (isNodeData(input)) return input as T.FunctionItem.Fluent;

    return functionItem({
        visibilityModifier: _resolveOneBranch<T.VisibilityModifier>(input.visibilityModifier, "visibility_modifier"),
        name:               _resolveOne<T.Identifier | T.Metavariable>(input.name, _K11, _K0),
        body:               _resolveOneBranch<T.Block>(input.body, "block"),
        // ...
    });
}
```

Imports fold into `import * as F from './factories.js'` and `import type * as T from './types.js'`. Resolver generics become concrete unions derived from `AssembledField.contentTypes`. Return types become `T.FunctionItem.Fluent`.

The snake-keyed `.fields[...]` path is **gone from from.ts entirely**. No helper, no dual-access, no `??` fallback, no inline casts. The premise is that `isNodeData(input)` narrows to fluent territory — see Assumptions — so the body only runs on camelCase bag inputs.

**Why this priority**: Reclaims `.from()`'s original semantic as a loose-bag-to-fluent translator. Eliminates 297 dual-access expressions (~100 chars each) and reduces every resolver body from multi-line cast chains to single-access property reads. Makes the file readable and debuggable. Makes field-type changes local (concrete types localise the diff). Depends on User Story 1 (NamespaceMap) for `T.FunctionItem.Fluent` to be defined. Does not block consumer-facing behaviour — this is contributor and reader ergonomics.

**Independent Test**: Regenerate all three grammars, run `tsc --noEmit`, run the full corpus-validation suite. Ceilings must match pre-cleanup numbers byte-for-byte. Read `from.ts` — no `((input as {` pattern anywhere, no `.fields?.[` anywhere, the top of the file has a small namespace import block.

**Acceptance Scenarios**:

1. **Given** a regenerated `from.ts`, **When** a reader scans the top of the file, **Then** they see a small namespace import block, not a multi-kilobyte single-line import wall.
2. **Given** any resolver, **When** the reader inspects the body, **Then** it begins with `if (isNodeData(input)) return input as ...;` and the rest reads fields via `input.camelCase` single-access.
3. **Given** a resolver generic, **When** the reader inspects its type parameter, **Then** it names the concrete union (e.g. `T.Identifier | T.Metavariable`) and not a computed path through `Config`.
4. **Given** a resolver return type, **When** the reader inspects it, **Then** it is `T.FunctionItem.Fluent` (direct) and not `ReturnType<typeof functionItem>` (computed).
5. **Given** a NodeData input produced by a factory call, **When** the consumer passes it to `.from()`, **Then** the resolver returns the same instance (identity quick-return) without touching any field.
6. **Given** a camelCase loose bag, **When** the consumer passes it to `.from()`, **Then** every field resolves via `_resolveOne` / `_resolveOneBranch` / `_resolveMany` against `input.<camelCase>` — no `.fields[snake]` code path is entered.
7. **Given** the prior ceiling numbers, **When** the regenerated packages run the corpus-validation suite, **Then** every ceiling matches the pre-cleanup number.

---

### User Story 4 - Generated code micro-cleanups (Priority: P2)

Generated output carries several small structural artefacts that accumulate over time: a custom `_attach` helper that wraps `Object.assign`, auto-named `_union_Foo_Bar_Baz` type aliases that appear exactly once or twice, a locally-duplicated `_NodeData` interface in `wrap.ts` even though the file already imports from `@sittir/types`, and a `as unknown as WrappedNode<X>` double-cast at the end of every wrap function that works around a too-loose `drillIn` return type.

After this change: `_attach` goes away in favour of inline `Object.assign`. Auto-named `_union_*` aliases are either inlined (when used once or twice) or replaced by semantic names derived from field context (when used ≥ a threshold). `_NodeData` is imported from `@sittir/types`. The `drillIn` return type is tightened so wrap functions compile with `satisfies WrappedNode<K>` (or no cast at all).

**Why this priority**: Individually trivial, but together they reduce ~400 lines across generated files, remove artefacts that confuse readers ("what is `_attach`? is it semantically different from `Object.assign`?"), and tighten the type system so generated code carries fewer unchecked casts. Work is in the emitters only — consumer-visible behaviour is unchanged.

**Independent Test**: For each micro-cleanup: regenerate, inspect the emitted output, confirm the pattern is gone. For `_attach`: grep generated output for `_attach(` — zero hits. For `_union_*`: grep for `_union_` — zero hits. For `_NodeData`: grep `wrap.ts` for `interface _NodeData` — zero hits; grep for `import.*_NodeData` — one hit. For the cast: grep for `as unknown as WrappedNode` — zero hits. Run full test suite after each change to confirm behaviour-preserving.

**Acceptance Scenarios**:

1. **Given** a regenerated `ir.ts`, **When** a reader searches for `_attach`, **Then** there is no helper definition and no call site — all attachments use `Object.assign(fn, { from: fnFrom })` directly.
2. **Given** a regenerated `types.ts`, **When** a reader searches for `_union_`, **Then** there are no auto-named union aliases — unions are inlined at the field site, with semantic names used only for intentionally reused unions.
3. **Given** a regenerated `wrap.ts`, **When** a reader inspects the top of the file, **Then** `_NodeData` is imported from `@sittir/types` alongside `WrappedNode`, and no local interface declaration exists.
4. **Given** a regenerated wrap function, **When** a reader inspects its return expression, **Then** it does not end with `} as unknown as WrappedNode<X>;` — the return is typed without any `as unknown as` coercion.

---

### User Story 5 - Namespace imports and grouped IR sub-namespaces (Priority: P2)

A contributor reading `ir.ts` faces two ~5000-character single-line imports (from factories and from resolvers) before the actual `ir` object. A consumer using supertype-oriented transforms wants to browse factories grouped by role (`ir.expr.binary`, `ir.expr.call`, `ir.decl.function_`, ...) instead of scanning a 150-entry flat namespace.

After this change: `ir.ts` imports factories and resolvers via namespace imports (`import * as F`, `import * as FR`). Supertype-grouped sub-namespaces are emitted alongside the flat `ir` object — `ir.expr`, `ir.decl`, `ir.pattern`, etc. The flat `ir.*` surface is preserved; grouped forms are additive.

**Why this priority**: Two ergonomic wins packaged together. The import wall change is readability-only. The grouped sub-namespace is consumer-facing ergonomics — supertype-oriented transforms become much cleaner to read and write. Both are additive (the flat `ir.*` surface remains), so no consumer migration is required.

**Independent Test**: Regenerate a grammar. Inspect `ir.ts` — imports are namespace imports; the flat `ir.*` object still has every kind; `ir.expr.*`, `ir.decl.*`, etc. sub-namespaces also exist. Write a consumer script that constructs nodes via both `ir.functionItem(...)` and `ir.decl.function_(...)` — both must produce identical output.

**Acceptance Scenarios**:

1. **Given** a regenerated `ir.ts`, **When** a reader inspects the top, **Then** they see two namespace imports instead of two multi-kilobyte single-line walls.
2. **Given** a consumer writes a transform that walks expressions, **When** they access `ir.expr.binary`, **Then** it resolves to the same factory as `ir.binaryExpression`.
3. **Given** a kind whose name collides with a JS reserved word, **When** it is exposed in a grouped sub-namespace, **Then** the key is suffixed with `_` (e.g. `ir.decl.function_` for `function_item`).
4. **Given** the flat `ir.*` surface existed before this change, **When** the change lands, **Then** the flat surface is preserved entirely — no key is removed or renamed.
5. **Given** a consumer imports `ir` and only references `ir.functionItem`, **When** the consumer bundles with a tree-shaking bundler, **Then** unused factories from other supertype groups (`ir.expr.*`, `ir.stmt.*`, etc.) are eliminated from the output.

---

### User Story 6 - Lint-clean generated output (Priority: P2)

Generated code has never been linted. Running `npx oxlint packages/{rust,typescript,python}/src` produces 142 warnings across three rules — all emitter-bugs that slipped through because we only checked `tsc --noEmit` and test ceilings:

- **122×** `unicorn/no-useless-fallback-in-spread`: every `setChild()` in `factories.ts` emits `{...(config ?? {}), children: [child]}`. The `?? {}` is redundant — spreading `undefined` is a no-op under ES2018+ spread semantics.
- **18×** `no-unused-vars`: dead imports (`ConfigMap`, `FluentNodeOf`, `FromInputOf`, `NodeFieldValue`, `Edit`, `NonEmptyArray`) and one dead top-level declaration (`RESERVED_KEYWORDS`), plus one `v` parameter that should be `_v`.
- **2×** `no-useless-escape`: regex literal emitted with unnecessary escape characters.

Triage: **all 142 are Category A (fix at emitter)** — no warnings require runtime behavior changes or suppression. After this user story, `npx oxlint` on the three grammar packages returns zero warnings.

This story is behaviour-preserving — no consumer-visible change. The value is: (1) clean lint output becomes a new floor we can defend in CI, (2) dead imports signal emitter-code paths that do nothing, and (3) the lint signal will catch future emitter regressions before they hit consumers.

**Why this priority**: Independent of the other user stories — purely emitter hygiene. Can land at any point. Flagging at P2 because it's not a user-facing change and US1/US2 deliver more consumer value; but the fix is small and should land before CI starts running `oxlint` on everything.

**Independent Test**: `npx oxlint packages/{rust,typescript,python}/src` after regeneration returns `Found 0 warnings and 0 errors`. Type-check + full test suite continue to pass byte-for-byte with pre-US6 results.

**Acceptance Scenarios**:

1. **Given** a regenerated grammar package, **When** `npx oxlint packages/{rust,typescript,python}/src` runs, **Then** the output contains `Found 0 warnings and 0 errors`.
2. **Given** `factories.ts` generated for any grammar, **When** a reader inspects any `setChild` body, **Then** it contains `{...config, children: [child]}` (no `?? {}` fallback).
3. **Given** any generated file, **When** a reader scans top-of-file imports, **Then** every imported symbol is actually referenced somewhere in the file.
4. **Given** the pre-US6 corpus-validation ceiling numbers, **When** the regenerated packages run the full suite, **Then** every ceiling matches byte-for-byte — US6 is behaviour-preserving.
5. **Given** CI is configured to run `oxlint` on generated output, **When** a future emitter regression produces a new warning, **Then** CI fails and surfaces the specific file + rule + line.

---

### Edge Cases

- **Deprecation re-exports**: Old aliases (`FunctionItemConfig`, `LooseFunctionItem`, `FunctionItemTree`, `ConfigMap`, `LooseMap`) must remain available as deprecated re-exports during a transition window so consumer code doesn't break on upgrade. The spec defers removing them to a follow-up.
- **Kinds with names colliding with JS reserved words**: Under grouped sub-namespaces (`ir.decl.function_`), a kind whose base name is a reserved word must be suffixed. Under `is` (`is.function_`), similarly.
- **Kind name to camelCase collisions**: Two snake_case kinds could theoretically camelCase to the same identifier (`type_identifier` and `typeIdentifier` as a separate kind). The `is` namespace and `NamespaceMap`'s camelCase-keyed surfaces must detect and report such collisions at codegen time.
- **Supertypes with empty member sets**: A grammar may declare a supertype that currently has no members. `is.<supertype>(v)` must still be generated and return `false` for all inputs, not fail to generate.
- **Fields whose content type is already a union of ≥ N kinds**: The inline-union-vs-named-alias threshold must be deterministic. Spec sets the threshold at 2+ reuses for emitting a named alias; below that, inline.
- **`assert` messages on supertype mismatch**: `assert.expression({ type: 'block' })` must identify that the input wasn't a valid expression variant, not just "expected expression got block."
- **Runtime construction of `is` namespace from camelCase keys**: The runtime builder iterates kind names and camelCases them. Behaviour on a kind whose camelCase form would shadow an existing `is` method (`kind`, `expression`, etc.) must be defined — either rename the kind-level entry or reject the collision at codegen.
- **Leaf `.from()` asymmetry**: The spec chose to leave leaves without `.from()` (no resolution work to do). Consumers who expected uniform `.from()` on every `ir.*` entry must see this documented in the ir.ts preamble.
- **`_union_*` referenced externally**: If any consumer code happens to reference an auto-named union alias by name, inlining it is breaking. The types emitter must verify before inlining that no `export` keyword precedes the alias definition (existing behaviour keeps them internal, but the check protects against future regressions).
- **Bare `readNode()` NodeData passed into `.from()`**: The quick-return returns the input as `T.<Kind>.Fluent`, but a plain `readNode` output lacks the fluent method surface (methods attach at `wrap()` / factory construction). Calling `.render()` on such a return would fail. In practice consumers use the generated `readTreeNode()` entry (which wraps) rather than `readNode()` directly, and calling `.from()` on a raw `readNode` result is not a supported path. Documented in the ir.ts preamble so the asymmetry is explicit.
- **Fluent mutation of parse-tree TreeNode**: Out of scope for this spec. A TreeNode from the parse tree doesn't flow through `.from()` — it flows through `readNode` → `wrap` or through factory reconstruction. A future spec may add a fluent setter surface for TreeNodes directly; it must not conflict with the `.from()` semantics defined here.

## Requirements *(mandatory)*

### Functional Requirements

#### Types restructure (User Story 1)

- **FR-001**: The generated types module MUST expose one computed per-kind namespace interface (`XNs extends NodeNs<X>`) whose members (`Node`, `Config`, `Fluent`, `Loose`, `Tree`, `Kind`) derive from the data interface via a single base interface in `@sittir/types`.
- **FR-002**: The generated types module MUST expose a single `NamespaceMap` type whose entries map kind strings to their per-kind namespace interfaces.
- **FR-003**: The generated types module MUST expose generic access aliases `ConfigFor<K>`, `FluentFor<K>`, `LooseFor<K>`, `TreeFor<K>` that resolve via `NamespaceMap`.
- **FR-004**: The generated types module MUST expose declaration-merged namespace sugar (`FunctionItem.Config`, `FunctionItem.Fluent`, `FunctionItem.Loose`, `FunctionItem.Tree`) for every kind, resolving to the same type as the generic form.
- **FR-005**: The generated types module MUST NOT emit the prior per-kind top-level aliases (`XConfig`, `LooseX`, `XTree`) in new code. Deprecated re-exports MAY remain during a transition window.
- **FR-006**: The generated types module MUST NOT emit `ConfigMap` or `LooseMap` as separate maps. `KindMap` MAY be derived from `NamespaceMap`.
- **FR-007**: The types emitter MUST inline field unions at the field site. A named alias MAY be emitted only when the union is referenced at ≥2 sites; when emitted, the name MUST be semantic (derived from field context), not auto-generated (`_union_Foo_Bar_Baz` is disallowed in new output).

#### Type guards (User Story 2)

- **FR-008**: Each grammar package MUST expose an `is` namespace containing per-kind guards keyed by camelCase kind name, narrowing the `type` discriminant.
- **FR-009**: The `is` namespace MUST expose a generic inverse guard `is.kind(v, kindName)` that narrows the `type` discriminant to the passed kind.
- **FR-010**: The `is` namespace MUST expose per-supertype guards (`is.expression`, `is.pattern`, etc.) that narrow the `type` discriminant to the union of concrete subtype kinds.
- **FR-011**: Each grammar package MUST expose `isTree(v)` and `isNode(v)` shape guards with overloaded signatures: when called on a value whose `type` is already narrowed to a `NamespaceMap` key, they narrow further to the kind's `Tree` / `Node` interface; when called on a generic value, they fall back to `AnyTreeNode` / `AnyNodeData`.
- **FR-012**: Each grammar package MUST expose an `assert` namespace with the same shape as `is`, but using `asserts v is T` signatures and throwing `TypeError` on mismatch.
- **FR-013**: The `assert` runtime MUST reuse `is` runtime logic — no duplicated kind-check code between the two namespaces.
- **FR-014**: `TypeError` messages thrown by `assert.*` MUST identify the expected kind (or supertype) and the actual kind present on the input.
- **FR-015**: Guard composition MUST resolve through `NamespaceMap`: a narrowed kind combined with a shape guard resolves to the concrete `NamespaceMap[K]['Tree']` or `NamespaceMap[K]['Node']` type.
- **FR-016**: Adding a new kind to `NamespaceMap` (via the normal codegen pipeline) MUST automatically produce a working `is.newKind()` guard and correct `isTree` / `isNode` narrowing for that kind, with no additional hand-authored type declarations.
- **FR-017**: The codegen pipeline MUST detect and reject at generation time any case where two snake_case kind names camelCase to the same identifier, or where a camelCased kind name collides with an existing `is` method (`kind`, `expression`, `pattern`, etc.).

#### from.ts cleanup (User Story 3)

- **FR-018**: Generated `from.ts` files MUST use namespace imports for factories (`import * as F from './factories.js'`) and remove the per-factory import wall.
- **FR-019**: Generated resolver generic type parameters MUST use concrete union types (e.g. `T.Identifier | T.Metavariable`) derived from `AssembledField.contentTypes`, not computed paths through `Config` (`NonNullable<T.FunctionItemConfig['name']>`).
- **FR-020**: Generated resolver return types MUST use the namespace form (`T.FunctionItem.Fluent`) and not the computed form (`ReturnType<typeof functionItem>`).
- **FR-021**: Generated `from.ts` files MUST NOT import `FromInputOf` or `NodeFieldValue` when those imports are unused.
- **FR-022**: Generated `.from()` resolvers MUST begin with `if (isNodeData(input)) return input as T.<Kind>.Fluent;` — an identity quick-return for NodeData inputs. The premise is that any NodeData at the `.from()` boundary is already resolved (factory output, or wrap output around readNode). Snake-keyed `fields` access MUST NOT appear in the resolver body.
- **FR-023**: In the bag-input branch (everything after the NodeData quick-return), every field read MUST be single-access via `input.<camelCaseName>` — no `fields[snake]` path, no `??` fallback, no inline cast expressions. The bag shape is camelCase by construction.
- **FR-024**: `isNodeData` MUST be exported from `@sittir/core` and imported by every generated `from.ts`. A single shared predicate — no per-grammar copies.

#### Codegen-time fixes (User Story 4)

- **FR-025**: The ir emitter MUST emit `Object.assign(fn, { from: fnFrom })` directly at each factory attachment site. The custom `_attach` helper MUST be removed from emitted output.
- **FR-026**: The wrap emitter MUST import `_NodeData` from `@sittir/types` alongside `WrappedNode` and MUST NOT emit a local `_NodeData` interface declaration.
- **FR-027**: The wrap emitter MUST produce wrap functions whose return expression does NOT use `as unknown as WrappedNode<K>`. Acceptable forms are no cast, `satisfies WrappedNode<K>`, or inferred return typing from a properly-typed `drillIn` signature.
- **FR-028**: The `drillIn` signature in generated `wrap.ts` MUST be typed such that per-field `get` accessors match their `WrappedNode<K>` field types without runtime coercion.

#### ir.ts cleanup (User Story 5)

- **FR-029**: Generated `ir.ts` files MUST use namespace imports for factories (`import * as F`) and resolvers (`import * as FR`).
- **FR-030**: Generated `ir.ts` files MUST emit supertype-grouped sub-namespaces (`ir.expr`, `ir.decl`, `ir.pattern`, etc.) in addition to the flat `ir.*` object. The flat surface MUST remain unchanged.
- **FR-031**: Sub-namespace keys for kinds whose base name would collide with a JS reserved word MUST be suffixed with `_` (e.g. `ir.decl.function_`).
- **FR-032**: Sub-namespace entries MUST point at the same factory+resolver bundle as the flat `ir.*` entries — accessing either form produces the same behaviour.

#### Dead-code removal

- **FR-033**: `computeSignatures` and `buildProjections` stubs on `NodeMap` MUST be removed if no consumer reads the returned structures.
- **FR-034**: `TS_RESERVED` and `TS_RESERVED_WORDS` (duplicated constants) MUST be consolidated into a single declaration shared by all callers.

#### Lint-clean generated output (User Story 6)

- **FR-035**: The factories emitter MUST NOT emit `?? {}` after spreading an optional `config` object. Generated `setChild` / `setX` bodies MUST read `{...config, children: [...]}` when `config` is the optional factory-input object. (Eliminates 122 `unicorn/no-useless-fallback-in-spread` warnings.)
- **FR-036**: Every emitter MUST NOT emit an `import` for a symbol that the generated file does not reference. Dead imports currently flagged: `ConfigMap`, `FluentNodeOf`, `FromInputOf`, `NodeFieldValue`, `Edit`, `NonEmptyArray`, `RESERVED_KEYWORDS`. Detection: the emitter MUST track which symbols are actually written into the output and emit imports only for those.
- **FR-037**: Generated callback parameters that are unreferenced MUST be prefixed with `_` (e.g. `_v` instead of `v`) to signal intentional non-use. Detection is at the emitter; if the generator tool knows a parameter position isn't read, it emits the name with the `_` prefix.
- **FR-038**: Regex literals in generated code MUST NOT contain useless escape characters. The emitter MUST produce regex source that parses under `no-useless-escape` rules.
- **FR-039**: `npx oxlint packages/{grammar}/src` MUST return `Found 0 warnings and 0 errors` for every grammar after US6 lands. CI MUST run this check on every pull request.

#### Validation

- **FR-040**: After each user story lands, the full corpus-validation suite MUST pass with every ceiling at or above its pre-cleanup value. This is a behaviour-preservation requirement for the entire spec.
- **FR-041**: After each user story lands, `tsc --noEmit` MUST pass on all three grammar packages. Type errors from removed or restructured declarations MUST be addressed as part of the landing user story, not deferred.
- **FR-042**: Deprecated re-exports (`FunctionItemConfig`, etc.) MUST remain available throughout User Stories 1-5, so consumer code depending on them continues to compile. Removing them is a follow-up spec.

### Key Entities

- **NodeNs\<T\>**: A computed base interface in `@sittir/types` that derives `Node`, `Config`, `Fluent`, `Loose`, `Tree`, and `Kind` members from a data interface `T`. Defined once, not emitted per-kind.
- **Per-kind namespace interface (`XNs`)**: One line per kind in generated `types.ts` (`interface FunctionItemNs extends NodeNs<FunctionItem> {}`). TypeScript resolves `NodeNs<FunctionItem>` once at this declaration; every downstream property access is direct.
- **NamespaceMap**: The single generated map from kind strings to per-kind namespace interfaces. Replaces `KindMap`, `ConfigMap`, `LooseMap`.
- **Declaration-merged namespace sugar**: A `namespace` block per kind whose members alias into `NamespaceMap[K]['...']`. Lets consumers write `FunctionItem.Config` naturally alongside the data interface `FunctionItem`.
- **`is` namespace**: A per-grammar runtime object whose members are type guards. Per-kind entries use camelCase keys; supertype entries use supertype names; a generic `kind(v, k)` inverse is also present.
- **`isTree` / `isNode` shape guards**: One function per grammar, with overloaded signatures that either narrow through `NamespaceMap` (when the kind is already narrowed) or fall back to generic shapes.
- **`assert` namespace**: Mirror of `is` with `asserts v is T` signatures. Reuses `is` runtime logic and throws `TypeError` on failure.
- **Grouped IR sub-namespace**: A supertype-scoped object (e.g. `ir.expr`, `ir.decl`) alongside the flat `ir.*` object. Keys are derived from kind names with supertype suffix stripped and reserved-word `_` suffix applied where needed.
- **`isNodeData` predicate (from `@sittir/core`)**: A single shared runtime guard that returns true when its input has the structural shape of a `NodeData` (a `type` string plus `fields` and/or `children` / `text` as appropriate). Used at the `.from()` entry point to distinguish a resolved node (quick-return identity) from a camelCase loose bag (resolve and construct). Grammar-agnostic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The generated types file for each grammar shrinks by at least 700 lines relative to the pre-cleanup baseline (~791 lines of derived aliases eliminated per grammar).
- **SC-002**: After User Story 4 lands, `sg --pattern '_attach($$$)' --lang typescript packages/*/src/ir.ts` produces zero matches — the custom helper call pattern is gone from emitted output. (The helper is structurally a function call; the `$$$` captures any argument list.)
- **SC-003**: After User Story 4 lands, auto-named `_union_*` aliases are gone from every generated `types.ts`. The identifier-prefix shape doesn't map cleanly to a structural pattern (it's a string fragment inside an identifier, not an AST shape), so this one is verified via `grep -l '_union_' packages/*/src/types.ts` → no output.
- **SC-004**: After User Story 4 lands, `sg --pattern '$EXPR as unknown as WrappedNode<$K>' --lang typescript packages/*/src/wrap.ts` produces zero matches — the double-cast chain is gone. (Structural match on the exact cast shape — stronger than a string grep because it won't false-positive inside strings or comments.)
- **SC-005**: The largest single line in any generated `ir.ts` or `from.ts` drops below 500 characters (import walls replaced with namespace imports). Measured by `awk '{ print length }' packages/*/src/{ir,from}.ts | sort -n | tail -1`.
- **SC-005a**: After User Story 3 lands, two structural patterns return zero matches across every generated `from.ts`:
  - `sg --pattern '$OBJ.fields?.[$KEY]' --lang typescript packages/*/src/from.ts` — the snake-keyed optional-chain index is gone.
  - `sg --pattern '(input as $TYPE).$PROP' --lang typescript packages/*/src/from.ts` — the cast-then-access pattern is gone.
  The `.fields[...]` code path has been eliminated from `from.ts`.
- **SC-005b**: After User Story 3 lands, every generated `.from()` resolver begins with the NodeData quick-return preamble, verified by `sg --pattern 'if (isNodeData(input)) return input as $$$' --lang typescript packages/*/src/from.ts`. The match count equals the number of non-leaf `.from()` resolvers in each grammar (~150 for rust, ~160 for typescript, ~100 for python).
- **SC-005c**: A NodeData input produced by `ir.functionItem({...})` and fed back into `functionItemFrom(...)` is the same JavaScript object as the return (`===`). The quick-return is identity, not a rebuild.
- **SC-006**: A consumer can narrow an `AnyNodeData` value to `FunctionItem.Tree` via one guard composition (`is.functionItem(v) && isTree(v)`) with no manual cast. Verifiable by a type-level check in a consumer test.
- **SC-007**: A consumer can call `assert.functionItem(v)` on a wrong-kind input and receive a `TypeError` whose message identifies both the expected kind and the actual kind present on the input.
- **SC-008**: Every corpus-validation ceiling matches its pre-cleanup value byte-for-byte at every user-story completion. No ceiling regresses.
- **SC-009**: `tsc --noEmit` passes on all three generated grammar packages after every user story, with zero deprecation warnings in User Story 1-5 output (consumers using deprecated aliases still compile, but new generated code does not reference them).
- **SC-010**: The `NamespaceMap` access path convergence is verified by a type-level assertion in each grammar package's test suite: every one of `FunctionItem.Config`, `ConfigFor<'function_item'>`, and `NamespaceMap['function_item']['Config']` resolves to the same concrete type.
- **SC-011**: After User Story 3 lands, a freshly-cloned consumer importing `ir.functionItem` alone has a bundled output that excludes every other grammar factory (namespace imports preserve tree-shaking).
- **SC-012**: After User Story 5 lands, calling `ir.decl.function_(config)` and `ir.functionItem(config)` produce structurally-identical output. Verifiable by `JSON.stringify` comparison.
- **SC-013**: After User Story 6 lands, `npx oxlint packages/{rust,typescript,python}/src` returns `Found 0 warnings and 0 errors`. Verifiable by direct command invocation; exact output string required.
- **SC-014**: After User Story 6 lands, CI runs `oxlint` on the three generated package directories on every PR. A future emitter regression that reintroduces any lint warning causes CI to fail with the specific file + rule + line visible in the logs.

## Design Principle: TreeNode as the unifying abstraction for parse-tree backends

`AnyTreeNode` in `@sittir/types/core-types.ts` is the canonical minimal shape that both tree-sitter's `Node` (from `web-tree-sitter`) and ast-grep's `SgNode` can implement. It exists because the two backends have distinct runtime representations — neither is a free wrapper around the other.

**Exception**: if a backend exposes a zero-cost path to the other's native type (e.g. `SgNode.treeSitterNode()` returning the encapsulated tree-sitter node without allocation), we should use that path directly rather than maintaining a separate adapter. Adapters that copy data are only justified when there's no zero-cost alternative.

This is a **validation task deferred to tasks phase**: confirm whether ast-grep's published SgNode surface exposes its underlying tree-sitter node. If yes, `adaptNode` in `validators/common.ts` and any ast-grep-side adapter should unwrap instead of adapt. If no, the current `AnyTreeNode` adapter pattern stays.

## Design Principle: Don't recreate types you can import

Several cleanups in this spec flow from one principle: **if a type is already published by a dependency, import it — don't redeclare it locally.** Applies to:

- **US1** — five parallel per-kind alias families (`XConfig`, `LooseX`, `XTree`, `ConfigMap`, `LooseMap`) collapse into one `NamespaceMap` because the existing `ConfigOf<T>` / `FluentNodeOf<T>` / `FromInputOf<T, ...>` / `TreeNodeOf<T>` transforms in `@sittir/types` are the canonical derivations.
- **US4** — `_NodeData` redeclared locally in `wrap.ts` → imported from `@sittir/types` (FR-026).
- **US4** — inline `_union_Foo_Bar_Baz` aliases → structural unions at the field site (FR-007).
- **Validators** — hand-rolled `TSNode`, `TSTree`, `TSParser`, `TSParserCtor`, `TSLanguageCtor` interfaces in `packages/codegen/src/validators/common.ts` → direct imports from `web-tree-sitter`. Similar for any `@ast-grep/wasm` types used by the validator. Landed as T004a in Phase 1.

This principle is the unifying rationale for most of the cleanup work in 008. It reduces surface area, removes sources of drift between "our copy" and "the canonical copy," and catches upstream API changes at type-check time rather than via silent divergence.

## Assumptions

- **Verification via `sg` (ast-grep) for AST-shape assertions**: Success criteria that check for the absence of a code pattern (SC-002 / SC-004 / SC-005a) use `sg --pattern ...` rather than plain `grep`, because the patterns are structural (a cast expression, an optional-chain index, a specific call shape) and `grep` would match inside comments and strings. This is also dogfooding — sittir's generated types exist to make ast-grep consumers' lives easier, so the spec's own verification uses the tool the output targets. One exception: SC-003 (`_union_*` identifier prefix) stays a `grep` check because the shape is a substring of an identifier, not a structural AST node.
- **Declaration merging available**: The target TypeScript version supports `interface X {}` + `namespace X {}` declaration merging. This is a language feature present since TypeScript 1.0; no version bump required.
- **Babel convention as prior art**: The `is` / `assert` naming and semantics mirror Babel's `@babel/types` package. Sittir's audience overlaps with Babel users (JS/TS tooling authors), so the convention is familiar.
- **Shape-detection predicates are stable**: `isTree` distinguishes by the presence of `range()` / tree-node method surface; `isNode` by the presence of `fields` or `text`. These predicates reflect the actual shape contract in `@sittir/core` and `@sittir/types` today.
- **Deprecation re-exports during transition**: Old aliases remain re-exported with a deprecation comment. Removing them is explicitly out of scope; it's a follow-up once internal code migrates.
- **The 007 branch is merged**: This spec builds on the post-007 master. It does not conflict with unmerged work.
- **Minimum-reuse-count for named unions**: An inline field union becomes a named alias when referenced at ≥2 sites. Below that threshold, unions stay inline. The name used for a promoted union is semantic (derived from field context), not the auto-generated `_union_*` form.
- **Leaf factories retain no `.from()`**: Leaf kinds (strings, keywords, enums) have no resolution work and will not be given a trivial `.from()` wrapper. The asymmetry is intentional; the ir.ts preamble will call it out.
- **A snake-keyed NodeData at runtime is (realistically) always fluent**: The only shapes that enter `.from()` in practice are (a) a factory output (fluent NodeData with methods) or (b) a wrap output around readNode (also fluent NodeData — `readNode` + `wrap` is the runtime hydration path; plain `readNode` output is not expected to flow into `.from()`) or (c) a camelCase loose bag. `.from()` exploits this: `isNodeData(input) → quick-return identity` is safe because any snake-keyed NodeData seen at `.from()` already has its fluent surface. A bag input, by contrast, is camelCase at the top level by construction (it was authored by a consumer typing field names) — single-access `input.camelCase` is always correct.
- **`.from()` is a loose-bag-to-fluent translator, not a re-resolver**: NodeData inputs have already had their children resolved (factory output resolved at construction; wrap output hydrated from parse). `.from()` has no work to do in that case. The identity quick-return reclaims `.from()`'s original semantic.
- **Fluent setters for raw TreeNode / plain-readNode NodeData are out of scope**: A future path for mutating a parse-tree TreeNode or a bare `readNode()` result (without going through `wrap` first) is not provided by `.from()` today and is not introduced by this spec. Consumers wanting that shape pass through the factory or through `wrap()`. This is called out explicitly because the quick-return premise relies on it; tracked as a follow-up concern.
- **Sections on consumer-facing API conventions are deferred**: The original design document flagged three consumer-facing API conventions where sittir diverges from Babel/Roslyn — `render()`/`toEdit()` as instance methods vs standalone functions, fluent setter overload (`name(v)`) vs explicit `withX(v)`, and direct camelCase field access on constructed nodes. These are deliberately out of scope for this spec — each needs its own design pass before changing.

## Out of Scope

- **API consistency with Babel/Roslyn on instance-method semantics**: `render()` / `toEdit()` as instance methods vs standalone functions, fluent setter overload (`name(v)`) vs explicit `withX(v)`, direct camelCase field access on constructed nodes — all deferred to separate specs.
- **`cloneNode` / `cloneDeep` helpers**: Consumers use `structuredClone`. A thin re-export (`ir.clone = structuredClone`) is discretionary documentation, not a behavioural change.
- **Removing deprecated re-exports**: The old `XConfig` / `LooseX` / `XTree` aliases remain as deprecated re-exports throughout this spec's user stories. A follow-up spec will remove them once internal and known-external consumers have migrated.
- **Dual-access helper in from.ts**: A `_f(input, snake, camel)` helper was considered and rejected for a different reason than initially thought. The real cleanup is semantic: `.from()` quick-returns on NodeData and reads single-access on bag inputs. No helper needed.
- **Fluent setters for raw TreeNodes or plain `readNode` NodeData**: Future work. Consumers today route these through a factory or `wrap()` to get a fluent surface. Not addressed here — tracked as a known follow-up.
- **Runtime helper abstractions beyond what's already present**: `_withMethods`, per-kind descriptor builders, and similar runtime-wrapper abstractions are explicitly rejected — the per-kind factory/wrap expansion is static output, and adding a runtime wrapper trades static clarity for indirection on the hot path.
- **Boolean/bitflag keywords, canonical roles, and `role()` DSL**: These are separate specs. This spec is cleanup only.
- **Patched grammar pipeline**: This spec precedes that work. No overlap.

## Dependencies

- **Depends on**: The 007 branch (override-compiled parser, runtime routing removal) being merged to master. Satisfied as of commit `bcd65a0`.
- **Blocks (soft)**: Any future spec touching `types.ts`, `from.ts`, `ir.ts`, or `wrap.ts` emitter output will conflict heavily with this spec if landed concurrently. Recommend sequencing this spec before other emitter work.
- **Blocks (hard)**: The patched grammar pipeline spec, per the original design document, expects to land after this cleanup. This spec reduces the surface area that later specs touch.
