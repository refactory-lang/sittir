import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../../grammars.ts';
import { bootstrapDir, isBootstrapped } from '../bootstrap.ts';

const PROBE = `
import { loadPinnedBuild } from ${JSON.stringify(join(REPO_ROOT, 'packages/codegen/src/bootstrap/pinned.ts'))};
try {
	const pinned = await loadPinnedBuild();
	const engine = await pinned.common.createEngine(pinned.typescript.default, { nodeStorage: 'arena' });
	const root = engine.parse('x;\\n');
	console.log('LOADED ' + root.$type);
	engine.dispose();
} catch (error) {
	console.log('REFUSED ' + (error instanceof Error ? error.message : String(error)));
}
`;

const dir = mkdtempSync(join(tmpdir(), 'sittir-pinned-probe-'));
const probe = join(dir, 'probe.mts');
writeFileSync(probe, PROBE);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const run = (env: Record<string, string>) =>
	spawnSync('pnpm', ['exec', 'tsx', probe], { cwd: REPO_ROOT, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 120_000 });

describe.skipIf(!isBootstrapped(bootstrapDir()))('loading the pinned build in process', () => {
	it('refuses, naming the copy of @sittir/common it would run against, under the workspace tsconfig paths', () => {
		const { stdout, stderr } = run({ TSX_TSCONFIG_PATH: join(REPO_ROOT, 'tsconfig.json') });
		expect(stdout + stderr).toMatch(/^REFUSED pinned-build-unpinned: .*resolves to .*packages\/common\/src\/index\.ts, outside /m);
	}, 150_000);

	it('loads, and an arena engine from it parses, under the pinned tsconfig', () => {
		const { stdout, stderr } = run({ TSX_TSCONFIG_PATH: join(REPO_ROOT, 'packages/codegen/tsconfig.pinned.json') });
		expect(stdout + stderr).toMatch(/^LOADED \d+/m);
	}, 150_000);
});
