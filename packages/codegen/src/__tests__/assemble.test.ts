import { describe, it, expect } from 'vitest';
import { assemble, classifyNode, simplifyRule, nameNode, nameField } from '../compiler/assemble.ts';
import { simplifyRules } from '../compiler/simplify.ts';
import { applyWrapperDeletion } from '../compiler/wrapper-deletion.ts';
import type { Rule } from '../compiler/rule.ts';
import type { OptimizedGrammar } from '../compiler/types.ts';
import { deriveSlots, isRequired, isMultiple, allSlotsOf } from '../compiler/node-map.ts';

// Helper — fields-equivalent view over deriveSlots: every slot that came
// from a grammar `field(name, ...)` wrapper (excludes kind-derived
// positional children, which carry source='inferred').
function deriveFields(rule: Parameters<typeof deriveSlots>[0]) {
	return deriveSlots(rule).filter((s) => s.source !== 'inferred');
}

function makeOptimized(rules: Record<string, Rule>, overrides?: Partial<OptimizedGrammar>): OptimizedGrammar {
	const renderRules = applyWrapperDeletion(rules);
	const simplifiedRules = simplifyRules(renderRules);
	// If topLevelAliasBodies are provided, thread them through the same pipeline
	// so their canonical snapshots are available under the alias kind name.
	if (overrides?.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule> = Object.fromEntries(overrides.topLevelAliasBodies);
		const aliasBodiesRender = applyWrapperDeletion(aliasBodiesRaw);
		const aliasBodiesSimplified = simplifyRules(aliasBodiesRender);
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			renderRules[kind] = rule;
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}
	return {
		name: 'test',
		rules,
		renderRules,
		simplifiedRules,
		supertypes: new Set(),
		word: null,
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}

describe('Assemble — simplifyRule', () => {
	it('strips non-alphanumeric string nodes and collapses single-member seq', () => {
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: '{' },
				{
					type: 'field',
					name: 'body',
					content: { type: 'symbol', name: 'block' }
				},
				{ type: 'string', value: '}' }
			]
		};
		const simplified = simplifyRule(rule);
		// After stripping { and }, only the field remains → single-member seq collapses to the field
		expect(simplified.type).toBe('field');
		expect((simplified as any).name).toBe('body');
	});

	it('collapses single-member seq to its content', () => {
		const rule: Rule = {
			type: 'seq',
			members: [{ type: 'field', name: 'x', content: { type: 'symbol', name: 'y' } }]
		};
		const simplified = simplifyRule(rule);
		expect(simplified.type).toBe('field');
	});

	it('keeps alphanumeric strings', () => {
		const rule: Rule = { type: 'string', value: 'pub' };
		const simplified = simplifyRule(rule);
		expect(simplified).toEqual({ type: 'string', value: 'pub' });
	});
});

