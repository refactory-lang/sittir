import {
	aliasOf,
	isParserHiddenName,
	isRecord,
	OPAQUE_RULES,
	optionalContentOf,
	refKind,
	refRule,
	replaceSymbols,
	throughPrec,
	unwrapPrec,
	type GrammarRecord
} from '../rule-patterns.ts';
import { applyCopy, VerbRefusal, type VerbCtx } from './copy.ts';
import type { CopyOrigin, LeadMatch, LeadWithin } from './effects.ts';

export interface ItemPositions {
	readonly counts: ReadonlyMap<string, number>;
	readonly holders: ReadonlyMap<string, ReadonlySet<string>>;
}

export const NO_POSITIONS: ItemPositions = { counts: new Map(), holders: new Map() };

export type NarrowDirection = 'keep' | 'except';

export interface NarrowSite {
	readonly ref: unknown;
	readonly context: string;
	readonly origin: CopyOrigin;
	readonly reach: Set<string>;
	readonly sites: ReadonlyMap<string, number>;
	readonly positions: ItemPositions;
}

interface Narrowing {
	readonly ctx: VerbCtx;
	readonly site: NarrowSite;
	readonly keep: boolean;
}

export function applyNarrow(site: NarrowSite, admits: readonly LeadMatch[], direction: NarrowDirection, ctx: VerbCtx): unknown {
	const keep = direction === 'keep';
	return narrowRef({ ctx, site, keep }, site.ref, admits, !keep);
}

function copyFor(n: Narrowing, source: string, body: unknown, shown?: { readonly display: string; readonly admitted: string }): string {
	return applyCopy({ source, part: '.', context: n.site.context, body, origin: n.site.origin, ...shown }, n.ctx);
}

function renamedKind(ref: unknown, value: string): unknown {
	const node = unwrapPrec(ref);
	return throughPrec(ref, () => (isRecord(node) && node.type === 'ALIAS' ? { ...node, value } : { type: 'ALIAS', content: node, named: true, value }));
}

const exclusiveTo = (n: Narrowing, name: string, exclusive: boolean): boolean => exclusive && (n.site.sites.get(name) ?? 0) <= 1;

const isDescended = (n: Narrowing, name: string): boolean => isParserHiddenName(name) && !n.ctx.supertypes.has(name) && name in n.ctx.rules;

