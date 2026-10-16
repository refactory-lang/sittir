import type { EvaluatedGrammar } from '../compiler/types.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { AutomaticVariants } from './automatic-variants.ts';
import type { ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { GrammarResult } from './enrich.ts';
import { isRecord } from './rule-patterns.ts';
import type { Effect, Provenance } from './verbs/effects.ts';
import type { DerivationRecords } from './wire/derivation-records.ts';
import type { LiftName } from './wire/lift-names.ts';
import type { PatchSite } from './wire/wire.ts';

export type LayerRecords = Pick<
	EvaluatedGrammar,
	| 'options'
	| 'renderAs'
	| 'visibleExternals'
	| 'reparseHosts'
	| 'refineForms'
	| 'ruleCauses'
	| 'undeclaredRules'
	| 'patchSites'
	| 'externalRoles'
	| 'expectDiagnostics'
	| 'expectTestFailures'
	| 'protectedRuleNames'
	| 'whitespaceCollisions'
	| 'bodyPatternZeroMatches'
>;

export interface SynthesizedRules {
	readonly after: number;
	readonly names: readonly string[];
}

export interface StageBases {
	readonly name: string;
	readonly raw: GrammarResult;
	readonly enriched: GrammarResult;
	readonly inherited: LayerRecord | undefined;
}

export interface LayerRecord {
	readonly depth: number;
	readonly upstream: GrammarJson;
	readonly enrichment: GrammarResult;
	readonly resolutions: ConflictResolutionsInput;
	readonly deadMints: ReadonlySet<string>;
	readonly textTokens: readonly string[];
	readonly liftNames: ReadonlyMap<string, LiftName>;
	readonly effects: readonly Effect[];
	readonly records: LayerRecords;
	readonly synthesized: readonly SynthesizedRules[];
	readonly automaticVariants: AutomaticVariants;
	readonly stageBases: StageBases | undefined;
	readonly projections: Provenance | undefined;
	readonly derivationRecords: DerivationRecords;
	readonly diagnostics: readonly GrammarDiagnostic[];
}

export const LAYER_RECORD_KEY: unique symbol = Symbol.for('sittir.layerRecord');

export function layerRecordOf(result: unknown): LayerRecord | undefined {
	const grammar = isRecord(result) ? result.grammar : undefined;
	const rules = isRecord(grammar) ? grammar.rules : undefined;
	const start: unknown = isRecord(rules) ? Object.values(rules)[0] : undefined;
	return isRecord(start) ? (Reflect.get(start, LAYER_RECORD_KEY) as LayerRecord | undefined) : undefined;
}

export function withLayerRecord<R extends object>(body: R, record: LayerRecord): R {
	return Object.defineProperty({ ...body }, LAYER_RECORD_KEY, { value: record, enumerable: false });
}

type RecordMerge<K extends keyof LayerRecords> = (inherited: LayerRecords[K], own: LayerRecords[K]) => LayerRecords[K];

function mergedEntries<T extends object>(inherited: T | undefined, own: T | undefined): T | undefined {
	return inherited === undefined && own === undefined ? undefined : { ...inherited, ...own } as T;
}

function mergedMap<K, V>(inherited: ReadonlyMap<K, V> | undefined, own: ReadonlyMap<K, V> | undefined): Map<K, V> | undefined {
	return inherited === undefined && own === undefined ? undefined : new Map([...(inherited ?? []), ...(own ?? [])]);
}

function namesOf(inherited: readonly string[] | undefined, own: readonly string[] | undefined): string[] {
	return [...new Set([...(inherited ?? []), ...(own ?? [])])];
}

function mergedPatchSites(inherited: readonly PatchSite[] | undefined, own: readonly PatchSite[] | undefined): readonly PatchSite[] | undefined {
	if (inherited === undefined && own === undefined) return undefined;
	return [...new Map([...(inherited ?? []), ...(own ?? [])].map((site) => [`${site.ownerKind}:${site.path}`, site])).values()];
}

const RECORD_MERGES: { readonly [K in keyof LayerRecords]-?: RecordMerge<K> } = {
	options: mergedEntries,
	renderAs: mergedEntries,
	visibleExternals: mergedEntries,
	reparseHosts: (inherited, own) => own ?? inherited,
	refineForms: mergedMap,
	ruleCauses: mergedEntries,
	undeclaredRules: (inherited, own) => (inherited === undefined && own === undefined ? undefined : namesOf(inherited, own)),
	patchSites: mergedPatchSites,
	externalRoles: mergedMap,
	expectDiagnostics: mergedEntries,
	expectTestFailures: mergedEntries,
	protectedRuleNames: namesOf,
	whitespaceCollisions: (inherited, own) => own ?? inherited,
	bodyPatternZeroMatches: (inherited, own) => {
		const names = [...(inherited ?? []), ...(own ?? [])];
		return names.length === 0 ? undefined : names;
	}
};

export function mergedRecords(inherited: LayerRecords | undefined, own: LayerRecords): LayerRecords {
	const merges = RECORD_MERGES as Readonly<Record<keyof LayerRecords, (inherited: unknown, own: unknown) => unknown>>;
	return Object.fromEntries(
		(Object.keys(merges) as (keyof LayerRecords)[]).flatMap((key) => {
			const value = merges[key](inherited?.[key], own[key]);
			return value === undefined ? [] : [[key, value]];
		})
	) as LayerRecords;
}

export function synthesizedOf(after: number, own: LayerRecords): readonly SynthesizedRules[] {
	const names = Object.keys({ ...own.renderAs, ...own.visibleExternals });
	return names.length === 0 ? [] : [{ after, names }];
}
