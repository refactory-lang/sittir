/**
 * dsl/rule-patterns.ts — the catalog of rule-shape recognizers.
 *
 * Every shape a phase reasons about is a named function here, and nowhere
 * else: terminality (`classifyByType` / `isNonterminalRuleType`), enum and
 * spliceable-seq shapes, separated-list detection (`separatorOf`), group
 * classification (`isInlineSafe` / `isSupertypeLike` / `isPermutationChoice`
 * / `ruleMatchesEmpty`), and the self-referential chain fold. Recognizers
 * inspect and report; they never mutate. What a caller does with a
 * recognized shape is the caller's phase concern.
 *
 * Each recognizer looks one level down — at the node and the attributes its
 * children's builders already stamped — and returns the fact it recognizes,
 * or `undefined`/`false` when the shape is absent. A phase's builders are
 * the consumers; a pass that hand-rolls `type === … && members.length === n`
 * is re-deriving something that belongs here.
 *
 * **Runtime-agnostic by design.** DSL-layer code runs under two runtimes
 * (sittir, tree-sitter CLI) that agree on UPPERCASE discriminants; enrich in
 * particular sees both. The list and group recognizers therefore type their
 * input as `RuntimeRule` and compare tags through `typeEq`, while the
 * terminality and phase-typed predicates take the `Rule` union directly.
 *
 * **List shapes are pre-pushdown.** Separator/trailing shapes are
 * reconstructable only while the wrappers (`optional`/`repeat`/`repeat1`/
 * `field`) are intact — enrich/wire/evaluate/link — not after
 * wrapper-deletion has flattened them to `multiplicity`/`separator`
 * attributes.
 */

import {
	isBlankType,
	isChoiceType,
	isFieldType,
	isOptionalType,
	isPrecWrapper,
	isRepeatType,
	isSeqType,
	isStringType,
	isSymbolType,
	typeEq,
	type RuntimeRule
} from '../types/runtime-shapes.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
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
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, PhaseName, Rule } from '../types/rule.ts';
import { assertNever } from '../polymorph-variant.ts';

// ---------------------------------------------------------------------------
// Terminality — the per-rule-type decision table and the predicate over it
// ---------------------------------------------------------------------------

export function classifyByType(
	ruleType: Rule<'evaluate'>['type'],
	anyChildNonterminal: boolean
): 'terminal' | 'nonterminal' {
	switch (ruleType) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
			/* No separate ENUM case: enum-shaped ChoiceRules are classified under
			   the CHOICE arm below. */
			return 'nonterminal';
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			/* Unconditionally nonterminal: a choice is a single union slot
			   (literal-only = enum); a repeat captures a variable-length sequence
			   (array slot) even when its content is terminal. */
			return 'nonterminal';
		case STRING:
		/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
		   variant. */
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'terminal';
		case TOKEN:
		case FIELD:
		case ALIAS:
		case SEQ:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		/* PREC family is stripped by evaluate.ts's `stripPrecedenceWrappers`
		   before this runs — see that function's doc comment — so these
		   cases are unreachable at runtime. Transparent single-child wrapper,
		   same as TOKEN/FIELD above. String literals (not rule-types.ts
		   consts): that module is deprecated for new imports — see its
		   header. */
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		/* IMMEDIATE_TOKEN is folded into TOKEN+immediate by evaluate.ts's
		   `normalizeImmediateTokens` before this runs — unreachable at
		   runtime, transparent single-child wrapper like TOKEN. */
		case 'IMMEDIATE_TOKEN':
			return anyChildNonterminal ? 'nonterminal' : 'terminal';
		default:
			return assertNever(ruleType);
	}
}

export function isNonterminalRuleType<Phase extends PhaseName>(rule: Rule<Phase>): boolean {
	const anyChildNonterminal = ruleChildren(rule).some((child) => isNonterminalRuleType(child));
	return classifyByType(rule.type, anyChildNonterminal) === 'nonterminal';
}

