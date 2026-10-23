import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { AssembledList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { grammarPackage } from '../../grammars.ts';
import { emitClientUtils } from '../client-utils.ts';
import { compoundStructureRow, listStructureRow } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';

describe('the structure table: what a built node of each kind must hold', () => {
	let nodeMap: NodeMap;
	let kindEntries: readonly KindEnumEntry[];
	const node = (kind: string): AssembledNode => nodeMap.nodes.get(kind)!;

	beforeAll(async () => {
		const generatedIdTables = await loadGeneratedIdTables('python');
		if (generatedIdTables === undefined) throw new Error('no generated id tables for python');
		({ nodeMap } = await compileGrammar({ package: grammarPackage('python'), generatedIdTables }));
		kindEntries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	}, FULL_PIPELINE_TIMEOUT);

	it('rows a compound by its stored slots: required ones, non-empty lists, and node-only slots with the builder labels', () => {
		expect(compoundStructureRow(node('decorated_definition') as never, nodeMap, kindEntries)).toEqual({
			kind: 'decorated_definition',
			required: [['_definition', 'definition']],
			nonEmpty: [['_decorator', 'decorated_definition.decorators']],
			nodeOnly: [
				['_decorator', 'DecoratedDefinition.decorators', 'a built Decorator'],
				['_definition', 'DecoratedDefinition.definition', 'a built ClassDefinition / FunctionDefinition']
			],
			config: ['decorators', 'definition'],
			lists: [['decorators', false, 'key']]
		});
	});

	it('rows a non-empty separated list by its elements', () => {
		const list = node('expression_list');
		expect(list).toBeInstanceOf(AssembledList);
		expect(listStructureRow(list as AssembledList)).toEqual({
			kind: 'expression_list',
			nonEmpty: [['_item', 'expression_list.elements']],
			lists: [['items', false, 0]]
		});
	});

	it('prints the table into the language utils by kind id', () => {
		const utils = emitClientUtils({ grammar: 'python', nodeMap, structure: new Map([[7, { kind: 'probe', nonEmpty: [['_items', 'probe.items']] }]]) });
		expect(utils).toContain('export const structure: StructureTable = Object.freeze({\n    7: {"kind":"probe","nonEmpty":[["_items","probe.items"]]}\n});');
	});
});
