import { buildNodeMap, invoke, load } from '../codegen-surface.ts';
import { loadCorpusEntries, loadLanguageForGrammar, type TSNode, type TSTree } from '../validate/common.ts';

export interface TextKindOverlap {
	readonly winner: string;
	readonly loser: string;
	readonly slots: readonly string[];
	readonly shadowed: readonly string[];
	readonly sampled: boolean;
}

export interface TextKindOverlapCensus {
	readonly grammar: string;
	readonly overlaps: readonly TextKindOverlap[];
}

async function corpusTextsByKind(grammar: string): Promise<Map<string, Set<string>>> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const texts = new Map<string, Set<string>>();
	const walk = (node: TSNode): void => {
		if (node.childCount === 0 || node.isNamed) {
			let bucket = texts.get(node.type);
			if (bucket === undefined) texts.set(node.type, (bucket = new Set()));
			bucket.add(node.text);
		}
		for (const child of node.children) walk(child);
	};
	for (const entry of loadCorpusEntries(grammar)) {
		const tree = parser.parse(entry.source) as TSTree;
		if (!tree.rootNode.hasError) walk(tree.rootNode);
	}
	return texts;
}

export async function textKindOverlapCensus(grammar: string): Promise<TextKindOverlapCensus> {
	const nodeMap = await buildNodeMap(grammar);
	const tables = await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar);
	if (tables === undefined) throw new Error(`text-kind-overlap: no generated id tables for grammar '${grammar}'; run gen first`);
	const { collectKindEntries, collectCatalogKinds } = await load('kindDiscriminant');
	const { leafTextChecks, slotResolverKinds, textCheckAccepts } = await load('from');
	const kindEntries = collectKindEntries(collectCatalogKinds(tables), nodeMap, tables);
	const checks = leafTextChecks(nodeMap, kindEntries);
	const corpus = await corpusTextsByKind(grammar);

	const byPair = new Map<string, { winner: string; loser: string; slots: Set<string>; shadowed: string[]; sampled: boolean }>();
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			const { leafKinds, branchKinds } = slotResolverKinds(slot, nodeMap);
			const admitted = new Set([...leafKinds, ...branchKinds]);
			const candidates = checks.filter((check) => admitted.has(check.kind));
			for (let i = 0; i < candidates.length; i++) {
				for (let j = i + 1; j < candidates.length; j++) {
					const winner = candidates[i]!;
					const loser = candidates[j]!;
					const key = `${winner.kind}\u0000${loser.kind}`;
					let pair = byPair.get(key);
					if (pair === undefined) {
						const samples = loser.values ?? [...(corpus.get(loser.kind) ?? [])];
						const shadowed = samples.filter((text) => textCheckAccepts(winner, text)).sort();
						pair = { winner: winner.kind, loser: loser.kind, slots: new Set(), shadowed, sampled: samples.length > 0 };
						byPair.set(key, pair);
					}
					pair.slots.add(`${node.kind}.${slot.name}`);
				}
			}
		}
	}
	const overlaps = [...byPair.values()]
		.filter((pair) => pair.shadowed.length > 0 || !pair.sampled)
		.map((pair) => ({ ...pair, slots: [...pair.slots].sort() }))
		.sort((a, b) => a.winner.localeCompare(b.winner) || a.loser.localeCompare(b.loser));
	return { grammar, overlaps };
}

export function formatTextKindOverlapCensus(census: TextKindOverlapCensus): string {
	const shadowing = census.overlaps.filter((o) => o.shadowed.length > 0);
	const unsampled = census.overlaps.filter((o) => !o.sampled);
	const lines = [`# ${census.grammar}: ${shadowing.length} shadowing pairs, ${unsampled.length} unsampled pairs`];
	for (const o of shadowing) {
		const shown = o.shadowed.slice(0, 8).map((text) => JSON.stringify(text)).join(', ');
		const more = o.shadowed.length > 8 ? ` (+${o.shadowed.length - 8})` : '';
		lines.push(`  SHADOWS\t${o.winner} > ${o.loser}\t${o.shadowed.length} texts: ${shown}${more}\tslots: ${o.slots.join(', ')}`);
	}
	for (const o of unsampled) lines.push(`  UNSAMPLED\t${o.winner} > ${o.loser}\tslots: ${o.slots.join(', ')}`);
	return lines.join('\n') + '\n';
}

export interface TextKindOverlapOptions {
	readonly grammar: string;
}

export async function run(opts: TextKindOverlapOptions): Promise<number> {
	process.stdout.write(formatTextKindOverlapCensus(await textKindOverlapCensus(opts.grammar)));
	return 0;
}
