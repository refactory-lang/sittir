/**
 * compiler/common.ts — utilities shared across multiple pipeline
 * phases and downstream emitters.
 *
 * Anything exported here is consumed by two or more sibling modules
 * from different layers (compiler phase + emitter, or two distinct
 * phases).  A helper that is only used by one other file stays in
 * that file; a helper that is used everywhere lives here.
 */

import type { Rule } from "./rule.ts";

/**
 * Compile the grammar's `word` rule into a full-match RegExp so
 * emitters can check whether an arbitrary string matches the
 * grammar's identifier shape (e.g. "does `match` look like an
 * identifier under python's soft-keyword rules?").
 *
 * Returns `undefined` when:
 * - `word` is null / missing / not a known rule name.
 * - The rule's tree references shapes the walker doesn't
 *   understand (e.g. a symbol ref into another rule). Callers
 *   fall back to a generic `/^\w+$/` heuristic in that case.
 *
 * @remarks
 *   First tries the `u` flag (needed for `\p{...}` property
 *   escapes); if that fails, retries flag-less so older grammars
 *   keep working.
 */
export function compileWordMatcher(
	word: string | null | undefined,
	rules: Record<string, Rule>,
): RegExp | undefined {
	if (!word) return undefined;
	const wordRule = rules[word];
	if (!wordRule) return undefined;
	const src = ruleToRegexSource(wordRule);
	if (src === null) return undefined;
	const full = `^(?:${src})$`;
	try {
		return new RegExp(full, "u");
	} catch {
		try {
			return new RegExp(full);
		} catch {
			return undefined;
		}
	}
}

/**
 * Convert a Rule subtree to a regex source fragment. Returns `null`
 * for shapes that can't be expressed as a single regex — notably
 * symbol references (which would need another rule lookup) and
 * anything outside the supported text-terminal shapes.
 */
function ruleToRegexSource(rule: Rule): string | null {
	switch (rule.type) {
		case "pattern":
			return rule.value;
		case "string":
			return escapeRegexLiteral(rule.value);
		case "token":
		case "terminal":
			return ruleToRegexSource((rule as { content: Rule }).content);
		case "seq": {
			const parts: string[] = [];
			for (const m of rule.members) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(`(?:${p})`);
			}
			return parts.join("");
		}
		case "choice": {
			const parts: string[] = [];
			for (const m of rule.members) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(p);
			}
			return `(?:${parts.join("|")})`;
		}
		case "optional": {
			const p = ruleToRegexSource(rule.content);
			if (p === null) return null;
			return `(?:${p})?`;
		}
		case "repeat": {
			const p = ruleToRegexSource(rule.content);
			if (p === null) return null;
			return `(?:${p})*`;
		}
		case "repeat1": {
			const p = ruleToRegexSource(rule.content);
			if (p === null) return null;
			return `(?:${p})+`;
		}
		default:
			// symbol / field / variant / supertype / enum / indent /
			// dedent / newline — none of these have a single regex
			// representation without additional context.
			return null;
	}
}

function escapeRegexLiteral(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