function ruleChildren<Phase extends PhaseName>(rule: Rule<Phase>): readonly Rule<Phase>[] {
	/* Narrow via AnyRule, cast back — children share the parent's phase by
	   construction. Exhaustive over every AnyRule variant (no default
	   fallthrough) so a newly added rule type fails compilation here instead
	   of silently contributing no children — see classifyByType's own
	   exhaustive switch for the sibling convention. */
	const anyRule = rule as AnyRule;
	switch (anyRule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		/* PREC family: stripped before this runs (see classifyByType's PREC
		   comment) — unreachable at runtime, transparent single-child
		   wrapper for exhaustiveness. */
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
			   variant. */
			return [anyRule.content as Rule<Phase>];
		case SEQ:
			return anyRule.members as Rule<Phase>[];
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			/* Unconditionally nonterminal per classifyByType — these children
			   never actually feed a classification decision — but returned for
			   real (not `[]`) so `ruleChildren` stays structurally honest about
			   what each rule type's children are. */
			return (anyRule.type === CHOICE ? anyRule.members : [anyRule.content]) as Rule<Phase>[];
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case STRING:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			/* Genuinely childless: SYMBOL/PATTERN/STRING/INDENT/DEDENT/NEWLINE are
			   leaves; SUPERTYPE's `subtypes` are kind-name strings, not
			   Rule<Phase> nodes. */
			return [];
		default:
			return assertNever(anyRule);
	}
}

// ---------------------------------------------------------------------------
// Rule-shape predicates on the phase-typed `Rule` union
// ---------------------------------------------------------------------------

export function isEnumChoiceRule<R extends AnyRule>(
	rule: R
): rule is Extract<R, { type: typeof CHOICE }> & { readonly __enumShaped?: never } {
	return (
		rule.type === CHOICE &&
		rule.members.length >= 2 &&
		// STRING members and literal-carrying link SYMBOLs (`isLinkSymbol`,
		// canonicalized operators AND aliased fixed-text externals like
		// `automatic_semicolon`) are both terminal-valued — `literalTextOf`
		// serves both shapes uniformly downstream.
		rule.members.every((m) => m.type === STRING || (m.type === SYMBOL && m.literal !== undefined))
	);
}

/**
 * A nested `seq` member carrying none of its own `fieldName`/`separator`/
 * `multiplicity` is structurally redundant — its members are siblings of
 * whatever else shares the parent seq, not a cardinality-carrying unit — and
 * splices (flattens) into the parent rather than surviving as its own
 * nesting level. `seq` applies it at construction (simplify's `buildSeq`), so
 * every derivation of "does this nested seq need to stay nested" agrees.
 */
export function isSpliceableBareSeq(rule: {
	readonly type: string;
	readonly fieldName?: unknown;
	readonly separator?: unknown;
	readonly multiplicity?: unknown;
}): boolean {
	return (
		rule.type === SEQ && rule.fieldName === undefined && rule.separator === undefined && rule.multiplicity === undefined
	);
}
import type { DelimiterMode } from '../types/rule.ts';
import { ruleKey } from './shared.ts';

interface SeparatorFact {
	readonly value: RuntimeRule;
	readonly trailing?: DelimiterMode;
	readonly leading?: DelimiterMode;
}

export function separatorFactsEqual(a: SeparatorFact | undefined, b: SeparatorFact | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.trailing === b.trailing && a.leading === b.leading && rulesEqual(a.value, b.value);
}

export function rulesEqual(a: RuntimeRule, b: RuntimeRule): boolean {
	return ruleKey(a) === ruleKey(b);
}

export function leadingLiteralOf(r: RuntimeRule): string | null {
	if (!typeEq(r.type, 'CHOICE')) return null;
	const members = ((r as { members?: RuntimeRule[] }).members ?? []) as RuntimeRule[];
	const lit = members.find((m) => typeEq(m.type, 'STRING'));
	return lit ? ((lit as { value?: unknown }).value as string) : null;
}

