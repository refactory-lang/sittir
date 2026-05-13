# Rust Slot Surface Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Rust path obey the approved slot-surface contract by deriving slot arity from `AssembledNonterminal.values`, normalizing wrap and validator behavior from that derivation, and emitting Rust transport/template surfaces that match the target matrix without changing the raw native read payload. Preserve token-rule whitespace fidelity while doing so: token-only output must not widen from `jjjj` to ` jjjj ` as render wiring changes.

**Architecture:** Keep the raw native boundary unchanged and push schema-aware arity handling into generated layers. The single source of truth for arity is the `values` multiplicity on each `AssembledNonterminal`; codegen should derive storage, validator metadata, wrap normalization, and Rust render transport/template shapes from that source instead of inferring from realized payload shape.

**Tech Stack:** TypeScript 6 ESM, pnpm workspaces, Vitest, tsgo, tree-sitter grammar codegen, Rust napi render crates, validator CLI

---

## File Structure

- Create: `packages/codegen/src/__tests__/child-slot-arity-emit.test.ts`
  - Locks the generated TypeScript storage contract for singular vs repeated unnamed children.
- Create: `packages/codegen/src/__tests__/factory-map-slot-arity.test.ts`
  - Locks the validator metadata emitted from `AssembledNonterminal.values`.
- Create: `packages/codegen/src/__tests__/wrap-slot-arity.test.ts`
  - Locks wrap normalization and singular-slot throw behavior in the emitted source.
- Modify: `packages/codegen/src/compiler/node-map.ts`
  - Add shared cardinality helpers derived from slot `values`; no parallel metadata source.
- Modify: `packages/codegen/src/emitters/types.ts`
  - Emit singular unnamed children as single / optional-single instead of singleton tuples.
- Modify: `packages/codegen/src/emitters/factory-map.ts`
  - Emit validator-facing per-slot arity metadata derived from the same `values` array.
- Modify: `packages/codegen/src/emitters/wrap.ts`
  - Normalize named and unnamed slots from grammar-derived cardinality and throw on singular mismatch.
- Modify: `packages/codegen/src/validate/common.ts`
  - Stop inferring slot arity from payload shape; normalize config values from emitted slot metadata.
- Modify: `packages/codegen/src/validate/from.ts`
  - Load and pass the new slot metadata into `nodeToConfig`.
- Modify: `packages/codegen/src/validate/factory-render-parse.ts`
  - Load and pass the new slot metadata into `nodeToConfig`.
- Modify: `packages/codegen/src/__tests__/node-to-config-promotion.test.ts`
  - Lock the validator contract for singular vs repeated named and unnamed slots.
- Modify: `packages/codegen/src/emitters/render-module.ts`
  - Emit Rust transport fields as `T | Option<T> | Vec<T>` and Askama views as `Single/Optional/List`.
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts`
  - Lock Rust transport field shapes for singular and repeated slots.
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`
  - Lock Rust template view shapes for singular and repeated slots, and preserve token-only whitespace fidelity when token rules are threaded through the new path.
- Modify: `rust/crates/sittir-core/tests/read_node.rs`
  - Add a regression proving the raw native read payload still preserves realized shape.
- Regenerate: `packages/rust/src/types.ts`
- Regenerate: `packages/rust/src/wrap.ts`
- Regenerate: `packages/rust/factory-map.json5`
- Regenerate: `rust/crates/sittir-rust/src/render/transport.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/templates.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/dispatch.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/bridge.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/mod.rs`

## Task 1: Derive slot cardinality from `AssembledNonterminal.values` and fix generated child storage types

**Files:**

- Create: `packages/codegen/src/__tests__/child-slot-arity-emit.test.ts`
- Modify: `packages/codegen/src/compiler/node-map.ts`
- Modify: `packages/codegen/src/emitters/types.ts`

- [ ] **Step 1: Write the failing type-emitter test**

```ts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { emitTypes } from '../emitters/types.ts';

function makeRequiredSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map([
		['single_parent', new AssembledBranch('single_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'synth',
		grammarSha: 'test',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeOptionalSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'optional',
		content: { type: 'symbol', name: 'identifier' }
	};
	const nodes = new Map([
		['optional_parent', new AssembledBranch('optional_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'synth',
		grammarSha: 'test',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

describe('types emitter child slot arity', () => {
	it('emits singular unnamed children as single values instead of singleton tuples', () => {
		const requiredSrc = emitTypes({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });
		const optionalSrc = emitTypes({ grammar: 'synth', nodeMap: makeOptionalSingleChildNodeMap() });

		expect(requiredSrc).toContain('readonly $children: Identifier;');
		expect(requiredSrc).not.toContain('readonly $children: readonly [Identifier];');
		expect(optionalSrc).toContain('readonly $children?: Identifier;');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run packages/codegen/src/__tests__/child-slot-arity-emit.test.ts
```

