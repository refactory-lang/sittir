import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import {
	AssembledBranch,
	AssembledKeyword,
	AssembledList,
	AssembledPattern,
	type AssembledNode,
	type SeparatedListElementRule
} from '../../compiler/model/node-map.ts';
import type { RenderRule, SimplifiedRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

/**
 * Mirrors rust's `_struct_pattern_elements`: a list container whose element
 * admits a configurable kind (`field_pattern`) alongside a parameterless one
 * (`remaining_field_pattern`, the bare `..`).
 *
 * A bare config object in an auto-wrapped array has to be resolved against
 * the ELEMENT kind. Resolving it against the container kind builds a second
 * container inside the first, which is what `_resolveOneBranch` did.
 */
const ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'field_pattern' };
const ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'field_pattern' };

const LIST_RULE: SeparatedListElementRule = {
	type: CHOICE,
	members: [
		{ type: SYMBOL, name: 'field_pattern' },
		{ type: SYMBOL, name: 'remaining_field_pattern' }
	],
	multiplicity: 'nonEmptyArray',
	separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
};

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: '_struct_pattern_elements', member: 'StructPatternElements' },
	{ id: 2, kind: 'field_pattern', member: 'FieldPattern' },
	{ id: 3, kind: 'remaining_field_pattern', member: 'RemainingFieldPattern' },
	{ id: 4, kind: 'identifier', member: 'Identifier' },
	{ id: 5, kind: 'comma', member: 'Comma', symbolName: ',', anon: true }
];

function makeNodeMap() {
	const contentRule = flatten({ type: SYMBOL, name: 'identifier' });
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'_struct_pattern_elements',
		new AssembledList('_struct_pattern_elements', LIST_RULE, undefined, {
			separatorRule: undefined,
			simplifiedRule: ELEMENT_SIMPLIFIED_RULE,
			renderRule: ELEMENT_RENDER_RULE,
			kindEntries: KIND_ENTRIES
		})
	);
	nodes.set('field_pattern', new AssembledBranch('field_pattern', contentRule, contentRule));
	nodes.set('remaining_field_pattern', new AssembledKeyword('remaining_field_pattern', { type: STRING, value: '..' }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('from() auto-wrapped array elements', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeNodeMap(), kindEntries: KIND_ENTRIES });

	it('resolves a bare element against the element kind, never the container kind', () => {
		expect(emitted).toContain('"_struct_pattern_elements": "field_pattern",');
		expect(emitted).toContain('const elementKind = _wrapElementKinds[kind];');
		expect(emitted).toContain(
			'if (elementKind !== undefined && _isFromKind(elementKind)) return _resolveByKind(elementKind, e);'
		);
		// The container kind is what produced a container nested in itself.
		expect(emitted).not.toContain('if (_isFromKind(kind)) return _resolveByKind(kind, e);');
	});

	it('passes over a parameterless sibling when naming the element kind', () => {
		// `remaining_field_pattern` is the bare `..` — it takes no config, so
		// it can never be what a bare config object meant, and its presence
		// must not make the element kind ambiguous.
		expect(emitted).not.toContain('"_struct_pattern_elements": "remaining_field_pattern",');
	});

	it('emits the element table unconditionally beside _wrapKindIds', () => {
		// Both are read by the same branch, so a gate admitting one without
		// the other emits a reference to a table that does not exist.
		expect(emitted).toContain('const _wrapKindIds:');
		expect(emitted).toContain('const _wrapElementKinds:');
	});
});
