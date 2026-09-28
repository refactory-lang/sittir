import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, TOKEN } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../types/rule.ts';
import { makeRuleMetadata } from '../dsl/rule-metadata.ts';
import { composeTokenText, isBlank, optionalContentOf, withOptionalContent } from '../dsl/rule-patterns.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';

type LinkRule = Rule<'link'>;

const CONTENT_SLOT = 'content';
const PREFIX_SLOT = 'prefix';
const SUFFIX_SLOT = 'suffix';

type Member = 'template' | 'flag' | 'enum' | 'slot' | 'group';

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
		case REPEAT:
		case REPEAT1:
		case FIELD:
			return containsPattern(rule.content);
		default:
			return false;
	}
}

function containsField(rule: LinkRule): boolean {
	switch (rule.type) {
		case FIELD:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(containsField);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
			return containsField(rule.content);
		default:
			return false;
	}
}

function isField(rule: LinkRule): rule is LinkRule & { type: typeof FIELD } {
	return rule.type === FIELD;
}

function groupArm(rule: LinkRule): (LinkRule & { type: typeof SEQ }) | undefined {
	const arm = optionalContentOf(rule);
	return arm !== undefined && arm.type === SEQ && containsField(arm) ? (arm as LinkRule & { type: typeof SEQ }) : undefined;
}

function optionalArm(rule: LinkRule): LinkRule | undefined {
	if (rule.type === REPEAT) return { ...rule, type: REPEAT1 } as LinkRule;
	return optionalContentOf(rule);
}

function isOptionalEnumOfStrings(rule: LinkRule): boolean {
	const optional = optionalContentOf(rule);
	return optional !== undefined && isEnumOfStrings(optional);
}

function memberClass(rule: LinkRule): Member {
	if (rule.type === STRING) return 'template';
	if (groupArm(rule) !== undefined) return 'group';
	if (rule.type === FIELD) return isEnumOfStrings(rule.content) || isOptionalEnumOfStrings(rule.content) ? 'enum' : 'slot';
	if (optionalContentOf<LinkRule>(rule)?.type === STRING) return 'flag';
	if (isEnumOfStrings(rule) || isOptionalEnumOfStrings(rule)) return 'enum';
	return 'slot';
}

function flagString(rule: LinkRule): LinkRule {
	return optionalContentOf(rule) ?? rule;
}

