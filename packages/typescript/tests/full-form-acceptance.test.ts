import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('builders and their kind spelled in full', () => {
	it('takes the delimiters in the text only when told they are there', () => {
		expect(ts.build.comment.block('/* x */', false).$render()).toBe('/* x */');
		expect(ts.build.privatePropertyIdentifier('#x', false).$render()).toBe('#x');
		expect(() => ts.build.comment.block('/* x */')).toThrow(/comment_block.content: text does not match/);
		expect(() => ts.build.privatePropertyIdentifier('#x')).toThrow(/private_property_identifier.content: text does not match/);
	});

	it('takes text as content when not told otherwise, so affixes the content pattern admits are doubled', () => {
		expect(ts.build.comment.line('// x').$render()).toBe('//// x\n');
		expect(ts.build.comment.line('// x', false).$render()).toBe('// x\n');
	});

	it('refuses text given as spelled in full that lacks its affixes', () => {
		const text: string = ' x';
		expect(() => ts.build.comment.line(text as `//${string}`, false)).toThrow(/comment_line: text given with its affixes must be/);
	});

	it('takes the typed prefix as the spelling and the default when bare', () => {
		expect(ts.build.number.hex('0XFF').$render()).toBe('0XFF');
		expect(ts.build.number.hex('FF').$render()).toBe('0xFF');
	});

	it('takes a suffix glued inside the token', () => {
		expect(ts.build.number.bigint('1n', false).$render()).toBe(ts.build.number.bigint('1').$render());
	});

	it('reads a delimiter that is itself a valid interior as the interior', () => {
		expect(ts.build.escapeSequence('\\').$render()).toBe('\\\\');
		expect(ts.build.escapeSequence('\\\\', false).$render()).toBe('\\\\');
		expect(['n', 'r', 't', "'"].map((text) => ts.build.escapeSequence(text).$render())).toEqual(['\\n', '\\r', '\\t', "\\'"]);
	});

	it('leaves a kind whose affix is separated from its content to its bare content', () => {
		expect(() => ts.build.namespaceImport('* as x')).toThrow(/is not a identifier/);
	});
});
