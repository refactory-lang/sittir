import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { spawn, spawnSync } = vi.hoisted(() => ({ spawn: vi.fn(), spawnSync: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn, spawnSync }));
vi.mock('@sittir/codegen/grammars', () => ({
	REPO_ROOT: '/repo',
	stableGrammars: () => ['rust', 'typescript', 'python']
}));

const { fresh, records, writeRegenRecord, clearRegenRecord } = vi.hoisted(() => {
	const records = new Map<string, { source: string; binarySha256: string }>();
	return {
		fresh: new Set<string>(),
		records,
		writeRegenRecord: vi.fn((_cwd: string, grammar: string, record: { source: string; binarySha256: string }) => records.set(grammar, record)),
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
vi.mock('../regen-record.ts', () => ({
	readRegenRecord: (_cwd: string, grammar: string) => records.get(grammar),
	writeRegenRecord,
	clearRegenRecord
}));

function finished(...grammars: string[]): void {
	for (const grammar of grammars) {
		fresh.add(grammar);
		records.set(grammar, { source: `source of ${grammar}`, binarySha256: `binary of ${grammar}` });
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
			'[typescript] skipped: its generated files match its sources, and its native binary was built from the current native inputs (gate)\n'
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
			['rust', 'typescript', 'python'].map((grammar) => [grammar, { source: `source of ${grammar}`, binarySha256: `binary of ${grammar}` }])
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
