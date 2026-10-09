import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const engine = await createEngine(python);

describe('an alias whose content is its own parser node', () => {
	it('is one object through its envelope and through a query', () => {
		const root = engine.parse('with a as b:\n  pass\n', { depth: 1 });
		const pattern = root.$query().$descendants.ofType(engine.kinds.AsPattern).at(0);
		if (pattern === undefined || !engine.is.asPattern(pattern)) throw new Error('expected an as pattern');
		const content = pattern.alias().content();
		expect(pattern.alias().content()).toBe(content);
		expect(root.$query().$descendants.ofType(engine.kinds.Identifier).includes(content as never)).toBe(true);
	});
});
