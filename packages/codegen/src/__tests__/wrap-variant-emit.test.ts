import { describe, expect, it } from 'vitest';
import { emitWrap } from '../emitters/wrap.ts';
import {
	AssembledGroup,
	AssembledPattern,
	AssembledPolymorph,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { ChoiceRule, PolymorphRule, SeqRule } from '../compiler/rule.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

function makeOverridePolymorphNodeMap() {
	const doubleRule: SeqRule = { type: 'seq', members: [{ type: 'symbol', name: 'string_double' }] };
	const singleRule: SeqRule = { type: 'seq', members: [{ type: 'symbol', name: 'string_single' }] };
	const parentRule: PolymorphRule = {
		type: 'polymorph',
		source: 'override',
		forms: [
			{ name: 'double', content: doubleRule, discriminatorKinds: ['string_double'] },
			{ name: 'single', content: singleRule, discriminatorKinds: ['string_single'] }
		]
	};
	const doubleForm = new AssembledGroup('string__form_double', doubleRule, doubleRule, {
		name: 'double',
		parentKind: 'string'
	});
	const singleForm = new AssembledGroup('string__form_single', singleRule, singleRule, {
		name: 'single',
		parentKind: 'string'
	});
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'string',
		new AssembledPolymorph('string', parentRule, [doubleForm, singleForm], {
			source: 'override',
			variantChildKinds: ['string_double', 'string_single']
		})
	);
	nodes.set('string_double', new AssembledPattern('string_double', { type: 'pattern', value: '".*"' }));
	nodes.set('string_single', new AssembledPattern('string_single', { type: 'pattern', value: "'.*'" }));
	return makeNodeMapWith(nodes, new Set(['string__form_double', 'string__form_single']));
}

function makePromotedPolymorphNodeMap() {
	const leftRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'field', name: 'left', content: { type: 'symbol', name: 'identifier' } }]
	};
	const rightRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const parentRule: ChoiceRule = {
		type: 'choice',
		members: [{ type: 'symbol', name: 'expression__form_left' }, { type: 'symbol', name: 'expression__form_right' }]
	};
	const leftForm = new AssembledGroup('expression__form_left', leftRule, leftRule, {
		name: 'left',
		parentKind: 'expression'
	});
	const rightForm = new AssembledGroup('expression__form_right', rightRule, rightRule, {
		name: 'right',
		parentKind: 'expression'
	});
	const nodes = new Map<string, AssembledNode>();
	nodes.set('expression', new AssembledPolymorph('expression', parentRule, [leftForm, rightForm]));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes, new Set(['expression__form_left', 'expression__form_right']));
}

describe('wrap emitter — polymorph variant stamping', () => {
	it('emits override-child variant inference in wrapNode', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeOverridePolymorphNodeMap() });

		expect(wrapSrc).toContain('const _variantTable: Record<string, _WrapVariantDescriptor> =');
		expect(wrapSrc).toContain('"string": {');
		expect(wrapSrc).toContain('"source": "override"');
		expect(wrapSrc).toContain('"string_double": "double"');
		expect(wrapSrc).toContain('const variant = _resolveVariant(canonical ?? rawType, data);');
		expect(wrapSrc).toContain('data = { ...data, $variant: variant } as _NodeData;');
	});

	it('treats unnamed children like field presence for promoted polymorphs', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makePromotedPolymorphNodeMap() });

		expect(wrapSrc).toContain('"expression": {');
		expect(wrapSrc).toContain('"source": "promoted"');
		expect(wrapSrc).toContain('"left": [');
		expect(wrapSrc).toContain('"_left"');
		expect(wrapSrc).toContain('"right": [');
		expect(wrapSrc).toContain('"$children"');
	});

	it('emits unnamed slot storage and access through the shared slot path', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makePromotedPolymorphNodeMap() });

		expect(wrapSrc).toContain('$children: _filterWrapChildrenByKind((data as any).$children, ["identifier"]),');
		expect(wrapSrc).toContain('children() { return drillInAll<');
		expect(wrapSrc).toContain('this.$children as readonly T.Identifier[] | undefined, tree');
	});
});
