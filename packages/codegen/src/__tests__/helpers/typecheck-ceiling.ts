import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { parseTypeCheckDiagnostics, typeCheckOutput } from '../../typecheck.ts';

export type TypecheckCeiling = Readonly<Record<string, number | { readonly max: number; readonly issue: string }>>;

export function typeCheckErrorLines(pnpmArgs: readonly string[], cwd: string): string[] {
	return parseTypeCheckDiagnostics(typeCheckOutput('pnpm', pnpmArgs, cwd)).map((d) => d.head);
}

export function expectWithinTypecheckCeiling(errorLines: readonly string[], ceilingPath: string): void {
	const ceiling: TypecheckCeiling = JSON.parse(readFileSync(ceilingPath, 'utf8'));
	for (const line of errorLines) {
		expect(
			Object.keys(ceiling).some((file) => line.includes(file)),
			line
		).toBe(true);
	}
	for (const [file, entry] of Object.entries(ceiling)) {
		const max = typeof entry === 'number' ? entry : entry.max;
		const label = typeof entry === 'number' ? file : `${file} (${entry.issue})`;
		expect(errorLines.filter((line) => line.includes(file)).length, label).toBeLessThanOrEqual(max);
	}
}
