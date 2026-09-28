import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DerivedResolution } from '../../dsl/conflict-resolutions.ts';
import { parseGenerateOutcome, type GenerateOutcome } from '../conflict-summary.ts';
import { deriveConflictResolutions, reuseOrDeriveConflictResolutions } from '../derive-conflicts.ts';
import { runTreeSitterCliCapturing } from '../tree-sitter-cli.ts';

const GRAMMAR = `module.exports = grammar({
	name: 'fixture',
	conflicts: ($) => require('./conflicts.json').map((set) => set.map((name) => $[name])),
	rules: {
		source: ($) => repeat($._expr),
		_expr: ($) => choice($.binary, $.num),
		binary: ($) => seq($._expr, '+', $._expr),
		num: () => /\\d+/
	}
});
`;

describe('deriving conflicts against the tree-sitter CLI', () => {
	let dir: string;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'sittir-conflict-fixture-'));
		writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'tree-sitter-fixture', type: 'commonjs' }));
		writeFileSync(join(dir, 'grammar.js'), GRAMMAR);
	});
	afterEach(() => rmSync(dir, { recursive: true, force: true }));

	it('converges on an ambiguous binary rule by declaring its conflict', async () => {
		const result = await deriveConflictResolutions({
			ruleCount: 4,
			upstream: { upstreamConflicts: [], sourceEdges: {} },
			generate: async (resolutions) => {
				writeFileSync(join(dir, 'conflicts.json'), JSON.stringify(resolutions.map((entry) => entry.resolution.symbols)));
				const run = runTreeSitterCliCapturing(['generate', '--json-summary'], dir);
				return parseGenerateOutcome(run.status, run.stderr);
			}
		});
		expect(result).toMatchObject({ kind: 'converged', iterations: 2 });
		expect(result.resolutions.map((entry) => [entry.step, entry.resolution.symbols])).toEqual([['default', ['binary']]]);
	});

	it('records the conflict as upstream-declared when upstream listed the same set', async () => {
		const result = await deriveConflictResolutions({
			ruleCount: 4,
			upstream: { upstreamConflicts: [['binary']], sourceEdges: {} },
			generate: async (resolutions) => {
				writeFileSync(join(dir, 'conflicts.json'), JSON.stringify(resolutions.map((entry) => entry.resolution.symbols)));
				const run = runTreeSitterCliCapturing(['generate', '--json-summary'], dir);
				return parseGenerateOutcome(run.status, run.stderr);
			}
		});
		expect(result.resolutions.map((entry) => entry.step)).toEqual(['upstream-declared']);
	});

	it('reports a saved set naming an undefined rule as stale, with the CLI error', async () => {
		const bogus: DerivedResolution = {
			resolution: { kind: 'AddConflict', symbols: ['bogus'] },
			step: 'default',
			sourceChains: [['bogus']],
			conflict: { symbolSequence: [], lookahead: '', interpretations: ['bogus'] }
		};
		const result = await reuseOrDeriveConflictResolutions({
			saved: { grammarHash: 'h', resolutions: [bogus] },
			grammarHash: 'h',
			ruleCount: 4,
			upstream: { upstreamConflicts: [], sourceEdges: {} },
			generate: async (resolutions): Promise<GenerateOutcome> => {
				writeFileSync(join(dir, 'conflicts.json'), JSON.stringify(resolutions.map((entry) => entry.resolution.symbols)));
				const run = runTreeSitterCliCapturing(['generate', '--json-summary'], dir);
				return parseGenerateOutcome(run.status, run.stderr);
			}
		});
		expect(result).toMatchObject({ kind: 'stale', outcome: { kind: 'error' } });
	});
});
