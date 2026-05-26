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

import { describe, it, expect, afterEach } from 'vitest';
import { computeSimplifiedRules } from '../simplify.ts';
import { drainSlotGroupingDiagnostics } from '../simplify.ts';
import type { RenderRule } from '../rule.ts';

afterEach(() => {
	// Always drain to avoid leaking between tests.
	drainSlotGroupingDiagnostics();
});

describe('computeSimplifiedRules — slot-grouping diagnostic wiring', () => {
	it('auto-group helper kind in inlineKinds with multi-slot body → multi-slot-nested-seq', () => {
		// A helper kind whose body is seq(sym_a, sym_b) and is listed in inlineKinds
		// (simulates _parent_repeat1 style auto-group). Its body is the seq content
		// of an inlined repeat — slot position via inlineKinds.
		const renderRules: Record<string, RenderRule> = {
			_parent_repeat1: {
				type: 'seq',
				members: [
					{ type: 'symbol', name: '_a' },
					{ type: 'symbol', name: '_b' },
				],
			} as any,
		};
		const inlineKinds = new Set(['_parent_repeat1']);
		computeSimplifiedRules(renderRules, null, inlineKinds);
		const diagnostics = drainSlotGroupingDiagnostics();
		const multiSlot = diagnostics.filter((d) => d.shape === 'multi-slot-nested-seq');
		expect(multiSlot.length).toBeGreaterThanOrEqual(1);
		expect(multiSlot[0]!.ownerKind).toBe('_parent_repeat1');
		expect(multiSlot[0]!.slotCount).toBeGreaterThanOrEqual(2);
	});

	it('normal multi-field rule body → SILENT (not in inlineKinds, not in slot position)', () => {
		// A normal rule like assignment_expression with seq(left, '=', right)
		// must NOT fire — the rule body is not in slot position.
		const renderRules: Record<string, RenderRule> = {
			assignment_expression: {
				type: 'seq',
				members: [
					{ type: 'symbol', name: 'left', fieldName: 'left' } as any,
					{ type: 'string', value: '=' } as any,
					{ type: 'symbol', name: 'right', fieldName: 'right' } as any,
				],
			} as any,
		};
		computeSimplifiedRules(renderRules, null);
		const diagnostics = drainSlotGroupingDiagnostics();
		expect(diagnostics.filter((d) => d.shape === 'multi-slot-nested-seq')).toHaveLength(0);
	});

	it('a rule with no multi-slot substructure produces no diagnostics', () => {
		const renderRules: Record<string, RenderRule> = {
			simple: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'fn' },
					{ type: 'symbol', name: 'name' },
				],
			} as any,
		};
		computeSimplifiedRules(renderRules, null);
		const diagnostics = drainSlotGroupingDiagnostics();
		expect(diagnostics).toHaveLength(0);
	});
});
