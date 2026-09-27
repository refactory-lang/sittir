import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ir.escapeSequence.hex('\\x41').$render()).toBe('\\x41');
		expect(ir.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(ir.lifetime("'a").$render()).toBe("'a");
		expect(ir.lifetime('a').$render()).toBe("'a");
	});

	it('keeps a kind with an optional delimiter flag to its bare content', () => {
		expect(ir.charLiteral('a').$render()).toBe("'a'");
	});

	it('strips a polymorph default arm and refuses text that reads as a sibling arm', () => {
		expect(ir.blockComment('/* x */').$render()).toBe('/* x */');
		expect(ir.blockComment(' x ').$render()).toBe('/* x */');
		// @ts-expect-error the interior starts the way ir.blockCommentDocInner does
		expect(() => ir.blockComment('/*! x */')).toThrow(/build it with ir\.blockCommentDocInner/);
		const text: string = '/*! x */';
		expect(() => ir.blockComment(text)).toThrow(/build it with ir\.blockCommentDocInner/);
	});

	it('leaves a polymorph to the runtime refusal from its first pattern lead on', () => {
		expect(ir.lineComment('// x').$render()).toBe('// x');
		expect(() => ir.lineComment('//// x')).toThrow(/build it with ir\.lineCommentExtraSlashes/);
		expect(() => ir.lineComment('/// x')).toThrow(/build it with ir\.lineCommentDocOuter/);
	});
});
