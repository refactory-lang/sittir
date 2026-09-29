# Bound and Parsed Node Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every kind gets computed `X.Bound` (replacing `X.Built`) and
`X.Parsed` node types, derived from its main interface and an
emitter-stamped `__slotHints__`. List owners read as iterables of their
stored elements with the build options flattened on. Wrap and factory
returns are declared, not inferred.

**Architecture:** The types emitter prints one `__slotHints__` member per
kind interface. That member carries the per-slot setter input types, which
are today printed into each `Built` interface's `$with` record, and a
list-owner hint. `@sittir/types` gains `BoundOf`/`ParsedOf`, which read
the hints and resolve children through emitted id-keyed maps of named
interfaces. The runtime gains one list-owner helper, and both the factory
emitter and the wrap emitter call it.

**Tech Stack:** TypeScript codegen (`packages/codegen`), `@sittir/types`,
`@sittir/common` runtime, the generated grammar packages
(rust, typescript, python, regex, scm), vitest (plus `--typecheck` for
`.test-d.ts`), tsc.

**Spec:** `docs/superpowers/specs/2026-09-29-bound-parsed-node-types-design.md`

## Global Constraints

- DRY is the correctness rule: each fact has one source and one
  derivation.
  - The slot input types come from the existing setter derivation
    (`setterTypeMember`/`setterElemType` in `emitters/factories.ts`),
    moved, not copied.
  - The list-owner fact comes from `forwardedTargetKind` resolving to an
    `AssembledList`.
- Stamped facts over re-derivation. `BoundOf`/`ParsedOf` read
  `__slotHints__`. They never infer accessor names or list-ness from
  storage keys.
- Generated outputs are never hand-edited:
  - `packages/{rust,python,typescript,regex,scm}/src/*` and
    `packages/*/.sittir/*` are regenerated;
  - fix the codegen instead.
- No explanatory comments in `packages/codegen/src/`. Document each new
  or changed declaration in its `docs/glossary/*.md` entry (one `###`
  section per declaration).
- Comments and docs never cite PR, issue, spec, plan or task numbers.
- Commit with pathspecs only: `git commit -- <paths>`.
- Lint is oxlint (`pnpm run lint`). Never eslint.
- Remap with key-remapping (`{ [P in keyof D as P extends K ? never : P]: D[P] }`),
  never `Omit`. The storage interfaces carry an index signature, so
  `Omit` drops every declared key.
- `this` cannot appear inside a nested type literal. Pass it in at the
  member: `$with: Setters<this>`.
- Every task ends green on:
  - `pnpm run type-check`;
  - `pnpm run lint`;
  - the full vitest suite, as its own Bash call;
  - `cargo test --workspace`;
  - `pnpm run validate:native`, with validate rows identical to master.

## Review Focus

1. **Absent list.** A list owner whose list is absent (`fn f()`, `def f()`)
   iterates nothing: `length` 0, `at(0)` `undefined`, and `delimiter`
   `Delimiter.None`. It never throws. Pinned in Task 4.
2. **Spreading a node.** Spreading or JSON-serialising a list-owner node
   (`{ ...node }`, `$edited(data)` in wrap's `$with`, the validators'
   structural diff) is unchanged. The iterator, `length`, `at` and the
   flattened options are non-enumerable. Pinned in Task 4.
3. **Keyword-stored children.** An accessor whose child is stored as a
   kind id (a keyword: `TSKindId.Crate`) keeps returning the number;
   `BoundOf` passes numbers through unchanged. Pinned in Task 1.
4. **Supertype-typed accessors.** `root.statements()` distributes to the
   members' `.Parsed`, and `is.functionItem(item)` narrows to
   `FunctionItem.Parsed` with `$with`. Pinned in Task 5.
5. **Optional slots.** An optional slot's retyped accessor after
   `$with.<slot>(v)` keeps `| undefined` exactly when the main accessor
   had it, and `$with.<slot>()` with no argument (clearing an optional
   slot) still type-checks. Pinned in Task 1.

---

### Task 1: The type machinery in `@sittir/types`

**Files:**
- Create: `packages/types/src/node-surface.ts`
- Modify: `packages/types/src/index.ts` (export the new types)
- Test: `packages/types/tests/node-surface.test-d.ts` (create)
- Docs: `docs/glossary/packages-types-src.md` (one `###` per exported
  type)

