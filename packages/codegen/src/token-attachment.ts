/**
 * Token attachment analysis — derive spacing rules from grammar structure.
 *
 * Instead of hardcoding which tokens attach left/right, analyze the
 * grammar's SEQ patterns to determine how each token relates to its
 * neighbors (fields, symbols, other tokens).
 *
 * Attachment rules:
 * - attachLeft: no space BEFORE this token (token attaches to preceding content)
 * - attachRight: no space AFTER this token (token attaches to following content)
 */

import type { GrammarRule, Grammar } from './grammar.ts';

export interface TokenAttachmentRules {
	attachLeft: boolean;
	attachRight: boolean;
}

export type TokenAttachmentMap = ReadonlyMap<string, TokenAttachmentRules>;

interface TokenStats {
	total: number;
	afterField: number;   // appears right after a FIELD
	beforeField: number;  // appears right before a FIELD
	afterSymbol: number;  // appears right after a SYMBOL
	beforeSymbol: number; // appears right before a SYMBOL
	isImmediate: boolean; // appears inside IMMEDIATE_TOKEN
}

function unwrap(r: GrammarRule): GrammarRule {
	while (r.type === 'PREC' || r.type === 'PREC_LEFT' || r.type === 'PREC_RIGHT' || r.type === 'PREC_DYNAMIC') {
		r = r.content;
	}
	return r;
}

function analyzeSeq(members: GrammarRule[], stats: Map<string, TokenStats>): void {
	for (let i = 0; i < members.length; i++) {
		const m = unwrap(members[i]!);
		if (m.type === 'STRING') {
			const s = stats.get(m.value) ?? { total: 0, afterField: 0, beforeField: 0, afterSymbol: 0, beforeSymbol: 0, isImmediate: false };
			s.total++;
			const prev = i > 0 ? unwrap(members[i - 1]!) : null;
			const next = i < members.length - 1 ? unwrap(members[i + 1]!) : null;
			if (prev?.type === 'FIELD') s.afterField++;
			if (next?.type === 'FIELD') s.beforeField++;
			if (prev?.type === 'SYMBOL') s.afterSymbol++;
			if (next?.type === 'SYMBOL') s.beforeSymbol++;
			stats.set(m.value, s);
		}
		if (m.type === 'SEQ') analyzeSeq(m.members, stats);
		if (m.type === 'CHOICE') {
			for (const c of m.members) {
				const u = unwrap(c);
				if (u.type === 'SEQ') analyzeSeq(u.members, stats);
			}
		}
	}
}

function collectImmediateTokens(rule: GrammarRule, immediate: Set<string>): void {
	if (rule.type === 'IMMEDIATE_TOKEN') {
		collectStrings(rule.content, immediate);
		return;
	}
	if ('members' in rule && rule.members) {
		for (const m of rule.members) collectImmediateTokens(m, immediate);
	}
	if ('content' in rule && rule.content) collectImmediateTokens(rule.content, immediate);
}

function collectStrings(rule: GrammarRule, set: Set<string>): void {
	if (rule.type === 'STRING') { set.add(rule.value); return; }
	if ('members' in rule && rule.members) for (const m of rule.members) collectStrings(m, set);
	if ('content' in rule && rule.content) collectStrings(rule.content, set);
}

// Well-known delimiter pairs — always attach inward
const OPEN_DELIMITERS = new Set(['(', '[', '{', '<']);
const CLOSE_DELIMITERS = new Set([')', ']', '}', '>']);

/**
 * Build a token attachment map from grammar analysis.
 * Call once per grammar at codegen time.
 */
export function buildTokenAttachmentMap(grammar: Grammar): TokenAttachmentMap {
	const stats = new Map<string, TokenStats>();
	const immediate = new Set<string>();

	for (const rule of Object.values(grammar.rules)) {
		const r = unwrap(rule);
		if (r.type === 'SEQ') analyzeSeq(r.members, stats);
		if (r.type === 'CHOICE') {
			for (const m of r.members) {
				const u = unwrap(m);
				if (u.type === 'SEQ') analyzeSeq(u.members, stats);
			}
		}
		collectImmediateTokens(rule, immediate);
	}

	// Mark immediate tokens
	for (const tok of immediate) {
		const s = stats.get(tok);
		if (s) s.isImmediate = true;
	}

	const result = new Map<string, TokenAttachmentRules>();

	for (const [token, s] of stats) {
		let attachLeft = false;
		let attachRight = false;

		// Delimiter rules (always)
		if (OPEN_DELIMITERS.has(token)) { attachLeft = true; attachRight = true; }
		if (CLOSE_DELIMITERS.has(token)) { attachLeft = true; }

		// IMMEDIATE_TOKEN → attach left (no space before)
		if (s.isImmediate) attachLeft = true;

		// Quotes — wrap content
		if (token === '"' || token === "'" || token === '`') { attachLeft = true; attachRight = true; }

		// Pipe — closure delimiters
		if (token === '|') { attachLeft = true; attachRight = true; }

		// Tokens that always appear after fields/symbols → attach left
		// (colon, semicolon, comma, ?, !, .)
		if (s.afterField + s.afterSymbol > 0 && s.beforeField + s.beforeSymbol === 0) {
			attachLeft = true;
		}

		// Tokens that always appear before fields/symbols → attach right
		// (&, *, #, $, ') — but NOT word-like tokens (keywords always need space after)
		if (s.beforeField + s.beforeSymbol > 0 && s.afterField + s.afterSymbol === 0) {
			if (!/^[a-z_]+$/i.test(token)) {
				attachRight = true;
			}
		}

		// Tokens between fields: distinguish separators (: ;) from connectors (:: .)
		// Separators: attach left only (x: T has space after, not x:T)
		// Connectors: attach both (a::b, a.b have no spaces)
		if (s.afterField > 0 && s.beforeField > 0) {
			attachLeft = true;
			// Short connectors (<=2 chars, not word-like) attach both
			if (token.length <= 2 && !/^[a-z]+$/i.test(token) && token !== ':' && token !== ';') {
				attachRight = true;
			}
		}

		result.set(token, { attachLeft, attachRight });
	}

	return result;
}

/**
 * Check if two adjacent template parts should have no space between them.
 * Uses the grammar-derived attachment map.
 */
export function isAttachedByMap(prev: string, next: string, map: TokenAttachmentMap): boolean {
	// Check if prev attaches right
	const prevRules = map.get(prev);
	if (prevRules?.attachRight) return true;

	// Check if next attaches left
	const nextRules = map.get(next);
	if (nextRules?.attachLeft) return true;

	// $VARIABLE after delimiter (prev ends with opening delimiter)
	if (next.startsWith('$')) {
		const lastChar = prev.charAt(prev.length - 1);
		if (OPEN_DELIMITERS.has(lastChar)) return true;
	}

	return false;
}