export function separatorOf<R extends RuntimeRule>(
	resolved: R
): { content: R; separator: R; trailing?: boolean } | null {
	if (!typeEq(resolved.type, 'SEQ')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstIsStr = typeEq(first.type, 'STRING');
	const secondIsStr = typeEq(second.type, 'STRING');

	// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
	if (firstIsStr && !secondIsStr) return { content: second, separator: first };
	if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };

	// Choice-of-separators in the separator position — preserve the FULL
	// choice; the caller (and everything downstream, per PR-S) now knows how
	// to handle a non-literal separator rule. No literal-presence check here
	// by design: a choice with zero STRING arms (all-symbol/external-scanner)
	// still counts as a detected separator shape — it's up to the caller to
	// decide what to do when it can't extract a literal from it.
	const firstIsChoice = typeEq(first.type, 'CHOICE');
	const secondIsChoice = typeEq(second.type, 'CHOICE');
	if (firstIsChoice && !secondIsStr) return { content: second, separator: first };
	if (secondIsChoice && !firstIsStr) return { content: first, separator: second, trailing: true };

	return null;
}

// ---------------------------------------------------------------------------
// Group classification
// ---------------------------------------------------------------------------
/**
 * Group classification — shared predicates for inline-safe vs inline-unsafe
 * group classification.
 *
 * **Scope: DSL layer only.** Uses `runtime-shapes.ts` predicates so these
 * work on both sittir and tree-sitter-CLI rule forms (dual-RUNTIME, not
 * dual-case — both runtimes agree on UPPERCASE discriminants).
 *
 * Two exported functions, used by enrich (hoist decision) and, later, the
 * wire pass:
 *
 *   • `ruleMatchesEmpty(rule)` — conservative: returns true iff the rule can
 *     produce the empty string. Guards both the inline-safe hoist and the
 *     inline-unsafe alias paths: tree-sitter rejects named rules (and aliases)
 *     that match the empty string.
 *
 *   • `isInlineSafe(seqBody)` — true iff the seq body reduces to exactly ONE
 *     slot that is a `field` or `symbol` (NOT a bare `choice`) after dropping
 *     pure literals/punctuation and `blank`. The inline+gate render path can
 *     key on that single slot; multi-slot or bare-choice bodies need to be
 *     visible (their own AssembledGroup template).
 */

export function ruleMatchesEmpty(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t) || isPlainRepeatType(t) || isBlankType(t)) return true;

	if (typeEq(t, 'REPEAT1')) {
		return ruleMatchesEmpty(r.content);
	}

	if (isSeqType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length === 0) return true;
		return members.every((m) => ruleMatchesEmpty(m));
	}

	if (typeEq(t, 'CHOICE')) {
		const members = r.members;
		if (!Array.isArray(members)) return false;
		return members.some((m) => ruleMatchesEmpty(m));
	}

	if (isFieldType(t) || isPrecWrapper(r as { type: string })) {
		return ruleMatchesEmpty(r.content);
	}

	if (isStringType(t) || isSymbolType(t) || typeEq(t, 'TOKEN') || typeEq(t, 'PATTERN')) return false;

	return false;
}

function isPlainRepeatType(t: string): boolean {
	return t === 'REPEAT';
}

function collectSlots(members: unknown[], rulesBag?: Record<string, unknown>): unknown[] {
	const slots: unknown[] = [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const r = m as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';

		if (isStringType(t) || typeEq(t, 'TOKEN') || isBlankType(t)) continue;

		/* Drop a SYMBOL slot that resolves to no rule body in `rulesBag` — a
		   structural/external scanner token (indent/dedent/newline-role and
		   similar), not content. Without this, e.g. python's `_suite` middle
		   arm `seq($._indent, $.block)` counts as TWO slots (`_indent`,
		   `block`) instead of one, wrongly classifying it inline-UNSAFE and
		   minting a group that fragments `_suite`'s otherwise-uniform `block`
		   output across its three choice arms. `rulesBag` is optional
		   (existing test-only call sites pass none) — omitting it preserves
		   the permissive counting that ignores this distinction. */
		if (rulesBag && isSymbolType(t)) {
			const name = typeof r.name === 'string' ? r.name : undefined;
			if (name !== undefined && !(name in rulesBag)) continue;
		}

		slots.push(m);
	}
	return slots;
}

