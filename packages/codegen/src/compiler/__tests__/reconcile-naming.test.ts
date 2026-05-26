/**
 * Unit test for the PR-A wide divergence probe core (`diffSlotNames`).
 *
 * The probe asserts every legacy projected slot name equals the value the §2
 * PROJECTION (`projectSlotNaming`) computes from the slot's `values` + `fieldName`:
 * storageName, name (snake, == storageName), configKey/propertyName/paramName
 * (camelCase projections). A divergence in ANY projection is reported. `parseNames`
 * is a pure projection of `values` (the CST kinds) with no legacy stored field, so
 * it isn't a divergence axis here.
 */
import { describe, it, expect } from 'vitest';
import { diffSlotNames } from '../../scripts/reconcile-naming.ts';
import { snakeToCamel, pluralize, safeParamName } from '../node-map.ts';
import type { AssembledNonterminal, NodeOrTerminal } from '../node-map.ts';

// A single-ref node-ref value carrying a parse-as kind (projectSlotNaming reads
// `v.parseKind.name`). node + parseKind coincide for a non-aliased ref.
function nodeRefValue(kind: string, multiplicity: 'single' | 'array' = 'single'): NodeOrTerminal {
	return {
		kind: 'node-ref',
		node: { name: kind, kind } as never,
		parseKind: { kind: 'unresolved-ref', name: kind },
		multiplicity,
	} as unknown as NodeOrTerminal;
}

// A bare literal / anonymous-token value — no parseKind (e.g. splat_pattern's `_`).
function literalValue(value: string): NodeOrTerminal {
	return { kind: 'terminal', value, multiplicity: 'single' } as unknown as NodeOrTerminal;
}

// A fully-consistent slot: legacy fields agree with the projection.
function cleanSlot(): AssembledNonterminal {
	const storage = 'expression';
	const camel = snakeToCamel(storage); // 'expression'
	return {
		name: storage,
		storageName: storage,
		configKey: camel,
		propertyName: camel,
		paramName: safeParamName(camel),
		values: [nodeRefValue('expression')],
		hasTrailing: false,
		hasLeading: false,
		source: 'inferred',
		fieldName: undefined,
	} as AssembledNonterminal;
}

describe('diffSlotNames — PR-A wide divergence probe core', () => {
	it('reports nothing for a fully-consistent slot', () => {
		expect(diffSlotNames(cleanSlot(), 'binary_expression')).toEqual([]);
	});

	it('reports a storageName divergence (legacy != projected)', () => {
		// Legacy stored 'block', but the projection from values[parseKind=expression] is 'expression'.
		const slot = { ...cleanSlot(), storageName: 'block', name: 'block' } as AssembledNonterminal;
		const out = diffSlotNames(slot, 'function_definition');
		expect(out).toContainEqual(
			expect.objectContaining({
				kind: 'function_definition',
				projection: 'storageName',
				legacy: 'block',
				recomputed: 'expression',
			}),
		);
	});

	it('reports a propertyName divergence (array slot legacy not pluralized)', () => {
		const storage = 'parameter';
		const slot = {
			...cleanSlot(),
			name: storage,
			storageName: storage,
			configKey: snakeToCamel(storage),
			propertyName: snakeToCamel(storage), // BUG: not pluralized
			paramName: safeParamName(snakeToCamel(storage)),
			values: [nodeRefValue('parameter', 'array')],
		} as AssembledNonterminal;
		const out = diffSlotNames(slot, 'parameters');
		expect(out).toContainEqual(
			expect.objectContaining({
				projection: 'propertyName',
				legacy: 'parameter',
				recomputed: pluralize(snakeToCamel(storage)),
			}),
		);
	});

	it('falls back to content when any value lacks parseKind (named ref + literal)', () => {
		// splat_pattern.content shape: [identifier ref, "_" literal]. The literal
		// has no parseKind, so the slot is NOT a single named kind → storageName
		// must be the generic 'content' (matching legacy), not the lone ref name.
		const slot = {
			...cleanSlot(),
			name: 'content',
			storageName: 'content',
			configKey: 'content',
			propertyName: 'content',
			paramName: 'content',
			values: [nodeRefValue('identifier'), literalValue('_')],
		} as AssembledNonterminal;
		expect(diffSlotNames(slot, 'splat_pattern')).toEqual([]);
	});

	it('trims the leading underscore ONLY in storageName (parseKind keeps it)', () => {
		// A hidden-kind ref: parseKind.name='_expression' (kept); storageName trims → 'expression'.
		const slot = {
			...cleanSlot(),
			storageName: 'expression',
			name: 'expression',
			values: [nodeRefValue('_expression')],
		} as AssembledNonterminal;
		expect(diffSlotNames(slot, 'array_expression')).toEqual([]);
	});
});
