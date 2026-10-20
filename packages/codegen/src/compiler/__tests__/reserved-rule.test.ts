import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDsl, restoreFakeDsl } from '../../dsl/__tests__/_test-helpers.ts';
import { structuralBuilder } from '../../dsl/builders.ts';
import { evaluateDsl } from '../../dsl/evaluate.ts';
import { evaluate } from '../../dsl/evaluate.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';
import { predictKindCatalog } from '../../dsl/symbol-table.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const fixture = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../__tests__/fixtures/reserved-rule-grammar.js');

describe('reserved(wordset, rule)', () => {
	it('builds the node tree-sitter carries in grammar.json', () => {
		const content = { type: 'STRING', value: 'x' } as never;
		expect((structuralBuilder as unknown as { reserved: (set: string, rule: unknown) => unknown }).reserved('properties', content)).toEqual({
			type: 'RESERVED',
			content,
			context_name: 'properties'
		});
	});

	it('evaluates in a grammar and keeps the wordset declaration', async () => {
		const evaluated = await evaluateDsl(fixture);
		const member = evaluated.rules['member'] as { members: { type: string; context_name?: string; content?: { type: string } }[] };
		const reserved = member.members.find((entry) => entry.type === 'RESERVED');
		expect(reserved?.context_name).toBe('properties');
		expect(reserved?.content?.type).toBe('ALIAS');
		expect(Object.keys(evaluated.reserved ?? {})).toEqual(['global', 'properties']);
	});

	it('is transparent to the compile boundary and to the kind prediction', async () => {
		const raw = await evaluate(fixture, NO_FILE_TYPES);
		const member = raw.rules['member'] as { members: { type: string }[] };
		expect(member.members.map((entry) => entry.type)).toEqual(['SYMBOL', 'STRING', 'ALIAS']);
		const kinds = predictKindCatalog({ rules: raw.rules, externals: [], extras: [], supertypes: [], inline: [], word: 'identifier' } as never);
		expect(kinds.entries.map((entry) => entry.symbolName)).toContain('property_identifier');
	});
});
