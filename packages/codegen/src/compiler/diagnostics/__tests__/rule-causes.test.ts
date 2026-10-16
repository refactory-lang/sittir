import { describe, expect, it } from 'vitest';
import { blockedRecords } from '../grammar-diagnostics.ts';
import { diagnoseRuleCauses, isWitnessVerified } from '../rule-causes.ts';
import type { StageDiagnosis } from '../../stage.ts';
import type { GrammarDiagnostic } from '../../../types/diagnostics.ts';
import type { RuleCauseDeclaration } from '../../../dsl/primitives/rule-cause.ts';

function enriched(partial: Partial<StageDiagnosis>): StageDiagnosis {
	return { ruleNames: new Set(), externalNames: new Set(), diagnostics: [], ...partial };
}
function fired(code: string, ownerKind: string, canProceed = true): GrammarDiagnostic {
	return {
		scope: 'grammar',
		grammar: 'synth',
		code,
		severity: canProceed ? 'warning' : 'error',
		ownerKind,
		message: '',
		canProceed
	};
}
function diagnose(input: {
	ruleCauses?: Record<string, RuleCauseDeclaration>;
	undeclaredRules?: readonly string[];
	renderAs?: readonly string[];
	enriched: StageDiagnosis;
	upstreamRules?: Record<string, unknown>;
	authoredRules?: Record<string, unknown>;
}): GrammarDiagnostic[] {
	return diagnoseRuleCauses({
		grammar: 'synth',
		raw: {
			ruleCauses: input.ruleCauses,
			undeclaredRules: input.undeclaredRules,
			renderAs:
				input.renderAs === undefined
					? undefined
					: Object.fromEntries(input.renderAs.map((n) => [n, { type: 'BLANK' } as never]))
		},
		enriched: input.enriched,
		upstreamRules: input.upstreamRules as never,
		authoredRules: input.authoredRules as never
	});
}
const codesOf = (ds: readonly GrammarDiagnostic[]) => ds.map((d) => `${d.code}:${d.ownerKind}`).sort();

describe('semantic-gap reauthoring witnesses', () => {
	const upstreamRules = {
		tuple: {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: '(' },
				{ type: 'SYMBOL', name: 'pattern' },
				{ type: 'STRING', value: ')' }
			]
		}
	};
	const witness = {
		text: '(x)',
		form: ['(', { symbol: 'pattern' }, ')'],
		kind: 'tuple',
		meaning: 'Binds the entire value.'
	};
	const check = (evidence: typeof witness | undefined) =>
		diagnose({
			ruleCauses: {
				tuple: { kind: 'reauthored', cause: 'semantic-gap', witnesses: evidence === undefined ? undefined : [evidence] }
			},
			enriched: enriched({ ruleNames: new Set(['tuple']) }),
			upstreamRules
		});

	it('allows a form with different language semantics within the same parser kind', () => {
		expect(check(witness)).toEqual([]);
	});
	it('rejects an absent witness', () => {
		expect(codesOf(check(undefined))).toEqual(['rule-cause-mismatch:tuple']);
	});
	it('rejects a form the upstream rule does not derive', () => {
		expect(codesOf(check({ ...witness, form: ['[', { symbol: 'pattern' }, ']'] }))).toEqual([
			'rule-cause-mismatch:tuple'
		]);
	});
	it('rejects a missing meaning or another parser kind', () => {
		expect(codesOf(check({ ...witness, meaning: '' }))).toEqual(['rule-cause-mismatch:tuple']);
		expect(codesOf(check({ ...witness, kind: 'other' }))).toEqual(['rule-cause-mismatch:tuple']);
	});
});

