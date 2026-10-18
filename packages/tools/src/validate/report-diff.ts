import { readValidationReport, type ValidationReport, type ValidationReportEntry } from './validation-report.ts';

/** One grammar's row counts on each side (validator rows and recorded grammar diagnostics), and how many validator rows only one side has. */
export interface GrammarRowDelta {
	readonly grammar: string;
	readonly base: number;
	readonly head: number;
	readonly added: number;
	readonly removed: number;
}

/** A (grammar, code) pair whose row count, validator rows and recorded grammar diagnostics together, differs between the sides. */
export interface CodeCountDelta {
	readonly grammar: string;
	readonly code: string;
	readonly base: number;
	readonly head: number;
}

/** A grammar whose diagnostics file differs between the sides, by the digests each side recorded. */
export interface DigestChange {
	readonly grammar: string;
	readonly base: string;
	readonly head: string;
}

export interface ReportDiff {
	/** Every grammar either side has, sorted. */
	readonly grammars: readonly GrammarRowDelta[];
	/** Only the (grammar, code) pairs whose count moved, sorted. */
	readonly codes: readonly CodeCountDelta[];
	/** Rows the head has more copies of than the base, in head order. */
	readonly added: readonly ValidationReportEntry[];
	/** Rows the base has more copies of than the head, in base order. */
	readonly removed: readonly ValidationReportEntry[];
	/** Grammars whose diagnostics file moved, where both sides record a digest; read that file's history for the rows. */
	readonly digests: readonly DigestChange[];
}

/** A report one side of a comparison can stand on: readable, and recording at least one row or grammar, so an empty side never reads as nothing moved. */
export function readComparableReport(path: string): ValidationReport {
	const report = readValidationReport(path);
	if (report.rows.length === 0 && Object.keys(report.grammars).length === 0) throw new Error(`validation report has nothing recorded: ${path}`);
	return report;
}

/** A JSON value with every object's keys sorted, at every depth; array order is kept, and an array never reads as an object. */
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return { array: value.map(canonical) };
	if (value === null || typeof value !== 'object') return value;
	const record = value as Record<string, unknown>;
	return {
		object: Object.keys(record)
			.sort()
			.map((k) => [k, canonical(record[k])])
	};
}

/** A row's identity: every field, independent of key order at any depth. */
function rowKey(entry: ValidationReportEntry): string {
	return JSON.stringify(canonical(entry));
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
	const counts = new Map<string, number>();
	for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
	return counts;
}

/** The rows of `side` beyond the copies `other` has of each. */
function surplus(
	side: readonly ValidationReportEntry[],
	other: readonly ValidationReportEntry[]
): ValidationReportEntry[] {
	const remaining = countBy(other, rowKey);
	return side.filter((entry) => {
		const key = rowKey(entry);
		const left = remaining.get(key) ?? 0;
		if (left === 0) return true;
		remaining.set(key, left - 1);
		return false;
	});
}

/** Per (grammar, code), the row count: validator rows plus every recorded grammar diagnostic, whatever its severity. */
function codeCounts(report: ValidationReport): Map<string, number> {
	const counts = countBy(report.rows, (e) => JSON.stringify([e.grammar, e.code]));
	for (const [grammar, record] of Object.entries(report.grammars))
		for (const [code, bySeverity] of Object.entries(record.counts)) {
			const key = JSON.stringify([grammar, code]);
			counts.set(key, (counts.get(key) ?? 0) + Object.values(bySeverity).reduce((sum, n) => sum + n, 0));
		}
	return counts;
}

/** Per grammar, its total of `codeCounts`. */
function grammarTotals(counts: ReadonlyMap<string, number>): Map<string, number> {
	const totals = new Map<string, number>();
	for (const [key, n] of counts) {
		const [grammar] = JSON.parse(key) as [string, string];
		totals.set(grammar, (totals.get(grammar) ?? 0) + n);
	}
	return totals;
}

/** Compare two validation reports: validator rows as multisets, row counts per grammar and code, and each grammar's diagnostics digest. */
export function diffValidationReports(base: ValidationReport, head: ValidationReport): ReportDiff {
	const added = surplus(head.rows, base.rows);
	const removed = surplus(base.rows, head.rows);
	const byGrammar = (e: ValidationReportEntry) => e.grammar;
	const baseCodes = codeCounts(base);
	const headCodes = codeCounts(head);
	const baseRows = grammarTotals(baseCodes);
	const headRows = grammarTotals(headCodes);
	const addedRows = countBy(added, byGrammar);
	const removedRows = countBy(removed, byGrammar);
	const grammars = [...new Set([...baseRows.keys(), ...headRows.keys()])].sort().map((grammar) => ({
		grammar,
		base: baseRows.get(grammar) ?? 0,
		head: headRows.get(grammar) ?? 0,
		added: addedRows.get(grammar) ?? 0,
		removed: removedRows.get(grammar) ?? 0
	}));
	const codes = [...new Set([...baseCodes.keys(), ...headCodes.keys()])]
		.sort()
		.map((key) => {
			const [grammar, code] = JSON.parse(key) as [string, string];
			return { grammar, code, base: baseCodes.get(key) ?? 0, head: headCodes.get(key) ?? 0 };
		})
		.filter((d) => d.base !== d.head);
	const digests = Object.keys(head.grammars)
		.sort()
		.flatMap((grammar) => {
			const before = base.grammars[grammar]?.digest;
			const after = head.grammars[grammar]?.digest;
			return before !== undefined && after !== undefined && before !== after ? [{ grammar, base: before, head: after }] : [];
		});
	return { grammars, codes, added, removed, digests };
}

/** Whether anything moved: a row, a count or a grammar's diagnostics file. */
export function reportMoved(diff: ReportDiff): boolean {
	return diff.added.length + diff.removed.length + diff.codes.length + diff.digests.length > 0;
}

/** The diff as lines: every grammar, every moved code count, every grammar whose diagnostics file moved, then every added (`+`) and removed (`-`) row in full. */
export function formatReportDiff(diff: ReportDiff): string[] {
	const lines = diff.grammars.map((g) => `${g.grammar}: rows ${g.base} -> ${g.head} (+${g.added} -${g.removed})`);
	for (const c of diff.codes) lines.push(`  ${c.grammar} ${c.code}: ${c.base} -> ${c.head}`);
	for (const d of diff.digests) lines.push(`  ${d.grammar}: grammar diagnostics changed (digest ${d.base.slice(0, 12)} -> ${d.head.slice(0, 12)})`);
	for (const e of diff.added) lines.push(`+ ${JSON.stringify(e)}`);
	for (const e of diff.removed) lines.push(`- ${JSON.stringify(e)}`);
	return lines;
}
