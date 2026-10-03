import { expect, it } from 'vitest';
import python from '../src/index.ts';

const engine = await python.createEngine();

it('a parsed root reports a token the parser inserted as an empty missing region', () => {
	expect(engine.parse('def f(:\n    pass\nx = 1\n').$errors).toEqual([{ kind: 'missing', span: { start: 6, end: 6 } }]);
});

it('a parsed root reports none for a source that parsed cleanly', () => {
	expect(engine.parse('def f():\n    pass\nx = 1\n').$errors).toEqual([]);
});
