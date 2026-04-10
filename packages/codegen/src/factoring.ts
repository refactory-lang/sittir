/**
 * CHOICE fan-out — distributive factoring of grammar rules into structural variants.
 *
 * Every non-blank CHOICE in a grammar rule is a union. This module factors
 * CHOICEs where possible (extracting common prefix/suffix) to determine
 * whether a CHOICE produces 1 variant (demoted to child slot) or N variants
 * (parent-level structural alternatives).
 *
 * The result is a `StructuralVariant[]` stored on the node model, consumed
 * by all emitters (types, factories, templates, from, render).
 */

import type { GrammarRule } from './grammar.ts';
import type { StructuralVariant } from './node-model.ts';
import type { OverrideFieldInfo } from './enriched-grammar.ts';
import { applyOverrides } from './enriched-grammar.ts';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FactorContext {
	fieldRequired: Map<string, boolean>;
	fieldMultiple: Map<string, boolean>;
	grammarRules: Record<string, GrammarRule>;
	childSlotMap: Map<string, { varName: string; multiple: boolean; slotName: string }>;
}

/**
 * Factor a grammar rule into structural variants.
 *
 * @param rule - The raw grammar rule (pre-override)
 * @param overrideFields - Override field info for synthetic FIELD injection
 * @param ctx - Field metadata and grammar rules for inlining
 * @returns Array of structural variants (1 = factorable, N = fan-out)
 */
export function factorRule(
	rule: GrammarRule,
	overrideFields: OverrideFieldInfo[],
	ctx: FactorContext,
): StructuralVariant[] {
	// Apply override enrichment (inject synthetic FIELDs)
	const enriched = applyOverrides(rule, overrideFields);

	// Walk the enriched rule to produce variant skeletons
	const seen = new Set<string>();
	const rawVariants = walkRule(enriched, false, seen, ctx);

	// Deduplicate identical templates
	const uniqueMap = new Map<string, StructuralVariant>();
	for (const v of rawVariants) {
		if (!uniqueMap.has(v.template)) {
			uniqueMap.set(v.template, v);
		}
	}
	const unique = [...uniqueMap.values()];

	// Name the variants
	for (let i = 0; i < unique.length; i++) {
		unique[i]!.name = nameVariant(unique[i]!, i, unique);
	}

	return unique;
}

// ---------------------------------------------------------------------------
// Rule walker — produces StructuralVariant[] per grammar node
// ---------------------------------------------------------------------------

function walkRule(
	rule: GrammarRule,
	optional: boolean,
	seen: Set<string>,
	ctx: FactorContext,
): StructuralVariant[] {
	switch (rule.type) {
		case 'SEQ':
			return walkSeq(rule.members, optional, seen, ctx);

		case 'STRING':
			if (optional) return [emptyVariant()];
			return [singlePartVariant(rule.value)];

		case 'FIELD': {
			if (seen.has(rule.name)) return [emptyVariant()];
			seen.add(rule.name);
			const multi = ctx.fieldMultiple.get(rule.name) ?? false;
			const varName = rule.name.toUpperCase();
			const part = multi ? `$$$${varName}` : `$${varName}`;
			const v = singlePartVariant(part);
			const req = ctx.fieldRequired.get(rule.name) ?? false;
			v.fields.set(rule.name, { required: req, multiple: multi });
			return [v];
		}

		case 'SYMBOL':
			return walkSymbol(rule, optional, seen, ctx);

		case 'CHOICE':
			return walkChoice(rule.members, optional, seen, ctx);

		case 'REPEAT':
		case 'REPEAT1':
			return walkRule(rule.content, optional, seen, ctx);

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return walkRule(rule.content, optional, seen, ctx);

		case 'TOKEN':
			return walkRule(rule.content, optional, seen, ctx);

		case 'IMMEDIATE_TOKEN': {
			let inner: GrammarRule = rule.content;
			while (inner.type === 'PREC' || inner.type === 'PREC_LEFT' || inner.type === 'PREC_RIGHT' || inner.type === 'PREC_DYNAMIC') {
				inner = inner.content;
			}
			if (inner.type === 'STRING') {
				if (optional) return [emptyVariant()];
				return [singlePartVariant(inner.value)];
			}
			return walkRule(rule.content, optional, seen, ctx);
		}

		case 'ALIAS': {
			if (rule.named) {
				const aliasName = rule.value ?? '';
				const aliasSlot = ctx.childSlotMap.get(aliasName);
				if (aliasSlot) {
					if (seen.has(`child:${aliasSlot.slotName}`)) return [emptyVariant()];
					seen.add(`child:${aliasSlot.slotName}`);
					if (aliasSlot.slotName === 'children') seen.add('children');
					const part = aliasSlot.multiple ? `$$$${aliasSlot.varName}` : `$${aliasSlot.varName}`;
					return [singlePartVariant(part)];
				}
				if (seen.has('children')) return [emptyVariant()];
				seen.add('children');
				return [singlePartVariant('$$$CHILDREN')];
			}
			if (rule.value) {
				if (optional) return [emptyVariant()];
				return [singlePartVariant(rule.value)];
			}
			return walkRule(rule.content, optional, seen, ctx);
		}

		case 'BLANK':
		case 'PATTERN':
			return [emptyVariant()];
	}
}

