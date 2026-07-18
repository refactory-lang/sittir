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

	it('passes readNode-shaped children straight through to native render (no normalization step)', async () => {
		// boundary.ts's render() is a pure pass-through to the engine
		// (`getDefaultEngine().render(node)`) — no $children-to-named-field
		// normalization logic exists there or anywhere else on the JS side.
		// That's correct: readNode.ts itself emits the de-hoisted `_<name>`
		// storage shape directly (specs/022-binding-simplify-assemble/
		// IMPLEMENTATION-STATUS.md: "`@sittir/core/readNode.ts` emits `_<name>`
		// directly (no shim)"), matching source_file's real named `statements`
		// field (`_statements`, per types.ts's `SourceFile` interface) — a
		// generic `$children` intermediate shape is never actually produced,
		// so there is nothing for boundary.ts to normalize.
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
			_statements: [{ $type: TSKindId.EmptyStatement, $source: 0, $named: true, $text: ';' }]
		} as const;

		// $type is TSKindId.SourceFile (157). Children carry TSKindId.EmptyStatement.
		expect(render(rawSourceFile)).toBe(`ok:${TSKindId.SourceFile}`);
		expect(renderSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				$type: TSKindId.SourceFile,
				_statements: [
					expect.objectContaining({
						$type: TSKindId.EmptyStatement,
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
		// probe." This test previously asserted boundary.ts's render() infers
		// and injects a `$variant: 'list'` tag from raw parsed child aliases —
		// that's the superseded runtime-$variant-dispatch model. render() is
		// in fact a pure pass-through to the engine (no transform logic exists
		// in boundary.ts at all) — real polymorph dispatch happens natively,
		// keyed on the child's own concrete $type, which the raw parsed data
		// already carries untouched.
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
			_content: {
				// array_expression_list aliases to _array_expression_list → TSKindId.ArrayExpressionList
				$type: TSKindId.ArrayExpressionList,
				$source: 0,
				$named: true,
				_elements: [identifier]
			}
		} as const;

		expect(render(rawArrayExpression)).toBe(`ok:${TSKindId.ArrayExpression}`);
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
		// engine.render() returns a RenderHandle ({ save, print, toString }),
		// not a raw string — boundary.ts's own render() calls .toString() on
		// this same return value (packages/rust/src/boundary.ts:29). This
		// test calls the lower-level engine API directly, so it must do the
		// same unwrap.
		expect(engine.render(identifier).toString()).toBe('\tx');
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
