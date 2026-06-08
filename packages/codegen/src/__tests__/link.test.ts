import { ALIAS, CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL, TOKEN, VARIANT } from '../compiler/rule-types.ts'; // @rule-type-consts
// PR-P Task 2: TERMINAL removed from import — TerminalRule deleted from Rule union.
import { describe, it, expect } from 'vitest';
import { link, enrichPositions, computeParentSets, applyOverridePolymorphs } from '../compiler/link.ts';
import type { DerivationLog } from '../compiler/types.ts';
import type { Rule, SymbolRef } from '../compiler/rule.ts';
import type { RawGrammar } from '../compiler/types.ts';
import { createEmptyRuleCatalog } from '../compiler/rule-catalog.ts';

function makeRaw(rules: Record<string, Rule>, overrides?: Partial<RawGrammar>): RawGrammar {
	return {
		name: 'test',
		rules,
		ruleCatalog: createEmptyRuleCatalog(),
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: [],
		...overrides
	};
}

describe('Link — reference resolution', () => {
	it('resolves symbol references to their content', () => {
		const raw = makeRaw({
			source_file: {
				type: REPEAT,
				content: { type: SYMBOL, name: 'statement' }
			},
			statement: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'x' },
					{ type: STRING, value: ';' }
				]
			}
		});
		const linked = link(raw);
		// source_file's repeat content should reference 'statement' as a symbol
		// Link keeps visible symbol references (they become named children)
		// Hidden symbols get inlined
		expect(linked.rules['source_file']).toBeDefined();
		expect(linked.rules['statement']).toBeDefined();
	});

	it('produces a LinkedGrammar with no alias or token nodes', () => {
		const raw = makeRaw({
			root: {
				type: SEQ,
				members: [
					{
						type: TOKEN,
						content: { type: STRING, value: '//' },
						immediate: false
					},
					{ type: REPEAT1, content: { type: STRING, value: 'x' } }
				]
			}
		});
		const linked = link(raw);

		function assertNoRefTypes(rule: Rule): void {
			if ('type' in rule) {
				expect(rule.type).not.toBe('alias');
				expect(rule.type).not.toBe('token');
				// NOTE: `repeat1` is intentionally preserved through
				// Link so the downstream field / child derivation can
				// stamp `nonEmpty: true` on the resulting slot and the
				// types emitter can render a non-empty tuple type.
			}
			if ('content' in rule && rule.content) assertNoRefTypes(rule.content as Rule);
			if ('members' in rule && Array.isArray((rule as any).members)) {
				for (const m of (rule as any).members) assertNoRefTypes(m);
			}
		}

		for (const rule of Object.values(linked.rules)) {
			assertNoRefTypes(rule);
		}
	});

	it('preserves repeat1 through Link for non-empty signal', () => {
		const raw = makeRaw({
			items: { type: REPEAT1, content: { type: STRING, value: 'x' } }
		});
		const linked = link(raw);
		// PR-P Task 2: Link no longer wraps pure-terminal subtrees as TerminalRule.
		// The rule arrives as its original REPEAT1 type directly; assemble's
		// classifyTerminalFallback (via isAllTextShape) handles classification.
		const rule = linked.rules['items'];
		expect(rule!.type).toBe('repeat1');
	});

	it('flattens token to its content', () => {
		const raw = makeRaw({
			comment: {
				type: TOKEN,
				content: { type: STRING, value: '//' },
				immediate: false
			}
		});
		const linked = link(raw);
		expect(linked.rules['comment']).toEqual({ type: 'string', value: '//' });
	});
});

describe('Link — hidden rule classification', () => {
	it('classifies hidden choice-of-symbols in supertypes as supertype', () => {
		const raw = makeRaw(
			{
				_expression: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'binary_expression' },
						{ type: SYMBOL, name: 'identifier' }
					]
				},
				binary_expression: { type: STRING, value: 'binexpr' },
				identifier: { type: PATTERN, value: '[a-z]+' }
			},
			{ supertypes: ['_expression'] }
		);
		const linked = link(raw);
		expect(linked.rules['_expression']).toEqual({
			type: 'supertype',
			name: '_expression',
			subtypes: ['binary_expression', 'identifier'],
			source: 'grammar'
		});
	});

	it('classifies hidden choice-of-strings as enum', () => {
		const raw = makeRaw({
			_visibility: {
				type: CHOICE,
				members: [
					{ type: STRING, value: 'pub' },
					{ type: STRING, value: 'crate' }
				]
			}
		});
		const linked = link(raw);
		// PR-P: enum-shaped choices are type 'choice'; isEnumChoiceRule detects them.
		// Hidden choice of strings → normalized to ChoiceRule (was EnumRule).
		expect(linked.rules['_visibility']!.type).toBe('choice');
	});
});

