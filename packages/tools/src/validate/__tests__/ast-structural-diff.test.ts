import { describe, expect, it } from 'vitest';
import { astStructuralDiff } from '../read-render-parse.ts';
import { loadLanguageForGrammar, type TSNode } from '../common.ts';

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

describe('astStructuralDiff compares the text of named leaves', () => {
	it('fails a named leaf whose text changed under the same kind', () => {
		const a = node('call_expression', 'f(x)', [node('identifier', 'x')]);
		const b = node('call_expression', 'f(y)', [node('identifier', 'y')]);
		expect(astStructuralDiff(a, b)).toMatch(/call_expression\[0\]\.identifier: text "x" ≠ "y"/);
	});

	it('fails a candidate that is itself a named leaf whose text changed', () => {
		expect(astStructuralDiff(node('identifier', 'x'), node('identifier', 'y'))).toBe('identifier: text "x" ≠ "y"');
	});

	it('passes a named leaf whose text is unchanged', () => {
		const a = node('call_expression', 'f(x)', [node('identifier', 'x')]);
		expect(astStructuralDiff(a, node('call_expression', 'f(x)', [node('identifier', 'x')]))).toBeNull();
	});

	it('fails the rust string whose content gained a space', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('rust');
		const parser = new Parser();
		parser.setLanguage(lang);
		const original = parser.parse('fn f() { let s = "foo\\x42\\x43bar"; }')!.rootNode;
		const respelled = parser.parse('fn f() { let s = "foo\\x42\\x43 bar"; }')!.rootNode;
		expect(astStructuralDiff(original, original)).toBeNull();
		expect(astStructuralDiff(original, respelled)).toMatch(/string_content: text "bar" ≠ " bar"/);
	}, 60_000);
});

describe('astStructuralDiff compares extras as one ordered sequence', () => {
	async function parse(source: string) {
		const { Parser, lang } = await loadLanguageForGrammar('rust');
		const parser = new Parser();
		parser.setLanguage(lang);
		return parser.parse(source)!.rootNode;
	}

	it('fails a comment whose text changed', async () => {
		const a = await parse('fn f() { /* x */ 1 }');
		const b = await parse('fn f() { /* y */ 1 }');
		expect(astStructuralDiff(a, b)).toBe('extras[0]: block_comment "/* x */" ≠ block_comment "/* y */"');
	}, 60_000);

	it('fails a dropped comment and an added one', async () => {
		const withComment = await parse('fn f() { /* x */ 1 }');
		const without = await parse('fn f() { 1 }');
		expect(astStructuralDiff(withComment, without)).toBe('extras[0]: block_comment "/* x */" ≠ none');
		expect(astStructuralDiff(without, withComment)).toBe('extras[0]: none ≠ block_comment "/* x */"');
	}, 60_000);

	it('fails a doc marker respelled as a plain comment', async () => {
		const doc = await parse('/*! x */\nfn f() {}');
		const plain = await parse('/* x */\nfn f() {}');
		expect(astStructuralDiff(doc, plain)).toMatch(/^extras\[0\]:/);
	}, 60_000);

	it('passes a comment seated under another parent with the same bytes', async () => {
		const inside = await parse('fn f() { (/* c */ 1) }');
		const before = await parse('fn f() { /* c */ (1) }');
		const parentOf = (root: Awaited<ReturnType<typeof parse>>) => root.descendantsOfType('block_comment')[0]!.parent!.type;
		expect(parentOf(inside)).toBe('parenthesized_expression');
		expect(parentOf(before)).toBe('block');
		expect(astStructuralDiff(inside, before)).toBeNull();
	}, 60_000);
});
