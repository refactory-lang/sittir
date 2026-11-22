import { describe, expect, it } from 'vitest';
import { runStoredLayout, storedLayoutOf } from '../src/validate/stored-layout.ts';

const grammars = ['rust', 'typescript', 'python', 'regex', 'scm'] as const;

describe('every corpus entry reads what it stores of its layout', () => {
	for (const grammar of grammars) {
		it(`in every ${grammar} corpus entry`, async () => {
			expect((await runStoredLayout(grammar)).refused).toEqual([]);
		});
	}
});

describe('a parsed tree stores only the layout its read-time options do not render', () => {
	it('stores nothing for a rust block, whether the options break it as its source does or not', async () => {
		const storedOf = await storedLayoutOf('rust');
		expect(storedOf('fn f() {\n    x;\n}\n')).toEqual({ slots: 0 });
		expect(storedOf('fn f() { x; }\n')).toEqual({ slots: 0 });
	});

	it('stores no list slot class where its gaps break apart from the options, which decide them', async () => {
		const storedOf = await storedLayoutOf('rust');
		expect(storedOf('fn f(a: u8,\n    b: u8,\n    c: u8) {}\n')).toMatchObject({ slots: 0 });
	});

	it('stores no separator of an item: an item owns no separator, a list keeps only its slot\'s (once `separators: 1` here)', async () => {
		const storedOf = await storedLayoutOf('typescript');
		expect(Object.keys(storedOf('type T = { a: 1; b: 2; c: 3, d: 4 };\n'))).toEqual(['slots']);
	});
});
