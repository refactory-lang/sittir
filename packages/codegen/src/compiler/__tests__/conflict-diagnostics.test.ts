import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import type { ConflictReport } from '../../transpile/conflict-summary.ts';
import { grammarPackage } from '../../grammars.ts';
import { diagnoseGrammar } from '../compile.ts';
import { conflictRecords, conflictStaleRecord, conflictUnresolvableRecord } from '../diagnostics/conflicts.ts';
import { blockedRecords, unexpectableExpectEntries } from '../diagnostics/grammar-diagnostics.ts';
import { evaluate } from '../evaluate.ts';
import { packageEntryPath } from '../resolve-grammar.ts';
import type { RawGrammar } from '../types.ts';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';

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
		python = await evaluate(packageEntryPath(grammarPackage('python')));
	});

	it('records one informational conflict-resolution per derived resolution, with its step and conflict', () => {
		const resolutions = conflictRecords(python).filter((record) => record.code === 'conflict-resolution');
		expect(resolutions).toHaveLength(11);
		for (const record of resolutions) {
			expect(record).toMatchObject({ severity: 'info', canProceed: true });
			expect(Object.keys(record.details ?? {}).sort()).toEqual(['conflict', 'resolution', 'sourceChains', 'step']);
		}
	});

	it('names the one upstream conflict set that no derived resolution needs', () => {
		const unnecessary = conflictRecords(python).filter((record) => record.code === 'conflict-unnecessary-upstream');
		expect(unnecessary.map((record) => record.details?.symbols)).toEqual([['print_statement', 'primary_expression']]);
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

describe('derivation failures', () => {
	it('an unresolvable derivation is a blocking conflict-unresolvable with its reason and report', () => {
		const record = conflictUnresolvableRecord('g', 'no-usable-offer', report);
		expect(record).toMatchObject({ code: 'conflict-unresolvable', severity: 'fail', details: { reason: 'no-usable-offer', report } });
		expect(blockedRecords([record], { 'conflict-unresolvable': ['g'] })).toEqual([record]);
	});

	it('stale saved resolutions are a blocking conflict-resolutions-stale with the report', () => {
		const record = conflictStaleRecord('g', report);
		expect(record).toMatchObject({ code: 'conflict-resolutions-stale', severity: 'fail', details: { report } });
		expect(blockedRecords([record], undefined)).toEqual([record]);
	});

	it.each(['conflict-authored', 'conflict-unresolvable', 'conflict-resolutions-stale'])('%s cannot be expected away', (code) => {
		expect(unexpectableExpectEntries('g', { [code]: ['g'] }).map((record) => record.details?.code)).toEqual([code]);
	});
});
