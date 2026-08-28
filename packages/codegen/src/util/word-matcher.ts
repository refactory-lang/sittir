import { CHOICE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../types/rule.ts';

export function compileWordMatcher(
	word: string | null | undefined,
	rules: Record<string, AnyRule>
): RegExp | undefined {
	if (!word) return undefined;
	const wordRule = rules[word];
	if (!wordRule) return undefined;
	const src = ruleToRegexSource(wordRule);
	if (src === null) return undefined;
	const full = `^(?:${src})$`;
	try {
		return new RegExp(full, 'u');
	} catch {
		try {
			return new RegExp(full);
		} catch {
			return undefined;
		}
	}
}

export function matchesWordShape(value: string, wordMatcher: RegExp | undefined): boolean {
	return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}

function ruleToRegexSource(rule: AnyRule): string | null {
	const shaped = rule as {
		value?: string;
		content?: AnyRule;
		members?: readonly AnyRule[];
	};
	switch (rule.type) {
		case PATTERN:
			return shaped.value ?? null;
		case STRING:
			return shaped.value === undefined ? null : escapeRegexLiteral(shaped.value);
		case TOKEN:
			return shaped.content ? ruleToRegexSource(shaped.content) : null;
		case SEQ: {
			const parts: string[] = [];
			for (const m of shaped.members ?? []) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(`(?:${p})`);
			}
			return parts.join('');
		}
		case CHOICE: {
			const parts: string[] = [];
			for (const m of shaped.members ?? []) {
				const p = ruleToRegexSource(m);
				if (p === null) return null;
				parts.push(p);
			}
			return `(?:${parts.join('|')})`;
		}
		case OPTIONAL: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})?`;
		}
		case REPEAT: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})*`;
		}
		case REPEAT1: {
			const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
			if (p === null) return null;
			return `(?:${p})+`;
		}
		default:
			return null;
	}
}

function escapeRegexLiteral(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
