import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the python hoist reads through its wrappers, %s storage', (nodeStorage) => {
	const open = () => createEngine(python, { nodeStorage });
	const firstStatement = async (code: string) => {
		const e = await open();
		const item = e.parse(code).statements()[0]!;
		return { e, item };
	};

	it('reads a function\'s parameters as the parameter list', async () => {
		const { e, item } = await firstStatement('def f(a, b):\n    pass\n');
		if (!e.is.functionDefinition(item)) throw new Error('expected a function');
		expect(item.parameters().map((parameter) => String(e.render(parameter)))).toEqual(['a', 'b']);
		e[Symbol.dispose]();
	});

	it('reads no parameters as an empty list', async () => {
		const { e, item } = await firstStatement('def f():\n    pass\n');
		if (!e.is.functionDefinition(item)) throw new Error('expected a function');
		expect(item.parameters()).toEqual([]);
		e[Symbol.dispose]();
	});

	it('reads a return type as what it holds and a missing one as undefined', async () => {
		const typed = await firstStatement('def f() -> int:\n    pass\n');
		if (!typed.e.is.functionDefinition(typed.item)) throw new Error('expected a function');
		expect(String(typed.e.render(typed.item.returnType()!))).toBe('int');
		typed.e[Symbol.dispose]();
		const bare = await firstStatement('def f():\n    pass\n');
		if (!bare.e.is.functionDefinition(bare.item)) throw new Error('expected a function');
		expect(bare.item.returnType()).toBeUndefined();
		bare.e[Symbol.dispose]();
	});

	it('reads a list of wrappers as a list of what they hold', async () => {
		const { e, item } = await firstStatement('@one\n@two.three\ndef f():\n    pass\n');
		if (!e.is.decoratedDefinition(item)) throw new Error('expected a decorated definition');
		expect(item.decorators().map((decorator) => String(e.render(decorator)))).toEqual(['one', 'two.three']);
		e[Symbol.dispose]();
	});

	it('leaves the wrapper in the tree with its own range', async () => {
		const { e, item } = await firstStatement('def f(a, b):\n    pass\n');
		const wrappers = [...e.query(item).$descendants.ofType(e.kinds.Parameters)];
		expect(wrappers.map((wrapper) => String(e.render(wrapper)))).toEqual(['(a, b)']);
		e[Symbol.dispose]();
	});

	it('keeps a comment inside the wrapper and reads the items around it', async () => {
		const { e, item } = await firstStatement('def f(a,  # note\n      b):\n    pass\n');
		if (!e.is.functionDefinition(item)) throw new Error('expected a function');
		const parameters = item.parameters();
		expect(parameters).toHaveLength(2);
		expect(String(e.render(parameters[1]!)).endsWith('b')).toBe(true);
		expect(String(e.render(item))).toContain('# note');
		e[Symbol.dispose]();
	});
});
