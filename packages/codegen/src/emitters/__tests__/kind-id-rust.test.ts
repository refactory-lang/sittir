import { describe, expect, it } from 'vitest';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import type { GrammarName } from '../../grammars.ts';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';


async function emittedKindIds(grammar: GrammarName) {
	const raw = await evaluatePackage(grammarPackage(grammar));
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	if (generatedIdTables === undefined) throw new Error(`no generated id tables for ${grammar}`);
	const linked = link(raw, { generatedIdTables });
	const nodeMap = assemble(
		AssembleCtx.from(normalizeGrammar(linked), generatedIdTables)
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

describe('facts the wrap layer owns', () => {
	it('emits no slot-separator or anonymous-children table for the reader', async () => {
		for (const grammar of ['python', 'typescript', 'rust'] as const) {
			const { source } = await emittedKindIds(grammar);
			expect(source).not.toContain('SLOT_SEPARATORS');
			expect(source).not.toContain('is_slot_separator');
			expect(source).not.toContain('keeps_anonymous_children');
		}
	});
});
