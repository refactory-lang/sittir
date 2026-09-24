import { describe, expect, it } from 'vitest';
import { astStructuralDiff } from '../read-render-parse.ts';
import type { TSNode } from '../common.ts';

const GRAMMAR_IDS: Record<string, number> = {
	identifier: 1,
	super: 2,
	type_identifier: 3,
	call_expression: 4,
	new_expression: 5,
	member_expression: 6,
	property_identifier: 7,
	generic_type: 245,
	generic_type_with_turbofish: 246
};

function node(type: string, text: string, children: TSNode[] = [], grammarType: string = type): TSNode {
	return {
		type,
		grammarType,
		grammarId: GRAMMAR_IDS[grammarType],
		text,
		childCount: children.length,
		isNamed: true,
		child: (i: number) => children[i] ?? null
	} as unknown as TSNode;
}

describe('astStructuralDiff compares grammar types, not display names', () => {
	it('two nodes with the same grammar type but different display names are equal', () => {
		const a = node('generic_type', 'a::<b>', [], 'generic_type_with_turbofish');
		const b = node('generic_type_with_turbofish', 'a::<b>', [], 'generic_type_with_turbofish');
		expect(astStructuralDiff(a, b)).toBeNull();
	});

	it('two nodes with different grammar types differ even when the display names match', () => {
		const a = node('generic_type', 'a<b>', [], 'generic_type');
		const b = node('generic_type', 'a<b>', [], 'generic_type_with_turbofish');
		expect(astStructuralDiff(a, b)).toMatch(/grammar type generic_type ≠ generic_type_with_turbofish/);
	});

	it('fails a same-text leaf kind swap: a re-lexed terminal is a regression, not alias noise', () => {
		expect(astStructuralDiff(node('type_identifier', 'T'), node('identifier', 'T'))).toMatch(
			/grammar type type_identifier ≠ identifier/
		);
		expect(astStructuralDiff(node('identifier', 'super'), node('super', 'super'))).toMatch(/grammar type identifier ≠ super/);
	});

	it('fails a kind mismatch on structured nodes, even with identical text', () => {
		const a = node('call_expression', 'f()', [node('identifier', 'f')]);
		const b = node('new_expression', 'f()', [node('identifier', 'f')]);
		expect(astStructuralDiff(a, b)).toMatch(/grammar type call_expression ≠ new_expression/);
	});

	it('compares grammar types at nested depth through the recursion', () => {
		const a = node('member_expression', 'super.x', [node('identifier', 'super'), node('property_identifier', 'x')]);
		const b = node('member_expression', 'super.x', [node('super', 'super'), node('property_identifier', 'x')]);
		expect(astStructuralDiff(a, b)).toMatch(/member_expression\[0\]\.identifier: grammar type identifier ≠ super/);
	});
});
