import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { wire } from '../wire/wire.ts';
import { field } from '../primitives/field.ts';
import { evaluateWired, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { baseOf } from '../../__tests__/helpers/empty-base.ts';

const RULES = "src: ($) => seq('(', $.word, ')'), owner: ($) => seq('a', $.word), other: ($) => seq('b', $.word)";

type Rules = Record<string, unknown>;

const run = (bindings: string, rules = RULES) => evaluateTempGrammar({ extras: '', rules }, '', { bindings });

// The rule name a `field('k', ...)` site in `rule` references.
const siteName = (rules: Rules, rule: string): string => {
	const seq = rules[rule] as { members: { type: string; name: string; content: { name: string } }[] };
	const field = seq.members.find((m) => m.type === 'FIELD' && m.name === 'k');
	return field!.content.name;
};

describe('a field text mints a hidden keyword rule; the rule name follows how many texts the field minted', () => {
	it('a: one text under a field takes the bare name, shared by every site', async () => {
		const raw = await run("rules: { k1: ($) => seq(field('k', 'get'), $.word), k2: ($) => seq(field('k', 'get'), $.word) }");
		const rules = raw.rules as Rules;
		expect(siteName(rules, 'k1')).toBe('_kw_k');
		expect(siteName(rules, 'k2')).toBe('_kw_k');
		expect(rules._kw_k).toMatchObject({ type: 'STRING', value: 'get' });
	}, 60_000);

	it('b: two texts under a field spell both names, with no bare rule, independent of key order', async () => {
		const forward = (await run("rules: { k1: ($) => seq(field('k', 'get'), $.word), k2: ($) => seq(field('k', 'set'), $.word) }")).rules as Rules;
		const reversed = (await run("rules: { k2: ($) => seq(field('k', 'set'), $.word), k1: ($) => seq(field('k', 'get'), $.word) }")).rules as Rules;
		for (const rules of [forward, reversed]) {
			expect(rules).not.toHaveProperty('_kw_k');
			expect(siteName(rules, 'k1')).toBe('_kw_k_get');
			expect(siteName(rules, 'k2')).toBe('_kw_k_set');
			expect(rules._kw_k_get).toMatchObject({ type: 'STRING', value: 'get' });
			expect(rules._kw_k_set).toMatchObject({ type: 'STRING', value: 'set' });
		}
	}, 60_000);

	it('c: punctuation is spelled out in the name when the field minted more than one text', async () => {
		const raw = await run("rules: { k1: ($) => seq(field('k', '*'), $.word), k2: ($) => seq(field('k', 'get'), $.word) }");
		const rules = raw.rules as Rules;
		expect(siteName(rules, 'k1')).toBe('_kw_k_star');
		expect(siteName(rules, 'k2')).toBe('_kw_k_get');
		expect(rules._kw_k_star).toMatchObject({ type: 'STRING', value: '*' });
	}, 60_000);

	it('e: a layer text does not take a base keyword rule that already holds a body; it spells its own name', async () => {
		const raw = await run("rules: { k1: ($) => seq(field('k', 'y'), $.word) }", "src: ($) => seq('(', $.word, ')'), owner: ($) => seq($._kw_k, $.word), _kw_k: ($) => 'x'");
		const rules = raw.rules as Rules;
		expect(siteName(rules, 'k1')).toBe('_kw_k_y');
		expect(rules._kw_k).toMatchObject({ type: 'STRING', value: 'x' });
	}, 60_000);

	it('e: a blank base keyword rule is free, so one layer text takes the bare name', async () => {
		const raw = await run("rules: { k1: ($) => seq(field('k', 'get'), $.word) }", `${RULES}, _kw_k: ($) => blank()`);
		const rules = raw.rules as Rules;
		expect(siteName(rules, 'k1')).toBe('_kw_k');
		expect(rules._kw_k).toMatchObject({ type: 'STRING', value: 'get' });
	}, 60_000);

	it('f: two texts whose spellings collide throw, naming the rule that already holds another body', async () => {
		await expect(
			run("rules: { k1: ($) => seq(field('k', '-x'), $.word), k2: ($) => seq(field('k', 'dashx'), $.word) }")
		).rejects.toThrow(/already holds another body/);
	}, 60_000);
});

describe('a one-argument field in an edits entry over a STRING inside prec keeps the PREC on its rule', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('d: the keyword body is the bare STRING, and the parent rule keeps its PREC around the site', () => {
		const base = { r: { type: 'PREC', value: 2, content: { type: 'STRING', value: 'async' } } };
		const wired = wire({ name: 'test', edits: { r: { '.': field('k') } } } as never, baseOf(base as never));
		const out = evaluateWired(wired) as Record<string, unknown>;
		expect(out._kw_k).toEqual({ type: 'STRING', value: 'async' });
		expect(out.r).toEqual({ type: 'PREC', value: 2, content: { type: 'FIELD', name: 'k', content: { type: 'SYMBOL', name: '_kw_k' }, metadata: { fieldSource: 'override' } } });
	});
});
