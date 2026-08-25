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
		expect(() => createEngine()).toThrow('createRenderEngine: native engine unavailable');
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

		// Native engine exposes the product parse surface plus render/edit/diagnostics
		expect(typeof engine.parse).toBe('function');
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		expect(engine.diagnostics).toBeDefined();
		expect(typeof engine.diagnostics.parseAndRead).toBe('function');
		expect(typeof engine.diagnostics.readNode).toBe('function');
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
});
