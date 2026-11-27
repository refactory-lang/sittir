import { describe, expect, it } from 'vitest';
import { nativeEngineOf } from '@sittir/common/engine';
import { loadCorpusEntries } from '../src/validate/common.ts';
import { nativeBackendOf, runStoredLayout, storedLayoutOf } from '../src/validate/stored-layout.ts';

const grammars = ['rust', 'typescript', 'python', 'regex', 'scm'] as const;

describe('an arena tree answers what it stores of its layout from its records', () => {
	it('through the addon, from a read of the source', async () => {
		const engine = nativeEngineOf(await nativeBackendOf('rust'));
		try {
			const { root } = JSON.parse(engine.parseRecords?.('fn f(a: u8,\n    b: u8) {}\n') ?? '{}') as { root: number };
			expect(engine.readStoredLayout?.(root)).toEqual({ slots: 0 });
		} finally {
			engine.dispose();
		}
	});

	for (const grammar of grammars) {
		it(`as its tree does, in every ${grammar} corpus entry`, async () => {
			const [objectOf, arenaOf] = await Promise.all([storedLayoutOf(grammar, 'object'), storedLayoutOf(grammar, 'arena')]);
			const apart = loadCorpusEntries(grammar).filter(({ source }) => objectOf(source).slots !== arenaOf(source).slots);
			expect(apart.map(({ name }) => name)).toEqual([]);
		});
	}
});

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
