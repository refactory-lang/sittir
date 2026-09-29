import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ir.comment.block('/* x */').$render()).toBe('/* x */');
		expect(ir.privatePropertyIdentifier('#x').$render()).toBe('#x');
	});

	it('takes the typed prefix as the spelling and the default when bare', () => {
		expect(ir.number.hex('0XFF').$render()).toBe('0XFF');
		expect(ir.number.hex('FF').$render()).toBe('0xFF');
	});

	it('takes a suffix glued inside the token', () => {
		expect(ir.number.bigint('1n').$render()).toBe(ir.number.bigint('1').$render());
	});

	it('reads a delimiter that is itself a valid interior as the interior', () => {
		expect(ir.escapeSequence('\\').$render()).toBe('\\\\');
		expect(ir.escapeSequence('\\\\').$render()).toBe('\\\\');
		expect(ir.escapeSequence.strict('\\').$render()).toBe('\\\\');
		expect(['n', 'r', 't', "'"].map((text) => ir.escapeSequence(text).$render())).toEqual(['\\n', '\\r', '\\t', "\\'"]);
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => ir.namespaceImport('* as x')).toThrow(/is not a identifier/);
	});
});
