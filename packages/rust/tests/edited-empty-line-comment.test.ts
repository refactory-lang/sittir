import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import rust from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(rust, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(rust, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('an empty line comment, whose zero-width content writes no seam, renders on source when the code around it is edited (%s storage)', (storage) => {
	it.each([
		['fn f() {} //\nfn g() {}\n', 'f'],
		['fn f() {\n    a(); //\n    b();\n}\n', 'a']
	])('%j, edited at %j', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});
});
