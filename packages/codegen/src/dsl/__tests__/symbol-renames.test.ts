import { describe, it, expect } from 'vitest';
import { renameNameList, renameRule } from '../wire/symbol-renames.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const renames = new Map([
	['comment_arm1', 'comment_line'],
	['comment_line', 'comment_final']
]);

describe('renameRule', () => {
	it('renames a symbol wherever it sits in a rule tree, following a chain of renames', () => {
		const rule = { type: 'SEQ', members: [sym('a'), { type: 'FIELD', name: 'comment_arm1', content: sym('comment_arm1') }] };
		expect(renameRule(rule, renames)).toEqual({
			type: 'SEQ',
			members: [sym('a'), { type: 'FIELD', name: 'comment_arm1', content: sym('comment_final') }]
		});
	});
	it('renames every entry of an extras or externals list', () => {
		expect(renameRule([sym('comment_arm1'), { type: 'PATTERN', value: '\\s' }], renames)).toEqual([
			sym('comment_final'),
			{ type: 'PATTERN', value: '\\s' }
		]);
	});
	it('returns the input untouched when nothing is renamed', () => {
		const rule = [sym('a')];
		expect(renameRule(rule, new Map())).toBe(rule);
	});
});

describe('renameNameList', () => {
	it('renames the bare names of conflicts, inline and supertypes as well as symbol entries', () => {
		expect(renameNameList([['comment_arm1', 'x'], sym('comment_arm1'), 'y'], renames)).toEqual([
			['comment_final', 'x'],
			sym('comment_final'),
			'y'
		]);
	});
});
