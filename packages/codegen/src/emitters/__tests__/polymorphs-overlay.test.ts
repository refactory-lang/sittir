import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { execFileSync } from 'node:child_process';
import { stampIrSurface } from '../../compiler/model/ir-surface.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { stampAutomaticVariants } from '../../dsl/automatic-variants.ts';
import { predictedSymbolSourceOf } from '../../dsl/symbol-table.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import type { NodeMapWithIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { builtTypeSurfaceOf } from '../factories.ts';
import { collectPolymorphWires, seatedRowsOf } from '../overlays/polymorphs.ts';
import { emitTables } from '../../__tests__/helpers/emit-tables.ts';
import { listRestParamType } from '../shared.ts';
import { collectKindEntries } from '../kind-discriminant.ts';

// ---------------------------------------------------------------------------
// Synthetic grammar covering the sub-factory shapes exercised here:
// `comment` — envelope, sole choice slot, two kind arms (residual ∅,
// positional parent); `logic` — branch, literal arms with a required
// residual; `annotated` — branch, literal arms with an all-optional
// residual. `root` keeps every rule reachable from the first-declared rule
// (`link` only keeps rules reachable from it).
// ---------------------------------------------------------------------------

function labelArms(rules: Record<string, Rule<'evaluate'>>): Record<string, Rule<'evaluate'>> {
	const stamped = { ...rules } as Record<string, Rule>;
	stampAutomaticVariants(
		stamped,
		new Set(),
		new Set(),
		new Set(),
		predictedSymbolSourceOf({ rules: stamped as never, externals: [], inline: [], supertypes: [], extras: [], word: null })
	);
	return stamped as Record<string, Rule<'evaluate'>>;
}

function assembledNodeMap(rules: Record<string, Rule<'evaluate'>>, generatedIdTables?: GeneratedIdTables): NodeMapWithIdTables {
	const raw: RawGrammar = {
		name: 'synth',
		fileTypes: [],
		rules: labelArms(rules),
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
	return assemblePredicted(raw, generatedIdTables);
}

function seatedRows({ nodeMap, generatedIdTables }: NodeMapWithIdTables, kind: string): { readonly buildArgs: string; readonly looseArgs: string } {
	const node = nodeMap.nodes.get(kind)!;
	const rows = seatedRowsOf(node, collectPolymorphWires(nodeMap, { silent: true }), builtTypeSurfaceOf(node, nodeMap, collectKindEntries(nodeMap, generatedIdTables))!);
	if (rows === undefined) throw new Error(`'${kind}' has no seated rows`);
	return rows;
}

function polymorphNodeMap(): NodeMapWithIdTables {
	return assembledNodeMap({
		root: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment' },
				{ type: SYMBOL, name: 'logic' },
				{ type: SYMBOL, name: 'annotated' }
			]
		},
		comment: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'comment_doc' },
				{ type: SYMBOL, name: 'comment_plain' }
			]
		},
		comment_doc: {
			type: SEQ,
			members: [
				{ type: STRING, value: '///' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		},
		comment_plain: {
			type: SEQ,
			members: [
				{ type: STRING, value: '//' },
				{ type: FIELD, name: 'text', content: { type: PATTERN, value: '.*' } }
			]
		},
		logic: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'op',
					content: {
						type: CHOICE,
						members: [
							{ type: STRING, value: 'and', annotations: { variant: 'and', variantOf: 'logic' } },
							{ type: STRING, value: 'or', annotations: { variant: 'or', variantOf: 'logic' } }
						]
					}
				},
				{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		annotated: {
			type: SEQ,
			members: [
				{
					type: OPTIONAL,
					content: { type: FIELD, name: 'note', content: { type: SYMBOL, name: 'identifier' } }
				},
				{
					type: OPTIONAL,
					content: {
						type: FIELD,
						name: 'mark',
						content: {
							type: CHOICE,
							members: [
								{ type: STRING, value: 'plus', annotations: { variant: 'plus', variantOf: 'annotated' } },
								{ type: STRING, value: 'minus', annotations: { variant: 'minus', variantOf: 'annotated' } }
							]
						}
					}
				}
			]
		},
		identifier: { type: PATTERN, value: '[a-z]+' }
	});
}

