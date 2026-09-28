import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import { ENRICH_RULE_ORIGINS_KEY, type GrammarResult } from '../enrich.ts';
import type { EnrichRuleOrigin } from '../enrich-ctx.ts';
import { blankDeadEnrichMints, DEAD_ENRICH_MINTS_KEY, getDeadEnrichMints } from '../wire/dead-mints.ts';
import { isBlank } from '../rule-patterns.ts';
import type { WiredOpts } from '../wire/wire.ts';
import { grammarPackage } from '../../grammars.ts';
import { packageEntryPath } from '../../compiler/resolve-grammar.ts';
import { evaluateDsl } from '../../compiler/evaluate.ts';

const symbol = (name: string): Rule => ({ type: SYMBOL, name }) as Rule;
const literal = (value: string): Rule => ({ type: STRING, value }) as Rule;

function enrichedWithMints(names: readonly string[]): unknown {
	const origins = new Map<string, EnrichRuleOrigin>(names.map((name) => [name, { kind: 'visible-group' }]));
	return Object.defineProperty({}, ENRICH_RULE_ORIGINS_KEY, { value: origins, enumerable: false });
}

function sampleGrammar(): GrammarResult['grammar'] {
	return {
		name: 'sample',
		rules: {
			source_file: { type: SEQ, members: [symbol('a'), symbol('live_arm')] } as Rule,
			a: literal('a'),
			live_arm: literal('live'),
			dead_arm: { type: SEQ, members: [symbol('_dead_helper')] } as Rule,
			_dead_helper: literal('helper'),
			word_mint: { type: PATTERN, value: '[a-z]+' } as Rule,
			ext_mint: literal('ext'),
			super_mint: literal('super')
		},
		extras: [{ type: PATTERN, value: '\\s' }],
		externals: [symbol('ext_mint')],
		supertypes: ['super_mint'],
		word: 'word_mint',
		inline: ['dead_arm', 'a'],
		conflicts: [['source_file', 'dead_arm'], ['a']]
	};
}

describe('blankDeadEnrichMints', () => {
	let savedBlank: unknown;
	beforeAll(() => {
		savedBlank = (globalThis as Record<string, unknown>).blank;
		(globalThis as Record<string, unknown>).blank = () => ({ type: 'BLANK' });
	});
	afterAll(() => {
		if (savedBlank === undefined) delete (globalThis as Record<string, unknown>).blank;
		else (globalThis as Record<string, unknown>).blank = savedBlank;
	});

	it('blanks the unreachable mints and drops them from inline and conflicts, keeping the rule order', () => {
		const grammar = sampleGrammar();
		const deadBody = grammar.rules['dead_arm'];
		const order = Object.keys(grammar.rules);
		blankDeadEnrichMints(grammar, enrichedWithMints(['live_arm', 'dead_arm', 'word_mint', 'ext_mint', 'super_mint']), { name: 'sample', rules: {} });
		expect([...getDeadEnrichMints(grammar)]).toEqual(['dead_arm']);
		expect(grammar.rules['dead_arm']).toEqual({ type: 'BLANK' });
		expect(deadBody).toEqual({ type: SEQ, members: [symbol('_dead_helper')] });
		expect(grammar.rules['_dead_helper']).toEqual(literal('helper'));
		expect(Object.keys(grammar.rules)).toEqual(order);
		expect(grammar.inline).toEqual(['a']);
		expect(grammar.conflicts).toEqual([['a']]);
		expect(grammar.supertypes).toEqual(['super_mint']);
	});

	it('keeps a mint that wire protects', () => {
		const grammar = sampleGrammar();
		const opts = { name: 'sample', rules: {}, __wireContext__: { deposits: new Map([['dead_arm', literal('deposit')]]) } } as unknown as WiredOpts;
		blankDeadEnrichMints(grammar, enrichedWithMints(['dead_arm']), opts);
		expect(getDeadEnrichMints(grammar).size).toBe(0);
		expect(grammar.rules['dead_arm']).toEqual({ type: SEQ, members: [symbol('_dead_helper')] });
	});

	it('keeps the dead set out of the serialized grammar', () => {
		const grammar = sampleGrammar();
		blankDeadEnrichMints(grammar, enrichedWithMints(['dead_arm']), { name: 'sample', rules: {} });
		expect(getDeadEnrichMints(grammar).size).toBe(1);
		expect(JSON.stringify({ ...grammar })).not.toContain(DEAD_ENRICH_MINTS_KEY);
	});
});

describe('dead enrich mints in the in-repo grammars', () => {
	for (const name of ['python', 'rust', 'typescript', 'scm', 'regex']) {
		it(`${name}: every dead mint is blank and named by no list; grammar.json carries no dead-set key`, async () => {
			const pkg = grammarPackage(name);
			const evaluated = await evaluateDsl(packageEntryPath(pkg));
			for (const dead of evaluated.orphanedSyntheticGroups ?? []) {
				expect(isBlank(evaluated.rules[dead]), dead).toBe(true);
				expect(evaluated.inline).not.toContain(dead);
				expect(evaluated.supertypes).not.toContain(dead);
				expect(evaluated.conflicts.flat()).not.toContain(dead);
			}
			expect(readFileSync(join(pkg.dir, '.sittir', 'src', 'grammar.json'), 'utf8')).not.toContain(DEAD_ENRICH_MINTS_KEY);
		}, 120_000);
	}
});
