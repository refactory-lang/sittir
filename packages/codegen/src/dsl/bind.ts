import {
	fieldNames,
	isParserHiddenName,
	isRecord,
	OPAQUE_RULES,
	supertypesOf,
	transparentReach,
	unwrapPrec,
	type GrammarRecord
} from './rule-patterns.ts';
import type { BindingEffect, Lead, LeadMatch } from './verbs/effects.ts';

export interface Split {
	readonly kind: string;
	readonly within: readonly string[];
	readonly as: string;
	readonly containers: readonly { readonly name: string; readonly field: string }[];
}

export interface FieldRename {
	readonly owner: string;
	readonly from: string;
	readonly to: string;
}

export type FieldWrapTarget = { readonly symbol: string } | { readonly token: string };
export interface FieldWrap {
	readonly owner: string;
	readonly field: string;
	readonly target: FieldWrapTarget;
}

export function lead(list: string, item: string, field: string, ...admits: LeadMatch[]): Lead {
	return { list, item, field, admits };
}

export function split(kind: string, as: string, placement: Pick<Split, 'within' | 'containers'>): Split {
	return { kind, as, within: placement.within, containers: placement.containers };
}

export function mappedName(record: Readonly<Record<string, string>> | undefined, name: string): string {
	return record !== undefined && Object.hasOwn(record, name) ? record[name]! : name;
}

export function fieldHosts(rules: GrammarRecord, owner: string, field: string, stop: ReadonlySet<string>): string[] {
	return [...transparentReach(rules, owner, stop)].filter((name) => fieldNames(rules[name]).has(field));
}

export function fieldRenameIssue(grammar: GrammarRecord, rename: FieldRename, batch: readonly FieldRename[] = [rename]): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (!(rename.owner in rules)) return 'owner is not a rule';
	const stop = supertypesOf(grammar);
	const hosts = fieldHosts(rules, rename.owner, rename.from, stop);
	if (hosts.length === 0) return 'field is not on the owner';
	if (hosts.some((host) => host !== rename.owner && !sharersAgree(rules, host, stop, rename, batch))) return 'field sits in a hidden rule another kind shares';
	if (fieldHosts(rules, rename.owner, rename.to, stop).length > 0) return 'member name is already a field of the owner';
	return undefined;
}

function isWrapTarget(rule: GrammarRecord, target: FieldWrapTarget): boolean {
	if ('token' in target) return rule.type === 'STRING' && rule.value === target.token;
	if (rule.type === 'SYMBOL') return rule.name === target.symbol;
	return rule.type === 'ALIAS' && rule.named === true && rule.value === target.symbol;
}

export function isWrapSite(rule: GrammarRecord, target: FieldWrapTarget): boolean {
	if (isWrapTarget(rule, target)) return true;
	return (rule.type === 'REPEAT' || rule.type === 'REPEAT1') && isRecord(rule.content) && isWrapTarget(rule.content, target);
}

function hasWrapTarget(rule: unknown, target: FieldWrapTarget): boolean {
	if (Array.isArray(rule)) return rule.some((r) => hasWrapTarget(r, target));
	if (!isRecord(rule)) return false;
	if (isWrapSite(rule, target)) return true;
	if (OPAQUE_RULES.has(rule.type) || rule.type === 'ALIAS') return false;
	return Object.values(rule).some((value) => hasWrapTarget(value, target));
}

export function wrapHosts(rules: GrammarRecord, wrap: FieldWrap, stop: ReadonlySet<string>): string[] {
	return [...transparentReach(rules, wrap.owner, stop)].filter((name) => hasWrapTarget(rules[name], wrap.target));
}

export function fieldWrapIssue(grammar: GrammarRecord, wrap: FieldWrap, batch: readonly FieldWrap[] = [wrap]): string | undefined {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	if (!(wrap.owner in rules)) return 'owner is not a rule';
	const stop = supertypesOf(grammar);
	const hosts = wrapHosts(rules, wrap, stop);
	if (hosts.length === 0) return 'token' in wrap.target ? 'token is not on the owner outside a field or token' : 'child is not an unfielded reference of the owner';
	if (hosts.some((host) => host !== wrap.owner && !sharersAgree(rules, host, stop, wrap, batch))) return 'field sits in a hidden rule another kind shares';
	if (fieldHosts(rules, wrap.owner, wrap.field, stop).length > 0) return 'member name is already a field of the owner';
	return undefined;
}

export interface ChildFields {
	readonly fields: readonly string[];
	readonly unfielded: boolean;
	readonly mixed: boolean;
	readonly arm: boolean;
}

