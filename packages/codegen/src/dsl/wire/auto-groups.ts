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
	isPrecWrapper
} from '../runtime-shapes.ts';
import type { WireContext } from './wire.ts';
import type { GrammarResult } from '../enrich.ts';

interface SynthCounterState {
	opt: number;
	rep: number;
}

/**
 * Apply auto-group-synthesis to `base.grammar.rules`. Mutates the rules
 * map in place: each parent rule's body is rewritten (optional/repeat
 * content swapped for a SymbolRule when the trigger fires), and the
 * synthesized hidden-group rules are appended.
 *
 * Synthesized names are also registered with
 * `context.syntheticInline` so the wired `inline:` callback drains
 * them into the grammar's inline list.
 *
 * `authoredSynthesisKinds` is the set of rule kinds the author has
 * already opted into authored synthesis via `transforms:`, `polymorphs:`,
 * or path-mode `groups:` entries. Auto-group-synthesis skips those rules
 * so the authored path-based machinery (`transform()`, polymorph splits,
 * group lifts) sees the rule body the author wrote, not a post-synth
 * shape that would invalidate every `'1/0/2'` style path patch.
 *
 * No-op when `base` is undefined or carries no rules.
 */
export function applyAutoGroups(
	base: { grammar?: { rules?: Record<string, Rule> }; rules?: Record<string, Rule> } | undefined,
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
	// Per-apply hidden-rule bag: synthesized rules are accumulated here
	// and merged into the grammar rule map after iteration.
	const synthRules: Record<string, Rule> = {};

	for (const name of Object.keys(rulesBag)) {
		// Authored synthesis wins by construction — skip rules the author
		// opted into the structured pipeline via transforms/polymorphs/
		// path-mode groups. Mutating them here would shift the rule tree
		// out from under the path-string patches those mechanisms drive.
		if (authoredSynthesisKinds.has(name)) continue;
		const rule = rulesBag[name];
		if (!rule) continue;
		const state: SynthCounterState = { opt: 0, rep: 0 };
		let next = rule;
		next = synthesizeOptionalGroups(next, synthRules, name, state, dedupe);
		next = synthesizeRepeatGroups(next, synthRules, name, state, dedupe);
		if (next !== rule) {
			rulesBag[name] = next;
		}
	}

	// Merge synthesized rules into the grammar map and register for inline.
	// Skip names the author already declared (authored synthesis wins).
	for (const synName of Object.keys(synthRules)) {
		if (synName in rulesBag) continue;
		rulesBag[synName] = synthRules[synName]!;
		context.syntheticInline.add(synName);
	}
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
	if (!isOptionalType(recursed.type)) return recursed;
	const content = (recursed as unknown as { content?: Rule }).content;
	if (!content || typeof content !== 'object') return recursed;
	const t = (content as { type?: string }).type;
	// STRICT trigger: only seq content. Drops the prior choice case so
	// authored choices and polymorphs survive untouched. No
	// hasSlotBearingMember filter — strict-seq is the trigger.
	if (!isSeqType(t)) return recursed;

	const synName = synthesizeGroupName(content, parentKind, 'optional', state, dedupe);
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
	if (
		isOptionalType(t) ||
		isRepeatType(t) ||
		isFieldType(t) ||
		isPrecWrapper(rule as { type: string }) ||
		t === 'alias' ||
		t === 'ALIAS' ||
		t === 'token' ||
		t === 'TOKEN' ||
		t === 'immediate_token' ||
		t === 'IMMEDIATE_TOKEN' ||
		t === 'group' ||
		t === 'variant' ||
		t === 'clause'
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
			if (out !== f.content) changed = true;
			return changed ? { ...f, content: out } : f;
		});
		return changed ? ({ ...rule, forms: newForms } as Rule) : rule;
	}
	return rule;
}

// Re-export the GrammarResult type so consumers don't need to dig.
export type { GrammarResult };
