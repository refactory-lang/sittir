import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('a splat operator sits tight against its operand', () => {
	it.each([
		['a, b.c, d[0], *e, (f, g) = x\n', '*e'],
		['print(*args)\n', '*args'],
		['print(**kwargs)\n', '**kwargs'],
		['def f(**kwargs):\n    pass\n', '**kwargs'],
		['{**a, "b": 1}\n', '**a'],
		['[*a, *b]\n', '*a'],
		['first, *rest = x\n', '*rest'],
		['*first, last = x\n', '*first']
	])('%j renders %s', (source, splat) => {
		expect(py.parse(source).$render()).toContain(splat);
	});
});
