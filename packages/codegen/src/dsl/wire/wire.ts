import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { typeEq, isChoiceType, isBlankType } from '../../types/runtime-shapes.ts';
import { transform as transformFn, applyPreference } from '../transform/transform.ts';
import { isPreference, type PreferencePlaceholder } from '../primitives/preference.ts';
import type { RenderDefaults } from '../primitives/spacing.ts';
import { isFieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import { isVariantPlaceholder } from '../primitives/variant.ts';
import { getEnrichClauseGroups, getEnrichClauseGroupOwners, getEnrichVisibleGroupSources } from '../enrich.ts';
import type { GrammarJson, GrammarRule, SymbolRule, AuthoringRule } from '../../grammar-shapes/grammar-json.ts';
import type { FastKeys, TransformPatchMap } from '../../grammar-shapes/path-type.ts';

export type RenderAsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export type VisibleExternalsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export interface WireContext {
	readonly deposits: Map<string, RuntimeRule>;
	readonly syntheticInline: Set<string>;
	readonly inlineRemovals: Set<string>;
	readonly orphanedSyntheticGroups: Set<string>;
	readonly conflictGroups: string[][];
	readonly symbolRenames: Map<string, string>;
	readonly refineForms: Map<string, RefineForm[]>;
	readonly groups?: GroupsConfig;
	readonly renderAs?: RenderAsConfig;
	readonly visibleExternals?: VisibleExternalsConfig;
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Partial<Record<string, string>>;
	readonly defaults?: RenderDefaults;
	currentRuleKind: string | null;
	readonly authoredRuleNames: ReadonlySet<string>;
}

export interface RefineForm {
	readonly name: string;
	readonly selections: Record<string, number | string>;
}

let currentContext: WireContext | null = null;

export function getCurrentWireContext(): WireContext | null {
	return currentContext;
}

export function wireRegisterSyntheticRule(name: string, content: RuntimeRule): boolean {
	if (!currentContext) return false;
	currentContext.deposits.set(name, content);
	return true;
}

export function wireRegisterSyntheticInline(name: string): boolean {
	if (!currentContext) return false;
	if (currentContext.authoredRuleNames.has(name)) return false;
	currentContext.syntheticInline.add(name);
	return true;
}

export function wireRegisterConflict(names: readonly string[]): boolean {
	if (!currentContext) return false;
	if (names.length === 0) return true;
	const key = names.join('\u0000');
	const exists = currentContext.conflictGroups.some((g) => g.join('\u0000') === key);
	if (!exists) {
		currentContext.conflictGroups.push([...names]);
	}
	return true;
}

export function wireRegisterSymbolRename(oldName: string, newName: string): boolean {
	if (!currentContext) return false;
	currentContext.symbolRenames.set(oldName, newName);
	return true;
}

export function wireHasAuthoredRule(name: string): boolean {
	return currentContext?.authoredRuleNames.has(name) ?? false;
}

export function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean {
	if (!currentContext) return false;
	currentContext.refineForms.set(kind, forms);
	return true;
}

export function wireGetCurrentRuleKind(): string | null {
	return currentContext?.currentRuleKind ?? null;
}

export function withWireContext<T>(
	ruleKind: string | null,
	fn: (ctx: WireContext) => T
): { result: T; ctx: WireContext } {
	const ctx: WireContext = {
		deposits: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		symbolRenames: new Map(),
		refineForms: new Map(),
		groups: undefined,
		renderAs: undefined,
		currentRuleKind: ruleKind,
		authoredRuleNames: new Set()
	};
	const prev = currentContext;
	currentContext = ctx;
	try {
		const result = fn(ctx);
		return { result, ctx };
	} finally {
		currentContext = prev;
	}
}

type BaseKind<Base extends GrammarJson = GrammarJson> = Base extends {
	readonly rules: infer R;
}
	? keyof R & string
	: keyof Base & string;

export type GroupsConfigValue = Record<string, string> | RuleFn;
export type GroupsConfig = Partial<Record<string, GroupsConfigValue>>;

export type PatchesConfig<Base extends GrammarJson = GrammarJson> = [GrammarRule] extends [
	Base['rules'][keyof Base['rules']]
]
	? Partial<Record<BaseKind<Base>, PatchEntry>>
	: Base extends { readonly rules: infer R }
		? {
				readonly [K in keyof R]?: R[K] extends GrammarRule
					?
							| TransformPatchMap<FastKeys<R[K]>>
							| (TransformPatchMap<FastKeys<R[K]>> | PreferencePlaceholder)[]
							| PreferencePlaceholder
					: PatchEntry;
			}
		: Partial<Record<BaseKind<Base>, PatchEntry>>;

export type PatchEntry = PatchMap | (PatchMap | PreferencePlaceholder)[] | PreferencePlaceholder;

export type PatchMap = Record<string, unknown>;

export type ShapedSymbols<B extends GrammarJson> = {
	readonly [R in keyof B['rules'] & string]: SymbolRule<R>;
} & {
	readonly [name: string]: SymbolRule<string>;
};

export type WireConfig<B extends GrammarJson, NewRules extends string = string> = Omit<
	Grammar<NewRules, keyof B['rules'] & string>,
	'rules' | 'conflicts'
> & {
	readonly conflicts?: (
		$: ShapedSymbols<B>,
		previous: readonly (readonly AuthoringRule[])[]
	) => readonly (readonly AuthoringRule[])[];
	readonly rules?: {
		readonly [K in keyof B['rules'] & string]?: ($: ShapedSymbols<B>, previous: B['rules'][K]) => unknown;
	} & {
		readonly [name: string]: ($: ShapedSymbols<B>, previous?: any) => unknown;
	};
	readonly factoryInline?: ($: ShapedSymbols<B>) => unknown[];
	readonly groups?: Partial<
		Record<string, Record<string, string> | (($: ShapedSymbols<B>, previous?: GrammarRule) => unknown)>
	>;
	readonly injects?: Partial<Record<string, ($: ShapedSymbols<B>, previous?: GrammarRule) => unknown>>;
	readonly patches?: PatchesConfig<B>;
	readonly __enrichOverrides__?: Record<string, RuleFn>;
	readonly renderAs?: RenderAsConfig;
	readonly visibleExternals?: VisibleExternalsConfig;
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Partial<Record<string, string>>;
	readonly defaults?: RenderDefaults;
};

export interface WiredOpts {
	readonly name?: string;
	readonly rules: Record<string, RuleFn>;
	readonly conflicts?: ConflictsFn;
	readonly externals?: DollarFn<unknown[]>;
	readonly extras?: DollarFn<unknown[]>;
	readonly supertypes?: DollarFn<unknown[]>;
	readonly factoryInline?: DollarFn<unknown[]>;
	readonly inline?: DollarFn<unknown[]>;
	readonly word?: DollarFn<unknown>;
	readonly precedences?: DollarFn<unknown[][]>;
	readonly reserved?: Record<string, DollarFn<unknown[]>>;
	readonly __enrichOverrides__?: Record<string, RuleFn>;
	readonly __wireContext__?: WireContext;
}

type SittirRuleFn = ($: any, previous?: any) => unknown;
type RuleFn = SittirRuleFn;
type ConflictsFn = (this: unknown, $: unknown, previous?: unknown[][]) => unknown[][];
type DollarFn<T> = (this: unknown, $: unknown, previous?: T) => T;

export function wire<B extends GrammarJson = any>(config: WireConfig<B>, base?: B): WiredOpts {
	const cfg = config as unknown as WireConfig<any>;
	const baseArg = base as unknown as BaseArg | undefined;
	const context: WireContext = {
		deposits: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		symbolRenames: new Map(),
		refineForms: new Map(),
		groups: cfg.groups,
		renderAs: cfg.renderAs,
		visibleExternals: cfg.visibleExternals,
		expectDiagnostics: cfg.expectDiagnostics,
		expectTestFailures: cfg.expectTestFailures,
		defaults: cfg.defaults,
		currentRuleKind: null,
		authoredRuleNames: new Set(Object.keys(cfg.rules ?? {}))
	};

	const patches = cfg.patches ?? {};
	const outRules: Record<string, RuleFn> = { ...cfg.rules } as Record<string, RuleFn>;

	composeOrSynthesizePatchedParents(outRules, patches, context);
	injectPlaceholderHiddenRules(outRules, patches, context, baseExternalNames(baseArg));
	if (baseArg && ((cfg.groups && hasBodyPatternGroups(cfg.groups)) || cfg.injects || cfg.visibleExternals)) {
		const baseRules = (baseArg.grammar?.rules ?? baseArg.rules ?? {}) as Record<string, RuleFn>;
		for (const baseName of Object.keys(baseRules)) {
			if (baseName in outRules) continue;
			outRules[baseName] = passthroughBaseRuleFn;
		}
	}
	wrapAllRuleFns(outRules, context);
	applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context, cfg.injects);
	applyWireVisibleExternalsRewrite(outRules, cfg.visibleExternals);

	if (baseArg) {
		for (const name of getEnrichClauseGroups(base)) {
			context.syntheticInline.add(name);
		}
		for (const name of getEnrichVisibleGroupSources(base)) {
			context.inlineRemovals.add(name);
		}
		const inlineSafeNames = getEnrichClauseGroups(base);
		for (const [syntheticName, ownerKind] of getEnrichClauseGroupOwners(base)) {
			if (context.authoredRuleNames.has(ownerKind)) {
				context.orphanedSyntheticGroups.add(syntheticName);
			}
			if (!inlineSafeNames.has(syntheticName) && ownerKind !== syntheticName) {
				const pairKey = [ownerKind, syntheticName].join('\u0000');
				if (!context.conflictGroups.some((g) => g.join('\u0000') === pairKey)) {
					context.conflictGroups.push([ownerKind, syntheticName]);
				}
				const selfKey = [syntheticName].join('\u0000');
				if (!context.conflictGroups.some((g) => g.join('\u0000') === selfKey)) {
					context.conflictGroups.push([syntheticName]);
				}
			}
		}
		applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context, cfg.injects);
	}

	const conflicts = wrapConflictsCallback(cfg.conflicts as ConflictsFn | undefined, context);
	const inline = wrapInlineCallback(cfg.inline as DollarFn<unknown[]> | undefined, context);

	const wired = {
		...cfg,
		rules: outRules,
		...(conflicts === undefined ? {} : { conflicts }),
		...(inline === undefined ? {} : { inline })
	} as unknown as WiredOpts;
	Object.defineProperty(wired, '__wireContext__', {
		value: context,
		enumerable: false,
		configurable: true
	});
	return wired;
}

