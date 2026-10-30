import { afterEach, describe, expect, it, vi } from 'vitest';
import { TSKindId } from '../src/types.ts';
import { createEngine } from '@sittir/common';
import type { TreeHandle } from '@sittir/common/utils';

const descriptor = async () => (await import('../src/index.ts')).default;

describe('engine', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('createEngine throws when no native backend is available (no JS-engine fallback)', async () => {
		// Mock backend to report no native backend available
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({ name: 'js-fallback' })
		}));

		// createEngine is native-only: it throws instead of silently
		// falling back to a JS renderer-only engine.
		await expect(createEngine(await descriptor())).rejects.toThrow('native engine unavailable');
	});

	it('native engine exposes parse plus the diagnostics surface', async () => {
		// Mock a native backend with read support
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						readonly handle = {};
						parse(_source: string): string {
							return JSON.stringify({ treeId: 1, errors: [] });
						}
						dispose(): void {}
					},
					render: (_engine: object, _node: Record<string, unknown>): string => 'ok',
					read: (_treeId: number, _index: number, _depth: number): object => ({ $type: TSKindId.Identifier, $text: 'x' })
				}
			})
		}));

		const engine = await createEngine(await descriptor(), { nodeStorage: 'object' });

		// The engine exposes parse, render, edit and dispose; the native engine exposes the read path
		expect(typeof engine.parse).toBe('function');
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		const native = (await (await descriptor()).load()).createNative({ nodeStorage: 'object' });
		expect(typeof native.parseAndRead).toBe('function');
	});

	it('reads the root and every coordinate through the native read, passing its nodes through', async () => {
		const reads: [number, number, number][] = [];
		const coordinate = (index: number, start: number, end: number, $type: number) => ({ $treeHandle: index, $span: { start, end }, $type });
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						readonly handle = {};
						parse(_source: string): string {
							return JSON.stringify({ treeId: 3, errors: [] });
						}
						dispose(): void {}
					},
					render: (_engine: object, _node: Record<string, unknown>): string => 'ok',
					read: (treeId: number, index: number, depth: number): object => {
						reads.push([treeId, index, depth]);
						return index === 0
							? {
									$type: TSKindId.FunctionItem,
									$_layout: { at: coordinate(0, 0, 11, TSKindId.FunctionItem) },
									_name: coordinate(1, 7, 11, TSKindId.Identifier)
								}
							: { $type: TSKindId.Identifier, $_layout: { at: coordinate(index, 7, 11, TSKindId.Identifier) }, $text: 'main' };
					},
					disposeTree: (_treeId: number): void => {}
				}
			})
		}));

		const native = (await (await descriptor()).load()).createNative({ nodeStorage: 'object' });
		const tree = native.parseTree('pub fn main') as TreeHandle;
		expect(reads).toEqual([]);
		const root = tree.read?.(0);
		expect(root).toMatchObject({ _name: coordinate(1, 7, 11, TSKindId.Identifier), $errors: [] });
		expect(reads).toEqual([[3, 0, 1]]);

		expect(tree.read?.(1)).toMatchObject({ $type: TSKindId.Identifier, $text: 'main' });
		expect(reads).toEqual([
			[3, 0, 1],
			[3, 1, 1]
		]);
		expect(tree.read?.(0)).toBe(root);
		expect(reads).toHaveLength(2);
	});

	it('native render handle save delegates to engine-side renderToFile', async () => {
		const renderToFile = vi.fn();
		const render = vi.fn((_node: Record<string, unknown>) => 'fn main() {}');
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						readonly handle = {};
						dispose(): void {}
					},
					render: (_engine: object, node: Record<string, unknown>): string => render(node),
					renderToFile: (_engine: object, untypedNode: Record<string, unknown>, path: string): void => renderToFile(untypedNode, path)
				}
			})
		}));

		const engine = await createEngine(await descriptor(), { nodeStorage: 'object' });
		const rendered = engine.render(engine.build.identifier('x'));

		rendered.save('/tmp/sittir-rust-render.txt');
		expect(renderToFile).toHaveBeenCalledOnce();
		expect(render).not.toHaveBeenCalled();
		expect(renderToFile).toHaveBeenCalledWith(
			expect.objectContaining({ $type: TSKindId.Identifier }),
			'/tmp/sittir-rust-render.txt'
		);
	});
});
