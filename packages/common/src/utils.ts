import type { AnyNodeData, AnyTreeNodeOf, ByteRange, Edit } from '@sittir/types';

export interface WithMethodsRuntime {
	$render(): string;
	$toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
	$replace(target: { range(): ByteRange }): Edit;
	$trivia(...args: unknown[]): unknown;
}

export function withMethods<T extends object, M extends object>(node: T, methods: M): T & M {
	return Object.assign(node, methods);
}

export function isNodeData(v: unknown): v is AnyNodeData {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	if (typeof o.$type !== 'number') return false;
	const hasStoredFields = Object.keys(o).some((k) => k.startsWith('_'));
	return hasStoredFields
		|| typeof o.$text === 'string'
		|| Array.isArray(o.$children)
		|| o.$source === 0
		|| o.$source === 1
		|| o.$source === 2;
}

export function isTreeNode(v: unknown): v is AnyTreeNodeOf {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	return typeof o.type === 'string' && typeof o.field === 'function' && typeof o.text === 'function';
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

export function coerceBooleanKeywordStorage(value: unknown): true | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (Array.isArray(value)) return value.length > 0 ? true : undefined;
	return true;
}

export function coerceBitflagStorage(value: unknown, texts: readonly string[]): number | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (typeof value === 'number') return value === 0 ? undefined : value;
	if (Array.isArray(value)) {
		let acc = 0;
		for (const item of value) {
			const bits = coerceBitflagStorage(item, texts) ?? 0;
			acc |= bits;
		}
		return acc === 0 ? undefined : acc;
	}
	const text = extractNodeText(value);
	if (text === undefined) return undefined;
	const index = texts.indexOf(text);
	if (index < 0) return undefined;
	return 1 << index;
}

function extractNodeText(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (isNodeData(value)) {
		return typeof value.$text === 'string' ? value.$text : undefined;
	}
	if (isRecord(value) && typeof value.$text === 'string') return value.$text;
	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
