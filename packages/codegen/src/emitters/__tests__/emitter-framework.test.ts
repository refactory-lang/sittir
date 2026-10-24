import { collectGeneratedKindEntries } from '../../dsl/symbol-table.ts';
import { layoutNodes, makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../compiler/types.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import {
	AssembledBranch,
	AssembledPattern,
	AssembledSupertype,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import { emitAll } from '../emit.ts';
import { TemplateEmitter } from '../templates.ts';
import { flatten } from '../../compiler/flatten.ts';
import { resolveIrKeys } from '../../compiler/assemble.ts';

function makeBranch(kind: string, label: string, kindEntries: readonly GeneratedKindEntry[]): AssembledBranch {
	const rule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: STRING, value: label }]
	};
	const render = flatten(rule);
	return new AssembledBranch(kind, render, render, { kindEntries });
}

function makeHiddenHelperNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
	const helperRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	const helperRender = flatten(helperRule);
	nodes.set('_assignment_eq', new AssembledBranch('_assignment_eq', { ...helperRender, annotations: { hoisted: true } }, { ...helperRender, annotations: { hoisted: true } }, { kindEntries }));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	for (const [kind, node] of layoutNodes(kindEntries)) nodes.set(kind, node);
	resolveIrKeys(nodes);
	return makeNodeMapWith(nodes);
}

function makeHiddenSupertypeNodeMap(kindEntries: readonly GeneratedKindEntry[]): NodeMap {
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
			{ name: '_export_statement_default_from_arm' },
			{ name: '_export_statement_default_decl_arm' }
		], { kindEntries }) as unknown as AssembledNode
	);
	nodes.set(
		'_export_statement_default_from_arm',
		new AssembledPattern('_export_statement_default_from_arm', { type: PATTERN, value: 'from' }, { kindEntries })
	);
	nodes.set(
		'_export_statement_default_decl_arm',
		new AssembledPattern('_export_statement_default_decl_arm', { type: PATTERN, value: 'decl' }, { kindEntries })
	);
	for (const [kind, node] of layoutNodes(kindEntries)) nodes.set(kind, node);
	resolveIrKeys(nodes);
	return makeNodeMapWith(nodes);
}

describe('loop-driven emitters', () => {
	it('store collection state on the instance, not in module globals', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(() => makeNodeMapWith(new Map()));
		const kindEntries = collectGeneratedKindEntries(generatedIdTables);
		const left = new TemplateEmitter({ grammar: 'rust', nodeMap, kindEntries });
		const right = new TemplateEmitter({ grammar: 'rust', nodeMap, kindEntries });

		left.emitBranch(makeBranch('left_kind', 'left', kindEntries));
		right.emitBranch(makeBranch('right_kind', 'right', kindEntries));

		expect(left.finalize().bodies.has('left_kind')).toBe(true);
		expect(left.finalize().bodies.has('right_kind')).toBe(false);
		expect(right.finalize().bodies.has('right_kind')).toBe(true);
		expect(right.finalize().bodies.has('left_kind')).toBe(false);
	});

	it('emitAll creates fresh loop-driven emitter instances per run', () => {
		const fixture = withGeneratedIdTables((kindEntries) => makeNodeMapWith(new Map(layoutNodes(kindEntries))));

		const first = emitAll({ grammar: 'rust', ...fixture });
		const second = emitAll({ grammar: 'rust', ...fixture });

		expect(first.templates.bodies).not.toBe(second.templates.bodies);
	});

	it('emitAll routes group nodes through the wrap emitter', () => {
		const { wrap } = emitAll({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeHiddenHelperNodeMap(kindEntries))});

		expect(wrap).toContain('export function wrapAssignmentEq(data: T.AssignmentEq, tree: TreeHandle): T.AssignmentEq.Parsed {');
		expect(wrap).toContain('[TSKindId.AssignmentEq]: (d, t) => wrapAssignmentEq(d as unknown as T.AssignmentEq, t),');
	});

	it('emitAll emits no wrap for a supertype node', () => {
		const { wrap } = emitAll({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeHiddenSupertypeNodeMap(kindEntries))});

		expect(wrap).not.toContain('wrapExportStatementDefault');
		expect(wrap).not.toContain("'_export_statement_default'");
	});
});
