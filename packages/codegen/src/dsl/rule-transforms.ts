import {
	ALIAS,
	CHOICE,
	FIELD,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SYMBOL,
	TOKEN
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, RepeatRule, Repeat1Rule, SeqRule, DelimiterMode } from '../types/rule.ts';
import { RuleWalker } from './rule-walker.ts';
import { withId } from './rule-attrs.ts';

export type LeafMultiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray' | undefined;

type NamedAliasShape<R> = { readonly type: string; readonly named?: boolean; readonly value?: string; readonly content: R };

export function innermostNamedAliasContent<R extends AnyRule>(rule: R): R {
	let current = rule;
	for (
		let alias = current as unknown as NamedAliasShape<R>;
		alias.type === ALIAS && alias.named === true && alias.value;
		alias = current as unknown as NamedAliasShape<R>
	) {
		current = alias.content;
	}
	return current;
}

function choiceArmsOf<R extends AnyRule>(content: R): readonly R[] | undefined {
	if (content.type !== CHOICE) return undefined;
	return (content as unknown as { members: readonly R[] }).members.flatMap((m) => choiceArmsOf(m) ?? [m]);
}

export interface DistributeAliasCtx {
	readonly isRuleName: (name: string) => boolean;
}

export function distributeInlineAliasChoices<R extends AnyRule>(rule: R, ctx: DistributeAliasCtx): R {
	const walker = new RuleWalker<R>();
	const distributed = new WeakSet<object>();
	const visit = (r: R): R => {
		const choice = r as unknown as { type: string; members?: readonly R[] };
		if (choice.type === CHOICE && choice.members?.some((m) => distributed.has(m))) {
			const members = choice.members.flatMap((m) =>
				distributed.has(m) ? (m as unknown as { members: readonly R[] }).members : [m]
			);
			return { ...choice, members } as unknown as R;
		}
		const alias = r as unknown as NamedAliasShape<R>;
		if (alias.type !== ALIAS || alias.named !== true || !alias.value || ctx.isRuleName(alias.value)) return r;
		const arms = choiceArmsOf(innermostNamedAliasContent(alias.content));
		if (arms === undefined) return r;
		const split = {
			type: CHOICE,
			members: arms.map((arm) => ({ ...alias, content: innermostNamedAliasContent(arm) }))
		};
		distributed.add(split);
		return split as unknown as R;
	};
	return visit(walker.map(rule, visit));
}

export function mintInlineLiteralAliasStorage<R extends AnyRule>(rules: Record<string, R>): Record<string, R> {
	const walker = new RuleWalker<R>();
	const literalAliasOf = (r: R): { display: string; body: R; literals: string } | undefined => {
		const alias = r as unknown as NamedAliasShape<R>;
		if (alias.type !== ALIAS || alias.named !== true || !alias.value || Object.hasOwn(rules, alias.value)) return undefined;
		const arms = choiceArmsOf(innermostNamedAliasContent(alias.content));
		if (arms === undefined || !arms.every((arm) => arm.type === STRING)) return undefined;
		const body = { type: CHOICE, members: arms } as unknown as R;
		const literals = JSON.stringify(arms.map((arm) => (arm as unknown as { value: string }).value));
		return { display: alias.value, body, literals };
	};
	const byDisplay = new Map<string, { literals: Set<string>; body: R }>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, byDisplay, (acc, r) => {
			const site = literalAliasOf(r);
			if (site === undefined) return acc;
			const entry = acc.get(site.display);
			if (entry === undefined) {
				acc.set(site.display, { literals: new Set([site.literals]), body: site.body });
			} else entry.literals.add(site.literals);
			return acc;
		});
	}
	const storage = new Map<string, { name: string; body: R }>();
	for (const [display, { literals, body }] of byDisplay) {
		const name = `_${display}`;
		if (literals.size === 1 && !Object.hasOwn(rules, name)) storage.set(display, { name, body });
	}
	if (storage.size === 0) return rules;
	const visit = (r: R): R => {
		const site = literalAliasOf(r);
		const minted = site === undefined ? undefined : storage.get(site.display);
		if (site === undefined || minted === undefined) return r;
		return { type: ALIAS, named: true, value: site.display, content: { type: SYMBOL, name: minted.name } } as unknown as R;
	};
	const out: Record<string, R> = {};
	for (const [name, rule] of Object.entries(rules)) out[name] = visit(walker.map(rule, visit));
	for (const { name, body } of storage.values()) out[name] = body;
	return out;
}

