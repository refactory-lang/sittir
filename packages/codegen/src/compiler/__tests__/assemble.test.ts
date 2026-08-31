import {
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	VARIANT
} from '../../types/rule-types.ts'; // @rule-type-consts
// PR-P Task 2: TERMINAL removed from import — TerminalRule deleted from Rule union.
import { describe, it, expect } from 'vitest';
import { assemble, AssembleCtx, classifyNode, simplifyRule, nameNode } from '../assemble.ts';
import { computeSimplifiedRules, SimplifyCtx, makeNormalizedGrammar } from '../simplify.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { flattenRules, flatten } from '../flatten.ts';
import type { Rule, SymbolRule } from '../../types/rule.ts';
import type { SimplifiedGrammar } from '../types.ts';
import {
	deriveSlots,
	isRequired,
	isMultiple,
	allSlotsOf,
	AssembledList,
	AssembledSupertype,
	AssembledKeyword,
	AbstractAssembledCompound
} from '../model/node-map.ts';
import type { GeneratedIdTables, GeneratedIdEntry } from '../generated-metadata.ts';

// Helper — fields-equivalent view over deriveSlots: every slot that came
// from a grammar `field(name, ...)` wrapper (excludes kind-derived
// positional children, which are unnamed).
// Pre-process raw rules through flatten so deriveSlotsRaw receives
// canonical (wrapper-free) input — mirrors how the production pipeline
// applies flattenRules before assembling.
function deriveFields(rule: Rule<'link'>) {
	return deriveSlots(flatten(rule)).filter((s) => !s.isUnnamed);
}

function makeNormalized(
	rules: Record<string, Rule<'link'>>,
	overrides?: Partial<SimplifiedGrammar>
): SimplifiedGrammar {
	const stamped = Object.fromEntries(
		Object.entries(rules).map(([name, rule]) => [
			name,
			rule.hidden === undefined ? { ...rule, hidden: name.startsWith('_') } : rule
		])
	);
	const normalizedRules = flattenRules(stamped);
	const simplifiedRules = computeSimplifiedRules(
		new SimplifyCtx({ grammar: makeNormalizedGrammar(normalizedRules), diagnostics: new DiagnosticSink() })
	);
	// If topLevelAliasBodies are provided, thread them through the same pipeline
	// so their canonical snapshots are available under the alias kind name.
	if (overrides?.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule<'link'>> = Object.fromEntries(overrides.topLevelAliasBodies);
		const aliasBodiesRender = flattenRules(aliasBodiesRaw);
		const aliasBodiesSimplified = computeSimplifiedRules(
			new SimplifyCtx({ grammar: makeNormalizedGrammar(aliasBodiesRender), diagnostics: new DiagnosticSink() })
		);
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			const own = normalizedRules[kind];
			normalizedRules[kind] = own === undefined ? rule : { ...rule, hidden: own.hidden, inlinedFrom: own.inlinedFrom };
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}
	return {
		name: 'test',
		normalizedRules,
		rules: simplifiedRules,
		supertypes: new Set(),
		factoryInline: new Set(),
		word: null,
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}

describe('Assemble — simplifyRule', () => {
	// simplifyRule's input must be field-node-free (flattenRules must
	// run first). These tests apply wrapper-deletion before calling simplifyRule.

	it('strips non-alphanumeric string nodes and collapses single-member seq', () => {
		const rawRule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: '{' },
				{
					type: FIELD,
					name: 'body',
					content: { type: SYMBOL, name: 'block' }
				},
				{ type: STRING, value: '}' }
			]
		};
		const rule = flattenRules({ x: rawRule }).x!;
		const simplified = simplifyRule(rule as Rule);
		// After stripping { and }, only the symbol (with fieldName attr) remains
		expect(simplified.type).toBe('SYMBOL');
		expect((simplified as any).fieldName).toBe('body');
		expect((simplified as any).nonterminal).toBe(true);
	});

	it('collapses single-member seq to its content', () => {
		const rawRule: Rule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'y' } }]
		};
		// wrapper-deletion: field('x', sym('y')) → sym('y', {fieldName:'x', nonterminal:true})
		const rule = flattenRules({ x: rawRule }).x!;
		const simplified = simplifyRule(rule as Rule);
		// seq of one symbol (with attr) collapses to that symbol
		expect(simplified.type).toBe('SYMBOL');
		expect((simplified as any).fieldName).toBe('x');
	});

	it('keeps alphanumeric strings', () => {
		const rule: Rule<'link'> = { type: STRING, value: 'pub' };
		const simplified = simplifyRule(rule);
		expect(simplified).toEqual({ type: 'STRING', value: 'pub' });
	});
});