export function polymorphVisibleName(parentKind: string, suffix: string): string {
	const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
	return `${visibleParent}_${suffix}`;
}

export function polymorphHiddenName(parentKind: string, suffix: string): string {
	return `_${polymorphVisibleName(parentKind, suffix)}`;
}

function patchSetsOf(entry: PatchEntry): readonly PatchMap[] {
	const items = Array.isArray(entry) ? entry : [entry];
	return items.filter((item): item is PatchMap => !isPreference(item));
}

function kindPreferencesOf(entry: PatchEntry): readonly PreferencePlaceholder[] {
	const items = Array.isArray(entry) ? entry : [entry];
	return items.filter(isPreference);
}

function composeOrSynthesizePatchedParents(
	rules: Record<string, RuleFn>,
	patches: PatchesConfig,
	context: WireContext
): void {
	for (const [kind, entry] of Object.entries(patches)) {
		if (!entry) continue;
		rules[kind] = buildPatchedParentFn(kind, patchSetsOf(entry), kindPreferencesOf(entry), rules[kind], context);
	}
}

function buildPatchedParentFn(
	kind: string,
	patchSets: readonly PatchMap[],
	preferences: readonly PreferencePlaceholder[],
	userFn: SittirRuleFn | undefined,
	context: WireContext
): SittirRuleFn {
	const isHidden = kind.startsWith('_');
	return function wiredPatchedParent($, original) {
		const base = userFn
			? userFn($, original)
			: isHidden && context.deposits.has(kind)
				? context.deposits.get(kind)
				: original;
		let result =
			patchSets.length === 0
				? base
				: (transformFn as unknown as (o: unknown, ...p: unknown[]) => unknown)(base, ...patchSets);
		for (const pref of preferences) result = applyPreference(result as RuntimeRule, pref, kind);
		return result;
	};
}