// ---------------------------------------------------------------------------
// SYMBOL handler — inline hidden rules, child slots
// ---------------------------------------------------------------------------

function walkSymbol(
	rule: GrammarRule & { type: 'SYMBOL' },
	optional: boolean,
	seen: Set<string>,
	ctx: FactorContext,
): StructuralVariant[] {
	// Inline _-prefixed (hidden/abstract) rules that contain fields
	if (rule.name.startsWith('_') && ctx.grammarRules[rule.name]) {
		const inlineSeen = new Set(seen);
		const inlined = walkRule(ctx.grammarRules[rule.name]!, optional, inlineSeen, ctx);
		const hasRelevantFields = [...inlineSeen].some(f => !seen.has(f) && ctx.fieldRequired.has(f));
		if (hasRelevantFields) {
			for (const f of inlineSeen) {
				if (ctx.fieldRequired.has(f)) seen.add(f);
			}
			if (inlineSeen.has('children')) seen.add('children');
			return inlined;
		}
	}

	// Named child slot
	const childSlot = ctx.childSlotMap.get(rule.name);
	if (childSlot) {
		if (seen.has(`child:${childSlot.slotName}`) || (childSlot.slotName === 'children' && seen.has('children'))) return [emptyVariant()];
		seen.add(`child:${childSlot.slotName}`);
		if (childSlot.slotName === 'children') seen.add('children');
		const part = childSlot.multiple ? `$$$${childSlot.varName}` : `$${childSlot.varName}`;
		return [singlePartVariant(part)];
	}

	// Hidden rules not inlined and not in childSlotMap
	if (rule.name.startsWith('_')) return [emptyVariant()];

	// Unknown named symbol → generic children
	if (seen.has('children')) return [emptyVariant()];
	seen.add('children');
	return [singlePartVariant('$$$CHILDREN')];
}

// ---------------------------------------------------------------------------
// SEQ handler — cross-product of member variants
// ---------------------------------------------------------------------------

function walkSeq(
	members: GrammarRule[],
	optional: boolean,
	seen: Set<string>,
	ctx: FactorContext,
): StructuralVariant[] {
	let current: StructuralVariant[] = [emptyVariant()];

	for (const member of members) {
		const memberVariants = walkRule(member, optional, seen, ctx);

		if (memberVariants.length === 1) {
			// Common case: single variant per member — append to all current variants
			const mv = memberVariants[0]!;
			for (const cv of current) {
				appendVariant(cv, mv);
			}
		} else {
			// Cross-product: each current variant × each member variant
			const next: StructuralVariant[] = [];
			for (const cv of current) {
				for (const mv of memberVariants) {
					const combined = cloneVariant(cv);
					appendVariant(combined, mv);
					next.push(combined);
				}
			}
			current = next;
		}
	}

	return current;
}

// ---------------------------------------------------------------------------
// CHOICE handler — BLANK preprocessing + factoring
// ---------------------------------------------------------------------------

