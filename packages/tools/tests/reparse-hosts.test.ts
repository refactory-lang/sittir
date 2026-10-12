import { describe, expect, it } from 'vitest';
import { assertReparseHostKeys } from '../../codegen/src/dsl/wire/reparse-hosts.ts';

const kinds = new Set(['expression', '_simple_statement', 'function_definition', 'lhs_expression']);

describe('a reparse host key must name a kind of the grammar', () => {
	it('accepts keys that are kinds, hidden supertypes included', () => {
		expect(() =>
			assertReparseHostKeys('g', { hosts: { expression: '$r', _simple_statement: '$r' }, priority: ['expression'], gated: ['function_definition'] }, kinds)
		).not.toThrow();
	});

	it('throws naming a misspelled host key', () => {
		expect(() => assertReparseHostKeys('python', { hosts: { simple_statement: '$r' } }, kinds)).toThrow(
			'python: reparseHosts names hosts.simple_statement, which is not a kind of the grammar'
		);
	});

	it('names every unknown key in hosts, priority and gated', () => {
		expect(() =>
			assertReparseHostKeys('g', { hosts: { nope: '$r' }, priority: ['expression', 'also_nope'], gated: ['gated_nope'] }, kinds)
		).toThrow('hosts.nope, priority.also_nope, gated.gated_nope');
	});

	it('has nothing to check without a reparseHosts block', () => {
		expect(() => assertReparseHostKeys('g', undefined, kinds)).not.toThrow();
	});
});
