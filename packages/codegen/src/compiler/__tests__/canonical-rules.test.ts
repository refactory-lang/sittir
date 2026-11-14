import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { canonicalRuleTree } from '../canonical-rules.ts';
import type { Rule } from '../../types/rule.ts';

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
	const symbol = (name: string) => ({ type: 'SYMBOL', name }) as unknown as Rule<'evaluate'>;
	const sequenceWith = (hole: unknown) =>
		({ type: 'SEQ', members: [symbol('a'), hole, symbol('b')] }) as unknown as Rule<'evaluate'>;
	const treeSitter = { type: 'CHOICE', members: [{ type: 'BLANK' }, { type: 'BLANK' }] };
	const dsl = { type: 'OPTIONAL', content: { type: 'BLANK' } };

	it('canonicalizes tree-sitter\'s and the DSL\'s optional(blank()) alike', () => {
		expect(canonicalRuleTree(dsl as unknown as Rule<'evaluate'>)).toEqual(canonicalRuleTree(treeSitter as unknown as Rule<'evaluate'>));
	});

	it('drops either one from an enclosing sequence', () => {
		const names = (rule: Rule<'evaluate'>) => (canonicalRuleTree(rule) as unknown as { members: { name: string }[] }).members.map((m) => m.name);
		expect(names(sequenceWith(dsl))).toEqual(['a', 'b']);
		expect(names(sequenceWith(treeSitter))).toEqual(['a', 'b']);
	});
});
