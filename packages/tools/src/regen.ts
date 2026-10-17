import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { availableParallelism } from 'node:os';
import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { load, type CodegenSurface } from './codegen-surface.ts';
import { fixtureInputs } from './fixture-inputs.ts';
import { clearRegenRecord, readRegenRecord, writeRegenRecord, type RegenRecord } from './regen-record.ts';

export interface RegenerateOptions {
	readonly force?: boolean;
}

type GrammarName = Parameters<CodegenSurface['generatedManifest']['verifyManifestForGrammar']>[0];

const genArgs = (grammar: string): string[] => ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];

async function currentRecord(grammar: string, cwd: string): Promise<RegenRecord | undefined> {
	const [manifest, native] = await Promise.all([load('generatedManifest'), load('nativeBinaryFreshness')]);
	const binarySha256 = native.nativeBuildStamp(cwd, grammar)?.binarySha256;
	if (binarySha256 === undefined) return undefined;
	return { source: manifest.computeSourceHash(grammar as GrammarName), binarySha256, fixtures: await fixtureInputs(cwd, grammar) };
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

interface Work {
	readonly regenerate: string[];
	readonly reextract: string[];
}

async function pendingWork(grammars: readonly string[], cwd: string): Promise<Work> {
	const work: Work = { regenerate: [], reextract: [] };
	for (const grammar of grammars) {
		const stale = await staleness(grammar, cwd);
		if (stale === undefined) {
			process.stdout.write(
				`[${grammar}] skipped: its generated files match its sources, its native binary was built from the current native inputs (gate), and its fixtures were extracted from the current corpus\n`
			);
		} else if (stale.work === 're-extract') {
			process.stdout.write(`[${grammar}] re-extracting fixtures: ${stale.reason}\n`);
			work.reextract.push(grammar);
		} else {
			process.stdout.write(`[${grammar}] regenerating: ${stale.reason}\n`);
			work.regenerate.push(grammar);
		}
	}
	return work;
}

function prefixed(grammar: string, input: Readable, output: Writable): Promise<unknown> {
	const lines = createInterface({ input });
	lines.on('line', (line) => output.write(`[${grammar}] ${line}\n`));
	return once(lines, 'close');
}

async function runPrefixed(grammar: string, cwd: string, flags: readonly string[]): Promise<number> {
	const child = spawn('pnpm', [...genArgs(grammar), ...flags], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
	const exit = new Promise<number>((resolve) => {
		child.on('close', (code: number | null) => resolve(code ?? 1));
		child.on('error', () => resolve(1));
	});
	await Promise.all([prefixed(grammar, child.stdout!, process.stdout), prefixed(grammar, child.stderr!, process.stderr)]);
	return exit;
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
	const { regenerate: stale, reextract } = opts.force === true ? { regenerate: [...grammars], reextract: [] } : await pendingWork(grammars, cwd);
	for (const grammar of stale) clearRegenRecord(cwd, grammar);
	const generated = await inPool(stale, availableParallelism(), (grammar) => runPrefixed(grammar, cwd, ['--no-build-native', '--no-workspace-check']));
	const failed = generated.find((status) => status !== 0);
	if (failed !== undefined) return failed;
	for (const [i, grammar] of stale.entries()) {
		const args = [...genArgs(grammar), '--native-only'];
		if (i < stale.length - 1) args.push('--no-workspace-check');
		const child = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
		if (child.status !== 0) return child.status ?? 1;
	}
	const extracted = await inPool(reextract, availableParallelism(), (grammar) => runPrefixed(grammar, cwd, ['--post-generate-only']));
	const extractionFailed = extracted.find((status) => status !== 0);
	if (extractionFailed !== undefined) return extractionFailed;
	for (const grammar of [...stale, ...reextract]) {
		const record = await currentRecord(grammar, cwd);
		if (record !== undefined) writeRegenRecord(cwd, grammar, record);
	}
	return 0;
}