describe('Assemble — classifyNode', () => {
	it('classifies visible seq with fields as branch', () => {
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{
					type: 'field',
					name: 'name',
					content: { type: 'symbol', name: 'identifier' }
				},
				{ type: 'string', value: '(' },
				{ type: 'string', value: ')' },
				{
					type: 'field',
					name: 'body',
					content: { type: 'symbol', name: 'block' }
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
		const rule: Rule = {
			type: 'repeat',
			content: { type: 'symbol', name: 'item' }
		};
		expect(classifyNode('items', rule)).toBe('branch');
	});

	it('classifies a PolymorphRule as polymorph', () => {
		// PolymorphRule is produced by Optimize's promotePolymorph pass;
		// classifyNode just dispatches on rule.type.
		const rule: Rule = {
			type: 'polymorph',
			forms: [
				{
					name: 'if',
					content: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'condition',
								content: { type: 'symbol', name: 'expr' }
							}
						]
					}
				},
				{
					name: 'while',
					content: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'body',
								content: { type: 'symbol', name: 'block' }
							}
						]
					}
				}
			]
		};
		expect(classifyNode('statement', rule)).toBe('polymorph');
	});

	it('classifies visible choice with same field set as branch', () => {
		const rule: Rule = {
			type: 'choice',
			members: [
				{
					type: 'variant',
					name: 'plus',
					content: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'left',
								content: { type: 'symbol', name: 'expr' }
							},
							{ type: 'string', value: '+' },
							{
								type: 'field',
								name: 'right',
								content: { type: 'symbol', name: 'expr' }
							}
						]
					}
				},
				{
					type: 'variant',
					name: 'minus',
					content: {
						type: 'seq',
						members: [
							{
								type: 'field',
								name: 'left',
								content: { type: 'symbol', name: 'expr' }
							},
							{ type: 'string', value: '-' },
							{
								type: 'field',
								name: 'right',
								content: { type: 'symbol', name: 'expr' }
							}
						]
					}
				}
			]
		};
		expect(classifyNode('binary_op', rule)).toBe('branch');
	});

	it('classifies visible pattern as pattern', () => {
		const rule: Rule = { type: 'pattern', value: '[a-z]+' };
		expect(classifyNode('identifier', rule)).toBe('pattern');
	});

	it('classifies visible single alphanumeric string as keyword', () => {
		const rule: Rule = { type: 'string', value: 'true' };
		expect(classifyNode('true', rule)).toBe('keyword');
	});

	it('classifies visible non-alphanumeric string as token (T027b)', () => {
		const rule: Rule = { type: 'string', value: '->' };
		expect(classifyNode('arrow', rule)).toBe('token');
	});

	it('classifies enum as enum', () => {
		const rule: Rule = {
			type: 'enum',
			members: [
				{ type: 'string', value: 'pub' },
				{ type: 'string', value: 'crate' }
			]
		};
		expect(classifyNode('visibility', rule)).toBe('enum');
	});

	it('classifies hidden choice as supertype when already SupertypeRule', () => {
		const rule: Rule = {
			type: 'supertype',
			name: '_expression',
			subtypes: ['binary_expression', 'identifier'],
			source: 'grammar'
		};
		expect(classifyNode('_expression', rule)).toBe('supertype');
	});

	it('classifies SupertypeRule (from Link) as supertype regardless of name', () => {
		// Link classifies hidden choice-of-symbols as SupertypeRule
		// Assemble just passes it through — no name check needed
		const rule: Rule = {
			type: 'supertype',
			name: 'expression',
			subtypes: ['binary_expression', 'identifier'],
			source: 'grammar'
		};
		expect(classifyNode('expression', rule)).toBe('supertype');
		expect(classifyNode('_expression', rule)).toBe('supertype');
		expect(classifyNode('anything', rule)).toBe('supertype');
	});

	it('classifies hidden seq with fields as group', () => {
		const rule: Rule = {
			type: 'group',
			name: '_sig',
			content: {
				type: 'seq',
				members: [
					{
						type: 'field',
						name: 'params',
						content: { type: 'symbol', name: 'parameters' }
					}
				]
			}
		};
		expect(classifyNode('_sig', rule)).toBe('group');
	});

	it('assembles hidden alias sources from their captured leaf body', () => {
		const optimized = makeOptimized(
			{
				identifier: { type: 'pattern', value: '[A-Za-z_]\\w*' },
				_type_identifier: {
					type: 'symbol',
					name: 'type_identifier',
					aliasedFrom: 'identifier'
				}
			},
			{
				topLevelAliasBodies: new Map([
					['_type_identifier', { type: 'pattern', value: '[A-Za-z_]\\w*' } satisfies Rule]
				])
			}
		);
		const node = assemble(optimized).nodes.get('_type_identifier');
		expect(node?.modelType).toBe('pattern');
	});

	it('assembles hidden alias sources from their captured structural body', () => {
		const optimized = makeOptimized(
			{
				expr: { type: 'pattern', value: '[A-Za-z_]\\w*' },
				_pair_alias: {
					type: 'symbol',
					name: 'pair',
					aliasedFrom: '_pair_source'
				}
			},
			{
				topLevelAliasBodies: new Map([
					[
						'_pair_alias',
						{
							type: 'seq',
							members: [
								{
									type: 'field',
									name: 'left',
									content: { type: 'symbol', name: 'expr' }
								},
								{ type: 'string', value: ',' },
								{
									type: 'field',
									name: 'right',
									content: { type: 'symbol', name: 'expr' }
								}
							]
						} satisfies Rule
					]
				])
			}
		);
		const node = assemble(optimized).nodes.get('_pair_alias');
		expect(node?.modelType).toBe('branch');
		expect(allSlotsOf(node!).map((slot) => slot.name)).toEqual(['left', 'right']);
	});

	it('includes alias-member hidden kinds in supertype subtype expansion', () => {
		const optimized = makeOptimized(
			{
				_property_name: {
					type: 'supertype',
					name: '_property_name',
					subtypes: ['identifier', 'string'],
					source: 'grammar'
				},
				_property_identifier: {
					type: 'supertype',
					name: '_property_identifier',
					subtypes: ['identifier'],
					source: 'grammar'
				},
				identifier: { type: 'pattern', value: '[A-Za-z_]\\w*' },
				string: { type: 'pattern', value: '".*"' }
			},
			{
				topLevelAliasBodies: new Map([
					[
						'_property_identifier',
						{ type: 'symbol', name: 'identifier' } satisfies Rule
					]
				])
			}
		);
		const node = assemble(optimized).nodes.get('_property_name');
		expect(node?.modelType).toBe('supertype');
		expect((node as any).subtypes).toEqual(['identifier', 'string', '_property_identifier']);
	});

	it('includes nested alias-member hidden kinds in supertype subtype expansion', () => {
		const optimized = makeOptimized(
			{
				_property_name: {
					type: 'supertype',
					name: '_property_name',
					subtypes: ['identifier', 'string'],
					source: 'grammar'
				},
				_type_identifier: {
					type: 'supertype',
					name: '_type_identifier',
					subtypes: ['identifier'],
					source: 'grammar'
				},
				_reserved_identifier: {
					type: 'supertype',
					name: '_reserved_identifier',
					subtypes: ['identifier'],
					source: 'grammar'
				},
				_property_identifier: {
					type: 'supertype',
					name: '_property_identifier',
					subtypes: ['_type_identifier', '_reserved_identifier', 'identifier'],
					source: 'grammar'
				},
				identifier: { type: 'pattern', value: '[A-Za-z_]\\w*' },
				string: { type: 'pattern', value: '\".*\"' }
			},
			{
				topLevelAliasBodies: new Map([
					['_type_identifier', { type: 'symbol', name: 'identifier' } satisfies Rule],
					[
						'_property_identifier',
						{
							type: 'choice',
							members: [
								{ type: 'symbol', name: '_type_identifier' },
								{ type: 'symbol', name: '_reserved_identifier' },
								{ type: 'symbol', name: 'identifier' }
							]
						} satisfies Rule
					]
				])
			}
		);
		const node = assemble(optimized).nodes.get('_property_name');
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
		// Post-Link, a pure-terminal subtree is wrapped as TerminalRule;
		// classifyNode then dispatches it to 'pattern' by rule.type alone.
		const rule: Rule = {
			type: 'terminal',
			content: {
				type: 'seq',
				members: [
					{ type: 'string', value: '{' },
					{ type: 'string', value: '}' }
				]
			}
		};
		const modelType = classifyNode('braces', rule);
		expect(modelType).toBe('pattern');
	});
});

