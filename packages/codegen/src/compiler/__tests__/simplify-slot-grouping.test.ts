import { DiagnosticSink } from '../../types/diagnostics.ts';
import { describe, it, expect } from 'vitest';
import { computeSimplifiedRules, makeSlotGroupingCollector, SimplifyCtx, makeNormalizedGrammar } from '../simplify.ts';
import type { RenderRule } from '../../types/rule.ts';
import type { SlotGroupingDiagnostic } from '../diagnostics/slot-grouping.ts';

describe('computeSimplifiedRules — slot-grouping diagnostic wiring', () => {
	it('normal multi-field rule body → SILENT (not in inlineKinds, not in slot position)', () => {
		// A normal rule like assignment_expression with seq(left, '=', right)
		// must NOT fire — the rule body is not in slot position.
		const normalizedRules: Record<string, RenderRule> = {
			assignment_expression: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'left', fieldName: 'left' } as any,
					{ type: 'STRING', value: '=' } as any,
					{ type: 'SYMBOL', name: 'right', fieldName: 'right' } as any
				]
			} as any
		};
		const slotGroupingCollector = makeSlotGroupingCollector();
		computeSimplifiedRules(
			new SimplifyCtx({
				grammar: makeNormalizedGrammar(normalizedRules),
				diagnostics: new DiagnosticSink(),
				slotGroupingCollector
			})
		);
		expect(slotGroupingCollector.all.filter((d) => d.code === 'multi-slot-nested-seq')).toHaveLength(0);
	});

	it('a rule with no multi-slot substructure produces no diagnostics', () => {
		const normalizedRules: Record<string, RenderRule> = {
			simple: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'fn' },
					{ type: 'SYMBOL', name: 'name' }
				]
			} as any
		};
		const slotGroupingCollector = makeSlotGroupingCollector();
		computeSimplifiedRules(
			new SimplifyCtx({
				grammar: makeNormalizedGrammar(normalizedRules),
				diagnostics: new DiagnosticSink(),
				slotGroupingCollector
			})
		);
		expect(slotGroupingCollector.all).toHaveLength(0);
	});
});
