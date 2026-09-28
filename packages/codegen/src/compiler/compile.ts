import { existsSync } from 'node:fs';

import { evaluate } from './evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts';
import { hydrateSlotRefs, type AssembledNodeMap } from './assemble.ts';
import { blockedRecords, collectGrammarDiagnosticsForGrammar, evaluateRecords, GrammarDiagnosticError } from './diagnostics/grammar-diagnostics.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import { DiagnosticSink, EmitHaltedError, type GrammarDiagnostic } from '../types/diagnostics.ts';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar, IncludeFilter } from './types.ts';
import { stampVisibleExternals, type GeneratedIdTables } from '../dsl/symbol-table.ts';
import { diagnoseEvaluationStages, type StageDiagnoses } from './stage.ts';
import { diagnoseRuleCauses } from './diagnostics/rule-causes.ts';
import { diagnosePatchSites, labelPatchSites } from './diagnostics/patch-sites.ts';
import { deriveDiagnosticRecords, type DiagnosticRecord } from './diagnostics/diagnostic-records.ts';

export interface Compilation {
	readonly grammar: string;
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
	readonly grammar: string;
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
	readonly allowDiagnostics?: ReadonlySet<string>;
}

export async function compileGrammar(cfg: CompileGrammarConfig): Promise<Compilation> {
	const overridesPath = resolveOverridesPath(cfg.grammar);
	const grammarJsPath = resolveGrammarJsPath(cfg.grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const evaluated = await evaluate(entryPath);
	const diagnosis = diagnoseGrammar({
		grammar: cfg.grammar,
		evaluated,
		include: cfg.include,
		generatedIdTables: cfg.generatedIdTables,
		allowDiagnostics: cfg.allowDiagnostics
	});
	if (!diagnosis.passed) throw new GrammarDiagnosticError(diagnosis.blocked, diagnosis.grammarDiagnostics);
	const { stages, grammarDiagnostics, diagnosticRecords, generatedIdTables } = diagnosis;
	const { raw, linked, normalized, nodeMap, compilerDiagnostics, slotGroupingDiagnostics } = diagnosis.collected;

	hydrateSlotRefs(nodeMap, {
		inline: new Set(raw.inline),
		reportedAbsentNames: nodeMap.droppedKinds,
		grammar: cfg.grammar
	});

	return {
		grammar: cfg.grammar,
		generatedIdTables,
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
	readonly generatedIdTables?: GeneratedIdTables;
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
	const generatedIdTables = stampVisibleExternals(cfg.generatedIdTables, evaluated);
	const stages = evaluated.stages === undefined ? undefined : diagnoseEvaluationStages(evaluated.stages);
	const evaluatedRecords = evaluateRecords(evaluated);
	const evaluateDiagnostics = [
		...evaluatedRecords,
		...diagnoseRuleCauses({ grammar, raw: evaluated, enriched: stages?.enriched })
	];
	const evaluateBlocked = blockedRecords(evaluateDiagnostics, evaluated.expectDiagnostics, allowDiagnostics);
	if (evaluateBlocked.length > 0) return { passed: false, generatedIdTables, stages, grammarDiagnostics: evaluateDiagnostics, blocked: evaluateBlocked };

	const collected = collectGrammarDiagnosticsForGrammar({
		rawGrammar: evaluated,
		include: cfg.include,
		generatedIdTables
	});
	const diagnosticRecords =
		stages === undefined
			? []
			: deriveDiagnosticRecords({
					stages,
					final: { diagnostics: [...evaluatedRecords, ...collected.diagnostics], ruleCatalog: collected.raw.ruleCatalog },
					authoredRules: [...Object.keys(evaluated.ruleCauses ?? {}), ...(evaluated.undeclaredRules ?? [])],
					patchSites: evaluated.patchSites ?? []
				});
	const patchSiteDiagnostics =
		stages === undefined ? [] : diagnosePatchSites({ grammar, sites: labelPatchSites(evaluated.patchSites ?? [], diagnosticRecords) });
	const grammarDiagnostics = [...evaluateDiagnostics, ...patchSiteDiagnostics, ...collected.diagnostics];
	const blocked = blockedRecords(grammarDiagnostics, collected.raw.expectDiagnostics, allowDiagnostics);
	if (blocked.length > 0) return { passed: false, generatedIdTables, stages, grammarDiagnostics, blocked };
	return { passed: true, generatedIdTables, stages, grammarDiagnostics, blocked, collected, diagnosticRecords };
}

export function assertCompilation(compilation: Compilation): void {
	if (compilation.diagnostics.hasBlocking()) {
		throw new EmitHaltedError(compilation.diagnostics.all().filter((d) => d.severity === 'fail'));
	}
}
