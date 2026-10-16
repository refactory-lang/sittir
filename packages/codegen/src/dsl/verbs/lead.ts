import type { AnyRule, Rule } from '../../types/rule.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { withHoistedAnnotation } from '../annotations.ts';
import { collapseSingletonMintOrdinals, visibleGroupSynthName } from '../automatic-groups.ts';
import { makeRuleMetadata } from '../rule-metadata.ts';
import {
	aliasOf,
	fieldedHeadListOf,
	isRecord,
	listEntryName,
	optionalContentOf,
	refRule,
	rulesEqual,
	type GrammarRecord,
	type RuleListEntry,
	type SymbolSource
} from '../rule-patterns.ts';
import { predictedSymbolSourceOf } from '../symbol-table.ts';
import { applyCopy, refusalOf, VerbRefusal, type VerbCtx } from './copy.ts';
import { bindMatch, boundFieldNameOf, type CopyOrigin, type Lead, type SegmentEffect } from './effects.ts';
import { applyNarrow, itemPositions, NO_POSITIONS } from './narrow.ts';

export function applyLeads(leads: readonly Lead[], ctx: VerbCtx): void {
	if (leads.length === 0) return;
	const fieldNameOf = boundFieldNameOf(ctx.effects.filter((effect): effect is SegmentEffect => effect.kind === 'segment'));
	for (const entry of leads) {
		const bound: Lead = { ...entry, item: fieldNameOf(entry.list, entry.item), admits: entry.admits.map((admit) => bindMatch(admit, (kind) => kind, fieldNameOf)) };
		const refusal = refusalOf(ctx, () => applyLead(bound, ctx));
		if (refusal === undefined) continue;
		ctx.diagnostics.push({
			scope: 'grammar',
			code: refusal.code,
			severity: 'fail',
			canProceed: false,
			grammar: ctx.name,
			ownerKind: entry.list,
			message: `lead '${entry.list}.${entry.field}': ${refusal.reason}`,
			details: { list: entry.list, field: entry.field }
		});
	}
	appendLeadGroups(ctx);
}

export function applyLead(lead: Lead, ctx: VerbCtx): void {
	const { list, item, field, admits } = lead;
	const { rules } = ctx;
	if (!(list in rules)) throw new VerbRefusal('edit-site-missing', 'the list is no rule of the grammar');
	const symbols = leadSymbols(ctx);
	const shape = fieldedHeadListOf(rules[list] as Rule<'normalize'>, symbols);
	if (shape === null || shape.elementName !== item) throw new VerbRefusal('edit-entry-invalid', `the list is no separated list of field '${item}'`);
	if (shape.leading !== undefined) throw new VerbRefusal('edit-entry-invalid', 'the list takes a leading separator');
	if (shape.trailing === 'mandatory') throw new VerbRefusal('edit-entry-invalid', 'the list takes a mandatory trailing separator');
	const element = shape.element as unknown as GrammarRecord;
	const origin: CopyOrigin = { kind: 'lead', ...lead };
	const reach = new Set<string>();
	const head = applyNarrow({ ref: element.content, context: field, origin, reach, sites: new Map(), positions: NO_POSITIONS }, admits, 'keep', ctx);
	if (head === undefined) throw new VerbRefusal('narrow-invalid', 'it admits no item of the list');
	const positions = itemPositions(element.content, ctx, reach);
	const sites = referenceSites(rules, list, [element.content, shape.separatorRule]);
	const rest = applyNarrow({ ref: element.content, context: item, origin, reach, sites, positions }, admits, 'except', ctx);
	if (rest === undefined) throw new VerbRefusal('narrow-invalid', 'it leaves the list no item');
	if (rest !== element.content) rules[list] = replaceItems(rules[list], item, element.content, rest);
	const leadCopies = new Set(ctx.effects.flatMap((effect) => (effect.kind === 'copy' && effect.origin.kind === 'lead' ? [effect.copy] : [])));
	const owners = Object.keys(rules).filter((name) => name !== list && !leadCopies.has(name));
	const held = owners.flatMap((owner) => listSites(rules[owner], list, owner));
	const fields = [...new Set(held.map((site) => site.name as string))].sort();
	if (fields.length !== 1) throw new VerbRefusal('edit-entry-invalid', fields.length === 0 ? 'the list sits in no field of another rule' : `the list sits in fields ${fields.join(', ')}`);
	const optional = optionalSpelling(rules[list]);
	const restBody = { type: 'SEQ', members: [shape.separatorRule, shape.trailing === undefined ? held[0] : optional(held[0])] } as Rule;
	const groupName = visibleGroupSynthName(restBody, `${list}_${field}`, groupContextOf(ctx, symbols), { grp: 0, arm: 0 });
	if (groupName === null) throw new VerbRefusal('edit-entry-invalid', 'the receiver rest group could not be named');
	const groupRef = { type: 'SYMBOL', name: groupName, metadata: makeRuleMetadata({ symbolSource: 'group-lift' }) };
	const body = { type: 'SEQ', members: [{ ...element, name: field, content: head }, optional(groupRef)] };
	const display = `${list}_${field}`;
	const receiverForm = aliasOf(applyCopy({ source: list, part: '.', context: field, body, origin, display }, ctx), display);
	for (const owner of owners) rules[owner] = withReceiverForm(rules[owner], list, receiverForm);
	for (const name of positions.counts.keys()) if (!ctx.reached.has(name)) ctx.reached.set(name, list);
}

