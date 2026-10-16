import { engineOf } from './engine-scope.ts';

export function inLanguage(language: object): (value: unknown) => boolean {
	return (value) => typeof value === 'number' || engineOf(value)?.language === language;
}

type Guard = (...args: unknown[]) => boolean;

export function languageGuards<G extends object>(guards: G, language: object): Readonly<G> {
	return composed(guards, inLanguage(language), new Map());
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
