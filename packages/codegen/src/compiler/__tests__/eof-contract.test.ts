import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { evaluateRecords } from '../diagnostics/grammar-diagnostics.ts';

async function eofRecords(rules: string, extras = '') {
	const raw = await evaluateTempGrammar({ extras, rules }, '');
	return evaluateRecords(raw).filter((record) => record.code === 'eof-not-last' || record.code === 'eof-in-token');
}

function refusedOn(ownerKind: string) {
	return expect.objectContaining({ code: 'eof-not-last', ownerKind, details: expect.objectContaining({ kind: ownerKind, start: 'source' }) });
}

describe('eof() is legal only as the last step of the start rule', () => {
	it('accepts eof() last in the start rule', async () => {
		expect(await eofRecords("source: ($) => seq($.x, eof()), x: () => 'a'")).toEqual([]);
	}, 60_000);

	it('accepts eof() last in one alternative of the start rule', async () => {
		expect(await eofRecords("source: ($) => choice(seq($.x, eof()), $.y), x: () => 'a', y: () => 'b'")).toEqual([]);
	}, 60_000);

	it('accepts eof() written in each arm of a choice that enrich hoists into a minted rule', async () => {
		expect(await eofRecords("source: ($) => choice(seq($.x, eof()), seq('b', eof())), x: () => 'a'")).toEqual([]);
	}, 60_000);

	it('accepts a start rule that is just eof()', async () => {
		expect(await eofRecords('source: ($) => eof()')).toEqual([]);
	}, 60_000);

	it('refuses eof() in another rule, even one used last in the start rule', async () => {
		const records = await eofRecords("source: ($) => seq('a', $.r), r: ($) => choice('b', eof())");
		expect(records).toEqual([refusedOn('r')]);
	}, 60_000);

	it('refuses eof() in another rule that is followed by more content in the start rule', async () => {
		const records = await eofRecords("source: ($) => seq($.r, 'z'), r: ($) => seq('a', eof())");
		expect(records).toEqual([refusedOn('r')]);
	}, 60_000);

	it('refuses the terminator pattern, on the terminator rule', async () => {
		const records = await eofRecords(
			"source: ($) => repeat($.statement), statement: ($) => seq($.x, $._terminator), _terminator: ($) => choice(';', '\\n', eof()), x: () => 'a'"
		);
		expect(records).toEqual([refusedOn('_terminator')]);
	}, 60_000);

	it('refuses eof() inside a repetition in the start rule, on the start rule', async () => {
		const records = await eofRecords("source: ($) => repeat(choice($.x, eof())), x: () => 'a'");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);

	it('refuses eof() mid-production in the start rule, on the start rule', async () => {
		const records = await eofRecords("source: ($) => seq('a', eof(), 'z')");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);

	it('refuses eof() in an extra, on the extra', async () => {
		const records = await eofRecords("note: ($) => choice('#', eof())", '$.note');
		expect(records).toEqual([refusedOn('note')]);
	}, 60_000);

	it('gives one record per rule, however many refused eof() calls it holds', async () => {
		const records = await eofRecords("source: ($) => seq($.r, 'z'), r: ($) => choice(seq($.x, eof()), seq('b', eof())), x: () => 'a'");
		expect(records).toEqual([refusedOn('r')]);
	}, 60_000);
});

describe('eof-in-token', () => {
	it('refuses an eof() inside a token in a rule the start rule uses, on that rule and not a minted rule', async () => {
		const records = await eofRecords("source: ($) => seq('a', $.r), r: ($) => choice(seq($.x, token(seq('c', eof()))), 'b'), x: () => 'd'");
		expect(records).toEqual([expect.objectContaining({ code: 'eof-in-token', ownerKind: 'r' })]);
	}, 60_000);

	it('refuses eof() inside a token on the token rule, and no eof-not-last', async () => {
		const records = await eofRecords("source: ($) => seq('a', $.t), t: ($) => token(seq('a', eof())), x: () => 'b'");
		expect(records).toEqual([expect.objectContaining({ code: 'eof-in-token', ownerKind: 't' })]);
	}, 60_000);
});

describe('neither eof code can be expected', () => {
	async function invalidExpectations(rules: string, config: string) {
		const raw = await evaluateTempGrammar({ extras: '', rules }, config);
		return evaluateRecords(raw).filter((record) => record.code === 'expect-diagnostics-invalid');
	}

	it('blocks an expectDiagnostics entry that names eof-not-last', async () => {
		const records = await invalidExpectations(
			"source: ($) => seq(choice($.x, eof()), 'z'), x: () => 'a'",
			"expectDiagnostics: { 'eof-not-last': ['source'] }"
		);
		expect(records).toEqual([
			expect.objectContaining({ code: 'expect-diagnostics-invalid', severity: 'error', canProceed: false, details: { code: 'eof-not-last' } })
		]);
	}, 60_000);

	it('blocks an expectDiagnostics entry that names eof-in-token', async () => {
		const records = await invalidExpectations(
			"source: ($) => seq('a', $.t), t: ($) => token(seq('a', eof())), x: () => 'b'",
			"expectDiagnostics: { 'eof-in-token': ['t'] }"
		);
		expect(records).toEqual([
			expect.objectContaining({ code: 'expect-diagnostics-invalid', severity: 'error', canProceed: false, details: { code: 'eof-in-token' } })
		]);
	}, 60_000);
});

describe('a blank after eof() adds no step', () => {
	it('accepts a field-wrapped blank after eof() as no step', async () => {
		expect(await eofRecords("source: ($) => seq('x', eof(), field('empty', blank()))")).toEqual([]);
	}, 60_000);

	it('accepts an optional blank after eof() as no step', async () => {
		expect(await eofRecords("source: ($) => seq('x', eof(), optional(blank()))")).toEqual([]);
	}, 60_000);

	it('refuses an optional step after eof(), so the blank cases are not vacuous', async () => {
		const records = await eofRecords("source: ($) => seq('x', eof(), optional('y'))");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);
});

describe('one record per rule, with the eof flags in details', () => {
	it('gives one eof-in-token record on the start rule, flagged inToken and notLast', async () => {
		const records = await eofRecords("source: ($) => choice(seq('x', eof(), 'z'), token(seq('a', eof())))");
		expect(records).toEqual([
			expect.objectContaining({
				code: 'eof-in-token',
				ownerKind: 'source',
				details: expect.objectContaining({ inToken: true, notLast: true })
			})
		]);
	}, 60_000);
});

describe('a refusal inside a mint an authored layer references names the mint', () => {
	it('names source_arm when the layer repeats the enrich-minted arm rule', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '', rules: "source: ($) => choice(seq($.x, eof()), seq('b', eof())), x: () => 'a'" },
			'rules: { source: ($) => repeat($.source_arm) }'
		);
		const records = evaluateRecords(raw).filter((record) => record.code === 'eof-not-last');
		expect(records).toEqual([refusedOn('source_arm')]);
	}, 60_000);
});

describe('a repetition after eof() is a step, even when its body is blank', () => {
	it('refuses repeat1(blank()) after eof(), on the start rule', async () => {
		const records = await eofRecords("source: ($) => seq('x', eof(), repeat1(blank()))");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);

	it('refuses repeat(blank()) after eof(), on the start rule', async () => {
		const records = await eofRecords("source: ($) => seq('x', eof(), repeat(blank()))");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);

	it('refuses a wrapped repeat1(blank()) after eof(), on the start rule', async () => {
		const records = await eofRecords("source: ($) => seq('x', eof(), field('f', repeat1(blank())))");
		expect(records).toEqual([refusedOn('source')]);
	}, 60_000);
});

