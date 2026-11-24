import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { staleBuilds } from '../built.ts';

const TSRS = join(REPO_ROOT, 'node_modules', '.bin', 'tsrs');

describe('staleBuilds', () => {
	let root: string;
	let projects: Record<'dependency' | 'measured' | 'unrelated', string>;

	function project(name: string, references: readonly string[]): string {
		const dir = join(root, name);
		mkdirSync(join(dir, 'src'), { recursive: true });
		writeFileSync(join(dir, 'src', 'index.ts'), `export const ${name} = 1;\n`);
		writeFileSync(
			join(dir, 'tsconfig.build.json'),
			JSON.stringify({
				compilerOptions: { composite: true, rootDir: 'src', outDir: 'dist', module: 'nodenext', target: 'es2022', types: [] },
				include: ['src'],
				references: references.map((reference) => ({ path: `../${reference}/tsconfig.build.json` }))
			})
		);
		return join(dir, 'tsconfig.build.json');
	}

	function edit(name: string): void {
		const source = join(root, name, 'src', 'index.ts');
		writeFileSync(source, `export const ${name} = 2;\n`);
		const later = new Date(Date.now() + 60_000);
		utimesSync(source, later, later);
	}

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'sittir-built-'));
		projects = {
			dependency: project('dependency', []),
			measured: project('measured', ['dependency']),
			unrelated: project('unrelated', [])
		};
		execFileSync(TSRS, ['--build', ...Object.values(projects)], { cwd: root });
	});

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it('passes a run whose projects are built, while a project it does not load is stale', () => {
		edit('unrelated');
		expect(staleBuilds([projects.measured])).toEqual([]);
		expect(staleBuilds([projects.unrelated])).toEqual([projects.unrelated]);
	});

	it('reports a stale project the run reaches through a reference', () => {
		edit('dependency');
		expect(staleBuilds([projects.measured])).toContain(projects.dependency);
	});
});
