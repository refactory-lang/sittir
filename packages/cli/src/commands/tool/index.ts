import type { Command } from 'commander';
import type { CommandModule } from '../../framework/command-module.ts';
import { registerNamespace } from '../../framework/command-module.ts';

import { assembleShapeCensus } from './assemble-shape-census.ts';
import { bench } from './bench.ts';
import { bootstrapGrammar } from './bootstrap-grammar.ts';
import { fetchCorpus } from './fetch-corpus.ts';
import { benchCodemod } from './bench-codemod.ts';
import { checkBaseline } from './check-baseline.ts';
import { checkPerf } from './check-perf.ts';
import { classify } from './classify.ts';
import { codemodCorpus } from './codemod-corpus.ts';
import { defaultDiff } from './default-diff.ts';
import { corpusCoverageCensus } from './corpus-coverage-census.ts';
import { defectHistogram } from './defect-histogram.ts';
import { diffFailures } from './diff-failures.ts';
import { dumpAstMismatches } from './dump-ast-mismatches.ts';
import { bindingsInventory } from './bindings-inventory.ts';
import { syncBase } from './sync-base.ts';
import { emitFactorySource } from './emit-factory-source.ts';
import { exercise } from './exercise.ts';
import { fieldProvenance } from './field-provenance.ts';
import { grammarDiagnostics } from './grammar-diagnostics.ts';
import { hoistedCensus } from './hoisted-census.ts';
import { inspectRefs } from './inspect-refs.ts';
import { inspectType } from './inspect-type.ts';
import { listKinds } from './list-kinds.ts';
import { overrideCensus } from './override-census.ts';
import { phantomKinds } from './phantom-kinds.ts';
import { probeKind } from './probe-kind.ts';
import { probeParity } from './probe-parity.ts';
import { probeStages } from './probe-stages.ts';
import { probeValidate } from './probe-validate.ts';
import { profile } from './profile.ts';
import { profileFactory } from './profile-factory.ts';
import { propose14 } from './propose-14.ts';
import { separatedLists } from './separated-lists.ts';
import { testHistory } from './test-history.ts';
import { textKindOverlap } from './text-kind-overlap.ts';
import { spelledTrivia } from './spelled-trivia.ts';
import { triviaPlacement } from './trivia-placement.ts';
import { gapCensus } from './gap-census.ts';
import { triviaTiming } from './trivia-timing.ts';
import { uncoveredContent } from './uncovered-content.ts';
import { variantDerivationProbe } from './variant-derivation-probe.ts';
import { vocabularyFeatures } from './vocabulary-features.ts';
import { walk } from './walk.ts';

/** All developer-diagnostic tool CommandModules, registered under `sittir tool`. */
export const toolModules: readonly CommandModule[] = [
	assembleShapeCensus,
	bench,
	benchCodemod,
	bootstrapGrammar,
	fetchCorpus,
	checkBaseline,
	checkPerf,
	classify,
	codemodCorpus,
	corpusCoverageCensus,
	defaultDiff,
	defectHistogram,
	diffFailures,
	dumpAstMismatches,
	bindingsInventory,
	syncBase,
	emitFactorySource,
	exercise,
	fieldProvenance,
	grammarDiagnostics,
	hoistedCensus,
	inspectRefs,
	inspectType,
	listKinds,
	overrideCensus,
	phantomKinds,
	probeKind,
	probeParity,
	probeStages,
	probeValidate,
	profile,
	profileFactory,
	propose14,
	separatedLists,
	testHistory,
	textKindOverlap,
	spelledTrivia,
	triviaPlacement,
	gapCensus,
	triviaTiming,
	uncoveredContent,
	variantDerivationProbe,
	vocabularyFeatures,
	walk,
];

export function registerTools(program: Command): void {
	registerNamespace(program, 'tool', 'Developer diagnostics', toolModules);
}
