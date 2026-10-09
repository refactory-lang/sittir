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
						render(_node: Record<string, unknown>): string {
							return 'ok';
						}
						parse(_source: string): string {
							return JSON.stringify({ treeId: 1, errors: [] });
						}
						read(_treeId: number, _index: number, _depth: number): object {
							return { $type: TSKindId.Identifier, $text: 'x' };
						}
						dispose(): void {}
					}
				}
			})
		}));

		const engine = await createEngine(await descriptor());

		// The engine exposes parse, render, edit and dispose; the native engine exposes the read path
		expect(typeof engine.parse).toBe('function');
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		const native = (await (await descriptor()).load()).createNative();
		expect(typeof native.parseAndRead).toBe('function');
	});

	it('reads the root and every coordinate through the native read, passing its transports through', async () => {
		const reads: [number, number, number][] = [];
		const coordinate = (index: number, start: number, end: number, $type: number) => ({ $treeHandle: index, $span: { start, end }, $type });
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						render(_node: Record<string, unknown>): string {
							return 'ok';
						}
						parse(_source: string): string {
							return JSON.stringify({ treeId: 3, errors: [] });
						}
						read(treeId: number, index: number, depth: number): object {
							reads.push([treeId, index, depth]);
							return index === 0
								? {
										$type: TSKindId.FunctionItem,
										$_layout: { at: coordinate(0, 0, 11, TSKindId.FunctionItem) },
										_name: coordinate(1, 7, 11, TSKindId.Identifier)
									}
								: { $type: TSKindId.Identifier, $_layout: { at: coordinate(index, 7, 11, TSKindId.Identifier) }, $text: 'main' };
						}
						disposeTree(_treeId: number): void {}
						dispose(): void {}
					}
				}
			})
		}));

		const native = (await (await descriptor()).load()).createNative();
		const parsed = native.parseAndRead('pub fn main');
		expect(reads).toEqual([[3, 0, 1]]);
		expect(parsed.root).toMatchObject({ _name: coordinate(1, 7, 11, TSKindId.Identifier), $errors: [] });

		const tree = parsed.tree as TreeHandle;
		expect(tree.read?.(1)).toMatchObject({ $type: TSKindId.Identifier, $text: 'main' });
		expect(reads).toEqual([
			[3, 0, 1],
			[3, 1, 1]
		]);
		expect(tree.read?.(0)).toBe(parsed.root);
		expect(reads).toHaveLength(2);
	});

	it('native engine rejects the ignoreFormat option', async () => {
		// Mock a native backend
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						render(_node: Record<string, unknown>): string {
							return 'fn main() {}';
						}
						dispose(): void {}
					}
				}
			})
		}));

		const engine = await createEngine(await descriptor());

		const node = engine.build.identifier('x');

		// ignoreFormat: false or undefined should work
		expect(() => engine.render(node)).not.toThrow();
		expect(() => engine.render(node, { ignoreFormat: false })).not.toThrow();

		// ignoreFormat: true should throw with explicit message
		expect(() => engine.render(node, { ignoreFormat: true })).toThrow(
			/ignoreFormat option not yet supported by native engine/
		);
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
						render(node: Record<string, unknown>): string {
							return render(node);
						}
						renderToFile(untypedNode: Record<string, unknown>, path: string): void {
							renderToFile(untypedNode, path);
						}
						dispose(): void {}
					}
				}
			})
		}));

		const engine = await createEngine(await descriptor());
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