**Interfaces:**
- Produces:
  - `SlotHint<Input, Optional extends boolean = false>`:
    `{ readonly input: Input; readonly optional: Optional }`.
  - `ListOwnerHint<Element, Options extends object>`:
    `{ readonly element: Element; readonly options: Options }`.
  - `SlotHintsOf<Self>`:
    the hints object with `$listOwner` removed by key-remapping (slots
    only).
  - `ListOwnerOf<Self>`: `NonNullable<Self['__slotHints__']>['$listOwner']`,
    or `never` when absent.
  - `Remap<T, K extends PropertyKey>`.
  - `BoundOf<N, ByKindId>`: the node surface computed from main interface
    `N`, with children resolved through `ByKindId`, an id-keyed map of
    `.Bound` interfaces.
  - `ParsedOf<N, ByKindId>`: the same surface, with `$with: Setters<this>`
    semantics and children resolved through `ByKindId`, an id-keyed map
    of `.Parsed` interfaces.
  - `Setters<Self>` and `WithSlot<Self, K, V>`.
  - `ListOwnerMembers<E, O>`:
    `Iterable<E> & { readonly length: number; at(i: number): E | undefined } & Readonly<O>`.

- [ ] **Step 1: Write the failing type test.** Use a synthetic
  three-kind grammar so the test pins the machinery, not a generated
  package.

```ts
// packages/types/tests/node-surface.test-d.ts
import { describe, expectTypeOf, it } from 'vitest';
import type { BoundOf, ParsedOf, SlotHint, ListOwnerHint } from '../src/index.ts';

const enum K { Fn = 1, Params = 2, Param = 3, Kw = 4 }
interface Param { readonly $type: K.Param; readonly _name: string; name(): string;
	readonly __slotHints__?: { name: SlotHint<string> } }
interface Params { readonly $type: K.Params; readonly _elements?: readonly Param[];
	elements(): readonly Param[] | undefined;
	readonly __slotHints__?: { elements: SlotHint<readonly Param[], true>;
		$listOwner: ListOwnerHint<Param, { delimiter?: 0 | 2 }> } }
interface Fn { readonly $type: K.Fn; readonly _params: Params; readonly _kw?: K.Kw;
	params(): Params; kw(): K.Kw | undefined;
	readonly __slotHints__?: { params: SlotHint<Params.Bound>; kw: SlotHint<K.Kw, true> } }
declare namespace Param { interface Bound extends BoundOf<Param, ByB> {} interface Parsed extends ParsedOf<Param, ByP> {} }
declare namespace Params { interface Bound extends BoundOf<Params, ByB> {} interface Parsed extends ParsedOf<Params, ByP> {} }
declare namespace Fn { interface Bound extends BoundOf<Fn, ByB> {} interface Parsed extends ParsedOf<Fn, ByP> {} }
interface ByB { [K.Fn]: Fn.Bound; [K.Params]: Params.Bound; [K.Param]: Param.Bound }
interface ByP { [K.Fn]: Fn.Parsed; [K.Params]: Params.Parsed; [K.Param]: Param.Parsed }

declare const fn: Fn.Parsed;
declare const built: Params.Bound;
declare const bound: Fn.Bound;
declare const listOwner: Params.Parsed;
declare const oneParam: Param.Bound;

describe('BoundOf / ParsedOf', () => {
	it('children resolve to their own Parsed', () => {
		expectTypeOf(fn.params()).toEqualTypeOf<Params.Parsed>();
	});
	it('a kind-id-stored child stays its id', () => {
		expectTypeOf(fn.kw()).toEqualTypeOf<K.Kw | undefined>();
	});
	it('a list owner iterates its stored elements and carries its options', () => {
		const ps = fn.params();
		expectTypeOf([...ps]).toEqualTypeOf<Param.Parsed[]>();
		expectTypeOf(ps.length).toEqualTypeOf<number>();
		expectTypeOf(ps.at(0)).toEqualTypeOf<Param.Parsed | undefined>();
		expectTypeOf(ps.delimiter).toEqualTypeOf<0 | 2 | undefined>();
	});
	it('$with retypes only the replaced slot, and chains accumulate', () => {
		const d1 = fn.$with.params(built);
		expectTypeOf(d1.params()).toEqualTypeOf<Params.Bound>();
		expectTypeOf(d1.kw()).toEqualTypeOf<K.Kw | undefined>();
		const d2 = d1.$with.kw(K.Kw);
		expectTypeOf(d2.params()).toEqualTypeOf<Params.Bound>();
		expectTypeOf(d2.kw()).toEqualTypeOf<K.Kw>();
	});
	it('an optional slot can be cleared', () => {
		expectTypeOf(fn.$with.kw()).toHaveProperty('kw');
	});
	it('a wrong input is rejected', () => {
		// @ts-expect-error Params.Bound expected
		fn.$with.params('x');
	});
	it('Bound $with returns Bound', () => {
		expectTypeOf(bound.$with.params(built).params()).toEqualTypeOf<Params.Bound>();
	});
});
```