function placeholderHiddenName(value: unknown, parentKind: string): string | undefined {
	if (isFieldPlaceholder(value)) return `_kw_${value.name}`;
	if (isVariantPlaceholder(value)) return polymorphHiddenName(parentKind, value.name);
	if (isAliasPlaceholder(value)) return `_${value.name}`;
	return undefined;
}

interface BaseArg {
	grammar?: { rules?: Record<string, RuleFn>; externals?: unknown };
	rules?: Record<string, RuleFn>;
	externals?: unknown;
}

function baseExternalNames(base: BaseArg | undefined): ReadonlySet<string> {
	const externals = base?.grammar?.externals ?? base?.externals;
	const entries =
		typeof externals === 'function'
			? withStringGlobalShim(() => (externals as (dollar: unknown) => unknown)(makeSimpleDollarProxy()))
			: externals;
	const names = new Set<string>();
	for (const external of Array.isArray(entries) ? entries : []) {
		if (typeof external === 'string') {
			names.add(external);
			continue;
		}
		const symbol = external as { type?: unknown; name?: unknown } | null;
		if (symbol && typeof symbol === 'object' && symbol.type === 'SYMBOL' && typeof symbol.name === 'string') {
			names.add(symbol.name);
		}
	}
	return names;
}

function injectPlaceholderHiddenRules(
	rules: Record<string, RuleFn>,
	patches: PatchesConfig,
	context: WireContext,
	externals: ReadonlySet<string>
): void {
	for (const [kind, entry] of Object.entries(patches)) {
		if (!entry) continue;
		for (const patchMap of patchSetsOf(entry)) {
			for (const value of Object.values(patchMap)) {
				const hiddenName = placeholderHiddenName(value, kind);
				if (hiddenName === undefined || hiddenName in rules || externals.has(hiddenName)) continue;
				rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
			}
		}
	}
}

