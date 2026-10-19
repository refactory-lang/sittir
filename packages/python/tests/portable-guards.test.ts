import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable } from '@sittir/common/portable';
import python from '../src/index.ts';

type Guard = (node: unknown) => boolean;
const guard = (path: string): Guard =>
	path
		.split('.')
		.reduce<Record<string, unknown>>(
			(node, segment) => node[segment] as Record<string, unknown>,
			portable.is as never
		) as unknown as Guard;

describe('the shared portable guards read a python node', () => {
	it("pass a function_definition by python's rows", async () => {
		const py = await createEngine(python);
		const definition = py.parse('def f():\n    pass\n').statements()[0];
		expect(guard('declaration.function')(definition)).toBe(true);
		expect(guard('declaration.class')(definition)).toBe(false);
	});
});
