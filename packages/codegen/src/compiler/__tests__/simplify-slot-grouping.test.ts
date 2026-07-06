/**
 * Task 4: verify that `computeSimplifiedRules` wires `diagnoseSlotGrouping`
 * and surfaces records via the drain function.
 *
 * Production signal: auto-group helpers (kinds in `inlineKinds`) have their
 * top-level body treated as a slot-position seq. Normal rule bodies are silent.
 *
 * Note: `computeSimplifiedRules` runs `deleteWrapper` which pushes repeat/
 * optional wrappers down to leaf attributes. There are no `repeat` nodes in
 * the final simplified output — so shape ① fires only via:
 *   a. A kind in `inlineKinds` whose top-level body seq has ≥2 slots, OR
 *   b. A seq that is a direct member of a `choice` arm (choice arms remain).
 */

import { DiagnosticSink } from '../../types/diagnostics.ts';
import { describe, it, expect, afterEach } from 'vitest';
import { computeSimplifiedRules, drainSlotGroupingDiagnostics, SimplifyCtx, makeNormalizedGrammar } from '../simplify.ts';
import type { RenderRule } from '../../types/rule.ts';

afterEach(() => {
	// Always drain to avoid leaking between tests.
	drainSlotGroupingDiagnostics();
});

describe('computeSimplifiedRules — slot-grouping diagnostic wiring', () => {
	it('auto-group helper kind in inlineKinds with multi-slot body → multi-slot-nested-seq', () => {
		// A helper kind whose body is seq(sym_a, sym_b) and is listed in inlineKinds
		// (simulates _parent_repeat1 style auto-group). Its body is the seq content
		// of an inlined repeat — slot position via inlineKinds.
		const normalizedRules: Record<string, RenderRule> = {
			_parent_repeat1: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: '_a' },
					{ type: 'SYMBOL', name: '_b' },
				],
			} as any,
		};
		const inlineKinds = new Set(['_parent_repeat1']);
		computeSimplifiedRules(new SimplifyCtx({ grammar: makeNormalizedGrammar(normalizedRules), inlineKinds, diagnostics: new DiagnosticSink() }));
		const diagnostics = drainSlotGroupingDiagnostics();
		const multiSlot = diagnostics.filter((d) => d.code === 'multi-slot-nested-seq');
		expect(multiSlot.length).toBeGreaterThanOrEqual(1);
		expect(multiSlot[0]!.ownerKind).toBe('_parent_repeat1');
		expect(multiSlot[0]!.slotCount).toBeGreaterThanOrEqual(2);
	});

	it('normal multi-field rule body → SILENT (not in inlineKinds, not in slot position)', () => {
		// A normal rule like assignment_expression with seq(left, '=', right)
		// must NOT fire — the rule body is not in slot position.
		const normalizedRules: Record<string, RenderRule> = {
			assignment_expression: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'left', fieldName: 'left' } as any,
					{ type: 'STRING', value: '=' } as any,
					{ type: 'SYMBOL', name: 'right', fieldName: 'right' } as any,
				],
			} as any,
		};
		computeSimplifiedRules(new SimplifyCtx({ grammar: makeNormalizedGrammar(normalizedRules), diagnostics: new DiagnosticSink() }));
		const diagnostics = drainSlotGroupingDiagnostics();
		expect(diagnostics.filter((d) => d.code === 'multi-slot-nested-seq')).toHaveLength(0);
	});

	it('a rule with no multi-slot substructure produces no diagnostics', () => {
		const normalizedRules: Record<string, RenderRule> = {
			simple: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'fn' },
					{ type: 'SYMBOL', name: 'name' },
				],
			} as any,
		};
		computeSimplifiedRules(new SimplifyCtx({ grammar: makeNormalizedGrammar(normalizedRules), diagnostics: new DiagnosticSink() }));
		const diagnostics = drainSlotGroupingDiagnostics();
		expect(diagnostics).toHaveLength(0);
	});
});
