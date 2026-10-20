import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import {
	WITNESSED_CAUSES,
	type DeclaredCause,
	type OtherKindWitness,
	type RuleCause,
	type RuleCauseDeclaration,
	type SemanticGapWitness,
	type WitnessFormItem,
	type Witnesses
} from '../../dsl/primitives/rule-cause.ts';
import type { Rule } from '../../types/rule.ts';
import {
	ALIAS,
	CHOICE,
	DEDENT,
	EOF,
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
	'semantic-gap': [],
	'rejects-valid-syntax': [],
	'accepts-invalid-syntax': [],
	'ruled-narrowing': []
};

type GrammarRules = Readonly<Record<string, Rule<'evaluate'>>>;

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
	readonly upstreamRules?: GrammarRules;
	readonly authoredRules?: GrammarRules;
}

export function isWitnessVerified(declaration: RuleCauseDeclaration): boolean {
	return (
		declaration.kind === 'reauthored' &&
		declaration.causes.length > 0 &&
		declaration.causes.every(({ cause }) => (WITNESSED_CAUSES as readonly RuleCause[]).includes(cause))
	);
}

export function authoredRuleNames(raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules'>): string[] {
	return [...Object.keys(raw.ruleCauses ?? {}), ...(raw.undeclaredRules ?? [])];
}

export function unverifiedRuleNames(raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'references' | 'stages'>): string[] {
	const causes = raw.ruleCauses ?? {};
	const authored = new Set(authoredRuleNames(raw));
	const upstream = new Set(Object.keys(raw.stages?.raw.grammar.rules ?? {}));
	const referrers = new Map<string, string[]>();
	for (const { from, to } of raw.references) referrers.set(to, [...(referrers.get(to) ?? []), from]);
	const reachers = (name: string): string[] => {
		const found: string[] = [];
		const seen = new Set([name]);
		const pending = [name];
		for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
			for (const from of referrers.get(next) ?? []) {
				if (seen.has(from)) continue;
				seen.add(from);
				if (authored.has(from) || upstream.has(from)) found.push(from);
				else pending.push(from);
			}
		}
		return found;
	};
	const isVerifiedReacher = (name: string): boolean => {
		const declaration = causes[name];
		return declaration !== undefined && isWitnessVerified(declaration);
	};
	const isVerified = (name: string, declaration: RuleCauseDeclaration): boolean => {
		if (declaration.kind === 'reauthored') return isWitnessVerified(declaration);
		const reached = reachers(name);
		return reached.length > 0 && reached.every(isVerifiedReacher);
	};
	const unverified = Object.entries(causes).filter(([name, declaration]) => !isVerified(name, declaration));
	return [...unverified.map(([name]) => name), ...(raw.undeclaredRules ?? [])].sort();
}

