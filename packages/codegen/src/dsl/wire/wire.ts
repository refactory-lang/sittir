import type { BindingEffect, Lead } from '../verbs/effects.ts';
import { withHoistedAnnotation } from '../annotations.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import type { AnyRule } from '../../types/rule.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import { RuleWalker } from '../rule-walker.ts';
import { transform as transformFn, withDirectVariants } from '../transform/transform.ts';
import { isPreference, type PreferencePlaceholder } from '../primitives/preference.ts';
import { INDENT_KEY, LABELS_KEY, type OptionsConfig } from './options-block.ts';
import type { ReparseHostsConfig } from './reparse-hosts.ts';
import type { IsPreferencePath } from '../primitives/preference-path.ts';
import {
	parseFlankAddress,
	parseSeamLabel,
	parseSpacingLabel
} from '../primitives/spacing.ts';
import { isFieldPlaceholder } from '../primitives/field.ts';
import { isAliasPlaceholder } from '../primitives/alias.ts';
import { isRulePlaceholder, type RulePlaceholder } from '../primitives/rule.ts';
import type { LeadPlaceholder } from '../primitives/lead.ts';
import type { NarrowPlaceholder } from '../primitives/narrow.ts';
import type { NarrowEntry } from '../verbs/narrow.ts';
import {
	ABSENT_VARIANT_NAME,
	isVariantPlaceholder,
	nestVariant,
	variantMintName,
	type VariantPlaceholder
} from '../primitives/variant.ts';
import { parsePath } from '../transform/transform-path.ts';
import { renameNameList, renameRule } from './symbol-renames.ts';
import { assertNoRenamedExternal, liftRenames, resolveLiftNames, type LiftName } from './lift-names.ts';
import { aliasOf, isComplexBody, isParserHiddenName, onlyAliasedSymbols, rulesEqual, symbolNames, type SymbolSource } from '../rule-patterns.ts';
import { predictedSymbolSourceOf } from '../symbol-table.ts';
import { getEnrichElementSupertypes, getEnrichFieldBackings, getEnrichHiddenSubsequences, getEnrichMints, getEnrichTextTokens, getEnrichVisibleSubsequenceSources, getEnrichWhitespace, nativeRuleFn, type AuthoredFieldSite, type GrammarResult } from '../enrich.ts';
import type { WhitespaceCollision } from '../whitespace.ts';
import { relabelledArm, seedAutomaticVariants, withoutLabel, type AutomaticVariants } from '../automatic-variants.ts';
import { polymorphVisibleName } from '../arm-names.ts';
import { extrasClosure } from '../extras.ts';
import { collectSymbolRefs } from '../../util/reachable-rules.ts';
import type { GrammarJson, GrammarRule, SymbolRule, AuthoringRule } from '../../grammar-shapes/grammar-json.ts';
import type { IsPath, TransformPatchMap } from '../../grammar-shapes/path-type.ts';
import { ruleCauseOf, type RuleCauseDeclaration } from '../primitives/rule-cause.ts';
import { baseRulesOf, VERIFIED_TREE_SITTER } from '../shared.ts';

export type RenderAsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export type VisibleExternalsConfig = ($: Record<string, unknown>) => Record<string, unknown>;

export type PatchForm =
	| 'field'
	| 'variant'
	| 'alias'
	| 'rule'
	| 'default'
	| 'group'
	| 'flatten'
	| 'regex'
	| 'preference'
	| 'lead'
	| 'narrow'
	| 'literal';

export interface PatchSite {
	readonly ownerKind: string;
	readonly path: string;
	readonly form: PatchForm;
	readonly name?: string;
	readonly lifts?: readonly string[];
}

export interface WireContext {
	readonly deposits: Map<string, RuntimeRule>;
	readonly ruleBodies: Map<string, { readonly text: string; readonly site: string }>;
	readonly syntheticInline: Set<string>;
	readonly inlineRemovals: Set<string>;
	readonly liftNames: Map<string, LiftName>;
	readonly refineForms: Map<string, RefineForm[]>;
	readonly groups?: GroupsConfig;
	readonly renderAs?: Readonly<Record<string, unknown>>;
	readonly visibleExternals?: Readonly<Record<string, unknown>>;
	readonly whitespaceCollisions?: readonly WhitespaceCollision[];
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Partial<Record<string, string>>;
	readonly reparseHosts?: ReparseHostsConfig;
	readonly options?: OptionsConfig;
	currentRuleKind: string | null;
	currentDollar: unknown;
	readonly inlineWrites: WeakMap<object, string>;
	applyingEntries: boolean;
	readonly authoredRuleNames: ReadonlySet<string>;
	readonly ruleCauses: ReadonlyMap<string, RuleCauseDeclaration>;
	readonly undeclaredRules: ReadonlySet<string>;
	readonly patchSites: Map<string, PatchSite>;
	readonly bindingEffects: BindingEffect[];
	extraRuleNames: ReadonlySet<string>;
	precedenceRankedNames: ReadonlySet<string>;
	lists?: WireLists;
	readonly flattenedParents: Set<string>;
	readonly aliasTargets: Set<string>;
	readonly editedMints: Set<string>;
	readonly automaticVariants: AutomaticVariants;
	readonly baseRuleBodies: Readonly<Record<string, RuntimeRule>>;
	readonly textTokens: ReadonlyMap<string, readonly string[]>;
	readonly symbols: () => SymbolSource | undefined;
	readonly baseSupertypeNames: ReadonlySet<string>;
	readonly liftBodies: Map<string, RuntimeRule>;
	readonly liftClaims: Map<string, Set<string>>;
	readonly elementSupertypes: ReadonlyMap<string, string>;
	activePatchSites: readonly string[];
	readonly source: unknown;
	evaluatedExternals: ReadonlySet<string>;
	evaluatedBodies?: ReadonlyMap<string, unknown>;
	readonly layer: WireLayer | undefined;
}

export interface WireLayer {
	readonly name: string;
	readonly depth: number;
	readonly diagnostics: GrammarDiagnostic[];
	readonly narrows: NarrowEntry[];
	readonly leads: Lead[];
}

