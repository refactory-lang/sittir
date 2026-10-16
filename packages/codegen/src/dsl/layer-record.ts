import type { EvaluatedGrammar } from '../compiler/types.ts';
import type { GrammarJson } from '../grammar-shapes/grammar-json.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import type { ConflictResolutionsInput } from './conflict-resolutions.ts';
import type { EnrichSidecars } from './enrich.ts';
import { isRecord } from './rule-patterns.ts';
import type { Effect, Provenance } from './verbs/effects.ts';
import type { DerivationRecords } from './wire/derivation-records.ts';
import type { LiftName } from './wire/lift-names.ts';

export type LayerRecords = Pick<
	EvaluatedGrammar,
	| 'options'
	| 'groups'
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
	| 'stages'
	| 'protectedRuleNames'
	| 'whitespaceCollisions'
	| 'bodyPatternZeroMatches'
>;

export interface LayerRecord {
	readonly depth: number;
	readonly upstream: GrammarJson;
	readonly sidecars: EnrichSidecars;
	readonly resolutions: ConflictResolutionsInput;
	readonly deadMints: ReadonlySet<string>;
	readonly textTokens: readonly string[];
	readonly liftNames: ReadonlyMap<string, LiftName>;
	readonly effects: readonly Effect[];
	readonly records: LayerRecords;
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
