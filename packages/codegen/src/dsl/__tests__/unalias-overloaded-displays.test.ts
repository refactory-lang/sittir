import { describe, it, expect } from 'vitest';
import { unaliasOverloadedDisplays, type DisplayFamilies } from '../rule-transforms.ts';
import { predictedSymbolSourceOf } from '../symbol-table.ts';
import type { Rule } from '../../types/rule.ts';

type R = Rule<'evaluate'>;
const S = (value: string) => ({ type: 'STRING', value }) as R;
const P = (value: string) => ({ type: 'PATTERN', value }) as R;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as R;
const seq = (...members: R[]) => ({ type: 'SEQ', members }) as R;
const choice = (...members: R[]) => ({ type: 'CHOICE', members }) as R;
const alias = (content: R, value: string) => ({ type: 'ALIAS', named: true, value, content }) as R;

function run(rules: Record<string, R>, inline: readonly string[] = [], families: DisplayFamilies = new Map()): Record<string, R> {
	return unaliasOverloadedDisplays(rules, {
		symbols: predictedSymbolSourceOf({ rules, externals: [], inline, supertypes: [], extras: [], word: null }),
		families
	});
}

describe('unaliasOverloadedDisplays', () => {
	it('keeps terminal storage aliased onto a terminal display rule', () => {
		const rules = {
			program: seq(sym('identifier'), alias(sym('_reserved'), 'identifier')),
			identifier: P('[a-z]+'),
			_reserved: choice(S('default'), S('union'))
		};
		expect(run(rules, ['_reserved'])).toBe(rules);
	});

	it('renames a hidden nonterminal aliased onto a nonterminal display rule', () => {
		const rules = {
			program: seq(sym('tree'), alias(sym('_delim'), 'tree')),
			tree: seq(S('('), S(')')),
			_delim: seq(S('['), S(']'))
		};
		expect(run(rules).program).toEqual(seq(sym('tree'), alias(sym('_delim'), 'delim')));
	});

	it('drops the alias of a visible storage under a display rule of its own', () => {
		const rules = {
			program: seq(sym('tree'), alias(sym('block'), 'tree')),
			tree: seq(S('('), S(')')),
			block: seq(S('{'), S('}'))
		};
		expect(run(rules).program).toEqual(seq(sym('tree'), sym('block')));
	});

	it('splits every hidden nonterminal sharing a display with no rule of its own', () => {
		const rules = {
			program: seq(alias(sym('_paren'), 'group'), alias(sym('_bracket'), 'group')),
			_paren: seq(S('('), S(')')),
			_bracket: seq(S('['), S(']'))
		};
		expect(run(rules).program).toEqual(seq(alias(sym('_paren'), 'paren'), alias(sym('_bracket'), 'bracket')));
	});

	it('prefixes the display when the stripped storage name is taken', () => {
		const rules = {
			program: seq(alias(sym('_paren'), 'group'), alias(sym('_bracket'), 'group'), sym('paren')),
			paren: P('x'),
			_paren: seq(S('('), S(')')),
			_bracket: seq(S('['), S(']'))
		};
		expect(run(rules).program).toEqual(
			seq(alias(sym('_paren'), 'group_paren'), alias(sym('_bracket'), 'bracket'), sym('paren'))
		);
	});

	it('drops terminal aliases when the lone nonterminal storage names the display', () => {
		const rules = {
			program: seq(alias(sym('_number'), 'number'), alias(S('-'), 'number')),
			_number: seq(S('-'), P('[0-9]+'))
		};
		expect(run(rules).program).toEqual(seq(alias(sym('_number'), 'number'), S('-')));
	});

	it('refuses an inline nonterminal under an overloaded display', () => {
		const rules = {
			program: seq(sym('tree'), alias(seq(S('['), S(']')), 'tree')),
			tree: seq(S('('), S(')'))
		};
		expect(() => run(rules)).toThrow(/inline nonterminal/);
	});

	it('names a storage split under two displays the same whatever the rule order', () => {
		const tree = seq(S('('), S(')'));
		const block = seq(S('{'), S('}'));
		const shared = seq(S('['), S(']'));
		const a = { first: seq(sym('tree'), alias(sym('_shared'), 'tree')), second: seq(sym('block'), alias(sym('_shared'), 'block')) };
		const b = { second: a.second, first: a.first };
		const out = (uses: Record<string, R>) => run({ ...uses, tree, block, _shared: shared });
		expect(out(b)).toEqual(out(a));
		expect(out(a).first).toEqual(seq(sym('tree'), alias(sym('_shared'), 'tree_shared')));
		expect(out(a).second).toEqual(seq(sym('block'), alias(sym('_shared'), 'shared')));
	});

	const lambdas = { lambda: seq(S('lambda'), S(':')), inner_lambda: seq(S('lambda'), S('.')) };
	const lambdaFamily: DisplayFamilies = new Map([['lambda_expression', new Set(['lambda', 'inner_lambda'])]]);

	it('keeps a display family a layer declared, and still splits an overload it did not declare', () => {
		const rules = {
			program: seq(
				alias(sym('lambda'), 'lambda_expression'),
				alias(sym('inner_lambda'), 'lambda_expression'),
				alias(sym('_paren'), 'group'),
				alias(sym('_bracket'), 'group')
			),
			...lambdas,
			_paren: seq(S('('), S(')')),
			_bracket: seq(S('['), S(']'))
		};
		const split = [alias(sym('_paren'), 'paren'), alias(sym('_bracket'), 'bracket')];
		expect(run(rules, [], lambdaFamily).program).toEqual(
			seq(alias(sym('lambda'), 'lambda_expression'), alias(sym('inner_lambda'), 'lambda_expression'), ...split)
		);
		expect(run(rules).program).toEqual(seq(sym('lambda'), sym('inner_lambda'), ...split));
	});

	it("never mints a declared family's display for a storage it splits", () => {
		const rules = {
			program: seq(
				alias(sym('lambda'), 'lambda_expression'),
				alias(sym('inner_lambda'), 'lambda_expression'),
				alias(sym('_lambda_expression'), 'group'),
				alias(sym('_bracket'), 'group')
			),
			...lambdas,
			_lambda_expression: seq(S('('), S(')')),
			_bracket: seq(S('['), S(']'))
		};
		expect(run(rules, [], lambdaFamily).program).toEqual(
			seq(
				alias(sym('lambda'), 'lambda_expression'),
				alias(sym('inner_lambda'), 'lambda_expression'),
				alias(sym('_lambda_expression'), 'group_lambda_expression'),
				alias(sym('_bracket'), 'bracket')
			)
		);
	});
});
