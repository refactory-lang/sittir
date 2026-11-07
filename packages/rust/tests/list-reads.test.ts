import { createRequire } from 'node:module';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const native = createRequire(import.meta.url)('../native/index.cjs') as { read: (...args: unknown[]) => unknown };
const read = vi.spyOn(native, 'read');
const rs = await createEngine(rust, { nodeStorage: 'object' });

afterAll(() => {
	read.mockRestore();
	rs.dispose();
});

describe('a parsed wrapper list', () => {
	it('fills its items from the read that brought it: reaching the arguments reads the arguments alone', () => {
		const [item] = rs.parse('const X: u8 = f(#[a] g(1), h(2), k(3));\n').statements();
		if (item === undefined || !rs.is.constItem(item)) throw new Error('expected a const item');
		const call = item.value();
		if (call === undefined || !rs.is.callExpression(call)) throw new Error('expected a call');
		read.mockClear();
		const items = [...call.arguments()];
		expect(read).toHaveBeenCalledTimes(1);
		expect(items.map((argument) => rs.render(argument).toString())).toEqual(['#[a] g(1)', 'h(2)', 'k(3)']);
	});
});
