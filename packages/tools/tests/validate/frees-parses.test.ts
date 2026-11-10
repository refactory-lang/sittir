import { afterAll, describe, expect, it, vi, type MockInstance } from 'vitest';
import { load } from '../../src/codegen-surface.ts';
import { textKindOverlapCensus } from '../../src/census/text-kind-overlap.ts';
import { disposeNativeEngines, loadCorpusEntries } from '../../src/validate/common.ts';
import { computeCorpusCoverageCensus } from '../../src/validate/corpus-coverage-census.ts';
import { validateFactoryStorage } from '../../src/validate/factory-storage.ts';
import { validateFrom } from '../../src/validate/from.ts';
import { computeGapCensus } from '../../src/validate/gap-census.ts';
import { computeRunCensus } from '../../src/validate/gap-runs.ts';
import { runPortableRoundTrip } from '../../src/validate/portable-round-trip.ts';
import { validateReadRenderParse } from '../../src/validate/read-render-parse.ts';
import { computeTriviaPlacementCensus } from '../../src/validate/trivia-placement.ts';

const { Parser } = await (await load('engineLoader')).loadWebTreeSitter();

type WasmParser = InstanceType<typeof Parser>;

const someOf = (grammar: string) => loadCorpusEntries(grammar).slice(0, 8);

const validators: Readonly<Record<string, () => Promise<unknown>>> = {
	'scm: read-render-parse': () => validateReadRenderParse('scm', { recursive: true }),
	'scm: factory-render-parse': () => validateFactoryStorage('scm', 'native'),
	'scm: ir-render-parse': () => validateFactoryStorage('scm', 'native', { surface: 'ir' }),
	'scm: from': () => validateFrom('scm'),
	'python: portable round trip': () => runPortableRoundTrip('python', someOf('python')),
	'scm: corpus coverage census': () => computeCorpusCoverageCensus('scm'),
	'scm: gap census': () => computeGapCensus('scm'),
	'python: run census': () => computeRunCensus('python', someOf('python')),
	'scm: trivia placement census': () => computeTriviaPlacementCensus('scm'),
	'scm: text-kind overlap census': () => textKindOverlapCensus('scm')
};

async function liveAfter(run: () => Promise<unknown>): Promise<{ parses: number; parsers: number; trees: number }> {
	const parse = Parser.prototype.parse;
	const trees: MockInstance[] = [];
	const parsed = vi.spyOn(Parser.prototype, 'parse').mockImplementation(function (this: WasmParser, ...args) {
		const tree = parse.apply(this, args);
		if (tree !== null) trees.push(vi.spyOn(tree, 'delete'));
		return tree;
	});
	const made = vi.spyOn(Parser.prototype, 'setLanguage');
	const freed = vi.spyOn(Parser.prototype, 'delete');
	try {
		await run();
		const deleted = new Set(freed.mock.contexts);
		return {
			parses: parsed.mock.calls.length,
			parsers: new Set(made.mock.contexts.filter((parser) => !deleted.has(parser))).size,
			trees: trees.filter((tree) => tree.mock.calls.length === 0).length
		};
	} finally {
		parsed.mockRestore();
		made.mockRestore();
		freed.mockRestore();
	}
}

afterAll(disposeNativeEngines);

describe('a validator deletes every web-tree-sitter parser and tree it makes before it returns', () => {
	it.each(Object.keys(validators))('%s', async (name) => {
		const { parses, parsers, trees } = await liveAfter(validators[name]!);
		expect(parses).toBeGreaterThan(0);
		expect({ parsers, trees }).toEqual({ parsers: 0, trees: 0 });
	}, 300_000);
});
