import { readNodeModelFile } from '../validate/common.ts';

export interface HoistedCensus {
	readonly hoisted: string[];
	readonly seated: string[];
	readonly unseated: string[];
}

interface CensusValue {
	readonly seat?: { readonly kind: string };
}

interface CensusSlot {
	readonly values?: readonly CensusValue[];
}

interface CensusNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly annotations?: { readonly hoisted?: true };
	readonly slots?: readonly CensusSlot[];
	readonly elementSeats?: readonly { readonly kind: string }[];
}

export interface CensusModel {
	readonly nodes: readonly CensusNode[] | Record<string, CensusNode>;
}

export function hoistedCensus(model: CensusModel): HoistedCensus {
	const nodes = Array.isArray(model.nodes) ? model.nodes : Object.values(model.nodes);
	const hoisted = nodes
		.filter((n) => n.annotations?.hoisted === true && n.modelType !== 'list')
		.map((n) => n.kind)
		.sort();
	const seatedSet = new Set<string>();
	for (const n of nodes) {
		for (const s of n.slots ?? []) {
			for (const v of s.values ?? []) if (v.seat !== undefined) seatedSet.add(v.seat.kind);
		}
		for (const seat of n.elementSeats ?? []) seatedSet.add(seat.kind);
	}
	return {
		hoisted,
		seated: hoisted.filter((k) => seatedSet.has(k)),
		unseated: hoisted.filter((k) => !seatedSet.has(k))
	};
}

export interface HoistedCensusOptions {
	readonly grammar: string;
}

export function formatHoistedCensus(grammar: string, census: HoistedCensus): string {
	const head = `${grammar}: hoisted=${census.hoisted.length} seated=${census.seated.length} unseated=${census.unseated.length}`;
	return [head, ...census.unseated.map((k) => `  ${k}`)].join('\n') + '\n';
}

export async function run(opts: HoistedCensusOptions): Promise<number> {
	const raw = readNodeModelFile(opts.grammar);
	if (raw === undefined) {
		process.stderr.write(`hoisted-census: no node-model.json5 for grammar '${opts.grammar}'\n`);
		return 1;
	}
	process.stdout.write(formatHoistedCensus(opts.grammar, hoistedCensus(JSON.parse(raw) as CensusModel)));
	return 0;
}
