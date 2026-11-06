import { createRequire } from 'node:module';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const native = createRequire(import.meta.url)('../native/index.cjs') as { read: (...args: unknown[]) => unknown };
const read = vi.spyOn(native, 'read');
const py = await createEngine(python, { nodeStorage: 'object' });

afterAll(() => {
	read.mockRestore();
	py.dispose();
});

describe('a parsed list', () => {
	it('fills its items from the read that brought it: reaching a line reads the line alone', () => {
		const root = py.parse('a = 1; b = 2; c = 3\n');
		read.mockClear();
		const [line] = root.statements();
		if (line === undefined || !py.is.simpleStatements(line)) throw new Error('expected one line of simple statements');
		expect(line.elements()).toHaveLength(3);
		expect(read).toHaveBeenCalledTimes(1);
	});

	it('reads an item a route already holds from that route, not again', () => {
		const root = py.parse('a = 1; b = 2\n');
		const [line] = root.statements();
		if (line === undefined || !py.is.simpleStatements(line)) throw new Error('expected one line of simple statements');
		const [first] = line.elements();
		read.mockClear();
		expect(root.statements()[0]).toBe(line);
		expect(line.elements()[0]).toBe(first);
		expect(read).not.toHaveBeenCalled();
	});
});
