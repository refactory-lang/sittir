import { describe, expect, it } from 'vitest';
import { verifyManifestForGrammar } from '../../../codegen/src/scripts/generated-manifest.ts';
import { isNode, Source, sourceOf } from '@sittir/common/utils';
import { stampSource } from '../../../common/src/source-stamp.ts';
import {
	buildReadHandle,
	loadSlotAccessorOf,
	materialize,
	readNodeOf,
	slotAccessorOf,
	walkWrappedTree,
	type LoadedNodeModel,
	type TypedNode
} from '../validate/common.ts';

const accessorOf = slotAccessorOf({ slotAccessors: { node: { _value: 'value', _items: 'items', _statements: 'statements' }, leaf: {} } } as unknown as LoadedNodeModel, (id) => (id === 1 ? 'node' : 'leaf'));

function leaf(type: number, text: string): TypedNode {
	return { $type: type, $named: true, $text: text };
}

const typescriptGeneratedClean = verifyManifestForGrammar('typescript').ok;

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		throw new TypeError('expected object');
	}
	return value as Record<string, unknown>;
}

describe('wrapped tree materialization', () => {
	it('keeps each node it copies a node with its provenance, the copy being made by string keys', () => {
		const child = stampSource(leaf(21, 'child'), Source.Ts);
		const root = stampSource({ $type: 1, $named: true, _items: child, items: () => child } satisfies TypedNode, Source.Ts);
		const materialized = materialize(root, accessorOf);
		expect(sourceOf(materialized)).toBe(Source.Ts);
		expect(sourceOf(asRecord(materialized)._items as object)).toBe(Source.Ts);
		expect(isNode(materialized)).toBe(true);
	});

	it('walks method-based wrap storage through semantic accessors', () => {
		const wrappedFieldChild = leaf(11, 'field');
		const wrappedChildrenChild = leaf(21, 'child');
		const root = {
			$type: 1,
			
			$named: true,
			_value: leaf(10, 'raw-field'),
			_items: leaf(20, 'raw-child'),
			value() {
				return wrappedFieldChild;
			},
			items() {
				return wrappedChildrenChild;
			},
			$with: {
				value() {
					return undefined;
				}
			}
		} satisfies TypedNode;

		const visited: number[] = [];
		walkWrappedTree(root, accessorOf, (node) => {
			visited.push(node.$type);
		});

		expect(visited).toEqual([1, 11, 21]);
	});

	it('falls back to raw storage when an accessor throws during traversal', () => {
		const rawFieldChild = leaf(10, 'raw-field');
		const rawChildrenChild = leaf(20, 'raw-child');
		const root = {
			$type: 1,
			
			$named: true,
			_value: rawFieldChild,
			_items: [rawChildrenChild],
			value() {
				throw new Error('boom');
			},
			items() {
				throw new Error('boom');
			}
		} satisfies TypedNode;

		const visited: number[] = [];
		walkWrappedTree(root, accessorOf, (node) => {
			visited.push(node.$type);
		});

		expect(visited).toEqual([1, 10, 20]);
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
			
			$named: true,
			_value: leaf(10, 'raw-field'),
			_items: leaf(20, 'raw-child'),
			value() {
				return wrappedFieldChild;
			},
			items() {
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
		} satisfies TypedNode;

		const materialized = asRecord(materialize(root, accessorOf));

		expect(materialized.$type).toBe(1);
		expect(materialized._value).toMatchObject({ $type: 11, $text: 'field' });
		expect(materialized._items).toEqual({ $type: 21, $named: true, $text: 'child' });
		expect(materialized).not.toHaveProperty('value');
		expect(materialized).not.toHaveProperty('items');
		expect(materialized).not.toHaveProperty('$render');
		expect(materialized).not.toHaveProperty('$with');
	});

	it.skipIf(!typescriptGeneratedClean)(
		'materializes typescript function signatures without requiring a surfaced semicolon',
		async () => {
			const source = 'export async function readFile(filename: string): Promise<Buffer>';
			const handle = await buildReadHandle('typescript', source);
			const readNode = await readNodeOf('typescript');
			const root = readNode(handle) as {
				statements: () => Array<{ content: () => unknown }>;
			};
			// export_statement and export_statement_default are flattened into
			// their variants, so the statement read is the
			// export_statement_default_declaration node, whose `content` slot
			// holds the declaration.
			const declarationArm = root.statements()[0]!;

			// The core claim: reading a function signature whose trailing
			// semicolon is ASI-derived (no real `;` byte in the source) must
			// not throw. The ASI-derived automatic_semicolon legitimately
			// remains present in the materialized (wrap-layer) data — it's
			// needed for round-trip fidelity — so its absence there isn't
			// something to assert; `renderAs` (grammar.sittir.ts) only
			// affects RENDER output, not this structural layer.
			expect(() => declarationArm.content()).not.toThrow();

			// A read leaf materializes as itself — its text and the coordinate
			// it was read at — not as bare text.
			const declaration = asRecord(materialize(declarationArm.content(), await loadSlotAccessorOf('typescript')));
			expect(asRecord(declaration._name).$text).toBe('readFile');
		}
	);
});
