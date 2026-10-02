import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdEntry, GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { stampAutomaticVariants } from '../../dsl/automatic-variants.ts';
import { predictedSymbolSourceOf } from '../../dsl/symbol-table.ts';
import { builtTypeSurfaceOf } from '../factories.ts';
import { collectPolymorphWires, emitPolymorphsOverlay, seatedRowsOf } from '../overlays/polymorphs.ts';
import { listRestParamType } from '../shared.ts';

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

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>, generatedIdTables?: GeneratedIdTables): NodeMap {
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
	const linked = link(raw, { generatedIdTables });
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized, generatedIdTables));
}

function seatedRows(nodeMap: NodeMap, kind: string): { readonly buildArgs: string; readonly looseArgs: string } {
	const node = nodeMap.nodes.get(kind)!;
	const rows = seatedRowsOf(node, collectPolymorphWires(nodeMap, undefined, { silent: true }), builtTypeSurfaceOf(node, nodeMap, undefined)!);
	if (rows === undefined) throw new Error(`'${kind}' has no seated rows`);
	return rows;
}

function polymorphNodeMap(): NodeMap {
	return buildNodeMap({
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

function parameterlessArmNodeMap(): NodeMap {
	return buildNodeMap({
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

function ambiguousNodeMap(): NodeMap {
	return buildNodeMap({
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

describe('emitPolymorphsOverlay', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('emits one method per sub-factory, applied to the strict and coerce pairs', () => {
		const nodeMap = polymorphNodeMap();
		const text = emitPolymorphsOverlay({ nodeMap }).text;

		expect(text).toContain("import * as B from './refines.js';");
		expect(text).toContain("import * as F from '../raw.js';");
		expect(text).toContain("import * as C from '../coerce.js';");
		expect(text).toContain("export * from './refines.js';");

		expect(text).toContain(
			'const comment$doc = <PF extends (value: never) => unknown, CF extends (...args: never[]) => unknown>(parent: PF, child: CF) =>'
		);
		expect(text).toContain('export const comment = Object.freeze({');
		expect(text).toContain('	...B.comment,');
		expect(text).toContain('const comment$doc$strict = comment$doc(F.buildComment, F.buildCommentDoc);');
		expect(text).toContain('const comment$doc$coerce = comment$doc(F.buildComment, C.coerceToCommentDoc);');
		expect(text).toContain('	doc: bundle(comment$doc$strict, comment$doc$coerce, { key: "comment.doc", max: 1 }),');
		expect(text).toContain('	plain: bundle(comment$plain$strict, comment$plain$coerce, { key: "comment.plain", max: 1 }),');

		expect(text).toContain('const logic$and = <PF extends (config: never) => unknown>(parent: PF, value: unknown) =>');
		expect(text).toContain("const logic$and$strict = logic$and(F.buildLogic, 'and');");
		expect(text).toContain("const logic$and$coerce = logic$and(C.coerceToLogic, 'and');");
		expect(text).toContain('	and: bundle(logic$and$strict, logic$and$coerce, { key: "logic.and", max: 2 }),');
		expect(text).toContain('	or: bundle(logic$or$strict, logic$or$coerce, { key: "logic.or", max: 2 }),');

		expect(text).toContain("const annotated$plus$strict = annotated$plus(F.buildAnnotated, 'plus');");
		expect(text).toContain('	plus: bundle(annotated$plus$strict, annotated$plus$coerce, { key: "annotated.plus", max: 2 }),');
	});

	it('seats a keyword arm\'s stored text instead of asking the caller for the keyword child', () => {
		const text = emitPolymorphsOverlay({ nodeMap: parameterlessArmNodeMap() }).text;

		expect(text).toContain("\t(config: OmitEach<ArgsOf<PF>[0], 'content'>, options?: OptionsArg<PF>): ReturnType<PF> =>");
		expect(text).toContain('{ ...config, content: value }');
		expect(text).toContain("const pair$kwSelf$strict = pair$kwSelf(F.buildPair, 'self');");
		expect(text).not.toContain('_c(child)');
	});

	it('prints an emit diagnostic for a skipped sub-factory on its own console.warn channel', () => {
		const nodeMap = ambiguousNodeMap();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		emitPolymorphsOverlay({ nodeMap });

		expect(warn).toHaveBeenCalledWith(
			'[codegen] twice: sub-factory same skipped (ambiguous): first, second'
		);
	});
});

describe('a single hoisted group flattens onto its parent', () => {
	it('wraps strict with a both-or-neither config and keeps the base spread first', () => {
		const nodeMap = buildNodeMap({
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
		const seatKey = nodeMap.nodes.get('clause')!.slots.find((s) => s.values.length === 1)!.configKey;
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(out).toContain(`const clause$flatten$${seatKey} =`);
		expect(out).toContain('const clause$seated: (...args: T.Clause.BuildArgs) => ReturnType<typeof F.buildClause> =');
		const groupKeys = `OmitEach<NonNullable<T.ClauseGroup.Config>, '${seatKey}' | '$type'>`;
		const { buildArgs } = seatedRows(nodeMap, 'clause');
		expect(buildArgs).toContain(`WithoutGroup<`);
		expect(buildArgs).toContain(`, ${groupKeys}> | (OmitEach<NonNullable<`);
		expect(buildArgs).toContain(`, '${seatKey}'> & (T.ClauseGroup.BuildArgs[0] | NoneOf<${groupKeys}>))`);
		expect(out).toContain('export const clause = Object.freeze({');
		expect(out).toContain(`= clause$flatten$${seatKey}(F.buildClause, F.buildClauseGroup);`);
		const seated = '...bundle(clause$seated, clause$seatedCoerce, { key: "clause", max: 1 }),';
		expect(out).toContain(seated);
		expect(out.indexOf('...B.clause,')).toBeLessThan(out.indexOf(seated));
	});
});

describe('a repeated hoisted group seats as an array of its configs', () => {
	it('builds each element from its config and keeps built elements', () => {
		const nodeMap = buildNodeMap({
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
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(out).toContain('const comparison$comparators =');
		expect(out).toContain("comparators: seat.map((e) => (isConfig(e) ? _c(child)(e) : e))");
		expect(out).toContain('= comparison$comparators(F.buildComparison, F.buildComparisonComparator);');
		expect(out).toContain('...bundle(comparison$seated, comparison$seatedCoerce, { key: "comparison", max: 1 }),');
		expect(out).toContain('const comparison$seated: (...args: T.Comparison.BuildArgs) =>');
		expect(seatedRows(nodeMap, 'comparison').buildArgs).toContain('{ comparators: ReadonlyArray<T.ComparisonComparator.BuildArgs[0]');
	});
});

describe('a repeated hoisted group on a spread-shaped parent seats through the rest parameters', () => {
	it('maps each rest argument through the group builder when it is a config', () => {
		const nodeMap = buildNodeMap({
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
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(out).toContain('const union$patterns =');
		expect(out).toContain('_s<ReturnType<PF>>(parent)(...args.map((e) => (isConfig(e) ? _c(child)(e) : e)))');
	});
});

describe('a mount route carries the seats of its own parent', () => {
	it('builds the mount on the seated parent, not the raw factory', () => {
		const nodeMap = buildNodeMap({
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
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(out).toContain('const clause$seated');
		expect(out).toContain('clause$block(clause$seated,');
		expect(out).not.toContain('clause$block(F.buildClause,');
	});
});

describe('a visible wrapper declared flattened seats on its parent', () => {
	const wrapperGrammar = (): NodeMap =>
		buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'match' }, { type: SYMBOL, name: 'arm' }] },
			arm: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'pattern',
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

	it('passes a value that is already the wrapper through and builds anything else into it', () => {
		const out = emitPolymorphsOverlay({
			nodeMap: wrapperGrammar(),
			generatedIdTables: { kindIds: { root: 1, arm: 2, wrapper: 3 }, sourceArtifact: 'test' }
		}).text;
		expect(out).toContain('const arm$flatten$pattern =');
		expect(out).toContain('(parent: PF, child: CF, wrapperId: number) =>');
		expect(out).toContain('const own = _o(config)["pattern"];');
		expect(out).toContain('(own as { $type?: unknown }).$type === wrapperId');
		expect(out).toMatch(/= arm\$flatten\$pattern\(F\.buildArm, F\.buildWrapper, TSKindId\.Wrapper\);/);
		expect(out).toContain("import { TSKindId } from '../../types.js';");
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
		expect(listRestParamType(true, 'E', 'O')).toBe('[element: E, ...elements: E[]] | [options: O, element: E, ...elements: E[]]');
	});

	it('lets an empty-capable list take nothing, or only its options', () => {
		expect(listRestParamType(false, 'E', undefined)).toBe('[...elements: E[]]');
		expect(listRestParamType(false, 'E', 'O')).toBe('[...elements: E[]] | [options: O, ...elements: E[]]');
	});

	it('puts required options first with no elements-only form', () => {
		expect(listRestParamType(true, 'E', 'O', true)).toBe('[options: O, element: E, ...elements: E[]]');
		expect(listRestParamType(false, 'E', 'O', true)).toBe('[options: O, ...elements: E[]]');
	});

	it('rejects an elements-only call at the type level when the options are required', () => {
		const lines = ['type E = { readonly element: true };', 'type O = { readonly separator: 1 | 2 };', 'const element: E = { element: true };'];
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
		const nodeMap = buildNodeMap({
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
		const out = emitPolymorphsOverlay({ nodeMap }).text.split('\n');
		const seat = out.find((line) => line.startsWith('const items$seatedCoerce: '));
		expect(seat).toContain('(...args: T.Items.LooseArgs) =>');
		const row = builtTypeSurfaceOf(nodeMap.nodes.get('items')!, nodeMap, undefined)!.looseArgs;
		expect(row.startsWith('[options: ')).toBe(true);
		expect(row).not.toMatch(/(^|\| )\[element: /);
		expect(row).toContain('T.Negative.LooseArgs[0]');
	});
});

describe('a keyword literal arm named by its text', () => {
	const keyword = (id: number, kind: string, text: string): GeneratedIdEntry => ({
		id,
		parser: { cSymbol: `anon_sym_${id}`, parserName: kind, symbolName: kind, literalText: text, anon: true, aux: false, alias: false, hidden: false, keyword: true }
	});

	it('mounts each keyword literal of an unfielded choice under its source text', () => {
		const nodeMap = buildNodeMap(
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
			},
			{ kindIds: { and_keyword: keyword(3, 'and_keyword', 'and'), or_keyword: keyword(4, 'or_keyword', 'or') }, sourceArtifact: 'test' }
		);
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(out).toContain("const junction$and$strict = junction$and(F.buildJunction, 'and');");
		expect(out).toContain("const junction$or$strict = junction$or(F.buildJunction, 'or');");
	});

	it('reports a keyword arm whose text names a node arm of the same owner as ambiguous', () => {
		const nodeMap = buildNodeMap(
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
			},
			{ kindIds: { and_keyword: keyword(3, 'and_keyword', 'and') }, sourceArtifact: 'test' }
		);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const out = emitPolymorphsOverlay({ nodeMap }).text;
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^\[codegen\] junction: sub-factory and skipped \(ambiguous\)/));
		expect(out).not.toContain('junction$and');
		warn.mockRestore();
	});
});
