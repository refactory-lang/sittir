# A Boolean Slot's Query Condition: Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `where((c) => c.static.eq(true))` selects the nodes whose keyword is present, and `eq(false)` selects the others. The comparison compiles to one presence leaf, which the native walk, the JavaScript oracle and the portable read tests all evaluate.

**Architecture:**
- The query slot table stamps each keyword-presence slot once, at codegen, from the existing classifier (`keywordPresenceKind(...) === 'boolean'`).
- The recorder hands such a slot a presence member with only `eq(boolean)`. It compiles `eq(true)` to `{ op: 'present', fields, kinds }` and `eq(false)` to `{ op: 'not', of: <that leaf> }`. So the leaf carries no boolean, and `not` stays the only negation.
- The native `Plan` gains a `Present` arm, which holds when some non-extra child that the slot's routes admit exists. That is `any_value` with a test that always passes. The JavaScript `holds` gains the same arm.
- The recorder type reads the slot's hint: a `BooleanKeyword` input gives the presence member, any other input gives `SlotRef`.

**Tech Stack:** TypeScript (`@sittir/types`, `@sittir/common`, codegen emitters), Rust (`sittir-core::query`), vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-10-02-node-query-traversal-modification-api-design.md`: §7.1 (a boolean slot compares its value), §7.2 (a presence leaf, shared with the portable read tests), ruling 16, test 20.

**Base:** master. Branch `feat/boolean-slot-query` in `scratchpad/wt-boolean-query`.

## Global Constraints

- "A boolean slot holds a keyword's presence, as `static` and `async` do, and its member compares that value: it has only `eq(boolean)`."
- "`c.static.match(…)` is a type error."
- "A boolean slot's `eq` compiles to a presence leaf, which holds when a child sits in the slot's field (`true`) or none does (`false`)."
- "The portable surface's read tests use the same leaf … so one evaluator serves both."
- "Native code has no slot knowledge": the leaf carries routes only, never a slot name or a presence flag.
- "There is no object form of a condition."
- `packages/{lang}/src/*` is generated. The `querySlots` rows change only through `client-utils.ts` and a regen.
- Explanatory comments for codegen and tools go in `docs/glossary/`. The public types (`PresenceRef`, `Recorder`) carry JSDoc.

## Decisions this plan takes (for brainstorm to confirm)

1. **The leaf is routes-shaped:** `{ op: 'present', fields, kinds }`, not `{ op: 'present', field }`.
   - Some boolean slots arrive with no field. Regex `character_class.negation` routes `{ fields: [], kinds: ['negation'] }`.
   - The spec's "a child sits in the slot's field" is read as "a child the slot's routes admit". That is the admission `eq` and `match` already use.
2. **`eq(false)` is `not(present)`, with no `present: false` leaf.** One op, and the existing `not` arm.
3. **The stamp is a third tuple element on the slot row: the keyword's text**, `[accessor, routes, keyword]` (`keywordPresenceValue`). A boolean slot's portable read maps a `true` item to that text, so the JavaScript texts equal the source text the native walk reads, and `present` is `texts(plan).length > 0` on every path. It is not a key inside `SlotRoutes`, because the routes are spread into every leaf, so a key there would leak into `eq` and `match` leaves and break the "no slot knowledge" constraint.
4. **The unknown-kind recorder** is the shape check `where` runs before `ofType` narrows it. It gives an accessor the presence member when every kind that has that accessor stamps it presence, and the text member otherwise. This is the type rule over a union, at run time.
5. **Bitflag slots are out of scope.** A modifier set (rust `function_modifiers`) keeps `SlotRef` with `eq(text)`. The spec names only boolean slots. Whether a bitflag slot gets `has(keyword)` is an open question.
6. **The portable read tests on `feat/bindings`** currently lower a pin on a boolean slot to `{ op: 'eq', text: <keyword>, ...routes }`. Once this lands on master and master merges into `feat/bindings`, coordinate lowers such a pin to `{ op: 'present', ...routes }`, the same leaf. That edit is coordinate's (Task 5 below is a hand-off, with the code).

## Review Focus

1. **A boolean slot that routes by kind, with no field** (regex `[^a]`). Presence must hold with kind routing, exactly as with a field. Pinned in Task 3.
2. **`where` before `ofType`, from JavaScript.** The kind-unknown shape check must accept `c.async.eq(true)` when every kind with `async` stamps presence. Pinned in Task 3.
3. **A text comparison on a boolean slot from untyped code** (`eq('async')`, `match(/a/)`). Each must be refused with a message naming `eq(true)`/`eq(false)`, never compiled to a text leaf that silently matches the keyword's text. Pinned in Task 3.
4. **`eq(false)` on a node whose keyword is absent and that has no other children.** `not(present)` holds. Pinned in Task 2, native, with a rust unit case.
5. **A presence leaf shared across the kinds of one view** (`sharedPlan`). Two kinds whose `async` rows have equal routes push one plan down natively. Pinned in Task 3: the pushed-down step carries the plan.

---

### Task 1: Stamp keyword-presence slots in the query slot table

**Files:**
- Modify: `packages/codegen/src/emitters/client-utils.ts` (`QuerySlotRow`, `querySlotRows`)
- Modify: `packages/types/src/query.ts` (`QuerySlots`)
- Test: `packages/python/tests/query-slot-table.test.ts` (create): the generated table, read through the language hooks
- Docs: `docs/glossary/emitters.md` (`querySlotRows`, `QuerySlotRow`)

**Interfaces:**
- Produces: `QuerySlots = Readonly<Record<number, readonly QuerySlotEntry[]>>`, with `type QuerySlotEntry = readonly [accessor: string, routes: SlotRoutes, keyword?: string]`. It is exported from `@sittir/types`.

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it } from 'vitest';
import python from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

it('the query slot table stamps a keyword-presence slot, and only that slot', () => {
	const row = hooks.querySlots[py.kinds.FunctionDefinition]!;
	expect(row.find(([accessor]) => accessor === 'async')).toEqual(['async', { fields: ['async'], kinds: [] }, 'async']);
	expect(row.find(([accessor]) => accessor === 'name')).toEqual(['name', { fields: ['name'], kinds: [] }]);
});
```

- [ ] **Step 2: Run it.** `pnpm exec vitest run packages/python/tests/query-slot-table.test.ts`. Expected: FAIL, because the `async` row has no third element.

- [ ] **Step 3: Implement.**

```ts
type QuerySlotRow = readonly [accessor: string, routes: WireRoutes, keyword?: string];

const row = node.slots.map((slot): QuerySlotRow =>
	keywordPresenceKind(slot, nodeMap) === 'boolean'
		? [slot.propertyName, queryRoutesOf(slot, nodeMap), keywordPresenceValue(slot, nodeMap)!]
		: [slot.propertyName, queryRoutesOf(slot, nodeMap)]
);
```

Also, in `packages/types/src/query.ts`:

```ts
/** One slot of a kind: its accessor, its parser routes, and the keyword when the slot holds that keyword's presence. */
export type QuerySlotEntry = readonly [accessor: string, routes: SlotRoutes, keyword?: string];
/** Each kind's slots, by kind id. */
export type QuerySlots = Readonly<Record<number, readonly QuerySlotEntry[]>>;
```

- [ ] **Step 4: Regenerate, then run it.** Run `pnpm run regen:all`, run the test (PASS), then run `git diff --stat packages/*/src/utils.ts`. Expected: only `querySlots` rows change, gaining the keyword on the boolean slots (python `async`; rust `static`, `mutable`, …; typescript `static`, `async`, `readonly`, …; regex `negation`).

- [ ] **Step 5: Commit** by pathspec: the emitter, the types, the test, the glossary entries, and the regenerated `packages/*/src/utils.ts`.

### Task 2: The native presence leaf

**Source of the leaf:** commit `bc65fd935` (`fix/boolean-pin-presence`, into `feat/bindings`). Take its hunks in `query.rs`, `packages/common/src/query.ts` (`holds`), `client-utils.ts` and `packages/types/src/query.ts`; its portable files do not exist on master. The unit test routes `async` by kind because the upstream python grammar the crate tests with has no `async` field. Coordinate also lands Task 1's `client-utils.ts` and `QuerySlotEntry` hunks on `feat/bindings`; this branch cherry-picks them verbatim and regenerates. Coordinate lands this task's `query.rs` hunk and test, the `holds` `present` case, and Task 5 on `feat/bindings` (`fix/boolean-pin-presence`), ahead of this branch. Here they are cherry-picked byte for byte from that commit, not rewritten. The only master-specific hunk is the non-generic `QueryPlan` arm in Task 3.

**Files:**
- Modify: `rust/crates/sittir-core/src/query.rs` (`PlanSpec`, `Plan`, `Plan::compile`, `Plan::holds`)
- Test: the `#[cfg(test)] mod tests` in `query.rs` (create it if there is none)

