import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { BackerParity } from '@sittir/common/engine';
import { nativeBackendOf, withFreshEngine } from './stored-layout.ts';

export interface BackerParityOptions {
	readonly corpus: string;
	readonly admitted?: string;
	readonly files: readonly string[];
	readonly json: boolean;
}

export interface BackerParityFile extends BackerParity {
	readonly file: string;
}

export interface BackerParityCensus {
	readonly files: number;
	readonly nodes: number;
	readonly differing: number;
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

export function censusPasses({ nodes, differing }: BackerParityCensus): boolean {
	return differing === 0 && nodes > 0;
}

function recordParity(native: Awaited<ReturnType<typeof nativeBackendOf>>, source: string): BackerParity {
	return withFreshEngine(native, (engine) => {
		if (!engine.backerParity) throw new Error('backer-parity needs an addon built with arena storage');
		return engine.backerParity(source);
	});
}

export async function backerParityOf(grammar: string): Promise<(source: string) => BackerParity> {
	const native = await nativeBackendOf(grammar);
	return (source) => recordParity(native, source);
}

export async function computeBackerParity(root: string, paths: readonly string[]): Promise<BackerParityCensus> {
	if (paths.length === 0) {
		throw new Error('backer-parity has no corpus file to read; name them with --admitted or --files');
	}
	const parityOf = await backerParityOf('typescript');
	const failing: BackerParityFile[] = [];
	let nodes = 0;
	let differing = 0;
	for (const path of paths) {
		const parity = parityOf(readFileSync(corpusFile(root, path), 'utf8'));
		nodes += parity.nodes;
		differing += parity.differing;
		if (parity.differing > 0) failing.push({ file: path, ...parity });
	}
	return { files: paths.length, nodes, differing, failing };
}

export async function run(opts: BackerParityOptions): Promise<number> {
	const paths = opts.admitted === undefined ? opts.files : admittedPaths(opts.admitted);
	const census = await computeBackerParity(opts.corpus, paths);
	if (opts.json) {
		console.log(JSON.stringify(census, null, 2));
	} else {
		console.log(`backer-parity: ${census.files} files, ${census.nodes} nodes, ${census.differing} differing`);
		for (const { file, differing, first } of census.failing) console.log(`  ${file}: ${differing} differing, first at node ${first}`);
	}
	return censusPasses(census) ? 0 : 1;
}