function unwrapPrec(rule: unknown): unknown {
	let cur = rule;
	while (cur && typeof cur === 'object') {
		const r = cur as Record<string, unknown>;
		if (isPrecWrapper(r as { type: string })) {
			cur = r.content;
		} else {
			break;
		}
	}
	return cur;
}

function isRepeatLike(t: string): boolean {
	return isRepeatType(t) || typeEq(t, 'REPEAT1');
}

function flattenSeqMembers(members: unknown[]): unknown[] {
	const out: unknown[] = [];
	for (const m of members) {
		const core = unwrapPrec(m);
		if (core && typeof core === 'object') {
			const ct = (core as Record<string, unknown>).type;
			const inner = (core as Record<string, unknown>).members;
			if (typeof ct === 'string' && isSeqType(ct) && Array.isArray(inner)) {
				out.push(...flattenSeqMembers(inner));
				continue;
			}
		}
		out.push(m);
	}
	return out;
}

function seqHasTopLevelRepeat(members: unknown[]): boolean {
	for (const m of flattenSeqMembers(members)) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct === 'string' && isRepeatLike(ct)) return true;
	}
	return false;
}

function isNonterminalSeparatorType(t: string): boolean {
	return isChoiceType(t) || isSymbolType(t) || typeEq(t, 'PATTERN');
}

function repeatHasNonterminalSeparator(repeatRule: RuntimeRule): boolean {
	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = separatorOf(content as RuntimeRule);
	if (!detected) return false;
	return isNonterminalSeparatorType(detected.separator.type);
}

function isOptionalSeparatorFlank(member: unknown, sepValue: string): boolean {
	if (!member || typeof member !== 'object') return false;
	const r = member as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t)) {
		const content = r.content;
		if (!content || typeof content !== 'object') return false;
		const cr = content as Record<string, unknown>;
		return isStringType(typeof cr.type === 'string' ? cr.type : '') && cr.value === sepValue;
	}

	if (isChoiceType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length !== 2) return false;
		const hasBlank = members.some(
			(m) => m && typeof m === 'object' && isBlankType((m as Record<string, unknown>).type as string)
		);
		const hasMatchingLiteral = members.some(
			(m) =>
				m &&
				typeof m === 'object' &&
				isStringType(
					typeof (m as Record<string, unknown>).type === 'string' ? ((m as Record<string, unknown>).type as string) : ''
				) &&
				(m as Record<string, unknown>).value === sepValue
		);
		return hasBlank && hasMatchingLiteral;
	}

	return false;
}

function repeatMemberHasGenuineSeparatorVariability(repeatRule: RuntimeRule, siblings: unknown[]): boolean {
	if (repeatHasNonterminalSeparator(repeatRule)) return true;

	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = separatorOf(content as RuntimeRule);
	if (!detected || !isStringType(detected.separator.type)) return false;
	const sepValue = (detected.separator as unknown as { value?: unknown }).value;
	if (typeof sepValue !== 'string') return false;

	return siblings.some((m) => m !== repeatRule && isOptionalSeparatorFlank(m, sepValue));
}

function repeatHasGenuineSeparatorVariability(repeatRule: RuntimeRule): boolean {
	return repeatHasNonterminalSeparator(repeatRule);
}

function seqHasGenuineSeparatorVariability(members: unknown[]): boolean {
	const flat = flattenSeqMembers(members);
	const repeatMembers: RuntimeRule[] = [];
	for (const m of flat) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct !== 'string' || !isRepeatLike(ct)) continue;
		const content = (core as { content?: unknown }).content;
		if (content && typeof content === 'object' && separatorOf(content as RuntimeRule) !== null) {
			repeatMembers.push(core as RuntimeRule);
		}
	}
	if (repeatMembers.length !== 1) return false;
	return repeatMemberHasGenuineSeparatorVariability(repeatMembers[0]!, flat);
}