**Interfaces:**
- Produces: `PlanSpec::Present { routes }`, deserialized from `{ "op": "present", "fields": [...], "kinds": [...] }`, and `Plan::Present { routes }`.

- [ ] **Step 1: Write the failing test.**

```rust
#[test]
fn a_presence_leaf_holds_when_a_child_the_routes_admit_exists() {
    let language: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).unwrap();
    let source = "async def a():\n    pass\ndef b():\n    pass\n";
    let tree = parser.parse(source, None).unwrap();
    let defs: Vec<_> = (0..2).map(|i| tree.root_node().named_child(i).unwrap()).collect();
    let present: PlanSpec = serde_json::from_str(r#"{"op":"present","fields":[],"kinds":["async"]}"#).unwrap();
    let present = Plan::compile(present).unwrap();
    assert!(present.holds(&defs[0], source));
    assert!(!present.holds(&defs[1], source));
    let absent = Plan::Not(Box::new(present));
    assert!(absent.holds(&defs[1], source));
}
```

Use whichever python grammar crate `sittir-core`'s dev-dependencies already have. If it has none, build the tree through `sittir-python`'s test helper the other `sittir-core` tests use, and record the choice as a ruling.

- [ ] **Step 2: Run it.** `cd rust && cargo test -p sittir-core --no-default-features --lib query`. Expected: FAIL to compile, with no variant `present`.

