import { describe, expect, it, vi } from 'vitest';
import { createNativeEngine, type GrammarEngineConfig } from '../../common/src/engine.ts';
import type { AnyNodeData } from '@sittir/types';

describe('createNativeEngine native boundary', () => {
	it('projects render inputs before native validation', () => {
		let projected = false;
		const render = vi.fn((_node: unknown) => 'ok');
		const toNativeRenderTransport = vi.fn((node: AnyNodeData) => {
			projected = true;
			return node;
		});
		const config = {
			templatesPath: '.',
			kindNames: new Map<number, string>(),
			toNativeRenderTransport,
			getActiveBackend: () => ({
				name: 'native' as const,
				hashMatch: true as const,
				native: {
					SittirEngine: class {
						render(node: unknown): string {
							return render(node);
						}
						parseAndRead(_source: string): string {
							return JSON.stringify({
								nodeData: {
									$type: 1,
									$source: 0,
									$named: true,
									$text: 'x'
								}
							});
						}
						readNode(_handle: number, _childIndex: number): string {
							return JSON.stringify({
								$type: 1,
								$source: 0,
								$named: true,
								$text: 'x'
							});
						}
						applyEdits(source: string, _edits: { startPos: number; endPos: number; insertedText: string }[]): string {
							return source;
						}
						dispose(): void {}
					}
				}
			})
		} satisfies GrammarEngineConfig;
		const engine = createNativeEngine(config);
		const invalid = {
			$type: 1 as const,
			$source: 2 as const,
			$named: true,
			$text: 'x',
			render() {
				return 'nope';
			}
		};

		expect(engine).not.toBeNull();
		const handle = engine!.render(invalid);

		expect(toNativeRenderTransport).toHaveBeenCalledTimes(1);
		expect(toNativeRenderTransport).toHaveBeenCalledWith(invalid);
		expect(render).not.toHaveBeenCalled();
		expect(projected).toBe(true);
		expect(handle.toString()).toBe('ok');
		expect(render).toHaveBeenCalledTimes(1);
	});
});
