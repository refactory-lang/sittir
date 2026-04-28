import type {
	AnyNodeData,
	NativeFieldValue,
	NativeNodeData
} from '@sittir/types';

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
): asserts value is NativeNodeData['$source'] {
	if (value !== 'ts' && value !== 'sg' && value !== 'factory') {
		throw new TypeError(
			`${path} must be one of "ts", "sg", or "factory", got ${describe(value)}`
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
): asserts value is NativeFieldValue {
	if (typeof value === 'string') return;
	if (Array.isArray(value)) {
		for (const [index, item] of value.entries()) {
			assertNativeNodeDataInternal(item, `${path}[${index}]`);
		}
		return;
	}
	assertNativeNodeDataInternal(value, path);
}

function assertNativeFields(value: unknown, path: string): void {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	for (const [key, entry] of Object.entries(value)) {
		// Optional fields are stored as `undefined` in factory nodes; JSON.stringify
		// strips them before the native engine sees the data, so they are safe to skip.
		if (entry === undefined) continue;
		assertNativeFieldValue(entry, `${path}.${key}`);
	}
}

function assertNativeChildren(value: unknown, path: string): void {
	if (!Array.isArray(value)) {
		throw new TypeError(`${path} must be an array, got ${describe(value)}`);
	}
	for (const [index, child] of value.entries()) {
		assertNativeNodeDataInternal(child, `${path}[${index}]`);
	}
}

function assertNativeNodeDataInternal(
	value: unknown,
	path: string
): asserts value is NativeNodeData {
	if (!isRecord(value)) {
		throw new TypeError(`${path} must be an object, got ${describe(value)}`);
	}
	assertString(value.$type, `${path}.$type`);
	assertNativeSource(value.$source, `${path}.$source`);
	assertBoolean(value.$named, `${path}.$named`);
	if (value.$fields !== undefined)
		assertNativeFields(value.$fields, `${path}.$fields`);
	if (value.$children !== undefined)
		assertNativeChildren(value.$children, `${path}.$children`);
	if (value.$text !== undefined) assertString(value.$text, `${path}.$text`);
	if (value.$span !== undefined) assertNativeSpan(value.$span, `${path}.$span`);
	if (value.$nodeId !== undefined)
		assertFiniteNumber(value.$nodeId, `${path}.$nodeId`);
}

export function isNativeNodeData(node: AnyNodeData): node is NativeNodeData {
	try {
		assertNativeNodeData(node);
		return true;
	} catch {
		return false;
	}
}

export function assertNativeNodeData(
	node: AnyNodeData
): asserts node is NativeNodeData {
	assertNativeNodeDataInternal(node, 'node');
}
