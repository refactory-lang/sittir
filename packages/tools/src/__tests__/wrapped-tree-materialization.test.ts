import { PATTERN, SEQ, SYMBOL } from '../../../codegen/src/types/rule-types.ts'; // @rule-type-consts
import { fileURLToPath } from 'node:url';
import ts from 'typescript6';
import { describe, expect, it } from 'vitest';
import { modelSlots, type TreeHandle } from '@sittir/common/utils';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../../codegen/src/compiler/model/node-map.ts';
import type { RenderRule, SimplifiedRule } from '../../../codegen/src/types/rule.ts';
import { emitWrap } from '../../../codegen/src/__tests__/helpers/emit-wrap.ts';
import { verifyManifestForGrammar } from '../../../codegen/src/scripts/generated-manifest.ts';
import {
	buildReadHandle,
	loadWebTreeSitter,
	materialize,
	walkWrappedTree,
	type TypedNode
} from '../validate/common.ts';
import { makeNodeMapWith } from '../../../codegen/src/__tests__/helpers/node-map-fixtures.ts';
import { requireGrammarModule } from '../grammar-internals.ts';

function leaf(handle: number, text: string): TypedNode {
	return {
		$type: handle,
		$source: 0,
		$named: true,
		$text: text,
		$parentHandle: handle,
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
	// FIELD wrappers don't survive normalize/simplify — post-wrapper-deletion,
	// `fieldName` is stamped directly onto the leaf instead (see RuleBase's
	// NormalizedPhase branch, types/rule.ts).
	const simplifiedRule: SimplifiedRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier', fieldName: 'value' }]
	};
	const renderRule: RenderRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier', fieldName: 'value' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('list_splat', new AssembledBranch('list_splat', simplifiedRule, renderRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	const source = emitWrap({ grammar: 'synth', nodeMap: makeNodeMapWith(nodes) });
	(globalThis as { __sittirModelSlots?: typeof modelSlots }).__sittirModelSlots = modelSlots;
	const stubbedSource = [
		'const readUntypedNode = () => { throw new Error("unused"); };',
		'const modelSlots = globalThis.__sittirModelSlots;',
		'const currentHandle = () => undefined;',
		'const rebuilt = (node, handle, build) => build();',
		'const renderText = () => "";',
		'const triviaSide = () => undefined;',
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

describe('wrapped tree materialization', () => {
	it('walks method-based wrap storage through semantic accessors', () => {
		const wrappedFieldChild = leaf(11, 'field');
		const wrappedChildrenChild = leaf(21, 'child');
		const root = {
			$type: 1,
			$source: 0,
			$named: true,
			$parentHandle: 1,
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
		} satisfies TypedNode;

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
			$parentHandle: 1,
			$childIndex: 0,
			_value: rawFieldChild,
			$other: [rawChildrenChild],
			value() {
				throw new Error('boom');
			},
			children() {
				throw new Error('boom');
			}
		} satisfies TypedNode;

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
			$parentHandle: 1,
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
		} satisfies TypedNode;

		const materialized = asRecord(materialize(root));

		expect(materialized.$type).toBe(1);
		expect(materialized._value).toMatchObject({ $type: 11, $text: 'field' });
		expect(materialized.$other).toEqual({
			$type: 21,
			$source: 0,
			$named: true,
			$text: 'child',
			$parentHandle: 21,
			$childIndex: 0
		});
		expect(materialized).not.toHaveProperty('value');
		expect(materialized).not.toHaveProperty('children');
		expect(materialized).not.toHaveProperty('$render');
		expect(materialized).not.toHaveProperty('$with');
	});

	it('normalizes nested field storage when children are already materialized', async () => {
		const { wrapNode } = await requireGrammarModule('rust', 'wrap.ts');
		const { TSKindId } = await requireGrammarModule('rust', 'types.ts');
		const tree = {
			get rootNode(): never {
				throw new Error('unused');
			}
		} satisfies TreeHandle;

		const wrapped = wrapNode(
			{
				$type: TSKindId.FunctionItem,
				_function_modifiers: {
					$type: TSKindId.FunctionModifiers,
					_modifier: TSKindId.AsyncKeyword
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

		const materialized = asRecord(materialize(wrapped));

		// A nested child with no reader coordinates to re-read by still goes
		// through its own wrap function, which reconciles the reader's shape
		// with the model's: `modifier` is a repeated slot, so a lone value
		// becomes a one-element array — the shape the transport's `Vec` needs.
		expect(materialized._function_modifiers).toMatchObject({
			$type: TSKindId.FunctionModifiers,
			_modifier: [TSKindId.AsyncKeyword]
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
			const handle = await buildReadHandle('typescript', tree, source, 'native');
			const { readNode } = await requireGrammarModule('typescript', 'wrap.ts');
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
			const declaration = asRecord(materialize(declarationArm.content()));
			expect(asRecord(declaration._name).$text).toBe('readFile');
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
});