export function childFields(grammar: GrammarRecord, owner: string, target: FieldWrapTarget | null): ChildFields {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const supertypes = supertypesOf(grammar);
	const descended = (name: string): boolean => isParserHiddenName(name) && name in rules && !supertypes.has(name);
	const isNamedChild = (rule: GrammarRecord): boolean =>
		(rule.type === 'SYMBOL' && typeof rule.name === 'string' && !descended(rule.name)) || (rule.type === 'ALIAS' && rule.named === true);
	const matches = (rule: GrammarRecord): boolean => (target === null ? isNamedChild(rule) : isWrapTarget(rule, target));
	const fields = new Set<string>();
	const others = new Set<string>();
	let unfielded = false;
	const walk = (rule: unknown, field: string | null): void => {
		if (Array.isArray(rule)) return rule.forEach((r) => walk(r, field));
		if (!isRecord(rule)) return;
		if (matches(rule)) {
			if (field === null) unfielded = true;
			else fields.add(field);
			return;
		}
		if (isNamedChild(rule) && field !== null) others.add(field);
		if (rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN' || rule.type === 'ALIAS') return;
		const inner = rule.type === 'FIELD' && typeof rule.name === 'string' ? rule.name : field;
		for (const value of Object.values(rule)) walk(value, inner);
	};
	for (const host of transparentReach(rules, owner, supertypes)) walk(rules[host], null);
	const root = unwrapPrec(rules[owner]);
	const arm = isRecord(root) && root.type === 'CHOICE' && Array.isArray(root.members) && root.members.some((member) => {
		const alternative = unwrapPrec(member);
		return isRecord(alternative) && matches(alternative);
	});
	return { fields: [...fields], unfielded, mixed: [...fields].some((field) => others.has(field)), arm };
}

export function sharedHosts(grammar: GrammarRecord, request: FieldRename | FieldWrap, batch: readonly (FieldRename | FieldWrap)[] = [request]): string[] {
	const rules = isRecord(grammar.rules) ? grammar.rules : {};
	const stop = supertypesOf(grammar);
	const hosts = 'from' in request ? fieldHosts(rules, request.owner, request.from, stop) : wrapHosts(rules, request, stop);
	return hosts.filter((host) => host !== request.owner && !sharersAgree(rules, host, stop, request, batch));
}

const sameEdit = (a: FieldRename | FieldWrap, b: FieldRename | FieldWrap): boolean =>
	'from' in a
		? 'from' in b && a.from === b.from && a.to === b.to
		: !('from' in b) && a.field === b.field && JSON.stringify(a.target) === JSON.stringify(b.target);

function sharersAgree(
	rules: GrammarRecord,
	host: string,
	stop: ReadonlySet<string>,
	request: FieldRename | FieldWrap,
	batch: readonly (FieldRename | FieldWrap)[]
): boolean {
	const sharers = Object.keys(rules).filter((name) => !isParserHiddenName(name) && transparentReach(rules, name, stop).has(host));
	return sharers.every((owner) => batch.some((edit) => edit.owner === owner && sameEdit(edit, request)));
}

export function baseNamesOf(
	renamedFrom: Readonly<Record<string, string>> | undefined,
	splitFrom: Readonly<Record<string, string>> | undefined
): Record<string, string> {
	const names = new Set([...Object.keys(renamedFrom ?? {}), ...Object.keys(splitFrom ?? {})]);
	return Object.fromEntries(
		[...names].flatMap((name) => {
			const base = mappedName(renamedFrom, mappedName(splitFrom, name));
			return base === name ? [] : [[name, base]];
		})
	);
}

export function boundNameOf(
	renamedFrom: Readonly<Record<string, string>> | undefined,
	aliases: readonly Extract<BindingEffect, { kind: 'alias' }>[] = []
): (name: string) => string {
	const bound = new Map(Object.entries(renamedFrom ?? {}).map(([to, from]) => [from, to]));
	for (const { from, to, scope } of aliases) if (scope === undefined) bound.set(from, to);
	return (name) => bound.get(name) ?? name;
}

export interface SitedName {
	readonly name: string;
	readonly scope: string;
}

export function boundNameAt(
	nameOf: (name: string) => string,
	aliases: readonly Extract<BindingEffect, { kind: 'alias' }>[] = []
): (name: string, scope: string | undefined) => SitedName {
	const sited = new Map<string, Map<string, string>>();
	for (const { from, to, scope } of aliases) if (scope !== undefined) sited.set(scope, (sited.get(scope) ?? new Map<string, string>()).set(from, to));
	return (name, scope) => {
		const to = scope === undefined ? undefined : sited.get(scope)?.get(name);
		return to === undefined ? { name: nameOf(name), scope: name } : { name: to, scope: to };
	};
}
