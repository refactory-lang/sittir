/**
 * CHOICE fan-out — distributive factoring of grammar rules into structural variants.
 *
 * Every non-blank CHOICE in a grammar rule is a union. This module factors
 * CHOICEs where possible (extracting common prefix/suffix) to determine
 * whether a CHOICE produces 1 variant (demoted to child slot) or N variants
 * (parent-level structural alternatives).
 *
 * The output is a `StructuralVariant[]` on the node model, each carrying a
 * **resolved grammar rule** — a version of the original rule with non-factorable
 * CHOICEs replaced by their specific branch. The rules emitter runs
 * `ruleToTemplate` on each resolved rule to produce correct template strings.
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
 * Each variant carries a resolved grammar rule where non-factorable CHOICEs
 * have been replaced by their specific branch. The rules emitter can run
 * `ruleToTemplate` on each to produce correct template strings.
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

	// Resolve CHOICEs into variant rules
	const resolvedRules = resolveChoices(enriched, ctx);

	// Build variant skeletons with field/literal metadata
	const variants: StructuralVariant[] = [];
	for (const resolved of resolvedRules) {
		const v = buildVariantMetadata(resolved, ctx);
		variants.push(v);
	}

	// Deduplicate by field set signature (not template string — templates aren't generated yet)
	const unique = deduplicateVariants(variants);

	// Name the variants
	for (let i = 0; i < unique.length; i++) {
		unique[i]!.name = nameVariant(unique[i]!, i, unique);
	}

	return unique;
}

// ---------------------------------------------------------------------------
// CHOICE resolution — produces GrammarRule[] (one resolved rule per variant)
// ---------------------------------------------------------------------------

/**
 * Walk a grammar rule and resolve non-factorable CHOICEs into separate rules.
 * Returns one rule per variant path through the grammar.
 *
 * - CHOICE with BLANK: strip BLANK, mark optional (1 rule, unchanged)
 * - CHOICE of atoms: factorable → 1 rule (CHOICE preserved as child slot)
 * - CHOICE of SEQs: factor common prefix/suffix
 *   - 1-position divergent: factorable → 1 rule (CHOICE preserved at that position)
 *   - Multi-position divergent: not factorable → N rules (one per branch)
 */
function resolveChoices(rule: GrammarRule, ctx: FactorContext): GrammarRule[] {
	switch (rule.type) {
		case 'SEQ': {
			// Cross-product of resolved members
			let current: GrammarRule[][] = [[]];
			for (const member of rule.members) {
				const memberResolutions = resolveChoices(member, ctx);
				if (memberResolutions.length === 1) {
					// Common case: single resolution — append to all
					for (const seq of current) seq.push(memberResolutions[0]!);
				} else {
					// Cross-product
					const next: GrammarRule[][] = [];
					for (const seq of current) {
						for (const mr of memberResolutions) {
							next.push([...seq, mr]);
						}
					}
					current = next;
				}
			}
			return current.map(members => ({ type: 'SEQ' as const, members }));
		}

		case 'CHOICE':
			return resolveChoice(rule.members, ctx);

		case 'REPEAT':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'REPEAT' as const, content: c }));
		case 'REPEAT1':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'REPEAT1' as const, content: c }));

		case 'PREC':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'PREC' as const, value: rule.value, content: c }));
		case 'PREC_LEFT':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'PREC_LEFT' as const, value: rule.value, content: c }));
		case 'PREC_RIGHT':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'PREC_RIGHT' as const, value: rule.value, content: c }));
		case 'PREC_DYNAMIC':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'PREC_DYNAMIC' as const, value: rule.value, content: c }));

		case 'TOKEN':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'TOKEN' as const, content: c }));
		case 'IMMEDIATE_TOKEN':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'IMMEDIATE_TOKEN' as const, content: c }));

		case 'FIELD':
			return resolveChoices(rule.content, ctx).map(c => ({ type: 'FIELD' as const, name: rule.name, content: c }));

		case 'ALIAS':
			return resolveChoices(rule.content, ctx).map(c => ({
				type: 'ALIAS' as const, content: c, named: rule.named, value: rule.value,
			}));

		// Terminals — no CHOICEs to resolve
		case 'STRING':
		case 'SYMBOL':
		case 'BLANK':
		case 'PATTERN':
			return [rule];
	}
}

