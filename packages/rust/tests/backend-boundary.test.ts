import { afterEach, describe, expect, it, vi } from 'vitest';
import { TEMPLATE_BUNDLE_HASH } from '../src/hash.ts';
import { TSKindId } from '../src/types.ts';

// Phase B: $type is a numeric TSKindId (not a string) on the native wire.
const identifier = {
	$type: TSKindId.Identifier,
	$source: 2,
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
		SittirEngine: new (options?: { format?: string }) => {
			render(node: Record<string, unknown>): string;
			applyEdits(source: string, edits: { startPos: number; endPos: number; insertedText: string }[]): string;
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

				applyEdits(_source: string, _edits: { startPos: number; endPos: number; insertedText: string }[]): never {
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
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
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
		// Phase B: $type is numeric on the wire; TSKindId.Identifier = 1
		// $source is numeric: 2 = factory
		expect(render(identifier)).toBe(`ok:${TSKindId.Identifier}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: TSKindId.Identifier,
				$source: 2,
				$named: true,
				$text: 'x'
			})
		);
	});

	it('normalizes raw parsed children into native transport fields', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
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
		// Phase D: $type must be numeric (TSKindId). String coexistence removed.
		const rawSourceFile = {
			$type: TSKindId.SourceFile,
			$source: 0,
			$named: true,
			$children: [{ $type: TSKindId.EmptyStatement, $source: 0, $named: true, $text: ';' }]
		} as const;

		// $type is TSKindId.SourceFile (157). Children carry TSKindId.EmptyStatement.
		expect(render(rawSourceFile)).toBe(`ok:${TSKindId.SourceFile}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: TSKindId.SourceFile,
				statements: [
					expect.objectContaining({
						$type: TSKindId.EmptyStatement,
						$text: ';'
					})
				]
			})
		);
	});

	it('infers polymorph variants from raw parsed child aliases', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
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
		// Phase D: $type must be numeric (TSKindId). String coexistence removed.
		const rawArrayExpression = {
			$type: TSKindId.ArrayExpression,
			$source: 0,
			$named: true,
			$children: [
				{
					$type: TSKindId.ArrayExpressionList,
					$source: 0,
					$named: true,
					$children: [identifier]
				}
			]
		} as const;

		// After projection: $type is TSKindId.ArrayExpression (258)
		expect(render(rawArrayExpression)).toBe(`ok:${TSKindId.ArrayExpression}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: TSKindId.ArrayExpression,
				$variant: 'list',
				$children: [
					expect.objectContaining({
						// array_expression_list aliases to _array_expression_list → TSKindId.ArrayExpressionList
						$type: TSKindId.ArrayExpressionList,
						elements: [expect.objectContaining({ $type: TSKindId.Identifier })]
					})
				]
			})
		);
	});

	it('does not pre-validate payloads against a JS transport contract', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${Object.keys(node).length}`);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
				}

				applyEdits(_source: string, _edits: { startPos: number; endPos: number; insertedText: string }[]): string {
					return '';
				}
			}
		);
		const { render } = await import('../src/boundary.ts');
		const invalidNode = {
			$type: TSKindId.Arguments,
			$source: 2,
			$named: true,
			$children: [identifier, 'oops']
		} as const;
		expect(render(invalidNode)).toMatch(/^ok:/);
		expect(renderSpy).toHaveBeenCalledWith(invalidNode);
	});

	it('does not strip per-node format metadata before native render', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
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
		expect(render(invalidNode)).toBe('ok:1');
		expect(renderSpy).toHaveBeenCalledWith(invalidNode);
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
