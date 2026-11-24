import { describe, expect, it } from 'vitest';
import { astStructuralDiff, ownRenderTolerance, type AstTolerance } from '../read-render-parse.ts';
import { loadFlagTokens, loadLanguageForGrammar, treeParser } from '../common.ts';

const parser = treeParser(await loadLanguageForGrammar('typescript'));
const flags = await loadFlagTokens('typescript');

const compare = (a: string, b: string): { diff: string | null; tolerance: AstTolerance } => {
	using left = parser.parse(a);
	using right = parser.parse(b);
	const tolerance: AstTolerance = { listSeparators: {}, tolerated: [], flags, reordered: [] };
	return { diff: astStructuralDiff(left.root, right.root, '', undefined, tolerance), tolerance };
};

const field = (modifiers: string): string => `abstract class A extends B { ${modifiers} x: number; }\n`;

describe('astStructuralDiff accepts the same flags of a kind in another order', () => {
	it.each([
		['readonly abstract', 'abstract readonly'],
		['public readonly abstract', 'public abstract readonly']
	])('%s against %s passes and records the reorder', (a, b) => {
		const { diff, tolerance } = compare(field(a), field(b));
		expect(diff).toBeNull();
		expect(tolerance.reordered!.some((note) => note.includes('reordered'))).toBe(true);
		expect(tolerance.tolerated).toEqual([]);
	});

	it('does not record anything when the order is already the same', () => {
		const { diff, tolerance } = compare(field('abstract readonly'), field('abstract readonly'));
		expect(diff).toBeNull();
		expect(tolerance.reordered).toEqual([]);
	});

	it('still mismatches a changed set of flags', () => {
		expect(compare(field('readonly'), field('abstract')).diff).not.toBeNull();
		expect(compare(field('abstract readonly'), field('abstract')).diff).not.toBeNull();
	});

	it('still mismatches a reorder of children that are not flags', () => {
		expect(compare('f(a, b);\n', 'f(b, a);\n').diff).not.toBeNull();
		expect(compare('class A { x: number; y: string; }\n', 'class A { y: string; x: number; }\n').diff).not.toBeNull();
	});

	it('fails the own-render comparison when untouched code swaps its flags', () => {
		using left = parser.parse(field('readonly abstract'));
		using right = parser.parse(field('abstract readonly'));
		const own = ownRenderTolerance({}, []);
		expect(own.flags).toBeUndefined();
		expect(astStructuralDiff(left.root, right.root, '', undefined, own)).not.toBeNull();
	});

	it('mismatches without the model flags', () => {
		using left = parser.parse(field('readonly abstract'));
		using right = parser.parse(field('abstract readonly'));
		expect(astStructuralDiff(left.root, right.root)).not.toBeNull();
	});
});
