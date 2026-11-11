import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';

const REWRITTEN = 'regex-pattern-rewritten';
const RULES = "k: ($) => seq('x', $.y), y: () => /a+b/";

describe('a regex() edit', () => {
	it('warns, and still writes its pattern into the grammar, when it changes more than the groups', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: "edits: { y: { '.': regex(/a*b/) } }" });
		expect(raw.layerDiagnostics ?? []).toContainEqual(
			expect.objectContaining({ code: REWRITTEN, severity: 'warning', canProceed: true, ownerKind: 'y', details: { kind: 'y', path: '.', was: 'a+b', now: 'a*b' } })
		);
		expect(raw.rules.y).toMatchObject({ type: 'PATTERN', value: 'a*b' });
	}, 60_000);

	it('does not warn when it only names a group in the pattern it replaces', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: RULES }, '', { bindings: "edits: { y: { '.': regex(/(?<run>a+)b/) } }" });
		expect(raw.layerDiagnostics ?? []).not.toContainEqual(expect.objectContaining({ code: REWRITTEN }));
		expect(raw.rules.y).toMatchObject({ type: 'PATTERN', value: '(?<run>a+)b' });
	}, 60_000);

	it.each([
		['typescript', [{ kind: 'comment', path: '1/0/1' }]],
		['rust', []]
	] as const)("warns on %s's edits that rewrite a pattern and on none that only name its groups", async (grammar, expected) => {
		const raw = await evaluatePackage(grammarPackage(grammar));
		const warned = (raw.layerDiagnostics ?? []).filter((d) => d.code === REWRITTEN).map((d) => ({ kind: d.ownerKind, path: (d.details as { path: string }).path }));
		expect(warned).toEqual(expected);
	}, 120_000);
});
