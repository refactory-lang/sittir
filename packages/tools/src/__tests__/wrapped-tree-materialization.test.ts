import { FIELD, PATTERN, SEQ, SYMBOL } from '../../../codegen/src/types/rule-types.ts'; // @rule-type-consts
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type { TreeHandle } from '@sittir/common';
import {
	AssembledBranch,
	AssembledNonterminal,
	AssembledPattern,
	type AssembledNode
} from '../../../codegen/src/compiler/model/node-map.ts';
import type { SeqRule } from '../../../codegen/src/types/rule.ts';
import { emitWrap } from '../../../codegen/src/__tests__/helpers/emit-wrap.ts';
import { verifyManifestForGrammar } from '../../../codegen/src/scripts/generated-manifest.ts';
import {
	buildReadHandle,
	loadWebTreeSitter,
	materializeWrappedNodeData,
	walkWrappedTree,
	type WrappedNodeData
} from '../validate/common.ts';
import { makeNodeMapWith } from '../../../codegen/src/__tests__/helpers/node-map-fixtures.ts';

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

const typescriptGeneratedClean = verifyManifestForGrammar('typescript').ok;

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		throw new TypeError('expected object');
	}
	return value as Record<string, unknown>;
}

async function loadFreshWrapWitnessModule(): Promise<{
	wrapListSplat: (node: unknown, tree: TreeHandle) => unknown;
}> {
	const rule: SeqRule = {
		type: SEQ,
		members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('list_splat', new AssembledBranch('list_splat', rule, rule, rule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	const source = emitWrap({ grammar: 'synth', nodeMap: makeNodeMapWith(nodes) });
	const stubbedSource = [
		'const readNodeJs = () => { throw new Error("unused"); };',
		'const withMethods = (node) => node;',
		'const methodsEngine = {};',
		'const _factories = new Proxy({}, { get: () => () => { throw new Error("unused"); } });',
		source.replace(/^import .*;\n/gm, '')
	].join('\n');
	const transpiled = ts.transpileModule(stubbedSource, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2020
		}
	}).outputText;
	return (await import(`data:text/javascript,${encodeURIComponent(transpiled)}`)) as {
		wrapListSplat: (node: unknown, tree: TreeHandle) => unknown;
	};
}

async function loadAliasRoutingWrapWitnessModule(): Promise<{
	wrapAliasHolder: (
		node: unknown,
		tree: TreeHandle
	) => {
		identifier: () => { $type: string };
	};
}> {
	const rule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'alias_holder',
		new AssembledBranch('alias_holder', rule, rule, rule, {
			slotRecord: Object.freeze({
				identifier: new AssembledNonterminal({
					values: [
						{
							node: { kind: 'unresolved-ref', name: 'identifier' },
							parseKind: { kind: 'unresolved-ref', name: 'decorator' },
							multiplicity: 'single'
						}
					],
					hasTrailing: false,
					hasLeading: false,
					sourceRuleIds: []
				})
			})
		}) as AssembledNode
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	const source = emitWrap({ grammar: 'synth', nodeMap: makeNodeMapWith(nodes) });
	const stubbedSource = [
		'const readNodeJs = () => { throw new Error("unused"); };',
		'const withMethods = (node) => node;',
		'const methodsEngine = {};',
		'const _factories = new Proxy({}, { get: () => () => { throw new Error("unused"); } });',
		source.replace(/^import .*;\n/gm, '')
	].join('\n');
	const transpiled = ts.transpileModule(stubbedSource, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2020
		}
	}).outputText;
	return (await import(`data:text/javascript,${encodeURIComponent(transpiled)}`)) as {
		wrapAliasHolder: (
			node: unknown,
			tree: TreeHandle
		) => {
			identifier: () => { $type: string };
		};
	};
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
			$other: leaf(20, 'raw-child'),
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

	it('falls back to raw storage when an accessor throws during traversal', () => {
		const rawFieldChild = leaf(10, 'raw-field');
		const rawChildrenChild = leaf(20, 'raw-child');
		const root = {
			$type: 1,
			$source: 0,
			$named: true,
			$nodeHandle: 1,
			$childIndex: 0,
			_value: rawFieldChild,
			$other: [rawChildrenChild],
			value() {
				throw new Error('boom');
			},
			children() {
				throw new Error('boom');
			}
		} satisfies WrappedNodeData;

		const visited: number[] = [];
		walkWrappedTree(root, (node) => {
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
			$source: 0,
			$named: true,
			$nodeHandle: 1,
			$childIndex: 0,
			_value: leaf(10, 'raw-field'),
			$other: leaf(20, 'raw-child'),
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
		expect(materialized.$other).toEqual({
			$type: 21,
			$source: 0,
			$named: true,
			$text: 'child',
			$nodeHandle: 21,
			$childIndex: 0
		});
		expect(materialized).not.toHaveProperty('value');
		expect(materialized).not.toHaveProperty('children');
		expect(materialized).not.toHaveProperty('$render');
		expect(materialized).not.toHaveProperty('$with');
	});

	it('preserves raw nested field storage when factory-style children are already materialized', async () => {
		const wrapModulePath = new URL('../../../rust/src/wrap.ts', import.meta.url).pathname;
		const typesModulePath = new URL('../../../rust/src/types.ts', import.meta.url).pathname;
		const { wrapFunctionItem } = (await import(wrapModulePath)) as {
			wrapFunctionItem: (node: unknown, tree: TreeHandle) => unknown;
		};
		const { TSKindId } = (await import(typesModulePath)) as {
			TSKindId: Record<string, number>;
		};
		const tree = {
			get rootNode(): never {
				throw new Error('unused');
			}
		} satisfies TreeHandle;

		const wrapped = wrapFunctionItem(
			{
				$type: TSKindId.FunctionItem,
				_function_modifiers: {
					$type: TSKindId.FunctionModifiers,
					_modifier: TSKindId.Async
				},
				_name: {
					$type: TSKindId.Identifier,
					$text: 'abc'
				},
				_parameters: {
					$type: TSKindId.Parameters,
					$other: []
				},
				_body: {
					$type: TSKindId.Block,
					$other: []
				}
			},
			tree
		);

		const materialized = asRecord(materializeWrappedNodeData(wrapped));

		expect(materialized._function_modifiers).toMatchObject({
			$type: TSKindId.FunctionModifiers,
			_modifier: TSKindId.Async
		});
	});

	it.skipIf(!typescriptGeneratedClean)(
		'materializes typescript function signatures without requiring a surfaced semicolon',
		async () => {
			const source = 'export async function readFile(filename: string): Promise<Buffer>';
			const { Parser, Language } = await loadWebTreeSitter();
			const lang = await Language.load(
				fileURLToPath(new URL('../../../typescript/.sittir/parser.wasm', import.meta.url))
			);
			const parser = new Parser();
			parser.setLanguage(lang);
			const tree = parser.parse(source)!;
			const handle = buildReadHandle('typescript', tree, source, 'native');
			const wrapModulePath = new URL('../../../typescript/src/wrap.ts', import.meta.url).pathname;
			const { readTreeNode } = (await import(wrapModulePath)) as {
				readTreeNode: (tree: TreeHandle, handle?: number, childIndex?: number) => unknown;
			};
			const root = readTreeNode(handle) as {
				statements: () => Array<{
					children: () => {
						declaration: () => unknown;
					};
				}>;
			};
			const exportStatement = root.statements()[0]!;
			const declarationArm = exportStatement.children();

			expect(() => declarationArm.declaration()).not.toThrow();

			const declaration = asRecord(materializeWrappedNodeData(declarationArm.declaration()));
			expect(declaration._name).toBe('readFile');
			expect(declaration).not.toHaveProperty('_semicolon');
		}
	);

	it('includes source coordinates and snippet in fresh emitted wrap diagnostics', async () => {
		const { wrapListSplat } = await loadFreshWrapWitnessModule();
		const tree = {
			source: 'value=*f',
			get rootNode(): never {
				throw new Error('unused');
			}
		} satisfies TreeHandle;

		let thrown: unknown;
		try {
			wrapListSplat(
				{
					$type: 'list_splat',
					_value: [
						{ $type: 'identifier', $text: '*' },
						{ $type: 'identifier', $text: 'f' }
					],
					$span: { start: 6, end: 8 }
				},
				tree
			);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(TypeError);
		expect((thrown as Error).message).toContain('list_splat');
		expect((thrown as Error).message).toContain('1:7');
		expect((thrown as Error).message).toContain('"*f"');
	});

	it('falls back to the legacy wrap diagnostic when source is unavailable', async () => {
		const { wrapListSplat } = await loadFreshWrapWitnessModule();
		const tree = {
			get rootNode(): never {
				throw new Error('unused');
			}
		} satisfies TreeHandle;

		let thrown: unknown;
		try {
			wrapListSplat(
				{
					$type: 'list_splat',
					_value: [
						{ $type: 'identifier', $text: '*' },
						{ $type: 'identifier', $text: 'f' }
					],
					$span: { start: 6, end: 8 }
				},
				tree
			);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(TypeError);
		expect((thrown as Error).message).toBe(
			'singular slot "value" on "list_splat" received 2 values; got array(len=2, items=[node($type="identifier", $text="*"), node($type="identifier", $text="f")])'
		);
	});

	it('routes unnamed alias slots from parseKind storage without slot alias maps', async () => {
		const { wrapAliasHolder } = await loadAliasRoutingWrapWitnessModule();
		const wrapped = wrapAliasHolder(
			{
				$type: 'alias_holder',
				_decorator: { $type: 'decorator', $text: '@dec' }
			},
			{
				get rootNode(): never {
					throw new Error('unused');
				}
			} satisfies TreeHandle
		);

		expect(wrapped.identifier().$type).toBe('identifier');
	});
});
