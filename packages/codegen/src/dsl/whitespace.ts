import { CHOICE, SEQ, STRING, SYMBOL } from '../types/rule-types.ts';
import { DEDENT_TEXT, INDENT_TEXT, isDepthText } from './primitives/spacing.ts';
import type { Rule } from '../types/rule.ts';
import { nodelessExtrasRun, ruleListParts, rulesEqual, type RuleListEntry } from './rule-patterns.ts';
import { LAYOUT_SUPERTYPE } from './primitives/spacing.ts';

export interface WhitespaceBody {
	readonly type: typeof STRING;
	readonly value: string;
}

export const NEWLINE_ARMS = ['\n', '\r\n', '\r'] as const;

export type MemberRule =
	| { readonly type: typeof STRING; readonly value: string }
	| { readonly type: typeof CHOICE; readonly members: readonly { readonly type: typeof STRING; readonly value: string }[]; readonly preferred: string }
	| { readonly type: typeof SEQ; readonly members: readonly { readonly type: typeof SYMBOL; readonly name: string }[] };

interface WhitespaceMember {
	readonly name: string;
	readonly rule: MemberRule;
	readonly alwaysAdmitted?: true;
}

export const TIGHT_MEMBER = '_tight';
export const SPACE_MEMBER = '_space';
export const TAB_MEMBER = '_tab';
export const NEWLINE_MEMBER = '_newline';
export const INDENT_MEMBERS: readonly string[] = [SPACE_MEMBER, TAB_MEMBER];

const HORIZONTAL_SPACE = ' ';

const newlineRef = { type: SYMBOL, name: NEWLINE_MEMBER } as const;

const WHITESPACE_MEMBERS: readonly WhitespaceMember[] = [
	{ name: TIGHT_MEMBER, rule: { type: STRING, value: '' }, alwaysAdmitted: true },
	{ name: SPACE_MEMBER, rule: { type: STRING, value: ' ' } },
	{ name: TAB_MEMBER, rule: { type: STRING, value: '\t' } },
	{ name: NEWLINE_MEMBER, rule: { type: CHOICE, members: NEWLINE_ARMS.map((value) => ({ type: STRING, value })), preferred: '\n' } },
	{ name: '_blankline', rule: { type: SEQ, members: [newlineRef, newlineRef] } },
	{ name: '_double_blankline', rule: { type: SEQ, members: [newlineRef, newlineRef, newlineRef] } },
	{ name: '_indent', rule: { type: STRING, value: INDENT_TEXT } },
	{ name: '_dedent', rule: { type: STRING, value: DEDENT_TEXT } }
];

export function whitespaceMemberRule(name: string): MemberRule {
	const member = WHITESPACE_MEMBERS.find((candidate) => candidate.name === name);
	if (member === undefined) throw new Error(`whitespace: '${name}' is not a whitespace member`);
	return member.rule;
}

export function canonicalText(name: string): string {
	const rule = whitespaceMemberRule(name);
	switch (rule.type) {
		case STRING:
			return rule.value;
		case CHOICE:
			return rule.preferred;
		case SEQ:
			return rule.members.map((ref) => canonicalText(ref.name)).join('');
	}
}

function bodyOf(name: string): WhitespaceBody {
	return { type: STRING, value: canonicalText(name) };
}


function admittedTextOf(text: string): string {
	return isDepthText(text) ? HORIZONTAL_SPACE : text;
}

export function admitsWhitespaceMember(run: RegExp | undefined, name: string, text: string): boolean {
	const alwaysAdmitted = WHITESPACE_MEMBERS.find((member) => member.name === name)?.alwaysAdmitted === true;
	return alwaysAdmitted || (run?.test(admittedTextOf(text)) ?? false);
}

export interface WhitespaceCollision {
	readonly name: string;
	readonly site: 'upstream' | 'visibleExternals';
}

export interface EnrichedWhitespace {
	readonly members: readonly string[];
	readonly addedExternals: readonly string[];
	readonly bodies: Readonly<Record<string, WhitespaceBody>>;
	readonly rule: Rule;
	readonly collisions: readonly WhitespaceCollision[];
}

export function enrichWhitespace(
	externals: readonly RuleListEntry[],
	extras: readonly RuleListEntry[],
	rules: Readonly<Record<string, Rule>>
): EnrichedWhitespace {
	const run = nodelessExtrasRun(extras, rules);
	const upstream = new Set(ruleListParts(externals).names);
	const members = WHITESPACE_MEMBERS.filter(
		(member) =>
			admitsWhitespaceMember(run, member.name, canonicalText(member.name)) &&
			!(isDepthText(canonicalText(member.name)) && upstream.has(member.name))
	);
	const rule: Rule = { type: CHOICE, members: members.map((member) => ({ type: SYMBOL, name: member.name })) };
	const minted: readonly (readonly [string, Rule])[] = [
		[LAYOUT_SUPERTYPE, rule],
		...members.filter((member) => !upstream.has(member.name)).map((member) => [member.name, bodyOf(member.name)] as const)
	];
	return {
		members: members.map((member) => member.name),
		addedExternals: members.filter((member) => !upstream.has(member.name)).map((member) => member.name),
		bodies: Object.fromEntries(members.map((member) => [member.name, bodyOf(member.name)])),
		rule,
		collisions: minted
			.filter(([name, body]) => rules[name] !== undefined && !rulesEqual(rules[name], body))
			.map(([name]) => ({ name, site: 'upstream' }))
	};
}
