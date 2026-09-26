/**
 * Shared node-map fixtures for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { flatten } from '../../compiler/flatten.ts';

export function makeNodeMapWith(nodes: Map<string, AssembledNode>): NodeMap {
	return {
		name: 'rust',
		nodes,
		nodeByRuleId: new Map(),
		nodeByKindId: new Map(),
		slotByRuleId: new Map(),
		signatures: { signatures: new Map() },
		derivations: {
			inferredFields: [],
			promotedRules: [],
			repeatedShapes: []
		},
		externals: new Set(),
		word: undefined
	} satisfies NodeMap;
}

export function makeSiteKindsNodeMap<T extends { readonly kind: string; readonly seat?: { readonly kind: string } }>(sites: readonly T[]): NodeMap {
	const kinds = new Set(sites.flatMap((site) => (site.seat === undefined ? [site.kind] : [site.kind, site.seat.kind])));
	return makeNodeMapWith(new Map([...kinds].map((kind) => [kind, new AssembledPattern(kind, { type: PATTERN, value: kind })])));
}

export function makeMinimalNodeMap(): NodeMap {
	const callRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'callee',
				content: { type: SYMBOL, name: '_expression' }
			},
			{
				type: FIELD,
				name: 'keyword',
				content: { type: SYMBOL, name: 'kw_fn' }
			},
			{
				type: FIELD,
				name: 'operator',
				content: { type: SYMBOL, name: 'operator' }
			},
			{
				type: FIELD,
				name: 'semicolon',
				content: { type: STRING, value: ';' }
			}
		]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	const callRuleRender = flatten(callRule);
	nodes.set('call_expression', new AssembledBranch('call_expression', callRuleRender, callRuleRender));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: STRING, value: 'fn' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: CHOICE,
			members: [
				{ type: STRING, value: '+' },
				{ type: STRING, value: '-' }
			]
		})
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', expressionRule, [{ name: 'identifier' }, { name: 'call_expression' }])
	);
	return makeNodeMapWith(nodes);
}
