import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import python from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(python, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(python, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a block edged by zero-width indent, dedent and newline tokens renders on source when the code around it is edited (%s storage)', (storage) => {
	it.each([
		['if x:\n    a\nelse:\n    b\n', 'x'],
		['if x:\n    a\nelse:\n    b\n', 'a'],
		['@d\ndef f(): pass\n', 'd'],
		['while x: pass\nelse: y\n', 'x'],
		['class C:\n    a = 1\nb = 2\n', 'C'],
		['def f():\n    a\n    b\nx = 1\n', 'f'],
		['def f():\n    a\n    b\nx = 1\n', 'a']
	])('%j, edited at %j', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});
});
