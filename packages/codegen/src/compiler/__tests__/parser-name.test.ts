import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
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

	it('names the native crate’s parser entry point after the grammar, not the package', () => {
		const lib = nativeCrateFiles('csharp', 'c_sharp').find((file) => file.path === 'src/lib.rs')!.contents;
		expect(lib).toContain('fn tree_sitter_c_sharp() -> *const ();');
		expect(lib).toContain('LanguageFn::from_raw(tree_sitter_c_sharp)');
		expect(lib).not.toContain('tree_sitter_csharp');
		expect(nativeCrateFiles('regex').find((file) => file.path === 'src/lib.rs')!.contents).toContain('fn tree_sitter_regex()');
	});
});
