import { readValidationReport, type ValidationReportEntry } from './validation-report.ts';

/** One grammar's row counts on each side, and how many rows only one side has. */
export interface GrammarRowDelta {
	readonly grammar: string;
	readonly base: number;
	readonly head: number;
	readonly added: number;
	readonly removed: number;
}

/** A (grammar, code) pair whose row count differs between the sides. */
export interface CodeCountDelta {
	readonly grammar: string;
	readonly code: string;
	readonly base: number;
	readonly head: number;
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
}

/** A report one side of a comparison can stand on: readable, and with at least one row, so an empty side never reads as nothing moved. */
export function readComparableReport(path: string): ValidationReportEntry[] {
	const entries = readValidationReport(path);
	if (entries.length === 0) throw new Error(`validation report has no rows: ${path}`);
	return entries;
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

/** Compare two validation reports row by row, as multisets of rows. */
export function diffValidationReports(
	base: readonly ValidationReportEntry[],
	head: readonly ValidationReportEntry[]
): ReportDiff {
	const added = surplus(head, base);
	const removed = surplus(base, head);
	const byGrammar = (e: ValidationReportEntry) => e.grammar;
	const baseRows = countBy(base, byGrammar);
	const headRows = countBy(head, byGrammar);
	const addedRows = countBy(added, byGrammar);
	const removedRows = countBy(removed, byGrammar);
	const grammars = [...new Set([...baseRows.keys(), ...headRows.keys()])].sort().map((grammar) => ({
		grammar,
		base: baseRows.get(grammar) ?? 0,
		head: headRows.get(grammar) ?? 0,
		added: addedRows.get(grammar) ?? 0,
		removed: removedRows.get(grammar) ?? 0
	}));
	const byCode = (e: ValidationReportEntry) => JSON.stringify([e.grammar, e.code]);
	const baseCodes = countBy(base, byCode);
	const headCodes = countBy(head, byCode);
	const codes = [...new Set([...baseCodes.keys(), ...headCodes.keys()])]
		.sort()
		.map((key) => {
			const [grammar, code] = JSON.parse(key) as [string, string];
			return { grammar, code, base: baseCodes.get(key) ?? 0, head: headCodes.get(key) ?? 0 };
		})
		.filter((d) => d.base !== d.head);
	return { grammars, codes, added, removed };
}

/** The diff as lines: every grammar, every moved code count, then every added (`+`) and removed (`-`) row in full. */
export function formatReportDiff(diff: ReportDiff): string[] {
	const lines = diff.grammars.map((g) => `${g.grammar}: rows ${g.base} -> ${g.head} (+${g.added} -${g.removed})`);
	for (const c of diff.codes) lines.push(`  ${c.grammar} ${c.code}: ${c.base} -> ${c.head}`);
	for (const e of diff.added) lines.push(`+ ${JSON.stringify(e)}`);
	for (const e of diff.removed) lines.push(`- ${JSON.stringify(e)}`);
	return lines;
}
