import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../compiler/types.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import {
	AssembledBranch,
	AssembledGroup,
	AssembledPattern,
	AssembledSupertype,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import { emitAll } from '../emit.ts';
import { TemplateEmitter } from '../templates.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

function makeNodeMap(): NodeMap {
	return {
		name: 'test',
		nodes: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		rules: {},
		externals: new Set(),
		word: undefined,
		polymorphFormKinds: new Set()
	} as unknown as NodeMap;
}

function makeBranch(kind: string, label: string): AssembledBranch {
	const rule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: STRING, value: label }]
	};
	return new AssembledBranch(kind, rule, deleteWrapper(rule), deleteWrapper(rule));
}

function makeHiddenHelperNodeMap(): NodeMap {
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
	return {
		...makeNodeMap(),
		nodes
	} as NodeMap;
}

function makeHiddenSupertypeNodeMap(): NodeMap {
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
	return {
		...makeNodeMap(),
		nodes
	} as NodeMap;
}

describe('loop-driven emitters', () => {
	it('store collection state on the instance, not in module globals', () => {
		const nodeMap = makeNodeMap();
		const left = new TemplateEmitter({ grammar: 'rust', nodeMap });
		const right = new TemplateEmitter({ grammar: 'rust', nodeMap });

		left.emitBranch(makeBranch('left_kind', 'left'));
		right.emitBranch(makeBranch('right_kind', 'right'));

		expect(left.finalize().bodies.has('left_kind')).toBe(true);
		expect(left.finalize().bodies.has('right_kind')).toBe(false);
		expect(right.finalize().bodies.has('right_kind')).toBe(true);
		expect(right.finalize().bodies.has('left_kind')).toBe(false);
	});

	it('emitAll creates fresh loop-driven emitter instances per run', () => {
		const nodeMap = {
			name: 'test',
			nodes: new Map(),
			signatures: { signatures: new Map() },
			derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
			rules: {},
			externals: new Set(),
			word: undefined,
			polymorphFormKinds: new Set()
		} as any;

		const first = emitAll({ grammar: 'rust', nodeMap });
		const second = emitAll({ grammar: 'rust', nodeMap });

		expect(first.jinjaTemplates.bodies).not.toBe(second.jinjaTemplates.bodies);
	});

	it('emitAll routes group nodes through the wrap emitter', () => {
		const { wrap } = emitAll({ grammar: 'synth', nodeMap: makeHiddenHelperNodeMap() });

		expect(wrap).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle) {');
		expect(wrap).toContain("'_assignment_eq': (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),");
	});

	it('emitAll routes supertype nodes through the wrap emitter', () => {
		const { wrap } = emitAll({ grammar: 'synth', nodeMap: makeHiddenSupertypeNodeMap() });

		expect(wrap).toContain(
			'export function wrapExportStatementDefault(data: T.ExportStatementDefault & { readonly $other?: T.ExportStatementDefault | readonly T.ExportStatementDefault[]; }, tree: TreeHandle) {'
		);
		expect(wrap).toContain(
			"'_export_statement_default': (d, t) => wrapExportStatementDefault(d as unknown as T.ExportStatementDefault, t),"
		);
	});
});
