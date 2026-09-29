import { afterEach, describe, expect, it, vi } from 'vitest';
import { RENDER_MODULE_HASH } from '../src/hash.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

// Phase D: $type is a numeric TSKindId (not a string) on the native wire.
const identifier = {
	$type: ts.kinds.Identifier,
	$source: 2,
	$named: true,
	$text: 'x'
} as const;

describe('engine render boundary', () => {
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

	async function mockedEngine() {
		const { createEngine } = await import('@sittir/common');
		const descriptor = (await import('../src/index.ts')).default;
		return createEngine(descriptor);
	}

	it('surfaces native render failures instead of silently retrying on TS', async () => {
		mockNativeFailureBackend();
		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(() => render(identifier)).toThrow(/native render boom/);
	});

	it('surfaces native applyEdits failures instead of silently retrying on TS', async () => {
		mockNativeFailureBackend();
		const engine = await mockedEngine();
		const applyEdits = engine.applyEdits.bind(engine);
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

		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		// Phase D: $type is numeric on the wire; TSKindId.Identifier = 1
		// $source is numeric: 2 = factory
		expect(render(identifier)).toBe(`ok:${ts.kinds.Identifier}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: ts.kinds.Identifier,
				$source: 2,
				$named: true,
				$text: 'x'
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
		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		const invalidNode = {
			$type: ts.kinds.Arguments,
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

		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
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
			}
		);

				const { createEngine } = await import('@sittir/common');
		const engine = await createEngine((await import('../src/index.ts')).default, { format: { boundary: { leading: '\t' } } });
		// engine.render() returns a RenderHandle ({ save, print, toString }),
		// not a raw string, so the text is its toString().
		expect(engine.render(engine.build.identifier('x')).toString()).toBe('\tx');
		expect(renderSpy).toHaveBeenCalledTimes(1);
	});

	it('falls back when native render transport ABI is stale', async () => {
		vi.doMock('node:module', () => ({
			createRequire: () => () => ({
				SittirEngine: class {
					get renderModuleHash(): string {
						return RENDER_MODULE_HASH;
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
