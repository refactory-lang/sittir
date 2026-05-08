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

	it('normalizes native reader payloads to JS readNode shape', async () => {
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
								nodeData: {
									$type: TSKindId.FunctionItem,
									$source: 0,
									$named: true,
									$span: { start: 0, end: 10 },
									$nodeHandle: 0,
									$fields: {
										name: {
											$type: TSKindId.Identifier,
											$source: 0,
											$named: true,
											$text: 'main',
											$span: { start: 3, end: 7 },
											$childIndex: 1
										}
									},
									$children: [
										{
											$type: TSKindId.Pub,
											$source: 0,
											$named: false,
											$text: 'pub',
											$span: { start: 0, end: 3 },
											$childIndex: 0
										}
									]
								}
							});
						}
						readNode(_handle: number, _childIndex: number): string {
							return JSON.stringify({
								$type: TSKindId.FunctionItem,
								$source: 0,
								$named: true,
								$span: { start: 0, end: 10 },
								$nodeHandle: 7,
								$fields: {
									name: {
										$type: TSKindId.Identifier,
										$source: 0,
										$named: true,
										$text: 'main',
										$span: { start: 3, end: 7 },
										$childIndex: 1
									}
								},
								$children: [
									{
										$type: TSKindId.Pub,
										$source: 0,
										$named: false,
										$text: 'pub',
										$span: { start: 0, end: 3 },
										$childIndex: 0
									}
								]
							});
						}
						dispose(): void {}
					}
				}
			})
		}));

		const { createEngine } = await import('../src/engine.js');
		const engine = createEngine();
		const parsed = engine.reader?.parseAndRead('pub fn main');
		expect(parsed).toBeDefined();
		if (!parsed || !engine.reader) throw new Error('expected native engine reader');

		expect((parsed.root as Record<string, unknown>).$fields).toBeUndefined();
		expect((parsed.root as Record<string, unknown>)._name).toMatchObject({
			$text: 'main',
			$nodeHandle: 0,
			$childIndex: 1
		});
		expect(parsed.root.$children).toBeUndefined();
		expect((parsed.root as Record<string, unknown>)._pub).toMatchObject({
			$text: 'pub',
			$nodeHandle: 0,
			$childIndex: 0,
			$named: false
		});

		const child = parsed.tree.read?.(0, 1);
		expect(child).toBeDefined();
		expect((child as Record<string, unknown>).$fields).toBeUndefined();
		expect((child as Record<string, unknown>)._name).toMatchObject({
			$text: 'main',
			$nodeHandle: 7,
			$childIndex: 1
		});
		expect(engine.reader.readNode(0, 1)).toEqual(child);
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
});
