import { afterEach, describe, expect, it, vi } from 'vitest';
import { TSKindId } from '../src/types.ts';

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

		const { createEngine } = await import('../src/engine.js');

		// createEngine is native-only: it throws instead of silently
		// falling back to a JS renderer-only engine.
		expect(() => createEngine()).toThrow('createEngine: native engine unavailable');
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
							return 'const x = 1;';
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
							return 'const x = 1;';
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
		const parsed = engine.reader?.parseAndRead('const x = 1;');
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
});
