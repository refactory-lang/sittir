import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import python from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(python, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(python, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a block edged by zero-width indent, dedent and newline tokens renders with the options\' gaps when the code around it is edited (%s storage)', (storage) => {
	it.each([
		['if x:\n    a\nelse:\n    b\n', 'x', 'if x:\n    a\nelse:\n    b\n'],
		['if x:\n    a\nelse:\n    b\n', 'a', 'if x:\n    a\nelse:\n    b\n'],
		['@d\ndef f(): pass\n', 'd', '@d\ndef f(): pass\n'],
		['while x: pass\nelse: y\n', 'x', 'while x: pass\nelse: y\n'],
		['class C:\n    a = 1\nb = 2\n', 'C', 'class C:\n    a = 1\n\n\nb = 2\n'],
		['def f():\n    a\n    b\nx = 1\n', 'f', 'def f():\n    a\n    b\n\n\nx = 1\n'],
		['def f():\n    a\n    b\nx = 1\n', 'a', 'def f():\n    a\n    b\n\n\nx = 1\n']
	])('%j, edited at %j', (source, text, expected) => {
		expect(editedRender(engines[storage], source, text)).toBe(expected);
	});
});
