import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule, SeqRule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

function mkGrammar(rules: Record<string, Rule>) {
	return { grammar: { name: 'test', rules } };
}

function runEnrich(input: ReturnType<typeof mkGrammar>) {
	return enrich(input) as unknown as {
		grammar: { name: string; rules: Record<string, Rule> };
	};
}

function topSeq(g: ReturnType<typeof mkGrammar>, ruleName: string): SeqRule {
	return g.grammar.rules[ruleName] as SeqRule;
}

// Bare leading-keyword pass was intentionally removed from enrich —
// wrapping bare leading literals as FIELD(SYM) adds `_kw_<name>`
// hidden rules that shift tree-sitter's parser-generator tables and
// break unrelated rules' reparse. The enrich.ts docstring documents
// this: readNode's `promoteAnonymousKeyword` picks up bare leading
// literals at runtime without grammar-side wrapping.
//
// Tests here verify that enrich does NOT touch leading literals.
describe('enrich — leading string literals (bare-keyword pass removed)', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('leaves leading identifier-shaped literals as plain strings', () => {
		const g = runEnrich(
			mkGrammar({
				async_fn: {
					type: SEQ,
					members: [
						{ type: STRING, value: 'async' },
						{ type: SYMBOL, name: 'body' }
					]
				}
			})
		);
		const seq = topSeq(g, 'async_fn');
		expect(seq.members[0]).toMatchObject({ type: 'STRING', value: 'async' });
	});

	it('leaves non-leading string literals as plain strings', () => {
		const g = runEnrich(
			mkGrammar({
				for_loop: {
					type: SEQ,
					members: [
						{ type: SYMBOL, name: 'label' },
						{ type: STRING, value: 'for' },
						{ type: SYMBOL, name: 'pattern' }
					]
				}
			})
		);
		expect(topSeq(g, 'for_loop').members[1]).toMatchObject({
			type: 'STRING',
			value: 'for'
		});
	});

	it('leaves punctuation literals alone', () => {
		const g = runEnrich(
			mkGrammar({
				paren: {
					type: SEQ,
					members: [
						{ type: STRING, value: '(' },
						{ type: SYMBOL, name: 'expr' },
						{ type: STRING, value: ')' }
					]
				}
			})
		);
		expect(topSeq(g, 'paren').members[0]).toMatchObject({
			type: 'STRING',
			value: '('
		});
	});
});
