import { existsSync } from 'node:fs';

import { evaluate } from './evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts';
import { hydrateSlotRefs, type AssembledNodeMap } from './assemble.ts';
import {
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError
} from './diagnostics/grammar-diagnostics.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import { DiagnosticSink, EmitHaltedError, type GrammarDiagnostic } from '../types/diagnostics.ts';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar, IncludeFilter } from './types.ts';
import type { GeneratedIdTables } from './generated-metadata.ts';

export interface Compilation {
	readonly grammar: string;
	readonly raw: RawGrammar;
	readonly linked: LinkedGrammar;
	readonly normalized: NormalizedGrammar;
	readonly nodeMap: AssembledNodeMap;
	readonly diagnostics: DiagnosticSink;
	readonly slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
	readonly grammarDiagnostics: readonly GrammarDiagnostic[];
}

export interface CompileGrammarConfig {
	readonly grammar: string;
	readonly include?: IncludeFilter;
	readonly generatedIdTables?: GeneratedIdTables;
}

export async function compileGrammar(cfg: CompileGrammarConfig): Promise<Compilation> {
	const overridesPath = resolveOverridesPath(cfg.grammar);
	const grammarJsPath = resolveGrammarJsPath(cfg.grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);

	const { linked, normalized, nodeMap, compilerDiagnostics, slotGroupingDiagnostics, diagnostics } =
		collectGrammarDiagnosticsForGrammar({
			rawGrammar: raw,
			include: cfg.include,
			generatedIdTables: cfg.generatedIdTables
		});

	hydrateSlotRefs(nodeMap, {
		inline: new Set(raw.inline),
		diagnostics: compilerDiagnostics,
		grammar: cfg.grammar
	});

	return {
		grammar: cfg.grammar,
		raw,
		linked,
		normalized,
		nodeMap,
		diagnostics: compilerDiagnostics,
		slotGroupingDiagnostics,
		grammarDiagnostics: diagnostics
	};
}

export function assertCompilation(compilation: Compilation, opts?: { allowDiagnostics?: ReadonlySet<string> }): void {
	if (compilation.diagnostics.hasBlocking()) {
		throw new EmitHaltedError(compilation.diagnostics.all().filter((d) => d.severity === 'fail'));
	}
	const allow = opts?.allowDiagnostics ?? new Set<string>();
	const blocked = compilation.grammarDiagnostics.filter((d) => !allow.has(d.code) && d.canProceed === false);
	if (blocked.length > 0) {
		throw new GrammarDiagnosticError(blocked);
	}
}
