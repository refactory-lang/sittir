// A source the parser cannot read at all parses to an ERROR root: the read
// gives it its text, and it renders as the source.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import regex from '../src/index.ts';

const re = await createEngine(regex);

describe('an ERROR root', () => {
	it('reads as an ERROR node holding the whole source', () => {
		const root = re.parse(')');
		expect(isErrorNode(root)).toBe(true);
		expect((root as unknown as { $text: string }).$text).toBe(')');
		expect(re.render(root as never).toString()).toBe(')');
	});
});
