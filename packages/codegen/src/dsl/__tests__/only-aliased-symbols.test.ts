import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isComplexBody, onlyAliasedSymbols } from '../rule-patterns.ts';

const symbol = (name: string) => ({ type: 'SYMBOL', name });
const alias = (name: string, value: string, named = true) => ({ type: 'ALIAS', content: symbol(name), named, value });

describe('onlyAliasedSymbols', () => {
	it('names a symbol referenced only under a named alias', () => {
		expect([...onlyAliasedSymbols([{ type: 'SEQ', members: [alias('_list', 'list'), symbol('other')] }])]).toEqual(['_list']);
	});

	it('drops a symbol that is also referenced by name anywhere', () => {
		const bodies = [alias('_list', 'list'), { type: 'CHOICE', members: [symbol('_list'), symbol('x')] }];
		expect(onlyAliasedSymbols(bodies).size).toBe(0);
	});

	it('does not count an anonymous alias, and looks through fields', () => {
		expect(onlyAliasedSymbols([alias('_a', 'a', false)]).size).toBe(0);
		expect([...onlyAliasedSymbols([{ type: 'FIELD', name: 'f', content: alias('_b', 'b') }])]).toEqual(['_b']);
	});
});

describe('isComplexBody', () => {
	it('is true for sequences and choices of two or more, and repeats of compound content', () => {
		expect(isComplexBody({ type: 'SEQ', members: [symbol('a'), symbol('b')] })).toBe(true);
		expect(isComplexBody({ type: 'SEQ', members: [symbol('a')] })).toBe(false);
		expect(isComplexBody({ type: 'REPEAT1', content: symbol('a') })).toBe(false);
		expect(isComplexBody({ type: 'REPEAT1', content: { type: 'SEQ', members: [symbol('a'), symbol('b')] } })).toBe(true);
	});
});

describe('python print lists', () => {
	it('keep the alias-only hidden rule out of the fold', () => {
		const grammar = JSON.parse(readFileSync(new URL('../../../../python/.sittir/src/grammar.json', import.meta.url), 'utf8')) as { rules: Record<string, unknown> };
		expect(JSON.stringify(grammar.rules['expression_list'])).not.toContain('_print_chevron_arguments');
		const parser = readFileSync(new URL('../../../../python/.sittir/src/parser.c', import.meta.url), 'utf8');
		expect(parser).not.toContain('alias_sym_print_chevron_arguments');
	});
});
