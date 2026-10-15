import { expect, it, vi } from 'vitest';

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
