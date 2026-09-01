import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledKeyword,
	AssembledPattern,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
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
function makeFieldPatternNodeMap(withMarkers: boolean) {
	const markers: SeqRule<'link'>['members'] = [
		{ type: FIELD, name: 'ref_marker', content: { type: OPTIONAL, content: { type: STRING, value: 'ref' } } },
		{
			type: FIELD,
			name: 'mutable_specifier',
			content: { type: OPTIONAL, content: { type: SYMBOL, name: '_mutable_specifier' } }
		}
	];
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			...(withMarkers ? markers : []),
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
	const parentRender = flatten(parentRule);
	nodes.set('field_pattern', new AssembledBranch('field_pattern', parentRender, parentRender));
	nodes.set('_mutable_specifier', new AssembledKeyword('_mutable_specifier', { type: STRING, value: 'mut' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('field_pattern_named', new AssembledPattern('field_pattern_named', { type: PATTERN, value: '.+' }));
	return makeNodeMapWith(nodes);
}

describe('from() children element type', () => {
	it('unions every choice arm of the sole slot, matching the factory signature', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeFieldPatternNodeMap(false) });

		expect(src).toContain('T.Identifier | T.FieldPatternNamed');
		expect(src).not.toContain('never | T.FieldPattern');
	});

	it('emits no children element type for a kind whose sole slot sits beside configurable markers', () => {
		// ref_marker / mutable_specifier are configurable keyword markers: the
		// kind is multi-slot for surface purposes and takes a config object,
		// so from() must not treat it as child-spread.
		const src = emitFrom({ grammar: 'synth', nodeMap: makeFieldPatternNodeMap(true) });

		expect(src).not.toContain('"mut" | T.Identifier | T.FieldPatternNamed');
	});
});
