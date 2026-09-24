import { describe, it, expect } from 'vitest';
import { unaliasOverloadedDisplays } from '../rule-transforms.ts';
import { tokenUseCounts } from '../rule-patterns.ts';
import type { Rule } from '../../types/rule.ts';

type R = Rule<'evaluate'>;
const S = (value: string) => ({ type: 'STRING', value }) as R;
const P = (value: string) => ({ type: 'PATTERN', value }) as R;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as R;
const seq = (...members: R[]) => ({ type: 'SEQ', members }) as R;
const choice = (...members: R[]) => ({ type: 'CHOICE', members }) as R;
const alias = (content: R, value: string) => ({ type: 'ALIAS', named: true, value, content }) as R;

function run(rules: Record<string, R>, inline: readonly string[] = []): Record<string, R> {
	return unaliasOverloadedDisplays(rules, {
		symbols: { rules, externals: new Set(), inline: new Set(inline), tokenUses: tokenUseCounts(rules) }
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
});
