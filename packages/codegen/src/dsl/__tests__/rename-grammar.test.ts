import { describe, expect, it } from 'vitest';
import { renameGrammar } from '../bind.ts';

describe('renameGrammar', () => {
	it('renames the kind an annotation names, and leaves a label that happens to spell a kind', () => {
		const grammar = {
			rules: {
				impl_item: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'body', annotations: { variant: 'body', variantOf: 'impl_item' } }] },
				body: { type: 'STRING', value: '{}' }
			}
		};
		const out = renameGrammar(grammar, { impl_item: 'impl_declaration', body: 'impl_body' }) as { rules: Record<string, { members?: unknown[] }> };
		expect(out.rules.impl_declaration?.members).toEqual([
			{ type: 'SYMBOL', name: 'impl_body', annotations: { variant: 'body', variantOf: 'impl_declaration' } }
		]);
	});

	it('leaves a metadata string that happens to spell a kind', () => {
		const grammar = { rules: { block: { type: 'SYMBOL', name: 'statement', metadata: { symbolSource: 'statement' } }, statement: { type: 'BLANK' } } };
		const out = renameGrammar(grammar, { statement: 'statement_x' }) as { rules: Record<string, unknown> };
		expect(out.rules.block).toEqual({ type: 'SYMBOL', name: 'statement_x', metadata: { symbolSource: 'statement' } });
	});
});