function flagText(rule: LinkRule): string {
	return (flagString(rule) as { value: string }).value;
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

function flattenMembers(members: readonly LinkRule[]): LinkRule[] {
	return members.flatMap((member) =>
		member.type === SEQ && !(member as { lexed?: boolean }).lexed ? flattenMembers(member.members) : [member]
	);
}

interface InteriorState {
	slotSeen: boolean;
	readonly slotCount: number;
}

const TOKEN_INTERIOR_UNSTRUCTURABLE = 'token-interior-unstructurable';

function recordUnnamedInGroup(kind: string, diagnostics: DiagnosticSink): undefined {
	diagnostics.fail({
		code: TOKEN_INTERIOR_UNSTRUCTURABLE,
		ownerKind: kind,
		message: `token interior: '${kind}' names a part inside an optional group next to an unnamed pattern, so the token stays opaque. Resolve with a patch naming the group's unnamed pattern (field(...))`,
		details: { shape: 'unnamed-in-group' }
	});
	return undefined;
}

function structureMembers(
	kind: string,
	rawMembers: readonly LinkRule[],
	lookup: (name: string) => LinkRule | undefined,
	state: InteriorState,
	inGroup: boolean,
	diagnostics: DiagnosticSink
): LinkRule[] | undefined {
	const members = [...rawMembers];
	const classes = members.map(memberClass);
	const out: LinkRule[] = [];
	for (let i = 0; i < members.length; ) {
		const cls = classes[i]!;
		const member = members[i]!;
		if (cls === 'group') {
			const arm = groupArm(member)!;
			const inner = structureMembers(kind, flattenMembers(arm.members), lookup, state, true, diagnostics);
			if (inner === undefined) return undefined;
			const rebuilt = { ...arm, members: inner } as LinkRule;
			out.push(withOptionalContent(member, rebuilt));
			i += 1;
			continue;
		}
		if (cls === 'enum') {
			const named = isField(member);
			const name = named ? member.name : state.slotSeen ? SUFFIX_SLOT : PREFIX_SLOT;
			out.push(named ? member : fieldOf(name, member, member.id));
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
			if (inGroup) return recordUnnamedInGroup(kind, diagnostics);
			while (end < members.length && classes[end] === 'slot' && !isField(members[end]!)) end += 1;
		}
		const run = members.slice(i, end);
		const fieldArm = isField(member) ? optionalArm(member.content as LinkRule) : undefined;
		const composed = composeTokenText(
			isField(member) ? (fieldArm ?? (member.content as LinkRule)) : ({ type: SEQ, members: run } as LinkRule),
			lookup
		);
		if (composed === undefined) return undefined;
		const name = isField(member) ? member.name : state.slotCount === 1 || !state.slotSeen ? CONTENT_SLOT : `${CONTENT_SLOT}${out.length}`;
		const pattern = { type: PATTERN, value: composed, id: run[0]!.id } as LinkRule;
		out.push(fieldOf(name, fieldArm === undefined ? pattern : ({ type: OPTIONAL, content: pattern } as LinkRule), run[0]!.id));
		state.slotSeen = true;
		i = end;
	}
	return out;
}

function structureSeq(
	kind: string,
	seq: LinkRule & { type: typeof SEQ },
	lookup: (name: string) => LinkRule | undefined,
	diagnostics: DiagnosticSink
): LinkRule | undefined {
	const members = containsField(seq) ? flattenMembers(seq.members) : seq.members;
	const classes = members.map(memberClass);
	if (!members.some((m, i) => (classes[i] === 'slot' || classes[i] === 'group') && containsPattern(m))) return undefined;
	if (!containsField(seq) && !classes.some((c) => c === 'template' || c === 'flag' || c === 'enum' || c === 'group')) return undefined;
	const slotCount = classes.filter(
		(c, i) => c === 'slot' && !isField(members[i]!) && (classes[i - 1] !== 'slot' || isField(members[i - 1]!))
	).length;
	const out = structureMembers(kind, members, lookup, { slotSeen: false, slotCount }, false, diagnostics);
	return out === undefined ? undefined : { ...seq, members: out };
}

function structureInterior(
	kind: string,
	content: LinkRule,
	lookup: (name: string) => LinkRule | undefined,
	diagnostics: DiagnosticSink
): LinkRule | undefined {
	if (content.type === SEQ) return structureSeq(kind, content as LinkRule & { type: typeof SEQ }, lookup, diagnostics);
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

function recordNotPure(kind: string, source: string, diagnostics: DiagnosticSink): undefined {
	diagnostics.fail({
		code: TOKEN_INTERIOR_UNSTRUCTURABLE,
		ownerKind: kind,
		message: `token interior: the pattern of '${kind}' draws a named group but its remaining top-level regex is not literal text, so the token stays opaque. Resolve with a patch naming a group around the non-literal regex: ${source}`,
		details: { shape: 'named-group-beside-regex', source }
	});
	return undefined;
}

function namedGroupParts(kind: string, source: string, diagnostics: DiagnosticSink): readonly PatternPart[] | undefined {
	const notPure = (): undefined => recordNotPure(kind, source, diagnostics);
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
			if (next === undefined) return notPure();
			if (/[A-Za-z0-9]/.test(next) && CONTROL_ESCAPES[next] === undefined) return notPure();
			pushLit(CONTROL_ESCAPES[next] ?? next);
			i += 1;
			continue;
		}
		const named = c === '(' ? /^\(\?<([A-Za-z_]\w*)>/.exec(source.slice(i)) : null;
		if (named !== null) {
			const end = closingParen(source, i + named[0].length);
			if (end < 0) return notPure();
			parts.push({ group: named[1]!, pattern: source.slice(i + named[0].length, end) });
			i = end;
			continue;
		}
		if (REGEX_SPECIALS.includes(c)) return notPure();
		pushLit(c);
	}
	return parts;
}

function structurePattern(kind: string, rule: LinkRule & { type: typeof PATTERN }, diagnostics: DiagnosticSink): LinkRule | undefined {
	const parts = namedGroupParts(kind, rule.value, diagnostics);
	if (parts === undefined) return undefined;
	const members: LinkRule[] = parts.map((part) =>
		'lit' in part
			? ({ type: STRING, value: part.lit } as LinkRule)
			: fieldOf(part.group, { type: PATTERN, value: part.pattern } as LinkRule, rule.id)
	);
	return { type: SEQ, members, lexed: true, ...(rule.id !== undefined ? { id: rule.id } : {}) } as unknown as LinkRule;
}

export function structureTokenInterior(rules: Record<string, LinkRule>, diagnostics: DiagnosticSink): void {
	const lookup = (name: string): LinkRule | undefined => rules[name];
	for (const [kind, rule] of Object.entries(rules)) {
		if (rule.type === PATTERN) {
			const structuredPattern = structurePattern(kind, rule, diagnostics);
			if (structuredPattern !== undefined) rules[kind] = structuredPattern;
			continue;
		}
		if (rule.type !== TOKEN) continue;
		const structured = structureInterior(kind, rule.content, lookup, diagnostics);
		if (structured !== undefined) rules[kind] = { ...rule, content: structured } as LinkRule;
	}
}