function parameterlessArmNodeMap(): NodeMapWithIdTables {
	return assembledNodeMap({
		root: { type: SYMBOL, name: 'pair' },
		pair: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'first', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'content',
					content: {
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: 'kw_self', annotations: { variant: 'kw_self', variantOf: 'pair' } },
							{ type: SYMBOL, name: 'kw_super', annotations: { variant: 'kw_super', variantOf: 'pair' } }
						]
					}
				}
			]
		},
		kw_self: { type: STRING, value: 'self' },
		kw_super: { type: STRING, value: 'super' },
		identifier: { type: PATTERN, value: '[a-z]+' }
	});
}

function ambiguousNodeMap(): NodeMapWithIdTables {
	return assembledNodeMap({
		twice: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'first', annotations: { variant: 'same', variantOf: 'twice' } },
				{ type: SYMBOL, name: 'second', annotations: { variant: 'same', variantOf: 'twice' } }
			]
		},
		first: { type: PATTERN, value: '[a-z]+' },
		second: { type: PATTERN, value: '[0-9]+' }
	});
}

describe('the builder table wiring', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('emits one combinator per sub-factory, applied once over the table either engine passes in', () => {
		const { nodeMap } = polymorphNodeMap();
		const { wiring, combinators } = emitTables(nodeMap);

		expect(wiring).toContain("import * as F from './raw.js';");
		expect(wiring).toContain("import * as K from './combinators.js';");
		expect(wiring).toContain('export function buildTable<Table extends AnyTable>($table: Table): Ir<Table> {');

		expect(combinators).toContain(
			'export const comment$doc = <PF extends (value: never) => unknown, CF extends (...args: never[]) => unknown>(parent: PF, child: CF) =>'
		);
		expect(wiring).toContain("const comment$doc: Routes<Table>['comment$doc'] = K.comment$doc(F.buildComment, $at('buildCommentDoc'));");
		expect(wiring).toContain(
			"const comment: Routes<Table>['comment'] = Object.freeze(Object.assign(delegate($at('buildComment')), { doc: comment$doc, plain: comment$plain } as const));"
		);

		expect(combinators).toContain('export const logic$and = <PF extends (config: never) => unknown>(parent: PF, value: unknown) =>');
		expect(wiring).toContain("const logic$and: Routes<Table>['logic$and'] = K.logic$and($at('buildLogic'), TSKindId.AndKeyword);");
		expect(wiring).toContain("const logic$or: Routes<Table>['logic$or'] = K.logic$or($at('buildLogic'), TSKindId.OrKeyword);");

		expect(wiring).toContain("const annotated$plus: Routes<Table>['annotated$plus'] = K.annotated$plus($at('buildAnnotated'), TSKindId.PlusKeyword);");
	});

	it('seats a keyword arm\'s stored text instead of asking the caller for the keyword child', () => {
		const { wiring, combinators } = emitTables(parameterlessArmNodeMap().nodeMap);

		expect(combinators).toContain("\t(config: OmitEach<ArgsOf<PF>[0], 'content'>, options?: OptionsArg<PF>): ReturnType<PF> =>");
		expect(combinators).toContain('{ ...config, content: value }');
		expect(wiring).toContain("const pair$kwSelf: Routes<Table>['pair$kwSelf'] = K.pair$kwSelf($at('buildPair'), TSKindId.KwSelf);");
		expect(combinators).not.toContain('_c(child)');
	});

	it('warns of a skipped sub-factory on stderr: the generated API omits it', () => {
		const { nodeMap } = ambiguousNodeMap();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		emitTables(nodeMap);

		expect(warn).toHaveBeenCalledWith(
			'[codegen] twice: sub-factory same skipped (ambiguous): first, second'
		);
	});
});

