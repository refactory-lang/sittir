import { afterEach, describe, expect, it, vi } from 'vitest';
import { TEMPLATE_BUNDLE_HASH } from '../src/hash.ts';

const identifier = {
	$type: 'identifier',
	$source: 'factory',
	$named: true,
	$text: 'x'
} as const;

describe('boundary', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.doUnmock('node:module');
		vi.restoreAllMocks();
		vi.resetModules();
		delete process.env.SITTIR_BACKEND;
	});

	function mockNativeBackend(
		SittirEngine: new (
			options?: { format?: string }
		) => {
			render(node: Record<string, unknown>): string;
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
				render(_node: Record<string, unknown>): never {
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

	it('passes a plain transport object to native render', async () => {
		const renderSpy = vi.fn(
			(node: Record<string, unknown>) => `ok:${String(node.$type)}`
		);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
				}
				applyEdits(source: string): string {
					return source;
				}
			}
		);

		const { render } = await import('../src/boundary.ts');
		expect(render(identifier)).toBe('ok:identifier');
		expect(renderSpy).toHaveBeenCalledWith(identifier);
	});

	it('normalizes raw parsed children into native transport fields', async () => {
		const renderSpy = vi.fn(
			(node: Record<string, unknown>) => `ok:${String(node.$type)}`
		);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
				}
				applyEdits(source: string): string {
					return source;
				}
			}
		);

		const { render } = await import('../src/boundary.ts');
		const rawSourceFile = {
			$type: 'source_file',
			$source: 'ts',
			$named: true,
			$children: [
				{ $type: 'empty_statement', $source: 'ts', $named: true, $text: ';' }
			]
		} as const;

		expect(render(rawSourceFile)).toBe('ok:source_file');
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: 'source_file',
				statements: [
					expect.objectContaining({ $type: 'empty_statement', $text: ';' })
				]
			})
		);
	});

	it('infers polymorph variants from raw parsed child aliases', async () => {
		const renderSpy = vi.fn(
			(node: Record<string, unknown>) => `ok:${String(node.$type)}`
		);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
				}
				applyEdits(source: string): string {
					return source;
				}
			}
		);

		const { render } = await import('../src/boundary.ts');
		const rawArrayExpression = {
			$type: 'array_expression',
			$source: 'ts',
			$named: true,
			$children: [
				{
					$type: 'array_expression_list',
					$source: 'ts',
					$named: true,
					$children: [identifier]
				}
			]
		} as const;

		expect(render(rawArrayExpression)).toBe('ok:array_expression');
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: 'array_expression',
				$variant: 'list',
				$children: [
					expect.objectContaining({
						$type: '_array_expression_list',
						elements: [expect.objectContaining({ $type: 'identifier' })]
					})
				]
			})
		);
	});

	it('rejects payloads that do not satisfy the native wire contract', async () => {
		const renderSpy = vi.fn(
			(node: Record<string, unknown>) => `ok:${Object.keys(node).length}`
		);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
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
		expect(() => render(invalidNode)).toThrow(
			/unsupported native transport kind|node\.\$children\[\d+\]|must be one of/
		);
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('rejects per-node format metadata at the native render boundary', async () => {
		const renderSpy = vi.fn(
			(node: Record<string, unknown>) => `ok:${String(node.$type)}`
		);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
				}
				applyEdits(source: string): string {
					return source;
				}
			}
		);

		const { render } = await import('../src/boundary.ts');
		const invalidNode = {
			...identifier,
			$format: { boundary: { leading: '\t' } }
		};
		expect(() => render(invalidNode)).toThrow(
			/node\.\$format is not supported by the native render boundary/
		);
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('uses engine-owned format when native render is called without per-call format args', async () => {
		const renderSpy = vi.fn((_node: Record<string, unknown>) => '\tx');
		mockNativeBackend(
			class {
				constructor(_options?: { format?: string }) {}
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
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

	it('falls back when native render transport ABI is stale', async () => {
		vi.doMock('node:module', () => ({
			createRequire: () => () => ({
				SittirEngine: class {
					get templateBundleHash(): string {
						return TEMPLATE_BUNDLE_HASH;
					}
				}
			})
		}));

		const { getActiveBackend } = await import('../src/backend.ts');
		expect(getActiveBackend()).toMatchObject({
			name: 'js',
			reason: 'native render transport ABI mismatch'
		});
	});
});
