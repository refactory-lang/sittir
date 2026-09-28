import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { packageEntryPath } from '../compiler/resolve-grammar.ts';
import type { EvaluatedGrammar } from '../compiler/types.ts';
import type { GrammarPackage } from '../grammars.ts';
import type { UpstreamContext } from './derive-conflicts.ts';

export interface DerivationInputs extends UpstreamContext {
	readonly grammarHash: string;
	readonly ruleCount: number;
}

export const DERIVATION_INPUTS_MARKER = '\u0000sittir-derivation-inputs\u0000';

function canonical(value: unknown): unknown {
	if (value instanceof Map) return [...value].map(([key, entry]) => [canonical(key), canonical(entry)]).sort(byJson);
	if (value instanceof Set) return [...value].map(canonical).sort(byJson);
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonical((value as Record<string, unknown>)[key])])
		);
	}
	return value;
}

function byJson(left: unknown, right: unknown): number {
	const a = JSON.stringify(left);
	const b = JSON.stringify(right);
	return a < b ? -1 : a > b ? 1 : 0;
}

export function grammarHash(evaluated: object): string {
	const grammar = { ...evaluated, conflicts: undefined, derivationRecords: undefined };
	return createHash('sha256').update(JSON.stringify(canonical(grammar))).digest('hex');
}

export function derivationInputsOf(evaluated: EvaluatedGrammar): DerivationInputs {
	const records = evaluated.derivationRecords;
	if (records === undefined) throw new Error('evaluated grammar carries no derivation records: it was not built by sittirGrammar');
	return {
		grammarHash: grammarHash(evaluated),
		ruleCount: Object.keys(evaluated.rules).length,
		upstreamConflicts: records.upstreamConflicts,
		sourceEdges: records.sourceEdges
	};
}

const requireFromHere = createRequire(import.meta.url);

export function evaluateForDerivation(pkg: Pick<GrammarPackage, 'dir'>): DerivationInputs {
	const child = spawnSync(
		process.execPath,
		[
			'--import',
			pathToFileURL(requireFromHere.resolve('tsx')).href,
			fileURLToPath(new URL('./evaluate-for-derivation.child.ts', import.meta.url)),
			packageEntryPath(pkg)
		],
		{ encoding: 'utf8', maxBuffer: 1 << 28 }
	);
	if (child.error) throw child.error;
	const at = child.stdout.lastIndexOf(DERIVATION_INPUTS_MARKER);
	if (child.status !== 0 || at < 0) {
		throw new Error(`evaluating ${packageEntryPath(pkg)} for conflict derivation failed (exit ${child.status}):\n${child.stderr}`);
	}
	return JSON.parse(child.stdout.slice(at + DERIVATION_INPUTS_MARKER.length)) as DerivationInputs;
}