export function diagnoseRuleCauses(input: RuleCausesInput): GrammarDiagnostic[] {
	const { grammar, raw, enriched, upstreamRules = {}, authoredRules = {} } = input;
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
		const diagnostics =
			declaration.kind === 'vocabulary'
				? [judgeVocabulary(grammar, name, enriched)]
				: declaration.causes.length === 0
					? [
							blocking(
								grammar,
								'rule-cause-missing',
								name,
								`rules: '${name}' is declared reauthored with no cause. Declare at least one: reauthored(cause, body), or reauthored([[cause, witnesses], …], body)`
							)
						]
					: declaration.causes.map((declared) => judgeReauthored(grammar, enriched, name, declared, upstreamRules, authoredRules));
		for (const diagnostic of diagnostics) if (diagnostic !== undefined) out.push(diagnostic);
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

const expandsHidden = (name: string): boolean => name.startsWith('_');

function derivesForm(
	rules: GrammarRules,
	rule: Rule<'evaluate'>,
	form: readonly WitnessFormItem[],
	expands: (name: string) => boolean = expandsHidden
): boolean {
	const reached = new Map<string, Set<number>>();
	let visited = new Set<string>();
	let grew = false;
	const ends = (node: Rule<'evaluate'>, at: number): number[] => {
		const item = form[at];
		switch (node.type) {
			case STRING:
				return item === node.value ? [at + 1] : [];
			case SYMBOL: {
				if (typeof item === 'object' && item.symbol === node.name) return [at + 1];
				const body = expands(node.name) ? rules[node.name] : undefined;
				if (body === undefined) return [];
				const key = `${node.name}@${at}`;
				const known = reached.get(key) ?? new Set<number>();
				reached.set(key, known);
				if (visited.has(key)) return [...known];
				visited.add(key);
				for (const end of ends(body, at)) {
					if (known.has(end)) continue;
					known.add(end);
					grew = true;
				}
				return [...known];
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
				const seen = new Set<number>(node.type === REPEAT ? [at] : []);
				let frontier = [at];
				while (frontier.length > 0) {
					frontier = [...new Set(frontier.flatMap((start) => ends(node.content, start)))].filter(
						(end) => !seen.has(end)
					);
					for (const end of frontier) seen.add(end);
				}
				return [...seen];
			}
			case FIELD:
			case ALIAS:
			case TOKEN:
			case IMMEDIATE_TOKEN:
			case 'PREC':
			case 'PREC_LEFT':
			case 'PREC_RIGHT':
			case 'PREC_DYNAMIC':
			case 'RESERVED':
				return ends(node.content, at);
			case EOF:
			case 'BLANK':
				return [at];
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
	let result: number[];
	do {
		grew = false;
		visited = new Set();
		result = ends(rule, 0);
	} while (grew);
	return result.includes(form.length);
}

function judgeWitnesses<W extends OtherKindWitness>(
	grammar: string,
	name: string,
	cause: RuleCause,
	witnesses: Witnesses<W> | undefined,
	requirement: string,
	judge: (witness: W) => string | undefined
): GrammarDiagnostic | undefined {
	const mismatch = (reason: string, witness?: W): GrammarDiagnostic =>
		blocking(
			grammar,
			'rule-cause-mismatch',
			name,
			`rules: '${name}' is declared reauthored('${cause}') but ${reason}. ${requirement}`,
			{ cause, ...(witness === undefined ? {} : { witness }) }
		);
	if (witnesses === undefined || witnesses.length === 0) return mismatch('declares no witness');
	for (const [index, witness] of witnesses.entries()) {
		const reason = judge(witness);
		if (reason !== undefined) return mismatch(`for witness ${index} ('${witness.text}'), ${reason}`, witness);
	}
	return undefined;
}

function judgeOtherKindWitnesses(
	grammar: string,
	name: string,
	witnesses: Witnesses<OtherKindWitness> | undefined,
	upstreamRules: GrammarRules,
	cause: 'accepts-other-kind' | 'semantic-gap'
): GrammarDiagnostic | undefined {
	return judgeWitnesses(
		grammar,
		name,
		cause,
		witnesses,
		'The upstream rules named by the witness must derive its form',
		(witness) => {
			if (cause === 'semantic-gap') {
				if (witness.kind !== name) return 'the witness kind must name the unchanged upstream parser kind';
				const { meaning } = witness as Partial<SemanticGapWitness>;
				if (typeof meaning !== 'string' || meaning.trim().length === 0) return 'it declares no language meaning';
			}
			for (const rule of new Set([name, witness.kind])) {
				const body = upstreamRules[rule];
				if (body === undefined) return `upstream declares no rule '${rule}'`;
				if (!derivesForm(upstreamRules, body, witness.form)) return `upstream '${rule}' does not derive the witness form`;
			}
			return undefined;
		}
	);
}

function judgeRejectedWitnesses(
	grammar: string,
	name: string,
	witnesses: Witnesses<OtherKindWitness> | undefined,
	upstreamRules: GrammarRules
): GrammarDiagnostic | undefined {
	return judgeWitnesses(
		grammar,
		name,
		'rejects-valid-syntax',
		witnesses,
		'The witness must be a form the upstream rule does not derive',
		(witness) => {
			const body = upstreamRules[witness.kind];
			if (body === undefined) return `upstream declares no rule '${witness.kind}'`;
			if (derivesForm(upstreamRules, body, witness.form)) return `upstream '${witness.kind}' already derives the witness form`;
			return undefined;
		}
	);
}

const NARROWING_JUSTIFICATIONS = {
	'accepts-invalid-syntax': { key: 'production', missing: 'it cites no excluding production', inWords: false },
	'ruled-narrowing': { key: 'ruling', missing: 'it states no ruling', inWords: true }
} as const;

const PLANNING_REFERENCE = /#\d+|\b(?:PR|ADR|spec|task)[\s#-]*\d+/i;

const REQUIREMENT_ID = /\bR\d+\b/;

const WORD = /\p{L}{2,}/u;

function statesInWords(text: string): boolean {
	return WORD.test(text) && !PLANNING_REFERENCE.test(text) && !REQUIREMENT_ID.test(text);
}

type NarrowingCause = keyof typeof NARROWING_JUSTIFICATIONS;

function judgeNarrowingWitnesses(
	grammar: string,
	name: string,
	cause: NarrowingCause,
	witnesses: Witnesses<OtherKindWitness> | undefined,
	upstreamRules: GrammarRules,
	authoredRules: GrammarRules
): GrammarDiagnostic | undefined {
	const { key, missing, inWords } = NARROWING_JUSTIFICATIONS[cause];
	return judgeWitnesses(
		grammar,
		name,
		cause,
		witnesses,
		'The witness must be a form upstream derives and the authored rule does not',
		(witness) => {
			const justification: unknown = Reflect.get(witness, key);
			if (typeof justification !== 'string' || justification.trim().length === 0) return missing;
			if (inWords && !statesInWords(justification))
				return `its ${key} cites a PR, spec or task number or holds no word, where it must state the constraint in words`;
			const upstream = upstreamRules[witness.kind];
			if (upstream === undefined) return `upstream declares no rule '${witness.kind}'`;
			if (!derivesForm(upstreamRules, upstream, witness.form)) return `upstream '${witness.kind}' does not derive the witness form`;
			const authored = authoredRules[witness.kind];
			if (authored === undefined) return `the grammar has no authored rule '${witness.kind}'`;
			const minted = (rule: string): boolean => expandsHidden(rule) || !Object.hasOwn(upstreamRules, rule);
			if (derivesForm(authoredRules, authored, witness.form, minted))
				return `the authored rule still derives the witness form through '${witness.kind}'`;
			return undefined;
		}
	);
}

function judgeReauthored(
	grammar: string,
	enriched: StageDiagnosis,
	name: string,
	declared: DeclaredCause,
	upstreamRules: GrammarRules,
	authoredRules: GrammarRules
): GrammarDiagnostic | undefined {
	const { cause, witnesses } = declared;
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
	if (cause === 'rejects-valid-syntax') return judgeRejectedWitnesses(grammar, name, witnesses, upstreamRules);
	if (cause === 'accepts-invalid-syntax' || cause === 'ruled-narrowing')
		return judgeNarrowingWitnesses(grammar, name, cause, witnesses, upstreamRules, authoredRules);
	if (cause === 'accepts-other-kind' || cause === 'semantic-gap')
		return judgeOtherKindWitnesses(grammar, name, witnesses, upstreamRules, cause);
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
