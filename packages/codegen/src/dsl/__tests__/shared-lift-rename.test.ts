import { describe, expect, it } from 'vitest';
import { PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import { ENRICH_RULE_ORIGINS_KEY, type GrammarResult } from '../enrich.ts';
import type { EnrichRuleOrigin } from '../enrich-ctx.ts';
import { resolveLiftNames } from '../wire/lift-names.ts';
import { withWireContext, wireRenameLift, type LiftName, type WiredOpts } from '../wire/wire.ts';

const symbol = (name: string): Rule => ({ type: SYMBOL, name }) as Rule;
const literal = (value: string): Rule => ({ type: STRING, value }) as Rule;
const seq = (...members: Rule[]): Rule => ({ type: SEQ, members }) as Rule;

function enrichedWithMints(names: readonly string[]): unknown {
	const origins = new Map<string, EnrichRuleOrigin>(names.map((name) => [name, { kind: 'visible-subsequence' }]));
	return Object.defineProperty({}, ENRICH_RULE_ORIGINS_KEY, { value: origins, enumerable: false });
}

function optsWith(liftNames: Record<string, LiftName>): WiredOpts {
	return { name: 'sample', rules: {}, __wireContext__: { liftNames: new Map(Object.entries(liftNames)) } } as unknown as WiredOpts;
}

function sampleGrammar(): GrammarResult['grammar'] {
	return {
		name: 'sample',
		rules: {
			source_file: seq(symbol('list'), symbol('grouping')),
			list: seq(literal('['), symbol('suffix')),
			grouping: seq(literal('('), symbol('list_quantifier')),
			list_quantifier: literal('*'),
			suffix: literal('*')
		},
		extras: [{ type: PATTERN, value: '\\s' }, symbol('list_quantifier')],
		externals: [symbol('list_quantifier')],
		supertypes: ['list_quantifier'],
		inline: ['list_quantifier'],
		conflicts: [['grouping', 'list_quantifier']],
		precedences: [[symbol('list_quantifier'), 'x']],
		word: 'list_quantifier'
	};
}

describe('wireRenameLift', () => {
	it('records the name on the lift and accepts the same name from every owner', () => {
		const { ctx } = withWireContext('list', () => {
			wireRenameLift('list_quantifier', 'suffix');
			wireRenameLift('list_quantifier', 'suffix');
		});
		expect(ctx.liftNames.get('list_quantifier')).toEqual({ name: 'suffix', hoisted: false });
	});

	it('rejects two owners naming one shared lift differently', () => {
		expect(() =>
			withWireContext('list', () => {
				wireRenameLift('list_quantifier', 'list_quantifier');
				wireRenameLift('list_quantifier', 'grouping_quantifier');
			})
		).toThrow(/list_quantifier.*grouping_quantifier/);
	});
});

describe('resolveLiftNames', () => {
	const renamed = { list_quantifier: { name: 'suffix', hoisted: false } };

	it('rewrites the reference in an owner the renaming patch never reached, keeping the rule order', () => {
		const grammar = sampleGrammar();
		const order = Object.keys(grammar.rules);
		resolveLiftNames(grammar, enrichedWithMints(['list_quantifier']), optsWith(renamed));
		expect(grammar.rules['grouping']).toEqual(seq(literal('('), symbol('suffix')));
		expect(grammar.rules['list']).toEqual(seq(literal('['), symbol('suffix')));
		expect(Object.keys(grammar.rules)).toEqual(order);
	});

	it('rewrites the name in every list and in word', () => {
		const grammar = sampleGrammar();
		resolveLiftNames(grammar, enrichedWithMints(['list_quantifier']), optsWith(renamed));
		expect(grammar.extras).toEqual([{ type: PATTERN, value: '\\s' }, symbol('suffix')]);
		expect(grammar.externals).toEqual([symbol('suffix')]);
		expect(grammar.supertypes).toEqual(['suffix']);
		expect(grammar.inline).toEqual(['suffix']);
		expect(grammar.conflicts).toEqual([['grouping', 'suffix']]);
		expect(grammar.precedences).toEqual([[symbol('suffix'), 'x']]);
		expect(grammar.word).toBe('suffix');
	});

	it('rejects a name recorded for a rule enrich did not mint', () => {
		expect(() => resolveLiftNames(sampleGrammar(), enrichedWithMints([]), optsWith(renamed))).toThrow(/list_quantifier/);
	});

	it('rejects a remaining reference to a lift whose variant was hoisted', () => {
		const hoisted = { list_quantifier: { name: 'suffix', hoisted: true } };
		expect(() => resolveLiftNames(sampleGrammar(), enrichedWithMints(['list_quantifier']), optsWith(hoisted))).toThrow(
			/list_quantifier.*grouping/
		);
	});

	it('leaves the grammar alone when no lift was renamed', () => {
		const grammar = sampleGrammar();
		const before = JSON.stringify(grammar);
		resolveLiftNames(grammar, enrichedWithMints(['list_quantifier']), optsWith({}));
		expect(JSON.stringify(grammar)).toBe(before);
	});
});
