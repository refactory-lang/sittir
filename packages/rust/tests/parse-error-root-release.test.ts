import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../../regex/src/index.ts';
import rust from '../src/index.ts';

interface ArenaEngine extends Disposable {
	parse(source: string): object;
	render(node: object): { toString(): string };
	release(node: object): void;
	isErrorNode(value: unknown): boolean;
	readonly diagnostics: { builtMemory(): { chunks: number; counts: number; live: number } };
}

const grammars = { rust, regex };
const opened = async (grammar: keyof typeof grammars) => (await createEngine(grammars[grammar] as never, { nodeStorage: 'arena' })) as unknown as ArenaEngine;
const released = { chunks: 0, counts: 0, live: 0 };

describe.each([
	['rust', 'const default'],
	['regex', ')']
] as const)('a parse whose root is an ERROR (%s %j) holds its memory until it is released', (grammar, source) => {
	it('through the engine', async () => {
		using engine = await opened(grammar);
		const root = engine.parse(source);
		expect(engine.isErrorNode(root)).toBe(true);
		expect(engine.diagnostics.builtMemory()?.chunks).toBeGreaterThan(0);
		engine.release(root);
		expect(engine.diagnostics.builtMemory()).toEqual(released);
	});

	it('through its dispose', async () => {
		using engine = await opened(grammar);
		{
			using root = engine.parse(source) as unknown as Disposable;
			expect(root).toBeDefined();
		}
		expect(engine.diagnostics.builtMemory()).toEqual(released);
	});

	it('once, however often it is released', async () => {
		using engine = await opened(grammar);
		const root = engine.parse(source);
		engine.release(root);
		engine.release(root);
		(root as Disposable)[Symbol.dispose]();
		expect(engine.diagnostics.builtMemory()).toEqual(released);
	});

	it('leaving a later parse live when an earlier root is released again', async () => {
		using engine = await opened(grammar);
		const first = engine.parse(source);
		engine.release(first);
		const second = engine.parse(source);
		engine.release(first);
		expect(String(engine.render(second))).toBe(source);
		engine.release(second);
		expect(engine.diagnostics.builtMemory()).toEqual(released);
	});

	it('and renders its source until then', async () => {
		using engine = await opened(grammar);
		const root = engine.parse(source);
		expect(String(engine.render(root))).toBe(source);
		engine.release(root);
		expect(engine.diagnostics.builtMemory()).toEqual(released);
	});
});