describe('Rule — deriveFields', () => {
	it('extracts fields from a seq rule', () => {
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{
					type: 'field',
					name: 'name',
					content: { type: 'symbol', name: 'identifier' }
				},
				{
					type: 'field',
					name: 'body',
					content: { type: 'symbol', name: 'block' }
				}
			]
		};
		const fields = deriveFields(rule);
		expect(fields).toHaveLength(2);
		expect(fields[0]!.name).toBe('name');
		expect(fields[1]!.name).toBe('body');
	});

	it('derives required=true for non-optional fields', () => {
		const rule: Rule = {
			type: 'seq',
			members: [{ type: 'field', name: 'x', content: { type: 'symbol', name: 'y' } }]
		};
		const fields = deriveFields(rule);
		expect(isRequired(fields[0]!)).toBe(true);
	});

	it('derives required=false for optional fields', () => {
		const rule: Rule = {
			type: 'optional',
			content: {
				type: 'field',
				name: 'x',
				content: { type: 'symbol', name: 'y' }
			}
		};
		const fields = deriveFields(rule);
		expect(isRequired(fields[0]!)).toBe(false);
	});

	it('derives multiple=true for repeated fields', () => {
		const rule: Rule = {
			type: 'repeat',
			content: {
				type: 'field',
				name: 'items',
				content: { type: 'symbol', name: 'item' }
			}
		};
		const fields = deriveFields(rule);
		expect(isMultiple(fields[0]!)).toBe(true);
	});

	it('preserves named fields across mixed field-or-child choices', () => {
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'default' },
				{
					type: 'choice',
					members: [
						{
							type: 'field',
							name: 'declaration',
							content: { type: 'symbol', name: 'declaration' }
						},
						{ type: 'symbol', name: '_export_statement_default_decl_arm_default_kw_value' }
					]
				}
			]
		};

		const slots = deriveSlots(rule);
		const declaration = slots.find((slot) => slot.name === 'declaration');
		const childSlot = slots.find((slot) => slot.source === 'inferred');

		expect(declaration).toBeDefined();
		expect(isRequired(declaration!)).toBe(false);
		expect(childSlot).toBeDefined();
		expect(isRequired(childSlot!)).toBe(false);
		expect(childSlot!.values.map((value) => ('node' in value ? (value.node as { name?: string }).name : value.value))).toContain(
			'_export_statement_default_decl_arm_default_kw_value'
		);
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

	it('nameField converts snake_case to camelCase', () => {
		const result = nameField('return_type');
		expect(result.propertyName).toBe('returnType');
		expect(result.paramName).toBe('returnType');
	});
});

