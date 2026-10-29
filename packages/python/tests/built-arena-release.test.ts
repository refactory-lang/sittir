import { expect, it } from 'vitest';
import python from '../src/index.ts';
import { leafSitesOf } from '../../common/src/built-ref.ts';

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

it('a reused leaf writes its new sides only to holders that are still live', async () => {
	using engine = await python.createEngine();
	const leaf = engine.build.identifier('x');
	const old = engine.build.expressionStatement(leaf);
	engine.release(old);
	const current = engine.build.expressionStatement(leaf);
	leaf.$trivia.trailing(engine.build.comment('# c'));
	engine.release(current);
	engine.release(leaf);
	expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
});

it('a new placement prunes a leaf site whose earlier chunk was freed', async () => {
	using engine = await python.createEngine();
	const leaf = engine.build.identifier('x');
	const old = engine.build.expressionStatement(leaf);
	const words: unknown = Reflect.get(old, '$words');
	if (!(words instanceof Uint32Array)) throw new Error('expected record words');
	const fillers = Array.from({ length: 3000 }, (_, n) => engine.build.expressionStatement(engine.build.identifier(`x${n}`)));
	for (const node of fillers) engine.release(node);
	engine.release(old);
	expect(words.length).toBe(0);
	const current = engine.build.expressionStatement(leaf);
	expect(leafSitesOf(leaf)).toHaveLength(3);
	leaf.$trivia.trailing(engine.build.comment('# c'));
	engine.release(current);
	engine.release(leaf);
	expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
});

it('a leaf with no live site parks its newly written comment until placed or released', async () => {
	using engine = await python.createEngine();
	const leaf = engine.build.identifier('x');
	const holder = engine.build.expressionStatement(leaf);
	engine.release(holder);
	leaf.$trivia.trailing(engine.build.comment('# c'));
	engine.release(leaf);
	expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
});

it.each([
	['trailing', 'leading'],
	['leading', 'trailing']
] as const)('a refused %s-to-%s leaf side update keeps the new comment releasable', async (oldSide, newSide) => {
	using engine = await python.createEngine({ nodeStorage: 'arena', nodeConstruction: 'record' });
	for (let n = 0; n < 128; n++) {
		const leaf = engine.build.identifier('x');
		const old = engine.build.comment('# old');
		leaf.$trivia[oldSide](old);
		const holder = engine.build.expressionStatement(leaf);
		engine.release(holder);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
		const fresh = engine.build.comment('# fresh');
		expect(() => leaf.$trivia[newSide](fresh)).toThrow('was released');
		expect(engine.render(fresh).toString()).toContain('fresh');
		engine.release(fresh);
		engine.release(old);
		engine.release(leaf);
		expect(engine.diagnostics.builtMemory?.()?.live).toBe(0);
	}
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

it("a parsed node's $with releases the record it builds before naming its source, so a released edit leaves nothing live", async () => {
	const { engine, memory } = await engineWithMemory();
	const fn = engine.parse('def f():\n    pass\n').statements()[0];
	if (fn === undefined || !engine.is.functionDefinition(fn)) throw new Error('expected a function definition');
	for (let n = 0; n < 3; n++) engine.release(fn.$with.name(engine.build.identifier('g')));
	expect(memory().live).toBe(0);
});
