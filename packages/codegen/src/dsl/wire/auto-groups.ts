/**
 * dsl/wire/auto-groups.ts — auto-group-synthesis for nested seq content
 * inside optional / repeat / repeat1 wrappers.
 *
 * SCOPE: synthesis only — creates a hidden helper rule + a symbol-ref
 * replacement in the parent body. Mechanism identical to authored
 * `groups:` synthesis (the path-mode case), which is why this pass
 * lives in wire and runs AFTER the authored path has had its chance.
 *
 * EXPLICITLY OUT OF SCOPE: decomposition. This pass does NOT touch
 *   - `separator` / `trailing` / `leading` metadata on existing Rule
 *     objects (separator-lift)
 *   - any other shape-rewriting on existing Rule objects
 * Those concerns operate on sittir's internal Rule-object copy and
 * belong in link or evaluate, not here. The prior conflation
 * (`auto-decompose.ts`) caused the renderer-reads-separator-on-all-
 * repeats regression — keeping the two concerns separate avoids it.
 *
 * Trigger — strictly seq content:
 *
 *   optional(seq(...))                                  → synthesize
 *   repeat(seq(...)) / repeat1(seq(...))                → synthesize
 *
 * Everything else (field, choice, symbol, leaf rules, literal-only seqs):
 * pass through untouched. In particular the function-modifier shape
 *
 *   repeat1(field(modifier, choice(async, default, const, unsafe, extern)))
 *
 * does NOT match the trigger — the repeat1's content is a FIELD, not a
 * SEQ — so it is left alone.
 *
 * Naming:
 *   optional → `_<parent_kind>_optional<N>` (per-parent counter, 1-indexed)
 *   repeat / repeat1 → `_<parent_kind>_repeat<N>`
 *
 * Cross-parent dedupe: identical canonical-stringified content reuses the
 * first synthesized name across all parents (matches tree-sitter's
 * `existing_repeats` pattern in rule_transformations.rs).
 *
 * All synthesized rules are hidden (`_` prefix) and registered for
 * automatic inclusion in the grammar's `inline:` list via
 * `WireContext.syntheticInline` (matches the existing `_kw_*` pattern —
 * see MEMORY.md `feedback_synthesized_field_inline_for_lr_precedence`).
 */

import type { Rule } from '../../compiler/rule.ts';
import {
	isSeqType,
	isFieldType,
	isOptionalType,
	isChoiceType,
	isRepeatType,
	isBlankType,
	isPrecWrapper
} from '../runtime-shapes.ts';
import type { WireContext } from './wire.ts';
import type { GrammarResult } from '../enrich.ts';

type RuleFn = (this: unknown, $: unknown, previous?: unknown) => unknown;

interface SynthCounterState {
	opt: number;
	rep: number;
}

/**
 * Apply auto-group-synthesis. Discovery walks the evaluated base-seed
 * rule bodies (`base.grammar.rules`, the Rule-object map tree-sitter uses
 * to *seed* its rule set); for every parent whose `optional(seq(...))` /
 * `repeat(seq(...))` trigger fires, a hidden helper rule is synthesized
 * and the parent body is rewritten to reference it via a SYMBOL ref.
 *
 * CRITICAL — write target is `outRules`, NOT the base seed. tree-sitter's
 * `grammar(base, options)` seeds its rule map from `base.grammar.rules`
 * but then **calls each `options.rules` (= `outRules`) fn and overwrites
 * the seeded entry per-key**. Synthesis output written only to the base
 * seed is therefore bypassed for any rule reachable through the fn path,
 * and unreferenced helpers get pruned from grammar.json (no kindId, no
 * inline membership). Emitting into `outRules` is the same path enrich's
 * per-fn wrapping and wire's polymorph/transform injection use to reach
 * tree-sitter:
 *   - each synthesized helper becomes an `outRules` rule fn returning its
 *     captured content, so tree-sitter evaluates and keeps it;
 *   - each rewritten parent becomes an `outRules` rule fn returning the
 *     SYMBOL-referencing body, so the reference survives the fn-call
 *     overwrite and the helper stays reachable;
 *   - each helper name is registered in `context.syntheticInline` so the
 *     wired `inline:` callback adds it to the grammar's inline list →
 *     tree-sitter inlines it → flat runtime (as intended).
 *
 * Parents already present in `outRules` are author overrides — left
 * untouched so the authored body wins (mirrors `authoredSynthesisKinds`).
 *
 * `authoredSynthesisKinds` is the set of rule kinds the author opted into
 * authored synthesis via `transforms:`, `polymorphs:`, or path-mode
 * `groups:`. Auto-group-synthesis skips those so the path-based machinery
 * sees the rule body the author wrote, not a post-synth shape.
 *
 * No-op when `base` is undefined or carries no rules.
 */
