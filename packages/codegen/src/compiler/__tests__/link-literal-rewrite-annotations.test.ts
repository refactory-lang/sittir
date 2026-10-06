import { CHOICE, FIELD, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { canonicalizeRuleLiterals } from '../link.ts';
import type { Rule } from '../../types/rule.ts';

describe('canonicalizeRuleLiterals — a literal rewritten into its kind symbol', () => {
	it('keeps the arm annotations on the symbol', () => {
		const rule: Rule<'link'> = { type: STRING, value: ';', annotations: { default: true } };
		const entries = [{ kind: 'semi', id: 7, anon: true, symbolName: ';', literalText: ';' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, true, misses);
		expect(out).toMatchObject({ type: SYMBOL, name: 'semi', literal: ';', annotations: { default: true } });
	});

	it('adds no annotations key when the literal had none', () => {
		const rule: Rule<'link'> = { type: STRING, value: ';' };
		const entries = [{ kind: 'semi', id: 7, anon: true, symbolName: ';', literalText: ';' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, true, misses) as { annotations?: unknown };
		expect(out.annotations).toBeUndefined();
	});

	it('leaves a literal inside a token as text, even under a field', () => {
		const rule: Rule<'link'> = {
			type: TOKEN,
			content: {
				type: SEQ,
				members: [
					{ type: STRING, value: '\\' },
					{ type: FIELD, name: 'content', content: { type: CHOICE, members: [{ type: STRING, value: 'n' }, { type: STRING, value: '"' }] } }
				]
			}
		} as Rule<'link'>;
		const entries = [{ kind: 'dquote', id: 70, anon: true, symbolName: '"', literalText: '"' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, false, misses);
		expect(out).toEqual({
			type: TOKEN,
			content: {
				type: SEQ,
				members: [
					{ type: STRING, value: '\\' },
					{ type: FIELD, name: 'content', content: { type: CHOICE, members: [{ type: STRING, value: 'n' }, { type: STRING, value: '"', resolvedKindId: 70 }] } }
				]
			}
		});
	});

	it('still rewrites a field holding a whole token', () => {
		const rule: Rule<'link'> = { type: FIELD, name: 'terminator', content: { type: TOKEN, content: { type: STRING, value: ';' } } } as Rule<'link'>;
		const entries = [{ kind: 'semi', id: 7, anon: true, symbolName: ';', literalText: ';' }];
		const misses = { symbols: new Set<string>(), literals: new Set<string>(), aliasTargets: new Set<string>() };
		const out = canonicalizeRuleLiterals(rule, entries, false, misses);
		expect(out).toMatchObject({ type: FIELD, content: { type: TOKEN, content: { type: SYMBOL, name: 'semi', literal: ';' } } });
	});
});
