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
