import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { availableParallelism } from 'node:os';
import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { load, type CodegenSurface } from './codegen-surface.ts';
import { fixtureOutputs, fixtureSources } from './fixture-inputs.ts';
import { clearRegenRecord, readRegenRecord, writeRegenRecord, type RegenRecord } from './regen-record.ts';
import { readGrammarDiagnostics, severitySummary } from './validate/grammar-diagnostics-file.ts';

export interface RegenerateOptions {
	readonly force?: boolean;
	readonly verbose?: boolean;
}

type GrammarName = Parameters<CodegenSurface['generatedManifest']['verifyManifestForGrammar']>[0];

const genArgs = (grammar: string): string[] => ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];

interface RunInputs {
	readonly source: string;
	readonly fixtures: Readonly<Record<string, string>>;
}

async function runInputs(grammar: string, cwd: string): Promise<RunInputs> {
	const manifest = await load('generatedManifest');
	return { source: manifest.computeSourceHash(grammar as GrammarName), fixtures: await fixtureSources(cwd, grammar) };
}

async function recordAfter(grammar: string, cwd: string, before: RunInputs): Promise<RegenRecord | undefined> {
	const native = await load('nativeBinaryFreshness');
	const binarySha256 = native.nativeBuildStamp(cwd, grammar)?.binarySha256;
	if (binarySha256 === undefined) return undefined;
	return { source: before.source, binarySha256, fixtures: { ...before.fixtures, ...(await fixtureOutputs(cwd, grammar)) } };
}

async function currentRecord(grammar: string, cwd: string): Promise<RegenRecord | undefined> {
	return recordAfter(grammar, cwd, await runInputs(grammar, cwd));
}

type Staleness = { readonly work: 'regenerate' | 're-extract'; readonly reason: string };

const regenerate = (reason: string): Staleness => ({ work: 'regenerate', reason });

async function staleness(grammar: string, cwd: string): Promise<Staleness | undefined> {
	const reason = await generationStaleness(grammar, cwd);
	if (reason !== undefined) return regenerate(reason);
	const recorded = readRegenRecord(cwd, grammar);
	const current = await currentRecord(grammar, cwd);
	if (recorded === undefined || current === undefined || recorded.source !== current.source || recorded.binarySha256 !== current.binarySha256) {
		return regenerate('its last regeneration did not finish');
	}
	const recordedFixtures = recorded.fixtures ?? {};
	const changed = [...new Set([...Object.keys(recordedFixtures), ...Object.keys(current.fixtures)])].sort().find((rel) => recordedFixtures[rel] !== current.fixtures[rel]);
	return changed === undefined ? undefined : { work: 're-extract', reason: `${changed} changed since the fixtures were extracted` };
}

async function generationStaleness(grammar: string, cwd: string): Promise<string | undefined> {
	const [manifest, native] = await Promise.all([load('generatedManifest'), load('nativeBinaryFreshness')]);
	const generated = manifest.verifyManifestForGrammar(grammar as GrammarName);
	if (generated.sourceChanged) return 'its sources changed since the last generation';
	const drifted = [...generated.missing, ...generated.modified, ...generated.extra, ...generated.differs];
	if (drifted.length > 0) return `${drifted[0]} differs from the last generation`;
	if (generated.stale.length > 0) return `its native binary is stale: ${generated.stale[0]}`;
	if (!generated.ok) return 'its generated files are not recorded as fresh';
	const binary = native.nativeBuildFreshness(cwd, grammar, 'gate');
	if (!binary.fresh) return `its native binary is not fresh: ${binary.reason}`;
	return undefined;
}

const SKIPPED =
	'its generated files match its sources, its native binary was built from the current native inputs (gate), and its fixtures were extracted from the current corpus';

interface Work {
	readonly regenerate: string[];
	readonly reextract: string[];
	readonly outcomes: Map<string, string>;
}

async function pendingWork(grammars: readonly string[], cwd: string, verbose: boolean): Promise<Work> {
	const work: Work = { regenerate: [], reextract: [], outcomes: new Map() };
	for (const grammar of grammars) {
		const stale = await staleness(grammar, cwd);
		if (stale === undefined) {
			if (verbose) process.stdout.write(`[${grammar}] skipped: ${SKIPPED}\n`);
			work.outcomes.set(grammar, `skipped: ${SKIPPED}`);
		} else if (stale.work === 're-extract') {
			if (verbose) process.stdout.write(`[${grammar}] re-extracting fixtures: ${stale.reason}\n`);
			work.reextract.push(grammar);
			work.outcomes.set(grammar, `re-extracted fixtures: ${stale.reason}`);
		} else {
			if (verbose) process.stdout.write(`[${grammar}] regenerating: ${stale.reason}\n`);
			work.regenerate.push(grammar);
			work.outcomes.set(grammar, `regenerated: ${stale.reason}`);
		}
	}
	return work;
}

