import { describe, expect, it } from 'vitest';
import { diagnoseRuleCauses } from '../rule-causes.ts';
import type { UpstreamCompilation } from '../../upstream.ts';
import type { GrammarDiagnostic } from '../../../types/diagnostics.ts';
import type { RuleCauseDeclaration } from '../../../dsl/primitives/rule-cause.ts';

function upstream(partial: Partial<UpstreamCompilation>): UpstreamCompilation {
	return { ruleNames: new Set(), externalNames: new Set(), diagnostics: [], ...partial };
}
function fired(code: string, ownerKind: string, canProceed = true): GrammarDiagnostic {
	return { scope: 'grammar', grammar: 'synth', code, severity: canProceed ? 'warning' : 'error', ownerKind, message: '', canProceed };
}
function diagnose(input: {
	ruleCauses?: Record<string, RuleCauseDeclaration>;
	undeclaredRules?: readonly string[];
	renderAs?: readonly string[];
	expectDiagnostics?: Record<string, readonly string[]>;
	upstream: UpstreamCompilation;
}): GrammarDiagnostic[] {
	return diagnoseRuleCauses({
		grammar: 'synth',
		raw: {
			ruleCauses: input.ruleCauses,
			undeclaredRules: input.undeclaredRules,
			renderAs: input.renderAs === undefined ? undefined : Object.fromEntries(input.renderAs.map((n) => [n, { type: 'BLANK' } as never])),
			expectDiagnostics: input.expectDiagnostics
		},
		upstream: input.upstream
	});
}
const codesOf = (ds: readonly GrammarDiagnostic[]) => ds.map((d) => `${d.code}:${d.ownerKind}`).sort();

describe('diagnoseRuleCauses', () => {
	it('a reauthored rule provoked by a code of its cause class is silent, whether or not that code blocks yet', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'alias-shape' } },
			upstream: upstream({ ruleNames: new Set(['a']), diagnostics: [fired('unclassifiable-shape', 'a')] })
		});
		expect(ds).toEqual([]);
	});

	it('a reauthored rule with no provocation is rule-reauthored-without-cause, blocking', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			upstream: upstream({ ruleNames: new Set(['a']), diagnostics: [fired('content-collision', 'a', false)] })
		});
		expect(codesOf(ds)).toEqual(['rule-reauthored-without-cause:a']);
		expect(ds[0]!.canProceed).toBe(false);
	});

	it('rule-reauthored-without-cause is accepted when the owner is floor-listed for that code', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			expectDiagnostics: { 'rule-reauthored-without-cause': ['a'] },
			upstream: upstream({ ruleNames: new Set(['a']) })
		});
		expect(ds).toEqual([expect.objectContaining({ code: 'rule-reauthored-without-cause', canProceed: true })]);
	});

	it('a provoked rule whose declared cause does not match the provoking code is rule-cause-mismatch', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			upstream: upstream({ ruleNames: new Set(['a']), diagnostics: [fired('unclassifiable-shape', 'a')] })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:a']);
	});

	it('a reauthored declaration on a name upstream does not declare is rule-cause-mismatch', () => {
		const ds = diagnose({
			ruleCauses: { brand_new: { kind: 'reauthored', cause: 'ambiguity' } },
			upstream: upstream({ ruleNames: new Set(['a']) })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:brand_new']);
	});

	it('vocabulary must not shadow an upstream rule', () => {
		const ds = diagnose({
			ruleCauses: { string: { kind: 'vocabulary' }, _helper: { kind: 'vocabulary' } },
			upstream: upstream({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(ds)).toEqual(['vocabulary-replaces-upstream:string']);
	});

	it('renderAs keys must name upstream externals, as the externals list spells them', () => {
		const ok = diagnose({ renderAs: ['_template_chars'], upstream: upstream({ externalNames: new Set(['_template_chars']) }) });
		expect(ok).toEqual([]);
		const bad = diagnose({
			renderAs: ['_marker'],
			upstream: upstream({ ruleNames: new Set(['_marker']), externalNames: new Set(['_template_chars']) })
		});
		expect(codesOf(bad)).toEqual(['render-only-not-external:_marker']);
		expect(bad[0]!.canProceed).toBe(false);
	});

	it('every bare body is rule-cause-missing, blocking, and names both declarations', () => {
		const ds = diagnose({ undeclaredRules: ['string', 'helper'], upstream: upstream({ ruleNames: new Set(['string']) }) });
		expect(codesOf(ds)).toEqual(['rule-cause-missing:helper', 'rule-cause-missing:string']);
		expect(ds.every((d) => d.canProceed === false)).toBe(true);
		expect(ds.find((d) => d.ownerKind === 'string')!.message).toMatch(/reauthored\(cause, body\)/);
		expect(ds.find((d) => d.ownerKind === 'helper')!.message).toMatch(/vocabulary\(body\)/);
	});

	it('an upstream failure yields one warning and no judgement that needs the upstream', () => {
		const ds = diagnose({
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			undeclaredRules: ['b'],
			renderAs: ['_x'],
			upstream: upstream({ failure: 'boom' })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-missing:b', 'upstream-compile-failed:undefined']);
		expect(ds.find((d) => d.code === 'upstream-compile-failed')!.canProceed).toBe(true);
	});
});