describe('Assemble — classifyNode', () => {
	it('classifies visible seq with fields as branch', () => {
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{
					type: FIELD,
					name: 'name',
					content: { type: SYMBOL, name: 'identifier' }
				},
				{ type: STRING, value: '(' },
				{ type: STRING, value: ')' },
				{
					type: FIELD,
					name: 'body',
					content: { type: SYMBOL, name: 'block' }
				}
			]
		};
		expect(classifyNode('function_item', flatten(rule))).toBe('branch');
	});

	it('classifies visible repeat as envelope (one-symbol body)', () => {
		// A bare repeat with no field() wrapper and no separator collapses,
		// through wrapper-deletion, to a stamped multiplicity on the bare
		// SYMBOL body — a one-symbol body classifies as 'envelope'.
		const rule: Rule<'link'> = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'item' }
		};
		expect(classifyNode('items', flatten(rule))).toBe('envelope');
	});

	it('does NOT classify a bare repeat with no separator as separatedList', () => {
		const rule: Rule<'link'> = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'item' }
		};
		expect(classifyNode('items_no_sep', flatten(rule))).toBe('envelope');
	});

	it('classifies visible choice with same field set as branch', () => {
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{
					type: VARIANT,
					name: 'plus',
					content: {
						type: SEQ,
						members: [
							{
								type: FIELD,
								name: 'left',
								content: { type: SYMBOL, name: 'expr' }
							},
							{ type: STRING, value: '+' },
							{
								type: FIELD,
								name: 'right',
								content: { type: SYMBOL, name: 'expr' }
							}
						]
					}
				},
				{
					type: VARIANT,
					name: 'minus',
					content: {
						type: SEQ,
						members: [
							{
								type: FIELD,
								name: 'left',
								content: { type: SYMBOL, name: 'expr' }
							},
							{ type: STRING, value: '-' },
							{
								type: FIELD,
								name: 'right',
								content: { type: SYMBOL, name: 'expr' }
							}
						]
					}
				}
			]
		};
		expect(classifyNode('binary_op', flatten(rule))).toBe('branch');
	});

	it('classifies visible pattern as pattern', () => {
		const rule: Rule<'link'> = { type: PATTERN, value: '[a-z]+' };
		expect(classifyNode('identifier', flatten(rule))).toBe('pattern');
	});

	it('classifies visible single alphanumeric string as keyword', () => {
		// classifyNode itself only reports the shared 'token' modelType; the
		// keyword/token split is decided downstream in assemble() by
		// wordMatcher, and surfaces as the constructed node's own class.
		const normalized = makeNormalized({ true: { type: STRING, value: 'true' } });
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('true');
		expect(node?.modelType).toBe('token');
		expect(node).toBeInstanceOf(AssembledKeyword);
		expect((node as AssembledKeyword).word).toBe(true);
	});

	it('classifies visible non-alphanumeric string as token (T027b)', () => {
		const rule: Rule<'link'> = { type: STRING, value: '->' };
		expect(classifyNode('arrow', flatten(rule))).toBe('token');
	});

	it('classifies enum as enum', () => {
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: 'pub' },
				{ type: STRING, value: 'crate' }
			]
		};
		expect(classifyNode('visibility', flatten(rule))).toBe('enum');
	});

	it('classifies hidden choice as supertype when already SupertypeRule', () => {
		const rule: Rule<'link'> = {
			type: SUPERTYPE,
			name: '_expression',
			subtypes: [
				{ type: SYMBOL, name: 'binary_expression' },
				{ type: SYMBOL, name: 'identifier' }
			]
		};
		expect(classifyNode('_expression', flatten(rule))).toBe('supertype');
	});

	it('classifies SupertypeRule (from Link) as supertype regardless of name', () => {
		// Link classifies hidden choice-of-symbols as SupertypeRule
		// Assemble just passes it through — no name check needed
		const rule: Rule<'link'> = {
			type: SUPERTYPE,
			name: 'expression',
			subtypes: [
				{ type: SYMBOL, name: 'binary_expression' },
				{ type: SYMBOL, name: 'identifier' }
			]
		};
		const renderRule = flatten(rule);
		expect(classifyNode('expression', renderRule)).toBe('supertype');
		expect(classifyNode('_expression', renderRule)).toBe('supertype');
		expect(classifyNode('anything', renderRule)).toBe('supertype');
	});

	it('classifies a link-minted GROUP as a hoisted compound', () => {
		// A GROUP-typed SimplifiedRule (link-minted, wrapper-collapsed
		// content) classifies by its structural shape alone ('envelope'
		// here, one symbol body); the link-minted fact lives on the
		// constructed node as `hoisted`, not as a separate modelType label.
		const normalized = makeNormalized({
			_sig: {
				type: GROUP,
				name: '_sig',
				content: {
					type: SEQ,
					members: [
						{
							type: FIELD,
							name: 'params',
							content: { type: SYMBOL, name: 'parameters' }
						}
					]
				}
			},
			parameters: { type: PATTERN, value: '[a-z]+' }
		});
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_sig');
		expect(node?.modelType).toBe('envelope');
		expect((node as AbstractAssembledCompound).hoisted).toBe(true);
	});

	it('classifies a group-wrapped lifted separated list as separatedList (fielded element)', () => {
		// The polymorph-form / content-alias group wrapper must not hide a
		// lifted separated list from classification: the group's CONTENT
		// carries the list's multiplicity + separator (python
		// `_print_chevron_arguments`, `_expression_statement_tuple`).
		const rule: Rule<'link'> = {
			type: GROUP,
			name: '_args',
			content: {
				type: SEQ,
				members: [
					{
						type: REPEAT1,
						content: {
							type: FIELD,
							name: 'argument',
							content: { type: SYMBOL, name: 'expression' }
						},
						separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
					}
				]
			}
		};
		expect(classifyNode('_args', flatten(rule))).toBe('list');
	});

	it('classifies a group-wrapped separated list of mixed field/bare choice arms as separatedList', () => {
		// typescript `_enum_body_elements`: each element is
		// `choice(field('name', _property_name), enum_assignment)` — the
		// multi-field element must not push the kind off the separatedList
		// classification (its content slot is the merged union).
		const rule: Rule<'link'> = {
			type: GROUP,
			name: '_enum_body_elements',
			content: {
				type: SEQ,
				members: [
					{
						type: REPEAT1,
						content: {
							type: CHOICE,
							members: [
								{
									type: FIELD,
									name: 'name',
									content: { type: SYMBOL, name: '_property_name' }
								},
								{ type: SYMBOL, name: 'enum_assignment' }
							]
						},
						separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
					}
				]
			}
		};
		expect(classifyNode('_enum_body_elements', flatten(rule))).toBe('list');
	});

	it('assembles hidden alias sources from their captured leaf body', () => {
		const normalized = makeNormalized(
			{
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				_type_identifier: {
					type: SYMBOL,
					name: 'identifier',
					aliasedTo: 'type_identifier'
				}
			},
			{
				topLevelAliasBodies: new Map([['_type_identifier', { type: PATTERN, value: '[A-Za-z_]\\w*' } satisfies Rule]])
			}
		);
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_type_identifier');
		expect(node?.modelType).toBe('pattern');
	});

	it('assembles hidden alias sources from their captured structural body', () => {
		const normalized = makeNormalized(
			{
				expr: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				_pair_alias: {
					type: SYMBOL,
					name: '_pair_source',
					aliasedTo: 'pair'
				}
			},
			{
				topLevelAliasBodies: new Map([
					[
						'_pair_alias',
						{
							type: SEQ,
							members: [
								{
									type: FIELD,
									name: 'left',
									content: { type: SYMBOL, name: 'expr' }
								},
								{ type: STRING, value: ',' },
								{
									type: FIELD,
									name: 'right',
									content: { type: SYMBOL, name: 'expr' }
								}
							]
						} satisfies Rule<'link'>
					]
				])
			}
		);
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_pair_alias');
		expect(node?.modelType).toBe('branch');
		expect(allSlotsOf(node!).map((slot) => slot.name)).toEqual(['left', 'right']);
	});

	it('includes alias-member hidden kinds in supertype subtype expansion', () => {
		const normalized = makeNormalized(
			{
				_property_name: {
					type: SUPERTYPE,
					name: '_property_name',
					subtypes: [
						{ type: SYMBOL, name: 'identifier' },
						{ type: SYMBOL, name: 'string' }
					]
				},
				_property_identifier: {
					type: SUPERTYPE,
					name: '_property_identifier',
					subtypes: [{ type: SYMBOL, name: 'identifier' }]
				},
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				string: { type: PATTERN, value: '".*"' }
			},
			{
				topLevelAliasBodies: new Map([['_property_identifier', { type: SYMBOL, name: 'identifier' } satisfies Rule]])
			}
		);
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_property_name');
		expect(node?.modelType).toBe('supertype');
		expect(node).toBeInstanceOf(AssembledSupertype);
		expect((node as any).subtypeNames).toEqual(['identifier', 'string', '_property_identifier']);
	});

	it('includes nested alias-member hidden kinds in supertype subtype expansion', () => {
		const normalized = makeNormalized(
			{
				_property_name: {
					type: SUPERTYPE,
					name: '_property_name',
					subtypes: [
						{ type: SYMBOL, name: 'identifier' },
						{ type: SYMBOL, name: 'string' }
					]
				},
				_type_identifier: {
					type: SUPERTYPE,
					name: '_type_identifier',
					subtypes: [{ type: SYMBOL, name: 'identifier' }]
				},
				_reserved_identifier: {
					type: SUPERTYPE,
					name: '_reserved_identifier',
					subtypes: [{ type: SYMBOL, name: 'identifier' }]
				},
				_property_identifier: {
					type: SUPERTYPE,
					name: '_property_identifier',
					subtypes: [
						{ type: SYMBOL, name: '_type_identifier' },
						{ type: SYMBOL, name: '_reserved_identifier' },
						{ type: SYMBOL, name: 'identifier' }
					]
				},
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				string: { type: PATTERN, value: '".*"' }
			},
			{
				topLevelAliasBodies: new Map([
					['_type_identifier', { type: SYMBOL, name: 'identifier' } satisfies Rule],
					[
						'_property_identifier',
						{
							type: CHOICE,
							members: [
								{ type: SYMBOL, name: '_type_identifier' },
								{ type: SYMBOL, name: '_reserved_identifier' },
								{ type: SYMBOL, name: 'identifier' }
							]
						} satisfies Rule
					]
				])
			}
		);
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_property_name');
		expect(node?.modelType).toBe('supertype');
		expect(node).toBeInstanceOf(AssembledSupertype);
		expect((node as any).subtypeNames).toEqual(['identifier', 'string', '_type_identifier', '_property_identifier']);
	});

	// PR-137 grammar-phase-ctx regression fixture (2026-07-05): reproduces
	// rust's `_delim_tokens` supertype chain, whose subtype resolution walks
	// through `_non_special_token`'s `REPEAT1(CHOICE('%', '+', ...))` arm
	// (tree-sitter-rust's TOKEN_TREE_NON_SPECIAL_PUNCTUATION). On the LINK
	// view `resolveHiddenRuleContent`'s switch has no REPEAT1 case, so it
	// falls to `default: return []` — opaque, correctly excluding the bare
	// punctuation literals from the subtype list. A naive migration to the
	// post-normalize view collapses `REPEAT1(CHOICE(...))` into a bare
	// `CHOICE(...)` leaf stamped `multiplicity: 'nonEmptyArray'`, which DOES
	// have a CHOICE case — the resolver would wrongly recurse into the
	// punctuation arms and emit `%` as a bogus subtype name, crashing
	// `emitSupertypeUnionDeclarations` downstream ("references subtype '%'
	// which is not in NodeMap"). This test locks in opacity for the
	// nonEmptyArray/array-multiplicity shape regardless of which view the
	// resolver reads.
	it('keeps a REPEAT1(CHOICE(...)) punctuation-literal group opaque in supertype subtype resolution', () => {
		const normalized = makeNormalized({
			_delim_tokens: {
				type: SUPERTYPE,
				name: '_delim_tokens',
				subtypes: [
					{ type: SYMBOL, name: '_non_delim_token' },
					{ type: SYMBOL, name: 'identifier' }
				]
			},
			_non_delim_token: {
				type: CHOICE,
				members: [{ type: SYMBOL, name: '_non_special_token' }]
			},
			_non_special_token: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'identifier' },
					{
						type: REPEAT1,
						content: {
							type: CHOICE,
							members: [
								{ type: STRING, value: '%' },
								{ type: STRING, value: '+' }
							]
						}
					}
				]
			},
			identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' }
		});
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_delim_tokens');
		expect(node?.modelType).toBe('supertype');
		expect(node).toBeInstanceOf(AssembledSupertype);
		const subtypes = (node as any).subtypeNames as string[];
		expect(subtypes).not.toContain('%');
		expect(subtypes).not.toContain('+');
		// `_non_delim_token` and `_non_special_token` are transparent CHOICE
		// wrappers with no independent alias-mint body — they resolve straight
		// through to `identifier` and never surface as their own subtype
		// entries. The REPEAT1(CHOICE('%','+')) arm resolves to nothing
		// (opaque), so it contributes no entries at all — not even a hidden
		// placeholder — confirming the resolver treats it as inert rather
		// than as a source of bogus subtype names.
		expect(subtypes).toEqual(['identifier']);
	});

	// PR-137 follow-on-4 regression fixture (2026-07-05): reproduces python's
	// `_simple_pattern` supertype chain, whose subtype resolution reaches
	// `_simple_pattern_negative` (the polymorph-variant-adopted `-1`/`-1.0`
	// match-pattern arm — `grammar.sittir.ts`'s `_simple_pattern: { '11':
	// 'negative' }`), a SEQ containing one anonymous optional literal ('-')
	// plus one nonterminal (a CHOICE of `integer`/`float`). On the
	// `normalizedRules` view (wrapper-deletion only) this stays a top-level
	// SEQ — a shape `resolveHiddenRuleContent`'s switch has NO case for, so
	// it falls to `default: return []` (opaque), and the "opaque → keep the
	// hidden name as-is" fallback correctly preserves `_simple_pattern_negative`
	// as its own subtype entry. A migration to `ctx.rules` (SimplifiedRule)
	// was tried and rejected because `simplifySeqRule`'s anonymous-literal
	// stripping deletes the bare '-' and the resulting single-member seq
	// collapses to the inner `CHOICE(integer, float)` — a shape the CHOICE
	// case DOES handle — wrongly expanding to `integer`/`float` directly and
	// discarding `_simple_pattern_negative`'s own name. This is the SEQ-shape
	// sibling of the REPEAT1(CHOICE(...)) fixture above: same bug class
	// (opaque wrapper shape unmasked into a dispatchable one), different
	// trigger (simplify's SEQ-collapse rather than wrapper-deletion's
	// multiplicity stamping) — see `resolveHiddenRuleContent`'s explicit
	// `case SEQ` and `AssembleCtx`'s class doc comment for the full
	// root-cause writeup.
	it('keeps a SEQ(OPTIONAL(literal), CHOICE(...)) polymorph-variant arm opaque in supertype subtype resolution', () => {
		const normalized = makeNormalized({
			_simple_pattern: {
				type: SUPERTYPE,
				name: '_simple_pattern',
				subtypes: [
					{ type: SYMBOL, name: 'identifier' },
					{ type: SYMBOL, name: '_simple_pattern_negative' }
				]
			},
			_simple_pattern_negative: {
				type: SEQ,
				members: [
					{ type: OPTIONAL, content: { type: STRING, value: '-' } },
					{
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: 'integer' },
							{ type: SYMBOL, name: 'float' }
						]
					}
				]
			},
			identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
			integer: { type: PATTERN, value: '[0-9]+' },
			float: { type: PATTERN, value: '[0-9]+\\.[0-9]+' }
		});
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_simple_pattern');
		expect(node?.modelType).toBe('supertype');
		expect(node).toBeInstanceOf(AssembledSupertype);
		const subtypes = (node as any).subtypeNames as string[];
		expect(subtypes).not.toContain('integer');
		expect(subtypes).not.toContain('float');
		// The SEQ arm resolves to nothing (opaque), so the "keep the hidden
		// name as-is" fallback preserves `_simple_pattern_negative` itself as
		// the subtype entry — never its inner integer/float leaf types.
		expect(subtypes).toEqual(['identifier', '_simple_pattern_negative']);
	});
});

