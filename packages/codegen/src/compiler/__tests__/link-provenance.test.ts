import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { collectReferences } from '../rule-catalog.ts';

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
	it('keeps the renamed and split kinds grammar bindings produced', () => {
		const linked = linkPredicted(
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

	it('stamps a variant its owner only when the owner\'s stamped arm is the variant\'s one reference', () => {
		const arm = (name: string, variant: string): Rule<'evaluate'> => ({ type: SYMBOL, name, annotations: { variant, variantOf: 'pointer' } }) as Rule<'evaluate'>;
		const rules: Record<string, Rule<'evaluate'>> = {
			root: { type: SEQ, members: [{ type: SYMBOL, name: 'pointer' }, { type: SYMBOL, name: 'mutable' }] },
			pointer: { type: CHOICE, members: [arm('pointer_const', 'const'), arm('mutable', 'mutable')] },
			pointer_const: word('*const'),
			mutable: word('mut')
		};
		const linked = linkPredicted(raw(rules, { references: collectReferences(rules, { ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() } }) }));

		expect(linked.provenance?.variantOf).toEqual({ pointer_const: 'pointer' });
	});

	it('stamps a reference to a hidden copy with the visible kind the copy chain starts from', () => {
		const linked = linkPredicted(
			raw(
				{
					root: { type: SEQ, members: [{ type: SYMBOL, name: '_method_inner' }, { type: SYMBOL, name: 'method' }] },
					method: word('fn'),
					_method_outer: word('fn'),
					_method_inner: word('fn')
				},
				{ splitFrom: { _method_outer: 'method', _method_inner: '_method_outer' } }
			)
		);
		const root = linked.rules.root as Extract<Rule<'link'>, { type: 'SEQ' }>;

		expect(root.members.map((member) => (member as { copyOf?: string }).copyOf)).toEqual(['method', undefined]);
	});

	it('carries no provenance for a grammar without grammar bindings', () => {
		const linked = linkPredicted(raw({ root: word('x') }));

		expect(linked.provenance).toEqual({});
	});
});
