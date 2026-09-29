import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

export type TypecheckCeiling = Readonly<Record<string, number | { readonly max: number; readonly issue: string }>>;

export function typeCheckErrorLines(pnpmArgs: readonly string[], cwd: string): string[] {
	let out = '';
	try {
		out = execFileSync('pnpm', [...pnpmArgs, '--pretty', 'false'], { cwd, encoding: 'utf8' });
	} catch (e) {
		const failure = e as { status?: number | null; stdout?: string };
		out = String(failure.stdout ?? '');
		if (failure.status !== 1 || !out.includes('error TS')) throw e;
	}
	return out.split('\n').filter((line) => line.includes('error TS'));
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
