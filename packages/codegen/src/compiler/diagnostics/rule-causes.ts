import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RuleCause } from '../../dsl/primitives/rule-cause.ts';
import type { RawGrammar } from '../types.ts';
import type { StageDiagnosis } from '../stage.ts';

export const PROVOKING_CODES: Readonly<Record<RuleCause, readonly string[]>> = {
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
	readonly raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'renderAs'>;
	readonly enriched: StageDiagnosis;
}

export function diagnoseRuleCauses(input: RuleCausesInput): GrammarDiagnostic[] {
	const { grammar, raw, enriched } = input;
	const out: GrammarDiagnostic[] = (raw.undeclaredRules ?? []).map((name) =>
		blocking(
			grammar,
			'rule-cause-missing',
			name,
			`rules: '${name}' has a bare body. Declare it with reauthored(cause, body) when it replaces the upstream rule of that name, or vocabulary(body) when sittir adds it`
		)
	);
	for (const name of Object.keys(raw.renderAs ?? {})) {
		if (enriched.externalNames.has(name)) continue;
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
			declaration.kind === 'vocabulary' ? judgeVocabulary(grammar, name, enriched) : judgeReauthored(input, name, declaration.cause);
		if (diagnostic !== undefined) out.push(diagnostic);
	}
	return out;
}

function judgeVocabulary(grammar: string, name: string, enriched: StageDiagnosis): GrammarDiagnostic | undefined {
	if (!enriched.ruleNames.has(name)) return undefined;
	return blocking(
		grammar,
		'vocabulary-replaces-upstream',
		name,
		`rules: '${name}' is declared vocabulary but replaces the upstream rule of that name. Declare it with reauthored(cause, body)`
	);
}

function judgeReauthored(input: RuleCausesInput, name: string, cause: RuleCause): GrammarDiagnostic | undefined {
	const { grammar, enriched } = input;
	if (!Object.hasOwn(PROVOKING_CODES, cause)) {
		return blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}'), which is not a cause. Declare one of: ${Object.keys(PROVOKING_CODES)
				.map((known) => `'${known}'`)
				.join(', ')}`,
			{ cause }
		);
	}
	if (!enriched.ruleNames.has(name)) {
		return blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}') but upstream declares no rule of that name. Declare it with vocabulary(body)`,
			{ cause }
		);
	}
	const provoking = [...new Set(enriched.diagnostics.filter((d) => d.ownerKind === name && ANY_PROVOKING.has(d.code)).map((d) => d.code))].sort();
	if (provoking.length === 0) {
		return blocking(
			grammar,
			'rule-reauthored-without-cause',
			name,
			`rules: '${name}' replaces the upstream rule, but no diagnostic provokes the enriched shape (declared cause '${cause}'). Delete the entry so the upstream rule compiles as is`,
			{ cause }
		);
	}
	if (provoking.some((code) => PROVOKING_CODES[cause].includes(code))) return undefined;
	return blocking(
		grammar,
		'rule-cause-mismatch',
		name,
		`rules: '${name}' is declared reauthored('${cause}') but the enriched shape is provoked by [${provoking.join(', ')}], none of which belongs to that cause. Declare the cause those codes belong to`,
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
