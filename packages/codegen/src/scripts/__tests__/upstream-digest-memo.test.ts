import { describe, expect, it, vi } from 'vitest';

const walked = vi.hoisted(() => ({ dirs: [] as string[] }));

vi.mock('node:fs', async (importOriginal) => {
	const real = await importOriginal<typeof import('node:fs')>();
	const readdirSync = ((path: Parameters<typeof real.readdirSync>[0], ...rest: unknown[]) => {
		walked.dirs.push(String(path));
		return (real.readdirSync as (...args: unknown[]) => unknown)(path, ...rest);
	}) as typeof real.readdirSync;
	return { ...real, readdirSync };
});

vi.mock('../../transpile/tree-sitter-cli.ts', async (importOriginal) => {
	const real = await importOriginal<typeof import('../../transpile/tree-sitter-cli.ts')>();
	return { ...real, treeSitterToolchainIdentity: () => 'toolchain' };
});

const { checkoutSource, computeSourceHash, sourceFingerprint, upstreamDigest } = await import('../generated-manifest.ts');
const { REPO_ROOT } = await import('../../grammars.ts');

const walksOf = (grammar: string): number => walked.dirs.filter((dir) => dir.endsWith(`/tree-sitter-${grammar}`)).length;

describe('upstreamDigest reads each grammar\'s upstream package once per manifest source', () => {
	it('walks the package once however many times a run asks for the digest', () => {
		const src = checkoutSource(REPO_ROOT);
		walked.dirs.length = 0;
		const digest = upstreamDigest('python', src);
		computeSourceHash('python', src);
		expect(sourceFingerprint('python', src).upstream).toBe(digest);
		expect(upstreamDigest('python', src)).toBe(digest);
		expect(walksOf('python')).toBe(1);
	}, 60_000);

	it('keeps one digest per grammar, so a second grammar walks its own package once', () => {
		const src = checkoutSource(REPO_ROOT);
		walked.dirs.length = 0;
		const python = upstreamDigest('python', src);
		const rust = upstreamDigest('rust', src);
		upstreamDigest('python', src);
		upstreamDigest('rust', src);
		expect([walksOf('python'), walksOf('rust')]).toEqual([1, 1]);
		expect(python).not.toBe(rust);
	}, 60_000);

	it('does not share a digest between two manifest sources', () => {
		walked.dirs.length = 0;
		upstreamDigest('python', checkoutSource(REPO_ROOT));
		upstreamDigest('python', checkoutSource(REPO_ROOT));
		expect(walksOf('python')).toBe(2);
	}, 60_000);
});
