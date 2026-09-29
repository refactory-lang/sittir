import type {
	AnyNodeData,
	FlavorPair,
	NodeMethods,
	GrammarTypeMap,
	Hoisted,
	TriviaFacts
} from '@sittir/types';
import { isEmptyNode, isNode as isAnyNode, withMethods as withAnyMethods } from './utils.ts';

type NamespacePart<M extends GrammarTypeMap, K, P extends 'Node' | 'Loose'> = K extends keyof M['namespaces']
	? M['namespaces'][K] extends { readonly [Q in P]: infer X }
		? X
		: never
	: never;

export interface GrammarRuntime<M extends GrammarTypeMap> {
	isNode<K extends keyof M['namespaces']>(
		v: NamespacePart<M, K, 'Node'> | NamespacePart<M, K, 'Loose'>
	): v is Extract<NamespacePart<M, K, 'Node'>, AnyNodeData>;
	isNode(v: unknown): v is AnyNodeData;
	isEmpty<N extends M['empty']['node']>(node: N): node is N & Extract<M['empty'], { readonly node: N }>['empty'];
	withMethods<T extends AnyNodeData>(node: T): T & NodeMethods<M['trivia']>;
}

export function bindRuntime<M extends GrammarTypeMap>(trivia: TriviaFacts): GrammarRuntime<M> {
	return {
		isNode: isAnyNode,
		isEmpty(node: AnyNodeData): boolean {
			const kind = trivia.kindName(node.$type);
			return kind !== undefined && trivia.innerGaps[kind] !== undefined && isEmptyNode(node);
		},
		withMethods<T extends AnyNodeData>(node: T) {
			return withAnyMethods(node) as unknown as T & NodeMethods<M['trivia']>;
		}
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
	if (typeof value === 'string') {
		throw new Error(
			`${where}: a strict factory takes a built node, not a string; expected ${expected}, or use .coerce`
		);
	}
	return value;
}

export function rejectKeywordText<T>(value: T, where: string, word: number, keywords: readonly string[]): T {
	if (Array.isArray(value)) {
		for (const item of value) rejectKeywordText(item, where, word, keywords);
		return value;
	}
	if (isRecord(value) && value.$type === word && typeof value.$text === 'string' && keywords.includes(value.$text)) {
		throw new Error(`${where}: '${value.$text}' is this slot's keyword`);
	}
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

export function coerceMixedEnumStorage<T = unknown>(
	value: unknown,
	byText: readonly (readonly [string, number])[] = []
): T {
	if (value === undefined || value === null) return undefined as T;
	if (typeof value === 'number') return value as T;
	if (Array.isArray(value)) {
		return value.map((item) => coerceMixedEnumStorage(item, byText)).filter((item) => item !== undefined) as T;
	}
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
	if (Array.isArray(value)) {
		return value.map((item) => coerceKindEnumStorage(item, byText)).filter((item) => item !== undefined) as T;
	}
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

function extractNodeText(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (isAnyNode(value)) return typeof value.$text === 'string' ? value.$text : undefined;
	if (isRecord(value) && typeof value.$text === 'string') return value.$text;
	return undefined;
}

export function bundle<S, C>(strict: S, coerce: C): FlavorPair<S, C> {
	return { strict, coerce };
}

type AnyFlavorFn = (...args: never[]) => unknown;

function isFlavorPair(value: unknown): value is { strict: unknown; coerce?: unknown } {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as { strict?: unknown; coerce?: unknown };
	return typeof v.strict === 'function' || typeof v.coerce === 'function';
}

export function hoist<B extends { strict: unknown; coerce?: unknown }>(b: B): Hoisted<B> {
	const target = (typeof b.coerce === 'function' ? b.coerce : b.strict) as AnyFlavorFn;
	const callable = (...args: never[]) => target(...args);
	for (const [key, value] of Object.entries(b)) {
		Object.defineProperty(callable, key, {
			value: hoistRoutes(value),
			writable: true,
			configurable: true,
			enumerable: true
		});
	}
	return callable as Hoisted<B>;
}

export function hoistRoutes<B>(b: B): Hoisted<B> {
	if (isFlavorPair(b)) return hoist(b) as Hoisted<B>;
	if (typeof b !== 'object' || b === null || Array.isArray(b)) return b as Hoisted<B>;
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(b)) out[key] = hoistRoutes(value);
	return out as Hoisted<B>;
}
