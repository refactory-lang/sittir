import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { bindingsModulePath } from '@sittir/codegen/bindings';
import { REPO_ROOT, allGrammars, grammarPackage, type GrammarName } from '@sittir/codegen/grammars';
import { invoke } from '../codegen-surface.ts';

export interface GateManifest {
	readonly entries: ReadonlyMap<string, string>;
}

export interface GateException {
	readonly path: string;
	readonly dropJsonKeys?: readonly string[];
}

export type GateRevision = string | 'worktree';

export type GateLayer = 'sittir' | 'top';

export const GATE_LAYERS: readonly GateLayer[] = ['sittir', 'top'];

export interface GateDifference {
	readonly path: string;
	readonly change: 'changed' | 'missing' | 'added';
}

function git(args: readonly string[], root: string): string {
	return execFileSync('git', [...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30 });
}

const byPath = ([left]: readonly [string, string], [right]: readonly [string, string]): number => (left < right ? -1 : left > right ? 1 : 0);

export function readGateManifest(path: string): GateManifest {
	const entries = new Map<string, string>();
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const text = line.trim();
		if (text === '' || text.startsWith('#')) continue;
		const at = text.indexOf(' ');
		entries.set(text.slice(at + 1).trim(), text.slice(0, at));
	}
	return { entries };
}

export function printGateManifest(manifest: GateManifest, comment: string): string {
	return [`# ${comment}`, ...[...manifest.entries].map(([path, blob]) => `${blob} ${path}`)].join('\n') + '\n';
}

export async function generatedOutputRoots(): Promise<readonly string[]> {
	const roots = await Promise.all(allGrammars().map((grammar) => invoke('generatedManifest', 'generatedRootsFor', grammar)));
	return [...roots.flat(), ...allGrammars().map((grammar) => relative(REPO_ROOT, bindingsModulePath(grammar)))];
}

function blobsAtRevision(roots: readonly string[], rev: string, root: string): Map<string, string> {
	const blobs = new Map<string, string>();
	for (const entry of git(['ls-tree', '-r', '-z', rev, '--', ...roots], root).split('\0')) {
		if (entry === '') continue;
		const tab = entry.indexOf('\t');
		const [, type, blob] = entry.slice(0, tab).split(' ');
		if (type === 'blob' && blob !== undefined) blobs.set(entry.slice(tab + 1), blob);
	}
	return blobs;
}

function blobsInWorktree(roots: readonly string[], root: string): Map<string, string> {
	const paths = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...roots], root)
		.split('\0')
		.filter((path) => path !== '' && existsSync(join(root, path)));
	const unique = [...new Set(paths)];
	if (unique.length === 0) return new Map();
	const blobs = git(['hash-object', '--', ...unique], root).trim().split('\n');
	return new Map(unique.map((path, index) => [path, blobs[index]!]));
}

export function gateBlobs(roots: readonly string[], rev: GateRevision, root: string = REPO_ROOT): Map<string, string> {
	return rev === 'worktree' ? blobsInWorktree(roots, root) : blobsAtRevision(roots, rev, root);
}

export function recordGateManifest(roots: readonly string[], rev: string, root: string = REPO_ROOT): GateManifest {
	return { entries: new Map([...blobsAtRevision(roots, rev, root)].sort(byPath)) };
}

function textAt(path: string, blob: string, rev: GateRevision, root: string): string {
	return rev === 'worktree' ? readFileSync(join(root, path), 'utf8') : git(['cat-file', 'blob', blob], root);
}

function withoutKeys(text: string, keys: readonly string[]): string {
	const value = JSON.parse(text) as Record<string, unknown>;
	for (const key of keys) delete value[key];
	return JSON.stringify(value, null, 2);
}

export function checkGate(
	manifest: GateManifest,
	current: ReadonlyMap<string, string>,
	rev: GateRevision,
	except: readonly GateException[],
	root: string = REPO_ROOT
): readonly GateDifference[] {
	const exceptions = new Map(except.map((exception) => [exception.path, exception]));
	const differences: GateDifference[] = [];
	for (const [path, expected] of manifest.entries) {
		const actual = current.get(path);
		if (actual === expected) continue;
		const exception = exceptions.get(path);
		if (actual === undefined) {
			if (exception === undefined || exception.dropJsonKeys !== undefined) differences.push({ path, change: 'missing' });
			continue;
		}
		if (exception === undefined) differences.push({ path, change: 'changed' });
		else if (exception.dropJsonKeys !== undefined) {
			const before = withoutKeys(git(['cat-file', 'blob', expected], root), exception.dropJsonKeys);
			if (before !== withoutKeys(textAt(path, actual, rev, root), exception.dropJsonKeys)) differences.push({ path, change: 'changed' });
		}
	}
	for (const path of current.keys()) if (!manifest.entries.has(path) && !exceptions.has(path)) differences.push({ path, change: 'added' });
	return differences.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
}

