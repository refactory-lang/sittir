// Every grammar's addon is its own linked image, so tree ids must come from
// the one owner every addon shares — the JavaScript process — or a rust
// engine and a typescript engine would both mint tree 0 and a coordinate
// read by one could slice the other's unrelated tree. A node read by one
// grammar's engine is refused by another grammar's, naming both languages,
// whether it is rendered or handed to a builder.
import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode, TriviaEntry } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import { writeTrivia } from '@sittir/common/utils';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { languageByName } from '../src/languages.ts';

describe('a coordinate names its tree across grammars', () => {
	it('is refused by an engine of another grammar, naming both, instead of resolved against its own tree', async () => {
		const typescript = await createEngine(await languageByName('typescript'));
		typescript.parse('let decoy = 1;\n');
		const rust = await createEngine(await languageByName('rust'));
		const item = (rust.parse('fn real() {}\n') as unknown as { statements(): AnyUntypedNode[] }).statements()[0]!;
		// @ts-expect-error a rust node is not a typescript node; the engine refuses it at runtime as well
		expect(() => typescript.render(item).toString()).toThrow('cannot render a rust node through a typescript engine');
	});

	it('refuses a parsed node of another grammar as a builder child, naming both languages, the kind and the slot', async () => {
		const typescript = await createEngine(await languageByName('typescript'));
		const rust = await createEngine(await languageByName('rust'));
		const item = rust.parse('fn real() {}\n').statements()[0]!;
		const refusal = 'cannot build a typescript program with a rust node in its statements';
		// @ts-expect-error a rust node is not a typescript statement; the builder refuses it at runtime as well
		expect(() => typescript.build.program({ statements: [item] })).toThrow(refusal);
		const root = typescript.parse('a;\n') as unknown as { $with: { statements(...items: unknown[]): unknown } };
		expect(() => root.$with.statements(item)).toThrow(refusal);
	});

	it('refuses a record another grammar built in a side, naming both languages', async () => {
		const recordEngine = async (grammar: 'rust' | 'typescript') => {
			const engine = await createEngine(await languageByName(grammar), { nodeStorage: 'arena' });
			useRecordConstruction(engine, await requireGrammarModule(grammar, 'factories/records.ts'));
			return engine as unknown as { build: Record<string, (...args: unknown[]) => object> };
		};
		const [rust, typescript] = [await recordEngine('rust'), await recordEngine('typescript')];
		const statement = rust.build.expressionStatement!(rust.build.identifier!('x'));
		const foreign = typescript.build.expressionStatement!(typescript.build.identifier!('y')) as TriviaEntry;
		expect(() => writeTrivia(statement, { trailing: [foreign] })).toThrow('cannot write a typescript record into a side of a rust node');
	});

	it('mints distinct ids for trees parsed by engines of different grammars', async () => {
		const treeIdOf = async (grammar: string, source: string): Promise<number> => {
			const native = (await (await languageByName(grammar)).load()).createNative();
			return Math.floor(native.parseAndRead(source).root.$_layout!.at!.$treeHandle / 2 ** 32);
		};
		const a = await treeIdOf('rust', 'fn a() {}\n');
		const b = await treeIdOf('typescript', 'let b = 1;\n');
		expect(a).not.toBe(b);
	});
});