describe('Assemble — classifyNode — separatedList', () => {
	it('classifies a rule with a nonterminal separator as separatedList', () => {
		const rule: Rule<'link'> = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: {
				value: {
					type: CHOICE,
					members: [
						{ type: STRING, value: ',' },
						{ type: STRING, value: ';' }
					]
				}
			}
		};
		expect(classifyNode('member_list', flatten(rule))).toBe('list');
	});

	it('classifies a rule with a literal separator and an optional trailing flank as separatedList', () => {
		const rule: Rule<'link'> = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: {
				value: { type: STRING, value: ',' },
				trailing: 'optional'
			}
		};
		expect(classifyNode('member_list', flatten(rule))).toBe('list');
	});

	it('classifies a rule with a literal separator and an optional leading flank as separatedList', () => {
		const rule: Rule<'link'> = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: {
				value: { type: STRING, value: ',' },
				leading: 'optional'
			}
		};
		expect(classifyNode('member_list', flatten(rule))).toBe('list');
	});

	it('does NOT classify a rule with a literal separator and no flank as separatedList', () => {
		// No flank and a literal separator: wrapper-deletion stamps
		// multiplicity+separator directly on the bare SYMBOL body, which is
		// a one-symbol body — 'envelope', not a list.
		const rule: Rule<'link'> = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: {
				value: { type: STRING, value: ',' }
			}
		};
		expect(classifyNode('member_list', flatten(rule))).toBe('envelope');
	});

	it('does NOT classify a branch with one array-multiplicity field among several named fields as separatedList', () => {
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{
					type: FIELD,
					name: 'name',
					content: { type: SYMBOL, name: 'identifier' }
				},
				{
					type: FIELD,
					name: 'items',
					content: {
						type: REPEAT1,
						content: { type: SYMBOL, name: 'item' },
						separator: {
							value: { type: STRING, value: ',' },
							trailing: 'optional'
						}
					}
				}
			]
		};
		expect(classifyNode('some_branch', flatten(rule))).toBe('branch');
	});
});

