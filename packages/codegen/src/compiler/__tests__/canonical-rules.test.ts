import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';

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
