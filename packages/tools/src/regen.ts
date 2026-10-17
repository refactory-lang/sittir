import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { availableParallelism } from 'node:os';
import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { load, type CodegenSurface } from './codegen-surface.ts';
import { clearRegenRecord, readRegenRecord, writeRegenRecord, type RegenRecord } from './regen-record.ts';

export interface RegenerateOptions {
	readonly force?: boolean;
}

type GrammarName = Parameters<CodegenSurface['generatedManifest']['verifyManifestForGrammar']>[0];

const genArgs = (grammar: string): string[] => ['exec', 'tsx', 'packages/cli/src/cli.ts', 'gen', '--grammar', grammar, '--all', '--output', `packages/${grammar}/src`];

async function currentRecord(grammar: string, cwd: string): Promise<RegenRecord | undefined> {
	const [manifest, native] = await Promise.all([load('generatedManifest'), load('nativeBinaryFreshness')]);
	const binarySha256 = native.nativeBuildStamp(cwd, grammar)?.binarySha256;
	return binarySha256 === undefined ? undefined : { source: manifest.computeSourceHash(grammar as GrammarName), binarySha256 };
}

async function staleness(grammar: string, cwd: string): Promise<string | undefined> {
	const [manifest, native] = await Promise.all([load('generatedManifest'), load('nativeBinaryFreshness')]);
	const generated = manifest.verifyManifestForGrammar(grammar as GrammarName);
	if (generated.sourceChanged) return 'its sources changed since the last generation';
	const drifted = [...generated.missing, ...generated.modified, ...generated.extra, ...generated.differs];
	if (drifted.length > 0) return `${drifted[0]} differs from the last generation`;
	if (generated.stale.length > 0) return `its native binary is stale: ${generated.stale[0]}`;
	if (!generated.ok) return 'its generated files are not recorded as fresh';
	const binary = native.nativeBuildFreshness(cwd, grammar, 'gate');
	if (!binary.fresh) return `its native binary is not fresh: ${binary.reason}`;
	const recorded = readRegenRecord(cwd, grammar);
	const current = await currentRecord(grammar, cwd);
	if (recorded === undefined || current === undefined || recorded.source !== current.source || recorded.binarySha256 !== current.binarySha256) {
		return 'its last regeneration did not finish';
	}
	return undefined;
}

async function staleGrammars(grammars: readonly string[], cwd: string): Promise<string[]> {
	const stale: string[] = [];
	for (const grammar of grammars) {
		const reason = await staleness(grammar, cwd);
		if (reason === undefined) {
			process.stdout.write(
				`[${grammar}] skipped: its generated files match its sources, and its native binary was built from the current native inputs (gate)\n`
			);
		} else {
			process.stdout.write(`[${grammar}] regenerating: ${reason}\n`);
			stale.push(grammar);
		}
	}
	return stale;
}

function prefixed(grammar: string, input: Readable, output: Writable): Promise<unknown> {
	const lines = createInterface({ input });
	lines.on('line', (line) => output.write(`[${grammar}] ${line}\n`));
	return once(lines, 'close');
}

async function generate(grammar: string, cwd: string): Promise<number> {
	const child = spawn('pnpm', [...genArgs(grammar), '--no-build-native', '--no-workspace-check'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
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
	const stale = opts.force === true ? [...grammars] : await staleGrammars(grammars, cwd);
	for (const grammar of stale) clearRegenRecord(cwd, grammar);
	const generated = await inPool(stale, availableParallelism(), (grammar) => generate(grammar, cwd));
	const failed = generated.find((status) => status !== 0);
	if (failed !== undefined) return failed;
	for (const [i, grammar] of stale.entries()) {
		const args = [...genArgs(grammar), '--native-only'];
		if (i < stale.length - 1) args.push('--no-workspace-check');
		const child = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
		if (child.status !== 0) return child.status ?? 1;
	}
	for (const grammar of stale) {
		const record = await currentRecord(grammar, cwd);
		if (record !== undefined) writeRegenRecord(cwd, grammar, record);
	}
	return 0;
}
