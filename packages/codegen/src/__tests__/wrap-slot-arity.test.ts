import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../compiler/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledPattern,
	AssembledSupertype,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { ChoiceRule, EnumRule, SeqRule } from '../compiler/rule.ts';
import { emitWrap } from '../emitters/wrap.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

function makeRequiredSingleChildNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_parent', new AssembledBranch('single_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeRequiredSingleFieldNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_field_parent', new AssembledBranch('single_field_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeRepeatFieldNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'items',
				content: {
					type: REPEAT1,
					content: { type: SYMBOL, name: 'identifier' }
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('repeat_field_parent', new AssembledBranch('repeat_field_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeHiddenSupertypeChildrenNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: REPEAT1,
				content: { type: SYMBOL, name: '_type' }
			}
		]
	};
	const typeRule: ChoiceRule = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: '_primitive_type' }]
	};
	const primitiveTypeRule: EnumRule = {
		type: CHOICE,
		members: [
			{ type: STRING, value: 'u8' },
			{ type: STRING, value: 'bool' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('tuple_type', new AssembledBranch('tuple_type', parentRule, parentRule));
	nodes.set('_type', new AssembledSupertype('_type', typeRule, ['_primitive_type']));
	nodes.set(
		'_primitive_type',
		new AssembledEnum('_primitive_type', primitiveTypeRule, {
			kindEntries: [
				{ id: 1, kind: 'u8', symbolName: 'anon_sym_u8', anon: false },
				{ id: 2, kind: 'bool', symbolName: 'anon_sym_bool', anon: false }
			]
		})
	);
	nodes.set('u8', new AssembledPattern('u8', { type: PATTERN, value: 'u8' }));
	nodes.set('bool', new AssembledPattern('bool', { type: PATTERN, value: 'bool' }));
	return makeNodeMapWith(nodes);
}

function makeVisibleSupertypeChildrenNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'expression' }]
	};
	const expressionRule: ChoiceRule = {
		type: CHOICE,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('typed_value', new AssembledBranch('typed_value', parentRule, parentRule));
	nodes.set('expression', new AssembledSupertype('expression', expressionRule, ['identifier']));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeOptionalThenRequiredChildNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: OPTIONAL,
				content: { type: SYMBOL, name: 'identifier' }
			},
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'optional_then_required_parent',
		new AssembledBranch('optional_then_required_parent', parentRule, parentRule)
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('number_literal', new AssembledPattern('number_literal', { type: PATTERN, value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

function makeMultiSiblingFieldNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'declaration',
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'identifier' },
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'module' },
								{ type: SYMBOL, name: 'property_identifier' },
								{ type: STRING, value: ':' },
								{ type: SYMBOL, name: 'object_type' }
							]
						}
					]
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('ambient_like_parent', new AssembledBranch('ambient_like_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('property_identifier', new AssembledPattern('property_identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('object_type', new AssembledPattern('object_type', { type: PATTERN, value: '\\{\\}' }));
	return makeNodeMapWith(nodes);
}

function makeHiddenWrapperChildNodeMap() {
	const parentRule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: '_suite' }]
	};
	const suiteRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'block' },
			{ type: SYMBOL, name: '_newline' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('except_like_parent', new AssembledBranch('except_like_parent', parentRule, parentRule));
	nodes.set('_suite', new AssembledBranch('_suite', suiteRule, suiteRule));
	nodes.set('block', new AssembledPattern('block', { type: PATTERN, value: 'block' }));
	nodes.set('_newline', new AssembledPattern('_newline', { type: PATTERN, value: '\\n' }));
	return makeNodeMapWith(nodes);
}

describe('wrap emitter slot arity', () => {
	it('normalizes named singular and repeated slots from grammar-derived cardinality', () => {
		const singularSource = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleFieldNodeMap() });
		const repeatedSource = emitWrap({ grammar: 'synth', nodeMap: makeRepeatFieldNodeMap() });

		expect(singularSource).toContain(
			'_value: normalizeSingularWrapSlot(data._value, "value", true, data.$type, { tree, nodeType: data.$type, slotName: "value", span: (data as _NodeData).$span }),'
		);
		expect(repeatedSource).toContain(
			'_items: normalizeRepeatedWrapSlot(data._items, true, "items", { tree, nodeType: data.$type, slotName: "items", span: (data as _NodeData).$span }),'
		);
	});

	it('passes diagnostic context into singular unnamed child normalization', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain(
			'_identifier: normalizeSingularWrapSlot(data._identifier, "identifier", true, data.$type, { tree, nodeType: data.$type, slotName: "identifier", span: (data as _NodeData).$span }),'
		);
	});

	it('emits singular-mismatch guards for wrapped children', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain('const WRAP_WARNING_MODE = typeof process !== "undefined" && process.env?.SITTIR_WRAP_WARNING_MODE === "1";');
		expect(source).toContain('function describeWrapNodeType(nodeType: string | number): string {');
		expect(source).toContain(
			'function handleWrapViolation<T>(message: string, fallback: T, context: WrapDiagnosticContext): T {'
		);
		expect(source).toContain('function describeWrapSlotItem(value: unknown): string {');
		expect(source).toContain('function describeWrapSlotValue(value: unknown): string {');
		expect(source).toContain(
			'const text = typeof node.$text === "string" ? `, $text=${JSON.stringify(node.$text)}` : "";'
		);
		expect(source).toContain('function normalizeSingularWrapSlot<T>(');
		expect(source).toContain(
			'return handleWrapViolation(`singular slot ${JSON.stringify(slotName)} on ${JSON.stringify(describeWrapNodeType(nodeType))} received ${value.length} values; got ${describeWrapSlotValue(value)}`, value[0] as T, context);'
		);
		expect(source).not.toContain('return wrapNode(e, tree) as unknown as T;');
	});

	it('emits location-aware wrap diagnostics for helper violations', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain('function describeWrapLocation(');
		expect(source).toContain('function describeWrapSnippet(');
		expect(source).toContain('function buildWrapDiagnostic(');
		expect(source).toContain('tree.source');
		expect(source).toContain('normalizeSingularWrapSlot(');
		expect(source).toContain('function normalizeRepeatedWrapSlot<T>(');
		expect(source).toContain('buildWrapDiagnostic(message, context)');
		expect(source).toContain('slotName: "identifier"');
		expect(source).toContain('nodeType: data.$type');
	});

	it('expands hidden supertype members transitively for wrap child filtering', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeHiddenSupertypeChildrenNodeMap() });

		expect(source).toContain('"_type": new Set(["_primitive_type","primitive_type","u8","bool"])');
	});

	it('matches visible supertypes against concrete child kinds during wrap filtering', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeVisibleSupertypeChildrenNodeMap() });

		expect(source).toContain('"expression": new Set(["identifier"])');
		expect(source).toContain(
			'const members = SUPERTYPE_MEMBERS[allowed] ?? SUPERTYPE_MEMBERS[allowed.startsWith("_") ? allowed.slice(1) : allowed];'
		);
		expect(source).toContain('if (members?.has(kind)) return true;');
		expect(source).toContain('if (stripped !== undefined && members?.has(stripped)) return true;');
	});
});