describe('Assemble — assemble()', () => {
	it('produces a NodeMap with classified nodes', () => {
		const optimized = makeOptimized({
			function_item: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'fn' },
					{
						type: 'field',
						name: 'name',
						content: { type: 'symbol', name: 'identifier' }
					}
				]
			},
			identifier: { type: 'pattern', value: '[a-z]+' }
		});
		const nodeMap = assemble(optimized);
		expect(nodeMap.name).toBe('test');
		expect(nodeMap.nodes.get('function_item')?.modelType).toBe('branch');
		expect(nodeMap.nodes.get('identifier')?.modelType).toBe('pattern');
	});

	it('assigns typeName and factoryName to nodes', () => {
		const optimized = makeOptimized({
			function_item: {
				type: 'seq',
				members: [
					{
						type: 'field',
						name: 'name',
						content: { type: 'symbol', name: 'id' }
					}
				]
			},
			id: { type: 'pattern', value: '[a-z]+' }
		});
		const nodeMap = assemble(optimized);
		const fnNode = nodeMap.nodes.get('function_item')!;
		expect(fnNode.typeName).toBe('FunctionItem');
		expect(fnNode.factoryName).toBe('functionItem');
	});
});

describe('Assemble — T029a identical detect tokens', () => {
	it('assembles a PolymorphRule (from Optimize) with same detect token but different fields', () => {
		// Simulate Optimize's output: the heterogeneous-field choice has
		// been promoted to PolymorphRule with forms in declaration order.
		const optimized = makeOptimized({
			decl: {
				type: 'polymorph',
				forms: [
					{
						name: 'pub_item',
						content: {
							type: 'seq',
							members: [
								{ type: 'string', value: 'pub' },
								{
									type: 'field',
									name: 'item',
									content: { type: 'symbol', name: 'x' }
								}
							]
						}
					},
					{
						name: 'pub_alias',
						content: {
							type: 'seq',
							members: [
								{ type: 'string', value: 'pub' },
								{
									type: 'field',
									name: 'alias',
									content: { type: 'symbol', name: 'y' }
								}
							]
						}
					}
				]
			},
			x: { type: 'pattern', value: 'x' },
			y: { type: 'pattern', value: 'y' }
		});
		const nodeMap = assemble(optimized);
		const decl = nodeMap.nodes.get('decl');
		// Different field sets → polymorph, even though detect token is same
		expect(decl?.modelType).toBe('polymorph');
	});
});

