import { describe, it, expect } from 'vitest';
import { link } from '../link.ts';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';

function makeRaw(rules: Record<string, Rule<'evaluate'>>, overrides?: Partial<RawGrammar>): RawGrammar {
	return {
		name: 'test',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		...overrides
	};
}

describe('link builds one display union per alias target', () => {
	it('collects every storage kind that displays under a name', () => {
		const linked = link(
			makeRaw({
				source: {
					type: 'SEQ',
					members: [
						{
							type: 'CHOICE',
							members: [
								{ type: 'ALIAS', named: true, value: 'property_identifier', content: { type: 'SYMBOL', name: 'identifier' } },
								{ type: 'ALIAS', named: true, value: 'property_identifier', content: { type: 'STRING', value: 'type' } }
							]
						}
					]
				} as Rule<'evaluate'>,
				identifier: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
			})
		);
		expect([...linked.displayUnions!.get('property_identifier')!].sort()).toEqual(['identifier', 'type']);
	});

	it('a rule that is also an alias target is a member of its own union', () => {
		const linked = link(
			makeRaw({
				source: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'generic_type' }, { type: 'SYMBOL', name: 'use' }] } as Rule<'evaluate'>,
				generic_type: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'identifier' }] } as Rule<'evaluate'>,
				generic_type_with_turbofish: {
					type: 'SEQ',
					members: [{ type: 'SYMBOL', name: 'identifier' }, { type: 'STRING', value: '::' }]
				} as Rule<'evaluate'>,
				use: { type: 'ALIAS', named: true, value: 'generic_type', content: { type: 'SYMBOL', name: 'generic_type_with_turbofish' } } as Rule<'evaluate'>,
				identifier: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
			})
		);
		expect([...linked.displayUnions!.get('generic_type')!].sort()).toEqual(['generic_type', 'generic_type_with_turbofish']);
	});
});
