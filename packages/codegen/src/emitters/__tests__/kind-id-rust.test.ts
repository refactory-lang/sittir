import { describe, expect, it } from 'vitest';
import { emitKindIdRust, scalarChildRows } from '../kind-id-rust.ts';
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
	return { source: emitKindIdRust({ grammar, nodeMap, generatedIdTables }), idOf, nodeMap, scalarRows: scalarChildRows(nodeMap, entries) };
}

describe('scalar admission patterns', () => {
	it('preserves every admitted id and every gap when emitting ranges', async () => {
		let rangeCount = 0;
		let sparseCount = 0;
		for (const grammar of ['python', 'typescript', 'rust', 'scm', 'regex'] as const) {
			const { source, scalarRows } = await emittedKindIds(grammar);
			const patterns = [...source.matchAll(/=> matches!\(child\.0, ([\d.= |]+)\),/g)];
			expect(patterns.length, grammar).toBe(scalarRows.length);
			for (const [index, match] of patterns.entries()) {
				const admitted = match[1]!.split(' | ').flatMap((arm) => {
					const [start, end] = arm.split('..=').map(Number);
					if (end === undefined) return [start!];
					rangeCount++;
					return Array.from({ length: end - start! + 1 }, (_, offset) => start! + offset);
				});
				if (admitted.some((id, position) => position > 0 && id > admitted[position - 1]! + 1)) sparseCount++;
				expect(admitted, `${grammar} row ${index}`).toEqual(scalarRows[index]!.childIds);
			}
		}
		expect(rangeCount).toBeGreaterThan(0);
		expect(sparseCount).toBeGreaterThan(0);
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