export function applyAutoGroups(
	base: { grammar?: { rules?: Record<string, Rule> }; rules?: Record<string, Rule> } | undefined,
	outRules: Record<string, RuleFn>,
	context: WireContext,
	authoredSynthesisKinds: ReadonlySet<string> = new Set()
): void {
	if (!base) return;
	const hasWrapper = 'grammar' in (base as object) && (base as { grammar?: unknown }).grammar !== undefined;
	const rulesBag = (hasWrapper
		? (base as { grammar?: { rules?: Record<string, Rule> } }).grammar?.rules
		: (base as { rules?: Record<string, Rule> }).rules) as Record<string, Rule> | undefined;
	if (!rulesBag) return;

	// Cross-parent dedupe map — shared across all parents within a single
	// apply call. The first parent to synthesize a given canonical body
	// owns the name; subsequent parents reuse it without consuming a
	// counter slot. Matches tree-sitter's `existing_repeats` pattern.
	const dedupe: Record<string, string> = {};
	// Per-apply hidden-rule bag: synthesized rule bodies accumulate here
	// and are emitted as `outRules` fns after discovery.
	const synthRules: Record<string, Rule> = {};
	// Per-apply parent rewrites: parentKind → rewritten body. Emitted as
	// `outRules` fns after discovery so tree-sitter's fn-call path returns
	// the SYMBOL-referencing body.
	const rewrites: Record<string, Rule> = {};

	for (const name of Object.keys(rulesBag)) {
		// Authored synthesis wins by construction — skip rules the author
		// opted into the structured pipeline via transforms/polymorphs/
		// path-mode groups. Rewriting them would shift the rule tree out
		// from under the path-string patches those mechanisms drive.
		if (authoredSynthesisKinds.has(name)) continue;
		// Author `rules:` overrides must win — the author wrote that body.
		// Test `authoredRuleNames` (the `config.rules` keys), NOT
		// `name in outRules`: body-pattern `groups:` inject a *passthrough*
		// fn for every base rule, so `name in outRules` is true for nearly
		// all rules and would skip everything. Passthroughs just return the
		// base body, so overwriting them with the rewritten body is correct.
		if (context.authoredRuleNames.has(name)) continue;
		const rule = rulesBag[name];
		if (!rule) continue;
		const state: SynthCounterState = { opt: 0, rep: 0 };
		let next = rule;
		next = synthesizeOptionalGroups(next, synthRules, name, state, dedupe);
		next = synthesizeRepeatGroups(next, synthRules, name, state, dedupe);
		if (next !== rule) {
			rewrites[name] = next;
		}
	}

	// Emit synthesized helper rules as `outRules` fns + register for inline.
	// A pre-existing rule of the same name wins — whether it lives in the
	// base seed (`rulesBag`) or as an author override (`outRules`) — so a
	// hand-authored `_<parent>_<kind><N>` body is never clobbered.
	for (const synName of Object.keys(synthRules)) {
		if (synName in outRules || synName in rulesBag) continue;
		outRules[synName] = makeStaticRuleFn(synthRules[synName]!);
		context.syntheticInline.add(synName);
	}
	// Emit rewritten parent bodies as `outRules` fns so the SYMBOL ref
	// survives tree-sitter's fn-call overwrite and keeps the helper
	// reachable.
	for (const parentName of Object.keys(rewrites)) {
		outRules[parentName] = makeStaticRuleFn(rewrites[parentName]!);
	}
}

/** @internal — a rule fn that returns a fixed, already-evaluated Rule body.
 *  Used to install synthesized helpers and rewritten parents into the
 *  `outRules` fn map: tree-sitter calls the fn during rule iteration and
 *  receives the captured body verbatim (the body is already in
 *  tree-sitter-native node shape, harvested from the evaluated base seed). */
function makeStaticRuleFn(body: Rule): RuleFn {
	return function staticAutoGroupRule(): unknown {
		return body;
	};
}

