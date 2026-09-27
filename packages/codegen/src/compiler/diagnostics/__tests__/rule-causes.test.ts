import { describe, expect, it } from 'vitest';
import { blockedRecords } from '../grammar-diagnostics.ts';
import { diagnoseRuleCauses } from '../rule-causes.ts';
import type { StageDiagnosis } from '../../stage.ts';
import type { GrammarDiagnostic } from '../../../types/diagnostics.ts';
import type { RuleCauseDeclaration } from '../../../dsl/primitives/rule-cause.ts';

function enriched(partial: Partial<StageDiagnosis>): StageDiagnosis {
	return { ruleNames: new Set(), externalNames: new Set(), diagnostics: [], ...partial };
}
function fired(code: string, ownerKind: string, canProceed = true): GrammarDiagnostic {
	return { scope: 'grammar', grammar: 'synth', code, severity: canProceed ? 'warning' : 'error', ownerKind, message: '', canProceed };
}
function diagnose(input: {
	ruleCauses?: Record<string, RuleCauseDeclaration>;
	undeclaredRules?: readonly string[];
	renderAs?: readonly string[];
	enriched: StageDiagnosis;
}): GrammarDiagnostic[] {
	return diagnoseRuleCauses({
		grammar: 'synth',
		raw: {
			ruleCauses: input.ruleCauses,
			undeclaredRules: input.undeclaredRules,
			renderAs: input.renderAs === undefined ? undefined : Object.fromEntries(input.renderAs.map((n) => [n, { type: 'BLANK' } as never]))
		},
		enriched: input.enriched
	});
}
const codesOf = (ds: readonly GrammarDiagnostic[]) => ds.map((d) => `${d.code}:${d.ownerKind}`).sort();

describe('diagnoseRuleCauses', () => {
	it('a reauthored rule provoked by a code of its cause class is silent, whether or not that code blocks yet', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'alias-shape' } },
			enriched: enriched({ ruleNames: new Set(['a']), diagnostics: [fired('unclassifiable-shape', 'a')] })
		});
		expect(ds).toEqual([]);
	});

	it('a reauthored rule with no provocation is rule-reauthored-without-cause, blocking', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			enriched: enriched({ ruleNames: new Set(['a']), diagnostics: [fired('content-collision', 'a', false)] })
		});
		expect(codesOf(ds)).toEqual(['rule-reauthored-without-cause:a']);
		expect(ds[0]!.canProceed).toBe(false);
	});

	it('rule-reauthored-without-cause is accepted at the gate when the owner is floor-listed for that code', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			enriched: enriched({ ruleNames: new Set(['a']) })
		});
		expect(ds).toEqual([expect.objectContaining({ code: 'rule-reauthored-without-cause', canProceed: false })]);
		expect(blockedRecords(ds, { 'rule-reauthored-without-cause': ['a'] })).toEqual([]);
	});

	it('a provoked rule whose declared cause does not match the provoking code is rule-cause-mismatch', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			enriched: enriched({ ruleNames: new Set(['a']), diagnostics: [fired('unclassifiable-shape', 'a')] })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:a']);
	});

	it('a reauthored declaration on a name upstream does not declare is rule-cause-mismatch', () => {
		const ds = diagnose({
			ruleCauses: { brand_new: { kind: 'reauthored', cause: 'ambiguity' } },
			enriched: enriched({ ruleNames: new Set(['a']) })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:brand_new']);
	});

	it('vocabulary must not shadow an upstream rule', () => {
		const ds = diagnose({
			ruleCauses: { string: { kind: 'vocabulary' }, _helper: { kind: 'vocabulary' } },
			enriched: enriched({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(ds)).toEqual(['vocabulary-replaces-upstream:string']);
	});

	it('renderAs keys must name upstream externals, as the externals list spells them', () => {
		const ok = diagnose({ renderAs: ['_template_chars'], enriched: enriched({ externalNames: new Set(['_template_chars']) }) });
		expect(ok).toEqual([]);
		const bad = diagnose({
			renderAs: ['_marker'],
			enriched: enriched({ ruleNames: new Set(['_marker']), externalNames: new Set(['_template_chars']) })
		});
		expect(codesOf(bad)).toEqual(['render-only-not-external:_marker']);
		expect(bad[0]!.canProceed).toBe(false);
	});

	it('every bare body is rule-cause-missing, blocking, and names both declarations', () => {
		const ds = diagnose({ undeclaredRules: ['string', 'helper'], enriched: enriched({ ruleNames: new Set(['string']) }) });
		expect(codesOf(ds)).toEqual(['rule-cause-missing:helper', 'rule-cause-missing:string']);
		expect(ds.every((d) => d.canProceed === false)).toBe(true);
		expect(ds.find((d) => d.ownerKind === 'string')!.message).toMatch(/reauthored\(cause, body\)/);
		expect(ds.find((d) => d.ownerKind === 'helper')!.message).toMatch(/vocabulary\(body\)/);
	});
});
