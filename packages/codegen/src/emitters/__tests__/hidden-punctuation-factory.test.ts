import { describe, expect, it } from 'vitest';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { AssembledPunctuation } from '../../compiler/model/node-map.ts';
import { classifyFactoryEmission } from '../shared.ts';

describe('hidden literal factory policy', () => {
	it('emits a literal given an explicit builder by the model, including layout arms', () => {
		const tight = new AssembledPunctuation('_tight', { type: 'STRING', value: '' });
		tight.factoryName = 'tight';
		const nodeMap = makeNodeMapWith(new Map([['_tight', tight]]));
		expect(classifyFactoryEmission('_tight', tight, { nodeMap })).toBe('emit');
	});

	it('keeps ordinary hidden punctuation without a builder off the factory surface', () => {
		const comma = new AssembledPunctuation('_comma', { type: 'STRING', value: ',' });
		const nodeMap = makeNodeMapWith(new Map([['_comma', comma]]));
		expect(classifyFactoryEmission('_comma', comma, { nodeMap })).not.toBe('emit');
	});
});
