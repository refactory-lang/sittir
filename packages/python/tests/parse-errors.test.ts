import { expect, it } from 'vitest';
import python from '../src/index.ts';
import { TSKindId } from '../src/kinds.ts';

const engine = await python.createEngine();

it('a parsed root reports a token the parser inserted as an empty missing region, naming the node it was inserted into', () => {
	expect(engine.parse('def f(:\n    pass\nx = 1\n').$errors).toEqual([
		{ kind: 'missing', span: { start: 6, end: 6 }, holder: { kind: TSKindId.Parameters, span: { start: 5, end: 6 } } }
	]);
});

it('a parsed root reports none for a source that parsed cleanly', () => {
	expect(engine.parse('def f():\n    pass\nx = 1\n').$errors).toEqual([]);
});