function walkChoice(
	members: GrammarRule[],
	optional: boolean,
	seen: Set<string>,
	ctx: FactorContext,
): StructuralVariant[] {
	const hasBlank = members.some(m => m.type === 'BLANK');
	const nonBlank = members.filter(m => m.type !== 'BLANK');

	if (hasBlank) {
		// CHOICE with BLANK = optional group
		if (nonBlank.length === 0) return [emptyVariant()];

		if (nonBlank.length === 1) {
			const inner = nonBlank[0]!;
			// Suppress optional bare STRING tokens
			if (inner.type === 'STRING') return [emptyVariant()];
			// Walk as optional
			return walkRule(inner, true, seen, ctx);
		}

		// Multiple non-blank + BLANK: walk non-blank branches as optional
		// and cross-combine (the BLANK case adds an empty variant)
		const branchResults: StructuralVariant[][] = [];
		for (const m of nonBlank) {
			branchResults.push(walkRule(m, true, new Set(seen), ctx));
		}
		const all = branchResults.flat();
		// Add empty variant for the BLANK case
		all.push(emptyVariant());
		return deduplicateVariants(all);
	}

	// No BLANK — true structural CHOICE
	// Try factoring: extract common prefix/suffix

	// First, check if this is an "atom" CHOICE (all single elements, no SEQs)
	const allAtoms = nonBlank.every(m => {
		const u = unwrapPrec(m);
		return u.type === 'STRING' || u.type === 'FIELD' || u.type === 'SYMBOL' || u.type === 'ALIAS';
	});

	if (allAtoms) {
		// Atom CHOICE: demote to child-level slot. Walk each branch, merge fields.
		// This produces 1 variant with a union-typed slot.
		const mergedSeen = new Set(seen);
		const merged = emptyVariant();
		let firstParts: string[] | null = null;

		for (const m of nonBlank) {
			const branchSeen = new Set(seen);
			const results = walkRule(m, optional, branchSeen, ctx);
			if (results.length > 0) {
				const r = results[0]!;
				if (firstParts === null) {
					firstParts = r.parts;
					merged.parts = [...r.parts];
				}
				// Merge fields
				for (const [k, v] of r.fields) {
					if (!merged.fields.has(k)) {
						merged.fields.set(k, { ...v });
					}
				}
				// Merge seen
				for (const s of branchSeen) mergedSeen.add(s);
			}
		}
		for (const s of mergedSeen) seen.add(s);
		merged.template = merged.parts.join('').replace(/\s+/g, ' ').trim();
		return [merged];
	}

	// SEQ CHOICE: attempt distributive factoring
	return factorSeqChoice(nonBlank, optional, seen, ctx);
}

// ---------------------------------------------------------------------------
// Distributive factoring of CHOICE-over-SEQ
// ---------------------------------------------------------------------------

