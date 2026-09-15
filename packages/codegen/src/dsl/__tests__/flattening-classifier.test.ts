import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { wire } from '../wire/wire.ts';
import { variant } from '../primitives/variant.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { GrammarJson } from '../../grammar-shapes/grammar-json.ts';

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown;

const $ = new Proxy({}, { get: (_, prop: string) => ({ type: 'SYMBOL', name: prop }) });
const str = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });

/** Evaluate every wired rule in insertion order, then the supertypes callback — the order tree-sitter's grammar() uses. */
function flattenedSupertypes(
	wired: { rules: Record<string, unknown>; supertypes?: unknown },
	base: Record<string, unknown>
): string[] {
	for (const [name, fn] of Object.entries(wired.rules)) (fn as RuleFn).call($, $, base[name]);
	const list = (wired.supertypes as RuleFn).call($, $, []) as { name: string }[];
	return list.map((s) => s.name);
}

const tokenArms = { parent: seq(str('('), choice(seq(str('='), sym('x')), seq(str(':'), sym('y'))), str(')')) };

describe('flattening classifier', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('registers a parent whose variants hoist into a pure choice of its own variant rules', () => {
		const wired = wire<GrammarJson>({ name: 'g', rules: {}, patches: { parent: { '1/0': variant('eq'), '1/1': variant('type') } } });
		expect(flattenedSupertypes(wired as never, tokenArms)).toEqual(['parent']);
	});

	it('does not register an extra', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: {},
			extras: (d: any) => [d.parent],
			patches: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never);
		expect(flattenedSupertypes(wired as never, tokenArms)).toEqual([]);
	});

	it('does not register a parent whose arms stay unmaterialized', () => {
		const wired = wire<GrammarJson>({ name: 'g', rules: {}, patches: { parent: { '0/0': variant('x'), '0/1': variant('y') } } });
		expect(flattenedSupertypes(wired as never, { parent: seq(choice(sym('x'), sym('y'))) })).toEqual([]);
	});

	it('does not add a parent that another rule presents as a node of the same kind', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: { other: (d: any) => (globalThis as any).alias(d.inner, d.parent) },
			patches: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never);
		expect(flattenedSupertypes(wired as never, tokenArms)).toEqual([]);
	});
});
