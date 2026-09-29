import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ts.build.comment.block('/* x */').$render()).toBe('/* x */');
		expect(ts.build.privatePropertyIdentifier('#x').$render()).toBe('#x');
	});

	it('takes the typed prefix as the spelling and the default when bare', () => {
		expect(ts.build.number.hex('0XFF').$render()).toBe('0XFF');
		expect(ts.build.number.hex('FF').$render()).toBe('0xFF');
	});

	it('takes a suffix glued inside the token', () => {
		expect(ts.build.number.bigint('1n').$render()).toBe(ts.build.number.bigint('1').$render());
	});

	it('reads a delimiter that is itself a valid interior as the interior', () => {
		expect(ts.build.escapeSequence('\\').$render()).toBe('\\\\');
		expect(ts.build.escapeSequence('\\\\').$render()).toBe('\\\\');
		expect(ts.build.escapeSequence.strict('\\').$render()).toBe('\\\\');
		expect(['n', 'r', 't', "'"].map((text) => ts.build.escapeSequence(text).$render())).toEqual(['\\n', '\\r', '\\t', "\\'"]);
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => ts.build.namespaceImport('* as x')).toThrow(/is not a identifier/);
	});
});
