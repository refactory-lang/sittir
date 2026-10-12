import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import type { ConflictReport } from '../../transpile/conflict-summary.ts';
import { grammarPackage } from '../../grammars.ts';
import { diagnoseGrammar } from '../compile.ts';
import { conflictRecords, conflictStaleRecord, conflictUnresolvableRecord } from '../diagnostics/conflicts.ts';
import { blockedRecords, unexpectableExpectEntries } from '../diagnostics/grammar-diagnostics.ts';
import type { RawGrammar } from '../types.ts';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';
import { evaluatePackage } from '../evaluate-package.ts';

const require = createRequire(import.meta.url);

const report: ConflictReport = {
	symbol_sequence: ['expression'],
	conflicting_lookahead: "';'",
	possible_interpretations: [],
	possible_resolutions: [{ Precedence: { symbols: ['x'] } }]
};

function codesOf(grammar: RawGrammar): string[] {
	return conflictRecords(grammar).map((record) => record.code);
}

describe('python conflict records', () => {
	let python: RawGrammar;
	beforeAll(async () => {
		python = await evaluatePackage(grammarPackage('python'));
	});

	it('records one informational conflict-resolution per derived resolution, with its step and conflict', () => {
		const resolutions = conflictRecords(python).filter((record) => record.code === 'conflict-resolution');
		expect(resolutions).toHaveLength(11);
		for (const record of resolutions) {
			expect(record).toMatchObject({ severity: 'info', canProceed: true });
			expect(Object.keys(record.details ?? {}).sort()).toEqual(['conflict', 'resolution', 'sourceChains', 'step']);
		}
	});

	it('names the upstream conflict sets that no derived resolution needs', () => {
		const unnecessary = conflictRecords(python).filter((record) => record.code === 'conflict-unnecessary-upstream');
		expect(unnecessary.map((record) => record.details?.symbols).sort()).toEqual([
			['print_statement', 'primary_expression'],
			['with_item', '_collection_elements']
		]);
		expect(unnecessary[0]).toMatchObject({ severity: 'info', canProceed: true });
	});
});

describe('conflicts authored in a sittir grammar', () => {
	const go = require.resolve('tree-sitter-go/grammar.js');

	it('block the grammar with conflict-authored', async () => {
		const authored = await evaluateSittirGrammar(go, 'go', 'conflicts: ($) => [[$.call_expression]],');
		expect(codesOf(authored)).toContain('conflict-authored');
		const diagnosis = diagnoseGrammar({ grammar: 'go', evaluated: authored });
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked.map((record) => record.code)).toEqual(['conflict-authored']);
	});

	it('are absent from a grammar that leaves conflicts to the derivation', async () => {
		expect(codesOf(await evaluateSittirGrammar(go, 'go'))).not.toContain('conflict-authored');
	});

	it('reach the collected diagnostics through diagnoseGrammar', async () => {
		const resolutions: ConflictResolutionsFile = {
			...EMPTY_CONFLICT_RESOLUTIONS,
			grammarHash: 'fixture',
			resolutions: [
				{
					resolution: { kind: 'AddConflict', symbols: ['call_expression', 'binary_expression'] },
					step: 'default',
					sourceChains: [['call_expression'], ['binary_expression']],
					conflict: { symbolSequence: [], lookahead: '', interpretations: ['call_expression', 'binary_expression'] }
				}
			]
		};
		const diagnosis = diagnoseGrammar({ grammar: 'go', evaluated: await evaluateSittirGrammar(go, 'go', '', resolutions) });
		expect(diagnosis.grammarDiagnostics.filter((record) => record.code === 'conflict-resolution')).toHaveLength(1);
	});
});

describe('bound conflict records', () => {
	const entry = (symbols: string[], sourceChains: string[][] = symbols.map((name) => [name])) => ({
		resolution: { kind: 'AddConflict', symbols },
		step: 'default',
		sourceChains,
		conflict: { symbolSequence: [], lookahead: '', interpretations: symbols }
	});
	const fixture = (boundResolutions: ReturnType<typeof entry>[]): Pick<RawGrammar, 'name' | 'derivationRecords' | 'renamedFrom'> => ({
		name: 'g',
		renamedFrom: { binding: 'let_item' },
		derivationRecords: {
			upstreamConflicts: [['parameter', 'identifier']],
			sourceEdges: {},
			resolutions: [entry(['let_item', 'call'])],
			boundResolutions,
			conflictsAuthored: false,
			upstreamDynamicPrecedence: {},
			dynamicPrecedence: {}
		}
	});

	it('records one conflict-resolution per bound set, beside the base ones', () => {
		const records = conflictRecords(fixture([entry(['this_parameter', 'identifier'])])).filter((record) => record.code === 'conflict-resolution');
		expect(records.map((record) => record.details?.resolution)).toEqual([
			{ kind: 'AddConflict', symbols: ['let_item', 'call'] },
			{ kind: 'AddConflict', symbols: ['this_parameter', 'identifier'] }
		]);
	});

	it('counts a bound set whose chain reaches an upstream set as needing it', () => {
		const records = conflictRecords(fixture([entry(['this_parameter', 'identifier'], [['this_parameter', 'parameter'], ['identifier']])]));
		expect(records.map((record) => record.code)).not.toContain('conflict-unnecessary-upstream');
	});

	it('names a bound set that a base set, renamed, already declares', () => {
		const records = conflictRecords(fixture([entry(['call', 'binding']), entry(['this_parameter', 'identifier'])]));
		const unnecessary = records.filter((record) => record.code === 'conflict-unnecessary-bound');
		expect(unnecessary.map((record) => record.details?.symbols)).toEqual([['call', 'binding']]);
		expect(unnecessary[0]).toMatchObject({ severity: 'info', canProceed: true });
	});
});

describe('derivation failures', () => {
	it('an unresolvable derivation is a blocking conflict-unresolvable with its reason and report', () => {
		const record = conflictUnresolvableRecord('g', 'no-usable-offer', report);
		expect(record).toMatchObject({ code: 'conflict-unresolvable', severity: 'fail', details: { reason: 'no-usable-offer', report } });
		expect(blockedRecords([record], { 'conflict-unresolvable': ['g'] })).toEqual([record]);
	});

	it('stale saved resolutions are a blocking conflict-resolutions-stale with the report', () => {
		const record = conflictStaleRecord('g', { kind: 'conflict', report });
		expect(record).toMatchObject({ code: 'conflict-resolutions-stale', severity: 'fail', details: { report } });
		expect(blockedRecords([record], undefined)).toEqual([record]);
	});

	it('stale saved resolutions that fail to build carry the error summary', () => {
		const summary = { UndefinedSymbol: 'bogus' };
		const record = conflictStaleRecord('g', { kind: 'error', summary });
		expect(record).toMatchObject({ code: 'conflict-resolutions-stale', canProceed: false, details: { summary } });
	});

	it.each(['conflict-authored', 'conflict-unresolvable', 'conflict-resolutions-stale'])('%s cannot be expected away', (code) => {
		expect(unexpectableExpectEntries('g', { [code]: ['g'] }).map((record) => record.details?.code)).toEqual([code]);
	});
});
