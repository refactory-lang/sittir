import { describe, expect, it } from 'vitest';
import { defaultDiff } from '../src/exercise/default-diff.ts';

const CASES: readonly (readonly [grammar: string, label: string, source: string])[] = [
	['rust', 'a raw pointer type glues its qualifier', 'fn f(x: *const u8, y: *mut u8) {}\n'],
	['rust', 'a bare visibility keeps a space before a unit type', 'struct T(pub ());\n'],
	['rust', 'a scoped visibility is glued to its scope', 'pub(crate) struct S;\n'],
	['rust', 'a lifetime bound follows its colon', "fn g<'a: 'b, 'b>() {}\n"],
	['rust', 'a lifetime keeps its space before a type or mut', "fn f(x: &'a T, y: &'a mut T) {}\n"],
	['rust', 'an empty initializer list is empty braces', 'fn h() {\n    let s = S {};\n}\n'],
	['rust', 'a filled initializer list is padded', 'fn h() {\n    let s = S { a: 1 };\n}\n'],
	['scm', 'a missing node is glued inside its parentheses', '(program (MISSING x))\n'],
	['scm', 'a quantifier is glued to its operand', '(a)*\n(b)?\n'],
	['scm', 'a negated field is glued to its name', '(a !b)\n'],
	['typescript', 'a generator star is glued to function', 'function* g() {}\n'],
	['typescript', 'a decorator name is glued to the at sign', '@dec\nclass A {}\n'],
];

describe('the default seams spell the idiom', () => {
	for (const [grammar, label, source] of CASES) {
		it(`${grammar}: ${label}`, async () => {
			const report = await defaultDiff(grammar, source, { attribute: false });
			expect(report.rendered).toBe(source);
		}, 120_000);
	}
});
