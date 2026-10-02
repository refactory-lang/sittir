// Trivia text is resolved one item at a time. Text spelled in full is the
// comment kind it opens as; any other text is the default comment kind's,
// as its content.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(typescript);
const ir = engine.build;
const statement = () => ir.expressionStatement(ir.identifier('x'));

describe('trivia given as text', () => {
	it('builds the kind the text opens as', () => {
		expect(statement().$trivia.trailing('/* x */').$render()).toBe('x;\n/* x */');
		expect(statement().$trivia.trailing('// x').$render()).toBe('x;\n// x\n');
		expect(statement().$trivia.trailing('/** doc */').$render()).toBe('x;\n/** doc */');
	});

	it('builds the kind\'s node, with the content between its affixes', () => {
		type Comment = { readonly $type: number; content(): string };
		const [block] = statement().$trivia.trailing('/* x */').$trivia.trailing() as unknown as [Comment];
		expect([block.$type, block.content()]).toEqual([engine.kinds.CommentBlock, ' x ']);
		const [line] = statement().$trivia.trailing('// x').$trivia.trailing() as unknown as [Comment];
		expect([line.$type, line.content()]).toEqual([engine.kinds.CommentLine, ' x']);
	});

	it('takes any other text as the content of the default comment kind', () => {
		expect(statement().$trivia.trailing(' x').$render()).toBe('x;\n// x\n');
		expect(statement().$trivia.trailing('/* unterminated').$render()).toBe('x;\n///* unterminated\n');
	});

	it('resolves each item of a call on its own', () => {
		expect(statement().$trivia.trailing('// a', '/* b */', ' c').$render()).toBe('x;\n// a\n/* b */\n// c\n');
		expect(statement().$trivia.leading('/* b */', ir.comment.line(' n')).$render()).toBe('/* b */\n// n\nx;');
	});
});
