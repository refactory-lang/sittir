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
 * A separated list's loose coercer resolves each element through its content
 * slot, the way a repeated-children coercer does: a bare string is the leaf
 * its pattern names, a bare number is the numeric leaf, a `kind:` object is
 * that kind's config. Spreading the elements raw into the strict factory lets
 * a number through as a kind id, which the render then drops in silence
 * (docs/factory-surface-issues.md, L7).
 */
const ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = {
	type: CHOICE,
	members: [
		{ type: SYMBOL, name: 'identifier' },
		{ type: SYMBOL, name: 'integer_literal' }
	]
};
const ELEMENT_RENDER_RULE: RenderRule = ELEMENT_SIMPLIFIED_RULE as unknown as RenderRule;

const LIST_RULE: SeparatedListElementRule = {
	type: CHOICE,
	members: [
		{ type: SYMBOL, name: 'identifier' },
		{ type: SYMBOL, name: 'integer_literal' }
	],
	multiplicity: 'array',
	separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
};

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, lexicalRank: 1, kind: 'arguments', member: 'Arguments' },
	{ id: 2, lexicalRank: 2, kind: 'arguments_elements', member: 'ArgumentsElements' },
	{ id: 3, lexicalRank: 3, kind: 'identifier', member: 'Identifier' },
	{ id: 4, lexicalRank: 4, kind: 'integer_literal', member: 'IntegerLiteral' },
	{ id: 5, lexicalRank: 5, kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true }
];

function makeNodeMap() {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'arguments_elements',
		new AssembledList('arguments_elements', LIST_RULE, undefined, {
			separatorRule: undefined,
			simplifiedRule: ELEMENT_SIMPLIFIED_RULE,
			renderRule: ELEMENT_RENDER_RULE,
			kindEntries: KIND_ENTRIES
		})
	);
	const envelopeRule = flatten({
		type: FIELD,
		name: 'argumentsElements',
		content: { type: SYMBOL, name: 'arguments_elements' }
	});
	nodes.set('arguments', new AssembledBranch('arguments', envelopeRule, envelopeRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('integer_literal', new AssembledPattern('integer_literal', { type: PATTERN, value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

function coercerOf(emitted: string, name: string): string {
	const start = emitted.indexOf(`export function ${name}(`);
	expect(start).toBeGreaterThan(-1);
	return emitted.slice(start, emitted.indexOf('\n}\n', start));
}

describe('a separated list coercer resolves its elements through the content slot', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeNodeMap(), kindEntries: KIND_ENTRIES });
	const coercer = coercerOf(emitted, 'coerceToArgumentsElements');

	it('never spreads the fresh input raw into the strict factory', () => {
		expect(coercer).not.toContain('F.buildArgumentsElements(...(input as unknown as');
	});

	it('maps each fresh element through the slot resolver', () => {
		expect(coercer).toMatch(/_resolveMany</);
	});

	it('the array-wrap helper hands an array to the coercer, not to the strict factory', () => {
		expect(emitted).toContain(
			'case "arguments_elements": return (coerceToArgumentsElements as (...args: unknown[]) => unknown)(...children);'
		);
	});
});
