import { expect, it } from 'vitest';
import { splitGrammar } from '../bind.ts';
import { preference } from '../primitives/preference.ts';
import { LABELS_KEY } from '../wire/options-block.ts';

it('inherits a split body\'s owned preferences and labels without moving its source policy', () => {
	const before = preference('space');
	const end = preference('newline');
	const grammar = {
		rules: { body: { type: 'SEQ', members: [] }, owner: { type: 'SYMBOL', name: 'body' } },
		options: { body: { before, 'items:/end': end }, [LABELS_KEY]: { 'body/"{"/after': 'body/before' } }
	};
	const result = splitGrammar(grammar, [{ kind: 'body', as: 'context_body', within: ['owner'], containers: [] }]);
	expect(result.options).toEqual({
		body: grammar.options.body,
		context_body: grammar.options.body,
		[LABELS_KEY]: { 'body/"{"/after': 'body/before', 'context_body/"{"/after': 'body/before' }
	});
});
