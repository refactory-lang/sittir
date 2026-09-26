import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../../compiler/resolve-grammar.ts';
import { loadGrammarJsonAliasMap } from '../../compiler/inline-sets.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import type { GrammarName } from '../../grammars.ts';

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url)).replace(/\/$/, '');

async function emittedKindIds(grammar: GrammarName) {
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : resolveGrammarJsPath(grammar);
	const raw = await evaluate(entryPath);
	const generatedIdTables = await loadGeneratedIdTables(grammar, repoRoot);
	if (generatedIdTables === undefined) throw new Error(`no generated id tables for ${grammar}`);
	const linked = link(raw, { generatedIdTables });
	const nodeMap = assemble(
		AssembleCtx.from(normalizeGrammar(linked), generatedIdTables, undefined, loadGrammarJsonAliasMap(grammar))
	);
	const entries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
	const idOf = (kind: string): number => {
		const id = entries.find((entry) => entry.kind === kind)?.id;
		if (id === undefined) throw new Error(`no kind entry for ${kind}`);
		return id;
	};
	return { source: emitKindIdRust({ grammar, nodeMap, generatedIdTables }), idOf };
}

describe('is_text_kind', () => {
	it('names every pattern and enum kind and no token kind', async () => {
		const { source, idOf } = await emittedKindIds('rust');
		expect(source).toContain('pub fn is_text_kind(kind: KindId) -> bool {');
		const arms = source.slice(source.indexOf('pub fn is_text_kind'));
		const ids = new Set(
			(arms.slice(arms.indexOf('matches!(kind.0,'), arms.indexOf(')\n}')).match(/\d+/g) ?? []).map(Number)
		);
		// identifier is `pattern`-modeled: free text with nothing else to render from.
		expect(ids.has(idOf('identifier'))).toBe(true);
		// fragment_specifier is `enum`-modeled: its content is which literal it holds.
		expect(ids.has(idOf('fragment_specifier'))).toBe(true);
		// mutable_specifier is `token`-modeled: it renders its declared literal.
		expect(ids.has(idOf('mutable_specifier'))).toBe(false);
		// function_item is a branch: it rebuilds from its slots.
		expect(ids.has(idOf('function_item'))).toBe(false);
	});
});

describe('wire_slot', () => {
	it('routes an untagged child by its kind to the model slot that stores it', async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		expect(source).toContain(
			"pub fn wire_slot(parent: KindId, field: Option<&str>, child: &str) -> Option<&'static str> {"
		);
		expect(source).toContain(`(${idOf('for_in_statement')}, None, "for_header_lhs") => Some("for_header"),`);
	});
	it('routes a field-tagged child by its field when the model slot has another name', async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		expect(source).toContain(`(${idOf('enum_body_elements')}, Some("name"), _) => Some("content"),`);
		expect(source).toContain(`(${idOf('enum_body_elements')}, None, "enum_assignment") => Some("content"),`);
	});
	it('leaves a child whose key already names its slot to the parser', async () => {
		const { source } = await emittedKindIds('typescript');
		const table = source.slice(source.indexOf('pub fn wire_slot'), source.indexOf('static SLOT_SEPARATORS'));
		expect(table).not.toMatch(/, None, "([a-z_]+)"\) => Some\("\1"\)/);
	});
});

describe('is_slot_separator', () => {
	it("names a slot's field-tagged separator by the parent kind and the field", async () => {
		const { source, idOf } = await emittedKindIds('python');
		expect(source).toContain('pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {');
		const table = source.slice(source.indexOf('static SLOT_SEPARATORS'), source.indexOf('pub fn is_slot_separator'));
		expect(table).toContain(`(${idOf('for_in_clause')}, "right", &[${idOf('comma')}]),`);
	});
	it("names a literal a rule field-tags beside a singular slot, so the reader drops it as the template's own", async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		const table = source.slice(source.indexOf('static SLOT_SEPARATORS'), source.indexOf('pub fn is_slot_separator'));
		// for_statement: `field(condition, choice(seq(_expressions, ';'), empty_statement))`
		expect(table).toContain(`(${idOf('for_statement')}, "condition", &[${idOf('semi')}]),`);
	});
	it('leaves an elidable list alone: its separators place the holes', async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		const table = source.slice(source.indexOf('static SLOT_SEPARATORS'), source.indexOf('pub fn is_slot_separator'));
		expect(table).not.toContain(`(${idOf('array')}, `);
	});
});
