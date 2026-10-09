import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';

function raw(rules: Record<string, Rule<'evaluate'>>, extra: Partial<RawGrammar> = {}): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		...extra
	};
}

const word = (text: string): Rule<'evaluate'> => ({ type: STRING, value: text });

describe('link carries each kind\'s provenance', () => {
	it('keeps the renamed and split kinds a bindings overlay produced', () => {
		const linked = link(
			raw(
				{
					root: { type: SEQ, members: [{ type: SYMBOL, name: 'binding' }, { type: SYMBOL, name: 'method' }] },
					binding: word('let'),
					method: word('fn')
				},
				{ renamedFrom: { binding: 'let_item' }, splitFrom: { method: 'function' } }
			)
		);

		expect(linked.provenance).toEqual({ renamedFrom: { binding: 'let_item' }, splitFrom: { method: 'function' } });
	});

	it('carries no provenance for a grammar without an overlay', () => {
		const linked = link(raw({ root: word('x') }));

		expect(linked.provenance).toEqual({});
	});
});
