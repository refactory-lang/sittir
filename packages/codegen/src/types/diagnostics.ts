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

// PR-G: 'fail' is reserved for the Assemble→Project gate (emit-gate.ts).
// It is currently unused — nothing emits it until PR-L. The existing
// 'error'/'warning' vocabulary and canProceed blocking signal are untouched.
export type Severity = 'error' | 'warning' | 'info' | 'fail';

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

// ---------------------------------------------------------------------------
// PR-G additions: DiagnosticSink + EmitHaltedError
// ---------------------------------------------------------------------------

/**
 * Accumulator for pipeline diagnostics. Passed through the compile chain;
 * the Assemble→Project gate (emit-gate.ts::assertEmittable) consults it.
 *
 * Sugar methods (fail/warn/info) map to the underlying severity values so
 * PR-H/PR-L callers can use the spec vocabulary while the Severity union
 * stays single-sourced here.
 *
 * hasBlocking() keys on severity === 'fail' — NOT on canProceed — so the
 * gate remains inert until PR-L (when real diagnostics start emitting 'fail').
 */
export class DiagnosticSink {
	private readonly _items: Diagnostic[] = [];

	emit(d: Diagnostic): void {
		this._items.push(d);
	}

	/** Emit a blocking (fail) diagnostic. `canProceed` is forced to `false` —
	 *  a `'fail'` is blocking by definition, so the caller cannot supply it. */
	fail(d: Omit<Diagnostic, 'severity' | 'canProceed'>): void {
		this.emit({ ...d, severity: 'fail', canProceed: false });
	}

	warn(d: Omit<Diagnostic, 'severity'>): void {
		this.emit({ ...d, severity: 'warning' });
	}

	info(d: Omit<Diagnostic, 'severity'>): void {
		this.emit({ ...d, severity: 'info' });
	}

	/** Returns a shallow copy — callers cannot mutate the sink's backing array. */
	all(): readonly Diagnostic[] {
		return [...this._items];
	}

	/** Returns true iff at least one item has severity === 'fail'. */
	hasBlocking(): boolean {
		return this._items.some((d) => d.severity === 'fail');
	}
}

/**
 * Thrown by assertEmittable() when the DiagnosticSink contains 'fail' items.
 * Mirrors GrammarDiagnosticError's message format (code: message per line).
 */
export class EmitHaltedError extends Error {
	readonly blocking: readonly Diagnostic[];

	constructor(blocking: readonly Diagnostic[]) {
		super(blocking.map((d) => `${d.code}: ${d.message}`).join('\n'));
		this.name = 'EmitHaltedError';
		this.blocking = blocking;
	}
}
