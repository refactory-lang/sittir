import type { AnyUntypedNode, NodeMemberValue } from '@sittir/types';

const ASSERT_ENABLED = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

function assertString(value: unknown, path: string): asserts value is string {
	if (typeof value !== 'string') {
		throw new TypeError(`${path} must be a string, got ${describe(value)}`);
	}
}

function assertBoolean(value: unknown, path: string): asserts value is boolean {
	if (typeof value !== 'boolean') {
		throw new TypeError(`${path} must be a boolean, got ${describe(value)}`);
	}
}

function assertFiniteNumber(value: unknown, path: string): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${path} must be a finite number, got ${describe(value)}`);
	}
}

function assertNativeSource(value: unknown, path: string): asserts value is 0 | 1 | 2 {
	if (value !== 0 && value !== 1 && value !== 2) {
		throw new TypeError(`${path} must be 0 (ts), 1 (sg), or 2 (factory), got ${describe(value)}`);
	}
}

function assertNativeSpan(value: unknown, path: string): void {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	assertFiniteNumber(value.start, `${path}.start`);
	assertFiniteNumber(value.end, `${path}.end`);
}

function assertNativeFieldValue(value: unknown, path: string): asserts value is NodeMemberValue {
	if (typeof value === 'string') return;
	if (typeof value === 'boolean') return;
	if (typeof value === 'number') {
		assertFiniteNumber(value, path);
		return;
	}
	if (Array.isArray(value)) {
		for (const [index, item] of value.entries()) {
			assertNativeUntypedNodeInternal(item, `${path}[${index}]`);
		}
		return;
	}
	assertNativeUntypedNodeInternal(value, path);
}

/**
 * Internal recursive validator for the native render boundary.
 *
 * Checks all runtime invariants required before passing node data to the
 * native (napi) render engine:
 *  - `$type` is a finite number (a parser kind id)
 *  - `$source`, when present (a built node), is one of `0 | 1 | 2`, and `$named` a boolean
 *  - `$format` is absent (must be passed separately via TreeHandle.format)
 *  - no function-valued properties (methods like `render()` cannot cross napi)
 *  - a coordinate (`$treeHandle`) names its handle as a finite number and carries its `$span`
 *  - `$_layout`, when present, is an object
 *  - nested `_<name>` storage satisfies the same constraints; finite numbers
 *    (kind ids) and booleans are storage too
 */
function assertNativeUntypedNodeInternal(value: unknown, path: string): asserts value is AnyUntypedNode {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	for (const [key, v] of Object.entries(value)) {
		if (typeof v === 'function') {
			throw new TypeError(
				`${path}.${key} is a function — only plain data objects can cross the native render boundary`
			);
		}
	}
	if (typeof value.$type !== 'number') {
		throw new TypeError(`${path}.$type must be a number, got ${describe(value.$type)}`);
	}
	if (value.$source !== undefined) assertNativeSource(value.$source, `${path}.$source`);
	if (value.$named !== undefined) assertBoolean(value.$named, `${path}.$named`);
	if (value.$format !== undefined) {
		throw new TypeError(`${path}.$format is not supported by the native render boundary; pass format separately`);
	}
	for (const key of Object.keys(value)) {
		if (!key.startsWith('_')) continue;
		if (value[key] === undefined) continue;
		assertNativeFieldValue(value[key], `${path}.${key}`);
	}
	if (value.$text !== undefined) assertString(value.$text, `${path}.$text`);
	if (value.$treeHandle !== undefined) {
		assertFiniteNumber(value.$treeHandle, `${path}.$treeHandle`);
		assertNativeSpan(value.$span, `${path}.$span`);
	}
	if (value.$_layout !== undefined && !isRecord(value.$_layout)) {
		throw new TypeError(`${path}.$_layout must be an object, got ${describe(value.$_layout)}`);
	}
}

/**
 * Assertion — throws `TypeError` if `node` violates any runtime invariant
 * required by the native (napi) render boundary.
 *
 * Checks performed: those of the recursive validator above, on `node` and
 * everything stored under it.
 */
export function assertRenderableUntypedNode(node: AnyUntypedNode): asserts node is AnyUntypedNode {
	if (!ASSERT_ENABLED) return;
	assertNativeUntypedNodeInternal(node, 'node');
}
