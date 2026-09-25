import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
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

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
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
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	return assemble(AssembleCtx.from(normalized));
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

	it('stamps a parameterless child into its slot instead of asking the caller for an empty argument tuple', () => {
		const text = emitPolymorphsOverlay({ nodeMap: parameterlessArmNodeMap() });

		expect(text).toContain("\t(config: OmitEach<ArgsOf<PF>[0], 'content'>, options?: OptionsArg<PF>): ReturnType<PF> =>");
		expect(text).toContain('{ ...config, content: _c(child)() }');
		expect(text).not.toContain('_c(child)(...seated)');
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

function hoistedMiddleNodeMap(): NodeMap {
	return buildNodeMap({
		grandparent: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: '_parent' },
				{ type: SYMBOL, name: 'leaf_a' }
			]
		},
		_parent: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'leaf_a' },
				{ type: SYMBOL, name: 'leaf_b' }
			],
			annotations: { hoisted: true }
		},
		leaf_a: { type: PATTERN, value: '[a-z]+' },
		leaf_b: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'identifier' } },
				{ type: FIELD, name: 'y', content: { type: SYMBOL, name: 'identifier' } }
			]
		},
		identifier: { type: PATTERN, value: '[0-9]+' }
	});
}

describe('a hoisted kind in the middle of a nested arm', () => {
	it('gets a private wire set the grandparent routes through, and no export', () => {
		const nodeMap = hoistedMiddleNodeMap();
		const parent = nodeMap.nodes.get('_parent')!;
		expect(parent.annotations?.hoisted).toBe(true);
		const key = parent.factoryName!;
		const text = emitPolymorphsOverlay({ nodeMap });
		expect(text).toContain(`const ${key}: {`);
		expect(text).not.toContain(`export const ${key}`);
		expect(text).toContain(`leafB: { strict: grandparent$parent$leafB(F.buildGrandparent, ${key}.leafB.strict)`);
		expect(text.indexOf(`const ${key}: {`)).toBeLessThan(text.indexOf('export const grandparent'));
	});
});

describe('a single hoisted group splices onto its parent', () => {
	it('wraps strict with a both-or-neither config and keeps the base spread first', () => {
		const nodeMap = buildNodeMap({
			root: { type: SEQ, members: [{ type: STRING, value: 'try' }, { type: SYMBOL, name: 'clause' }] },
			clause: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'catch' },
					{ type: OPTIONAL, content: { type: SYMBOL, name: '_clause_group' } },
					{ type: FIELD, name: 'body', content: { type: PATTERN, value: '.+' } }
				]
			},
			_clause_group: {
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
		expect(out).toContain('const clause$splice =');
		expect(out).toContain(
			`ArgsOf<PF>[0] | (OmitEach<NonNullable<ArgsOf<PF>[0]>, '${seatKey}'> & (ArgsOf<CF>[0] | NoneOf<ArgsOf<CF>[0]>))`
		);
		expect(out).toContain('export const clause: typeof B.clause & {');
		expect(out).toContain('= clause$splice(F.buildClause, F.buildClauseGroup);');
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
						content: { type: REPEAT1, content: { type: SYMBOL, name: '_comparison_comparator' } }
					}
				]
			},
			_comparison_comparator: {
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
							content: { type: CHOICE, members: [{ type: SYMBOL, name: '_union_negative' }, { type: SYMBOL, name: 'literal' }] }
						}
					},
					{ type: STRING, value: ')' }
				]
			},
			_union_negative: {
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
					{ type: FIELD, name: 'patterns', content: { type: SYMBOL, name: '_clause_patterns' } },
					{
						type: FIELD,
						name: 'body',
						content: {
							type: CHOICE,
							members: [
								{ type: SYMBOL, name: '_clause_block', annotations: { variant: 'block', variantOf: 'clause' } },
								{ type: SYMBOL, name: 'literal', annotations: { variant: 'literal', variantOf: 'clause' } }
							]
						}
					}
				]
			},
			_clause_patterns: {
				type: FIELD,
				name: 'pattern',
				content: { type: REPEAT1, content: { type: SYMBOL, name: 'literal' } },
				annotations: { hoisted: true }
			},
			_clause_block: {
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

describe('a visible wrapper declared spliced seats on its parent', () => {
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
						annotations: { spliced: true }
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
		expect(out).toContain('const arm$splice =');
		expect(out).toContain('(parent: PF, child: CF, wrapperId: number) =>');
		expect(out).toContain('const own = _o(config)["pattern"];');
		expect(out).toContain('(own as { $type?: unknown }).$type === wrapperId');
		expect(out).toMatch(/= arm\$splice\(F\.buildArm, F\.buildWrapper, TSKindId\.Wrapper\);/);
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
