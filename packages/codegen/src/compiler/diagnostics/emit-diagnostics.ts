import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';

export interface EmitShapeFailure {
	readonly code: string;
	readonly message: string;
	readonly ownerKind?: string;
	readonly slotName?: string;
	readonly proposal?: string;
	readonly details?: Record<string, unknown>;
}

function diagnosticOf(failure: EmitShapeFailure, grammar: string): GrammarDiagnostic {
	return { scope: 'grammar', severity: 'error', canProceed: false, grammar, ...failure };
}

export function emitShapeFailures(failures: readonly EmitShapeFailure[]): EmitHaltedError {
	return new EmitHaltedError(failures.map((failure) => diagnosticOf(failure, '')));
}

export function emitShapeFailure(failure: EmitShapeFailure): EmitHaltedError {
	return emitShapeFailures([failure]);
}

export class EmitCollector {
	readonly #collected: GrammarDiagnostic[] = [];
	readonly grammar: string;

	constructor(grammar: string) {
		this.grammar = grammar;
	}

	get failed(): boolean {
		return this.#collected.length > 0;
	}

	guard<T>(run: () => T): T | undefined {
		try {
			return run();
		} catch (error) {
			if (!(error instanceof EmitHaltedError)) throw error;
			this.record(error);
			return undefined;
		}
	}

	record(error: EmitHaltedError): void {
		for (const diagnostic of error.blocking as readonly GrammarDiagnostic[]) {
			this.#collected.push(diagnostic.grammar === '' ? { ...diagnostic, grammar: this.grammar } : diagnostic);
		}
	}

	cascade(error: Error): EmitHaltedError {
		const after = diagnosticOf(
			{
				code: 'emit-aborted-after-failure',
				message: `emission stopped on an internal error after ${this.#collected.length} diagnostic(s), likely a consequence of them: ${error.message}`,
				details: { cascade: true }
			},
			this.grammar
		);
		return new EmitHaltedError(distinct([...this.#collected, after]));
	}

	assertClear(): void {
		if (this.failed) throw new EmitHaltedError(distinct(this.#collected));
	}
}

export function collectingEmitDiagnostics<T>(grammar: string, run: (collector: EmitCollector) => T): T {
	const collector = new EmitCollector(grammar);
	let result: T;
	try {
		result = run(collector);
	} catch (error) {
		if (error instanceof EmitHaltedError) {
			collector.record(error);
			collector.assertClear();
		}
		if (collector.failed && error instanceof Error) throw collector.cascade(error);
		throw error;
	}
	collector.assertClear();
	return result;
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