function makeDeferredContentFn(context: WireContext, hiddenName: string): SittirRuleFn {
	return function deferredHiddenRule(_$, previous) {
		const body = context.deposits.get(hiddenName);
		if (body) return body;
		if (previous !== undefined) return previous;
		const blankFn = (globalThis as { blank?: () => unknown }).blank;
		return blankFn ? blankFn() : { type: 'BLANK' };
	};
}

function wrapAllRuleFns(rules: Record<string, RuleFn>, context: WireContext): void {
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = wrapOneRuleFn(name, fn, context);
	}
}

function wrapOneRuleFn(name: string, fn: RuleFn, context: WireContext): RuleFn {
	return function wiredRuleFn($, previous) {
		const prevContext = currentContext;
		const prevKind = context.currentRuleKind;
		currentContext = context;
		context.currentRuleKind = name;
		try {
			return fn($, previous);
		} finally {
			context.currentRuleKind = prevKind;
			currentContext = prevContext;
		}
	};
}

function wrapConflictsCallback(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn | undefined {
	return buildWiredConflictsFn(userConflicts, context);
}

function wrapInlineCallback(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return buildWiredInlineFn(userInline, context);
}

function buildWiredConflictsFn(userConflicts: ConflictsFn | undefined, context: WireContext): ConflictsFn {
	return function wiredConflicts(this: unknown, $: unknown, previous?: unknown[][]): unknown[][] {
		const base = userConflicts ? userConflicts.call(this, $, previous) : (previous ?? []);
		const renamed =
			context.symbolRenames.size === 0
				? (base as unknown[][])
				: (base as unknown[][]).map((group) =>
						group.map((entry) => {
							const symbol = entry as { type?: string; name?: string } | null;
							const next =
								symbol && typeof symbol === 'object' && symbol.type === 'SYMBOL' && typeof symbol.name === 'string'
									? context.symbolRenames.get(symbol.name)
									: undefined;
							return next === undefined ? entry : symbolizeRef($, next);
						})
					);
		if (context.conflictGroups.length === 0) return renamed;
		const symbolized = context.conflictGroups.map((group) =>
			group.map((name) => symbolizeRef($, context.symbolRenames.get(name) ?? name))
		);
		return [...renamed, ...symbolized];
	};
}

function buildWiredInlineFn(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return function wiredInline(this: unknown, $: unknown, previous?: unknown[]): unknown[] {
		let base = userInline ? userInline.call(this, $, previous) : (previous ?? []);
		if (context.inlineRemovals.size > 0) {
			base = (base as unknown[]).filter((entry) => {
				const symbol = entry as { type?: string; name?: string } | null;
				return !(
					symbol &&
					typeof symbol === 'object' &&
					symbol.type === 'SYMBOL' &&
					typeof symbol.name === 'string' &&
					context.inlineRemovals.has(symbol.name)
				);
			});
		}
		if (context.syntheticInline.size === 0) return base as unknown[];
		const existingNames = collectInlineNames(base as unknown[]);
		const appended: unknown[] = [];
		for (const name of context.syntheticInline) {
			if (existingNames.has(name)) continue;
			if (context.inlineRemovals.has(name)) continue;
			if (context.orphanedSyntheticGroups.has(name)) continue;
			appended.push(nativeInlineRef($, name));
		}
		return appended.length === 0 ? (base as unknown[]) : [...(base as unknown[]), ...appended];
	};
}

function collectInlineNames(entries: readonly unknown[]): Set<string> {
	const names = new Set<string>();
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const symbol = entry as { type?: string; name?: string };
		if (symbol.type === 'SYMBOL' && typeof symbol.name === 'string') {
			names.add(symbol.name);
		}
	}
	return names;
}

