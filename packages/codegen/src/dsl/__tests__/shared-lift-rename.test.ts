import { describe, expect, it } from 'vitest';
import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import { ENRICH_RULE_ORIGINS_KEY } from '../enrich.ts';
import type { EnrichRuleOrigin } from '../enrich-ctx.ts';
import type { GrammarJson } from '../../grammar-shapes/grammar-json.ts';
import { wire, withWireContext, wireRenameLift } from '../wire/wire.ts';

const symbol = (name: string): Rule => ({ type: SYMBOL, name }) as Rule;
const literal = (value: string): Rule => ({ type: STRING, value }) as Rule;
const seq = (...members: Rule[]): Rule => ({ type: SEQ, members }) as Rule;

function enrichedBase(mints: readonly string[], externals: readonly Rule[] = [], word?: string): GrammarJson {
	const base = {
		grammar: {
			name: 'sample',
			rules: {
				source_file: seq(symbol('list'), symbol('grouping')),
				grouping: seq(literal('('), symbol('list_quantifier')),
				list: seq(literal('['), symbol('list_quantifier')),
				list_quantifier: literal('*')
			},
			externals,
			...(word === undefined ? {} : { word })
		}
	};
	const origins = new Map<string, EnrichRuleOrigin>(mints.map((name) => [name, { kind: 'visible-subsequence' }]));
	return Object.defineProperty(base, ENRICH_RULE_ORIGINS_KEY, { value: origins, enumerable: false }) as unknown as GrammarJson;
}

const $ = new Proxy({}, { get: (_target, name: string) => symbol(name) });

function wiredWith(base: GrammarJson, hoisted: boolean, calls: string[] = []) {
	return wire<GrammarJson>(
		{
			name: 'sample',
			rules: {
				list: () => {
					calls.push('list');
					wireRenameLift('list_quantifier', 'suffix', hoisted);
					return seq(literal('['), symbol('suffix'));
				}
			}
		},
		base
	);
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

describe('lift names resolve over every rule on the first rule callback', () => {
	it('names the reference in an owner no patch reached, even when that owner is evaluated first', () => {
		const wired = wiredWith(enrichedBase(['list_quantifier']), false);
		expect(wired.rules['grouping']!($, undefined)).toEqual(seq(literal('('), symbol('suffix')));
		expect(wired.rules['list']!($, undefined)).toEqual(seq(literal('['), symbol('suffix')));
	});

	it('wraps every base rule and keeps the authored rules first', () => {
		const wired = wiredWith(enrichedBase(['list_quantifier']), false);
		expect(Object.keys(wired.rules)).toEqual(['list', 'source_file', 'grouping', 'list_quantifier']);
	});

	it('runs each rule callback once', () => {
		const calls: string[] = [];
		const wired = wiredWith(enrichedBase(['list_quantifier']), false, calls);
		for (const name of Object.keys(wired.rules)) wired.rules[name]!($, undefined);
		wired.rules['list']!($, undefined);
		expect(calls).toEqual(['list']);
	});

	it('rejects a name recorded for a rule enrich did not mint', () => {
		const wired = wiredWith(enrichedBase([]), false);
		expect(() => wired.rules['grouping']!($, undefined)).toThrow(/list_quantifier/);
	});

	it('rejects a remaining reference to a lift whose variant was hoisted', () => {
		const wired = wiredWith(enrichedBase(['list_quantifier']), true);
		expect(() => wired.rules['grouping']!($, undefined)).toThrow(/list_quantifier.*grouping/);
	});

	it('names the base word through the same renames once the rules have run', () => {
		const wired = wiredWith(enrichedBase(['list_quantifier'], [], 'list_quantifier'), false);
		wired.rules['grouping']!($, undefined);
		expect((wired as unknown as { word: (d: unknown) => unknown }).word($)).toEqual(symbol('suffix'));
	});

	it('rejects a renamed lift that is an external', () => {
		const wired = wiredWith(enrichedBase(['list_quantifier'], [symbol('list_quantifier')]), false);
		expect(() => wired.rules['grouping']!($, undefined)).toThrow(/list_quantifier.*external/);
	});
});
