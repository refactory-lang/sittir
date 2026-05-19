/**
 * dsl/wire/auto-decompose.ts — auto-group-synthesis for nested seq content
 * inside optional / repeat / repeat1 wrappers.
 *
 * Co-located with wire because authored `groups:` synthesis runs in the
 * same phase. Authored synthesis wins by construction: this pass runs
 * AFTER `applyWirePatternReplacement` has been configured, so authored
 * declared rules survive untouched and auto-decomp only synthesizes
 * helpers for the seq-shapes the author didn't address.
 *
 * Trigger — strictly seq content:
 *
 *   optional(seq(...))                                  → synthesize
 *   repeat(seq(...)) / repeat1(seq(...))                → synthesize
 *     UNLESS separator / trailing / leading is already populated
 *     (separator-lift is the canonical comma-list shape — the rule
 *     already carries structured separator metadata, so wrapping the
 *     seq in a hidden helper would lose that information).
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
	isStringType,
	isSymbolType,
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
 * Apply auto-decomposition to `base.grammar.rules`. Mutates the rules
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
 * or path-mode `groups:` entries. Auto-decomp skips those rules so the
 * authored path-based machinery (`transform()`, polymorph splits, group
 * lifts) sees the rule body the author wrote, not a post-decomp shape
 * that would invalidate every `'1/0/2'` style path patch.
 *
 * No-op when `base` is undefined or carries no rules.
 */
export function applyAutoDecompose(
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
	// Per-enrich hidden-rule bag: synthesized rules are accumulated here
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
		next = decomposeOptional(next, synthRules, name, state, dedupe);
		next = decomposeRepeat(next, synthRules, name, state, dedupe);
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
// Pass: decomposeOptional — auto-group-synthesis for seq optional content
// ---------------------------------------------------------------------------

function decomposeOptional(
	rule: Rule,
	synthRules: Record<string, Rule>,
	parentKind: string,
	state: SynthCounterState,
	dedupe: Record<string, string>
): Rule {
	const recursed = recurseChildren(rule, (r) =>
		decomposeOptional(r, synthRules, parentKind, state, dedupe)
	);
	if (!isOptionalType(recursed.type)) return recursed;
	const content = (recursed as unknown as { content?: Rule }).content;
	if (!content || typeof content !== 'object') return recursed;
	const t = (content as { type?: string }).type;
	// STRICT trigger: only seq content. Drops the prior choice case so
	// authored choices and polymorphs survive untouched.
	if (!isSeqType(t)) return recursed;
	if (!hasSlotBearingMember(content)) return recursed;

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
// Pass: decomposeRepeat — auto-group-synthesis for seq repeat / repeat1 content
// ---------------------------------------------------------------------------

function decomposeRepeat(
	rule: Rule,
	synthRules: Record<string, Rule>,
	parentKind: string,
	state: SynthCounterState,
	dedupe: Record<string, string>
): Rule {
	const recursed = recurseChildren(rule, (r) =>
		decomposeRepeat(r, synthRules, parentKind, state, dedupe)
	);
	if (!isRepeatType(recursed.type)) return recursed;
	const content = (recursed as unknown as { content?: Rule }).content;
	if (!content || typeof content !== 'object') return recursed;
	const t = (content as { type?: string }).type;
	// STRICT trigger: only seq content.
	if (!isSeqType(t)) return recursed;
	// CARVE-OUT: skip if the repeat already carries separator / trailing /
	// leading attributes. Those are populated when the base grammar's
	// `repeat(seq(X, ','))` shape was already lifted into structured
	// metadata — wrapping the seq in a hidden helper would lose that.
	const r = recursed as unknown as { separator?: unknown; trailing?: unknown; leading?: unknown };
	if (r.separator !== undefined || r.trailing !== undefined || r.leading !== undefined) {
		return recursed;
	}

	const members = ((content as { members?: Rule[] }).members ?? []) as Rule[];
	const slotBearing: Rule[] = [];
	const stringMembers: Rule[] = [];
	for (const m of members) {
		const mt = (m as { type?: string }).type;
		if (
			isFieldType(mt) ||
			isSymbolType(mt) ||
			isOptionalType(mt) ||
			isRepeatType(mt) ||
			((isSeqType(mt) || isChoiceType(mt)) && hasSlotBearingMember(m))
		) {
			slotBearing.push(m);
		} else if (isStringType(mt)) {
			stringMembers.push(m);
		}
	}

	if (slotBearing.length === 0) return recursed; // pure-literal — no slot
	if (slotBearing.length === 1) {
		// Single-slot seq with literal flank(s): stamp the `separator`
		// metadata for sittir-side consumers WITHOUT mutating `content`.
		// The prior design swapped `content = slot` — that change DID reach
		// tree-sitter, and the resulting `repeat(slot)` (no literal
		// delimiter) altered every comma-list rule's recognized language.
		// Rust's `enum_variant_list` / `field_declaration_list` / … lost
		// their commas, destabilizing the LR(1) tables for surrounding
		// rules — tree-sitter surfaced the regression as "Unresolved
		// conflict for symbol sequence … _pattern / range_pattern".
		// Keep `content` intact so the parse shape matches what the
		// grammar author wrote; downstream sittir passes read the
		// `separator` field independently.
		if (stringMembers.length === 0) return recursed; // bare single-slot seq — no metadata to add
		const existing = recursed as unknown as { separator?: unknown };
		if (existing.separator !== undefined) return recursed; // already stamped (idempotent)
		return {
			...(recursed as object),
			separator: stringMembers as readonly Rule[]
		} as unknown as Rule;
	}

	// Multi-slot seq: synthesize a hidden group.
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

/** @internal — true when a seq/choice has at least one slot-bearing
 *  member: a field, a bare symbol reference, a multiplicity wrapper
 *  (optional/repeat/repeat1), or a nested seq/choice that itself bears
 *  slots. Pure-literal seqs (`seq('(', ')')`) return false. */
function hasSlotBearingMember(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as { type?: string; members?: unknown[] };
	const t = r.type;
	if (!isSeqType(t) && !isChoiceType(t)) return false;
	const members = Array.isArray(r.members) ? r.members : [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const mt = (m as { type?: string }).type;
		if (
			isFieldType(mt) ||
			isSymbolType(mt) ||
			isOptionalType(mt) ||
			isRepeatType(mt)
		) {
			return true;
		}
		if ((isSeqType(mt) || isChoiceType(mt)) && hasSlotBearingMember(m)) {
			return true;
		}
	}
	return false;
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
