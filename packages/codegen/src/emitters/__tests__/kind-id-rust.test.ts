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
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';


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

describe('wire_slot', () => {
	it('routes an untagged child by its kind to the model slot that stores it', async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		expect(source).toContain(
			"pub fn wire_slot(parent: KindId, field: Option<&str>, child: &str) -> Option<&'static str> {"
		);
		expect(source).toContain(`(${idOf('for_in_statement')}, None, "for_header_lhs") => Some("for_header"),`);
	}, FULL_PIPELINE_TIMEOUT);
	it('routes a field-tagged child by its field when the model slot has another name', async () => {
		const { source, idOf } = await emittedKindIds('typescript');
		const owner = idOf('export_statement_default_declaration');
		expect(source).toContain(`(${owner}, Some("declaration"), _) => Some("content"),`);
		expect(source).toContain(`(${owner}, None, "export_statement_default_declaration_default_kw") => Some("content"),`);
	}, FULL_PIPELINE_TIMEOUT);
	it('leaves a child whose key already names its slot to the parser', async () => {
		const { source } = await emittedKindIds('typescript');
		const table = source.slice(source.indexOf('pub fn wire_slot'), source.indexOf('static SLOT_SEPARATORS'));
		expect(table).not.toMatch(/, None, "([a-z_]+)"\) => Some\("\1"\)/);
	}, FULL_PIPELINE_TIMEOUT);
});

describe('facts the wrap layer owns', () => {
	it('emits no slot-separator or anonymous-children table for the reader', async () => {
		for (const grammar of ['python', 'typescript', 'rust'] as const) {
			const { source } = await emittedKindIds(grammar);
			expect(source).not.toContain('SLOT_SEPARATORS');
			expect(source).not.toContain('is_slot_separator');
			expect(source).not.toContain('keeps_anonymous_children');
		}
	}, FULL_PIPELINE_TIMEOUT);
});
