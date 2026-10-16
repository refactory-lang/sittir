import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { wire } from '../wire/wire.ts';
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
});
