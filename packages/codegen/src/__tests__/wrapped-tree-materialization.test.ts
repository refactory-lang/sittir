import { describe, expect, it } from 'vitest';
import type { TreeHandle } from '@sittir/common';
import { materializeWrappedNodeData, walkWrappedTree, type WrappedNodeData } from '../validate/common.ts';

function leaf(handle: number, text: string): WrappedNodeData {
	return {
		$type: handle,
		$source: 0,
		$named: true,
		$text: text,
		$nodeHandle: handle,
		$childIndex: 0
	};
}

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		throw new TypeError('expected object');
	}
	return value as Record<string, unknown>;
}

describe('wrapped tree materialization', () => {
	it('walks method-based wrap storage through semantic accessors', () => {
		const wrappedFieldChild = leaf(11, 'field');
		const wrappedChildrenChild = leaf(21, 'child');
		const root = {
			$type: 1,
			$source: 0,
			$named: true,
			$nodeHandle: 1,
			$childIndex: 0,
			_value: leaf(10, 'raw-field'),
			$children: leaf(20, 'raw-child'),
			value() {
				return wrappedFieldChild;
			},
			children() {
				return wrappedChildrenChild;
			},
			$with: {
				value() {
					return undefined;
				}
			}
		} satisfies WrappedNodeData;

		const visited: number[] = [];
		walkWrappedTree(root, (node) => {
			visited.push(node.$type);
		});

		expect(visited).toEqual([1, 11, 21]);
	});

	it('projects wrapped nodes into plain native-render data', () => {
		const wrappedFieldChild = {
			...leaf(11, 'field'),
			$render() {
				return 'field';
			}
		};
		const wrappedChildrenChild = {
			...leaf(21, 'child'),
			$render() {
				return 'child';
			}
		};
		const root = {
			$type: 1,
			$source: 0,
			$named: true,
			$nodeHandle: 1,
			$childIndex: 0,
			_value: leaf(10, 'raw-field'),
			$children: leaf(20, 'raw-child'),
			value() {
				return wrappedFieldChild;
			},
			children() {
				return wrappedChildrenChild;
			},
			$render() {
				return 'root';
			},
			$with: {
				value() {
					return undefined;
				}
			}
		} satisfies WrappedNodeData;

		const materialized = asRecord(materializeWrappedNodeData(root));

		expect(materialized.$type).toBe(1);
		expect(materialized._value).toMatchObject({ $type: 11, $text: 'field' });
		expect(materialized.$children).toEqual([{ $type: 21, $source: 0, $named: true, $text: 'child', $nodeHandle: 21, $childIndex: 0 }]);
		expect(materialized).not.toHaveProperty('value');
		expect(materialized).not.toHaveProperty('children');
		expect(materialized).not.toHaveProperty('$render');
		expect(materialized).not.toHaveProperty('$with');
	});

	it('normalizes already-materialized repeated field nodes through generated wrap accessors', async () => {
		const wrapModulePath = new URL('../../../rust/dist/wrap.js', import.meta.url).pathname;
		const typesModulePath = new URL('../../../rust/dist/types.js', import.meta.url).pathname;
		const { wrapFunctionItem } = (await import(wrapModulePath)) as {
			wrapFunctionItem: (node: unknown, tree: TreeHandle) => unknown;
		};
		const { TSKindId } = (await import(typesModulePath)) as {
			TSKindId: Record<string, number>;
		};
		const tree = {
			get rootNode(): never {
				throw new Error('unused');
			},
		} satisfies TreeHandle;

		const wrapped = wrapFunctionItem(
			{
				$type: TSKindId.FunctionItem,
				_function_modifiers: {
					$type: TSKindId.FunctionModifiers,
					_modifier: TSKindId.Async,
				},
				_name: {
					$type: TSKindId.Identifier,
					$text: 'abc',
				},
				_parameters: {
					$type: TSKindId.Parameters,
					$children: [],
				},
				_body: {
					$type: TSKindId.Block,
					$children: [],
				},
			},
			tree,
		);

		const materialized = asRecord(materializeWrappedNodeData(wrapped));

		expect(materialized._function_modifiers).toMatchObject({
			$type: TSKindId.FunctionModifiers,
			_modifier: [TSKindId.Async],
		});
	});
});
