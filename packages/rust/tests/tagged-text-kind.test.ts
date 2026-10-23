// A kind built from text takes a kind tag in either input shape: its text
// (`{ $type, text }`) or, when the kind has slots, its config. A slotless
// leaf has no config, so a tag without its text is refused.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const value = (expression: object): string =>
	String(rs.build.letDeclaration({ pattern: 'x', value: expression } as never));
const typed = (type: object): string =>
	String(rs.build.letDeclaration({ pattern: 'x', type } as never));

describe('a kind tag in either input shape', () => {
	it('an affixed token: its content, or its config', () => {
		const byText = value({ $type: rs.kinds.CharLiteralPlain, text: 'q' });
		expect(byText).toContain("'q'");
		expect(value({ $type: rs.kinds.CharLiteralPlain, content: 'q' })).toBe(byText);
	});

	it('a token with interior slots: its text, or its config', () => {
		const byText = value({ $type: rs.kinds.IntegerLiteralHex, text: '0x1Fu8' });
		expect(byText).toContain('0x1Fu8');
		expect(value({ $type: rs.kinds.IntegerLiteralHex, content: '0x1F', suffix: 'u8' })).toBe(byText);
	});

	it('a leaf alias envelope: its text, or its config', () => {
		const byText = typed({ $type: rs.kinds.TypeIdentifier, text: 'T' });
		expect(byText).toContain(': T');
		expect(typed({ $type: rs.kinds.TypeIdentifier, content: 'T' })).toBe(byText);
	});

	it('a leaf that stores its text has no config: a tag without its text is refused', () => {
		expect(() => value({ $type: rs.kinds.Identifier, content: 'y' })).toThrow(/the identifier tag takes its text/);
	});
});
