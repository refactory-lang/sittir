import { CHOICE, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledPattern,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { SeqRule } from '../../types/rule.ts';
import { emitTypes } from '../types.ts';

function nodeMapWith(nodes: Map<string, AssembledNode>): NodeMap {
	return {
		grammar: 'synth',
		grammarSha: 'test',
		rules: {},
		nodes,
		externals: new Set(),
		word: undefined
	} as unknown as NodeMap;
}

function makeRequiredSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_parent', new AssembledBranch('single_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalSingleChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: OPTIONAL, content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('optional_parent', new AssembledBranch('optional_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return nodeMapWith(nodes);
}

function makeMultiSingularChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('multi_parent', new AssembledBranch('multi_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('number_literal', new AssembledPattern('number_literal', { type: PATTERN, value: '[0-9]+' }));
	return nodeMapWith(nodes);
}

function makeOptionalKeywordChildNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{ type: STRING, value: 'yield' },
			{
				type: OPTIONAL,
				content: {
					type: CHOICE,
					members: [
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'from' },
								{ type: SYMBOL, name: 'expression' }
							]
						},
						{ type: SYMBOL, name: 'expression_list' }
					]
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('yield', new AssembledBranch('yield', parentRule, parentRule));
	nodes.set('expression', new AssembledPattern('expression', { type: PATTERN, value: '.+' }));
	nodes.set('expression_list', new AssembledPattern('expression_list', { type: PATTERN, value: '.+' }));
	return nodeMapWith(nodes);
}

describe('types emitter child slot arity', () => {
	it('emits singular unnamed children as single values instead of singleton tuples', () => {
		const requiredSrc = emitTypes({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });
		const optionalSrc = emitTypes({ grammar: 'synth', nodeMap: makeOptionalSingleChildNodeMap() });

		expect(requiredSrc).toContain('readonly $other: Identifier;');
		expect(requiredSrc).not.toContain('readonly $other: readonly [Identifier];');
		expect(optionalSrc).toContain('readonly $other?: Identifier;');
	});

	it('keeps multi-slot unnamed children list-shaped instead of collapsing to a scalar', () => {
		const src = emitTypes({ grammar: 'synth', nodeMap: makeMultiSingularChildNodeMap() });

		expect(src).toContain('readonly $other: readonly [Identifier | NumberLiteral];');
		expect(src).not.toContain('readonly $other: Identifier | NumberLiteral;');
	});

	it('drops inline terminal literals from child slot types', () => {
		const src = emitTypes({ grammar: 'synth', nodeMap: makeOptionalKeywordChildNodeMap() });

		expect(src).toContain('readonly $other?: Expression | ExpressionList;');
		expect(src).not.toContain('readonly $other?: "from" | Expression | ExpressionList;');
	});
});
