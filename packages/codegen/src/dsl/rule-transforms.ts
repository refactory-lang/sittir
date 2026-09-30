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
import { isPrecWrapper, isTokenWrapperType } from '../types/runtime-shapes.ts';
import type { AnyRule, Rule, RuleBase, RepeatRule, Repeat1Rule, SeqRule, DelimiterMode } from '../types/rule.ts';
import { RuleWalker, SyntacticRuleWalker } from './rule-walker.ts';
import { absorbIds, withId } from './rule-attrs.ts';
import { choiceArmsOf, isParserHiddenName, terminalContentOf, type SymbolSource } from './rule-patterns.ts';

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


export interface DistributeAliasCtx {
	readonly inlineBodyOf: (name: string) => AnyRule | undefined;
}

export function distributeInlineAliasChoices<R extends AnyRule>(rule: R, ctx: DistributeAliasCtx): R {
	const walker = new SyntacticRuleWalker<R>();
	const distributed = new WeakSet<object>();
	const inlineChoiceOf = (content: R): R | undefined => {
		if (content.type !== SYMBOL) return undefined;
		const body = ctx.inlineBodyOf((content as unknown as { name: string }).name) as R | undefined;
		return body !== undefined && choiceArmsOf(body) !== undefined ? body : undefined;
	};
	const armsOf = (content: R): readonly R[] | undefined =>
		choiceArmsOf(inlineChoiceOf(content) ?? content)?.flatMap((arm) => armsOf(arm) ?? [arm]);
	const visit = (r: R): R => {
		const choice = r as unknown as { type: string; members?: readonly R[] };
		if (choice.type === CHOICE && choice.members?.some((m) => distributed.has(m))) {
			const members = choice.members.flatMap((m) =>
				distributed.has(m) ? (m as unknown as { members: readonly R[] }).members : [m]
			);
			return { ...choice, members } as unknown as R;
		}
		const alias = r as unknown as NamedAliasShape<R>;
		if (alias.type !== ALIAS || alias.named !== true || !alias.value) return r;
		const arms = armsOf(innermostNamedAliasContent(alias.content));
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

export interface LiteralAliasStorage<R> {
	readonly rules: Record<string, R>;
	readonly storageNames: readonly string[];
}

export interface InlineTextTokens<R> {
	readonly rules: Record<string, R>;
	readonly mintedNames: readonly string[];
	readonly owners: Readonly<Record<string, readonly string[]>>;
}

function peelPrec<R extends AnyRule>(r: R): R {
	return isPrecWrapper(r) ? peelPrec((r as unknown as { content: R }).content) : r;
}

export function isTerminalRootRule(rule: AnyRule): boolean {
	const root = peelPrec(rule);
	return root.type === PATTERN || root.type === STRING || isTokenWrapperType(root.type);
}

export function isLiteralOnlyRule(rule: AnyRule): boolean {
	const root = peelPrec(rule);
	if (root.type === STRING) return true;
	if (isTokenWrapperType(root.type)) return isLiteralOnlyRule((root as unknown as { content: AnyRule }).content);
	if (root.type === CHOICE || root.type === SEQ) return (root as unknown as { members: readonly AnyRule[] }).members.every(isLiteralOnlyRule);
	return false;
}

export function tokenBodyKey(rule: AnyRule): string {
	return JSON.stringify(rule, (key, value: unknown) =>
		key === 'annotations' || key === 'metadata' || key === 'id' || key === 'hidden' ? undefined : value
	);
}

export interface TextTokenMintCtx<R> {
	readonly symbol: (name: string) => R;
	readonly namingRules?: Readonly<Record<string, AnyRule>>;
}

interface TextSiteCtx<T> {
	readonly visit: (site: T) => T;
}

function isTextTokenSite(rule: AnyRule): boolean {
	return (
		rule.type === PATTERN ||
		(isTokenWrapperType(rule.type) && peelPrec((rule as unknown as { content: AnyRule }).content).type !== STRING)
	);
}

function mapTextTokenSites<T extends AnyRule>(rule: T, ctx: TextSiteCtx<T>): T {
	if (isTextTokenSite(rule)) return ctx.visit(rule);
	if (rule.type === ALIAS && (rule as unknown as { named?: boolean }).named === true) return rule;
	const { content, members } = rule as unknown as { content?: T; members?: readonly T[] };
	if (content !== undefined) return { ...rule, content: mapTextTokenSites(content, ctx) };
	if (members !== undefined) return { ...rule, members: members.map((member) => mapTextTokenSites(member, ctx)) };
	return rule;
}

export function mintInlineTextTokens<R extends AnyRule>(rules: Record<string, R>, ctx: TextTokenMintCtx<R>): InlineTextTokens<R> {
	const bodyOf = <T extends AnyRule>(site: T): T => {
		const { annotations: _annotations, ...body } = site as T & { annotations?: unknown };
		return body as T;
	};
	const bodyKey = (site: AnyRule): string => tokenBodyKey(bodyOf(site));
	const nonTerminal = <T extends AnyRule>(bag: Readonly<Record<string, T>>): [string, T][] => Object.entries(bag).filter(([, rule]) => !isTerminalRootRule(rule));
	const nameOf = new Map<string, string>();
	const nameSites = (bag: Readonly<Record<string, AnyRule>>): void => {
		for (const [owner, rule] of nonTerminal(bag)) {
			const fresh: string[] = [];
			mapTextTokenSites(rule, {
				visit: (site) => {
					const key = bodyKey(site);
					if (!nameOf.has(key) && !fresh.includes(key)) fresh.push(key);
					return site;
				}
			});
			const base = `${owner.replace(/^_+/, '')}_text`;
			fresh.forEach((key, i) => {
				const name = fresh.length === 1 ? base : `${base}${i + 1}`;
				if (Object.hasOwn(rules, name)) throw new Error(`mintInlineTextTokens: '${owner}' mints '${name}', which the grammar already names`);
				nameOf.set(key, name);
			});
		}
	};
	nameSites(ctx.namingRules ?? rules);
	nameSites(rules);
	const out: Record<string, R> = { ...rules };
	const bodies = new Map<string, R>();
	const ownersOf: Record<string, string[]> = {};
	for (const [owner, rule] of nonTerminal(rules)) {
		let holds = false;
		const rewritten = mapTextTokenSites(rule, {
			visit: (site) => {
				holds = true;
				const { annotations } = site as R & { annotations?: unknown };
				const name = nameOf.get(bodyKey(site))!;
				if (!bodies.has(name)) bodies.set(name, bodyOf(site));
				if (!(ownersOf[name] ??= []).includes(owner)) ownersOf[name].push(owner);
				const reference = ctx.symbol(name);
				return annotations === undefined ? reference : ({ ...reference, annotations } as R);
			}
		});
		if (holds) out[owner] = rewritten;
	}
	const mintedNames = [...new Set(nameOf.values())].filter((name) => bodies.has(name));
	for (const name of mintedNames) out[name] = bodies.get(name)!;
	return { rules: out, mintedNames, owners: ownersOf };
}

export function mintInlineLiteralAliasStorage<R extends AnyRule>(rules: Record<string, R>): LiteralAliasStorage<R> {
	const walker = new SyntacticRuleWalker<R>();
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
	if (storage.size === 0) return { rules, storageNames: [] };
	const visit = (r: R): R => {
		const site = literalAliasOf(r);
		const minted = site === undefined ? undefined : storage.get(site.display);
		if (site === undefined || minted === undefined) return r;
		return { type: ALIAS, named: true, value: site.display, content: { type: SYMBOL, name: minted.name } } as unknown as R;
	};
	const out: Record<string, R> = {};
	for (const [name, rule] of Object.entries(rules)) out[name] = visit(walker.map(rule, visit));
	for (const { name, body } of storage.values()) out[name] = body;
	return { rules: out, storageNames: [...storage.values()].map(({ name }) => name) };
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
	const walker = new SyntacticRuleWalker<R>();
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

export interface OverloadedDisplayCtx {
	readonly symbols: SymbolSource;
}

type AliasSite<R> = NamedAliasShape<R> & { readonly value: string };

type StorageOf = { readonly key: string; readonly symbol?: string; readonly terminal: boolean };

export function unaliasOverloadedDisplays<R extends AnyRule>(rules: Record<string, R>, ctx: OverloadedDisplayCtx): Record<string, R> {
	const walker = new SyntacticRuleWalker<R>();
	const siteOf = (r: R): AliasSite<R> | undefined => {
		const alias = r as unknown as NamedAliasShape<R>;
		return alias.type === ALIAS && alias.named === true && alias.value ? (alias as AliasSite<R>) : undefined;
	};
	const terminalContent = (content: R): boolean => terminalContentOf(content, ctx.symbols.isTerminal);
	const storageOf = (content: R): StorageOf => {
		const symbol = content.type === SYMBOL ? (content as unknown as { name: string }).name : undefined;
		return { key: symbol ?? JSON.stringify(content), symbol, terminal: terminalContent(content) };
	};

	const storagesByDisplay = new Map<string, Map<string, StorageOf>>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, storagesByDisplay, (acc, r) => {
			const site = siteOf(r);
			if (site === undefined) return acc;
			const storage = storageOf(site.content);
			const storages = acc.get(site.value) ?? new Map<string, StorageOf>();
			storages.set(storage.key, storage);
			acc.set(site.value, storages);
			return acc;
		});
	}

	const taken = new Set([...Object.keys(rules), ...storagesByDisplay.keys()]);
	const minted = new Map<string, string>();
	const mintFor = ({ storage, display }: { readonly storage: string; readonly display: string }): string => {
		const known = minted.get(`${storage} ${display}`);
		if (known !== undefined) return known;
		const stripped = storage.replace(/^_+/, '');
		const sameStorage = storagesByDisplay.get(stripped);
		const reusable = sameStorage !== undefined && sameStorage.size === 1 && sameStorage.has(storage) && !Object.hasOwn(rules, stripped);
		if (reusable) return stripped;
		const name = !taken.has(stripped) ? stripped : `${display}_${stripped}`;
		if (taken.has(name)) throw new Error(`enrich: no free display name for ${storage} under ${display} (${stripped} and ${name} are taken)`);
		taken.add(name);
		minted.set(`${storage} ${display}`, name);
		return name;
	};

	type Action = { readonly kind: 'drop' } | { readonly kind: 'rename'; readonly display: string };
	const actions = new Map<string, Action>();
	const split = ({ display, storage }: { readonly display: string; readonly storage: StorageOf }): void => {
		if (storage.symbol === undefined) {
			if (!storage.terminal) throw new Error(`enrich: ${display} displays an inline nonterminal; give it a rule of its own`);
			actions.set(`${display} ${storage.key}`, { kind: 'drop' });
		} else if (!isParserHiddenName(storage.symbol)) actions.set(`${display} ${storage.key}`, { kind: 'drop' });
		else actions.set(`${display} ${storage.key}`, { kind: 'rename', display: mintFor({ storage: storage.symbol, display }) });
	};
	for (const display of [...storagesByDisplay.keys()].sort()) {
		const members = [...storagesByDisplay.get(display)!.values()];
		if (Object.hasOwn(rules, display)) {
			const terminalDisplay = ctx.symbols.isTerminal(display);
			for (const storage of members) {
				if (storage.symbol === display || (terminalDisplay && storage.terminal)) continue;
				split({ display, storage });
			}
			continue;
		}
		const nonterminals = members.filter((storage) => !storage.terminal);
		if (nonterminals.length >= 2) {
			for (const storage of nonterminals) split({ display, storage });
		} else if (nonterminals.length === 1 && nonterminals.length < members.length) {
			const [only] = nonterminals;
			if (only!.symbol !== undefined && only!.symbol.replace(/^_+/, '') === display) {
				for (const storage of members) if (storage.terminal) actions.set(`${display} ${storage.key}`, { kind: 'drop' });
			} else split({ display, storage: only! });
		}
	}
	if (actions.size === 0) return rules;

	const visit = (r: R): R => {
		const site = siteOf(r);
		if (site === undefined) return r;
		const action = actions.get(`${site.value} ${storageOf(site.content).key}`);
		if (action === undefined) return r;
		return action.kind === 'drop' ? site.content : ({ ...site, value: action.display } as unknown as R);
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
	if (a.type !== b.type || (a as { fieldName?: string }).fieldName !== (b as { fieldName?: string }).fieldName) return false;
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
		return absorbIds(next, head);
	}

	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === STRING);
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (repSep !== undefined) return absorbIds(repArm, head, next);
			const sepStr = (sepArm as { value: string }).value;
			return absorbIds(
				{
					...(repArm as object),
					separator: { value: { type: STRING, value: sepStr } as Rule, trailing: 'mandatory' as const }
				} as AnyRule,
				head,
				next
			);
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
