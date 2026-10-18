import { expect, it } from 'vitest';
import regex from '../src/index.ts';

const engine = await regex.createEngine();

it('a parsed leaf carries $query like any node; its facet is empty', () => {
	const leaf = engine.parse('ab').$query().$descendants.ofType(engine.kinds.PatternCharacter).find()!;
	expect(leaf.$type).toBe(engine.kinds.PatternCharacter);
	expect(typeof (leaf as { $query?: unknown }).$query).toBe('function');
	expect(Object.keys(engine.query(leaf))).toEqual(['$children', '$descendants']);
	expect(Array.from(engine.query(leaf).$descendants)).toEqual([]);
	expect(Array.from(engine.query(leaf).$children)).toEqual([]);
});
