import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { BackerParity, BaselineRun } from '@sittir/common/engine';
import { withTreeOf } from './layout-runs.ts';

export interface BackerParityOptions {
	readonly corpus: string;
	readonly admitted?: string;
	readonly files: readonly string[];
	readonly json: boolean;
}

export interface RunParity {
	readonly runs: number;
	readonly differingRuns: number;
	readonly firstRun?: number;
}

export interface BackerParityFile extends BackerParity, RunParity {
	readonly file: string;
}

export interface BackerParityCensus {
	readonly files: number;
	readonly nodes: number;
	readonly differing: number;
	readonly runs: number;
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

export function runParity(throughTree: readonly BaselineRun[], fromRecords: readonly BaselineRun[]): RunParity {
	const runs = Math.max(throughTree.length, fromRecords.length);
	let differingRuns = 0;
	let firstRun: number | undefined;
	for (let at = 0; at < runs; at++) {
		const tree = throughTree[at];
		const records = fromRecords[at];
		if (tree !== undefined && records !== undefined && runKey(tree) === runKey(records)) continue;
		differingRuns++;
		firstRun ??= (tree ?? records)?.start;
	}
	return firstRun === undefined ? { runs, differingRuns } : { runs, differingRuns, firstRun };
}

export async function computeBackerParity(root: string, paths: readonly string[]): Promise<BackerParityCensus> {
	if (paths.length === 0) {
		throw new Error('backer-parity has no corpus file to read; name them with --admitted or --files');
	}
	const withTree = await withTreeOf('typescript');
	const failing: BackerParityFile[] = [];
	let nodes = 0;
	let differing = 0;
	let runs = 0;
	let differingRuns = 0;
	for (const path of paths) {
		const source = readFileSync(corpusFile(root, path), 'utf8');
		const { parity, fromRecords } = withTree(source, (engine, treeId) => ({ parity: engine.backerParity(treeId), fromRecords: engine.layoutBaseline(treeId) }));
		const run = runParity(withTree(source, (engine, treeId) => engine.layoutBaseline(treeId)), fromRecords);
		nodes += parity.nodes;
		differing += parity.differing;
		runs += run.runs;
		differingRuns += run.differingRuns;
		if (parity.differing > 0 || run.differingRuns > 0) failing.push({ file: path, ...parity, ...run });
	}
	return { files: paths.length, nodes, differing, runs, differingRuns, failing };
}

export async function run(opts: BackerParityOptions): Promise<number> {
	const paths = opts.admitted === undefined ? opts.files : admittedPaths(opts.admitted);
	const census = await computeBackerParity(opts.corpus, paths);
	if (opts.json) {
		console.log(JSON.stringify(census, null, 2));
	} else {
		console.log(`backer-parity: ${census.files} files, ${census.nodes} nodes, ${census.differing} differing; ${census.runs} layout runs, ${census.differingRuns} measured apart`);
		for (const { file, differing, first, differingRuns, firstRun } of census.failing)
			console.log(`  ${file}: ${differing} differing, first at node ${first}; ${differingRuns} runs apart, first at byte ${firstRun}`);
	}
	return census.differing === 0 && census.differingRuns === 0 ? 0 : 1;
}
