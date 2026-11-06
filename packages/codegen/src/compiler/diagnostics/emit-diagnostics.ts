import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';

export interface EmitShapeFailure {
	readonly code: string;
	readonly message: string;
	readonly ownerKind?: string;
	readonly slotName?: string;
	readonly proposal?: string;
	readonly details?: Record<string, unknown>;
}

interface EmitScope {
	readonly grammar: string;
	readonly collected: GrammarDiagnostic[];
}

const scopes: EmitScope[] = [];

function diagnosticOf(failure: EmitShapeFailure): GrammarDiagnostic {
	return { scope: 'grammar', severity: 'error', canProceed: false, grammar: scopes.at(-1)?.grammar ?? '', ...failure };
}

export function emitShapeFailure(failure: EmitShapeFailure): EmitHaltedError {
	return new EmitHaltedError([diagnosticOf(failure)]);
}

export function guardOwner<T>(fallback: T, run: () => T): T {
	const scope = scopes.at(-1);
	if (scope === undefined) return run();
	try {
		return run();
	} catch (error) {
		if (!(error instanceof EmitHaltedError)) throw error;
		scope.collected.push(...(error.blocking as readonly GrammarDiagnostic[]));
		return fallback;
	}
}

export function collectingEmitDiagnostics<T>(grammar: string, run: () => T): T {
	const scope: EmitScope = { grammar, collected: [] };
	scopes.push(scope);
	let result: T | undefined;
	try {
		result = run();
	} catch (error) {
		if (!(error instanceof EmitHaltedError)) throw error;
		scope.collected.push(...(error.blocking as readonly GrammarDiagnostic[]));
	} finally {
		scopes.pop();
	}
	if (scope.collected.length > 0) throw new EmitHaltedError(distinct(scope.collected));
	return result as T;
}

function distinct(diagnostics: readonly GrammarDiagnostic[]): GrammarDiagnostic[] {
	const seen = new Set<string>();
	return diagnostics.filter((diagnostic) => {
		const key = `${diagnostic.code}\0${diagnostic.ownerKind ?? ''}\0${diagnostic.slotName ?? ''}\0${diagnostic.message}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
