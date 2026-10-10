import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('builders and their kind spelled in full', () => {
	it('takes the delimiters in the text only when told they are there', () => {
		expect(rs.build.escapeSequence.hex('\\x41', false).$render()).toBe('\\x41');
		expect(rs.build.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(rs.build.lifetime("'a").$render()).toBe("'a");
		expect(rs.build.lifetime('a').$render()).toBe("'a");
	});

	it('keeps a kind with an optional delimiter flag to its bare content', () => {
		expect(rs.build.charLiteral('a').$render()).toBe("'a'");
	});

	it('strips a polymorph default arm and refuses text that reads as a sibling arm', () => {
		expect(rs.build.blockComment('/* x */').$render()).toBe('/* x */');
		expect(rs.build.blockComment(' x ').$render()).toBe('/* x */');
		// @ts-expect-error the interior starts the way ir.blockComment.docInner does
		expect(() => rs.build.blockComment('/*! x */')).toThrow(/build it with ir\.blockComment\.docInner/);
		const text: string = '/*! x */';
		expect(() => rs.build.blockComment(text)).toThrow(/build it with ir\.blockComment\.docInner/);
	});

	it('leaves a polymorph to the runtime refusal from its first pattern lead on', () => {
		expect(rs.build.lineComment('// x').$render()).toBe('// x\n');
		expect(() => rs.build.lineComment('//// x')).toThrow(/build it with ir\.lineCommentExtraSlashes/);
		expect(() => rs.build.lineComment('/// x')).toThrow(/build it with ir\.lineComment\.docOuter/);
	});
});
