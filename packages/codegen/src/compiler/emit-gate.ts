import type { NodeMap } from './types.ts';
import { DiagnosticSink, EmitHaltedError } from '../types/diagnostics.ts';

export function assertEmittable(_nodeMap: NodeMap, diagnostics: DiagnosticSink): void {
	if (diagnostics.hasBlocking()) {
		throw new EmitHaltedError(diagnostics.all().filter((d) => d.severity === 'fail'));
	}
}