function narrowRef(n: Narrowing, ref: unknown, admits: readonly LeadMatch[], exclusive: boolean): unknown {
	const { ctx, site, keep } = n;
	const kind = refKind(ref);
	if (kind !== undefined) {
		const matches = admits.filter((m) => m.kind === kind);
		if (matches.length > 1) throw new VerbRefusal('narrow-invalid', `it admits '${kind}' twice`);
		const [admitted] = matches;
		if (admitted === undefined) {
			const rule = refRule(ref);
			const inside = rule !== undefined && ctx.transparent(rule) ? admittedInside(n, ctx.rules[rule], new Set(admits.map((m) => m.kind)), [rule]) : undefined;
			if (inside !== undefined) throw new VerbRefusal('narrow-invalid', `'${inside}' sits where the split cannot divide it`);
			return keep ? undefined : ref;
		}
		if (admitted.within === undefined) return keep ? (admitted.as === undefined ? ref : renamedKind(ref, admitted.as)) : undefined;
		const name = refRule(ref);
		if (name === undefined) throw new VerbRefusal('narrow-invalid', `'${kind}' has no rule to narrow`);
		const inPlace = !keep && (!isParserHiddenName(name) || exclusiveTo(n, name, exclusive));
		site.reach.add(name);
		const body = narrowWithin(n, kind, ctx.rules[name], admitted.within, inPlace);
		if (keep) {
			const visible = admitted.as ?? `${kind}_${site.context}`;
			return aliasOf(copyFor(n, name, body, { display: visible, admitted: kind }), visible);
		}
		if (inPlace && !isParserHiddenName(name)) {
			const count = site.positions.counts.get(name) ?? 0;
			const holders = [...(site.positions.holders.get(name) ?? [])].sort();
			if (count > 1) throw new VerbRefusal('narrow-invalid', `'${kind}' narrows in place, but the item holds it at ${count} positions (in ${holders.join(', ')})`);
		}
		if (inPlace) {
			narrowInPlace(n, name, body);
			return ref;
		}
		const clone = copyFor(n, name, body);
		return replaceSymbols(ref, (symbol) => (symbol === name ? clone : symbol));
	}
	const node = unwrapPrec(ref);
	if (isRecord(node) && node.type === 'CHOICE' && Array.isArray(node.members)) {
		const members: readonly unknown[] = node.members;
		const arms = members.map((arm) => narrowRef(n, arm, admits, exclusive)).filter((arm) => arm !== undefined);
		if (arms.length === 0) return undefined;
		if (arms.length === members.length && arms.every((arm, i) => arm === members[i])) return ref;
		return arms.length === 1 ? arms[0] : throughPrec(ref, () => ({ ...node, members: arms }));
	}
	const name = refRule(ref);
	if (isRecord(node) && node.type === 'SYMBOL' && name !== undefined && isDescended(n, name)) {
		const inPlace = !keep && exclusiveTo(n, name, exclusive);
		site.reach.add(name);
		const narrowed = narrowRef(n, ctx.rules[name], admits, inPlace);
		if (narrowed === undefined || narrowed === ctx.rules[name]) return narrowed === undefined ? undefined : ref;
		if (refRule(narrowed) !== undefined) return narrowed;
		if (inPlace) {
			narrowInPlace(n, name, narrowed);
			return ref;
		}
		return throughPrec(ref, () => ({ ...node, name: copyFor(n, name, narrowed) }));
	}
	const inside = admittedInside(n, ref, new Set(admits.map((m) => m.kind)));
	if (inside !== undefined) throw new VerbRefusal('narrow-invalid', `'${inside}' sits where the split cannot divide it`);
	return keep ? undefined : ref;
}

function admittedInside(n: Narrowing, rule: unknown, admitted: ReadonlySet<string>, path: readonly string[] = []): string | undefined {
	if (Array.isArray(rule)) return rule.map((r) => admittedInside(n, r, admitted, path)).find((kind) => kind !== undefined);
	const node = unwrapPrec(rule);
	if (!isRecord(node)) return undefined;
	const kind = refKind(node);
	if (kind !== undefined && admitted.has(kind)) return kind;
	if (node.type === 'TOKEN' || node.type === 'IMMEDIATE_TOKEN') return undefined;
	if (node.type === 'SYMBOL') {
		const name = node.name as string;
		return name in n.ctx.rules && n.ctx.transparent(name) && !path.includes(name) ? admittedInside(n, n.ctx.rules[name], admitted, [...path, name]) : undefined;
	}
	if (kind !== undefined) return undefined;
	return admittedInside(n, node.members, admitted, path) ?? admittedInside(n, node.content, admitted, path);
}

