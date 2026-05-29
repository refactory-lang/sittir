// Unified diagnostics model for sittir codegen.
// See docs/superpowers/specs/2026-05-28-diagnostics-model-design.md
//
// One base `Diagnostic` + three scope-discriminated subtypes:
//   - GrammarDiagnostic<TRule>     — static, author-facing facts about the grammar
//   - CompilerDiagnostic<TSubject> — pipeline-phase issues (rule or node)
//   - RuntimeDiagnostic            — render/read/parse execution
// `scope` is the discriminant; `ruleId` is the stable back-pointer; `subject`
// is an optional typed escape hatch.
//
// NOTE: NodeData is a generated per-grammar type (emitted by emitters/types.ts),
// not statically importable into the compiler. TSubject defaults to `Rule | unknown`
// as the documented fallback per spec. Callers with concrete node data may specialize
// the generic (e.g. CompilerDiagnostic<MyNodeData>).

import type { RuleId, Rule } from './rule.ts';

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
	readonly code: string;
	readonly severity: Severity;
	readonly message: string;
	readonly canProceed: boolean;
	readonly proposal?: string;
	readonly details?: Record<string, unknown>;
}

/** Static, author-facing facts about the authored grammar; subject is a Rule. */
export interface GrammarDiagnostic<TRule = Rule> extends Diagnostic {
	readonly scope: 'grammar';
	readonly grammar: string;
	readonly ownerKind?: string;
	readonly slotName?: string;
	readonly ruleId?: RuleId;
	readonly subject?: TRule;
}

/** Emitted during the compile pipeline about a rule OR an assembled node. */
export interface CompilerDiagnostic<TSubject = Rule | unknown> extends Diagnostic {
	readonly scope: 'compiler';
	readonly phase: 'evaluate' | 'link' | 'normalize' | 'simplify' | 'assemble' | 'emit';
	readonly ruleId?: RuleId;
	readonly subject?: TSubject;
}

/** Render / read / parse execution. */
export interface RuntimeDiagnostic extends Diagnostic {
	readonly scope: 'runtime';
	readonly stage: 'render' | 'read' | 'parse';
	readonly nodeId?: string;
	readonly span?: { readonly start: number; readonly end: number };
}

export type AnyDiagnostic = GrammarDiagnostic | CompilerDiagnostic | RuntimeDiagnostic;
