import { describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';

describe('enrichFieldWrappers', () => {
	it('propagates fieldName + nonterminal onto the inner rule', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'field', name: 'x', content: { type: 'symbol', name: 'X' } }
				}
			}
		};
		const enriched = enrich(grammar);
		const root = enriched.grammar.rules.root as { content: { fieldName?: string; nonterminal?: boolean } };
		expect(root.content.fieldName).toBe('x');
		expect(root.content.nonterminal).toBe(true);
	});

	it('does not modify rules not wrapped by field', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: { root: { type: 'symbol', name: 'X' } }
			}
		};
		const enriched = enrich(grammar);
		const root = enriched.grammar.rules.root as { fieldName?: string; nonterminal?: boolean };
		expect(root.fieldName).toBeUndefined();
		expect(root.nonterminal).toBeUndefined();
	});

	it('propagates onto string literal (force-promotion: field forces nonterminal even for terminals)', () => {
		const grammar = {
			grammar: {
				name: 'test',
				rules: {
					root: { type: 'field', name: 'semicolon', content: { type: 'string', value: ';' } }
				}
			}
		};
		const enriched = enrich(grammar);
		const root = enriched.grammar.rules.root as { content: { fieldName?: string; nonterminal?: boolean } };
		expect(root.content.fieldName).toBe('semicolon');
		expect(root.content.nonterminal).toBe(true);
	});
});
