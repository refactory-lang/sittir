import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the python hoist sets through its wrappers, %s storage', (nodeStorage) => {
	const first = async (code: string) => {
		const e = await createEngine(python, { nodeStorage });
		const item = e.parse(code).statements()[0]!;
		if (!e.is.functionDefinition(item)) throw new Error('expected a function');
		return { e, item };
	};

	it('replaces what the wrapper holds and keeps its own facts', async () => {
		const { e, item } = await first('def f(a, b,):\n    pass\n');
		const other = e.parse('def g(c):\n    pass\n').statements()[0]!;
		if (!e.is.functionDefinition(other)) throw new Error('expected a function');
		const c = other.parameters();
		const edited = item.$with.parameters(...item.parameters(), ...c);
		expect(String(e.render(edited))).toBe('def f(a, b, c,):\n    pass');
		e[Symbol.dispose]();
	});

	it('builds the wrapper when the holder has none', async () => {
		const { e, item } = await first('def f():\n    pass\n');
		const other = e.parse('def g(c):\n    pass\n').statements()[0]!;
		if (!e.is.functionDefinition(other)) throw new Error('expected a function');
		expect(String(e.render(item.$with.parameters(...other.parameters())))).toBe('def f(c):\n    pass');
		e[Symbol.dispose]();
	});

	it('empties the parentheses and keeps them', async () => {
		const { e, item } = await first('def f(a):\n    pass\n');
		expect(String(e.render(item.$with.parameters()))).toBe('def f():\n    pass');
		e[Symbol.dispose]();
	});

	it('replaces a return type and builds one where there is none', async () => {
		const { e, item } = await first('def f() -> int:\n    pass\n');
		const other = e.parse('def g() -> str:\n    pass\n').statements()[0]!;
		if (!e.is.functionDefinition(other)) throw new Error('expected a function');
		expect(String(e.render(item.$with.returnType(other.returnType()!)))).toBe('def f() -> str:\n    pass');
		const bare = e.parse('def h():\n    pass\n').statements()[0]!;
		if (!e.is.functionDefinition(bare)) throw new Error('expected a function');
		expect(String(e.render(bare.$with.returnType(other.returnType()!)))).toBe('def h() -> str:\n    pass');
		e[Symbol.dispose]();
	});
});
