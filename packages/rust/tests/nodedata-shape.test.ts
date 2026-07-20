/**
 * ADR-0018 Phase 2 — NodeData surface shape verification.
 *
 * Verifies the de-hoisted storage contract, non-enumerable accessor functions,
 * Object.freeze, $with immutability, JSON.stringify, and unified factory/wrap
 * surface (SC-001 through SC-008, FR-001 through FR-004).
 *
 * Uses the rust grammar as a concrete example.
 *
 * `it.fails` cases: specs/022-binding-simplify-assemble/IMPLEMENTATION-
 * STATUS.md documents freeze/$with as deferred ("hygiene rule: iterative
 * optimizations") — `freezeNodeData` and `buildWithNamespace` (packages/
 * common/src/nodeData.ts) are tagged `@forFutureUse ADR-0018` and not yet
 * wired into generated factory output. Non-enumerable accessors (FR-002 /
 * SC-004) shipped separately via `withAccessors` (packages/common/src/
 * utils.ts), wired into `packages/codegen/src/emitters/factories.ts`'s three
 * accessor-emission sites. The remaining `it.fails` cases assert the ADR's
 * target contract and are expected to fail until freeze/$with wiring lands;
 * `it.fails` flags loudly (test failure) if one unexpectedly starts passing,
 * which is the signal that its slice of the feature has shipped and the case
 * should convert back to a plain `it`.
 */

import { describe, it, expect } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

// ---------- helpers ----------

/** True if `key` is a non-enumerable own property. */
function isNonEnumerable(obj: object, key: string): boolean {
	const desc = Object.getOwnPropertyDescriptor(obj, key);
	return desc !== undefined && !desc.enumerable;
}

// A minimal block with no statements.
// `as any` bypasses Config type constraints — this test verifies runtime shape, not type-level API.
const minimalBlock = ir.block({ statement: [] as any });

// ---------- factory shape ----------

