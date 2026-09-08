import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitPolymorphsOverlay } from '../overlays/polymorphs.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';

// ---------------------------------------------------------------------------
// Synthetic grammar covering the sub-factory shapes exercised here:
// `comment` — envelope, sole choice slot, two kind arms (residual ∅,
// positional parent); `logic` — branch, literal arms with a required
// residual; `annotated` — branch, literal arms with an all-optional
// residual. `root` keeps every rule reachable from the first-declared rule
// (`link` only keeps rules reachable from it).
// ---------------------------------------------------------------------------

function buildNodeMap(rules: Record<string, Rule<'evaluate'>>): NodeMap {
	const raw: RawGrammar = {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
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
							{ type: STRING, value: 'and' },
							{ type: STRING, value: 'or' }
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
								{ type: STRING, value: 'plus' },
								{ type: STRING, value: 'minus' }
							]
						}
					}
				}
			]
		},
		identifier: { type: PATTERN, value: '[a-z]+' }
	});
}

function ambiguousNodeMap(): NodeMap {
	return buildNodeMap({
		grandparent_b: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'parent_x' },
				{ type: SYMBOL, name: 'parent_y' }
			]
		},
		parent_x: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'shared_leaf' },
				{ type: SYMBOL, name: 'other_x' }
			]
		},
		parent_y: {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'shared_leaf' },
				{ type: SYMBOL, name: 'other_y' }
			]
		},
		shared_leaf: { type: PATTERN, value: '[a-z]+' },
		other_x: { type: PATTERN, value: '[0-9]+' },
		other_y: { type: PATTERN, value: '[0-9]+' }
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
			'	doc: { strict: comment$doc(F.buildComment, F.buildCommentDoc), coerce: comment$doc(C.coerceToComment, C.coerceToCommentDoc) },'
		);
		expect(text).toContain(
			'	plain: { strict: comment$plain(F.buildComment, F.buildCommentPlain), coerce: comment$plain(C.coerceToComment, C.coerceToCommentPlain) },'
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

	it('prints an emit diagnostic for a skipped sub-factory on its own console.warn channel', () => {
		const nodeMap = ambiguousNodeMap();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		emitPolymorphsOverlay({ nodeMap });

		expect(warn).toHaveBeenCalledWith(
			'[codegen] grandparent_b: sub-factory sharedLeaf skipped (ambiguous): parent_x.sharedLeaf, parent_y.sharedLeaf'
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

describe('a hoisted kind in the middle of a flattened arm', () => {
	it('gets a private wire set the grandparent routes through, and no export', () => {
		const nodeMap = hoistedMiddleNodeMap();
		const parent = nodeMap.nodes.get('_parent')!;
		expect(parent.annotations?.hoisted).toBe(true);
		const key = parent.factoryName!;
		const text = emitPolymorphsOverlay({ nodeMap });
		expect(text).toContain(`const ${key}: {`);
		expect(text).not.toContain(`export const ${key}`);
		expect(text).toContain(`grandparent$leafB(F.buildGrandparent, ${key}.leafB.strict)`);
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
		expect(out).toContain('strict: clause$splice(F.buildClause, F.buildClauseGroup)');
		expect(out.indexOf('...B.clause,')).toBeLessThan(out.indexOf('strict: clause$splice('));
	});
});
