import { RuleWalker } from '../rule-walker.ts';
import type { AnyRule } from '../../types/rule.ts';
import type { GrammarResult } from '../enrich.ts';
import { upstreamConflictSets, upstreamSymbolNames, type WiredOpts } from './wire.ts';
import type { ConflictResolutionRecord } from '../conflict-resolutions.ts';

type WiredGrammar = GrammarResult['grammar'];

export const DERIVATION_RECORDS_KEY = '__derivationRecords__' as const;

export interface DerivationRecords {
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly sourceEdges: Readonly<Record<string, string>>;
	readonly resolutions: readonly ConflictResolutionRecord[];
	readonly conflictsAuthored: boolean;
}

export interface ConflictConfig {
	readonly resolutions: readonly ConflictResolutionRecord[];
	readonly conflictsAuthored: boolean;
}

function variantEdgesOf(rules: Readonly<Record<string, AnyRule>>): Map<string, string> {
	const walker = new RuleWalker(rules);
	const edges = new Map<string, string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, edges, (acc, node) => {
			if (node.type === 'SYMBOL' && typeof node.annotations?.variantOf === 'string') acc.set(node.name, node.annotations.variantOf);
			return acc;
		});
	}
	return edges;
}

export function attachDerivationRecords(grammar: WiredGrammar, base: unknown, opts: WiredOpts, conflicts: ConflictConfig): void {
	const upstreamSymbols = upstreamSymbolNames(base);
	const edges = new Map<string, string>();
	for (const [oldName, newName] of opts.__wireContext__?.symbolRenames ?? []) {
		if (oldName !== newName && !upstreamSymbols.has(newName)) edges.set(newName, oldName);
	}
	for (const [name, owner] of variantEdgesOf(grammar.rules)) {
		if (name !== owner && !upstreamSymbols.has(name)) edges.set(name, owner);
	}
	const records: DerivationRecords = {
		upstreamConflicts: upstreamConflictSets(base),
		sourceEdges: Object.fromEntries(edges),
		...conflicts
	};
	Object.defineProperty(grammar, DERIVATION_RECORDS_KEY, { value: records, enumerable: false, writable: false, configurable: true });
}

export function getDerivationRecords(grammar: unknown): DerivationRecords | undefined {
	if (!grammar || typeof grammar !== 'object') return undefined;
	return (grammar as Record<string, unknown>)[DERIVATION_RECORDS_KEY] as DerivationRecords | undefined;
}