- [ ] **Step 2: Run it and confirm it fails.**
  - Run: `pnpm exec vitest --typecheck run packages/types/tests/node-surface.test-d.ts`
  - Expected: FAIL, "Module has no exported member 'BoundOf'".

- [ ] **Step 3: Implement `packages/types/src/node-surface.ts`.**

```ts
export interface SlotHint<Input, Optional extends boolean = false> {
	readonly input: Input;
	readonly optional: Optional;
}
export interface ListOwnerHint<Element, Options extends object> {
	readonly element: Element;
	readonly options: Options;
}
export type Remap<T, K extends PropertyKey> = { [P in keyof T as P extends K ? never : P]: T[P] };

type HintsOf<Self> = Self extends { readonly __slotHints__?: infer H } ? NonNullable<H> : never;
export type SlotHintsOf<Self> = Remap<HintsOf<Self>, '$listOwner'>;
export type ListOwnerOf<Self> = HintsOf<Self> extends { readonly $listOwner: infer L } ? L : never;
type SlotInput<Self, K extends keyof SlotHintsOf<Self>> = SlotHintsOf<Self>[K] extends SlotHint<infer I, boolean> ? I : never;
type SlotOptional<Self, K extends keyof SlotHintsOf<Self>> = SlotHintsOf<Self>[K] extends SlotHint<unknown, infer O> ? O : false;

type ById<ByKindId> = { [Id in keyof ByKindId]: ByKindId[Id] };
type Resolve<R, ByKindId> = R extends number
	? R
	: R extends readonly (infer E)[]
		? Resolve<E, ByKindId>[]
		: R extends { readonly $type: infer Id }
			? Id extends keyof ById<ByKindId> ? ById<ByKindId>[Id] : R
			: R;

export type ListOwnerMembers<E, O> = Iterable<E> & {
	readonly length: number;
	at(index: number): E | undefined;
} & Readonly<O>;

type Accessors<N, ByKindId> = {
	[P in keyof N as N[P] extends () => unknown ? P : never]: N[P] extends () => infer R ? () => Resolve<R, ByKindId> : never;
};
type Storage<N> = Remap<N, keyof Accessors<N, {}> | '__slotHints__'>;

export type Setters<Self> = {
	[K in keyof SlotHintsOf<Self>]: SlotOptional<Self, K> extends true
		? (value?: SlotInput<Self, K>) => WithSlot<Self, K, SlotInput<Self, K> | undefined>
		: (value: SlotInput<Self, K>) => WithSlot<Self, K, SlotInput<Self, K>>;
};
export type WithSlot<Self, K extends PropertyKey, V> = Remap<Self, K | '$with'> & { [P in K]: () => V } & {
	readonly $with: Setters<WithSlot<Self, K, V>>;
};

type ListPart<N, ByKindId> = [ListOwnerOf<N>] extends [never]
	? {}
	: ListOwnerOf<N> extends ListOwnerHint<infer E, infer O> ? ListOwnerMembers<Resolve<E, ByKindId>, O> : {};

export type BoundOf<N, ByKindId> = Storage<N> & Accessors<N, ByKindId> & ListPart<N, ByKindId> & {
	readonly __slotHints__?: HintsOf<N>;
	readonly $with: Setters<Storage<N> & Accessors<N, ByKindId> & { readonly __slotHints__?: HintsOf<N> }>;
};
export type ParsedOf<N, ByKindId> = BoundOf<N, ByKindId>;
```

  This is the starting shape. Adjust it until the Step 1 test passes,
  keeping these rules fixed:
  - Accessor names come from `N`.
  - Children resolve only through `ByKindId`.
  - `Setters` reads only `__slotHints__`.
  - The `Parsed` interface gets its `$with` through the declaring
    interface's `Setters<this>` (Task 3 emits
    `interface Parsed extends ParsedOf<X, ParsedByKindId> { readonly $with: Setters<this> }`).
  - `NodeMethods` are not part of `BoundOf`. Task 3's emitted interfaces
    add `NodeMethodsOf` in their `extends` list, as `Built` does today.

- [ ] **Step 4: Run the test and confirm it passes.**
  - Run: `pnpm exec vitest --typecheck run packages/types/tests/node-surface.test-d.ts`
  - Expected: PASS.

- [ ] **Step 5: Export and document.** Add
  `export type * from './node-surface.ts';` to
  `packages/types/src/index.ts`. Add one glossary entry per exported
  type to `docs/glossary/packages-types-src.md`, stating what each
  computes and the key-remapping and `this` constraints.

