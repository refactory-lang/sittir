import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledKeyword,
	AssembledPattern,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';

/**
 * Mirrors rust's real `field_pattern` shape: two optional NAMED marker
 * fields (`ref_marker`, `mutable_specifier`) precede the real unnamed
 * content slot in `node.fields` order. The from() resolver's element-type
 * union must come from ALL fields (matching the factory's own derivation
 * via `childElementType`), not from whichever field happens to be
 * `fields[0]`.
 */
function makeMixedMarkerAndContentNodeMap() {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: FIELD, name: 'ref_marker', content: { type: OPTIONAL, content: { type: STRING, value: 'ref' } } },
			{
				type: FIELD,
				name: 'mutable_specifier',
				content: { type: OPTIONAL, content: { type: SYMBOL, name: '_mutable_specifier' } }
			},
			{
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'identifier' },
					{ type: SYMBOL, name: 'field_pattern_named' }
				]
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'field_pattern',
		new AssembledBranch('field_pattern', parentRule, deleteWrapper(parentRule), deleteWrapper(parentRule))
	);
	nodes.set('_mutable_specifier', new AssembledKeyword('_mutable_specifier', { type: STRING, value: 'mut' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('field_pattern_named', new AssembledPattern('field_pattern_named', { type: PATTERN, value: '.+' }));
	return makeNodeMapWith(nodes);
}

describe('from() container element type', () => {
	it('unions every field, not just fields[0], matching the factory signature', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeMixedMarkerAndContentNodeMap() });

		expect(src).toContain('"mut" | T.Identifier | T.FieldPatternNamed');
		expect(src).not.toContain('never | T.FieldPattern');
	});
});
