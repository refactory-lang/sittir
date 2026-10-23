import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { applyBoundConflictResolutions, applyConflictResolutions, EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../conflict-resolutions.ts';
import { evaluateSittirGrammar } from '../../__tests__/helpers/sittir-grammar.ts';

const require = createRequire(import.meta.url);

const entriesFor = (sets: string[][]): ConflictResolutionsFile['resolutions'] =>
	sets.map((symbols) => ({
		resolution: { kind: 'AddConflict', symbols },
		step: 'default',
		sourceChains: symbols.map((name) => [name]),
		conflict: { symbolSequence: [], lookahead: '', interpretations: symbols }
	}));

function resolutionsFor(...sets: string[][]): ConflictResolutionsFile {
	return { ...EMPTY_CONFLICT_RESOLUTIONS, grammarHash: 'fixture', resolutions: entriesFor(sets) };
}

describe('applyConflictResolutions', () => {
	it('replaces whatever conflicts the grammar carried with the resolution sets', () => {
		const grammar: Record<string, unknown> = { conflicts: [['x', 'y']] };
		applyConflictResolutions(grammar, resolutionsFor(['a', 'b'], ['c']));
		expect(grammar.conflicts).toEqual([['a', 'b'], ['c']]);
	});

	it('leaves no conflicts for an empty resolution set', () => {
		const grammar: Record<string, unknown> = { conflicts: [['x', 'y']] };
		applyConflictResolutions(grammar, EMPTY_CONFLICT_RESOLUTIONS);
		expect(grammar.conflicts).toEqual([]);
	});
});

describe('applyBoundConflictResolutions', () => {
	it('appends the bound sets after the sets the grammar carries', () => {
		const grammar: Record<string, unknown> = { conflicts: [['a', 'b']] };
		applyBoundConflictResolutions(grammar, { ...resolutionsFor(['x']), bound: { ...EMPTY_CONFLICT_RESOLUTIONS.bound, resolutions: entriesFor([['c', 'd']]) } });
		expect(grammar.conflicts).toEqual([['a', 'b'], ['c', 'd']]);
	});
});

describe('the evaluated grammar carries exactly the imported resolutions', () => {
	const go = require.resolve('tree-sitter-go/grammar.js');

	it("drops upstream's declared conflicts when no resolution names them", async () => {
		const raw = await evaluateSittirGrammar(go, 'go');
		expect(raw.conflicts).toEqual([]);
	});

	it('carries the resolution sets the grammar imports', async () => {
		const raw = await evaluateSittirGrammar(go, 'go', '', resolutionsFor(['call_expression', 'binary_expression']));
		expect(raw.conflicts).toEqual([['call_expression', 'binary_expression']]);
	});
});
