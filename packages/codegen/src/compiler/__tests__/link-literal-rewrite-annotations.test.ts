import { STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { canonicalizeRuleLiterals } from '../link.ts';
import type { Rule } from '../../types/rule.ts';

describe('canonicalizeRuleLiterals — a literal rewritten into its kind symbol', () => {
	it('keeps the arm annotations on the symbol', () => {
		const rule: Rule<'link'> = { type: STRING, value: ';', annotations: { default: true } };
		const entries = [{ kind: 'semi', id: 7, anon: true, symbolName: ';' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, true, misses);
		expect(out).toMatchObject({ type: SYMBOL, name: 'semi', literal: ';', annotations: { default: true } });
	});

	it('adds no annotations key when the literal had none', () => {
		const rule: Rule<'link'> = { type: STRING, value: ';' };
		const entries = [{ kind: 'semi', id: 7, anon: true, symbolName: ';' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, true, misses) as { annotations?: unknown };
		expect(out.annotations).toBeUndefined();
	});
});