- [ ] **Step 3: Implement.**

```rust
    Present {
        #[serde(flatten)]
        routes: Routes,
    },
// Plan:
    Present { routes: Routes },
// compile:
            PlanSpec::Present { routes } => Plan::Present { routes },
// holds:
            Plan::Present { routes } => any_value(node, source, routes, |_| true),
```

Update the doc comment on `holds`: "a presence leaf holds when some child the slot's routes admit exists."

- [ ] **Step 4: Run it.** Same command: PASS. Then run the cargo gate: `cargo test --workspace --no-default-features`, then `cargo clippy --workspace --all-targets --no-default-features -- -D warnings`.

- [ ] **Step 5: Commit** `query.rs` by pathspec.

### Task 3: The recorder's presence member, the oracle, and the types

**Files:**
- Modify: `packages/types/src/query.ts` (`QueryPlan`, `PresenceRef`, `Recorder`)
- Modify: `packages/types/src/index.ts` (export `PresenceRef`, `QuerySlotEntry`, and the `IsBooleanKeyword` helper the recorder type reads)
- Modify: `packages/common/src/query.ts` (`slotsOf`, `everyAccessor`, `slotRef`, `recorder`, `holds`)
- Test: `packages/python/tests/query.test.ts`, `packages/python/tests/query.test-d.ts`, `packages/regex/tests/query-presence.test.ts` (create)
- Docs: `docs/glossary/packages-common-src.md` (`slotsOf`, `everyAccessor`, `slotRef`, `presenceRef`, `recorder`, `holds`) and `docs/glossary/packages-types-src.md` (`QueryPlan`, `PresenceRef`, `Recorder`)

