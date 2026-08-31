import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { emitPolymorphsOverlay } from '../overlays/polymorphs.ts';

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
