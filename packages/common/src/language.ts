import { engineOf } from './engine-scope.ts';

export function inLanguage(language: object): (value: unknown) => boolean {
	return (value) => typeof value === 'number' || engineOf(value)?.language === language;
}

type Guard = (...args: unknown[]) => boolean;

interface Bound {
	readonly guards: object;
	readonly language: object;
	readonly shared: object | undefined;
}

const boundGuards = new WeakMap<object, Bound>();
const reboundGuards = new WeakMap<object, object>();

export function languageGuards<G extends object, S extends object = {}>(guards: G, language: object, shared?: S): Readonly<G & S> {
	const checked = Object.freeze({ ...composed(guards, inLanguage(language), new Map()), ...shared }) as Readonly<G & S>;
	boundGuards.set(checked, { guards, language, shared });
	return checked;
}

export function guardsOf<G extends object>(language: { readonly is: G }): Readonly<G> {
	const bound = boundGuards.get(language.is);
	if (bound?.language === language) return language.is;
	const known = reboundGuards.get(language);
	if (known !== undefined) return known as Readonly<G>;
	const rebound = languageGuards((bound?.guards ?? language.is) as G, language, bound?.shared) as Readonly<G>;
	reboundGuards.set(language, rebound);
	return rebound;
}

function composed<G extends object>(guards: G, check: (value: unknown) => boolean, wrapped: Map<Guard, Guard>): Readonly<G> {
	const entries = Object.entries(guards).map(([name, guard]): [string, unknown] => [name, languageGuard(guard as Guard, check, wrapped)]);
	return Object.freeze(Object.fromEntries(entries) as G);
}

function languageGuard(guard: Guard, check: (value: unknown) => boolean, wrapped: Map<Guard, Guard>): Guard {
	const known = wrapped.get(guard);
	if (known !== undefined) return known;
	const checked = (value: unknown, ...rest: unknown[]): boolean => check(value) && guard(value, ...rest);
	wrapped.set(guard, checked);
	if (Object.keys(guard).length === 0) return checked;
	return Object.freeze(Object.defineProperties(checked, Object.getOwnPropertyDescriptors(composed(guard, check, wrapped))));
}
