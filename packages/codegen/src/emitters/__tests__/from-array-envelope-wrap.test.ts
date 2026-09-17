import { CHOICE, FIELD, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import {
	AssembledBranch,
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
 * Mirrors rust's `generic_type.type_arguments`: a slot admits an envelope
 * (`type_arguments`) whose own sole slot is a separated list
 * (`type_arguments_elements`). An array handed to the outer slot names one
 * element per entry of the INNER list — the envelope itself is 'direct'
 * (its raw factory takes the built list positionally), so it never takes an
 * array as its own children, and `_wrapArray` has to build the list first
 * (rule 4, docs/factory-surface-issues.md).
 */
const ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'identifier' };
const ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'identifier' };

const LIST_RULE: SeparatedListElementRule = {
	type: CHOICE,
	members: [{ type: SYMBOL, name: 'identifier' }],
	multiplicity: 'array',
	separator: { value: { type: STRING, value: ',' }, trailing: 'none' }
};

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'type_arguments', member: 'TypeArguments' },
	{ id: 2, kind: 'type_arguments_elements', member: 'TypeArgumentsElements' },
	{ id: 3, kind: 'identifier', member: 'Identifier' },
	{ id: 4, kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true }
];

function makeNodeMap() {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'type_arguments_elements',
		new AssembledList('type_arguments_elements', LIST_RULE, undefined, {
			separatorRule: undefined,
			simplifiedRule: ELEMENT_SIMPLIFIED_RULE,
			renderRule: ELEMENT_RENDER_RULE,
			kindEntries: KIND_ENTRIES
		})
	);
	const envelopeRule = flatten({
		type: FIELD,
		name: 'typeArgumentsElements',
		content: { type: SYMBOL, name: 'type_arguments_elements' }
	});
	nodes.set('type_arguments', new AssembledBranch('type_arguments', envelopeRule, envelopeRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('_wrapArray builds a nested list envelope from an array (rule 4)', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeNodeMap(), kindEntries: KIND_ENTRIES });

	it('marks the envelope direct and its list target as its wrap element', () => {
		expect(emitted).toContain('const _wrapDirectKinds: ReadonlySet<string> = new Set([');
		expect(emitted).toContain('"type_arguments",');
		expect(emitted).toContain('"type_arguments": "type_arguments_elements",');
	});

	it('recurses into the list target before wrapping the envelope, never collapsing to one element', () => {
		expect(emitted).toContain('function _wrapArray<T>(kind: string, arr: readonly unknown[]): T {');
		expect(emitted).toContain(
			'if (_wrapDirectKinds.has(kind) && elementKind !== undefined && elementKind in _wrapKindIds) {'
		);
		expect(emitted).toContain('return _wrapWithChildren(kind, [_wrapArray(elementKind, arr)]) as T;');
	});

	it('routes the single-kind array branch through _wrapArray, not an inline duplicate', () => {
		expect(emitted).toContain('return _wrapArray(kind, v) as T;');
		expect(emitted).not.toContain('const resolved = v.map(e => {');
	});
});
