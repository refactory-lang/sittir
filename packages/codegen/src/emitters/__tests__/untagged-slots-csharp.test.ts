import { describe, expect, it } from 'vitest';
import { emitReadyModel } from '../../__tests__/helpers/emit-ready-model.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';
import { queryRoutesOf } from '../client-utils.ts';
import { emitRenderModule, grammarRenderInputs } from '../render-module.ts';
import { runTemplateEmitter } from '../templates.ts';

interface ReaderEmit {
	readonly nodeMap: Awaited<ReturnType<typeof emitReadyModel>>['nodeMap'];
	readonly halts: readonly GrammarDiagnostic[];
	readonly nodeRs: string;
}

async function readerEmit(grammar: string): Promise<ReaderEmit> {
	const { raw, nodeMap, kindEntries, generatedIdTables, renderRules, joins } = await emitReadyModel(grammar);
	const templates = runTemplateEmitter({ grammar, nodeMap, kindEntries, renderRules, joins });
	try {
		const emitted = emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
			...grammarRenderInputs(grammar, { renderRules, renderAs: raw.renderAs, options: raw.options, joins }),
			envelopePins: undefined
		});
		return { nodeMap, halts: [], nodeRs: emitted.nodeRs.contents };
	} catch (error) {
		if (error instanceof EmitHaltedError) return { nodeMap, halts: error.blocking as readonly GrammarDiagnostic[], nodeRs: '' };
		throw error;
	}
}

let csharp: Promise<ReaderEmit> | undefined;
const csharpEmit = (): Promise<ReaderEmit> => (csharp ??= readerEmit('csharp'));

describe("C#'s reader", () => {
	it(
		'gives every untagged kind one slot in parenthesized_pattern_with_designation, whose pattern and designation both admit discard',
		async () => {
			const { halts } = await csharpEmit();
			expect(halts.filter((d) => d.code === 'untagged-slot-ambiguous').map((d) => d.ownerKind)).toEqual([]);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		"routes recursive_pattern's variable_designation by its field for an identifier and by its kind for a discard or a parenthesized designation",
		async () => {
			const { nodeMap } = await csharpEmit();
			const slot = nodeMap.nodes.get('recursive_pattern')!.slots.find((s) => s.storageName === 'variable_designation')!;
			expect(queryRoutesOf(slot, nodeMap)).toEqual({ fields: ['name'], kinds: ['discard', 'parenthesized_variable_designation'] });
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		'reads that slot both tagged and untagged in the emitted node struct',
		async () => {
			const { halts, nodeRs } = await csharpEmit();
			expect(halts).toEqual([]);
			const struct = nodeRs.slice(nodeRs.indexOf('pub struct RecursivePatternNode {'));
			expect(struct.slice(0, struct.indexOf('\n}'))).toContain('#[slot(field = field::NAME, untagged,');
		},
		FULL_PIPELINE_TIMEOUT
	);
});