// ---------------------------------------------------------------------------
// Pass: synthesizeOptionalGroups — for seq optional content
// ---------------------------------------------------------------------------

function synthesizeOptionalGroups(
	rule: Rule,
	synthRules: Record<string, Rule>,
	parentKind: string,
	state: SynthCounterState,
	dedupe: Record<string, string>
): Rule {
	const recursed = recurseChildren(rule, (r) =>
		synthesizeOptionalGroups(r, synthRules, parentKind, state, dedupe)
	);

	// Case 1 — sittir-shape `optional(seq(...))` (the IR/evaluate path, where
	// `optional()` keeps its lowercase wrapper).
	if (isOptionalType(recursed.type)) {
		const content = (recursed as unknown as { content?: Rule }).content;
		if (!content || typeof content !== 'object') return recursed;
		if (!isSeqType((content as { type?: string }).type)) return recursed;
		const synName = synthesizeGroupName(content, parentKind, 'optional', state, dedupe);
		if (!(synName in synthRules)) synthRules[synName] = content;
		const symbolRef = {
			type: detectCase(recursed) === 'upper' ? 'SYMBOL' : 'symbol',
			name: synName,
			source: 'group-lift'
		} as unknown as Rule;
		return { ...recursed, content: symbolRef } as Rule;
	}

	// Case 2 — tree-sitter NORMALIZED optional `CHOICE[<seq>, BLANK]` (the
	// grammar-feeding path, where the global `optional()` lowers to a 2-member
	// choice with a BLANK). This is what reaches grammar.json, so without this
	// branch NO `_*_optional<N>` helper is ever synthesized into the parser.
	// A 2-member CHOICE with exactly one BLANK and one SEQ is unambiguously an
	// optional(seq) — real unions never carry a BLANK member. Mirrors enrich's
	// CHOICE[X,BLANK] descent. The non-blank SEQ member is lifted; the choice
	// is rewritten to CHOICE[SYMBOL(helper), BLANK] so `optional` semantics and
	// the inline-flat runtime are preserved.
	if (isChoiceType(recursed.type)) {
		const members = (recursed as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members) || members.length !== 2) return recursed;
		const blankIdx = members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		const seqIdx = members.findIndex((m) => isSeqType((m as { type?: string }).type));
		if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return recursed;
		const seqMember = members[seqIdx]!;
		const synName = synthesizeGroupName(seqMember, parentKind, 'optional', state, dedupe);
		if (!(synName in synthRules)) synthRules[synName] = seqMember;
		const symbolRef = {
			type: detectCase(recursed) === 'upper' ? 'SYMBOL' : 'symbol',
			name: synName,
			source: 'group-lift'
		} as unknown as Rule;
		const newMembers = members.slice();
		newMembers[seqIdx] = symbolRef;
		return { ...recursed, members: newMembers } as Rule;
	}

	return recursed;
}

// ---------------------------------------------------------------------------
// Pass: synthesizeRepeatGroups — for seq repeat / repeat1 content
// ---------------------------------------------------------------------------

