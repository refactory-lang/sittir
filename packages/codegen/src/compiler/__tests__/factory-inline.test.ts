import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { assertEmittable } from '../emit-gate.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { wire } from '../../dsl/wire/wire.ts';
import type { AssembledNodeMap } from '../assemble.ts';

// evaluate() reads a module from disk, so an inline grammar has to become a
// real file. The chain below mirrors generate()'s own phase order, including
// the assertEmittable gate that turns a blocking diagnostic into a throw.
async function compileGrammarSource(source: string): Promise<AssembledNodeMap> {
	const dir = mkdtempSync(resolve(tmpdir(), 'sittir-factory-inline-'));
	const entry = resolve(dir, 'grammar.js');
	writeFileSync(entry, source, 'utf8');
	try {
		const diagnostics = new DiagnosticSink();
		const raw = await evaluate(entry);
		const normalized = normalizeGrammar(link(raw, { diagnostics }));
		const nodeMap = assemble(AssembleCtx.from(normalized, undefined, diagnostics));
		assertEmittable(nodeMap, diagnostics);
		return nodeMap;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const nestableGrammar = (factoryInline: string): string =>
	`module.exports = grammar({
  name: "fi",
  rules: {
    root: ($) => seq($.visibility, "x"),
    visibility: ($) => seq("pub", optional($.in_path)),
    in_path: ($) => seq("(", "in", $.path, ")"),
    path: ($) => /[a-z]+/
  }${factoryInline}
});\n`;

describe('factoryInline', () => {
	it('threads the wire config section onto the wired opts', () => {
		const factoryInline = ($: Record<string, unknown>): unknown[] => [$.in_path];
		const wired = wire({ name: 'fi', rules: { root: () => 'x' }, factoryInline });
		expect(wired.factoryInline).toBe(factoryInline);
	});

	it('collects the declared names onto the raw grammar', async () => {
		const dir = mkdtempSync(resolve(tmpdir(), 'sittir-factory-inline-raw-'));
		const entry = resolve(dir, 'grammar.js');
		writeFileSync(entry, nestableGrammar(',\n  factoryInline: ($) => [$.in_path]'), 'utf8');
		try {
			const raw = await evaluate(entry);
			expect(raw.factoryInline).toEqual(['in_path']);
			expect(link(raw).factoryInline).toEqual(new Set(['in_path']));
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('stamps the attribute on the listed kind and nothing else', async () => {
		const nodeMap = await compileGrammarSource(nestableGrammar(',\n  factoryInline: ($) => [$.in_path]'));
		expect(nodeMap.nodes.get('in_path')?.factoryInline).toBe(true);
		expect(nodeMap.nodes.get('visibility')?.factoryInline).toBe(false);
		expect(nodeMap.nodes.get('root')?.factoryInline).toBe(false);
	});

	it('leaves every node unstamped when the section is absent', async () => {
		const nodeMap = await compileGrammarSource(nestableGrammar(''));
		for (const node of nodeMap.nodes.values()) expect(node.factoryInline).toBe(false);
	});

	it('rejects an inline kind that is the grammar root', async () => {
		await expect(compileGrammarSource(nestableGrammar(',\n  factoryInline: ($) => [$.root]'))).rejects.toThrow(
			/factory-inline-unnestable/
		);
	});

	it('rejects an inline kind referenced by no slot', async () => {
		await expect(
			compileGrammarSource(
				`module.exports = grammar({
  name: "fi",
  rules: {
    root: ($) => seq($.visibility, "x"),
    visibility: ($) => "pub",
    orphan: ($) => "y"
  },
  factoryInline: ($) => [$.orphan]
});\n`
			)
		).rejects.toThrow(/factory-inline-unnestable/);
	});

	it('rejects an inline kind reachable through a supertype outside its own parents', async () => {
		await expect(
			compileGrammarSource(
				`module.exports = grammar({
  name: "fi",
  supertypes: ($) => [$._item],
  rules: {
    root: ($) => seq($.holder, $._item),
    holder: ($) => seq("(", $.in_path, ")"),
    _item: ($) => choice($.in_path, $.path),
    in_path: ($) => seq("in", $.path),
    path: ($) => /[a-z]+/
  },
  factoryInline: ($) => [$.in_path]
});\n`
			)
		).rejects.toThrow(/factory-inline-unnestable/);
	});
});
