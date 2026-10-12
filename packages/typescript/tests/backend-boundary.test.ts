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
		SittirEngine: new (options?: { options?: object }) => {
			render(node: Record<string, unknown>): string;
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

	it('passes a plain transport object to native render', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
		mockNativeBackend(
			class {
				render(node: Record<string, unknown>): string {
					return renderSpy(node);
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
