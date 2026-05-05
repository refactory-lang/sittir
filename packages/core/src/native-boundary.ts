import type { AnyNodeData, NodeMemberValue } from '@sittir/types';

const ASSERT_ENABLED =
	typeof process !== 'undefined' &&
	process.env?.NODE_ENV !== 'production';

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

function assertFiniteNumber(
	value: unknown,
	path: string
): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(
			`${path} must be a finite number, got ${describe(value)}`
		);
	}
}

function assertNativeSource(
	value: unknown,
	path: string
): asserts value is 0 | 1 | 2 {
	if (value !== 0 && value !== 1 && value !== 2) {
		throw new TypeError(
			`${path} must be 0 (ts), 1 (sg), or 2 (factory), got ${describe(value)}`
		);
	}
}

function assertNativeSpan(value: unknown, path: string): void {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	assertFiniteNumber(value.start, `${path}.start`);
	assertFiniteNumber(value.end, `${path}.end`);
}

function assertNativeFieldValue(
	value: unknown,
	path: string
): asserts value is NodeMemberValue {
	if (typeof value === 'string') return;
	if (Array.isArray(value)) {
		for (const [index, item] of value.entries()) {
			assertNativeNodeDataInternal(item, `${path}[${index}]`);
		}
		return;
	}
	assertNativeNodeDataInternal(value, path);
}

function assertNativeChildren(value: unknown, path: string): void {
	if (!Array.isArray(value)) {
		throw new TypeError(`${path} must be an array, got ${describe(value)}`);
	}
	for (const [index, child] of value.entries()) {
		assertNativeNodeDataInternal(child, `${path}[${index}]`);
	}
}

/**
 * Internal recursive validator for the native render boundary.
 *
 * Checks all runtime invariants required before passing a NodeData tree to the
 * native (napi) render engine:
 *  - `$type` is a finite number (parser.c-derived numeric KindId, Phase D)
 *  - `$source` is one of `0 | 1 | 2` (ts, sg, factory)
 *  - `$named` is a boolean
 *  - `$format` is absent (must be passed separately via TreeHandle.format)
 *  - no function-valued properties (methods like `render()` cannot cross napi)
 *  - nested `_<name>` storage keys and `$children` satisfy the same constraints
 *    recursively (ADR-0018 Phase 3a: `$fields` wrapper no longer emitted by readNode)
 */
function assertNativeNodeDataInternal(
	value: unknown,
	path: string
): asserts value is AnyNodeData {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	// Reject any property whose value is a function — methods like `render()`
	// can't cross the napi boundary.
	for (const [key, v] of Object.entries(value)) {
		if (typeof v === 'function') {
			throw new TypeError(
				`${path}.${key} is a function — only plain data objects can cross the native render boundary`
			);
		}
	}
	// Phase D: $type must be a numeric KindId. String $type is no longer accepted.
	if (typeof value.$type !== 'number') {
		throw new TypeError(
			`${path}.$type must be a number, got ${describe(value.$type)}`
		);
	}
	assertNativeSource(value.$source, `${path}.$source`);
	assertBoolean(value.$named, `${path}.$named`);
	if (value.$format !== undefined) {
		throw new TypeError(
			`${path}.$format is not supported by the native render boundary; pass format separately`
		);
	}
	// Validate `_<name>` storage keys (de-hoisted surface).
	for (const key of Object.keys(value)) {
		if (!key.startsWith('_')) continue;
		if (value[key] === undefined) continue;
		assertNativeFieldValue(value[key], `${path}.${key}`);
	}
	if (value.$children !== undefined)
		assertNativeChildren(value.$children, `${path}.$children`);
	if (value.$text !== undefined) assertString(value.$text, `${path}.$text`);
	if (value.$span !== undefined)
		assertNativeSpan(value.$span, `${path}.$span`);
	if (value.$nodeHandle !== undefined)
		assertFiniteNumber(value.$nodeHandle, `${path}.$nodeHandle`);
	if (value.$childIndex !== undefined)
		assertFiniteNumber(value.$childIndex, `${path}.$childIndex`);
}

/**
 * Type guard — returns `true` iff `node` passes all runtime invariants
 * required by the native (napi) render boundary.
 *
 * @see {@link assertRenderableNodeData} for the throwing variant.
 */
export function isRenderableNodeData(node: AnyNodeData): boolean {
	if (!ASSERT_ENABLED) return true;
	try {
		assertRenderableNodeData(node);
		return true;
	} catch {
		return false;
	}
}

/**
 * Assertion — throws `TypeError` if `node` violates any runtime invariant
 * required by the native (napi) render boundary.
 *
 * Checks performed:
 *  - `$type` is a finite number
 *  - `$source` is one of `0 | 1 | 2` (ts, sg, factory)
 *  - `$named` is a boolean
 *  - `$format` is absent
 *  - no function-valued properties
 *  - `_<name>` storage keys and `$children` satisfy the same constraints recursively
 *
 * @see {@link isRenderableNodeData} for the non-throwing predicate.
 */
export function assertRenderableNodeData(
	node: AnyNodeData
): asserts node is AnyNodeData {
	if (!ASSERT_ENABLED) return;
	assertNativeNodeDataInternal(node, 'node');
}

// ---------------------------------------------------------------------------
// Backward-compatible aliases — kept so grammar packages compiled against the
// old names continue to link without regeneration. Deprecated: prefer the
// `isRenderableNodeData` / `assertRenderableNodeData` names.
// ---------------------------------------------------------------------------

/** @deprecated Use {@link isRenderableNodeData} instead. */
export const isNativeNodeData = isRenderableNodeData;

/** @deprecated Use {@link assertRenderableNodeData} instead. */
export const assertNativeNodeData = assertRenderableNodeData;
