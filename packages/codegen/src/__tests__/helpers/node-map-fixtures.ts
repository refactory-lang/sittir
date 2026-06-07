/**
 * Shared node-map fixtures for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../compiler/rule-types.ts'; // @rule-type-consts
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype,
} from '../../compiler/node-map.ts';
import type { AssembledNode } from '../../compiler/node-map.ts';
import type { ChoiceRule, RenderRule, SeqRule } from '../../compiler/rule.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

export function makeNodeMapWith(nodes: Map<string, AssembledNode>, polymorphFormKinds: ReadonlySet<string> = new Set()): NodeMap {
	return {
		name: 'rust',
		nodes,
		signatures: { signatures: new Map() },
		derivations: {
			inferredFields: [],
			promotedRules: [],
			repeatedShapes: []
		},
		rules: {},
		externals: new Set(),
		word: undefined,
		polymorphFormKinds
	} satisfies NodeMap;
}

export function makeMinimalNodeMap(): NodeMap {
	const callRule: SeqRule = {
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
	const callRuleSimplified = deleteWrapper(callRule) as RenderRule & typeof callRule;
	nodes.set('call_expression', new AssembledBranch('call_expression', callRule, callRuleSimplified));
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
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['identifier', 'call_expression']));
	return makeNodeMapWith(nodes);
}
