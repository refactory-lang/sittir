import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import scm from '../src/index.ts';

const engine = await createEngine(scm);

describe('a named node', () => {
	it('renders its parentheses unpadded, built or after a leading comment', () => {
		expect(engine.build.namedNode.plain({ name: 'foo' }).$render()).toBe('(foo)');
		const definitions = engine.parse('; c\n(a (b) (c))').definitions();
		expect(definitions[definitions.length - 1]!.$render()).toBe('; c\n(a (b) (c))');
	});
});