export function isInlineSafe(seqBody: unknown, rulesBag?: Record<string, unknown>): boolean {
	if (!seqBody || typeof seqBody !== 'object') return false;
	const r = seqBody as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	/* Bare `repeat`/`repeat1` body — a LIST is one flat slot (e.g.
	   `formal_parameters = repeat1(parameter, SEP)`, `class_body`, `enum_body`).
	   Like the separated-list seq shape below, aliasing a bare repeat makes
	   tree-sitter DISTRIBUTE the alias across every element (one alias node
	   per element) instead of one group → array-of-siblings → empty render.
	   A list stays INLINE-FLAT (one list slot); only genuine co-optional
	   groups (a bare `choice`, e.g. rust `visibility_modifier`) take the
	   visible-alias path.

	   EXCEPT when the repeat has genuine per-instance separator variability
	   (a non-literal separator rule) — such a list can't render from one
	   fixed separator string on the inline-flat path and needs its own
	   visible `AssembledSeparatedList` template instead. See
	   `repeatHasGenuineSeparatorVariability`. */
	if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody as RuntimeRule);

	/* A bare `alias(content, $.name)` body is ALSO one flat slot — the alias
	   already gives the position its OWN kind identity (whatever `.value`
	   names), producing exactly one CST node regardless of how complex
	   `content` is internally. Minting a second wrapper kind around it is
	   redundant (and wrong — the mint's synthesized template doesn't know
	   about the alias's own relabeling, e.g. rust's `_type` choice arm
	   `alias($.identifier, $.type_identifier)`: promoting the arm's owning
	   hidden rule produced a template referencing `type_identifier` while the
	   derived slot model expected the arm's OWN field name — a
	   slot-preservation crash, not a naming collision). */
	if (typeEq(t, 'ALIAS')) return true;

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	/* A body containing a (possibly nested) top-level `repeat`/`repeat1` is a
	   LIST → render flat, NOT a co-optional group. This generalizes the
	   separated-list guard below: the list's repeat is frequently nested
	   inside an inner seq — `commaSep1` desugars to
	   `seq(seq(E, repeat(seq(SEP, E))), optional(SEP))`, so the repeat is two
	   levels down (where_clause / formal_parameters / enum_body /
	   list_pattern) — or sits beside a trailing element
	   (`seq(repeat(E), field(last))`, e.g. rust `match_block`). Aliasing any
	   of these makes tree-sitter distribute the alias across each element
	   (array-of-siblings → "not an array" AST mismatch). Only genuine groups
	   with NO repeat (a bare `choice`, e.g. rust `visibility_modifier`;
	   python `slice`) take the visible-alias path. Safe by construction:
	   declining to mint reverts the kind to inline (floor) behavior, which
	   cannot regress below floor.

	   EXCEPT when the top-level repeat has genuine per-instance separator
	   variability (a non-literal separator, or an adjacent stranded
	   optional/choice-of-blank separator flank sibling in this same seq) —
	   see `seqHasGenuineSeparatorVariability`. Such a list falls through to
	   the visible-promotion path below, same as a multi-slot/bare-choice
	   body. */
	if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members);

	const slots = collectSlots(members, rulesBag);

	if (slots.length !== 1) return false;

	/* The single slot must be a field or symbol (not a bare choice, repeat,
	   etc.). Descend through prec wrappers only — a field slot is itself
	   field-typed and is already inline-safe; descending into it would
	   expose its content (possibly a choice), which would incorrectly
	   classify the slot as unsafe. */
	const core = unwrapPrec(slots[0]);
	if (!core || typeof core !== 'object') return false;
	const coreType = (core as Record<string, unknown>).type;
	if (typeof coreType !== 'string') return false;

	return isFieldType(coreType) || isSymbolType(coreType);
}

export function isSupertypeLike(body: unknown): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length === 0) return false;
	/* Member compatibility mirrors link's `classifyHiddenChoiceRule` supertype
	   test (SYMBOL / named alias / enum-or-string): each such arm
	   materializes its OWN node (or token) at parse time, so the choice as a
	   whole stays a pure dispatch point. A named ALIAS arm (e.g.
	   tree-sitter-rust's aliased `u8|i8|…` primitive enum inside
	   `_expression_except_range`) is as dispatchable as a bare symbol ref. */
	return members.every((m) => {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') return false;
		const c = core as Record<string, unknown>;
		const coreType = c.type;
		if (typeof coreType !== 'string') return false;
		if (isSymbolType(coreType) || isStringType(coreType)) return true;
		if (typeEq(coreType, 'ALIAS')) return c.named === true;
		return false;
	});
}

