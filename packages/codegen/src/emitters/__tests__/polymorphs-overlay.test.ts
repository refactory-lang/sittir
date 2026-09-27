import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdEntry, GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { stampAutomaticVariants } from '../../dsl/automatic-variants.ts';
import { emitPolymorphsOverlay } from '../overlays/polymorphs.ts';
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
	stampAutomaticVariants(stamped, new Set(), new Set());
	return stamped as Record<string, Rule<'evaluate'>>;
}

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>, generatedIdTables?: GeneratedIdTables): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules: labelArms(rules),
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
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
		const text = emitPolymorphsOverlay({ nodeMap });

		expect(text).toContain("import * as B from './refines.js';");
		expect(text).toContain("import * as F from '../raw.js';");
		expect(text).toContain("import * as C from '../coerce.js';");
		expect(text).toContain("export * from './refines.js';");

		expect(text).toContain(
			'const comment$doc = <PF extends (value: never) => unknown, CF extends (...args: never[]) => unknown>(parent: PF, child: CF) =>'
		);
		expect(text).toContain('export const comment: typeof B.comment & {');
		expect(text).toContain('	...B.comment,');
		expect(text).toContain(
			'	doc: { strict: comment$doc(F.buildComment, F.buildCommentDoc), coerce: comment$doc(F.buildComment, C.coerceToCommentDoc) },'
		);
		expect(text).toContain(
			'	plain: { strict: comment$plain(F.buildComment, F.buildCommentPlain), coerce: comment$plain(F.buildComment, C.coerceToCommentPlain) },'
		);

		expect(text).toContain('const logic$and = <PF extends (config: never) => unknown>(parent: PF, value: unknown) =>');
		expect(text).toContain(
			"	and: { strict: logic$and(F.buildLogic, 'and'), coerce: logic$and(C.coerceToLogic, 'and') },"
		);
		expect(text).toContain("	or: { strict: logic$or(F.buildLogic, 'or'), coerce: logic$or(C.coerceToLogic, 'or') },");

		expect(text).toContain(
			"	plus: { strict: annotated$plus(F.buildAnnotated, 'plus'), coerce: annotated$plus(C.coerceToAnnotated, 'plus') },"
		);
	});

	it('seats a keyword arm\'s stored text instead of asking the caller for the keyword child', () => {
		const text = emitPolymorphsOverlay({ nodeMap: parameterlessArmNodeMap() });

		expect(text).toContain("\t(config: OmitEach<ArgsOf<PF>[0], 'content'>, options?: OptionsArg<PF>): ReturnType<PF> =>");
		expect(text).toContain('{ ...config, content: value }');
		expect(text).toContain("strict: pair$kwSelf(F.buildPair, 'self')");
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
		const out = emitPolymorphsOverlay({ nodeMap });
		expect(out).toContain('const clause$flatten =');
		expect(out).toContain(
			`ArgsOf<PF>[0] | (OmitEach<NonNullable<ArgsOf<PF>[0]>, '${seatKey}'> & (ArgsOf<CF>[0] | NoneOf<ArgsOf<CF>[0]>))`
		);
		expect(out).toContain('export const clause: typeof B.clause & {');
		expect(out).toContain('= clause$flatten(F.buildClause, F.buildClauseGroup);');
		expect(out).toContain('strict: clause$seated,');
		expect(out.indexOf('...B.clause,')).toBeLessThan(out.indexOf('strict: clause$seated,'));
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
		const out = emitPolymorphsOverlay({ nodeMap });
		expect(out).toContain('const comparison$comparators =');
		expect(out).toContain("comparators: seat.map((e) => (isConfig(e) ? _c(child)(e) : e))");
		expect(out).toContain('= comparison$comparators(F.buildComparison, F.buildComparisonComparator);');
		expect(out).toContain('strict: comparison$seated,');
		expect(out).toContain("{ comparators: ReadonlyArray<ArgsOf<typeof F.buildComparisonComparator>[0]");
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
		const out = emitPolymorphsOverlay({ nodeMap });
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
		const out = emitPolymorphsOverlay({ nodeMap });
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
		});
		expect(out).toContain('const arm$flatten =');
		expect(out).toContain('(parent: PF, child: CF, wrapperId: number) =>');
		expect(out).toContain('const own = _o(config)["pattern"];');
		expect(out).toContain('(own as { $type?: unknown }).$type === wrapperId');
		expect(out).toMatch(/= arm\$flatten\(F\.buildArm, F\.buildWrapper, TSKindId\.Wrapper\);/);
		expect(out).toContain("import { TSKindId } from '../../types.js';");
	});
});

describe('a list takes its rest parameter by cardinality and options', () => {
	it('requires an element from a non-empty list and puts the options object first', () => {
		expect(listRestParamType(true, 'E', undefined)).toBe('[first: E, ...rest: E[]]');
		expect(listRestParamType(true, 'E', 'O')).toBe('[first: E, ...rest: E[]] | [options: O, first: E, ...rest: E[]]');
	});

	it('lets an empty-capable list take nothing, or only its options', () => {
		expect(listRestParamType(false, 'E', undefined)).toBe('readonly E[]');
		expect(listRestParamType(false, 'E', 'O')).toBe('[first?: E | O, ...rest: E[]]');
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
		const out = emitPolymorphsOverlay({ nodeMap });
		expect(out).toContain("and: { strict: junction$and(F.buildJunction, 'and')");
		expect(out).toContain("or: { strict: junction$or(F.buildJunction, 'or')");
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
		const out = emitPolymorphsOverlay({ nodeMap });
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^\[codegen\] junction: sub-factory and skipped \(ambiguous\)/));
		expect(out).not.toContain('junction$and');
		warn.mockRestore();
	});
});