- [ ] **Step 6: Commit.**

```bash
git add packages/types/src/node-surface.ts packages/types/tests/node-surface.test-d.ts
git commit -m "feat(types): node surfaces are computed from a kind interface and its slot hints" -- packages/types/src/node-surface.ts packages/types/src/index.ts packages/types/tests/node-surface.test-d.ts docs/glossary/packages-types-src.md
```

---

### Task 2: Stamp `__slotHints__` on every kind interface

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts`:
  - `setterTypeMember` (~L705);
  - `fieldCarryingBuiltTypeSurface` (~L722);
  - the list-surface helper `listBuiltTypeSurface`;
  - `separatedListSurface` (~L1528).
- Modify: `packages/codegen/src/emitters/types.ts`:
  - `emitInterface` (~L824), where `__slotHints__` is emitted next to
    `emitFieldInputHints` (~L849).
- Test: `packages/codegen/src/emitters/__tests__/slot-hints.test.ts`
  (create).
- Docs: the `docs/glossary/emitters.md` entries for every function
  touched, plus new ones.

**Interfaces:**
- Consumes: `SlotHint` and `ListOwnerHint` (Task 1), referenced in the
  emitted text as `SlotHint<…>` and `ListOwnerHint<…>`, imported by the
  generated `types.ts` from `@sittir/types`.
- Produces:
  - `slotSetterInput(f, configType, nodeMap, kindEntries): { input: string; optional: boolean }`
    in `emitters/factories.ts`. It is the single derivation of a slot's
    `$with` input: the body of today's `setterTypeMember`, returning the
    parts instead of printing the member.
  - `listOwnerHint(node, nodeMap, kindEntries): { element: string; options: string } | undefined`
    in `emitters/factories.ts`. It is defined iff
    `forwardedTargetKind(node, nodeMap)` names an `AssembledList`.
    - `element` is that list's stored element type: what its
      `elements()` accessor returns, e.g. `T.AttributedParameter`, not
      the spread's arms.
    - `options` is the same options type `separatedListSurface` prints
      for the list's factory (`{ delimiter?: Delimiter.None | Delimiter.Trailing }`,
      plus `separator` where the list has several).
    - Refactor `separatedListSurface` to call a shared
      `listOptionsType(node, nodeMap)`, so there is one derivation.
  - The emitted member on each kind interface in `types.ts`:

```ts
	readonly __slotHints__?: {
		readonly parametersElements: SlotHint<T.ParametersElements, true>;
		readonly $listOwner: ListOwnerHint<AttributedParameter, { delimiter?: Delimiter.None | Delimiter.Trailing }>;
	};
```

- [ ] **Step 1: Write the failing emitter test.**

```ts
// packages/codegen/src/emitters/__tests__/slot-hints.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const rustTypes = () => readFileSync('packages/rust/src/types.ts', 'utf8');

function interfaceBlock(src: string, name: string): string {
	const start = src.indexOf(`export interface ${name} {`);
	return src.slice(start, src.indexOf('\n}\n', start));
}

describe('__slotHints__', () => {
	it('a config kind stamps each slot with the input its $with setter takes', () => {
		const fn = interfaceBlock(rustTypes(), 'FunctionItem');
		expect(fn).toContain('readonly __slotHints__?: {');
		expect(fn).toContain('readonly parameters: SlotHint<T.Parameters>;');
		expect(fn).toContain('readonly visibilityModifier: SlotHint<T.VisibilityModifier, true>;');
	});
	it('a sole-list owner stamps its stored element and its factory options', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters');
		expect(ps).toContain(
			'readonly $listOwner: ListOwnerHint<AttributedParameter, { delimiter?: Delimiter.None | Delimiter.Trailing }>;'
		);
	});
	it('a kind that is not a list owner stamps no $listOwner', () => {
		expect(interfaceBlock(rustTypes(), 'FunctionItem')).not.toContain('$listOwner');
	});
});
```

- [ ] **Step 2: Confirm it fails.**
  - Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/slot-hints.test.ts`
  - Expected: FAIL (no `__slotHints__`).

- [ ] **Step 3: Extract the input derivation.** Split `setterTypeMember`
  into `slotSetterInput` (the parts) and a printer that the `Built`
  `$with` record keeps using until Task 3 removes it. Add `listOptionsType`
  and have `separatedListSurface` call it. Add `listOwnerHint`.

- [ ] **Step 4: Emit the member.** In `emitInterface`, after
  `emitFieldInputHints`, print `__slotHints__`:
  - one `SlotHint<input, true?>` per slot, keyed by the slot's
    `propertyName`, the same key its accessor and setter use;
  - `$listOwner` when `listOwnerHint` is defined.

  Import `SlotHint` and `ListOwnerHint` in the generated header, beside
  the existing `@sittir/types` imports.

