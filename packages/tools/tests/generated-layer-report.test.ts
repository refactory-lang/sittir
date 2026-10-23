import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeSittirGrammarPackage } from '../../codegen/src/__tests__/helpers/sittir-grammar.ts';
import { generatedLayerReport } from '../src/inventory/index.ts';
import { REGENERATE_BINDINGS_COMMAND } from '../../codegen/src/bindings/hash.ts';

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

// The layer's staleness check finds its package directory through the grammars module, from the inventory and from codegen's bindings alike.
vi.mock('@sittir/codegen/grammars', async (importOriginal) => {
	const real = await importOriginal<Record<string, unknown>>();
	const packageDir = real.grammarPackageDir as (name: string) => string;
	return { ...real, grammarPackageDir: (name: string) => (name === 'tmp' ? tmp.dir : packageDir(name)) };
});
vi.mock('../../codegen/src/grammars.ts', async (importOriginal) => {
	const real = await importOriginal<Record<string, unknown>>();
	const packageDir = real.grammarPackageDir as (name: string) => string;
	return { ...real, grammarPackageDir: (name: string) => (name === 'tmp' ? tmp.dir : packageDir(name)) };
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

describe("--check reports a generated layer whose grammar.bindings.ts is stale against bindings.scm", () => {
	it('a committed hash that is not the current bindings.scm fails the report with the staleness line and the regeneration command', async () => {
		writeSittirGrammarPackage(dir, join(dir, 'base.js'), 'demo', '', undefined, {
			bindings: "generated: true, rules: { pair: ($) => seq('(', ')') }"
		} as never);
		writeFileSync(join(dir, 'bindings.scm'), '(identifier) @identifier\n');
		writeFileSync(join(dir, 'grammar.bindings.ts'), 'export const hash = "stale";\n');
		const report = await generatedLayerReport(['tmp' as never]);
		expect(report.failed).toBe(true);
		expect(report.text).toContain('tmp: grammar.bindings.ts is stale against bindings.scm and the vocabulary');
		expect(report.text).toContain(REGENERATE_BINDINGS_COMMAND);
	}, 120_000);
});