**Interfaces:**
- Consumes: `QuerySlotEntry` (Task 1) and the native `present` leaf (Task 2).
- Produces:
  - `QueryPlan` gains `({ readonly op: 'present' } & SlotRoutes)`.
  - `interface PresenceRef { eq(present: boolean): Cond }`.
  - `Recorder<N> = { readonly [S in SlotNameOf<N>]: SlotRefOf<N, S> }`.

- [ ] **Step 1: Write the failing tests.**

In `packages/python/tests/query.test.ts`:

```ts
describe('where on a boolean slot', () => {
	const ASYNC = 'async def a():\n    pass\ndef b():\n    pass\n';
	const tree = py.parse(ASYNC);
	const defs = () => tree.$query().$descendants.ofType(K.FunctionDefinition);
	const names = (view: Iterable<{ name(): unknown }>) => [...view].map((fn) => textOf(ASYNC, fn.name()));
	const present: QueryPlan = { op: 'present', fields: ['async'], kinds: [] };

	it('eq(true) selects the nodes whose keyword is present and eq(false) the others', () => {
		expect(names(defs().where((c) => c.async.eq(true)))).toEqual(['a']);
		expect(names(defs().where((c) => c.async.eq(false)))).toEqual(['b']);
	});

	it('selects natively what the JavaScript reference selects', () => {
		for (const [value, plan] of [[true, present], [false, { op: 'not', of: present }]] as const) {
			const native = names(defs().where((c) => c.async.eq(value)));
			const reference = names(defs().filter((fn) => holds(plan, () => (fn.async() ? ['async'] : []))));
			expect(native).toEqual(reference);
		}
	});

	it('runs the presence leaf natively, pushed down with the kind', () => {
		const { root: data, tree } = py.diagnostics.parseAndRead(ASYNC);
		const steps: { kinds?: readonly number[]; plan?: unknown }[] = [];
		const query = (tree as { query?: { descendants(step: { kinds?: readonly number[]; plan?: unknown }): unknown } }).query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			steps.push(step);
			return walk(step);
		};
		const found = [...hooks.wrap(data, tree).$query().$descendants.ofType(K.FunctionDefinition).where((c) => c.async.eq(true))];
		expect(found).toHaveLength(1);
		expect(steps.every((step) => step.kinds?.[0] === K.FunctionDefinition && step.plan !== undefined)).toBe(true);
	});

	it('accepts a boolean comparison before ofType, where every kind with the slot holds a presence', () => {
		const all = tree.$query().$descendants as unknown as { where(c: (r: Record<string, { eq(v: boolean): unknown }>) => unknown): Iterable<unknown> };
		expect([...all.where((c) => c.async.eq(true))]).toHaveLength(1);
	});

	it('refuses text and patterns on a boolean slot', () => {
		const loose = (c: unknown) => (c as Record<string, { eq(t: string): never; match(p: RegExp): never }>).async!;
		expect(() => defs().where((c) => loose(c).eq('async'))).toThrow(/eq\(true\)/);
		expect(() => defs().where((c) => loose(c).match(/a/))).toThrow(/eq\(true\)/);
	});
});
```

The pushdown case uses the same setup and spy as the existing test "sends the kind filter and a where condition into the native walk".

In `packages/python/tests/query.test-d.ts`, inside `recorder()`:

```ts
		[...defs.where((c) => c.async.eq(true).and(c.name.eq('f')))],
		[...defs.where((c) => c.async.eq(false))],
		// @ts-expect-error a boolean slot compares its value, not its text
		defs.where((c) => c.async.eq('async')),
		// @ts-expect-error a boolean slot has no match
		defs.where((c) => c.async.match(/async/)),
```

In `packages/regex/tests/query-presence.test.ts` (Review Focus 1, a kind-routed boolean slot):

