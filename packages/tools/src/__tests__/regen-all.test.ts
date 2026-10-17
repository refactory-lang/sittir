import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { spawn, spawnSync } = vi.hoisted(() => ({ spawn: vi.fn(), spawnSync: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn, spawnSync }));
vi.mock('@sittir/codegen/grammars', () => ({
	REPO_ROOT: '/repo',
	stableGrammars: () => ['rust', 'typescript', 'python']
}));

interface Record_ {
	source: string;
	binarySha256: string;
	fixtures: Record<string, string>;
}

const { fresh, records, inputs, writeRegenRecord, clearRegenRecord } = vi.hoisted(() => {
	const records = new Map<string, Record_>();
	return {
		fresh: new Set<string>(),
		records,
		inputs: new Map<string, Record<string, string>>(),
		writeRegenRecord: vi.fn((_cwd: string, grammar: string, record: Record_) => records.set(grammar, record)),
		clearRegenRecord: vi.fn((_cwd: string, grammar: string) => records.delete(grammar))
	};
});
vi.mock('../codegen-surface.ts', () => ({
	load: async (name: string) =>
		name === 'generatedManifest'
			? {
					verifyManifestForGrammar: (grammar: string) => ({ ok: fresh.has(grammar), sourceChanged: !fresh.has(grammar), missing: [], modified: [], extra: [], differs: [], stale: [] }),
					computeSourceHash: (grammar: string) => `source of ${grammar}`
				}
			: {
					nativeBuildFreshness: (_root: string, grammar: string, profile: string) =>
						fresh.has(grammar) ? { fresh: true, reason: `built from the current native inputs (${profile})` } : { fresh: false, reason: 'no native binary' },
					nativeBuildStamp: (_root: string, grammar: string) => ({ binarySha256: `binary of ${grammar}` })
				}
}));
vi.mock('../fixture-inputs.ts', () => ({
	fixtureInputs: async (_root: string, grammar: string) => inputs.get(grammar) ?? { [`corpus of ${grammar}`]: 'v1' }
}));
vi.mock('../regen-record.ts', () => ({
	readRegenRecord: (_cwd: string, grammar: string) => records.get(grammar),
	writeRegenRecord,
	clearRegenRecord
}));

function finished(...grammars: string[]): void {
	for (const grammar of grammars) {
		fresh.add(grammar);
		records.set(grammar, { source: `source of ${grammar}`, binarySha256: `binary of ${grammar}`, fixtures: { [`corpus of ${grammar}`]: 'v1' } });
	}
}

interface FakeChild extends EventEmitter {
	stdout: PassThrough;
	stderr: PassThrough;
	finish(code: number | null): void;
}

let children: FakeChild[];

function fakeChild(): FakeChild {
	const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() }) as FakeChild;
	child.finish = (code) => {
		child.stdout.end();
		child.stderr.end();
		child.emit('close', code);
	};
	children.push(child);
	return child;
}

const generationsStarted = (count: number) => vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(count));

beforeEach(() => {
	vi.resetModules();
	children = [];
	fresh.clear();
	records.clear();
	inputs.clear();
	writeRegenRecord.mockClear();
	clearRegenRecord.mockClear();
	delete process.env.SITTIR_REGEN_FORCE;
	spawn.mockReset().mockImplementation(fakeChild);
	spawnSync.mockReset().mockReturnValue({ status: 0 });
});
afterEach(() => vi.restoreAllMocks());

