import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../emitters/wrap.ts';
import {
	AssembledGroup,
	AssembledPattern,
	AssembledPolymorph,
	AssembledSupertype,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { ChoiceRule, PolymorphRule, SeqRule } from '../compiler/rule.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

const wrapEmitterSource = readFileSync(new URL('../emitters/wrap.ts', import.meta.url), 'utf8');

function extractFunctionBody(source: string, functionName: string): string {
	const start = source.indexOf(`function ${functionName}`);
	if (start === -1) throw new Error(`Missing function ${functionName}`);
	const end = source.indexOf('\n/**\n * Emit the inline `$with: { ... }` property for a wrap function literal.', start);
	if (end === -1) throw new Error(`Missing end marker for function ${functionName}`);
	const fnSource = source.slice(start, end);
	const bodyStart = fnSource.indexOf('{');
	return fnSource.slice(bodyStart + 1).trimEnd();
}

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

function makeHiddenGroupNodeMap() {
	const helperRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'field', name: 'right', content: { type: 'symbol', name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('_assignment_eq', new AssembledGroup('_assignment_eq', helperRule, helperRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeNoFactoryHiddenGroupNodeMap() {
	const nodeMap = makeHiddenGroupNodeMap();
	const helper = nodeMap.nodes.get('_assignment_eq');
	if (!helper || helper.modelType !== 'group') throw new Error('Missing hidden helper group');
	Object.defineProperty(helper, 'rawFactoryName', { value: undefined });
	return nodeMap;
}

function makeTransparentHiddenGroupNodeMap() {
	const helperRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('_export_statement_default', new AssembledGroup('_export_statement_default', helperRule, helperRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeTransparentHiddenSupertypeNodeMap() {
	const supertypeRule: ChoiceRule = {
		type: 'choice',
		members: [
			{ type: 'symbol', name: '_export_statement_default_from_arm' },
			{ type: 'symbol', name: '_export_statement_default_decl_arm' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'_export_statement_default',
		new AssembledSupertype('_export_statement_default', supertypeRule, [
			'_export_statement_default_from_arm',
			'_export_statement_default_decl_arm'
		]) as unknown as AssembledNode
	);
	nodes.set(
		'_export_statement_default_from_arm',
		new AssembledPattern('_export_statement_default_from_arm', { type: 'pattern', value: 'from' })
	);
	nodes.set(
		'_export_statement_default_decl_arm',
		new AssembledPattern('_export_statement_default_decl_arm', { type: 'pattern', value: 'decl' })
	);
	return makeNodeMapWith(nodes);
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

		expect(wrapSrc).toContain(
			'$children: normalizeSingularWrapSlot(_filterWrapChildrenByKind((data as any).$children, ["identifier"]), "children", false, (data as any).$type),'
		);
		expect(wrapSrc).toContain('children() { return drillIn<T.Identifier | undefined>(');
		expect(wrapSrc).toContain('this.$children, tree');
	});

	it('keeps override polymorph parent children singular on the wrap surface', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeOverridePolymorphNodeMap() });

		expect(wrapSrc).toContain(
			'$children: normalizeSingularWrapSlot(_filterWrapChildrenByKind((data as any).$children, ["string_double","string_single"]), "children", false, (data as any).$type),'
		);
		expect(wrapSrc).toContain('children() { return drillIn<(T.StringDouble | T.StringSingle) | undefined>(');
	});

	it('limits named-slot filtering to separator-carrying verbatim slots', () => {
		expect(wrapEmitterSource).toContain('const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);');
		expect(wrapEmitterSource).toContain("storageInfo.kind === 'verbatim' && hasSeparatorMetadata");
	});

	it('routes unnamed children through the shared slot resolver entrypoint', () => {
		const emitFieldCarryingWrapBody = extractFunctionBody(wrapEmitterSource, 'emitFieldCarryingWrap');

		expect(wrapEmitterSource).not.toContain('function resolveChildrenStoreExpr');
		expect(wrapEmitterSource).not.toContain('function resolveChildrenAccessorBody');
		expect(emitFieldCarryingWrapBody.match(/resolveSlotDrillExprs\(/g)?.length).toBe(4);
		expect(emitFieldCarryingWrapBody).not.toMatch(/resolve[A-Za-z0-9_]*Children[A-Za-z0-9_]*\(/);
	});

	it('keeps wrap-kind filtering aware of alias-target kinds', () => {
		expect(wrapEmitterSource).toContain('const canonical = _aliasTargetToSource[kind];');
		expect(wrapEmitterSource).toContain('allowedStripped === canonical');
	});

	it('passes scalar singular values through wrap-kind filtering', () => {
		expect(wrapEmitterSource).toContain('if (kind === undefined) return value;');
	});

	it('emits wrap accessors and dispatch for hidden helper groups', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeHiddenGroupNodeMap() });

		expect(wrapSrc).toContain("export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {");
		expect(wrapSrc).toContain('right() { return drillIn<');
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
		expect(wrapSrc).toContain("'assignment_eq': '_assignment_eq'");
	});

	it('keeps hidden alias-source helper wraps even without parser-symbol ids', () => {
		const wrapSrc = emitWrap({
			grammar: 'synth',
			nodeMap: makeHiddenGroupNodeMap(),
			kindEntries: [{ kind: 'identifier', member: 'Identifier', id: 1 }]
		});

		expect(wrapSrc).toContain("export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {");
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
	});

	it('emits hidden helper wraps even when no factory surface exists', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeNoFactoryHiddenGroupNodeMap() });

		expect(wrapSrc).toContain("export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {");
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
		expect(wrapSrc).not.toContain('    $with: {},');
	});

	it('flattens transparent hidden helper groups to their single wrapped child', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeTransparentHiddenGroupNodeMap() });

		expect(wrapSrc).toContain("export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {");
		expect(wrapSrc).toContain('return drillIn<T.Identifier>(');
		expect(wrapSrc).toContain("'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),");
		expect(wrapSrc).not.toContain('export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {\n  return withMethods({');
	});

	it('keeps synthesized canonical alias-source helpers on the wrap surface', () => {
		const wrapSrc = emitWrap({
			grammar: 'synth',
			nodeMap: makeTransparentHiddenGroupNodeMap(),
			synthesizedKinds: new Set(['_export_statement_default'])
		});

		expect(wrapSrc).toContain("export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {");
		expect(wrapSrc).toContain("'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),");
	});

	it('emits transparent wraps for hidden supertypes', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeTransparentHiddenSupertypeNodeMap() });

		expect(wrapSrc).toContain("export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {");
		expect(wrapSrc).toContain('return drillIn<T.ExportStatementDefault>(');
		expect(wrapSrc).toContain("'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),");
	});
});
