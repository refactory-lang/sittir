import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RuleCause } from '../../dsl/primitives/rule-cause.ts';
import type { RawGrammar } from '../types.ts';
import type { UpstreamCompilation } from '../upstream.ts';
import { isExpectedDiagnostic } from './grammar-diagnostics.ts';

export const PROVOKING_CODES: Readonly<Record<RuleCause, readonly string[]>> = {
	'lexical-interior': ['parsekind-noninjective'],
	'alias-shape': [
		'alias-distributed',
		'display-union-mixed',
		'unclassifiable-shape',
		'union-slot-routed',
		'union-slot-mixed-row',
		'multi-slot-nested-seq'
	],
	ambiguity: []
};

const ANY_PROVOKING: ReadonlySet<string> = new Set(Object.values(PROVOKING_CODES).flat());

export interface RuleCausesInput {
	readonly grammar: string;
	readonly raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'renderAs' | 'expectDiagnostics'>;
	readonly upstream: UpstreamCompilation;
}

export function diagnoseRuleCauses(input: RuleCausesInput): GrammarDiagnostic[] {
	const { grammar, raw, upstream } = input;
	const out: GrammarDiagnostic[] = (raw.undeclaredRules ?? []).map((name) =>
		blocking(
			grammar,
			'rule-cause-missing',
			name,
			`rules: '${name}' has a bare body. Declare it with reauthored(cause, body) when it replaces the upstream rule of that name, or vocabulary(body) when sittir adds it`
		)
	);
	if (upstream.failure !== undefined) {
		out.push({
			scope: 'grammar',
			grammar,
			code: 'upstream-compile-failed',
			severity: 'warning',
			message: `the upstream compile did not complete, so no hand-written rule or renderAs entry was judged against it: ${upstream.failure}`,
			canProceed: true
		});
		return out;
	}
	for (const name of Object.keys(raw.renderAs ?? {})) {
		if (upstream.externalNames.has(name)) continue;
		out.push(
			blocking(
				grammar,
				'render-only-not-external',
				name,
				`renderAs: '${name}' is not an upstream external. A parser rule renders from its own body; delete the entry, or re-author the rule in rules: with reauthored(cause, body)`
			)
		);
	}
	for (const [name, declaration] of Object.entries(raw.ruleCauses ?? {})) {
		const diagnostic =
			declaration.kind === 'vocabulary' ? judgeVocabulary(grammar, name, upstream) : judgeReauthored(input, name, declaration.cause);
		if (diagnostic !== undefined) out.push(diagnostic);
	}
	return out;
}

function judgeVocabulary(grammar: string, name: string, upstream: UpstreamCompilation): GrammarDiagnostic | undefined {
	if (!upstream.ruleNames.has(name)) return undefined;
	return blocking(
		grammar,
		'vocabulary-replaces-upstream',
		name,
		`rules: '${name}' is declared vocabulary but replaces the upstream rule of that name. Declare it with reauthored(cause, body)`
	);
}

function judgeReauthored(input: RuleCausesInput, name: string, cause: RuleCause): GrammarDiagnostic | undefined {
	const { grammar, raw, upstream } = input;
	if (!upstream.ruleNames.has(name)) {
		return blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}') but upstream declares no rule of that name. Declare it with vocabulary(body)`,
			{ cause }
		);
	}
	const provoking = [...new Set(upstream.diagnostics.filter((d) => d.ownerKind === name && ANY_PROVOKING.has(d.code)).map((d) => d.code))].sort();
	if (provoking.length === 0) {
		const floored = isExpectedDiagnostic(raw.expectDiagnostics, 'rule-reauthored-without-cause', name);
		return {
			scope: 'grammar',
			grammar,
			code: 'rule-reauthored-without-cause',
			severity: floored ? 'warning' : 'error',
			ownerKind: name,
			message: `rules: '${name}' replaces the upstream rule, but no diagnostic provokes the upstream shape (declared cause '${cause}'). Delete the entry so the upstream rule compiles as is`,
			canProceed: floored,
			details: { cause }
		};
	}
	if (provoking.some((code) => PROVOKING_CODES[cause].includes(code))) return undefined;
	return blocking(
		grammar,
		'rule-cause-mismatch',
		name,
		`rules: '${name}' is declared reauthored('${cause}') but the upstream shape is provoked by [${provoking.join(', ')}], none of which belongs to that cause. Declare the cause those codes belong to`,
		{ cause, provoking }
	);
}

function blocking(
	grammar: string,
	code: string,
	ownerKind: string,
	message: string,
	details?: Record<string, unknown>
): GrammarDiagnostic {
	return { scope: 'grammar', grammar, code, severity: 'error', ownerKind, message, canProceed: false, ...(details ? { details } : {}) };
}
