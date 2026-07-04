import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChildFactoryArgs, nodeToConfig } from '../validate/common.ts';
import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';

function makeFactorySlots(
	kind: string,
	slots: Record<
		string,
		{
			unnamed: boolean;
			slotCount: number;
			required: boolean;
			multiple: boolean;
			nonEmpty: boolean;
		}
	>
) {
	return { [kind]: slots };
}

describe('nodeToConfig field promotion', () => {
	it('promotes lexical_declaration children into declarators and semicolon', () => {
		const config = nodeToConfig(
			{
				$type: 'lexical_declaration',
				_kind: { $type: 'const', $named: false, $text: 'const' },
				'_;': { $type: ';', $named: false, $text: ';' },
				$other: [
					{
						$type: 'variable_declarator',
						$named: true,
						$text: 'bar = "baz"'
					}
				]
			} as never,
			{
				factoryFields: {
					lexical_declaration: ['kind', 'declarators', 'semicolon']
				},
				factorySlots: makeFactorySlots('lexical_declaration', {
					kind: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
					declarators: { unnamed: false, slotCount: 1, required: true, multiple: true, nonEmpty: true },
					semicolon: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
				})
			}
		);

		expect(config).toMatchObject({
			kind: { $text: 'const' },
			declarators: [{ $type: 'variable_declarator' }],
			semicolon: { $text: ';' }
		});
		expect(config).not.toHaveProperty('children');
	});

	it('promotes object_type delimiters and members without treating separators as closing', () => {
		const config = nodeToConfig(
			{
				$type: 'object_type',
				'_{': { $type: '{', $named: false, $text: '{' },
				'_;': { $type: ';', $named: false, $text: ';' },
				'_}': { $type: '}', $named: false, $text: '}' },
				$other: [
					{
						$type: 'property_signature',
						$named: true,
						$text: 'foo: string'
					}
				]
			} as never,
			{
				factoryFields: {
					object_type: ['opening', 'members', 'closing']
				},
				factorySlots: makeFactorySlots('object_type', {
					opening: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
					members: { unnamed: false, slotCount: 1, required: true, multiple: true, nonEmpty: true },
					closing: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
				})
			}
		);

		expect(config).toMatchObject({
			opening: { $text: '{' },
			members: [{ $type: 'property_signature' }],
			closing: { $text: '}' }
		});
		expect(config).not.toHaveProperty('children');
	});

	it('treats unnamed slot members through the same member-value path as named slots', () => {
		const config = nodeToConfig({
			$type: 'argument_list',
			$source: 0,
			$named: true,
			$other: [55, { $type: 'identifier', $source: 0, $named: true, $text: 'x' }]
		} as never);

		expect(config.children).toEqual([{ $type: 'identifier', $source: 0, $named: true, $text: 'x' }]);
	});

	it('uses named slot metadata instead of payload shape for singular and repeated config slots', () => {
		const leaf = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };

		const singularConfig = nodeToConfig(
			{
				$type: 'single_field_parent',
				$source: 0,
				$named: true,
				_value: [leaf]
			} as never,
			{
				factorySlots: makeFactorySlots('single_field_parent', {
					value: {
						unnamed: false,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		const repeatedConfig = nodeToConfig(
			{
				$type: 'repeat_field_parent',
				$source: 0,
				$named: true,
				_items: leaf
			} as never,
			{
				factorySlots: makeFactorySlots('repeat_field_parent', {
					items: {
						unnamed: false,
						slotCount: 1,
						required: true,
						multiple: true,
						nonEmpty: true
					}
				})
			}
		);

		expect(singularConfig.value).toEqual(leaf);
		expect(repeatedConfig.items).toEqual([leaf]);
	});

	it('ignores dehoisted named slots that are not declared on the factory surface', () => {
		const field = { $type: 'field_declaration', $source: 0, $named: true, $text: 'i32' };
		const attribute = { $type: 'attribute_item', $source: 0, $named: true, $text: '#[cfg(test)]' };

		const config = nodeToConfig(
			{
				$type: 'ordered_field_declaration_list',
				$source: 0,
				$named: true,
				_type: [field],
				_attributes: [attribute, attribute],
				$other: [field]
			} as never,
			{
				factoryFields: {
					ordered_field_declaration_list: ['type']
				},
				factorySlots: makeFactorySlots('ordered_field_declaration_list', {
					type: { unnamed: false, slotCount: 1, required: false, multiple: true, nonEmpty: false },
					children: { unnamed: true, slotCount: 2, required: false, multiple: true, nonEmpty: false }
				})
			}
		);

		expect(config.type).toEqual([field]);
		expect(config).not.toHaveProperty('attributes');
	});

	it('uses unnamed children metadata instead of payload shape for one-vs-many reconstruction', () => {
		const left = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const right = { $type: 'number_literal', $source: 0, $named: true, $text: '1' };

		const singularChildren = nodeToConfig(
			{
				$type: 'single_child_parent',
				$source: 0,
				$named: true,
				$other: [left]
			} as never,
			{
				factorySlots: makeFactorySlots('single_child_parent', {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		const multiSlotSingularChildren = nodeToConfig(
			{
				$type: 'pair_parent',
				$source: 0,
				$named: true,
				$other: [left]
			} as never,
			{
				factorySlots: makeFactorySlots('pair_parent', {
					children: {
						unnamed: true,
						slotCount: 2,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		const multiSlotPluralChildren = nodeToConfig(
			{
				$type: 'pair_parent',
				$source: 0,
				$named: true,
				$other: [left, right]
			} as never,
			{
				factorySlots: makeFactorySlots('pair_parent', {
					children: {
						unnamed: true,
						slotCount: 2,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		expect(singularChildren.children).toEqual(left);
		expect(multiSlotSingularChildren.children).toEqual([left]);
		expect(multiSlotPluralChildren.children).toEqual([left, right]);
	});

	it('does not force multiple named children into a singular missing field', () => {
		const stmtA = { $type: 'type_alias_declaration', $source: 0, $named: true, $text: 'type A = []' };
		const stmtB = { $type: 'type_alias_declaration', $source: 0, $named: true, $text: 'type B = [A]' };

		const config = nodeToConfig(
			{
				$type: 'program',
				$source: 0,
				$named: true,
				_statements: [stmtA, stmtB],
				$other: [stmtA, stmtB]
			} as never,
			{
				factoryFields: {
					program: ['hash_bang_line', 'statements']
				},
				factorySlots: makeFactorySlots('program', {
					hash_bang_line: { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false },
					statements: { unnamed: false, slotCount: 1, required: true, multiple: true, nonEmpty: true }
				})
			}
		);

		expect(config.statements).toEqual([stmtA, stmtB]);
		expect(config).not.toHaveProperty('hashBangLine');
	});

	it('drops residual scalar token children from optional singular children slots', () => {
		const config = nodeToConfig(
			{
				$type: 'print_statement',
				$source: 0,
				$named: true,
				_argument: ['async', 'await'],
				$other: [12, 9]
			} as never,
			{
				factoryFields: {
					print_statement: ['argument']
				},
				factorySlots: makeFactorySlots('print_statement', {
					argument: { unnamed: false, slotCount: 1, required: false, multiple: true, nonEmpty: false },
					children: { unnamed: true, slotCount: 1, required: false, multiple: false, nonEmpty: false }
				})
			}
		);

		expect(config.argument).toEqual(['async', 'await']);
		expect(config).not.toHaveProperty('children');
	});

	it('throws when singular slot metadata receives multiple realized values', () => {
		const leafA = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const leafB = { $type: 'identifier', $source: 0, $named: true, $text: 'y' };

		expect(() =>
			nodeToConfig(
				{
					$type: 'single_child_parent',
					$source: 0,
					$named: true,
					$other: [leafA, leafB]
				} as never,
				{
					factorySlots: makeFactorySlots('single_child_parent', {
						children: {
							unnamed: true,
							slotCount: 1,
							required: true,
							multiple: false,
							nonEmpty: false
						}
					})
				}
			)
		).toThrow(/singular slot/i);
	});

	it('wraps recursive singular unnamed children back into spread arguments', () => {
		const leaf = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const calls: unknown[][] = [];
		const factoryMap = {
			spread_child: (...args: unknown[]) => {
				calls.push(args);
				return { $type: 'rebuilt', args };
			}
		};

		const config = nodeToConfig(
			{
				$type: 'parent',
				$source: 0,
				$named: true,
				_payload: {
					$type: 'spread_child',
					$source: 0,
					$named: true,
					$other: [leaf]
				}
			} as never,
			{
				tree: {} as never,
				factoryMap,
				factoryShapes: { spread_child: 'spread' },
				factoryFields: {
					parent: ['payload']
				},
				factorySlots: {
					...makeFactorySlots('parent', {
						payload: {
							unnamed: false,
							slotCount: 1,
							required: true,
							multiple: false,
							nonEmpty: false
						}
					}),
					...makeFactorySlots('spread_child', {
						children: {
							unnamed: true,
							slotCount: 1,
							required: true,
							multiple: false,
							nonEmpty: false
						}
					})
				}
			}
		);

		expect(calls).toEqual([[leaf]]);
		expect(config.payload).toEqual({ $type: 'rebuilt', args: [leaf] });
	});

	it('rebuilds direct child args from metadata for singular unnamed children', () => {
		const leaf = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const config = nodeToConfig(
			{
				$type: 'direct_child',
				$source: 0,
				$named: true,
				$other: [leaf]
			} as never,
			{
				factorySlots: makeFactorySlots('direct_child', {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		expect(config.children).toEqual(leaf);
		expect(
			getChildFactoryArgs(
				'direct_child',
				config,
				makeFactorySlots('direct_child', {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				})
			)
		).toEqual([leaf]);
	});

	it('keeps multi-slot unnamed children list-shaped when rebuilding child args', () => {
		const left = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const right = { $type: 'number_literal', $source: 0, $named: true, $text: '1' };
		const slots = makeFactorySlots('multi_child', {
			children: {
				unnamed: true,
				slotCount: 2,
				required: true,
				multiple: false,
				nonEmpty: false
			}
		});
		const config = nodeToConfig(
			{
				$type: 'multi_child',
				$source: 0,
				$named: true,
				$other: [left, right]
			} as never,
			{ factorySlots: slots }
		);

		expect(config.children).toEqual([left, right]);
		expect(getChildFactoryArgs('multi_child', config, slots)).toEqual([left, right]);
	});

	it('drops anonymous token children before assigning structural children slots', () => {
		const expr = { $type: 'identifier', $source: 0, $named: true, $text: 'answer' };
		const config = nodeToConfig(
			{
				$type: 'return_statement',
				$source: 0,
				$named: true,
				$other: [
					{ $type: 'return', $source: 0, $named: false, $text: 'return' },
					expr
				]
			} as never,
			{
				factorySlots: makeFactorySlots('return_statement', {
					children: {
						unnamed: true,
						slotCount: 1,
						required: false,
						multiple: false,
						nonEmpty: false
					}
				})
			}
		);

		expect(config.children).toEqual(expr);
	});

	it('uses the single CST named-child hint to narrow singular unnamed children', () => {
		const expr = { $type: 'identifier', $source: 0, $named: true, $text: 'answer' };
		const config = nodeToConfig(
			{
				$type: 'type_query',
				$source: 0,
				$named: true,
				$other: [17, expr]
			} as never,
			{
				factorySlots: makeFactorySlots('type_query', {
					children: {
						unnamed: true,
						slotCount: 1,
						required: true,
						multiple: false,
						nonEmpty: false
					}
				}),
				namedChildKindHints: ['identifier']
			}
		);

		expect(config.children).toEqual(expr);
	});

	it('promotes override-polymorph wrapper child surface into the parent config', () => {
		const parameters = { $type: 'closure_parameters', $source: 0, $named: true, $text: '||' };
		const body = { $type: 'tuple_expression', $source: 0, $named: true, $text: '()' };
		const config = nodeToConfig(
			{
				$type: 'closure_expression',
				$source: 0,
				$named: true,
				_async_marker: { $type: 'async', $source: 0, $named: false, $text: 'async' },
				_parameters: parameters,
				$other: [
					{
						$type: 'closure_expression_expr',
						$source: 0,
						$named: true,
						_body: body
					}
				]
			} as never,
			{
				factoryFields: {
					_closure_expression_expr: ['body']
				},
				factorySlots: {
					...makeFactorySlots('closure_expression', {
						async_marker: { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false },
						parameters: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
						children: { unnamed: true, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					}),
					...makeFactorySlots('closure_expression_expr', {
						body: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					})
				},
				polymorphVariants: {
					closure_expression: {
						definedBy: 'override',
						childKind: {
							closure_expression_block: 'block',
							closure_expression_expr: 'expr'
						}
					}
				}
			}
		);

		expect(config).toMatchObject({
			$variant: 'expr',
			asyncMarker: { $text: 'async' },
			parameters,
			body
		});
		expect(config).not.toHaveProperty('children');
	});

	it('projects override helper surface when native read unwraps the variant child kind', () => {
		const parameters = { $type: 'closure_parameters', $source: 0, $named: true, $text: '||' };
		const body = { $type: 'tuple_expression', $source: 0, $named: true, $text: '()' };
		const config = nodeToConfig(
			{
				$type: 'closure_expression',
				$source: 0,
				$named: true,
				_async_marker: 85,
				_parameters: parameters,
				$other: [body]
			} as never,
			{
				factoryFields: {
					_closure_expression_expr: ['body']
				},
				factorySlots: {
					...makeFactorySlots('closure_expression', {
						async_marker: { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false },
						parameters: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
						children: { unnamed: true, slotCount: 2, required: false, multiple: false, nonEmpty: false }
					}),
					...makeFactorySlots('_closure_expression_expr', {
						body: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					})
				},
				polymorphVariants: {
					closure_expression: {
						definedBy: 'override',
						childKind: {
							closure_expression_block: 'block',
							closure_expression_expr: 'expr'
						},
						helperChildKind: {
							block: ['block'],
							expr: ['tuple_expression']
						},
						helperKind: {
							expr: '_closure_expression_expr'
						}
					}
				}
			}
		);

		expect(config).toMatchObject({
			$variant: 'expr',
			parameters,
			body
		});
		expect(config).not.toHaveProperty('children');
	});

	it('promotes visible override child fields into the parent config', () => {
		const left = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const right = { $type: 'number_literal', $source: 0, $named: true, $text: '1' };
		const config = nodeToConfig(
			{
				$type: 'assignment',
				$source: 0,
				$named: true,
				$other: [
					{
						$type: 'assignment_eq',
						$source: 0,
						$named: true,
						_left: left,
						_right: right
					}
				]
			} as never,
			{
				factorySlots: {
					...makeFactorySlots('assignment', {
						children: { unnamed: true, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					}),
					...makeFactorySlots('assignment_eq', {
						left: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
						right: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					})
				},
				polymorphVariants: {
					assignment: {
						definedBy: 'override',
						childKind: {
							assignment_eq: 'eq',
							assignment_typed: 'typed'
						}
					}
				}
			}
		);

		expect(config).toMatchObject({
			$variant: 'eq',
			left,
			right
		});
		expect(config).not.toHaveProperty('children');
	});

	it('drops native delimiter token ids from unnamed repeated children slots', () => {
		const first = { $type: 'required_parameter', $source: 0, $named: true, $text: 'x: number' };
		const second = { $type: 'required_parameter', $source: 0, $named: true, $text: 'y: number' };
		const config = nodeToConfig(
			{
				$type: 'formal_parameters',
				$source: 0,
				$named: true,
				$other: [22, first, 6, second, 24]
			} as never,
			{
				factorySlots: {
					...makeFactorySlots('formal_parameters', {
						children: { unnamed: true, slotCount: 1, required: false, multiple: true, nonEmpty: false }
					})
				}
			}
		);

		expect(config).toEqual({
			children: [first, second]
		});
	});

	it('does not promote override-helper children into optional parent fields before variant recovery', () => {
		const name = { $type: 'identifier', $source: 0, $named: true, $text: 't' };
		const indexType = { $type: 'type_identifier', $source: 0, $named: true, $text: 'T' };
		const type = { $type: 'type_annotation', $source: 0, $named: true, $text: ': T' };
		const parameter = {
			$type: 'required_parameter',
			$source: 0,
			$named: true,
			_name: name,
			_type: indexType
		};
		const config = nodeToConfig(
			{
				$type: 'index_signature',
				$source: 0,
				$named: true,
				_type: type,
				$other: [parameter]
			} as never,
			{
				factoryFields: {
					_index_signature_colon: ['name', 'index_type']
				},
				factorySlots: {
					...makeFactorySlots('index_signature', {
						sign: { unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false },
						type: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
						children: { unnamed: true, slotCount: 2, required: false, multiple: false, nonEmpty: false }
					}),
					...makeFactorySlots('_index_signature_colon', {
						name: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false },
						index_type: { unnamed: false, slotCount: 1, required: true, multiple: false, nonEmpty: false }
					})
				},
				polymorphVariants: {
					index_signature: {
						definedBy: 'override',
						childKind: {
							index_signature_colon: 'colon'
						},
						helperKind: {
							colon: '_index_signature_colon'
						},
						helperChildKind: {
							colon: ['type_identifier']
						}
					}
				}
			}
		);

		expect(config).toMatchObject({
			type,
			children: [parameter]
		});
		expect(config).not.toHaveProperty('sign');
	});

	it('keeps python argument_list factory reconstruction from re-emitting double-wrapped unnamed children', async () => {
		const templatesPath = resolve(import.meta.dirname, '../../../python/templates');
		const result = await validateFactoryRenderParse('python', templatesPath, 'native');
		const regression = result.errors.find(
			(error) =>
				error.kind === 'argument_list' &&
				error.entry === 'Matching specific values' &&
				error.message === 're-parse error: "((,\\"Goodbye!\\",))"'
		);

		expect(regression).toBeUndefined();
	}, 60000);

	it('keeps python assignment validation from inheriting expression_statement variant tags', async () => {
		const templatesPath = resolve(import.meta.dirname, '../../../python/templates');
		const result = await validateFactoryRenderParse('python', templatesPath, 'native');
		const regression = result.errors.find(
			(error) => error.kind === 'assignment' && error.message.includes("factory threw: assignment: unknown $variant")
		);

		expect(regression).toBeUndefined();
	}, 60000);
});
