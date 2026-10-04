import { describe, expect, it } from 'vitest';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { slotRoutesOf } from '../shared.ts';
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
	return { source: emitKindIdRust({ grammar, nodeMap, generatedIdTables }), idOf, nodeMap };
}

describe('slot routes', () => {
	const routesOf = (nodeMap: Awaited<ReturnType<typeof emittedKindIds>>['nodeMap'], kind: string) =>
		slotRoutesOf(nodeMap.nodes.get(kind)!, nodeMap);
	it('routes an untagged child by its kind to the model slot that stores it', async () => {
		const { nodeMap } = await emittedKindIds('typescript');
		expect(routesOf(nodeMap, 'for_in_statement')).toMatchObject({ for_header_lhs: 'for_header' });
	}, FULL_PIPELINE_TIMEOUT);
	it('routes each arm of a union slot by its kind', async () => {
		const { nodeMap } = await emittedKindIds('typescript');
		expect(routesOf(nodeMap, 'export_statement_default_declaration')).toMatchObject({
			export_statement_default_declaration_default_kw: 'content',
			function_declaration: 'content'
		});
	}, FULL_PIPELINE_TIMEOUT);
	it('leaves a child whose key already names its slot unrouted', async () => {
		const { nodeMap } = await emittedKindIds('typescript');
		for (const [kind] of nodeMap.nodes) {
			for (const [key, slot] of Object.entries(routesOf(nodeMap, kind))) expect(key, kind).not.toBe(slot);
		}
	}, FULL_PIPELINE_TIMEOUT);
	it('gives the reader no routing table', async () => {
		for (const grammar of ['python', 'typescript', 'rust', 'scm', 'regex'] as const) {
			const { source } = await emittedKindIds(grammar);
			expect(source, grammar).not.toContain('pub fn wire_slot');
		}
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
