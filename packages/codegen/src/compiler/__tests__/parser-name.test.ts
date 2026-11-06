import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parserNameOf } from '../../grammars.ts';
import { nativeCrateFiles } from '../../emitters/native-crate.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

describe('the tree-sitter grammar name is upstream’s, and the package name is a separate fact', () => {
	it('is the name the upstream grammar declares when the wire layer does not pin one', async () => {
		const raw = await evaluateTempGrammar({ name: 'two_words', extras: '/\\s/', rules: '' }, '');
		expect(raw.name).toBe('two_words');
	}, 60_000);

	it('is read from the generated grammar.json, falling back to the package name before one exists', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-parser-name-'));
		try {
			expect(parserNameOf({ dir, name: 'csharp' })).toBe('csharp');
			mkdirSync(join(dir, '.sittir', 'src'), { recursive: true });
			writeFileSync(join(dir, '.sittir', 'src', 'grammar.json'), JSON.stringify({ name: 'c_sharp' }));
			expect(parserNameOf({ dir, name: 'csharp' })).toBe('c_sharp');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	describe('from the upstream package’s tree-sitter.json', () => {
		const root = mkdtempSync(join(tmpdir(), 'sittir-parser-name-upstream-'));
		afterAll(() => rmSync(root, { recursive: true, force: true }));
		const pkgWith = (name: string, config: string | undefined) => {
			const dir = join(root, name);
			const upstream = join(dir, 'node_modules', `tree-sitter-${name}`);
			mkdirSync(upstream, { recursive: true });
			writeFileSync(join(upstream, 'package.json'), '{"name":"x","version":"0.0.0"}');
			if (config !== undefined) writeFileSync(join(upstream, 'tree-sitter.json'), config);
			return { dir, name };
		};

		it('is the declared name of the only grammar', () => {
			expect(parserNameOf(pkgWith('solo', '{"grammars":[{"name":"c_sharp"}]}'))).toBe('c_sharp');
		});

		it('falls back to the package name only for a package with no upstream tree-sitter.json', () => {
			expect(parserNameOf(pkgWith('bare', undefined))).toBe('bare');
		});

		it('refuses several grammars when none is named for the package, rather than guessing', () => {
			expect(() => parserNameOf(pkgWith('lost', '{"grammars":[{"name":"a"},{"name":"b"}]}'))).toThrow(/declares 2 grammars and none is named "lost"/);
		});

		it('refuses a malformed tree-sitter.json and an entry with no name', () => {
			expect(() => parserNameOf(pkgWith('broken', '{'))).toThrow(SyntaxError);
			expect(() => parserNameOf(pkgWith('nameless', '{"grammars":[{"file-types":["x"]}]}'))).toThrow(/has no name/);
		});
	});

	it('names the native crate’s parser entry point after the grammar, not the package', () => {
		const lib = nativeCrateFiles('csharp', 'c_sharp').find((file) => file.path === 'src/lib.rs')!.contents;
		expect(lib).toContain('fn tree_sitter_c_sharp() -> *const ();');
		expect(lib).toContain('LanguageFn::from_raw(tree_sitter_c_sharp)');
		expect(lib).not.toContain('tree_sitter_csharp');
		expect(nativeCrateFiles('regex').find((file) => file.path === 'src/lib.rs')!.contents).toContain('fn tree_sitter_regex()');
	});
});
