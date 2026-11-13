import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { createStrictNativeEngine } from '../src/validate/common.ts';

vi.mock('@sittir/common', async (importOriginal) => ({ ...(await importOriginal<typeof import('@sittir/common')>()), createEngine: vi.fn() }));

const engineBuiltAs = (buildProfile: string | undefined): { readonly dispose: ReturnType<typeof vi.fn> } => {
	const engine = { diagnostics: { buildProfile }, dispose: vi.fn() };
	vi.mocked(createEngine).mockResolvedValueOnce(engine as never);
	return engine;
};

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('the engine a validator loads', () => {
	it.each(['release', 'gate'] as const)('is taken from a %s build', async (profile) => {
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '');
		const engine = engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).resolves.toMatchObject({ diagnostics: { buildProfile: profile } });
		expect(engine.dispose).not.toHaveBeenCalled();
	});

	it.each([
		['a dev build', 'dev'],
		['an unstamped build', undefined]
	] as const)('is refused and disposed from %s, unless SITTIR_ALLOW_DEBUG_VALIDATE=1', async (build, profile) => {
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '');
		const refused = engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).rejects.toThrow(`Native engine for 'rust' is ${build}; validation takes a release or gate build.`);
		expect(refused.dispose).toHaveBeenCalledOnce();
		vi.stubEnv('SITTIR_ALLOW_DEBUG_VALIDATE', '1');
		const taken = engineBuiltAs(profile);
		await expect(createStrictNativeEngine('rust')).resolves.toMatchObject({ diagnostics: { buildProfile: profile } });
		expect(taken.dispose).not.toHaveBeenCalled();
	});
});
