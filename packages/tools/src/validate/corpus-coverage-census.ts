/**
 * Per-kind corpus-coverage census: which declared rule kinds never appear
 * in any corpus entry.
 *
 * "Declared" here means the same testable-kind universe read-render-parse
 * and factory-render-parse already use (`deriveRuleKinds(grammar)` — the
 * kinds with an emitted render body), not a separately-derived
 * catalog: reusing it keeps this census answering exactly the question the
 * validators' own candidate enumeration asks ("of the kinds we'd test, which
 * ones did the corpus never give us a candidate for"), rather than a
 * broader-or-narrower kind set that would talk past the validators' counts.
 *
 * Distinguishes a silent blind spot (kind never exercised, so its true
 * pass/fail is unknown) from attribution inflation (kind exercised, just
 * mis-counted) when a grammar's rrp/factory pass count looks low.
 */

import { loadCorpusEntries, loadLanguageForGrammar, collectKinds, type TSTree } from './common.ts';
import { deriveRuleKinds } from './render-bodies.ts';

export interface CorpusCoverageCensus {
	grammar: string;
	declaredKindCount: number;
	exercisedKindCount: number;
	/** Declared kinds with zero corpus exposure, sorted for stable diffing. */
	zeroExposureKinds: string[];
}

export async function computeCorpusCoverageCensus(grammar: string): Promise<CorpusCoverageCensus> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const declaredKinds = deriveRuleKinds(grammar);
	const exercisedKinds = new Set<string>();
	for (const entry of loadCorpusEntries(grammar)) {
		const tree = parser.parse(entry.source) as TSTree;
		if (tree.rootNode.hasError) continue;
		for (const kind of collectKinds(tree.rootNode)) exercisedKinds.add(kind);
	}

	const zeroExposureKinds = [...declaredKinds].filter((k) => !exercisedKinds.has(k)).sort();
	return {
		grammar,
		declaredKindCount: declaredKinds.size,
		exercisedKindCount: [...declaredKinds].filter((k) => exercisedKinds.has(k)).length,
		zeroExposureKinds
	};
}

export interface CorpusCoverageCensusOptions {
	grammar: string;
	allGrammars: boolean;
	format: string;
}

const GRAMMARS = ['rust', 'python', 'typescript'] as const;

export async function run(opts: CorpusCoverageCensusOptions): Promise<number> {
	const format = opts.format as 'list' | 'json';
	if (format !== 'list' && format !== 'json') {
		process.stderr.write(`invalid --format '${format}', expected one of: list, json\n`);
		return 2;
	}
	const grammars = opts.allGrammars ? GRAMMARS : [opts.grammar as (typeof GRAMMARS)[number]];
	const results: CorpusCoverageCensus[] = [];
	for (const grammar of grammars) {
		results.push(await computeCorpusCoverageCensus(grammar));
	}

	if (format === 'json') {
		console.log(JSON.stringify(opts.allGrammars ? results : results[0], null, 2));
		return 0;
	}
	for (const r of results) {
		console.log(
			`# ${r.grammar} corpus coverage: ${r.exercisedKindCount}/${r.declaredKindCount} declared kinds exercised, ${r.zeroExposureKinds.length} zero-exposure`
		);
		for (const kind of r.zeroExposureKinds) console.log(`  ZERO-EXPOSURE\t${kind}`);
	}
	return 0;
}
