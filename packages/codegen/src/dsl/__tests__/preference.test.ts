import { describe, expect, it } from 'vitest';
import { applyPreference } from '../transform/transform.ts';
import { preference } from '../primitives/preference.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

const choice = (): RuntimeRule =>
	({
		type: 'CHOICE',
		members: [
			{
				type: 'ALIAS',
				named: true,
				value: { type: 'SYMBOL', name: 'automatic_semicolon' },
				content: { type: 'SYMBOL', name: '_automatic_semicolon' }
			},
			{ type: 'STRING', value: ';' }
		]
	}) as unknown as RuntimeRule;

describe('applyPreference', () => {
	it('labels every arm and marks the default one', () => {
		const out = applyPreference(choice(), preference('statement_terminator', ';'), '_semicolon') as unknown as {
			members: { annotations?: Record<string, unknown>; content?: { annotations?: Record<string, unknown> } }[];
		};
		expect(out.members[0]!.content!.annotations).toEqual({ preference: 'statement_terminator' });
		expect(out.members[1]!.annotations).toEqual({ preference: 'statement_terminator', default: true });
	});

	it('matches the default by alias target as well as literal text', () => {
		const out = applyPreference(
			choice(),
			preference('statement_terminator', 'automatic_semicolon'),
			'_semicolon'
		) as unknown as {
			members: { content?: { annotations?: Record<string, unknown> } }[];
		};
		expect(out.members[0]!.content!.annotations).toEqual({ preference: 'statement_terminator', default: true });
	});

	it('reaches a choice through a prec wrapper', () => {
		const wrapped = { type: 'PREC', value: 1, content: choice() } as unknown as RuntimeRule;
		const out = applyPreference(wrapped, preference('t', ';'), 'k') as unknown as {
			content: { members: { annotations?: unknown }[] };
		};
		expect(out.content.members[1]!.annotations).toEqual({ preference: 't', default: true });
	});

	it('refuses a default that names no arm, and a rule that is not a choice', () => {
		expect(() => applyPreference(choice(), preference('t', 'newline'), '_semicolon')).toThrow(
			/no arm is spelled 'newline'/
		);
		expect(() =>
			applyPreference({ type: 'STRING', value: ';' } as unknown as RuntimeRule, preference('t', ';'), 'k')
		).toThrow(/not a choice/);
	});
});

describe('applyPreference on a repeat', () => {
	it('stamps the label and default as the repeat separator\'s spacing declaration', () => {
		const repeat = { type: 'REPEAT', content: { type: 'SYMBOL', name: 'statement' } } as unknown as RuntimeRule;
		const out = applyPreference(repeat, preference('empty_separator_space', 'tight'), 'block') as unknown as {
			annotations?: { spacing?: Record<string, string> };
		};
		expect(out.annotations?.spacing).toEqual({ empty_separator_space: 'tight' });
	});

	it('reaches a repeat through a field wrapper and merges a second label', () => {
		const field = {
			type: 'FIELD',
			name: 'elements',
			content: { type: 'REPEAT1', content: { type: 'SYMBOL', name: 'x' }, annotations: { spacing: { comma_separator_space_after: 'space' } } }
		} as unknown as RuntimeRule;
		const out = applyPreference(field, preference('comma_separator_space_before', 'tight'), 'k') as unknown as {
			content: { annotations?: { spacing?: Record<string, string> } };
		};
		expect(out.content.annotations?.spacing).toEqual({ comma_separator_space_after: 'space', comma_separator_space_before: 'tight' });
	});
});

