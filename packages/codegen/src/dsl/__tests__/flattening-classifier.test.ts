import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dropFlattenedParentAliases, wire } from '../wire/wire.ts';
import { variant } from '../primitives/variant.ts';
import { evaluateWired, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { GrammarJson } from '../../grammar-shapes/grammar-json.ts';
import { baseOf } from '../../__tests__/helpers/empty-base.ts';

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown;

const $ = new Proxy({}, { get: (_, prop: string) => ({ type: 'SYMBOL', name: prop }) });
const str = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });

/** Call the externals callback, read every wired rule, then the supertypes callback — the order tree-sitter's grammar() uses. */
function flattenedSupertypes(wired: { externals?: unknown; rules: Record<string, unknown>; supertypes?: unknown }): string[] {
	evaluateWired(wired);
	const list = (wired.supertypes as RuleFn).call($, $, []) as { name: string }[];
	return list.map((s) => s.name);
}

const tokenArms = { parent: seq(str('('), choice(seq(str('='), sym('x')), seq(str(':'), sym('y'))), str(')')) };
const bareArms = { parent: seq(choice(sym('x'), sym('y'))) };

describe('flattening classifier', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('registers a parent whose variants hoist into a pure choice of its own variant rules', () => {
		const wired = wire<GrammarJson>({ name: 'g', rules: {}, edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } } }, baseOf(tokenArms));
		expect(flattenedSupertypes(wired as never)).toEqual(['parent']);
	});

	it('does not register an extra', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: {},
			extras: (d: any) => [d.parent],
			edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never, baseOf(tokenArms));
		expect(flattenedSupertypes(wired as never)).toEqual([]);
	});

	it('does not register a parent whose arms stay unmaterialized', () => {
		const wired = wire<GrammarJson>({ name: 'g', rules: {}, edits: { parent: { '0/0': variant('x'), '0/1': variant('y') } } }, baseOf(bareArms));
		expect(flattenedSupertypes(wired as never)).toEqual([]);
	});

	it('does not add a parent that another rule presents as a node of the same kind', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: { other: (d: any) => (globalThis as any).alias(d.inner, d.parent) },
			edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never, baseOf(tokenArms));
		expect(flattenedSupertypes(wired as never)).toEqual([]);
	});

	it('adds a parent referenced only under a named alias, since the alias over a flattened parent is dropped afterwards', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: { other: (d: any) => (globalThis as any).alias(d.parent, d.shown) },
			edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never, baseOf(tokenArms));
		expect(flattenedSupertypes(wired as never)).toEqual(['parent']);
	});

	it('adds a parent that has one aliased reference and one bare reference, since the bare one keeps it a supertype', () => {
		const wired = wire<GrammarJson>({
			name: 'g',
			rules: { other: (d: any) => (globalThis as any).seq((globalThis as any).alias(d.parent, d.shown), d.parent) },
			edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }
		} as never, baseOf(tokenArms));
		expect(flattenedSupertypes(wired as never)).toEqual(['parent']);
	});
	describe('an alias over a flattened parent is dropped, through a prec wrapper too', () => {
		const forms: Array<[string, (d: any) => unknown]> = [
			['direct', (d) => (globalThis as any).alias(d.parent, d.shown)],
			['prec-wrapped', (d) => (globalThis as any).alias({ type: 'PREC', value: 1, content: d.parent }, d.shown)]
		];
		const aliasesNamed = (node: unknown, value: string): number => {
			if (node === null || typeof node !== 'object') return 0;
			const record = node as { type?: string; value?: unknown };
			const own = record.type === 'ALIAS' && record.value === value ? 1 : 0;
			return Object.values(node).reduce<number>((count, child) => count + aliasesNamed(child, value), own);
		};
		it.each(forms)('%s: the parent stays a supertype with its variants, and the shown alias is gone', (_label, body) => {
			const wired = wire<GrammarJson>(
				{ name: 'g', rules: { other: body }, edits: { parent: { '1/0': variant('eq'), '1/1': variant('type') } } } as never,
				baseOf(tokenArms)
			);
			const rules = evaluateWired(wired as never);
			const supertypes = (wired.supertypes as RuleFn).call($, $, []) as { name: string }[];
			expect(supertypes.map((s) => s.name)).toEqual(['parent']);
			const grammar = { rules, supertypes };
			dropFlattenedParentAliases(grammar as never, wired as never);
			expect(aliasesNamed(grammar.rules['other'], 'shown')).toBe(0);
			expect(Object.keys(grammar.rules)).not.toContain('shown');
		});
	});
});