/**
 * Resolve a CHOICE node. Determines whether it's factorable (1 resolved rule)
 * or produces N variant rules.
 */
function resolveChoice(members: GrammarRule[], ctx: FactorContext): GrammarRule[] {
	const hasBlank = members.some(m => m.type === 'BLANK');
	const nonBlank = members.filter(m => m.type !== 'BLANK');

	if (hasBlank) {
		// CHOICE with BLANK = optional group. Preserve the CHOICE structure
		// so ruleToTemplate can detect it and synthesize clauses / mark optional.
		// But recurse into non-blank branches to resolve inner CHOICEs.
		const resolvedMembers: GrammarRule[] = [];
		for (const m of nonBlank) {
			const resolutions = resolveChoices(m, ctx);
			// If a non-blank branch resolves to multiple variants, we need to
			// expand: CHOICE(variant1, variant2, BLANK)
			resolvedMembers.push(...resolutions);
		}
		resolvedMembers.push({ type: 'BLANK' });

		if (resolvedMembers.length === 2 && resolvedMembers[1]!.type === 'BLANK') {
			// Simple case: CHOICE(resolved, BLANK) — keep as-is
			return [{ type: 'CHOICE', members: resolvedMembers }];
		}
		// Multiple resolved branches + BLANK — the whole CHOICE is still one rule
		// (optionality, not structural variants)
		return [{ type: 'CHOICE', members: resolvedMembers }];
	}

	// No BLANK — true structural CHOICE. Attempt factoring.

	// Check if this is an "atom" CHOICE (all single elements, no SEQs)
	const allAtoms = nonBlank.every(m => {
		const u = unwrapPrec(m);
		return u.type === 'STRING' || u.type === 'FIELD' || u.type === 'SYMBOL' || u.type === 'ALIAS';
	});

	if (allAtoms) {
		// Atom CHOICE: factorable — preserve the CHOICE as a child-level slot.
		// Recurse into each branch to resolve nested CHOICEs (though atoms rarely have them).
		const resolvedMembers: GrammarRule[] = [];
		for (const m of nonBlank) {
			resolvedMembers.push(...resolveChoices(m, ctx));
		}
		return [{ type: 'CHOICE', members: resolvedMembers }];
	}

	// SEQ CHOICE: attempt distributive factoring
	return factorSeqChoice(nonBlank, ctx);
}

// ---------------------------------------------------------------------------
// Distributive factoring of CHOICE-over-SEQ
// ---------------------------------------------------------------------------

function factorSeqChoice(branches: GrammarRule[], ctx: FactorContext): GrammarRule[] {
	// Normalize each branch to a flat SEQ
	const seqs = branches.map(b => normalizeToSeq(b));

	// Extract common prefix and suffix
	const prefixLen = commonPrefixLength(seqs);
	const suffixLen = commonSuffixLength(seqs, prefixLen);

	// Extract divergent middles
	const middles: GrammarRule[][] = [];
	for (const seq of seqs) {
		middles.push(seq.slice(prefixLen, seq.length - suffixLen));
	}

	// Check if divergent region is exactly 1 position per branch
	const allSinglePosition = middles.every(m => m.length <= 1);
	const anyNonEmpty = middles.some(m => m.length > 0);

	if (allSinglePosition && anyNonEmpty && prefixLen + suffixLen > 0) {
		// Factorable: CHOICE demoted to one position within the SEQ.
		// Build: SEQ(prefix..., CHOICE(middle0, middle1, ...), suffix...)
		const prefix = seqs[0]!.slice(0, prefixLen);
		const suffix = seqs[0]!.slice(seqs[0]!.length - suffixLen);
		const choiceMembers = middles.filter(m => m.length > 0).map(m => m[0]!);

		const resolvedPrefix = prefix.flatMap(m => {
			const r = resolveChoices(m, ctx);
			return r.length === 1 ? [r[0]!] : [{ type: 'CHOICE' as const, members: r }];
		});
		const resolvedChoice = choiceMembers.length > 0
			? resolveChoice(choiceMembers, ctx)
			: [{ type: 'BLANK' as const }];
		const resolvedSuffix = suffix.flatMap(m => {
			const r = resolveChoices(m, ctx);
			return r.length === 1 ? [r[0]!] : [{ type: 'CHOICE' as const, members: r }];
		});

		// If the demoted CHOICE itself resolved to multiple variants,
		// that's fine — they're all at one position, treated as a union slot.
		// Wrap in a CHOICE to preserve the structure.
		const demotedChoice = resolvedChoice.length === 1
			? resolvedChoice[0]!
			: { type: 'CHOICE' as const, members: resolvedChoice };

		return [{ type: 'SEQ', members: [...resolvedPrefix, demotedChoice, ...resolvedSuffix] }];
	}

	// Not factorable: each branch becomes its own variant.
	// Resolve inner CHOICEs within each branch, then cross-product.
	const allResolved: GrammarRule[] = [];
	for (const branch of branches) {
		allResolved.push(...resolveChoices(branch, ctx));
	}
	return allResolved;
}

