/**
 * Shared node-map fixtures for codegen emitter tests.
 * Non-test module — safe to import without registering test cases.
 */

import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype,
} from '../../compiler/node-map.ts';
import type { AssembledNode } from '../../compiler/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../compiler/rule.ts';
import type { NodeMap } from '../../compiler/types.ts';

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
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'callee',
				content: { type: 'symbol', name: '_expression' }
			},
			{
				type: 'field',
				name: 'keyword',
				content: { type: 'symbol', name: 'kw_fn' }
			},
			{
				type: 'field',
				name: 'operator',
				content: { type: 'symbol', name: 'operator' }
			},
			{
				type: 'field',
				name: 'semicolon',
				content: { type: 'string', value: ';' }
			}
		]
	};
	const expressionRule: ChoiceRule = {
		type: 'choice',
		members: [
			{ type: 'symbol', name: 'identifier' },
			{ type: 'symbol', name: 'call_expression' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('call_expression', new AssembledBranch('call_expression', callRule, callRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('kw_fn', new AssembledKeyword('kw_fn', { type: 'string', value: 'fn' }));
	nodes.set('self', new AssembledKeyword('self', { type: 'string', value: 'self' }));
	nodes.set(
		'operator',
		new AssembledEnum('operator', {
			type: 'enum',
			members: [
				{ type: 'string', value: '+' },
				{ type: 'string', value: '-' }
			]
		})
	);
	nodes.set('_expression', new AssembledSupertype('_expression', expressionRule, ['identifier', 'call_expression']));
	return makeNodeMapWith(nodes);
}
