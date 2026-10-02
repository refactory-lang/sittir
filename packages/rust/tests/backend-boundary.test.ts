import { afterEach, describe, expect, it, vi } from 'vitest';
import { RENDER_MODULE_HASH } from '../src/hash.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

// Phase B: $type is a numeric TSKindId (not a string) on the native wire.
const identifier = {
	$type: rs.kinds.Identifier,
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
		// Phase B: $type is numeric on the wire; TSKindId.Identifier = 1
		// $source is numeric: 2 = factory
		expect(render(identifier)).toBe(`ok:${rs.kinds.Identifier}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: rs.kinds.Identifier,
				$source: 2,
				$named: true,
				$text: 'x'
			})
		);
	});

	it('passes readUntypedNode-shaped children straight through to native render (no normalization step)', async () => {
		// engine.render() is a pure pass-through to the native engine — no $children-to-named-field
		// normalization logic exists there or anywhere else on the JS side.
		// That's correct: readUntypedNode.ts itself emits the de-hoisted `_<name>`
		// storage shape directly (specs/022-binding-simplify-assemble/
		// IMPLEMENTATION-STATUS.md: "`@sittir/core/readUntypedNode.ts` emits `_<name>`
		// directly (no shim)"), matching source_file's real named `statements`
		// field (`_statements`, per types.ts's `SourceFile` interface) — a
		// generic `$children` intermediate shape is never actually produced,
		// so there is nothing for the engine to normalize.
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
		// Phase D: $type must be numeric (TSKindId). String coexistence removed.
		const rawSourceFile = {
			$type: rs.kinds.SourceFile,
			$source: 0,
			$named: true,
			_statements: [{ $type: rs.kinds.EmptyStatement, $source: 0, $named: true, $text: ';' }]
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
		// DECIDED DOCTRINE (docs/superpowers/specs/2026-05-22-compiler-simplification-design.md
		// §4d): "$variant is diagnostics/validate-only... it may appear in the
		// serialized Model and the validator's dispatch map, never in
		// generated types.ts / factories.ts / from.ts / wrap.ts / transports /
		// templates." And: "Dispatch is by child kind ONLY — no runtime
		// structural recovery... this supersedes any runtime slot-presence
		// probe." engine.render() infers and injects no `$variant` tag from raw
		// parsed child aliases: it passes the data straight to the native
		// engine, which dispatches on the child's own concrete $type.
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
		// Phase D: $type must be numeric (TSKindId). String coexistence removed.
		const rawArrayExpression = {
			$type: rs.kinds.ArrayExpression,
			$source: 0,
			$named: true,
			_content: {
				// array_expression_list aliases to _array_expression_list → TSKindId.ArrayExpressionList
				$type: rs.kinds.ArrayExpressionList,
				$source: 0,
				$named: true,
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
				parseAndRead(_source: string): string {
					return JSON.stringify({ untypedNode: identifier });
				}
				readUntypedNode(_nodeId: number): string {
					return JSON.stringify(identifier);
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
		// and nothing else under a string key: the token that keeps the
		// root's tree live is no data key.
		const read = root as object;
		expect(Object.fromEntries(Object.entries(read))).toEqual(identifier);
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
