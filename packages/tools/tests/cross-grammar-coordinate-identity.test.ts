// Every grammar's addon is its own linked image, so tree ids must come from
// the one owner every addon shares — the JavaScript process — or a rust
// engine and a typescript engine would both mint tree 0 and a coordinate
// read by one could slice the other's unrelated tree. A node read by one
// grammar's engine is refused by another grammar's with the handle named.
import { describe, expect, it } from 'vitest';

describe('a coordinate names its tree across grammars', () => {
	it('is refused by an engine of another grammar instead of resolved against its own tree', async () => {
		const { createEngine: createRust } = (await import('@sittir/rust')) as { createEngine: () => any };
		const { createEngine: createTypescript } = (await import('@sittir/typescript')) as { createEngine: () => any };
		const typescript = createTypescript();
		typescript.parse('let decoy = 1;\n');
		const rust = createRust();
		const item = rust.parse('fn real() {}\n').statements()[0];
		expect(() => typescript.render(item).toString()).toThrow(/names tree \d+, which this engine does not hold/);
	});

	it('mints distinct ids for trees parsed by engines of different grammars', async () => {
		const { createEngine: createRust } = (await import('@sittir/rust')) as { createEngine: () => any };
		const { createEngine: createTypescript } = (await import('@sittir/typescript')) as { createEngine: () => any };
		const treeIdOf = (engine: any, source: string): number =>
			Math.floor((engine.diagnostics.parseAndRead(source).root.$nodeHandle as number) / 2 ** 32);
		const a = treeIdOf(createRust(), 'fn a() {}\n');
		const b = treeIdOf(createTypescript(), 'let b = 1;\n');
		expect(a).not.toBe(b);
	});
});
