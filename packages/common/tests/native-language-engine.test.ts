import { describe, it, expect } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { createRenderHandle, nativeLanguageEngine, type SittirEngine } from '../src/engine.ts';

function fakeSittirEngine() {
	const calls: { render: unknown[]; disposed: number } = { render: [], disposed: 0 };
	let reads = 0;
	const engine = {
		render(node: AnyUntypedNode, options?: unknown) {
			calls.render.push(options);
			return createRenderHandle(() => `rendered:${String(node.$type)}`);
		},
		applyEdits: (source: string) => `${source}!`,
		dispose() {
			calls.disposed++;
		},
		diagnostics: {
			buildProfile: 'release',
			parseAndRead(source: string) {
				reads++;
				return { root: { $type: 1, $span: { start: 0, end: source.length } }, tree: { source, read: reads } };
			},
			readUntypedNode: () => ({ $type: 1 })
		}
	};
	return { engine: engine as unknown as SittirEngine, calls };
}

describe('nativeLanguageEngine', () => {
	it('passes no per-call options when the call has none', () => {
		const { engine, calls } = fakeSittirEngine();
		const native = nativeLanguageEngine(engine);
		expect(native.render({ $type: 7 }).toString()).toBe('rendered:7');
		expect(calls.render).toEqual([undefined]);
	});

	it('splits flat per-call options into the native render options', () => {
		const { engine, calls } = fakeSittirEngine();
		const native = nativeLanguageEngine<never>(engine);
		native.render({ $type: 7 }, { indent: '\t', ignoreFormat: false } as never);
		native.render({ $type: 7 }, { indent: '\t' } as never);
		native.render({ $type: 7 }, { ignoreFormat: false } as never);
		expect(calls.render).toEqual([
			{ ignoreFormat: false, options: { indent: '\t' } },
			{ options: { indent: '\t' } },
			{ ignoreFormat: false }
		]);
	});

	it('applies edits and disposes through the native engine', () => {
		const { engine, calls } = fakeSittirEngine();
		const native = nativeLanguageEngine(engine);
		expect(native.applyEdits('x', [])).toBe('x!');
		native.dispose();
		expect(calls.disposed).toBe(1);
	});
});
