import { beforeAll, describe, expect, it } from 'vitest';
import type { DerivationRecords } from '../../dsl/wire/derivation-records.ts';
import { grammarPackage } from '../../grammars.ts';
import { dynamicPrecedenceRecords } from '../diagnostics/dynamic-precedence.ts';
import { unexpectableExpectEntries } from '../diagnostics/grammar-diagnostics.ts';
import { evaluate } from '../evaluate.ts';
import { packageEntryPath } from '../resolve-grammar.ts';
import type { RawGrammar } from '../types.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

type Fixture = Pick<RawGrammar, 'name' | 'derivationRecords' | 'ruleCauses' | 'undeclaredRules'>;

function fixture(
	records: Pick<DerivationRecords, 'upstreamDynamicPrecedence' | 'dynamicPrecedence'> & Partial<DerivationRecords>,
	undeclaredRules: readonly string[] = []
): Fixture {
	return {
		name: 'g',
		undeclaredRules,
		derivationRecords: { upstreamConflicts: [], sourceEdges: {}, resolutions: [], conflictsAuthored: false, ...records }
	};
}

describe('dynamicPrecedenceRecords', () => {
	it('blocks when reshaping drops an upstream rule’s dynamic precedence', () => {
		const records = dynamicPrecedenceRecords(fixture({ upstreamDynamicPrecedence: { a: [-1] }, dynamicPrecedence: {} }));
		expect(records).toMatchObject([
			{
				code: 'conflict-dynamic-precedence-lost',
				severity: 'fail',
				canProceed: false,
				ownerKind: 'a',
				details: { rule: 'a', upstream: [-1], landed: [] }
			}
		]);
	});

	it('passes when the value lands on a rule reshaped from the upstream one, wherever the wrapper sits', () => {
		const records = dynamicPrecedenceRecords(
			fixture({ upstreamDynamicPrecedence: { a: [-1, 1] }, dynamicPrecedence: { a: [1], a_plain: [-1] }, sourceEdges: { a_plain: 'a' } })
		);
		expect(records).toEqual([]);
	});

	it('blocks when only part of the upstream values landed', () => {
		const records = dynamicPrecedenceRecords(fixture({ upstreamDynamicPrecedence: { a: [-1, -1] }, dynamicPrecedence: { a: [-1] } }));
		expect(records.map((record) => record.code)).toEqual(['conflict-dynamic-precedence-lost']);
	});

	it('says nothing about a value reshaping added', () => {
		expect(dynamicPrecedenceRecords(fixture({ upstreamDynamicPrecedence: {}, dynamicPrecedence: { b: [2] } }))).toEqual([]);
	});

	it('records an authored rule’s difference, lost or added, as information only', () => {
		const records = dynamicPrecedenceRecords(
			fixture({ upstreamDynamicPrecedence: { a: [1] }, dynamicPrecedence: { a: [2], b: [-1] } }, ['a', 'b'])
		);
		expect(records).toMatchObject([
			{ code: 'conflict-dynamic-precedence-authored', severity: 'info', canProceed: true, details: { rule: 'a', upstream: [1], landed: [2] } },
			{ code: 'conflict-dynamic-precedence-authored', severity: 'info', canProceed: true, details: { rule: 'b', upstream: [], landed: [-1] } }
		]);
	});

	it('the lost code cannot be expected away', () => {
		expect(unexpectableExpectEntries('g', { 'conflict-dynamic-precedence-lost': ['a'] })).toHaveLength(1);
	});
});

describe('python dynamic precedence', () => {
	let python: RawGrammar;
	beforeAll(async () => {
		python = await evaluate(packageEntryPath(grammarPackage('python')), NO_FILE_TYPES);
	});

	it('loses nothing upstream declared, and records the authored primary_expression addition', () => {
		expect(python.derivationRecords?.upstreamDynamicPrecedence).toEqual({ print_statement: [-1], type_alias_statement: [1], with_item: [1] });
		expect(dynamicPrecedenceRecords(python)).toMatchObject([
			{ code: 'conflict-dynamic-precedence-authored', details: { rule: 'primary_expression', upstream: [], landed: [-1] } }
		]);
	});

	it('blocks once a carried value goes missing', () => {
		const records = python.derivationRecords!;
		const { with_item: _dropped, ...dynamicPrecedence } = records.dynamicPrecedence;
		const lost = dynamicPrecedenceRecords({ ...python, derivationRecords: { ...records, dynamicPrecedence } });
		expect(lost.filter((record) => record.code === 'conflict-dynamic-precedence-lost').map((record) => record.ownerKind)).toEqual(['with_item']);
	});
});
