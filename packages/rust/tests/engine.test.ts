import { afterEach, describe, expect, it, vi } from 'vitest';
import { TSKindId } from '../src/types.ts';
import { createEngine } from '@sittir/common';

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
						applyEdits(
							source: string,
							_edits: {
								startPos: number;
								endPos: number;
								insertedText: string;
							}[]
						): string {
							return source;
						}
						parseAndRead(_source: string): string {
							// $type is numeric (TSKindId).
							return JSON.stringify({
								untypedNode: {
									$type: TSKindId.Identifier,
									$source: 0,
									$named: true,
									$text: 'x'
								},
								format: undefined
							});
						}
						readUntypedNode(_nodeId: number): string {
							// $type is numeric (TSKindId).
							return JSON.stringify({
								$type: TSKindId.Identifier,
								$source: 0,
								$named: true,
								$text: 'x'
							});
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
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		const native = (await (await descriptor()).load()).createNative();
		expect(typeof native.parseAndRead).toBe('function');
	});

	it('passes through native read payloads already in JS readUntypedNode shape', async () => {
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						render(_node: Record<string, unknown>): string {
							return 'ok';
						}
						applyEdits(source: string): string {
							return source;
						}
						parseAndRead(_source: string): string {
							return JSON.stringify({
								untypedNode: {
									$type: TSKindId.FunctionItem,
									$source: 0,
									$named: true,
									$span: { start: 0, end: 10 },
									$handle: 0,
									_name: {
										$type: TSKindId.Identifier,
										$source: 0,
										$named: true,
										$text: 'main',
										$span: { start: 3, end: 7 },
										$parentHandle: 0,
										$childIndex: 1
									},
									_pub: {
										$type: TSKindId.PubKeyword,
										$source: 0,
										$named: false,
										$text: 'pub',
										$span: { start: 0, end: 3 },
										$parentHandle: 0,
										$childIndex: 0
									}
								}
							});
						}
						readUntypedNode(_handle: number, _childIndex: number): string {
							return JSON.stringify({
								$type: TSKindId.FunctionItem,
								$source: 0,
								$named: true,
								$span: { start: 0, end: 10 },
								$handle: 7,
								_name: {
									$type: TSKindId.Identifier,
									$source: 0,
									$named: true,
									$text: 'main',
									$span: { start: 3, end: 7 },
									$parentHandle: 7,
									$childIndex: 1
								},
								_pub: {
									$type: TSKindId.PubKeyword,
									$source: 0,
									$named: false,
									$text: 'pub',
									$span: { start: 0, end: 3 },
									$parentHandle: 7,
									$childIndex: 0
								}
							});
						}
						dispose(): void {}
					}
				}
			})
		}));

		const native = (await (await descriptor()).load()).createNative();
		const parsed = native.parseAndRead('pub fn main') as { root: unknown; tree: { read?(handle: number, childIndex: number): unknown } };
		expect((parsed.root as unknown as Record<string, unknown>).$fields).toBeUndefined();
		expect((parsed.root as unknown as Record<string, unknown>)._name).toMatchObject({
			$text: 'main',
			$parentHandle: 0,
			$childIndex: 1
		});
		expect((parsed.root as unknown as Record<string, unknown>).$children).toBeUndefined();
		expect((parsed.root as unknown as Record<string, unknown>)._pub).toMatchObject({
			$text: 'pub',
			$parentHandle: 0,
			$childIndex: 0,
			$named: false
		});

		const child = parsed.tree.read?.(0, 1);
		expect(child).toBeDefined();
		expect((child as unknown as Record<string, unknown>).$fields).toBeUndefined();
		expect((child as unknown as Record<string, unknown>)._name).toMatchObject({
			$text: 'main',
			$parentHandle: 7,
			$childIndex: 1
		});
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
						applyEdits(
							source: string,
							_edits: {
								startPos: number;
								endPos: number;
								insertedText: string;
							}[]
						): string {
							return source;
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
						applyEdits(
							source: string,
							_edits: {
								startPos: number;
								endPos: number;
								insertedText: string;
							}[]
						): string {
							return source;
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
