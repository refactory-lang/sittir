import { describe, it, expect } from 'vitest';
import { distributeInlineAliasChoices } from '../rule-transforms.ts';
import type { Rule } from '../../types/rule.ts';

const S = (value: string) => ({ type: 'STRING', value }) as Rule<'evaluate'>;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as Rule<'evaluate'>;
const alias = (content: Rule<'evaluate'>, value: string) => ({ type: 'ALIAS', named: true, value, content }) as Rule<'evaluate'>;
const choice = (...members: Rule<'evaluate'>[]) => ({ type: 'CHOICE', members }) as Rule<'evaluate'>;
const isRuleName = (rules: readonly string[]) => ({ isRuleName: (name: string) => rules.includes(name) });

describe('distributeInlineAliasChoices', () => {
	it('an alias over a choice becomes a choice of aliased arms', () => {
		const out = distributeInlineAliasChoices(alias(choice(sym('identifier'), S('type')), 'property_identifier'), isRuleName(['identifier'])) as {
			type: string;
			members: { type: string; value: string; content: { name?: string; value?: string } }[];
		};
		expect(out.type).toBe('CHOICE');
		expect(out.members.map((m) => m.type)).toEqual(['ALIAS', 'ALIAS']);
		expect(out.members.every((m) => m.value === 'property_identifier')).toBe(true);
		expect(out.members.map((m) => m.content.name ?? m.content.value)).toEqual(['identifier', 'type']);
	});

	it('a symbol arm is aliased as it stands, not looked through', () => {
		const out = distributeInlineAliasChoices(alias(choice(sym('identifier'), sym('_reserved')), 'property_identifier'), isRuleName(['identifier', '_reserved'])) as {
			members: { content: { name?: string } }[];
		};
		expect(out.members.map((m) => m.content.name)).toEqual(['identifier', '_reserved']);
	});

	it('an alias whose display is an existing rule is left alone', () => {
		const rule = alias(choice(S('default'), S('union')), 'identifier');
		expect(distributeInlineAliasChoices(rule, isRuleName(['identifier']))).toBe(rule);
	});

	it('an alias over a single symbol or literal is unchanged', () => {
		const rule = alias(sym('x'), 'y');
		expect(distributeInlineAliasChoices(rule, isRuleName(['x']))).toBe(rule);
	});
});