describe('a single hoisted group flattens onto its parent', () => {
	it('wraps strict with a both-or-neither config and keeps the base spread first', () => {
		const { nodeMap, generatedIdTables } = assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'try' }, { type: SYMBOL, name: 'clause' }] },
			clause: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'catch' },
					{ type: OPTIONAL, content: { type: SYMBOL, name: 'clause_group' } },
					{ type: FIELD, name: 'body', content: { type: PATTERN, value: '.+' } }
				]
			},
			clause_group: {
				type: SEQ,
				members: [
					{ type: STRING, value: '(' },
					{ type: FIELD, name: 'parameter', content: { type: PATTERN, value: '[a-z]+' } },
					{ type: OPTIONAL, content: { type: FIELD, name: 'type', content: { type: PATTERN, value: '[A-Z]+' } } },
					{ type: STRING, value: ')' }
				],
				annotations: { hoisted: true }
			}
		});
		const seatKey = nodeMap.nodes.get('clause')!.slots.find((s) => s.values.length === 1)!.propertyName;
		const { wiring, combinators, strict } = emitTables(nodeMap);
		expect(combinators).toContain(`export const clause$flatten$${seatKey} =`);
		expect(strict).toContain(
			`export const clause$seated: Seat<T.Clause.BuildArgs, ReturnType<typeof F.buildClause>> = K.clause$flatten$${seatKey}(F.buildClause, F.buildClauseGroup);`
		);
		const groupKeys = `OmitEach<NonNullable<T.ClauseGroup.Config>, '$type'>`;
		const { buildArgs } = seatedRows({ nodeMap, generatedIdTables }, 'clause');
		expect(buildArgs).toContain(`WithoutGroup<`);
		expect(buildArgs).toContain(`, ${groupKeys}> | (OmitEach<NonNullable<`);
		expect(buildArgs).toContain(`, '${seatKey}'> & (T.ClauseGroup.BuildArgs[0] | NoneOf<${groupKeys}>))`);
		expect(wiring).toContain("const clause: Routes<Table>['clause'] = $at('clause$seated');");
	});
});

describe('a repeated hoisted group seats as an array of its configs', () => {
	it('builds each element from its config and keeps built elements', () => {
		const { nodeMap, generatedIdTables } = assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'cmp' }, { type: SYMBOL, name: 'comparison' }] },
			comparison: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'left', content: { type: PATTERN, value: '[a-z]+' } },
					{
						type: FIELD,
						name: 'comparators',
						content: { type: REPEAT1, content: { type: SYMBOL, name: 'comparison_comparator' } }
					}
				]
			},
			comparison_comparator: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'operators',
						content: { type: CHOICE, members: [{ type: STRING, value: '<' }, { type: STRING, value: '==' }] }
					},
					{ type: FIELD, name: 'right', content: { type: PATTERN, value: '[a-z]+' } }
				],
				annotations: { hoisted: true }
			}
		});
		const { wiring, combinators, strict } = emitTables(nodeMap);
		expect(combinators).toContain('export const comparison$comparators =');
		expect(combinators).toContain("comparators: seat.map((e) => (isConfig(e) ? _c(child)(e) : e))");
		expect(strict).toContain(
			'export const comparison$seated: Seat<T.Comparison.BuildArgs, ReturnType<typeof F.buildComparison>> = K.comparison$comparators(F.buildComparison, F.buildComparisonComparator);'
		);
		expect(wiring).toContain("const comparison: Routes<Table>['comparison'] = $at('comparison$seated');");
		expect(seatedRows({ nodeMap, generatedIdTables }, 'comparison').buildArgs).toContain('{ comparators: ReadonlyArray<T.ComparisonComparator.BuildArgs[0]');
	});
});

describe('a repeated hoisted group on a spread-shaped parent seats through the rest parameters', () => {
	it('maps each rest argument through the group builder when it is a config', () => {
		const { nodeMap } = assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'u' }, { type: SYMBOL, name: 'union' }] },
			union: {
				type: SEQ,
				members: [
					{ type: STRING, value: '(' },
					{
						type: FIELD,
						name: 'patterns',
						content: {
							type: REPEAT1,
							content: { type: CHOICE, members: [{ type: SYMBOL, name: 'union_negative' }, { type: SYMBOL, name: 'literal' }] }
						}
					},
					{ type: STRING, value: ')' }
				]
			},
			union_negative: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'sign', content: { type: CHOICE, members: [{ type: STRING, value: '-' }, { type: STRING, value: '+' }] } },
					{ type: FIELD, name: 'content', content: { type: SYMBOL, name: 'literal' } }
				],
				annotations: { hoisted: true }
			},
			literal: { type: PATTERN, value: '[0-9]+' }
		});
		const { combinators } = emitTables(nodeMap);
		expect(combinators).toContain('export const union$patterns =');
		expect(combinators).toContain('_s<ReturnType<PF>>(parent)(...args.map((e) => (isConfig(e) ? _c(child)(e) : e)))');
	});
});