function synthesizeRepeatGroups(
	rule: Rule,
	synthRules: Record<string, Rule>,
	parentKind: string,
	state: SynthCounterState,
	dedupe: Record<string, string>
): Rule {
	const recursed = recurseChildren(rule, (r) =>
		synthesizeRepeatGroups(r, synthRules, parentKind, state, dedupe)
	);
	if (!isRepeatType(recursed.type)) return recursed;
	const content = (recursed as unknown as { content?: Rule }).content;
	if (!content || typeof content !== 'object') return recursed;
	const t = (content as { type?: string }).type;
	// STRICT trigger: only seq content. No hasSlotBearingMember filter —
	// strict-seq is the trigger. No separator carve-out — separator
	// metadata is not synthesis's concern (decomposition is a separate
	// pass that belongs in link/evaluate).
	if (!isSeqType(t)) return recursed;

	const synName = synthesizeGroupName(content, parentKind, 'repeat', state, dedupe);
	if (!(synName in synthRules)) {
		synthRules[synName] = content;
	}
	const symbolRef = {
		type: detectCase(recursed) === 'upper' ? 'SYMBOL' : 'symbol',
		name: synName,
		source: 'group-lift'
	} as unknown as Rule;
	return { ...recursed, content: symbolRef } as Rule;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectCase(referenceRule: unknown): 'upper' | 'lower' {
	const t = (referenceRule as { type?: string })?.type ?? '';
	return t.length > 0 && t === t.toUpperCase() ? 'upper' : 'lower';
}

/** @internal — synthesize (or reuse) a hidden-group rule name for the
 *  given content body. Naming convention: `_<parentKind>_<kind><N>` where
 *  `kind` is `optional` or `repeat` and `N` is a 1-indexed counter
 *  scoped to the (parent, kind) pair via `state`.
 *
 *  Cross-parent dedupe: `dedupe` is keyed by `canonicalStringify(content)`
 *  and shared across all parents within a single apply call. The first
 *  parent to synthesize a given content body owns the name; subsequent
 *  parents with matching content reuse it without consuming a counter
 *  slot (matches tree-sitter's `existing_repeats` pattern). */
function synthesizeGroupName(
	content: Rule,
	parentKind: string,
	kind: 'optional' | 'repeat',
	state: SynthCounterState,
	dedupe: Record<string, string>
): string {
	const key = canonicalStringify(content);
	const existing = dedupe[key];
	if (existing !== undefined) return existing;
	const counterKey = kind === 'optional' ? 'opt' : 'rep';
	state[counterKey] += 1;
	const n = state[counterKey];
	const name = `_${parentKind}_${kind}${n}`;
	dedupe[key] = name;
	return name;
}

/** @internal — canonical JSON stringify with sorted object keys. Ensures
 *  that two structurally-equal rule bodies stringify identically even
 *  when property insertion order differs between rule construction paths. */
function canonicalStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return '[' + value.map((v) => canonicalStringify(v)).join(',') + ']';
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	const parts: string[] = [];
	for (const k of keys) {
		const v = obj[k];
		if (typeof v === 'function' || typeof v === 'undefined') continue;
		parts.push(JSON.stringify(k) + ':' + canonicalStringify(v));
	}
	return '{' + parts.join(',') + '}';
}

/** @internal — descend into structural children of `rule` and apply
 *  `visit` to each. Mirrors the shape-walk used by enrich's wrappers.
 *  Returns the original rule reference when no descendant changes. */
function recurseChildren(rule: Rule, visit: (r: Rule) => Rule): Rule {
	if (!rule || typeof rule !== 'object') return rule;
	const t = (rule as { type?: string }).type;
	if (!t) return rule;
	if (isSeqType(t) || isChoiceType(t)) {
		const members = (rule as unknown as { members?: Rule[] }).members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const out = visit(m);
			if (out !== m) changed = true;
			return out;
		});
		return changed ? ({ ...rule, members: newMembers } as Rule) : rule;
	}
	// NOTE: token / TOKEN / immediate_token / IMMEDIATE_TOKEN are deliberately
	// EXCLUDED from this descent list. A token() reduces to a single terminal
	// at parse time and may not contain a rule reference; hoisting an
	// `optional(seq(...))` out of one (e.g. tree-sitter-typescript's `_number`
	// token, whose body is `seq(optional('_'), /\d(_?\d)*/)`) would inject a
	// SYMBOL into the token and trip tree-sitter's "Unexpected rule `_<x>_optionalN`
	// in `token()` call". Returning the token unchanged keeps its content atomic.
	if (
		isOptionalType(t) ||
		isRepeatType(t) ||
		isFieldType(t) ||
		isPrecWrapper(rule as { type: string }) ||
		t === 'alias' ||
		t === 'ALIAS' ||
		t === 'group' ||
		t === 'variant'
	) {
		const content = (rule as unknown as { content?: Rule }).content;
		if (content === undefined) return rule;
		const out = visit(content);
		if (out === content) return rule;
		return { ...rule, content: out } as Rule;
	}
	if (t === 'polymorph') {
		const forms = (rule as unknown as { forms?: Array<{ content: Rule }> }).forms;
		if (!Array.isArray(forms)) return rule;
		let changed = false;
		const newForms = forms.map((f) => {
			const out = visit(f.content);
			if (out === f.content) return f;
			changed = true;
			return { ...f, content: out };
		});
		return changed ? ({ ...rule, forms: newForms } as Rule) : rule;
	}
	return rule;
}

// Re-export the GrammarResult type so consumers don't need to dig.
export type { GrammarResult };
