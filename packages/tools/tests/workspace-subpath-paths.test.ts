import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const tsconfigPaths = (): ReadonlySet<string> => {
	const text = readFileSync(`${ROOT}tsconfig.json`, 'utf8')
		.replace(/^\s*\/\/.*$/gm, '')
		.replace(/,(\s*[}\]])/g, '$1');
	return new Set(Object.keys((JSON.parse(text) as { compilerOptions: { paths: Record<string, unknown> } }).compilerOptions.paths));
};

const subpathImports = (): ReadonlySet<string> => {
	const files = execFileSync('git', ['ls-files', 'packages/*/src/*.ts', 'packages/*/src/**/*.ts', 'packages/*/tests/**/*.ts', 'scripts/*.mts'], {
		cwd: ROOT,
		encoding: 'utf8'
	})
		.split('\n')
		.filter((f) => f !== '');
	const out = new Set<string>();
	for (const file of files)
		for (const m of readFileSync(`${ROOT}${file}`, 'utf8').matchAll(/(?:from|import\()\s*['"](@sittir\/[a-z-]+\/[^'"]+)['"]/g)) out.add(m[1]!);
	return out;
};

describe('workspace subpath imports', () => {
	it('each resolve to source through a root tsconfig path, so tsx never falls back to an unbuilt dist', () => {
		const paths = tsconfigPaths();
		expect([...subpathImports()].filter((spec) => !paths.has(spec)).sort()).toEqual([]);
	});
});
