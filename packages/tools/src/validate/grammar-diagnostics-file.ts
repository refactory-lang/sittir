import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { grammarPackage, sittirDirOf, type GrammarName } from '@sittir/codegen/grammars';
import type { DiagnosticEntryBase, GrammarDiagnosticEntry, GrammarDiagnosticsInput } from './validation-report.ts';

export function readGrammarDiagnostics(grammar: GrammarName): GrammarDiagnosticsInput {
	const path = join(sittirDirOf(grammarPackage(grammar)), 'grammar-diagnostics.json');
	if (!existsSync(path)) return { entries: [] };
	const text = readFileSync(path, 'utf8');
	try {
		const raw = JSON.parse(text) as ReadonlyArray<GrammarDiagnosticEntry & { ownerKind?: string; slotName?: string }>;
		return {
			text,
			entries: raw.map((d) => {
				const location = d.ownerKind ? (d.slotName ? `${d.ownerKind}.${d.slotName}` : d.ownerKind) : d.location;
				return { ...d, location };
			})
		};
	} catch (e) {
		return {
			text,
			entries: [
				{
					code: 'grammar-diagnostics-read-error',
					severity: 'error',
					location: path,
					message: `Failed to read/parse grammar diagnostics file at ${path}: ${(e as Error).message}`
				}
			]
		};
	}
}

const SEVERITY_ORDER: readonly DiagnosticEntryBase['severity'][] = ['fail', 'error', 'warning', 'info'];

export function severitySummary(entries: readonly DiagnosticEntryBase[]): string {
	const counts = Map.groupBy(entries, (entry) => entry.severity);
	const phrases = SEVERITY_ORDER.flatMap((severity) => {
		const n = counts.get(severity)?.length ?? 0;
		return n === 0 ? [] : [`${n} ${severity}`];
	});
	return phrases.length === 0 ? 'none' : phrases.join(', ');
}
