import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseTypeCheckDiagnostics, type TypeCheckDiagnostic } from '@sittir/codegen';

export interface TypeErrorsOptions {
	log: string;
	json?: boolean;
}

export interface PackageTypeErrors {
	package: string;
	errors: number;
}

export interface TypeErrorSummary {
	errors: number;
	packages: PackageTypeErrors[];
}

const RECORD = /error TS\d+:/g;

function packageOf(diagnostic: TypeCheckDiagnostic): string {
	return /(?:^|\/)packages\/([^/]+)\//.exec(diagnostic.file ?? '')?.[1] ?? '(root)';
}

export function summarizeTypeErrors(output: string): TypeErrorSummary {
	const recorded = output.match(RECORD)?.length ?? 0;
	const diagnostics = parseTypeCheckDiagnostics(output);
	if (diagnostics.length !== recorded) {
		throw new Error(
			`the log has ${recorded} error TS records but ${diagnostics.length} parse as diagnostics, so the log is not fully read`
		);
	}
	const counts = new Map<string, number>();
	for (const diagnostic of diagnostics) {
		const pkg = packageOf(diagnostic);
		counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
	}
	const packages = [...counts]
		.map(([name, errors]) => ({ package: name, errors }))
		.sort((a, b) => b.errors - a.errors || (a.package < b.package ? -1 : a.package > b.package ? 1 : 0));
	const total = packages.reduce((sum, row) => sum + row.errors, 0);
	if (total !== recorded) {
		throw new Error(`per-package errors sum to ${total} but the log holds ${recorded} error TS records`);
	}
	return { errors: total, packages };
}

function formatTypeErrors(summary: TypeErrorSummary): string {
	const lines = summary.packages.map((row) => `${String(row.errors).padStart(6)}  ${row.package}`);
	lines.push(`${String(summary.errors).padStart(6)}  total`);
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