export function liftAliasedHiddenRuleBodies<R extends AnyRule>(rules: Record<string, R>): Record<string, R> {
	const displayByRule = new Map<string, NamedAliasShape<R>>();
	for (const [name, rule] of Object.entries(rules)) {
		const alias = rule as unknown as NamedAliasShape<R>;
		if (!name.startsWith('_') || alias.type !== ALIAS || alias.named !== true || !alias.value) continue;
		if (alias.content.type === SYMBOL) continue;
		displayByRule.set(name, alias);
	}
	if (displayByRule.size === 0) return rules;
	const lifted = (r: R): string | undefined => {
		const name = r.type === SYMBOL ? (r as unknown as { name: string }).name : undefined;
		return name !== undefined && displayByRule.has(name) ? name : undefined;
	};
	const walker = new RuleWalker<R>();
	const visit = (r: R): R => {
		const name = lifted(r);
		if (name !== undefined) return { ...displayByRule.get(name)!, content: r } as unknown as R;
		const alias = r as unknown as NamedAliasShape<R>;
		if (alias.type !== ALIAS) return r;
		const inner = alias.content as unknown as NamedAliasShape<R>;
		if (inner.type === ALIAS && lifted(inner.content) !== undefined) return { ...alias, content: inner.content } as unknown as R;
		return r;
	};
	const out: Record<string, R> = {};
	for (const [name, rule] of Object.entries(rules)) {
		const body = displayByRule.get(name)?.content ?? rule;
		out[name] = visit(walker.map(body, visit));
	}
	return out;
}

export function unifySplitAliasDisplays<R extends AnyRule>(rules: Record<string, R>): Record<string, R> {
	const walker = new RuleWalker<R>();
	const aliasOverHidden = (r: R): { storage: string; display: string; alias: NamedAliasShape<R> } | undefined => {
		const alias = r as unknown as NamedAliasShape<R>;
		if (alias.type !== ALIAS || alias.named !== true || !alias.value || alias.content.type !== SYMBOL) return undefined;
		const storage = (alias.content as unknown as { name: string }).name;
		return storage.startsWith('_') ? { storage, display: alias.value, alias } : undefined;
	};
	const splitDisplay = new Map<string, string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, splitDisplay, (acc, r) => {
			const site = aliasOverHidden(r);
			const split = site?.storage.replace(/^_+/, '');
			if (site !== undefined && split !== undefined && site.display === split) acc.set(site.storage, split);
			return acc;
		});
	}
	if (splitDisplay.size === 0) return rules;
	const visit = (r: R): R => {
		const site = aliasOverHidden(r);
		if (site === undefined) return r;
		const split = splitDisplay.get(site.storage);
		if (split === undefined || site.display === split || !Object.hasOwn(rules, site.display)) return r;
		return { ...site.alias, value: split } as unknown as R;
	};
	const out: Record<string, R> = {};
	for (const [name, rule] of Object.entries(rules)) out[name] = visit(walker.map(rule, visit));
	return out;
}

export function combineMultiplicity(outerIn: LeafMultiplicity, innerIn: LeafMultiplicity): LeafMultiplicity {
	const outer = outerIn ?? 'single';
	const inner = innerIn ?? 'single';
	const isCollection = (m: LeafMultiplicity): boolean => m === 'array' || m === 'nonEmptyArray';
	const guaranteesOne = (m: LeafMultiplicity): boolean => m === 'single' || m === 'nonEmptyArray';
	if (isCollection(outer) || isCollection(inner)) {
		return guaranteesOne(outer) && guaranteesOne(inner) ? 'nonEmptyArray' : 'array';
	}
	if (outer === 'optional' || inner === 'optional') return 'optional';
	return undefined;
}

const flagWalker = new RuleWalker();

export function findRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading'): boolean {
	return (
		flagWalker.find(rule, (r) => {
			const sep = (r as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (typeof sep === 'object' && !Array.isArray(sep) && sep !== null) {
				if ((sep as { trailing?: DelimiterMode; leading?: DelimiterMode })[flag] !== undefined) return true;
			}
			return (
				(r.type === REPEAT || r.type === REPEAT1) &&
				(r as { trailing?: DelimiterMode; leading?: DelimiterMode })[flag] !== undefined
			);
		}) !== undefined
	);
}

export function extractRepeatShape(rule: AnyRule): { repeat: RepeatRule | Repeat1Rule; nonEmpty: boolean } | null {
	switch (rule.type) {
		case REPEAT:
			return { repeat: rule as RepeatRule, nonEmpty: false };
		case REPEAT1:
			return { repeat: rule as Repeat1Rule, nonEmpty: true };
		case OPTIONAL:
		case TOKEN:
			return extractRepeatShape((rule as { content: AnyRule }).content);
		default:
			return null;
	}
}

export function pushAttrsToLeaves(
	rule: AnyRule,
	multiplicity: 'optional' | 'array' | 'nonEmptyArray' | undefined,
	separator: unknown,
	fieldName: string | undefined
): AnyRule {
	const recurse = (r: AnyRule): AnyRule => pushAttrsToLeaves(r, multiplicity, separator, fieldName);
	switch (rule.type) {
		case SEQ:
			return { ...rule, members: (rule as { members: AnyRule[] }).members.map(recurse) } as AnyRule;
		case CHOICE: {
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as AnyRule;
		}
		case TOKEN:
		case ALIAS:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
			return { ...rule, content: recurse((rule as { content: AnyRule }).content) } as AnyRule;
		default: {
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as AnyRule;
		}
	}
}

export interface InlineRefsCtx {
	readonly rules: Readonly<Record<string, AnyRule>>;
	readonly inlineKinds?: ReadonlySet<string>;
}