function prefixed(grammar: string, input: Readable, output: (line: string) => void): Promise<unknown> {
	const lines = createInterface({ input });
	lines.on('line', (line) => output(`[${grammar}] ${line}\n`));
	return once(lines, 'close');
}

const toStdout = (line: string): void => void process.stdout.write(line);

async function runPrefixed(grammar: string, cwd: string, flags: readonly string[], verbose: boolean): Promise<number> {
	const child = spawn('pnpm', [...genArgs(grammar), ...flags], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
	const exit = new Promise<number>((resolve) => {
		child.on('close', (code: number | null) => resolve(code ?? 1));
		child.on('error', () => resolve(1));
	});
	const kept: string[] = [];
	await Promise.all([
		prefixed(grammar, child.stdout!, verbose ? toStdout : (line) => kept.push(line)),
		prefixed(grammar, child.stderr!, (line) => void process.stderr.write(line))
	]);
	const status = await exit;
	if (status !== 0) kept.forEach(toStdout);
	return status;
}

function buildNative(grammar: string, cwd: string, args: readonly string[], verbose: boolean): number {
	if (verbose) return spawnSync('pnpm', args, { cwd, stdio: 'inherit' }).status ?? 1;
	const child = spawnSync('pnpm', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, CARGO_TERM_QUIET: 'true' } });
	const status = child.status ?? 1;
	if (status !== 0) for (const line of child.stdout.toString().split('\n')) if (line !== '') toStdout(`[${grammar}] ${line}\n`);
	return status;
}

async function inPool<T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = [];
	let next = 0;
	const worker = async (): Promise<void> => {
		while (next < items.length) {
			const index = next++;
			results[index] = await run(items[index]!);
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}

export async function regenerateGrammars(grammars: readonly string[], cwd: string, opts: RegenerateOptions = {}): Promise<number> {
	(await load('treeSitterCli')).ensureWasmToolchain();
	const verbose = opts.verbose === true;
	const { regenerate: stale, reextract, outcomes } =
		opts.force === true
			? { regenerate: [...grammars], reextract: [], outcomes: new Map(grammars.map((grammar) => [grammar, 'regenerated: forced'])) }
			: await pendingWork(grammars, cwd, verbose);
	const before = new Map<string, RunInputs>();
	for (const grammar of [...stale, ...reextract]) before.set(grammar, await runInputs(grammar, cwd));
	for (const grammar of stale) clearRegenRecord(cwd, grammar);
	const generated = await inPool(stale, availableParallelism(), (grammar) => runPrefixed(grammar, cwd, ['--no-build-native', '--no-workspace-check'], verbose));
	const failed = generated.find((status) => status !== 0);
	if (failed !== undefined) return failed;
	for (const [i, grammar] of stale.entries()) {
		const args = [...genArgs(grammar), '--native-only'];
		if (i < stale.length - 1) args.push('--no-workspace-check');
		const status = buildNative(grammar, cwd, args, verbose);
		if (status !== 0) return status;
	}
	const extracted = await inPool(reextract, availableParallelism(), (grammar) => runPrefixed(grammar, cwd, ['--post-generate-only'], verbose));
	const extractionFailed = extracted.find((status) => status !== 0);
	if (extractionFailed !== undefined) return extractionFailed;
	if (stale.length === 0) {
		const checked = (await load('workspaceCheck')).runWorkspaceCheck(cwd);
		if (checked !== 0) return checked;
	}
	for (const grammar of [...stale, ...reextract]) {
		const record = await recordAfter(grammar, cwd, before.get(grammar)!);
		if (record !== undefined) await writeRegenRecord(cwd, grammar, record);
	}
	for (const [grammar, outcome] of outcomes) {
		process.stdout.write(`[${grammar}] ${outcome} · diagnostics: ${severitySummary(readGrammarDiagnostics(grammar as GrammarName).entries)}\n`);
	}
	return 0;
}
