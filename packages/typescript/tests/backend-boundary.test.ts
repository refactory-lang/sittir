import { afterEach, describe, expect, it, vi } from 'vitest';
import { RENDER_MODULE_HASH } from '../src/hash.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

// Phase D: $type is a numeric TSKindId (not a string) on the native wire.
const identifier = {
	$type: ts.kinds.Identifier,
	
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

	function mockNativeBackend(render: (node: Record<string, unknown>) => string, functions: object = {}): void {
		vi.resetModules();
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						readonly handle = {};
						parse(_source: string): string {
							return JSON.stringify({ treeId: 1, errors: [] });
						}
						dispose(): void {}
					},
					render: (_engine: object, node: Record<string, unknown>) => render(node),
					...functions
				}
			})
		}));
	}

	function mockNativeFailureBackend(): void {
		mockNativeBackend(() => {
			throw new Error('native render boom');
		});
	}

	async function mockedEngine() {
		const { createEngine } = await import('@sittir/common');
		const descriptor = (await import('../src/index.ts')).default;
		return createEngine(descriptor, { nodeStorage: 'object' });
	}

	it('surfaces native render failures instead of silently retrying on TS', async () => {
		mockNativeFailureBackend();
		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		expect(() => render(identifier)).toThrow(/native render boom/);
	});

	it('passes a plain node object to native render', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${String(node.$type)}`);
		mockNativeBackend(renderSpy);

		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		// Phase D: $type is numeric on the wire; TSKindId.Identifier = 1
		expect(render(identifier)).toBe(`ok:${ts.kinds.Identifier}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: ts.kinds.Identifier,
				
				$text: 'x'
			})
		);
	});

	it('does not pre-validate payloads against a JS node contract', async () => {
		const renderSpy = vi.fn((node: Record<string, unknown>) => `ok:${Object.keys(node).length}`);
		mockNativeBackend(renderSpy);
		const engine = await mockedEngine();
		const render = (node: unknown): string => engine.render(node as never).toString();
		const invalidNode = {
			$type: ts.kinds.Arguments,
			
			$children: [identifier, 'oops']
		} as const;
		expect(render(invalidNode)).toMatch(/^ok:/);
		expect(renderSpy).toHaveBeenCalledWith(invalidNode);
	});

	it('falls back when native render node ABI is stale', async () => {
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
			reason: 'native render node ABI mismatch'
		});
	});
});
