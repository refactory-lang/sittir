import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import typescript from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])("a statement edited inside takes its terminator gap from the options (%s storage)", (storage) => {
	it.each([
		['const x = y;\n', 'x', 'const x = y;\n'],
		["foo('a');\n", 'foo', "foo('a');\n"],
		['export { A };\n', '{ A }', 'export { A };\n'],
		["export type { A } from './z.ts';\n", '{ A }', "export type { A } from './z.ts';\n"],
		["import { A } from './z.ts';\n", '{ A }', "import { A } from './z.ts';\n"],
		["import { A } from './z.ts' ;\n", '{ A }', "import { A } from './z.ts';\n"]
	])('%j, edited at %j, renders %j', (source, text, expected) => {
		expect(editedRender(engines[storage], source, text)).toBe(expected);
	});
});
