import { afterEach, describe, expect, it, vi } from 'vitest';
import { TSKindId } from '../src/types.ts';

describe('engine', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('JS fallback engine has no reader (renderer-only)', async () => {
		// Mock backend to report no native backend available
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({ name: 'js-fallback' })
		}));

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();

		// JS fallback should have renderer methods
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');

		// But no reader (parse function not provided)
		expect(engine.reader).toBeUndefined();
	});

	it('native engine has reader when available', async () => {
		// Mock a native backend with reader support
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
							// Phase D: $type must be numeric (TSKindId).
							return JSON.stringify({
								nodeData: {
									$type: TSKindId.Identifier,
									$source: 0,
									$named: true,
									$text: 'x'
								},
								format: undefined
							});
						}
						readNode(_nodeId: number): string {
							// Phase D: $type must be numeric (TSKindId).
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

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();

		// Native engine should have both renderer and reader
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		expect(engine.reader).toBeDefined();
		expect(typeof engine.reader?.parseAndRead).toBe('function');
		expect(typeof engine.reader?.readNode).toBe('function');
	});

	it('native engine rejects ignoreFormat option (Task 4 requirement)', async () => {
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

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();

		// Phase D: $type must be numeric (TSKindId). String coexistence removed.
		const node = {
			$type: TSKindId.Identifier,
			$source: 2 as const,
			$named: true,
			$text: 'x'
		};

		// ignoreFormat: false or undefined should work
		expect(() => engine.render(node)).not.toThrow();
		expect(() => engine.render(node, { ignoreFormat: false })).not.toThrow();

		// ignoreFormat: true should throw with explicit message
		expect(() => engine.render(node, { ignoreFormat: true })).toThrow(
			/ignoreFormat option not yet supported by native engine/
		);
	});

	it('native tree handle render rejects ignoreFormat option', async () => {
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
						parseAndRead(_source: string): string {
							// Phase D: $type must be numeric (TSKindId).
							return JSON.stringify({
								nodeData: {
									$type: TSKindId.Identifier,
									$source: 0,
									$named: true,
									$text: 'x'
								},
								format: undefined
							});
						}
						readNode(_nodeId: number): string {
							// Phase D: $type must be numeric (TSKindId).
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

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();
		const parsed = engine.reader?.parseAndRead('fn main() {}');
		expect(parsed).toBeDefined();
		if (!parsed) {
			throw new Error('expected native engine reader to be available');
		}
		const render = parsed.tree.render;
		expect(render).toBeDefined();
		if (!render) {
			throw new Error('expected native tree handle render to be available');
		}

		expect(() => render(undefined, { ignoreFormat: true })).toThrow(
			/ignoreFormat option not yet supported by native engine/
		);
	});

	it('native render handle save delegates to engine-side renderToFile', async () => {
		const renderToFile = vi.fn();
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						render(_node: Record<string, unknown>): string {
							return 'fn main() {}';
						}
						renderToFile(nodeData: Record<string, unknown>, path: string): void {
							renderToFile(nodeData, path);
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

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();
		const rendered = engine.render({
			$type: TSKindId.Identifier,
			$source: 2 as const,
			$named: true,
			$text: 'x'
		});

		rendered.save('/tmp/sittir-rust-render.txt');
		expect(renderToFile).toHaveBeenCalledOnce();
		expect(renderToFile).toHaveBeenCalledWith(
			expect.objectContaining({ $type: TSKindId.Identifier }),
			'/tmp/sittir-rust-render.txt'
		);
	});
});
