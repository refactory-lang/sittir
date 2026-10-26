import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createEngine } from '@sittir/common';
import { languageByName } from '../languages.ts';
import { loadSlotAccessorOf, wrappedNodesOf, type TypedNode } from '../validate/common.ts';

export interface TriviaTimingOptions {
	readonly grammar: string;
	readonly file: string;
	readonly rounds: number;
	readonly json: boolean;
}

export interface TriviaTiming {
	readonly grammar: string;
	readonly file: string;
	readonly bytes: number;
	readonly nodes: number;
	readonly bestMs: number;
	readonly usPerNode: number;
}

interface ReadNode extends TypedNode {
	readonly $trivia?: { readonly leading?: () => unknown };
}

export async function measureTriviaTiming(options: Omit<TriviaTimingOptions, 'json'>): Promise<TriviaTiming> {
	if (!Number.isSafeInteger(options.rounds) || options.rounds < 1) {
		throw new Error(`trivia-timing: rounds must be a positive integer, not ${String(options.rounds)}`);
	}
	const engine = await createEngine(await languageByName(options.grammar));
	const accessorOf = await loadSlotAccessorOf(options.grammar);
	const source = readFileSync(resolve(options.file), 'utf8');
	let bestMs = Infinity;
	let nodes = 0;
	for (let round = 0; round < options.rounds; round++) {
		const read: readonly ReadNode[] = wrappedNodesOf(engine.parse(source, { depth: Infinity }), accessorOf);
		const start = performance.now();
		for (const node of read) node.$trivia?.leading?.();
		bestMs = Math.min(bestMs, performance.now() - start);
		nodes = read.length;
	}
	return {
		grammar: options.grammar,
		file: options.file,
		bytes: Buffer.byteLength(source),
		nodes,
		bestMs,
		usPerNode: nodes === 0 ? 0 : (bestMs * 1000) / nodes
	};
}

export async function run(options: TriviaTimingOptions): Promise<number> {
	const timing = await measureTriviaTiming(options);
	if (options.json) {
		console.log(JSON.stringify(timing));
		return 0;
	}
	console.log(
		`${timing.grammar} ${timing.file} (${timing.bytes} bytes): ${timing.nodes} nodes; reading every node's leading trivia took ${timing.bestMs.toFixed(0)} ms, ${timing.usPerNode.toFixed(1)} us per node (best of ${options.rounds})`
	);
	return 0;
}