- [ ] **Step 5: Regenerate and run the gates.**
  - Run: `pnpm run regen:all`, then generate regex and scm:
    `pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src`
    (and the same for scm).
  - Run the emitter test.
  - Run `pnpm run type-check`.
  - Run `pnpm run validate:native`. Expected: rows identical, since this
    task is type-only.

- [ ] **Step 6: Glossary and commit.** Commit the emitter sources, the
  test, the glossary, and the regenerated `packages/*/src/types.ts` and
  `.sittir` manifests.

```bash
git commit -m "feat(codegen): every kind interface stamps its slot inputs and list-owner facts" -- packages/codegen/src/emitters packages/*/src/types.ts packages/*/.sittir docs/glossary/emitters.md
```

---

### Task 3: `X.Bound` and `X.Parsed` replace `X.Built`

**Files:**
- Modify: `packages/codegen/src/emitters/types.ts`:
  - the namespace loop (~L340–352);
  - `emitBuiltInterface` (~L808), which becomes `emitNodeSurfaceInterfaces`;
  - `emitNamespaceSugarBlock` (~L1122);
  - `emitRefineFormSubNamespaces` (~L1170);
  - `emitGrammarTypeMap` (~L415).
- Modify: `packages/codegen/src/emitters/factories.ts`:
  - `BuiltTypeSurface` (~L687) drops `members`/`extendsList` for the
    `$with` record;
  - `builtInterfaceMembers` (~L694) is deleted;
  - `fieldCarryingBuiltTypeSurface`, `leafBuiltTypeSurface` and
    `refineFormBuiltTypeSurfaceOf` stop printing `$with`;
  - every `T.${typeName}.Built` return annotation becomes `.Bound`.
- Modify: `packages/types/src/index.ts`. In `NodeNs`, `KeywordNs` and
  `LeafNs`, the `Built` parameter and member are renamed `Bound`.
  `BuiltFor`-style projections are renamed `BoundFor`.
- Modify: every hand-written reference to `.Built`, `Built<`, `BuiltFor`
  or `['Built']`. Enumerate them first:

  `mcp__infigraph__search` with `query='\.Built\b|BuiltFor|\[.Built.\]|Built<'` and
  `regex=true`, excluding the generated `packages/<lang>/src/*` files.

  Rename them with the LSP rename, never sed. The hand-written sites
  are in `packages/{common,tools,validator,cli}/src`, `packages/*/tests`,
  `tests/`, `examples/`, the `README.md` files and `docs/`.
- Test: `packages/rust/tests/node-surface.test-d.ts`,
  `packages/typescript/tests/node-surface.test-d.ts` and
  `packages/python/tests/node-surface.test-d.ts` (create).
- Docs: the glossary entries for every renamed or changed declaration.

**Interfaces:**
- Consumes: Task 1's types; Task 2's `__slotHints__`.
- Produces, in each generated `types.ts`:

```ts
export namespace FunctionItem {
	export interface Bound extends BoundOf<T.FunctionItem, BoundByKindId>, NodeMethodsOf {}
	export interface Parsed extends ParsedOf<T.FunctionItem, ParsedByKindId>, NodeMethodsOf {
		readonly $with: Setters<this>;
	}
	// Config, Loose, LooseConfig, BuildArgs, LooseArgs, Kind unchanged
}
export interface BoundByKindId { [TSKindId.FunctionItem]: FunctionItem.Bound; /* … every kind with a node surface */ }
export interface ParsedByKindId { [TSKindId.FunctionItem]: FunctionItem.Parsed; /* … */ }
```

  A leaf keeps its leaf surface: `Bound` is today's leaf `Built` members
  (`$type`, `$named`, `$text`, `NodeMethodsOf`), and `Parsed` is the same.
  A keyword keeps `Bound = Id`. `$source` is not pinned on `Bound`: a
  parsed node is bound too.

- [ ] **Step 1: Write the failing per-grammar type probes.**