describe('regen:all sequencing', () => {
	it('generates every grammar at once, then builds each native binding without generating again', async () => {
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		expect(spawn).toHaveBeenCalledTimes(3);
		expect(spawnSync).not.toHaveBeenCalled();
		for (const [index, grammar] of ['rust', 'typescript', 'python'].entries()) {
			const generation = spawn.mock.calls[index]![1] as string[];
			expect(generation).toEqual(expect.arrayContaining(['gen', '--grammar', grammar, '--all', '--no-build-native', '--no-workspace-check']));
			expect(generation).not.toContain('--native-only');
		}
		for (const child of children) child.finish(0);
		await run;
		expect(spawnSync).toHaveBeenCalledTimes(3);
		for (const [index, grammar] of ['rust', 'typescript', 'python'].entries()) {
			const [command, args, options] = spawnSync.mock.calls[index]!;
			expect(command).toBe('pnpm');
			expect(args).toEqual(expect.arrayContaining(['gen', '--grammar', grammar, '--all', '--native-only']));
			expect(args).not.toContain('--no-build-native');
			expect((args as string[]).includes('--no-workspace-check')).toBe(index < 2);
			expect(options).toEqual({ cwd: '/repo', stdio: 'inherit' });
		}
	});

	it("prefixes each generation's output with its grammar", async () => {
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		children[1]!.stdout.write('Generating typescript IR...\n');
		for (const child of children) child.finish(0);
		await run;
		expect(write).toHaveBeenCalledWith('[typescript] Generating typescript IR...\n');
	});

	it('starts no native builds if a generation fails, and exits with its status', async () => {
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		children[0]!.finish(0);
		children[1]!.finish(7);
		children[2]!.finish(0);
		await expect(run).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(7);
		expect(spawnSync).not.toHaveBeenCalled();
	});

	it('skips a grammar whose generated files and native binary are fresh, and says so', async () => {
		finished('typescript');
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(2);
		expect(spawn.mock.calls.map((call) => (call[1] as string[])[5])).toEqual(['rust', 'python']);
		for (const child of children) child.finish(0);
		await run;
		expect(spawnSync.mock.calls.map((call) => (call[1] as string[])[5])).toEqual(['rust', 'python']);
		expect((spawnSync.mock.calls[1]![1] as string[]).includes('--no-workspace-check')).toBe(false);
		expect(write).toHaveBeenCalledWith(
			'[typescript] skipped: its generated files match its sources, its native binary was built from the current native inputs (gate), and its fixtures were extracted from the current corpus\n'
		);
		expect(write).toHaveBeenCalledWith('[rust] regenerating: its sources changed since the last generation\n');
	});

	it('runs nothing when every grammar is fresh', async () => {
		finished('rust', 'typescript', 'python');
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		await import('../scripts/regen-all.ts');
		expect(spawn).not.toHaveBeenCalled();
		expect(spawnSync).not.toHaveBeenCalled();
	});

	it('regenerates every grammar under SITTIR_REGEN_FORCE, fresh or not', async () => {
		finished('rust', 'typescript', 'python');
		process.env.SITTIR_REGEN_FORCE = '1';
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		expect(spawn).toHaveBeenCalledTimes(3);
		for (const child of children) child.finish(0);
		await run;
		expect(spawnSync).toHaveBeenCalledTimes(3);
	});

	it('regenerates a grammar whose last regeneration did not finish, however fresh its files are', async () => {
		finished('rust', 'python');
		fresh.add('typescript');
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(1);
		for (const child of children) child.finish(0);
		await run;
		expect(write).toHaveBeenCalledWith('[typescript] regenerating: its last regeneration did not finish\n');
	});

	it('records each regenerated grammar only once the whole run, workspace check included, has succeeded', async () => {
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		expect(clearRegenRecord.mock.calls.map((call) => call[1])).toEqual(['rust', 'typescript', 'python']);
		expect(writeRegenRecord).not.toHaveBeenCalled();
		for (const child of children) child.finish(0);
		await run;
		expect(writeRegenRecord.mock.calls.map((call) => [call[1], call[2]])).toEqual(
			['rust', 'typescript', 'python'].map((grammar) => [
				grammar,
				{ source: `source of ${grammar}`, binarySha256: `binary of ${grammar}`, fixtures: { [`corpus of ${grammar}`]: 'v1' } }
			])
		);
	});

	it('leaves every grammar to regenerate after a failed workspace check, so a retry cannot pass by skipping', async () => {
		spawnSync.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 101 });
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		for (const grammar of ['rust', 'typescript', 'python']) fresh.add(grammar);
		process.env.SITTIR_REGEN_FORCE = '1';
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		for (const child of children) child.finish(0);
		await expect(run).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(101);
		expect(writeRegenRecord).not.toHaveBeenCalled();
		expect(records.size).toBe(0);
	});

	it('stops on an unsuccessful native build', async () => {
		spawnSync.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: null });
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(3);
		for (const child of children) child.finish(0);
		await expect(run).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(1);
		expect(spawnSync).toHaveBeenCalledTimes(2);
	});
});

describe('regen:all when only what the fixtures come from changed', () => {
	it('re-extracts only the fixtures of that grammar, and says why', async () => {
		finished('rust', 'typescript', 'python');
		inputs.set('typescript', { 'corpus of typescript': 'v2' });
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(1);
		const args = spawn.mock.calls[0]![1] as string[];
		expect(args).toEqual(expect.arrayContaining(['gen', '--grammar', 'typescript', '--all', '--post-generate-only']));
		expect(args).not.toContain('--native-only');
		children[0]!.stdout.write('extracted\n');
		children[0]!.finish(0);
		await run;
		expect(spawnSync).not.toHaveBeenCalled();
		expect(write).toHaveBeenCalledWith('[typescript] re-extracting fixtures: corpus of typescript changed since the fixtures were extracted\n');
		expect(write).toHaveBeenCalledWith('[typescript] extracted\n');
		expect(writeRegenRecord.mock.calls.map((call) => [call[1], call[2]])).toEqual([
			['typescript', { source: 'source of typescript', binarySha256: 'binary of typescript', fixtures: { 'corpus of typescript': 'v2' } }]
		]);
	});

	it('re-extracts the fixtures of a grammar recorded before fixtures were', async () => {
		finished('rust', 'typescript', 'python');
		records.set('rust', { source: 'source of rust', binarySha256: 'binary of rust' } as Record_);
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(1);
		expect(spawn.mock.calls[0]![1]).toEqual(expect.arrayContaining(['--grammar', 'rust', '--post-generate-only']));
		children[0]!.finish(0);
		await run;
	});

	it('records nothing and exits with its status when the extraction fails', async () => {
		finished('rust', 'typescript', 'python');
		inputs.set('python', { 'corpus of python': 'v2' });
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		const run = import('../scripts/regen-all.ts');
		await generationsStarted(1);
		children[0]!.finish(3);
		await expect(run).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(3);
		expect(writeRegenRecord).not.toHaveBeenCalled();
	});
});
