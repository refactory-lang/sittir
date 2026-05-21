/**
 * Tests for `deriveValuesForRule`'s handling of link-synthesized operator
 * symbols (Chunk D1 of the nonterminal-driven-slot-derivation design).
 *
 * `canonicalizeRuleLiterals` (link.ts) rewrites a field-wrapped operator
 * literal (`'<'`) into `symbol{ name: 'lt', source: 'link', literal: '<' }`
 * — the `name` is the alias-target kind (the runtime `$type`), and `literal`
 * carries the original source string.
 *
 * The OLD `symbol` case dropped `rule.literal` and emitted a `node-ref` to
 * `lt`/`eq_eq`/… — a PHANTOM kind ref in the operator enum (the type surface
 * showed `Lt | LtEq | EqEq | …`). Chunk D1 makes such a link-symbol emit a
 * TERMINAL value instead: `value = literal` (the source string the renderer
 * emits), `resolvedKind = name` (the kindId read-time matching keys on).
 */

import { describe, it, expect } from 'vitest';
import { deriveValuesForRule, isTerminalValue, isNodeRef } from '../node-map.ts';
import type { Rule } from '../rule.ts';

describe('deriveValuesForRule — link-synthesized operator symbols (D1)', () => {
	it('a link-symbol carrying a literal emits a terminal of the SOURCE string', () => {
		const rule: Rule = { type: 'symbol', name: 'lt', source: 'link', literal: '<' };
		const out = deriveValuesForRule(rule, 'single');
		expect(out).toHaveLength(1);
		const v = out[0]!;
		expect(isTerminalValue(v)).toBe(true);
		if (isTerminalValue(v)) {
			// Renders the source string, not a phantom kind ref.
			expect(v.value).toBe('<');
			// Read-time matching keys on the alias-target kindId.
			expect(v.resolvedKind).toBe('lt');
			expect(v.multiplicity).toBe('single');
		}
	});

	it('a plain grammar symbol (no literal) still emits a node-ref', () => {
		const rule: Rule = { type: 'symbol', name: 'primary_expression' };
		const out = deriveValuesForRule(rule, 'single');
		expect(out).toHaveLength(1);
		expect(isNodeRef(out[0]!)).toBe(true);
	});

	it('a link-symbol WITHOUT a literal falls back to a node-ref', () => {
		const rule: Rule = { type: 'symbol', name: 'lt', source: 'link' };
		const out = deriveValuesForRule(rule, 'single');
		expect(out).toHaveLength(1);
		expect(isNodeRef(out[0]!)).toBe(true);
	});

	it('a choice of link-operator-literals yields a union of source-string terminals (no phantom refs)', () => {
		const rule: Rule = {
			type: 'choice',
			members: [
				{ type: 'symbol', name: 'lt', source: 'link', literal: '<' },
				{ type: 'symbol', name: 'lt_eq', source: 'link', literal: '<=' },
				{ type: 'symbol', name: 'eq_eq', source: 'link', literal: '==' },
				{ type: 'string', value: 'not in' }
			]
		};
		const out = deriveValuesForRule(rule, 'nonEmptyArray');
		const strings = out.filter(isTerminalValue).map((v) => v.value);
		expect(strings).toEqual(expect.arrayContaining(['<', '<=', '==', 'not in']));
		// No phantom kind refs leak into the union.
		expect(out.some(isNodeRef)).toBe(false);
	});
});
