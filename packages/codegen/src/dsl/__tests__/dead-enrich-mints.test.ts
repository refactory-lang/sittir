import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { evaluateDsl } from '../../compiler/evaluate.ts';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import { grammarPackage, topLayerPath } from '../../grammars.ts';
import { isBlank } from '../rule-patterns.ts';

const UNREACHED = { extras: '', rules: "holder: $ => $.pair, pair: $ => choice(seq('a', $.word), seq('b', $.word, $.word))" };

describe('the enrich mints a layer leaves unreachable', () => {
	it('are blank where enrich put them, named in orphanedSyntheticGroups, and dropped from inline', async () => {
		const raw = await evaluateTempGrammar(UNREACHED, 'inline: ($) => [$.pair_arm]');
		expect(raw.orphanedSyntheticGroups).toEqual(['pair_arm']);
		expect(isBlank(raw.rules.pair_arm)).toBe(true);
		expect(Object.keys(raw.rules).indexOf('pair_arm')).toBe(Object.keys(raw.rules).indexOf('pair') + 1);
		expect(raw.inline).not.toContain('pair_arm');
	}, 120_000);

	it('keep a mint the layer renders', async () => {
		const raw = await evaluateTempGrammar(UNREACHED, 'renderAs: (_$) => ({ pair_arm: /x/ })');
		expect(raw.orphanedSyntheticGroups).toBeUndefined();
		expect(isBlank(raw.rules.pair_arm)).toBe(false);
	}, 120_000);

	it('stay blank in the layer above', async () => {
		const raw = await evaluateTempGrammar(UNREACHED, '', { bindings: '' });
		expect(raw.orphanedSyntheticGroups).toEqual(['pair_arm']);
		expect(isBlank(raw.rules.pair_arm)).toBe(true);
	}, 120_000);
});

describe('dead enrich mints in the in-repo grammars', () => {
	for (const name of ['python', 'rust', 'typescript', 'scm', 'regex']) {
		it(`${name}: every dead mint is blank and named by no list`, async () => {
			const evaluated = await evaluateDsl(topLayerPath(grammarPackage(name)));
			for (const dead of evaluated.orphanedSyntheticGroups ?? []) {
				expect(isBlank(evaluated.rules[dead]), dead).toBe(true);
				expect(evaluated.inline).not.toContain(dead);
				expect(evaluated.supertypes).not.toContain(dead);
				expect(evaluated.conflicts.flat()).not.toContain(dead);
			}
		}, 120_000);

		it(`${name}: every arm label names a rule the final grammar keeps`, async () => {
			const final = await evaluatePackage(grammarPackage(name));
			const owners = new Set<string>();
			const collect = (node: unknown): void => {
				if (Array.isArray(node)) return node.forEach(collect);
				if (node === null || typeof node !== 'object') return;
				const owner = (node as { annotations?: { variantOf?: unknown } }).annotations?.variantOf;
				if (typeof owner === 'string') owners.add(owner);
				Object.values(node).forEach(collect);
			};
			collect(Object.values(final.rules));
			expect([...owners].filter((owner) => !(owner in final.rules))).toEqual([]);
		}, 120_000);
	}
});