describe('ADR-0018 Phase 2 factory shape — branch node', () => {
	// functionItem requires typed Identifier | Metavariable for name, Parameters for
	// parameters, and Block for body. Cast config to `any` — we are testing the runtime
	// _-storage shape, not input type validation.
	const node = ir.function({
		name: 'my_fn',
		parameters: [],
		body: minimalBlock
	} as any);

	it('FR-001: $fields wrapper is absent — no $fields key on node', () => {
		expect(Object.prototype.hasOwnProperty.call(node, '$fields')).toBe(false);
		expect((node as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
	});

	it('FR-001: named field is stored under _<name> prefix (full NodeData, not the raw config value)', () => {
		// A loose string config value ('my_fn') is coerced into a proper leaf
		// NodeData object before storage for the `_name` child slot exercised
		// here (matches its typed accessor signature, `identifier(): Identifier`,
		// never `identifier(): string`). This is NOT a blanket claim about every
		// `_<name>` slot — auto-stamped kind-enum slots (e.g. python's `_type`)
		// legitimately store a primitive numeric `TSKindId`, not NodeData.
		const rec = node as unknown as Record<string, unknown>;
		expect(rec['_name']).toBeDefined();
		expect(typeof rec['_name']).toBe('object');
		expect((rec['_name'] as { $text?: string }).$text).toBe('my_fn');
	});

	it('FR-002: accessor function is non-enumerable', () => {
		expect(isNonEnumerable(node, 'name')).toBe(true);
	});

	it('FR-002: accessor function returns the stored value', () => {
		const rec = node as unknown as Record<string, unknown>;
		const accessor = rec['name'] as () => unknown;
		expect(typeof accessor).toBe('function');
		const value = accessor.call(node) as { $text?: string };
		expect(value.$text).toBe('my_fn');
	});

	it('SC-004: Object.keys() returns only $-metadata and _-storage keys (no accessor names)', () => {
		const keys = Object.keys(node);
		// No accessor names in enumerable keys
		expect(keys.filter((k) => !k.startsWith('$') && !k.startsWith('_'))).toEqual([]);
		// $type and $source are present
		expect(keys).toContain('$type');
		expect(keys).toContain('$source');
		// _name is present (de-hoisted storage)
		expect(keys).toContain('_name');
		// $fields is NOT present (FR-001)
		expect(keys).not.toContain('$fields');
	});

	// CONFIRMED DEFERRED (not a stale assertion or regression):
	// specs/022-binding-simplify-assemble/IMPLEMENTATION-STATUS.md's Phase 2
	// row explicitly says "Freeze deferred (hygiene rule: iterative
	// optimizations)" — `freezeNodeData` (packages/common/src/nodeData.ts)
	// carries an `@forFutureUse ADR-0018` tag and is not yet wired into
	// generated factory output. Left failing on purpose, same discipline as
	// the other two confirmed-real, deliberately-deferred bugs found this
	// session (acceptedTransportKinds, python _patterns).
	it.fails('Object.isFrozen() returns true (freeze contract)', () => {
		expect(Object.isFrozen(node)).toBe(true);
	});

	it('$type holds numeric TSKindId, not string', () => {
		expect(node.$type).toBe(TSKindId.FunctionItem);
		expect(typeof node.$type).toBe('number');
	});

	it('$source is 2 (factory provenance)', () => {
		expect(node.$source).toBe(2);
	});
});

describe('ADR-0018 Phase 2 factory shape — leaf node', () => {
	// A leaf node is one that holds $text, e.g. integer_literal
	const leaf = ir.integerLiteral('42');

	it('leaf: $text is present and equals the input', () => {
		expect((leaf as unknown as Record<string, unknown>)['$text']).toBe('42');
	});

	it('leaf: no _<name> keys (no fields)', () => {
		const keys = Object.keys(leaf);
		expect(keys.filter((k) => k.startsWith('_'))).toEqual([]);
	});

	it('leaf: no $fields', () => {
		expect((leaf as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
	});

	// See the "CONFIRMED DEFERRED" note above the branch-node isFrozen case —
	// freeze is deliberately not yet wired (ADR-0018 Phase 2, deferred).
	it.fails('leaf: Object.isFrozen() returns true', () => {
		expect(Object.isFrozen(leaf)).toBe(true);
	});
});

// ---------- $with namespace ----------

// CONFIRMED DEFERRED (not stale assertions or a regression): `$with` does not
// exist on factory output at all today — `buildWithNamespace` (packages/
// common/src/nodeData.ts) carries an `@forFutureUse ADR-0018 ... frozen
// NodeData / $with update namespace` tag, and `replaceField`/`replace`/
// `bindRange` (packages/common/src/edit.ts) are tagged "$replace method. Not
// yet wired into gener[ated factories]". specs/022-binding-simplify-assemble/
// IMPLEMENTATION-STATUS.md's Phase 2 summary row lists `$with` as "✅
// Shipped" alongside `_<name>` storage and freeze, but that line is stale —
// freeze is separately confirmed deferred in the same doc, and $with is
// empirically absent (`original.$with` is `undefined`). All 4 cases below
// left failing on purpose, same discipline as the other confirmed-deferred
// findings in this file and this session.
describe('ADR-0018 Phase 2 — $with namespace', () => {
	const original = ir.function({ name: 'original', parameters: [], body: minimalBlock } as any);

	it.fails('$with is non-enumerable on the node', () => {
		expect(isNonEnumerable(original, '$with')).toBe(true);
	});

	it('$with.name produces an updated node', () => {
		const withNs = (original as unknown as Record<string, unknown>)['$with'] as Record<string, unknown>;
		expect(withNs).toBeDefined();
		const nameFn = withNs['name'] as (v: unknown) => unknown;
		expect(typeof nameFn).toBe('function');
		const updated = nameFn('updated') as unknown as Record<string, unknown>;
		expect(updated['_name']).toBe('updated');
	});

	it.fails('$with produces a new frozen node; original is unchanged', () => {
		const withNs = (original as unknown as Record<string, unknown>)['$with'] as Record<string, unknown>;
		const nameFn = withNs['name'] as (v: unknown) => unknown;
		const updated = nameFn('changed') as unknown as Record<string, unknown>;
		// original unchanged
		expect((original as unknown as Record<string, unknown>)['_name']).toBe('original');
		// updated is frozen
		expect(Object.isFrozen(updated)).toBe(true);
	});

	it.fails('$with is not included in Object.keys()', () => {
		expect(Object.keys(original)).not.toContain('$with');
	});

	it.fails('$with is not included in JSON.stringify() output', () => {
		const json = JSON.stringify(original);
		expect(json).not.toContain('$with');
	});
});

// ---------- JSON serialization (SC-007) ----------

describe('ADR-0018 Phase 2 — JSON serialization (SC-007)', () => {
	const node = ir.function({ name: 'serialize_me', parameters: [], body: minimalBlock } as any);

	it('SC-007: JSON.stringify includes $type, $source, _<field> keys', () => {
		// _name holds the coerced leaf NodeData object, not the raw config
		// string — see the FR-001 note above (same current, consistent shape).
		const parsed = JSON.parse(JSON.stringify(node)) as Record<string, unknown>;
		expect(parsed['$type']).toBe(TSKindId.FunctionItem);
		expect(parsed['$source']).toBe(2);
		expect(parsed['_name']).toMatchObject({ $text: 'serialize_me' });
	});

	it('SC-007: JSON.stringify does NOT include $fields', () => {
		const json = JSON.stringify(node);
		expect(json).not.toContain('"$fields"');
	});

	it('SC-007: JSON.stringify does NOT include accessor function names as keys', () => {
		const json = JSON.stringify(node);
		// The serialized JSON should not contain "name" as a top-level key (it's an accessor, non-enumerable)
		// But _name IS expected (de-hoisted storage)
		const parsed = JSON.parse(json) as Record<string, unknown>;
		// The raw 'name' key (accessor) should NOT be present
		expect(Object.prototype.hasOwnProperty.call(parsed, 'name')).toBe(false);
	});

	it('SC-007: JSON.stringify does NOT include render/toEdit/replace function artifacts', () => {
		const json = JSON.stringify(node);
		expect(json).not.toContain('"render"');
		expect(json).not.toContain('"toEdit"');
		expect(json).not.toContain('"replace"');
	});
});

// ---------- container node shape ----------

describe('ADR-0018 Phase 2 factory shape — container node', () => {
	// declarationList() is a pure container with variadic children and no named fields.
	const container = ir.declarationList();

	it('container: variadic child slot uses its kind-derived storage key, even when empty', () => {
		// Kind-named slots (docs/superpowers/specs/2026-05-17-kind-named-slots-design.md)
		// give every positional slot — including a container's repeated-child
		// slot — its own kind-derived `_<kind>` storage key, present as a
		// structural fact regardless of whether the array is empty. There is
		// no generic `$children` fallback key.
		const keys = Object.keys(container);
		const storageKeys = keys.filter((k) => k.startsWith('_'));
		expect(storageKeys).toEqual(['_declaration_statement']);
	});

	// See the "CONFIRMED DEFERRED" note above the branch-node isFrozen case —
	// freeze is deliberately not yet wired (ADR-0018 Phase 2, deferred).
	it.fails('container: Object.isFrozen() returns true', () => {
		expect(Object.isFrozen(container)).toBe(true);
	});

	it('container: $type is correct', () => {
		expect(container.$type).toBe(TSKindId.DeclarationList);
	});
});

// ---------- collision safety (SC-001) ----------

describe('ADR-0018 Phase 2 — $fields absent from factory output (SC-001)', () => {
	// Test a variety of node kinds to confirm $fields is never present
	const nodes = [
		ir.function({ name: 'f', parameters: [], body: minimalBlock } as any),
		ir.declarationList(),
		ir.integerLiteral('1')
	];

	it.each(nodes.map((n, i) => [`node[${i}]`, n] as const))('SC-001: %s has no $fields key', (_label, n) => {
		expect((n as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
		expect(Object.keys(n)).not.toContain('$fields');
	});
});
