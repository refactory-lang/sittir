import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { evaluateSittirGrammar } from '../../__tests__/helpers/sittir-grammar.ts';
import { baseRulesOf } from '../shared.ts';
import { getEnrichMints } from '../enrich.ts';
import { evaluatePackage } from '../evaluate-package.ts';

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
	try {
		await load();
	} finally {
		expect(enrichCalls.length).toBeGreaterThan(0);
		for (const { base, enriched } of enrichCalls.splice(0)) {
			const prior = getEnrichMints(base);
			expect([...getEnrichMints(enriched)].sort()).toEqual(
				[...new Set([...prior, ...addedRuleNames(base, enriched)])].sort()
			);
			if (prior.size > 0) expect(baseRulesOf(enriched)).toEqual(baseRulesOf(base));
		}
	}
}

describe('the enrich mint list retains prior mints and records every new rule', () => {
	for (const grammar of ['python', 'rust', 'typescript', 'scm', 'regex']) {
		it(`${grammar}`, () => expectEveryAddedRuleRecorded(() => evaluatePackage(grammarPackage(grammar))), 120_000);
	}
	for (const grammar of ['c', 'go']) {
		it(
			`tree-sitter-${grammar}`,
			() =>
				expectEveryAddedRuleRecorded(() =>
					evaluateSittirGrammar(require.resolve(`tree-sitter-${grammar}/grammar.js`), grammar)
				),
			120_000
		);
	}
});
