import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { CHOICE, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { SeqRule } from '../../types/rule.ts';
import { emitTypes } from '../types.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';

const nodeMapWith = (nodes: Map<string, AssembledNode>): NodeMap => makeNodeMapWith(nodes);

function makeRequiredSingleChildNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	const parentRender = flatten(parentRule);
	nodes.set('single_parent', new AssembledBranch('single_parent', parentRender, parentRender, { kindEntries }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	return nodeMapWith(nodes);
}

function makeOptionalSingleChildNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: OPTIONAL, content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	const parentRender = flatten(parentRule);
	nodes.set('optional_parent', new AssembledBranch('optional_parent', parentRender, parentRender, { kindEntries }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	return nodeMapWith(nodes);
}

function makeMultiSingularChildNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	const parentRender = flatten(parentRule);
	nodes.set('multi_parent', new AssembledBranch('multi_parent', parentRender, parentRender, { kindEntries }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	nodes.set('number_literal', new AssembledPattern('number_literal', { type: PATTERN, value: '[0-9]+' }, { kindEntries }));
	return nodeMapWith(nodes);
}

function makeOptionalKeywordChildNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: STRING, value: 'yield' },
			{
				type: OPTIONAL,
				content: {
					type: CHOICE,
					members: [
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'from' },
								{ type: SYMBOL, name: 'expression' }
							]
						},
						{ type: SYMBOL, name: 'expression_list' }
					]
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	const parentRender = flatten(parentRule);
	nodes.set('yield', new AssembledBranch('yield', parentRender, parentRender, { kindEntries }));
	nodes.set('expression', new AssembledPattern('expression', { type: PATTERN, value: '.+' }, { kindEntries }));
	nodes.set('expression_list', new AssembledPattern('expression_list', { type: PATTERN, value: '.+' }, { kindEntries }));
	return nodeMapWith(nodes);
}

describe('types emitter child slot arity', () => {
	// Kind-named slots (docs/superpowers/specs/2026-05-17-kind-named-slots-design.md)
	// keeps unnamed positional children under their own kind-derived field name
	// (`_identifier`, `_number_literal`, ...) rather than folding them into a
	// generic `$other` key. AssembledBranch's own doc comment (node-map.ts)
	// confirms the `$other`/`$child`/`$children` remap this file used to assert
	// is a deferred, not-yet-scheduled future migration ("Owner A") — these
	// cases now pin the current kind-derived-name behavior instead, preserving
	// the original regression-guard intent (no singleton-tuple wrapping, no
	// lossy union collapse, no literal pollution in the emitted type).
	it('emits singular unnamed children as their own kind-derived field, not a tuple', () => {
		const requiredSrc = emitTypes({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeRequiredSingleChildNodeMap(kindEntries))});
		const optionalSrc = emitTypes({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeOptionalSingleChildNodeMap(kindEntries))});

		expect(requiredSrc).toContain('readonly _identifier: Identifier;');
		expect(requiredSrc).not.toContain('readonly _identifier: readonly [Identifier];');
		expect(optionalSrc).toContain('readonly _identifier?: Identifier;');
	});

	it('keeps distinct unnamed children as separately-typed fields instead of folding into one ambiguous union', () => {
		const src = emitTypes({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeMultiSingularChildNodeMap(kindEntries))});

		expect(src).toContain('readonly _identifier: Identifier;');
		expect(src).toContain('readonly _number_literal: NumberLiteral;');
		expect(src).not.toContain('Identifier | NumberLiteral');
	});

	it('drops inline terminal literals from child slot types', () => {
		const src = emitTypes({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeOptionalKeywordChildNodeMap(kindEntries))});

		expect(src).toContain('readonly _expression?: Expression;');
		expect(src).toContain('readonly _expression_list?: ExpressionList;');
		expect(src).not.toContain('"from"');
	});
});
