import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { objects, records, type Engine } from './constructions.mts';

const source = 'fn f() {\n    x();\n}\n';
const text = '{\n    x();\n}';

type Block = { statements(): readonly unknown[]; readonly $with: { statements(...items: unknown[]): Block } };

const live = (engine: Engine): number => engine.diagnostics.builtMemory?.()?.live ?? 0;
const blockOf = (engine: Engine): Block => (engine.parse(source).statements()[0] as unknown as { body(): Block }).body();
const rebuilt = (block: Block): Block => block.$with.statements(...block.statements());
const rendered = (engine: Engine, node: unknown): string => engine.render(node as never).toString();
const dispose = (node: unknown): void => (node as Disposable)[Symbol.dispose]();

describe('a commit scope under record construction', () => {
	it('releases what was built or edited inside it when it closes, but what it keeps', () => {
		const before = live(records);
		let kept: Block;
		let dropped: Block;
		{
			using scope = records.scope();
			const block = blockOf(records);
			kept = scope.keep(rebuilt(block));
			dropped = rebuilt(block);
			records.build.blockComment('/* built */');
			expect(live(records)).toBeGreaterThan(before);
		}
		expect(rendered(records, kept)).toBe(text);
		expect(() => rendered(records, dropped)).toThrow(/was released/);
		dispose(kept);
		expect(live(records)).toBe(before);
	});

	it('hands a kept node to the enclosing scope, which releases it unless it keeps it too', () => {
		const before = live(records);
		let movedOut: Block;
		let keptTwice: Block;
		{
			using outer = records.scope();
			{
				using inner = records.scope();
				movedOut = inner.keep(rebuilt(blockOf(records)));
				keptTwice = outer.keep(inner.keep(rebuilt(blockOf(records))));
				rebuilt(blockOf(records));
			}
			expect(rendered(records, movedOut)).toBe(text);
		}
		expect(() => rendered(records, movedOut)).toThrow(/was released/);
		expect(rendered(records, keptTwice)).toBe(text);
		dispose(keptTwice);
		expect(live(records)).toBe(before);
	});

	it('releases only its own nodes, leaving those of the scope around it', () => {
		using outer = records.scope();
		const first = rebuilt(blockOf(records));
		{
			using inner = records.scope();
			rebuilt(blockOf(records));
		}
		expect(rendered(records, first)).toBe(text);
	});

	it('refuses to close while a scope opened inside it is open, releasing nothing, and closes once that one has', () => {
		const before = live(records);
		const outer = records.scope();
		const edited = rebuilt(blockOf(records));
		const inner = records.scope();
		expect(() => outer[Symbol.dispose]()).toThrow(/is still open: close scope \d+ first/);
		expect(rendered(records, edited)).toBe(text);
		inner[Symbol.dispose]();
		outer[Symbol.dispose]();
		outer[Symbol.dispose]();
		expect(live(records)).toBe(before);
	});

	it('gives a kept node that sits in a parent a count of its own, so it outlives the parent', () => {
		const before = live(records);
		let child: unknown;
		{
			using scope = records.scope();
			const block = blockOf(records);
			const statement = records.build.expressionStatement(records.build.callExpression({ function: records.build.identifier('y'), arguments: records.build.arguments() }));
			block.$with.statements(statement);
			child = scope.keep(statement);
		}
		expect(rendered(records, child)).toBe('y();');
		dispose(child);
		expect(live(records)).toBe(before);
	});

	it('releases the records a built leaf parks on its sides when the leaf was made inside it', () => {
		const before = live(records);
		{
			using scope = records.scope();
			records.build.identifier('x').$trivia.trailing(records.build.blockComment('/* c */'));
		}
		expect(live(records)).toBe(before);
	});

	it('keeps what it holds when a build inside it throws, the build rolled back on its own', () => {
		const before = live(records);
		{
			using scope = records.scope();
			const kept = scope.keep(rebuilt(blockOf(records)));
			const statement = records.build.expressionStatement(records.build.identifier('y'));
			dispose(statement);
			expect(() => records.build.block({ statements: [statement] })).toThrow(/was released/);
			expect(rendered(records, kept)).toBe(text);
			dispose(kept);
		}
		expect(live(records)).toBe(before);
	});

	it('refuses a keep once it is closed, of a released node, and of a node another engine built', async () => {
		const other = await createEngine(rust);
		const scope = records.scope();
		const released = rebuilt(blockOf(records));
		dispose(released);
		expect(() => scope.keep(released)).toThrow(/was released/);
		expect(() => scope.keep(rebuilt(blockOf(other as never as Engine)))).toThrow(/keeps only the nodes its own builders returned/);
		scope[Symbol.dispose]();
		expect(() => scope.keep(rebuilt(blockOf(records)))).toThrow(/is closed/);
		other.dispose();
	});

	it('does nothing when it closes after its engine was disposed', async () => {
		const engine = (await createEngine(rust)) as never as Engine;
		const scope = engine.scope();
		rebuilt(blockOf(engine));
		engine.dispose();
		expect(() => scope[Symbol.dispose]()).not.toThrow();
		expect(() => engine.scope()).toThrow(/engine disposed/);
	});

	it('keeps a node it kept before a parent it releases took the node in', () => {
		const before = live(records);
		let child: unknown;
		{
			using scope = records.scope();
			child = scope.keep(records.build.expressionStatement(records.build.callExpression({ function: records.build.identifier('y'), arguments: records.build.arguments() })));
			records.build.block({ statements: [child as never] });
			blockOf(records).$with.statements(child);
		}
		expect(rendered(records, child)).toBe('y();');
		dispose(child);
		expect(live(records)).toBe(before);
	});

	it('refuses to open while a build is running, so a build rolled back leaves every scope as it opened', async () => {
		let refusal: unknown;
		const engine = (await createEngine(rust, {
			intercept: [
				{
					build(_call, next) {
						const built = next();
						if (refusal === undefined) {
							try {
								(engine as Engine).scope();
							} catch (error) {
								refusal = error;
							}
						}
						return built;
					}
				}
			]
		})) as never as Engine;
		engine.build.identifier('x');
		expect(String(refusal)).toMatch(/while a build is running/);
		const before = live(engine);
		{
			using scope = engine.scope();
			rebuilt(blockOf(engine));
		}
		expect(live(engine)).toBe(before);
		engine.dispose();
	});

	it('keeps a node it kept through a parent that took the node in and was released before the scope closed', () => {
		const before = live(records);
		let child: unknown;
		{
			using scope = records.scope();
			child = scope.keep(records.build.expressionStatement(records.build.identifier('y')));
			dispose(records.build.block({ statements: [child as never] }));
		}
		expect(rendered(records, child)).toBe('y;');
		dispose(child);
		expect(live(records)).toBe(before);
	});

	it.each([
		['kept before a parent took it in', 'keep', '/* c */ x'],
		['kept after a parent took it in', 'place', '/* c */ x'],
		['given a side after a parent took it in', 'write', '/* d */ x']
	] as const)('keeps the sides of a built leaf %s, so the leaf renders them after the parent goes', (_case, order, text) => {
		const before = live(records);
		let leaf: object;
		{
			using scope = records.scope();
			leaf = records.build.identifier('x').$trivia.leading(records.build.blockComment('/* c */'));
			if (order !== 'place') scope.keep(leaf);
			records.build.expressionStatement(leaf as never);
			if (order === 'place') scope.keep(leaf);
			if (order === 'write') (leaf as { readonly $trivia: { leading(...items: unknown[]): unknown } }).$trivia.leading(records.build.blockComment('/* d */'));
		}
		expect(rendered(records, leaf)).toBe(text);
		dispose(leaf);
		expect(live(records)).toBe(before);
	});

	it('keeps a parsed node as it is', () => {
		using scope = records.scope();
		const parsed = blockOf(records);
		expect(scope.keep(parsed)).toBe(parsed);
	});
});

describe('a commit scope under object construction', () => {
	it('holds nothing: its close releases nothing, and its keep returns what it is given', () => {
		let edited: Block;
		{
			using scope = objects.scope();
			edited = rebuilt(blockOf(objects));
			expect(scope.keep(edited)).toBe(edited);
		}
		expect(rendered(objects, edited)).toBe(text);
	});
});
