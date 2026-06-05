/**
 * compiler/lift-separators.ts — separated-list separator LIFT, as a link pass.
 *
 * This is the TRANSFORM half of separated-list handling (the DETECTION half
 * lives in `dsl/list-patterns.ts`). It rewrites the raw shapes tree-sitter
 * authors write —
 *
 *   - `repeat(seq(SEP, X))`              → `repeat{ content: X, separator: SEP }`
 *   - `seq(X, repeat(seq(SEP, X)))`      → `repeat1{ content: X, separator: SEP }`  (commaSep1)
 *   - `seq(…, repeat{SEP}, optional(SEP))` → repeat with `trailing: true`            (absorb)
 *
 * — into one canonical repeat node carrying `separator` / `leading` / `trailing`
 * markers, so downstream passes see a single shape instead of five nested rules.
 *
 * **Why a link pass (not the evaluate constructors).** The lift used to run
 * inside `seq()`/`repeat()`/`repeat1()` at DSL-call time. That fires while the
 * grammar is still being assembled, before wire/override callbacks and before
 * enrich's injected group rules exist — so author callbacks see the un-lifted
 * shape, and enrich-injected lists never get lifted at all. Running the lift in
 * link (sittir-internal, post-wire, post-enrich-injection) fixes both: every
 * separated list, authored or synthesized, is lifted from one place.
 *
 * **Pre-pushdown.** Like all list/separator handling, this runs only while the
 * wrappers are intact (link is pre-wrapper-deletion). The detection primitives
 * it calls (`detectRepeatSeparator`) enforce the same contract.
 *
 * **Idempotent.** Re-running over an already-lifted tree is a no-op: a lifted
 * `repeat{SEP}` has a bare (non-seq) content, so `detectRepeatSeparator` finds
 * nothing; a commaSep1 already collapsed to `repeat1` is no longer a seq. This
 * lets the pass be introduced while the constructors still lift (a no-op),
 * then take over once the constructor lift is removed.
 */

import { SEQ, CHOICE, OPTIONAL, REPEAT, REPEAT1, FIELD, TOKEN, ALIAS, STRING } from './rule-types.ts';
import type { Rule, RepeatRule, Repeat1Rule, SeqRule } from './rule.ts';
import { detectRepeatSeparator, rulesEqual } from '../dsl/list-patterns.ts';

/**
 * Merge adjacent `repeat`/`repeat1`(with separator) + `optional(sepLit)` pairs
 * inside a seq's member list by stamping `trailing: true` on the repeat and
 * dropping the optional. Returns the new member array if anything merged, else
 * `null`.
 */
export function absorbTrailingSeparator(members: Rule[]): Rule[] | null {
	let changed = false;
	const out: Rule[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const isSepRepeat = (cur.type === REPEAT || cur.type === REPEAT1) && cur.separator !== undefined && !cur.trailing;
		const isOptionalSepLit = (r: Rule | undefined, sep: string): boolean =>
			!!r && r.type === OPTIONAL && r.content.type === STRING && r.content.value === sep;
		if (isSepRepeat && isOptionalSepLit(next, (cur as RepeatRule | Repeat1Rule).separator!)) {
			out.push({ ...(cur as RepeatRule | Repeat1Rule), trailing: true });
			i++;
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}

/**
 * Detect the `commaSep1` family inside a seq's member list and lift it to a
 * single `repeat1` node with `separator` plus optional `leading` / `trailing`
 * markers. Returns `null` if no lift applies. Relies on the inner
 * `repeat(seq(sep, x))` already carrying a lifted `separator` — guaranteed
 * when this runs bottom-up (children lifted first).
 */
export function liftCommaSep(members: Rule[]): Rule | null {
	if (members.length < 2 || members.length > 3) return null;

	const repeatIdx = findRepeatWithSeparator(members);
	if (repeatIdx === -1) return null;
	const repeatNode = members[repeatIdx] as RepeatRule;
	const sep = repeatNode.separator!;
	const elem = repeatNode.content;

	const matchesElem = (r: Rule): boolean => rulesEqual(r, elem);
	const matchesOptionalSep = (r: Rule): boolean =>
		r.type === OPTIONAL && r.content.type === STRING && r.content.value === sep;

	// Case 1: [x, repeat(sep, x)]
	if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
		return { type: REPEAT1, content: elem, separator: sep };
	}
	// Case 2: [x, repeat(sep, x), optional(sep)] — trailing allowed.
	if (members.length === 3 && repeatIdx === 1 && matchesElem(members[0]!) && matchesOptionalSep(members[2]!)) {
		return { type: REPEAT1, content: elem, separator: sep, trailing: true };
	}
	// Case 3: [sep, x, repeat(sep, x)] — leading separator.
	if (
		members.length === 3 &&
		repeatIdx === 2 &&
		members[0]!.type === STRING &&
		members[0]!.value === sep &&
		matchesElem(members[1]!)
	) {
		return { type: REPEAT1, content: elem, separator: sep, leading: true };
	}
	return null;
}

/**
 * Locate the unique repeat-with-separator member in a seq's member list, or
 * `-1` when there is zero or more than one (not a commaSep shape).
 */
function findRepeatWithSeparator(members: Rule[]): number {
	return members.findIndex((m) => m.type === REPEAT && m.separator !== undefined);
}

/**
 * Lift a seq's member list: try the `commaSep1` collapse first, then trailing-
 * separator absorption, else keep the seq unchanged. When the seq survives, the
 * original node is preserved via spread so its `id` / `fieldName` / `metadata`
 * (assigned by the time this runs in link — unlike at evaluate-construction
 * time) are NOT dropped. A `commaSep1` collapse to `repeat1` carries the seq's
 * own modifier attributes onto the replacement, since the repeat takes the
 * seq's structural position.
 */
function liftSeqMembers(seq: SeqRule, members: Rule[]): Rule {
	const lifted = liftCommaSep(members);
	if (lifted) return { ...carrySeqAttrs(seq), ...lifted };
	const absorbed = absorbTrailingSeparator(members);
	return { ...seq, members: absorbed ?? members };
}

/** Pick the position-carried modifier attrs a seq passes to a repeat that
 *  replaces it (id/fieldName/multiplicity/nonterminal/metadata) — NOT `members`. */
function carrySeqAttrs(seq: SeqRule): Partial<SeqRule> {
	const { members: _members, ...rest } = seq;
	return rest;
}

/**
 * Lift every separated list in a rule tree, bottom-up. Children are lifted
 * first so an inner `repeat(seq(sep, x))` carries its separator before the
 * enclosing seq's commaSep1 detection runs — the same order the evaluate
 * constructors produced by lifting inner-to-outer at call time.
 */
export function liftSeparators(rule: Rule): Rule {
	switch (rule.type) {
		case SEQ:
			return liftSeqMembers(rule, rule.members.map(liftSeparators));
		case CHOICE:
			return { ...rule, members: rule.members.map(liftSeparators) };
		case REPEAT:
		case REPEAT1: {
			const content = liftSeparators(rule.content);
			const sep = detectRepeatSeparator(content);
			if (sep) return { ...rule, content: sep.content, separator: sep.separator, trailing: sep.trailing };
			return { ...rule, content };
		}
		case OPTIONAL:
		case FIELD:
		case TOKEN:
		case ALIAS:
			return { ...rule, content: liftSeparators(rule.content) };
		default:
			// Leaves (symbol/string/pattern/enum) and node shapes that do not
			// exist yet at lift time (group/variant/terminal/polymorph appear
			// only after the later link classification passes).
			return rule;
	}
}
