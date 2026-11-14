import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { nativeEngineOf, type BackerParity, type BaselineRun } from '@sittir/common/engine';
import { nativeBackendOf, withTreeOf } from './layout-runs.ts';

export interface BackerParityOptions {
	readonly corpus: string;
	readonly admitted?: string;
	readonly files: readonly string[];
	readonly json: boolean;
}

export interface RunParity {
	readonly runs: number;
	readonly measuredRuns: number;
	readonly differingRuns: number;
	readonly firstRun?: number;
}

export interface BackerParityFile extends Omit<BackerParity, 'runs'>, RunParity {
	readonly file: string;
}

export interface BackerParityCensus {
	readonly files: number;
	readonly nodes: number;
	readonly differing: number;
	readonly runs: number;
	readonly measuredRuns: number;
	readonly differingRuns: number;
	readonly failing: readonly BackerParityFile[];
}

const TYPESCRIPT_SOURCE = /(?<!\.d)\.[cm]?ts$/;

function within(base: string, file: string): boolean {
	const inside = relative(base, file);
	return inside !== '' && !inside.startsWith('..') && !isAbsolute(inside) && TYPESCRIPT_SOURCE.test(file);
}

export function corpusFile(root: string, path: string): string {
	const base = realpathSync(root);
	const named = resolve(base, path);
	const file = !isAbsolute(path) && within(base, named) ? realpathSync(named) : undefined;
	if (file === undefined || !within(base, file)) {
		throw new Error(`backer-parity reads TypeScript sources inside the corpus only, not ${JSON.stringify(path)}`);
	}
	return file;
}

export function admittedPaths(list: string): string[] {
	const { files } = JSON.parse(readFileSync(list, 'utf8')) as { files: readonly { path: string }[] };
	return files.map(({ path }) => path);
}

function runKey({ start, end, index, side, breaks, spaces, tabs }: BaselineRun): string {
	return JSON.stringify([start, end, index, side, breaks, spaces, tabs]);
}

function measured({ breaks, spaces, tabs }: BaselineRun): boolean {
	return breaks !== undefined && spaces !== undefined && tabs !== undefined;
}

export function runParity(throughTree: readonly BaselineRun[], fromRecords: readonly BaselineRun[]): RunParity {
	const runs = Math.max(throughTree.length, fromRecords.length);
	let measuredRuns = 0;
	let differingRuns = 0;
	let firstRun: number | undefined;
	for (let at = 0; at < runs; at++) {
		const tree = throughTree[at];
		const records = fromRecords[at];
		if (tree !== undefined && records !== undefined && runKey(tree) === runKey(records)) {
			if (measured(tree)) measuredRuns++;
			continue;
		}
		differingRuns++;
		firstRun ??= (tree ?? records)?.start;
	}
	return firstRun === undefined ? { runs, measuredRuns, differingRuns } : { runs, measuredRuns, differingRuns, firstRun };
}

export function censusPasses({ differing, measuredRuns, differingRuns }: BackerParityCensus): boolean {
	return differing === 0 && differingRuns === 0 && measuredRuns > 0;
}

function recordParity(native: Awaited<ReturnType<typeof nativeBackendOf>>, source: string): BackerParity {
	const engine = nativeEngineOf(native);
	try {
		if (!engine.backerParity) throw new Error('backer-parity needs an addon built with arena storage');
		return engine.backerParity(source);
	} finally {
		engine.dispose();
	}
}

export async function computeBackerParity(root: string, paths: readonly string[]): Promise<BackerParityCensus> {
	if (paths.length === 0) {
		throw new Error('backer-parity has no corpus file to read; name them with --admitted or --files');
	}
	const native = await nativeBackendOf('typescript');
	const withTree = await withTreeOf('typescript');
	const failing: BackerParityFile[] = [];
	let nodes = 0;
	let differing = 0;
	let runs = 0;
	let measuredRuns = 0;
	let differingRuns = 0;
	for (const path of paths) {
		const source = readFileSync(corpusFile(root, path), 'utf8');
		const { runs: fromRecords, ...parity } = recordParity(native, source);
		const run = runParity(withTree(source, (engine, treeId) => engine.layoutBaseline(treeId)), fromRecords);
		nodes += parity.nodes;
		differing += parity.differing;
		runs += run.runs;
		measuredRuns += run.measuredRuns;
		differingRuns += run.differingRuns;
		if (parity.differing > 0 || run.differingRuns > 0) failing.push({ file: path, ...parity, ...run });
	}
	return { files: paths.length, nodes, differing, runs, measuredRuns, differingRuns, failing };
}

export async function run(opts: BackerParityOptions): Promise<number> {
	const paths = opts.admitted === undefined ? opts.files : admittedPaths(opts.admitted);
	const census = await computeBackerParity(opts.corpus, paths);
	if (opts.json) {
		console.log(JSON.stringify(census, null, 2));
	} else {
		console.log(
			`backer-parity: ${census.files} files, ${census.nodes} nodes, ${census.differing} differing; ${census.runs} layout runs, ${census.measuredRuns} measured alike, ${census.differingRuns} measured apart`
		);
		for (const { file, differing, first, differingRuns, firstRun } of census.failing)
			console.log(`  ${file}: ${differing} differing, first at node ${first}; ${differingRuns} runs apart, first at byte ${firstRun}`);
	}
	return censusPasses(census) ? 0 : 1;
}
