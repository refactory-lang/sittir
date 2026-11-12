import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NODE_ENGINES, REPO_ROOT } from '@sittir/codegen/grammars';
import { grammarPackageFiles } from '../src/bootstrap/templates.ts';

const manifestPaths = [
	'package.json',
	...['packages', 'rust/crates']
		.flatMap((dir) => readdirSync(join(REPO_ROOT, dir), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => join(dir, entry.name, 'package.json')))
		.filter((path) => readdirSync(join(REPO_ROOT, path, '..')).includes('package.json'))
];

const engineOf = (json: string): string | undefined => (JSON.parse(json) as { engines?: { node?: string } }).engines?.node;

describe('every package declares the one Node floor', () => {
	it.each(manifestPaths)('%s', (path) => {
		expect(engineOf(readFileSync(join(REPO_ROOT, path), 'utf8'))).toBe(NODE_ENGINES);
	});

	it('a bootstrapped grammar package declares it', () => {
		const manifest = grammarPackageFiles({ name: 'sample', Name: 'Sample', upstreamDependency: 'tree-sitter-sample', upstreamRange: '^0.1.0' }).find((file) => file.path === 'package.json')!;
		expect(engineOf(manifest.contents)).toBe(NODE_ENGINES);
	});
});