describe('Assemble — override polymorph visible child kinds', () => {
	it('registers visible variant-child kinds from hidden source rules', () => {
		const optimized = makeOptimized({
			with_clause: {
				type: 'polymorph',
				source: 'override',
				forms: [
					{
						name: 'bare',
						content: { type: 'symbol', name: 'with_clause_bare' }
					},
					{
						name: 'paren',
						content: { type: 'symbol', name: 'with_clause_paren' }
					}
				]
			},
			_with_clause_bare: {
				type: 'seq',
				members: [
					{
						type: 'field',
						name: 'items',
						content: { type: 'symbol', name: 'with_item' }
					},
					{
						type: 'repeat',
						content: {
							type: 'seq',
							members: [
								{ type: 'string', value: ',' },
								{
									type: 'field',
									name: 'items',
									content: { type: 'symbol', name: 'with_item' }
								}
							]
						}
					}
				]
			},
			_with_clause_paren: {
				type: 'seq',
				members: [
					{ type: 'string', value: '(' },
					{
						type: 'field',
						name: 'items',
						content: { type: 'symbol', name: 'with_item' }
					},
					{ type: 'string', value: ')' }
				]
			},
			with_item: { type: 'pattern', value: '[a-z]+' }
		});
		const nodeMap = assemble(optimized);
		const bare = nodeMap.nodes.get('with_clause_bare');
		const paren = nodeMap.nodes.get('with_clause_paren');
		expect(bare).toBeDefined();
		expect(paren).toBeDefined();
		expect(bare?.modelType).not.toBe('multi');
		expect(paren?.modelType).not.toBe('multi');
		expect(bare?.factoryName).toBe('withClauseBare');
		expect(paren?.factoryName).toBe('withClauseParen');
	});

	it('downgrades merged polymorph singular slots that are absent in some forms', () => {
		const optimized = makeOptimized({
			rangeish: {
				type: 'polymorph',
				source: 'override',
				forms: [
					{
						name: 'with_left',
						content: {
							type: 'seq',
							members: [
								{
									type: 'field',
									name: 'left',
									content: { type: 'symbol', name: 'expr' }
								},
								{
									type: 'field',
									name: 'right',
									content: { type: 'symbol', name: 'expr' }
								}
							]
						}
					},
					{
						name: 'prefix',
						content: {
							type: 'field',
							name: 'right',
							content: { type: 'symbol', name: 'expr' }
						}
					}
				]
			},
			expr: { type: 'pattern', value: '[a-z]+' }
		});
		const nodeMap = assemble(optimized);
		const poly = nodeMap.nodes.get('rangeish');
		expect(poly?.modelType).toBe('polymorph');
		if (!poly || poly.modelType !== 'polymorph') {
			throw new Error('expected polymorph node');
		}
		expect(isRequired(poly.slots.left!)).toBe(false);
		expect(poly.slots.left?.values.map((value) => value.multiplicity)).toEqual(['optional']);
		expect(isRequired(poly.slots.right!)).toBe(true);
		expect(poly.slots.right?.values.map((value) => value.multiplicity)).toEqual(['single']);
	});

	it('downgrades merged polymorph repeated slots that are absent in some forms', () => {
		const optimized = makeOptimized({
			listish: {
				type: 'polymorph',
				source: 'override',
				forms: [
					{
						name: 'with_items',
						content: {
							type: 'field',
							name: 'item',
							content: {
								type: 'repeat1',
								content: { type: 'symbol', name: 'expr' }
							}
						}
					},
					{
						name: 'bare',
						content: { type: 'string', value: 'bare' }
					}
				]
			},
			expr: { type: 'pattern', value: '[a-z]+' }
		});
		const nodeMap = assemble(optimized);
		const poly = nodeMap.nodes.get('listish');
		expect(poly?.modelType).toBe('polymorph');
		if (!poly || poly.modelType !== 'polymorph') {
			throw new Error('expected polymorph node');
		}
		expect(isMultiple(poly.slots.item!)).toBe(true);
		expect(isRequired(poly.slots.item!)).toBe(false);
		expect(poly.slots.item?.values.map((value) => value.multiplicity)).toEqual(['array']);
	});
});
