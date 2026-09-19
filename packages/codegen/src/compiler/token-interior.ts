import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../types/rule.ts';
import { makeRuleMetadata } from '../dsl/rule-metadata.ts';
import { composeTokenText } from '../dsl/rule-patterns.ts';

type LinkRule = Rule<'link'>;

const CONTENT_SLOT = 'content';
const PREFIX_SLOT = 'prefix';
const SUFFIX_SLOT = 'suffix';

type Member = 'template' | 'flag' | 'enum' | 'slot';

function isBlank(rule: LinkRule): boolean {
	return (rule.type === CHOICE || rule.type === SEQ) && rule.members.length === 0;
}

function isEnumOfStrings(rule: LinkRule): boolean {
	if (rule.type === CHOICE) {
		const arms = rule.members.filter((m) => !isBlank(m));
		return arms.length > 0 && arms.every((m) => m.type === STRING || isEnumOfStrings(m));
	}
	return false;
}

function containsPattern(rule: LinkRule): boolean {
	switch (rule.type) {
		case PATTERN:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(containsPattern);
		case OPTIONAL:
		case FIELD:
			return containsPattern(rule.content);
		default:
			return false;
	}
}

function isField(rule: LinkRule): rule is LinkRule & { type: typeof FIELD } {
	return rule.type === FIELD;
}

function memberClass(rule: LinkRule): Member {
	if (rule.type === STRING) return 'template';
	if (rule.type === OPTIONAL && rule.content.type === STRING) return 'flag';
	if (rule.type === CHOICE && rule.members.length === 2 && rule.members.some(isBlank)) {
		const arm = rule.members.find((m) => !isBlank(m));
		if (arm?.type === STRING) return 'flag';
	}
	if (isEnumOfStrings(rule)) return 'enum';
	if (rule.type === OPTIONAL && isEnumOfStrings(rule.content)) return 'enum';
	return 'slot';
}

function flagString(rule: LinkRule): LinkRule {
	return (rule.type === OPTIONAL ? rule.content : rule.type === CHOICE ? rule.members.find((m) => !isBlank(m))! : rule) as LinkRule;
}

function flagText(rule: LinkRule): string {
	const inner = rule.type === OPTIONAL ? rule.content : rule.type === CHOICE ? rule.members.find((m) => !isBlank(m))! : rule;
	return (inner as { value: string }).value;
}

function fieldOf(name: string, content: LinkRule, id: LinkRule['id']): LinkRule {
	return {
		type: FIELD,
		name,
		content,
		metadata: makeRuleMetadata({ fieldSource: 'grammar' }),
		...(id !== undefined ? { id } : {})
	} as LinkRule;
}

function structureSeq(
	seq: LinkRule & { type: typeof SEQ },
	lookup: (name: string) => LinkRule | undefined
): LinkRule | undefined {
	const classes = seq.members.map(memberClass);
	if (!seq.members.some((m, i) => classes[i] === 'slot' && containsPattern(m))) return undefined;
	if (!classes.some((c) => c === 'template' || c === 'flag' || c === 'enum')) return undefined;
	const slotCount = classes.filter(
		(c, i) => c === 'slot' && !isField(seq.members[i]!) && (classes[i - 1] !== 'slot' || isField(seq.members[i - 1]!))
	).length;
	const out: LinkRule[] = [];
	let slotSeen = false;
	for (let i = 0; i < seq.members.length; ) {
		const cls = classes[i]!;
		const member = seq.members[i]!;
		if (cls === 'enum') {
			const name = slotSeen ? SUFFIX_SLOT : PREFIX_SLOT;
			out.push(fieldOf(name, member, member.id));
			i += 1;
			continue;
		}
		if (cls === 'flag') {
			out.push(fieldOf(flagText(member), { type: OPTIONAL, content: { ...flagString(member), nonterminal: true } } as LinkRule, member.id));
			i += 1;
			continue;
		}
		if (cls !== 'slot') {
			out.push(member);
			i += 1;
			continue;
		}
		let end = i + 1;
		if (!isField(member)) {
			while (end < seq.members.length && classes[end] === 'slot' && !isField(seq.members[end]!)) end += 1;
		}
		const run = seq.members.slice(i, end);
		const composed = composeTokenText(
			isField(member) ? (member.content as LinkRule) : ({ ...seq, members: run } as LinkRule),
			lookup
		);
		if (composed === undefined) return undefined;
		const name = isField(member) ? member.name : slotCount === 1 || !slotSeen ? CONTENT_SLOT : `${CONTENT_SLOT}${out.length}`;
		out.push(fieldOf(name, { type: PATTERN, value: composed, id: run[0]!.id } as LinkRule, run[0]!.id));
		slotSeen = true;
		i = end;
	}
	return { ...seq, members: out };
}

