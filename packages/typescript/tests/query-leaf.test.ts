import { expect, it } from 'vitest';
import typescript from '../src/index.ts';

const engine = await typescript.createEngine();

it('a parsed leaf is plain data with no $query; engine.query gives it an empty facet', () => {
	const leaf = engine.parse('let x = 1;\n').$query().$descendants.ofType(engine.kinds.Identifier).find()!;
	expect(leaf.$type).toBe(engine.kinds.Identifier);
	expect('$query' in leaf).toBe(false);
	expect(Object.keys(engine.query(leaf))).toEqual(['$children', '$descendants']);
	expect(Array.from(engine.query(leaf).$descendants)).toEqual([]);
	expect(Array.from(engine.query(leaf).$children)).toEqual([]);
});
