import { describe, expect, it, vi } from 'vitest';
import { createNativeEngine, type GrammarEngineConfig } from '../../common/src/engine.ts';
import type { AnyNodeData } from '@sittir/types';

describe('createNativeEngine native boundary', () => {
	it('rejects non-data render inputs before transport projection', () => {
		const render = vi.fn((_node: unknown) => 'ok');
		const toNativeRenderTransport = vi.fn((node: AnyNodeData) => node);
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
		expect(() => engine!.render(invalid)).toThrow(/only plain data objects can cross the native render boundary/);
		expect(toNativeRenderTransport).not.toHaveBeenCalled();
		expect(render).not.toHaveBeenCalled();
	});
});
