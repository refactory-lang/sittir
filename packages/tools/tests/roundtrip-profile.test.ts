import { createRequire } from 'node:module';
import { expect, it, vi } from 'vitest';
import type { NativeModuleLike } from '@sittir/common/engine';
import { measureRoundtrip, RoundtripProfile } from '../src/validate/roundtrip-profile.ts';
import { validateReadRenderParse } from '../src/validate/read-render-parse.ts';
import { validateFactoryStorage } from '../src/validate/factory-storage.ts';

it('deep-reads every object root for read-render-parse', async () => {
	const native = createRequire(import.meta.url)('../../scm/native/index.cjs') as NativeModuleLike;
	const read = vi.spyOn(native.SittirEngine.prototype, 'read');
	try {
		const result = await validateReadRenderParse('scm', { recursive: true });
		expect(result.pass).toBe(19);
		expect(read.mock.calls.filter((call) => call[1] === 0 && call[2] === Infinity)).toHaveLength(19);
	} finally {
		read.mockRestore();
	}
});

it('preserves results and thrown errors and records both timed outcomes', () => {
	let now = 0;
	const profile = new RoundtripProfile(() => now++);
	const result = { identity: true };
	expect(measureRoundtrip(profile, 'read', () => result)).toBe(result);
	const failure = new Error('read refused');
	expect(() =>
		measureRoundtrip(profile, 'read', () => {
			throw failure;
		})
	).toThrow(failure);
	expect(profile.finish().phases.read).toEqual({ milliseconds: 2, calls: 2, throws: 1 });
	expect(measureRoundtrip(undefined, 'read', () => result)).toBe(result);
});

it.each(['read', 'factory', 'ir'] as const)(
	'profiles the real %s validator without changing its result',
	async (bucket) => {
		const profile = new RoundtripProfile();
		const run = (timing?: RoundtripProfile) =>
			bucket === 'read'
				? validateReadRenderParse('scm', { recursive: true, profile: timing })
				: validateFactoryStorage('scm', 'native', { surface: bucket === 'ir' ? 'ir' : 'raw', profile: timing });
		const expected = await run();
		const measured = await run(profile);
		expect(measured).toEqual(expected);
		const sample = profile.finish();
		expect(sample.work.cases).toBeGreaterThan(0);
		expect(sample.phases[bucket === 'read' ? 'read' : 'build'].calls).toBeGreaterThan(0);
		expect(sample.phases.render.calls).toBe(sample.render.calls);
		expect(sample.phases.parse.calls).toBeGreaterThan(0);
	},
	30_000
);

it('fingerprints ordered candidates and rendered output independently of timings', () => {
	const record = (source: string) => {
		const profile = new RoundtripProfile();
		profile.candidate('same name', source, 'kind', 0, 1);
		profile.output('kind', 'kind', 'é');
		return profile.finish();
	};
	const first = record('one');
	expect(first.render).toEqual({ calls: 1, bytes: 2, sha256: expect.stringMatching(/^[a-f\d]{64}$/) });
	expect(record('one').work).toEqual(first.work);
	expect(record('two').work.sha256).not.toBe(first.work.sha256);
});
