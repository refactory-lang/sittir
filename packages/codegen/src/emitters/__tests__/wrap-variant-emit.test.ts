import { FIELD, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import {
	AssembledBranch,
	AbstractAssembledCompound,
	AssembledPattern,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';

function makeHiddenGroupNodeMap() {
	const helperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	const helperRender = flatten(helperRule);
	nodes.set('_assignment_eq', new AssembledBranch('_assignment_eq', { ...helperRender, annotations: { hoisted: true } }, { ...helperRender, annotations: { hoisted: true } }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeNoFactoryHiddenGroupNodeMap() {
	const nodeMap = makeHiddenGroupNodeMap();
	const helper = nodeMap.nodes.get('_assignment_eq');
	if (!helper || !(helper instanceof AbstractAssembledCompound) || !helper.seated)
		throw new Error('Missing hidden helper group');
	Object.defineProperty(helper, 'rawFactoryName', { value: undefined });
	return nodeMap;
}

function makeTransparentHiddenGroupNodeMap() {
	const helperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	const helperRender = flatten(helperRule);
	nodes.set(
		'_export_statement_default',
		new AssembledBranch('_export_statement_default', { ...helperRender, annotations: { hoisted: true } }, { ...helperRender, annotations: { hoisted: true } })
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('wrap emitter — polymorph variant stamping', () => {
	it('emits wrap accessors and dispatch for hidden helper groups', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeHiddenGroupNodeMap() });

		expect(wrapSrc).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
		expect(wrapSrc).toContain('right() { return hydrateSlot<');
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
		// A hidden helper visible only through its own alias name is MERGED
		// into that alias symbol by tree-sitter — one id serves both
		// spellings, and the native read's KIND_NAMES lookup already yields
		// the canonical `_assignment_eq`; a display->canonical remap entry
		// would remap the node to itself. The dispatch entry above is the
		// whole runtime surface such a kind needs.
		expect(wrapSrc).not.toContain("'assignment_eq': '_assignment_eq'");
	});

	it('keeps hidden alias-source helper wraps even without parser-symbol ids', () => {
		const wrapSrc = emitWrap({
			grammar: 'synth',
			nodeMap: makeHiddenGroupNodeMap(),
			kindEntries: [{ kind: 'identifier', member: 'Identifier', id: 1 }]
		});

		expect(wrapSrc).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
		// With a catalog present the dispatch table is numeric-keyed. A kind
		// the catalog cannot resolve (even through findKindEntry's alias
		// chain) has no parser-issued id to dispatch on — a
		// `TSKindId.<typeName>` key would reference a nonexistent enum
		// member (the CloseParen/Oror breakage class), so no row is
		// emitted: the rescued wrap FUNCTION is the whole runtime surface.
		expect(wrapSrc).not.toContain('[TSKindId.AssignmentEq]');
	});

	it('emits no wrap for a hoisted helper without a factory surface, like any other compound', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeNoFactoryHiddenGroupNodeMap() });

		expect(wrapSrc).not.toContain('export function wrapAssignmentEq(');
	});

	it('flattens transparent hidden helper groups to their single wrapped child', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeTransparentHiddenGroupNodeMap() });

		expect(wrapSrc).toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {'
		);
		expect(wrapSrc).toContain('return hydrateSlot<T.Identifier>(');
		expect(wrapSrc).toContain(
			"'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),"
		);
		expect(wrapSrc).not.toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {\n  return withMethods({'
		);
	});

	it('keeps synthesized canonical alias-source helpers on the wrap surface', () => {
		const wrapSrc = emitWrap({
			grammar: 'synth',
			nodeMap: makeTransparentHiddenGroupNodeMap(),
			synthesizedKinds: new Set(['_export_statement_default'])
		});

		expect(wrapSrc).toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {'
		);
		expect(wrapSrc).toContain(
			"'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),"
		);
	});

});