function nativeInlineRef($: unknown, name: string): unknown {
	const nativeSym = (globalThis as { sym?: (name: string) => unknown }).sym;
	if (typeof nativeSym === 'function') return nativeSym(name);
	return ($ as Record<string, unknown>)[name];
}

function symbolizeRef(_$: unknown, name: string): unknown {
	return { type: 'SYMBOL', name };
}

function hasBodyPatternGroups(groups: GroupsConfig): boolean {
	for (const value of Object.values(groups)) {
		if (typeof value === 'function') return true;
	}
	return false;
}

const passthroughBaseRuleFn: SittirRuleFn = function passthroughBaseRuleFn(_$, previous) {
	return previous;
};

interface WirePatternCandidate {
	readonly name: string;
	readonly body: RuntimeRule;
	readonly aliasAs?: string;
}

function makeSimpleDollarProxy(): Record<string, unknown> {
	return new Proxy({} as Record<string, unknown>, {
		get(_target, name: string): unknown {
			return { type: 'SYMBOL', name };
		}
	});
}

function isComplexBodyRt(rule: RuntimeRule): boolean {
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	const t = r.type;
	if (typeEq(t, 'SEQ') || typeEq(t, 'CHOICE')) {
		return Array.isArray(r.members) && r.members.length >= 2;
	}
	if (typeEq(t, 'REPEAT') || typeEq(t, 'REPEAT1')) {
		const c = r.content as { type?: string } | undefined;
		if (!c || typeof c.type !== 'string') return false;
		return !typeEq(c.type, 'STRING') && !typeEq(c.type, 'SYMBOL') && !typeEq(c.type, 'PATTERN');
	}
	return false;
}

