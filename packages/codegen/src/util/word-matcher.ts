import { ALIAS, CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../types/rule.ts';
import { compileAnchoredPattern, isPrecWrapperType, isTokenWrapperType } from '../types/runtime-shapes.ts';

export function compileWordMatcher(
	word: string | null | undefined,
	rules: Record<string, AnyRule>
): RegExp | undefined {
	if (!word) return undefined;
	const wordRule = rules[word];
	if (!wordRule) return undefined;
	const src = ruleToRegexSource(wordRule);
	if (src === null) return undefined;
	const compiled = compileAnchoredPattern(src);
	return 'regex' in compiled ? compiled.regex : undefined;
}

export function matchesWordShape(value: string, wordMatcher: RegExp | undefined): boolean {
	return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}

export function wordCharClass(wordMatcher: RegExp | undefined): (c: string) => boolean {
	const base = wordMatcher ?? /\w+/;
	const src = base.source.replace(/\$$/, '');
	const flags = base.flags.replace(/[gm]/g, '');
	let anchored: RegExp;
	try {
		anchored = new RegExp(`^(?:${src})`, flags);
	} catch {
		anchored = /^\w/;
	}
	const joins = (pair: string): boolean => {
		const m = pair.match(anchored);
		return !!(m && m[0] !== undefined && m[0].length > 1);
	};
	return (c: string) => c.length > 0 && (joins(`a${c}`) || joins(`${c}a`));
}

export function wordCharAsciiTable(wordMatcher: RegExp): boolean[] {
	const isWord = wordCharClass(wordMatcher);
	return Array.from({ length: 128 }, (_, i) => isWord(String.fromCharCode(i)));
}

export function ruleToRegexSource(rule: AnyRule): string | null {
	const shaped = rule as {
		value?: string;
		content?: AnyRule;
		members?: readonly AnyRule[];
	};
	if (isTokenWrapperType(rule.type) || isPrecWrapperType(rule.type) || rule.type === FIELD || rule.type === ALIAS) {
		return shaped.content ? ruleToRegexSource(shaped.content) : null;
	}
	switch (rule.type) {
		case PATTERN:
			return shaped.value ?? null;
		case STRING:
			return shaped.value === undefined ? null : escapeRegexLiteral(shaped.value);
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

export function escapeRegexLiteral(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
