import { expect, it } from 'vitest';
import scm from '../src/index.ts';

const engine = await scm.createEngine();

it('a parsed leaf carries $query like any node; its facet is empty', () => {
	const leaf = engine.parse('(identifier) @x\n').$query().$descendants.ofType(engine.kinds.Identifier).find()!;
	expect(leaf.$type).toBe(engine.kinds.Identifier);
	expect(typeof (leaf as { $query?: unknown }).$query).toBe('function');
	expect(Object.keys(engine.query(leaf))).toEqual(['$children', '$descendants']);
	expect(Array.from(engine.query(leaf).$descendants)).toEqual([]);
	expect(Array.from(engine.query(leaf).$children)).toEqual([]);
});
