// Trivia text is resolved one item at a time. Text spelled in full is the
// comment kind it opens as; any other text is the default comment kind's,
// as its content.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(rust);
const ir = engine.build;
const statement = () => ir.expressionStatement(ir.identifier('x'));

describe('trivia given as text', () => {
	it('builds the kind the text opens as', () => {
		expect(statement().$trivia.trailing('/* x */').$render()).toBe('x;\n/* x */');
		expect(statement().$trivia.trailing('// x').$render()).toBe('x;\n// x\n');
	});

	it('takes any other text as the content of the default comment kind', () => {
		expect(statement().$trivia.trailing(' x').$render()).toBe('x;\n// x\n');
	});

	it('leaves the choice inside the kind to that kind, which refuses text that reads as another arm', () => {
		expect(() => statement().$trivia.trailing('/// x')).toThrow(/build it with ir\.lineCommentDocOuter/);
		expect(() => statement().$trivia.trailing('/** x */')).toThrow(/build it with ir\.blockCommentDocOuter/);
	});

	it('resolves each item of a call on its own', () => {
		expect(statement().$trivia.leading('// a', '/* b */', ' c').$render()).toBe('// a\n/* b */\n// c\nx;');
	});
});