```ts
import { expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(regex);

it('a boolean slot that routes by kind compares its presence', () => {
	const root = engine.parse('[^a][b]');
	const classes = root.$query().$descendants.ofType(engine.kinds.CharacterClass);
	expect([...classes.where((c) => c.negation.eq(true))]).toHaveLength(1);
	expect([...classes.where((c) => c.negation.eq(false))]).toHaveLength(1);
});
```

- [ ] **Step 2: Run them.** Run `pnpm exec vitest run packages/python/tests/query.test.ts packages/regex/tests/query-presence.test.ts`, then `pnpm --filter @sittir/python type-check`. Expected:
  - vitest: FAIL. `eq(true)` is refused by `slotRef` ("takes the text to compare").
  - type-check: FAIL. `eq(true)` is not assignable to `string`, and the two `@ts-expect-error` lines are unused.

- [ ] **Step 3: Implement.**

In `packages/types/src/query.ts`:

```ts
export type QueryPlan =
	| ({ readonly op: 'eq'; readonly text: string } & SlotRoutes)
	| ({ readonly op: 'match'; readonly pattern: string } & SlotRoutes)
	| ({ readonly op: 'present' } & SlotRoutes)
	| { readonly op: 'not'; readonly of: QueryPlan }
	| { readonly op: 'and' | 'or'; readonly of: readonly QueryPlan[] };

/** A boolean slot of a `where` recorder: the slot holds a keyword's presence. */
export interface PresenceRef {
	/** Holds when the keyword is present (`true`) or absent (`false`). */
	eq(present: boolean): Cond;
}

type SlotRefOf<N, S> = N extends unknown
	? S extends keyof SlotHintsOf<N>
		? SlotHintsOf<N>[S] extends SlotHint<infer I, boolean, boolean, unknown>
			? IsBooleanKeyword<NonNullable<I>> extends true ? PresenceRef : SlotRef
			: SlotRef
		: never
	: never;

/** What a `where` callback receives: one member per slot of the view's element type; a boolean slot's member compares its presence. */
export type Recorder<N> = { readonly [S in SlotNameOf<N>]: SlotRefOf<N, S> };
```

Over a union whose members disagree on a slot, the member is `SlotRef | PresenceRef`. Its `eq` then takes `string & boolean`, which is `never`, so the call fails to type. That is the union rule §7.1 states for slots.

In `packages/common/src/query.ts`:

```ts
interface QuerySlot { readonly routes: SlotRoutes; readonly keyword: string | undefined }

// slotsOf builds Map<string, QuerySlot> from each entry:
//   ([accessor, routes, keyword]) => [accessor, { routes, keyword }]

function everyAccessor(table: QuerySlots): ReadonlyMap<string, QuerySlot> {
	const keywords = new Map<string, string | undefined>();
	for (const row of Object.values(table))
		for (const [accessor, , keyword] of row)
			keywords.set(accessor, keywords.has(accessor) && keywords.get(accessor) !== keyword ? undefined : keyword);
	return new Map([...keywords].map(([accessor, keyword]) => [accessor, { routes: NO_ROUTES, keyword }]));
}

function presenceRef(slot: string, routes: SlotRoutes, keyword: string): PresenceRef & { match(pattern: unknown): never } {
	const refuseText = (): never => refuse(`query: ${slot} holds the presence of ${JSON.stringify(keyword)}; compare it with eq(true) or eq(false)`);
	return Object.freeze({
		eq(present: boolean) {
			if (typeof present !== 'boolean') refuseText();
			const leaf: QueryPlan = { op: 'present', fields: routes.fields, kinds: routes.kinds };
			return cond(present ? leaf : { op: 'not', of: leaf });
		},
		match: refuseText
	});
}

const refOf = (key: string, slot: QuerySlot) => (slot.keyword !== undefined ? presenceRef(key, slot.routes, slot.keyword) : slotRef(key, slot.routes));
```

`recorder` reads `slots.get(key)` as a `QuerySlot` and returns `refOf(key, slot)` in both `get` and `getOwnPropertyDescriptor`. `holds` gains:

```ts
		case 'present':
			return texts(plan).length > 0;
```

