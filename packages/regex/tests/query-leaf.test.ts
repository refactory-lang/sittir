import { expect, it } from 'vitest';
import regex from '../src/index.ts';

const engine = await regex.createEngine();

it('a parsed leaf is plain data with no $query; engine.query gives it an empty facet', () => {
	const leaf = engine.parse('ab').$query().$descendants.ofType(engine.kinds.PatternCharacter).find()!;
	expect(leaf.$type).toBe(engine.kinds.PatternCharacter);
	expect('$query' in leaf).toBe(false);
	expect(Object.keys(engine.query(leaf))).toEqual(['$children', '$descendants']);
	expect(Array.from(engine.query(leaf).$descendants)).toEqual([]);
	expect(Array.from(engine.query(leaf).$children)).toEqual([]);
});
