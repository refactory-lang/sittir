import type { RenderAsAliasProblemKind } from '../../dsl/wire/render-as-visibility.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import {
	WITNESSED_CAUSES,
	type DeclaredCause,
	type MisreadWitness,
	type OtherKindWitness,
	type RuleCause,
	type RuleCauseDeclaration,
	type SemanticGapWitness,
	type WitnessFormItem,
	type Witnesses
} from '../../dsl/primitives/rule-cause.ts';
import type { Rule } from '../../types/rule.ts';
import { copyBaseOf } from '../../dsl/automatic-variants.ts';
import { nodelessNamesOf, ruleListParts } from '../../dsl/rule-patterns.ts';
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
import { patternAccepts } from '../../types/runtime-shapes.ts';
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
	'misreads-valid-syntax': [],
	'accepts-invalid-syntax': [],
	'ruled-narrowing': []
};

type GrammarRules = Readonly<Record<string, Rule<'evaluate'>>>;

interface UpstreamGrammar {
	readonly rules: GrammarRules;
	readonly supertypes?: unknown;
	readonly inline?: unknown;
}

interface Derivation {
	readonly rules: GrammarRules;
	readonly expands: (name: string) => boolean;
}

const ANY_PROVOKING: ReadonlySet<string> = new Set(Object.values(PROVOKING_CODES).flat());

const WHITESPACE_COLLISION_MESSAGES: Readonly<Record<WhitespaceCollision['site'], (name: string) => string>> = {
	renderAs: (name) =>
		`renderAs: '${name}' is a whitespace member enrich mints from the grammar's extras. Delete the entry`,
	upstream: (name) =>
		`upstream: the grammar defines '${name}', which enrich mints from the grammar's extras with a different definition. The minted one replaces it`
};

const RENDER_AS_ALIAS_MESSAGES: Readonly<Record<RenderAsAliasProblemKind, (name: string) => string>> = {
	anonymous: (name) => `renderAs: '${name}' is aliased to a string. An entry's alias must be named: alias(body, $.name)`,
	'upstream-aliased': (name) =>
		`renderAs: '${name}' is already aliased by the upstream grammar, whose sites stand and whose bare uses stay bare. Delete the alias from the entry`,
	visible: (name) => `renderAs: '${name}' is a visible external; it already has a node of its own name. Delete the alias from the entry`
};

export interface RuleCausesInput {
	readonly grammar: string;
	readonly raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'renderAs' | 'renamedFrom' | 'whitespaceCollisions' | 'visibleAs' | 'externalAliases' | 'renderAsProblems'>;
	readonly enriched?: StageDiagnosis;
	readonly upstream?: UpstreamGrammar;
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

export function unverifiedRuleNames(
	raw: Pick<RawGrammar, 'ruleCauses' | 'undeclaredRules' | 'references' | 'stages' | 'splitFrom'> & Partial<Pick<RawGrammar, 'rules' | 'extras' | 'externals' | 'word'>>
): string[] {
	const causes = raw.ruleCauses ?? {};
	const authored = new Set(authoredRuleNames(raw));
	const upstream = new Set(Object.keys(raw.stages?.raw.grammar.rules ?? {}));
	const referrers = new Map<string, string[]>();
	for (const { from, to } of raw.references) referrers.set(to, [...(referrers.get(to) ?? []), from]);
	const copyBase = copyBaseOf(raw.splitFrom);
	const reachers = (name: string): string[] => {
		const found: string[] = [];
		const seen = new Set([name]);
		const pending = [name];
		for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
			for (const from of referrers.get(next) ?? []) {
				if (seen.has(from)) continue;
				seen.add(from);
				const base = copyBase(from);
				if (authored.has(base) || upstream.has(base)) found.push(base);
				else pending.push(from);
			}
		}
		return found;
	};
	const roots = new Set([
		...Object.keys(raw.rules ?? {}).slice(0, 1),
		...ruleListParts(raw.extras ?? []).names,
		...ruleListParts(raw.externals ?? []).names,
		...(raw.word == null ? [] : [raw.word])
	]);
	const reachedBy = new Map(
		Object.entries(causes).flatMap(([name, declaration]) => (declaration.kind === 'vocabulary' ? [[name, reachers(name)] as const] : []))
	);
	const verifiedHelpers = new Set([...reachedBy].flatMap(([name, reached]) => (roots.has(name) || reached.length === 0 ? [] : [name])));
	const isVerifiedReacher = (name: string): boolean => {
		const declaration = causes[name];
		return verifiedHelpers.has(name) || (declaration?.kind === 'reauthored' && isWitnessVerified(declaration));
	};
	for (let changed = true; changed; ) {
		changed = false;
		for (const name of verifiedHelpers)
			if (!(reachedBy.get(name) ?? []).every(isVerifiedReacher)) {
				verifiedHelpers.delete(name);
				changed = true;
			}
	}
	const isVerified = (name: string, declaration: RuleCauseDeclaration): boolean =>
		declaration.kind === 'reauthored' ? isWitnessVerified(declaration) : verifiedHelpers.has(name);
	const unverified = Object.entries(causes).filter(([name, declaration]) => !isVerified(name, declaration));
	return [...unverified.map(([name]) => name), ...(raw.undeclaredRules ?? [])].sort();
}

