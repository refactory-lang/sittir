import { describe, expect, it } from 'vitest';
import { emitReadyModel } from '../../__tests__/helpers/emit-ready-model.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';
import { emitRenderModule, grammarRenderInputs } from '../render-module.ts';
import { runTemplateEmitter } from '../templates.ts';

async function readerHalts(grammar: string): Promise<readonly GrammarDiagnostic[]> {
	const { raw, nodeMap, kindEntries, generatedIdTables, renderRules, joins } = await emitReadyModel(grammar);
	const templates = runTemplateEmitter({ grammar, nodeMap, kindEntries, renderRules, joins });
	try {
		emitRenderModule(grammar, templates, nodeMap, generatedIdTables, {
			...grammarRenderInputs(grammar, { renderRules, renderAs: raw.renderAs, options: raw.options, joins }),
			envelopePins: undefined
		});
	} catch (error) {
		if (error instanceof EmitHaltedError) return error.blocking as readonly GrammarDiagnostic[];
		throw error;
	}
	return [];
}

describe("C#'s reader", () => {
	it(
		'gives every untagged kind one slot in parenthesized_pattern_with_designation, whose pattern and designation both admit discard',
		async () => {
			const halts = await readerHalts('csharp');
			expect(halts.filter((d) => d.code === 'untagged-slot-ambiguous').map((d) => d.ownerKind)).toEqual([]);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