// ---------------------------------------------------------------------------
// Normalization + structural equality
// ---------------------------------------------------------------------------

function unwrapPrec(rule: GrammarRule): GrammarRule {
	while (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		rule = rule.content;
	}
	return rule;
}

function normalizeToSeq(rule: GrammarRule): GrammarRule[] {
	const unwrapped = unwrapPrec(rule);
	if (unwrapped.type === 'SEQ') return unwrapped.members;
	return [unwrapped];
}

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
 * STRING: same value. FIELD: same name. SYMBOL: same name. BLANK: always equal.
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
// Variant metadata — extract fields and literals from a resolved rule
// ---------------------------------------------------------------------------

/**
 * Build a StructuralVariant with field/literal metadata from a resolved grammar rule.
 * The template field is left empty — the rules emitter generates it via ruleToTemplate.
 */
function buildVariantMetadata(rule: GrammarRule, ctx: FactorContext): StructuralVariant {
	const fields = new Map<string, { required: boolean; multiple: boolean }>();
	const literals = new Map<number, string>();
	let litPos = 0;

	function walk(r: GrammarRule) {
		switch (r.type) {
			case 'FIELD':
				fields.set(r.name, {
					required: ctx.fieldRequired.get(r.name) ?? false,
					multiple: ctx.fieldMultiple.get(r.name) ?? false,
				});
				walk(r.content);
				break;
			case 'STRING':
				literals.set(litPos++, r.value);
				break;
			case 'SEQ':
				for (const m of r.members) walk(m);
				break;
			case 'CHOICE':
				for (const m of r.members) walk(m);
				break;
			case 'REPEAT':
			case 'REPEAT1':
				walk(r.content);
				break;
			case 'PREC':
			case 'PREC_LEFT':
			case 'PREC_RIGHT':
			case 'PREC_DYNAMIC':
				walk(r.content);
				break;
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN':
				walk(r.content);
				break;
			case 'ALIAS':
				walk(r.content);
				break;
			case 'SYMBOL':
			case 'BLANK':
			case 'PATTERN':
				break;
		}
	}
	walk(rule);

	return {
		name: '',
		rule,
		parts: [],
		fields,
		literals,
		template: '',
		clauses: [],
	};
}

// ---------------------------------------------------------------------------
// Deduplication + naming
// ---------------------------------------------------------------------------

function deduplicateVariants(variants: StructuralVariant[]): StructuralVariant[] {
	if (variants.length <= 1) return variants;

	// Deduplicate by field set signature (fields present + their literals)
	const seen = new Map<string, StructuralVariant>();
	for (const v of variants) {
		const fieldKey = [...v.fields.keys()].sort().join(',');
		const litKey = [...v.literals.values()].sort().join(',');
		const key = `${fieldKey}|${litKey}`;
		if (!seen.has(key)) {
			seen.set(key, v);
		}
	}
	return [...seen.values()];
}

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

	return `v${index}`;
}

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
		'for': 'for', 'fn': 'fn', 'struct': 'struct', 'enum': 'enum',
		'impl': 'impl', 'trait': 'trait', 'unsafe': 'unsafe', 'async': 'async',
		'const': 'const', 'static': 'static', 'mut': 'mut', 'ref': 'ref',
		'pub': 'pub', 'use': 'use', 'mod': 'mod', 'type': 'type_kw',
	};
	if (names[token]) return names[token]!;
	if (/^[a-zA-Z_]\w*$/.test(token)) return token;
	return `tok_${[...token].map(c => c.charCodeAt(0).toString(16)).join('')}`;
}
