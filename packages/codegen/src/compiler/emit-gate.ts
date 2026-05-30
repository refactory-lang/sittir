/**
 * compiler/emit-gate.ts — the Assemble→Project boundary check.
 *
 * Spec §4b / §7.5 (compiler-simplification-design.md).
 *
 * PR-G: This gate is INERT until PR-L. Nothing currently emits 'fail',
 * so assertEmittable always returns void today. The nodeMap parameter is
 * accepted for forward-compat — PR-L's 'unslotted-child' check reads it —
 * but is intentionally unused here (prefixed with _).
 *
 * Design note: the gate keys on severity === 'fail', NOT on canProceed.
 * This is deliberate: diagnose-derive-shapes.ts already emits canProceed:false
 * diagnostics — keying on canProceed would halt emission the moment PR-H
 * routes real diagnostics into the sink. The (currently unused) 'fail'
 * severity is what makes the gate inert until PR-L.
 */

import type { NodeMap } from './types.ts';
import { DiagnosticSink, EmitHaltedError } from './diagnostics.ts';

/**
 * The single Assemble→Project boundary check (spec §4b/§7.5).
 *
 * Throws EmitHaltedError if the sink contains any 'fail'-severity
 * diagnostics. Inert until PR-L: no producer currently emits 'fail'.
 */
export function assertEmittable(_nodeMap: NodeMap, diagnostics: DiagnosticSink): void {
	if (diagnostics.hasBlocking()) {
		throw new EmitHaltedError(diagnostics.all().filter((d) => d.severity === 'fail'));
	}
}
