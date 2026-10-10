// A node its transport stores as a unit variant or an enum member owns no
// trivia, so an extra beside it goes to the next owner by the placement rule
// and survives a render from the read's data.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('an extra beside an enum member', () => {
	for (const depth of [1, Infinity]) {
		it(`keeps the comment after a predefined type, read to depth ${depth}`, () => {
			const source = 'let x: number /* c */ = 1;';
			const { root } = ts.diagnostics.parseAndRead(source, { depth });
			expect(ts.render(root as never).toString()).toBe(source);
			expect(ts.parse(source, { depth }).$render().toString()).toBe(source);
		});
	}
});
