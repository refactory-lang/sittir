import { describe, it, expect } from 'vitest';
import { distributeInlineAliasChoices } from '../rule-transforms.ts';
import type { Rule } from '../../types/rule.ts';

const S = (value: string) => ({ type: 'STRING', value }) as Rule<'evaluate'>;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as Rule<'evaluate'>;
const alias = (content: Rule<'evaluate'>, value: string) => ({ type: 'ALIAS', named: true, value, content }) as Rule<'evaluate'>;
const choice = (...members: Rule<'evaluate'>[]) => ({ type: 'CHOICE', members }) as Rule<'evaluate'>;
const inlining = (inline: Record<string, Rule<'evaluate'>> = {}) => ({ inlineBodyOf: (name: string) => inline[name] });

describe('distributeInlineAliasChoices', () => {
	it('an alias over a choice becomes a choice of aliased arms', () => {
		const out = distributeInlineAliasChoices(alias(choice(sym('identifier'), S('type')), 'property_identifier'), inlining()) as {
			type: string;
			members: { type: string; value: string; content: { name?: string; value?: string } }[];
		};
		expect(out.type).toBe('CHOICE');
		expect(out.members.map((m) => m.type)).toEqual(['ALIAS', 'ALIAS']);
		expect(out.members.every((m) => m.value === 'property_identifier')).toBe(true);
		expect(out.members.map((m) => m.content.name ?? m.content.value)).toEqual(['identifier', 'type']);
	});

	it('a symbol arm is aliased as it stands, not looked through', () => {
		const out = distributeInlineAliasChoices(alias(choice(sym('identifier'), sym('_reserved')), 'property_identifier'), inlining()) as {
			members: { content: { name?: string } }[];
		};
		expect(out.members.map((m) => m.content.name)).toEqual(['identifier', '_reserved']);
	});

	it('an alias distributes whether or not its display is a rule of its own', () => {
		const rule = alias(choice(S('default'), S('union')), 'identifier');
		expect(distributeInlineAliasChoices(rule, inlining())).toEqual(
			choice(alias(S('default'), 'identifier'), alias(S('union'), 'identifier'))
		);
	});

	it('an alias over a single symbol or literal is unchanged', () => {
		const rule = alias(sym('x'), 'y');
		expect(distributeInlineAliasChoices(rule, inlining())).toBe(rule);
	});

	it('an alias over an inlined choice rule distributes its body, as tree-sitter substitutes it', () => {
		const rule = alias(sym('_reserved'), 'keyword');
		const out = distributeInlineAliasChoices(rule, inlining({ _reserved: choice(S('a'), S('b')) }));
		expect(out).toEqual(choice(alias(S('a'), 'keyword'), alias(S('b'), 'keyword')));
	});

	it('an inlined choice rule among the arms contributes its own arms', () => {
		const rule = alias(choice(sym('identifier'), sym('_reserved')), 'property_identifier');
		const out = distributeInlineAliasChoices(rule, inlining({ _reserved: choice(S('get'), S('set')) }));
		expect(out).toEqual(
			choice(alias(sym('identifier'), 'property_identifier'), alias(S('get'), 'property_identifier'), alias(S('set'), 'property_identifier'))
		);
	});
});