describe('a mount route carries the seats of its own parent', () => {
	it('builds the mount on the seated parent, not the raw factory', () => {
		const { nodeMap } = assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'c' }, { type: SYMBOL, name: 'clause' }] },
			clause: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'patterns', content: { type: SYMBOL, name: 'clause_patterns' } },
					{
						type: FIELD,
						name: 'body',
						content: {
							type: CHOICE,
							members: [
								{ type: SYMBOL, name: 'clause_block', annotations: { variant: 'block', variantOf: 'clause' } },
								{ type: SYMBOL, name: 'literal', annotations: { variant: 'literal', variantOf: 'clause' } }
							]
						}
					}
				]
			},
			clause_patterns: {
				type: FIELD,
				name: 'pattern',
				content: { type: REPEAT1, content: { type: SYMBOL, name: 'literal' } },
				annotations: { hoisted: true }
			},
			clause_block: {
				type: SEQ,
				members: [{ type: STRING, value: '{' }, { type: FIELD, name: 'inner', content: { type: SYMBOL, name: 'literal' } }],
				annotations: { hoisted: true }
			},
			literal: { type: PATTERN, value: '[0-9]+' }
		});
		const { wiring, strict } = emitTables(nodeMap);
		expect(strict).toContain('export const clause$seated: ');
		expect(wiring).toContain("K.clause$block($at('clause$seated'), ");
		expect(wiring).not.toContain('K.clause$block(F.buildClause,');
	});
});

describe('a visible wrapper declared flattened seats on its parent', () => {
	const wrapperGrammar = (): NodeMapWithIdTables =>
		assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'match' }, { type: SYMBOL, name: 'arm' }] },
			arm: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'match',
						content: { type: SYMBOL, name: 'wrapper' },
						annotations: { flattened: true }
					},
					{ type: STRING, value: '=>' },
					{ type: FIELD, name: 'value', content: { type: PATTERN, value: '[a-z]+' } }
				]
			},
			wrapper: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'pattern', content: { type: PATTERN, value: '[a-z]+' } },
					{ type: OPTIONAL, content: { type: FIELD, name: 'condition', content: { type: PATTERN, value: '[a-z]+' } } }
				]
			}
		});

	it('builds the group from its own keys and passes the seat key, a hand-spelled wrapper, through to the parent', () => {
		const { nodeMap } = wrapperGrammar();
		const generatedIdTables: GeneratedIdTables = { kindIds: { root: 1, arm: 2, wrapper: 3 }, fieldIds: new Map(), folds: new Map(), sourceArtifact: 'test' };
		stampIrSurface(nodeMap, generatedIdTables);
		const { combinators, strict } = emitTables(nodeMap);
		expect(combinators).toMatch(/export const arm\$flatten\$match = <[^\n]*>\(parent: PF, child: CF\) =>\n/);
		expect(combinators).toContain('if (key === "pattern" || key === "condition") {');
		expect(combinators).not.toContain('key === "match"');
		expect(strict).toContain('K.arm$flatten$match(F.buildArm, F.buildWrapper)');
	});
});

