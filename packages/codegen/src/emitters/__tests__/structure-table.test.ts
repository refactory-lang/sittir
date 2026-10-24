import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { AssembledList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { grammarPackage } from '../../grammars.ts';
import { emitClientUtils } from '../client-utils.ts';
import { compoundStructureRow, listStructureRow } from '../factories.ts';
import { collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import { BLANK_KIND_ID } from '../../compiler/model/site-preferences.ts';

describe('the structure table: what a built node of each kind must hold', () => {
	let nodeMap: NodeMap;
	let kindEntries: readonly KindEnumEntry[];
	const node = (kind: string): AssembledNode => nodeMap.nodes.get(kind)!;

	beforeAll(async () => {
		const { nodeMap: compiled, generatedIdTables } = await compileGrammar({ package: grammarPackage('python') });
		nodeMap = compiled;
		kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	}, FULL_PIPELINE_TIMEOUT);

	it('rows a compound by its stored slots: required ones, non-empty lists, and node-only slots with the builder labels', () => {
		expect(compoundStructureRow(node('decorated_definition') as never, nodeMap, kindEntries)).toEqual({
			kind: 'decorated_definition',
			required: [['_definition', 'definition']],
			nonEmpty: [['_decorator', 'decorated_definition.decorators']],
			nodeOnly: [
				['_decorator', 'DecoratedDefinition.decorators', 'a built Decorator', [node('decorator').kindId!]],
				[
					'_definition',
					'DecoratedDefinition.definition',
					'a built ClassDefinition / FunctionDefinition',
					[node('class_definition').kindId!, node('function_definition').kindId!].sort((a, b) => a - b)
				]
			],
			config: ['decorators', 'definition'],
			lists: [['decorators', false, 'key']]
		});
	});

	it('rows each scalar slot by its storage, options slots included: a boolean, a kind id of its kinds, one of its texts', () => {
		const ids = (...kinds: string[]) => kinds.map((k) => node(k).kindId!).sort((a, b) => a - b);
		expect(compoundStructureRow(node('for_in_clause') as never, nodeMap, kindEntries)).toEqual({
			kind: 'for_in_clause',
			required: [['_left', 'left']],
			nonEmpty: [['_right', 'for_in_clause.rights']],
			nodeOnly: [
				['_left', 'ForInClause.left', 'a built Pattern / PatternList', ids('pattern', 'pattern_list')],
				['_right', 'ForInClause.rights', 'a built Expression / LambdaWithinForInClause', ids('expression', 'lambda_within_for_in_clause')]
			],
			booleans: [['_async', 'ForInClause.async']],
			kindIds: [['_trailing_comma', 'ForInClause.trailingComma', [BLANK_KIND_ID, ...ids('comma')]]],
			config: ['async', 'left', 'rights', 'trailingComma'],
			lists: [['rights', false, 'key']]
		});
		expect(compoundStructureRow(node('complex_pattern') as never, nodeMap, kindEntries)).toMatchObject({
			booleans: [['_sign', 'ComplexPattern.sign']],
			kindIds: [['_operator', 'ComplexPattern.operator', ids('plus', 'dash')]]
		});
		expect(compoundStructureRow(node('integer_hex') as never, nodeMap, kindEntries)).toEqual({
			kind: 'integer_hex',
			required: [['_content', 'content']],
			texts: [['_prefix', 'IntegerHex.prefix', ['0x', '0X']]]
		});
	});

	it('rows a non-empty separated list by its elements, each held to what its storage takes', () => {
		const list = node('expression_list');
		expect(list).toBeInstanceOf(AssembledList);
		expect(listStructureRow(list as AssembledList, nodeMap)).toEqual({
			kind: 'expression_list',
			nonEmpty: [['_item', 'expression_list.elements']],
			nodeOnly: [['_item', 'ExpressionList.items', 'a built Expression', [node('expression').kindId!]]],
			lists: [['items', false, 0]]
		});
	});

	it('prints the table into the language utils by kind id', () => {
		const utils = emitClientUtils({ grammar: 'python', nodeMap, kindEntries, structure: new Map([[7, { kind: 'probe', nonEmpty: [['_items', 'probe.items']] }]]) });
		expect(utils).toContain('export const structure: StructureTable = Object.freeze({\n    7: {"kind":"probe","nonEmpty":[["_items","probe.items"]]}\n});');
	});
});
