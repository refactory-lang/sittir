/**
 * Task 4: verify that `computeSimplifiedRules` wires `diagnoseSlotGrouping`
 * and surfaces records via the drain function.
 *
 * A grammar fixture with a `repeat(seq(sym, sym))` must produce a
 * `multi-slot-nested-seq` diagnostic record.
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
	it('repeat(seq(sym a, sym b)) produces a multi-slot-nested-seq record', () => {
		// A rule with a multi-slot repeat(seq) that is NOT already a group.
		const renderRules: Record<string, RenderRule> = {
			// Simplified form: repeat(seq(sym_a, sym_b)) — two symbols, no
			// field names, no group wrapping → shape ①.
			tuple_like: {
				type: 'seq',
				members: [
					{ type: 'string', value: '(' },
					{
						type: 'repeat',
						content: {
							type: 'seq',
							members: [
								{ type: 'symbol', name: '_a' },
								{ type: 'symbol', name: '_b' },
							],
						},
					} as any,
					{ type: 'string', value: ')' },
				],
			} as any,
		};

		computeSimplifiedRules(renderRules, null);
		const diagnostics = drainSlotGroupingDiagnostics();
		const multiSlot = diagnostics.filter((d) => d.shape === 'multi-slot-nested-seq');
		expect(multiSlot.length).toBeGreaterThanOrEqual(1);
		expect(multiSlot[0]!.ownerKind).toBe('tuple_like');
		expect(multiSlot[0]!.slotCount).toBeGreaterThanOrEqual(2);
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
