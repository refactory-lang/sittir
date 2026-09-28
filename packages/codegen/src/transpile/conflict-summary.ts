export interface ConflictInterpretation {
	readonly preceding_symbols: readonly string[];
	readonly variable_name: string;
	readonly production_step_symbols: readonly string[];
	readonly step_index: number;
	readonly done: boolean;
	readonly conflicting_lookahead: string;
	readonly precedence: unknown;
	readonly associativity: unknown;
}

export type ConflictOffer =
	| { readonly Precedence: { readonly symbols: readonly string[] } }
	| { readonly Associativity: { readonly symbols: readonly string[] } }
	| { readonly AddConflict: { readonly symbols: readonly string[] } };

export interface ConflictReport {
	readonly symbol_sequence: readonly string[];
	readonly conflicting_lookahead: string;
	readonly possible_interpretations: readonly ConflictInterpretation[];
	readonly possible_resolutions: readonly ConflictOffer[];
}

export type GenerateOutcome =
	| { readonly kind: 'clean' }
	| { readonly kind: 'conflict'; readonly report: ConflictReport }
	| { readonly kind: 'error'; readonly summary: unknown };

interface GenerateSummary {
	readonly BuildTables?: { readonly Conflict?: ConflictReport };
}

function lastSummary(stderr: string): unknown {
	const start = stderr.lastIndexOf('\n{\n');
	const from = start >= 0 ? start + 1 : stderr.startsWith('{\n') ? 0 : -1;
	if (from < 0) return undefined;
	try {
		return JSON.parse(stderr.slice(from));
	} catch {
		return undefined;
	}
}

export function parseGenerateOutcome(status: number | null, stderr: string): GenerateOutcome {
	if (status === 0) return { kind: 'clean' };
	const summary = lastSummary(stderr);
	if (summary === undefined) return { kind: 'error', summary: stderr };
	const conflict = (summary as GenerateSummary).BuildTables?.Conflict;
	return conflict ? { kind: 'conflict', report: conflict } : { kind: 'error', summary };
}

export function conflictKey(report: ConflictReport): string {
	return JSON.stringify([
		report.symbol_sequence,
		report.conflicting_lookahead,
		report.possible_interpretations.map((interpretation) => [
			interpretation.variable_name,
			interpretation.production_step_symbols,
			interpretation.step_index
		])
	]);
}
