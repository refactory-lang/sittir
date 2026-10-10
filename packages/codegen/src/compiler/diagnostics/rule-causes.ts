import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type {
	OtherKindWitness,
	RuleCause,
	RuleCauseDeclaration,
	WitnessFormItem
} from '../../dsl/primitives/rule-cause.ts';
import type { Rule } from '../../types/rule.ts';
import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	IMMEDIATE_TOKEN,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN
} from '../../types/rule-types.ts';
import { assertNever } from '../../polymorph-variant.ts';
import type { RawGrammar } from '../types.ts';
import { mappedName } from '../../dsl/bind.ts';
import type { StageDiagnosis } from '../stage.ts';
import type { WhitespaceCollision } from '../../dsl/whitespace.ts';

export const PROVOKING_CODES: Readonly<Record<RuleCause, readonly string[]>> = {
	'alias-shape': [
		'alias-distributed',
		'display-union-mixed',
		'unclassifiable-shape',
		'union-slot-routed',
		'union-slot-routed-repeated',
		'union-slot-mixed-row',
		'multi-slot-nested-seq'
	],
	ambiguity: [],
	'accepts-other-kind': [],
	'semantic-gap': []
};

type UpstreamRules = Readonly<Record<string, Rule<'evaluate'>>>;

const ANY_PROVOKING: ReadonlySet<string> = new Set(Object.values(PROVOKING_CODES).flat());

const WHITESPACE_COLLISION_MESSAGES: Readonly<Record<WhitespaceCollision['site'], (name: string) => string>> = {
	visibleExternals: (name) =>
		`visibleExternals: '${name}' is a whitespace member enrich mints from the grammar's extras. Delete the entry`,
	upstream: (name) =>
		`upstream: the grammar defines '${name}', which enrich mints from the grammar's extras with a different definition. The minted one replaces it`
};

export interface RuleCausesInput {
	readonly grammar: string;
	readonly raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'renderAs' | 'renamedFrom' | 'whitespaceCollisions'>;
	readonly enriched?: StageDiagnosis;
	readonly upstreamRules?: UpstreamRules;
}

export function isWitnessVerified(declaration: RuleCauseDeclaration): boolean {
	return (
		declaration.kind === 'reauthored' &&
		(declaration.cause === 'accepts-other-kind' || declaration.cause === 'semantic-gap')
	);
}

export function authoredRuleNames(raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules'>): string[] {
	return [...Object.keys(raw.ruleCauses ?? {}), ...(raw.undeclaredRules ?? [])];
}