describe('AssembledList — construction', () => {
	it('derives elements/separatorRule/leadingDelimiter/trailingDelimiter for a nonterminal separator', () => {
		const sepChoice = flatten({
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		});
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice }
		};
		const node = new AssembledList('member_list', rule, undefined, {
			separatorRule: sepChoice,
			simplifiedRule: { type: SYMBOL, name: 'member' },
			renderRule: { type: SYMBOL, name: 'member' }
		});

		expect(node.elements).toHaveLength(1);
		expect(node.elements[0]).toMatchObject({ multiplicity: 'nonEmptyArray' });
		expect(node.separatorRule).toBe(sepChoice);
		expect(node.leadingDelimiter).toBe('none');
		expect(node.trailingDelimiter).toBe('none');
	});

	it('derives separatorRule=undefined and trailingDelimiter=optional for a literal separator with an optional trailing flank', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const node = new AssembledList('member_list', rule, undefined, {
			separatorRule: undefined,
			simplifiedRule: { type: SYMBOL, name: 'member' },
			renderRule: { type: SYMBOL, name: 'member' }
		});

		expect(node.separatorRule).toBeUndefined();
		expect(node.trailingDelimiter).toBe('optional');
		expect(node.leadingDelimiter).toBe('none');
	});

	it('derives separatorRule=undefined and leadingDelimiter=optional for a literal separator with an optional leading flank', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, leading: 'optional' }
		};
		const node = new AssembledList('member_list', rule, undefined, {
			separatorRule: undefined,
			simplifiedRule: { type: SYMBOL, name: 'member' },
			renderRule: { type: SYMBOL, name: 'member' }
		});

		expect(node.separatorRule).toBeUndefined();
		expect(node.leadingDelimiter).toBe('optional');
		expect(node.trailingDelimiter).toBe('none');
	});

	it('derives nonEmptyArray-multiplicity elements for a nonEmptyArray-multiplicity element rule', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const node = new AssembledList('member_list', rule, undefined, {
			separatorRule: undefined,
			simplifiedRule: { type: SYMBOL, name: 'member' },
			renderRule: { type: SYMBOL, name: 'member' }
		});

		expect(node.elements).toHaveLength(1);
		expect(node.elements[0]).toMatchObject({ multiplicity: 'nonEmptyArray' });
		expect(node.nonEmpty).toBe(true);
	});

	it('derives array-multiplicity elements for an array-multiplicity element rule', () => {
		const rule: SymbolRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const node = new AssembledList('member_list', rule, undefined, {
			separatorRule: undefined,
			simplifiedRule: { type: SYMBOL, name: 'member' },
			renderRule: { type: SYMBOL, name: 'member' }
		});

		expect(node.elements).toHaveLength(1);
		expect(node.elements[0]).toMatchObject({ multiplicity: 'array' });
		expect(node.nonEmpty).toBe(false);
	});
});