export function parseGateException(spec: string): GateException {
	const colon = spec.indexOf(':');
	if (colon < 0) return { path: spec };
	return { path: spec.slice(0, colon), dropJsonKeys: spec.slice(colon + 1).split(',').filter((key) => key !== '') };
}

export async function evaluatedGrammarOf(grammar: GrammarName, layer: GateLayer): Promise<unknown> {
	const entry = await invoke('resolveGrammar', 'packageEntryPath', grammarPackage(grammar));
	return layer === 'sittir' ? invoke('evaluate', 'evaluateUnboundDsl', entry) : invoke('evaluate', 'evaluateDsl', entry);
}

export async function snapshotOf(evaluated: unknown): Promise<string> {
	return JSON.stringify(await invoke('evaluateForDerivation', 'canonical', evaluated), null, 2) + '\n';
}

export async function evaluatedSnapshot(grammar: GrammarName, layer: GateLayer): Promise<string> {
	return snapshotOf(await evaluatedGrammarOf(grammar, layer));
}

const snapshotFile = (dir: string, grammar: GrammarName, layer: GateLayer): string => join(dir, `${grammar}.${layer}.json`);

export async function writeSnapshots(dir: string): Promise<readonly string[]> {
	mkdirSync(dir, { recursive: true });
	const written: string[] = [];
	for (const grammar of allGrammars()) {
		for (const layer of GATE_LAYERS) {
			const file = snapshotFile(dir, grammar, layer);
			writeFileSync(file, await evaluatedSnapshot(grammar, layer));
			written.push(file);
		}
	}
	return written;
}

export async function checkSnapshots(dir: string): Promise<readonly string[]> {
	const differing: string[] = [];
	for (const grammar of allGrammars()) {
		for (const layer of GATE_LAYERS) {
			const file = snapshotFile(dir, grammar, layer);
			if (!existsSync(file) || readFileSync(file, 'utf8') !== (await evaluatedSnapshot(grammar, layer))) differing.push(file);
		}
	}
	return differing;
}

export interface OutputGateOptions {
	readonly record?: string;
	readonly check?: string;
	readonly rev?: string;
	readonly except?: readonly string[];
	readonly snapshot?: string;
	readonly checkSnapshot?: string;
}

export async function run(opts: OutputGateOptions): Promise<number> {
	const roots = await generatedOutputRoots();
	if (opts.record !== undefined) {
		const rev = opts.rev ?? 'HEAD';
		const manifest = recordGateManifest(roots, rev);
		writeFileSync(opts.record, printGateManifest(manifest, `generated outputs at ${git(['rev-parse', rev], REPO_ROOT).trim()}, as <blob> <path>`));
		console.log(`recorded ${manifest.entries.size} generated files at ${rev} to ${opts.record}`);
	}
	let status = 0;
	if (opts.check !== undefined) {
		const rev = opts.rev ?? 'worktree';
		const differences = checkGate(readGateManifest(opts.check), gateBlobs(roots, rev), rev, (opts.except ?? []).map(parseGateException));
		for (const { path, change } of differences) console.log(`${change} ${path}`);
		console.log(differences.length === 0 ? `output gate: every generated file matches ${opts.check}` : `output gate: ${differences.length} generated file(s) differ`);
		if (differences.length > 0) status = 1;
	}
	if (opts.snapshot !== undefined) for (const file of await writeSnapshots(opts.snapshot)) console.log(`wrote ${file}`);
	if (opts.checkSnapshot !== undefined) {
		const differing = await checkSnapshots(opts.checkSnapshot);
		for (const file of differing) console.log(`differs ${file}`);
		console.log(differing.length === 0 ? `snapshots: every evaluated grammar matches ${opts.checkSnapshot}` : `snapshots: ${differing.length} evaluated grammar(s) differ`);
		if (differing.length > 0) status = 1;
	}
	return status;
}