- [ ] **Step 4: Run them.** Same commands: PASS. Then run the existing `where` cases in the same file (`pnpm exec vitest run packages/python/tests/query.test.ts`): all green, with their plans unchanged.

- [ ] **Step 5: Commit** the types, common, tests and glossary by pathspec.

### Task 4: Gates and the spec's test list

- [ ] `pnpm run regen:all`. `git status --short` shows no generated file outside `packages/*/src/utils.ts`, and those match Task 1's commit.
- [ ] The full suite, as its own call (`pnpm exec vitest run`). Isolate any new failure with a stash-and-rerun.
- [ ] `pnpm type-check` (workspace), the cargo test and clippy gate, and `pnpm run validate:native` then `pnpm run validate:history`: every row equal to the previous run.
- [ ] Codex adversarial review against master, with dispositions in the PR body. Open the PR against master, with `Owner: sittir-engine-api`.

### Task 5 (coordinate, on `feat/bindings`, landed ahead of this branch)

In `packages/codegen/src/emitters/overlays/portable/read-tests.ts::readTestOf`, a pin on a boolean slot lowers to the presence leaf, not to a text comparison of the keyword:

```ts
const pins = entry.pins.map((pin): PortableCondition | string => {
	const routes = routesOf(entry.kind, pin.slot);
	if (routes === undefined) return `no routes for pinned slot ${pin.slot}`;
	const plan: QueryPlan<QuerySubject> = presenceOf(entry.kind, pin.slot) ? { op: 'present', ...routes } : { op: 'eq', text: pin.text, ...routes };
	return { up: 0, via: [], plan };
});
```

Here `presenceOf` reads the same `keywordPresenceKind(slot, nodeMap) === 'boolean'` fact Task 1 stamps. On `feat/bindings`, `QueryPlan<S>` is generic over its subject, so the merge takes Task 3's `present` arm as `({ readonly op: 'present' } & S)`. The coordinate session owns this edit and its test, which is a portable read test on a binding that pins a boolean slot.

## Follow-up: a flag test on the node (`c.is(flag)`)

The maintainer's direction for a flag hoisted to the node, such as a bitflag slot's keyword (rust `function_modifiers`' `async`): the condition is a node-level membership test, `c.is('async')`, not a member of the slot. This plan leaves bitflag slots out. What follows is the shape for the maintainer to rule on before it gets a plan of its own.

- **Where it lives.** `is` is a method of the recorder itself, beside its slot members, so it reads the node, not a slot. A kind test is a slot's verb (`c.name.is(K.Identifier)`, the spec's "a kind test on a slot"), so the two are told apart by position. They are also told apart by argument type: a flag is a string literal from the kind's flag names, and a kind is a kind id. The recorder reserves the key `is`; codegen refuses a slot whose accessor is `is`, a check that holds for every grammar today.
- **Its type.** `is(flag: FlagOf<N>): Cond`, where `FlagOf<N>` is the flag names the vocabulary declares on that kind. Over a union it is only the flags every member declares, the same rule as the slots. A flag the kind does not declare is a type error, and a run-time refusal from untyped code.
- **Which flags count as hoisted.** The vocabulary's flags on that kind (the portable surface's flag is-guards): each binding that names a keyword the kind holds, whether as a boolean slot or as one member of a bitflag slot. A boolean slot's flag and `c.<slot>.eq(true)` then compile to the same leaf, so there are two spellings of one fact at the two API levels, which is accepted for the low-level surface.
- **The plan leaf.** It is presence over the flag's routes. A keyword that sits directly under the node is `{ op: 'present', fields, kinds }` with the keyword's kind among `kinds`. A keyword inside a wrapper child (rust's `function_modifiers` node) is reached through that child first. The portable read tests already express this as `via` steps before the leaf, and the native plan has no step today. So either the native `PlanSpec` gains a `via` (child) step, or `c.is` over a nested keyword stays a JavaScript-evaluated condition the way a portable read test is. That choice is the open question to rule on.