describe('Link — field provenance', () => {
	it('preserves field source from override', () => {
		const raw = makeRaw({
			item: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'body',
						content: { type: 'symbol', name: 'block' },
						source: 'override'
					}
				]
			},
			block: { type: STRING, value: '{}' }
		});
		const linked = link(raw);
		const item = linked.rules['item'] as any;
		expect(item.members[0].source).toBe('override');
	});
});

describe('Link — output contract', () => {
	it('returns supertypes as a Set', () => {
		const raw = makeRaw(
			{
				_expression: {
					type: CHOICE,
					members: [{ type: SYMBOL, name: 'id' }]
				},
				id: { type: PATTERN, value: '[a-z]+' }
			},
			{ supertypes: ['_expression'] }
		);
		const linked = link(raw);
		expect(linked.supertypes).toBeInstanceOf(Set);
		expect(linked.supertypes.has('_expression')).toBe(true);
	});

	it('returns word from raw grammar', () => {
		const raw = makeRaw({ id: { type: PATTERN, value: '[a-z]+' } }, { word: 'id' });
		const linked = link(raw);
		expect(linked.word).toBe('id');
	});
});

describe('Link — top-level alias bodies', () => {
	it('captures the dereferenced body for hidden alias sources', () => {
		const raw = makeRaw({
			_type_identifier: {
				type: ALIAS,
				named: true,
				value: 'type_identifier',
				content: { type: SYMBOL, name: 'identifier' }
			},
			identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' }
		});
		const linked = link(raw);
		expect(linked.topLevelAliasBodies?.get('_type_identifier')).toEqual({
			type: 'pattern',
			value: '[A-Za-z_]\\w*'
		});
	});

	it('does not dereference aliases whose source is a supertype', () => {
		const raw = makeRaw(
			{
				_expression: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'identifier' },
						{ type: SYMBOL, name: 'call_expression' }
					]
				},
				_as_pattern_target: {
					type: ALIAS,
					named: true,
					value: 'as_pattern_target',
					content: { type: SYMBOL, name: '_expression' }
				},
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				call_expression: {
					type: SEQ,
					members: [
						{ type: FIELD, name: 'callee', content: { type: SYMBOL, name: 'identifier' } },
						{ type: STRING, value: '(' },
						{ type: STRING, value: ')' }
					]
				}
			},
			{ supertypes: ['_expression'] }
		);
		const linked = link(raw);
		expect(linked.topLevelAliasBodies?.get('_as_pattern_target')).toEqual({
			type: 'symbol',
			name: '_expression'
		});
	});
});

describe('Link — reference graph enrichment', () => {
	it('enrichPositions assigns position to refs by walking seq members', () => {
		const rules: Record<string, Rule> = {
			item: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{ type: SYMBOL, name: 'name' },
					{ type: SYMBOL, name: 'body' }
				]
			}
		};
		const refs: SymbolRef[] = [
			{ refType: 'symbol', from: 'item', to: 'name' },
			{ refType: 'symbol', from: 'item', to: 'body' }
		];
		enrichPositions(rules, refs);
		expect(refs[0]!.position).toBe(1);
		expect(refs[1]!.position).toBe(2);
	});

	it('computeParentSets groups refs by target symbol', () => {
		const refs: SymbolRef[] = [
			{ refType: 'symbol', from: 'a', to: 'block' },
			{ refType: 'symbol', from: 'b', to: 'block' },
			{ refType: 'symbol', from: 'a', to: 'expr' }
		];
		const parents = computeParentSets(refs);
		expect(parents.get('block')).toHaveLength(2);
		expect(parents.get('expr')).toHaveLength(1);
	});
});

describe('Link — T019a cycle detection', () => {
	it('detects self-referential hidden rule without crashing', () => {
		const raw = makeRaw({
			_recursive: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: '_recursive' },
					{ type: STRING, value: 'base' }
				]
			}
		});
		// Should not throw — cycles are flagged, not fatal
		const linked = link(raw);
		expect(linked.rules['_recursive']).toBeDefined();
	});
});

describe('Link — T016a hidden choice classification', () => {
	it('classifies hidden choice of symbols as supertype', () => {
		const refs: SymbolRef[] = [
			{ refType: 'symbol', from: 'a', to: '_helper' },
			{ refType: 'symbol', from: 'b', to: '_helper' },
			{ refType: 'symbol', from: 'c', to: '_helper' }
		];
		const raw = makeRaw(
			{
				_helper: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'x' },
						{ type: SYMBOL, name: 'y' }
					]
				},
				a: { type: SYMBOL, name: '_helper' },
				b: { type: SYMBOL, name: '_helper' },
				c: { type: SYMBOL, name: '_helper' },
				x: { type: PATTERN, value: 'x' },
				y: { type: PATTERN, value: 'y' }
			},
			{ references: refs }
		);
		const linked = link(raw);
		// All hidden choices → supertype (Link classifies, Assemble passes through)
		expect(linked.rules['_helper']!.type).toBe('supertype');
	});
});

