import { expect, it } from 'vitest';
import typescript from '../src/index.ts';

const engine = await typescript.createEngine();

it('a parsed leaf carries $query like any node; its facet is empty', () => {
	const leaf = engine.parse('let x = 1;\n').$query().$descendants.ofType(engine.kinds.Identifier).find()!;
	expect(leaf.$type).toBe(engine.kinds.Identifier);
	expect(typeof (leaf as { $query?: unknown }).$query).toBe('function');
	expect(Object.keys(engine.query(leaf))).toEqual(['$children', '$descendants']);
	expect(Array.from(engine.query(leaf).$descendants)).toEqual([]);
	expect(Array.from(engine.query(leaf).$children)).toEqual([]);
});
