import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the rust hoist sets through its wrappers, %s storage', (nodeStorage) => {
	const open = async (code: string) => {
		const e = await createEngine(rust, { nodeStorage });
		return { e, root: e.parse(code) };
	};

	it('replaces the parameters inside the parentheses already there', async () => {
		const { e, root } = await open('fn f(a: u8, b: u8,) {}\nfn g(c: u8) {}\n');
		const [f, g] = root.statements();
		if (!e.is.functionItem(f!) || !e.is.functionItem(g!)) throw new Error('expected functions');
		const edited = f.$with.parameters(...g.parameters());
		expect(String(e.render(edited))).toBe('fn f(c: u8) {}');
		e[Symbol.dispose]();
	});

	it('sets every parameter when several are passed, keeping the parentheses', async () => {
		const { e, root } = await open('fn f(a: u8) {}\nfn g(c: u8, d: u16) {}\n');
		const [f, g] = root.statements();
		if (!e.is.functionItem(f!) || !e.is.functionItem(g!)) throw new Error('expected functions');
		const [c, d] = g.parameters();
		expect(String(e.render(f.$with.parameters(c!, d!)))).toBe('fn f(c: u8, d: u16) {}');
		e[Symbol.dispose]();
	});

	it('empties the parentheses and fills them again', async () => {
		const { e, root } = await open('fn f(a: u8) {}\nfn g(c: u8) {}\n');
		const [f, g] = root.statements();
		if (!e.is.functionItem(f!) || !e.is.functionItem(g!)) throw new Error('expected functions');
		const emptied = f.$with.parameters();
		expect(String(e.render(emptied))).toBe('fn f() {}');
		expect(String(e.render((emptied as typeof f).$with.parameters(...g.parameters())))).toBe('fn f(c: u8) {}');
		e[Symbol.dispose]();
	});

	it('removes an ABI and keeps extern when the modifier is set to undefined', async () => {
		const { e, root } = await open('extern "C" {}\n');
		const item = root.statements()[0]!;
		if (!e.is.foreignModItem(item)) throw new Error('expected a foreign mod item');
		const edited = item.$with.externModifier(undefined);
		expect(String(e.render(edited))).toBe('extern {}');
		e[Symbol.dispose]();
	});
});
