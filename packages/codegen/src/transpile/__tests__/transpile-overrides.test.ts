import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { transpileOverrides } from '../transpile-overrides.ts';
import { runTreeSitterCliCapturing } from '../tree-sitter-cli.ts';
import { grammarPackage, sittirDirOf } from '../../grammars.ts';
import { packageEntryPath } from '../../compiler/resolve-grammar.ts';
import { evaluateDsl } from '../../compiler/evaluate.ts';

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
			const upstream = join(dir, 'node_modules', 'tree-sitter-probe');
			mkdirSync(upstream, { recursive: true });
			writeFileSync(join(upstream, 'package.json'), '{"name":"tree-sitter-probe","version":"0.0.0"}');
			writeFileSync(join(upstream, 'tree-sitter.json'), '{"grammars":[{"name":"probe","file-types":["probe"]}]}');
			const pkg = grammarPackage('probe', dir);
			writeFileSync(packageEntryPath(pkg), entryOf('first'));
			transpileOverrides({ package: pkg });
			expect(JSON.parse(readFileSync(join(sittirDirOf(pkg), 'tree-sitter.json'), 'utf8')).grammars[0]['file-types']).toEqual(['probe']);
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

describe('both grammar runtimes evaluate the name lists and word after the rules', () => {
	const entry = `let ran = false;
const pick = (after: unknown, before: unknown): unknown => (ran ? after : before);
export default grammar({
	name: 'probe',
	externals: ($: any) => [pick($.ext_after, $.ext_before)],
	extras: ($: any) => [pick($.extra_after, $.extra_before)],
	word: ($: any) => pick($.word_after, $.word_before),
	inline: ($: any) => [pick($._inline_after, $._inline_before)],
	supertypes: ($: any) => [pick($._super_after, $._super_before)],
	conflicts: ($: any) => [[pick($.word_after, $.word_before), $.source_file]],
	precedences: () => [[pick('after', 'before'), 'other']],
	reserved: { global: ($: any) => [pick($.extra_after, $.extra_before)] },
	rules: {
		source_file: ($: any) => {
			ran = true;
			return seq($.word_after, $.word_before, $._inline_after, $._inline_before, $._super_after, $._super_before);
		},
		word_after: () => /[a-z]+/,
		word_before: () => /[A-Z]+/,
		extra_after: () => '#',
		extra_before: () => '%',
		_inline_after: ($: any) => seq('a', $.word_after),
		_inline_before: ($: any) => seq('b', $.word_after),
		_super_after: ($: any) => choice($.word_after, $.word_before),
		_super_before: ($: any) => choice($.word_before, $.word_after)
	}
} as never);
`;
	const names = (list: unknown): string => JSON.stringify(list);

	function expectOrder(g: Record<string, unknown>): void {
		expect(names(g.extras)).toContain('extra_after');
		expect(names(g.word)).toContain('word_after');
		expect(names(g.inline)).toContain('_inline_after');
		expect(names(g.supertypes)).toContain('_super_after');
		expect(names(g.conflicts)).toContain('word_after');
		expect(names(g.precedences)).toContain('after');
		expect(names(g.reserved)).toContain('extra_after');
	}

	it('holds for tree-sitter and for sittir; tree-sitter reads externals before any rule', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-list-order-'));
		try {
			const upstream = join(dir, 'node_modules', 'tree-sitter-probe');
			mkdirSync(upstream, { recursive: true });
			writeFileSync(join(upstream, 'package.json'), '{"name":"tree-sitter-probe","version":"0.0.0"}');
			writeFileSync(join(upstream, 'tree-sitter.json'), '{"grammars":[{"name":"probe","file-types":["probe"]}]}');
			const pkg = grammarPackage('probe', dir);
			writeFileSync(packageEntryPath(pkg), entry);
			transpileOverrides({ package: pkg });
			const run = runTreeSitterCliCapturing(['generate', '--no-parser'], sittirDirOf(pkg));
			expect(run.status, run.stderr).toBe(0);
			const ts: Record<string, unknown> = JSON.parse(readFileSync(join(sittirDirOf(pkg), 'src', 'grammar.json'), 'utf8'));
			const st = (await evaluateDsl(packageEntryPath(pkg))) as unknown as Record<string, unknown>;
			expectOrder(ts);
			expectOrder(st);
			expect(names(ts.externals)).toContain('ext_before');
			// sittir differs from tree-sitter here: it evaluates externals after the rules.
			expect(names(st.externals)).toContain('ext_after');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