function unwrapOptionalChoiceRt(node: unknown): unknown {
	if (!node || typeof node !== 'object') return node;
	const r = node as { type?: string; members?: unknown[] };
	if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
		const blankIdx = r.members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		if (blankIdx !== -1) return { type: 'OPTIONAL', content: r.members[1 - blankIdx] };
	}
	return node;
}

function patternBodyEqual(aIn: unknown, bIn: unknown): boolean {
	const a = unwrapOptionalChoiceRt(aIn);
	const b = unwrapOptionalChoiceRt(bIn);
	if (!a || typeof a !== 'object') return a === b;
	if (!b || typeof b !== 'object') return false;
	const ra = a as { type: string; members?: unknown[]; content?: unknown; name?: string; value?: string };
	const rb = b as { type: string; members?: unknown[]; content?: unknown; name?: string; value?: string };
	if (ra.type !== rb.type) return false;
	const t = ra.type;
	if (t === 'STRING' || t === 'PATTERN') return ra.value === rb.value;
	if (t === 'SYMBOL') return ra.name === rb.name;
	if (t === 'BLANK') return true;
	if (t === 'SEQ' || t === 'CHOICE') {
		const ma = ra.members;
		const mb = rb.members;
		if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
		if (ma.length !== mb.length) return false;
		return ma.every((m, i) => patternBodyEqual(m, mb[i]));
	}
	if (t === 'OPTIONAL' || t === 'REPEAT' || t === 'REPEAT1') {
		return patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'FIELD') {
		return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
	}
	if (t === 'ALIAS') {
		const raa = ra as { type: string; content?: unknown; named?: boolean; value?: string };
		const rba = rb as { type: string; content?: unknown; named?: boolean; value?: string };
		return raa.named === rba.named && raa.value === rba.value && patternBodyEqual(raa.content, rba.content);
	}
	return false;
}

function replaceInBodyRt(rule: unknown, candidates: readonly WirePatternCandidate[]): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	for (const c of candidates) {
		if (patternBodyEqual(rule, c.body)) {
			if (c.aliasAs !== undefined) {
				return {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: c.name },
					named: true,
					value: c.aliasAs
				};
			}
			return { type: 'SYMBOL', name: c.name };
		}
	}
	const t = r.type;
	if (t === 'SEQ' || t === 'CHOICE') {
		const members = r.members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const replaced = replaceInBodyRt(m, candidates);
			if (replaced !== m) changed = true;
			return replaced;
		});
		return changed ? { ...r, members: newMembers } : rule;
	}
	if (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'PREC' ||
		t === 'PREC_LEFT' ||
		t === 'PREC_RIGHT' ||
		t === 'PREC_DYNAMIC' ||
		t === 'TOKEN'
	) {
		const newContent = replaceInBodyRt(r.content, candidates);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

function buildPatternReplacingFn(fn: RuleFn, candidates: readonly WirePatternCandidate[]): RuleFn {
	return function patternReplacingRuleFn($, previous) {
		const result = fn($, previous);
		return replaceInBodyRt(result, candidates);
	};
}

function withStringGlobalShim<T>(fn: () => T): T {
	const g = globalThis as Record<string, unknown>;
	const hadString = 'string' in g;
	const previous = g.string;
	if (!hadString) {
		g.string = (value: string) => ({ type: 'STRING', value });
	}
	try {
		return fn();
	} finally {
		if (!hadString) delete g.string;
		else g.string = previous;
	}
}

function rewriteVisibleExternalRefsRt(rule: unknown, hiddenToVisible: ReadonlyMap<string, string>): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown; name?: string };
	const t = r.type;
	if (t === 'SYMBOL') {
		const visibleName = hiddenToVisible.get(r.name ?? '');
		if (visibleName === undefined) return rule;
		return { type: 'ALIAS', content: rule, named: true, value: visibleName };
	}
	if (t === 'SEQ' || t === 'CHOICE') {
		const members = r.members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const replaced = rewriteVisibleExternalRefsRt(m, hiddenToVisible);
			if (replaced !== m) changed = true;
			return replaced;
		});
		return changed ? { ...r, members: newMembers } : rule;
	}
	if (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'PREC' ||
		t === 'PREC_LEFT' ||
		t === 'PREC_RIGHT' ||
		t === 'PREC_DYNAMIC' ||
		t === 'TOKEN' ||
		t === 'ALIAS'
	) {
		const newContent = rewriteVisibleExternalRefsRt(r.content, hiddenToVisible);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

function buildVisibleExternalsRewritingFn(fn: RuleFn, hiddenToVisible: ReadonlyMap<string, string>): RuleFn {
	return function visibleExternalsRewritingRuleFn($, previous) {
		const result = fn($, previous);
		return rewriteVisibleExternalRefsRt(result, hiddenToVisible);
	};
}

function applyWireVisibleExternalsRewrite(
	rules: Record<string, RuleFn>,
	config: VisibleExternalsConfig | undefined
): void {
	if (!config) return;
	const $ = makeSimpleDollarProxy();
	const entries = withStringGlobalShim(() => config($));
	if (!entries) return;
	const hiddenToVisible = new Map<string, string>();
	for (const hiddenName of Object.keys(entries)) {
		hiddenToVisible.set(hiddenName, hiddenName.replace(/^_+/, ''));
	}
	if (hiddenToVisible.size === 0) return;
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = buildVisibleExternalsRewritingFn(fn, hiddenToVisible);
	}
}