function structureInterior(
	content: LinkRule,
	lookup: (name: string) => LinkRule | undefined
): LinkRule | undefined {
	if (content.type === SEQ) return structureSeq(content as LinkRule & { type: typeof SEQ }, lookup);
	return undefined;
}

type PatternPart = { readonly lit: string } | { readonly group: string; readonly pattern: string };

const CONTROL_ESCAPES: Readonly<Record<string, string>> = { n: '\n', r: '\r', t: '\t', f: '\f', v: '\v', 0: '\0' };
const REGEX_SPECIALS = '[]()|*+?{}.^$';

function closingParen(source: string, from: number): number {
	let depth = 1;
	let inClass = false;
	for (let i = from; i < source.length; i++) {
		const c = source[i]!;
		if (c === '\\') i += 1;
		else if (inClass) inClass = c !== ']';
		else if (c === '[') inClass = true;
		else if (c === '(') depth += 1;
		else if (c === ')' && --depth === 0) return i;
	}
	return -1;
}

function notPure(kind: string, source: string): never {
	throw new Error(
		`token interior: the pattern of '${kind}' draws a named group but its remaining top-level regex is not literal text: ${source}`
	);
}

function namedGroupParts(kind: string, source: string): readonly PatternPart[] | undefined {
	if (!/\(\?<[A-Za-z_]\w*>/.test(source)) return undefined;
	const parts: PatternPart[] = [];
	const pushLit = (text: string): void => {
		const last = parts[parts.length - 1];
		if (last !== undefined && 'lit' in last) parts[parts.length - 1] = { lit: last.lit + text };
		else parts.push({ lit: text });
	};
	for (let i = 0; i < source.length; i++) {
		const c = source[i]!;
		if (c === '\\') {
			const next = source[i + 1];
			if (next === undefined) return notPure(kind, source);
			if (/[A-Za-z0-9]/.test(next) && CONTROL_ESCAPES[next] === undefined) return notPure(kind, source);
			pushLit(CONTROL_ESCAPES[next] ?? next);
			i += 1;
			continue;
		}
		const named = c === '(' ? /^\(\?<([A-Za-z_]\w*)>/.exec(source.slice(i)) : null;
		if (named !== null) {
			const end = closingParen(source, i + named[0].length);
			if (end < 0) return notPure(kind, source);
			parts.push({ group: named[1]!, pattern: source.slice(i + named[0].length, end) });
			i = end;
			continue;
		}
		if (REGEX_SPECIALS.includes(c)) return notPure(kind, source);
		pushLit(c);
	}
	return parts;
}

function structurePattern(kind: string, rule: LinkRule & { type: typeof PATTERN }): LinkRule | undefined {
	const parts = namedGroupParts(kind, rule.value);
	if (parts === undefined) return undefined;
	const members: LinkRule[] = parts.map((part) =>
		'lit' in part
			? ({ type: STRING, value: part.lit } as LinkRule)
			: fieldOf(part.group, { type: PATTERN, value: part.pattern } as LinkRule, rule.id)
	);
	return { type: SEQ, members, lexed: true, ...(rule.id !== undefined ? { id: rule.id } : {}) } as unknown as LinkRule;
}

export function structureTokenInterior(rules: Record<string, LinkRule>): void {
	const lookup = (name: string): LinkRule | undefined => rules[name];
	for (const [kind, rule] of Object.entries(rules)) {
		if (rule.type === PATTERN) {
			const structuredPattern = structurePattern(kind, rule);
			if (structuredPattern !== undefined) rules[kind] = structuredPattern;
			continue;
		}
		if (rule.type !== TOKEN) continue;
		const structured = structureInterior(rule.content, lookup);
		if (structured !== undefined) rules[kind] = { ...rule, content: structured } as LinkRule;
	}
}
