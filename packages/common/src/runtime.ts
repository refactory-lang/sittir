import type { AnyUntypedNode, EmptyForm, GrammarTypeMap } from '@sittir/types';
import { isNode as isAnyNode, nodeText } from './utils.ts';
import { sidesOf } from './node-data.ts';

type NamespacePart<M extends GrammarTypeMap, K, P extends 'Node' | 'Loose'> = K extends keyof M['namespaces']
	? M['namespaces'][K] extends { readonly [Q in P]: infer X }
		? X
		: never
	: never;

export interface GrammarRuntime<M extends GrammarTypeMap> {
	isNode<K extends keyof M['namespaces']>(
		v: NamespacePart<M, K, 'Node'> | NamespacePart<M, K, 'Loose'>
	): v is Extract<NamespacePart<M, K, 'Node'>, AnyUntypedNode>;
	isNode(v: unknown): v is AnyUntypedNode;
}

export function bindRuntime<M extends GrammarTypeMap>(): GrammarRuntime<M> {
	return {
		isNode: isAnyNode
	} as GrammarRuntime<M>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function rejectBareText<T>(value: T, where: string, expected: string): T {
	if (Array.isArray(value)) {
		for (const item of value) rejectBareText(item, where, expected);
		return value;
	}
	if (typeof value === 'string' || typeof value === 'bigint' || (isRecord(value) && !('$type' in value))) {
		throw new Error(
			`${where}: a strict factory takes a built node, not a ${typeof value}; expected ${expected}, or the default engine's builder, which takes loose input`
		);
	}
	return value;
}

export function rejectKeywordText<T>(value: T, where: string, word: number, keywords: readonly string[]): T {
	if (Array.isArray(value)) {
		for (const item of value) rejectKeywordText(item, where, word, keywords);
		return value;
	}
	const text = isRecord(value) && value.$type === word ? nodeText(value) : undefined;
	if (text !== undefined && keywords.includes(text)) throw new Error(`${where}: '${text}' is this slot's keyword`);
	return value;
}

export function rejectReservedText<T>(value: T, where: string, word: number, reserved: ReadonlySet<string>): T {
	if (Array.isArray(value)) {
		for (const item of value) rejectReservedText(item, where, word, reserved);
		return value;
	}
	const text = isRecord(value) && value.$type === word ? nodeText(value) : undefined;
	if (text !== undefined && reserved.has(text)) throw new Error(`${where}: '${text}' is a reserved word`);
	return value;
}

export type AliasBuilder = readonly [storage: readonly number[], build: (content: unknown) => unknown];

export function admitAliasContent<T = unknown>(value: unknown, aliases: readonly AliasBuilder[]): T {
	if (Array.isArray(value)) return value.map((item) => admitAliasContent(item, aliases)) as T;
	const id =
		isRecord(value) && typeof value.$type === 'number' ? value.$type : typeof value === 'number' ? value : undefined;
	if (id === undefined) return value as T;
	const hit = aliases.find(([storage]) => storage.includes(id));
	return (hit === undefined ? value : hit[1](value)) as T;
}

export type SplicedEnvelope = readonly [kind: number, content: string, name: string];

export function admitSplicedEnvelope<T = unknown>(value: unknown, envelope: SplicedEnvelope, where: string): T {
	if (Array.isArray(value)) return value.map((item) => admitSplicedEnvelope(item, envelope, where)) as T;
	const [kind, content, name] = envelope;
	if (!isRecord(value) || value.$type !== kind) return value as T;
	const sides = sidesOf(value);
	if (sides !== undefined) {
		throw new Error(`${where}: takes a ${name}'s content, and this ${name} holds ${Object.keys(sides).join(' and ')} trivia of its own; give that trivia to its content`);
	}
	return (value[content] as () => T)();
}

export function listStorage<T = unknown>(
	value: unknown,
	item: (value: unknown) => unknown = (value) => value,
	holes = false
): T {
	if (!Array.isArray(value)) return item(value) as T;
	if (holes) return value.map((entry) => (entry === undefined || entry === null ? undefined : item(entry))) as T;
	return value.map(item).filter((stored) => stored !== undefined) as T;
}

export function kindIdStorage<T = unknown>(value: unknown): T {
	return (value === null ? undefined : value) as T;
}

export function coerceMixedEnumStorage<T = unknown>(
	value: unknown,
	byText: readonly (readonly [string, number])[] = []
): T {
	if (value === undefined || value === null) return undefined as T;
	if (typeof value === 'number') return value as T;
	if (typeof value === 'string') {
		const mapped = byText.find(([candidate]) => candidate === value);
		return (mapped ? mapped[1] : value) as T;
	}
	if (isRecord(value) && typeof value.$type === 'number' && byText.some(([, id]) => id === value.$type)) {
		return value.$type as T;
	}
	return value as T;
}

export function coerceKindEnumStorage<T = unknown>(
	value: unknown,
	byText: readonly (readonly [string, number])[] = []
): T {
	if (value === undefined || value === null) return undefined as T;
	if (typeof value === 'number') return value as T;
	const text = extractNodeText(value);
	if (text !== undefined) {
		const mapped = byText.find(([candidate]) => candidate === text);
		if (mapped) return mapped[1] as T;
	}
	if (isRecord(value) && typeof value.$type === 'number') return value.$type as T;
	if (typeof value === 'string') {
		const mapped = byText.find(([candidate]) => candidate === value);
		if (mapped) return mapped[1] as T;
		throw new Error(
			`kind-enum slot: ${JSON.stringify(value)} is not a valid value (expected one of: ${byText.map(([t]) => t).join(', ')})`
		);
	}
	return value as T;
}

export function strictBooleanStorage(value: unknown): boolean | string | bigint {
	return typeof value === 'string' || typeof value === 'bigint' ? value : coerceBooleanKeywordStorage(value);
}

export function coerceBooleanKeywordStorage(value: unknown): boolean {
	if (value === undefined || value === null || value === false) return false;
	if (Array.isArray(value)) return value.length > 0;
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
	return nodeText(value);
}

export function delegate<F extends (...args: never[]) => unknown>(builder: F): NoInfer<F> {
	return ((...args: never[]) => builder(...args)) as F;
}

export function withEmptyForm<Empty, F extends (...args: never[]) => unknown>(builder: F): EmptyForm<Empty, F> {
	return builder as EmptyForm<Empty, F>;
}