describe('a witnessed cause given an empty witness array', () => {
	const upstreamRules = { tuple: { type: 'SEQ', members: [{ type: 'STRING', value: '(' }, { type: 'STRING', value: ')' }] } };
	it.each(['accepts-other-kind', 'semantic-gap', 'rejects-valid-syntax', 'accepts-invalid-syntax'] as const)(
		'%s is a mismatch',
		(cause) => {
			const ds = diagnose({
				ruleCauses: { tuple: { kind: 'reauthored', cause, witnesses: [] as never } },
				enriched: enriched({ ruleNames: new Set(['tuple']) }),
				upstreamRules,
				authoredRules: upstreamRules
			});
			expect(codesOf(ds)).toEqual(['rule-cause-mismatch:tuple']);
			expect(ds[0]!.message).toContain('declares no witness');
		}
	);
});

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

	it('a reauthored declaration with a cause that is not one is rule-cause-mismatch naming the valid causes', () => {
		for (const diagnostics of [[fired('unclassifiable-shape', 'a')], []]) {
			const ds = diagnose({
				ruleCauses: { a: { kind: 'reauthored', cause: 'bogus' } as never },
				enriched: enriched({ ruleNames: new Set(['a']), diagnostics })
			});
			expect(codesOf(ds)).toEqual(['rule-cause-mismatch:a']);
			expect(ds[0]!.message).toMatch(/'alias-shape', 'ambiguity'/);
		}
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
		const ok = diagnose({
			renderAs: ['_template_chars'],
			enriched: enriched({ externalNames: new Set(['_template_chars']) })
		});
		expect(ok).toEqual([]);
		const bad = diagnose({
			renderAs: ['_marker'],
			enriched: enriched({ ruleNames: new Set(['_marker']), externalNames: new Set(['_template_chars']) })
		});
		expect(codesOf(bad)).toEqual(['render-only-not-external:_marker']);
		expect(bad[0]!.canProceed).toBe(false);
	});

	it('every bare body is rule-cause-missing, blocking, and names both declarations', () => {
		const ds = diagnose({
			undeclaredRules: ['string', 'helper'],
			enriched: enriched({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-missing:helper', 'rule-cause-missing:string']);
		expect(ds.every((d) => d.canProceed === false)).toBe(true);
		expect(ds.find((d) => d.ownerKind === 'string')!.message).toMatch(/reauthored\(cause, body\)/);
		expect(ds.find((d) => d.ownerKind === 'helper')!.message).toMatch(/vocabulary\(body\)/);
	});
});

describe('a rule reauthored because upstream accepts a form that is always another kind', () => {
	const str = (value: string) => ({ type: 'STRING', value });
	const sym = (name: string) => ({ type: 'SYMBOL', name });
	const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
	const upstreamRules = {
		tuple: seq(str('('), { type: 'OPTIONAL', content: sym('_elements') }, str(')')),
		_elements: seq(
			sym('expression'),
			{ type: 'REPEAT', content: seq(str(','), sym('expression')) },
			{ type: 'OPTIONAL', content: str(',') }
		),
		parenthesized: seq(str('('), { type: 'CHOICE', members: [sym('expression'), sym('yield')] }, str(')')),
		list: seq(str('['), { type: 'OPTIONAL', content: sym('_elements') }, str(']'))
	};
	const ruleNames = new Set(Object.keys(upstreamRules));
	const declared = (
		form: readonly (string | { symbol: string })[],
		kind: string
	): Record<string, RuleCauseDeclaration> => ({
		tuple: { kind: 'reauthored', cause: 'accepts-other-kind', witnesses: [{ text: '(a)', form, kind }] }
	});
	const parenthesizedForm = ['(', { symbol: 'expression' }, ')'];

	it("is silent when the upstream rule and the other kind's rule both derive the witness form", () => {
		const ds = diagnose({
			ruleCauses: declared(parenthesizedForm, 'parenthesized'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(ds).toEqual([]);
	});

	it('is a mismatch when the upstream rule does not derive the form', () => {
		const ds = diagnose({
			ruleCauses: declared(['(', { symbol: 'yield' }, ')'], 'parenthesized'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:tuple']);
		expect(ds[0]!.message).toContain("upstream 'tuple' does not derive");
	});

	it("is a mismatch when the other kind's rule does not derive the form", () => {
		const ds = diagnose({
			ruleCauses: declared(parenthesizedForm, 'list'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:tuple']);
		expect(ds[0]!.message).toContain("upstream 'list' does not derive");
	});

	it('is a mismatch when the other kind is not an upstream rule', () => {
		const ds = diagnose({
			ruleCauses: declared(parenthesizedForm, 'absent'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:tuple']);
	});

	it('is a mismatch when no witness is declared', () => {
		const ds = diagnose({
			ruleCauses: { tuple: { kind: 'reauthored', cause: 'accepts-other-kind' } },
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:tuple']);
	});

	it('derives through a repeat: a longer form of the same rule is accepted, and one the rule cannot produce is not', () => {
		const longer = ['(', { symbol: 'expression' }, ',', { symbol: 'expression' }, ',', ')'];
		const viaRepeat = diagnose({
			ruleCauses: declared(longer, 'tuple'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(viaRepeat).toEqual([]);
		const doubled = diagnose({
			ruleCauses: declared(['(', { symbol: 'expression' }, ',', ',', ')'], 'tuple'),
			enriched: enriched({ ruleNames }),
			upstreamRules
		});
		expect(codesOf(doubled)).toEqual(['rule-cause-mismatch:tuple']);
	});
});

describe('a rule reauthored because upstream accepts a form the language excludes', () => {
	const str = (value: string) => ({ type: 'STRING', value });
	const sym = (name: string) => ({ type: 'SYMBOL', name });
	const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
	const upstreamRules = {
		getter: seq(str('get'), sym('name'), str('('), { type: 'OPTIONAL', content: sym('parameter') }, str(')'))
	};
	const authoredRules = { getter: seq(str('get'), sym('name'), str('('), str(')')) };
	const ruleNames = new Set(Object.keys(upstreamRules));
	const witness = {
		text: 'get x(a)',
		form: ['get', { symbol: 'name' }, '(', { symbol: 'parameter' }, ')'],
		kind: 'getter',
		production: 'ECMAScript MethodDefinition: get ClassElementName ( )'
	};
	const check = (witnesses: readonly (typeof witness)[] | undefined, authored: Record<string, unknown> = authoredRules) =>
		diagnose({
			ruleCauses: {
				getter: { kind: 'reauthored', cause: 'accepts-invalid-syntax', witnesses: witnesses as never }
			},
			enriched: enriched({ ruleNames }),
			upstreamRules,
			authoredRules: authored
		});

	it('is silent when upstream derives the witness form and the authored rule does not', () => {
		expect(check([witness])).toEqual([]);
	});

	it('is a mismatch when upstream does not derive the witness form', () => {
		const ds = check([{ ...witness, form: ['get', { symbol: 'name' }, '(', ',', ')'] }]);
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain("upstream 'getter' does not derive the witness form");
	});

	it('is a mismatch when the authored rule still derives the witness form', () => {
		const ds = check([witness], upstreamRules);
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain('the authored rule still derives');
	});

	it('is a mismatch when the authored grammar has no rule of the witness kind', () => {
		const ds = check([witness], {});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain("no authored rule 'getter'");
	});

	it('is a mismatch when the authored rule still derives the form through a rule sittir minted', () => {
		const ds = check([witness], { getter: sym('getter_accessor'), getter_accessor: upstreamRules.getter });
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain('the authored rule still derives');
	});

	it('is a mismatch when the authored rule still derives the form through a left-recursive rule sittir minted', () => {
		const upstream = { getter: seq(str('x'), str('x')) };
		const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
		const doubled = { text: 'x x', form: ['x', 'x'], kind: 'getter', production: 'p' };
		const ds = diagnose({
			ruleCauses: { getter: { kind: 'reauthored', cause: 'accepts-invalid-syntax', witnesses: [doubled] } },
			enriched: enriched({ ruleNames: new Set(['getter']) }),
			upstreamRules: upstream,
			authoredRules: { getter: sym('variant'), variant: choice(seq(sym('variant'), str('x')), str('x')) }
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain('the authored rule still derives');
	});

	it('reads a symbol upstream also declares as a witness item, not as its body', () => {
		const withName = { ...upstreamRules, name: str('x') };
		const ds = diagnose({
			ruleCauses: { getter: { kind: 'reauthored', cause: 'accepts-invalid-syntax', witnesses: [witness] } },
			enriched: enriched({ ruleNames: new Set(Object.keys(withName)) }),
			upstreamRules: withName,
			authoredRules: { ...authoredRules, name: str('x') }
		});
		expect(ds).toEqual([]);
	});

	it('is a mismatch when the witness cites no production', () => {
		expect(codesOf(check([{ ...witness, production: ' ' }]))).toEqual(['rule-cause-mismatch:getter']);
	});

	it('is a mismatch when no witness is declared', () => {
		expect(codesOf(check(undefined))).toEqual(['rule-cause-mismatch:getter']);
	});

	it('judges every witness and names the index of the one that fails', () => {
		const ds = check([witness, { ...witness, form: ['set', { symbol: 'name' }, '(', ')'] }]);
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:getter']);
		expect(ds[0]!.message).toContain('witness 1');
	});

	it('is a witness-verified cause', () => {
		expect(isWitnessVerified({ kind: 'reauthored', cause: 'accepts-invalid-syntax' })).toBe(true);
	});
});
