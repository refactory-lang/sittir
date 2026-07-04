import type { Command } from 'commander';
import type { CommandModule } from '../../framework/command-module.ts';
import { registerNamespace } from '../../framework/command-module.ts';

import { bench } from './bench.ts';
import { benchCodemod } from './bench-codemod.ts';
import { checkBaseline } from './check-baseline.ts';
import { checkJinja } from './check-jinja.ts';
import { checkPerf } from './check-perf.ts';
import { classify } from './classify.ts';
import { compareOverrides } from './compare-overrides.ts';
import { diffFailures } from './diff-failures.ts';
import { dumpAstMismatches } from './dump-ast-mismatches.ts';
import { exercise } from './exercise.ts';
import { fieldProvenance } from './field-provenance.ts';
import { grammarDiagnostics } from './grammar-diagnostics.ts';
import { inspectRefs } from './inspect-refs.ts';
import { inspectType } from './inspect-type.ts';
import { listKinds } from './list-kinds.ts';
import { phantomKinds } from './phantom-kinds.ts';
import { probeKind } from './probe-kind.ts';
import { probeParity } from './probe-parity.ts';
import { probeStages } from './probe-stages.ts';
import { probeValidate } from './probe-validate.ts';
import { profile } from './profile.ts';
import { profileFactory } from './profile-factory.ts';
import { propose14 } from './propose-14.ts';
import { variantDerivationProbe } from './variant-derivation-probe.ts';
import { walk } from './walk.ts';

/** All developer-diagnostic tool CommandModules, registered under `sittir tool`. */
export const toolModules: readonly CommandModule[] = [
	bench,
	benchCodemod,
	checkBaseline,
	checkJinja,
	checkPerf,
	classify,
	compareOverrides,
	diffFailures,
	dumpAstMismatches,
	exercise,
	fieldProvenance,
	grammarDiagnostics,
	inspectRefs,
	inspectType,
	listKinds,
	phantomKinds,
	probeKind,
	probeParity,
	probeStages,
	probeValidate,
	profile,
	profileFactory,
	propose14,
	variantDerivationProbe,
	walk
];

export function registerTools(program: Command): void {
	registerNamespace(program, 'tool', 'Developer diagnostics', toolModules);
}
