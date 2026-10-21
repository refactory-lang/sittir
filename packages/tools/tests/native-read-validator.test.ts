import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import type { NativeModuleLike } from '@sittir/common/engine';
import type { TreeHandle } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';
import { useValidationNodeStorage } from '../src/validate/common.ts';
import { validateReadRenderParse } from '../src/validate/read-render-parse.ts';
import { RoundtripProfile } from '../src/validate/roundtrip-profile.ts';

const native = createRequire(import.meta.url)('../../scm/native/index.cjs') as NativeModuleLike;

afterEach(() => vi.restoreAllMocks());

it('defers the diagnostic root read and keeps its error stamp and cached identity', async () => {
	const engine = await createEngine(await languageByName('scm'));
	const read = vi.spyOn(native.SittirEngine.prototype, 'read');
	try {
		const parsed = engine.diagnostics.parseAndRead('(identifier)');
		expect(read).not.toHaveBeenCalled();
		const tree = parsed.tree as TreeHandle;
		const root = tree.read!(0) as { $errors: readonly unknown[] };
		expect(root.$errors).toEqual([]);
		expect(parsed.root).toBe(root);
		expect(parsed.root).toBe(root);
		expect(read).toHaveBeenCalledTimes(1);
	} finally {
		engine.dispose();
	}
});

function refuseExports() {
	return ['read', 'readRecord', 'chunk', 'text'] as const;
}

it('hydrates and renders a diagnostic tree without exporting objects or record chunks', async () => {
	const engine = await createEngine(await languageByName('scm'), { nodeStorage: 'arena' });
	for (const method of refuseExports())
		vi.spyOn(native.SittirEngine.prototype, method).mockImplementation(() => {
			throw new Error(`unexpected ${method}`);
		});
	const hydrated = vi.spyOn(native.SittirEngine.prototype, 'hydrateRecord');
	try {
		const source = '(identifier) @name';
		const tree = engine.diagnostics.parseAndRead(source).tree as TreeHandle;
		const address = tree.records!.hydrate(0, Infinity);
		expect(address).toBeDefined();
		expect(tree.records!.render(address!, false, false)).toBe(source);
		expect(hydrated).toHaveBeenCalledWith(tree.id, 0, Infinity);
	} finally {
		engine.dispose();
	}
});

it('deep-reads each arena root before enumeration and render, without object reads or chunk export', async () => {
	useValidationNodeStorage('arena');
	for (const method of refuseExports())
		vi.spyOn(native.SittirEngine.prototype, method).mockImplementation(() => {
			throw new Error(`unexpected ${method}`);
		});
	const hydrated = vi.spyOn(native.SittirEngine.prototype, 'hydrateRecord');
	const queried = vi.spyOn(native.SittirEngine.prototype, 'recordCandidates');
	const rendered = vi.spyOn(native.SittirEngine.prototype, 'renderCandidate');
	const profile = new RoundtripProfile();
	const result = await validateReadRenderParse('scm', { recursive: true, profile });
	expect(result.errors).toEqual([]);
	expect(result.pass).toBe(19);
	expect(result.astMatchPass).toBe(19);
	expect(hydrated).toHaveBeenCalledTimes(19);
	expect(hydrated.mock.calls.every((call) => call[1] === 0 && call[2] === Infinity)).toBe(true);
	expect(hydrated.mock.invocationCallOrder[0]).toBeLessThan(queried.mock.invocationCallOrder[0]!);
	for (const [i, call] of rendered.mock.calls.entries()) {
		const rootRead = hydrated.mock.calls.findIndex((read) => read[0] === call[0]);
		expect(rootRead).toBeGreaterThanOrEqual(0);
		expect(hydrated.mock.invocationCallOrder[rootRead]).toBeLessThan(rendered.mock.invocationCallOrder[i]!);
	}
	expect(profile.finish().phases.read.calls).toBeGreaterThan(0);
});

it.each(['python', 'regex', 'rust', 'scm', 'typescript'])(
	'%s deep arena validation covers the same typed candidates and outcomes as objects',
	(grammar) => {
		const report = JSON.parse(
			execFileSync(
				process.execPath,
				[
					'--import',
					'tsx',
					fileURLToPath(new URL('../../cli/src/cli.ts', import.meta.url)),
					'tool',
					'bench-storage',
					grammar,
					'--validation',
					'--rounds',
					'1',
					'--warmup',
					'0',
					'--iterations',
					'1'
				],
				{ encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] }
			)
		);
		expect(report.mode).toBe('validation-storage');
		expect(report.validationSamples).toHaveLength(2);
		expect(report.validationSamples.every((sample: { grammar: string }) => sample.grammar === grammar)).toBe(true);
	},
	60_000
);
