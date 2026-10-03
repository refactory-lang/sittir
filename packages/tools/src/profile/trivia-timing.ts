import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createEngine } from '@sittir/common';
import { languageByName } from '../languages.ts';

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

interface ReadNode {
	readonly $type?: unknown;
	readonly $trivia?: { readonly leading?: () => unknown };
	readonly [key: string]: unknown;
}

function slotReaderName(storageKey: string): string {
	return storageKey.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

function typedNodesOf(root: unknown): ReadNode[] {
	const seen = new Set<object>();
	const nodes: ReadNode[] = [];
	const walk = (value: unknown): void => {
		if (value === null || typeof value !== 'object' || seen.has(value)) return;
		if (Array.isArray(value)) {
			for (const entry of value) walk(entry);
			return;
		}
		seen.add(value);
		const node = value as ReadNode;
		if (typeof node.$type === 'number') nodes.push(node);
		for (const key of Object.keys(node)) {
			if (!key.startsWith('_') || node[key] == null) continue;
			const reader = node[slotReaderName(key)];
			walk(typeof reader === 'function' ? (reader as () => unknown).call(node) : node[key]);
		}
	};
	walk(root);
	return nodes;
}

export async function measureTriviaTiming(options: Omit<TriviaTimingOptions, 'json'>): Promise<TriviaTiming> {
	const engine = await createEngine(await languageByName(options.grammar));
	const source = readFileSync(resolve(options.file), 'utf8');
	let bestMs = Infinity;
	let nodes = 0;
	for (let round = 0; round < options.rounds; round++) {
		const read = typedNodesOf(engine.parse(source, { deep: true }));
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
