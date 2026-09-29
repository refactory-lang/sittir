import { evaluatePackage } from './evaluate-package.ts';
import type { GrammarPackage } from '../grammars.ts';
import { hydrateSlotRefs, type AssembledNodeMap } from './assemble.ts';
import { conflictRecords } from './diagnostics/conflicts.ts';
import { dynamicPrecedenceRecords } from './diagnostics/dynamic-precedence.ts';
import { blockedRecords, collectGrammarDiagnosticsForGrammar, evaluateRecords, GrammarDiagnosticError } from './diagnostics/grammar-diagnostics.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import { DiagnosticSink, EmitHaltedError, type GrammarDiagnostic } from '../types/diagnostics.ts';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar, IncludeFilter } from './types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { diagnoseEvaluationStages, type StageDiagnoses } from './stage.ts';
import { authoredRuleNames, diagnoseRuleCauses } from './diagnostics/rule-causes.ts';
import { diagnosePatchSites, labelPatchSites } from './diagnostics/patch-sites.ts';
import { deriveDiagnosticRecords, type DiagnosticRecord } from './diagnostics/diagnostic-records.ts';

export interface Compilation {
	readonly grammar: string;
	readonly package: GrammarPackage;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly raw: RawGrammar;
	readonly linked: LinkedGrammar;
	readonly normalized: NormalizedGrammar;
	readonly nodeMap: AssembledNodeMap;
	readonly diagnostics: DiagnosticSink;
	readonly slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
	readonly grammarDiagnostics: readonly GrammarDiagnostic[];
	readonly stages?: StageDiagnoses;
	readonly diagnosticRecords: readonly DiagnosticRecord[];
}

export interface CompileGrammarConfig {
	readonly package: GrammarPackage;
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly allowDiagnostics?: ReadonlySet<string>;
}

export async function compileGrammar(cfg: CompileGrammarConfig): Promise<Compilation> {
	const grammar = cfg.package.name;
	const evaluated = await evaluatePackage(cfg.package);
	const diagnosis = diagnoseGrammar({
		grammar,
		evaluated,
		include: cfg.include,
		generatedIdTables: cfg.generatedIdTables,
		allowDiagnostics: cfg.allowDiagnostics
	});
	if (!diagnosis.passed) throw new GrammarDiagnosticError(diagnosis.blocked, diagnosis.grammarDiagnostics);
	const { stages, grammarDiagnostics, diagnosticRecords } = diagnosis;
	const { raw, linked, normalized, nodeMap, compilerDiagnostics, slotGroupingDiagnostics } = diagnosis.collected;

	hydrateSlotRefs(nodeMap, {
		inline: new Set(raw.inline),
		reportedAbsentNames: nodeMap.droppedKinds,
		grammar
	});

	return {
		grammar,
		package: cfg.package,
		generatedIdTables: linked.generatedIdTables,
		raw,
		linked,
		normalized,
		nodeMap,
		diagnostics: compilerDiagnostics,
		slotGroupingDiagnostics,
		grammarDiagnostics,
		stages,
		diagnosticRecords
	};
}

export interface DiagnoseGrammarConfig {
	readonly grammar: string;
	readonly evaluated: RawGrammar;
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly allowDiagnostics?: ReadonlySet<string>;
}

interface GrammarDiagnosisFacts {
	readonly stages?: StageDiagnoses;
	readonly grammarDiagnostics: readonly GrammarDiagnostic[];
	readonly blocked: readonly GrammarDiagnostic[];
}

export type GrammarDiagnosis =
	| (GrammarDiagnosisFacts & { readonly passed: false })
	| (GrammarDiagnosisFacts & {
			readonly passed: true;
			readonly collected: ReturnType<typeof collectGrammarDiagnosticsForGrammar>;
			readonly diagnosticRecords: readonly DiagnosticRecord[];
		});

export function diagnoseGrammar(cfg: DiagnoseGrammarConfig): GrammarDiagnosis {
	const { grammar, evaluated, allowDiagnostics } = cfg;
	const stages = evaluated.stages === undefined ? undefined : diagnoseEvaluationStages(evaluated.stages);
	const evaluatedRecords = evaluateRecords(evaluated);
	const evaluateDiagnostics = [
		...evaluatedRecords,
		...diagnoseRuleCauses({ grammar, raw: evaluated, enriched: stages?.enriched }),
		...conflictRecords(evaluated),
		...dynamicPrecedenceRecords(evaluated)
	];
	const evaluateBlocked = blockedRecords(evaluateDiagnostics, evaluated.expectDiagnostics, allowDiagnostics);
	if (evaluateBlocked.length > 0) return { passed: false, stages, grammarDiagnostics: evaluateDiagnostics, blocked: evaluateBlocked };

	const collected = collectGrammarDiagnosticsForGrammar({
		rawGrammar: evaluated,
		include: cfg.include,
		generatedIdTables: cfg.generatedIdTables
	});
	const diagnosticRecords =
		stages === undefined
			? []
			: deriveDiagnosticRecords({
					stages,
					final: { diagnostics: [...evaluatedRecords, ...collected.diagnostics], ruleCatalog: collected.raw.ruleCatalog },
					authoredRules: authoredRuleNames(evaluated),
					patchSites: evaluated.patchSites ?? []
				});
	const patchSiteDiagnostics =
		stages === undefined ? [] : diagnosePatchSites({ grammar, sites: labelPatchSites(evaluated.patchSites ?? [], diagnosticRecords) });
	const grammarDiagnostics = [...evaluateDiagnostics, ...patchSiteDiagnostics, ...collected.diagnostics];
	const blocked = blockedRecords(grammarDiagnostics, collected.raw.expectDiagnostics, allowDiagnostics);
	if (blocked.length > 0) return { passed: false, stages, grammarDiagnostics, blocked };
	return { passed: true, stages, grammarDiagnostics, blocked, collected, diagnosticRecords };
}

export function assertCompilation(compilation: Compilation): void {
	if (compilation.diagnostics.hasBlocking()) {
		throw new EmitHaltedError(compilation.diagnostics.all().filter((d) => d.severity === 'fail'));
	}
}