Expected: FAIL because `emitters/types.ts` still emits `readonly [T]` for singular unnamed children.

- [ ] **Step 3: Add shared cardinality helpers and switch `$children` emission to single/optional-single**

```ts
// packages/codegen/src/compiler/node-map.ts
export interface SlotCardinality {
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

export function deriveSlotCardinality(slot: { values: readonly NodeOrTerminal[] }): SlotCardinality {
	return {
		required: isRequired(slot),
		multiple: isMultiple(slot),
		nonEmpty: isNonEmpty(slot)
	};
}

export function deriveChildrenCardinality(
	children: readonly { values: readonly NodeOrTerminal[] }[]
): SlotCardinality {
	return {
		required: children.some((child) => isRequired(child)),
		multiple: children.some((child) => isMultiple(child)),
		nonEmpty: children.some((child) => isNonEmpty(child))
	};
}
```

```ts
// packages/codegen/src/emitters/types.ts
const cardinality = deriveChildrenCardinality(emittableChildren);
if (cardinality.multiple) {
	if (cardinality.nonEmpty) {
		lines.push(`  readonly $children: NonEmptyArray<${union}>;`);
	} else {
		lines.push(`  readonly $children: readonly (${union})[];`);
	}
} else if (cardinality.required) {
	lines.push(`  readonly $children: ${union};`);
} else {
	lines.push(`  readonly $children?: ${union};`);
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/child-slot-arity-emit.test.ts \
  packages/codegen/src/__tests__/optional-repeat1-multiplicity.test.ts \
  packages/codegen/src/__tests__/assemble.test.ts
```

Expected: PASS. The new test proves singular child slots are single-valued; the existing multiplicity tests still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/emitters/types.ts \
        packages/codegen/src/__tests__/child-slot-arity-emit.test.ts
git commit -m "refactor: derive child storage arity from slot values"
```

## Task 2: Emit slot-arity metadata and normalize wrap from the same derivation

**Files:**

- Create: `packages/codegen/src/__tests__/factory-map-slot-arity.test.ts`
- Create: `packages/codegen/src/__tests__/wrap-slot-arity.test.ts`
- Modify: `packages/codegen/src/emitters/factory-map.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`

- [ ] **Step 1: Write the failing factory-map and wrap tests**

```ts
// packages/codegen/src/__tests__/factory-map-slot-arity.test.ts
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { describe, expect, it } from 'vitest';
import { buildFactoryMap } from '../emitters/factory-map.ts';

function makeRequiredSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map([
		['single_parent', new AssembledBranch('single_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'synth',
		grammarSha: 'test',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

describe('factory-map slot arity metadata', () => {
	it('emits named and unnamed slot metadata from AssembledNonterminal.values', () => {
		const data = buildFactoryMap(makeRequiredSingleChildNodeMap());

		expect(data.factorySlots.single_parent.children).toEqual({
			unnamed: true,
			required: true,
			multiple: false,
			nonEmpty: false
		});
	});
});
```

```ts
// packages/codegen/src/__tests__/wrap-slot-arity.test.ts
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../emitters/wrap.ts';

function makeRequiredSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map([
		['single_parent', new AssembledBranch('single_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'synth',
		grammarSha: 'test',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

describe('wrap emitter slot arity', () => {
	it('normalizes singular unnamed children through the singular slot path', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain("createUnnamedChildrenSlotModel('one')");
		expect(source).toContain('normalizeSingularWrapSlot(');
		expect(source).not.toContain('children() { return drillInAll<');
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/factory-map-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrap-slot-arity.test.ts
```

Expected: FAIL because `factory-map.ts` has no `factorySlots` map yet and `wrap.ts` still hardcodes unnamed children as `many`.

- [ ] **Step 3: Extend `factory-map.json5` metadata and normalize wrap storage from cardinality**

```ts
// packages/codegen/src/emitters/factory-map.ts
export interface FactorySlotMeta {
	readonly unnamed: boolean;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

export interface FactoryMapData {
	readonly factoryShapes: Readonly<Record<string, FactoryShape>>;
	readonly fieldAliasMap: Readonly<Record<string, Readonly<Record<string, string>>>>;
	readonly factoryFields: Readonly<Record<string, readonly string[]>>;
	readonly factorySlots: Readonly<Record<string, Readonly<Record<string, FactorySlotMeta>>>>;
	readonly polymorphVariants: PolymorphVariantMap;
}

const factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
for (const [kind, node] of nodeMap.nodes) {
	const slots: Record<string, FactorySlotMeta> = {};
	for (const field of node.fields ?? []) {
		const card = deriveSlotCardinality(field);
		slots[field.name] = { unnamed: false, ...card };
	}
	if ('children' in node && node.children.length > 0) {
		slots.children = { unnamed: true, ...deriveChildrenCardinality(node.children) };
	}
	if (Object.keys(slots).length > 0) factorySlots[kind] = slots;
}

return { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants };
```

```ts
// packages/codegen/src/emitters/wrap.ts
function normalizeSingularWrapSlot<T>(
	value: T | readonly T[] | undefined,
	slotName: string,
	required: boolean
): T | undefined {
	if (Array.isArray(value)) {
		if (value.length === 0) return required ? undefined : undefined;
		if (value.length !== 1) {
			throw new TypeError(`wrapNode: singular slot '${slotName}' received ${value.length} values`);
		}
		return value[0];
	}
	return value;
}

function normalizeRepeatedWrapSlot<T>(value: T | readonly T[] | undefined, nonEmpty: boolean, slotName: string): readonly T[] {
	const items = Array.isArray(value) ? value : value === undefined ? [] : [value];
	if (nonEmpty && items.length === 0) {
		throw new TypeError(`wrapNode: repeated slot '${slotName}' requires at least one value`);
	}
	return items;
}

const childrenCardinality = deriveChildrenCardinality(children);
const childrenSlot = createUnnamedChildrenSlotModel(childrenCardinality.multiple ? 'many' : 'one');
```

- [ ] **Step 4: Run the focused emitter tests**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/factory-map-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrap-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrap-variant-emit.test.ts
```

Expected: PASS. The new tests prove the metadata path and wrap emitter both use grammar-derived arity.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/factory-map.ts \
        packages/codegen/src/emitters/wrap.ts \
        packages/codegen/src/__tests__/factory-map-slot-arity.test.ts \
        packages/codegen/src/__tests__/wrap-slot-arity.test.ts
git commit -m "refactor: derive wrap arity from assembled slot values"
```

## Task 3: Make `nodeToConfig` metadata-driven instead of payload-driven

**Files:**

- Modify: `packages/codegen/src/validate/common.ts`
- Modify: `packages/codegen/src/validate/from.ts`
- Modify: `packages/codegen/src/validate/factory-render-parse.ts`
- Modify: `packages/codegen/src/__tests__/node-to-config-promotion.test.ts`

- [ ] **Step 1: Write the failing validator tests**

```ts
import { describe, expect, it } from 'vitest';
import { nodeToConfig } from '../validate/common.ts';

describe('nodeToConfig slot arity normalization', () => {
	it('returns a singular child slot as a single value when factory metadata says one', () => {
		const config = nodeToConfig(
			{
				$type: 'single_parent',
				$named: true,
				$children: [{ $type: 'identifier', $named: true, $text: 'x' }]
			} as never,
			{
				factorySlots: {
					single_parent: {
						children: { unnamed: true, required: true, multiple: false, nonEmpty: false }
					}
				}
			}
		);

		expect(config.children).toEqual({ $type: 'identifier', $named: true, $text: 'x' });
	});

	it('throws when a singular named slot arrives as multiple values', () => {
		expect(() =>
			nodeToConfig(
				{
					$type: 'call_expression',
					_callee: [
						{ $type: 'identifier', $named: true, $text: 'left' },
						{ $type: 'identifier', $named: true, $text: 'right' }
					]
				} as never,
				{
					factorySlots: {
						call_expression: {
							callee: { unnamed: false, required: true, multiple: false, nonEmpty: false }
						}
					}
				}
			)
		).toThrow("singular slot 'callee' received 2 values");
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run packages/codegen/src/__tests__/node-to-config-promotion.test.ts
```

Expected: FAIL because `nodeToConfig` still uses `Array.isArray(...)` and hardcoded unnamed-children-many reconstruction.

- [ ] **Step 3: Thread `factorySlots` through the validator and normalize slots before assigning config**

```ts
// packages/codegen/src/validate/common.ts
readonly factorySlots?: Record<
	string,
	Record<string, { unnamed: boolean; required: boolean; multiple: boolean; nonEmpty: boolean }>
>;

function normalizeConfigSlotValue(
	slot: SlotModel,
	meta: NodeToConfigOpts['factorySlots'][string][string] | undefined,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts
): unknown {
	const resolved = Array.isArray(value) ? value.map((item) => resolveChild(item, childOpts)) : resolveChild(value, childOpts);
	if (slot.arity === 'many') {
		const items = Array.isArray(resolved) ? resolved : resolved === undefined ? [] : [resolved];
		if (meta?.nonEmpty && items.length === 0) {
			throw new TypeError(`nodeToConfig: repeated slot '${slot.name}' requires at least one value`);
		}
		return items;
	}
	if (Array.isArray(resolved)) {
		if (resolved.length === 0) return undefined;
		if (resolved.length !== 1) {
			throw new TypeError(`nodeToConfig: singular slot '${slot.name}' received ${resolved.length} values`);
		}
		return resolved[0];
	}
	return resolved;
}

function assignSlotToConfig(
	slot: SlotModel,
	meta: NodeToConfigOpts['factorySlots'][string][string] | undefined,
	value: readonly unknown[] | unknown,
	childOpts: NodeToConfigOpts,
	out: Record<string, unknown>
): void {
	out[slotConfigKey(slot)] = normalizeConfigSlotValue(slot, meta, value, childOpts);
}
```

```ts
// packages/codegen/src/validate/common.ts
const slotMeta = parentKind ? opts.factorySlots?.[parentKind]?.[k] : undefined;
assignSlotToConfig(
	createNamedSlotModel(k, slotMeta?.multiple ? 'many' : 'one'),
	slotMeta,
	v,
	memberValueOpts(opts, parentKind, k),
	out
);

const childrenMeta = parentKind ? opts.factorySlots?.[parentKind]?.children : undefined;
assignSlotToConfig(
	createUnnamedChildrenSlotModel(childrenMeta?.multiple ? 'many' : 'one'),
	childrenMeta,
	data.$children,
	childOpts,
	out
);
```

```ts
// packages/codegen/src/validate/from.ts and factory-render-parse.ts
factorySlots = mapData.factorySlots ?? {};
// ...
nodeToConfig(node, { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants, ... });
```

- [ ] **Step 4: Run the focused validator tests**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/node-to-config-promotion.test.ts \
  packages/codegen/tests/integration/validate-all.test.ts
```

Expected: PASS. The focused promotion tests prove the slot contract; the integration validator smoke test still succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/validate/common.ts \
        packages/codegen/src/validate/from.ts \
        packages/codegen/src/validate/factory-render-parse.ts \
        packages/codegen/src/__tests__/node-to-config-promotion.test.ts
git commit -m "fix: normalize validator slots from emitted arity metadata"
```

## Task 4: Emit Rust transport and Askama views with the target slot shapes

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts`
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`

- [ ] **Step 1: Write the failing Rust render-module tests**

Also add or extend a regression here for token-only render spacing so the new transport/template path cannot turn `jjjj` into ` jjjj ` by losing token-rule fidelity.

```ts
// packages/codegen/src/__tests__/native-transport-emit.test.ts
import { describe, expect, it } from 'vitest';
import { emitRenderModule } from '../emitters/render-module.ts';

describe('render-module slot arity', () => {
	it('emits singular children transport as scalar/option, not OneOrMany', () => {
		const files = [{ filename: 'single_parent.jinja', content: '{{ children }}' }] as const;
		const required = emitRenderModule('rust', files, makeRequiredChildrenNodeMap());
		const optional = emitRenderModule('rust', files, makeOptionalChildrenNodeMap());

		expect(required.transportRs.contents).toContain('pub children: IdentifierTransport,');
		expect(optional.transportRs.contents).toContain('pub children: Option<IdentifierTransport>,');
		expect(required.transportRs.contents).not.toContain('OneOrMany<IdentifierTransport>');
	});
});
```

```ts
// packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { describe, expect, it } from 'vitest';
import { emitRenderModule } from '../emitters/render-module.ts';

function makeRequiredChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map([
		['child_parent', new AssembledBranch('child_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeOptionalChildrenNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'optional', content: { type: 'symbol', name: 'identifier' } }]
	};
	const nodes = new Map([
		['optional_parent', new AssembledBranch('optional_parent', parentRule, parentRule)],
		['identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' })]
	]);
	return {
		grammar: 'rust',
		grammarSha: 'test-sha',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

describe('render-module slot arity template views', () => {
	it('emits singular template children views as Single/OptionalNonterminalView', () => {
		const files = [{ filename: 'single_parent.jinja', content: '{{ children }}' }] as const;
		const required = emitRenderModule('rust', files, makeRequiredChildrenNodeMap());
		const optional = emitRenderModule('rust', files, makeOptionalChildrenNodeMap());

		expect(required.templatesRs.contents).toContain("pub children: SingleNonterminalView<'a>,");
		expect(optional.templatesRs.contents).toContain("pub children: OptionalNonterminalView<'a>,");
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/native-transport-emit.test.ts \
  packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
```

Expected: FAIL because `render-module.ts` still emits `OneOrMany` for repeated slots and always emits `ListNonterminalView` for `children`.

- [ ] **Step 3: Switch transport and template emission to cardinality-aware shapes**

```ts
// packages/codegen/src/emitters/render-module.ts
function childrenViewType(s: EmittedStruct): string {
	if (s.childrenMultiple) return `ListNonterminalView<'a>`;
	return s.childrenRequired ? `SingleNonterminalView<'a>` : `OptionalNonterminalView<'a>`;
}

function transportFieldType(field: AssembledNonterminal, cls: SlotClass): string {
	const base = transportInnerType(field, cls);
	if (isMultiple(field)) return `Vec<${base}>`;
	return isRequired(field) ? base : `Option<${base}>`;
}

function transportChildrenType(children: readonly AssembledNonterminal[], cls: SlotClass): string {
	const base = transportInnerChildrenType(children, cls);
	if (children.some((child) => isMultiple(child))) return `Vec<${base}>`;
	return children.some((child) => isRequired(child)) ? base : `Option<${base}>`;
}
```

```ts
// packages/codegen/src/emitters/render-module.ts
if (s.hasChildren) {
	lines.push(`    pub children: ${childrenViewType(s)},`);
}
// ...
if (s.hasChildren && s.childrenMultiple) {
	lines.push(`${indent}    children: ListNonterminalView { ... },`);
} else if (s.hasChildren && s.childrenRequired) {
	lines.push(
		`${indent}    children: SingleNonterminalView(::sittir_core::filters::Renderable::Text(children.as_scalar())),`
	);
} else if (s.hasChildren) {
	lines.push(`${indent}    children: match children.kind {`);
	lines.push(`${indent}        ResolvedFieldKind::Missing => OptionalNonterminalView::Missing,`);
	lines.push(
		`${indent}        ResolvedFieldKind::Scalar | ResolvedFieldKind::List => OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(children.as_scalar())),`
	);
	lines.push(`${indent}    },`);
}
```

- [ ] **Step 4: Run the focused render-module tests**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/native-transport-emit.test.ts \
  packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS. The transport tests prove `Vec<T>` replaces `OneOrMany<T>` for repeated slots, and the render-pipeline tests prove singular children now use `Single/OptionalNonterminalView`.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/native-transport-emit.test.ts \
        packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
git commit -m "refactor: align rust render surfaces with slot arity"
```

## Task 5: Prove the raw native payload stays raw, regenerate Rust artifacts, and run full verification

**Files:**

- Modify: `rust/crates/sittir-core/tests/read_node.rs`
- Regenerate: `packages/rust/src/types.ts`
- Regenerate: `packages/rust/src/wrap.ts`
- Regenerate: `packages/rust/factory-map.json5`
- Regenerate: `rust/crates/sittir-rust/src/render/transport.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/templates.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/dispatch.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/bridge.rs`
- Regenerate: `rust/crates/sittir-rust/src/render/mod.rs`

- [ ] **Step 1: Add the failing raw-boundary regression**

```rs
#[test]
fn raw_native_children_payload_stays_array_shaped() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { g(x); }";
    let tree = parse_tree(lang, source);
    let args = find_first_ts_node_by_kind(tree.root_node(), "arguments").expect("arguments node");
    let node = read_node(&tree, source, Some(args), Some(0));
    let json = serde_json::to_value(&node).expect("serialize");

    assert!(
        json.get("$children").is_some_and(Value::is_array),
        "raw native read payload must stay realized-shape for children"
    );
}
```

- [ ] **Step 2: Run the Rust boundary test to verify it passes before regeneration**

Run:

```bash
cargo test -p sittir-core read_node
```

Expected: PASS. This test guards the “do not redesign raw payload” requirement before the generated-layer changes land.

- [ ] **Step 3: Regenerate the Rust package and render crate artifacts**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
```

Expected: `packages/rust/src/{types,wrap,...}` and `rust/crates/sittir-rust/src/render/*` update from generator output; no hand edits in generated files.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
pnpm exec vitest --config packages/codegen/vitest.config.ts run \
  packages/codegen/src/__tests__/child-slot-arity-emit.test.ts \
  packages/codegen/src/__tests__/factory-map-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrap-slot-arity.test.ts \
  packages/codegen/src/__tests__/node-to-config-promotion.test.ts \
  packages/codegen/src/__tests__/native-transport-emit.test.ts \
  packages/codegen/src/__tests__/render-pipeline-optimization.test.ts

cargo test -p sittir-core read_node
pnpm --dir rust/crates/sittir-rust run build
pnpm -r run build
pnpm test
pnpm type-check
pnpm lint
pnpm format:check
npx tsx packages/validator/src/cli.ts counts --backend native rust
```

Expected:

- focused codegen tests: PASS
- `rust/crates/sittir-core` read-node regression: PASS
- `rust/crates/sittir-rust` build: succeeds
- repo build/test/type-check/lint/format: succeed
- validator counts print `rust/native:` with the four raw count lines and no new failures

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts \
        packages/codegen/src/emitters/types.ts \
        packages/codegen/src/emitters/factory-map.ts \
        packages/codegen/src/emitters/wrap.ts \
        packages/codegen/src/validate/common.ts \
        packages/codegen/src/validate/from.ts \
        packages/codegen/src/validate/factory-render-parse.ts \
        packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/child-slot-arity-emit.test.ts \
        packages/codegen/src/__tests__/factory-map-slot-arity.test.ts \
        packages/codegen/src/__tests__/wrap-slot-arity.test.ts \
        packages/codegen/src/__tests__/node-to-config-promotion.test.ts \
        packages/codegen/src/__tests__/native-transport-emit.test.ts \
        packages/codegen/src/__tests__/render-pipeline-optimization.test.ts \
        rust/crates/sittir-core/tests/read_node.rs \
        packages/rust/src/types.ts \
        packages/rust/src/wrap.ts \
        packages/rust/factory-map.json5 \
        rust/crates/sittir-rust/src/render/transport.rs \
        rust/crates/sittir-rust/src/render/templates.rs \
        rust/crates/sittir-rust/src/render/dispatch.rs \
        rust/crates/sittir-rust/src/render/bridge.rs \
        rust/crates/sittir-rust/src/render/mod.rs
git commit -m "fix: align rust slot surfaces with grammar-derived arity"
```

## Spec Coverage Check

- **Typed storage row:** Task 1 changes `types.ts` so singular unnamed children are single / optional-single, with arity derived from `values`.
- **Wrap row:** Task 2 normalizes storage and accessors from grammar-derived cardinality and throws on singular mismatch.
- **Validator row:** Task 3 removes payload-shape inference and reconstructs config through emitted slot metadata.
- **Native read payload row:** Task 5 adds a regression proving raw native read remains realized-shape and does not become schema-shaped.
- **Native render transport row:** Task 4 replaces repeated-slot `OneOrMany` transport with `Vec<T>` and keeps singular transport explicit.
- **Native template input row:** Task 4 emits `Single/Optional/ListNonterminalView` according to slot cardinality.
- **Factory config / From input rows:** No behavior change required by spec; the plan leaves those surfaces untouched.

## Placeholder Scan

- No `TODO`, `TBD`, or deferred “implement later” steps remain.
- Every task names exact files, concrete code, explicit commands, and expected outcomes.

## Type Consistency Check

- Shared helper names are consistent across tasks: `deriveSlotCardinality`, `deriveChildrenCardinality`, `factorySlots`, `normalizeSingularWrapSlot`, `normalizeRepeatedWrapSlot`, `normalizeConfigSlotValue`.
- The validator metadata path is consistent: `factory-map.ts` emits `factorySlots`, and `from.ts` / `factory-render-parse.ts` load and pass that exact property into `nodeToConfig`.
