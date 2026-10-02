import type {
	AnyUntypedNode,
	FlavorPair,
	HoistArity,
	GrammarTypeMap,
	Hoisted,
	MaxArity,
	StrictFlavor
} from '@sittir/types';
import { isNode as isAnyNode } from './utils.ts';

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
	if (typeof value === 'string' || typeof value === 'bigint') {
		throw new Error(
			`${where}: a strict factory takes a built node, not a ${typeof value}; expected ${expected}, or use .coerce`
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

/**
 * A strict slot's kind-id storage: absent stays absent, a kind id stays itself, and an array is
 * read item by item with the absent ones dropped. Text is not read here; a string passes through
 * unchanged for the slot's refusal.
 */
export function kindIdStorage<T = unknown>(value: unknown): T {
	if (value === undefined || value === null) return undefined as T;
	if (Array.isArray(value)) return value.map((item) => kindIdStorage(item)).filter((item) => item !== undefined) as T;
	return value as T;
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

type AnyFlavorFn = (...args: never[]) => unknown;

type ArityArgs<F> = number extends MaxArity<F> ? [] : [arity: HoistArity<MaxArity<F>>];

export function bundle<S extends AnyFlavorFn>(strict: S, coerce: undefined, ...arity: NoInfer<ArityArgs<S>>): StrictFlavor<S>;
export function bundle<S, C extends AnyFlavorFn>(strict: S, coerce: C, ...arity: NoInfer<ArityArgs<C>>): FlavorPair<S, C>;
export function bundle(
	strict: unknown,
	coerce: AnyFlavorFn | undefined,
	arity?: HoistArity
): StrictFlavor<unknown> | FlavorPair<unknown, AnyFlavorFn> {
	return Object.freeze(coerce === undefined ? { strict, arity } : { strict, coerce, arity });
}

function isFlavorPair(value: unknown): value is { strict: unknown; coerce?: unknown } {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as { strict?: unknown; coerce?: unknown };
	return typeof v.strict === 'function' || typeof v.coerce === 'function';
}

export function hoist<B extends { strict: unknown; coerce?: unknown; arity?: HoistArity }>(b: B): Hoisted<B> {
	const target = (typeof b.coerce === 'function' ? b.coerce : b.strict) as AnyFlavorFn;
	const arity = b.arity;
	const callable = (...args: never[]) => {
		if (arity !== undefined && args.length > arity.max) {
			throw new Error(
				`${arity.key}: takes at most ${arity.max} argument${arity.max === 1 ? '' : 's'}, got ${args.length}`
			);
		}
		return target(...args);
	};
	for (const [key, value] of Object.entries(b)) {
		if (key === 'arity') continue;
		Object.defineProperty(callable, key, {
			value: hoistRoutes(value),
			writable: false,
			configurable: false,
			enumerable: true
		});
	}
	return Object.freeze(callable) as Hoisted<B>;
}

export function hoistAs<B>(value: unknown): Hoisted<B> {
	return hoistRoutes(value) as Hoisted<B>;
}

export function hoistRoutes<B>(b: B): Hoisted<B> {
	if (isFlavorPair(b)) return hoist(b) as Hoisted<B>;
	if (typeof b !== 'object' || b === null || Array.isArray(b)) return b as Hoisted<B>;
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(b)) out[key] = hoistRoutes(value);
	return Object.freeze(out) as Hoisted<B>;
}
