import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawnSync: spawn }));
vi.mock('@sittir/codegen/grammars', () => ({
	REPO_ROOT: '/repo',
	stableGrammars: () => ['rust', 'typescript', 'python']
}));

beforeEach(() => {
	vi.resetModules();
	spawn.mockReset().mockReturnValue({ status: 0 });
});
afterEach(() => vi.restoreAllMocks());

describe('regen:all sequencing', () => {
	it('finishes generation for every grammar before any native build', async () => {
		await import('../scripts/regen-all.ts');
		expect(spawn).toHaveBeenCalledTimes(6);
		for (const [index, grammar] of ['rust', 'typescript', 'python'].entries()) {
			const generation = spawn.mock.calls[index];
			const native = spawn.mock.calls[index + 3];
			expect(generation?.[1]).toContain(grammar);
			expect(generation?.[1]).toContain('--no-build-native');
			expect(generation?.[1]).toContain('--no-workspace-check');
			expect(native?.[1]).toContain(grammar);
			expect(native?.[1]).not.toContain('--no-build-native');
			expect(native?.[1].includes('--no-workspace-check')).toBe(index < 2);
			expect(native?.[2]).toEqual({ cwd: '/repo', stdio: 'inherit' });
		}
	});

	it('starts no native builds if generation fails', async () => {
		spawn.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 7 });
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		await expect(import('../scripts/regen-all.ts')).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(7);
		expect(spawn).toHaveBeenCalledTimes(2);
		for (const call of spawn.mock.calls) expect(call[1]).toContain('--no-build-native');
	});

	it('stops on an unsuccessful native build', async () => {
		spawn
			.mockReturnValueOnce({ status: 0 })
			.mockReturnValueOnce({ status: 0 })
			.mockReturnValueOnce({ status: 0 })
			.mockReturnValueOnce({ status: null });
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('exit');
		});
		await expect(import('../scripts/regen-all.ts')).rejects.toThrow('exit');
		expect(exit).toHaveBeenCalledWith(1);
		expect(spawn).toHaveBeenCalledTimes(4);
	});
});
