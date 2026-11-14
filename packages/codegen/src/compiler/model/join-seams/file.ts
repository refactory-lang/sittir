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
	readonly state: number;
	readonly previous: string;
	readonly next: string;
	readonly reason?: string;
}

export interface JoinSeamFacts {
	readonly seams: readonly JoinSeamRecord[];
	readonly pairs: readonly JoinPairRecord[];
	readonly joinsNextKinds: readonly string[];
	readonly blocked: readonly BlockedJoinCheck[];
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
		blocked: sortedBy(facts.blocked, (check) => JSON.stringify(check))
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
		const stale = STAMP_PARTS.filter(([, part]) => part(saved) !== part(stamp)).map(([name]) => name);
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
