import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeSittirGrammarPackage } from '../../codegen/src/compiler/__tests__/_sittir-grammar.ts';
import { generatedLayerReport } from '../src/inventory/index.ts';

const tmp = vi.hoisted(() => ({ dir: '' }));

// Only the 'grammars' surface is redirected: the temp package stands in for 'tmp'; every other name stays real.
vi.mock('../src/codegen-surface.ts', async (importOriginal) => {
	const real = await importOriginal<typeof import('../src/codegen-surface.ts')>();
	const load = async (module: string) => {
		if (module !== 'grammars') return real.load(module as never);
		const grammars = await real.load('grammars');
		return {
			...grammars,
			grammarPackage: (name: string, dir?: string) =>
				name === 'tmp' ? grammars.grammarPackage('tmp', tmp.dir) : grammars.grammarPackage(name, dir)
		};
	};
	return { ...real, load: load as typeof real.load };
});

const BASE =
	"module.exports = grammar({ name: 'demo', extras: ($) => [], rules: { source: ($) => repeat($.word), word: () => /[a-z]+/, program: ($) => repeat(choice($.item, $.a, $.b)), a: ($) => seq('(', $.item), b: ($) => seq('[', $.item), item: ($) => $.word } });\n";

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'generated-layer-'));
	tmp.dir = dir;
	writeFileSync(join(dir, 'base.js'), BASE);
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));
	const upstream = join(dir, 'node_modules', 'tree-sitter-tmp');
	mkdirSync(upstream, { recursive: true });
	writeFileSync(join(upstream, 'package.json'), JSON.stringify({ name: 'tree-sitter-tmp', version: '0.0.0' }));
	writeFileSync(
		join(upstream, 'tree-sitter.json'),
		JSON.stringify({ grammars: [{ name: 'tmp', 'file-types': ['tmp'] }] })
	);
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("--check reports a generated layer that is not enrich's fixpoint", () => {
	it('a generated layer with a non-fixpoint created rule fails the report, with the diagnostic and proposal', async () => {
		writeSittirGrammarPackage(dir, join(dir, 'base.js'), 'demo', '', undefined, {
			bindings: 'generated: true, rules: { pair: ($) => seq(alias($.a, $.shown), alias($.b, $.shown)) }'
		} as never);
		const report = await generatedLayerReport(['tmp' as never]);
		expect(report.failed).toBe(true);
		expect(report.text).toContain("tmp: grammar.bindings.ts is not enrich's fixpoint over grammar.sittir.ts");
		expect(report.text).toContain('layer-not-enrich-fixpoint');
		expect(report.text).toContain("Write what enrich changes in pair into the layer's entries.");
	}, 120_000);

	it('the same layer made a fixpoint passes the report', async () => {
		writeSittirGrammarPackage(dir, join(dir, 'base.js'), 'demo', '', undefined, {
			bindings: "generated: true, rules: { pair: ($) => seq('(', ')') }"
		} as never);
		const report = await generatedLayerReport(['tmp' as never]);
		expect(report.failed).toBe(false);
		expect(report.text).toContain("is enrich's fixpoint");
	}, 120_000);
});
