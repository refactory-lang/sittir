import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { createStrictNativeEngine } from '../src/validate/common.ts';

vi.mock('@sittir/common', async (importOriginal) => ({ ...(await importOriginal<typeof import('@sittir/common')>()), createEngine: vi.fn() }));

const engineBuiltAs = (buildProfile: string | undefined): void => {
	vi.mocked(createEngine).mockResolvedValueOnce({ diagnostics: { buildProfile } } as never);
};

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('the engine a validator loads', () => {
	it.each(['release', 'gate'] as const)('is taken from a %s build', async (profile) => {
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '');
		engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).resolves.toMatchObject({ diagnostics: { buildProfile: profile } });
	});

	it.each([
		['a dev build', 'dev'],
		['an unstamped build', undefined]
	] as const)('is refused from %s, unless SITTIR_ALLOW_DEBUG_VALIDATE=1', async (build, profile) => {
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '');
		engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).rejects.toThrow(`Native engine for 'rust' is ${build}; validation takes a release or gate build.`);
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '1');
		engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).resolves.toMatchObject({ diagnostics: { buildProfile: profile } });
	});
});
