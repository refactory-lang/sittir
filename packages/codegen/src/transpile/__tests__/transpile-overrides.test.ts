import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, win32 } from 'node:path';
import { reExportOf, transpileOverrides } from '../transpile-overrides.ts';
import { runTreeSitterCliCapturing } from '../tree-sitter-cli.ts';
import { grammarPackage, sittirDirOf } from '../../grammars.ts';
import { packageEntryPath } from '../../compiler/resolve-grammar.ts';

describe('transpileOverrides', () => {
	const GRAMMAR = 'python';
	const pkg = grammarPackage(GRAMMAR);
	const outputDir = sittirDirOf(pkg);

	it('writes grammar.js as a re-export of the grammar entry', () => {
		const result = transpileOverrides({ package: pkg });
		expect(result.outputPath).toBe(join(outputDir, 'grammar.js'));
		expect(readFileSync(result.outputPath, 'utf8')).toBe("export { default } from '../grammar.sittir.ts';\n");
	});

	it('writes package.json as an ES module with tree-sitter metadata', () => {
		transpileOverrides({ package: pkg });
		const manifest = JSON.parse(readFileSync(join(outputDir, 'package.json'), 'utf8'));
		expect(manifest.name).toBe(`tree-sitter-${GRAMMAR}`);
		expect(manifest.type).toBe('module');
		expect(manifest['tree-sitter'][0]).toMatchObject({ scope: `source.${GRAMMAR}` });
	});

	it('writes tree-sitter.json with ABI-15 schema', () => {
		transpileOverrides({ package: pkg });
		const cfg = JSON.parse(readFileSync(join(outputDir, 'tree-sitter.json'), 'utf8'));
		expect(cfg.$schema).toMatch(/tree-sitter\.github\.io.*config\.schema\.json/);
		expect(cfg.grammars[0].name).toBe(GRAMMAR);
		expect(cfg.grammars[0].scope).toBe(`source.${GRAMMAR}`);
		expect(cfg.metadata).toBeDefined();
	});

	it('copies the base scanner.c for grammars with external scanners', () => {
		transpileOverrides({ package: pkg });
		expect(existsSync(join(outputDir, 'src', 'scanner.c'))).toBe(true);
	});

	it('throws when grammar.sittir.ts does not exist', () => {
		expect(() => transpileOverrides({ package: grammarPackage('nonexistent-grammar-xyz') })).toThrow(
			/no grammar\.sittir\.ts/
		);
	});
});

describe('tree-sitter generate runs the grammar entry itself', () => {
	const entryOf = (literal: string): string =>
		`const source = (_$: unknown): string => '${literal}';\nexport default grammar({ name: 'probe', rules: { source_file: source } });\n`;

	it('reflects an edit to the entry with no step between the edit and generate', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-native-esm-'));
		try {
			mkdirSync(dir, { recursive: true });
			const pkg = grammarPackage('probe', dir);
			writeFileSync(packageEntryPath(pkg), entryOf('first'));
			transpileOverrides({ package: pkg });
			const generatedRule = (): unknown => {
				const run = runTreeSitterCliCapturing(['generate', '--no-parser'], sittirDirOf(pkg));
				expect(run.status, run.stderr).toBe(0);
				return JSON.parse(readFileSync(join(sittirDirOf(pkg), 'src', 'grammar.json'), 'utf8')).rules.source_file;
			};
			expect(generatedRule()).toEqual({ type: 'STRING', value: 'first' });
			writeFileSync(packageEntryPath(pkg), entryOf('second'));
			expect(generatedRule()).toEqual({ type: 'STRING', value: 'second' });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});

describe('reExportOf', () => {
	it('writes a posix specifier for a Windows relative path', () => {
		const relativeEntry = win32.relative('C:\\repo\\packages\\python\\.sittir', 'C:\\repo\\packages\\python\\grammar.sittir.ts');
		expect(relativeEntry).toBe('..\\grammar.sittir.ts');
		expect(reExportOf(relativeEntry)).toBe("export { default } from '../grammar.sittir.ts';\n");
	});

	it('anchors a same-directory entry with ./', () => {
		expect(reExportOf('grammar.sittir.ts')).toBe("export { default } from './grammar.sittir.ts';\n");
	});
});