export function diagnoseRuleCauses(input: RuleCausesInput): GrammarDiagnostic[] {
	const { grammar, raw, enriched, authoredRules = {} } = input;
	const upstreamRules = input.upstream?.rules ?? {};
	const nodeless = nodelessNamesOf(input.upstream ?? {});
	const upstream: Derivation = { rules: upstreamRules, expands: nodeless };
	const authored: Derivation = { rules: authoredRules, expands: (rule) => nodeless(rule) || !Object.hasOwn(upstreamRules, rule) };
	const collisions = (raw.whitespaceCollisions ?? []).map(({ name, site }) =>
		blocking(grammar, 'whitespace-mint-collision', name, WHITESPACE_COLLISION_MESSAGES[site](name))
	);
	const aliases = [
		...(raw.externalAliases ?? []).map(({ rule, external, name }) =>
			blocking(
				grammar,
				'external-alias-outside-render-as',
				external,
				`rules: '${rule}' aliases the external '${external}' as '${name}'. An external is made visible only by renderAs: ${external}: alias(body, $.${name})`
			)
		),
		...(raw.renderAsProblems ?? []).map(({ external, problem }) =>
			blocking(grammar, 'render-as-alias-invalid', external, RENDER_AS_ALIAS_MESSAGES[problem](external))
		)
	];
	if (enriched === undefined) return [...collisions, ...aliases];
	const out: GrammarDiagnostic[] = [
		...collisions,
		...aliases,
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
		if (Object.hasOwn(raw.visibleAs ?? {}, name)) continue;
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
					: declaration.causes.map((declared) => judgeReauthored(grammar, enriched, name, declared, upstream, authored));
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

function derivesForm({ rules, expands }: Derivation, rule: Rule<'evaluate'>, form: readonly WitnessFormItem[]): boolean {
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
				return typeof item === 'string' && patternAccepts(node.value, item) ? [at + 1] : [];
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
	upstream: Derivation,
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
				const body = upstream.rules[rule];
				if (body === undefined) return `upstream declares no rule '${rule}'`;
				if (!derivesForm(upstream, body, witness.form)) return `upstream '${rule}' does not derive the witness form`;
			}
			return undefined;
		}
	);
}

function judgeUnderivedWitnesses(
	grammar: string,
	name: string,
	cause: 'rejects-valid-syntax' | 'misreads-valid-syntax',
	witnesses: Witnesses<OtherKindWitness> | undefined,
	upstream: Derivation
): GrammarDiagnostic | undefined {
	return judgeWitnesses(
		grammar,
		name,
		cause,
		witnesses,
		cause === 'rejects-valid-syntax'
			? 'The witness must be a form the upstream rule does not derive'
			: 'The witness must be a form the upstream rule does not derive, read by upstream as another rule it names',
		(witness) => {
			const body = upstream.rules[witness.kind];
			if (body === undefined) return `upstream declares no rule '${witness.kind}'`;
			if (derivesForm(upstream, body, witness.form)) return `upstream '${witness.kind}' already derives the witness form`;
			if (cause === 'rejects-valid-syntax') return undefined;
			const { read } = witness as Partial<MisreadWitness>;
			if (typeof read !== 'string' || read.length === 0) return 'it names no kind upstream reads it as';
			if (read === witness.kind) return `it names '${read}', the witness kind, as what upstream reads it as`;
			if (upstream.rules[read] === undefined) return `upstream declares no rule '${read}'`;
			return undefined;
		}
	);
}

const NARROWING_JUSTIFICATIONS = {
	'accepts-invalid-syntax': { key: 'production', missing: 'it cites no excluding production', inWords: false },
	'ruled-narrowing': { key: 'ruling', missing: 'it states no ruling', inWords: true }
} as const;

const PLANNING_REFERENCE = /#\d+|\b(?:PR|pull[\s-]+request|ADR|spec(?:ification)?|plan|task)s?(?:\s+(?:no\.?|number))?[\s#:-]*\d+/i;

const REQUIREMENT_ID = /\bR\d+\b/;

const WORD = /\p{L}{2,}/u;

const CODE_SPAN = /`[^`]*`/g;

function statesInWords(text: string): boolean {
	const prose = text.replace(CODE_SPAN, ' ');
	return !PLANNING_REFERENCE.test(text) && WORD.test(prose) && !REQUIREMENT_ID.test(prose);
}

type NarrowingCause = keyof typeof NARROWING_JUSTIFICATIONS;

function judgeNarrowingWitnesses(
	grammar: string,
	name: string,
	cause: NarrowingCause,
	witnesses: Witnesses<OtherKindWitness> | undefined,
	upstream: Derivation,
	authored: Derivation
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
				return `its ${key} cites a PR, spec or task number or holds no word, where it must state the constraint in words (quote syntax in backticks)`;
			const upstreamBody = upstream.rules[witness.kind];
			if (upstreamBody === undefined) return `upstream declares no rule '${witness.kind}'`;
			if (!derivesForm(upstream, upstreamBody, witness.form)) return `upstream '${witness.kind}' does not derive the witness form`;
			const authoredBody = authored.rules[witness.kind];
			if (authoredBody === undefined) return `the grammar has no authored rule '${witness.kind}'`;
			if (derivesForm(authored, authoredBody, witness.form))
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
	upstream: Derivation,
	authored: Derivation
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
	if (cause === 'rejects-valid-syntax' || cause === 'misreads-valid-syntax')
		return judgeUnderivedWitnesses(grammar, name, cause, witnesses, upstream);
	if (cause === 'accepts-invalid-syntax' || cause === 'ruled-narrowing')
		return judgeNarrowingWitnesses(grammar, name, cause, witnesses, upstream, authored);
	if (cause === 'accepts-other-kind' || cause === 'semantic-gap')
		return judgeOtherKindWitnesses(grammar, name, witnesses, upstream, cause);
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
