import { withHoistedAnnotation } from '../annotations.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import type { AnyRule } from '../../types/rule.ts';
import { typeEq, isChoiceType, isBlankType } from '../../types/runtime-shapes.ts';
import { RuleWalker } from '../rule-walker.ts';
import { transform as transformFn } from '../transform/transform.ts';
import { isPreference } from '../primitives/preference.ts';
import { BINDINGS_KEY, type OptionsConfig } from './options-block.ts';
import type { IsPreferencePath } from '../primitives/preference-path.ts';
import {
	parseFlankAddress,
	parseSeamLabel,
	parseSpacingLabel
} from '../primitives/spacing.ts';
import { isFieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import { isRulePlaceholder, type RulePlaceholder } from '../primitives/rule.ts';
import {
	ABSENT_VARIANT_NAME,
	isVariantPlaceholder,
	nestVariant,
	variantMintName,
	type VariantPlaceholder
} from '../primitives/variant.ts';
import { parsePath } from '../transform/transform-path.ts';
import { renameNameList, renameRule } from './symbol-renames.ts';
import { unwrapPrec } from '../rule-patterns.ts';
import { getEnrichClauseGroups, getEnrichClauseGroupOwners, getEnrichVisibleGroupSources } from '../enrich.ts';
import { relabelledArm, seedAutomaticVariants, withoutLabel, type AutomaticVariants } from '../automatic-variants.ts';
import { polymorphVisibleName } from '../arm-names.ts';
import type { GrammarJson, GrammarRule, SymbolRule, AuthoringRule } from '../../grammar-shapes/grammar-json.ts';
import type { IsPath, TransformPatchMap } from '../../grammar-shapes/path-type.ts';

export type RenderAsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export type VisibleExternalsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export interface WireContext {
	readonly deposits: Map<string, RuntimeRule>;
	readonly ruleBodies: Map<string, { readonly text: string; readonly site: string }>;
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
	readonly options?: OptionsConfig;
	currentRuleKind: string | null;
	readonly authoredRuleNames: ReadonlySet<string>;
	readonly extraRuleNames: ReadonlySet<string>;
	readonly precedenceRankedNames: ReadonlySet<string>;
	readonly flattenedParents: Set<string>;
	readonly aliasTargets: Set<string>;
	readonly automaticVariants: AutomaticVariants;
	readonly adoptedGroups: ReadonlyMap<string, string>;
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
	currentContext.deposits.set(name, withoutLabel(content) as RuntimeRule);
	return true;
}

export function wireDeclareRuleBody(name: string, text: string, site: string): string | undefined {
	if (!currentContext) throw new Error(`rule('${name}'): no active wire() context`);
	const prior = currentContext.ruleBodies.get(name);
	if (prior === undefined) {
		currentContext.ruleBodies.set(name, { text, site });
		return undefined;
	}
	return prior.text === text ? undefined : prior.site;
}

export function wireHasDeposit(name: string): boolean {
	return currentContext?.deposits.has(name) ?? false;
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

export function wireRegisterFlattenedParent(name: string): boolean {
	if (!currentContext) return false;
	currentContext.flattenedParents.add(name);
	return true;
}

export function wireIsPrecedenceRankedRule(name: string): boolean {
	return currentContext?.precedenceRankedNames.has(name) ?? false;
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

export function wireAutomaticVariants(): AutomaticVariants {
	return automaticVariantsOf(currentContext);
}

function automaticVariantsOf(context: WireContext | null | undefined): AutomaticVariants {
	if (!context) throw new Error('wire: an arm label was read outside a wire context');
	return context.automaticVariants;
}

export function wireIsExtraRule(name: string): boolean {
	return currentContext?.extraRuleNames.has(name) ?? false;
}

export function withWireContext<T>(
	ruleKind: string | null,
	fn: (ctx: WireContext) => T,
	base?: unknown
): { result: T; ctx: WireContext } {
	const ctx: WireContext = {
		deposits: new Map(),
		ruleBodies: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		symbolRenames: new Map(),
		refineForms: new Map(),
		groups: undefined,
		renderAs: undefined,
		options: undefined,
		currentRuleKind: ruleKind,
		authoredRuleNames: new Set(),
		extraRuleNames: new Set(),
		precedenceRankedNames: new Set(),
		flattenedParents: new Set(),
		aliasTargets: new Set(),
		automaticVariants: seedAutomaticVariants(base),
		adoptedGroups: new Map()
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
		? { readonly [K in keyof R]?: TransformPatchMap | readonly TransformPatchMap[] }
		: Partial<Record<BaseKind<Base>, PatchEntry>>;

export type PatchEntry = PatchMap | readonly PatchMap[];

export type PatchMap = Record<string, unknown>;

type RulesOf<B> = B extends { readonly rules: infer R } ? R : never;

type PatchKeyCheck<Rule, M> = {
	readonly [Path in keyof M]: Path extends string | number
		? string extends Path
			? M[Path]
			: IsPath<Rule, `${Path}`> extends true
				? M[Path]
				: { readonly 'patches: no such path in this rule': `${Path}` }
		: M[Path];
};

type PatchEntryCheck<Rule, E> = E extends readonly unknown[]
	? { readonly [I in keyof E]: PatchKeyCheck<Rule, E[I]> }
	: PatchKeyCheck<Rule, E>;

type IsShaped<B> = 0 extends 1 & B ? false : [GrammarRule] extends [RulesOf<B>[keyof RulesOf<B>]] ? false : true;

export type PatchesCheck<B, P> = IsShaped<B> extends false
	? unknown
	: { readonly [K in keyof P]: K extends keyof RulesOf<B> ? PatchEntryCheck<RulesOf<B>[K], P[K]> : P[K] };

type DeclaredLabels<O> = {
	[K in Exclude<keyof O, typeof BINDINGS_KEY> & string]: `${K}/${keyof O[K] & string}`;
}[Exclude<keyof O, typeof BINDINGS_KEY> & string];

type PreferencePathCheck<M> = {
	readonly [Path in keyof M]: Path extends string
		? string extends Path
			? M[Path]
			: IsPreferencePath<Path> extends true
				? M[Path]
				: { readonly 'options: not a path': Path }
		: M[Path];
};

type BindingsCheck<B, O, M> = {
	readonly [Address in keyof M]: Address extends string
		? string extends Address
			? M[Address]
			: IsPreferencePath<Address> extends false
				? { readonly 'options: _bindings address is not a path': Address }
				: M[Address] extends DeclaredLabels<O>
					? M[Address] extends `${infer Root}/${string}`
						? IsShaped<B> extends true
							? Root extends keyof RulesOf<B>
								? { readonly "options: a label's kind is virtual, this names a real kind": Root }
								: M[Address]
							: M[Address]
						: M[Address]
					: { readonly 'options: _bindings names no declared label': M[Address] }
		: M[Address];
};

export type OptionsCheck<B, O> = {
	readonly [K in keyof O]: K extends typeof BINDINGS_KEY
		? BindingsCheck<B, O, O[K]>
		: PreferencePathCheck<O[K]>;
};

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
	readonly options?: OptionsConfig;
	readonly __enrichOverrides__?: Record<string, RuleFn>;
	readonly renderAs?: RenderAsConfig;
	readonly visibleExternals?: VisibleExternalsConfig;
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Partial<Record<string, string>>;
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

export function wire<B extends GrammarJson = any, const P = PatchesConfig<B>, const O = OptionsConfig>(
	config: WireConfig<B> & { readonly patches?: P & PatchesCheck<B, P>; readonly options?: O & OptionsCheck<B, O> },
	base?: B
): WiredOpts {
	const cfg = config as unknown as WireConfig<any>;
	const baseArg = base as unknown as BaseArg | undefined;
	assertNoSpacingAddressPatches(cfg.patches ?? {}, knownRuleNames(cfg, baseArg));
	assertNoDeclaredGroupPatches(cfg.patches ?? {}, cfg.groups, cfg.injects);
	const context: WireContext = {
		deposits: new Map(),
		ruleBodies: new Map(),
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
		options: cfg.options,
		currentRuleKind: null,
		authoredRuleNames: new Set(Object.keys(cfg.rules ?? {})),
		extraRuleNames: extraRuleNames(cfg, baseArg),
		precedenceRankedNames: precedenceRankedNames(cfg, baseArg),
		flattenedParents: new Set(),
		aliasTargets: new Set(),
		automaticVariants: seedAutomaticVariants(base),
		adoptedGroups: baseArg ? adoptMintedGroups(baseArg, base, cfg.groups) : new Map()
	};

	const patches = cfg.patches ?? {};
	const outRules: Record<string, RuleFn> = { ...cfg.rules } as Record<string, RuleFn>;

	composeOrSynthesizePatchedParents(outRules, patches, context);
	injectPlaceholderHiddenRules(outRules, patches, context, baseExternalNames(baseArg), knownRuleNames(cfg, baseArg));
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
			if (context.adoptedGroups.has(name)) continue;
			context.inlineRemovals.add(name);
		}
		const inlineSafeNames = getEnrichClauseGroups(base);
		for (const [syntheticName, ownerKind] of getEnrichClauseGroupOwners(base)) {
			if (context.adoptedGroups.has(syntheticName)) continue;
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
	recordAliasTargets(outRules, context);

	const conflicts = wrapConflictsCallback(cfg.conflicts as ConflictsFn | undefined, context);
	const inline = wrapInlineCallback(cfg.inline as DollarFn<unknown[]> | undefined, context);
	const supertypes = wrapSupertypesCallback(cfg.supertypes as DollarFn<unknown[]> | undefined, context);

	const renamedCallbacks = Object.fromEntries(
		(['extras', 'externals', 'precedences'] as const)
			.filter((key) => key in cfg || baseDeclares(baseArg, key))
			.map((key) => [key, renamingCallback(cfg[key as keyof typeof cfg] as (() => unknown) | undefined, renameNameList, context)])
	);

	const wired = {
		...cfg,
		rules: outRules,
		...renamedCallbacks,
		...(cfg.reserved === undefined ? {} : { reserved: renamingReserved(cfg.reserved, context) }),
		conflicts: renamingCallback(conflicts, renameNameList, context),
		inline: renamingCallback(inline, renameNameList, context),
		supertypes: renamingCallback(supertypes, renameNameList, context)
	} as unknown as WiredOpts;
	Object.defineProperty(wired, '__wireContext__', {
		value: context,
		enumerable: false,
		configurable: true
	});
	return wired;
}

function renamingReserved(reserved: unknown, context: WireContext): unknown {
	if (reserved === null || typeof reserved !== 'object' || Array.isArray(reserved)) return reserved;
	return Object.fromEntries(
		Object.entries(reserved as Record<string, unknown>).map(([contextName, list]) => [
			contextName,
			typeof list === 'function'
				? renamingCallback(list as () => unknown, renameRule, context)
				: renameRule(list, context.symbolRenames)
		])
	);
}

function baseDeclares(base: BaseArg | undefined, key: string): boolean {
	const grammar = (base?.grammar ?? base) as Record<string, unknown> | undefined;
	return grammar?.[key] !== undefined;
}

function renamingCallback<F extends (...args: never[]) => unknown>(
	user: F | undefined,
	rename: (value: unknown, renames: ReadonlyMap<string, string>) => unknown,
	context: WireContext
): DollarFn<unknown> {
	return function renamed(this: unknown, $: unknown, previous?: unknown) {
		const value = user === undefined ? previous : (user as unknown as (d: unknown, p?: unknown) => unknown).call(this, $, previous);
		return rename(value, context.symbolRenames);
	} as unknown as DollarFn<unknown>;
}


function knownRuleNames(cfg: WireConfig<any>, base: BaseArg | undefined): ReadonlySet<string> {
	const baseRules = (base?.grammar?.rules ?? base?.rules ?? {}) as Record<string, unknown>;
	return new Set([...Object.keys(cfg.rules ?? {}), ...Object.keys(cfg.groups ?? {}), ...Object.keys(baseRules)]);
}

/// A top-level gap, seam or flank spelling, retired from patches.
function isRetiredAddressKey(key: string, rules: ReadonlySet<string>): boolean {
	if (rules.has(key) || rules.has(`_${key}`)) return false;
	return parseSpacingLabel(key) !== undefined || parseSeamLabel(key) !== undefined || parseFlankAddress(key) !== undefined;
}




function assertNoSpacingAddressPatches(patches: PatchesConfig, rules: ReadonlySet<string>): void {
	for (const key of Object.keys(patches)) {
		if (!patches[key]) continue;
		if (isRetiredAddressKey(key, rules)) {
			throw new Error(`patches: '${key}' is a spacing address; declare it under options: against the site it names`);
		}
	}
}

function declaredGroupMintName(key: string): string {
	return key.startsWith('_') ? key : `_${key}`;
}

function assertNoDeclaredGroupPatches(patches: PatchesConfig, groups: GroupsConfig | undefined, injects: GroupsConfig | undefined): void {
	for (const [section, declared] of [['groups', groups], ['injects', injects]] as const) {
		for (const key of Object.keys(declared ?? {})) {
			for (const patchKey of new Set([key, declaredGroupMintName(key)])) {
				if (!(patches as Record<string, unknown>)[patchKey]) continue;
				throw new Error(
					`patches: '${patchKey}' names the ${section}: declaration '${key}' — its body is declared under ${section}:; write the field()/variant() in that body`
				);
			}
		}
	}
}

function patchSetsOf(entry: PatchEntry): readonly PatchMap[] {
	const items = Array.isArray(entry) ? entry : [entry];
	return nestVariantsByPath(items.filter((item): item is PatchMap => !isPreference(item)));
}

/**
 * A variant patched at a position INSIDE another variant's position is minted
 * inside that variant's rule, so its name composes through it:
 * `{ '2/0': variant('exception'), '2/0/0': variant('as') }` mints
 * `_except_clause_exception` and `_except_clause_exception_as`, not a flat
 * `_except_clause_as` that reads as a sibling of the group it lives in. The
 * arm keeps its own short name, so the spelling stays `exception.as`.
 */
function nestVariantsByPath(sets: readonly PatchMap[]): readonly PatchMap[] {
	const variantAt = new Map<string, VariantPlaceholder>();
	for (const set of sets) {
		for (const [key, value] of Object.entries(set)) {
			if (isVariantPlaceholder(value)) variantAt.set(key, value);
		}
	}
	if (variantAt.size < 2) return sets;
	const ancestorsOf = (key: string): readonly string[] => {
		const segments = key.split('/');
		const names: string[] = [];
		for (let i = 1; i < segments.length; i++) {
			const prefix = segments.slice(0, i).join('/');
			const outer = variantAt.get(prefix);
			if (outer !== undefined) names.push(outer.name);
		}
		return names;
	};
	return sets.map((set) => {
		let changed = false;
		const out: PatchMap = {};
		for (const [key, value] of Object.entries(set)) {
			if (!isVariantPlaceholder(value)) {
				out[key] = value;
				continue;
			}
			const nested = nestVariant(value, ancestorsOf(key));
			changed ||= nested !== value;
			out[key] = nested;
		}
		return changed ? out : set;
	});
}

function composeOrSynthesizePatchedParents(
	rules: Record<string, RuleFn>,
	patches: PatchesConfig,
	context: WireContext
): void {
	for (const [kind, entry] of Object.entries(patches)) {
		if (!entry) continue;
		rules[kind] = buildPatchedParentFn(kind, patchSetsOf(entry), rules[kind], context);
	}
}

function buildPatchedParentFn(
	kind: string,
	patchSets: readonly PatchMap[],
	userFn: SittirRuleFn | undefined,
	context: WireContext
): SittirRuleFn {
	return function wiredPatchedParent($, original) {
		const base = userFn ? userFn($, original) : (context.deposits.get(kind) ?? original);
		if (patchSets.length === 0) return base;
		return transformFn(base as RuntimeRule, ...(patchSets as readonly Parameters<typeof transformFn>[1][]));
	};
}

function placeholderHiddenName(value: unknown, parentKind: string): string | undefined {
	if (isFieldPlaceholder(value)) return `_kw_${value.name}`;
	if (isVariantPlaceholder(value)) return polymorphVisibleName(parentKind, variantMintName(value));
	if (isAliasPlaceholder(value)) return `_${value.name}`;
	if (isRulePlaceholder(value)) return value.name;
	return undefined;
}

interface BaseArg {
	grammar?: { rules?: Record<string, RuleFn>; externals?: unknown; extras?: unknown; precedences?: unknown };
	rules?: Record<string, RuleFn>;
	externals?: unknown;
	extras?: unknown;
	precedences?: unknown;
}

function symbolNamesOf(entries: unknown): Set<string> {
	const names = new Set<string>();
	for (const entry of Array.isArray(entries) ? entries : []) {
		if (typeof entry === 'string') {
			names.add(entry);
			continue;
		}
		const symbol = entry as { type?: unknown; name?: unknown } | null;
		if (symbol && typeof symbol === 'object' && symbol.type === 'SYMBOL' && typeof symbol.name === 'string') {
			names.add(symbol.name);
		}
	}
	return names;
}

function precedenceRankedNames(cfg: WireConfig<any>, base: BaseArg | undefined): ReadonlySet<string> {
	const basePrecedences = base?.grammar?.precedences ?? base?.precedences;
	const previous = withStringGlobalShim(() =>
		typeof basePrecedences === 'function'
			? (basePrecedences as (dollar: unknown, previous: unknown) => unknown)(makeSimpleDollarProxy(), [])
			: basePrecedences
	);
	const own = (cfg as { precedences?: unknown }).precedences;
	const groups =
		typeof own === 'function'
			? withStringGlobalShim(() => (own as (dollar: unknown, previous: unknown) => unknown)(makeSimpleDollarProxy(), previous ?? []))
			: (own ?? previous);
	const names = new Set<string>();
	for (const group of Array.isArray(groups) ? groups : []) for (const name of symbolNamesOf(group)) names.add(name);
	return names;
}

function extraRuleNames(cfg: WireConfig<any>, base: BaseArg | undefined): ReadonlySet<string> {
	const baseExtras = base?.grammar?.extras ?? base?.extras;
	const previous = withStringGlobalShim(() =>
		typeof baseExtras === 'function' ? (baseExtras as (dollar: unknown) => unknown)(makeSimpleDollarProxy()) : baseExtras
	);
	const own = (cfg as { extras?: unknown }).extras;
	const entries =
		typeof own === 'function'
			? withStringGlobalShim(() => (own as (dollar: unknown, previous: unknown) => unknown)(makeSimpleDollarProxy(), previous))
			: (own ?? previous);
	return symbolNamesOf(entries);
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
	externals: ReadonlySet<string>,
	known: ReadonlySet<string>
): void {
	const declared = new Set<string>();
	for (const [kind, entry] of Object.entries(patches)) {
		if (!entry) continue;
		for (const patchMap of patchSetsOf(entry)) {
			for (const value of Object.values(patchMap)) {
				if (!isRulePlaceholder(value) || declared.has(value.name)) continue;
				if (known.has(value.name) || value.name in rules || externals.has(value.name)) {
					throw new Error(`rule('${value.name}'): '${value.name}' is already a rule of this grammar`);
				}
				declared.add(value.name);
			}
			const mints = Object.values(patchMap).map((value) => ({ value, hiddenName: placeholderHiddenName(value, kind) }));
			const defaultAbsent = defaultAbsentVariantName(kind, patchMap);
			if (defaultAbsent !== undefined) mints.push({ value: undefined, hiddenName: defaultAbsent });
			for (const { value, hiddenName } of mints) {
				if (hiddenName === undefined || hiddenName in rules || externals.has(hiddenName)) continue;
				rules[hiddenName] = isRulePlaceholder(value) ? declaredRuleFn(value) : makeDeferredContentFn(context, hiddenName);
			}
		}
	}
}

function defaultAbsentVariantName(kind: string, patchMap: PatchMap): string | undefined {
	const variants = Object.entries(patchMap).filter((entry): entry is [string, VariantPlaceholder] => isVariantPlaceholder(entry[1]));
	if (variants.some(([, v]) => v.absent === true)) return undefined;
	const throughOptional = variants.some(([key]) => {
		const segs = parsePath(key);
		return segs.length === 3 && segs.every((s) => s.kind === 'index') && (segs[1] as { value: number }).value === 0;
	});
	return throughOptional ? polymorphVisibleName(kind, ABSENT_VARIANT_NAME) : undefined;
}

function declaredRuleFn(placeholder: RulePlaceholder): SittirRuleFn {
	return function declaredRule($) {
		return placeholder.body($);
	};
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


function wrapSupertypesCallback(userSupertypes: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return function wiredSupertypes(this: unknown, $: unknown, previous?: unknown) {
		const base = userSupertypes ? (userSupertypes as (d: unknown, p?: unknown) => unknown[]).call(this, $, previous) : ((previous as unknown[] | undefined) ?? []);
		const listed = new Set(symbolNamesOf(base));
		const flattened = [...context.flattenedParents]
			.filter((name) => !listed.has(name) && !context.aliasTargets.has(name))
			.map((name) => symbolizeRef($, name));
		return [...base, ...flattened];
	} as unknown as DollarFn<unknown[]>;
}

function recordAliasTargets(rules: Record<string, RuleFn>, context: WireContext): void {
	const walker = new RuleWalker<AnyRule>();
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = function aliasRecordingRuleFn(this: unknown, $, previous) {
			const rule = (fn as (d: unknown, p: unknown) => AnyRule).call(this, $, previous);
			walker.fold(rule, context.aliasTargets, (targets, node) => {
				const alias = node as { type?: string; named?: boolean; value?: unknown };
				if (alias.type === 'ALIAS' && alias.named !== false && typeof alias.value === 'string') targets.add(alias.value);
				return targets;
			});
			return rule;
		} as RuleFn;
	}
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
	readonly adopts?: ReadonlySet<string>;
}

interface DeclaredPattern {
	readonly section: 'groups' | 'injects';
	readonly key: string;
	readonly value: RuleFn;
	readonly body: RuntimeRule;
}

function declaredPatterns(groups: GroupsConfig | undefined, injects: GroupsConfig | undefined): DeclaredPattern[] {
	const $ = makeSimpleDollarProxy();
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
	return declared.map(([section, key, value]) => {
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
		return { section, key, value, body };
	});
}

function adoptMintedGroups(baseArg: BaseArg, base: unknown, groups: GroupsConfig | undefined): Map<string, string> {
	const adopted = new Map<string, string>();
	const authored = declaredPatterns(groups, undefined);
	if (authored.length === 0) return adopted;
	const baseRules = (baseArg.grammar?.rules ?? baseArg.rules ?? {}) as Record<string, unknown>;
	for (const minted of getEnrichVisibleGroupSources(base)) {
		const body = baseRules[minted];
		if (body === undefined) continue;
		const owner = authored.find((pattern) => patternBodyEqual(unwrapPrec(body), pattern.body));
		if (owner === undefined) continue;
		adopted.set(minted, owner.key);
		delete baseRules[minted];
	}
	return adopted;
}

export function makeSimpleDollarProxy(): Record<string, RuntimeRule> {
	return new Proxy({} as Record<string, RuntimeRule>, {
		get(_target, name: string): RuntimeRule {
			const symbol = { type: 'SYMBOL', name };
			return symbol;
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

function replaceInBodyRt(rule: unknown, candidates: readonly WirePatternCandidate[], automatic: () => AutomaticVariants): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	for (const c of candidates) {
		if (
			patternBodyEqual(rule, c.body) ||
			(r.type === 'SYMBOL' && c.adopts?.has((r as { name?: string }).name ?? '') === true)
		) {
			const site =
				c.aliasAs === undefined
					? { type: 'SYMBOL', name: c.name }
					: { type: 'ALIAS', content: { type: 'SYMBOL', name: c.name }, named: true, value: c.aliasAs };
			return relabelledArm(site, rule, automatic());
		}
	}
	const t = r.type;
	if (t === 'SEQ' || t === 'CHOICE') {
		const members = r.members;
		if (!Array.isArray(members)) return rule;
		let changed = false;
		const newMembers = members.map((m) => {
			const replaced = replaceInBodyRt(m, candidates, automatic);
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
		const newContent = replaceInBodyRt(r.content, candidates, automatic);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
}

function buildPatternReplacingFn(fn: RuleFn, candidates: readonly WirePatternCandidate[], automatic: () => AutomaticVariants): RuleFn {
	return function patternReplacingRuleFn($, previous) {
		const result = fn($, previous);
		return replaceInBodyRt(result, candidates, automatic);
	};
}

function withStringGlobalShim<T>(fn: () => T): T {
	const g = globalThis as Record<string, unknown>;
	const shims: Record<string, unknown> = {
		string: (value: string) => ({ type: 'STRING', value }),
		indent: () => ({ type: 'INDENT' }),
		dedent: () => ({ type: 'DEDENT' })
	};
	const added: string[] = [];
	for (const [name, shim] of Object.entries(shims)) {
		if (name in g) continue;
		g[name] = shim;
		added.push(name);
	}
	try {
		return fn();
	} finally {
		for (const name of added) delete g[name];
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

function stampHoistedFn(fn: RuleFn): RuleFn {
	return function hoistedRuleFn($, previous) {
		return withHoistedAnnotation(fn($, previous));
	};
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
	groups: GroupsConfig | undefined,
	context: WireContext,
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

	for (const { section, key, value, body } of declaredPatterns(groups, injects)) {
		const hiddenName = declaredGroupMintName(key);
		const hidden = hiddenName === key;
		const adopts = new Set([...context.adoptedGroups].filter(([, owner]) => owner === key).map(([minted]) => minted));
		candidates.push(hidden ? { name: hiddenName, body } : { name: hiddenName, body, aliasAs: key, adopts });
		const registered = wrapOneRuleFn(hiddenName, value, context);
		rules[hiddenName] = section === 'groups' ? stampHoistedFn(registered) : registered;
	}

	if (candidates.length === 0) return;

	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, fn] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		rules[name] = buildPatternReplacingFn(fn, candidates, () => context.automaticVariants);
	}
}
