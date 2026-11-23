import { readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';

import { parseTypeCheckDiagnostics } from '@sittir/codegen';

export interface TypeErrorsOptions {
	log: string;
	json?: boolean;
}

export interface PackageTypeErrors {
	package: string;
	errors: number;
	projects: number;
}

export interface TypeErrorSummary {
	records: number;
	errors: number;
	repeats: number;
	packages: PackageTypeErrors[];
}

const RECORD = /error TS\d+:/g;
const PROJECT_PREFIX = /^(\S+) type-check: (.*)$/;

interface ReportedError {
	project: string;
	file: string | undefined;
	line: number | undefined;
	column: number | undefined;
	code: string;
}

function ownerOf(file: string): string {
	return /(?:^|\/)packages\/([^/]+)\//.exec(file)?.[1] ?? '(root)';
}

function reportedErrors(output: string): ReportedError[] {
	const found: ReportedError[] = [];
	for (const line of output.split('\n')) {
		const prefixed = PROJECT_PREFIX.exec(line);
		const project = prefixed?.[1] ?? '';
		const text = prefixed?.[2] ?? line;
		for (const diagnostic of parseTypeCheckDiagnostics(text)) {
			found.push({ project, file: diagnostic.file, line: diagnostic.line, column: diagnostic.column, code: diagnostic.code });
		}
	}
	return found;
}

export function summarizeTypeErrors(output: string): TypeErrorSummary {
	const records = output.match(RECORD)?.length ?? 0;
	const reported = reportedErrors(output);
	if (reported.length !== records) {
		throw new Error(
			`the log has ${records} error TS records but ${reported.length} parse as diagnostics, so the log is not fully read`
		);
	}
	const groups = new Map<string, { owner: string; file: string; projects: Set<string>; reports: number }>();
	for (const error of reported) {
		const file =
			error.file === undefined
				? ''
				: posix.isAbsolute(error.file)
					? posix.normalize(error.file)
					: posix.normalize(posix.join(error.project, error.file));
		const key = [file, error.line ?? '', error.column ?? '', error.code].join('|');
		const group = groups.get(key) ?? { owner: ownerOf(file), file, projects: new Set<string>(), reports: 0 };
		groups.set(key, group);
		group.projects.add(error.project);
		group.reports += 1;
	}
	const byOwner = new Map<string, { errors: number; projects: Set<string> }>();
	for (const group of groups.values()) {
		const row = byOwner.get(group.owner) ?? { errors: 0, projects: new Set<string>() };
		byOwner.set(group.owner, row);
		row.errors += 1;
		for (const project of group.projects) row.projects.add(project);
	}
	const errors = [...byOwner.values()].reduce((sum, row) => sum + row.errors, 0);
	if (errors !== groups.size) {
		throw new Error(`per-package errors sum to ${errors} but there are ${groups.size} distinct errors`);
	}
	const repeats = [...groups.values()].reduce((sum, group) => sum + group.reports - 1, 0);
	if (errors + repeats !== records) {
		throw new Error(`${errors} distinct errors and ${repeats} repeats do not add up to ${records} error TS records`);
	}
	const packages = [...byOwner]
		.map(([name, row]) => ({ package: name, errors: row.errors, projects: row.projects.size }))
		.sort((a, b) => b.errors - a.errors || (a.package < b.package ? -1 : a.package > b.package ? 1 : 0));
	return { records, errors, repeats, packages };
}

function formatTypeErrors(summary: TypeErrorSummary): string {
	const lines = summary.packages.map(
		(row) => `${String(row.errors).padStart(6)}  ${row.package}  (reported by ${row.projects} projects)`
	);
	lines.push(`${String(summary.errors).padStart(6)}  distinct errors from ${summary.records} records (${summary.repeats} repeats)`);
	return lines.join('\n');
}

export async function run(opts: TypeErrorsOptions): Promise<number> {
	try {
		const summary = summarizeTypeErrors(readFileSync(resolve(opts.log), 'utf8'));
		console.log(opts.json ? JSON.stringify(summary, null, 2) : formatTypeErrors(summary));
		return 0;
	} catch (error) {
		console.error(`type-errors: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
