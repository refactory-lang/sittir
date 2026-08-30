import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { armConfigKeys, choiceSlotOf, subFactoriesOf } from '../overlays/sub-factories.ts';

// ---------------------------------------------------------------------------
// Synthetic grammars.
//
// `comment: choice(comment_doc, comment_plain)` — `doc_comment`/`plain_comment`
// as sketched in the spec don't share the `comment_` prefix `armName` keys
// off of, so the arms are renamed `comment_doc`/`comment_plain` to exercise
// the intended `<parent>_<suffix>` naming convention. `logic` is declared
// first in each grammar's rule map because `link` only keeps rules reachable
// from the first-declared rule.
// ---------------------------------------------------------------------------

function commentNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		comment: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment_doc' },
				{ type: SYMBOL, name: 'comment_plain' }
			]
		},
		comment_doc: {
			type: SEQ,
			members: [
				{ type: STRING, value: '///' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		},
		comment_plain: {
			type: SEQ,
			members: [
				{ type: STRING, value: '//' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		}
	};
	return buildNodeMap(rules);
}

function logicNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		logic: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'op',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'and' },
							{ type: STRING, value: 'or' }
						]
					}
				},
				{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		identifier: { type: PATTERN, value: '[a-z]+' }
	};
	return buildNodeMap(rules);
}

function pairNodeMap(): NodeMap {
	const rules: Record<string, Rule<'evaluate'>> = {
		pair: {
			type: SEQ,
			members: [
				{
					type: FIELD,
					name: 'a',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'x' },
							{ type: STRING, value: 'y' }
						]
					}
				},
				{
					type: FIELD,
					name: 'b',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'm' },
							{ type: STRING, value: 'n' }
						]
					}
				}
			]
		}
	};
	return buildNodeMap(rules);
}

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
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
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized));
}

describe('sub-factories — subFactoriesOf', () => {
	it('envelope with a kind-choice sole slot yields one kind arm per child', () => {
		const nodeMap = commentNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('comment')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['doc', 'plain']);
		expect(set.entries.every((e) => e.residual.length === 0)).toBe(true);
		expect(set.diagnostics).toEqual([]);
	});

	it('branch with an enum slot yields literal arms with the residual', () => {
		const nodeMap = logicNodeMap();
		const set = subFactoriesOf(nodeMap.nodes.get('logic')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['and', 'or']);
		expect(set.entries[0]!.residual.map((f) => f.name).sort()).toEqual(['left', 'right']);
		expect(armConfigKeys(set.entries[0]!, nodeMap)).toBe('positional');
	});

	it('a kind with two choice slots is not eligible', () => {
		const nodeMap = pairNodeMap();
		expect(choiceSlotOf(nodeMap.nodes.get('pair')!)).toBeUndefined();
	});
});
