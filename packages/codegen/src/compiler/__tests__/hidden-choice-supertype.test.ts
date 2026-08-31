import { CHOICE, FIELD, PATTERN, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { AbstractAssembledCompound, AssembledSupertype } from '../model/node-map.ts';
import { slotKindNames } from '../../emitters/shared.ts';

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>) {
	const raw: RawGrammar = {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	};
	return assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
}

describe('hidden choice-of-kinds rules are supertypes', () => {
	it('survives link inlining and assembles as a supertype; references stay inlined', () => {
		const nodeMap = buildNodeMap({
			source: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'statements',
						content: { type: REPEAT, content: { type: SYMBOL, name: '_stmt' } }
					}
				]
			},
			_stmt: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'a_stmt' },
					{ type: SYMBOL, name: 'b_stmt' }
				]
			},
			a_stmt: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'a' },
					{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'ident' } }
				]
			},
			b_stmt: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'b' },
					{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'ident' } }
				]
			},
			ident: { type: PATTERN, value: '[a-z]+' }
		});

		const node = nodeMap.nodes.get('_stmt');
		expect(node).toBeInstanceOf(AssembledSupertype);
		expect([...(node as AssembledSupertype).subtypeNames].sort()).toEqual(['a_stmt', 'b_stmt']);

		const source = nodeMap.nodes.get('source') as AbstractAssembledCompound;
		expect(source).toBeInstanceOf(AbstractAssembledCompound);
		expect(slotKindNames(source.soleSlot!).sort()).toEqual(['_stmt']);
	});

	it('a visible kind with a choice body stays a compound', () => {
		const nodeMap = buildNodeMap({
			source: {
				type: SEQ,
				members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'wrapper' } }]
			},
			wrapper: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'a_leaf' },
					{ type: SYMBOL, name: 'b_leaf' }
				]
			},
			a_leaf: { type: PATTERN, value: '[a-z]+' },
			b_leaf: { type: PATTERN, value: '[0-9]+' }
		});
		expect(nodeMap.nodes.get('wrapper')).toBeInstanceOf(AbstractAssembledCompound);
	});
});
