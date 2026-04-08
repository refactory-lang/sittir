/**
 * Override Enrichment — inject synthetic FIELD nodes into grammar rules.
 *
 * Runs before template emission. Walks the raw grammar rule tree and wraps
 * positions that match override fields with synthetic FIELD nodes:
 *
 *   SYMBOL("_expression")  →  FIELD("start", SYMBOL("_expression"))
 *   CHOICE("..", "..=")    →  FIELD("operator", CHOICE("..", "..="))
 *   STRING("-")            →  FIELD("operator", STRING("-"))
 *
 * After enrichment, the template walker sees only FIELDs and emits $VARIABLE
 * without any override-specific logic.
 */

import type { GrammarRule } from './grammar.ts';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OverrideFieldInfo {
	name: string;
	/** Named type references (e.g. "_expression", "block"). */
	namedKinds: Set<string>;
	/** Anonymous token values (e.g. "-", "..", "!"). */
	anonymousKinds: Set<string>;
}

/**
 * Enrich a grammar rule by wrapping override-matched positions with synthetic FIELDs.
 * Returns a new rule tree (original is not mutated).
 */
export function applyOverrides(
	rule: GrammarRule,
	overrides: OverrideFieldInfo[],
): GrammarRule {
	if (overrides.length === 0) return rule;
	const consumed = new Set<string>();
	return walkAndWrap(rule, overrides, consumed);
}

// ---------------------------------------------------------------------------
// Tree walker
// ---------------------------------------------------------------------------

function walkAndWrap(
	rule: GrammarRule,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): GrammarRule {
	switch (rule.type) {
		case 'SYMBOL': {
			const match = findNamedOverride(rule.name, entries, consumed);
			if (match) {
				consumed.add(match.name);
				return { type: 'FIELD', name: match.name, content: rule };
			}
			return rule;
		}

		case 'STRING': {
			const match = findAnonymousOverride(rule.value, entries, consumed);
			if (match) {
				consumed.add(match.name);
				return { type: 'FIELD', name: match.name, content: rule };
			}
			return rule;
		}

		case 'CHOICE': {
			// Check if the whole CHOICE matches an override.
			// Case 1: CHOICE of STRINGs → anonymous override (e.g. CHOICE("..", "..=", "..."))
			const stringMembers = rule.members.filter(m => unwrapPrec(m).type === 'STRING');
			if (stringMembers.length >= 2) {
				const stringValues = new Set(stringMembers.map(m => (unwrapPrec(m) as Extract<GrammarRule, { type: 'STRING' }>).value));
				const match = findChoiceOverride(stringValues, entries, consumed, /* anonymous */ true);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}

			// Case 2: CHOICE of SYMBOLs → named override (e.g. CHOICE(integer_literal, float_literal))
			const symbolMembers = rule.members.filter(m => unwrapPrec(m).type === 'SYMBOL');
			if (symbolMembers.length >= 2) {
				const symbolNames = new Set(symbolMembers.map(m => (unwrapPrec(m) as Extract<GrammarRule, { type: 'SYMBOL' }>).name));
				const match = findChoiceOverride(symbolNames, entries, consumed, /* anonymous */ false);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}

			// No whole-CHOICE match — recurse into each branch independently.
			// Each branch gets its own consumed clone so all branches are wrapped symmetrically.
			const parentConsumed = new Set(consumed);
			const wrappedMembers: GrammarRule[] = [];
			for (const m of rule.members) {
				const branchConsumed = new Set(parentConsumed);
				wrappedMembers.push(walkAndWrap(m, entries, branchConsumed));
				for (const c of branchConsumed) consumed.add(c);
			}
			return { type: 'CHOICE', members: wrappedMembers };
		}

		case 'SEQ':
			return { type: 'SEQ', members: rule.members.map(m => walkAndWrap(m, entries, consumed)) };

		case 'REPEAT':
			return { type: 'REPEAT', content: walkAndWrap(rule.content, entries, consumed) };
		case 'REPEAT1':
			return { type: 'REPEAT1', content: walkAndWrap(rule.content, entries, consumed) };

		case 'FIELD':
			// Already a tree-sitter FIELD — don't re-wrap, but recurse into content
			return { type: 'FIELD', name: rule.name, content: walkAndWrap(rule.content, entries, consumed) };

		case 'PREC':
			return { type: 'PREC', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_LEFT':
			return { type: 'PREC_LEFT', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_RIGHT':
			return { type: 'PREC_RIGHT', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_DYNAMIC':
			return { type: 'PREC_DYNAMIC', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };

		case 'ALIAS':
			if (rule.named) {
				const match = findNamedOverride(rule.value, entries, consumed);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}
			return { type: 'ALIAS', content: walkAndWrap(rule.content, entries, consumed), named: rule.named, value: rule.value };

		case 'TOKEN':
			return { type: 'TOKEN', content: walkAndWrap(rule.content, entries, consumed) };
		case 'IMMEDIATE_TOKEN':
			return { type: 'IMMEDIATE_TOKEN', content: walkAndWrap(rule.content, entries, consumed) };

		case 'BLANK':
		case 'PATTERN':
			return rule;
	}
}

// ---------------------------------------------------------------------------
// Override matching helpers
// ---------------------------------------------------------------------------

/** Match a SYMBOL name against named override kinds (strips _ prefix for hidden rules). */
function findNamedOverride(
	symbolName: string,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): OverrideFieldInfo | undefined {
	const lookupName = symbolName.startsWith('_') ? symbolName.slice(1) : symbolName;
	return entries.find(e =>
		!consumed.has(e.name) && (
			e.namedKinds.has(symbolName) ||
			e.namedKinds.has(lookupName) ||
			// Name-based fallback for empty-kinds override fields (hidden grammar rules)
			(e.namedKinds.size === 0 && e.anonymousKinds.size === 0 && e.name === lookupName)
		),
	);
}

/** Match a STRING token value against anonymous override kinds. */
function findAnonymousOverride(
	tokenValue: string,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): OverrideFieldInfo | undefined {
	return entries.find(e =>
		!consumed.has(e.name) &&
		e.anonymousKinds.has(tokenValue),
	);
}

/** Match a set of CHOICE values against an override (any overlap → match). */
function findChoiceOverride(
	values: Set<string>,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
	anonymous: boolean,
): OverrideFieldInfo | undefined {
	return entries.find(e => {
		if (consumed.has(e.name)) return false;
		const kinds = anonymous ? e.anonymousKinds : e.namedKinds;
		for (const v of values) {
			if (kinds.has(v)) return true;
			// Strip _ prefix for hidden rule names
			if (!anonymous && v.startsWith('_') && kinds.has(v.slice(1))) return true;
		}
		return false;
	});
}

/** Unwrap PREC wrappers to get the core rule type. */
function unwrapPrec(rule: GrammarRule): GrammarRule {
	while (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		rule = rule.content;
	}
	return rule;
}