/** Permutable-modifier choice (same atom set per arm, order/optionality
 *  delta only) — callers decline the arm mint; full contract in
 *  docs/glossary/dsl.md. */
export function isPermutationChoice(
	body: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members)) return false;
	const arms = members.filter(
		(m) => m && typeof m === 'object' && !isBlankType(((m as { type?: string }).type ?? '') as string)
	);
	if (arms.length < 2) return false;
	const keySets: Set<string>[] = [];
	for (const arm of arms) {
		const keys = permutationArmSlotKeys(arm, rulesBag, kwRules, wordMatcher);
		if (keys === null) return false;
		keySets.push(keys);
	}
	const first = keySets[0]!;
	if (!keySets.every((s) => s.size === first.size && [...s].every((k) => first.has(k)))) return false;
	/* Byte-identical arms are not a permutation delta — require at least two
	   structurally distinct arms so plain duplicated alternatives keep their
	   existing handling. */
	return new Set(arms.map((a) => JSON.stringify(a))).size >= 2;
}

/** Per-arm atom-key set for `isPermutationChoice`; null = arm ineligible. */
function permutationArmSlotKeys(
	arm: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): Set<string> | null {
	const core = unwrapPrec(arm);
	if (!core || typeof core !== 'object') return null;
	const t = (core as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isSeqType(t)) return null;
	const members = (core as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length < 2) return null;
	const keys = new Set<string>();
	for (const member of members) {
		const key = permutationAtomKey(member, rulesBag, kwRules, wordMatcher);
		if (key === null || keys.has(key)) return null;
		keys.add(key);
	}
	return keys;
}

/**
 * Identity key for one permutation-arm step: a word-shaped keyword literal
 * (raw, `_kw_*`-promoted, or marker-fielded — all key to the literal) or a
 * symbol ref (keyed by name). Optionality and field wrappers are peeled —
 * they are the permutation delta, not the atom identity. Anything else
 * (repeat, nested seq, non-optional choice) disqualifies the arm.
 */
function permutationAtomKey(
	member: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): string | null {
	let core: unknown = unwrapPrec(member);
	let fieldName: string | undefined;
	for (;;) {
		if (!core || typeof core !== 'object') return null;
		const r = core as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';
		if (isFieldType(t)) {
			// Keep the OUTERMOST authored field name — it is slot identity;
			// two arms fielding the same symbol under different names are
			// distinct slots, not a permutation.
			if (fieldName === undefined && typeof r.name === 'string') fieldName = r.name;
			core = unwrapPrec(r.content);
			continue;
		}
		if (isOptionalType(t)) {
			core = unwrapPrec(r.content);
			continue;
		}
		if (isChoiceType(t)) {
			const ms = r.members;
			if (Array.isArray(ms) && ms.length === 2) {
				const blankIdx = ms.findIndex(
					(m) => m && typeof m === 'object' && isBlankType(((m as { type?: string }).type ?? '') as string)
				);
				if (blankIdx !== -1) {
					core = unwrapPrec(ms[1 - blankIdx]);
					continue;
				}
			}
			return null;
		}
		break;
	}
	const r = core as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';
	/* A generated `<literal>_marker` field is the keyword-promotion spelling
	   of the same literal — collapse it so a raw keyword in one arm keys
	   equal to its promoted sibling. Any other field name is authored slot
	   identity and stays in the key. */
	const keyed = (lit: string | null, fallback: string): string => {
		if (lit !== null && (fieldName === undefined || fieldName === `${lit}_marker`)) return `lit:${lit}`;
		const bare = lit !== null ? `lit:${lit}` : fallback;
		return fieldName === undefined ? bare : `field:${fieldName}=${bare}`;
	};
	if (isStringType(t)) {
		const v = r.value;
		if (typeof v !== 'string' || !matchesWordShape(v, wordMatcher)) return null;
		return keyed(v, '');
	}
	if (isSymbolType(t)) {
		const name = typeof r.name === 'string' ? r.name : undefined;
		if (name === undefined) return null;
		const resolved = resolveRuleLiteral(kwRules?.[name] ?? rulesBag?.[name]);
		return keyed(resolved, `sym:${name}`);
	}
	return null;
}