describe('Assemble — T027a empty seq after stripping', () => {
	it('classifies a named seq of pure punctuation as a pattern', () => {
		// PR-P Task 2: Link no longer wraps pure-terminal subtrees as TerminalRule.
		// Rules arrive as their original unwrapped type; classifyNode dispatches
		// terminal-shaped SEQs through classifyTerminalFallback (isAllTextShape → 'pattern').
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: '{' },
				{ type: STRING, value: '}' }
			]
		};
		const modelType = classifyNode('braces', flatten(rule));
		expect(modelType).toBe('pattern');
	});
});

describe('Rule — deriveFields', () => {
	it('extracts fields from a seq rule', () => {
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{
					type: FIELD,
					name: 'name',
					content: { type: SYMBOL, name: 'identifier' }
				},
				{
					type: FIELD,
					name: 'body',
					content: { type: SYMBOL, name: 'block' }
				}
			]
		};
		const fields = deriveFields(rule);
		expect(fields).toHaveLength(2);
		expect(fields[0]!.name).toBe('name');
		expect(fields[1]!.name).toBe('body');
	});

	it('derives required=true for non-optional fields', () => {
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'x', content: { type: SYMBOL, name: 'y' } }]
		};
		const fields = deriveFields(rule);
		expect(isRequired(fields[0]!)).toBe(true);
	});

	it('derives required=false for optional fields', () => {
		const rule: Rule<'link'> = {
			type: OPTIONAL,
			content: {
				type: FIELD,
				name: 'x',
				content: { type: SYMBOL, name: 'y' }
			}
		};
		const fields = deriveFields(rule);
		expect(isRequired(fields[0]!)).toBe(false);
	});

	it('derives multiple=true for repeated fields', () => {
		const rule: Rule<'link'> = {
			type: REPEAT,
			content: {
				type: FIELD,
				name: 'items',
				content: { type: SYMBOL, name: 'item' }
			}
		};
		const fields = deriveFields(rule);
		expect(isMultiple(fields[0]!)).toBe(true);
	});

	it('structural field-or-child choice distributes into per-arm slots (nonterminal model)', () => {
		// Nonterminal-driven model (2026-05-21): a STRUCTURAL choice (an arm is a
		// multi-member seq or carries a named field) is NOT one opaque union slot.
		// Each arm contributes its own slot; the same name across arms folds into
		// one (mergeChoiceArms), and a slot absent from some arm is relaxed to
		// optional. This is required so `variable_declarator`-shaped
		// `choice(seq(field('name'),...), ...)` keeps its distinct `name`/`type`/
		// `value` fields instead of collapsing to a single `content`. A choice of
		// BARE kinds / literals (no fields, no seqs) is still ONE union slot.
		const rule: Rule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'default' },
				{
					type: CHOICE,
					members: [
						{
							type: FIELD,
							name: 'declaration',
							content: { type: SYMBOL, name: 'declaration' }
						},
						{ type: SYMBOL, name: '_export_statement_default_decl_arm_default_kw_value' }
					]
				}
			]
		};

		const slots = deriveSlots(flatten(rule));
		// Two slots — one per arm. The field arm yields a named `declaration`
		// slot; the bare-symbol arm yields its kind-named (inferred) slot. Neither
		// collapses into a single opaque `content` union.
		const slotNames = slots.map((s) => s.name).sort();
		expect(slotNames).toEqual(['declaration', 'export_statement_default_decl_arm_default_kw_value'].sort());
		const declSlot = slots.find((s) => s.name === 'declaration')!;
		expect(declSlot.isUnnamed).toBe(false);
		const declValueNames = declSlot.values.map((value) =>
			'node' in value ? (value.node as { name?: string }).name : value.value
		);
		expect(declValueNames).toContain('declaration');
	});
});

