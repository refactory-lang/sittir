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
// Synthetic grammar covering the three sub-factory shapes exercised here:
// `comment` — envelope, sole choice slot, two kind arms (residual ∅,
// positional parent); `logic` — branch, literal arms with a required
// residual (no NonNullable — buildLogic's own config param is required
// because every field is required); `annotated` — branch, literal arms with
// an all-optional residual (buildAnnotated's own config param is optional,
// so the sub-factory's `Cfg` is wrapped in `NonNullable<...>`).
// `root` keeps every rule reachable from the first-declared rule (`link`
// only keeps rules reachable from it).
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

	it('emits a form constructor per kind arm and a member constructor per literal', () => {
		const nodeMap = polymorphNodeMap();
		const text = emitPolymorphsOverlay({ nodeMap });

		expect(text).toContain("import * as F from './refines.js';");

		expect(text).toContain('export const buildComment: typeof F.buildComment & {');
		expect(text).toContain(
			'  doc: (...args: Parameters<typeof F.buildCommentDoc>) => F.buildComment(F.buildCommentDoc(...args)),'
		);
		expect(text).toContain(
			'  plain: (...args: Parameters<typeof F.buildCommentPlain>) => F.buildComment(F.buildCommentPlain(...args)),'
		);

		expect(text).toContain('export const buildLogic: typeof F.buildLogic & {');
		expect(text).toContain(
			"  and: (config: Omit<Parameters<typeof F.buildLogic>[0], 'op'>) => F.buildLogic({ ...config, op: 'and' }),"
		);
		expect(text).toContain(
			"  or: (config: Omit<Parameters<typeof F.buildLogic>[0], 'op'>) => F.buildLogic({ ...config, op: 'or' }),"
		);

		expect(text).toContain('export const buildAnnotated: typeof F.buildAnnotated & {');
		expect(text).toContain(
			"  plus: (config: Omit<NonNullable<Parameters<typeof F.buildAnnotated>[0]>, 'mark'>) => F.buildAnnotated({ ...config, mark: 'plus' }),"
		);
		expect(text).toContain(
			"  minus: (config: Omit<NonNullable<Parameters<typeof F.buildAnnotated>[0]>, 'mark'>) => F.buildAnnotated({ ...config, mark: 'minus' }),"
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
