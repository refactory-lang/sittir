import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnSync } = vi.hoisted(() => ({ spawnSync: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync }));

import { EAGER_PROBE_GENERATOR, regenerateEagerProbe } from '../eager-probe.ts';

const ran = (status: number | null, stdout: string, stderr: string) => ({ status, stdout: Buffer.from(stdout), stderr: Buffer.from(stderr) });

beforeEach(() => spawnSync.mockReset());
afterEach(() => vi.restoreAllMocks());

describe('regenerating the eager probe', () => {
	it('runs its generator from the given root and keeps its output when it succeeds', () => {
		spawnSync.mockReturnValue(ran(0, '{"builders":250}\n', 'a compile warning\n'));
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		expect(regenerateEagerProbe('/repo', false)).toBe(0);
		expect(spawnSync.mock.calls).toEqual([['pnpm', ['exec', 'tsx', EAGER_PROBE_GENERATOR], { cwd: '/repo', stdio: ['ignore', 'pipe', 'pipe'] }]]);
		expect(out).not.toHaveBeenCalled();
		expect(err).not.toHaveBeenCalled();
	});

	it('prints its kept output, labelled, and returns its status when it fails', () => {
		spawnSync.mockReturnValue(ran(2, 'the layout drifted\n', 'AssertionError\n'));
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		expect(regenerateEagerProbe('/repo', false)).toBe(2);
		expect(out.mock.calls).toEqual([['[eager probe] the layout drifted\n']]);
		expect(err.mock.calls).toEqual([['[eager probe] AssertionError\n']]);
	});

	it('fails when its generator ends without a status', () => {
		spawnSync.mockReturnValue(ran(null, '', ''));
		expect(regenerateEagerProbe('/repo', false)).toBe(1);
	});

	it('passes its output straight through under --verbose', () => {
		spawnSync.mockReturnValue({ status: 0 });
		expect(regenerateEagerProbe('/repo', true)).toBe(0);
		expect(spawnSync.mock.calls[0]![2]).toEqual({ cwd: '/repo', stdio: 'inherit' });
	});
});