describe('Link — variant tagging + polymorph promotion', () => {
	it('leaves visible choice members un-wrapped — named variants are the grammar-author path', () => {
		// Pre-spec-013 Link ran `tagAllRulesVariants` to auto-wrap every
		// visible choice branch in `variant('form_N' | leading-literal)`.
		// That was a heuristic for polymorph-promotion candidacy; with the
		// simplify pipeline's cross-branch hoist + mergeChoiceBranches
		// handling same-shape merges directly, anonymous auto-tags
		// served only to block those passes and to mask the grammar
		// author's need to declare named `variant()` in overrides.ts.
		// Link now leaves the choice structure alone — promotion happens
		// via `applyOverridePolymorphs` on user-declared variants only.
		const raw = makeRaw({
			statement: {
				type: CHOICE,
				members: [
					{
						type: SEQ,
						members: [
							{ type: STRING, value: 'if' },
							{ type: SYMBOL, name: 'expr' }
						]
					},
					{
						type: SEQ,
						members: [
							{ type: STRING, value: 'while' },
							{ type: SYMBOL, name: 'expr' }
						]
					}
				]
			},
			expr: { type: PATTERN, value: '.*' }
		});
		const linked = link(raw);
		const stmt = linked.rules['statement'] as any;
		expect(stmt.type).toBe('choice');
		expect(stmt.members.every((m: any) => m.type === 'seq')).toBe(true);
	});

	it('promotePolymorph detects heterogeneous-field choices (suggestion-only, no mutation)', () => {
		const raw = makeRaw({
			assignment: {
				type: CHOICE,
				members: [
					{
						type: SEQ,
						members: [
							{ type: STRING, value: '=' },
							{
								type: FIELD,
								name: 'left',
								content: { type: SYMBOL, name: 'expr' }
							}
						]
					},
					{
						type: SEQ,
						members: [
							{ type: STRING, value: ':' },
							{
								type: FIELD,
								name: 'right',
								content: { type: SYMBOL, name: 'expr' }
							}
						]
					}
				]
			},
			expr: { type: PATTERN, value: '.*' }
		});
		const linked = link(raw);
		const assignment = linked.rules['assignment'] as any;
		expect(assignment.type).not.toBe('polymorph');
		expect(
			linked.derivations.promotedRules.some(
				(p: any) => p.kind === 'assignment' && p.classification === 'polymorph' && !p.applied
			)
		).toBe(true);
	});

	it('applyOverridePolymorphs pushes ambient scaffold into variant-child hidden rules when they live deep in the parent rule', () => {
		// visibility_modifier-shaped case: variant aliases buried in
		// `optional(seq('(', inner_choice, ')'))`. `findVariantChoice`
		// only sees the outermost (tagVariants-wrapped) choice whose
		// members do NOT reference the registered `${parent}_${child}`
		// symbols → push-down path runs. Each `_${parent}_${child}`
		// hidden rule gets flanking `(` / `)` wrapped around its body;
		// the parent rule's enclosing seq drops those literals so the
		// walker emits `$PUB$$$CHILDREN`. Parent stays as a choice
		// (assemble suppresses T065 polymorph promotion via
		// `variantParents`).
		//
		// Called directly to isolate the push-down behavior from Link's
		// other passes (tagVariants, hidden-rule classification) that
		// would otherwise restructure this fixture.
		const rules: Record<string, Rule> = {
			visibility_modifier: {
				type: CHOICE,
				members: [
					{
						type: VARIANT,
						name: 'crate',
						content: { type: SYMBOL, name: 'crate' }
					},
					{
						type: VARIANT,
						name: 'form1',
						content: {
							type: SEQ,
							members: [
								{
									type: FIELD,
									name: 'pub',
									content: { type: SYMBOL, name: '_kw_pub' }
								},
								{
									type: OPTIONAL,
									content: {
										type: SEQ,
										members: [
											{ type: STRING, value: '(' },
											{
												type: CHOICE,
												members: [
													{
														type: ALIAS,
														named: true,
														value: 'visibility_modifier_pub_self',
														content: {
															type: SYMBOL,
															name: '_visibility_modifier_pub_self'
														}
													},
													{
														type: ALIAS,
														named: true,
														value: 'visibility_modifier_pub_super',
														content: {
															type: SYMBOL,
															name: '_visibility_modifier_pub_super'
														}
													}
												]
											},
											{ type: STRING, value: ')' }
										]
									}
								}
							]
						}
					}
				]
			},
			_visibility_modifier_pub_self: { type: SYMBOL, name: 'self' },
			_visibility_modifier_pub_super: { type: SYMBOL, name: 'super' }
		};
		const derivations: DerivationLog = {
			inferredFields: [],
			promotedRules: [],
			repeatedShapes: []
		};
		applyOverridePolymorphs(
			rules,
			[
				{ parent: 'visibility_modifier', child: 'pub_self' },
				{ parent: 'visibility_modifier', child: 'pub_super' }
			],
			derivations
		);
		// Parent rule stays as a choice (not replaced by flat polymorph).
		expect(rules['visibility_modifier']!.type).toBe('choice');
		// Each variant-child hidden rule now has its body wrapped in the
		// ambient `(` / `)` literals that used to flank the inner choice.
		const selfBody = rules['_visibility_modifier_pub_self']!;
		expect(selfBody.type).toBe('seq');
		if (selfBody.type !== SEQ) throw new Error('unreachable');
		expect(selfBody.members.map((m) => (m.type === 'string' ? m.value : m.type))).toEqual(['(', 'symbol', ')']);
		const superBody = rules['_visibility_modifier_pub_super']!;
		expect(superBody.type).toBe('seq');
		// Variant-child derivations emitted for downstream use.
		const derivedKinds = derivations.promotedRules
			.filter((p) => p.kind === 'visibility_modifier_pub_self' || p.kind === 'visibility_modifier_pub_super')
			.map((p) => p.kind)
			.sort();
		expect(derivedKinds).toEqual(['visibility_modifier_pub_self', 'visibility_modifier_pub_super']);
	});

	it('applyOverridePolymorphs leaves rule as choice when registered variant children match found choice (de-polymorph)', () => {
		// DE-POLYMORPH (2026-06-01): applyOverridePolymorphs no longer rewrites
		// the parent rule into a PolymorphRule. The rule stays as the
		// wire-produced choice so it flows through as a plain BRANCH with
		// faithful order-preserving rendering. variant() / polymorphVariants
		// metadata is still retained for factory submethod sugar.
		const raw = makeRaw(
			{
				assignment: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'assignment_eq' },
						{ type: SYMBOL, name: 'assignment_type' }
					]
				},
				assignment_eq: {
					type: SEQ,
					members: [
						{
							type: FIELD,
							name: 'left',
							content: { type: SYMBOL, name: 'expr' }
						},
						{ type: STRING, value: '=' },
						{
							type: FIELD,
							name: 'right',
							content: { type: SYMBOL, name: 'expr' }
						}
					]
				},
				assignment_type: {
					type: SEQ,
					members: [
						{
							type: FIELD,
							name: 'left',
							content: { type: SYMBOL, name: 'expr' }
						},
						{ type: STRING, value: ':' },
						{
							type: FIELD,
							name: 'typ',
							content: { type: SYMBOL, name: 'expr' }
						}
					]
				},
				expr: { type: PATTERN, value: '.*' }
			},
			{
				polymorphVariants: [
					{ parent: 'assignment', child: 'eq' },
					{ parent: 'assignment', child: 'type' }
				]
			}
		);
		const linked = link(raw);
		// Rule stays as choice (not replaced with polymorph) after de-polymorph.
		expect(linked.rules['assignment']!.type).toBe('choice');
	});

	it('homogeneous-field choices stay as raw choice (not polymorph)', () => {
		// Two branches, both with a single `value` field — same field set
		// → not a polymorph. Post-spec-013 Link doesn't auto-wrap them
		// in `variant(...)`; the downstream simplify `mergeChoiceBranches`
		// pass handles same-shape branches by collapsing them into a
		// flat seq with per-position unioned contents.
		const raw = makeRaw({
			literal: {
				type: CHOICE,
				members: [
					{
						type: SEQ,
						members: [
							{ type: STRING, value: 'int' },
							{
								type: FIELD,
								name: 'value',
								content: { type: SYMBOL, name: 'num' }
							}
						]
					},
					{
						type: SEQ,
						members: [
							{ type: STRING, value: 'float' },
							{
								type: FIELD,
								name: 'value',
								content: { type: SYMBOL, name: 'num' }
							}
						]
					}
				]
			},
			num: { type: PATTERN, value: '[0-9]+' }
		});
		const linked = link(raw);
		const literal = linked.rules['literal'] as any;
		expect(literal.type).toBe('choice');
		// No variant wrappers — branches travel as bare seqs through Link.
		expect(literal.members.every((m: any) => m.type === 'seq')).toBe(true);
	});
});
