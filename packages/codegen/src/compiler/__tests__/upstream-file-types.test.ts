import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { grammarPackage, grammarPackages, sittirDirOf } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { packageEntryPath, packageGrammarJsPath, packageSourceEntry } from '../resolve-grammar.ts';
import { upstreamFileTypes } from '../upstream-file-types.ts';

const CENSUS: Readonly<Record<string, readonly string[]>> = {
	rust: ['rs'],
	typescript: ['ts'],
	python: ['py'],
	scm: ['scm'],
	regex: []
};

describe('the file types every grammar package declares', () => {
	for (const [name, expected] of Object.entries(CENSUS)) {
		it(`${name}: ${JSON.stringify(expected)}, from its upstream package and in its generated tree-sitter.json`, () => {
			const pkg = grammarPackage(name);
			expect(upstreamFileTypes(pkg)).toEqual(expected);
			const generated = JSON.parse(readFileSync(join(sittirDirOf(pkg), 'tree-sitter.json'), 'utf8')) as {
				grammars: { 'file-types': string[] }[];
			};
			expect(generated.grammars[0]!['file-types']).toEqual(expected);
		});
	}

	it('the census covers every grammar package', () => {
		expect(grammarPackages().map((pkg) => pkg.name).sort()).toEqual(Object.keys(CENSUS).sort());
	});
});

describe('evaluating a grammar package', () => {
	it('stamps the package file types on the raw grammar and its stages, whichever entry it evaluates', async () => {
		const pkg = grammarPackage('rust');
		for (const options of [undefined, { base: true }]) {
			const raw = await evaluatePackage(pkg, options);
			expect(raw.fileTypes).toEqual(['rs']);
			for (const stage of Object.values(raw.stages ?? {})) expect(stage.grammar.fileTypes).toEqual(['rs']);
		}
	}, 120_000);

	it('takes the overrides entry unless the base is asked for', () => {
		const pkg = grammarPackage('rust');
		expect(packageSourceEntry(pkg)).toBe(packageEntryPath(pkg));
		expect(packageSourceEntry(pkg, { base: true })).toBe(packageGrammarJsPath(pkg));
	});
});

describe('choosing the upstream entry', () => {
	const root = mkdtempSync(join(tmpdir(), 'sittir-file-types-'));
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	function pkgWith(name: string, grammars: unknown[] | undefined) {
		const dir = join(root, name);
		const upstream = join(dir, 'node_modules', `tree-sitter-${name}`);
		mkdirSync(upstream, { recursive: true });
		writeFileSync(join(dir, 'package.json'), '{}');
		writeFileSync(join(upstream, 'package.json'), '{"name":"x","version":"0.0.0"}');
		if (grammars !== undefined) writeFileSync(join(upstream, 'tree-sitter.json'), JSON.stringify({ grammars }));
		return { name, dir, stable: false, displayName: undefined };
	}

	it('takes the only entry whatever its name', () => {
		expect(upstreamFileTypes(pkgWith('solo', [{ name: 'query', 'file-types': ['scm'] }]))).toEqual(['scm']);
	});

	it('takes the entry named as the grammar when there are several, not the first or a union', () => {
		const pkg = pkgWith('multi', [
			{ name: 'other', 'file-types': ['o'] },
			{ name: 'multi', 'file-types': ['m'] },
			{ name: 'third', 'file-types': ['t'] }
		]);
		expect(upstreamFileTypes(pkg)).toEqual(['m']);
	});

	it('refuses several entries when none is named as the grammar', () => {
		const pkg = pkgWith('lost', [{ name: 'a' }, { name: 'b' }]);
		expect(() => upstreamFileTypes(pkg)).toThrow(/declares 2 grammars and none is named "lost"/);
	});

	it('gives none for an entry that declares no file types (absent or null), and refuses a malformed list', () => {
		expect(upstreamFileTypes(pkgWith('bare', [{ name: 'bare' }]))).toEqual([]);
		expect(upstreamFileTypes(pkgWith('nulled', [{ name: 'nulled', 'file-types': null }]))).toEqual([]);
		expect(() => upstreamFileTypes(pkgWith('bad', [{ name: 'bad', 'file-types': [1] }]))).toThrow(/not a list of strings/);
	});

	it('refuses an upstream package with no tree-sitter.json', () => {
		expect(() => upstreamFileTypes(pkgWith('none', undefined))).toThrow(/has no tree-sitter.json/);
	});
});
