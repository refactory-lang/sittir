import type { RuleId, Rule } from './rule.ts';

export type Severity = 'error' | 'warning' | 'info' | 'fail';

export interface Diagnostic {
	readonly code: string;
	readonly severity: Severity;
	readonly message: string;
	readonly canProceed: boolean;
	readonly proposal?: string;
	readonly details?: Record<string, unknown>;
}

export interface GrammarDiagnostic<TRule = Rule> extends Diagnostic {
	readonly scope: 'grammar';
	readonly grammar: string;
	readonly ownerKind?: string;
	readonly slotName?: string;
	readonly ruleId?: RuleId;
	readonly subject?: TRule;
}

export interface CompilerDiagnostic<TSubject = Rule | unknown> extends Diagnostic {
	readonly scope: 'compiler';
	readonly phase: 'evaluate' | 'link' | 'normalize' | 'simplify' | 'assemble' | 'emit';
	readonly ruleId?: RuleId;
	readonly subject?: TSubject;
}

export interface RuntimeDiagnostic extends Diagnostic {
	readonly scope: 'runtime';
	readonly stage: 'render' | 'read' | 'parse';
	readonly nodeId?: string;
	readonly span?: { readonly start: number; readonly end: number };
}

export type AnyDiagnostic = Diagnostic | GrammarDiagnostic | CompilerDiagnostic | RuntimeDiagnostic;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export class DiagnosticSink {
	private readonly _items: Diagnostic[] = [];

	emit(d: Diagnostic): void {
		this._items.push(d);
	}

	fail(d: DistributiveOmit<AnyDiagnostic, 'severity' | 'canProceed'>): void {
		this.emit({ ...d, severity: 'fail', canProceed: false });
	}

	warn(d: DistributiveOmit<AnyDiagnostic, 'severity'>): void {
		this.emit({ ...d, severity: 'warning' });
	}

	info(d: DistributiveOmit<AnyDiagnostic, 'severity'>): void {
		this.emit({ ...d, severity: 'info' });
	}

	all(): readonly Diagnostic[] {
		return [...this._items];
	}

	hasBlocking(): boolean {
		return this._items.some((d) => d.severity === 'fail');
	}
}

export class EmitHaltedError extends Error {
	readonly blocking: readonly Diagnostic[];

	constructor(blocking: readonly Diagnostic[]) {
		super(blocking.map((d) => `${d.code}: ${d.message}`).join('\n'));
		this.name = 'EmitHaltedError';
		this.blocking = blocking;
	}
}
