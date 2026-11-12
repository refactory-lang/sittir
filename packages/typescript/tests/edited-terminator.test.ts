import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import typescript from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a statement edited inside keeps its source terminator gap (%s storage)', (storage) => {
	it.each([
		['const x = y;\n', 'x'],
		["foo('a');\n", 'foo'],
		['export { A };\n', '{ A }'],
		["export type { A } from './z.ts';\n", '{ A }'],
		["import { A } from './z.ts';\n", '{ A }'],
		["import { A } from './z.ts' ;\n", '{ A }']
	])('%j, edited at %j, renders on source', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});
});
