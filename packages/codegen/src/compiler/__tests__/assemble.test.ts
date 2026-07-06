import { CHOICE, FIELD, GROUP, OPTIONAL, PATTERN, REPEAT, SEQ, STRING, SUPERTYPE, SYMBOL, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
// PR-P Task 2: TERMINAL removed from import — TerminalRule deleted from Rule union.
import { describe, it, expect } from 'vitest';
import { assemble, AssembleCtx, classifyNode, simplifyRule, nameNode } from '../assemble.ts';
import { computeSimplifiedRules, SimplifyCtx, makeNormalizedGrammar } from '../simplify.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { applyWrapperDeletion, deleteWrapper } from '../wrapper-deletion.ts';
import type { Rule } from '../../types/rule.ts';
import type { SimplifiedGrammar } from '../types.ts';
import { deriveSlots, isRequired, isMultiple, allSlotsOf } from '../model/node-map.ts';

// Helper — fields-equivalent view over deriveSlots: every slot that came
// from a grammar `field(name, ...)` wrapper (excludes kind-derived
// positional children, which are unnamed).
// Pre-process raw rules through deleteWrapper so deriveSlotsRaw receives
// canonical (wrapper-free) input — mirrors how the production pipeline
// applies applyWrapperDeletion before assembling.
function deriveFields(rule: Rule<'link'>) {
	return deriveSlots(deleteWrapper(rule)).filter((s) => !s.isUnnamed);
}

function makeNormalized(rules: Record<string, Rule<'link'>>, overrides?: Partial<SimplifiedGrammar>): SimplifiedGrammar {
	const normalizedRules = applyWrapperDeletion(rules);
	const simplifiedRules = computeSimplifiedRules(new SimplifyCtx({ grammar: makeNormalizedGrammar(normalizedRules), diagnostics: new DiagnosticSink() }));
	// If topLevelAliasBodies are provided, thread them through the same pipeline
	// so their canonical snapshots are available under the alias kind name.
	if (overrides?.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule<'link'>> = Object.fromEntries(overrides.topLevelAliasBodies);
		const aliasBodiesRender = applyWrapperDeletion(aliasBodiesRaw);
		const aliasBodiesSimplified = computeSimplifiedRules(new SimplifyCtx({ grammar: makeNormalizedGrammar(aliasBodiesRender), diagnostics: new DiagnosticSink() }));
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			normalizedRules[kind] = rule;
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}
	return {
		name: 'test',
		linkRules: rules,
		normalizedRules,
		rules: simplifiedRules,
		supertypes: new Set(),
		word: null,
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}

describe('Assemble — simplifyRule', () => {
	// simplifyRule's input must be field-node-free (applyWrapperDeletion must
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
		// wrapper-deletion: field('body', sym('block')) → sym('block', {fieldName:'body', nonterminal:true})
		const rule = applyWrapperDeletion({ x: rawRule }).x!;
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
		const rule = applyWrapperDeletion({ x: rawRule }).x!;
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
		expect(classifyNode('function_item', rule)).toBe('branch');
	});

	it('classifies visible repeat as branch (container-shape)', () => {
		// Phase 1d.vii (spec 022): the prior `'container'` modelType was
		// folded into `'branch'`. Container-shape kinds (no `field()` on
		// the rule) are still `AssembledBranch` instances; the per-emitter
		// discriminator is now `AssembledBranch.isContainerShape`.
		const rule: Rule<'link'> = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'item' }
		};
		expect(classifyNode('items', rule)).toBe('branch');
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
		expect(classifyNode('binary_op', rule)).toBe('branch');
	});

	it('classifies visible pattern as pattern', () => {
		const rule: Rule<'link'> = { type: PATTERN, value: '[a-z]+' };
		expect(classifyNode('identifier', rule)).toBe('pattern');
	});

	it('classifies visible single alphanumeric string as keyword', () => {
		const rule: Rule<'link'> = { type: STRING, value: 'true' };
		expect(classifyNode('true', rule)).toBe('keyword');
	});

	it('classifies visible non-alphanumeric string as token (T027b)', () => {
		const rule: Rule<'link'> = { type: STRING, value: '->' };
		expect(classifyNode('arrow', rule)).toBe('token');
	});

	it('classifies enum as enum', () => {
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: 'pub' },
				{ type: STRING, value: 'crate' }
			]
		};
		expect(classifyNode('visibility', rule)).toBe('enum');
	});

	it('classifies hidden choice as supertype when already SupertypeRule', () => {
		const rule: Rule<'link'> = {
			type: SUPERTYPE,
			name: '_expression',
			subtypes: ['binary_expression', 'identifier']
		};
		expect(classifyNode('_expression', rule)).toBe('supertype');
	});

	it('classifies SupertypeRule (from Link) as supertype regardless of name', () => {
		// Link classifies hidden choice-of-symbols as SupertypeRule
		// Assemble just passes it through — no name check needed
		const rule: Rule<'link'> = {
			type: SUPERTYPE,
			name: 'expression',
			subtypes: ['binary_expression', 'identifier']
		};
		expect(classifyNode('expression', rule)).toBe('supertype');
		expect(classifyNode('_expression', rule)).toBe('supertype');
		expect(classifyNode('anything', rule)).toBe('supertype');
	});

	it('classifies hidden seq with fields as group', () => {
		const rule: Rule<'link'> = {
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
		};
		expect(classifyNode('_sig', rule)).toBe('group');
	});

	it('assembles hidden alias sources from their captured leaf body', () => {
		const normalized = makeNormalized(
			{
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				_type_identifier: {
					type: SYMBOL,
					name: 'type_identifier',
					aliasedFrom: 'identifier'
				}
			},
			{
				topLevelAliasBodies: new Map([
					['_type_identifier', { type: PATTERN, value: '[A-Za-z_]\\w*' } satisfies Rule]
				])
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
					name: 'pair',
					aliasedFrom: '_pair_source'
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
					subtypes: ['identifier', 'string']
				},
				_property_identifier: {
					type: SUPERTYPE,
					name: '_property_identifier',
					subtypes: ['identifier']
				},
				identifier: { type: PATTERN, value: '[A-Za-z_]\\w*' },
				string: { type: PATTERN, value: '".*"' }
			},
			{
				topLevelAliasBodies: new Map([
					[
						'_property_identifier',
						{ type: SYMBOL, name: 'identifier' } satisfies Rule
					]
				])
			}
		);
		const node = assemble(AssembleCtx.from(normalized)).nodes.get('_property_name');
		expect(node?.modelType).toBe('supertype');
		expect((node as any).subtypes).toEqual(['identifier', 'string', '_property_identifier']);
	});

	it('includes nested alias-member hidden kinds in supertype subtype expansion', () => {
		const normalized = makeNormalized(
			{
				_property_name: {
					type: SUPERTYPE,
					name: '_property_name',
					subtypes: ['identifier', 'string']
				},
				_type_identifier: {
					type: SUPERTYPE,
					name: '_type_identifier',
					subtypes: ['identifier']
				},
				_reserved_identifier: {
					type: SUPERTYPE,
					name: '_reserved_identifier',
					subtypes: ['identifier']
				},
				_property_identifier: {
					type: SUPERTYPE,
					name: '_property_identifier',
					subtypes: ['_type_identifier', '_reserved_identifier', 'identifier']
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
		expect((node as any).subtypes).toEqual([
			'identifier',
			'string',
			'_type_identifier',
			'_property_identifier'
		]);
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
		const modelType = classifyNode('braces', rule);
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

		const slots = deriveSlots(deleteWrapper(rule));
		// Two slots — one per arm. The field arm yields a named `declaration`
		// slot; the bare-symbol arm yields its kind-named (inferred) slot. Neither
		// collapses into a single opaque `content` union.
		const slotNames = slots.map((s) => s.name).sort();
		expect(slotNames).toEqual(
			['declaration', 'export_statement_default_decl_arm_default_kw_value'].sort()
		);
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
		expect(nodeMap.nodes.get('function_item')?.modelType).toBe('branch');
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