function typeChecks(lines: readonly string[]): void {
	const tscPackage = createRequire(import.meta.url).resolve('typescript/package.json');
	const dir = mkdtempSync(join(tmpdir(), 'sittir-rest-param-'));
	try {
		const file = join(dir, 'check.ts');
		writeFileSync(file, `${lines.join('\n')}\n`);
		execFileSync(
			process.execPath,
			[
				join(dirname(tscPackage), 'bin', 'tsc'),
				'--ignoreConfig',
				'--noEmit',
				'--strict',
				'--skipLibCheck',
				'--allowImportingTsExtensions',
				'--module',
				'nodenext',
				'--moduleResolution',
				'nodenext',
				'--target',
				'esnext',
				file
			],
			{ stdio: 'pipe' }
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe('a list takes its rest parameter by cardinality and options', () => {
	it('requires an element from a non-empty list and puts the options object first', () => {
		expect(listRestParamType(true, 'E', undefined)).toBe('[element: E, ...elements: E[]]');
		expect(listRestParamType(true, 'E', 'O')).toBe('[element: E, ...elements: E[]] | [options: ListOptions<O>, element: E, ...elements: E[]]');
	});

	it('lets an empty-capable list take nothing, or only its options', () => {
		expect(listRestParamType(false, 'E', undefined)).toBe('[...elements: E[]]');
		expect(listRestParamType(false, 'E', 'O')).toBe('[...elements: E[]] | [options: ListOptions<O>, ...elements: E[]]');
	});

	it('puts required options first with no elements-only form', () => {
		expect(listRestParamType(true, 'E', 'O', true)).toBe('[options: ListOptions<O>, element: E, ...elements: E[]]');
		expect(listRestParamType(false, 'E', 'O', true)).toBe('[options: ListOptions<O>, ...elements: E[]]');
	});

	it('rejects an elements-only call at the type level when the options are required', () => {
		const lines = [
			`import type { ListOptions } from ${JSON.stringify(fileURLToPath(new URL('../../../../types/src/node-surface.ts', import.meta.url)))};`,
			'type E = { readonly element: true };',
			'type O = { readonly separator: 1 | 2 };',
			'const element: E = { element: true };'
		];
		for (const nonEmpty of [true, false]) {
			const fn = nonEmpty ? 'nonEmpty' : 'emptyCapable';
			lines.push(`declare function ${fn}(...input: ${listRestParamType(nonEmpty, 'E', 'O', true)}): void;`);
			lines.push('// @ts-expect-error a required-separator list has no elements-only call');
			lines.push(`${fn}(element);`);
			lines.push(`${fn}({ separator: 1 }, element);`);
		}
		expect(() => typeChecks(lines)).not.toThrow();
	});

	it('seats a list with an undeclared separator on its options-first form, through its row', () => {
		const element: Rule<'evaluate'> = { type: CHOICE, members: [{ type: SYMBOL, name: 'negative' }, { type: SYMBOL, name: 'literal' }] };
		const separator: Rule<'evaluate'> = { type: CHOICE, members: [{ type: STRING, value: ',' }, { type: STRING, value: ';' }] };
		const { nodeMap, generatedIdTables } = assembledNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'u' }, { type: SYMBOL, name: 'items' }] },
			items: { type: SEQ, members: [element, { type: REPEAT, content: { type: SEQ, members: [separator, element] } }] },
			negative: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'sign', content: { type: CHOICE, members: [{ type: STRING, value: '-' }, { type: STRING, value: '+' }] } },
					{ type: FIELD, name: 'content', content: { type: SYMBOL, name: 'literal' } }
				],
				annotations: { hoisted: true }
			},
			literal: { type: PATTERN, value: '[0-9]+' }
		});
		const { loose } = emitTables(nodeMap);
		expect(loose).toContain('export const items$seated: Seat<T.Items.LooseArgs, ');
		const row = builtTypeSurfaceOf(nodeMap.nodes.get('items')!, nodeMap, collectKindEntries(nodeMap, generatedIdTables))!.looseArgs;
		expect(row.startsWith('[options: ')).toBe(true);
		expect(row).not.toMatch(/(^|\| )\[element: /);
		expect(row).toContain('T.Negative.LooseArgs[0]');
	});
});

describe('a keyword literal arm named by its text', () => {
	it('mounts each keyword literal of an unfielded choice under its source text', () => {
		const { nodeMap, generatedIdTables } = assembledNodeMap(
			{
				junction: {
					type: SEQ,
					members: [
						{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'word' } },
						{ type: CHOICE, members: [{ type: STRING, value: 'and' }, { type: STRING, value: 'or' }] },
						{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'word' } }
					]
				},
				word: { type: PATTERN, value: '[a-z]+' }
			}
		);
		stampIrSurface(nodeMap, generatedIdTables);
		const { wiring } = emitTables(nodeMap);
		expect(wiring).toContain("const junction$and: Routes<Table>['junction$and'] = K.junction$and($at('buildJunction'), TSKindId.AndKeyword);");
		expect(wiring).toContain("const junction$or: Routes<Table>['junction$or'] = K.junction$or($at('buildJunction'), TSKindId.OrKeyword);");
	});

	it('reports a keyword arm whose text names a node arm of the same owner as ambiguous', () => {
		const { nodeMap, generatedIdTables } = assembledNodeMap(
			{
				junction: {
					type: SEQ,
					members: [
						{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'word' } },
						{ type: CHOICE, members: [{ type: STRING, value: 'and' }, { type: SYMBOL, name: 'and' }] },
						{ type: FIELD, name: 'right', content: { type: SYMBOL, name: 'word' } }
					]
				},
				and: { type: SEQ, members: [{ type: STRING, value: '&' }, { type: STRING, value: '&' }] },
				word: { type: PATTERN, value: '[a-z]+' }
			}
		);
		stampIrSurface(nodeMap, generatedIdTables);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { wiring, combinators } = emitTables(nodeMap);
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^\[codegen\] junction: sub-factory and skipped \(ambiguous\)/));
		expect(wiring).not.toContain('junction$and');
		expect(combinators).not.toContain('junction$and');
		warn.mockRestore();
	});
});