/** Literal text of a keyword-shaped rule body (STRING, possibly TOKEN- or
 *  prec-wrapped), else null. */
function resolveRuleLiteral(body: unknown): string | null {
	const core = unwrapPrec(body);
	if (!core || typeof core !== 'object') return null;
	const r = core as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';
	if (typeEq(t, 'TOKEN')) return resolveRuleLiteral(r.content);
	if (isStringType(t)) return typeof r.value === 'string' ? r.value : null;
	return null;
}

// ---------------------------------------------------------------------------
// Self-referential chain fold
// ---------------------------------------------------------------------------

/**
 * Tree-sitter's prec.left self-referential-choice flattening: a hidden
 * CHOICE rule whose arms are all 3-member SEQs
 * `[field(base), STRING(separator), field(extension)]` with the SAME
 * (base, extension) field-name pair and separator literal across every
 * arm, where at least one arm's base field is a bare (non-alias-wrapped)
 * hidden SYMBOL reference to THIS rule's own name. Tree-sitter's LR table
 * collapses the recursion into ONE FLAT node at parse time: the base field
 * stays singular — only the true base operand carries it, since inner
 * recursive occurrences dissolve into siblings and the leftover separator
 * tokens are anonymous so the reader drops them — while the extension field
 * repeats once per additional chained operand. No wrapper shape and no
 * node-types.json entry can see this: the multiplicity is an emergent
 * property of LR precedence-climbing over a self-referential choice.
 * Confirmed case: rust's `_let_chain` (`a && b && c && d` parses as one
 * node with a single `left` and a repeated `right`).
 *
 * Only meaningful at the TOP of a named rule's own body: the self-reference
 * check requires the SYMBOL's name to equal the rule being processed, so a
 * nested CHOICE inside some OTHER rule's body can never coincidentally match.
 */
export function selfReferentialFoldOf(
	name: string,
	rule: Rule<'link'>
): { extensionFieldName: string; separator: Rule<'link'> } | undefined {
	if (rule.type !== CHOICE) return undefined;
	let baseFieldName: string | undefined;
	let extensionFieldName: string | undefined;
	let separator: Rule<'link'> | undefined;
	let sawSelfRef = false;
	const isSelfRef = (content: Rule<'link'>): boolean =>
		content.type === SYMBOL &&
		content.name === name &&
		(content as { hidden?: boolean }).hidden === true &&
		(content as { aliasedFrom?: string }).aliasedFrom === undefined;
	for (const arm of rule.members) {
		if (arm.type !== SEQ || arm.members.length !== 3) return undefined;
		const m0 = arm.members[0];
		const sep = arm.members[1];
		const m2 = arm.members[2];
		if (m0 === undefined || sep === undefined || m2 === undefined) return undefined;
		if (m0.type !== FIELD || m2.type !== FIELD || sep.type !== STRING) return undefined;
		if (baseFieldName === undefined) {
			baseFieldName = m0.name;
			extensionFieldName = m2.name;
		} else if (m0.name !== baseFieldName || m2.name !== extensionFieldName) {
			return undefined;
		}
		if (separator === undefined) separator = sep;
		else if (separator.type !== STRING || separator.value !== sep.value) return undefined;
		if (isSelfRef(m0.content)) sawSelfRef = true;
		else if (isSelfRef(m2.content)) return undefined; // self-ref on the extension side — bail, don't guess
	}
	if (!sawSelfRef || extensionFieldName === undefined || separator === undefined) return undefined;
	return { extensionFieldName, separator };
}
