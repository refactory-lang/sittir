import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { CHOICE, PATTERN, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledEnum, AssembledKeyword, AssembledPattern } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitIr } from '../ir.ts';

// A hidden pattern leaf that is an alias source (rust `_string_open`,
// visible as `string_open`) is user-facing; a hidden pattern that is
// nothing's alias (sittir's `_space`) is not; an enum of literals is a set
// of kind ids and gets no builder; a hidden keyword marker's value is its
// kind id, so it gets none either; a hidden pattern whose key keeps the
// underscore (python's `_string_content` beside `string_content`) stays off.
function makeNodeMap(kindEntries: readonly GeneratedKindEntry[]) {
	const nodes = new Map<string, AssembledNode>();
	const open = new AssembledPattern('_string_open', { type: PATTERN, value: '[bc]?"' }, { kindEntries });
	open.userFacing = true;
	const space = new AssembledPattern('_space', { type: PATTERN, value: ' +' }, { kindEntries });
	space.userFacing = false;
	const punct = new AssembledEnum('_token_tree_punctuation', {
		type: CHOICE,
		members: [
			{ type: STRING, value: ',' },
			{ type: STRING, value: '+' }
		]
	}, { kindEntries });
	punct.userFacing = true;
	const marker = new AssembledKeyword('_kw_async', { type: STRING, value: 'async' }, { kindEntries });
	marker.userFacing = true;
	const content = new AssembledPattern('_string_content', { type: PATTERN, value: '[^"]+' }, { kindEntries });
	content.userFacing = true;
	nodes.set('_kw_async', marker);
	nodes.set('_string_content', content);
	nodes.set('_string_open', open);
	nodes.set('_space', space);
	nodes.set('_token_tree_punctuation', punct);
	return makeNodeMapWith(nodes);
}

describe('ir leaf exposure follows userFacing, not the name prefix', () => {
	it('exposes a user-facing aliased pattern leaf and hides a non-user-facing one', () => {
		const source = emitIr({ grammar: 'rust', nodeMap: withGeneratedIdTables((kindEntries) => makeNodeMap(kindEntries)).nodeMap });
		expect(source).toContain('stringOpen: F.');
		expect(source).not.toContain('space: F.');
	});
	it('gives an enum of literals no builder', () => {
		const source = emitIr({ grammar: 'rust', nodeMap: withGeneratedIdTables((kindEntries) => makeNodeMap(kindEntries)).nodeMap });
		expect(source).not.toContain('tokenTreePunctuation: F.');
	});
	it('gives a hidden keyword marker and an underscore-keyed hidden pattern no builder', () => {
		const source = emitIr({ grammar: 'rust', nodeMap: withGeneratedIdTables((kindEntries) => makeNodeMap(kindEntries)).nodeMap });
		expect(source).not.toContain('kwAsync: F.');
		expect(source).not.toContain('_stringContent: F.');
	});
});
