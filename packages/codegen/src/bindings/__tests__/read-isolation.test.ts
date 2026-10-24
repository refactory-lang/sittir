import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';
import { BOOTSTRAP_DIR_ENV, bootstrapDir, readPin } from '../../bootstrap/bootstrap.ts';

// The memo answers repeat reads from the bootstrap store, which persists across runs. Each test process
// gets a store of its own that holds the real pinned build through symlinks and no read entries.
const REAL_PINNED = bootstrapDir();
const STORE = mkdtempSync(join(tmpdir(), 'read-isolation-'));
const PINNED = join(STORE, readPin());
mkdirSync(PINNED);
for (const entry of readdirSync(REAL_PINNED)) if (entry !== 'reads') symlinkSync(join(REAL_PINNED, entry), join(PINNED, entry));
const PRIOR_STORE = process.env[BOOTSTRAP_DIR_ENV];
process.env[BOOTSTRAP_DIR_ENV] = STORE;
afterAll(() => {
	if (PRIOR_STORE === undefined) delete process.env[BOOTSTRAP_DIR_ENV];
	else process.env[BOOTSTRAP_DIR_ENV] = PRIOR_STORE;
	rmSync(STORE, { recursive: true, force: true });
});

vi.mock('@sittir/common', async (importOriginal) => {
	const common = await importOriginal<typeof import('@sittir/common')>();
	return { ...common, createEngine: vi.fn(common.createEngine) };
});

vi.mock('node:child_process', async (importOriginal) => {
	const childProcess = await importOriginal<typeof import('node:child_process')>();
	return { ...childProcess, spawn: vi.fn(childProcess.spawn), spawnSync: vi.fn(childProcess.spawnSync) };
});

it('reads bindings.scm on the pinned build in a process of its own, so this process creates no scm engine', async () => {
	const { createEngine } = await import('@sittir/common');
	const { readBindings } = await import('../read.ts');
	expect((await readBindings('(identifier) @identifier')).claims.map((c) => c.vocab)).toEqual(['identifier']);
	expect(createEngine).not.toHaveBeenCalled();
});

it('serves every read in a process from one reader process, however many reads and modes', async () => {
	const childProcess = await import('node:child_process');
	const { bindingPatterns, readBindings, roundTripBindings } = await import('../read.ts');
	await Promise.all([readBindings('(call) @expression.call'), bindingPatterns('(identifier) @identifier')]);
	const { errors } = await roundTripBindings('(identifier) @identifier\n');
	expect(errors).toEqual([]);
	expect(await readBindings('(string) @literal.string')).toMatchObject({ claims: [{ vocab: 'literal.string' }] });
	expect(childProcess.spawn).toHaveBeenCalledTimes(1);
	expect(childProcess.spawnSync).not.toHaveBeenCalled();
});
