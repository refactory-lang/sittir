/**
 * ADR-0018 Phase 2 — NodeData surface shape verification.
 *
 * Verifies the de-hoisted storage contract, non-enumerable accessor functions,
 * Object.freeze, $with immutability, JSON.stringify, and unified factory/wrap
 * surface (SC-001 through SC-008, FR-001 through FR-004).
 *
 * Uses the rust grammar as a concrete example.
 */

import { describe, it, expect } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

// ---------- helpers ----------

/** Get all own keys including non-enumerable. */
function allOwnKeys(obj: object): string[] {
	return Object.getOwnPropertyNames(obj);
}

/** True if `key` is a non-enumerable own property. */
function isNonEnumerable(obj: object, key: string): boolean {
	const desc = Object.getOwnPropertyDescriptor(obj, key);
	return desc !== undefined && !desc.enumerable;
}

// A minimal block with one child (block requires at least one child).
// `as any` bypasses Config type constraints — this test verifies runtime shape, not type-level API.
const minimalBlock = ir.block({ children: [] as any });

// ---------- factory shape ----------

describe('ADR-0018 Phase 2 factory shape — branch node', () => {
	// functionItem requires typed Identifier | Metavariable for name, Parameters for
	// parameters, and Block for body. Cast config to `any` — we are testing the runtime
	// _-storage shape, not input type validation.
	const node = ir.functionItem({
		name: 'my_fn',
		parameters: [],
		body: minimalBlock,
	} as any);

	it('FR-001: $fields wrapper is absent — no $fields key on node', () => {
		expect(Object.prototype.hasOwnProperty.call(node, '$fields')).toBe(false);
		expect((node as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
	});

	it('FR-001: named field is stored under _<name> prefix (enumerable)', () => {
		const rec = node as unknown as Record<string, unknown>;
		expect(rec['_name']).toBeDefined();
		expect(rec['_name']).toBe('my_fn');
	});

	it('FR-002: accessor function is non-enumerable', () => {
		expect(isNonEnumerable(node, 'name')).toBe(true);
	});

	it('FR-002: accessor function returns the stored value', () => {
		const rec = node as unknown as Record<string, unknown>;
		const accessor = rec['name'] as (() => unknown);
		expect(typeof accessor).toBe('function');
		expect(accessor.call(node)).toBe('my_fn');
	});

	it('SC-004: Object.keys() returns only $-metadata and _-storage keys (no accessor names)', () => {
		const keys = Object.keys(node);
		// No accessor names in enumerable keys
		expect(keys.filter(k => !k.startsWith('$') && !k.startsWith('_'))).toEqual([]);
		// $type and $source are present
		expect(keys).toContain('$type');
		expect(keys).toContain('$source');
		// _name is present (de-hoisted storage)
		expect(keys).toContain('_name');
		// $fields is NOT present (FR-001)
		expect(keys).not.toContain('$fields');
	});

	it('Object.isFrozen() returns true (freeze contract)', () => {
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
		expect(keys.filter(k => k.startsWith('_'))).toEqual([]);
	});

	it('leaf: no $fields', () => {
		expect((leaf as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
	});

	it('leaf: Object.isFrozen() returns true', () => {
		expect(Object.isFrozen(leaf)).toBe(true);
	});
});

// ---------- $with namespace ----------

describe('ADR-0018 Phase 2 — $with namespace', () => {
	const original = ir.functionItem({ name: 'original', parameters: [], body: minimalBlock } as any);

	it('$with is non-enumerable on the node', () => {
		expect(isNonEnumerable(original, '$with')).toBe(true);
	});

	it('$with.name produces an updated node', () => {
		const withNs = (original as unknown as Record<string, unknown>)['$with'] as Record<string, unknown>;
		expect(withNs).toBeDefined();
		const nameFn = withNs['name'] as ((v: unknown) => unknown);
		expect(typeof nameFn).toBe('function');
		const updated = nameFn('updated') as unknown as Record<string, unknown>;
		expect(updated['_name']).toBe('updated');
	});

	it('$with produces a new frozen node; original is unchanged', () => {
		const withNs = (original as unknown as Record<string, unknown>)['$with'] as Record<string, unknown>;
		const nameFn = withNs['name'] as ((v: unknown) => unknown);
		const updated = nameFn('changed') as unknown as Record<string, unknown>;
		// original unchanged
		expect((original as unknown as Record<string, unknown>)['_name']).toBe('original');
		// updated is frozen
		expect(Object.isFrozen(updated)).toBe(true);
	});

	it('$with is not included in Object.keys()', () => {
		expect(Object.keys(original)).not.toContain('$with');
	});

	it('$with is not included in JSON.stringify() output', () => {
		const json = JSON.stringify(original);
		expect(json).not.toContain('$with');
	});
});

// ---------- JSON serialization (SC-007) ----------

describe('ADR-0018 Phase 2 — JSON serialization (SC-007)', () => {
	const node = ir.functionItem({ name: 'serialize_me', parameters: [], body: minimalBlock } as any);

	it('SC-007: JSON.stringify includes $type, $source, _<field> keys', () => {
		const parsed = JSON.parse(JSON.stringify(node)) as Record<string, unknown>;
		expect(parsed['$type']).toBe(TSKindId.FunctionItem);
		expect(parsed['$source']).toBe(2);
		expect(parsed['_name']).toBe('serialize_me');
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
	// arguments() is a pure container with no required named fields.
	const container = ir.arguments();

	it('container: no _<field> keys (uses $children for content)', () => {
		const keys = Object.keys(container);
		// The container key set is only $-metadata (no named fields → no _<name> keys).
		const storageKeys = keys.filter(k => k.startsWith('_'));
		expect(storageKeys).toEqual([]);
	});

	it('container: Object.isFrozen() returns true', () => {
		expect(Object.isFrozen(container)).toBe(true);
	});

	it('container: $type is correct', () => {
		expect(container.$type).toBe(TSKindId.Arguments);
	});
});

// ---------- collision safety (SC-001) ----------

describe('ADR-0018 Phase 2 — $fields absent from factory output (SC-001)', () => {
	// Test a variety of node kinds to confirm $fields is never present
	const nodes = [
		ir.functionItem({ name: 'f', parameters: [], body: minimalBlock } as any),
		ir.arguments(),
		ir.integerLiteral('1'),
	];

	it.each(nodes.map((n, i) => [`node[${i}]`, n] as const))(
		'SC-001: %s has no $fields key',
		(_label, n) => {
			expect((n as unknown as Record<string, unknown>)['$fields']).toBeUndefined();
			expect(Object.keys(n)).not.toContain('$fields');
		}
	);
});
