import { engineOf } from './engine-scope.ts';

export type KindTest = (value: unknown, kinds: ReadonlySet<number>) => boolean;

export function inLanguage(language: object): (value: unknown) => boolean {
	return (value) => typeof value === 'number' || engineOf(value)?.language === language;
}

export function kindOf(value: unknown): number | undefined {
	if (typeof value === 'number') return value;
	const type = value !== null && typeof value === 'object' ? (value as { readonly $type?: unknown }).$type : undefined;
	return typeof type === 'number' ? type : undefined;
}

export const holdsKinds: KindTest = (value, kinds) => {
	const kind = kindOf(value);
	return kind !== undefined && kinds.has(kind);
};

const kindTests = new WeakMap<object, KindTest>();

export function kindTestOf(language: object): KindTest {
	let test = kindTests.get(language);
	if (test === undefined) {
		const check = inLanguage(language);
		test = (value, kinds) => check(value) && holdsKinds(value, kinds);
		kindTests.set(language, test);
	}
	return test;
}

interface Bound {
	readonly guardsWith: (test: KindTest) => object;
	readonly language: object;
	readonly shared: ((language: never) => object) | undefined;
}

const boundGuards = new WeakMap<object, Bound>();
const reboundGuards = new WeakMap<object, object>();

export function languageGuards<G extends object, L extends object, S extends object = {}>(guardsWith: (test: KindTest) => G, language: L, shared?: (language: L) => S): Readonly<G & S> {
	const checked = Object.freeze({ ...guardsWith(kindTestOf(language)), ...shared?.(language) }) as Readonly<G & S>;
	boundGuards.set(checked, { guardsWith, language, shared });
	return checked;
}

export function guardsOf<G extends object>(language: { readonly is: G }): Readonly<G> {
	const bound = boundGuards.get(language.is);
	if (bound === undefined || bound.language === language) return language.is;
	const known = reboundGuards.get(language);
	if (known !== undefined) return known as Readonly<G>;
	const rebound = languageGuards(bound.guardsWith as (test: KindTest) => G, language, bound.shared as ((language: object) => object) | undefined) as Readonly<G>;
	reboundGuards.set(language, rebound);
	return rebound;
}
