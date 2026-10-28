import { expect, it } from 'vitest';
import python from '../src/index.ts';

async function engineWithMemory() {
	const engine = await python.createEngine();
	const memory = () => {
		const built = engine.diagnostics.builtMemory?.();
		if (built === undefined) throw new Error('the engine builds no arena');
		return built;
	};
	return { engine, memory };
}

it('a leaf releases the comment written to its side while it is unplaced, once', async () => {
	const { engine, memory } = await engineWithMemory();
	const leaf = engine.build.identifier('x');
	leaf.$trivia.trailing(engine.build.comment('# c'));
	const copy = { ...leaf };
	expect(memory().live).toBe(1);
	engine.release(leaf);
	expect(memory().live).toBe(0);
	engine.release(copy);
	expect(memory().live).toBe(0);
	expect(() => engine.build.expressionStatement(copy)).toThrow('was released');
});

it('a placed leaf hands the comment on its side to its holder, which frees it', async () => {
	const { engine, memory } = await engineWithMemory();
	const leaf = engine.build.identifier('x');
	leaf.$trivia.trailing(engine.build.comment('# c'));
	const statement = engine.build.expressionStatement(leaf);
	engine.release(leaf);
	expect(memory().live).toBeGreaterThan(0);
	engine.release(statement);
	expect(memory().live).toBe(0);
});

it("seals each full chunk's counts to the entries it holds, which it still holds and releases", async () => {
	const { engine, memory } = await engineWithMemory();
	const statements = Array.from({ length: 20_000 }, (_, n) => engine.build.expressionStatement(engine.build.identifier(`x${n}`)));
	const module = engine.build.module(...statements);
	const { chunks, counts } = memory();
	expect(counts / chunks).toBeLessThan(0.12);
	engine.release(module);
	expect(memory().live).toBe(0);
});