const EMPTY_INLINE_KINDS: ReadonlySet<string> = new Set();

export function inlineRefs<R extends AnyRule>(
	rule: R,
	ctx: InlineRefsCtx,
	visited: ReadonlySet<string> = new Set()
): R {
	const rules = ctx.rules;
	const inlineKinds = ctx.inlineKinds ?? EMPTY_INLINE_KINDS;
	const recurse = (r: AnyRule, v: ReadonlySet<string>): AnyRule => inlineRefs(r, ctx, v);
	switch (rule.type) {
		case SYMBOL: {
			if (inlineKinds.has(rule.name) && rule.aliasedTo === undefined) {
				if (visited.has(rule.name)) return rule;
				const target = rules[rule.name];
				if (!target) return rule;
				const next = new Set(visited);
				next.add(rule.name);
				const inlineTarget = resolveGroupOrMultiInlineTarget(rule, ctx);
				const inlined = inlineRefs(inlineTarget ?? target, ctx, next);
				return withId(reapplyInlinedLeafAttrs(rule, inlined), rule.id ?? inlined.id) as unknown as R;
			}

			if (rule.inline !== true) return rule;
			if (visited.has(rule.name)) return rule;
			const target = rules[rule.name];
			if (!target) return rule;

			const inlineTarget = resolveGroupOrMultiInlineTarget(rule, ctx);
			if (!inlineTarget) return rule;
			const next = new Set(visited);
			next.add(rule.name);
			const inlined = inlineRefs(inlineTarget, ctx, next);
			return withId(reapplyInlinedLeafAttrs(rule, inlined), rule.id ?? inlined.id) as unknown as R;
		}
		case SEQ:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) } as unknown as R;
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) } as unknown as R;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
			return {
				...rule,
				content: recurse((rule as { content: AnyRule }).content, visited)
			} as unknown as R;
		default:
			return rule;
	}
}

export function resolveGroupOrMultiInlineTarget(ref: { readonly name: string }, ctx: InlineRefsCtx): AnyRule | null {
	const target = ctx.rules[ref.name];
	if (!target) return null;
	const targetMultiplicity = (target as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
	const isMulti =
		extractRepeatShape(target) !== null || targetMultiplicity === 'array' || targetMultiplicity === 'nonEmptyArray';
	return target.annotations?.hoisted === true || isMulti ? target : null;
}

function reapplyInlinedLeafAttrs(ref: AnyRule, inlined: AnyRule): AnyRule {
	const r = ref as {
		multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
		separator?: unknown;
		fieldName?: string;
	};
	if (r.multiplicity === undefined && r.separator === undefined && r.fieldName === undefined) {
		return inlined;
	}
	return pushAttrsToLeaves(inlined, r.multiplicity, r.separator, r.fieldName);
}

type Mult = 'optional' | 'array' | 'nonEmptyArray' | undefined;
const isArrayMult = (m: Mult): boolean => m === 'array' || m === 'nonEmptyArray';
function sameSlotShape(a: AnyRule, b: AnyRule): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case SYMBOL:
			return a.name === (b as typeof a).name && a.aliasedTo === (b as typeof a).aliasedTo;
		case STRING:
		case PATTERN:
			return a.value === (b as typeof a).value;
		case CHOICE: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		case SEQ: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		default:
			return false;
	}
}
function tryFusePair(head: AnyRule, next: AnyRule | undefined): AnyRule | null {
	if (!next) return null;
	const headMult = (head as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(headMult)) return null;

	const nextMult = (next as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(nextMult) && sameSlotShape(head, next)) {
		return next;
	}

	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === STRING);
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (repSep !== undefined) return repArm;
			const sepStr = (sepArm as { value: string }).value;
			return {
				...(repArm as object),
				separator: { value: { type: STRING, value: sepStr } as Rule, trailing: 'mandatory' as const }
			} as AnyRule;
		}
	}

	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === STRING);
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (repSep !== undefined) return repArm;
			const sepStr = (sepArm as { value: string }).value;
			return {
				...repArm,
				separator: { value: { type: STRING, value: sepStr } as Rule, trailing: 'optional' }
			} as AnyRule;
		}
	}

	return null;
}

const fuseHeadRepeatListsWalker = new RuleWalker<AnyRule>();

function fuseAtNode(recursed: AnyRule): AnyRule {
	if (recursed.type !== SEQ) return recursed;
	const members = (recursed as SeqRule).members;
	const out: AnyRule[] = [];
	let changed = false;
	for (let i = 0; i < members.length; i++) {
		const fused = tryFusePair(members[i]!, members[i + 1]);
		if (fused) {
			out.push(fused);
			i++;
			changed = true;
			continue;
		}
		out.push(members[i]!);
	}
	if (!changed) return recursed;
	return { ...recursed, members: out };
}

export function fuseHeadRepeatLists<R extends AnyRule>(rule: R): R {
	return fuseAtNode(fuseHeadRepeatListsWalker.map(rule, fuseAtNode)) as R;
}
