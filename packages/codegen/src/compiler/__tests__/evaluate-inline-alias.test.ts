import { describe, it, expect } from 'vitest';
import { synthesizeInlineAliasSources, type EvaluateCtx } from '../evaluate.ts';
import type { Rule } from '../../types/rule.ts';
import type { RuleProvenance } from '../types.ts';

const S = (value: string) => ({ type: 'STRING', value }) as Rule<'evaluate'>;
const P = (value: string) => ({ type: 'PATTERN', value }) as Rule<'evaluate'>;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as Rule<'evaluate'>;
const alias = (content: Rule<'evaluate'>, value: string) =>
	({ type: 'ALIAS', named: true, value, content }) as Rule<'evaluate'>;

function runSynthesize(rules: Record<string, Rule<'evaluate'>>): Record<string, Rule<'evaluate'>> {
	const ctx: EvaluateCtx = {
		rules,
		provenanceByKind: new Map<string, RuleProvenance>(),
		refs: [],
		opts: {} as EvaluateCtx['opts'],
		baseRules: {},
		baseGrammar: null,
		externals: [],
		isExtension: false,
		sinks: { extras: [], externals: [], supertypes: [], factoryInline: [], inline: [], conflicts: [], precedences: [] },
		setWord: () => {},
		bodyPatternZeroMatches: [],
		desugarDivergences: []
	};
	synthesizeInlineAliasSources(rules, ctx);
	return rules;
}

describe('inline alias content is distributed over its arms', () => {
	it('an alias over a choice becomes a choice of aliased arms and mints no hidden rule', () => {
		const rules = runSynthesize({
			source: {
				type: 'SEQ',
				members: [alias({ type: 'CHOICE', members: [sym('identifier'), S('type')] } as Rule<'evaluate'>, 'property_identifier')]
			} as Rule<'evaluate'>,
			identifier: P('[a-z]+')
		});
		const member = (rules.source as { members: unknown[] }).members[0] as {
			type: string;
			members: { type: string; value: string; content: unknown }[];
		};
		expect(member.type).toBe('CHOICE');
		expect(member.members.map((m) => m.type)).toEqual(['ALIAS', 'ALIAS']);
		expect(member.members.every((m) => m.value === 'property_identifier')).toBe(true);
		expect(rules._property_identifier).toBeUndefined();
	});

	it('an alias over a hidden rule whose body is a choice distributes through the rule when the alias is its only use', () => {
		const rules = runSynthesize({
			source: {
				type: 'SEQ',
				members: [alias({ type: 'CHOICE', members: [sym('identifier'), sym('_reserved')] } as Rule<'evaluate'>, 'property_identifier')]
			} as Rule<'evaluate'>,
			_reserved: { type: 'CHOICE', members: [S('type'), S('public')] } as Rule<'evaluate'>,
			identifier: P('[a-z]+')
		});
		const member = (rules.source as { members: unknown[] }).members[0] as {
			members: { content: { type: string; value?: string; name?: string } }[];
		};
		expect(member.members.map((m) => m.content.name ?? m.content.value)).toEqual(['identifier', 'type', 'public']);
	});

	it('an alias over a single symbol or literal is unchanged', () => {
		const rules = runSynthesize({ source: alias(sym('x'), 'y'), x: S('x') });
		expect(rules.source).toMatchObject({ type: 'ALIAS', value: 'y', content: { type: 'SYMBOL', name: 'x' } });
	});
});
