// Trivia text is resolved one item at a time. Text spelled in full is the
// comment kind it opens as; any other text is the default comment kind's,
// as its content.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(python);
const ir = engine.build;
const statement = () => ir.expressionStatement(ir.identifier('x'));

describe('trivia given as text, in a grammar with one comment kind', () => {
	it('takes the text spelled in full or as content, as before', () => {
		expect(statement().$trivia.trailing('# x').$render()).toBe('x\n# x\n');
		expect(statement().$trivia.trailing(' x').$render()).toBe('x\n# x\n');
	});

	it('has no table of spellings to choose from', () => {
		expect(engine.trivia.spelled).toBeUndefined();
	});
});
