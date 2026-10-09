import { describe, expect, it } from 'vitest';
import { blankBucketOf, computeRunCensus, rolesOfBindings, supertypeOfKinds } from '../src/validate/gap-runs.ts';

describe('blankBucketOf', () => {
	it('counts the blank lines a gap holds, with a bucket for gaps on one line', () => {
		expect(blankBucketOf(' ')).toBe('same-line');
		expect(blankBucketOf('\n  ')).toBe('0');
		expect(blankBucketOf('\r\n\r\n')).toBe('1');
		expect(blankBucketOf('\n\n\n')).toBe('2');
		expect(blankBucketOf('\n\n\n\n\n')).toBe('3+');
	});
});

describe('rolesOfBindings', () => {
	it('takes the first segment of a single-node pattern capture and ignores the rest', () => {
		const roles = rolesOfBindings('(source_file) @module\n(function_item) @declaration.function\n(function_item (parameters)) @declaration.method\n(use_declaration) @statement.import\n');
		expect([...roles]).toEqual([
			['source_file', 'module'],
			['function_item', 'declaration'],
			['use_declaration', 'statement']
		]);
	});
});

describe('supertypeOfKinds', () => {
	it('gives a kind its narrowest supertype', () => {
		const owner = supertypeOfKinds({ _statement: ['a', 'b', 'c'], _declaration: ['a', 'b'] });
		expect(owner.get('a')).toBe('_declaration');
		expect(owner.get('c')).toBe('_statement');
	});
});

describe('computeRunCensus', () => {
	it('separates a gap inside a run of one kind from a gap at a run boundary', async () => {
		const census = await computeRunCensus('rust', [
			{ name: 'probe', source: 'use a;\nuse b;\n\nfn f() {}\n\nfn g() {}\n' }
		]);
		const list = census.lists.find((entry) => entry.list === 'source_file')!;
		expect(list.pairs).toBe(3);
		expect(list.overall.kind.within).toMatchObject({ '0': 1, '1': 1 });
		expect(list.overall.kind.boundary).toMatchObject({ '1': 1 });
		const useDeclaration = list.byGroup.kind['use_declaration']!;
		expect(useDeclaration.within['0']).toBe(1);
		expect(useDeclaration.after['1']).toBe(1);
		expect(list.byGroup.kind['function_item']!.before['1']).toBe(1);
	}, 120_000);
});