describe('Assemble — naming', () => {
	it('nameNode converts snake_case kind to PascalCase typeName', () => {
		const result = nameNode('function_item');
		expect(result.typeName).toBe('FunctionItem');
	});

	it('nameNode generates camelCase factoryName', () => {
		const result = nameNode('function_item');
		expect(result.factoryName).toBe('functionItem');
	});
});

describe('Assemble — assemble()', () => {
	it('produces a NodeMap with classified nodes', () => {
		const normalized = makeNormalized({
			function_item: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{
						type: FIELD,
						name: 'name',
						content: { type: SYMBOL, name: 'identifier' }
					}
				]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const nodeMap = assemble(AssembleCtx.from(normalized));
		expect(nodeMap.name).toBe('test');
		// A single field ('name') is a one-symbol body once the fixed 'fn'
		// literal is stripped by simplify — 'envelope', not 'branch'.
		expect(nodeMap.nodes.get('function_item')?.modelType).toBe('envelope');
		expect(nodeMap.nodes.get('identifier')?.modelType).toBe('pattern');
	});

	it('assigns typeName and factoryName to nodes', () => {
		const normalized = makeNormalized({
			function_item: {
				type: SEQ,
				members: [
					{
						type: FIELD,
						name: 'name',
						content: { type: SYMBOL, name: 'id' }
					}
				]
			},
			id: { type: PATTERN, value: '[a-z]+' }
		});
		const nodeMap = assemble(AssembleCtx.from(normalized));
		const fnNode = nodeMap.nodes.get('function_item')!;
		expect(fnNode.typeName).toBe('FunctionItem');
		expect(fnNode.factoryName).toBe('functionItem');
	});
});

describe('Assemble — collectAnonymousNodes catalog-first naming', () => {
	function makeIdTables(kindIds: Record<string, GeneratedIdEntry>): GeneratedIdTables {
		return { kindIds, sourceArtifact: 'test' };
	}

	function anonEntry(id: number, symbolName: string): GeneratedIdEntry {
		return {
			id,
			parser: {
				cSymbol: `anon_sym_${id}`,
				parserName: symbolName,
				symbolName,
				anon: true,
				aux: false,
				alias: false,
				hidden: false
			}
		};
	}

	it('mints enum CHOICE members catalog-first (member literals are reachable anon nodes)', () => {
		const normalized = makeNormalized({
			op: {
				type: CHOICE,
				members: [
					{ type: STRING, value: 'in' },
					{ type: STRING, value: 'of' }
				]
			} as unknown as Rule<'link'>,
			root: {
				type: SEQ,
				members: [
					{ type: SYMBOL, name: 'op' },
					{ type: SYMBOL, name: 'identifier' }
				]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const generatedIdTables = makeIdTables({ kw_in: anonEntry(7, 'in'), kw_of: anonEntry(8, 'of') });
		const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
		expect(nodeMap.nodes.has('kw_in')).toBe(true);
		expect(nodeMap.nodes.has('kw_of')).toBe(true);
		expect(nodeMap.nodes.has('in')).toBe(false);
	});

	it('keys an anonymous literal by its catalog kind name, not by raw text', () => {
		const normalized = makeNormalized({
			root: {
				type: SEQ,
				members: [
					{ type: STRING, value: ',' },
					{ type: SYMBOL, name: 'identifier' }
				]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const generatedIdTables = makeIdTables({ comma: anonEntry(5, ',') });
		const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
		expect(nodeMap.nodes.has('comma')).toBe(true);
		expect(nodeMap.nodes.has(',')).toBe(false);
	});

	it('does not mint a literal with no anonymous parser symbol and records a diagnosable warning', () => {
		const normalized = makeNormalized({
			root: {
				type: SEQ,
				members: [
					{ type: STRING, value: '::=' },
					{ type: SYMBOL, name: 'identifier' }
				]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const generatedIdTables = makeIdTables({ unrelated: anonEntry(9, '@@') });
		const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
		expect(nodeMap.nodes.has('::=')).toBe(false);
		expect(nodeMap.assembleWarnings.some((w) => w.code === 'kindid-unstamped-anon-literal')).toBe(true);
	});

	it('skips minting an anonymous node when the catalog-resolved kind name is already a named node', () => {
		const normalized = makeNormalized({
			comma: { type: PATTERN, value: '[,]' },
			root: {
				type: SEQ,
				members: [
					{ type: STRING, value: ',' },
					{ type: SYMBOL, name: 'identifier' }
				]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const generatedIdTables = makeIdTables({ comma: anonEntry(5, ',') });
		const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
		// The named 'comma' PATTERN rule keeps its own classification -- the
		// anonymous ',' literal resolving to the same catalog kind name must
		// not overwrite it with an AssembledToken/Keyword.
		expect(nodeMap.nodes.get('comma')?.modelType).toBe('pattern');
	});

	it('materializes a nested-supertype parse alias as its own AssembledSupertype, with the catalog available', () => {
		const normalized = makeNormalized({
			_inner: { type: SUPERTYPE, name: '_inner', subtypes: [{ type: SYMBOL, name: 'identifier' }] },
			_outer: {
				type: SUPERTYPE,
				name: '_outer',
				subtypes: [{ type: SYMBOL, name: '_inner', aliasedTo: 'inner_alias' }]
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		});
		const generatedIdTables = makeIdTables({ identifier: anonEntry(7, 'identifier') });
		const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
		const aliasNode = nodeMap.nodes.get('inner_alias');
		expect(aliasNode?.modelType).toBe('supertype');
		expect(aliasNode).toBeInstanceOf(AssembledSupertype);
		expect((aliasNode as AssembledSupertype).subtypeNames).toEqual(['identifier']);
	});

	it('AssembledSupertype constructor trusts each pre-stamped SubtypeRef directly, no re-derivation', () => {
		const rule: Rule<'link'> = {
			type: SUPERTYPE,
			name: '_expression',
			subtypes: [
				{ type: SYMBOL, name: 'identifier', kindId: 99 },
				{ type: SYMBOL, name: '_simple_statements', aliasedTo: 'block', kindId: 77, aliasedToId: 42 }
			]
		};
		const node = new AssembledSupertype('_expression', rule, [
			{ name: 'identifier', storageKindId: 99 },
			{ name: '_simple_statements', storageKindId: 77 }
		]);
		expect(node.subtypes.map((s) => s.storageKindId)).toEqual([99, 77]);
	});

	it("carries a nested supertype arm's own stamped kindId through to the flattened subtype list", () => {
		// `_outer` never directly references `identifier` / `_simple_statements` —
		// they're reachable ONLY through `_inner`'s own `subtypes`. Before the
		// stamped-SubtypeRef chain, only names directly in the OUTER rule's
		// `rule.subtypes` got their id re-derived by AssembledSupertype's
		// constructor; a flattened, nested-arm name silently landed with
		// storageKindId undefined. No kindEntries/catalog is passed anywhere
		// here — every id below must come from a ref stamp.
		const normalized = makeNormalized({
			_outer: {
				type: SUPERTYPE,
				name: '_outer',
				subtypes: [{ type: SYMBOL, name: '_inner', kindId: 10 }]
			},
			_inner: {
				type: SUPERTYPE,
				name: '_inner',
				subtypes: [
					{ type: SYMBOL, name: 'identifier', kindId: 99 },
					{ type: SYMBOL, name: '_simple_statements', aliasedTo: 'block', kindId: 77, aliasedToId: 42 }
				]
			}
		});
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_outer') as AssembledSupertype;
		expect(node.modelType).toBe('supertype');
		expect(node).toBeInstanceOf(AssembledSupertype);
		expect(node.subtypeNames).toEqual(['_inner', 'identifier', '_simple_statements']);
		expect(node.subtypes.map((s) => s.storageKindId)).toEqual([10, 99, 77]);
	});
});
