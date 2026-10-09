import { afterEach, describe, expect, it, vi } from 'vitest';
import { RENDER_MODULE_HASH } from '../src/hash.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const identifier = {
	$type: rs.kinds.Identifier,
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
		expect(render(identifier)).toBe(`ok:${rs.kinds.Identifier}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: rs.kinds.Identifier,
				$text: 'x'
			})
		);
	});

	it('passes read-shaped slot storage straight through to native render (no normalization step)', async () => {
		// engine.render() is a pure pass-through to the native engine: a read
		// stores each slot under its `_<name>` key, and no `$children`
		// intermediate shape exists for the engine to normalize.
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
		const rawSourceFile = {
			$type: rs.kinds.SourceFile,
			_statements: [{ $type: rs.kinds.EmptyStatement, $text: ';' }]
		} as const;

		// $type is TSKindId.SourceFile (157). Children carry TSKindId.EmptyStatement.
		expect(render(rawSourceFile)).toBe(`ok:${rs.kinds.SourceFile}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: rs.kinds.SourceFile,
				_statements: [
					expect.objectContaining({
						$type: rs.kinds.EmptyStatement,
						$text: ';'
					})
				]
			})
		);
	});

	it('does not inject $variant — polymorph dispatch is by child $type alone', async () => {
		// `$variant` never reaches a transport: engine.render() infers and
		// injects no tag from raw parsed child aliases, and the native engine
		// dispatches on each child's own concrete $type.
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
		const rawArrayExpression = {
			$type: rs.kinds.ArrayExpression,
			_content: {
				// array_expression_list aliases to _array_expression_list → TSKindId.ArrayExpressionList
				$type: rs.kinds.ArrayExpressionList,
				_elements: [identifier]
			}
		} as const;

		expect(render(rawArrayExpression)).toBe(`ok:${rs.kinds.ArrayExpression}`);
		// Passed straight through — no $variant tag, no restructuring.
		expect(renderSpy).toHaveBeenCalledWith(rawArrayExpression);
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
			$type: rs.kinds.Arguments,
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
				parse(_source: string): string {
					return JSON.stringify({ treeId: 1, errors: [] });
				}
				read(_treeId: number, _index: number, _depth: number): object {
					return { ...identifier };
				}
				dispose(): void {}
			}
		);

		const { createEngine } = await import('@sittir/common');
		const { treeTokenOf } = await import('@sittir/common/utils');
		const descriptor = (await import('../src/index.ts')).default;
		const engine = await createEngine(descriptor, { format: { boundary: { leading: '\t' } } });
		// engine.render() returns a RenderHandle ({ save, print, toString }),
		// not a raw string, so the text is its toString().
		expect(engine.render(engine.build.identifier('x')).toString()).toBe('\tx');
		expect(renderSpy).toHaveBeenCalledTimes(1);

		// The native engine behind the descriptor reads raw node data
		const { root } = (await descriptor.load()).createNative().parseAndRead('x');
		// and nothing else under a string key but the parse's error regions:
		// the token that keeps the root's tree live is no data key.
		const read = root as object;
		expect(Object.fromEntries(Object.entries(read))).toEqual({ ...identifier, $errors: [] });
		expect(treeTokenOf(read)).toBeDefined();
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
