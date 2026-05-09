import { describe, it, expect } from 'vitest';
import { runCountsCli, runProbeFactoryCli, runHistoryCli } from '../src/cli.ts';

describe('@sittir/validator cli surface', () => {
	it('exports runCountsCli as a function', () => {
		expect(typeof runCountsCli).toBe('function');
	});

	it('exports runProbeFactoryCli as a function', () => {
		expect(typeof runProbeFactoryCli).toBe('function');
	});

	it('exports runHistoryCli as a function', () => {
		expect(typeof runHistoryCli).toBe('function');
	});

	it('runCountsCli returns a Promise', () => {
		const result = runCountsCli(['--help']);
		expect(result).toBeInstanceOf(Promise);
		// Drain the promise (will error since --help is not a grammar, but falls back gracefully)
		return result.catch(() => {});
	});

	it('runProbeFactoryCli returns a Promise', () => {
		const result = runProbeFactoryCli(['--help']);
		expect(result).toBeInstanceOf(Promise);
		return result.catch(() => {});
	});

	it('runHistoryCli is synchronous', () => {
		// runHistoryCli is sync — verify it does not throw when called with empty args
		expect(() => runHistoryCli([])).not.toThrow();
	});

	it('re-exported from @sittir/validator index', async () => {
		const mod = await import('../src/index.ts');
		expect(typeof mod.runCountsCli).toBe('function');
		expect(typeof mod.runProbeFactoryCli).toBe('function');
		expect(typeof mod.runHistoryCli).toBe('function');
	});
});