export function appendLeadGroups(ctx: VerbCtx): void {
	const { rules, origins } = ctx.groups;
	for (const [name, body] of Object.entries(rules)) ctx.rules[name] = withHoistedAnnotation(body);
	collapseSingletonMintOrdinals(ctx.rules as Record<string, Rule>, rules, origins);
	ctx.created.push(...Object.keys(rules));
}

function groupContextOf(ctx: VerbCtx, symbols: SymbolSource): Parameters<typeof visibleGroupSynthName>[2] {
	return {
		rulesBag: ctx.rules as Record<string, Rule>,
		clauseGroupRules: ctx.groups.rules,
		ruleOrigins: ctx.groups.origins,
		groupDedupeMap: ctx.groups.dedupe,
		authoredGroupBodies: [],
		sourceSymbols: symbols,
		hoist: undefined
	};
}

function leadSymbols(ctx: VerbCtx): SymbolSource {
	const entries = (key: string): RuleListEntry[] => (Array.isArray(ctx.grammar[key]) ? (ctx.grammar[key] as RuleListEntry[]) : []);
	return predictedSymbolSourceOf({
		rules: ctx.rules as Record<string, AnyRule>,
		extras: entries('extras'),
		externals: entries('externals'),
		supertypes: [...ctx.supertypes],
		inline: entries('inline').flatMap((entry) => listEntryName(entry) ?? []),
		word: typeof ctx.grammar.word === 'string' ? ctx.grammar.word : null
	});
}

function optionalSpelling(rule: unknown): (content: unknown) => GrammarRecord {
	const find = (node: unknown): GrammarRecord | undefined => {
		if (Array.isArray(node)) return node.map(find).find((found) => found !== undefined);
		if (!isRecord(node)) return undefined;
		if (optionalContentOf(node as { readonly type: string }) !== undefined) return node;
		return find(node.members) ?? find(node.content);
	};
	return find(rule)?.type === 'OPTIONAL' ? (content) => ({ type: 'OPTIONAL', content }) : (content) => ({ type: 'CHOICE', members: [content, { type: 'BLANK' }] });
}

function replaceItems(rule: unknown, item: string, from: unknown, to: unknown): unknown {
	if (Array.isArray(rule)) return rule.map((r) => replaceItems(r, item, from, to));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && rule.name === item && rulesEqual(rule.content as RuntimeRule, from as RuntimeRule)) return { ...rule, content: to };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = key === 'members' || key === 'content' ? replaceItems(value, item, from, to) : value;
	return out;
}

function listSites(rule: unknown, list: string, owner: string, out: GrammarRecord[] = []): GrammarRecord[] {
	if (Array.isArray(rule)) for (const r of rule) listSites(r, list, owner, out);
	else if (isRecord(rule)) {
		if (rule.type === 'FIELD' && refRule(rule.content) === list) out.push(rule);
		else if (rule.type === 'SYMBOL' && rule.name === list) throw new VerbRefusal('edit-entry-invalid', `'${owner}' holds the list other than as a field's content`);
		else {
			listSites(rule.members, list, owner, out);
			listSites(rule.content, list, owner, out);
		}
	}
	return out;
}

function withReceiverForm(rule: unknown, list: string, receiverForm: GrammarRecord): unknown {
	if (Array.isArray(rule)) return rule.map((r) => withReceiverForm(r, list, receiverForm));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'FIELD' && refRule(rule.content) === list) return { ...rule, content: { type: 'CHOICE', members: [rule.content, receiverForm] } };
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(rule)) out[key] = key === 'members' || key === 'content' ? withReceiverForm(value, list, receiverForm) : value;
	return out;
}

function countSymbols(rule: unknown, sites: Map<string, number> = new Map()): Map<string, number> {
	if (Array.isArray(rule)) for (const r of rule) countSymbols(r, sites);
	else if (isRecord(rule)) {
		if (rule.type === 'SYMBOL' && typeof rule.name === 'string') sites.set(rule.name, (sites.get(rule.name) ?? 0) + 1);
		for (const value of Object.values(rule)) countSymbols(value, sites);
	}
	return sites;
}

function referenceSites(rules: GrammarRecord, list: string, listParts: readonly unknown[]): Map<string, number> {
	const sites = new Map<string, number>();
	for (const [name, body] of Object.entries(rules)) if (name !== list) countSymbols(body, sites);
	countSymbols(listParts, sites);
	return sites;
}
