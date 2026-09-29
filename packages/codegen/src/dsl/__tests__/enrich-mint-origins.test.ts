import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { packageEntryPath } from '../../compiler/resolve-grammar.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';
import { baseRulesOf } from '../shared.ts';
import { getEnrichMints } from '../enrich.ts';
import { NO_FILE_TYPES } from '../../compiler/upstream-file-types.ts';

const enrichCalls = vi.hoisted(() => [] as { readonly base: unknown; readonly enriched: unknown }[]);

vi.mock('../enrich.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../enrich.ts')>();
	return {
		...actual,
		enrich: (...args: Parameters<typeof actual.enrich>) => {
			const enriched = actual.enrich(...args);
			enrichCalls.push({ base: args[0], enriched });
			return enriched;
		}
	};
});

const require = createRequire(import.meta.url);

function addedRuleNames(base: unknown, enriched: unknown): string[] {
	const baseNames = new Set(Object.keys(baseRulesOf(base) ?? {}));
	return Object.keys(baseRulesOf(enriched) ?? {})
		.filter((name) => !baseNames.has(name))
		.sort();
}

async function expectEveryAddedRuleRecorded(load: () => Promise<unknown>): Promise<void> {
	enrichCalls.length = 0;
	await load();
	expect(enrichCalls.length).toBeGreaterThan(0);
	for (const { base, enriched } of enrichCalls.splice(0)) {
		expect([...getEnrichMints(enriched)].sort()).toEqual(addedRuleNames(base, enriched));
	}
}

describe('the enrich mint list is exactly the rules enrich adds', () => {
	for (const grammar of ['python', 'rust', 'typescript', 'scm', 'regex']) {
		it(`${grammar}`, () => expectEveryAddedRuleRecorded(() => evaluate(packageEntryPath(grammarPackage(grammar)), NO_FILE_TYPES)), 120_000);
	}
	for (const grammar of ['c', 'go']) {
		it(`tree-sitter-${grammar}`, () =>
			expectEveryAddedRuleRecorded(() => evaluateSittirGrammar(require.resolve(`tree-sitter-${grammar}/grammar.js`), grammar)), 120_000);
	}
});
