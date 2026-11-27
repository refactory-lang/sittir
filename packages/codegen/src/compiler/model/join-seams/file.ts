import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { printRecordLines } from '../../../emitters/record-lines.ts';
import { compareOrdinal } from '../../../emitters/shared.ts';
import type { ParserRecord } from '../../../transpile/compile-parser.ts';

export const JOIN_SEAMS_FILE = 'join-seams.json';

export type JoinProof = 'proven' | 'unproven';

export interface JoinStamp {
	readonly parser: ParserRecord;
	readonly inputs: string;
}

export interface JoinSeamRecord {
	readonly seam: string;
	readonly previous?: JoinProof;
	readonly next?: JoinProof;
}

export interface JoinPairRecord {
	readonly pair: string;
	readonly proof: JoinProof;
}

export interface BlockedJoinCheck {
	readonly seam: string;
	readonly pair: string;
	readonly states: readonly number[];
	readonly reasons: readonly string[];
}

export type WitnessKind = 'built' | 'corpus';

export interface TightSeamRecord {
	readonly seam: string;
	readonly previous: string;
	readonly next: string;
	readonly witness: WitnessKind;
	readonly reason: string;
	readonly after?: string;
}

export interface SpacedWitness {
	readonly previous: string;
	readonly next: string;
	readonly verdict: 'same' | 'differs';
	readonly witness: WitnessKind;
	readonly after?: string;
}

export interface DisagreeingSeamRecord {
	readonly seam: string;
	readonly reason: 'disagree';
	readonly tight: Omit<TightSeamRecord, 'seam'>;
	readonly spaced: SpacedWitness;
}

export interface JoinSeamFacts {
	readonly seams: readonly JoinSeamRecord[];
	readonly pairs: readonly JoinPairRecord[];
	readonly joinsNextKinds: readonly string[];
	readonly blocked: readonly BlockedJoinCheck[];
	readonly tight: readonly TightSeamRecord[];
	readonly disagreeing: readonly DisagreeingSeamRecord[];
}

export interface JoinSeamsFile extends JoinStamp, JoinSeamFacts {}

export type SettledJoinSeams =
	| { readonly file: JoinSeamsFile; readonly derived: boolean }
	| { readonly stale: readonly string[] };

export interface UnprovenArms {
	readonly previous: readonly string[];
	readonly next: readonly string[];
	readonly pairs: readonly string[];
}

const STAMP_PARTS: readonly (readonly [string, (stamp: JoinStamp) => string])[] = [
	['parser sources', (stamp) => stamp.parser.source],
	['parser.wasm', (stamp) => stamp.parser.wasm],
	['join inputs', (stamp) => stamp.inputs]
];

function sortedBy<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
	return [...items].sort((a, b) => compareOrdinal(keyOf(a), keyOf(b)));
}

export function joinSeamsFileOf(stamp: JoinStamp, facts: JoinSeamFacts): JoinSeamsFile {
	return {
		parser: { source: stamp.parser.source, wasm: stamp.parser.wasm },
		inputs: stamp.inputs,
		seams: sortedBy(facts.seams, (record) => record.seam),
		pairs: sortedBy(facts.pairs, (record) => record.pair),
		joinsNextKinds: sortedBy(facts.joinsNextKinds, (kind) => kind),
		blocked: sortedBy(facts.blocked, (check) => JSON.stringify(check)),
		tight: sortedBy(facts.tight, (record) => `${record.seam}|${record.after ?? ''}`),
		disagreeing: sortedBy(facts.disagreeing, (record) => `${record.seam}|${record.tight.after ?? ''}`)
	};
}

export function printJoinSeams(file: JoinSeamsFile): string {
	return printRecordLines(file);
}

export function readJoinSeams(sittirDir: string): JoinSeamsFile | undefined {
	const path = join(sittirDir, JOIN_SEAMS_FILE);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as JoinSeamsFile) : undefined;
}

export function settleJoinSeams(
	saved: JoinSeamsFile | undefined,
	stamp: JoinStamp,
	rederive: boolean,
	derive: () => JoinSeamsFile
): SettledJoinSeams {
	if (saved !== undefined) {
		const stale = [
			...STAMP_PARTS.filter(([, part]) => part(saved) !== part(stamp)).map(([name]) => name),
			...(saved.tight === undefined || saved.disagreeing === undefined ? ['tight seams'] : [])
		];
		if (stale.length === 0) return { file: saved, derived: false };
		if (!rederive) return { stale };
	}
	return { file: derive(), derived: true };
}

export function unprovenArms(facts: Pick<JoinSeamFacts, 'seams' | 'pairs'>): UnprovenArms {
	return {
		previous: facts.seams.filter((record) => record.previous === 'unproven').map((record) => record.seam),
		next: facts.seams.filter((record) => record.next === 'unproven').map((record) => record.seam),
		pairs: facts.pairs.filter((record) => record.proof === 'unproven').map((record) => record.pair)
	};
}
