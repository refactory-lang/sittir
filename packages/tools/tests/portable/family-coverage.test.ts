import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PortableBuildTable, PortableCondition } from '@sittir/types';
import { FULL_PIPELINE_TIMEOUT } from '../../../codegen/src/__tests__/helpers/timeouts.ts';
import { resolveRoutes, type ReadEntry } from '../../../codegen/src/bindings/routes.ts';
import { compileGrammar } from '../../../codegen/src/compiler/compile.ts';
import { loadGeneratedIdTables } from '../../../codegen/src/compiler/generated-metadata.ts';
import { collectGeneratedKindEntries, findEntryForKindName } from '../../../codegen/src/dsl/symbol-table.ts';
import { collectKindEntries } from '../../../codegen/src/emitters/kind-discriminant.ts';
import { PORTABLE_NODE_MODEL_FILE, grammarPackage, nodeModelPath } from '../../../codegen/src/grammars.ts';
import { familyCoverageOf } from '../../../codegen/src/emitters/overlays/portable/covered.ts';
import { build as pythonTable } from '../../../python/src/portable/table.ts';
import { build as rustTable } from '../../../rust/src/portable/table.ts';
import { build as typescriptTable } from '../../../typescript/src/portable/table.ts';
import { loadInputs } from '../../src/inventory/index.ts';

type Grammar = 'python' | 'rust' | 'typescript';

interface ModelKind {
	readonly read?: readonly { readonly test: readonly PortableCondition[] }[];
	readonly covered?: readonly { readonly path: string; readonly cases: number; readonly refinements: readonly string[]; readonly overlapping?: readonly string[] }[];
}

const tables: Readonly<Record<Grammar, PortableBuildTable>> = { python: pythonTable, rust: rustTable, typescript: typescriptTable };

const modelOf = (grammar: Grammar): Readonly<Record<string, ModelKind>> => JSON.parse(readFileSync(nodeModelPath(grammar, PORTABLE_NODE_MODEL_FILE), 'utf8')).kinds;

const armless = (grammar: Grammar): readonly string[] =>
	Object.entries(tables[grammar].paths)
		.filter(([, row]) => row.arms.length === 0)
		.map(([path]) => path)
		.sort();

const FAMILIES: Readonly<Record<Grammar, readonly (readonly [kind: string, path: string, cases: number, refinements: number])[]>> = {
	python: [
		['augmented_assignment', 'expression.assignment.compound', 13, 13],
		['binary_operator', 'expression.binary', 13, 13],
		['boolean_operator', 'expression.binary.logical', 2, 2],
		['comparison_operator', 'expression.binary', 132, 12],
		['comparison_operator_comparator', 'element.comparator', 11, 11],
		['complex_pattern', 'pattern.complex', 2, 2],
		['unary_operator', 'expression.unary', 3, 3]
	],
	rust: [
		['binary_expression', 'expression.binary', 18, 18],
		['compound_assignment_expr', 'expression.assignment.compound', 10, 10],
		['range_expression_binary', 'expression.range', 3, 3],
		['range_pattern_prefix', 'pattern.range', 2, 2],
		['range_pattern_with_left', 'pattern.range', 4, 3],
		['unary_expression', 'expression.unary', 3, 3]
	],
	typescript: [
		['augmented_assignment_expression', 'expression.assignment.compound', 15, 15],
		['for_initializer_let_const_kind', 'declaration.variable', 2, 2],
		['lexical_declaration', 'declaration.variable', 2, 2],
		['unary_expression', 'expression.unary', 7, 7],
		['update_expression_postfix', 'expression.update', 2, 2],
		['update_expression_prefix', 'expression.update', 2, 2]
	]
};

describe('a family path no build takes', () => {
	it.each(Object.keys(FAMILIES) as Grammar[])(
		'%s: a kind no arm of a family path builds is covered when one refinement holds each of its cases, and every kind that reads as an armless path is',
		async (grammar) => {
			const covered = Object.entries(modelOf(grammar)).flatMap(([kind, entry]) => (entry.covered ?? []).map((family) => ({ kind, ...family })));
			expect(covered.map(({ kind, path, cases, refinements }) => [kind, path, cases, refinements.length])).toEqual(FAMILIES[grammar]);
			expect(covered.filter(({ overlapping }) => overlapping !== undefined)).toEqual([]);
			const entries = collectGeneratedKindEntries(await loadGeneratedIdTables(grammar));
			expect(covered.filter(({ kind }) => findEntryForKindName(entries, kind) === undefined)).toEqual([]);
			expect(covered.filter(({ kind, path }) => tables[grammar].paths[path]!.arms.some((arm) => arm.kind === findEntryForKindName(entries, kind)!.id))).toEqual([]);
			expect(armless(grammar).filter((path) => !covered.some((family) => family.path === path))).toEqual([]);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		'is refused when a value of its kind has no refinement',
		async () => {
			const [input] = await loadInputs(['python']);
			const generatedIdTables = await loadGeneratedIdTables('python');
			const { nodeMap } = await compileGrammar({ package: grammarPackage('python'), generatedIdTables });
			const routes = resolveRoutes(input!);
			const model = modelOf('python');
			const tests = new Map<ReadEntry, readonly PortableCondition[]>([...routes.readEntries].flatMap(([kind, list]) => list.map((entry, i) => [entry, model[kind]!.read![i]!.test] as const)));
			const readEntries = new Map([...routes.readEntries].map(([kind, list]) => [kind, kind === 'binary_operator' ? list.filter((entry) => entry.vocab !== 'expression.binary.arithmetic.add') : list]));
			expect(() => familyCoverageOf({ routes: { ...routes, readEntries }, nodeMap, table: pythonTable, readTest: (entry) => tests.get(entry)!, kindEntries: collectKindEntries(nodeMap, generatedIdTables) })).toThrow(
				'portable-family-uncovered: binary_operator reads as expression.binary, a path no build takes, when no refinement of it holds: binary_operator { operator: "+" }'
			);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
