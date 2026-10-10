// A parsed node read shallow holds each unread child as a coordinate; from()
// takes that coordinate as a node of its kind and stores it as it is.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '@sittir/common/utils';
import scm from '../src/index.ts';

const query = await createEngine(scm);

type Definitions = { readonly _definitions: readonly unknown[] };

describe('from() of a parsed program whose definitions are unread', () => {
	it('keeps the coordinate, and renders the source', () => {
		const source = '(program)\n';
		const parsed = query.parse(source);
		const [unread] = (parsed as unknown as Definitions)._definitions;
		expect(isCoordinate(unread)).toBe(true);
		const built = query.build.program(parsed);
		expect((built as unknown as Definitions)._definitions[0]).toBe(unread);
		expect(query.render(built).toString()).toBe(source);
	});
});
