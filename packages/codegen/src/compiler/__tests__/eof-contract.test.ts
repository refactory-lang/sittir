import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { evaluateRecords } from '../diagnostics/grammar-diagnostics.ts';

const EOF_CODES = new Set(['eof-not-last', 'eof-in-token']);

async function eofRecords(rules: string, extras = '', externals?: string) {
	const raw = await evaluateTempGrammar({ extras, rules, externals }, '');
	return evaluateRecords(raw).filter((record) => EOF_CODES.has(record.code));
}

function refusedAt(ownerKind: string, details: Record<string, unknown>) {
	return expect.objectContaining({ code: 'eof-not-last', ownerKind, details: expect.objectContaining(details) });
}

describe('eof() refusals', () => {
	it('refuses an inline eof() with something after it in its production', async () => {
		const records = await eofRecords("source: ($) => seq(choice($.x, eof()), 'z'), x: () => 'a'");
		expect(records).toEqual([refusedAt('source', { kind: 'source', reason: 'after-eof' })]);
	}, 60_000);

	it('refuses an eof() ending a rule that is never followed by end of input, when the rule is used before more content', async () => {
		const records = await eofRecords("source: ($) => seq($.r, 'z'), r: ($) => choice($.x, eof()), x: () => 'a'");
		expect(records).toEqual([refusedAt('r', { kind: 'r', reason: 'never-at-end' })]);
	}, 60_000);

	it('refuses the eof() of a rule nested under a rule that is never followed by end of input', async () => {
		const records = await eofRecords(
			"source: ($) => seq($.r, 'z'), r: ($) => choice($.x, seq('a', $.s)), s: ($) => choice('b', eof()), x: () => 'c'"
		);
		expect(records).toEqual([refusedAt('s', { kind: 's', reason: 'never-at-end' })]);
	}, 60_000);

	it('refuses a repeated choice whose eof() is never followed by end of input, on the repeat helper owner', async () => {
		const records = await eofRecords("source: ($) => seq(repeat(choice($.x, eof())), 'z'), x: () => 'a'");
		expect(records).toEqual([refusedAt('source', { kind: 'source', reason: 'never-at-end' })]);
	}, 60_000);

	it('refuses an eof() ending a repetition item that always ends the input, as a repetition that can never repeat', async () => {
		const records = await eofRecords("source: ($) => seq(repeat(seq($.x, eof())), 'z'), x: () => 'a'");
		expect(records).toEqual([refusedAt('source', { kind: 'source', reason: 'repetition' })]);
	}, 60_000);

	it('refuses a rule that always ends the input when something follows it, naming that rule', async () => {
		const records = await eofRecords("source: ($) => seq($.r, 'z'), r: ($) => seq($.x, eof()), x: () => 'a'");
		expect(records).toEqual([refusedAt('source', { kind: 'source', reason: 'after-ending', ending: 'r' })]);
	}, 60_000);

	it('refuses an eof() inside a token', async () => {
		const records = await eofRecords("source: ($) => seq('a', $.t), t: ($) => token(seq('a', eof())), x: () => 'b'");
		expect(records).toEqual([expect.objectContaining({ code: 'eof-in-token', ownerKind: 't' })]);
	}, 60_000);
});

describe('eof() with an external token after it', () => {
	it('refuses the same rule when the step after it is a literal, so the external is what lets the rule pass', async () => {
		const records = await eofRecords("source: ($) => seq($.r, 'z'), r: ($) => choice($.x, eof()), x: () => 'a'", '', '$._dedent');
		expect(records).toEqual([refusedAt('r', { kind: 'r', reason: 'never-at-end' })]);
	}, 60_000);
});

describe('eof() that can match is legal', () => {
	it('accepts a repeated choice that ends the repetition', async () => {
		expect(await eofRecords("source: ($) => repeat(choice($.x, eof())), x: () => 'a'")).toEqual([]);
	}, 60_000);

	it('accepts the terminator pattern, which may end the input or be followed by the next statement', async () => {
		expect(
			await eofRecords(
				"source: ($) => repeat($.statement), statement: ($) => seq($.x, $._terminator), _terminator: ($) => choice(';', '\\n', eof()), x: () => 'a'"
			)
		).toEqual([]);
	}, 60_000);

	it('accepts an extra whose eof() ends it, since the extras are followed by end of input', async () => {
		expect(await eofRecords("note: ($) => choice('#', eof())", '$.note')).toEqual([]);
	}, 60_000);

	it('accepts a referenced choice ending with eof() when an external token follows it, since an external consumes nothing', async () => {
		expect(await eofRecords("source: ($) => seq($.r, $._dedent), r: ($) => choice($.x, eof()), x: () => 'a'", '', '$._dedent')).toEqual([]);
	}, 60_000);

	it('accepts a referenced choice ending with eof() when the rule is followed by end of input', async () => {
		expect(await eofRecords("source: ($) => seq($.r, eof()), r: ($) => choice($.x, eof()), x: () => 'a'")).toEqual([]);
	}, 60_000);
});