function narrowWithin(n: Narrowing, kind: string, body: unknown, within: LeadWithin, exclusive: boolean): unknown {
	const { ctx, site, keep } = n;
	const admitted = new Set(within.admits.map((m) => m.kind));
	const position = within.field === null ? 'an unfielded child' : `field '${within.field}'`;
	const isTarget = (node: GrammarRecord): boolean =>
		within.field === null
			? node.type === 'CHOICE' && Array.isArray(node.members) && node.members.some((arm) => admitted.has(refKind(arm) ?? ''))
			: node.type === 'FIELD' && node.name === within.field;
	const positionsIn = (node: unknown, path: readonly string[] = [], repeated = false): boolean[] => {
		if (Array.isArray(node)) return node.flatMap((member) => positionsIn(member, path, repeated));
		if (!isRecord(node)) return [];
		if (isTarget(node)) return [repeated];
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return [];
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!isDescended(n, name) || path.includes(name)) return [];
			return positionsIn(ctx.rules[name], [...path, name], repeated);
		}
		const under = repeated || node.type === 'REPEAT' || node.type === 'REPEAT1';
		return [...positionsIn(node.members, path, under), ...positionsIn(node.content, path, under)];
	};
	const holds = (node: unknown): boolean => positionsIn(node).length > 0;
	const found = positionsIn(body);
	if (found.length === 0) throw new VerbRefusal('narrow-invalid', `the restriction of ${position} names no position in '${kind}'`);
	if (found.length > 1) throw new VerbRefusal('narrow-invalid', `the restriction of ${position} names ${found.length} positions in '${kind}'`);
	if (found[0] === true) throw new VerbRefusal('narrow-invalid', `the restriction of ${position} sits under a repeat in '${kind}'`);
	const visit = (node: unknown): unknown => {
		if (Array.isArray(node)) {
			const out = node.map(visit);
			return out.every((member, i) => member === node[i]) ? node : out;
		}
		if (!isRecord(node)) return node;
		if (isTarget(node)) {
			const narrowed = narrowRef(n, node.type === 'FIELD' ? node.content : node, within.admits, exclusive);
			if (narrowed === undefined) throw new VerbRefusal('narrow-invalid', `it leaves ${position} of '${kind}' empty`);
			if (node.type !== 'FIELD') return narrowed;
			return narrowed === node.content ? node : { ...node, content: narrowed };
		}
		if (OPAQUE_RULES.has(node.type) || node.type === 'ALIAS') return node;
		if (keep) {
			const optional = optionalContentOf(node as { readonly type: string });
			if (optional !== undefined && holds(optional)) return visit(optional);
			const arm = node.type === 'CHOICE' && Array.isArray(node.members) ? node.members.find(holds) : undefined;
			if (arm !== undefined) return visit(arm);
		}
		if (node.type === 'SYMBOL') {
			const name = node.name as string;
			if (!holds(node)) return node;
			const inPlace = !keep && exclusiveTo(n, name, exclusive);
			site.reach.add(name);
			const inner = narrowWithin(n, kind, ctx.rules[name], within, inPlace);
			if (inner === ctx.rules[name]) return node;
			if (inPlace) {
				narrowInPlace(n, name, inner);
				return node;
			}
			return { ...node, name: copyFor(n, name, inner) };
		}
		const members = node.members === undefined ? undefined : visit(node.members);
		const content = node.content === undefined ? undefined : visit(node.content);
		if (members === node.members && content === node.content) return node;
		return { ...node, ...(members === undefined ? {} : { members }), ...(content === undefined ? {} : { content }) };
	};
	return visit(body);
}

export function itemPositions(item: unknown, ctx: VerbCtx, reach: ReadonlySet<string>): ItemPositions {
	const counts = new Map<string, number>();
	const holders = new Map<string, Set<string>>();
	const expands = (name: string): boolean => name in ctx.rules && (reach.has(name) || ctx.transparent(name));
	const walk = (node: unknown, path: readonly string[], holder: string): void => {
		if (Array.isArray(node)) for (const member of node) walk(member, path, holder);
		else if (isRecord(node)) {
			if (node.type === 'SYMBOL' && typeof node.name === 'string') {
				const name = node.name;
				counts.set(name, (counts.get(name) ?? 0) + 1);
				(holders.get(name) ?? holders.set(name, new Set()).get(name)!).add(holder);
				if (expands(name) && !path.includes(name)) walk(ctx.rules[name], [...path, name], name);
				return;
			}
			walk(node.members, path, holder);
			walk(node.content, path, holder);
		}
	};
	walk(item, [], 'the list item');
	return { counts, holders };
}

function narrowInPlace(n: Narrowing, name: string, body: unknown): void {
	const holder = n.ctx.reached.get(name);
	if (holder !== undefined) throw new VerbRefusal('edit-site-conflict', `'${name}' narrows in place, but the lead on '${holder}' holds it in its item`);
	n.ctx.rules[name] = body;
}
