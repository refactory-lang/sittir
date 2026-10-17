import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { EvaluatedGrammar } from '../compiler/types.ts';
import { baseNamesOf } from '../dsl/bind.ts';
import { layerPath, type GrammarPackage } from '../grammars.ts';
import type { UpstreamContext } from './derive-conflicts.ts';
import { treeSitterPruned, type TreeSitterGrammarDoc } from './prune-grammar-json.ts';
import { treeSitterCliVersion } from './tree-sitter-cli.ts';

export interface GrammarDerivationInputs extends UpstreamContext {
	readonly grammarHash: string;
	readonly ruleCount: number;
}

export interface DerivationInputs {
	readonly base: GrammarDerivationInputs;
	readonly bound: GrammarDerivationInputs;
}

export const DERIVATION_INPUTS_MARKER = '\u0000sittir-derivation-inputs\u0000';

export function canonical(value: unknown): unknown {
	if (value instanceof Map) return [...value].map(([key, entry]) => [canonicalElement(key), canonicalElement(entry)]).sort(byJson);
	if (value instanceof Set) return [...value].map(canonicalElement).sort(byJson);
	if (Array.isArray(value)) return value.map(canonicalElement);
	if (typeof value === 'function' || typeof value === 'bigint') return unprintable(`a ${typeof value}`);
	if (typeof value === 'number' && !Number.isFinite(value)) return unprintable(String(value));
	if (value && typeof value === 'object') {
		const prototype: unknown = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null)
			return unprintable(`a ${(value as { constructor?: { name?: string } }).constructor?.name ?? 'non-plain'} object`);
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonical((value as Record<string, unknown>)[key])])
		);
	}
	return value;
}

function canonicalElement(value: unknown): unknown {
	return value === undefined ? unprintable('an undefined element') : canonical(value);
}

function unprintable(what: string): never {
	throw new Error(`canonical: ${what} has no canonical JSON form`);
}

function byJson(left: unknown, right: unknown): number {
	const a = JSON.stringify(left);
	const b = JSON.stringify(right);
	return a < b ? -1 : a > b ? 1 : 0;
}

export function grammarHash<G extends TreeSitterGrammarDoc>(evaluated: G, treeSitterVersion: string): string {
	const grammar = { ...treeSitterPruned(evaluated).grammar, conflicts: undefined, derivationRecords: undefined };
	return createHash('sha256').update(JSON.stringify(canonical({ grammar, treeSitterVersion }))).digest('hex');
}

export function derivationInputsOf(evaluated: EvaluatedGrammar): GrammarDerivationInputs {
	const records = evaluated.derivationRecords;
	if (records === undefined) throw new Error('evaluated grammar carries no derivation records: no layer pass built it');
	return {
		grammarHash: grammarHash(evaluated, treeSitterCliVersion()),
		ruleCount: Object.keys(evaluated.rules).length,
		upstreamConflicts: records.upstreamConflicts,
		sourceEdges: records.sourceEdges,
		baseNames: baseNamesOf(evaluated.renamedFrom, evaluated.splitFrom)
	};
}

const requireFromHere = createRequire(import.meta.url);

export function evaluateForDerivation(pkg: Pick<GrammarPackage, 'dir'>): DerivationInputs {
	const layers = [layerPath(pkg, 'sittir'), layerPath(pkg, 'top')];
	const child = spawnSync(
		process.execPath,
		['--import', pathToFileURL(requireFromHere.resolve('tsx')).href, fileURLToPath(new URL('./evaluate-for-derivation.child.ts', import.meta.url)), ...layers],
		{ encoding: 'utf8', maxBuffer: 1 << 28 }
	);
	if (child.error) throw child.error;
	const at = child.stdout.lastIndexOf(DERIVATION_INPUTS_MARKER);
	if (child.status !== 0 || at < 0) {
		throw new Error(`evaluating ${layers.join(' and ')} for conflict derivation failed (exit ${child.status}):\n${child.stderr}`);
	}
	return JSON.parse(child.stdout.slice(at + DERIVATION_INPUTS_MARKER.length)) as DerivationInputs;
}
