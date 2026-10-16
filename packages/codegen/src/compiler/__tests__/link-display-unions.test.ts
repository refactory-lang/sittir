import { describe, it, expect } from 'vitest';
import { link } from '../link.ts';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';

function makeRaw(rules: Record<string, Rule<'evaluate'>>, overrides?: Partial<RawGrammar>): RawGrammar {
	return {
		name: 'test',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
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
	it('keeps a catalog default alias beside the other storage of the same display', () => {
		const raw = makeRaw({
			source: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'first' },
					{ type: 'ALIAS', named: true, value: 'shown', content: { type: 'SYMBOL', name: 'second' } }
				]
			} as Rule<'evaluate'>,
			first: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'a' },
					{ type: 'SYMBOL', name: 'identifier' }
				]
			} as Rule<'evaluate'>,
			second: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'b' },
					{ type: 'SYMBOL', name: 'identifier' }
				]
			} as Rule<'evaluate'>,
			identifier: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
		});
		const parser = (kind: string, symbolName = kind) => ({
			cSymbol: `sym_${kind}`,
			parserName: kind,
			symbolName,
			anon: false,
			aux: false,
			alias: false,
			hidden: false
		});
		const linked = link(raw, {
			generatedIdTables: {
				sourceArtifact: 'fixture',
				kindIds: {
					source: { id: 1, parser: parser('source') },
					identifier: { id: 2, parser: parser('identifier') },
					first: { id: 3, parser: parser('first', 'shown') },
					second: { id: 4, parser: parser('second', 'shown') },
					_shown: { id: 5, parser: { ...parser('shown'), cSymbol: 'alias_sym_shown', alias: true } }
				}
			}
		});
		expect([...(linked.displayUnions?.get('shown') ?? [])].sort((a, b) => a.storage.localeCompare(b.storage))).toEqual([
			{ storage: 'first', literal: false },
			{ storage: 'second', literal: false }
		]);
	});

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
		const members = [...linked.displayUnions!.get('property_identifier')!].sort((x, y) => x.storage.localeCompare(y.storage));
		expect(members).toEqual([
			{ storage: 'identifier', literal: false },
			{ storage: 'type', literal: true }
		]);
	});

	it('a rule that is also an alias target is a member of its own union', () => {
		const linked = link(
			makeRaw({
				source: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'generic_type' }, { type: 'SYMBOL', name: 'use' }] } as Rule<'evaluate'>,
				generic_type: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'identifier' }] } as Rule<'evaluate'>,
				generic_type_with_turbofish: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'identifier' },
						{ type: 'STRING', value: '::' }
					]
				} as Rule<'evaluate'>,
				use: {
					type: 'ALIAS',
					named: true,
					value: 'generic_type',
					content: { type: 'SYMBOL', name: 'generic_type_with_turbofish' }
				} as Rule<'evaluate'>,
				identifier: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
			})
		);
		const members = [...linked.displayUnions!.get('generic_type')!].sort((x, y) => x.storage.localeCompare(y.storage));
		expect(members).toEqual([
			{ storage: 'generic_type', literal: false },
			{ storage: 'generic_type_with_turbofish', literal: false }
		]);
	});
});