```ts
// packages/rust/tests/node-surface.test-d.ts
import { describe, expectTypeOf, it } from 'vitest';
import type { FunctionItem, Parameters, AttributedParameter } from '../src/types.ts';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const { build } = await createEngine(rust);
declare const fb: FunctionItem.Bound;
declare const fp: FunctionItem.Parsed;
declare const ps: Parameters.Parsed;

describe('rust node surfaces', () => {
	it('a factory returns Bound', () => {
		expectTypeOf(build.parameters()).toMatchTypeOf<Parameters.Bound>();
	});
	it('Bound accessors return Bound children', () => {
		expectTypeOf(fb.parameters()).toEqualTypeOf<Parameters.Bound>();
	});
	it('Parsed accessors return Parsed children, and $with retypes only its slot', () => {
		expectTypeOf(fp.parameters()).toEqualTypeOf<Parameters.Parsed>();
		const d = fp.$with.parameters(build.parameters());
		expectTypeOf(d.parameters()).toMatchTypeOf<Parameters.Bound>();
		expectTypeOf(d.body()).toMatchTypeOf<import('../src/types.ts').Block.Parsed>();
	});
	it('a list owner iterates its stored elements', () => {
		expectTypeOf([...ps]).toEqualTypeOf<AttributedParameter.Parsed[]>();
	});
});
```

  Write the typescript file (`FormalParameters`,
  `RequiredParameter | OptionalParameter`) and the python file
  (`Parameters`, `Parameter`) to the same shape.

- [ ] **Step 2: Confirm they fail.**
  - Run: `pnpm exec vitest --typecheck run packages/rust/tests/node-surface.test-d.ts`
  - Expected: FAIL (`Bound` does not exist).

- [ ] **Step 3: Emit `Bound`/`Parsed` and the maps. Delete the `Built`
  `$with` record.**
  - In the namespace loop, replace `'Built'` with the two interfaces.
  - `emitGrammarTypeMap` also emits `BoundByKindId` and `ParsedByKindId`
    over every kind with a node surface, using the same kind set the
    current `NamespaceMap` iterates.
  - Import `BoundOf`, `ParsedOf` and `Setters` from `@sittir/types` in
    the generated header.

