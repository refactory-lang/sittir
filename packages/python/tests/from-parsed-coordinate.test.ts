// A parsed node read shallow holds each unread child as a coordinate; from()
// takes that coordinate as a node of its kind and stores it as it is.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '@sittir/common/utils';
import python from '../src/index.ts';

const py = await createEngine(python);

type Statements = { readonly _statements: readonly unknown[] };

describe('from() of a parsed module whose statements are unread', () => {
	it('keeps the coordinate, and renders the source', () => {
		const source = 'x = y\n';
		const parsed = py.parse(source);
		const [unread] = (parsed as unknown as Statements)._statements;
		expect(isCoordinate(unread)).toBe(true);
		const built = py.build.module(parsed);
		expect((built as unknown as Statements)._statements[0]).toBe(unread);
		expect(py.render(built).toString()).toBe(source);
	});
});
