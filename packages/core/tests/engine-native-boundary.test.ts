import { describe, expect, it, vi } from 'vitest';
import { createNativeEngine, type GrammarEngineConfig } from '../../common/src/engine.ts';

describe('createNativeEngine native boundary', () => {
	it('passes render inputs straight through to the native engine', () => {
		const render = vi.fn((_node: unknown) => 'ok');
		const config = {
			templatesPath: '.',
			kindNames: new Map<number, string>(),
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

		expect(handle.toString()).toBe('ok');
		expect(render).toHaveBeenCalledTimes(1);
		expect(render).toHaveBeenCalledWith(invalid);
	});
});