- [ ] **Step 4: Rename `Built` to `Bound` in `@sittir/types` and in every
  hand-written reference.** Use the LSP rename on each declaration
  (`NodeNs`'s `Built` member, `KeywordNs`, `LeafNs`, `BuiltFor`). Emitter
  string templates that print `.Built` change to `.Bound`.

- [ ] **Step 5: Regenerate all five grammars and run the gates.** Run the
  probes, `pnpm run type-check`, `pnpm run type-check:examples`,
  `pnpm run type-check:generated-examples`, oxlint, the full vitest suite,
  `cargo test --workspace`, and `pnpm run validate:native` (rows
  identical).

- [ ] **Step 6: Record the type-check timing.** Run `pnpm run type-check`
  three times on master and three times on this branch. Put both sets of
  wall times in the commit message.
  - If the median regresses by more than 15%, STOP and report.
  - The spec's fallback, `$with.<slot>` returning plain `X.Parsed`, is a
    decision for review, not a silent swap.

- [ ] **Step 7: Glossary and commit.**

```bash
git commit -m "feat(codegen): each kind's node surface is Bound, and Parsed when tree-bound; Built is gone" -- packages/codegen/src/emitters packages/types packages/*/src packages/*/.sittir packages/*/tests packages/common packages/tools packages/validator packages/cli tests examples docs
```

---

### Task 4: List owners iterate their stored list at runtime

**Files:**
- Modify: `packages/common/src/utils.ts`, adding
  `withListOwner(node, listKey)` next to `withAccessors` (~L157).
- Modify: `packages/codegen/src/emitters/factories.ts`. The raw builder of
  a list owner calls `withListOwner(…, '<list storage key>')` inside its
  `withMethods(withAccessors(…))` chain.
- Modify: `packages/codegen/src/emitters/wrap.ts`. The `wrapX` of a list
  owner calls `withListOwner` on the object it hands to `withMethods`.
- Test: `packages/common/tests/list-owner.test.ts` and
  `packages/rust/tests/list-owner.test.ts` (create). Also cover python
  and typescript in `packages/<lang>/tests/list-owner.test.ts`.
- Docs: glossary entries for `withListOwner` and the two emitter
  changes.

**Interfaces:**
- Consumes: `listOwnerHint` (Task 2) decides which kinds call it. The
  list's storage key is `forwardedTargetKind`'s sole slot's `storageKey`.
- Produces:
  `withListOwner<T extends object>(node: T, listKey: string): T`. It
  defines non-enumerable members:
  - `[Symbol.iterator]`: yields `list.elements()` when present, else
    nothing;
  - `length`;
  - `at(i)`;
  - one getter per options key, reading the list node's `_delimiter`
    and `_separator` (`Delimiter.None` when the list is absent).
  - `list` is `node[listKey]`, drilled through the node's own accessor,
    so parsed children stay lazily wrapped.

- [ ] **Step 1: Write the failing runtime tests.**

```ts
// packages/rust/tests/list-owner.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const fnOf = (src: string) => rs.parse(src).statements()[0] as any;

describe('a list owner', () => {
	it('iterates the stored elements of a parsed list', () => {
		const ps = fnOf('fn f(#[cfg(test)] a: u8, b: u16) {}\n').parameters();
		const items = [...ps];
		expect(items.map((p: any) => p.$type)).toEqual([rs.kinds.AttributedParameter, rs.kinds.AttributedParameter]);
		expect(items[0].attributeItem()).toBeDefined();
		expect(ps.length).toBe(2);
		expect(ps.at(1).$render()).toBe('b: u16');
	});
	it('reads a parsed trailing comma as its delimiter', () => {
		expect(fnOf('fn f(a: u8,) {}\n').parameters().delimiter).toBe(Delimiter.Trailing);
		expect(fnOf('fn f(a: u8) {}\n').parameters().delimiter).toBe(Delimiter.None);
	});
	it('an absent list iterates nothing', () => {
		const ps = fnOf('fn f() {}\n').parameters();
		expect([...ps]).toEqual([]);
		expect(ps.length).toBe(0);
		expect(ps.at(0)).toBeUndefined();
		expect(ps.delimiter).toBe(Delimiter.None);
	});
	it('a built owner iterates what it was built from', () => {
		const p = rs.build.parameter({ pattern: rs.build.identifier('a'), type: rs.kinds.U8Keyword });
		const ps = rs.build.parameters({ delimiter: Delimiter.Trailing }, p);
		expect([...ps]).toHaveLength(1);
		expect(ps.delimiter).toBe(Delimiter.Trailing);
	});
	it('spreads and serialises as before: the list-owner members are not enumerable', () => {
		const ps = fnOf('fn f(a: u8) {}\n').parameters();
		expect(Object.keys(ps)).not.toContain('length');
		expect(Object.keys(ps)).not.toContain('delimiter');
		expect(Object.getOwnPropertySymbols({ ...ps })).not.toContain(Symbol.iterator);
	});
});
```

  If `rs.build.parameter`'s config differs, use the loose example in
  `examples/17-dogfood-rust-loose.generated.ts` for the exact call shape.

- [ ] **Step 2: Confirm they fail.**
  - Run: `pnpm exec vitest run packages/rust/tests/list-owner.test.ts`
  - Expected: FAIL (`ps is not iterable`).

- [ ] **Step 3: Implement `withListOwner`.** Use
  `Object.defineProperty(..., { enumerable: false, configurable: true })`
  for every member. The getters read through the owner's accessor
  (`node[accessorName]()`), so a parsed owner drills lazily and a built
  owner reads its stored list. Then have both emitters call it for list
  owners.

- [ ] **Step 4: Regenerate, run the tests and run the gates.** Validate
  rows must be identical: these members are non-enumerable and render
  never reads them.

- [ ] **Step 5: Glossary and commit.**

```bash
git commit -m "feat(runtime): a list owner iterates its stored list and carries the list's options" -- packages/common packages/codegen/src/emitters packages/*/src packages/*/.sittir packages/*/tests docs/glossary
```

---

### Task 5: Wrap returns are declared

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts`:
  - `WrapEmitter.finalize` (~L779–1558). `_WrapReturnByKindId` (~L1442)
    is deleted; `wrapNode`'s overload and the root tree type
    (`${rootTreeTypeName}` ~L1458) read `ParsedByKindId`.
  - The drill helpers (~L1013–1031) are typed
    `drillIn<T>(entry: T, tree): ParsedOfData<T>` and
    `drillInAll<T>(…): ParsedOfData<T>[]`, where
    `ParsedOfData<T> = T extends { $type: infer Id } ? Id extends keyof T.ParsedByKindId ? T.ParsedByKindId[Id] : T : T`.
    Emit this once in the wrap header.
  - Each `wrapX` signature gets `: T.X.Parsed`.
- Test: `packages/rust/tests/parsed-surface.test-d.ts` (create), plus
  the python and typescript equivalents.
- Docs: the `wrap.ts` glossary entries.

**Interfaces:**
- Consumes: `T.X.Parsed` and `T.ParsedByKindId` (Task 3); list-owner
  members (Task 4).
- Produces: every `wrapX(data, tree): T.X.Parsed`. Consumers of
  `SourceFileTree` and the like keep their names, now aliasing
  `T.SourceFile.Parsed & ParsedRoot`.

- [ ] **Step 1: Write the failing end-to-end type probe.**

```ts
// packages/rust/tests/parsed-surface.test-d.ts
import { expectTypeOf, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import type { FunctionItem, Parameters } from '../src/types.ts';

const rs = await createEngine(rust);

it('a statement narrowed by its guard has the parsed surface', () => {
	const item = rs.parse('fn f() {}\n').statements()[0]!;
	if (rs.is.functionItem(item)) {
		expectTypeOf(item).toMatchTypeOf<FunctionItem.Parsed>();
		expectTypeOf(item.parameters()).toEqualTypeOf<Parameters.Parsed>();
		const d = item.$with.parameters(rs.build.parameters());
		expectTypeOf(d.$render).toBeFunction();
	}
});
```

- [ ] **Step 2: Confirm it fails.**
  - Run: `pnpm exec vitest --typecheck run packages/rust/tests/parsed-surface.test-d.ts`
  - Expected: FAIL (TS2339 `$with` does not exist).

- [ ] **Step 3: Annotate and type through the map.** Print the storage
  members from the slot model, which is already how `emitInterface` does
  it. Never widen a wrap's object literal to its storage interface with
  a cast: if a projected storage slot (`__inputHints__`, a kind-enum
  projection) makes the literal disagree with `T.X.Parsed`, fix the
  declared type's storage part at its emitter.

- [ ] **Step 4: Regenerate. Run the probes and the full gates.** Repeat
  the Task 3 Step 6 timing comparison, and record it in the commit
  message.

- [ ] **Step 5: Glossary and commit.**

```bash
git commit -m "feat(codegen): every wrap returns its kind's declared Parsed surface" -- packages/codegen/src/emitters/wrap.ts packages/*/src packages/*/.sittir packages/*/tests docs/glossary
```

---

### Task 6: `$with` on a list owner mirrors its factory

**Files:**
- Modify: `packages/types/src/node-surface.ts`. `ListOwnerMembers` gains
  a call signature on `$with`:
  `(options: O, ...items: NonEmptyArray<E>) => Self` and
  `(...items: NonEmptyArray<E>) => Self`, beside the slot setters.
- Modify: `packages/common/src/utils.ts`. `withListOwner` makes `$with`
  callable: a function carrying the existing setter properties. Calling
  it builds a replacement list through the list kind's own factory (the
  owner's forwarded target) and returns `$with.<listSlot>(list)`.
- Test: extend `packages/rust/tests/list-owner.test.ts`, and extend
  `packages/types/tests/node-surface.test-d.ts` with the synthetic kind.

- [ ] **Step 1: Write the failing tests.**

```ts
it('$with on a list owner takes the list factory arguments', () => {
	const ps = fnOf('fn f(a: u8) {}\n').parameters();
	const q = rs.build.parameter({ pattern: rs.build.identifier('q'), type: rs.kinds.U8Keyword });
	expect(ps.$with({ delimiter: Delimiter.Trailing }, q).$render()).toBe('(q: u8,)');
	expect(ps.$with(q).$render()).toBe('(q: u8)');
});
```

```ts
it('a list owner $with is callable with the factory arguments', () => {
	expectTypeOf(listOwner.$with({ delimiter: 2 }, oneParam)).toHaveProperty('elements');
	expectTypeOf(listOwner.$with(oneParam)).toHaveProperty('elements');
});
```

- [ ] **Step 2: Confirm they fail.** Run the two test files; both fail
  (`ps.$with is not a function` / no call signature).
- [ ] **Step 3: Implement the call signature and the callable `$with`**
  as described under Files.
- [ ] **Step 4: Regenerate and run the gates.** Validate rows identical.
- [ ] **Step 5: Glossary and commit.**

```bash
git commit -m "feat(runtime): a list owner's \$with takes its list factory's arguments" -- packages/types packages/common packages/codegen/src/emitters packages/*/src packages/*/.sittir packages/*/tests docs/glossary
```

---

## Spec coverage

| Spec requirement | Task |
|---|---|
| `__slotHints__` (slot inputs, list owner) | 2 |
| `BoundOf` / `ParsedOf` / `Setters` / `WithSlot`; key-remapping; `this` at the member | 1, 3 |
| `X.Bound` replaces `X.Built` everywhere | 3 |
| `X.Parsed`, `.Parsed` children, `$with` narrowing and chaining | 1, 3, 5 |
| List owner: iterable (pass-through), `length`/`at`, flattened options | 1, 4 |
| List owner `$with(options?, ...items)` | 6 |
| Supertype unions distribute; `is.*` narrows unchanged | 5 (probe) |
| Wraps annotated `: X.Parsed`; drill helpers typed through the map | 5 |
| Timing gate with the plain-`Parsed` fallback as a review decision | 3, 5 |
| Validate rows identical | every task |

`$commit` is not in this plan. It lands with the edit-lifecycle work, and
`X.Parsed` is where it will be declared.
