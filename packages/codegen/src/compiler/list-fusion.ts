/**
 * compiler/list-fusion.ts — fuse a separated-list's head + repeat occurrences
 * into a single multi-valued slot.
 *
 * tree-sitter grammars author `sepBy1`/`commaSep1` lists in shapes that
 * `liftCommaSep` (evaluate) does not always collapse — notably when a choice
 * arm is an alias (`argument_list`) or the trailing separator lives in a
 * choice (`pattern_list`). After wrapper-deletion those survive as a HEAD
 * element (single) plus a REPEAT of the same element (array), e.g.
 *
 *   argument_list: seq{opt}( choice(U), choice(U){array, sep:','} )
 *   pattern_list:  seq( pattern, choice(',', pattern{nonEmptyArray, sep}) )
 *
 * The legacy template-walker fused these at walk time via `repeatedFields`
 * (template-walker.ts) — head occurrences of a name that also appears inside
 * a repeat were marked multi. The parallel-Rule-types emitter + slot deriver
 * don't walk that way, so the fusion must be a canonical-shape pass producing
 * ONE multi slot. This module is that pass, shared by both the renderRule
 * producer (the emitter's input) and the simplify pipeline (the deriver's
 * input) so the two views agree.
 *
 * Two idioms are recognized inside a `seq` (after recursing children):
 *
 *   A. adjacent `[E, E{array|nonEmptyArray, sep?}]` where the two elements are
 *      structurally identical ignoring leaf attributes → fuse to the array E.
 *   B. `[E, choice(sepString, E{array|nonEmptyArray, sep?})]` → fuse to the
 *      array E, taking the choice's separator string as the trailing separator
 *      when the array arm carries none.
 *
 * In both cases the head's single occurrence is absorbed into the multi slot.
 */

import { ALIAS, CHOICE, ENUM, FIELD, GROUP, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL, TOKEN, VARIANT } from './rule-types.ts'; // @rule-type-consts
import type { Rule, SeqRule } from './rule.ts';

type Mult = 'optional' | 'array' | 'nonEmptyArray' | undefined;

const isArrayMult = (m: Mult): boolean => m === 'array' || m === 'nonEmptyArray';

/**
 * Structural identity of two slot-bearing rules ignoring leaf attributes
 * (multiplicity / separator / fieldName / aliasedFrom). Used to decide that a
 * head element and a repeat element are "the same list element".
 */
function sameSlotShape(a: Rule, b: Rule): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case SYMBOL:
			return a.name === (b as typeof a).name && a.aliasedFrom === (b as typeof a).aliasedFrom;
		case STRING:
		case PATTERN:
			return a.value === (b as typeof a).value;
		case CHOICE: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		case SEQ: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		case ENUM: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => m.value === bm[i]!.value);
		}
		default:
			return false;
	}
}

/** Extract a separator string from a `separator` leaf attribute (string or object form). */
function separatorString(sep: Rule['separator']): string | undefined {
	if (typeof sep === 'string') return sep;
	if (sep && typeof sep === 'object' && !Array.isArray(sep)) {
		const rules = (sep as { rules?: readonly Rule[] }).rules;
		const first = rules?.[0];
		if (first && first.type === STRING) return first.value;
	}
	return undefined;
}

/**
 * If `head` + `next` form a head+repeat list pair, return the fused multi
 * element; otherwise `null`.
 */
function tryFusePair(head: Rule, next: Rule | undefined): Rule | null {
	if (!next) return null;
	const headMult = (head as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(headMult)) return null; // head is already multi — not a head+repeat pair

	// Idiom A: [E, E{array}]
	const nextMult = (next as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(nextMult) && sameSlotShape(head, next)) {
		return next; // the array element absorbs the single head occurrence
	}

	// Idiom B: [E, choice(sepString, E{array})]
	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === 'string');
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: Rule['separator'] }).separator;
			if (repSep !== undefined) return repArm;
			// Fall back to the choice's separator-string arm, marking trailing.
			const sepStr = (sepArm as { value: string }).value;
			return {
				...repArm,
				separator: { rules: [{ type: 'string', value: sepStr }], trailing: true }
			} as Rule;
		}
	}

	return null;
}

/** Recurse `fn` into a rule's structural children. */
function recurseChildren(rule: Rule, fn: (r: Rule) => Rule): Rule {
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return { ...rule, members: (rule as { members: Rule[] }).members.map(fn) } as Rule;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return { ...rule, content: fn((rule as { content: Rule }).content) } as Rule;
		default:
			return rule;
	}
}

/**
 * Fuse head+repeat separated-list pairs into a single multi slot, recursively.
 * Behaviour-preserving everywhere else — non-seq rules and seqs without the
 * head+repeat shape pass through unchanged (reference-identical when no fusion
 * applies).
 */
export function fuseHeadRepeatLists(rule: Rule): Rule {
	const recursed = recurseChildren(rule, fuseHeadRepeatLists);
	if (recursed.type !== SEQ) return recursed;
	const members = (recursed as SeqRule).members;
	const out: Rule[] = [];
	let changed = false;
	for (let i = 0; i < members.length; i++) {
		const fused = tryFusePair(members[i]!, members[i + 1]);
		if (fused) {
			out.push(fused);
			i++; // consume the repeat member too
			changed = true;
			continue;
		}
		out.push(members[i]!);
	}
	if (!changed) return recursed;
	return { ...recursed, members: out } as Rule;
}
