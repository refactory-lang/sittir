// An ERROR the parser leaves in a source is read as trivia: hydrating it reads
// its text and coordinate, and it renders as the bytes it spans.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode, spanOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('an ERROR read as trivia', () => {
	it('is the trailing entry of the node before it, with its text and span', () => {
		const source = 'fn f() {} @@ fn g() {}';
		const [first] = rs.parse(source).statements();
		if (first === undefined || !rs.is.functionItem(first)) throw new Error('expected a function item');
		const [entry] = first.$trivia.trailing();
		if (!isErrorNode(entry)) throw new Error('expected an ERROR entry');
		expect((entry as { $text: string }).$text).toBe('@@');
		expect(spanOf(entry)).toEqual({ start: 10, end: 12 });
	});

	it('renders as the bytes it spans, its parent untouched', () => {
		const source = 'fn f() {} @@ fn g() {}';
		const root = rs.parse(source);
		const [first] = root.statements();
		if (first === undefined || !rs.is.functionItem(first)) throw new Error('expected a function item');
		const [entry] = first.$trivia.trailing();
		expect(rs.render(entry as never).toString()).toBe('@@');
		expect(root.$render().toString()).toBe(source);
	});
});
