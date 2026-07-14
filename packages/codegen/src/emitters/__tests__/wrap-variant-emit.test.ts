import { CHOICE, FIELD, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import {
	AssembledGroup,
	AssembledPattern,
	AssembledSupertype,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

const wrapEmitterSource = readFileSync(new URL('../wrap.ts', import.meta.url), 'utf8');

function extractFunctionBody(source: string, functionName: string): string {
	const start = source.indexOf(`function ${functionName}`);
	if (start === -1) throw new Error(`Missing function ${functionName}`);
	// Bound the extraction at the NEXT top-level `function` declaration
	// (generic — works for any of wrap.ts's consecutively-declared helpers,
	// e.g. emitFieldStorageLines/emitFieldAccessorLines/emitFieldCarryingWrap),
	// falling back to the doc-comment marker that has always immediately
	// preceded `emitInlineWithProperty` (the function after
	// emitFieldCarryingWrap) in case there is no further `function` in source.
	const nextFunctionMarker = source.indexOf('\nfunction ', start + 1);
	const docCommentMarker = source.indexOf(
		'\n/**\n * Emit the inline `$with: { ... }` property for a wrap function literal.',
		start
	);
	const candidates = [nextFunctionMarker, docCommentMarker].filter((i) => i !== -1);
	if (candidates.length === 0) throw new Error(`Missing end marker for function ${functionName}`);
	const end = Math.min(...candidates);
	const fnSource = source.slice(start, end);
	const bodyStart = fnSource.indexOf('{');
	return fnSource.slice(bodyStart + 1).trimEnd();
}

function makeHiddenGroupNodeMap() {
	const helperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'_assignment_eq',
		new AssembledGroup('_assignment_eq', helperRule, deleteWrapper(helperRule), deleteWrapper(helperRule))
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
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
	const helperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'_export_statement_default',
		new AssembledGroup('_export_statement_default', helperRule, deleteWrapper(helperRule), deleteWrapper(helperRule))
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeTransparentHiddenSupertypeNodeMap() {
	const supertypeRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: '_export_statement_default_from_arm' },
			{ type: SYMBOL, name: '_export_statement_default_decl_arm' }
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
		new AssembledPattern('_export_statement_default_from_arm', { type: PATTERN, value: 'from' })
	);
	nodes.set(
		'_export_statement_default_decl_arm',
		new AssembledPattern('_export_statement_default_decl_arm', { type: PATTERN, value: 'decl' })
	);
	return makeNodeMapWith(nodes);
}

describe('wrap emitter — polymorph variant stamping', () => {
	it('limits named-slot filtering to separator-carrying verbatim slots', () => {
		expect(wrapEmitterSource).toContain(
			'const hasSeparatorMetadata = f.values.some((value) => value.separator !== undefined);'
		);
		expect(wrapEmitterSource).toContain("storageInfo.kind === 'verbatim' && hasSeparatorMetadata");
	});

	it('routes unnamed children through the shared slot resolver entrypoint', () => {
		const emitFieldCarryingWrapBody = extractFunctionBody(wrapEmitterSource, 'emitFieldCarryingWrap');

		expect(wrapEmitterSource).not.toContain('function resolveChildrenStoreExpr');
		expect(wrapEmitterSource).not.toContain('function resolveChildrenAccessorBody');
		// Named-field storage/accessor drilling was extracted into
		// emitFieldStorageLines/emitFieldAccessorLines (separator-as-slot Bug B
		// follow-up — shared with emitSeparatedListWrap's multi-field case), so
		// emitFieldCarryingWrap's OWN body now calls resolveSlotDrillExprs only
		// for the unnamed-children slot (storage + accessor = 2), while the two
		// extracted helpers each make their own single shared-resolver call —
		// still ONE entrypoint (resolveSlotDrillExprs) for every slot, just
		// spread across the 3 functions that now share it instead of 1.
		expect(emitFieldCarryingWrapBody.match(/resolveSlotDrillExprs\(/g)?.length).toBe(2);
		expect(emitFieldCarryingWrapBody).not.toMatch(/resolve[A-Za-z0-9_]*Children[A-Za-z0-9_]*\(/);
		const emitFieldStorageLinesBody = extractFunctionBody(wrapEmitterSource, 'emitFieldStorageLines');
		const emitFieldAccessorLinesBody = extractFunctionBody(wrapEmitterSource, 'emitFieldAccessorLines');
		expect(emitFieldStorageLinesBody.match(/resolveSlotDrillExprs\(/g)?.length).toBe(1);
		expect(emitFieldAccessorLinesBody.match(/resolveSlotDrillExprs\(/g)?.length).toBe(1);
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

		expect(wrapSrc).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
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

		expect(wrapSrc).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
	});

	it('emits hidden helper wraps even when no factory surface exists', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeNoFactoryHiddenGroupNodeMap() });

		expect(wrapSrc).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
		expect(wrapSrc).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
		expect(wrapSrc).not.toContain('    $with: {},');
	});

	it('flattens transparent hidden helper groups to their single wrapped child', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeTransparentHiddenGroupNodeMap() });

		expect(wrapSrc).toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault, tree: TreeHandle) {'
		);
		expect(wrapSrc).toContain('return drillIn<T.Identifier>(');
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

	it('emits transparent wraps for hidden supertypes', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeTransparentHiddenSupertypeNodeMap() });

		expect(wrapSrc).toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault & { readonly $other?: T.ExportStatementDefault | readonly T.ExportStatementDefault[]; }, tree: TreeHandle) {'
		);
		expect(wrapSrc).toContain('return drillIn<T.ExportStatementDefault>(');
		expect(wrapSrc).toContain(
			"'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),"
		);
	});
});