export function applyWirePatternReplacement(
	rules: Record<string, RuleFn>,
	authoredRuleNames: ReadonlySet<string>,
	groups?: GroupsConfig,
	context?: WireContext,
	injects?: GroupsConfig
): void {
	const candidates: WirePatternCandidate[] = [];
	const $ = makeSimpleDollarProxy();

	for (const name of authoredRuleNames) {
		if (!name.startsWith('_')) continue;
		const fn = rules[name];
		if (!fn) continue;
		let body: RuntimeRule;
		try {
			const result = fn.call(undefined, $, undefined);
			if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') continue;
			body = result as RuntimeRule;
		} catch {
			continue;
		}
		if (!isComplexBodyRt(body)) continue;
		candidates.push({ name, body });
	}

	const declared: [section: 'groups' | 'injects', key: string, value: RuleFn][] = [];
	for (const [key, value] of Object.entries(groups ?? {})) {
		if (typeof value !== 'function') continue;
		if (key.startsWith('_')) {
			throw new Error(
				`groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); declare a hidden pattern under injects: instead`
			);
		}
		declared.push(['groups', key, value as RuleFn]);
	}
	for (const [key, value] of Object.entries(injects ?? {})) {
		if (typeof value === 'function') declared.push(['injects', key, value as RuleFn]);
	}
	for (const [section, key, value] of declared) {
		const hidden = key.startsWith('_');
		const hiddenName = hidden ? key : `_${key}`;
		let body: RuntimeRule;
		try {
			const result = value.call(undefined, $, undefined);
			if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') {
				throw new Error(`${section}['${key}']: body fn did not return a rule object`);
			}
			body = result as RuntimeRule;
		} catch (e) {
			throw new Error(`${section}['${key}']: failed to evaluate body fn: ${(e as Error).message}`);
		}
		if (!isComplexBodyRt(body)) {
			throw new Error(
				`${section}['${key}']: body is not a complex structural pattern (need SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial content)`
			);
		}
		candidates.push(hidden ? { name: hiddenName, body } : { name: hiddenName, body, aliasAs: key });
		rules[hiddenName] = context ? wrapOneRuleFn(hiddenName, value, context) : value;
	}

	if (candidates.length === 0) return;

	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, fn] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		rules[name] = buildPatternReplacingFn(fn, candidates);
	}
}