function factorSeqChoice(
	branches: GrammarRule[],
	optional: boolean,
	seen: Set<string>,
	ctx: FactorContext,
): StructuralVariant[] {
	// Normalize each branch to a flat SEQ
	const seqs = branches.map(b => normalizeToSeq(b));

	// Extract common prefix
	const prefixLen = commonPrefixLength(seqs);
	// Extract common suffix (from remaining elements)
	const suffixLen = commonSuffixLength(seqs, prefixLen);

	// Extract divergent middles
	const middles: GrammarRule[][] = [];
	for (const seq of seqs) {
		const end = seq.length - suffixLen;
		middles.push(seq.slice(prefixLen, end));
	}

	// Check if divergent region is exactly 1 position per branch
	const allSinglePosition = middles.every(m => m.length <= 1);
	const anyNonEmpty = middles.some(m => m.length > 0);

	if (allSinglePosition && anyNonEmpty && prefixLen + suffixLen > 0) {
		// Factorable: CHOICE demoted to one position
		// Build the single variant: prefix + demoted CHOICE + suffix
		const prefix = seqs[0]!.slice(0, prefixLen);
		const suffix = seqs[0]!.slice(seqs[0]!.length - suffixLen);

		// Build the demoted CHOICE from middles
		const choiceMembers = middles
			.filter(m => m.length > 0)
			.map(m => m[0]!);

		// Walk prefix
		const prefixVariants = walkSeq(prefix, optional, seen, ctx);
		// Walk the demoted CHOICE (as atom choice if possible)
		const choiceVariants = choiceMembers.length > 0
			? walkChoice(choiceMembers, optional, seen, ctx)
			: [emptyVariant()];
		// Walk suffix
		const suffixVariants = walkSeq(suffix, optional, seen, ctx);

		// Combine: prefix × choice × suffix
		const result: StructuralVariant[] = [];
		for (const pv of prefixVariants) {
			for (const cv of choiceVariants) {
				for (const sv of suffixVariants) {
					const combined = cloneVariant(pv);
					appendVariant(combined, cv);
					appendVariant(combined, sv);
					result.push(combined);
				}
			}
		}

		return deduplicateVariants(result);
	}

	// Not factorable: each branch produces its own variant(s)
	const allVariants: StructuralVariant[] = [];
	for (const branch of branches) {
		const branchSeen = new Set(seen);
		const results = walkRule(branch, optional, branchSeen, ctx);
		allVariants.push(...results);
		// Merge seen from all branches into parent
		for (const s of branchSeen) seen.add(s);
	}

	return deduplicateVariants(allVariants);
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function unwrapPrec(rule: GrammarRule): GrammarRule {
	while (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		rule = rule.content;
	}
	return rule;
}

/** Flatten a rule to a SEQ member array. Single elements become [element]. */
function normalizeToSeq(rule: GrammarRule): GrammarRule[] {
	const unwrapped = unwrapPrec(rule);
	if (unwrapped.type === 'SEQ') return unwrapped.members;
	return [unwrapped];
}

/** Find the length of the common prefix across all SEQs. */
function commonPrefixLength(seqs: GrammarRule[][]): number {
	if (seqs.length === 0) return 0;
	const minLen = Math.min(...seqs.map(s => s.length));
	let len = 0;
	for (let i = 0; i < minLen; i++) {
		const first = seqs[0]![i]!;
		if (seqs.every(s => structurallyEqual(first, s[i]!))) {
			len++;
		} else {
			break;
		}
	}
	return len;
}

/** Find the length of the common suffix, starting after `prefixLen` elements. */
function commonSuffixLength(seqs: GrammarRule[][], prefixLen: number): number {
	if (seqs.length === 0) return 0;
	const minRemaining = Math.min(...seqs.map(s => s.length - prefixLen));
	let len = 0;
	for (let i = 1; i <= minRemaining; i++) {
		const first = seqs[0]![seqs[0]!.length - i]!;
		if (seqs.every(s => structurallyEqual(first, s[s.length - i]!))) {
			len++;
		} else {
			break;
		}
	}
	return len;
}

/**
 * Structural identity for prefix/suffix alignment.
 *
 * - STRING: same value
 * - FIELD: same name (content may differ — pushed into field's type union)
 * - SYMBOL: same name
 * - BLANK: always equal
 * - PREC wrappers: unwrap and compare content
 */
export function structurallyEqual(a: GrammarRule, b: GrammarRule): boolean {
	const ua = unwrapPrec(a);
	const ub = unwrapPrec(b);

	if (ua.type !== ub.type) return false;

	switch (ua.type) {
		case 'STRING':
			return ua.value === (ub as typeof ua).value;
		case 'FIELD':
			return ua.name === (ub as typeof ua).name;
		case 'SYMBOL':
			return ua.name === (ub as typeof ua).name;
		case 'BLANK':
			return true;
		case 'CHOICE': {
			const ubChoice = ub as typeof ua;
			if (ua.members.length !== ubChoice.members.length) return false;
			return ua.members.every((m, i) => structurallyEqual(m, ubChoice.members[i]!));
		}
		case 'SEQ': {
			const ubSeq = ub as typeof ua;
			if (ua.members.length !== ubSeq.members.length) return false;
			return ua.members.every((m, i) => structurallyEqual(m, ubSeq.members[i]!));
		}
		case 'REPEAT':
		case 'REPEAT1':
			return structurallyEqual(ua.content, (ub as typeof ua).content);
		default:
			return false;
	}
}

// ---------------------------------------------------------------------------
// Variant construction helpers
// ---------------------------------------------------------------------------

function emptyVariant(): StructuralVariant {
	return {
		name: '',
		parts: [],
		fields: new Map(),
		literals: new Map(),
		template: '',
		clauses: [],
	};
}

function singlePartVariant(part: string): StructuralVariant {
	const v = emptyVariant();
	v.parts = [part];
	v.template = part;
	if (!part.startsWith('$')) {
		v.literals.set(0, part);
	}
	return v;
}

function cloneVariant(v: StructuralVariant): StructuralVariant {
	return {
		name: v.name,
		parts: [...v.parts],
		fields: new Map(v.fields),
		literals: new Map(v.literals),
		template: v.template,
		clauses: [...v.clauses],
	};
}

const _wordEndRe = /[\w\p{L}]$/u;
const _wordStartRe = /^[\p{L}_$]/u;

function needsSpace(prev: string, next: string): boolean {
	const prevMayEndWord = _wordEndRe.test(prev) || prev.startsWith('$');
	const nextMayStartWord = _wordStartRe.test(next) || next.startsWith('$');
	return prevMayEndWord && nextMayStartWord;
}

/** Append variant `b` to variant `a` in place (with spacing). */
function appendVariant(a: StructuralVariant, b: StructuralVariant): void {
	if (b.parts.length === 0) return;

	// Add space between parts if needed
	if (a.parts.length > 0 && b.parts.length > 0) {
		const lastPart = a.parts[a.parts.length - 1]!;
		const nextPart = b.parts[0]!;
		if (needsSpace(lastPart, nextPart)) {
			a.parts.push(' ');
		}
	}

	// Shift literal positions
	const offset = a.parts.length;
	for (const [pos, lit] of b.literals) {
		a.literals.set(pos + offset, lit);
	}

	a.parts.push(...b.parts);
	a.template = a.parts.join('').replace(/\s+/g, ' ').trim();

	// Merge fields
	for (const [k, v] of b.fields) {
		if (!a.fields.has(k)) {
			a.fields.set(k, { ...v });
		}
	}

	// Merge clauses
	a.clauses.push(...b.clauses);
}

function deduplicateVariants(variants: StructuralVariant[]): StructuralVariant[] {
	const seen = new Map<string, StructuralVariant>();
	for (const v of variants) {
		if (v.template && !seen.has(v.template)) {
			seen.set(v.template, v);
		}
	}
	// If all variants are empty, keep at least one
	if (seen.size === 0 && variants.length > 0) return [variants[0]!];
	return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Variant naming
// ---------------------------------------------------------------------------

/** Extract all STRING tokens from a grammar rule (for detect map). */
function extractStringTokens(rule: GrammarRule): string[] {
	const tokens: string[] = [];
	const walk = (r: GrammarRule) => {
		if (r.type === 'STRING') { tokens.push(r.value); return; }
		if ('members' in r && Array.isArray(r.members)) { for (const m of r.members) walk(m); return; }
		if ('content' in r && r.content) walk(r.content as GrammarRule);
	};
	walk(rule);
	return tokens;
}

/**
 * Derive a readable name for a variant.
 *
 * Priority:
 * 1. Unique detect token → tokenName
 * 2. Unique field presence → field name
 * 3. Fallback → "v0", "v1", ...
 */
function nameVariant(variant: StructuralVariant, index: number, all: StructuralVariant[]): string {
	if (all.length === 1) return 'default';

	// Try detect token: find a literal unique to this variant
	for (const [, lit] of variant.literals) {
		const isUnique = all.every((other, j) => {
			if (j === index) return true;
			for (const [, otherLit] of other.literals) {
				if (otherLit === lit) return false;
			}
			return true;
		});
		if (isUnique) {
			variant.detectToken = lit;
			return tokenToName(lit);
		}
	}

	// Try unique field presence
	for (const [fieldName] of variant.fields) {
		const isUnique = all.every((other, j) => j === index || !other.fields.has(fieldName));
		if (isUnique) return fieldName;
	}

	// Fallback
	return `v${index}`;
}

/** Convert a token string to a short readable name. */
function tokenToName(token: string): string {
	const names: Record<string, string> = {
		';': 'semi', ':': 'colon', ',': 'comma', '.': 'dot',
		'(': 'paren', ')': 'close_paren', '{': 'brace', '}': 'close_brace',
		'[': 'bracket', ']': 'close_bracket', '<': 'angle', '>': 'close_angle',
		'=': 'eq', '!': 'bang', '?': 'question', '..': 'dotdot',
		'->': 'arrow', '=>': 'fat_arrow', '::': 'path', '...': 'ellipsis',
		'+': 'plus', '-': 'minus', '*': 'star', '/': 'slash',
		'&': 'amp', '|': 'pipe', '^': 'caret', '~': 'tilde',
		'%': 'percent', '@': 'at', '#': 'hash',
	};
	if (names[token]) return names[token]!;
	// Alphanumeric tokens → use as-is
	if (/^[a-zA-Z_]\w*$/.test(token)) return token;
	return `tok_${[...token].map(c => c.charCodeAt(0).toString(16)).join('')}`;
}
