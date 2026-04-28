import { afterEach, describe, expect, it, vi } from 'vitest';

const identifier = {
	$type: 'identifier',
	$source: 'factory',
	$named: true,
	$text: 'x'
} as const;

describe('boundary', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.restoreAllMocks();
		vi.resetModules();
	});

	function mockNativeBackend(
		SittirEngine: new (options?: { format?: string }) => {
			render(nodeJson: string): string;
			applyEdits(
				source: string,
				edits: { startPos: number; endPos: number; insertedText: string }[]
			): string;
		}
	): void {
		vi.resetModules();
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: { SittirEngine }
			})
		}));
	}

	function mockNativeFailureBackend(): void {
		mockNativeBackend(
			class {
				render(_nodeJson: string): never {
					throw new Error('native render boom');
				}

				applyEdits(
					_source: string,
					_edits: { startPos: number; endPos: number; insertedText: string }[]
				): never {
					throw new Error('native apply boom');
				}
			}
		);
	}

	it('surfaces native render failures instead of silently retrying on TS', async () => {
		mockNativeFailureBackend();
		const { render } = await import('../src/boundary.ts');
		expect(() => render(identifier)).toThrow(/native render boom/);
	});

	it('surfaces native applyEdits failures instead of silently retrying on TS', async () => {
		mockNativeFailureBackend();
		const { applyEdits } = await import('../src/boundary.ts');
		expect(() => applyEdits('abc', [])).toThrow(/native apply boom/);
	});

	it('rejects payloads that do not satisfy the native wire contract', async () => {
		const renderSpy = vi.fn((nodeJson: string) => `ok:${nodeJson.length}`);
		mockNativeBackend(
			class {
				render(nodeJson: string): string {
					return renderSpy(nodeJson);
				}

				applyEdits(
					_source: string,
					_edits: { startPos: number; endPos: number; insertedText: string }[]
				): string {
					return '';
				}
			}
		);
		const { render } = await import('../src/boundary.ts');
		const invalidNode = {
			$type: 'arguments',
			$source: 'factory',
			$named: true,
			$children: [identifier, 'oops']
		} as const;
		expect(() => render(invalidNode)).toThrow(/node\.\$children\[1\]/);
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('uses engine-owned format when native render is called without per-call format args', async () => {
		const renderSpy = vi.fn((_nodeJson: string) => '\tx');
		mockNativeBackend(
			class {
				constructor(_options?: { format?: string }) {}
				render(nodeJson: string): string {
					return renderSpy(nodeJson);
				}
				applyEdits(source: string): string {
					return source;
				}
				parseAndRead(_source: string): string {
					return JSON.stringify({ nodeData: identifier });
				}
				readNode(_nodeId: number): string {
					return JSON.stringify(identifier);
				}
				dispose(): void {}
			}
		);

		// Engine created with reader support
		const { createEngine } = await import('../src/engine.ts');
		const engine = createEngine({ format: { boundary: { leading: '\t' } } });
		expect(engine.render(identifier)).toBe('\tx');
		expect(renderSpy).toHaveBeenCalledTimes(1);
		
		// Reader should be available on native engine
		expect(engine.reader).toBeDefined();
		if (engine.reader) {
			const { root } = engine.reader.parseAndRead('x');
			expect(root).toEqual(identifier);
		}
	});
});