export interface WireLists {
	readonly extras: unknown;
	readonly supertypes: unknown;
	readonly precedences: unknown;
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

export function wireTextTokenOf(member: unknown): string | undefined {
	const { type, name } = (member ?? {}) as { type?: unknown; name?: unknown };
	return type === 'SYMBOL' && typeof name === 'string' && currentContext?.textTokens.has(name) ? name : undefined;
}

export function wireTextTokenBody(name: string): RuntimeRule {
	if (!currentContext) throw new Error(`edits: '${name}': no active wire() context`);
	return currentContext.deposits.get(name) ?? currentContext.baseRuleBodies[name]!;
}

export function wireDepositTextToken(name: string, rewrite: (body: RuntimeRule) => RuntimeRule): void {
	if (!currentContext) throw new Error(`edits: '${name}': no active wire() context`);
	const owners = currentContext.textTokens.get(name) ?? [];
	if (owners.length > 1) {
		throw new Error(`edits: an edit through '${name}' would rewrite the text token ${owners.join(', ')} share; edit each owner's site into a token of its own instead`);
	}
	currentContext.deposits.set(name, rewrite(currentContext.deposits.get(name) ?? currentContext.baseRuleBodies[name]!));
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

export function wireRegisterFlattenedParent(name: string): boolean {
	if (!currentContext) return false;
	currentContext.flattenedParents.add(name);
	return true;
}

export function wireIsPrecedenceRankedRule(name: string): boolean {
	return currentContext?.precedenceRankedNames.has(name) ?? false;
}

export function wireLiftRenamedTo(name: string): string | undefined {
	for (const [liftName, named] of currentContext?.liftNames ?? []) {
		if (named.name === name) return liftName;
	}
	return undefined;
}

export function wireRenameLift(liftName: string, newName: string, hoisted: boolean = false): void {
	if (!currentContext) return;
	const named = currentContext.liftNames.get(liftName);
	if (named !== undefined && named.name !== newName) {
		throw new Error(`variant(): the shared lift '${liftName}' is named '${named.name}' by one owner and '${newName}' by another; one kind has one name`);
	}
	currentContext.liftNames.set(liftName, { name: newName, hoisted: hoisted || named?.hoisted === true });
	recordLiftClaim(liftName);
}

export function wireHasAuthoredRule(name: string): boolean {
	return currentContext?.authoredRuleNames.has(name) ?? false;
}

export function wireRegisterRefineForms(kind: string, forms: RefineForm[]): boolean {
	if (!currentContext) return false;
	currentContext.refineForms.set(kind, forms);
	return true;
}

export function patchSiteKey(site: PatchSite): string {
	return `${site.ownerKind}|${site.path}|${site.form}`;
}

export function wireRecordPatchSite(site: PatchSite): void {
	currentContext?.patchSites.set(patchSiteKey(site), site);
}

export function wireRecordBindingEffect(effect: BindingEffect): void {
	currentContext?.bindingEffects.push(effect);
}

export function wireWithPatchSites<T>(sites: readonly PatchSite[], fn: () => T): T {
	const context = currentContext;
	if (!context) return fn();
	const prior = context.activePatchSites;
	context.activePatchSites = sites.map(patchSiteKey);
	try {
		return fn();
	} finally {
		context.activePatchSites = prior;
	}
}

function recordLiftClaim(liftName: string): void {
	if (!currentContext) return;
	for (const key of currentContext.activePatchSites) {
		const claims = currentContext.liftClaims.get(key) ?? new Set<string>();
		currentContext.liftClaims.set(key, claims.add(liftName));
	}
}

export function wireGetCurrentRuleKind(): string | null {
	return currentContext?.currentRuleKind ?? null;
}

export function wireGetCurrentDollar(): unknown {
	return currentContext?.currentDollar;
}

export function wireNoteInlineWrite<R>(rule: R): R {
	const context = currentContext;
	if (context && !context.applyingEntries && context.currentRuleKind !== null && typeof rule === 'object' && rule !== null) context.inlineWrites.set(rule, context.currentRuleKind);
	return rule;
}

export function wireIsInlineWrite(rule: unknown): boolean {
	const context = currentContext;
	return !!context && context.currentRuleKind !== null && typeof rule === 'object' && rule !== null && context.inlineWrites.get(rule) === context.currentRuleKind;
}

export function wireIsApplyingEntries(): boolean {
	return currentContext?.applyingEntries === true;
}

export function wireApplyingEntries<T>(fn: () => T): T {
	const context = currentContext;
	if (!context) return fn();
	const prior = context.applyingEntries;
	context.applyingEntries = true;
	try {
		return fn();
	} finally {
		context.applyingEntries = prior;
	}
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

export function wireGetLiftBody(name: string): RuntimeRule | undefined {
	return currentContext?.liftBodies.get(name) ?? currentContext?.baseRuleBodies[name];
}

export function wireElementSlotOf(liftName: string): string | undefined {
	return currentContext?.elementSupertypes.get(liftName);
}

export function wireWithLiftScope<T>(liftName: string, fn: () => T): T {
	const context = currentContext;
	if (!context?.elementSupertypes.has(liftName)) return fn();
	const owner = context.currentRuleKind;
	context.currentRuleKind = liftName;
	try {
		return fn();
	} finally {
		context.currentRuleKind = owner;
	}
}

export function wireSetLiftBody(name: string, body: RuntimeRule): void {
	recordLiftClaim(name);
	currentContext?.liftBodies.set(name, body);
}

function baseRuleBodiesOf(base: BaseArg | undefined): Readonly<Record<string, RuntimeRule>> {
	return baseRulesOf<RuntimeRule>(base) ?? {};
}

function baseSupertypeNamesOf(base: BaseArg | undefined): ReadonlySet<string> {
	return symbolNamesOf(overriddenList(base?.grammar?.supertypes ?? base?.supertypes, undefined));
}

function baseSymbolSourceOf(base: BaseArg | undefined): () => SymbolSource | undefined {
	const rules = baseRulesOf<AnyRule>(base) ?? {};
	if (Object.keys(rules).length === 0) return () => undefined;
	let symbols: SymbolSource | undefined;
	return () =>
		(symbols ??= predictedSymbolSourceOf({
			rules,
			externals: [...baseExternalNames(base)].map((name) => ({ type: 'SYMBOL' as const, name })),
			extras: [],
			supertypes: [...baseSupertypeNamesOf(base)],
			inline: [...symbolNamesOf(overriddenList(base?.grammar?.inline ?? base?.inline, undefined))],
			word: null
		}));
}

export function wireSymbols(): SymbolSource | undefined {
	return currentContext?.symbols();
}

export function wireIsBaseSupertype(name: string): boolean {
	return currentContext?.baseSupertypeNames.has(name) ?? false;
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
		liftNames: new Map(),
		refineForms: new Map(),
		groups: undefined,
		renderAs: undefined,
		options: undefined,
		currentRuleKind: ruleKind,
		currentDollar: undefined,
		inlineWrites: new WeakMap(),
		applyingEntries: false,
		authoredRuleNames: new Set(),
		ruleCauses: new Map(),
		undeclaredRules: new Set(),
		patchSites: new Map(),
		bindingEffects: [],
		extraRuleNames: new Set(),
		precedenceRankedNames: new Set(),
		flattenedParents: new Set(),
		aliasTargets: new Set(),
		editedMints: new Set(),
		automaticVariants: seedAutomaticVariants(base),
		baseRuleBodies: baseRuleBodiesOf(base as BaseArg | undefined),
		textTokens: getEnrichTextTokens(base),
		symbols: baseSymbolSourceOf(base as BaseArg | undefined),
		baseSupertypeNames: baseSupertypeNamesOf(base as BaseArg | undefined),
		liftBodies: new Map(),
		liftClaims: new Map(),
		elementSupertypes: getEnrichElementSupertypes(base),
		activePatchSites: [],
		source: base,
		evaluatedExternals: new Set(),
		layer: undefined
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

export type GroupsConfig = Partial<Record<string, RuleFn>>;

export type EditsConfig<Base extends GrammarJson = GrammarJson> = [GrammarRule] extends [
	Base['rules'][keyof Base['rules']]
]
	? Partial<Record<BaseKind<Base>, PatchEntry>>
	: Base extends { readonly rules: infer R }
		? { readonly [K in keyof R]?: TransformPatchMap | readonly TransformPatchMap[] }
		: Partial<Record<BaseKind<Base>, PatchEntry>>;

export type PatchEntry = PatchMap | readonly PatchMap[];

export type PatchMap = Record<string, unknown>;

type RulesOf<B> = B extends { readonly rules: infer R } ? R : never;

type PatchKeyCheck<Rule, M, Minted extends string> = {
	readonly [Path in keyof M]: Path extends string | number
		? string extends Path
			? M[Path]
			: IsPath<Rule, `${Path}`, Minted> extends true
				? M[Path]
				: { readonly 'edits: no such path in this rule': `${Path}` }
		: M[Path];
};

type MintedLabels<M> = {
	readonly [K in keyof M]: M[K] extends { readonly name: infer N extends string }
		? M[K] extends { readonly __sittirPlaceholder: 'field' } | { readonly type: 'FIELD' }
			? N
			: never
		: never;
}[keyof M];

type CheckMaps<Rule, E extends readonly unknown[], Minted extends string> = E extends readonly [
	infer Head,
	...infer Tail
]
	? readonly [PatchKeyCheck<Rule, Head, Minted>, ...CheckMaps<Rule, Tail, Minted | MintedLabels<Head>>]
	: readonly [];

type PatchEntryCheck<Rule, E> = E extends readonly unknown[]
	? number extends E['length']
		? { readonly [I in keyof E]: PatchKeyCheck<Rule, E[I], never> }
		: CheckMaps<Rule, E, never>
	: PatchKeyCheck<Rule, E, never>;

export type IsShaped<B> = 0 extends 1 & B ? false : [GrammarRule] extends [RulesOf<B>[keyof RulesOf<B>]] ? false : true;

export type EditsCheck<B, P> = IsShaped<B> extends false
	? unknown
	: { readonly [K in keyof P]: K extends keyof RulesOf<B> ? PatchEntryCheck<RulesOf<B>[K], P[K]> : P[K] };

type DeclaredLabels<O> = {
	[K in Exclude<keyof O, typeof LABELS_KEY | typeof INDENT_KEY> & string]: `${K}/${keyof O[K] & string}`;
}[Exclude<keyof O, typeof LABELS_KEY | typeof INDENT_KEY> & string];

type PreferencePathCheck<M> = {
	readonly [Path in keyof M]: Path extends string
		? string extends Path
			? M[Path]
			: IsPreferencePath<Path> extends true
				? M[Path]
				: { readonly 'options: not a path': Path }
		: M[Path];
};

type LabelsCheck<B, O, M> = {
	readonly [Address in keyof M]: Address extends string
		? string extends Address
			? M[Address]
			: IsPreferencePath<Address> extends false
				? { readonly 'options: _labels address is not a path': Address }
				: M[Address] extends DeclaredLabels<O>
					? M[Address] extends `${infer Root}/${string}`
						? IsShaped<B> extends true
							? Root extends keyof RulesOf<B>
								? { readonly "options: a label's kind is virtual, this names a real kind": Root }
								: M[Address]
							: M[Address]
						: M[Address]
					: { readonly 'options: _labels names no declared label': M[Address] }
		: M[Address];
};

export type OptionsCheck<B, O> = {
	readonly [K in keyof O]: K extends typeof LABELS_KEY
		? LabelsCheck<B, O, O[K]>
		: K extends typeof INDENT_KEY
			? PreferencePlaceholder
			: PreferencePathCheck<O[K]>;
};

export type ShapedSymbols<B extends GrammarJson> = {
	readonly [R in keyof B['rules'] & string]: SymbolRule<R>;
} & {
	readonly [name: string]: SymbolRule<string>;
};

export type WireConfig<B extends GrammarJson, NewRules extends string = string> = Omit<
	Grammar<NewRules, keyof B['rules'] & string>,
	'rules' | 'conflicts' | 'extras'
> & {
	readonly extras?: ($: ShapedSymbols<B>, previous?: readonly GrammarRule[]) => readonly AuthoringRule[];
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
	readonly groups?: Partial<Record<string, ($: ShapedSymbols<B>, previous?: GrammarRule) => unknown>>;
	readonly edits?: EditsConfig<B>;
	readonly options?: OptionsConfig;
	readonly renderAs?: RenderAsConfig;
	readonly visibleExternals?: VisibleExternalsConfig;
	readonly expectDiagnostics?: Partial<Record<string, readonly string[]>>;
	readonly expectTestFailures?: Partial<Record<string, string>>;
	readonly reparseHosts?: ReparseHostsConfig;
};

type ConflictsFn = (this: unknown, $: unknown, previous?: unknown[][]) => unknown[][];

export interface WiredOpts {
	readonly name: string;
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
	readonly __wireContext__?: WireContext;
}

type SittirRuleFn = ($: any, previous?: any) => unknown;
type RuleFn = SittirRuleFn;
type DollarFn<T> = (this: unknown, $: unknown, previous?: T) => T;

export function wire<B extends GrammarJson = any, const P = EditsConfig<B>, const O = OptionsConfig>(
	config: WireConfig<B> & { readonly edits?: P & EditsCheck<B, P>; readonly options?: O & OptionsCheck<B, O> },
	base: B,
	source: unknown = base
): WiredOpts {
	return wireImpl(config as unknown as WireConfig<any>, base, source);
}

export function wireWithoutConfig(name: string, base: GrammarResult): WiredOpts {
	return wireImpl({ name }, base, base);
}

export function wireImpl(cfg: WireConfig<any>, base: unknown, source: unknown, layer?: WireLayer, declared: EvaluatedConfig = evaluatedConfig(cfg)): WiredOpts {
	const baseArg = base as BaseArg | undefined;
	const { visibleExternals, whitespaceCollisions } = withEnrichedWhitespace(declared.visibleExternals, base);
	assertNoSpacingAddressPatches(cfg.edits ?? {}, knownRuleNames(cfg, baseArg));
	assertNoDeclaredGroupPatches(cfg.edits ?? {}, cfg.groups);
	const context: WireContext = {
		deposits: new Map(),
		ruleBodies: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		liftNames: new Map(),
		refineForms: new Map(),
		groups: cfg.groups,
		renderAs: declared.renderAs,
		visibleExternals,
		whitespaceCollisions,
		expectDiagnostics: cfg.expectDiagnostics,
		expectTestFailures: cfg.expectTestFailures,
		reparseHosts: cfg.reparseHosts,
		options: cfg.options,
		currentRuleKind: null,
		currentDollar: undefined,
		inlineWrites: new WeakMap(),
		applyingEntries: false,
		authoredRuleNames: new Set(Object.keys(cfg.rules ?? {})),
		...declaredRuleCauses(cfg.rules ?? {}),
		patchSites: new Map(),
		bindingEffects: [],
		extraRuleNames: new Set(),
		precedenceRankedNames: new Set(),
		flattenedParents: new Set(),
		aliasTargets: new Set(),
		editedMints: new Set(),
		automaticVariants: seedAutomaticVariants(base),
		baseRuleBodies: baseRuleBodiesOf(baseArg),
		textTokens: getEnrichTextTokens(base),
		symbols: baseSymbolSourceOf(baseArg),
		baseSupertypeNames: baseSupertypeNamesOf(baseArg),
		liftBodies: new Map(),
		liftClaims: new Map(),
		elementSupertypes: getEnrichElementSupertypes(base),
		activePatchSites: [],
		source,
		evaluatedExternals: new Set(),
		layer
	};

	const edits = cfg.edits ?? {};
	const outRules: Record<string, RuleFn> = { ...cfg.rules } as Record<string, RuleFn>;

	composeOrSynthesizePatchedParents(outRules, edits, context);
	injectPlaceholderHiddenRules(outRules, edits, context, baseExternalNames(baseArg), knownRuleNames(cfg, baseArg));
	for (const name of context.textTokens.keys()) outRules[name] ??= makeDeferredContentFn(context, name);
	for (const baseName of Object.keys(context.baseRuleBodies)) {
		if (!(baseName in outRules)) outRules[baseName] = passthroughBaseRuleFn;
	}
	wrapAllRuleFns(outRules, context);
	applyWirePatternReplacement(outRules, context.authoredRuleNames, declared.patterns, context);
	applyWireVisibleExternalsRewrite(outRules, visibleExternals);

	if (baseArg) {
		for (const name of getEnrichHiddenSubsequences(base)) {
			context.syntheticInline.add(name);
		}
		for (const name of getEnrichFieldBackings(base)) {
			context.syntheticInline.add(name);
		}
		for (const name of getEnrichVisibleSubsequenceSources(base)) {
			context.inlineRemovals.add(name);
		}
		applyWirePatternReplacement(outRules, context.authoredRuleNames, declared.patterns, context);
	}
	recordAliasTargets(outRules, context);
	const externals = evaluatingExternals(cfg, outRules, { base: baseArg, context }, [
		(bodies) => resolveLiftNames(bodies, context.liftNames, getEnrichMints(base), context.evaluatedExternals)
	]);
	returnEvaluatedBodies(outRules, context);

	const inline = wrapInlineCallback(cfg.inline as DollarFn<unknown[]> | undefined, context);
	const supertypes = wrapSupertypesCallback(evaluatedList('supertypes', context) as DollarFn<unknown[]>, context);

	const renamedCallbacks = Object.fromEntries(
		(['extras', 'precedences'] as const)
			.filter((key) => key in cfg || baseDeclares(baseArg, key))
			.map((key) => [key, renamingCallback(evaluatedList(key, context), renameNameList, context)])
	);
	const wired = {
		...cfg,
		rules: outRules,
		...renamedCallbacks,
		externals,
		...(cfg.reserved === undefined ? {} : { reserved: renamingReserved(cfg.reserved, context) }),
		...renamingWord(cfg.word as DollarFn<unknown> | undefined, baseWordOf(baseArg), context),
		conflicts: undefined,
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

export function protectedWireRuleNames(context: WireContext): string[] {
	return [...context.deposits.keys(), ...Object.keys(context.renderAs ?? {}), ...Object.keys(context.visibleExternals ?? {})];
}

function declaredRuleCauses(rules: Record<string, RuleFn>): Pick<WireContext, 'ruleCauses' | 'undeclaredRules'> {
	const ruleCauses = new Map<string, RuleCauseDeclaration>();
	const undeclaredRules = new Set<string>();
	for (const [name, fn] of Object.entries(rules)) {
		const declaration = ruleCauseOf(fn);
		if (declaration === undefined) undeclaredRules.add(name);
		else ruleCauses.set(name, declaration);
	}
	return { ruleCauses, undeclaredRules };
}

function baseWordOf(base: BaseArg | undefined): string | undefined {
	const word = ((base?.grammar ?? base) as { word?: unknown } | undefined)?.word;
	return typeof word === 'string' ? word : undefined;
}

function renamingWord(user: DollarFn<unknown> | undefined, baseWord: string | undefined, context: WireContext): { word?: DollarFn<unknown> } {
	if (user !== undefined) return { word: renamingCallback(user, renameNameList, context) };
	if (baseWord === undefined) return {};
	return {
		word: function renamedBaseWord(this: unknown, $: unknown) {
			return ($ as Record<string, unknown>)[renameNameList(baseWord, liftRenames(context.liftNames)) as string];
		}
	};
}

function renamingReserved(reserved: unknown, context: WireContext): unknown {
	if (reserved === null || typeof reserved !== 'object' || Array.isArray(reserved)) return reserved;
	return Object.fromEntries(
		Object.entries(reserved as Record<string, unknown>).map(([contextName, list]) => [
			contextName,
			typeof list === 'function'
				? renamingCallback(list as () => unknown, renameRule, context)
				: renameRule(list, liftRenames(context.liftNames))
		])
	);
}

function baseDeclares(base: BaseArg | undefined, key: string): boolean {
	const grammar = (base?.grammar ?? base) as Record<string, unknown> | undefined;
	return grammar?.[key] !== undefined;
}

export function layerSymbols(names?: ReadonlySet<string>): Record<string, unknown> {
	const symbol = nativeRuleFn<(name: string) => unknown>('sym');
	return new Proxy({} as Record<string, unknown>, {
		get(_target, name) {
			if (typeof name !== 'string') return undefined;
			if (names === undefined || names.has(name)) return symbol(name);
			return Object.assign(new ReferenceError(`Undefined symbol '${name}'`), { symbol: symbol(name) });
		}
	});
}

interface WireEntryCtx {
	readonly base: BaseArg | undefined;
	readonly context: WireContext;
}

function evaluatingExternals(
	cfg: WireConfig<any>,
	rules: Readonly<Record<string, RuleFn>>,
	ctx: WireEntryCtx,
	operations: readonly ((bodies: Map<string, unknown>) => void)[]
): DollarFn<unknown> {
	const { context } = ctx;
	const user = cfg.externals as DollarFn<unknown> | undefined;
	const callbacks = Object.entries(rules);
	return function evaluatingExternals(this: unknown, $: unknown, previous?: unknown) {
		if (context.evaluatedBodies !== undefined) throw new Error('wire: the runtime called externals twice, and wire evaluates its rules once');
		const value = user === undefined ? previous : user.call(this, $, previous);
		context.evaluatedExternals = symbolNamesOf(value);
		assertNoRenamedExternal(context.evaluatedExternals, context.liftNames);
		const symbols = layerSymbols(
			new Set([...callbacks.map(([name]) => name), ...Object.keys(context.baseRuleBodies), ...context.evaluatedExternals])
		);
		evaluateWireLists(cfg, { ...ctx, symbols });
		const bodies = new Map<string, unknown>();
		for (const [name, callback] of callbacks) {
			if (context.editedMints.has(name) && context.deposits.get(name) === undefined) refuseEditSite(name, cfg, ctx);
			else bodies.set(name, callback.call(symbols, symbols, context.baseRuleBodies[name]));
		}
		for (const [name, body] of context.deposits) if (!bodies.has(name) && !Object.hasOwn(context.baseRuleBodies, name)) bodies.set(name, body);
		for (const operation of operations) operation(bodies);
		context.evaluatedBodies = bodies;
		return value;
	};
}

function refuseEditSite(kind: string, cfg: WireConfig<any>, ctx: WireEntryCtx): void {
	recordRefusal(ctx.context, cfg.name, {
		code: 'edit-site-missing',
		ownerKind: kind,
		message: `edits: '${kind}' names no rule of the base or of the layer's rules:, nor a kind the layer minted before it evaluated '${kind}'`,
		details: { kind }
	});
}

export interface WireRefusal {
	readonly code: string;
	readonly ownerKind: string;
	readonly message: string;
	readonly details: Record<string, unknown>;
}

function recordRefusal(context: WireContext | null, grammar: string, { code, ownerKind, message, details }: WireRefusal): void {
	if (context?.layer === undefined) throw new Error(message);
	context.layer.diagnostics.push({ scope: 'grammar', code, severity: 'fail', canProceed: false, grammar, ownerKind, message, details });
}

export function wireRefuse(refusal: WireRefusal): void {
	recordRefusal(currentContext, currentContext?.layer?.name ?? '', refusal);
}

export function wireAliasTargetIssue(from: string, to: string): string | undefined {
	const context = currentContext;
	if (context?.layer === undefined || context.layer.depth === 1) return undefined;
	if (isParserHiddenName(from) !== isParserHiddenName(to)) return 'flips hiddenness';
	if (Object.hasOwn(context.baseRuleBodies, to)) return 'the grammar already names the target';
	return undefined;
}

export function wireQueueLead(entry: LeadPlaceholder): void {
	const list = currentContext?.currentRuleKind;
	if (currentContext?.layer === undefined || list === null || list === undefined)
		throw new Error(`lead('${entry.item}', '${entry.field}'): a lead entry applies in a layer pass, as the '.' entry of a list kind`);
	currentContext.layer.leads.push({ list, item: entry.item, field: entry.field, admits: entry.admits });
}

export function wireQueueNarrow(entry: NarrowPlaceholder, path: string): void {
	const owner = currentContext?.currentRuleKind;
	if (currentContext?.layer === undefined || owner === null || owner === undefined)
		throw new Error(`narrow at '${path}': a narrow entry applies in a layer pass, as an edits entry`);
	currentContext.layer.narrows.push({ owner, path, direction: entry.direction, admits: entry.admits });
}

function evaluateWireLists(cfg: WireConfig<any>, ctx: WireEntryCtx & { readonly symbols: Record<string, unknown> }): void {
	const { base, context, symbols: $ } = ctx;
	const evaluated = (key: keyof WireLists, previous: unknown): unknown => {
		const own = cfg[key] as DollarFn<unknown> | undefined;
		return own === undefined ? previous : own.call($, $, previous ?? []);
	};
	const lists: WireLists = {
		extras: evaluated('extras', baseListOf(base, 'extras')),
		supertypes: evaluated('supertypes', namedSymbols(baseListOf(base, 'supertypes'))),
		precedences: evaluated('precedences', baseListOf(base, 'precedences'))
	};
	context.lists = lists;
	context.extraRuleNames = extraRuleNamesOf(lists, base);
	context.precedenceRankedNames = new Set(
		(Array.isArray(lists.precedences) ? lists.precedences : []).flatMap((group: unknown) => [...symbolNamesOf(group)])
	);
}

function evaluatedList(key: keyof WireLists, context: WireContext): DollarFn<unknown> {
	return function evaluatedList() {
		if (context.lists === undefined)
			throw new Error(
				`wire: the runtime asked for ${key} before it called externals, where wire evaluates its lists; the call order was verified against tree-sitter ${VERIFIED_TREE_SITTER}`
			);
		return context.lists[key];
	};
}

export function namedSymbols(names: unknown): unknown[] {
	const symbol = nativeRuleFn<(name: string) => unknown>('sym');
	return (Array.isArray(names) ? names : []).map((name) => (typeof name === 'string' ? symbol(name) : name));
}

function returnEvaluatedBodies(rules: Record<string, RuleFn>, context: WireContext): void {
	for (const name of Object.keys(rules)) {
		rules[name] = function evaluatedRule(_$, previous) {
			if (previous !== undefined && previous !== context.baseRuleBodies[name]) {
				throw new Error(`wire: the base body the grammar runtime passes for '${name}' is not the one wire holds`);
			}
			if (context.evaluatedBodies === undefined) {
				throw new Error(
					`wire: the runtime asked for '${name}' before it called externals, where wire evaluates its rules; the call order was verified against tree-sitter ${VERIFIED_TREE_SITTER}`
				);
			}
			return context.evaluatedBodies.get(name);
		};
	}
}

function renamingCallback<F extends (...args: never[]) => unknown>(
	user: F | undefined,
	rename: (value: unknown, renames: ReadonlyMap<string, string>) => unknown,
	context: WireContext
): DollarFn<unknown> {
	return function renamed(this: unknown, $: unknown, previous?: unknown) {
		const value = user === undefined ? previous : (user as unknown as (d: unknown, p?: unknown) => unknown).call(this, $, previous);
		return rename(value, liftRenames(context.liftNames));
	} as unknown as DollarFn<unknown>;
}

function knownRuleNames(cfg: WireConfig<any>, base: BaseArg | undefined): ReadonlySet<string> {
	const baseRules = baseRulesOf<unknown>(base) ?? {};
	return new Set([...Object.keys(cfg.rules ?? {}), ...Object.keys(cfg.groups ?? {}), ...Object.keys(baseRules)]);
}

function isRetiredAddressKey(key: string, rules: ReadonlySet<string>): boolean {
	if (rules.has(key) || rules.has(`_${key}`)) return false;
	return (
		parseSpacingLabel(key) !== undefined || parseSeamLabel(key) !== undefined || parseFlankAddress(key) !== undefined
	);
}

function assertNoSpacingAddressPatches(edits: EditsConfig, rules: ReadonlySet<string>): void {
	for (const key of Object.keys(edits)) {
		if (!edits[key]) continue;
		if (isRetiredAddressKey(key, rules)) {
			throw new Error(`edits: '${key}' is a spacing address; declare it under options: against the site it names`);
		}
	}
}

function declaredGroupMintName(key: string): string {
	return `_${key}`;
}

function assertNoDeclaredGroupPatches(edits: EditsConfig, groups: GroupsConfig | undefined): void {
	for (const key of Object.keys(groups ?? {})) {
		for (const patchKey of [key, declaredGroupMintName(key)]) {
			if (!(edits as Record<string, unknown>)[patchKey]) continue;
			throw new Error(
				`edits: '${patchKey}' names the groups: declaration '${key}' — its body is declared under groups:; write the field()/variant() in that body`
			);
		}
	}
}

export function authoredFieldSites(edits: EditsConfig | undefined): ReadonlyMap<string, readonly AuthoredFieldSite[]> {
	const sites = new Map<string, AuthoredFieldSite[]>();
	for (const [kind, entry] of Object.entries(edits ?? {})) {
		if (!entry) continue;
		for (const set of patchSetsOf(entry)) {
			for (const [key, value] of Object.entries(set)) {
				if (!isFieldPlaceholder(value)) continue;
				const path = parsePath(key);
				const indices = path.flatMap((segment) => (segment.kind === 'index' ? [segment.value] : []));
				if (indices.length === path.length) sites.set(kind, [...(sites.get(kind) ?? []), { path: indices, name: value.name }]);
			}
		}
	}
	return sites;
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
	edits: EditsConfig,
	context: WireContext
): void {
	for (const [kind, entry] of Object.entries(edits)) {
		if (!entry) continue;
		if (!(kind in rules) && !(kind in context.baseRuleBodies)) context.editedMints.add(kind);
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
		return withDirectVariants(base, ...(patchSets as readonly Parameters<typeof transformFn>[1][]));
	};
}

function elementSupertypesOf(kind: string, context: WireContext): string[] {
	const body = context.baseRuleBodies[kind];
	if (body === undefined || context.elementSupertypes.size === 0) return [];
	const refs = new Set<string>();
	collectSymbolRefs(body, refs);
	return [...refs].filter((ref) => context.elementSupertypes.has(ref));
}

function placeholderHiddenName(value: unknown, parentKind: string): string | undefined {
	if (isFieldPlaceholder(value)) return `_kw_${value.name}`;
	if (isVariantPlaceholder(value)) return polymorphVisibleName(parentKind, variantMintName(value));
	if (isAliasPlaceholder(value)) return `_${value.name}`;
	if (isRulePlaceholder(value)) return value.name;
	return undefined;
}

interface BaseArg {
	grammar?: {
		rules?: Record<string, RuleFn>;
		externals?: unknown;
		extras?: unknown;
		precedences?: unknown;
		supertypes?: unknown;
		inline?: unknown;
		conflicts?: unknown;
	};
	rules?: Record<string, RuleFn>;
	externals?: unknown;
	extras?: unknown;
	precedences?: unknown;
	supertypes?: unknown;
	inline?: unknown;
	conflicts?: unknown;
}

export function symbolNamesOf(entries: unknown): Set<string> {
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

function overriddenList(baseValue: unknown, own: unknown): unknown {
	const previous = withStringGlobalShim(() =>
		typeof baseValue === 'function'
			? (baseValue as (dollar: unknown, previous: unknown) => unknown)(makeSimpleDollarProxy(), [])
			: baseValue
	);
	return typeof own === 'function'
		? withStringGlobalShim(() =>
				(own as (dollar: unknown, previous: unknown) => unknown)(makeSimpleDollarProxy(), previous ?? [])
			)
		: (own ?? previous);
}

function baseListOf(base: BaseArg | undefined, key: 'extras' | 'supertypes' | 'precedences'): unknown {
	return overriddenList(base?.grammar?.[key] ?? base?.[key], undefined);
}

function extraRuleNamesOf(lists: WireLists, base: BaseArg | undefined): ReadonlySet<string> {
	const supertypes = symbolNamesOf(lists.supertypes);
	const rules = baseRulesOf<unknown>(base) ?? {};
	return extrasClosure(symbolNamesOf(lists.extras), supertypes, (name) => {
		if (!supertypes.has(name)) return undefined;
		const body = rules[name];
		const rule = (
			typeof body === 'function'
				? withStringGlobalShim(() => (body as (dollar: unknown, original: unknown) => unknown)(makeSimpleDollarProxy(), undefined))
				: body
		) as { type?: unknown; members?: unknown } | undefined;
		return rule?.type === 'CHOICE' ? symbolNamesOf(rule.members) : undefined;
	});
}

export function upstreamSymbolNames(base: unknown): ReadonlySet<string> {
	const arg = base as BaseArg | undefined;
	return new Set([...Object.keys(baseRulesOf<unknown>(arg) ?? {}), ...baseExternalNames(arg)]);
}

export function upstreamConflictSets(base: unknown): string[][] {
	const arg = base as BaseArg | undefined;
	const conflicts = arg?.grammar?.conflicts ?? arg?.conflicts;
	return (Array.isArray(conflicts) ? conflicts : []).map((set) => [...symbolNamesOf(set)]);
}

function baseExternalNames(base: BaseArg | undefined): ReadonlySet<string> {
	const externals = base?.grammar?.externals ?? base?.externals;
	return symbolNamesOf(
		typeof externals === 'function'
			? withStringGlobalShim(() => (externals as (dollar: unknown) => unknown)(makeSimpleDollarProxy()))
			: externals
	);
}

function injectPlaceholderHiddenRules(
	rules: Record<string, RuleFn>,
	edits: EditsConfig,
	context: WireContext,
	externals: ReadonlySet<string>,
	known: ReadonlySet<string>
): void {
	const declared = new Set<string>();
	for (const [kind, entry] of Object.entries(edits)) {
		if (!entry) continue;
		for (const patchMap of patchSetsOf(entry)) {
			for (const value of Object.values(patchMap)) {
				if (!isRulePlaceholder(value) || declared.has(value.name)) continue;
				if (known.has(value.name) || value.name in rules || externals.has(value.name)) {
					throw new Error(`rule('${value.name}'): '${value.name}' is already a rule of this grammar`);
				}
				declared.add(value.name);
			}
			const parents = [kind, ...elementSupertypesOf(kind, context)];
			const mints = Object.values(patchMap).flatMap((value) =>
				(isVariantPlaceholder(value) ? parents : [kind]).map((parent) => ({ value, hiddenName: placeholderHiddenName(value, parent) }))
			);
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
		const prevDollar = context.currentDollar;
		currentContext = context;
		context.currentRuleKind = name;
		context.currentDollar = $;
		try {
			return withDirectVariants(fn($, previous));
		} finally {
			context.currentRuleKind = prevKind;
			context.currentDollar = prevDollar;
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

function wrapInlineCallback(userInline: DollarFn<unknown[]> | undefined, context: WireContext): DollarFn<unknown[]> {
	return buildWiredInlineFn(userInline, context);
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

const passthroughBaseRuleFn: SittirRuleFn = function passthroughBaseRuleFn(_$, previous) {
	const name = currentContext?.currentRuleKind;
	return (name === null || name === undefined ? undefined : currentContext?.liftBodies.get(name)) ?? previous;
};

interface WirePatternCandidate {
	readonly name: string;
	readonly body: RuntimeRule;
	readonly aliasAs?: string;
}

export interface DeclaredPattern {
	readonly key: string;
	readonly body: RuntimeRule;
}

export interface EvaluatedConfig {
	readonly patterns: readonly DeclaredPattern[];
	readonly renderAs: Readonly<Record<string, unknown>> | undefined;
	readonly visibleExternals: Readonly<Record<string, unknown>> | undefined;
}

export function evaluatedConfig(cfg: Pick<WireConfig<any>, 'groups' | 'renderAs' | 'visibleExternals'>): EvaluatedConfig {
	const bodies = (config: RenderAsConfig | VisibleExternalsConfig | undefined): Readonly<Record<string, unknown>> | undefined =>
		config === undefined ? undefined : (withStringGlobalShim(() => config(layerSymbols())) ?? undefined);
	return { patterns: declaredPatterns(cfg.groups), renderAs: bodies(cfg.renderAs), visibleExternals: bodies(cfg.visibleExternals) };
}

function declaredPatterns(groups: GroupsConfig | undefined): DeclaredPattern[] {
	const declared: [key: string, value: RuleFn][] = [];
	for (const [key, value] of Object.entries(groups ?? {})) {
		if (value === undefined) continue;
		if (key.startsWith('_')) {
			throw new Error(
				`groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); write a hidden pattern as a rule under rules: instead`
			);
		}
		declared.push([key, value]);
	}
	const $ = declared.length === 0 ? undefined : layerSymbols();
	return declared.map(([key, value]) => {
		let body: RuntimeRule;
		try {
			const result = value.call(undefined, $, undefined);
			if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') {
				throw new Error(`groups['${key}']: body fn did not return a rule object`);
			}
			body = result as RuntimeRule;
		} catch (e) {
			throw new Error(`groups['${key}']: failed to evaluate body fn: ${(e as Error).message}`);
		}
		if (!isComplexBody(body)) {
			throw new Error(
				`groups['${key}']: body is not a complex structural pattern (need SEQ ≥2, CHOICE ≥2, or REPEAT with non-trivial content)`
			);
		}
		return { key, body };
	});
}

export function makeSimpleDollarProxy(): Record<string, RuntimeRule> {
	return new Proxy({} as Record<string, RuntimeRule>, {
		get(_target, name: string): RuntimeRule {
			const symbol = { type: 'SYMBOL', name };
			return symbol;
		}
	});
}

function replaceInBodyRt(rule: unknown, candidates: readonly WirePatternCandidate[], automatic: () => AutomaticVariants): unknown {
	if (!rule || typeof rule !== 'object') return rule;
	const r = rule as { type: string; members?: unknown[]; content?: unknown };
	for (const c of candidates) {
		if (rulesEqual(rule as RuntimeRule, c.body as RuntimeRule)) {
			const site =
				c.aliasAs === undefined
					? { type: 'SYMBOL', name: c.name }
					: aliasOf(c.name, c.aliasAs);
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
		t === 'RESERVED' ||
		t === 'TOKEN'
	) {
		const newContent = replaceInBodyRt(r.content, candidates, automatic);
		return newContent !== r.content ? { ...r, content: newContent } : rule;
	}
	return rule;
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
	const r = rule as { type: string; members?: unknown[]; content?: { readonly type?: string }; name?: string };
	const t = r.type;
	if (t === 'ALIAS' && r.content?.type === 'SYMBOL') return rule;
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
		t === 'RESERVED' ||
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

function withEnrichedWhitespace(
	declared: Readonly<Record<string, unknown>> | undefined,
	base: unknown
): {
	readonly visibleExternals: Readonly<Record<string, unknown>> | undefined;
	readonly whitespaceCollisions: readonly WhitespaceCollision[];
} {
	const { bodies, collisions } = getEnrichWhitespace(base);
	const whitespaceCollisions = [
		...collisions,
		...Object.keys(declared ?? {})
			.filter((name) => Object.hasOwn(bodies, name))
			.map((name) => ({ name, site: 'visibleExternals' as const }))
	];
	if (Object.keys(bodies).length === 0) return { visibleExternals: declared, whitespaceCollisions };
	return { visibleExternals: { ...declared, ...bodies }, whitespaceCollisions };
}

function applyWireVisibleExternalsRewrite(
	rules: Record<string, RuleFn>,
	visibleExternals: Readonly<Record<string, unknown>> | undefined
): void {
	const hiddenToVisible = new Map(Object.keys(visibleExternals ?? {}).map((hiddenName) => [hiddenName, hiddenName.replace(/^_+/, '')]));
	if (hiddenToVisible.size === 0) return;
	for (const [name, fn] of Object.entries(rules)) {
		rules[name] = buildVisibleExternalsRewritingFn(fn, hiddenToVisible);
	}
}

export function unmatchedGroupPatterns(
	rules: Readonly<Record<string, { readonly type: string }>>,
	baseRules: Readonly<Record<string, unknown>>,
	context: Pick<WireContext, 'authoredRuleNames' | 'groups'>
): string[] {
	const complex = (name: string): boolean => Object.hasOwn(rules, name) && isComplexBody(rules[name]!);
	const groups = Object.keys(context.groups ?? {}).map(declaredGroupMintName).filter(complex);
	if (groups.length === 0) return [];
	const patterns = new Set([...[...context.authoredRuleNames].filter((name) => name.startsWith('_') && !Object.hasOwn(baseRules, name) && complex(name)), ...groups]);
	const held = new Set<string>();
	for (const [name, body] of Object.entries(rules)) if (!patterns.has(name)) symbolNames(body, held);
	return groups.filter((name) => !held.has(name));
}

function declaredBody(body: RuntimeRule): RuleFn {
	return function declaredBodyFn($) {
		for (const name of symbolNames(body)) {
			const symbol: unknown = ($ as Readonly<Record<string, unknown>>)[name];
			if (symbol instanceof ReferenceError) throw symbol;
		}
		return body;
	};
}

export function applyWirePatternReplacement(
	rules: Record<string, RuleFn>,
	authoredRuleNames: ReadonlySet<string>,
	patterns: readonly DeclaredPattern[],
	context: WireContext
): void {
	const declared: WirePatternCandidate[] = [];
	for (const { key, body } of patterns) {
		const hiddenName = declaredGroupMintName(key);
		declared.push({ name: hiddenName, body, aliasAs: key });
		rules[hiddenName] = stampHoistedFn(wrapOneRuleFn(hiddenName, declaredBody(body), context));
	}

	const originals = new Map(Object.entries(rules));
	const authored = [...authoredRuleNames].filter((name) => originals.has(name));
	const evaluationOrder = [...authored.filter((name) => name.startsWith('_')), ...authored.filter((name) => !name.startsWith('_'))];
	const declaredNames = new Set(declared.map((c) => c.name));
	const bodies = new Map<string, unknown>();
	let folding:
		| { readonly names: ReadonlySet<string>; readonly candidates: readonly WirePatternCandidate[] }
		| undefined;
	const fold = (runtime$: Parameters<RuleFn>[0]): NonNullable<typeof folding> => {
		if (folding === undefined) {
			const detected: WirePatternCandidate[] = [];
			for (const name of evaluationOrder) {
				const body = originals.get(name)!(runtime$, context.baseRuleBodies[name]);
				bodies.set(name, body);
				if (name.startsWith('_') && !declaredNames.has(name) && isComplexBody(body as RuntimeRule)) detected.push({ name, body: body as RuntimeRule });
			}
			const all = [...detected, ...declared];
			const aliasOnly = onlyAliasedSymbols([...bodies.values(), ...declared.map((c) => c.body)]);
			folding = {
				names: new Set(all.map((c) => c.name)),
				candidates: all.filter((c) => c.aliasAs !== undefined || !aliasOnly.has(c.name))
			};
		}
		return folding;
	};
	for (const [name, fn] of originals) {
		if (declaredNames.has(name)) continue;
		rules[name] = function patternReplacingRuleFn($, previous) {
			const { names, candidates } = fold($);
			const body = bodies.has(name) ? bodies.get(name) : fn($, previous);
			return names.has(name) ? body : replaceInBodyRt(body, candidates, () => context.automaticVariants);
		};
	}
}
