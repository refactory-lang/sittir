import { describe, expect, it } from 'vitest';
import { astStructuralDiff, LEAF_ALIAS_TOLERANCE_BY_GRAMMAR, leafAliasKey } from '../read-render-parse.ts';
import type { TSNode } from '../common.ts';

const NO_EXTRAS = new Set<string>();

function leaf(type: string, text: string): TSNode {
	return {
		type,
		text,
		childCount: 0,
		isNamed: true,
		child: () => null
	} as unknown as TSNode;
}

function branch(type: string, text: string, children: TSNode[]): TSNode {
	return {
		type,
		text,
		childCount: children.length,
		isNamed: true,
		child: (i: number) => children[i] ?? null
	} as unknown as TSNode;
}

describe('astStructuralDiff leaf-kind tolerance', () => {
	// Synthetic allowlist exercising the mechanism — the SHIPPED table is
	// empty (see the empty-table ratchet below); context-faithful reparse
	// wrappers cover the known positional cases instead.
	const tsPairs = new Set([leafAliasKey('identifier', 'super')]);

	it('tolerates an allowlisted same-text leaf pair (identifier/super, both orders)', () => {
		expect(
			astStructuralDiff(
				leaf('identifier', 'super'),
				leaf('super', 'super'),
				NO_EXTRAS,
				'',
				undefined,
				undefined,
				tsPairs
			)
		).toBeNull();
		expect(
			astStructuralDiff(
				leaf('super', 'super'),
				leaf('identifier', 'super'),
				NO_EXTRAS,
				'',
				undefined,
				undefined,
				tsPairs
			)
		).toBeNull();
	});

	it('fails an allowlisted pair when the bytes differ', () => {
		expect(
			astStructuralDiff(
				leaf('identifier', 'supper'),
				leaf('super', 'super'),
				NO_EXTRAS,
				'',
				undefined,
				undefined,
				tsPairs
			)
		).toMatch(/type identifier ≠ super/);
	});

	it('fails a same-text leaf kind swap that is NOT allowlisted', () => {
		// A regression that re-lexes a terminal under a different kind with
		// identical bytes must surface, not pass as alias noise.
		expect(
			astStructuralDiff(
				leaf('type_identifier', 'T'),
				leaf('identifier', 'T'),
				NO_EXTRAS,
				'',
				undefined,
				undefined,
				tsPairs
			)
		).toMatch(/type type_identifier ≠ identifier/);
	});

	it('fails every same-text leaf kind swap when no allowlist is provided', () => {
		expect(
			astStructuralDiff(
				leaf('identifier', 'super'),
				leaf('super', 'super'),
				NO_EXTRAS,
				'',
				undefined,
				undefined,
				undefined
			)
		).toMatch(/type identifier ≠ super/);
	});

	it('never tolerates a kind mismatch on structured nodes, even with identical text', () => {
		const a = branch('call_expression', 'f()', [leaf('identifier', 'f')]);
		const b = branch('new_expression', 'f()', [leaf('identifier', 'f')]);
		expect(astStructuralDiff(a, b, NO_EXTRAS, '', undefined, undefined, tsPairs)).toMatch(
			/type call_expression ≠ new_expression/
		);
	});

	it('applies the tolerance at nested depth through the recursion', () => {
		const a = branch('member_expression', 'super.x', [leaf('identifier', 'super'), leaf('property_identifier', 'x')]);
		const b = branch('member_expression', 'super.x', [leaf('super', 'super'), leaf('property_identifier', 'x')]);
		expect(astStructuralDiff(a, b, NO_EXTRAS, '', undefined, undefined, tsPairs)).toBeNull();
	});
});

describe('leafAliasKey', () => {
	it('is order-insensitive', () => {
		expect(leafAliasKey('identifier', 'super')).toBe(leafAliasKey('super', 'identifier'));
	});
});

describe('LEAF_ALIAS_TOLERANCE_BY_GRAMMAR', () => {
	it('ships empty — context-faithful reparse wrappers make leaf-kind tolerance unnecessary', () => {
		// Ratchet: adding a tolerated pair requires the audit documented on
		// the table (instrument, run validate:native on all grammars, list
		// only pairs no wrapper can express) — and updating this test.
		for (const [grammar, pairs] of Object.entries(LEAF_ALIAS_TOLERANCE_BY_GRAMMAR)) {
			expect({ grammar, pairs: [...pairs] }).toEqual({ grammar, pairs: [] });
		}
	});
});
