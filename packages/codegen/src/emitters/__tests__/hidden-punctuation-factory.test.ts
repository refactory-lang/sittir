import { describe, expect, it } from 'vitest';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { AssembledPunctuation } from '../../compiler/model/node-map.ts';
import { classifyFactoryEmission } from '../shared.ts';
import { collectKindEntries } from '../kind-discriminant.ts';

const punctuation = (kind: string, text: string) =>
	withGeneratedIdTables((kindEntries) => makeNodeMapWith(new Map([[kind, new AssembledPunctuation(kind, { type: 'STRING', value: text }, { kindEntries })]])));

describe('hidden literal factory policy', () => {
	it('emits a literal given an explicit builder by the model, including layout arms', () => {
		const { nodeMap, generatedIdTables } = punctuation('_tight', '');
		const tight = nodeMap.nodes.get('_tight')!;
		tight.factoryName = 'tight';
		expect(classifyFactoryEmission('_tight', tight, { nodeMap, kindEntries: collectKindEntries(nodeMap, generatedIdTables) })).toBe('emit');
	});

	it('keeps ordinary hidden punctuation without a builder off the factory surface', () => {
		const { nodeMap, generatedIdTables } = punctuation('_comma', ',');
		const comma = nodeMap.nodes.get('_comma')!;
		expect(classifyFactoryEmission('_comma', comma, { nodeMap, kindEntries: collectKindEntries(nodeMap, generatedIdTables) })).not.toBe('emit');
	});
});