export function diagnoseRuleCauses(input: RuleCausesInput): GrammarDiagnostic[] {
	const { grammar, raw, enriched, upstreamRules = {} } = input;
	const collisions = (raw.whitespaceCollisions ?? []).map(({ name, site }) =>
		blocking(grammar, 'whitespace-mint-collision', name, WHITESPACE_COLLISION_MESSAGES[site](name))
	);
	if (enriched === undefined) return collisions;
	const out: GrammarDiagnostic[] = [
		...collisions,
		...(raw.undeclaredRules ?? []).map((name) =>
			blocking(
				grammar,
				'rule-cause-missing',
				name,
				`rules: '${name}' has a bare body. Declare it with reauthored(cause, body) when it replaces the upstream rule of that name, or vocabulary(body) when sittir adds it`
			)
		)
	];
	for (const name of Object.keys(raw.renderAs ?? {})) {
		if (enriched.externalNames.has(mappedName(raw.renamedFrom, name))) continue;
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
			declaration.kind === 'vocabulary'
				? judgeVocabulary(grammar, name, enriched)
				: judgeReauthored(grammar, enriched, name, declaration, upstreamRules);
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

function derivesForm(rules: UpstreamRules, rule: Rule<'evaluate'>, form: readonly WitnessFormItem[]): boolean {
	const expanding = new Set<string>();
	const ends = (node: Rule<'evaluate'>, at: number): number[] => {
		const item = form[at];
		switch (node.type) {
			case STRING:
				return item === node.value ? [at + 1] : [];
			case SYMBOL: {
				if (typeof item === 'object' && item.symbol === node.name) return [at + 1];
				const body = node.name.startsWith('_') ? rules[node.name] : undefined;
				const key = `${node.name}@${at}`;
				if (body === undefined || expanding.has(key)) return [];
				expanding.add(key);
				const reached = ends(body, at);
				expanding.delete(key);
				return reached;
			}
			case SEQ:
				return node.members.reduce<number[]>(
					(starts, member) => [...new Set(starts.flatMap((start) => ends(member, start)))],
					[at]
				);
			case CHOICE:
				return [...new Set(node.members.flatMap((member) => ends(member, at)))];
			case OPTIONAL:
				return [...new Set([at, ...ends(node.content, at)])];
			case REPEAT:
			case REPEAT1: {
				const reached = new Set<number>(node.type === REPEAT ? [at] : []);
				let frontier = [at];
				while (frontier.length > 0) {
					frontier = [...new Set(frontier.flatMap((start) => ends(node.content, start)))].filter(
						(end) => !reached.has(end)
					);
					for (const end of frontier) reached.add(end);
				}
				return [...reached];
			}
			case FIELD:
			case ALIAS:
			case TOKEN:
			case IMMEDIATE_TOKEN:
			case 'PREC':
			case 'PREC_LEFT':
			case 'PREC_RIGHT':
			case 'PREC_DYNAMIC':
				return ends(node.content, at);
			case PATTERN:
			case SUPERTYPE:
			case INDENT:
			case DEDENT:
			case NEWLINE:
				return [];
			default:
				return assertNever(node);
		}
	};
	return ends(rule, 0).includes(form.length);
}

function judgeOtherKindWitness(
	grammar: string,
	name: string,
	witness: OtherKindWitness | undefined,
	upstreamRules: UpstreamRules,
	cause: 'accepts-other-kind' | 'semantic-gap' = 'accepts-other-kind'
): GrammarDiagnostic | undefined {
	const mismatch = (reason: string): GrammarDiagnostic =>
		blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}') but ${reason}. The upstream rules named by the witness must derive its form`,
			{ cause, witness }
		);
	if (witness === undefined) return mismatch('declares no witness');
	if (cause === 'semantic-gap') {
		if (witness.kind !== name) return mismatch('the witness kind must name the unchanged upstream parser kind');
		if (!('meaning' in witness) || typeof witness.meaning !== 'string' || witness.meaning.trim().length === 0)
			return mismatch('declares no language meaning for the witness');
	}
	for (const rule of new Set([name, witness.kind])) {
		const body = upstreamRules[rule];
		if (body === undefined) return mismatch(`upstream declares no rule '${rule}'`);
		if (!derivesForm(upstreamRules, body, witness.form))
			return mismatch(`upstream '${rule}' does not derive the witness form of '${witness.text}'`);
	}
	return undefined;
}

function judgeReauthored(
	grammar: string,
	enriched: StageDiagnosis,
	name: string,
	declaration: Extract<RuleCauseDeclaration, { kind: 'reauthored' }>,
	upstreamRules: UpstreamRules
): GrammarDiagnostic | undefined {
	const { cause } = declaration;
	if (!Object.hasOwn(PROVOKING_CODES, cause)) {
		return blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}'), which is not a cause. Declare one of: ${Object.keys(
				PROVOKING_CODES
			)
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
	if (cause === 'accepts-other-kind' || cause === 'semantic-gap')
		return judgeOtherKindWitness(grammar, name, declaration.witness, upstreamRules, cause);
	const provoking = [
		...new Set(enriched.diagnostics.filter((d) => d.ownerKind === name && ANY_PROVOKING.has(d.code)).map((d) => d.code))
	].sort();
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
	return {
		scope: 'grammar',
		grammar,
		code,
		severity: 'error',
		ownerKind,
		message,
		canProceed: false,
		...(details ? { details } : {})
	};
}
