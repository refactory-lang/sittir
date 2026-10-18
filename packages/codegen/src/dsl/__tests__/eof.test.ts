import { describe, expect, it } from 'vitest';
import { withDslGlobals } from '../../compiler/evaluate.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { evaluateRecords } from '../../compiler/diagnostics/grammar-diagnostics.ts';

describe('eof() is a DSL global', () => {
	it('builds the EOF node tree-sitter DSL builds', async () => {
		await withDslGlobals(async () => {
			const eof = (globalThis as { eof?: () => unknown }).eof;
			expect(eof?.()).toEqual({ type: 'EOF' });
		});
	});
});

describe('a production ending in eof() keeps EOF as its last member', () => {
	it('evaluates seq($.word, eof()) with EOF after the word', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: "k: ($) => seq($.word, eof())" }, '', { bindings: '' });
		const members = (raw.rules.k as { members: unknown[] }).members;
		expect(members).toHaveLength(2);
		expect(members[1]).toMatchObject({ type: 'EOF' });
	}, 60_000);
});

describe('token() over eof() is refused at evaluate', () => {
	it('refuses token(eof()) as eof-in-token, naming the rule', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: 'k: ($) => token(eof())' }, '', { bindings: '' });
		expect(evaluateRecords(raw)).toContainEqual(
			expect.objectContaining({ code: 'eof-in-token', severity: 'fail', canProceed: false, ownerKind: 'k' })
		);
	}, 60_000);

	it('refuses token.immediate over a seq ending in eof() as eof-in-token, naming the rule', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: "k: ($) => token.immediate(seq('a', eof()))" }, '', { bindings: '' });
		expect(evaluateRecords(raw)).toContainEqual(
			expect.objectContaining({ code: 'eof-in-token', severity: 'fail', canProceed: false, ownerKind: 'k' })
		);
	}, 60_000);
});

describe('eof() may only end a production', () => {
	const records = async (rules: string) => evaluateRecords(await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' }));

	it.each([
		["seq('a', eof(), 'b')", "source: ($) => optional($.r), r: ($) => seq('a', eof(), 'b')"],
		["seq(choice(eof(), 'x'), 'b')", "source: ($) => optional($.r), r: ($) => seq(choice(eof(), 'x'), 'b')"]
	])('refuses %s as eof-not-last within its rule, naming the rule', async (_rule, rules) => {
		expect(await records(rules)).toContainEqual(expect.objectContaining({ code: 'eof-not-last', severity: 'fail', canProceed: false, ownerKind: 'r' }));
	}, 60_000);

	it('(a) refuses a repeated rule that ends input, naming the start rule and the ending rule', async () => {
		expect(await records("source: ($) => repeat($.r), r: ($) => seq('a', eof())")).toContainEqual(
			expect.objectContaining({
				code: 'eof-not-last',
				severity: 'fail',
				canProceed: false,
				ownerKind: 'source',
				details: expect.objectContaining({ kind: 'source', ending: 'r', repetition: false }),
				message: expect.stringContaining("'r' always ends input")
			})
		);
	}, 60_000);

	it('(b) refuses a repeat1 of a rule that ends input, naming the rule that repeats it', async () => {
		expect(await records("source: ($) => optional($.r), r: ($) => repeat1(seq('a', eof()))")).toContainEqual(
			expect.objectContaining({ code: 'eof-not-last', ownerKind: 'r', details: expect.objectContaining({ repetition: true }) })
		);
	}, 60_000);

	it('(c) refuses a sequence whose later member follows an eof() rule, naming the rule that holds the sequence', async () => {
		expect(await records("source: ($) => optional($.root), e: ($) => eof(), root: ($) => seq($.e, 'x')")).toContainEqual(
			expect.objectContaining({ code: 'eof-not-last', ownerKind: 'root', details: expect.objectContaining({ ending: 'e' }) })
		);
	}, 60_000);

	it.each([
		"source: ($) => optional($.r), r: ($) => seq('a', eof())",
		'source: ($) => optional($.r), r: ($) => seq(eof())',
			String.raw`source: ($) => repeat($.stmt), stmt: ($) => seq('a', choice('\n', eof()))`,
		"source: ($) => optional($.root), e: ($) => choice(eof(), 'y'), root: ($) => seq($.e, 'x')"
	])('accepts %s, which ends its production', async (rules) => {
		expect((await records(rules)).filter((record) => record.code === 'eof-not-last')).toEqual([]);
	}, 60_000);
});
