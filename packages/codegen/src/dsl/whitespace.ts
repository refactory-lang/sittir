import { CHOICE, STRING, SYMBOL } from '../types/rule-types.ts';
import { DEDENT_TEXT, INDENT_TEXT, isDepthText } from './primitives/spacing.ts';
import type { Rule } from '../types/rule.ts';
import { extrasRun, ruleListParts, rulesEqual, type RuleListEntry } from './rule-patterns.ts';
import { WHITESPACE_SUPERTYPE } from './primitives/spacing.ts';

export interface WhitespaceBody {
	readonly type: typeof STRING;
	readonly value: string;
}

interface WhitespaceMember {
	readonly name: string;
	readonly body: WhitespaceBody;
	readonly alwaysAdmitted?: true;
}

export const TIGHT_MEMBER = '_tight';
export const SPACE_MEMBER = '_space';

const HORIZONTAL_SPACE = ' ';

const WHITESPACE_MEMBERS: readonly WhitespaceMember[] = [
	{ name: TIGHT_MEMBER, body: { type: STRING, value: '' }, alwaysAdmitted: true },
	{ name: SPACE_MEMBER, body: { type: STRING, value: ' ' } },
	{ name: '_newline', body: { type: STRING, value: '\n' } },
	{ name: '_blankline', body: { type: STRING, value: '\n\n' } },
	{ name: '_double_blankline', body: { type: STRING, value: '\n\n\n' } },
	{ name: '_indent', body: { type: STRING, value: INDENT_TEXT } },
	{ name: '_dedent', body: { type: STRING, value: DEDENT_TEXT } }
];

function admittedTextOf(body: WhitespaceBody): string {
	return isDepthText(body.value) ? HORIZONTAL_SPACE : body.value;
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
	const run = extrasRun(extras, rules);
	const upstream = new Set(ruleListParts(externals).names);
	const members = WHITESPACE_MEMBERS.filter(
		(member) => member.alwaysAdmitted === true || (run?.test(admittedTextOf(member.body)) ?? false)
	);
	const rule: Rule = { type: CHOICE, members: members.map((member) => ({ type: SYMBOL, name: member.name })) };
	const minted: readonly (readonly [string, Rule])[] = [
		[WHITESPACE_SUPERTYPE, rule],
		...members.filter((member) => !upstream.has(member.name)).map((member) => [member.name, member.body] as const)
	];
	return {
		members: members.map((member) => member.name),
		addedExternals: members.filter((member) => !upstream.has(member.name)).map((member) => member.name),
		bodies: Object.fromEntries(
			members.filter((member) => !isDepthText(member.body.value) || !upstream.has(member.name)).map((member) => [member.name, member.body])
		),
		rule,
		collisions: minted
			.filter(([name, body]) => rules[name] !== undefined && !rulesEqual(rules[name], body))
			.map(([name]) => ({ name, site: 'upstream' }))
	};
}
