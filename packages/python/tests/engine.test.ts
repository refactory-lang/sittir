import { afterEach, describe, expect, it, vi } from 'vitest';

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
						render(_nodeJson: string): string {
							return 'ok';
						}
						applyEdits(
							source: string,
							_edits: { startPos: number; endPos: number; insertedText: string }[]
						): string {
							return source;
						}
						parseAndRead(_source: string): string {
							return JSON.stringify({
								nodeData: { $type: 'identifier', $source: 'ts', $named: true, $text: 'x' },
								format: undefined
							});
						}
						readNode(_nodeId: number): string {
							return JSON.stringify({ $type: 'identifier', $source: 'ts', $named: true, $text: 'x' });
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
						render(_nodeJson: string): string {
							return 'def main(): pass';
						}
						applyEdits(
							source: string,
							_edits: { startPos: number; endPos: number; insertedText: string }[]
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

		const node = { $type: 'identifier', $source: 'factory' as const, $named: true, $text: 'x' };

		// ignoreFormat: false or undefined should work
		expect(() => engine.render(node)).not.toThrow();
		expect(() => engine.render(node, { ignoreFormat: false })).not.toThrow();

		// ignoreFormat: true should throw with explicit message
		expect(() => engine.render(node, { ignoreFormat: true })).toThrow(
			/ignoreFormat option not yet supported by native engine/
		);
	});
});
