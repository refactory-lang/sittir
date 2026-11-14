import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { canonicalRuleTree } from '../canonical-rules.ts';
import { type Rule, sym } from '../../types/rule.ts';

describe('canonicalGrammar keeps the rules tree-sitter keeps', () => {
	it('keeps a hidden rule referenced only from the extras, and prunes one referenced from nowhere', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '$._ws', rules: "_ws: () => token(repeat1(/[ \\t]/)), _dead: () => 'x'" },
			''
		);
		expect(raw.rules['_ws']).toBeDefined();
		expect(raw.rules['_dead']).toBeUndefined();
	}, 60_000);
});

describe('canonicalRuleTree reads an optional of nothing the same under either encoding', () => {
	type Evaluated = Rule<'evaluate'>;
	const blank: Evaluated = { type: 'BLANK' };
	const treeSitter: Evaluated = { type: 'CHOICE', members: [blank, blank] };
	const dsl: Evaluated = { type: 'OPTIONAL', content: blank };
	const sequenceWith = (hole: Evaluated): Evaluated => ({ type: 'SEQ', members: [sym('a'), hole, sym('b')] });
	const symbolNames = (rule: Evaluated): (string | undefined)[] => {
		const canonical = canonicalRuleTree(rule);
		if (canonical.type !== 'SEQ') return [];
		return canonical.members.map((member) => (member.type === 'SYMBOL' ? member.name : undefined));
	};

	it('canonicalizes tree-sitter\'s and the DSL\'s optional(blank()) alike', () => {
		expect(canonicalRuleTree(dsl)).toEqual(canonicalRuleTree(treeSitter));
	});

	it('drops either one from an enclosing sequence', () => {
		expect(symbolNames(sequenceWith(dsl))).toEqual(['a', 'b']);
		expect(symbolNames(sequenceWith(treeSitter))).toEqual(['a', 'b']);
	});
});
