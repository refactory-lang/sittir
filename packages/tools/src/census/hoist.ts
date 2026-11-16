import { buildNodeMap, invoke } from '../codegen-surface.ts';

export interface HoistCensusRow {
	readonly chain: readonly string[];
	readonly holders: readonly string[];
}

export interface HoistCensus {
	readonly grammar: string;
	readonly slots: number;
	readonly rows: readonly HoistCensusRow[];
}

export async function hoistCensus(grammar: string): Promise<HoistCensus> {
	const nodeMap = await buildNodeMap(grammar);
	const chains = await invoke('wrapperChain', 'wrapperChainsOf', nodeMap);
	const byChain = new Map<string, { chain: readonly string[]; holders: string[] }>();
	for (const { holder, accessor, wrappers } of chains) {
		const key = wrappers.join(' > ');
		const row = byChain.get(key) ?? { chain: wrappers, holders: [] };
		row.holders.push(`${holder}.${accessor}`);
		byChain.set(key, row);
	}
	const rows = [...byChain.values()].map((row) => ({ chain: row.chain, holders: row.holders.sort() })).sort((a, b) => b.holders.length - a.holders.length || a.chain.join().localeCompare(b.chain.join()));
	return { grammar, slots: chains.length, rows };
}

export function formatHoistCensus(census: HoistCensus): string {
	const head = `${census.grammar}: ${census.slots} holder slots through ${new Set(census.rows.map((row) => row.chain[0])).size} outermost wrappers`;
	return [head, ...census.rows.map((row) => `${row.holders.length}\t${row.chain.join(' > ')}\t${row.holders.join(', ')}`)].join('\n') + '\n';
}

export interface HoistCensusOptions {
	readonly grammar: string;
}

export async function run(opts: HoistCensusOptions): Promise<number> {
	process.stdout.write(formatHoistCensus(await hoistCensus(opts.grammar)));
	return 0;
}
