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
				$children: [
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
				$children: [
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
			$children: [55, { $type: 'identifier', $source: 0, $named: true, $text: 'x' }]
		} as never);

		expect(config.children).toEqual([55, { $type: 'identifier', $source: 0, $named: true, $text: 'x' }]);
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

	it('uses unnamed children metadata instead of payload shape for one-vs-many reconstruction', () => {
		const left = { $type: 'identifier', $source: 0, $named: true, $text: 'x' };
		const right = { $type: 'number_literal', $source: 0, $named: true, $text: '1' };

		const singularChildren = nodeToConfig(
			{
				$type: 'single_child_parent',
				$source: 0,
				$named: true,
				$children: [left]
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
				$children: [left]
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
		expect(multiSlotSingularChildren.children).toEqual(left);
		expect(() =>
			nodeToConfig(
				{
					$type: 'pair_parent',
					$source: 0,
					$named: true,
					$children: [left, right]
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
			)
		).toThrow(/singular slot/i);
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
					$children: [leafA, leafB]
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
					$children: [leaf]
				}
			} as never,
			{
				tree: {} as never,
				factoryMap,
				factoryShapes: { spread_child: 'spread' },
				factorySlots: {
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
				$children: [leaf]
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
});
